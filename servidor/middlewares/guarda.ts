import type { MiddlewareHandler } from 'hono';
import type { Deps } from '../deps.ts';

function recusa(status: 403 | 421 | 500, erro: 'origem' | 'host' | 'configuracao'): Response {
  return Response.json({ erro }, { status });
}

/**
 * Guarda de Host e de origem da API (segurança padrão de app web; reuso.md R9). Devolve a resposta de recusa, ou `null`
 * quando a requisição pode seguir.
 *
 * - URL pública ausente ou ilegível: 500 em tudo (falha fechada).
 * - `Host` diferente do host da URL pública, em qualquer método: 421 (contra DNS rebinding).
 * - Método fora de GET e HEAD: 403 com `Sec-Fetch-Site` presente e fora de `same-origin` e `none`, ou com `Origin`
 *   presente (inclusive `null` e vazio) diferente da origem da URL pública. Cliente sem nenhum dos dois cabeçalhos
 *   (não é navegador) segue: o que o protege é a sessão.
 * Toda comparação ignora maiúsculas.
 */
export function recusaDaRequisicao(req: Request, urlPublica: string | undefined): Response | null {
  let publica: URL;
  try {
    publica = new URL(urlPublica ?? '');
  } catch {
    return recusa(500, 'configuracao');
  }

  const hostRecebido = (req.headers.get('host') ?? new URL(req.url).host).toLowerCase();
  if (hostRecebido !== publica.host.toLowerCase()) return recusa(421, 'host');

  const metodo = req.method.toUpperCase();
  if (metodo === 'GET' || metodo === 'HEAD') return null;

  const fetchSite = req.headers.get('sec-fetch-site');
  if (fetchSite !== null) {
    const valor = fetchSite.toLowerCase();
    if (valor !== 'same-origin' && valor !== 'none') return recusa(403, 'origem');
  }

  const origin = req.headers.get('origin');
  if (origin !== null && origin.toLowerCase() !== publica.origin.toLowerCase()) return recusa(403, 'origem');

  return null;
}

/** A guarda como middleware de `/api/*`: a recusa encerra a requisição antes de qualquer rota. */
export function guarda(deps: Deps): MiddlewareHandler {
  return async (c, next) => {
    const recusada = recusaDaRequisicao(c.req.raw, deps.urlPublica);
    if (recusada) return recusada;
    await next();
  };
}
