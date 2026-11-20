import { describe, expect, it } from 'vitest';
import { bancoDeTeste, comCliente } from '../test/apoio/banco.ts';

const SENHA = 'senha-do-teste-123';

async function criarUsuario(url: string, email: string, senha = SENHA): Promise<string> {
  const { rows } = await comCliente(url, (c) =>
    c.query("INSERT INTO usuarios (email, senha_hash) VALUES ($1, crypt($2, gen_salt('bf', 12))) RETURNING id", [
      email,
      senha,
    ]),
  );
  return rows[0].id as string;
}

async function entrar(url: string, email: string, senha: string): Promise<string | null> {
  const { rows } = await comCliente(url, (c) => c.query('SELECT usuario_entrar($1, $2) AS id', [email, senha]));
  return rows[0].id as string | null;
}

describe('migração inicial: usuario_entrar (FUN-139)', () => {
  it('FUN-139: devolve o id com a senha certa', async () => {
    await bancoDeTeste(
      async (url) => {
        const id = await criarUsuario(url, 'leitor@exemplo.com');
        expect(await entrar(url, 'leitor@exemplo.com', SENHA)).toBe(id);
      },
      { migrado: true },
    );
  });

  it('FUN-139: devolve NULL com senha errada', async () => {
    await bancoDeTeste(
      async (url) => {
        await criarUsuario(url, 'leitor@exemplo.com');
        expect(await entrar(url, 'leitor@exemplo.com', 'outra-senha')).toBeNull();
      },
      { migrado: true },
    );
  });

  it('FUN-139: devolve NULL com e-mail inexistente', async () => {
    await bancoDeTeste(
      async (url) => {
        await criarUsuario(url, 'leitor@exemplo.com');
        expect(await entrar(url, 'ninguem@exemplo.com', SENHA)).toBeNull();
      },
      { migrado: true },
    );
  });

  it('FUN-139: devolve NULL com e-mail vazio e com senha vazia', async () => {
    await bancoDeTeste(
      async (url) => {
        await criarUsuario(url, 'leitor@exemplo.com');
        expect(await entrar(url, '', SENHA)).toBeNull();
        expect(await entrar(url, 'leitor@exemplo.com', '')).toBeNull();
        expect(await entrar(url, '', '')).toBeNull();
      },
      { migrado: true },
    );
  });

  it('FUN-139: e-mail inexistente também passa pelo hash fixo e não falha', async () => {
    await bancoDeTeste(
      async (url) => {
        const { rows } = await comCliente(url, (c) =>
          c.query("SELECT prosrc FROM pg_proc WHERE proname = 'usuario_entrar'"),
        );
        // O hash fixo é bcrypt de custo 12: sem conta, a comparação custa o mesmo.
        expect(rows[0].prosrc).toMatch(/\$2[abxy]\$12\$/);
        expect(await entrar(url, 'ninguem@exemplo.com', SENHA)).toBeNull();
      },
      { migrado: true },
    );
  });

  it('FUN-139: função é SECURITY DEFINER, com search_path fixo e sem EXECUTE para PUBLIC', async () => {
    await bancoDeTeste(
      async (url) => {
        const { rows } = await comCliente(url, (c) =>
          c.query(`SELECT p.prosecdef AS definer, p.proconfig AS config,
                   EXISTS (SELECT 1 FROM aclexplode(p.proacl) a WHERE a.grantee = 0) AS publico
                   FROM pg_proc p WHERE p.proname = 'usuario_entrar'`),
        );
        expect(rows[0].definer).toBe(true);
        expect((rows[0].config as string[]).some((x) => x.startsWith('search_path='))).toBe(true);
        expect(rows[0].publico).toBe(false);
      },
      { migrado: true },
    );
  });
});

describe('migração inicial: tabelas (FUN-141)', () => {
  it('FUN-141: senha_hash é bcrypt ($2…) e nunca igual à senha', async () => {
    await bancoDeTeste(
      async (url) => {
        await criarUsuario(url, 'leitor@exemplo.com');
        const { rows } = await comCliente(url, (c) => c.query('SELECT senha_hash FROM usuarios'));
        expect(rows[0].senha_hash).toMatch(/^\$2[abxy]\$12\$/);
        expect(rows[0].senha_hash).not.toBe(SENHA);
      },
      { migrado: true },
    );
  });

  it('FUN-141: senha em texto puro no senha_hash é recusada', async () => {
    await bancoDeTeste(
      async (url) => {
        await expect(
          comCliente(url, (c) => c.query("INSERT INTO usuarios (email, senha_hash) VALUES ('a@b.com', $1)", [SENHA])),
        ).rejects.toMatchObject({ code: '23514' });
      },
      { migrado: true },
    );
  });

  it('FUN-141: e-mail em caixa alta é recusado pelo CHECK', async () => {
    await bancoDeTeste(
      async (url) => {
        await expect(criarUsuario(url, 'Leitor@Exemplo.com')).rejects.toMatchObject({ code: '23514' });
      },
      { migrado: true },
    );
  });

  it('FUN-141: e-mail repetido é recusado (UNIQUE)', async () => {
    await bancoDeTeste(
      async (url) => {
        await criarUsuario(url, 'leitor@exemplo.com');
        await expect(criarUsuario(url, 'leitor@exemplo.com')).rejects.toMatchObject({ code: '23505' });
      },
      { migrado: true },
    );
  });

  it('FUN-141: dono começa falso', async () => {
    await bancoDeTeste(
      async (url) => {
        await criarUsuario(url, 'leitor@exemplo.com');
        const { rows } = await comCliente(url, (c) => c.query('SELECT dono FROM usuarios'));
        expect(rows[0].dono).toBe(false);
      },
      { migrado: true },
    );
  });

  it.each([0, 67, -1])('resumos.livro %i fora de 1 a 66 é recusado', async (livro) => {
    await bancoDeTeste(
      async (url) => {
        await expect(
          comCliente(url, (c) => c.query("INSERT INTO resumos (livro, conteudo) VALUES ($1, '{}')", [livro])),
        ).rejects.toMatchObject({ code: '23514' });
      },
      { migrado: true },
    );
  });

  it.each([1, 66])('resumos.livro %i (limite) é aceito', async (livro) => {
    await bancoDeTeste(
      async (url) => {
        await comCliente(url, (c) => c.query("INSERT INTO resumos (livro, conteudo) VALUES ($1, '{}')", [livro]));
      },
      { migrado: true },
    );
  });

  it('FUN-141: apagar o usuário apaga as sessões dele e só as dele', async () => {
    await bancoDeTeste(
      async (url) => {
        const a = await criarUsuario(url, 'a@exemplo.com');
        const b = await criarUsuario(url, 'b@exemplo.com');
        await comCliente(url, async (c) => {
          await c.query("INSERT INTO sessoes (token_hash, usuario_id) VALUES ('\\x01', $1), ('\\x02', $2)", [a, b]);
          await c.query('DELETE FROM usuarios WHERE id = $1', [a]);
          const { rows } = await c.query('SELECT usuario_id FROM sessoes');
          expect(rows).toEqual([{ usuario_id: b }]);
        });
      },
      { migrado: true },
    );
  });

  it('FUN-141: sessão com usuário inexistente é recusada (chave estrangeira)', async () => {
    await bancoDeTeste(
      async (url) => {
        await expect(
          comCliente(url, (c) =>
            c.query("INSERT INTO sessoes (token_hash, usuario_id) VALUES ('\\x01', gen_random_uuid())"),
          ),
        ).rejects.toMatchObject({ code: '23503' });
      },
      { migrado: true },
    );
  });
});
