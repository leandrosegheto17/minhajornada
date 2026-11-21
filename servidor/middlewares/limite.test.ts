import { describe, expect, it } from 'vitest';
import { criarApp } from '../app.ts';
import type { LimiteTentativas } from '../deps.ts';

// FUN-140: no máximo 5 tentativas de login por minuto por IP; a 6ª recebe 429 com Retry-After. Falha fechada (AD-022):
// binding ausente ou que lança responde 503 e nunca deixa a tentativa passar.
const APP = 'https://minhajornada-tst.ljssoftware.com.br';

/** Limite falso com a regra do binding real: `maximo` por chave; guarda as chaves que recebeu. */
function limiteFalso(maximo = 5) {
  const contagem = new Map<string, number>();
  const chaves: string[] = [];
  const limite: LimiteTentativas = {
    async limit({ key }) {
      chaves.push(key);
      const n = (contagem.get(key) ?? 0) + 1;
      contagem.set(key, n);
      return { success: n <= maximo };
    },
  };
  return { limite, chaves };
}

function appCom(limiteEntrar: LimiteTentativas | undefined) {
  const alcancou: string[] = [];
  const a = criarApp({ urlPublica: APP, limiteEntrar });
  // O que vem depois do limite: se o limite barra, este handler não roda.
  a.post('/api/entrar', (c) => {
    alcancou.push('entrar');
    return c.json({ ok: true });
  });
  return { app: a, alcancou };
}

const tentar = (a: ReturnType<typeof appCom>['app'], ip?: string, metodo = 'POST') =>
  a.request(`${APP}/api/entrar`, {
    method: metodo,
    headers: ip === undefined ? {} : { 'cf-connecting-ip': ip },
    body: metodo === 'GET' ? undefined : '{}',
  });

describe('FUN-140: limite de tentativas de login', () => {
  it('FUN-140: as 5 primeiras tentativas passam e a 6ª recebe 429 com Retry-After de 60 s', async () => {
    const { limite } = limiteFalso();
    const { app, alcancou } = appCom(limite);
    for (let i = 1; i <= 5; i++) expect((await tentar(app, '203.0.113.7')).status).toBe(200);
    const sexta = await tentar(app, '203.0.113.7');
    expect(sexta.status).toBe(429);
    expect(sexta.headers.get('retry-after')).toBe('60');
    expect(await sexta.json()).toEqual({ erro: 'limite' });
    expect(alcancou).toHaveLength(5);
  });

  it('FUN-140: o limite é por IP: outro IP passa quando o primeiro já estourou', async () => {
    const { limite } = limiteFalso();
    const { app } = appCom(limite);
    for (let i = 0; i < 6; i++) await tentar(app, '203.0.113.7');
    expect((await tentar(app, '203.0.113.7')).status).toBe(429);
    expect((await tentar(app, '203.0.113.8')).status).toBe(200);
  });

  it('FUN-140: a chave é entrar:<IP de CF-Connecting-IP>', async () => {
    const { limite, chaves } = limiteFalso();
    const { app } = appCom(limite);
    await tentar(app, '203.0.113.7');
    expect(chaves).toEqual(['entrar:203.0.113.7']);
  });

  it('FUN-140: sem CF-Connecting-IP usa a chave entrar:sem-ip (todas as tentativas sem IP dividem o mesmo limite)', async () => {
    const { limite, chaves } = limiteFalso();
    const { app } = appCom(limite);
    for (let i = 0; i < 5; i++) await tentar(app);
    expect(chaves).toEqual(Array(5).fill('entrar:sem-ip'));
    expect((await tentar(app)).status).toBe(429);
  });

  it('FUN-140: o 429 vem antes da rota: o handler do login não roda e o corpo não é lido', async () => {
    const { limite } = limiteFalso(0);
    const { app, alcancou } = appCom(limite);
    expect((await tentar(app, '203.0.113.7')).status).toBe(429);
    expect(alcancou).toEqual([]);
  });

  it('FUN-140: só o POST de /api/entrar passa pelo limite (GET não consulta o limite)', async () => {
    const { limite, chaves } = limiteFalso();
    const { app } = appCom(limite);
    await tentar(app, '203.0.113.7', 'GET');
    expect(chaves).toEqual([]);
  });

  it('FUN-140: a guarda de origem vem antes: POST de outro site recebe 403 e não gasta tentativa', async () => {
    const { limite, chaves } = limiteFalso();
    const { app } = appCom(limite);
    const resposta = await app.request(`${APP}/api/entrar`, {
      method: 'POST',
      headers: { 'cf-connecting-ip': '203.0.113.7', 'sec-fetch-site': 'cross-site' },
      body: '{}',
    });
    expect(resposta.status).toBe(403);
    expect(chaves).toEqual([]);
  });
});

describe('FUN-140: falha fechada do limite (503)', () => {
  it('FUN-140: binding ausente responde 503 e a tentativa não passa', async () => {
    const { app, alcancou } = appCom(undefined);
    const resposta = await tentar(app, '203.0.113.7');
    expect(resposta.status).toBe(503);
    expect(await resposta.json()).toEqual({ erro: 'limite_indisponivel' });
    expect(alcancou).toEqual([]);
  });

  it('FUN-140: binding que lança responde 503 e a tentativa não passa', async () => {
    const quebrado: LimiteTentativas = {
      limit() {
        return Promise.reject(new Error('binding fora do ar'));
      },
    };
    const { app, alcancou } = appCom(quebrado);
    const resposta = await tentar(app, '203.0.113.7');
    expect(resposta.status).toBe(503);
    expect(alcancou).toEqual([]);
  });
});
