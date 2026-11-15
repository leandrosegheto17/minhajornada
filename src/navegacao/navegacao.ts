import type { Indice, Ref } from '../biblia/tipos';

function capitulosDo(livro: number, indice: Indice): number | null {
  return indice.livros[livro - 1]?.capitulos ?? null;
}

/**
 * Capítulo seguinte (FUN-10, FUN-11, FUN-15): o próximo do mesmo livro; no último, o capítulo 1 do livro seguinte;
 * em Apocalipse 22 (fim do índice), `null`, e o botão fica desativado.
 */
export function seguinte(ref: Ref, indice: Indice): Ref | null {
  const total = capitulosDo(ref.livro, indice);
  if (total === null) return null;
  if (ref.capitulo < total) return { livro: ref.livro, capitulo: ref.capitulo + 1 };
  if (ref.livro < indice.livros.length) return { livro: ref.livro + 1, capitulo: 1 };
  return null;
}

/**
 * Capítulo anterior (FUN-12, FUN-13, FUN-14): o anterior do mesmo livro; no capítulo 1, o último do livro anterior;
 * em Gênesis 1, `null`, e o botão fica desativado.
 */
export function anterior(ref: Ref, indice: Indice): Ref | null {
  if (capitulosDo(ref.livro, indice) === null) return null;
  if (ref.capitulo > 1) return { livro: ref.livro, capitulo: ref.capitulo - 1 };
  const totalAnterior = capitulosDo(ref.livro - 1, indice);
  if (totalAnterior === null) return null;
  return { livro: ref.livro - 1, capitulo: totalAnterior };
}
