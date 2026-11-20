import type { MiddlewareHandler } from 'hono';
import { routePath } from 'hono/route';
import type { Deps } from '../deps.ts';

/**
 * Uma linha por requisição, `MÉTODO rota status` (T15). A rota é o modelo registrado (`/api/resumos/:n`), nunca o
 * caminho pedido; rota desconhecida vira `/api/*`. Nunca corpo, cookie, e-mail, token nem texto, e a mensagem de um erro
 * inesperado também não entra: pode carregar dado do banco.
 */
export function logRequisicao(deps: Deps): MiddlewareHandler {
  return async (c, next) => {
    await next();
    deps.log?.(`${c.req.method} ${routePath(c)} ${c.res.status}`);
  };
}
