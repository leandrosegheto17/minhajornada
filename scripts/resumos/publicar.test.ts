import { describe, expect, it } from 'vitest';
import type { Livro } from '../../src/biblia/tipos.ts';
import type { ArquivoExportado, EstadoResumo, Resumo } from '../../src/resumos/formato.ts';
import { criarCliente } from '../../servidor/db/cliente.ts';
import type { ClienteRequisicao } from '../../servidor/db/cliente.ts';
import { bancoDeTeste, comCliente } from '../../servidor/test/apoio/banco.ts';
import { publicar } from './publicar.ts';
import type { OpcoesPublicar } from './publicar.ts';

// Só texto de exemplo (FUN-152): nenhum resumo real entra no repositório.
const versiculos = (n: number) => Array.from({ length: n }, (_, i) => `versículo ${i + 1}`);
const BIBLIA: Livro[] = [
  { numero: 1, nome: 'Gênesis', capitulos: [versiculos(4), versiculos(3), versiculos(5)] },
  { numero: 2, nome: 'Êxodo', capitulos: [versiculos(4), versiculos(3)] },
  { numero: 3, nome: 'Levítico', capitulos: [versiculos(4), versiculos(3)] },
  { numero: 4, nome: 'Números', capitulos: [versiculos(4), versiculos(3)] },
  { numero: 5, nome: 'Deuteronômio', capitulos: [versiculos(4), versiculos(3)] },
];

const palavras = (n: number) => Array.from({ length: n }, (_, i) => `palavra${i}`).join(' ');

/** Resumo de exemplo com 300 palavras: 2 do título, 3 da frase, 5 da mensagem e o resto no contexto. */
function resumo(livro: number, sobre: Partial<Resumo> = {}, contexto = 'contexto de exemplo'): Resumo {
  return {
    livro,
    contexto: `${contexto} ${palavras(290)}`,
    mensagem: 'uma mensagem central de exemplo',
    divisao: [{ titulo: 'Parte um', de: 1, ate: 2 }],
    versiculos: [{ capitulo: 1, versiculo: 2, ate: 3, frase: 'frase de exemplo' }],
    ...sobre,
  };
}

const arquivoCom = (itens: [number, EstadoResumo, Partial<Resumo>?, string?][]): string => {
  const a: ArquivoExportado = {
    formato: 'mj-resumos-v1',
    itens: itens.map(([livro, estado, sobre, ctx]) => ({ livro, estado, resumo: resumo(livro, sobre, ctx) })),
  };
  return JSON.stringify(a);
};

interface Saida {
  codigo: number;
  fora: string[];
  erro: string[];
  conexoes: number;
  perguntas: string[];
}

/** Roda `publicar` com arquivo e entrada em memória e conta quantas conexões o script abriu. */
async function rodar(
  arquivo: string | null,
  sobre: Partial<OpcoesPublicar> & { respostas?: (string | null)[] } = {},
): Promise<Saida> {
  const s: Saida = { codigo: -1, fora: [], erro: [], conexoes: 0, perguntas: [] };
  const respostas = [...(sobre.respostas ?? [])];
  const { respostas: _ignorada, ...resto } = sobre;
  s.codigo = await publicar({
    ambiente: 'tst',
    arquivo: 'resumos-exportados/resumos.json',
    env: {},
    biblia: BIBLIA,
    lerArquivo: async () => {
      if (arquivo === null) throw new Error('ENOENT');
      return arquivo;
    },
    perguntar: async (p) => {
      s.perguntas.push(p);
      return respostas.shift() ?? null;
    },
    saida: (l) => s.fora.push(l),
    erro: (l) => s.erro.push(l),
    conectar: (url): ClienteRequisicao => {
      s.conexoes += 1;
      return criarCliente(url);
    },
    ...resto,
  });
  return s;
}

const resumosGravados = (url: string) =>
  comCliente(url, async (c) => (await c.query('SELECT livro, conteudo FROM resumos ORDER BY livro')).rows);

