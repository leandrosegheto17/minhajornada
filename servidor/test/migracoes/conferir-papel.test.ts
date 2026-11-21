import { randomBytes } from 'node:crypto';
import type pg from 'pg';
import { describe, expect, it } from 'vitest';
import { bancoDeTeste, comCliente, PAPEL_APP } from '../apoio/banco.ts';

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
          await fn(() => c.query('SELECT public.conferir_papel_app($1::name)', [papel]));
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

  // A-17: privilégio herdado por `SET ROLE`, TRUNCATE e escrita em usuarios também fazem a conferência falhar.
  it.each([['NOINHERIT'], ['INHERIT']])('AD-023: papel %s membro de qualquer outro papel falha', async (heranca) => {
    const grupo = `teste_grupo_${randomBytes(4).toString('hex')}`;
    await comPapelRuim(
      `NOSUPERUSER ${heranca}`,
      async (c, papel) => {
        await c.query(`CREATE ROLE ${grupo} NOLOGIN`);
        await c.query(`GRANT ${grupo} TO ${papel}`);
      },
      async (verificar) => {
        try {
          await expect(verificar()).rejects.toThrow(new RegExp(`membro de .*${grupo}`));
        } finally {
          await comCliente(process.env.DATABASE_URL_TESTE ?? '', (c) => c.query(`DROP ROLE IF EXISTS ${grupo}`));
        }
      },
    );
  });

  it.each([['resumos'], ['usuarios'], ['sessoes']])('AD-023: papel com TRUNCATE em %s falha', async (tabela) => {
    await comPapelRuim(
      'NOSUPERUSER',
      (c, papel) => c.query(`GRANT TRUNCATE ON ${tabela} TO ${papel}`).then(() => undefined),
      async (verificar) => {
        await expect(verificar()).rejects.toThrow(new RegExp(`TRUNCATE.* ${tabela}`));
      },
    );
  });

  it.each([['INSERT'], ['DELETE'], ['UPDATE (dono)']])('AD-023: papel com %s em usuarios falha', async (comando) => {
    await comPapelRuim(
      'NOSUPERUSER',
      (c, papel) => c.query(`GRANT ${comando} ON usuarios TO ${papel}`).then(() => undefined),
      async (verificar) => {
        await expect(verificar()).rejects.toThrow(/escrever em usuarios/);
      },
    );
  });

  // A-20: dono do banco (membro implícito de `pg_database_owner`, dono do schema `public`), CREATE no banco ou num schema e
  // dono de schema deixam o papel apagar ou sombrear objetos do dono; a conferência os recusa.
  it('AD-023 A-20: papel dono do banco falha', async () => {
    let dono = '';
    let banco = '';
    await comPapelRuim(
      'NOSUPERUSER',
      async (c, papel) => {
        const { rows } = await c.query(
          'SELECT current_database() AS banco, pg_get_userbyid(datdba) AS dono FROM pg_database WHERE datname = current_database()',
        );
        banco = rows[0].banco;
        dono = rows[0].dono;
        await c.query(`ALTER DATABASE "${banco}" OWNER TO ${papel}`);
      },
      async (verificar) => {
        try {
          await expect(verificar()).rejects.toThrow(/dono do banco/);
        } finally {
          await comCliente(process.env.DATABASE_URL_TESTE ?? '', (c) =>
            c.query(`ALTER DATABASE "${banco}" OWNER TO "${dono}"`),
          );
        }
      },
    );
  });

  it('AD-023 A-20: papel com CREATE no banco falha', async () => {
    await comPapelRuim(
      'NOSUPERUSER',
      async (c, papel) => {
        const { rows } = await c.query('SELECT current_database() AS banco');
        await c.query(`GRANT CREATE ON DATABASE "${rows[0].banco}" TO ${papel}`);
      },
      async (verificar) => {
        await expect(verificar()).rejects.toThrow(/CREATE no banco/);
      },
    );
  });

  it('AD-023 A-20: papel com CREATE no schema public falha', async () => {
    await comPapelRuim(
      'NOSUPERUSER',
      (c, papel) => c.query(`GRANT CREATE ON SCHEMA public TO ${papel}`).then(() => undefined),
      async (verificar) => {
        await expect(verificar()).rejects.toThrow(/CREATE no schema public/);
      },
    );
  });

  it('AD-023 A-20: papel com CREATE em outro schema falha', async () => {
    const schema = `teste_schema_${randomBytes(4).toString('hex')}`;
    await comPapelRuim(
      'NOSUPERUSER',
      async (c, papel) => {
        await c.query(`CREATE SCHEMA ${schema}`);
        await c.query(`GRANT CREATE ON SCHEMA ${schema} TO ${papel}`);
      },
      async (verificar) => {
        // O schema nasce no banco descartável do teste e some com ele.
        await expect(verificar()).rejects.toThrow(new RegExp(`CREATE no schema ${schema}`));
      },
    );
  });

  it('AD-023 A-20: papel dono de um schema falha', async () => {
    const schema = `teste_schema_${randomBytes(4).toString('hex')}`;
    await comPapelRuim(
      'NOSUPERUSER',
      (c, papel) => c.query(`CREATE SCHEMA ${schema} AUTHORIZATION ${papel}`).then(() => undefined),
      async (verificar) => {
        await expect(verificar()).rejects.toThrow(new RegExp(`dono do schema ${schema}`));
      },
    );
  });

  // A-21: REPLICATION lê as gravações pelo slot lógico sem privilégio de tabela; TRIGGER roda código como o dono;
  // REFERENCES trava a tabela; e o app lê só `id` e `dono` de usuarios (e-mail é dado pessoal).
  it('AD-023 A-21: papel com REPLICATION falha', async () => {
    await comPapelRuim('NOSUPERUSER REPLICATION', nada, async (verificar) => {
      await expect(verificar()).rejects.toThrow(/rolreplication/);
    });
  });

  it.each([
    ['TRIGGER', 'resumos'],
    ['TRIGGER', 'usuarios'],
    ['TRIGGER', 'sessoes'],
    ['REFERENCES', 'resumos'],
    ['REFERENCES', 'usuarios'],
    ['REFERENCES', 'sessoes'],
  ])('AD-023 A-21: papel com %s em %s falha', async (comando, tabela) => {
    await comPapelRuim(
      'NOSUPERUSER',
      (c, papel) => c.query(`GRANT ${comando} ON ${tabela} TO ${papel}`).then(() => undefined),
      async (verificar) => {
        await expect(verificar()).rejects.toThrow(new RegExp(`${comando}.* ${tabela}`));
      },
    );
  });

  it.each([['email'], ['criado_em']])('AD-023 A-21: papel que lê usuarios.%s falha', async (coluna) => {
    await comPapelRuim(
      'NOSUPERUSER',
      (c, papel) => c.query(`GRANT SELECT (${coluna}) ON usuarios TO ${papel}`).then(() => undefined),
      async (verificar) => {
        await expect(verificar()).rejects.toThrow(new RegExp(`usuarios\\.${coluna}`));
      },
    );
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

  // A-26: dono de função, de tabela/visão/sequência ou de tipo roda código ou muda objeto como dono desse objeto
  // (ex.: função própria no search_path do dono); a conferência recusa cada um.
  it.each([
    ['função', (papel: string) => `CREATE FUNCTION public.f_${papel}() RETURNS int LANGUAGE sql AS 'SELECT 1'; ALTER FUNCTION public.f_${papel}() OWNER TO ${papel}`, /dono de função/],
    ['tabela', (papel: string) => `CREATE TABLE public.t_${papel} (id int); ALTER TABLE public.t_${papel} OWNER TO ${papel}`, /dono de tabela, visão ou sequência/],
    ['visão', (papel: string) => `CREATE VIEW public.v_${papel} AS SELECT 1 AS n; ALTER VIEW public.v_${papel} OWNER TO ${papel}`, /dono de tabela, visão ou sequência/],
    ['sequência', (papel: string) => `CREATE SEQUENCE public.s_${papel}; ALTER SEQUENCE public.s_${papel} OWNER TO ${papel}`, /dono de tabela, visão ou sequência/],
    ['tipo', (papel: string) => `CREATE TYPE public.ty_${papel} AS ENUM ('a'); ALTER TYPE public.ty_${papel} OWNER TO ${papel}`, /dono de tipo/],
  ])('AD-023 A-26: papel dono de %s falha', async (_nome, sql, mensagem) => {
    await comPapelRuim(
      'NOSUPERUSER',
      (c, papel) => c.query(sql(papel)).then(() => undefined),
      async (verificar) => {
        await expect(verificar()).rejects.toThrow(mensagem);
      },
    );
  });

  // A-26: uma sobrecarga `(text)` falsa em `public` ganharia de um literal sem tipo; chamada com `::name` não.
  it('AD-023 A-26: com a sobrecarga (text) falsa em public, a chamada com ::name ainda recusa um papel SUPERUSER', async () => {
    await comPapelRuim(
      'SUPERUSER',
      (c) =>
        c
          .query('CREATE FUNCTION public.conferir_papel_app(text) RETURNS void LANGUAGE sql AS $$ SELECT $$')
          .then(() => undefined),
      async (verificar) => {
        await expect(verificar()).rejects.toThrow(/rolsuper/);
      },
    );
  });

  // A-27: `GRANT REFERENCES (coluna)` não aparece em `has_table_privilege`; só `has_any_column_privilege` enxerga.
  it.each([
    ['usuarios', 'email'],
    ['resumos', 'livro'],
    ['sessoes', 'usuario_id'],
  ])('AD-023 A-27: papel com REFERENCES em coluna de %s (%s) falha', async (tabela, coluna) => {
    await comPapelRuim(
      'NOSUPERUSER',
      (c, papel) => c.query(`GRANT REFERENCES (${coluna}) ON ${tabela} TO ${papel}`).then(() => undefined),
      async (verificar) => {
        await expect(verificar()).rejects.toThrow(new RegExp(`REFERENCES.* ${tabela}`));
      },
    );
  });

  it('AD-023: papel sem nenhum privilégio a mais passa', async () => {
    await comPapelRuim('NOSUPERUSER', nada, async (verificar) => {
      await expect(verificar()).resolves.toMatchObject({ rowCount: 1 });
    });
  });
});
