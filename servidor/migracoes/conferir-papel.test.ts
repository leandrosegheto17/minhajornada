import { randomBytes } from 'node:crypto';
import type pg from 'pg';
import { describe, expect, it } from 'vitest';
import { bancoDeTeste, comCliente, PAPEL_APP } from '../test/apoio/banco.ts';

// A.7 / AD-023: a migração de conferência falha se o papel do app tem mais poder do que a AD-023 permite. No Neon o papel
// criado pelo Console entra em `neon_superuser`; o teste local prova cada condição com um papel descartável, sem mexer no
// `mj_app` do cluster (outros arquivos de teste o usam ao mesmo tempo).

const PROBLEMA = /papel .* (tem|é membro|pode)/;

async function comPapelRuim(
  atributos: string,
  preparar: (c: pg.Client, papel: string) => Promise<void>,
  fn: (verificar: () => Promise<unknown>) => Promise<void>,
): Promise<void> {
  await bancoDeTeste(
    async (dono) => {
      const papel = `teste_papel_${randomBytes(4).toString('hex')}`;
      await comCliente(dono, async (c) => {
        await c.query(`CREATE ROLE ${papel} LOGIN ${atributos}`);
        try {
          await preparar(c, papel);
          await fn(() => c.query('SELECT conferir_papel_app($1)', [papel]));
        } finally {
          await c.query(`DROP OWNED BY ${papel}`);
          await c.query(`DROP ROLE ${papel}`);
        }
      });
    },
    { migrado: true },
  );
}

const nada = async (): Promise<void> => {};

describe('AD-023: conferência dos privilégios do papel do app', () => {
  it('AD-023: o mj_app migrado passa na conferência (a migração rodou sem falhar)', async () => {
    await bancoDeTeste(
      async (dono) => {
        const r = await comCliente(dono, (c) => c.query('SELECT conferir_papel_app($1)', [PAPEL_APP]));
        expect(r.rowCount).toBe(1);
        const { rows } = await comCliente(dono, (c) =>
          c.query("SELECT 1 FROM pgmigrations WHERE name LIKE '%conferir_papel_app'"),
        );
        expect(rows).toHaveLength(1);
      },
      { migrado: true },
    );
  });

  it('AD-023: papel inexistente falha', async () => {
    await bancoDeTeste(
      async (dono) => {
        await expect(
          comCliente(dono, (c) => c.query("SELECT conferir_papel_app('teste_papel_que_nao_existe')")),
        ).rejects.toThrow(/não existe/);
      },
      { migrado: true },
    );
  });

  it.each([
    ['SUPERUSER', 'SUPERUSER'],
    ['BYPASSRLS', 'BYPASSRLS'],
    ['CREATEROLE', 'CREATEROLE'],
    ['CREATEDB', 'CREATEDB'],
  ])('AD-023: papel com %s falha', async (_nome, atributo) => {
    await comPapelRuim(atributo, nada, async (verificar) => {
      await expect(verificar()).rejects.toThrow(PROBLEMA);
    });
  });

  it.each([['pg_read_all_data'], ['pg_write_all_data']])('AD-023: papel membro de %s falha', async (grupo) => {
    await comPapelRuim(
      'NOSUPERUSER',
      (c, papel) => c.query(`GRANT ${grupo} TO ${papel}`).then(() => undefined),
      async (verificar) => {
        await expect(verificar()).rejects.toThrow(new RegExp(grupo));
      },
    );
  });

  it('AD-023: papel membro de neon_superuser falha', async () => {
    // Fora do Neon o grupo não existe: cria-se um de mesmo nome só neste teste e apaga-se no fim.
    let criou = false;
    try {
      await comPapelRuim(
        'NOSUPERUSER',
        async (c, papel) => {
          const { rowCount } = await c.query("SELECT 1 FROM pg_roles WHERE rolname = 'neon_superuser'");
          criou = rowCount === 0;
          if (criou) await c.query('CREATE ROLE neon_superuser NOLOGIN');
          await c.query(`GRANT neon_superuser TO ${papel}`);
        },
        async (verificar) => {
          await expect(verificar()).rejects.toThrow(/neon_superuser/);
        },
      );
    } finally {
      if (criou)
        await comCliente(process.env.DATABASE_URL_TESTE ?? '', (c) => c.query('DROP ROLE IF EXISTS neon_superuser'));
    }
  });

  // A-15: o `/preparar` cria o mj_app `NOINHERIT`; nesse papel a membresia não dá privilégio direto, e `pg_has_role(...,
  // 'USAGE')` não a enxerga. A conferência usa 'MEMBER', e estes testes morrem se ela voltar a olhar só a herança.
  it.each([['pg_read_all_data'], ['pg_write_all_data']])(
    'AD-023: papel NOINHERIT membro de %s falha',
    async (grupo) => {
      await comPapelRuim(
        'NOSUPERUSER NOINHERIT',
        (c, papel) => c.query(`GRANT ${grupo} TO ${papel}`).then(() => undefined),
        async (verificar) => {
          await expect(verificar()).rejects.toThrow(new RegExp(grupo));
        },
      );
    },
  );

  it('AD-023: papel NOINHERIT membro de neon_superuser falha', async () => {
    let criou = false;
    try {
      await comPapelRuim(
        'NOSUPERUSER NOINHERIT',
        async (c, papel) => {
          const { rowCount } = await c.query("SELECT 1 FROM pg_roles WHERE rolname = 'neon_superuser'");
          criou = rowCount === 0;
          if (criou) await c.query('CREATE ROLE neon_superuser NOLOGIN');
          await c.query(`GRANT neon_superuser TO ${papel}`);
        },
        async (verificar) => {
          await expect(verificar()).rejects.toThrow(/neon_superuser/);
        },
      );
    } finally {
      if (criou)
        await comCliente(process.env.DATABASE_URL_TESTE ?? '', (c) => c.query('DROP ROLE IF EXISTS neon_superuser'));
    }
  });

  it('AD-023: papel que lê usuarios.senha_hash falha', async () => {
    await comPapelRuim(
      'NOSUPERUSER',
      (c, papel) => c.query(`GRANT SELECT (senha_hash) ON usuarios TO ${papel}`).then(() => undefined),
      async (verificar) => {
        await expect(verificar()).rejects.toThrow(/senha_hash/);
      },
    );
  });

  it.each([['INSERT'], ['UPDATE'], ['DELETE']])('AD-023: papel com %s em resumos falha', async (comando) => {
    await comPapelRuim(
      'NOSUPERUSER',
      (c, papel) => c.query(`GRANT ${comando} ON resumos TO ${papel}`).then(() => undefined),
      async (verificar) => {
        await expect(verificar()).rejects.toThrow(/resumos/);
      },
    );
  });

  it('AD-023: papel sem nenhum privilégio a mais passa', async () => {
    await comPapelRuim('NOSUPERUSER', nada, async (verificar) => {
      await expect(verificar()).resolves.toMatchObject({ rowCount: 1 });
    });
  });
});
