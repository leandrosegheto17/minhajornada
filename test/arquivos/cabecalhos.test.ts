import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/** Cabeçalhos do site (FUN-42; AD-003): a Cloudflare os lê de `public/_headers`. */
const arquivo = readFileSync(join(process.cwd(), 'public', '_headers'), 'utf8');
const linhas = arquivo.split(/\r?\n/).filter((linha) => linha.trim() !== '' && !linha.trimStart().startsWith('#'));

/** Bloco `/*`: as linhas indentadas logo abaixo do padrão, como `Nome: valor`. */
function blocoTodos(): Map<string, string> {
  const inicio = linhas.findIndex((linha) => linha === '/*');
  const cabecalhos = new Map<string, string>();
  if (inicio < 0) return cabecalhos;
  for (const linha of linhas.slice(inicio + 1)) {
    if (!/^\s+/.test(linha)) break;
    const dois = linha.indexOf(':');
    cabecalhos.set(linha.slice(0, dois).trim().toLowerCase(), linha.slice(dois + 1).trim());
  }
  return cabecalhos;
}

const bloco = blocoTodos();
const csp = bloco.get('content-security-policy') ?? '';
const diretivas = new Map(
  csp
    .split(';')
    .map((d) => d.trim())
    .filter(Boolean)
    .map((d) => {
      const [nome = '', ...valores] = d.split(/\s+/);
      return [nome, valores.join(' ')] as const;
    }),
);

describe('public/_headers (FUN-42)', () => {
  it('FUN-42: os cabeçalhos valem para todo o site (bloco /*)', () => {
    expect(linhas[0]).toBe('/*');
    expect(bloco.size).toBeGreaterThan(0);
  });

  it.each([
    ['default-src', "'self'"],
    ['script-src', "'self'"],
    ['style-src', "'self'"],
    ['img-src', "'self'"],
    ['connect-src', "'self'"],
    ['manifest-src', "'self'"],
    ['worker-src', "'self'"],
    ['object-src', "'none'"],
    ['base-uri', "'none'"],
    ['form-action', "'none'"],
    ['frame-ancestors', "'none'"],
  ])('FUN-42: a CSP traz %s com o valor exato %s', (nome, valor) => {
    expect(diretivas.get(nome)).toBe(valor);
  });

  it('FUN-42: a CSP não libera unsafe-inline, unsafe-eval, curinga, data:, blob: nem domínio externo', () => {
    expect(csp).not.toMatch(/unsafe-inline|unsafe-eval|unsafe-hashes/);
    for (const [nome, valor] of diretivas) {
      for (const fonte of valor.split(/\s+/)) {
        expect(["'self'", "'none'"], `${nome} ${fonte}`).toContain(fonte);
      }
    }
  });

  it('FUN-42: X-Content-Type-Options é nosniff', () => {
    expect(bloco.get('x-content-type-options')).toBe('nosniff');
  });

  it('FUN-42: Referrer-Policy é same-origin e não no-referrer', () => {
    expect(bloco.get('referrer-policy')).toBe('same-origin');
    expect(arquivo).not.toMatch(/Referrer-Policy:\s*no-referrer/i);
  });
});