describe('FUN-173: publicar grava só os aprovados', () => {
  it('FUN-173: 4 aprovados e 1 recusado: grava 4, imprime "4 livros gravados" e o recusado não entra', async () => {
    await bancoDeTeste(
      async (url) => {
        const s = await rodar(
          arquivoCom([
            [1, 'aprovada'],
            [2, 'aprovada'],
            [3, 'recusada'],
            [4, 'aprovada'],
            [5, 'aprovada'],
          ]),
          { env: { DATABASE_URL_TST: url } },
        );
        expect(s.codigo).toBe(0);
        expect(s.fora).toContain('4 livros gravados');
        const linhas = await resumosGravados(url);
        expect(linhas.map((l) => l.livro)).toEqual([1, 2, 4, 5]);
        expect(linhas[0]?.conteudo).toEqual(resumo(1));
      },
      { migrado: true },
    );
  });

  it('FUN-173: proposta também não entra', async () => {
    await bancoDeTeste(
      async (url) => {
        const s = await rodar(
          arquivoCom([
            [1, 'aprovada'],
            [2, 'proposta'],
          ]),
          { env: { DATABASE_URL_TST: url } },
        );
        expect(s.fora).toContain('1 livros gravados');
        expect((await resumosGravados(url)).map((l) => l.livro)).toEqual([1]);
      },
      { migrado: true },
    );
  });

  it('FUN-173: publicar de novo com texto mudado substitui o livro (uma linha por livro)', async () => {
    await bancoDeTeste(
      async (url) => {
        const env = { DATABASE_URL_TST: url };
        await rodar(arquivoCom([[1, 'aprovada', {}, 'texto antigo']]), { env });
        await rodar(arquivoCom([[1, 'aprovada', {}, 'texto novo']]), { env });
        const linhas = await resumosGravados(url);
        expect(linhas).toHaveLength(1);
        expect((linhas[0]?.conteudo as Resumo).contexto.startsWith('texto novo')).toBe(true);
      },
      { migrado: true },
    );
  });
});

