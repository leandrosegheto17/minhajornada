import { describe, expect, it } from 'vitest';
import { comAmbiente, SENHA_DE_EXEMPLO, type Ambiente } from '../test/apoio/app.ts';
import { comCliente } from '../test/apoio/banco.ts';

const EMAIL = 'dono@exemplo.com';

const entrar = (a: Ambiente, corpo: unknown, headers: Record<string, string> = {}) =>
  a.pedir('/api/entrar', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'cf-connecting-ip': '203.0.113.9', ...headers },
    body: typeof corpo === 'string' ? corpo : JSON.stringify(corpo),
  });

const totalSessoes = async (a: Ambiente) =>
  (await comCliente(a.urlDono, (c) => c.query('SELECT count(*)::int AS n FROM sessoes'))).rows[0]?.n as number;

const tokenDoCookie = (r: Response): string =>
  /__Host-sessao=([^;]+)/.exec(r.headers.get('set-cookie') ?? '')?.[1] ?? '';

describe('POST /api/entrar (FUN-138, FUN-139, FUN-140)', () => {
  it('FUN-138: senha certa devolve 200 { dono }, o cookie da sessão e uma linha em sessoes', async () => {
    await comAmbiente(async (a) => {
      await a.criarUsuario(EMAIL, { dono: true });
      const r = await entrar(a, { email: EMAIL, senha: SENHA_DE_EXEMPLO });
      expect(r.status).toBe(200);
      expect(await r.json()).toEqual({ dono: true });
      const cookie = r.headers.get('set-cookie') ?? '';
      expect(cookie).toMatch(/^__Host-sessao=[A-Za-z0-9_-]{43};/);
      expect(cookie).toContain('HttpOnly');
      expect(cookie).toContain('Secure');
      expect(cookie).toContain('SameSite=Lax');
      expect(cookie).toContain('Max-Age=2592000');
      expect(await totalSessoes(a)).toBe(1);
    });
  });

  it('FUN-138: usuário que não é dono entra com { dono: false }', async () => {
    await comAmbiente(async (a) => {
      await a.criarUsuario('leitor@exemplo.com');
      const r = await entrar(a, { email: 'leitor@exemplo.com', senha: SENHA_DE_EXEMPLO });
      expect(r.status).toBe(200);
      expect(await r.json()).toEqual({ dono: false });
    });
  });

  it('FUN-138: o e-mail é aceito em caixa alta e com espaços', async () => {
    await comAmbiente(async (a) => {
      await a.criarUsuario(EMAIL, { dono: true });
      const r = await entrar(a, { email: `  ${EMAIL.toUpperCase()} `, senha: SENHA_DE_EXEMPLO });
      expect(r.status).toBe(200);
    });
  });

  it('FUN-138: o token do cookie guarda só o hash no banco', async () => {
    await comAmbiente(async (a) => {
      await a.criarUsuario(EMAIL, { dono: true });
      const token = tokenDoCookie(await entrar(a, { email: EMAIL, senha: SENHA_DE_EXEMPLO }));
      const { rows } = await comCliente(a.urlDono, (c) => c.query('SELECT s::text AS t FROM sessoes s'));
      expect(rows[0]?.t).not.toContain(token);
    });
  });

  describe('FUN-139: mesma resposta 401 em todo caso de falha, sem criar sessão', () => {
    const casos: [string, unknown][] = [
      ['e-mail inexistente', { email: 'ninguem@exemplo.com', senha: SENHA_DE_EXEMPLO }],
      ['senha errada', { email: EMAIL, senha: 'errada' }],
      ['e-mail vazio', { email: '', senha: SENHA_DE_EXEMPLO }],
      ['senha vazia', { email: EMAIL, senha: '' }],
      ['e-mail só com espaços', { email: '   ', senha: SENHA_DE_EXEMPLO }],
      ['corpo que não é JSON', 'isto não é json'],
      ['corpo vazio', ''],
      ['corpo JSON que não é objeto', '[1,2]'],
      ['corpo null', 'null'],
      ['campos ausentes', {}],
      ['e-mail que não é texto', { email: 42, senha: SENHA_DE_EXEMPLO }],
      ['senha que não é texto', { email: EMAIL, senha: { a: 1 } }],
      ['senha nula', { email: EMAIL, senha: null }],
    ];

    it.each(casos)('FUN-139: %s', async (_nome, corpo) => {
      await comAmbiente(async (a) => {
        await a.criarUsuario(EMAIL, { dono: true });
        const r = await entrar(a, corpo);
        expect(r.status).toBe(401);
        expect(await r.json()).toEqual({ erro: 'credenciais' });
        expect(r.headers.get('set-cookie')).toBeNull();
        expect(await totalSessoes(a)).toBe(0);
      });
    });

    it('FUN-139: os corpos de todos os casos de falha são idênticos', async () => {
      await comAmbiente(async (a) => {
        await a.criarUsuario(EMAIL, { dono: true });
        const corpos = new Set<string>();
        for (const [i, [, corpo]] of casos.entries()) {
          // Um IP por caso: o limite de FUN-140 não pode misturar a resposta.
          corpos.add(await (await entrar(a, corpo, { 'cf-connecting-ip': `203.0.113.${i + 100}` })).text());
        }
        expect(corpos.size).toBe(1);
      });
    });
  });

  it('FUN-140: a 6ª tentativa do mesmo IP recebe 429 sem consultar o banco', async () => {
    await comAmbiente(async (a) => {
      await a.criarUsuario(EMAIL, { dono: true });
      for (let i = 1; i <= 5; i++) {
        expect((await entrar(a, { email: EMAIL, senha: 'errada' })).status).toBe(401);
      }
      // Derruba o banco: com o limite estourado, a resposta vem antes de qualquer consulta.
      await comCliente(a.urlDono, (c) => c.query('ALTER TABLE usuarios RENAME TO usuarios_fora'));
      const sexta = await entrar(a, { email: EMAIL, senha: SENHA_DE_EXEMPLO });
      expect(sexta.status).toBe(429);
      expect(sexta.headers.get('retry-after')).toBe('60');
      expect(await sexta.json()).toEqual({ erro: 'limite' });
    });
  });

  it('FUN-140: outro IP não é afetado pelo limite do primeiro', async () => {
    await comAmbiente(async (a) => {
      await a.criarUsuario(EMAIL, { dono: true });
      for (let i = 1; i <= 6; i++) await entrar(a, { email: EMAIL, senha: 'errada' });
      const outro = await entrar(a, { email: EMAIL, senha: SENHA_DE_EXEMPLO }, { 'cf-connecting-ip': '203.0.113.77' });
      expect(outro.status).toBe(200);
    });
  });

  it('segurança: POST com origem de fora responde 403 e não cria sessão', async () => {
    await comAmbiente(async (a) => {
      await a.criarUsuario(EMAIL, { dono: true });
      const r = await entrar(a, { email: EMAIL, senha: SENHA_DE_EXEMPLO }, { origin: 'https://mal.exemplo.com' });
      expect(r.status).toBe(403);
      expect(await totalSessoes(a)).toBe(0);
    });
  });

  it('GET /api/entrar não existe: 404 em JSON', async () => {
    await comAmbiente(async (a) => {
      expect((await a.pedir('/api/entrar')).status).toBe(404);
    });
  });
});

