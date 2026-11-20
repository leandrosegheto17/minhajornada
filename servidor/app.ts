import { Hono } from 'hono';
import type { Deps } from './deps.ts';

/**
 * App Hono da API (AD-022, design: "Servidor"). Recebe as dependências por parâmetro: o Worker injeta Hyperdrive e o
 * binding de limite, e os testes injetam o Postgres local e dublês. Só `/api/*` chega aqui (`run_worker_first`).
 */
export function criarApp(_deps: Deps): Hono {
  const app = new Hono();
  // Rota desconhecida da API é 404 em JSON: sem isso o `not_found_handling` dos assets devolveria o index.html.
  app.notFound((c) => c.json({ erro: 'nao_encontrado' }, 404));
  return app;
}
