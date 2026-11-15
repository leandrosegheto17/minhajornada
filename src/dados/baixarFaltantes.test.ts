// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { indice } from '../biblia/indice';
import { criarDubleCaches, respostaLivro } from './dubleCache';
import { CACHE_LIVROS, baixarFaltantes } from './livros';

let duble: ReturnType<typeof criarDubleCaches>;
let fetchDuble: ReturnType<typeof vi.fn>;
let persist: ReturnType<typeof vi.fn>;

const numeroDaUrl = (url: string) => Number(/\/livros\/(\d{2})\./.exec(url)?.[1]);
const todos = indice.livros.map((l) => l.arquivo);

beforeEach(() => {
  duble = criarDubleCaches();
  vi.stubGlobal('caches', duble.storage);
  fetchDuble = vi.fn(async (url: string) => respostaLivro(numeroDaUrl(url)));
  vi.stubGlobal('fetch', fetchDuble);
  persist = vi.fn(async () => true);
  vi.stubGlobal('navigator', { storage: { persist } });
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('baixarFaltantes (FUN-33)', () => {
  it('FUN-33: com o cache vazio, baixa os 66 livros em sequência, na ordem do índice', async () => {
    await baixarFaltantes();
    expect(fetchDuble).toHaveBeenCalledTimes(66);
    expect(fetchDuble.mock.calls.map((c) => c[0])).toEqual(todos);
    expect(duble.caminhos(CACHE_LIVROS).sort()).toEqual([...todos].sort());
  });

  it('FUN-33: um por vez: o próximo fetch só começa depois que o anterior foi guardado', async () => {
    let emVoo = 0;
    let maximo = 0;
    fetchDuble.mockImplementation(async (url: string) => {
      emVoo++;
      maximo = Math.max(maximo, emVoo);
      await new Promise((r) => setTimeout(r, 0));
      emVoo--;
      return respostaLivro(numeroDaUrl(url));
    });
    await baixarFaltantes();
    expect(maximo).toBe(1);
  });

  it('FUN-33: com 10 livros guardados, baixa só os 56 que faltam', async () => {
    const cache = duble.cache(CACHE_LIVROS);
    for (const arquivo of todos.slice(0, 10)) await cache.put(arquivo, respostaLivro(numeroDaUrl(arquivo)));
    await baixarFaltantes();
    expect(fetchDuble).toHaveBeenCalledTimes(56);
    expect(fetchDuble.mock.calls.map((c) => c[0])).toEqual(todos.slice(10));
  });

  it('FUN-33: com o cache completo, nenhuma requisição', async () => {
    const cache = duble.cache(CACHE_LIVROS);
    for (const arquivo of todos) await cache.put(arquivo, respostaLivro(numeroDaUrl(arquivo)));
    await baixarFaltantes();
    expect(fetchDuble).not.toHaveBeenCalled();
  });

  it('FUN-33: falha no 30º mantém os 29 guardados e a próxima chamada começa no 30º', async () => {
    fetchDuble.mockImplementation(async (url: string) => {
      if (numeroDaUrl(url) === 30) throw new TypeError('Failed to fetch');
      return respostaLivro(numeroDaUrl(url));
    });
    await expect(baixarFaltantes()).resolves.toBeUndefined();
    expect(duble.caminhos(CACHE_LIVROS).sort()).toEqual(todos.slice(0, 29).sort());
    expect(console.warn).toHaveBeenCalled();
    expect(persist).not.toHaveBeenCalled();

    fetchDuble.mockClear();
    fetchDuble.mockImplementation(async (url: string) => respostaLivro(numeroDaUrl(url)));
    await baixarFaltantes();
    expect(fetchDuble.mock.calls[0]?.[0]).toBe(todos[29]);
    expect(fetchDuble).toHaveBeenCalledTimes(37);
    expect(duble.caminhos(CACHE_LIVROS)).toHaveLength(66);
  });

  it('FUN-33: chamada dupla ao mesmo tempo não baixa o mesmo livro duas vezes', async () => {
    await Promise.all([baixarFaltantes(), baixarFaltantes()]);
    expect(fetchDuble).toHaveBeenCalledTimes(66);
    expect(new Set(fetchDuble.mock.calls.map((c) => c[0])).size).toBe(66);
  });

  it('FUN-33: ao terminar, pede navigator.storage.persist()', async () => {
    await baixarFaltantes();
    expect(persist).toHaveBeenCalledTimes(1);
  });

  it('FUN-33: persist ausente ou que rejeita não quebra o download', async () => {
    vi.stubGlobal('navigator', {});
    await expect(baixarFaltantes()).resolves.toBeUndefined();
    vi.stubGlobal('navigator', { storage: { persist: vi.fn(async () => Promise.reject(new Error('negado'))) } });
    await expect(baixarFaltantes()).resolves.toBeUndefined();
  });

  it('FUN-33: sem Cache API, não faz requisição nenhuma', async () => {
    vi.stubGlobal('caches', undefined);
    await baixarFaltantes();
    expect(fetchDuble).not.toHaveBeenCalled();
  });
});
