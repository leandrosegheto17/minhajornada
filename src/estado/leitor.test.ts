import { describe, expect, it } from 'vitest';
import { indice } from '../biblia/indice';
import { ESTADO_INICIAL, reduzirLeitor, type AcaoLeitor, type EstadoLeitor } from './leitor';

/** Número do livro pelo nome, no índice real gerado de `.biblia/`. */
const n = (nome: string) => {
  const livro = indice.livros.find((l) => l.nome === nome);
  if (!livro) throw new Error(`livro ${nome} não está no índice`);
  return livro.numero;
};

const aplicar = (estado: EstadoLeitor, ...acoes: AcaoLeitor[]) =>
  acoes.reduce((atual, acao) => reduzirLeitor(atual, acao, indice), estado);

const iniciar = (ref: EstadoLeitor['ref'], letra = 3): AcaoLeitor => ({ tipo: 'iniciar', ref, letra, tema: null });

const noLeitor = (livro: string, capitulo: number) => aplicar(ESTADO_INICIAL, iniciar({ livro: n(livro), capitulo }));

describe('iniciar (FUN-20, FUN-21, FUN-22)', () => {
  it('FUN-20: com Ref válida, abre o leitor nela', () => {
    const estado = aplicar(ESTADO_INICIAL, iniciar({ livro: n('Romanos'), capitulo: 8 }));
    expect(estado.tela).toBe('leitor');
    expect(estado.ref).toEqual({ livro: n('Romanos'), capitulo: 8 });
  });

  it('FUN-21: sem Ref, abre a escolha de livro', () => {
    const estado = aplicar(ESTADO_INICIAL, iniciar(null));
    expect(estado.tela).toBe('livros');
    expect(estado.ref).toBeNull();
  });

  it('FUN-22: Ref fora do índice (Judas 2) abre a escolha de livro', () => {
    const estado = aplicar(ESTADO_INICIAL, iniciar({ livro: n('Judas'), capitulo: 2 }));
    expect(estado.tela).toBe('livros');
    expect(estado.ref).toBeNull();
  });

  it('FUN-23: letra inválida na inicialização vira 3; a válida é mantida', () => {
    expect(aplicar(ESTADO_INICIAL, iniciar(null, 9)).letra).toBe(3);
    expect(aplicar(ESTADO_INICIAL, iniciar(null, 5)).letra).toBe(5);
  });

  it('o tema gravado é mantido; sem tema, segue o sistema (null)', () => {
    expect(aplicar(ESTADO_INICIAL, { tipo: 'iniciar', ref: null, letra: 3, tema: 'sepia' }).tema).toBe('sepia');
    expect(aplicar(ESTADO_INICIAL, iniciar(null)).tema).toBeNull();
  });
});

describe('escolher livro e capítulo (FUN-07, FUN-08, FUN-09)', () => {
  it('FUN-09: escolher Judas (capítulo único) abre o leitor em Judas 1, sem a grade', () => {
    const estado = aplicar(ESTADO_INICIAL, iniciar(null), { tipo: 'escolherLivro', livro: n('Judas') });
    expect(estado.tela).toBe('leitor');
    expect(estado.ref).toEqual({ livro: n('Judas'), capitulo: 1 });
  });

  it('FUN-07: escolher Salmos abre a grade de Salmos', () => {
    const estado = aplicar(ESTADO_INICIAL, iniciar(null), { tipo: 'escolherLivro', livro: n('Salmos') });
    expect(estado.tela).toBe('capitulos');
    expect(estado.livroGrade).toBe(n('Salmos'));
    expect(estado.ref).toBeNull();
  });

  it('FUN-08: escolher o 27 na grade abre Salmos 27', () => {
    const estado = aplicar(
      ESTADO_INICIAL,
      iniciar(null),
      { tipo: 'escolherLivro', livro: n('Salmos') },
      { tipo: 'abrirCapitulo', ref: { livro: n('Salmos'), capitulo: 27 } },
    );
    expect(estado.tela).toBe('leitor');
    expect(estado.ref).toEqual({ livro: n('Salmos'), capitulo: 27 });
  });

  it('livro fora do índice (0 e 67) não muda o estado', () => {
    const antes = aplicar(ESTADO_INICIAL, iniciar(null));
    expect(reduzirLeitor(antes, { tipo: 'escolherLivro', livro: 0 }, indice)).toBe(antes);
    expect(reduzirLeitor(antes, { tipo: 'escolherLivro', livro: 67 }, indice)).toBe(antes);
  });

  it('capítulo fora do intervalo (Salmos 151) não muda o estado', () => {
    const antes = aplicar(ESTADO_INICIAL, iniciar(null), { tipo: 'escolherLivro', livro: n('Salmos') });
    expect(reduzirLeitor(antes, { tipo: 'abrirCapitulo', ref: { livro: n('Salmos'), capitulo: 151 } }, indice)).toBe(
      antes,
    );
  });
});

