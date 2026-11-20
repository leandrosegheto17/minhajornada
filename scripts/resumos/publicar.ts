// Publica os resumos aprovados no banco do ambiente (FUN-173, FUN-174, FUN-175):
// `node scripts/resumos/publicar.ts --ambiente tst|producao [--arquivo resumos-exportados/resumos.json]`.
// Node 24 roda este arquivo direto: só sintaxe de tipo apagável e imports com a extensão `.ts`.
import { readFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import { converterLivro } from '../../src/biblia/conversor.ts';
import type { Livro } from '../../src/biblia/tipos.ts';
import { lerArquivoExportado } from '../../src/resumos/formato.ts';
import { problemasDoResumo } from '../../src/resumos/validar.ts';
import { criarCliente, emTransacao } from '../../servidor/db/cliente.ts';
import type { ClienteRequisicao } from '../../servidor/db/cliente.ts';

export type Ambiente = 'tst' | 'producao';

/** A URL do banco vem só desta variável, nunca de arquivo (design, Tech Decisions). */
const VARIAVEL: Record<Ambiente, string> = { tst: 'DATABASE_URL_TST', producao: 'DATABASE_URL_PRODUCAO' };
const CONFIRMACAO = 'PRODUÇÃO';
export const ARQUIVO_PADRAO = 'resumos-exportados/resumos.json';

export interface OpcoesPublicar {
  ambiente: Ambiente;
  arquivo: string;
  env: Record<string, string | undefined>;
  biblia: Livro[];
  lerArquivo: (caminho: string) => Promise<string>;
  /** Faz a pergunta e devolve a linha digitada; `null` quando a entrada está fechada. */
  perguntar: (pergunta: string) => Promise<string | null>;
  conectar?: (url: string) => ClienteRequisicao;
  saida: (linha: string) => void;
  erro: (linha: string) => void;
}

const SQL_GRAVAR = `INSERT INTO resumos (livro, conteudo, publicado_em) VALUES ($1, $2::jsonb, now())
  ON CONFLICT (livro) DO UPDATE SET conteudo = EXCLUDED.conteudo, publicado_em = now()`;

// Livro recusado depois de publicado sai do banco (FUN-172, A-12): só os `recusada` do arquivo, nunca os `proposta`.
const SQL_REMOVER = 'DELETE FROM resumos WHERE livro = ANY($1::int[])';

/** Devolve o código de saída: 0 gravou; 1 recusou ou falhou (nesse caso nada foi gravado). */
export async function publicar(opcoes: OpcoesPublicar): Promise<number> {
  const { ambiente, erro } = opcoes;
  const variavel = VARIAVEL[ambiente];
  const url = opcoes.env[variavel]?.trim();
  if (!url) {
    erro(
      `Defina ${variavel} com a URL do banco de ${ambiente === 'tst' ? 'tst' : 'produção'} (papel dono) e rode de novo.`,
    );
    return 1;
  }

  let arquivo;
  try {
    arquivo = lerArquivoExportado(await opcoes.lerArquivo(opcoes.arquivo));
  } catch (e) {
    erro(
      e instanceof Error && e.message.startsWith('arquivo de resumos')
        ? e.message
        : `Não consegui ler ${opcoes.arquivo}.`,
    );
    return 1;
  }

  const aprovados = arquivo.itens.filter((i) => i.estado === 'aprovada');
  const recusados = arquivo.itens.filter((i) => i.estado === 'recusada').map((i) => i.livro);
  // Só recusados também é uma publicação: tira o livro recusado do ar (FUN-172, A-14).
  if (aprovados.length === 0 && recusados.length === 0) {
    erro('Nada a publicar: nenhum resumo aprovado nem recusado no arquivo.');
    return 1;
  }

  // Valida todos antes de conectar: um problema em qualquer livro recusa a publicação inteira (FUN-174).
  const problemas = aprovados.flatMap((i) => {
    const nome = opcoes.biblia.find((l) => l.numero === i.livro)?.nome ?? `Livro ${i.livro}`;
    return problemasDoResumo(i.resumo, opcoes.biblia).map((p) => `${nome}: ${p}`);
  });
  if (problemas.length > 0) {
    problemas.forEach(erro);
    erro('Nenhum livro foi gravado.');
    return 1;
  }

  if (ambiente === 'producao') {
    const remocao = recusados.length > 0 ? ` e remover ${recusados.length} recusados` : '';
    const resposta = await opcoes.perguntar(
      `Publicar ${aprovados.length} livros${remocao} em PRODUÇÃO. Digite ${CONFIRMACAO} para confirmar: `,
    );
    if (resposta === null || resposta.normalize('NFC') !== CONFIRMACAO) {
      erro('Confirmação não recebida: nada foi gravado.');
      return 1;
    }
  }

  const cliente = (opcoes.conectar ?? criarCliente)(url);
  let removidos: number;
  try {
    removidos = await emTransacao(cliente, async (c) => {
      const apagados = await c.consultar(SQL_REMOVER, [recusados]);
      for (const item of aprovados) await c.consultar(SQL_GRAVAR, [item.livro, JSON.stringify(item.resumo)]);
      return apagados.rowCount ?? 0;
    });
  } catch (e) {
    erro(`Falha ao gravar: ${e instanceof Error ? e.message : 'erro desconhecido'}. Nenhum livro foi gravado.`);
    return 1;
  } finally {
    await cliente.fechar();
  }
  opcoes.saida(`${aprovados.length} livros gravados`);
  opcoes.saida(`${removidos} livros removidos`);
  return 0;
}

function lerArgumentos(argv: string[]): { ambiente: Ambiente; arquivo: string } | null {
  let ambiente: string | undefined;
  let arquivo = ARQUIVO_PADRAO;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--ambiente') ambiente = argv[(i += 1)];
    else if (argv[i] === '--arquivo') arquivo = argv[(i += 1)] ?? '';
    else return null;
  }
  if ((ambiente !== 'tst' && ambiente !== 'producao') || arquivo === '') return null;
  return { ambiente, arquivo };
}

const ehPrincipal = process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (ehPrincipal) {
  const args = lerArgumentos(process.argv.slice(2));
  if (!args) {
    console.error('Uso: node scripts/resumos/publicar.ts --ambiente tst|producao [--arquivo caminho.json]');
    process.exitCode = 1;
  } else {
    const raiz = resolve(fileURLToPath(new URL('../..', import.meta.url)));
    const fonte = join(raiz, '.biblia');
    const nomes = (await readdir(fonte)).filter((n) => /^(\d{2})-[a-z0-9-]+\.md$/.test(n)).sort();
    const biblia = await Promise.all(
      nomes.map(async (n) => converterLivro(await readFile(join(fonte, n), 'utf8'), Number(n.slice(0, 2)))),
    );
    process.exitCode = await publicar({
      ...args,
      env: process.env,
      biblia,
      lerArquivo: (caminho) => readFile(caminho, 'utf8'),
      perguntar: async (pergunta) => {
        const leitor = createInterface({ input: process.stdin, output: process.stdout });
        try {
          return await leitor.question(pergunta);
        } catch {
          return null; // entrada fechada
        } finally {
          leitor.close();
        }
      },
      saida: (l) => console.log(l),
      erro: (l) => console.error(l),
    });
  }
}
