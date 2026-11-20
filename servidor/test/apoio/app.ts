import type { Hono } from 'hono';
import { criarApp } from '../../app.ts';
import { criarCliente, type AppEnv } from '../../db/cliente.ts';
import type { LimiteTentativas } from '../../deps.ts';
import { bancoDeTeste, comCliente, PAPEL_APP, SENHA_PAPEL_APP, urlComoPapel } from './banco.ts';

export const URL_APP = 'https://minhajornada-tst.ljssoftware.com.br';
export const SENHA_DE_EXEMPLO = 'senha-de-exemplo-123';

export interface Ambiente {
  app: Hono<AppEnv>;
  /** URL do banco como papel dono (preparar dados) e como `mj_app` (o que o app usa). */
  urlDono: string;
  urlApp: string;
  /** Relógio injetado no app; o teste pode mudar `agora.valor`. */
  agora: { valor: Date };
  /** Linhas de log que o app emitiu. */
  log: string[];
  /** Chaves que o limite falso recebeu. */
  chavesDoLimite: string[];
  criarUsuario(email: string, opcoes?: { dono?: boolean; senha?: string }): Promise<string>;
  pedir(caminho: string, init?: RequestInit): Promise<Response>;
}

/** Banco migrado, app com o papel `mj_app`, limite falso (5 por chave) e relógio injetado. */
export async function comAmbiente(fn: (a: Ambiente) => Promise<void>): Promise<void> {
  await bancoDeTeste(
    async (urlDono) => {
      const urlApp = urlComoPapel(urlDono, PAPEL_APP, SENHA_PAPEL_APP);
      const contagem = new Map<string, number>();
      const chavesDoLimite: string[] = [];
      const limite: LimiteTentativas = {
        async limit({ key }) {
          chavesDoLimite.push(key);
          const n = (contagem.get(key) ?? 0) + 1;
          contagem.set(key, n);
          return { success: n <= 5 };
        },
      };
      const agora = { valor: new Date('2026-11-20T12:00:00Z') };
      const log: string[] = [];
      const app = criarApp({
        urlPublica: URL_APP,
        limiteEntrar: limite,
        conectar: () => criarCliente(urlApp),
        agora: () => agora.valor,
        log: (l) => log.push(l),
      });
      await fn({
        app,
        urlDono,
        urlApp,
        agora,
        log,
        chavesDoLimite,
        async criarUsuario(email, o = {}) {
          const { rows } = await comCliente(urlDono, (c) =>
            c.query(
              "INSERT INTO usuarios (email, senha_hash, dono) VALUES ($1, crypt($2, gen_salt('bf', 12)), $3) RETURNING id",
              [email, o.senha ?? SENHA_DE_EXEMPLO, o.dono ?? false],
            ),
          );
          return rows[0]?.id as string;
        },
        pedir: async (caminho, init) => app.request(`${URL_APP}${caminho}`, init),
      });
    },
    { migrado: true },
  );
}
