import { esquecerDono, lembrarDono } from './preferencias';

/**
 * Chamadas de sessão do app (FUN-138, FUN-139, FUN-140, FUN-145; reuso.md R18). O cookie `__Host-sessao` é HttpOnly:
 * o app nunca o lê, só manda `credentials: 'same-origin'`. A dica `mj:dono` (gravada com sessão de dono, apagada em
 * `sem` e no `sair`) decide o botão "Resumo" sem internet; não é credencial.
 */
export type ResultadoSessao = 'dono' | 'usuario' | 'sem' | 'rede';
export type ResultadoEntrar = 'dono' | 'usuario' | 'incorreto' | 'limite' | 'rede';

const CREDENCIAIS: RequestCredentials = 'same-origin';

/** Lê `{ dono }` do corpo de um 200; corpo ilegível ou de outra forma vale como falha de rede (`null`). */
async function lerDono(resposta: Response): Promise<boolean | null> {
  try {
    const corpo: unknown = await resposta.json();
    if (typeof corpo !== 'object' || corpo === null || !('dono' in corpo) || typeof corpo.dono !== 'boolean') {
      return null;
    }
    return corpo.dono;
  } catch {
    return null;
  }
}

function confirmar(dono: boolean): 'dono' | 'usuario' {
  if (dono) lembrarDono();
  else esquecerDono();
  return dono ? 'dono' : 'usuario';
}

/** `GET /api/sessao`: 200 → `dono`/`usuario`; 401 → `sem` (apaga a dica); rede fora ou erro do servidor → `rede` (mantém a dica). */
export async function lerSessao(): Promise<ResultadoSessao> {
  try {
    const resposta = await fetch('/api/sessao', { credentials: CREDENCIAIS });
    if (resposta.status === 401) {
      esquecerDono();
      return 'sem';
    }
    if (resposta.status !== 200) return 'rede';
    const dono = await lerDono(resposta);
    return dono === null ? 'rede' : confirmar(dono);
  } catch {
    return 'rede';
  }
}

/** `POST /api/entrar` com o corpo em JSON: 200 → `dono`/`usuario`; 401 → `incorreto`; 429 → `limite`; o resto → `rede`. */
export async function entrar(email: string, senha: string): Promise<ResultadoEntrar> {
  try {
    const resposta = await fetch('/api/entrar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: CREDENCIAIS,
      body: JSON.stringify({ email, senha }),
    });
    if (resposta.status === 401) return 'incorreto';
    if (resposta.status === 429) return 'limite';
    if (resposta.status !== 200) return 'rede';
    const dono = await lerDono(resposta);
    return dono === null ? 'rede' : confirmar(dono);
  } catch {
    return 'rede';
  }
}

/** `POST /api/sair`; a dica `mj:dono` some mesmo sem rede (FUN-143). Nunca lança. */
export async function sair(): Promise<void> {
  esquecerDono();
  try {
    await fetch('/api/sair', { method: 'POST', credentials: CREDENCIAIS });
  } catch {
    // Sem rede: o aparelho já esqueceu o dono; o cookie expira no servidor.
  }
}
