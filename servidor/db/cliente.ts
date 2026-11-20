import type { MiddlewareHandler } from 'hono';
import pg from 'pg';

/**
 * Cliente `pg` de uma requisição (reuso.md R3): a conexão só abre na primeira consulta e o app a fecha no `finally`
 * de toda requisição. Requisição que não consulta não abre conexão.
 */

/** Mensagem fixa: nunca leva a URL, o host nem o erro do driver, que podem conter a senha. */
export const MENSAGEM_BANCO_INDISPONIVEL = 'Banco de dados indisponível. Tente de novo em instantes.';

export class ErroBancoIndisponivel extends Error {
  override name = 'ErroBancoIndisponivel';
  constructor() {
    super(MENSAGEM_BANCO_INDISPONIVEL);
  }
}

/** O que o cliente precisa do `pg.Client`; os testes trocam pela fábrica. */
export interface ConexaoPg {
  connect(): Promise<unknown>;
  query(sql: string, valores?: unknown[]): Promise<pg.QueryResult>;
  end(): Promise<void>;
}

export interface OpcoesCliente {
  /** Cria a conexão; padrão: `new pg.Client({ connectionString })`. */
  fabrica?: (connectionString: string) => ConexaoPg;
}

export interface ClienteRequisicao {
  /** Abre a conexão na primeira chamada e roda a consulta. */
  consultar<L extends pg.QueryResultRow = pg.QueryResultRow>(
    sql: string,
    valores?: unknown[],
  ): Promise<pg.QueryResult<L>>;
  /** Verdadeiro quando a conexão abriu. */
  aberto(): boolean;
  /** Fecha a conexão, se abriu. Nunca lança; chamadas repetidas não fazem nada. */
  fechar(): Promise<void>;
}

const fabricaPadrao = (connectionString: string): ConexaoPg => new pg.Client({ connectionString });

export function criarCliente(connectionString: string, opcoes: OpcoesCliente = {}): ClienteRequisicao {
  const fabrica = opcoes.fabrica ?? fabricaPadrao;
  let conexao: ConexaoPg | null = null;
  let abrindo: Promise<ConexaoPg> | null = null;
  let aberta = false;
  let fechado = false;

  async function abrir(): Promise<ConexaoPg> {
    if (fechado) throw new Error('Cliente da requisição já foi fechado.');
    try {
      const nova = fabrica(connectionString);
      conexao = nova;
      await nova.connect();
      aberta = true;
      return nova;
    } catch {
      // O erro do driver é descartado de propósito: pode trazer host, usuário ou senha.
      throw new ErroBancoIndisponivel();
    }
  }

  return {
    async consultar<L extends pg.QueryResultRow>(sql: string, valores?: unknown[]): Promise<pg.QueryResult<L>> {
      abrindo ??= abrir();
      const c = await abrindo;
      return (await c.query(sql, valores)) as pg.QueryResult<L>;
    },
    aberto: () => aberta,
    async fechar(): Promise<void> {
      if (fechado) return;
      fechado = true;
      // Espera uma abertura em andamento terminar (ou falhar) antes de fechar.
      await abrindo?.catch(() => undefined);
      await conexao?.end().catch(() => undefined);
    },
  };
}

/** `BEGIN`/`COMMIT`; qualquer erro faz `ROLLBACK` e propaga o erro original. */
export async function emTransacao<T>(
  cliente: ClienteRequisicao,
  fn: (cliente: ClienteRequisicao) => Promise<T>,
): Promise<T> {
  await cliente.consultar('BEGIN');
  try {
    const resultado = await fn(cliente);
    await cliente.consultar('COMMIT');
    return resultado;
  } catch (erro) {
    await cliente.consultar('ROLLBACK').catch(() => undefined);
    throw erro;
  }
}

/** Variáveis do contexto do Hono: o cliente da requisição, quando o app tem `conectar`. */
export type AppEnv = { Variables: { banco: ClienteRequisicao } };

/**
 * Cria o cliente da requisição (se o app tem `conectar`), deixa em `c.get('banco')` e o fecha no `finally`, qualquer
 * que seja o resultado, inclusive erro.
 */
export function comBanco(conectar: (() => ClienteRequisicao) | undefined): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    if (!conectar) return next();
    const cliente = conectar();
    c.set('banco', cliente);
    try {
      await next();
    } finally {
      await cliente.fechar();
    }
  };
}
