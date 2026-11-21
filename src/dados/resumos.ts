import { lerResumoJson } from '../resumos/formato';
import type { Resumo } from '../resumos/formato';

/**
 * Busca do resumo de um livro (FUN-145, FUN-167, FUN-168; design: `buscarResumo`). Nunca lança e nunca guarda nada no
 * aparelho: o texto só existe em memória (FUN-152, FUN-176). O `Cache-Control: no-store` do servidor e o `cache:
 * 'no-store'` do pedido impedem o cache do navegador.
 */
export type BuscaResumo =
  { situacao: 'pronto'; resumo: Resumo } | { situacao: 'semResumo' } | { situacao: 'semSessao' } | { situacao: 'erro' };

export async function buscarResumo(livro: number): Promise<BuscaResumo> {
  try {
    const resposta = await fetch(`/api/resumos/${livro}`, { credentials: 'same-origin', cache: 'no-store' });
    if (resposta.status === 401) return { situacao: 'semSessao' };
    if (resposta.status === 404) return { situacao: 'semResumo' };
    if (resposta.status !== 200) return { situacao: 'erro' };
    const resumo = lerResumoJson(await resposta.json());
    return resumo.livro === livro ? { situacao: 'pronto', resumo } : { situacao: 'erro' };
  } catch {
    return { situacao: 'erro' };
  }
}