describe('A-12 FUN-172 FUN-173: livro recusado sai da publicação', () => {
  const livrosGravados = async (url: string) => (await resumosGravados(url)).map((l) => l.livro);

  it('FUN-172: livro publicado e depois recusado é removido do banco, e o resto do arquivo é gravado', async () => {
    await bancoDeTeste(
      async (url) => {
        const env = { DATABASE_URL_TST: url };
        await rodar(
          arquivoCom([
            [1, 'aprovada'],
            [3, 'aprovada'],
          ]),
          { env },
        );
        expect(await livrosGravados(url)).toEqual([1, 3]);
        const s = await rodar(
          arquivoCom([
            [1, 'aprovada'],
            [3, 'recusada'],
          ]),
          { env },
        );
        expect(s.codigo).toBe(0);
        expect(s.fora).toContain('1 livros gravados');
        expect(s.fora).toContain('1 livros removidos');
        expect(await livrosGravados(url)).toEqual([1]);
      },
      { migrado: true },
    );
  });

  it('FUN-172: recusado que nunca foi publicado não remove nada, e proposta já publicada continua', async () => {
    await bancoDeTeste(
      async (url) => {
        const env = { DATABASE_URL_TST: url };
        await rodar(arquivoCom([[2, 'aprovada']]), { env });
        const s = await rodar(
          arquivoCom([
            [1, 'aprovada'],
            [2, 'proposta'],
            [3, 'recusada'],
          ]),
          { env },
        );
        expect(s.codigo).toBe(0);
        expect(s.fora).toContain('0 livros removidos');
        expect(await livrosGravados(url)).toEqual([1, 2]);
      },
      { migrado: true },
    );
  });

  it('FUN-172: arquivo só com recusados (e propostas) remove o livro publicado, sem gravar nenhum', async () => {
    await bancoDeTeste(
      async (url) => {
        const env = { DATABASE_URL_TST: url };
        await rodar(
          arquivoCom([
            [3, 'aprovada'],
            [4, 'aprovada'],
          ]),
          { env },
        );
        const s = await rodar(
          arquivoCom([
            [3, 'recusada'],
            [4, 'proposta'],
          ]),
          { env },
        );
        expect(s.codigo).toBe(0);
        expect(s.fora).toContain('0 livros gravados');
        expect(s.fora).toContain('1 livros removidos');
        expect(await livrosGravados(url)).toEqual([4]);
      },
      { migrado: true },
    );
  });

  it('FUN-173: sem aprovados nem recusados (só propostas): "Nada a publicar", código 1 e sem conexão', async () => {
    const s = await rodar(arquivoCom([[4, 'proposta']]), { env: { DATABASE_URL_TST: 'postgresql://x@127.0.0.1:1/x' } });
    expect(s.codigo).toBe(1);
    expect(s.erro.join('\n')).toContain('Nada a publicar');
    expect(s.conexoes).toBe(0);
  });

  // A-22: com um schema de mesmo nome que o papel dono e uma tabela `resumos` nele, o SQL sem schema gravaria lá.
  it('A-22 FUN-173: com um schema sombra com o nome do dono, publicar grava em public.resumos', async () => {
    await bancoDeTeste(
      async (url) => {
        const sombra = await comCliente(url, async (c) => {
          const { rows } = await c.query('SELECT current_user AS usuario');
          const usuario = rows[0].usuario as string;
          await c.query(`CREATE SCHEMA "${usuario}"`);
          await c.query(`CREATE TABLE "${usuario}".resumos (LIKE public.resumos INCLUDING ALL)`);
          await c.query(
            "INSERT INTO public.resumos (livro, conteudo, publicado_em) VALUES (1, '{}'::jsonb, now()), (3, '{}'::jsonb, now())",
          );
          return usuario;
        });
        const s = await rodar(
          arquivoCom([
            [1, 'aprovada'],
            [3, 'recusada'],
          ]),
          { env: { DATABASE_URL_TST: url } },
        );
        expect(s.codigo).toBe(0);
        const publicos = await comCliente(url, (c) => c.query('SELECT livro FROM public.resumos ORDER BY livro'));
        expect(publicos.rows.map((l) => l.livro)).toEqual([1]);
        const fora = await comCliente(url, (c) => c.query(`SELECT livro FROM "${sombra}".resumos`));
        expect(fora.rows).toEqual([]);
      },
      { migrado: true },
    );
  });

  it('FUN-173: falha provocada depois da remoção desfaz a remoção (tudo ou nada)', async () => {
    await bancoDeTeste(
      async (url) => {
        const env = { DATABASE_URL_TST: url };
        await rodar(arquivoCom([[3, 'aprovada']]), { env });
        await comCliente(url, async (c) => {
          await c.query(`CREATE FUNCTION falha_no_4() RETURNS trigger LANGUAGE plpgsql AS $$
            BEGIN IF NEW.livro = 4 THEN RAISE EXCEPTION 'falha provocada no livro 4'; END IF; RETURN NEW; END; $$`);
          await c.query('CREATE TRIGGER t BEFORE INSERT ON resumos FOR EACH ROW EXECUTE FUNCTION falha_no_4()');
        });
        const s = await rodar(
          arquivoCom([
            [3, 'recusada'],
            [4, 'aprovada'],
          ]),
          { env },
        );
        expect(s.codigo).toBe(1);
        expect(s.erro.join('\n')).toContain('falha provocada no livro 4');
        expect(s.fora.join('\n')).not.toContain('removidos');
        expect(await livrosGravados(url)).toEqual([3]);
      },
      { migrado: true },
    );
  });

  it('FUN-175: em produção a pergunta diz quantos livros serão removidos, e sem confirmação nada é removido', async () => {
    await bancoDeTeste(
      async (url) => {
        await rodar(arquivoCom([[3, 'aprovada']]), { env: { DATABASE_URL_TST: url } });
        const s = await rodar(
          arquivoCom([
            [1, 'aprovada'],
            [3, 'recusada'],
          ]),
          { ambiente: 'producao', env: { DATABASE_URL_PRODUCAO: url }, respostas: ['sim'] },
        );
        expect(s.perguntas[0]).toContain('remover 1');
        expect(s.codigo).toBe(1);
        expect(await livrosGravados(url)).toEqual([3]);
      },
      { migrado: true },
    );
  });
});

