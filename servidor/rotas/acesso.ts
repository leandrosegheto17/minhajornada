import type { Hono } from 'hono';
import type { AppEnv } from '../db/cliente.ts';
import type { Deps } from '../deps.ts';
import { criarRepositorioSessoes } from '../repositorios/sessoes.ts';
import { entrar } from '../repositorios/usuarios.ts';
import { definirCookieSessao, lerTokenSessao, limparCookieSessao } from '../sessao/cookie.ts';

const CREDENCIAIS = { erro: 'credenciais' } as const;

/** Corpo `{ email, senha }` com os dois campos em texto e não vazios; qualquer outra coisa é `null` (FUN-139). */
async function lerCredenciais(req: Request): Promise<{ email: string; senha: string } | null> {
  let corpo: unknown;
  try {
    corpo = await req.json();
  } catch {
    return null;
  }
  if (typeof corpo !== 'object' || corpo === null) return null;
  const { email, senha } = corpo as Record<string, unknown>;
  if (typeof email !== 'string' || typeof senha !== 'string') return null;
  const emailLimpo = email.trim().toLowerCase();
  return emailLimpo === '' || senha === '' ? null : { email: emailLimpo, senha };
}

/** `POST /api/entrar`, `GET /api/sessao` e `POST /api/sair` (FUN-138 a FUN-144); só com banco (`Deps.conectar`). */
export function rotasDeAcesso(app: Hono<AppEnv>, deps: Deps): void {
  const agora = () => deps.agora?.() ?? new Date();

  app.post('/api/entrar', async (c) => {
    const credenciais = await lerCredenciais(c.req.raw);
    if (!credenciais) return c.json(CREDENCIAIS, 401);
    const cliente = c.get('banco');
    const usuarioId = await entrar(cliente, credenciais.email, credenciais.senha);
    if (!usuarioId) return c.json(CREDENCIAIS, 401);
    const { token, dono } = await criarRepositorioSessoes(cliente, agora).criar(usuarioId);
    definirCookieSessao(c, token);
    return c.json({ dono }, 200);
  });

  app.get('/api/sessao', async (c) => {
    const token = lerTokenSessao(c);
    const sessao = token ? await criarRepositorioSessoes(c.get('banco'), agora).validar(token) : null;
    return sessao ? c.json({ dono: sessao.dono }, 200) : c.json({ erro: 'sem_sessao' }, 401);
  });

  // Sair é idempotente (reuso.md R7): apaga a sessão do cookie, se houver, e expira o cookie.
  app.post('/api/sair', async (c) => {
    const token = lerTokenSessao(c);
    if (token) await criarRepositorioSessoes(c.get('banco'), agora).apagar(token);
    limparCookieSessao(c);
    return c.body(null, 204);
  });
}
