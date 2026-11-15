import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Workflow de deploy (A-05 e A-08 da rodada 1): o token da Cloudflare só chega ao que publica, e a fumaça confere os
 * cabeçalhos do FUN-42 em mais de um caminho. O arquivo é lido como texto (sem biblioteca de YAML).
 */
const texto = readFileSync(join(process.cwd(), '.github', 'workflows', 'deploy.yml'), 'utf8').replace(/\r\n/g, '\n');

/** Corpo do job `nome` (indentação de 2 espaços sob `jobs:`), sem os comentários. */
function job(nome: string): string {
  const linhas = texto.split('\n');
  const inicio = linhas.findIndex((l) => l === `  ${nome}:`);
  if (inicio < 0) return '';
  const corpo: string[] = [];
  for (const linha of linhas.slice(inicio + 1)) {
    if (/^ {2}\S/.test(linha) || /^\S/.test(linha)) break;
    if (!linha.trimStart().startsWith('#')) corpo.push(linha);
  }
  return corpo.join('\n');
}

/** Passos do job: cada um começa em `      - ` (6 espaços) e vai até o seguinte. */
function passos(corpo: string): string[] {
  return corpo
    .split(/\n(?= {6}- )/)
    .slice(1)
    .map((p) => (p.startsWith('      - ') ? p : `      - ${p}`));
}

describe('deploy.yml: o token da Cloudflare só chega ao wrangler (SEC-001, SEC-004)', () => {
  const publicar = job('publicar');
  const construir = job('construir');

  it('A-08: existe um job construir, sem nenhum segredo, que envia o dist/ como artefato', () => {
    expect(construir).not.toBe('');
    expect(construir).not.toMatch(/secrets\./);
    expect(construir).not.toMatch(/CLOUDFLARE/);
    expect(construir).toMatch(/pnpm build/);
    expect(construir).toMatch(/actions\/upload-artifact@[0-9a-f]{40}/);
  });

  it('A-08: o publicar depende do construir e baixa o artefato em vez de construir', () => {
    expect(publicar).toMatch(/needs:\s*\[?\s*construir/);
    expect(publicar).toMatch(/actions\/download-artifact@[0-9a-f]{40}/);
    expect(publicar).not.toMatch(/pnpm build/);
  });

  it('A-08: nenhum job declara o token em env de job (só em passo)', () => {
    for (const nome of ['conferir', 'construir', 'publicar']) {
      const corpo = job(nome);
      const antesDosPassos = corpo.split(/\n {4}steps:/)[0] ?? '';
      expect(antesDosPassos, `${nome}: env de job`).not.toMatch(/CLOUDFLARE_API_TOKEN/);
    }
  });

  it('A-08: o token aparece só em passos que rodam o wrangler', () => {
    const comToken = passos(publicar).filter((p) => /CLOUDFLARE_API_TOKEN/.test(p));
    expect(comToken.length).toBeGreaterThanOrEqual(2); // deploy e rollback
    for (const p of comToken) expect(p, p).toMatch(/pnpm exec wrangler (deploy|rollback)/);
    for (const p of passos(publicar).filter((q) => /pnpm install|pnpm build|checkout|setup-node/.test(q))) {
      expect(p).not.toMatch(/CLOUDFLARE|secrets\./);
    }
  });

  it('A-08: o publicar instala sem scripts de dependência e sem cache do pnpm (SEC-004)', () => {
    expect(publicar).toMatch(/pnpm install --frozen-lockfile --ignore-scripts/);
    expect(publicar).not.toMatch(/cache:\s*pnpm/);
  });

  it('A-08: as actions novas ficam fixadas por SHA', () => {
    const usos = [...texto.matchAll(/uses:\s*(\S+)/g)].map((m) => m[1] ?? '');
    expect(usos.length).toBeGreaterThan(0);
    for (const uso of usos) expect(uso, uso).toMatch(/@[0-9a-f]{40}$/);
  });
});

describe('deploy.yml: a fumaça confere os cabeçalhos do FUN-42 (A-05)', () => {
  const fumaca = passos(job('publicar')).find((p) => /Fumaça/.test(p)) ?? '';

  it('A-05: confere / , /sw.js e um livro do índice', () => {
    expect(fumaca).not.toBe('');
    expect(fumaca).toMatch(/\$\{URL_PUBLICA\}\/["\s]/);
    expect(fumaca).toMatch(/\/sw\.js/);
    expect(fumaca).toMatch(/\/livros\//);
  });

  it('A-12: FUN-42: o laço que confere os cabeçalhos passa exatamente por /, /sw.js e o livro', () => {
    const laco = /^\s*for caminho in (.+?); do\s*$/m.exec(fumaca);
    expect(laco, 'laço `for caminho in ...; do` ausente').not.toBeNull();
    expect(laco?.[1]?.trim().split(/\s+/)).toEqual(['"/"', '"/sw.js"', '"${livro}"']);
    // O livro é um arquivo de `dist/livros`, e o curl do laço lê os cabeçalhos de ${URL_PUBLICA}${caminho}.
    expect(fumaca).toMatch(/livro="\/livros\/\$\(ls dist\/livros/);
    expect(fumaca).toMatch(/-D - -o \/dev\/null "\$\{URL_PUBLICA\}\$\{caminho\}"/);
  });

  it.each([
    ['content-security-policy', "frame-ancestors 'none'"],
    ['content-security-policy', "default-src 'self'"],
    ['content-security-policy', "object-src 'none'"],
    ['x-content-type-options', 'nosniff'],
    ['referrer-policy', 'same-origin'],
  ])('A-05: exige %s com %s', (cabecalho, valor) => {
    expect(fumaca.toLowerCase()).toContain(cabecalho);
    expect(fumaca).toContain(valor);
  });
});
