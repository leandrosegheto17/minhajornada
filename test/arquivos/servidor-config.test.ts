import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const ler = (caminho: string) => readFileSync(new URL(`../../${caminho}`, import.meta.url), 'utf8');

describe('configuração do servidor (AD-022)', () => {
  it('o typecheck roda também o alvo do servidor, com os tipos do Workers só nele', () => {
    const pacote = JSON.parse(ler('package.json')) as { scripts: Record<string, string> };
    expect(pacote.scripts.typecheck).toContain('tsc --noEmit -p tsconfig.servidor.json');

    const alvo = JSON.parse(ler('tsconfig.servidor.json')) as {
      include: string[];
      compilerOptions: { types: string[] };
    };
    expect(alvo.include).toContain('servidor');
    expect(alvo.compilerOptions.types).toContain('@cloudflare/workers-types');
    const principal = JSON.parse(ler('tsconfig.json')) as { compilerOptions: { types: string[] } };
    expect(principal.compilerOptions.types).not.toContain('@cloudflare/workers-types');
  });

  it('o Vitest tem o projeto "servidor", em node, para servidor/ e scripts/', () => {
    const config = ler('vite.config.ts');
    expect(config).toMatch(/name: 'servidor'/);
    expect(config).toMatch(/environment: 'node'[\s\S]*servidor\/\*\*\/\*\.test\.ts/);
    expect(config).toContain('scripts/**/*.test.ts');
  });

  it('a regra de FUN-04 (sem HTML interpretado) vale também para servidor/', () => {
    const eslint = ler('eslint.config.mjs');
    expect(eslint).toMatch(
      /files: \[[^\]]*'servidor\/\*\*\/\*\.\{ts,mjs\}'[^\]]*\],\s*ignores: \['src\/\*\*\/\*\.test\.\{ts,tsx\}'\]/,
    );
  });
});
