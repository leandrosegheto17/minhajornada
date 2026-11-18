import { indice as indiceGerado } from '../biblia/indice';
import type { Indice } from '../biblia/tipos';
import type { Ancora } from '../estado/leitor';

/**
 * Folhear o livro (design: "Folhear"): funções puras que dizem que páginas aparecem e para onde vão "seguinte" e
 * "anterior". Páginas são índices de 0 a `total - 1` do livro aberto; as bordas do livro viram uma âncora.
 */

/** Para onde ir: outra página do mesmo livro, uma âncora (outro livro, a capa, o plano pago) ou lugar nenhum. */
export type Destino = { pagina: number } | { ancora: Ancora } | null;

/** Número de páginas utilizável: inteiro de pelo menos 1 (qualquer outro valor conta como livro de uma página). */
function totalUtil(total: number): number {
  return Number.isFinite(total) && total >= 1 ? Math.floor(total) : 1;
}

/** Página dentro do intervalo `0..total-1`; página inválida cai na 0. */
function paginaUtil(pagina: number, total: number): number {
  if (!Number.isFinite(pagina)) return 0;
  return Math.min(Math.max(Math.floor(pagina), 0), total - 1);
}

/**
 * Páginas visíveis (FUN-73, FUN-74): na tela larga, o par que começa na página par (as duas páginas do par dão o
 * mesmo resultado); na estreita, só a página. Com `total`, a página que não existe fica de fora (a última de um
 * livro de número ímpar de páginas aparece sozinha).
 */
export function visiveis(pagina: number, larga: boolean, total?: number): number[] {
  const limite = total === undefined ? Number.POSITIVE_INFINITY : totalUtil(total);
  const atual = paginaUtil(pagina, Math.min(limite, Number.MAX_SAFE_INTEGER));
  const primeira = larga ? atual - (atual % 2) : atual;
  const paginas = larga ? [primeira, primeira + 1] : [primeira];
  return paginas.filter((p) => p < limite);
}

const comecoDoLivro = (livro: number): Destino => ({
  ancora: { tipo: 'texto', ref: { livro, capitulo: 1 }, versiculo: 1 },
});

const livroValido = (livro: number, indice: Indice) =>
  Number.isInteger(livro) && livro >= 1 && livro <= indice.livros.length;

/**
 * "Seguinte" a partir da página `atual` de um livro com `total` páginas (FUN-77, FUN-81, FUN-82): a página (ou o par)
 * seguinte; na última, o versículo 1 do livro seguinte; em Apocalipse, `null`.
 */
export function destinoSeguinte(
  atual: number,
  total: number,
  livro: number,
  larga: boolean,
  indice: Indice = indiceGerado,
): Destino {
  if (!livroValido(livro, indice)) return null;
  const paginas = totalUtil(total);
  const pagina = paginaUtil(atual, paginas);
  const proxima = larga ? pagina - (pagina % 2) + 2 : pagina + 1;
  if (proxima < paginas) return { pagina: proxima };
  if (livro >= indice.livros.length) return null;
  return comecoDoLivro(livro + 1);
}

/**
 * "Anterior" (FUN-78, FUN-88, AD-005): a página (ou o par) anterior; na primeira, o fim do livro anterior; em Gênesis,
 * a capa na tela larga e o texto do plano pago na estreita (que volta à capa pelo `destinoDaCapa`).
 */
export function destinoAnterior(
  atual: number,
  total: number,
  livro: number,
  larga: boolean,
  indice: Indice = indiceGerado,
): Destino {
  if (!livroValido(livro, indice)) return null;
  const pagina = paginaUtil(atual, totalUtil(total));
  const anterior = larga ? pagina - (pagina % 2) - 2 : pagina - 1;
  if (anterior >= 0) return { pagina: anterior };
  if (livro === 1) return { ancora: larga ? { tipo: 'capa' } : { tipo: 'pago' } };
  return { ancora: { tipo: 'fim', livro: livro - 1 } };
}

/**
 * Passar página a partir da capa ou do texto do plano pago (FUN-89 a FUN-91, AD-005). Na tela larga os dois formam um
 * par (plano pago | capa): "seguinte" vai a Gênesis e não há "anterior". Na estreita: capa → plano pago → Gênesis,
 * e de volta; a capa não tem "anterior".
 */
export function destinoDaCapa(lugar: 'capa' | 'pago', sentido: 'seguinte' | 'anterior', larga: boolean): Destino {
  if (sentido === 'seguinte') {
    if (!larga && lugar === 'capa') return { ancora: { tipo: 'pago' } };
    return comecoDoLivro(1);
  }
  if (larga || lugar === 'capa') return null;
  return { ancora: { tipo: 'capa' } };
}
