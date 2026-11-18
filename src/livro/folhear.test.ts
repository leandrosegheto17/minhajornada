import { describe, expect, it } from 'vitest';
import { destinoAnterior, destinoDaCapa, destinoSeguinte, visiveis } from './folhear';

const GENESIS = 1;
const RUTE = 8;
const SAMUEL = 9;
const APOCALIPSE = 66;

const comecoDe = (livro: number) => ({
  ancora: { tipo: 'texto', ref: { livro, capitulo: 1 }, versiculo: 1 },
});

describe('visiveis (FUN-73, FUN-74)', () => {
  it('FUN-73: na tela larga, o par começa na página par (0–1, 2–3), qualquer das duas página do par vale', () => {
    expect(visiveis(0, true)).toEqual([0, 1]);
    expect(visiveis(1, true)).toEqual([0, 1]);
    expect(visiveis(2, true)).toEqual([2, 3]);
    expect(visiveis(3, true)).toEqual([2, 3]);
  });

  it('FUN-74: na tela estreita, só a página', () => {
    expect(visiveis(0, false)).toEqual([0]);
    expect(visiveis(3, false)).toEqual([3]);
  });

  it('FUN-73: número ímpar de páginas: a última fica sozinha à esquerda (com o total informado)', () => {
    expect(visiveis(4, true, 5)).toEqual([4]);
    expect(visiveis(2, true, 5)).toEqual([2, 3]);
    expect(visiveis(0, true, 1)).toEqual([0]);
  });

  it('página fora do intervalo ou inválida cai na página 0', () => {
    expect(visiveis(-3, false)).toEqual([0]);
    expect(visiveis(Number.NaN, true)).toEqual([0, 1]);
    expect(visiveis(9, false, 5)).toEqual([4]);
    expect(visiveis(9, true, 5)).toEqual([4]);
  });
});

describe('destinoSeguinte (FUN-77, FUN-81, FUN-82)', () => {
  it('FUN-77: dentro do livro, na tela estreita vai à página seguinte', () => {
    expect(destinoSeguinte(0, 5, RUTE, false)).toEqual({ pagina: 1 });
    expect(destinoSeguinte(3, 5, RUTE, false)).toEqual({ pagina: 4 });
  });

  it('FUN-77: na tela larga vai ao par seguinte (de 0–1 para 2–3, e de 1 também)', () => {
    expect(destinoSeguinte(0, 6, RUTE, true)).toEqual({ pagina: 2 });
    expect(destinoSeguinte(1, 6, RUTE, true)).toEqual({ pagina: 2 });
    expect(destinoSeguinte(2, 6, RUTE, true)).toEqual({ pagina: 4 });
  });

  it('FUN-82: na última página de Rute (estreita) vai ao versículo 1 de 1 Samuel', () => {
    expect(destinoSeguinte(4, 5, RUTE, false)).toEqual(comecoDe(SAMUEL));
  });

  it('FUN-82: na tela larga, o último par (e a última página sozinha, de total ímpar) vai ao livro seguinte', () => {
    expect(destinoSeguinte(4, 6, RUTE, true)).toEqual(comecoDe(SAMUEL));
    expect(destinoSeguinte(5, 6, RUTE, true)).toEqual(comecoDe(SAMUEL));
    expect(destinoSeguinte(4, 5, RUTE, true)).toEqual(comecoDe(SAMUEL));
  });

  it('FUN-82: livro de uma página vai direto ao livro seguinte nas duas larguras', () => {
    expect(destinoSeguinte(0, 1, 65, false)).toEqual(comecoDe(66));
    expect(destinoSeguinte(0, 1, 65, true)).toEqual(comecoDe(66));
  });

  it('FUN-81: na última página de Apocalipse não há seguinte, na estreita e na larga', () => {
    expect(destinoSeguinte(9, 10, APOCALIPSE, false)).toBeNull();
    expect(destinoSeguinte(9, 10, APOCALIPSE, true)).toBeNull();
    expect(destinoSeguinte(8, 10, APOCALIPSE, true)).toBeNull();
    expect(destinoSeguinte(8, 9, APOCALIPSE, true)).toBeNull();
    expect(destinoSeguinte(0, 1, APOCALIPSE, true)).toBeNull();
  });

  it('FUN-81: antes da última página de Apocalipse ainda há seguinte', () => {
    expect(destinoSeguinte(8, 10, APOCALIPSE, false)).toEqual({ pagina: 9 });
    expect(destinoSeguinte(6, 10, APOCALIPSE, true)).toEqual({ pagina: 8 });
  });

  it('entrada inválida (livro fora do índice, sem páginas) não segue', () => {
    expect(destinoSeguinte(0, 5, 0, false)).toBeNull();
    expect(destinoSeguinte(0, 5, 67, false)).toBeNull();
    expect(destinoSeguinte(0, 5, 1.5, false)).toBeNull();
  });

  it('total inválido (zero, negativo, NaN) conta como livro de uma página', () => {
    expect(destinoSeguinte(0, 0, RUTE, false)).toEqual(comecoDe(SAMUEL));
    expect(destinoSeguinte(0, Number.NaN, RUTE, true)).toEqual(comecoDe(SAMUEL));
  });

  it('página acima do total é tratada como a última', () => {
    expect(destinoSeguinte(99, 5, RUTE, false)).toEqual(comecoDe(SAMUEL));
  });
});

