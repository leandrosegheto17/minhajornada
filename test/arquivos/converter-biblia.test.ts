import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { gerar, nomeDoArquivo } from '../../scripts/converter-biblia.ts';
import type { ArquivoCorrecoes, ListaAplicada, ResumoCorrecoes } from '../../src/biblia/correcoes/arquivo';
import type { Indice, Livro } from '../../src/biblia/tipos';

const FONTE = join(process.cwd(), '.biblia');
const EXEMPLO = join(process.cwd(), 'test', 'arquivos', 'dados', 'correcoes-exemplo.json');
const REAL = join(process.cwd(), 'correcoes', 'correcoes.json');

interface Gerado {
  indice: Indice;
  resumo: ResumoCorrecoes;
  lista: ListaAplicada;
  livros: Map<number, Livro>;
}

/** Gera numa pasta temporária com o arquivo de correções dado; devolve o que foi gravado. */
function gerarCom(correcoes: string, destino: string): Gerado {
  const pastaLivros = join(destino, 'livros');
  const arquivoIndice = join(destino, 'indice.gerado.json');
  const resumo = join(destino, 'correcoes-resumo.gerado.json');
  const lista = join(destino, 'correcoes.gerado.json');
  gerar(FONTE, pastaLivros, arquivoIndice, { correcoes, resumo, lista });
  const indice = JSON.parse(readFileSync(arquivoIndice, 'utf8')) as Indice;
  const livros = new Map<number, Livro>();
  for (const entrada of indice.livros) {
    const nome = entrada.arquivo.replace('/livros/', '');
    livros.set(entrada.numero, JSON.parse(readFileSync(join(pastaLivros, nome), 'utf8')) as Livro);
  }
  return {
    indice,
    resumo: JSON.parse(readFileSync(resumo, 'utf8')) as ResumoCorrecoes,
    lista: JSON.parse(readFileSync(lista, 'utf8')) as ListaAplicada,
    livros,
  };
}

function hashesDe(pasta: string): Record<string, string> {
  const r: Record<string, string> = {};
  for (const nome of readdirSync(pasta).sort()) {
    r[nome] = createHash('sha256')
      .update(readFileSync(join(pasta, nome)))
      .digest('hex');
  }
  return r;
}

/**
 * Leitura independente da fonte, sem o conversor: cada `**v** texto` vira [livro, capítulo, versículo, texto],
 * com o capítulo vindo do último `## <Nome> <n>`. Para no rodapé (`---`).
 */
function versiculosDaFonte(): Array<[number, number, number, string]> {
  const lista: Array<[number, number, number, string]> = [];
  for (const arquivo of readdirSync(FONTE).filter((nome) => /^\d{2}-.+\.md$/.test(nome))) {
    const livro = Number(arquivo.slice(0, 2));
    let capitulo = 0;
    for (const linha of readFileSync(join(FONTE, arquivo), 'utf8').split(/\r?\n/)) {
      if (linha.trimEnd() === '---') break;
      const cap = /^## .+ (\d+)\s*$/.exec(linha);
      if (cap) capitulo = Number(cap[1]);
      const ver = /^\*\*(\d+)\*\* (.*)$/.exec(linha);
      if (ver) lista.push([livro, capitulo, Number(ver[1]), (ver[2] ?? '').replace(/\s+$/, '')]);
    }
  }
  return lista;
}

let pasta: string;
let indice: Indice;
let livrosGravados: Map<number, Livro>;
let pastaGerada: string;
let comExemplo: Gerado;
let semCorrecoes: Gerado;
let hashesFonteAntes: Record<string, string>;
let hashesFonteDepois: Record<string, string>;

beforeAll(() => {
  pasta = mkdtempSync(join(tmpdir(), 'mj-biblia-'));
  hashesFonteAntes = hashesDe(FONTE);
  mkdirSync(join(pasta, 'exemplo'));
  mkdirSync(join(pasta, 'vazio'));
  comExemplo = gerarCom(EXEMPLO, join(pasta, 'exemplo'));
  semCorrecoes = gerarCom(REAL, join(pasta, 'vazio'));
  hashesFonteDepois = hashesDe(FONTE);
  indice = comExemplo.indice;
  livrosGravados = comExemplo.livros;
  pastaGerada = join(pasta, 'exemplo', 'livros');
});

afterAll(() => {
  if (pasta) rmSync(pasta, { recursive: true, force: true });
});