/** Entra e devolve o valor do cookie para usar nas chamadas seguintes. */
async function entrarComo(a: Ambiente, email: string, dono: boolean): Promise<string> {
  await a.criarUsuario(email, { dono });
  const r = await entrar(a, { email, senha: SENHA_DE_EXEMPLO }, { 'cf-connecting-ip': '203.0.113.50' });
  return `__Host-sessao=${tokenDoCookie(r)}`;
}

describe('GET /api/sessao e POST /api/sair (FUN-142, FUN-143, FUN-144)', () => {
  it('FUN-142: com sessão de dono, 200 { dono: true }', async () => {
    await comAmbiente(async (a) => {
      const cookie = await entrarComo(a, EMAIL, true);
      const r = await a.pedir('/api/sessao', { headers: { cookie } });
      expect(r.status).toBe(200);
      expect(await r.json()).toEqual({ dono: true });
    });
  });

  it('FUN-142: com sessão de leitor, 200 { dono: false }', async () => {
    await comAmbiente(async (a) => {
      const cookie = await entrarComo(a, 'leitor@exemplo.com', false);
      const r = await a.pedir('/api/sessao', { headers: { cookie } });
      expect(r.status).toBe(200);
      expect(await r.json()).toEqual({ dono: false });
    });
  });

  it.each([
    ['sem cookie', undefined],
    ['cookie fora do formato', '__Host-sessao=abc'],
    ['cookie desconhecido', `__Host-sessao=${'A'.repeat(43)}`],
  ])('FUN-142: %s responde 401', async (_nome, cookie) => {
    await comAmbiente(async (a) => {
      const r = await a.pedir('/api/sessao', { headers: cookie ? { cookie } : {} });
      expect(r.status).toBe(401);
      expect(await r.json()).toEqual({ erro: 'sem_sessao' });
    });
  });

  it('FUN-144: sessão vencida responde 401 e some do banco', async () => {
    await comAmbiente(async (a) => {
      const cookie = await entrarComo(a, EMAIL, true);
      a.agora.valor = new Date(a.agora.valor.getTime() + 7 * 24 * 60 * 60 * 1000);
      const r = await a.pedir('/api/sessao', { headers: { cookie } });
      expect(r.status).toBe(401);
      expect(await totalSessoes(a)).toBe(0);
    });
  });

  it('FUN-143: sair apaga a linha, expira o cookie e o mesmo cookie depois dá 401', async () => {
    await comAmbiente(async (a) => {
      const cookie = await entrarComo(a, EMAIL, true);
      const r = await a.pedir('/api/sair', { method: 'POST', headers: { cookie } });
      expect(r.status).toBe(204);
      expect(r.headers.get('set-cookie')).toMatch(/^__Host-sessao=;.*Max-Age=0/);
      expect(await totalSessoes(a)).toBe(0);
      expect((await a.pedir('/api/sessao', { headers: { cookie } })).status).toBe(401);
    });
  });

  it('FUN-143: sair sem sessão (sem cookie ou com cookie ruim) responde 204', async () => {
    await comAmbiente(async (a) => {
      expect((await a.pedir('/api/sair', { method: 'POST' })).status).toBe(204);
      expect((await a.pedir('/api/sair', { method: 'POST', headers: { cookie: '__Host-sessao=abc' } })).status).toBe(
        204,
      );
    });
  });

  it('FUN-143: sair só apaga a sessão do cookie, não a de outro aparelho', async () => {
    await comAmbiente(async (a) => {
      const um = await entrarComo(a, EMAIL, true);
      const dois = `__Host-sessao=${tokenDoCookie(await entrar(a, { email: EMAIL, senha: SENHA_DE_EXEMPLO }))}`;
      await a.pedir('/api/sair', { method: 'POST', headers: { cookie: um } });
      expect((await a.pedir('/api/sessao', { headers: { cookie: dois } })).status).toBe(200);
    });
  });

  it('segurança: sair com origem de fora responde 403 e não apaga a sessão', async () => {
    await comAmbiente(async (a) => {
      const cookie = await entrarComo(a, EMAIL, true);
      const r = await a.pedir('/api/sair', { method: 'POST', headers: { cookie, origin: 'https://mal.exemplo.com' } });
      expect(r.status).toBe(403);
      expect(await totalSessoes(a)).toBe(1);
    });
  });

  it('as respostas de sessão não são guardadas em cache', async () => {
    await comAmbiente(async (a) => {
      const r = await a.pedir('/api/sessao');
      expect(r.headers.get('cache-control')).toBe('no-store');
    });
  });
});
