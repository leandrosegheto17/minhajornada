import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { consolidar, descreverRegras, gravarConsolidacao } from '../../scripts/consolidar-correcoes.ts';
import { lerArquivoCorrecoes } from '../../src/biblia/correcoes/arquivo';
import { REGRAS } from '../../src/biblia/correcoes/regras';
import { validarCorrecoes } from '../../src/biblia/correcoes/validar';
import type { Livro } from '../../src/biblia/tipos';

const POUCOS: Livro[] = [
  {
    numero: 1,
    nome: 'Gênesis',
    capitulos: [
      [
        'Rute disse ,vem.', // R-01 e R-02
        'diz,assim ao povo', // R-02
        'fim.Então saiu', // R-03
        'Sem nada a mudar.',
        'No princípio [Deus] criou os céus e a terra.',
        'A terra era vazia, e o Coreiro abriu o livro.',
      ],
    ],
  },
];

const MUITOS: Livro[] = [
  { numero: 1, nome: 'Gênesis', capitulos: [Array.from({ length: 12 }, (_, i) => `texto ${i + 1} a ,b`)] },
];

const TABELA = [
  '# Levantamento g01: Gênesis',
  '',
  '| Ref | Tipo | Antes (trecho exato) | Depois (proposta) | Motivo | Fonte | Confiança |',
  '|---|---|---|---|---|---|---|',
  '| Gn 1:6 | digitacao | "o Coreiro abriu" | "o Cordeiro abriu" | palavra inexistente | consistência interna | alta |',
  '| Gn 1:5 | ortografia | "os céus" | "os Céus" | exemplo | VOLP | média |',
  '| Gn 1:5 | arcaico | "criou" | "fez" | exemplo | dicionário | baixa |',
  '| Gn 1:1 | digitacao | "disse ,vem" | "disse, vem" | espaço | tipografia | alta |',
  '| Gn 1:5 | digitacao | "acrescentar ponto" | acrescentar ponto final | texto livre | tipografia | baixa |',
].join('\n');

describe('descreverRegras (FUN-106)', () => {
  it('FUN-106: descreve as três regras na ordem, todas "proposta", com a descrição de REGRAS', () => {
    const regras = descreverRegras(POUCOS);
    expect(regras.map((r) => r.id)).toEqual(['R-01', 'R-02', 'R-03']);
    expect(regras.every((r) => r.estado === 'proposta')).toBe(true);
    expect(regras.map((r) => r.descricao)).toEqual(REGRAS.map((r) => r.descricao));
  });

  it('FUN-106: o número de versículos é o de versículos da fonte que a regra muda, na ordem de aplicação', () => {
    // Contagem feita à mão sobre POUCOS: "Rute disse ,vem." muda em R-01 e R-02; "diz,assim" só em R-02; "fim.Então" só em R-03.
    const regras = descreverRegras(POUCOS);
    expect(regras.map((r) => r.versiculos)).toEqual([1, 2, 1]);
  });

  it('FUN-106: os exemplos são versículos reais, com o antes igual ao da fonte e o depois igual ao da regra', () => {
    const [r01, r02, r03] = descreverRegras(POUCOS);
    expect(r01?.exemplos).toEqual([
      {
        ref: { livro: 1, capitulo: 1, versiculo: 1 },
        antes: 'Rute disse ,vem.',
        depois: 'Rute disse,vem.',
      },
    ]);
    expect(r02?.exemplos.map((e) => e.ref.versiculo)).toEqual([1, 2]);
    expect(r02?.exemplos[1]).toMatchObject({ antes: 'diz,assim ao povo', depois: 'diz, assim ao povo' });
    expect(r03?.exemplos).toEqual([
      { ref: { livro: 1, capitulo: 1, versiculo: 3 }, antes: 'fim.Então saiu', depois: 'fim. Então saiu' },
    ]);
  });

  it('FUN-106: com mais de 5 versículos alterados, são 5 exemplos distintos, espalhados e em ordem bíblica', () => {
    const [r01] = descreverRegras(MUITOS);
    expect(r01?.versiculos).toBe(12);
    expect(r01?.exemplos).toHaveLength(5);
    const versiculos = r01?.exemplos.map((e) => e.ref.versiculo) ?? [];
    expect(new Set(versiculos).size).toBe(5);
    expect([...versiculos].sort((a, b) => a - b)).toEqual(versiculos);
    expect(versiculos[0]).toBe(1);
    expect(versiculos[4]).toBeGreaterThan(8);
    for (const e of r01?.exemplos ?? []) {
      expect(e.antes).toBe(`texto ${e.ref.versiculo} a ,b`);
      expect(e.depois).toBe(`texto ${e.ref.versiculo} a,b`);
    }
  });

  it('FUN-106: regra que não muda nenhum versículo vem com 0 e sem exemplos', () => {
    const regras = descreverRegras([{ numero: 1, nome: 'Gênesis', capitulos: [['Tudo certo aqui.']] }]);
    expect(regras.map((r) => [r.versiculos, r.exemplos])).toEqual([
      [0, []],
      [0, []],
      [0, []],
    ]);
  });
});

