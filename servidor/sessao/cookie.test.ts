import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import { definirCookieSessao, lerTokenSessao, limparCookieSessao, MAX_AGE_SESSAO_S } from './cookie.ts';
import { gerarToken } from './token.ts';

const URL_BASE = 'https://minhajornada.ljssoftware.com.br';

function appDoCookie() {
  const app = new Hono();
  app.get('/definir', (c) => {
    definirCookieSessao(c, 'T'.repeat(43));
    return c.body(null, 204);
  });
  app.get('/limpar', (c) => {
    limparCookieSessao(c);
    return c.body(null, 204);
  });
  app.get('/ler', (c) => c.json({ token: lerTokenSessao(c) }));
  return app;
}

const ler = async (cookie?: string) => {
  const r = await appDoCookie().request(`${URL_BASE}/ler`, { headers: cookie === undefined ? {} : { cookie } });
  return ((await r.json()) as { token: string | null }).token;
};

describe('cookie da sessão (FUN-138)', () => {
  it('FUN-138: __Host-sessao com HttpOnly, Secure, SameSite=Lax, Path=/ e Max-Age de 30 dias, sem Domain', async () => {
    const r = await appDoCookie().request(`${URL_BASE}/definir`);
    const cookie = r.headers.get('set-cookie') ?? '';
    expect(cookie).toMatch(/^__Host-sessao=T{43};/);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Secure');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toContain('Path=/');
    expect(cookie).toContain(`Max-Age=${60 * 60 * 24 * 30}`);
    expect(MAX_AGE_SESSAO_S).toBe(2_592_000);
    expect(cookie).not.toMatch(/Domain=/i);
  });

  it('FUN-138: o cookie de expirar tem o mesmo nome e Max-Age=0', async () => {
    const cookie = (await appDoCookie().request(`${URL_BASE}/limpar`)).headers.get('set-cookie') ?? '';
    expect(cookie).toMatch(/^__Host-sessao=;/);
    expect(cookie).toContain('Max-Age=0');
    expect(cookie).toContain('Path=/');
    expect(cookie).toContain('Secure');
  });

  it('FUN-141: lê o token de um cookie válido, também entre outros cookies', async () => {
    const token = gerarToken();
    expect(await ler(`__Host-sessao=${token}`)).toBe(token);
    expect(await ler(`a=1; __Host-sessao=${token}; b=2`)).toBe(token);
  });

  it('FUN-141: sem cookie, devolve null', async () => {
    expect(await ler()).toBeNull();
    expect(await ler('a=1')).toBeNull();
  });

  it('FUN-141: cookie repetido devolve null, mesmo com os dois valores válidos', async () => {
    expect(await ler(`__Host-sessao=${gerarToken()}; __Host-sessao=${gerarToken()}`)).toBeNull();
  });

  it.each([
    ['curto', 'abc'],
    ['longo', 'a'.repeat(44)],
    ['caractere fora do base64url', 'a'.repeat(42) + '+'],
    ['vazio', ''],
  ])('FUN-141: cookie fora do formato (%s) devolve null', async (_nome, valor) => {
    expect(await ler(`__Host-sessao=${valor}`)).toBeNull();
  });

  it('FUN-141: cookie sem o prefixo __Host- não vale', async () => {
    expect(await ler(`sessao=${gerarToken()}`)).toBeNull();
  });
});
