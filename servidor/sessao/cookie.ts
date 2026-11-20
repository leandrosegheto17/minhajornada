import type { Context } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { tokenTemFormato } from './token.ts';

/**
 * Único lugar que conhece o cookie da sessão (reuso.md R5, FUN-138):
 * `__Host-sessao=<token>; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=2592000`, sem `Domain`.
 */
const NOME = 'sessao';
const NOME_COMPLETO = `__Host-${NOME}`;
export const MAX_AGE_SESSAO_S = 60 * 60 * 24 * 30;

const ATRIBUTOS = { prefix: 'host', httpOnly: true, secure: true, sameSite: 'Lax', path: '/' } as const;

export function definirCookieSessao(c: Context, token: string): void {
  setCookie(c, NOME, token, { ...ATRIBUTOS, maxAge: MAX_AGE_SESSAO_S });
}

export function limparCookieSessao(c: Context): void {
  deleteCookie(c, NOME, ATRIBUTOS);
}

function contarCookiesSessao(c: Context): number {
  const bruto = c.req.header('Cookie') ?? '';
  return bruto.split(';').filter((par) => par.trim().startsWith(`${NOME_COMPLETO}=`)).length;
}

/**
 * Devolve o token só se tiver o formato gerado pela API; senão `null`.
 * Cookie repetido é recusado: a API não escolhe entre dois valores.
 */
export function lerTokenSessao(c: Context): string | null {
  if (contarCookiesSessao(c) !== 1) return null;
  const token = getCookie(c, NOME, 'host');
  return token !== undefined && tokenTemFormato(token) ? token : null;
}
