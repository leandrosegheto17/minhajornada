import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { converterLivro } from '../../src/biblia/conversor';
import { lerArquivoCorrecoes } from '../../src/biblia/correcoes/arquivo';
import type { ArquivoCorrecoes } from '../../src/biblia/correcoes/arquivo';
import { validarCorrecoes } from '../../src/biblia/correcoes/validar';
import type { Livro } from '../../src/biblia/tipos';

const RAIZ = process.cwd();
let bruto: unknown;
let arquivo: ArquivoCorrecoes;
let livros: Livro[];

beforeAll(() => {
  bruto = JSON.parse(readFileSync(join(RAIZ, 'correcoes', 'correcoes.json'), 'utf8')) as unknown;
  arquivo = lerArquivoCorrecoes(bruto);
  const fonte = join(RAIZ, '.biblia');
  livros = readdirSync(fonte)
    .filter((nome) => /^\d{2}-.+\.md$/.test(nome))
    .sort()
    .map((nome) => converterLivro(readFileSync(join(fonte, nome), 'utf8'), Number(nome.slice(0, 2))));
});

// O teste não fixa o estado de nenhum item nem de regra: a revisão do dono os muda a cada exportação.
describe('arquivo real de correções (FUN-104, FUN-105, FUN-106)', () => {
  it('FUN-104: passa na leitura e na validação contra a fonte', () => {
    expect(() => validarCorrecoes(arquivo, livros)).not.toThrow();
    expect(arquivo.itens.length).toBeGreaterThan(1000);
  });

  it('FUN-104: nenhum item é do tipo arcaico', () => {
    expect((bruto as { itens: Array<{ tipo: string }> }).itens.map((i) => i.tipo)).not.toContain('arcaico');
    expect(new Set(arquivo.itens.map((i) => i.tipo))).toEqual(new Set(['digitacao', 'ortografia', 'sentido']));
  });

  it('FUN-106: tem as três regras, cada uma com a contagem de versículos e 5 exemplos reais', () => {
    expect(arquivo.regras.map((r) => r.id)).toEqual(['R-01', 'R-02', 'R-03']);
    for (const regra of arquivo.regras) {
      expect(regra.versiculos, regra.id).toBeGreaterThan(5);
      expect(regra.exemplos, regra.id).toHaveLength(5);
      for (const e of regra.exemplos) {
        const texto = livros.find((l) => l.numero === e.ref.livro)?.capitulos[e.ref.capitulo - 1]?.[
          e.ref.versiculo - 1
        ];
        expect(texto, `${regra.id} ${e.ref.livro} ${e.ref.capitulo}:${e.ref.versiculo}`).toBeDefined();
        expect(e.antes).not.toBe(e.depois);
      }
    }
  });

  it('FUN-105: tem o item de Apocalipse 6:1 (Coreiro → Cordeiro, confiança alta, conferindo)', () => {
    const item = arquivo.itens.find((i) => i.ref.livro === 66 && i.ref.capitulo === 6 && i.ref.versiculo === 1);
    expect(item).toBeDefined();
    expect(item).toMatchObject({ tipo: 'digitacao', confianca: 'alta', confere: true });
    expect(item?.antes).toContain('Coreiro');
    expect(item?.depois).toContain('Cordeiro');
  });

  it('FUN-104: os ids são C-NNNN em sequência e a lista segue a ordem bíblica', () => {
    arquivo.itens.forEach((item, i) => expect(item.id).toBe(`C-${String(i + 1).padStart(4, '0')}`));
    const chaves = arquivo.itens.map((i) => i.ref.livro * 1e6 + i.ref.capitulo * 1e3 + i.ref.versiculo);
    expect([...chaves].sort((a, b) => a - b)).toEqual(chaves);
  });

  it('FUN-105: todo item que não confere está marcado (confere: false) e nenhum que confere perde o trecho exato', () => {
    for (const item of arquivo.itens) {
      const versiculo = livros.find((l) => l.numero === item.ref.livro)?.capitulos[item.ref.capitulo - 1]?.[
        item.ref.versiculo - 1
      ];
      const aparece = versiculo !== undefined && versiculo.split(item.antes).length === 2;
      expect(item.confere, `${item.id} ${item.ref.livro} ${item.ref.capitulo}:${item.ref.versiculo}`).toBe(aparece);
    }
  });
});
