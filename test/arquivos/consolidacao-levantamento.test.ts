import { describe, expect, it } from 'vitest';
import { lerTabelas } from '../../scripts/correcoes/levantamento.ts';

const CABECALHO = [
  '# Levantamento g15: Tiago',
  '',
  '- Totais: digitacao 1',
  '',
  '| Ref | Tipo | Antes (trecho exato) | Depois (proposta) | Motivo | Fonte | Confiança |',
  '|---|---|---|---|---|---|---|',
];

function tabela(...linhas: string[]): string {
  return [...CABECALHO, ...linhas, '', '## Observações', '', '- texto solto | com barra'].join('\n');
}

const TIAGO =
  '| Tiago 1:13 | digitacao | "e ele mesmo tenta ninguém" | "e ele mesmo a ninguém tenta" | falta a preposição "a" | gramática do português | alta |';
const APOCALIPSE =
  '| Apocalipse 6:1 | digitacao | "quando o Coreiro abriu um dos selos" | "quando o Cordeiro abriu um dos selos" | palavra inexistente | consistência interna (5:6 e outros) | alta |';
const ARCAICO =
  '| Êxodo 2:12 | arcaico | "vendo que não parecia ninguém" | "não aparecia ninguém" | "parecer" no sentido antigo | dicionário | média |';

const linha = (ref: string, antes = '"a"', depois = '"b"', tipo = 'digitacao', conf = 'alta') =>
  `| ${ref} | ${tipo} | ${antes} | ${depois} | m | f | ${conf} |`;

