import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { gerar, nomeDoArquivo } from '../../scripts/converter-biblia.ts';
import type { Indice, Livro } from '../../src/biblia/tipos';

const FONTE = join(process.cwd(), '.biblia');

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

beforeAll(() => {
  pasta = mkdtempSync(join(tmpdir(), 'mj-biblia-'));
  const pastaLivros = join(pasta, 'livros');
  const arquivoIndice = join(pasta, 'indice.gerado.json');
  gerar(FONTE, pastaLivros, arquivoIndice);
  indice = JSON.parse(readFileSync(arquivoIndice, 'utf8')) as Indice;
  livrosGravados = new Map();
  for (const entrada of indice.livros) {
    const nome = entrada.arquivo.replace('/livros/', '');
    livrosGravados.set(entrada.numero, JSON.parse(readFileSync(join(pastaLivros, nome), 'utf8')) as Livro);
  }
});

afterAll(() => {
  if (pasta) rmSync(pasta, { recursive: true, force: true });
});

describe('converter-biblia (FUN-03)', () => {
  it('FUN-03: os 31.102 versículos gravados são iguais aos de .biblia/, um a um, nos 66 livros', () => {
    const fonte = versiculosDaFonte();
    expect(fonte).toHaveLength(31102);
    let gravados = 0;
    for (const livro of livrosGravados.values()) for (const capitulo of livro.capitulos) gravados += capitulo.length;
    expect(gravados).toBe(31102);
    for (const [livro, capitulo, versiculo, texto] of fonte) {
      expect(livrosGravados.get(livro)?.capitulos[capitulo - 1]?.[versiculo - 1], `${livro} ${capitulo}:${versiculo}`).toBe(
        texto,
      );
    }
  });

  it('FUN-03: cada arquivo gravado tem o nome NN.<hash8>.json', () => {
    for (const entrada of indice.livros) {
      expect(entrada.arquivo).toMatch(new RegExp(`^/livros/${String(entrada.numero).padStart(2, '0')}\\.[0-9a-f]{8}\\.json$`));
    }
    expect(readdirSync(join(pasta, 'livros'))).toHaveLength(66);
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
