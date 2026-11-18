import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// O jsdom não traz tipos: o `require` evita declarar um módulo só para este teste.
const { JSDOM } = createRequire(import.meta.url)('jsdom') as {
  JSDOM: new (html: string, opcoes: { contentType: string }) => { window: { document: { documentElement: Element } } };
};

/** Ícone do app em SVG (FUN-93, FUN-94): o `index.html` o usa como favicon. */
const svg = readFileSync(join(process.cwd(), 'public', 'icones', 'icone.svg'), 'utf8');

describe('ícone SVG (FUN-93, FUN-94)', () => {
  it('FUN-94: o SVG é XML válido (o parser não recusa)', () => {
    expect(() => new JSDOM(svg, { contentType: 'image/svg+xml' })).not.toThrow();
  });

  it('FUN-94: nenhum comentário contém "--" (o XML proíbe)', () => {
    const comentarios = [...svg.matchAll(/<!--([\s\S]*?)-->/g)].map((m) => m[1] ?? '');
    for (const texto of comentarios) expect(texto).not.toContain('--');
  });

  it('FUN-93: o ícone tem viewBox 512 e o caminho em vinho (#9A3B5B)', () => {
    const raiz = new JSDOM(svg, { contentType: 'image/svg+xml' }).window.document.documentElement;
    expect(raiz.getAttribute('viewBox')).toBe('0 0 512 512');
    expect(svg.toUpperCase()).toContain('#9A3B5B');
    expect(raiz.querySelector('path[fill="#9A3B5B"]')).not.toBeNull();
  });
});