describe('FUN-174: validação antes de conectar', () => {
  it('FUN-174: um aprovado com "Gênesis 51:1" lista o problema, sai com 1, não conecta e o banco fica igual', async () => {
    await bancoDeTeste(
      async (url) => {
        await rodar(arquivoCom([[2, 'aprovada']]), { env: { DATABASE_URL_TST: url } });
        const antes = await resumosGravados(url);
        const s = await rodar(
          arquivoCom([
            [1, 'aprovada', { versiculos: [{ capitulo: 51, versiculo: 1, frase: 'frase de exemplo' }] }],
            [3, 'aprovada'],
          ]),
          { env: { DATABASE_URL_TST: url } },
        );
        expect(s.codigo).toBe(1);
        expect(s.erro.some((l) => l.startsWith('Gênesis: ') && l.includes('Gênesis 51:1'))).toBe(true);
        expect(s.fora.join('\n')).not.toContain('gravados');
        expect(s.conexoes).toBe(0);
        expect(await resumosGravados(url)).toEqual(antes);
      },
      { migrado: true },
    );
  });

  it('FUN-174: um recusado inválido não impede a publicação: o recusado não é validado e o livro sai do ar', async () => {
    await bancoDeTeste(
      async (url) => {
        const env = { DATABASE_URL_TST: url };
        await rodar(arquivoCom([[1, 'aprovada']]), { env });
        // A-14: arquivo só com um recusado (inválido) conecta, remove o livro e sai com 0.
        const s = await rodar(
          arquivoCom([[1, 'recusada', { versiculos: [{ capitulo: 51, versiculo: 1, frase: 'frase de exemplo' }] }]]),
          { env },
        );
        expect(s.codigo).toBe(0);
        expect(s.conexoes).toBe(1);
        expect(s.fora).toContain('1 livros removidos');
        expect(await resumosGravados(url)).toEqual([]);
      },
      { migrado: true },
    );
  });

  it('FUN-174: arquivo ilegível ou com forma errada sai com 1, sem conectar e sem repetir o texto', async () => {
    const ilegivel = await rodar(null, { env: { DATABASE_URL_TST: 'postgresql://x:y@127.0.0.1:1/nada' } });
    expect(ilegivel.codigo).toBe(1);
    expect(ilegivel.conexoes).toBe(0);
    const torto = await rodar('{"formato":"outro","itens":[]}', {
      env: { DATABASE_URL_TST: 'postgresql://x:y@127.0.0.1:1/nada' },
    });
    expect(torto.codigo).toBe(1);
    expect(torto.conexoes).toBe(0);
    expect(torto.erro.join('\n')).toContain('formato');
  });
});

describe('FUN-173: tudo ou nada', () => {
  it('FUN-173: falha provocada no 3º livro (RAISE EXCEPTION) não deixa nenhum livro gravado', async () => {
    await bancoDeTeste(
      async (url) => {
        await comCliente(url, async (c) => {
          await c.query(`CREATE FUNCTION falha_no_3() RETURNS trigger LANGUAGE plpgsql AS $$
            BEGIN IF NEW.livro = 3 THEN RAISE EXCEPTION 'falha provocada no livro 3'; END IF; RETURN NEW; END; $$`);
          await c.query('CREATE TRIGGER t BEFORE INSERT ON resumos FOR EACH ROW EXECUTE FUNCTION falha_no_3()');
        });
        const s = await rodar(
          arquivoCom([
            [1, 'aprovada'],
            [2, 'aprovada'],
            [3, 'aprovada'],
            [4, 'aprovada'],
          ]),
          { env: { DATABASE_URL_TST: url } },
        );
        expect(s.codigo).toBe(1);
        expect(s.erro.join('\n')).toContain('falha provocada no livro 3');
        expect(s.erro.join('\n')).toContain('Nenhum livro foi gravado');
        expect(s.fora.join('\n')).not.toContain('gravados');
        expect(await resumosGravados(url)).toEqual([]);
      },
      { migrado: true },
    );
  });

  it('FUN-173: a falha também não apaga o que já estava publicado', async () => {
    await bancoDeTeste(
      async (url) => {
        const env = { DATABASE_URL_TST: url };
        await rodar(arquivoCom([[1, 'aprovada', {}, 'texto antigo']]), { env });
        await comCliente(url, async (c) => {
          await c.query(`CREATE FUNCTION falha_no_2() RETURNS trigger LANGUAGE plpgsql AS $$
            BEGIN IF NEW.livro = 2 THEN RAISE EXCEPTION 'falha provocada'; END IF; RETURN NEW; END; $$`);
          await c.query('CREATE TRIGGER t BEFORE INSERT ON resumos FOR EACH ROW EXECUTE FUNCTION falha_no_2()');
        });
        const s = await rodar(
          arquivoCom([
            [1, 'aprovada', {}, 'texto novo'],
            [2, 'aprovada'],
          ]),
          { env },
        );
        expect(s.codigo).toBe(1);
        const linhas = await resumosGravados(url);
        expect(linhas).toHaveLength(1);
        expect((linhas[0]?.conteudo as Resumo).contexto.startsWith('texto antigo')).toBe(true);
      },
      { migrado: true },
    );
  });
});

