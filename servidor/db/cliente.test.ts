import type { Handler } from 'hono';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { criarApp } from '../app.ts';
import { bancoDeTeste, comCliente } from '../test/apoio/banco.ts';
import { criarCliente, emTransacao, type AppEnv, type ConexaoPg } from './cliente.ts';

const APP = 'https://minhajornada-tst.ljssoftware.com.br';

afterEach(() => vi.restoreAllMocks());

async function conexoesAbertas(url: string): Promise<number> {
  const { rows } = await comCliente(url, (c) =>
    c.query(
      'SELECT count(*)::int AS n FROM pg_stat_activity WHERE datname = current_database() AND pid <> pg_backend_pid()',
    ),
  );
  return rows[0].n as number;
}

/** Espera as conexões do próprio teste fecharem (o `end()` do `pg` termina no servidor um instante depois). */
async function conexoesDepoisDeFechar(url: string): Promise<number> {
  for (let i = 0; i < 20; i++) {
    const n = await conexoesAbertas(url);
    if (n === 0) return 0;
    await new Promise((r) => setTimeout(r, 25));
  }
  return conexoesAbertas(url);
}

function appComRota(conectar: () => ReturnType<typeof criarCliente>, rota: Handler<AppEnv>) {
  const app = criarApp({ urlPublica: APP, conectar });
  app.get('/api/teste-banco', rota);
  return app;
}

describe('emTransacao (T10, base de FUN-146 e FUN-173)', () => {
  it('erro provocado (RAISE EXCEPTION) dentro da transação não deixa linha gravada', async () => {
    await bancoDeTeste(async (url) => {
      await comCliente(url, (c) => c.query('CREATE TABLE t (n int)'));
      const cliente = criarCliente(url);
      try {
        await expect(
          emTransacao(cliente, async (tx) => {
            await tx.consultar('INSERT INTO t VALUES (1)');
            await tx.consultar("DO $$ BEGIN RAISE EXCEPTION 'falha provocada'; END $$");
          }),
        ).rejects.toThrow('falha provocada');
      } finally {
        await cliente.fechar();
      }
      const { rows } = await comCliente(url, (c) => c.query('SELECT count(*)::int AS n FROM t'));
      expect(rows[0].n).toBe(0);
    });
  });

  it('erro lançado pelo código (não pelo banco) também faz ROLLBACK e propaga o mesmo erro', async () => {
    await bancoDeTeste(async (url) => {
      await comCliente(url, (c) => c.query('CREATE TABLE t (n int)'));
      const cliente = criarCliente(url);
      const erro = new Error('erro do código');
      try {
        await expect(
          emTransacao(cliente, async (tx) => {
            await tx.consultar('INSERT INTO t VALUES (1)');
            throw erro;
          }),
        ).rejects.toBe(erro);
      } finally {
        await cliente.fechar();
      }
      const { rows } = await comCliente(url, (c) => c.query('SELECT count(*)::int AS n FROM t'));
      expect(rows[0].n).toBe(0);
    });
  });

  it('sem erro, grava no COMMIT e devolve o resultado', async () => {
    await bancoDeTeste(async (url) => {
      await comCliente(url, (c) => c.query('CREATE TABLE t (n int)'));
      const cliente = criarCliente(url);
      try {
        const r = await emTransacao(cliente, async (tx) => {
          await tx.consultar('INSERT INTO t VALUES (1), (2)');
          return 'ok';
        });
        expect(r).toBe('ok');
      } finally {
        await cliente.fechar();
      }
      const { rows } = await comCliente(url, (c) => c.query('SELECT count(*)::int AS n FROM t'));
      expect(rows[0].n).toBe(2);
    });
  });
});

