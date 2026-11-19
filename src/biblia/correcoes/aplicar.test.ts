import { describe, expect, it } from 'vitest';
import type { ArquivoCorrecoes, IdRegra } from './arquivo';
import { aplicarCorrecoes } from './aplicar';
import { arquivo, item, livrosFicticios, livrosReais, regra } from './apoio-teste';
import { REGRAS } from './regras';

const V = (livro: number, capitulo: number, versiculo: number) => ({ livro, capitulo, versiculo });
const texto = (livros: ReturnType<typeof livrosFicticios>, l: number, c: number, v: number) =>
  livros[l - 1]?.capitulos[c - 1]?.[v - 1];
const aplicar = (a: ArquivoCorrecoes) => aplicarCorrecoes(livrosFicticios(), a);
// Gênesis 1:2 = 'A terra era sem forma e vazia, e o Coreiro abriu o livro.'
// Gênesis 2:1 = 'Rute disse ,vem.'   Êxodo 1:1 = 'Assim falou o SENHOR : vem.'

describe('aplicarCorrecoes: só as aprovadas mudam o texto (FUN-114)', () => {
  it('FUN-114: item aprovado troca o "antes" pelo "depois"', () => {
    const { livros } = aplicar(arquivo([item({ estado: 'aprovada' })]));
    expect(texto(livros, 1, 1, 2)).toBe('A terra era sem forma e vazia, e o Cordeiro abriu o livro.');
  });

  it.each(['proposta', 'recusada'] as const)('FUN-114: item %s não muda o texto', (estado) => {
    const { livros, aplicadas } = aplicar(arquivo([item({ estado })]));
    expect(livros).toEqual(livrosFicticios());
    expect(aplicadas.itens).toEqual([]);
  });

  it.each(['proposta', 'recusada'] as const)('FUN-114: regra %s não muda o texto nem entra na lista', (estado) => {
    const { livros, aplicadas } = aplicar(arquivo([], [regra('R-01', { estado }), regra('R-02', { estado })]));
    expect(livros).toEqual(livrosFicticios());
    expect(aplicadas.regras).toEqual([]);
  });

  it('FUN-114: regra aprovada muda o texto', () => {
    const { livros } = aplicar(arquivo([], [regra('R-01', { estado: 'aprovada' })]));
    expect(texto(livros, 2, 1, 1)).toBe('Assim falou o SENHOR: vem.');
  });
});

describe('aplicarCorrecoes: vários itens e ordem (FUN-114, FUN-127)', () => {
  it('FUN-127: dois itens no mesmo versículo, em trechos separados, entram os dois, em qualquer ordem do arquivo', () => {
    const a = item({ id: 'C-0001', estado: 'aprovada', antes: 'forma', depois: 'fôrma' });
    const b = item({ id: 'C-0002', estado: 'aprovada', antes: 'Coreiro', depois: 'Cordeiro' });
    const esperado = 'A terra era sem fôrma e vazia, e o Cordeiro abriu o livro.';
    expect(texto(aplicar(arquivo([a, b])).livros, 1, 1, 2)).toBe(esperado);
    expect(texto(aplicar(arquivo([b, a])).livros, 1, 1, 2)).toBe(esperado);
  });

  it('FUN-127: item primeiro, regra depois, e o resultado é o mesmo em duas execuções', () => {
    // O "antes" do item tem o espaço errado: se a regra rodasse primeiro, o trecho não casaria mais.
    const itemComEspaco = item({
      estado: 'aprovada',
      ref: V(1, 2, 1),
      antes: 'Rute disse ,vem',
      depois: 'Ruth disse, vem',
    });
    const entrada = arquivo(
      [itemComEspaco],
      [regra('R-01', { estado: 'aprovada' }), regra('R-02', { estado: 'aprovada' })],
    );
    const primeira = aplicar(entrada);
    const segunda = aplicar(entrada);
    expect(texto(primeira.livros, 1, 2, 1)).toBe('Ruth disse, vem.');
    expect(segunda.livros).toEqual(primeira.livros);
    expect(segunda.aplicadas).toEqual(primeira.aplicadas);
  });

  it('FUN-127: as regras rodam na ordem R-01, R-02, R-03 mesmo que o arquivo as liste em outra', () => {
    const emOrdem = arquivo([], [regra('R-01', { estado: 'aprovada' }), regra('R-02', { estado: 'aprovada' })]);
    const emDesordem = arquivo([], [regra('R-02', { estado: 'aprovada' }), regra('R-01', { estado: 'aprovada' })]);
    expect(texto(aplicar(emDesordem).livros, 1, 2, 1)).toBe('Rute disse, vem.');
    expect(aplicar(emDesordem).livros).toEqual(aplicar(emOrdem).livros);
  });

  it('FUN-114: "antes" que não confere é recusado em vez de gravar texto errado', () => {
    expect(() => aplicar(arquivo([item({ estado: 'aprovada', antes: 'inexistente' })]))).toThrow(
      'correção C-0001 não confere com Gênesis 1:2',
    );
  });
});