describe('FUN-173: URL do ambiente', () => {
  it('FUN-173: sem a variável do ambiente: mensagem clara que nomeia a variável e código 1', async () => {
    const tst = await rodar(arquivoCom([[1, 'aprovada']]), { env: {} });
    expect(tst.codigo).toBe(1);
    expect(tst.erro.join('\n')).toContain('DATABASE_URL_TST');
    expect(tst.conexoes).toBe(0);
    const vazia = await rodar(arquivoCom([[1, 'aprovada']]), {
      ambiente: 'producao',
      env: { DATABASE_URL_PRODUCAO: '   ', DATABASE_URL_TST: 'postgresql://x:y@127.0.0.1:1/nada' },
      respostas: ['PRODUÇÃO'],
    });
    expect(vazia.codigo).toBe(1);
    expect(vazia.erro.join('\n')).toContain('DATABASE_URL_PRODUCAO');
    expect(vazia.conexoes).toBe(0);
  });

  it('FUN-173: tst lê só DATABASE_URL_TST; a de produção não é usada', async () => {
    await bancoDeTeste(
      async (url) => {
        const s = await rodar(arquivoCom([[1, 'aprovada']]), {
          env: { DATABASE_URL_TST: url, DATABASE_URL_PRODUCAO: 'postgresql://x:y@127.0.0.1:1/producao' },
        });
        expect(s.codigo).toBe(0);
      },
      { migrado: true },
    );
  });
});

describe('FUN-175: confirmação escrita para produção', () => {
  it('FUN-175: produção com a resposta PRODUÇÃO grava', async () => {
    await bancoDeTeste(
      async (url) => {
        const s = await rodar(arquivoCom([[1, 'aprovada']]), {
          ambiente: 'producao',
          env: { DATABASE_URL_PRODUCAO: url },
          respostas: ['PRODUÇÃO'],
        });
        expect(s.codigo).toBe(0);
        expect(s.perguntas).toHaveLength(1);
        expect(s.perguntas[0]).toContain('PRODUÇÃO');
        expect(s.fora).toContain('1 livros gravados');
        expect(await resumosGravados(url)).toHaveLength(1);
      },
      { migrado: true },
    );
  });

  it.each([['sim'], [''], ['produção'], ['PRODUCAO'], ['PRODUÇÃO '], [null]])(
    'FUN-175: produção com a resposta %j não conecta, não grava e sai com 1',
    async (resposta) => {
      await bancoDeTeste(
        async (url) => {
          const s = await rodar(arquivoCom([[1, 'aprovada']]), {
            ambiente: 'producao',
            env: { DATABASE_URL_PRODUCAO: url },
            respostas: [resposta],
          });
          expect(s.codigo).toBe(1);
          expect(s.conexoes).toBe(0);
          expect(s.fora.join('\n')).not.toContain('gravados');
          expect(await resumosGravados(url)).toEqual([]);
        },
        { migrado: true },
      );
    },
  );

  it('FUN-175: a pergunta só vem depois de validar (resumo inválido não pergunta)', async () => {
    const s = await rodar(
      arquivoCom([[1, 'aprovada', { versiculos: [{ capitulo: 51, versiculo: 1, frase: 'frase de exemplo' }] }]]),
      { ambiente: 'producao', env: { DATABASE_URL_PRODUCAO: 'postgresql://x:y@127.0.0.1:1/nada' } },
    );
    expect(s.codigo).toBe(1);
    expect(s.perguntas).toEqual([]);
  });

  it('FUN-175: tst não pergunta', async () => {
    await bancoDeTeste(
      async (url) => {
        const s = await rodar(arquivoCom([[1, 'aprovada']]), { env: { DATABASE_URL_TST: url } });
        expect(s.codigo).toBe(0);
        expect(s.perguntas).toEqual([]);
      },
      { migrado: true },
    );
  });
});
