/**
 * Tokens opacos de 256 bits da sessão (reuso.md R4). O banco guarda só o SHA-256 (32 bytes); o token em claro só
 * existe no cookie: nunca em log, URL de API ou resposta JSON.
 */
const FORMATO_TOKEN = /^[A-Za-z0-9_-]{43}$/;

export function gerarToken(): string {
  return paraBase64Url(crypto.getRandomValues(new Uint8Array(32)));
}

/** SHA-256 do token, no formato de `token_hash` (bytea de 32 bytes). */
export async function hashToken(token: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token)));
}

/** `true` só para o formato que a API gera (43 caracteres base64url = 32 bytes). */
export function tokenTemFormato(token: string): boolean {
  return FORMATO_TOKEN.test(token);
}

export function paraBase64Url(bytes: Uint8Array): string {
  let texto = '';
  for (const byte of bytes) texto += String.fromCharCode(byte);
  return btoa(texto).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
