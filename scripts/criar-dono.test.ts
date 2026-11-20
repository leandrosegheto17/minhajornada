import { describe, expect, it } from 'vitest';
import { bancoDeTeste, comCliente } from '../servidor/test/apoio/banco.ts';
import { criarDono } from './criar-dono.ts';

const SENHA = 'senha-de-exemplo-123';

async function rodar(url: string | undefined, email: string, senha: string | null) {
  const fora: string[] = [];
  const erro: string[] = [];
  const codigo = await criarDono({
    email,
    env: url === undefined ? {} : { DATABASE_URL_DONO: url },
    lerSenha: async () => senha,
    saida: (l) => fora.push(l),
    erro: (l) => erro.push(l),
  });
  return { codigo, fora, erro };
}

const entrar = (url: string, email: string, senha: string) =>
  comCliente(url, async (c) => (await c.query('SELECT usuario_entrar($1, $2) AS id', [email, senha])).rows[0]?.id);

describe('FUN-141 FUN-146: script que cria o dono', () => {
  it('FUN-141: depois do script, usuario_entrar com a senha dada devolve o id e o usuário é dono', async () => {
    await bancoDeTeste(
      async (url) => {
        const r = await rodar(url, 'dono@exemplo.com', SENHA);
        expect(r.codigo).toBe(0);
        const linhas = await comCliente(
          url,
          async (c) => (await c.query('SELECT id, dono, senha_hash FROM usuarios')).rows,
        );
        expect(linhas).toHaveLength(1);
        expect(linhas[0]?.dono).toBe(true);
        expect(linhas[0]?.senha_hash).toMatch(/^\$2/);
        expect(await entrar(url, 'dono@exemplo.com', SENHA)).toBe(linhas[0]?.id);
        expect(await entrar(url, 'dono@exemplo.com', 'outra-senha')).toBeNull();
      },
      { migrado: true },
    );
  });

  it('FUN-141: rodar de novo com outra senha troca a senha e mantém um só usuário', async () => {
    await bancoDeTeste(
      async (url) => {
        await rodar(url, 'dono@exemplo.com', SENHA);
        const r = await rodar(url, 'dono@exemplo.com', 'senha-nova-456');
        expect(r.codigo).toBe(0);
        const n = await comCliente(
          url,
          async (c) => (await c.query('SELECT count(*)::int AS n FROM usuarios')).rows[0]?.n,
        );
        expect(n).toBe(1);
        expect(await entrar(url, 'dono@exemplo.com', SENHA)).toBeNull();
        expect(await entrar(url, 'dono@exemplo.com', 'senha-nova-456')).not.toBeNull();
      },
      { migrado: true },
    );
  });

  it('FUN-146: usuário que existia sem ser dono passa a dono', async () => {
    await bancoDeTeste(
      async (url) => {
        await comCliente(url, (c) =>
          c.query(
            "INSERT INTO usuarios (email, senha_hash, dono) VALUES ('dono@exemplo.com', crypt('x', gen_salt('bf', 12)), false)",
          ),
        );
        await rodar(url, 'dono@exemplo.com', SENHA);
        const dono = await comCliente(url, async (c) => (await c.query('SELECT dono FROM usuarios')).rows[0]?.dono);
        expect(dono).toBe(true);
      },
      { migrado: true },
    );
  });

  it('FUN-141: e-mail em caixa alta e com espaços é gravado em caixa baixa', async () => {
    await bancoDeTeste(
      async (url) => {
        const r = await rodar(url, '  Dono@Exemplo.COM ', SENHA);
        expect(r.codigo).toBe(0);
        const email = await comCliente(url, async (c) => (await c.query('SELECT email FROM usuarios')).rows[0]?.email);
        expect(email).toBe('dono@exemplo.com');
        expect(await entrar(url, 'dono@exemplo.com', SENHA)).not.toBeNull();
      },
      { migrado: true },
    );
  });

  it.each([[''], ['   '], [null]])('FUN-141: senha %j recusa com código 1 e não grava', async (senha) => {
    await bancoDeTeste(
      async (url) => {
        const r = await rodar(url, 'dono@exemplo.com', senha);
        expect(r.codigo).toBe(1);
        expect(r.erro.join('\n')).toContain('senha');
        const n = await comCliente(
          url,
          async (c) => (await c.query('SELECT count(*)::int AS n FROM usuarios')).rows[0]?.n,
        );
        expect(n).toBe(0);
      },
      { migrado: true },
    );
  });

  it('FUN-141: e-mail vazio recusa com código 1; sem DATABASE_URL_DONO diz qual variável falta', async () => {
    const vazio = await rodar('postgresql://x:y@127.0.0.1:1/nada', '  ', SENHA);
    expect(vazio.codigo).toBe(1);
    expect(vazio.erro.join('\n')).toContain('e-mail');
    const semUrl = await rodar(undefined, 'dono@exemplo.com', SENHA);
    expect(semUrl.codigo).toBe(1);
    expect(semUrl.erro.join('\n')).toContain('DATABASE_URL_DONO');
  });

  it('FUN-141: a senha não aparece na saída, nem na de erro', async () => {
    await bancoDeTeste(
      async (url) => {
        const ok = await rodar(url, 'dono@exemplo.com', SENHA);
        const falha = await rodar('postgresql://dono:' + SENHA + '@127.0.0.1:1/nada', 'dono@exemplo.com', SENHA);
        for (const r of [ok, falha]) {
          const tudo = [...r.fora, ...r.erro].join('\n');
          expect(tudo).not.toContain(SENHA);
        }
        expect(falha.codigo).toBe(1);
      },
      { migrado: true },
    );
  });
});
