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

describe('A-09 FUN-141 FUN-143: trocar a senha encerra as sessões abertas', () => {
  const sessoesDe = (url: string, email: string) =>
    comCliente(
      url,
      async (c) =>
        (
          await c.query(
            'SELECT count(*)::int AS n FROM sessoes s JOIN usuarios u ON u.id = s.usuario_id WHERE u.email = $1',
            [email],
          )
        ).rows[0]?.n as number,
    );

  it('FUN-143: trocar a senha do dono apaga as sessões dele e mantém as de outro usuário', async () => {
    await bancoDeTeste(
      async (url) => {
        await rodar(url, 'dono@exemplo.com', SENHA);
        await comCliente(url, async (c) => {
          await c.query(
            "INSERT INTO usuarios (email, senha_hash) VALUES ('outro@exemplo.com', crypt('senha-do-outro-1', gen_salt('bf', 12)))",
          );
          await c.query(
            "INSERT INTO sessoes (token_hash, usuario_id) SELECT '\\x0a', id FROM usuarios WHERE email = 'dono@exemplo.com'",
          );
          await c.query(
            "INSERT INTO sessoes (token_hash, usuario_id) SELECT '\\x0b', id FROM usuarios WHERE email = 'dono@exemplo.com'",
          );
          await c.query(
            "INSERT INTO sessoes (token_hash, usuario_id) SELECT '\\x0c', id FROM usuarios WHERE email = 'outro@exemplo.com'",
          );
        });
        expect(await sessoesDe(url, 'dono@exemplo.com')).toBe(2);

        const r = await rodar(url, 'dono@exemplo.com', 'senha-nova-456');
        expect(r.codigo).toBe(0);
        expect(await sessoesDe(url, 'dono@exemplo.com')).toBe(0);
        expect(await sessoesDe(url, 'outro@exemplo.com')).toBe(1);
      },
      { migrado: true },
    );
  });

  it('FUN-143: a primeira criação do dono não falha por não haver sessões', async () => {
    await bancoDeTeste(
      async (url) => {
        const r = await rodar(url, 'dono@exemplo.com', SENHA);
        expect(r.codigo).toBe(0);
        expect(await sessoesDe(url, 'dono@exemplo.com')).toBe(0);
      },
      { migrado: true },
    );
  });
});

describe('A-24 FUN-141 FUN-143: schema com o nome do dono não sombreia tabelas nem funções', () => {
  // `"$user"` vem antes de `public` no search_path: cópias de usuarios e sessoes e uma crypt/gen_salt falsas nesse schema
  // recebem a gravação se o SQL não qualificar cada nome com `public.`.
  it('A-24 FUN-141: com schema sombra, criar-dono grava e encerra sessões em public com bcrypt real', async () => {
    await bancoDeTeste(
      async (url) => {
        const sombra = await comCliente(url, async (c) => {
          const { rows } = await c.query('SELECT current_user AS usuario');
          const u = rows[0].usuario as string;
          await c.query(`CREATE SCHEMA "${u}"`);
          await c.query(`CREATE TABLE "${u}".usuarios (LIKE public.usuarios INCLUDING ALL)`);
          await c.query(`CREATE TABLE "${u}".sessoes (LIKE public.sessoes INCLUDING ALL)`);
          await c.query(`CREATE FUNCTION "${u}".crypt(text, text) RETURNS text LANGUAGE sql AS $$ SELECT 'falso'::text $$`);
          await c.query(
            `CREATE FUNCTION "${u}".gen_salt(text, integer) RETURNS text LANGUAGE sql AS $$ SELECT 'falso'::text $$`,
          );
          return u;
        });
        // dono já existente em public, com uma sessão aberta: a troca de senha tem de apagá-la em public.
        expect((await rodar(url, 'dono@exemplo.com', SENHA)).codigo).toBe(0);
        await comCliente(url, (c) =>
          c.query(
            "INSERT INTO public.sessoes (token_hash, usuario_id) SELECT '\x0a', id FROM public.usuarios WHERE email = 'dono@exemplo.com'",
          ),
        );
        const r = await rodar(url, 'dono@exemplo.com', 'senha-nova-456');
        expect(r.codigo).toBe(0);
        const publico = await comCliente(url, async (c) => ({
          usuarios: (await c.query('SELECT id, senha_hash FROM public.usuarios')).rows,
          sessoes: (await c.query('SELECT 1 FROM public.sessoes')).rows,
          sombraUsuarios: (await c.query(`SELECT 1 FROM "${sombra}".usuarios`)).rows,
          sombraSessoes: (await c.query(`SELECT 1 FROM "${sombra}".sessoes`)).rows,
        }));
        expect(publico.usuarios).toHaveLength(1);
        expect(publico.usuarios[0]?.senha_hash).toMatch(/^\$2[aby]\$12\$/);
        expect(publico.sessoes).toHaveLength(0);
        expect(publico.sombraUsuarios).toEqual([]);
        expect(publico.sombraSessoes).toEqual([]);
        expect(await entrar(url, 'dono@exemplo.com', 'senha-nova-456')).toBe(publico.usuarios[0]?.id);
      },
      { migrado: true },
    );
  });
});

describe('A-10 FUN-141: senha mínima do dono', () => {
  const nUsuarios = (url: string) =>
    comCliente(url, async (c) => (await c.query('SELECT count(*)::int AS n FROM usuarios')).rows[0]?.n as number);

  it('FUN-141: senha de 11 caracteres recusa com código 1, diz o mínimo e não grava', async () => {
    await bancoDeTeste(
      async (url) => {
        const r = await rodar(url, 'dono@exemplo.com', 'abcdefghijk');
        expect(r.codigo).toBe(1);
        expect(r.erro.join('\n')).toContain('12 caracteres');
        expect(r.erro.join('\n')).not.toContain('abcdefghijk');
        expect(await nUsuarios(url)).toBe(0);
      },
      { migrado: true },
    );
  });

  it('FUN-141: senha de exatamente 12 caracteres grava, sem aviso', async () => {
    await bancoDeTeste(
      async (url) => {
        const r = await rodar(url, 'dono@exemplo.com', 'abcdefghijkl');
        expect(r.codigo).toBe(0);
        expect(r.fora.join('\n')).not.toContain('72');
        expect(await entrar(url, 'dono@exemplo.com', 'abcdefghijkl')).not.toBeNull();
      },
      { migrado: true },
    );
  });

  it('FUN-141: senha com mais de 72 bytes grava e avisa que o bcrypt ignora o resto', async () => {
    await bancoDeTeste(
      async (url) => {
        const longa = 'a'.repeat(73);
        const r = await rodar(url, 'dono@exemplo.com', longa);
        expect(r.codigo).toBe(0);
        expect(r.fora.join('\n')).toContain('72 bytes');
        expect(r.fora.join('\n')).not.toContain(longa);
        const justa = await rodar(url, 'dono@exemplo.com', 'a'.repeat(72));
        expect(justa.fora.join('\n')).not.toContain('72 bytes');
      },
      { migrado: true },
    );
  });

  it('FUN-141: o limite de 72 conta bytes, não caracteres (acentos ocupam dois)', async () => {
    await bancoDeTeste(
      async (url) => {
        const r = await rodar(url, 'dono@exemplo.com', 'ã'.repeat(40)); // 40 caracteres, 80 bytes
        expect(r.codigo).toBe(0);
        expect(r.fora.join('\n')).toContain('72 bytes');
      },
      { migrado: true },
    );
  });
});
