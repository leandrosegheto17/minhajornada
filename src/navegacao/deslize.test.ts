import { describe, expect, it } from 'vitest';
import { classificarDeslize } from './deslize';

describe('classificarDeslize (FUN-16 a FUN-18)', () => {
  it('FUN-16: -60/0 (direita para a esquerda, no limiar) é seguinte', () => {
    expect(classificarDeslize(-60, 0)).toBe('seguinte');
  });

  it('FUN-16: -80/79 (horizontal maior que o vertical) é seguinte', () => {
    expect(classificarDeslize(-80, 79)).toBe('seguinte');
  });

  it('FUN-17: 60/0 (esquerda para a direita, no limiar) é anterior', () => {
    expect(classificarDeslize(60, 0)).toBe('anterior');
  });

  it('FUN-17: 80/-79 é anterior', () => {
    expect(classificarDeslize(80, -79)).toBe('anterior');
  });

  it.each([
    [-59, 0],
    [59, 0],
    [0, 0],
  ])('FUN-18: %i/%i (menos de 60 px) mantém o capítulo (null)', (dx, dy) => {
    expect(classificarDeslize(dx, dy)).toBeNull();
  });

  it.each([
    [-80, 80],
    [-80, 90],
    [80, -80],
    [80, 200],
  ])('FUN-18: %i/%i (horizontal não maior que o vertical) mantém o capítulo (null)', (dx, dy) => {
    expect(classificarDeslize(dx, dy)).toBeNull();
  });
});