describe('destinoAnterior (FUN-78, FUN-88)', () => {
  it('FUN-78: dentro do livro, na estreita vai à página anterior; na larga, ao par anterior', () => {
    expect(destinoAnterior(3, 5, RUTE, false)).toEqual({ pagina: 2 });
    expect(destinoAnterior(4, 6, RUTE, true)).toEqual({ pagina: 2 });
    expect(destinoAnterior(3, 6, RUTE, true)).toEqual({ pagina: 0 });
    expect(destinoAnterior(2, 6, RUTE, true)).toEqual({ pagina: 0 });
  });

  it('FUN-78: na primeira página de 1 Samuel vai ao fim de Rute (a última página do livro anterior)', () => {
    expect(destinoAnterior(0, 7, SAMUEL, false)).toEqual({ ancora: { tipo: 'fim', livro: RUTE } });
    expect(destinoAnterior(0, 7, SAMUEL, true)).toEqual({ ancora: { tipo: 'fim', livro: RUTE } });
    expect(destinoAnterior(1, 7, SAMUEL, true)).toEqual({ ancora: { tipo: 'fim', livro: RUTE } });
  });

  it('FUN-88: na primeira página de Gênesis, a tela larga mostra a capa', () => {
    expect(destinoAnterior(0, 20, GENESIS, true)).toEqual({ ancora: { tipo: 'capa' } });
    expect(destinoAnterior(1, 20, GENESIS, true)).toEqual({ ancora: { tipo: 'capa' } });
  });

  it('AD-005: na primeira página de Gênesis, a tela estreita mostra o texto do plano pago (depois dele, a capa)', () => {
    expect(destinoAnterior(0, 20, GENESIS, false)).toEqual({ ancora: { tipo: 'pago' } });
  });

  it('livro de uma página volta ao livro anterior', () => {
    expect(destinoAnterior(0, 1, 66, false)).toEqual({ ancora: { tipo: 'fim', livro: 65 } });
  });

  it('entrada inválida (livro fora do índice) não volta; página acima do total é tratada como a última', () => {
    expect(destinoAnterior(0, 5, 0, false)).toBeNull();
    expect(destinoAnterior(0, 5, 67, true)).toBeNull();
    expect(destinoAnterior(99, 5, RUTE, false)).toEqual({ pagina: 3 });
    expect(destinoAnterior(-2, 5, RUTE, false)).toEqual({ ancora: { tipo: 'fim', livro: 7 } });
  });
});

describe('capa e plano pago (FUN-88, FUN-89, FUN-90, FUN-91)', () => {
  it('FUN-90: na estreita, capa → plano pago → Gênesis', () => {
    expect(destinoDaCapa('capa', 'seguinte', false)).toEqual({ ancora: { tipo: 'pago' } });
    expect(destinoDaCapa('pago', 'seguinte', false)).toEqual(comecoDe(GENESIS));
  });

  it('AD-005: na estreita, o plano pago volta à capa', () => {
    expect(destinoDaCapa('pago', 'anterior', false)).toEqual({ ancora: { tipo: 'capa' } });
  });

  it('FUN-91: a capa não tem anterior', () => {
    expect(destinoDaCapa('capa', 'anterior', false)).toBeNull();
    expect(destinoDaCapa('capa', 'anterior', true)).toBeNull();
  });

  it('FUN-89: na larga, o par plano pago | capa vai direto a Gênesis e não tem anterior', () => {
    expect(destinoDaCapa('capa', 'seguinte', true)).toEqual(comecoDe(GENESIS));
    expect(destinoDaCapa('pago', 'seguinte', true)).toEqual(comecoDe(GENESIS));
    expect(destinoDaCapa('pago', 'anterior', true)).toBeNull();
  });
});
