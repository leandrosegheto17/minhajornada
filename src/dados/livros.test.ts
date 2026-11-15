// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { indice } from '../biblia/indice';
import { criarDubleCaches, respostaLivro } from './dubleCache';
import { CACHE_LIVROS, LivroNaoBaixado, carregarLivro } from './livros';

let duble: ReturnType<typeof criarDubleCaches>;
let fetchDuble: ReturnType<typeof vi.fn>;

beforeEach(() => {
  duble = criarDubleCaches();
  vi.stubGlobal('caches', duble.storage);
  fetchDuble = vi.fn(async (url: string) => respostaLivro(Number(/\/livros\/(\d{2})\./.exec(url)?.[1])));
  vi.stubGlobal('fetch', fetchDuble);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const arquivo = (numero: number) => indice.livros[numero - 1]!.arquivo;

describe('carregarLivro (FUN-34)', () => {
  it('FUN-34: livro que já está no cache não chama fetch', async () => {
    await duble.cache(CACHE_LIVROS).put(arquivo(45), respostaLivro(45));
    const livro = await carregarLivro(45);
    expect(livro.numero).toBe(45);
    expect(fetchDuble).not.toHaveBeenCalled();
  });

  it('FUN-34: livro fora do cache chama fetch uma vez, só para o arquivo dele, e guarda a resposta', async () => {
    const livro = await carregarLivro(45);
    expect(livro.numero).toBe(45);
    expect(fetchDuble).toHaveBeenCalledTimes(1);
    expect(fetchDuble).toHaveBeenCalledWith(arquivo(45));
    expect(duble.caminhos(CACHE_LIVROS)).toEqual([arquivo(45)]);
  });

  it('FUN-34: o arquivo buscado é do próprio site (/livros/NN.<hash8>.json)', async () => {
    await carregarLivro(1);
    expect(fetchDuble.mock.calls[0]?.[0]).toMatch(/^\/livros\/01\.[0-9a-f]{8}\.json$/);
  });
});

describe('carregarLivro sem rede (FUN-36)', () => {
  it('FUN-36: fetch que rejeita (sem rede) e cache vazio lançam LivroNaoBaixado', async () => {
    fetchDuble.mockRejectedValue(new TypeError('Failed to fetch'));
    const erro = await carregarLivro(66).catch((e: unknown) => e);
    expect(erro).toBeInstanceOf(LivroNaoBaixado);
    expect((erro as LivroNaoBaixado).numero).toBe(66);
    expect(duble.caminhos(CACHE_LIVROS)).toEqual([]);
  });

  it('FUN-36: resposta de erro do servidor e cache vazio lançam LivroNaoBaixado', async () => {
    fetchDuble.mockResolvedValue(new Response('', { status: 503 }));
    await expect(carregarLivro(66)).rejects.toBeInstanceOf(LivroNaoBaixado);
    expect(duble.caminhos(CACHE_LIVROS)).toEqual([]);
  });
});

describe('carregarLivro com o cache falhando', () => {
  it('cache.put que lança não impede a leitura pela rede', async () => {
    duble.cache(CACHE_LIVROS).put.mockRejectedValue(new DOMException('cota', 'QuotaExceededError'));
    const livro = await carregarLivro(45);
    expect(livro.numero).toBe(45);
    expect(fetchDuble).toHaveBeenCalledTimes(1);
  });

  it('Cache API ausente não impede a leitura pela rede', async () => {
    vi.stubGlobal('caches', undefined);
    expect((await carregarLivro(45)).numero).toBe(45);
  });

  it('caches.open que rejeita não impede a leitura pela rede', async () => {
    duble.storage.open.mockRejectedValue(new DOMException('negado', 'SecurityError'));
    expect((await carregarLivro(45)).numero).toBe(45);
  });
});
