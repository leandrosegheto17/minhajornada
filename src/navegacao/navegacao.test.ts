import { describe, expect, it } from 'vitest';
import { indice } from '../biblia/indice';
import { anterior, seguinte } from './navegacao';

/** Número do livro pelo nome, no índice real gerado de `.biblia/`. */
const n = (nome: string) => {
  const livro = indice.livros.find((l) => l.nome === nome);
  if (!livro) throw new Error(`livro ${nome} não está no índice`);
  return livro.numero;
};

describe('seguinte (FUN-10, FUN-11, FUN-15)', () => {
  it('FUN-10: Salmos 26 → Salmos 27', () => {
    expect(seguinte({ livro: n('Salmos'), capitulo: 26 }, indice)).toEqual({ livro: n('Salmos'), capitulo: 27 });
  });

  it('FUN-11: Malaquias 4 → Mateus 1', () => {
    expect(seguinte({ livro: n('Malaquias'), capitulo: 4 }, indice)).toEqual({ livro: n('Mateus'), capitulo: 1 });
  });

  it('FUN-11: Obadias 1 → Jonas 1 (capítulo único)', () => {
    expect(seguinte({ livro: n('Obadias'), capitulo: 1 }, indice)).toEqual({ livro: n('Jonas'), capitulo: 1 });
  });

  it('FUN-15: Apocalipse 22 não tem seguinte (null)', () => {
    expect(seguinte({ livro: n('Apocalipse'), capitulo: 22 }, indice)).toBeNull();
  });
});

describe('anterior (FUN-12, FUN-13, FUN-14)', () => {
  it('FUN-12: Salmos 27 → Salmos 26', () => {
    expect(anterior({ livro: n('Salmos'), capitulo: 27 }, indice)).toEqual({ livro: n('Salmos'), capitulo: 26 });
  });

  it('FUN-13: Mateus 1 → Malaquias 4', () => {
    expect(anterior({ livro: n('Mateus'), capitulo: 1 }, indice)).toEqual({ livro: n('Malaquias'), capitulo: 4 });
  });

  it('FUN-13: Jonas 1 → Obadias 1 (capítulo único)', () => {
    expect(anterior({ livro: n('Jonas'), capitulo: 1 }, indice)).toEqual({ livro: n('Obadias'), capitulo: 1 });
  });

  it('FUN-14: Gênesis 1 não tem anterior (null)', () => {
    expect(anterior({ livro: n('Gênesis'), capitulo: 1 }, indice)).toBeNull();
  });
});