describe('converter-biblia (FUN-03)', () => {
  it('FUN-03: os 31.102 versículos gravados são iguais aos de .biblia/, exceto as aprovadas do exemplo', () => {
    const exemplo = JSON.parse(readFileSync(EXEMPLO, 'utf8')) as ArquivoCorrecoes;
    // Expectativa calculada aqui, sem `aplicarCorrecoes`: fonte com o "antes" trocado pelo "depois" nas aprovadas.
    const aprovadas = new Map<string, ArquivoCorrecoes['itens'][number]>();
    for (const i of exemplo.itens) {
      if (i.estado === 'aprovada') aprovadas.set(`${i.ref.livro} ${i.ref.capitulo}:${i.ref.versiculo}`, i);
    }
    expect(aprovadas.size).toBe(2);
    const fonte = versiculosDaFonte();
    expect(fonte).toHaveLength(31102);
    let gravados = 0;
    for (const livro of livrosGravados.values()) for (const capitulo of livro.capitulos) gravados += capitulo.length;
    expect(gravados).toBe(31102);
    let trocados = 0;
    for (const [livro, capitulo, versiculo, texto] of fonte) {
      const chave = `${livro} ${capitulo}:${versiculo}`;
      const aprovada = aprovadas.get(chave);
      const esperado = aprovada ? texto.replace(aprovada.antes, aprovada.depois) : texto;
      if (aprovada) {
        trocados += 1;
        expect(esperado, chave).not.toBe(texto);
      }
      expect(livrosGravados.get(livro)?.capitulos[capitulo - 1]?.[versiculo - 1], chave).toBe(esperado);
    }
    expect(trocados).toBe(2);
  });

  it('FUN-03: cada arquivo gravado tem o nome NN.<hash8>.json', () => {
    for (const entrada of indice.livros) {
      expect(entrada.arquivo).toMatch(
        new RegExp(`^/livros/${String(entrada.numero).padStart(2, '0')}\\.[0-9a-f]{8}\\.json$`),
      );
    }
    expect(readdirSync(pastaGerada)).toHaveLength(66);
  });
});

describe('índice (FUN-06)', () => {
  it('FUN-06: 66 livros na ordem canônica, 39 do AT e 27 do NT', () => {
    expect(indice.livros).toHaveLength(66);
    expect(indice.livros.map((l) => l.numero)).toEqual(Array.from({ length: 66 }, (_, i) => i + 1));
    expect(indice.livros.filter((l) => l.testamento === 'AT')).toHaveLength(39);
    expect(indice.livros.filter((l) => l.testamento === 'NT')).toHaveLength(27);
    expect(indice.livros[0]?.nome).toBe('Gênesis');
    expect(indice.livros[38]).toMatchObject({ nome: 'Malaquias', testamento: 'AT' });
    expect(indice.livros[39]).toMatchObject({ nome: 'Mateus', testamento: 'NT' });
    expect(indice.livros[65]?.nome).toBe('Apocalipse');
  });

  it('FUN-06: Salmos tem 150 capítulos e Judas tem 1', () => {
    expect(indice.livros.find((l) => l.nome === 'Salmos')?.capitulos).toBe(150);
    expect(indice.livros.find((l) => l.nome === 'Judas')?.capitulos).toBe(1);
  });
});

describe('nomeDoArquivo (AD-002)', () => {
  it('o mesmo texto dá o mesmo nome e um texto diferente muda o hash', () => {
    const json = JSON.stringify({ numero: 1, nome: 'Gênesis', capitulos: [['No princípio']] });
    const outro = JSON.stringify({ numero: 1, nome: 'Gênesis', capitulos: [['No princípio.']] });
    expect(nomeDoArquivo(1, json)).toBe(nomeDoArquivo(1, json));
    expect(nomeDoArquivo(1, outro)).not.toBe(nomeDoArquivo(1, json));
    expect(nomeDoArquivo(1, json)).toMatch(/^01\.[0-9a-f]{8}\.json$/);
  });
});

