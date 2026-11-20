import { afterEach, describe, expect, it, vi } from 'vitest';
import { criarApp } from '../app.ts';

// FUN-151 e segurança padrão de app web: os quatro cabeçalhos saem em TODA resposta da API, inclusive nas recusas da
// guarda e no erro 500. `Referrer-Policy: same-origin` (e não `no-referrer`, que faz o Chromium mandar `Origin: null`).
const APP = 'https://minhajornada-tst.ljssoftware.com.br';

function appCom(urlPublica: string | undefined) {
  const a = criarApp({ urlPublica });
  a.get('/api/ok', (c) => c.json({ ok: true }));
  a.get('/api/erro', () => {
    throw new Error('falha provocada pelo teste');
  });
  return a;
}

const app = () => appCom(APP);

function confere(resposta: Response) {
  expect(resposta.headers.get('cache-control')).toBe('no-store');
  expect(resposta.headers.get('x-content-type-options')).toBe('nosniff');
  expect(resposta.headers.get('content-security-policy')).toBe("default-src 'none'; frame-ancestors 'none'");
  expect(resposta.headers.get('referrer-policy')).toBe('same-origin');
}

afterEach(() => vi.restoreAllMocks());

describe('FUN-151: cabeçalhos em toda resposta da API', () => {
  it('FUN-151: 200 de uma rota', async () => {
    const resposta = await app().request(`${APP}/api/ok`);
    expect(resposta.status).toBe(200);
    confere(resposta);
  });

  it('FUN-151: 404 de rota desconhecida', async () => {
    const resposta = await app().request(`${APP}/api/nao-existe`);
    expect(resposta.status).toBe(404);
    confere(resposta);
  });

  it('FUN-151: 421 de Host recusado', async () => {
    const resposta = await app().request('https://outro.exemplo/api/ok');
    expect(resposta.status).toBe(421);
    confere(resposta);
  });

  it('FUN-151: 403 de origem recusada', async () => {
    const resposta = await app().request(`${APP}/api/ok`, {
      method: 'POST',
      headers: { 'sec-fetch-site': 'cross-site' },
      body: '{}',
    });
    expect(resposta.status).toBe(403);
    confere(resposta);
  });

  it('FUN-151: 500 de URL pública ausente (falha fechada)', async () => {
    const resposta = await appCom(undefined).request(`${APP}/api/ok`);
    expect(resposta.status).toBe(500);
    confere(resposta);
  });

  it('FUN-151: 500 de erro lançado numa rota', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const resposta = await app().request(`${APP}/api/erro`);
    expect(resposta.status).toBe(500);
    confere(resposta);
  });

  it('FUN-151: a resposta de HEAD também leva os cabeçalhos', async () => {
    const resposta = await app().request(`${APP}/api/ok`, { method: 'HEAD' });
    confere(resposta);
  });

  it('FUN-151: cada cabeçalho sai uma vez só, sem valor duplicado', async () => {
    const resposta = await app().request(`${APP}/api/ok`);
    expect(resposta.headers.get('x-content-type-options')).not.toContain(',');
    expect(resposta.headers.get('referrer-policy')).not.toContain(',');
  });
});
