// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { indice } from '../biblia/indice';
import { criarDubleCaches, respostaLivro } from './dubleCache';
import { CACHE_LIVROS, limparAntigos } from './livros';

let duble: ReturnType<typeof criarDubleCaches>;

beforeEach(() => {
  duble = criarDubleCaches();
  vi.stubGlobal('caches', duble.storage);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const atual = (numero: number) => indice.livros[numero - 1]!.arquivo;

describe('limparAntigos (FUN-33, FUN-37)', () => {
  it('FUN-37: entradas com hash antigo são apagadas e as do índice atual ficam', async () => {
    const cache = duble.cache(CACHE_LIVROS);
    await cache.put(atual(1), respostaLivro(1));
    await cache.put(atual(2), respostaLivro(2));
    await cache.put('/livros/01.00000000.json', respostaLivro(1));
    await cache.put('/livros/02.ffffffff.json', respostaLivro(2));
    await limparAntigos();
    expect(duble.caminhos(CACHE_LIVROS).sort()).toEqual([atual(1), atual(2)].sort());
  });

  it('FUN-33: cache vazio não falha', async () => {
    await expect(limparAntigos()).resolves.toBeUndefined();
  });

  it('FUN-33: sem Cache API não falha', async () => {
    vi.stubGlobal('caches', undefined);
    await expect(limparAntigos()).resolves.toBeUndefined();
  });

  it('FUN-37: erro de cache.delete numa entrada não interrompe as outras', async () => {
    const cache = duble.cache(CACHE_LIVROS);
    await cache.put('/livros/01.00000000.json', respostaLivro(1));
    await cache.put('/livros/02.00000000.json', respostaLivro(2));
    await cache.put('/livros/03.00000000.json', respostaLivro(3));
    const original = cache.delete.getMockImplementation()!;
    cache.delete.mockImplementation(async (pedido) => {
      if (new URL((pedido as Request).url).pathname.startsWith('/livros/01.')) throw new Error('falhou');
      return original(pedido);
    });
    await expect(limparAntigos()).resolves.toBeUndefined();
    expect(duble.caminhos(CACHE_LIVROS)).toEqual(['/livros/01.00000000.json']);
  });
});