describe('aplicarCorrecoes: a lista do que foi aplicado (FUN-122, FUN-123)', () => {
  const tres = (estado: 'aprovada' | 'proposta') =>
    (['R-01', 'R-02', 'R-03'] as IdRegra[]).map((id) => regra(id, { estado }));

  it('FUN-123: cada regra aprovada traz os versículos que ela mudou neste build, e a que não mudou nenhum traz 0', () => {
    const { aplicadas } = aplicar(arquivo([], tres('aprovada')));
    const descricao = (id: IdRegra) => REGRAS.find((r) => r.id === id)?.descricao;
    expect(aplicadas.regras).toEqual([
      { id: 'R-01', descricao: descricao('R-01'), versiculos: 2 },
      { id: 'R-02', descricao: descricao('R-02'), versiculos: 1 },
      { id: 'R-03', descricao: descricao('R-03'), versiculos: 0 },
    ]);
  });

  it('FUN-123: só as regras aprovadas aparecem', () => {
    const regras = [regra('R-01', { estado: 'aprovada' }), regra('R-02', { estado: 'proposta' })];
    expect(aplicar(arquivo([], regras)).aplicadas.regras.map((r) => r.id)).toEqual(['R-01']);
  });

  it('FUN-122: os itens saem em ordem bíblica, com referência, antes, depois e motivo, só os aprovados', () => {
    const itens = [
      item({ id: 'C-0003', estado: 'aprovada', ref: V(2, 1, 2), antes: 'saiu', depois: 'partiu', motivo: 'm3' }),
      item({ id: 'C-0001', estado: 'aprovada', ref: V(1, 2, 1), antes: 'Rute', depois: 'Ruth', motivo: 'm1' }),
      item({ id: 'C-0002', estado: 'aprovada', ref: V(1, 1, 2), motivo: 'm2' }),
      item({ id: 'C-0004', estado: 'proposta', ref: V(1, 1, 1), antes: 'Deus', depois: 'Deus' }),
    ];
    expect(aplicar(arquivo(itens)).aplicadas.itens).toEqual([
      { ref: V(1, 1, 2), antes: 'Coreiro', depois: 'Cordeiro', motivo: 'm2' },
      { ref: V(1, 2, 1), antes: 'Rute', depois: 'Ruth', motivo: 'm1' },
      { ref: V(2, 1, 2), antes: 'saiu', depois: 'partiu', motivo: 'm3' },
    ]);
  });

  it('FUN-122: dois itens do mesmo versículo saem na ordem do identificador', () => {
    const b = item({ id: 'C-0002', estado: 'aprovada', antes: 'Coreiro', depois: 'Cordeiro' });
    const a = item({ id: 'C-0001', estado: 'aprovada', antes: 'forma', depois: 'fôrma' });
    expect(aplicar(arquivo([b, a])).aplicadas.itens.map((i) => i.antes)).toEqual(['forma', 'Coreiro']);
  });
});

describe('aplicarCorrecoes: a forma do texto não muda (FUN-117)', () => {
  it('FUN-117: a entrada não é modificada', () => {
    const entrada = livrosFicticios();
    const copia = structuredClone(entrada);
    aplicarCorrecoes(entrada, arquivo([item({ estado: 'aprovada' })], [regra('R-01', { estado: 'aprovada' })]));
    expect(entrada).toEqual(copia);
  });

  it('FUN-117: o livro devolvido mantém as mesmas chaves, na mesma ordem (o hash depende dela)', () => {
    const { livros } = aplicar(arquivo([item({ estado: 'aprovada' })]));
    for (const livro of livros) expect(Object.keys(livro)).toEqual(['numero', 'nome', 'capitulos']);
  });

  it('FUN-117: livro sem correção volta com o mesmo conteúdo', () => {
    const { livros } = aplicar(arquivo([item({ estado: 'aprovada' })]));
    expect(livros[1]).toEqual(livrosFicticios()[1]);
  });

  it('FUN-117: as três regras sobre os 66 livros mantêm livros, capítulos, 31.102 versículos e colchetes em pares', () => {
    const reais = livrosReais();
    const todas = arquivo(
      [],
      (['R-01', 'R-02', 'R-03'] as IdRegra[]).map((id) => regra(id, { estado: 'aprovada' })),
    );
    const { livros } = aplicarCorrecoes(reais, todas);
    expect(livros).toHaveLength(66);
    expect(livros.map((l) => [l.numero, l.nome, l.capitulos.length])).toEqual(
      reais.map((l) => [l.numero, l.nome, l.capitulos.length]),
    );
    let total = 0;
    livros.forEach((livro, i) => {
      livro.capitulos.forEach((versiculos, c) => {
        expect(versiculos).toHaveLength(reais[i]?.capitulos[c]?.length ?? -1);
        for (const [v, depois] of versiculos.entries()) {
          total++;
          const antes = reais[i]?.capitulos[c]?.[v] ?? '';
          expect(depois.match(/\[/g)?.length ?? 0).toBe(antes.match(/\[/g)?.length ?? 0);
          expect(depois.match(/\]/g)?.length ?? 0).toBe(antes.match(/\]/g)?.length ?? 0);
        }
      });
    });
    expect(total).toBe(31102);
  });
});
