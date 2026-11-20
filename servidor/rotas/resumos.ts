import type { Hono } from 'hono';
import type { AppEnv } from '../db/cliente.ts';
import type { Deps } from '../deps.ts';
import { buscar } from '../repositorios/resumos.ts';
import { criarRepositorioSessoes } from '../repositorios/sessoes.ts';
import { lerTokenSessao } from '../sessao/cookie.ts';

/** Inteiro de 1 a 66 sem zero à esquerda, sinal nem ponto (FUN-150). */
const LIVRO = /^[1-9][0-9]?$/;

/**
 * `GET /api/resumos/:n` (FUN-146 a FUN-150). Ordem da AD-024: sessão (401), dono (403), `n` de 1 a 66 (400), resumo
 * publicado (404). Quem não tem sessão de dono nunca aprende nada sobre o livro, nem se ele existe.
 */
export function rotasDeResumos(app: Hono<AppEnv>, deps: Deps): void {
  const agora = () => deps.agora?.() ?? new Date();

  app.get('/api/resumos/:n', async (c) => {
    const cliente = c.get('banco');
    const token = lerTokenSessao(c);
    const sessao = token ? await criarRepositorioSessoes(cliente, agora).validar(token) : null;
    if (!sessao) return c.json({ erro: 'sem_sessao' }, 401);
    if (!sessao.dono) return c.json({ erro: 'proibido' }, 403);

    const n = c.req.param('n');
    const livro = LIVRO.test(n) ? Number(n) : 0;
    if (livro < 1 || livro > 66) return c.json({ erro: 'livro_invalido' }, 400);

    const resumo = await buscar(cliente, livro);
    return resumo ? c.json(resumo, 200) : c.json({ erro: 'sem_resumo' }, 404);
  });
}
