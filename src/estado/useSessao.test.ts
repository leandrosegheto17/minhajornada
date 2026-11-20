import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { donoNoAparelho, lembrarDono } from '../dados/preferencias';
import { useSessao } from './useSessao';

let fetchDuble: ReturnType<typeof vi.fn>;

const json = (status: number, corpo: unknown = {}) =>
  new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } });

/** Resposta que só chega quando o teste manda. */
function adiada() {
  let resolver: (r: Response) => void = () => undefined;
  const promessa = new Promise<Response>((ok) => (resolver = ok));
  return { promessa, resolver };
}

beforeEach(() => {
  localStorage.clear();
  fetchDuble = vi.fn();
  vi.stubGlobal('fetch', fetchDuble);
});

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('useSessao: abertura (FUN-142, FUN-145)', () => {
  it('FUN-142: sem dica e com 401 fica "sem"', async () => {
    fetchDuble.mockResolvedValue(json(401));
    const { result } = renderHook(() => useSessao());
    expect(result.current.sessao).toBe('sem');
    await waitFor(() => expect(fetchDuble).toHaveBeenCalledWith('/api/sessao', { credentials: 'same-origin' }));
    expect(result.current.sessao).toBe('sem');
  });

  it('FUN-142: sessão de dono na API vira "dono"', async () => {
    fetchDuble.mockResolvedValue(json(200, { dono: true }));
    const { result } = renderHook(() => useSessao());
    await waitFor(() => expect(result.current.sessao).toBe('dono'));
  });

  it('FUN-142: sessão de usuário comum na API vira "usuario"', async () => {
    fetchDuble.mockResolvedValue(json(200, { dono: false }));
    const { result } = renderHook(() => useSessao());
    await waitFor(() => expect(result.current.sessao).toBe('usuario'));
  });

  it('FUN-145: com a dica mj:dono e sem rede mantém o estado de dono', async () => {
    lembrarDono();
    fetchDuble.mockRejectedValue(new TypeError('sem rede'));
    const { result } = renderHook(() => useSessao());
    expect(result.current.sessao).toBe('dono');
    await waitFor(() => expect(fetchDuble).toHaveBeenCalled());
    await act(async () => undefined);
    expect(result.current.sessao).toBe('dono');
    expect(donoNoAparelho()).toBe(true);
  });

  it('FUN-145: com a dica mj:dono e 401 da API volta a "sem" e apaga a dica', async () => {
    lembrarDono();
    fetchDuble.mockResolvedValue(json(401));
    const { result } = renderHook(() => useSessao());
    await waitFor(() => expect(result.current.sessao).toBe('sem'));
    expect(donoNoAparelho()).toBe(false);
  });

  it('FUN-145: a resposta da abertura que chega depois de um login não o desfaz', async () => {
    const lenta = adiada();
    fetchDuble.mockImplementation((url: string) =>
      url === '/api/sessao' ? lenta.promessa : Promise.resolve(json(200, { dono: true })),
    );
    const { result } = renderHook(() => useSessao());
    await act(async () => {
      await result.current.entrar('dono@exemplo.com', 'senha');
    });
    expect(result.current.sessao).toBe('dono');
    await act(async () => {
      lenta.resolver(json(401));
      await lenta.promessa;
    });
    expect(result.current.sessao).toBe('dono');
  });
});

describe('useSessao: entrar, sair e perder (FUN-138, FUN-143, FUN-145)', () => {
  it('FUN-138: entrar com sucesso de dono muda para "dono" e devolve o resultado', async () => {
    fetchDuble.mockImplementation((url: string) =>
      Promise.resolve(url === '/api/sessao' ? json(401) : json(200, { dono: true })),
    );
    const { result } = renderHook(() => useSessao());
    let resultado;
    await act(async () => {
      resultado = await result.current.entrar('dono@exemplo.com', 'senha');
    });
    expect(resultado).toBe('dono');
    expect(result.current.sessao).toBe('dono');
  });

  it.each([
    ['incorreto', 401],
    ['limite', 429],
    ['rede', 503],
  ] as const)('FUN-139: entrar com resultado "%s" mantém "sem"', async (esperado, status) => {
    fetchDuble.mockResolvedValue(json(status));
    const { result } = renderHook(() => useSessao());
    let resultado;
    await act(async () => {
      resultado = await result.current.entrar('a@b.c', 'x');
    });
    expect(resultado).toBe(esperado);
    expect(result.current.sessao).toBe('sem');
  });

  it('FUN-143: sair volta a "sem", chama POST /api/sair e apaga a dica', async () => {
    lembrarDono();
    fetchDuble.mockResolvedValue(new Response(null, { status: 204 }));
    const { result } = renderHook(() => useSessao());
    await act(async () => {
      await result.current.sair();
    });
    expect(result.current.sessao).toBe('sem');
    expect(fetchDuble).toHaveBeenCalledWith('/api/sair', { method: 'POST', credentials: 'same-origin' });
    expect(donoNoAparelho()).toBe(false);
  });

  it('FUN-143: sair sem rede também volta a "sem"', async () => {
    lembrarDono();
    fetchDuble.mockRejectedValue(new TypeError('sem rede'));
    const { result } = renderHook(() => useSessao());
    await act(async () => {
      await result.current.sair();
    });
    expect(result.current.sessao).toBe('sem');
    expect(donoNoAparelho()).toBe(false);
  });

  it('FUN-145: perder volta a "sem" e apaga a dica, sem chamar a API de saída', async () => {
    lembrarDono();
    fetchDuble.mockRejectedValue(new TypeError('sem rede'));
    const { result } = renderHook(() => useSessao());
    expect(result.current.sessao).toBe('dono');
    act(() => result.current.perder());
    expect(result.current.sessao).toBe('sem');
    expect(donoNoAparelho()).toBe(false);
    expect(fetchDuble).not.toHaveBeenCalledWith('/api/sair', expect.anything());
  });
});
