import { useSyncExternalStore } from 'react';

/** Tela larga (FUN-73, FUN-74): pelo menos 900 px de largura e mais larga que alta. Qualquer outra é estreita. */
const CONSULTA = '(min-width: 900px) and (orientation: landscape)';

function disponivel(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function';
}

function assinar(avisar: () => void): () => void {
  if (!disponivel()) return () => {};
  const consulta = window.matchMedia(CONSULTA);
  consulta.addEventListener('change', avisar);
  return () => consulta.removeEventListener('change', avisar);
}

function ler(): boolean {
  return disponivel() ? window.matchMedia(CONSULTA).matches : false;
}

/** `true` na tela larga (duas páginas), `false` na estreita (uma); muda sozinho ao girar ou redimensionar. */
export function useTelaLarga(): boolean {
  return useSyncExternalStore(assinar, ler, () => false);
}
