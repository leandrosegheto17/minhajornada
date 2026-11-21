import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { gerarToken, hashToken, tokenTemFormato } from './token.ts';

describe('token da sessão (FUN-141)', () => {
  it('FUN-141: o token tem 43 caracteres base64url', () => {
    expect(gerarToken()).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it('FUN-141: dois tokens nunca são iguais em 1.000 gerações', () => {
    const tokens = new Set(Array.from({ length: 1000 }, () => gerarToken()));
    expect(tokens.size).toBe(1000);
  });

  it('FUN-141: o hash tem 32 bytes e é o SHA-256 do token', async () => {
    const token = gerarToken();
    const hash = await hashToken(token);
    expect(hash).toHaveLength(32);
    expect(Buffer.from(hash).equals(createHash('sha256').update(token).digest())).toBe(true);
  });

  it.each([
    ['token gerado', gerarToken(), true],
    ['42 caracteres', 'a'.repeat(42), false],
    ['44 caracteres', 'a'.repeat(44), false],
    ['vazio', '', false],
    ['com +', 'a'.repeat(42) + '+', false],
    ['com /', 'a'.repeat(42) + '/', false],
    ['com =', 'a'.repeat(42) + '=', false],
    ['com espaço', 'a'.repeat(42) + ' ', false],
  ])('FUN-141: tokenTemFormato (%s) = %s', (_nome, token, esperado) => {
    expect(tokenTemFormato(token)).toBe(esperado);
  });
});
