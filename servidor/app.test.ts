import { describe, expect, it } from 'vitest';
import { criarApp } from './app.ts';
import { comAmbiente, SENHA_DE_EXEMPLO } from './test/apoio/app.ts';

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

describe('log da API sem dado sensível (T15)', () => {
  it('uma linha por requisição, com método, rota modelo e status', async () => {
    const log: string[] = [];
    const app = criarApp({ urlPublica: APP, log: (l) => log.push(l) });
    app.get('/api/resumos/:n', (c) => c.json({ n: c.req.param('n') }));
    await app.request(`${APP}/api/resumos/19`);
    await app.request(`${APP}/api/resumos/20`);
    await app.request(`${APP}/api/inexistente`);
    expect(log).toEqual(['GET /api/resumos/:n 200', 'GET /api/resumos/:n 200', 'GET /api/* 404']);
  });

  it('a recusa da guarda também gera uma linha, sem a origem recusada', async () => {
    const log: string[] = [];
    const app = criarApp({ urlPublica: APP, log: (l) => log.push(l) });
    await app.request(`${APP}/api/x`, { method: 'POST', headers: { origin: 'https://mal.exemplo.com' } });
    expect(log).toHaveLength(1);
    expect(log[0]).toMatch(/^POST \/api\/\S* 403$/);
    expect(log[0]).not.toContain('mal.exemplo');
  });

  it('erro lançado numa rota: 500 genérico, sem pilha no corpo, e uma linha com o status', async () => {
    const log: string[] = [];
    const app = criarApp({ urlPublica: APP, log: (l) => log.push(l) });
    app.get('/api/quebra', () => {
      throw new Error('falha secreta com postgresql://usuario:SENHA@host/banco');
    });
    const r = await app.request(`${APP}/api/quebra`);
    const corpo = await r.text();
    expect(r.status).toBe(500);
    expect(JSON.parse(corpo)).toEqual({ erro: 'interno' });
    expect(corpo).not.toMatch(/falha secreta|SENHA|at /);
    expect(log).toEqual(['GET /api/quebra 500']);
  });

  it('sem Deps.log a API segue funcionando', async () => {
    expect((await criarApp({ urlPublica: APP }).request(`${APP}/api/x`)).status).toBe(404);
  });

  it('depois de um login e de um erro provocado, o log não tem e-mail, senha, token nem cookie', async () => {
    await comAmbiente(async (a) => {
      await a.criarUsuario('dono@exemplo.com', { dono: true });
      a.app.get('/api/quebra', () => {
        throw new Error('dono@exemplo.com ' + SENHA_DE_EXEMPLO);
      });
      const login = await a.pedir('/api/entrar', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'cf-connecting-ip': '203.0.113.9' },
        body: JSON.stringify({ email: 'dono@exemplo.com', senha: SENHA_DE_EXEMPLO }),
      });
      const cookie = (login.headers.get('set-cookie') ?? '').split(';')[0] ?? '';
      const token = cookie.split('=')[1] ?? '';
      expect(token).toHaveLength(43);
      await a.pedir('/api/sessao', { headers: { cookie } });
      await a.pedir('/api/quebra', { headers: { cookie } });
      await a.pedir('/api/sair', { method: 'POST', headers: { cookie } });
      expect(a.log).toEqual([
        'POST /api/entrar 200',
        'GET /api/sessao 200',
        'GET /api/quebra 500',
        'POST /api/sair 204',
      ]);
      const tudo = a.log.join(' | ');
      for (const proibido of ['dono@exemplo.com', SENHA_DE_EXEMPLO, token, cookie, '__Host-sessao']) {
        expect(tudo).not.toContain(proibido);
      }
    });
  });
});