describe('lerTabelas (FUN-104)', () => {
  it('FUN-104: lê as linhas reais de g15 (Tiago 1:13 e Apocalipse 6:1), sem as aspas dos trechos', () => {
    const r = lerTabelas(tabela(TIAGO, APOCALIPSE), 'g15.md');
    expect(r.ignoradas).toEqual([]);
    expect(r.candidatos).toHaveLength(2);
    expect(r.candidatos[0]).toMatchObject({
      refs: [{ livro: 59, capitulo: 1, versiculo: 13 }],
      tipo: 'digitacao',
      antes: 'e ele mesmo tenta ninguém',
      depois: 'e ele mesmo a ninguém tenta',
      motivo: 'falta a preposição "a"',
      fonte: 'gramática do português',
      confianca: 'alta',
      arquivo: 'g15.md',
    });
    expect(r.candidatos[1]).toMatchObject({
      refs: [{ livro: 66, capitulo: 6, versiculo: 1 }],
      antes: 'quando o Coreiro abriu um dos selos',
      depois: 'quando o Cordeiro abriu um dos selos',
      confianca: 'alta',
    });
  });

  it('FUN-104: a linha arcaico é descartada e só entra na contagem', () => {
    const r = lerTabelas(tabela(ARCAICO, TIAGO), 'g15.md');
    expect(r.candidatos).toHaveLength(1);
    expect(r.candidatos[0]?.tipo).toBe('digitacao');
    expect(r.ignoradas).toEqual([]);
    expect(r.arcaicos).toBe(1);
  });

  it('FUN-104: cabeçalho, separador, texto solto e barra fora da tabela não viram candidato', () => {
    const r = lerTabelas(tabela(), 'g15.md');
    expect(r).toEqual({ candidatos: [], ignoradas: [], arcaicos: 0 });
  });

  it('FUN-104: mapeia nome completo, abreviação e livro com número, com ou sem espaço ("Jó" não é "Jo")', () => {
    const livros = (...refs: string[]) =>
      lerTabelas(tabela(...refs.map((r) => linha(r, '"a"', '"b"', 'digitacao', 'média'))), 'g.md').candidatos.map(
        (c) => c.refs[0]?.livro,
      );
    expect(
      livros('1 João 1:1', '1Cr 2:3', '1 Cr 2:3', 'Gên 1:1', 'Gn 1:1', 'Jó 3:1', 'Jo 3:1', 'Ez 1:1', 'Sl 2:1'),
    ).toEqual([62, 13, 13, 1, 1, 18, 43, 26, 19]);
    expect(
      lerTabelas(tabela(linha('Gn 1:1', '"a"', '"b"', 'digitacao', 'média')), 'g.md').candidatos[0]?.confianca,
    ).toBe('media');
  });

  it('FUN-104: "N ocorrências" volta como candidato marcado para expansão, sem referência (AD-014)', () => {
    const r = lerTabelas(
      tabela(
        '| 5 ocorrências (ex.: Gn 41:29, 41:44) | digitacao | "toda a terra" | "em toda a terra" | falta "em" | contexto | média |',
      ),
      'g01.md',
    );
    expect(r.ignoradas).toEqual([]);
    expect(r.candidatos).toHaveLength(1);
    expect(r.candidatos[0]).toMatchObject({
      refs: [],
      ocorrencias: 5,
      antes: 'toda a terra',
      depois: 'em toda a terra',
    });
  });

  it('FUN-104: várias referências do mesmo livro, de livros diferentes e entre parênteses ficam todas na lista', () => {
    const refs = (ref: string) => lerTabelas(tabela(linha(ref)), 'g.md').candidatos[0]?.refs;
    expect(refs('Deut 10:12, 13:15')).toEqual([
      { livro: 5, capitulo: 10, versiculo: 12 },
      { livro: 5, capitulo: 13, versiculo: 15 },
    ]);
    expect(refs('1Cr 3:4; 5:6')).toEqual([
      { livro: 13, capitulo: 3, versiculo: 4 },
      { livro: 13, capitulo: 5, versiculo: 6 },
    ]);
    expect(refs('2Sm 1:1; 1Rs 2:2')).toEqual([
      { livro: 10, capitulo: 1, versiculo: 1 },
      { livro: 11, capitulo: 2, versiculo: 2 },
    ]);
    expect(refs('Tiago 2:1 (e 2:9; 1 Pedro 1:17)')).toEqual([
      { livro: 59, capitulo: 2, versiculo: 1 },
      { livro: 59, capitulo: 2, versiculo: 9 },
      { livro: 60, capitulo: 1, versiculo: 17 },
    ]);
    expect(refs('Sl 1:2 e 3:4')).toHaveLength(2);
  });

  it('FUN-104: linha que não se lê vai para ignoradas com o motivo, e nunca some', () => {
    const casos: Array<[string, string, string]> = [
      [linha('Jz 1:2-5'), 'referência', 'Jz 1:2-5'],
      [linha('Jeremias 1:2 etc.'), 'referência', 'etc.'],
      [linha('Livro Inventado 1:1'), 'livro', 'Livro Inventado'],
      [linha('Gn 1:1', '"a"; "b"'), 'antes', ''],
      [linha('Gn 1:1', '"a"', 'acrescentar ponto final'), 'depois', ''],
      [linha('Gn 1:1', '"a"', '"b"', 'misterio'), 'tipo', 'misterio'],
      [linha('Gn 1:1', '"a"', '"b"', 'digitacao', 'talvez'), 'confiança', 'talvez'],
      [linha('Gn 1:1', '""', '"b"'), 'antes', ''],
    ];
    const r = lerTabelas(tabela(...casos.map(([l]) => l)), 'g09.md');
    expect(r.candidatos).toEqual([]);
    expect(r.ignoradas).toHaveLength(casos.length);
    casos.forEach(([texto, motivo, detalhe], i) => {
      const ign = r.ignoradas[i];
      expect(ign?.motivo, texto).toContain(motivo);
      if (detalhe) expect(ign?.motivo, texto).toContain(detalhe);
      expect(ign?.arquivo).toBe('g09.md');
      expect(ign?.linha).toBe(CABECALHO.length + 1 + i);
      expect(ign?.texto).toBe(texto);
    });
  });

  it('FUN-104: linha com número de colunas diferente de 7 vai para ignoradas', () => {
    const r = lerTabelas(tabela('| Gn 1:1 | digitacao | "a" | "b" | m | alta |'), 'g.md');
    expect(r.candidatos).toEqual([]);
    expect(r.ignoradas[0]?.motivo).toContain('colunas');
  });

  it('FUN-104: barra escapada dentro do trecho não parte a coluna e volta como barra', () => {
    const r = lerTabelas(tabela('| Gn 1:1 | digitacao | "a \\| b" | "a, b" | m | f | alta |'), 'g.md');
    expect(r.ignoradas).toEqual([]);
    expect(r.candidatos[0]?.antes).toBe('a | b');
  });

  it('FUN-104: aspas dentro do trecho ficam; só o par de fora sai', () => {
    const r = lerTabelas(tabela('| Gn 1:1 | digitacao | "diz "sim" e vai" | "diz sim e vai" | m | f | alta |'), 'g.md');
    expect(r.candidatos[0]?.antes).toBe('diz "sim" e vai');
  });
});
