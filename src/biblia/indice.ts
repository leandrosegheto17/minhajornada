import gerado from './indice.gerado.json';
import type { Indice } from './tipos';

/** Índice dos 66 livros, gerado no build por `scripts/converter-biblia.ts` (T2). */
export const indice: Indice = gerado as Indice;
