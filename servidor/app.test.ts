import { describe, expect, it } from 'vitest';
import { criarApp } from './app.ts';

describe('criarApp (rota desconhecida da API)', () => {
  it('GET /api/inexistente responde 404 em JSON', async () => {
    const resposta = await criarApp({}).request('/api/inexistente');
    expect(resposta.status).toBe(404);
    expect(resposta.headers.get('content-type')).toMatch(/^application\/json/);
    expect(await resposta.json()).toEqual({ erro: 'nao_encontrado' });
  });

  it('POST /api/x responde 404 em JSON', async () => {
    const resposta = await criarApp({}).request('/api/x', { method: 'POST', body: '{}' });
    expect(resposta.status).toBe(404);
    expect(resposta.headers.get('content-type')).toMatch(/^application\/json/);
    expect(await resposta.json()).toEqual({ erro: 'nao_encontrado' });
  });
});
