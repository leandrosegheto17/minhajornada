import resumoGerado from './correcoes-resumo.gerado.json';
import type { ListaAplicada } from './correcoes/arquivo';

/** Resumo das correções aplicadas, gerado no build por `scripts/converter-biblia.ts` (T5). Entra no pacote principal. */
export const resumoCorrecoes: { total: number } = resumoGerado as { total: number };

/**
 * Lista completa do que foi aplicado (FUN-122, FUN-123), em pedaço separado do app (AD-017): só é pedida quando o
 * leitor abre "Correções no texto", e o service worker a guarda junto do resto (FUN-124).
 */
export async function carregarCorrecoes(): Promise<ListaAplicada> {
  const modulo = await import('./correcoes.gerado.json');
  return modulo.default as ListaAplicada;
}
