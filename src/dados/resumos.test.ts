import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Resumo } from '../resumos/formato';
import { buscarResumo } from './resumos';

let fetchDuble: ReturnType<typeof vi.fn>;

const json = (status: number, corpo: unknown = {}) =>
  new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } });

/** Só texto de exemplo (FUN-152). */
const resumo = (livro = 1): Resumo => ({
  livro,
  contexto: 'Contexto de exemplo.',
  mensagem: 'Mensagem de exemplo.',
  divisao: [{ titulo: 'Parte um', de: 1, ate: 2 }],
  versiculos: [{ capitulo: 1, versiculo: 2, ate: 3, frase: 'Frase de exemplo.' }],
});

beforeEach(() => {
  fetchDuble = vi.fn();
  vi.stubGlobal('fetch', fetchDuble);
});

afterEach(() => vi.unstubAllGlobals());

describe('buscarResumo (FUN-145, FUN-167, FUN-168)', () => {
  it('FUN-167: 200 com resumo bem formado → "pronto" com o resumo', async () => {
    fetchDuble.mockResolvedValue(json(200, resumo(1)));
    expect(await buscarResumo(1)).toEqual({ situacao: 'pronto', resumo: resumo(1) });
  });

  it('FUN-168: 404 → "semResumo"', async () => {
    fetchDuble.mockResolvedValue(json(404, { erro: 'sem_resumo' }));
    expect(await buscarResumo(1)).toEqual({ situacao: 'semResumo' });
  });

  it('FUN-145: 401 → "semSessao"', async () => {
    fetchDuble.mockResolvedValue(json(401, { erro: 'sem_sessao' }));
    expect(await buscarResumo(1)).toEqual({ situacao: 'semSessao' });
  });

  it.each([[400], [403], [429], [500], [502], [503]])('FUN-167: status %i → "erro"', async (status) => {
    fetchDuble.mockResolvedValue(json(status, {}));
    expect(await buscarResumo(1)).toEqual({ situacao: 'erro' });
  });

  it('FUN-167: rede fora (fetch lança) → "erro"', async () => {
    fetchDuble.mockRejectedValue(new TypeError('Failed to fetch'));
    expect(await buscarResumo(1)).toEqual({ situacao: 'erro' });
  });

  it.each([
    ['não é JSON', () => new Response('texto solto', { status: 200 })],
    ['é uma lista', () => json(200, [])],
    ['tem campo a mais', () => json(200, { ...resumo(1), extra: 1 })],
    ['falta uma seção', () => json(200, { livro: 1, contexto: 'x', mensagem: 'y', divisao: [] })],
    ['tem o tipo errado', () => json(200, { ...resumo(1), divisao: 'Parte um' })],
    ['é de outro livro', () => json(200, resumo(2))],
  ])('FUN-167: 200 com corpo que %s → "erro"', async (_nome, resposta) => {
    fetchDuble.mockResolvedValue(resposta());
    expect(await buscarResumo(1)).toEqual({ situacao: 'erro' });
  });

  it('FUN-145: pede GET /api/resumos/<n> com credentials same-origin e cache no-store', async () => {
    fetchDuble.mockResolvedValue(json(200, resumo(45)));
    await buscarResumo(45);
    expect(fetchDuble).toHaveBeenCalledTimes(1);
    expect(fetchDuble).toHaveBeenCalledWith('/api/resumos/45', { credentials: 'same-origin', cache: 'no-store' });
  });

  it('FUN-152: não grava o texto no localStorage nem no Cache Storage', async () => {
    const abrir = vi.fn();
    vi.stubGlobal('caches', { open: abrir });
    fetchDuble.mockResolvedValue(json(200, resumo(1)));
    await buscarResumo(1);
    expect(abrir).not.toHaveBeenCalled();
    expect(JSON.stringify({ ...localStorage })).not.toContain('Contexto de exemplo');
  });
});
