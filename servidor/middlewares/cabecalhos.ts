import type { MiddlewareHandler } from 'hono';

/**
 * Cabeçalhos de segurança de toda resposta da API (FUN-151; reuso.md R11). O `_headers` dos assets não vale para o
 * script do Worker, então a API os põe aqui. `same-origin` e não `no-referrer`: este faz o Chromium enviar `Origin: null`.
 */
const CABECALHOS_DA_API: Record<string, string> = {
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
  'content-security-policy': "default-src 'none'; frame-ancestors 'none'",
  'referrer-policy': 'same-origin',
};

/** Primeiro middleware de `/api/*`: depois da resposta (de rota, de recusa da guarda ou de erro), põe os quatro cabeçalhos. */
export function cabecalhos(): MiddlewareHandler {
  return async (c, next) => {
    await next();
    for (const [nome, valor] of Object.entries(CABECALHOS_DA_API)) c.res.headers.set(nome, valor);
  };
}