describe('título e trocar livro (FUN-49, FUN-50, FUN-06)', () => {
  it('FUN-49: tocar no título em Salmos 27 abre a grade de Salmos', () => {
    const estado = aplicar(noLeitor('Salmos', 27), { tipo: 'tocarTitulo' });
    expect(estado.tela).toBe('capitulos');
    expect(estado.livroGrade).toBe(n('Salmos'));
    expect(estado.ref).toEqual({ livro: n('Salmos'), capitulo: 27 });
  });

  it('FUN-50: tocar no título em Filemom 1 (capítulo único) abre a escolha de livro', () => {
    const estado = aplicar(noLeitor('Filemom', 1), { tipo: 'tocarTitulo' });
    expect(estado.tela).toBe('livros');
  });

  it('FUN-49: "Trocar livro" na grade abre a escolha de livro', () => {
    const estado = aplicar(noLeitor('Salmos', 27), { tipo: 'tocarTitulo' }, { tipo: 'trocarLivro' });
    expect(estado.tela).toBe('livros');
    expect(estado.livroGrade).toBeNull();
  });

  it('tocar no título sem capítulo aberto não muda o estado', () => {
    const antes = aplicar(ESTADO_INICIAL, iniciar(null));
    expect(reduzirLeitor(antes, { tipo: 'tocarTitulo' }, indice)).toBe(antes);
  });
});

describe('seguinte e anterior (FUN-10 a FUN-15)', () => {
  it('FUN-10: seguinte em Salmos 26 abre Salmos 27', () => {
    expect(aplicar(noLeitor('Salmos', 26), { tipo: 'seguinte' }).ref).toEqual({ livro: n('Salmos'), capitulo: 27 });
  });

  it('FUN-13: anterior em Mateus 1 abre Malaquias 4', () => {
    expect(aplicar(noLeitor('Mateus', 1), { tipo: 'anterior' }).ref).toEqual({ livro: n('Malaquias'), capitulo: 4 });
  });

  it('FUN-15: seguinte em Apocalipse 22 não muda o estado', () => {
    const antes = noLeitor('Apocalipse', 22);
    expect(reduzirLeitor(antes, { tipo: 'seguinte' }, indice)).toBe(antes);
  });

  it('FUN-14: anterior em Gênesis 1 não muda o estado', () => {
    const antes = noLeitor('Gênesis', 1);
    expect(reduzirLeitor(antes, { tipo: 'anterior' }, indice)).toBe(antes);
  });
});

describe('letra (FUN-23 a FUN-27)', () => {
  it('FUN-23: a letra começa em 3', () => {
    expect(ESTADO_INICIAL.letra).toBe(3);
  });

  it('FUN-24/FUN-26: +1 vai até 5 e para', () => {
    const mais: AcaoLeitor = { tipo: 'mudarLetra', delta: 1 };
    expect(aplicar(ESTADO_INICIAL, mais).letra).toBe(4);
    const no5 = aplicar(ESTADO_INICIAL, mais, mais);
    expect(no5.letra).toBe(5);
    expect(reduzirLeitor(no5, mais, indice)).toBe(no5);
  });

  it('FUN-25/FUN-27: -1 vai até 1 e para', () => {
    const menos: AcaoLeitor = { tipo: 'mudarLetra', delta: -1 };
    expect(aplicar(ESTADO_INICIAL, menos).letra).toBe(2);
    const no1 = aplicar(ESTADO_INICIAL, menos, menos);
    expect(no1.letra).toBe(1);
    expect(reduzirLeitor(no1, menos, indice)).toBe(no1);
  });
});

describe('tema (FUN-28)', () => {
  it('FUN-28: escolher sépia guarda o tema', () => {
    expect(aplicar(ESTADO_INICIAL, { tipo: 'escolherTema', tema: 'sepia' }).tema).toBe('sepia');
  });
});

describe('irPara', () => {
  it('abre o Sobre a partir do leitor e volta ao mesmo capítulo', () => {
    const sobre = aplicar(noLeitor('Romanos', 8), { tipo: 'irPara', tela: 'sobre' });
    expect(sobre.tela).toBe('sobre');
    const volta = aplicar(sobre, { tipo: 'irPara', tela: 'leitor' });
    expect(volta.tela).toBe('leitor');
    expect(volta.ref).toEqual({ livro: n('Romanos'), capitulo: 8 });
  });

  it('não abre o leitor sem capítulo', () => {
    const antes = aplicar(ESTADO_INICIAL, iniciar(null));
    expect(reduzirLeitor(antes, { tipo: 'irPara', tela: 'leitor' }, indice)).toBe(antes);
  });
});
