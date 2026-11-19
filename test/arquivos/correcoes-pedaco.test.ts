import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// A lista de correções vai num JS próprio de `assets/` (import dinâmico, AD-017) e o service worker o guarda junto do
// resto, para a tela abrir sem rede (FUN-124). Prova sobre um build de verdade, em pasta temporária.
let saida: string;

beforeAll(() => {
  saida = mkdtempSync(join(tmpdir(), 'mj-build-'));
  execFileSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--outDir', saida, '--emptyOutDir'], {
    cwd: process.cwd(),
    stdio: 'pipe',
  });
}, 240_000);

afterAll(() => rmSync(saida, { recursive: true, force: true }));

describe('lista de correções em pedaço separado (FUN-124)', () => {
  it('FUN-124: a lista gerada fica num arquivo JS próprio de assets/, fora do pacote principal', () => {
    const pedacos = readdirSync(join(saida, 'assets')).filter((n) => /^correcoes\.gerado-.*\.js$/.test(n));
    expect(pedacos).toHaveLength(1);
    const principal = readdirSync(join(saida, 'assets')).filter((n) => /^index-.*\.js$/.test(n));
    expect(principal.length).toBeGreaterThan(0);
    for (const nome of principal) {
      expect(readFileSync(join(saida, 'assets', nome), 'utf8')).toContain(pedacos[0] as string);
    }
  });

  it('FUN-124: o pré-cache do service worker lista o pedaço da lista', () => {
    const pedaco = readdirSync(join(saida, 'assets')).find((n) => /^correcoes\.gerado-.*\.js$/.test(n)) as string;
    expect(readFileSync(join(saida, 'sw.js'), 'utf8')).toContain(pedaco);
  });
});
