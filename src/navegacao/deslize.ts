/** Deslocamento horizontal mínimo, em px, para o gesto trocar de capítulo (FUN-16 a FUN-18). */
export const LIMIAR_DESLIZE = 60;

/**
 * Classifica o gesto (FUN-16 a FUN-18): da direita para a esquerda (`dx <= -60`) é "seguinte"; da esquerda para a
 * direita (`dx >= 60`) é "anterior"; em ambos, o deslocamento horizontal tem de ser maior que o vertical. Fora disso,
 * `null`: o capítulo atual fica (rolagem da página, toque, gesto curto).
 */
export function classificarDeslize(dx: number, dy: number): 'seguinte' | 'anterior' | null {
  if (!Number.isFinite(dx) || !Number.isFinite(dy)) return null;
  if (Math.abs(dx) <= Math.abs(dy)) return null;
  if (dx <= -LIMIAR_DESLIZE) return 'seguinte';
  if (dx >= LIMIAR_DESLIZE) return 'anterior';
  return null;
}
