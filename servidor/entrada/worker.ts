import { criarApp } from '../app.ts';
import type { Deps } from '../deps.ts';

/** Bindings do Worker (`wrangler.jsonc`): a URL pública, o Hyperdrive do Neon e o limite de login. */
export interface Env {
  URL_PUBLICA?: string;
  HYPERDRIVE?: Hyperdrive;
  LIMITE_ENTRAR?: RateLimit;
}

/** Monta as dependências do app a partir do `env`; cada tarefa do servidor liga aqui o que passa a usar (T10). */
export function depsDoEnv(env: Env): Deps {
  return { urlPublica: env.URL_PUBLICA, limiteEntrar: env.LIMITE_ENTRAR };
}

// Só ligação: o que decide vive em `criarApp`, testado com dublês. Só /api/* chega aqui (`run_worker_first`).
export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext): Response | Promise<Response> {
    return criarApp(depsDoEnv(env)).fetch(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;
