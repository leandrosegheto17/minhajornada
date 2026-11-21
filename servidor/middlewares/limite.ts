import type { MiddlewareHandler } from 'hono';
import type { Deps } from '../deps.ts';

/**
 * Limite de tentativas de login (FUN-140; reuso.md R12): 5 por minuto por IP, no binding `ratelimits` do Cloudflare.
 * A chave vem de `CF-Connecting-IP`, que só o Cloudflare preenche; sem ele, as tentativas dividem a chave `sem-ip`.
 * Falha fechada (AD-022): binding ausente ou que lança responde 503, e a tentativa nunca passa por falha do limite.
 */
export function limiteEntrar(deps: Deps): MiddlewareHandler {
  return async (c, next) => {
    const limite = deps.limiteEntrar;
    if (!limite) return c.json({ erro: 'limite_indisponivel' }, 503);

    const ip = c.req.header('cf-connecting-ip')?.trim();
    const chave = `entrar:${ip ? ip : 'sem-ip'}`;
    let permitido: boolean;
    try {
      permitido = (await limite.limit({ key: chave })).success;
    } catch {
      return c.json({ erro: 'limite_indisponivel' }, 503);
    }
    if (!permitido) {
      c.header('Retry-After', '60');
      return c.json({ erro: 'limite' }, 429);
    }
    await next();
  };
}
