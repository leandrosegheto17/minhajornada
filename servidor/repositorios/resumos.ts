import type { Resumo } from '../../src/resumos/formato.ts';
import type { ClienteRequisicao } from '../db/cliente.ts';

/** Resumo publicado do livro (1 a 66) ou `null`; o papel do app só lê (AD-023). */
export async function buscar(cliente: ClienteRequisicao, livro: number): Promise<Resumo | null> {
  const r = await cliente.consultar<{ conteudo: Resumo }>('SELECT conteudo FROM resumos WHERE livro = $1', [livro]);
  return r.rows[0]?.conteudo ?? null;
}
