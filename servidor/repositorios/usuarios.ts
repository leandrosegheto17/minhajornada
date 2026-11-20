import type { ClienteRequisicao } from '../db/cliente.ts';

/** Login pela função `usuario_entrar` do banco (FUN-139): o app nunca lê o hash da senha (AD-023). */
export async function entrar(cliente: ClienteRequisicao, email: string, senha: string): Promise<string | null> {
  const r = await cliente.consultar<{ id: string | null }>('SELECT usuario_entrar($1, $2) AS id', [email, senha]);
  return r.rows[0]?.id ?? null;
}