describe('criarCliente e o fechamento por requisição (T10)', () => {
  it('requisição que consulta termina com a conexão fechada', async () => {
    await bancoDeTeste(async (url) => {
      const app = appComRota(
        () => criarCliente(url),
        async (c) => {
          const r = await c.get('banco').consultar('SELECT 1 AS um');
          return c.json({ um: r.rows[0]?.um });
        },
      );
      const resposta = await app.request(`${APP}/api/teste-banco`);
      expect(resposta.status).toBe(200);
      expect(await resposta.json()).toEqual({ um: 1 });
      expect(await conexoesDepoisDeFechar(url)).toBe(0);
    });
  });

  it('requisição que não consulta não abre conexão e termina sem conexão aberta', async () => {
    await bancoDeTeste(async (url) => {
      const fabrica = vi.fn();
      const app = appComRota(
        () => criarCliente(url, { fabrica }),
        async (c) => c.json({ ok: true }),
      );
      const resposta = await app.request(`${APP}/api/teste-banco`);
      expect(resposta.status).toBe(200);
      expect(fabrica).not.toHaveBeenCalled();
      expect(await conexoesDepoisDeFechar(url)).toBe(0);
    });
  });

  it('requisição que consulta e depois falha responde 500 interno e fecha a conexão', async () => {
    await bancoDeTeste(async (url) => {
      const app = appComRota(
        () => criarCliente(url),
        async (c) => {
          await c.get('banco').consultar('SELECT 1');
          throw new Error('falha depois da consulta');
        },
      );
      const resposta = await app.request(`${APP}/api/teste-banco`);
      expect(resposta.status).toBe(500);
      expect(await resposta.json()).toEqual({ erro: 'interno' });
      expect(await conexoesDepoisDeFechar(url)).toBe(0);
    });
  });

  it('fechar é repetível, nunca lança e a consulta depois de fechar é recusada', async () => {
    await bancoDeTeste(async (url) => {
      const cliente = criarCliente(url);
      await cliente.consultar('SELECT 1');
      expect(cliente.aberto()).toBe(true);
      await cliente.fechar();
      await expect(cliente.fechar()).resolves.toBeUndefined();
      await expect(cliente.consultar('SELECT 1')).rejects.toThrow();
    });
  });

  it('fecha a conexão que o fechamento encontrou ainda abrindo', async () => {
    const eventos: string[] = [];
    const conexao: ConexaoPg = {
      connect: async () => {
        await new Promise((r) => setTimeout(r, 20));
        eventos.push('conectou');
      },
      query: async () => ({}) as never,
      end: async () => {
        eventos.push('fechou');
      },
    };
    const cliente = criarCliente('postgresql://x', { fabrica: () => conexao });
    const consulta = cliente.consultar('SELECT 1');
    await cliente.fechar();
    await consulta.catch(() => undefined);
    expect(eventos).toEqual(['conectou', 'fechou']);
  });
});

describe('erro de conexão: 500 genérico sem host nem senha (T10)', () => {
  it.each([
    ['host que não resolve', 'postgresql://usuario:SEGREDO123@servidor-secreto.invalid:5432/banco'],
    ['porta fechada', 'postgresql://usuario:SEGREDO123@127.0.0.1:1/banco'],
    ['URL que não é URL', 'isto nao e uma url SEGREDO123'],
  ])('%s: 500 { erro: interno } sem host nem senha no corpo nem no log', async (_nome, urlRuim) => {
    const espioes = (['log', 'error', 'warn', 'info', 'debug'] as const).map((m) =>
      vi.spyOn(console, m).mockImplementation(() => undefined),
    );
    const linhas: string[] = [];
    const app = criarApp({
      urlPublica: APP,
      conectar: () => criarCliente(urlRuim),
      log: (l) => linhas.push(l),
    });
    app.get('/api/teste-banco', async (c) => {
      await c.get('banco').consultar('SELECT 1');
      return c.json({ ok: true });
    });
    const resposta = await app.request(`${APP}/api/teste-banco`);
    const corpo = await resposta.text();
    expect(resposta.status).toBe(500);
    expect(JSON.parse(corpo)).toEqual({ erro: 'interno' });
    const tudo = [corpo, ...linhas, ...espioes.flatMap((e) => e.mock.calls.flat().map(String))].join('\n');
    for (const proibido of ['SEGREDO123', 'servidor-secreto', 'usuario', '127.0.0.1:1']) {
      expect(tudo).not.toContain(proibido);
    }
  });

  it('a mensagem do erro de conexão é fixa e em português', async () => {
    const cliente = criarCliente('postgresql://usuario:SEGREDO123@127.0.0.1:1/banco');
    const erro = await cliente.consultar('SELECT 1').then(
      () => null,
      (e: Error) => e,
    );
    expect(erro).not.toBeNull();
    expect(erro!.message).not.toMatch(/SEGREDO123|127\.0\.0\.1|usuario/);
    expect(erro!.message).toMatch(/indispon/i);
    await cliente.fechar();
  });

  it('sem `conectar` nas dependências a API segue respondendo sem banco', async () => {
    const resposta = await criarApp({ urlPublica: APP }).request(`${APP}/api/inexistente`);
    expect(resposta.status).toBe(404);
  });
});
