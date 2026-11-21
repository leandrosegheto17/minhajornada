import type { ClienteRequisicao } from '../db/cliente.ts';
import { gerarToken, hashToken, tokenTemFormato } from '../sessao/token.ts';

/**
 * Sessões opacas (reuso.md R6, FUN-141, FUN-144). O banco guarda só o SHA-256 do token. Vale enquanto a criação tem
 * menos de 30 dias E o último uso tem menos de 7; vencida é tratada como inexistente e apagada. O relógio vem de
 * fora (`agora`), nunca do `now()` do banco, para o teste poder mover o tempo.
 */
export const ABSOLUTA_DIAS = 30;
export const INATIVIDADE_DIAS = 7;
/** `usada_em` só é regravado se tiver mais de 60 s (poupa escrita). */
export const REGRAVAR_USO_APOS_S = 60;

export interface SessaoValida {
  usuarioId: string;
  dono: boolean;
}

export interface RepositorioSessoes {
  /** Cria a sessão e devolve o token em claro (vai só para o cookie) e se o usuário é o dono. */
  criar(usuarioId: string): Promise<{ token: string; dono: boolean }>;
  /** Devolve o usuário da sessão válida (renovando o uso) ou `null`; vencida é apagada. */
  validar(token: string): Promise<SessaoValida | null>;
  /** Apaga a sessão do token; token inexistente ou fora do formato não é erro. */
  apagar(token: string): Promise<void>;
}

export function criarRepositorioSessoes(cliente: ClienteRequisicao, agora: () => Date): RepositorioSessoes {
  return {
    async criar(usuarioId) {
      const token = gerarToken();
      const instante = agora().toISOString();
      const r = await cliente.consultar<{ dono: boolean }>(
        `WITH nova AS (
           INSERT INTO sessoes (token_hash, usuario_id, criada_em, usada_em)
           VALUES ($1, $2, $3::timestamptz, $3::timestamptz)
           RETURNING usuario_id)
         SELECT u.dono FROM usuarios u JOIN nova ON nova.usuario_id = u.id`,
        [await hashToken(token), usuarioId, instante],
      );
      return { token, dono: r.rows[0]?.dono ?? false };
    },

    async validar(token) {
      if (!tokenTemFormato(token)) return null;
      const instante = agora().toISOString();
      // Uma instrução: confere os dois prazos, apaga a vencida e renova `usada_em` (no máximo 1 vez por minuto).
      const r = await cliente.consultar<{ usuario_id: string; dono: boolean; vale: boolean }>(
        `WITH alvo AS (
           SELECT s.token_hash, s.usuario_id, s.usada_em, u.dono,
                  (s.criada_em > $2::timestamptz - interval '${ABSOLUTA_DIAS} days'
                   AND s.usada_em > $2::timestamptz - interval '${INATIVIDADE_DIAS} days') AS vale
             FROM sessoes s JOIN usuarios u ON u.id = s.usuario_id
            WHERE s.token_hash = $1),
         apagada AS (
           DELETE FROM sessoes s USING alvo a WHERE s.token_hash = a.token_hash AND NOT a.vale),
         renovada AS (
           UPDATE sessoes s SET usada_em = $2::timestamptz
             FROM alvo a
            WHERE s.token_hash = a.token_hash AND a.vale
              AND a.usada_em < $2::timestamptz - interval '${REGRAVAR_USO_APOS_S} seconds')
         SELECT usuario_id, dono, vale FROM alvo`,
        [await hashToken(token), instante],
      );
      const linha = r.rows[0];
      return linha?.vale ? { usuarioId: linha.usuario_id, dono: linha.dono } : null;
    },

    async apagar(token) {
      if (!tokenTemFormato(token)) return;
      await cliente.consultar('DELETE FROM sessoes WHERE token_hash = $1', [await hashToken(token)]);
    },
  };
}
