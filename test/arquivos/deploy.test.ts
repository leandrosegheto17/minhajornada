import { spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';

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

/**
 * A-13 (FUN-42): o caminho de falha da fumaça é provado por execução. O bloco `run` do passo é rodado em `bash -e` (o
 * shell padrão do Actions) com um `curl` simulado no PATH, que devolve os cabeçalhos do FUN-42 menos o que o caso omite.
 */
describe('deploy.yml: a fumaça falha quando um cabeçalho do FUN-42 falta (A-13)', () => {
  const fumaca = passos(job('publicar')).find((p) => /Fumaça/.test(p)) ?? '';
  const bloco = (/\n {8}run: \|\n((?: {10}.*\n?)+)/.exec(fumaca)?.[1] ?? '').replace(/^ {10}/gm, '');
  const raiz = mkdtempSync(join(tmpdir(), 'fumaca-'));
  const bin = join(raiz, 'bin');
  const trabalho = join(raiz, 'trabalho');
  mkdirSync(bin, { recursive: true });
  mkdirSync(join(trabalho, 'dist', 'livros'), { recursive: true });
  writeFileSync(join(trabalho, 'dist', 'livros', '01.json'), '{}');
  // `curl` simulado: sem `-D` não imprime nada; com `-D -` imprime os cabeçalhos, tirando o da variável OMITIR (casada
  // sem diferenciar caixa). Em SEM_CABECALHO_EM (um caminho) responde HTTP 500: com `-f` sai 22, sem `-f` sai 0.
  const stub = [
    '#!/bin/bash',
    'url="${@: -1}"; cabecalhos=0; falha=0',
    'for a in "$@"; do',
    '  [ "$a" = "-D" ] && cabecalhos=1',
    '  [[ "$a" =~ ^-[a-zA-Z]*f ]] && falha=1',
    'done',
    '[ "$cabecalhos" = 1 ] || exit 0',
    'if [ -n "${HTTP_500_EM:-}" ] && [ "${url#"$URL_PUBLICA"}" = "$HTTP_500_EM" ] && [ "$falha" = 1 ]; then exit 22; fi',
    "tudo=\"content-security-policy: default-src 'self'; object-src 'none'; frame-ancestors 'none'",
    'x-content-type-options: nosniff',
    'referrer-policy: same-origin"',
    'if [ -n "${OMITIR:-}" ] && { [ -z "${OMITIR_EM:-}" ] || [ "${url#"$URL_PUBLICA"}" = "$OMITIR_EM" ]; }; then',
    '  tudo="$(grep -vi -- "$OMITIR" <<< "$tudo")"',
    'fi',
    'printf "HTTP/2 200\r\n%s\r\n\r\n" "$tudo"',
  ].join('\n');
  writeFileSync(join(bin, 'curl'), stub);
  chmodSync(join(bin, 'curl'), 0o755);

  afterAll(() => rmSync(raiz, { recursive: true, force: true }));

  function rodar(extra: Record<string, string>) {
    return spawnSync('bash', ['-e', '-c', bloco], {
      cwd: trabalho,
      encoding: 'utf8',
      env: {
        ...process.env,
        ...extra,
        URL_PUBLICA: 'https://exemplo.test',
        PATH: `${bin}${delimiter}${process.env.PATH ?? ''}`,
      },
    });
  }

  it('A-13: FUN-42: o bloco extraído existe e, com todos os cabeçalhos, sai com 0', () => {
    expect(bloco).toMatch(/for caminho in/);
    const r = rodar({});
    expect(r.stdout + r.stderr).not.toMatch(/::error/);
    expect(r.status).toBe(0);
  });

  it.each([
    ['content-security-policy: default-src', '/'],
    ['content-security-policy: default-src', '/sw.js'],
    ['content-security-policy: default-src', '/livros/01.json'],
    ['object-src', '/sw.js'],
    ['frame-ancestors', '/livros/01.json'],
    ['x-content-type-options', '/'],
    ['x-content-type-options', '/sw.js'],
    ['x-content-type-options', '/livros/01.json'],
    ['referrer-policy', '/'],
    ['referrer-policy', '/livros/01.json'],
  ])('A-13: FUN-42: sem %s em %s sai com erro e imprime ::error', (cabecalho, caminho) => {
    // `object-src` e `frame-ancestors` vivem na mesma linha da CSP: o stub tira a linha inteira da CSP.
    const omitir = /^(object-src|frame-ancestors)$/.test(cabecalho)
      ? 'content-security-policy'
      : cabecalho.split(':')[0]!;
    const r = rodar({ OMITIR: omitir, OMITIR_EM: caminho });
    expect(r.status).not.toBe(0);
    expect(r.stdout + r.stderr).toMatch(/::error title=Fumaça falhou::/);
  });

  it('A-13: FUN-42: resposta HTTP com erro (curl -f) derruba a fumaça', () => {
    const r = rodar({ HTTP_500_EM: '/sw.js' });
    expect(r.status).not.toBe(0);
  });
});
