import { Hono } from 'hono';
import { comBanco, type AppEnv } from './db/cliente.ts';
import type { Deps } from './deps.ts';
import { cabecalhos } from './middlewares/cabecalhos.ts';
import { guarda } from './middlewares/guarda.ts';
import { limiteEntrar } from './middlewares/limite.ts';

/**
 * App Hono da API (AD-022, design: "Servidor"). Recebe as dependências por parâmetro: o Worker injeta Hyperdrive e o
 * binding de limite, e os testes injetam o Postgres local e dublês. Só `/api/*` chega aqui (`run_worker_first`).
 *
 * Ordem em `/api/*`: cabeçalhos (valem também para as recusas) → guarda de Host e de origem → cliente do banco (fechado no fim de toda
 * requisição) → limite do login (só no POST de entrar) → rotas.
 */
export function criarApp(deps: Deps): Hono<AppEnv> {
  const app = new Hono<AppEnv>();
  app.use('/api/*', cabecalhos());
  app.use('/api/*', guarda(deps));
  app.use('/api/*', comBanco(deps.conectar));
  app.post('/api/entrar', limiteEntrar(deps));
  // Rota desconhecida da API é 404 em JSON: sem isso o `not_found_handling` dos assets devolveria o index.html.
  // Falha não tratada (banco fora, erro de código): resposta genérica; o erro nunca vai ao corpo nem ao log, pois pode
  // carregar host, usuário ou senha do banco.
  app.onError((_erro, c) => c.json({ erro: 'interno' }, 500));
  app.notFound((c) => c.json({ erro: 'nao_encontrado' }, 404));
  return app;
}
