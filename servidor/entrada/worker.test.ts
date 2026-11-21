import { describe, expect, it } from 'vitest';
import worker, { depsDoEnv } from './worker.ts';

const ctx = { waitUntil: () => undefined, passThroughOnException: () => undefined } as unknown as ExecutionContext;

describe('worker (ligação do Worker ao app)', () => {
  it('o fetch do Worker entrega /api/* ao app: rota desconhecida é 404 em JSON', async () => {
    const resposta = await worker.fetch(
      new Request('https://minhajornada.ljssoftware.com.br/api/x'),
      { URL_PUBLICA: 'https://minhajornada.ljssoftware.com.br' },
      ctx,
    );
    expect(resposta.status).toBe(404);
    expect(await resposta.json()).toEqual({ erro: 'nao_encontrado' });
  });

  it('as dependências saem do env: a URL pública vem de URL_PUBLICA', () => {
    expect(depsDoEnv({ URL_PUBLICA: 'https://minhajornada-tst.ljssoftware.com.br' }).urlPublica).toBe(
      'https://minhajornada-tst.ljssoftware.com.br',
    );
    expect(depsDoEnv({}).urlPublica).toBeUndefined();
  });

  it('o limite de login vem do binding LIMITE_ENTRAR', () => {
    const limite = { limit: async () => ({ success: true }) };
    expect(depsDoEnv({ LIMITE_ENTRAR: limite }).limiteEntrar).toBe(limite);
    expect(depsDoEnv({}).limiteEntrar).toBeUndefined();
  });

  it('o cliente do banco vem do binding HYPERDRIVE; sem ele, não há conexão', () => {
    const hyperdrive = { connectionString: 'postgresql://mj_app:s@127.0.0.1:1/x' } as Hyperdrive;
    expect(depsDoEnv({ HYPERDRIVE: hyperdrive }).conectar?.().aberto()).toBe(false);
    expect(depsDoEnv({}).conectar).toBeUndefined();
  });
});
