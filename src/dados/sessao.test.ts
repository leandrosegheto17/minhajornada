import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CHAVES, donoNoAparelho, lembrarDono } from './preferencias';
import { entrar, lerSessao, sair } from './sessao';

let fetchDuble: ReturnType<typeof vi.fn>;

const json = (status: number, corpo: unknown) =>
  new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } });

beforeEach(() => {
  localStorage.clear();
  fetchDuble = vi.fn();
  vi.stubGlobal('fetch', fetchDuble);
});

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('entrar (FUN-138, FUN-139, FUN-140)', () => {
  it('FUN-138: 200 com dono → "dono" e grava a dica mj:dono', async () => {
    fetchDuble.mockResolvedValue(json(200, { dono: true }));
    expect(await entrar('a@b.c', 'senha')).toBe('dono');
    expect(localStorage.getItem(CHAVES.dono)).toBe('true');
  });

  it('FUN-138: 200 sem dono → "usuario" e não grava a dica', async () => {
    fetchDuble.mockResolvedValue(json(200, { dono: false }));
    expect(await entrar('a@b.c', 'senha')).toBe('usuario');
    expect(donoNoAparelho()).toBe(false);
  });

  it('FUN-139: 401 → "incorreto"', async () => {
    fetchDuble.mockResolvedValue(json(401, { erro: 'credenciais' }));
    expect(await entrar('a@b.c', 'errada')).toBe('incorreto');
    expect(donoNoAparelho()).toBe(false);
  });

  it('FUN-140: 429 → "limite"', async () => {
    fetchDuble.mockResolvedValue(json(429, { erro: 'limite' }));
    expect(await entrar('a@b.c', 'senha')).toBe('limite');
  });

  it.each([[500], [502], [503], [404]])('FUN-138: status %i → "rede"', async (status) => {
    fetchDuble.mockResolvedValue(json(status, {}));
    expect(await entrar('a@b.c', 'senha')).toBe('rede');
  });

  it('FUN-138: rede fora (fetch lança) → "rede"', async () => {
    fetchDuble.mockRejectedValue(new TypeError('Failed to fetch'));
    expect(await entrar('a@b.c', 'senha')).toBe('rede');
  });

  it('FUN-138: 200 com corpo ilegível ou de outra forma → "rede" e não grava a dica', async () => {
    fetchDuble.mockResolvedValueOnce(new Response('não é json', { status: 200 }));
    expect(await entrar('a@b.c', 'senha')).toBe('rede');
    fetchDuble.mockResolvedValueOnce(json(200, { dono: 'sim' }));
    expect(await entrar('a@b.c', 'senha')).toBe('rede');
    expect(donoNoAparelho()).toBe(false);
  });

  it('FUN-138: manda POST /api/entrar com o corpo em JSON e credentials same-origin', async () => {
    fetchDuble.mockResolvedValue(json(200, { dono: true }));
    await entrar('dono@exemplo.com', 'a senha "com aspas"');
    expect(fetchDuble).toHaveBeenCalledTimes(1);
    const [url, opcoes] = fetchDuble.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/entrar');
    expect(opcoes.method).toBe('POST');
    expect(opcoes.credentials).toBe('same-origin');
    expect(new Headers(opcoes.headers).get('content-type')).toBe('application/json');
    expect(JSON.parse(opcoes.body as string)).toEqual({ email: 'dono@exemplo.com', senha: 'a senha "com aspas"' });
  });
});

describe('lerSessao (FUN-142, FUN-145)', () => {
  it('FUN-142: 200 com dono → "dono" e grava a dica', async () => {
    fetchDuble.mockResolvedValue(json(200, { dono: true }));
    expect(await lerSessao()).toBe('dono');
    expect(donoNoAparelho()).toBe(true);
  });

  it('FUN-142: 200 sem dono → "usuario" e apaga a dica', async () => {
    lembrarDono();
    fetchDuble.mockResolvedValue(json(200, { dono: false }));
    expect(await lerSessao()).toBe('usuario');
    expect(donoNoAparelho()).toBe(false);
  });

  it('FUN-145: 401 → "sem" e apaga a dica mj:dono', async () => {
    lembrarDono();
    fetchDuble.mockResolvedValue(json(401, { erro: 'sem_sessao' }));
    expect(await lerSessao()).toBe('sem');
    expect(donoNoAparelho()).toBe(false);
  });

  it('FUN-145: rede fora → "rede" e mantém a dica mj:dono', async () => {
    lembrarDono();
    fetchDuble.mockRejectedValue(new TypeError('Failed to fetch'));
    expect(await lerSessao()).toBe('rede');
    expect(donoNoAparelho()).toBe(true);
  });

  it.each([[500], [503]])('FUN-145: status %i → "rede" e mantém a dica', async (status) => {
    lembrarDono();
    fetchDuble.mockResolvedValue(json(status, {}));
    expect(await lerSessao()).toBe('rede');
    expect(donoNoAparelho()).toBe(true);
  });

  it('FUN-142: chama GET /api/sessao com credentials same-origin', async () => {
    fetchDuble.mockResolvedValue(json(401, {}));
    await lerSessao();
    expect(fetchDuble).toHaveBeenCalledWith('/api/sessao', { credentials: 'same-origin' });
  });
});

describe('sair (FUN-143)', () => {
  it('FUN-143: chama POST /api/sair e apaga a dica mj:dono', async () => {
    lembrarDono();
    fetchDuble.mockResolvedValue(new Response(null, { status: 204 }));
    await sair();
    expect(fetchDuble).toHaveBeenCalledWith('/api/sair', { method: 'POST', credentials: 'same-origin' });
    expect(donoNoAparelho()).toBe(false);
  });

  it('FUN-143: sem rede apaga a dica mesmo assim e não lança', async () => {
    lembrarDono();
    fetchDuble.mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(sair()).resolves.toBeUndefined();
    expect(donoNoAparelho()).toBe(false);
  });
});
