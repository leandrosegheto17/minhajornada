import { describe, expect, it } from 'vitest';
import { criarApp } from './app.ts';

const APP = 'https://minhajornada-tst.ljssoftware.com.br';

describe('criarApp (rota desconhecida da API)', () => {
  it('GET /api/inexistente responde 404 em JSON', async () => {
    const resposta = await criarApp({ urlPublica: APP }).request(`${APP}/api/inexistente`);
    expect(resposta.status).toBe(404);
    expect(resposta.headers.get('content-type')).toMatch(/^application\/json/);
    expect(await resposta.json()).toEqual({ erro: 'nao_encontrado' });
  });

  it('POST /api/x responde 404 em JSON', async () => {
    const resposta = await criarApp({ urlPublica: APP }).request(`${APP}/api/x`, { method: 'POST', body: '{}' });
    expect(resposta.status).toBe(404);
    expect(resposta.headers.get('content-type')).toMatch(/^application\/json/);
    expect(await resposta.json()).toEqual({ erro: 'nao_encontrado' });
  });
});
