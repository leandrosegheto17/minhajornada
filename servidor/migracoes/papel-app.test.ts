import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { bancoDeTeste, comCliente, PAPEL_APP, SENHA_PAPEL_APP, urlComoPapel } from '../test/apoio/banco.ts';

/** Sem permissão: o Postgres responde 42501 (insufficient_privilege). */
const SEM_PERMISSAO = { code: '42501' };
const SENHA = 'senha-do-teste-123';

interface Cenario {
  dono: string; // URL do papel dono
  app: string; // URL do mj_app
  usuarioId: string;
}

/** Banco migrado com um usuário, uma sessão e um resumo gravados pelo dono. */
async function comCenario(fn: (c: Cenario) => Promise<void>): Promise<void> {
  await bancoDeTeste(
    async (dono) => {
      const usuarioId = await comCliente(dono, async (c) => {
        const { rows } = await c.query(
          "INSERT INTO usuarios (email, senha_hash, dono) VALUES ('dono@exemplo.com', crypt($1, gen_salt('bf', 12)), true) RETURNING id",
          [SENHA],
        );
        await c.query("INSERT INTO sessoes (token_hash, usuario_id) VALUES ('\\x0a', $1)", [rows[0].id]);
        await c.query('INSERT INTO resumos (livro, conteudo) VALUES (1, \'{"a":1}\')');
        return rows[0].id as string;
      });
      await fn({ dono, app: urlComoPapel(dono, PAPEL_APP, SENHA_PAPEL_APP), usuarioId });
    },
    { migrado: true },
  );
}

const comoApp = <T>(c: Cenario, sql: string, valores: unknown[] = []): Promise<T> =>
  comCliente(c.app, async (cli) => (await cli.query(sql, valores)) as T);

describe('AD-023 FUN-141: papel mj_app em usuarios', () => {
  it('AD-023 FUN-147: lê id e dono', async () => {
    await comCenario(async (c) => {
      const r = await comoApp<{ rows: { id: string; dono: boolean }[] }>(c, 'SELECT id, dono FROM usuarios');
      expect(r.rows).toEqual([{ id: c.usuarioId, dono: true }]);
    });
  });

  it.each([
    ['senha_hash', 'SELECT senha_hash FROM usuarios'],
    ['*', 'SELECT * FROM usuarios'],
    ['email', 'SELECT email FROM usuarios'],
    ['senha_hash no WHERE', 'SELECT id FROM usuarios WHERE senha_hash IS NOT NULL'],
  ])('AD-023 FUN-141: SELECT de %s falha', async (_nome, sql) => {
    await comCenario(async (c) => {
      await expect(comoApp(c, sql)).rejects.toMatchObject(SEM_PERMISSAO);
    });
  });

  it('AD-023: INSERT falha', async () => {
    await comCenario(async (c) => {
      await expect(
        comoApp(c, "INSERT INTO usuarios (email, senha_hash) VALUES ('x@exemplo.com', '$2a$12$x')"),
      ).rejects.toMatchObject(SEM_PERMISSAO);
    });
  });

  it.each([
    ['UPDATE com WHERE', 'UPDATE usuarios SET dono = true WHERE id = gen_random_uuid()'],
    ['UPDATE sem WHERE (dono)', 'UPDATE usuarios SET dono = true'],
    ['UPDATE sem WHERE (senha_hash)', "UPDATE usuarios SET senha_hash = 'x'"],
    ['DELETE com WHERE', 'DELETE FROM usuarios WHERE id = gen_random_uuid()'],
    ['DELETE sem WHERE', 'DELETE FROM usuarios'],
  ])('AD-023: %s falha', async (_nome, sql) => {
    await comCenario(async (c) => {
      await expect(comoApp(c, sql)).rejects.toMatchObject(SEM_PERMISSAO);
    });
  });
});

describe('AD-023 FUN-147 FUN-148: papel mj_app em resumos', () => {
  it('AD-023 FUN-148: lê os resumos', async () => {
    await comCenario(async (c) => {
      const r = await comoApp<{ rows: { livro: number }[] }>(c, 'SELECT livro, conteudo FROM resumos');
      expect(r.rows.map((x) => x.livro)).toEqual([1]);
    });
  });

  it.each([
    ['INSERT', "INSERT INTO resumos (livro, conteudo) VALUES (2, '{}')"],
    ['UPDATE com WHERE', "UPDATE resumos SET conteudo = '{}' WHERE livro = 1"],
    ['UPDATE sem WHERE', "UPDATE resumos SET conteudo = '{}'"],
    ['DELETE com WHERE', 'DELETE FROM resumos WHERE livro = 1'],
    ['DELETE sem WHERE', 'DELETE FROM resumos'],
  ])('AD-023 FUN-148: %s falha', async (_nome, sql) => {
    await comCenario(async (c) => {
      await expect(comoApp(c, sql)).rejects.toMatchObject(SEM_PERMISSAO);
      const r = await comCliente(c.dono, (cli) => cli.query('SELECT conteudo FROM resumos WHERE livro = 1'));
      expect(r.rows[0].conteudo).toEqual({ a: 1 });
    });
  });
});