describe('consolidar (FUN-106)', () => {
  const resultado = () => consolidar([{ arquivo: 'g01.md', md: TABELA }], POUCOS);

  it('FUN-106: o arquivo passa em lerArquivoCorrecoes e validarCorrecoes, sem o item arcaico nem o coberto por regra', () => {
    const { json } = resultado();
    const arquivo = lerArquivoCorrecoes(JSON.parse(json) as unknown);
    validarCorrecoes(arquivo, POUCOS);
    expect(arquivo.regras).toHaveLength(3);
    expect(arquivo.itens.map((i) => [i.id, i.ref.versiculo, i.antes, i.estado, i.confere])).toEqual([
      ['C-0001', 5, 'os céus', 'proposta', true],
      ['C-0002', 6, 'o Coreiro abriu', 'proposta', true],
    ]);
  });

  it('FUN-106: cada item e cada regra ocupa uma linha do arquivo', () => {
    const { json } = resultado();
    const linhas = json.split('\n');
    const itens = linhas.filter((l) => l.includes('"estado":"proposta"') && l.includes('"confere"'));
    expect(itens).toHaveLength(2);
    for (const l of itens) JSON.parse(l.replace(/,$/, ''));
    expect(json.endsWith('\n')).toBe(true);
  });

  it('FUN-106: rodar duas vezes sobre a mesma entrada dá o mesmo arquivo, byte a byte, e a ordem dos arquivos de entrada não importa', () => {
    const a = consolidar([{ arquivo: 'g01.md', md: TABELA }], POUCOS);
    const b = consolidar([{ arquivo: 'g01.md', md: TABELA }], POUCOS);
    expect(b.json).toBe(a.json);
    expect(b.relatorio).toBe(a.relatorio);
    const duas = consolidar(
      [
        { arquivo: 'g02.md', md: TABELA.replace('1:6', '1:5') },
        { arquivo: 'g01.md', md: TABELA },
      ],
      POUCOS,
    );
    const invertido = consolidar(
      [
        { arquivo: 'g01.md', md: TABELA },
        { arquivo: 'g02.md', md: TABELA.replace('1:6', '1:5') },
      ],
      POUCOS,
    );
    expect(invertido.json).toBe(duas.json);
  });

  it('FUN-106: o relatório traz contagens por tipo, conferem, não conferem, arcaicos descartados e linhas ignoradas', () => {
    const { relatorio } = resultado();
    expect(relatorio).toContain('# Relatório da consolidação');
    expect(relatorio).toMatch(/digitação: 1/i);
    expect(relatorio).toMatch(/ortografia: 1/i);
    expect(relatorio).toMatch(/arcaico descartado: 1/i);
    expect(relatorio).toMatch(/conferem: 2/i);
    expect(relatorio).toMatch(/não conferem: 0/i);
    expect(relatorio).toMatch(/cobertos por regra: 1/i);
    expect(relatorio).toMatch(/linhas ignoradas: 1/i);
    expect(relatorio).toContain('g01.md:9');
  });
});

describe('gravarConsolidacao (FUN-106)', () => {
  it('FUN-106: grava arquivo e relatório; recusa sobrescrever decisões do dono e aceita com forcar', () => {
    const pasta = mkdtempSync(join(tmpdir(), 'mj-consolidar-'));
    try {
      const destino = join(pasta, 'correcoes');
      const r = consolidar([{ arquivo: 'g01.md', md: TABELA }], POUCOS);
      gravarConsolidacao(destino, r, { forcar: false });
      expect(readFileSync(join(destino, 'correcoes.json'), 'utf8')).toBe(r.json);
      expect(readFileSync(join(destino, 'relatorio-consolidacao.md'), 'utf8')).toBe(r.relatorio);

      // Só propostas: regrava sem pedir nada.
      gravarConsolidacao(destino, r, { forcar: false });

      // Uma aprovada: recusa e não toca no arquivo.
      const decidido = r.json.replace('"estado":"proposta","confere":true', '"estado":"aprovada","confere":true');
      expect(decidido).not.toBe(r.json);
      writeFileSync(join(destino, 'correcoes.json'), decidido);
      expect(() => gravarConsolidacao(destino, r, { forcar: false })).toThrow('decisões');
      expect(readFileSync(join(destino, 'correcoes.json'), 'utf8')).toBe(decidido);

      gravarConsolidacao(destino, r, { forcar: true });
      expect(readFileSync(join(destino, 'correcoes.json'), 'utf8')).toBe(r.json);
    } finally {
      rmSync(pasta, { recursive: true, force: true });
    }
  });

  it('FUN-106: cria a pasta de destino quando não existe', () => {
    const pasta = mkdtempSync(join(tmpdir(), 'mj-consolidar-'));
    try {
      const destino = join(pasta, 'a', 'b');
      mkdirSync(join(pasta, 'a'));
      gravarConsolidacao(destino, consolidar([], POUCOS), { forcar: false });
      expect(readFileSync(join(destino, 'correcoes.json'), 'utf8')).toContain('"versao": 1');
    } finally {
      rmSync(pasta, { recursive: true, force: true });
    }
  });
});
