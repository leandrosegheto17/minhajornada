import type { Segmento } from './tipos';

const ACRESCIMO = /\[([^\]]*)\]/g;

/**
 * Separa o versículo em trechos (FUN-02): o que está entre colchetes (acréscimo do tradutor) vira itálico, sem os
 * colchetes; o resto fica como está, inclusive espaços e pontuação. O resultado vira nó de texto do React (FUN-04).
 */
export function segmentar(texto: string): Segmento[] {
  const segmentos: Segmento[] = [];
  let ultimo = 0;
  for (const achado of texto.matchAll(ACRESCIMO)) {
    const inicio = achado.index ?? 0;
    if (inicio > ultimo) segmentos.push({ texto: texto.slice(ultimo, inicio), italico: false });
    segmentos.push({ texto: achado[1] ?? '', italico: true });
    ultimo = inicio + achado[0].length;
  }
  if (ultimo < texto.length) segmentos.push({ texto: texto.slice(ultimo), italico: false });
  return segmentos;
}
