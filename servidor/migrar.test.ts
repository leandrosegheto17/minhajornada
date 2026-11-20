import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { migrar } from './migrar.ts';
import { bancoDeTeste, comCliente, exigirHostPermitido } from './test/apoio/banco.ts';

const pastas: string[] = [];
afterEach(() => {
  for (const p of pastas.splice(0)) rmSync(p, { recursive: true, force: true });
});

function pastaComMigracao(): string {
  const pasta = mkdtempSync(join(tmpdir(), 'mj-migra-'));
  pastas.push(pasta);
  mkdirSync(pasta, { recursive: true });
  writeFileSync(
    join(pasta, '1700000000000_exemplo.sql'),
    '-- Up Migration\nCREATE TABLE exemplo (id int);\n-- Down Migration\nDROP TABLE exemplo;\n',
  );
  return pasta;
}

describe('migrar e banco de teste (T7, base de FUN-141 a FUN-149)', () => {
  it('migrar um banco vazio duas vezes não falha nem repete a migração', async () => {
    const pasta = pastaComMigracao();
    await bancoDeTeste(async (url) => {
      expect(await migrar(url, { pasta })).toHaveLength(1);
      expect(await migrar(url, { pasta })).toEqual([]);
      const { rows } = await comCliente(url, (c) => c.query('SELECT count(*)::int AS n FROM pgmigrations'));
      expect(rows[0].n).toBe(1);
    });
  });

  // A-22: com um schema de mesmo nome que o papel dono, `"$user"` vem antes de `public` no search_path padrão e a migração
  // (e a tabela de controle) iriam para lá; a migração fixa `public`.
  it('A-22 FUN-173: com um schema com o nome do dono, a migração e a tabela de controle ficam em public', async () => {
    const pasta = pastaComMigracao();
    await bancoDeTeste(async (url) => {
      await comCliente(url, async (c) => {
        const { rows } = await c.query('SELECT current_user AS usuario');
        await c.query(`CREATE SCHEMA "${rows[0].usuario}"`);
      });
      expect(await migrar(url, { pasta })).toHaveLength(1);
      const { rows } = await comCliente(url, (c) =>
        c.query(
          "SELECT to_regclass('public.exemplo') IS NOT NULL AS tabela, to_regclass('public.pgmigrations') IS NOT NULL AS controle",
        ),
      );
      expect(rows[0]).toEqual({ tabela: true, controle: true });
    });
  });

  it('falha provocada no meio do teste não deixa banco teste_* no cluster', async () => {
    let nome = '';
    await expect(
      bancoDeTeste(async (_url, n) => {
        nome = n;
        throw new Error('falha provocada');
      }),
    ).rejects.toThrow('falha provocada');
    expect(nome).toMatch(/^teste_[0-9a-f]{12}$/);
    const { rows } = await comCliente(process.env.DATABASE_URL_TESTE!, (c) =>
      c.query('SELECT 1 FROM pg_database WHERE datname = $1', [nome]),
    );
    expect(rows).toHaveLength(0);
  });

  it('falha de migração também apaga o banco criado', async () => {
    const pasta = mkdtempSync(join(tmpdir(), 'mj-migra-'));
    pastas.push(pasta);
    writeFileSync(join(pasta, '1700000000000_quebra.sql'), '-- Up Migration\nSELECT * FROM tabela_que_nao_existe;\n');
    const antes = await comCliente(process.env.DATABASE_URL_TESTE!, (c) =>
      c.query("SELECT datname FROM pg_database WHERE datname LIKE 'teste\\_%'"),
    );
    await expect(bancoDeTeste(async () => undefined, { migrado: true, pastaMigracoes: pasta })).rejects.toThrow();
    const depois = await comCliente(process.env.DATABASE_URL_TESTE!, (c) =>
      c.query("SELECT datname FROM pg_database WHERE datname LIKE 'teste\\_%'"),
    );
    expect(depois.rows).toEqual(antes.rows);
  });

  it('host fora da lista é recusado antes de conectar', async () => {
    // O host não resolve: se tentasse conectar, o erro seria de rede, não o de host recusado.
    await expect(bancoDeTeste(async () => 1, { urlBase: 'postgresql://u:s@ep-algo.neon.tech/neondb' })).rejects.toThrow(
      /host do banco de teste não permitido/i,
    );
  });

  it.each([
    ['127.0.0.1', true],
    ['localhost', true],
    ['postgres', true],
    ['127.0.0.1.exemplo.com', false],
    ['exemplo.com', false],
    ['', false],
  ])('exigirHostPermitido: %s permitido = %s', (host, permitido) => {
    const url = `postgresql://u:s@${host}:5432/x`;
    if (permitido) expect(() => exigirHostPermitido(url)).not.toThrow();
    else expect(() => exigirHostPermitido(url)).toThrow(/não permitido|inválida/i);
  });

  it('URL que não é URL também é recusada', () => {
    expect(() => exigirHostPermitido('isto nao e url')).toThrow(/inválida|não permitido/i);
  });
});