describe('AD-023 FUN-141 FUN-144: papel mj_app em sessoes', () => {
  it('AD-023: SELECT passa', async () => {
    await comCenario(async (c) => {
      const r = await comoApp<{ rowCount: number }>(c, 'SELECT * FROM sessoes');
      expect(r.rowCount).toBe(1);
    });
  });

  it('AD-023: INSERT passa', async () => {
    await comCenario(async (c) => {
      const r = await comoApp<{ rowCount: number }>(
        c,
        "INSERT INTO sessoes (token_hash, usuario_id) VALUES ('\\x0b', $1)",
        [c.usuarioId],
      );
      expect(r.rowCount).toBe(1);
    });
  });

  it('AD-023: UPDATE de usada_em passa', async () => {
    await comCenario(async (c) => {
      const r = await comoApp<{ rowCount: number }>(c, "UPDATE sessoes SET usada_em = now() + interval '1 minute'");
      expect(r.rowCount).toBe(1);
    });
  });

  it.each([
    ['usuario_id', 'UPDATE sessoes SET usuario_id = usuario_id'],
    ['token_hash', "UPDATE sessoes SET token_hash = '\\x0c'"],
    ['criada_em', 'UPDATE sessoes SET criada_em = now()'],
  ])('AD-023: UPDATE de %s falha', async (_nome, sql) => {
    await comCenario(async (c) => {
      await expect(comoApp(c, sql)).rejects.toMatchObject(SEM_PERMISSAO);
    });
  });

  it('AD-023 FUN-144: DELETE passa, com e sem WHERE', async () => {
    await comCenario(async (c) => {
      const um = await comoApp<{ rowCount: number }>(c, "DELETE FROM sessoes WHERE token_hash = '\\x0a'");
      expect(um.rowCount).toBe(1);
      await comoApp(c, "INSERT INTO sessoes (token_hash, usuario_id) VALUES ('\\x0b', $1)", [c.usuarioId]);
      const todos = await comoApp<{ rowCount: number }>(c, 'DELETE FROM sessoes');
      expect(todos.rowCount).toBe(1);
    });
  });
});

describe('AD-023 FUN-139: usuario_entrar e o resto do esquema', () => {
  it('AD-023 FUN-139: mj_app executa usuario_entrar', async () => {
    await comCenario(async (c) => {
      const r = await comoApp<{ rows: { id: string | null }[] }>(c, 'SELECT usuario_entrar($1, $2) AS id', [
        'dono@exemplo.com',
        SENHA,
      ]);
      expect(r.rows[0]?.id).toBe(c.usuarioId);
      const errada = await comoApp<{ rows: { id: string | null }[] }>(c, 'SELECT usuario_entrar($1, $2) AS id', [
        'dono@exemplo.com',
        'errada',
      ]);
      expect(errada.rows[0]?.id).toBeNull();
    });
  });

  it('AD-023 FUN-139: papel sem a concessão (PUBLIC) não executa usuario_entrar', async () => {
    await comCenario(async (c) => {
      const papel = `teste_papel_${randomBytes(4).toString('hex')}`;
      await comCliente(c.dono, async (cli) => {
        await cli.query(`CREATE ROLE ${papel} NOLOGIN`);
        try {
          await cli.query(`SET ROLE ${papel}`);
          await expect(cli.query("SELECT usuario_entrar('dono@exemplo.com', 'x')")).rejects.toMatchObject(
            SEM_PERMISSAO,
          );
        } finally {
          await cli.query('RESET ROLE');
          await cli.query(`DROP ROLE ${papel}`);
        }
      });
    });
  });

  it('AD-023: mj_app não é superusuário nem contorna RLS e não cria objetos no esquema public', async () => {
    await comCenario(async (c) => {
      const r = await comoApp<{ rows: { rolsuper: boolean; rolbypassrls: boolean; cria: boolean }[] }>(
        c,
        `SELECT rolsuper, rolbypassrls, has_schema_privilege(current_user, 'public', 'CREATE') AS cria
         FROM pg_roles WHERE rolname = current_user`,
      );
      expect(r.rows[0]).toEqual({ rolsuper: false, rolbypassrls: false, cria: false });
      await expect(comoApp(c, 'CREATE TABLE intruso (id int)')).rejects.toMatchObject(SEM_PERMISSAO);
    });
  });
});