describe('correções no build (FUN-114, FUN-115, FUN-118, FUN-126)', () => {
  it('FUN-114: com o exemplo, Apocalipse 6:1 diz "Cordeiro" e a lista gerada traz o item', () => {
    expect(comExemplo.livros.get(66)?.capitulos[5]?.[0]).toContain('o Cordeiro abriu');
    expect(comExemplo.lista.itens.map((i) => i.ref.livro)).toEqual([43, 66]);
    expect(comExemplo.lista.itens[1]).toMatchObject({ antes: 'Coreiro', depois: 'Cordeiro' });
  });

  it('FUN-114: o resumo tem total igual ao número de aplicadas; a proposta não conta nem muda o texto', () => {
    expect(comExemplo.resumo).toEqual({ total: 2 });
    expect(comExemplo.livros.get(1)?.capitulos[0]?.[0]).toMatch(/^No princípio/);
  });

  it('FUN-114: com o arquivo inicial vazio nada muda e o total é 0', () => {
    expect(semCorrecoes.resumo).toEqual({ total: 0 });
    expect(semCorrecoes.lista).toEqual({ regras: [], itens: [] });
    expect(semCorrecoes.livros.get(66)?.capitulos[5]?.[0]).toContain('o Coreiro abriu');
  });

  it('FUN-114: .biblia/ fica igual byte a byte depois de gerar', () => {
    expect(hashesFonteDepois).toEqual(hashesFonteAntes);
  });

  it('FUN-118: só o livro corrigido ganha nome novo; livro sem correção mantém o nome de antes', () => {
    const nomes = (g: Gerado) => new Map(g.indice.livros.map((l) => [l.numero, l.arquivo]));
    const antes = nomes(semCorrecoes);
    const depois = nomes(comExemplo);
    for (const [numero, arquivo] of antes) {
      if (numero === 43 || numero === 66) expect(depois.get(numero), `livro ${numero}`).not.toBe(arquivo);
      else expect(depois.get(numero), `livro ${numero}`).toBe(arquivo);
    }
  });

  it('FUN-115: aprovada que não confere lança com o id e a referência, e public/livros anterior continua', () => {
    const dir = mkdtempSync(join(tmpdir(), 'mj-biblia-falha-'));
    try {
      const ruim = JSON.parse(readFileSync(EXEMPLO, 'utf8')) as ArquivoCorrecoes;
      ruim.itens[0]!.antes = 'trecho que não existe no versículo';
      const arquivo = join(dir, 'ruim.json');
      writeFileSync(arquivo, JSON.stringify(ruim));
      const pastaLivros = join(dir, 'livros');
      mkdirSync(pastaLivros);
      writeFileSync(join(pastaLivros, '01.aaaaaaaa.json'), '{"anterior":true}');
      const arquivoIndice = join(dir, 'indice.gerado.json');
      expect(() => gerar(FONTE, pastaLivros, arquivoIndice, { correcoes: arquivo })).toThrow(
        'correção C-0001 não confere com Apocalipse 6:1',
      );
      expect(readdirSync(pastaLivros)).toEqual(['01.aaaaaaaa.json']);
      expect(readFileSync(join(pastaLivros, '01.aaaaaaaa.json'), 'utf8')).toBe('{"anterior":true}');
      expect(existsSync(arquivoIndice)).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('FUN-115: arquivo de correções ausente falha antes de apagar public/livros', () => {
    const dir = mkdtempSync(join(tmpdir(), 'mj-biblia-ausente-'));
    try {
      const pastaLivros = join(dir, 'livros');
      mkdirSync(pastaLivros);
      writeFileSync(join(pastaLivros, 'x.json'), '{}');
      expect(() =>
        gerar(FONTE, pastaLivros, join(dir, 'i.json'), { correcoes: join(dir, 'nao-existe.json') }),
      ).toThrow();
      expect(readdirSync(pastaLivros)).toEqual(['x.json']);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('FUN-126: id repetido e referência inexistente falham pelo build, com o id e a referência', () => {
    const dir = mkdtempSync(join(tmpdir(), 'mj-biblia-126-'));
    try {
      const base = JSON.parse(readFileSync(EXEMPLO, 'utf8')) as ArquivoCorrecoes;
      const repetido = { ...base, itens: [base.itens[0]!, { ...base.itens[1]!, id: 'C-0001' }] };
      const inexistente = { ...base, itens: [{ ...base.itens[0]!, ref: { livro: 66, capitulo: 99, versiculo: 1 } }] };
      for (const [nome, conteudo, mensagem] of [
        ['repetido', repetido, 'C-0001'],
        ['inexistente', inexistente, 'Apocalipse 99:1'],
      ] as const) {
        const arquivo = join(dir, `${nome}.json`);
        writeFileSync(arquivo, JSON.stringify(conteudo));
        expect(() =>
          gerar(FONTE, join(dir, `livros-${nome}`), join(dir, `${nome}-indice.json`), { correcoes: arquivo }),
        ).toThrow(mensagem);
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
