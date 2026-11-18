import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import type { Bloco } from './paginacao';

/** Medidas que `paginar` usa: a altura de cada bloco, a da página e a da linha (FUN-75). */
export interface Medidas {
  alturas: number[];
  alturaPagina: number;
  alturaLinha: number;
}

/** Como medir um contêiner; o teste injeta uma função, porque o jsdom não tem layout. */
export type Medir = (contenedor: HTMLElement) => Medidas;

/** Linha em px: o valor calculado pelo navegador (px), um número sem unidade (vezes a letra) ou, sem isso, 1,2 da letra. */
function linhaEmPx(valor: string, letra: number): number {
  if (valor.endsWith('px')) {
    const px = parseFloat(valor);
    if (Number.isFinite(px) && px > 0) return px;
  }
  const fator = Number(valor);
  if (valor.trim() !== '' && Number.isFinite(fator) && fator > 0) return fator * letra;
  return 1.2 * letra;
}

/**
 * Medida real no navegador. O contêiner invisível tem a largura e a altura de uma página, e cada filho é um bloco
 * (nome do livro ou versículo): lê tudo numa só passada, sem alterar o DOM entre uma leitura e outra.
 */
export function medirNoDom(contenedor: HTMLElement): Medidas {
  const estilo = getComputedStyle(contenedor);
  const letra = parseFloat(estilo.fontSize) || 16;
  return {
    alturas: Array.from(contenedor.children, (filho) => filho.getBoundingClientRect().height),
    alturaPagina: contenedor.getBoundingClientRect().height,
    alturaLinha: linhaEmPx(estilo.lineHeight, letra),
  };
}

interface Medicao {
  /** Os blocos que foram medidos: medida de outro livro nunca é entregue. */
  blocos: Bloco[];
  medidas: Medidas;
}

/**
 * Mede os blocos de um livro na largura e na letra da página (design: "useMedidas"). Quem usa renderiza os blocos
 * num contêiner invisível (`visibility: hidden`, fora do fluxo, `aria-hidden`), um filho por bloco, e liga o `ref`
 * a ele. Remede quando os blocos ou a `chave` (letra, tema) mudam e quando o `ResizeObserver` avisa outro tamanho
 * (FUN-86). `medidas` é `null` até a primeira medida e enquanto os blocos novos não foram medidos.
 */
export function useMedidas(
  blocos: Bloco[],
  chave: string | number,
  medir: Medir = medirNoDom,
): { ref: RefObject<HTMLDivElement | null>; medidas: Medidas | null } {
  const ref = useRef<HTMLDivElement | null>(null);
  const [medicao, setMedicao] = useState<Medicao | null>(null);
  const medirAtual = useRef(medir);

  useEffect(() => {
    medirAtual.current = medir;
  }, [medir]);

  // Antes da pintura, para a página nunca aparecer com a medida velha.
  useLayoutEffect(() => {
    const contenedor = ref.current;
    if (!contenedor) return;
    setMedicao({ blocos, medidas: medir(contenedor) });
  }, [blocos, chave, medir]);

  useEffect(() => {
    const contenedor = ref.current;
    if (!contenedor || typeof ResizeObserver === 'undefined') return;
    let ultimo: string | null = null;
    const observador = new ResizeObserver((entradas) => {
      const entrada = entradas[entradas.length - 1];
      if (!entrada) return;
      const tamanho = `${entrada.contentRect.width}x${entrada.contentRect.height}`;
      // O primeiro aviso é o tamanho de agora, que já foi medido; só outro tamanho remede.
      const mudou = ultimo !== null && tamanho !== ultimo;
      ultimo = tamanho;
      if (mudou) setMedicao({ blocos, medidas: medirAtual.current(contenedor) });
    });
    observador.observe(contenedor);
    return () => observador.disconnect();
  }, [blocos]);

  return { ref, medidas: medicao && medicao.blocos === blocos ? medicao.medidas : null };
}
