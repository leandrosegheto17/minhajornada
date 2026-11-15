import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { lerToken } from '../../scripts/lerToken.mjs';

describe('tokens.css (esqueleto)', () => {
  it('é a cópia do mockup aprovado', () => {
    const app = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8');
    const mockup = readFileSync(new URL('../../.specs/mockup/tokens.css', import.meta.url), 'utf8');
    expect(app).toBe(mockup);
  });

  it('declara a cor de fundo do tema claro', () => {
    const css = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8');
    expect(lerToken(css, '--cor-fundo')).toBe('#FFFFFF');
  });
});
