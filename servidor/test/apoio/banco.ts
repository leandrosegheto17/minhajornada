import { randomBytes } from 'node:crypto';
import pg from 'pg';
import { migrar } from '../../migrar.ts';

/** Hosts em que o teste pode criar e apagar bancos: nunca um Neon (reuso.md R16). */
export const HOSTS_TESTE = ['127.0.0.1', 'localhost', 'postgres'] as const;

/** Papel do app (AD-023). No ambiente real o `/preparar` o cria; no teste, o apoio o cria no cluster local. */
export const PAPEL_APP = 'mj_app';
export const SENHA_PAPEL_APP = 'senha-so-de-teste';

export interface OpcoesBancoDeTeste {
  /** URL do cluster de teste (papel dono); padrão: `DATABASE_URL_TESTE`. */
  urlBase?: string;
  /** Aplica as migrações de `servidor/migracoes` (ou de `pastaMigracoes`) antes de entregar o banco. */
  migrado?: boolean;
  pastaMigracoes?: string;
}

/** Recusa a URL cujo host não está na lista, antes de abrir qualquer conexão. */
export function exigirHostPermitido(url: string, permitidos: readonly string[] = HOSTS_TESTE): void {
  let host: string;
  try {
    host = new URL(url).hostname;
  } catch {
    throw new Error('URL do banco de teste inválida: host não permitido.');
  }
  if (!permitidos.includes(host)) throw new Error(`Host do banco de teste não permitido: ${host}`);
}

function urlDoBanco(urlBase: string, nome: string): string {
  const u = new URL(urlBase);
  u.pathname = `/${nome}`;
  return u.toString();
}

/** A mesma URL de um banco, com o usuário e a senha de outro papel. */
export function urlComoPapel(url: string, papel: string, senha: string): string {
  const u = new URL(url);
  u.username = papel;
  u.password = senha;
  return u.toString();
}

async function comAdmin<T>(urlBase: string, fn: (c: pg.Client) => Promise<T>): Promise<T> {
  const c = new pg.Client({ connectionString: urlBase });
  await c.connect();
  try {
    return await fn(c);
  } finally {
    await c.end();
  }
}

export async function garantirPapelApp(c: pg.Client): Promise<void> {
  await c.query(`DO $$ BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${PAPEL_APP}') THEN
      CREATE ROLE ${PAPEL_APP} LOGIN NOSUPERUSER NOBYPASSRLS;
    END IF;
  END $$`);
  await c.query(`ALTER ROLE ${PAPEL_APP} PASSWORD '${SENHA_PAPEL_APP}'`);
}

/**
 * Cria um banco `teste_<hex>`, entrega a URL (papel dono) e o nome a `fn` e o apaga no `finally`, mesmo se `fn` lançar.
 * Recusa host fora de `HOSTS_TESTE` antes de conectar.
 */
export async function bancoDeTeste<T>(
  fn: (url: string, nome: string) => Promise<T>,
  opcoes: OpcoesBancoDeTeste = {},
): Promise<T> {
  const urlBase = opcoes.urlBase ?? process.env.DATABASE_URL_TESTE;
  if (!urlBase) throw new Error('DATABASE_URL_TESTE ausente: suba o Postgres local (Nível 1 do /preparar).');
  exigirHostPermitido(urlBase);
  const nome = `teste_${randomBytes(6).toString('hex')}`;
  await comAdmin(urlBase, async (c) => {
    if (opcoes.migrado) await garantirPapelApp(c);
    await c.query(`CREATE DATABASE ${nome}`);
  });
  try {
    const url = urlDoBanco(urlBase, nome);
    if (opcoes.migrado) await migrar(url, { pasta: opcoes.pastaMigracoes });
    return await fn(url, nome);
  } finally {
    await comAdmin(urlBase, (c) => c.query(`DROP DATABASE IF EXISTS ${nome} WITH (FORCE)`));
  }
}

/** Abre um cliente no banco dado, roda `fn` e fecha. */
export async function comCliente<T>(url: string, fn: (c: pg.Client) => Promise<T>): Promise<T> {
  return comAdmin(url, fn);
}
