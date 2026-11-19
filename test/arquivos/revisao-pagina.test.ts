import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const RAIZ = process.cwd();
const html = readFileSync(join(RAIZ, 'revisao', 'index.html'), 'utf8');

describe('revisao/index.html (FUN-112)', () => {
  it('FUN-112: só carrega arquivos relativos (src e href), nada de endereço absoluto nem de outro site', () => {
    const enderecos = [...html.matchAll(/\b(?:src|href)="([^"]*)"/g)].map((m) => m[1] ?? '');
    expect(enderecos).toEqual(['./dist/pagina.js']);
    expect(html).not.toMatch(/https?:\/\//);
  });

  it('FUN-112: tem o ponto de montagem #revisao que a página procura', () => {
    expect(html).toContain('id="revisao"');
    expect(readFileSync(join(RAIZ, 'src', 'revisao', 'entrada.ts'), 'utf8')).toContain("getElementById('revisao')");
  });

  it('FUN-112: o script pnpm revisao:montar existe e aponta para a configuração do bundle', () => {
    const pacote = JSON.parse(readFileSync(join(RAIZ, 'package.json'), 'utf8')) as { scripts: Record<string, string> };
    expect(pacote.scripts['revisao:montar']).toContain('revisao/vite.config.ts');
    expect(readFileSync(join(RAIZ, 'revisao', 'vite.config.ts'), 'utf8')).toContain('entrada.ts');
  });
});
