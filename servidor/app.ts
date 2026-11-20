import { Hono } from 'hono';
import type { Deps } from './deps.ts';
import { cabecalhos } from './middlewares/cabecalhos.ts';
import { guarda } from './middlewares/guarda.ts';
import { limiteEntrar } from './middlewares/limite.ts';

/**
 * App Hono da API (AD-022, design: "Servidor"). Recebe as dependências por parâmetro: o Worker injeta Hyperdrive e o
 * binding de limite, e os testes injetam o Postgres local e dublês. Só `/api/*` chega aqui (`run_worker_first`).
 *
 * Ordem em `/api/*`: cabeçalhos (valem também para as recusas) → guarda de Host e de origem → limite do login (só no
 * POST de entrar) → rotas.
 */
export function criarApp(deps: Deps): Hono {
  const app = new Hono();
  app.use('/api/*', cabecalhos());
  app.use('/api/*', guarda(deps));
  app.post('/api/entrar', limiteEntrar(deps));
  // Rota desconhecida da API é 404 em JSON: sem isso o `not_found_handling` dos assets devolveria o index.html.
  app.notFound((c) => c.json({ erro: 'nao_encontrado' }, 404));
  return app;
}
