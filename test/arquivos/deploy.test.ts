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

/** Texto do `ci.yml` (FUN-116, AD-016): o e2e roda sobre o build com o arquivo de exemplo; o deploy, sobre o real. */
const ci = readFileSync(join(process.cwd(), '.github', 'workflows', 'ci.yml'), 'utf8').replace(/\r\n/g, '\n');

describe('correções no build do CI e do deploy (FUN-116, AD-016)', () => {
  it('FUN-116: o job de e2e do CI constrói com `pnpm build:e2e`, não com `pnpm build`', () => {
    const e2e = ci.split(/\n {2}e2e:\n/)[1] ?? '';
    expect(e2e).not.toBe('');
    expect(e2e).toMatch(/run: pnpm build:e2e/);
    expect(e2e).not.toMatch(/run: pnpm build$/m);
  });

  it('FUN-116: o deploy constrói com `pnpm build`, sem `--correcoes` nem `build:e2e`', () => {
    const construir = job('construir');
    expect(construir).toMatch(/run: pnpm build$/m);
    expect(construir).not.toMatch(/--correcoes|build:e2e/);
  });
});

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

/** Migração do banco e fumaça da API (resumo-livro, T22; FUN-147, FUN-151). */
describe('deploy.yml: migração antes do deploy; a URL do banco só nesse passo (AD-022)', () => {
  const lista = passos(job('publicar'));
  const migrar = lista.find((p) => /pnpm migrar/.test(p)) ?? '';
  const deploy = lista.findIndex((p) => /pnpm exec wrangler deploy/.test(p));

  it('FUN-147: o passo de migração existe, roda `pnpm migrar` e vem antes de `wrangler deploy`', () => {
    expect(migrar).not.toBe('');
    expect(lista.indexOf(migrar)).toBeGreaterThanOrEqual(0);
    expect(deploy).toBeGreaterThan(-1);
    expect(lista.indexOf(migrar)).toBeLessThan(deploy);
  });

  it('FUN-147: o passo de migração tem DATABASE_URL_DONO de um segredo e não tem o token da Cloudflare', () => {
    expect(migrar).toMatch(/DATABASE_URL_DONO: \$\{\{ secrets\.DATABASE_URL_DONO \}\}/);
    expect(migrar).not.toMatch(/CLOUDFLARE/);
  });

  it('FUN-147: nenhum outro passo, job ou env de job tem a URL do banco', () => {
    const fora = texto.replace(migrar, '');
    expect(fora).not.toMatch(/DATABASE_URL/);
    for (const nome of ['conferir', 'construir', 'publicar']) {
      const antesDosPassos = job(nome).split(/\n {4}steps:/)[0] ?? '';
      expect(antesDosPassos, `${nome}: env de job`).not.toMatch(/DATABASE_URL|secrets\./);
    }
  });

  it('FUN-147: o token da Cloudflare continua só nos passos do wrangler (deploy e rollback)', () => {
    for (const p of lista.filter((q) => /CLOUDFLARE_API_TOKEN/.test(q))) {
      expect(p).toMatch(/pnpm exec wrangler (deploy|rollback)/);
    }
  });
});

describe('deploy.yml: a fumaça da API exige 401 e no-store e a falha volta a versão (FUN-147, FUN-151)', () => {
  const lista = passos(job('publicar'));
  const api = lista.find((p) => /Fumaça da API/.test(p)) ?? '';
  const bloco = (/\n {8}run: \|\n((?: {10}.*\n?)+)/.exec(api)?.[1] ?? '').replace(/^ {10}/gm, '');

  it('FUN-151: o passo consulta /api/resumos/1, vem depois do deploy e antes da volta da versão', () => {
    expect(api).not.toBe('');
    expect(bloco).toMatch(/\$\{URL_PUBLICA\}\/api\/resumos\/1/);
    const iApi = lista.indexOf(api);
    expect(iApi).toBeGreaterThan(lista.findIndex((p) => /pnpm exec wrangler deploy/.test(p)));
    expect(iApi).toBeLessThan(lista.findIndex((p) => /pnpm exec wrangler rollback/.test(p)));
  });

  it('FUN-151: a falha de qualquer passo depois do deploy aciona a volta da versão', () => {
    const volta = lista.find((p) => /pnpm exec wrangler rollback/.test(p)) ?? '';
    expect(volta).toMatch(/if: \$\{\{ failure\(\) && steps\.publicar\.outcome == 'success' \}\}/);
  });

  const raiz = mkdtempSync(join(tmpdir(), 'fumaca-api-'));
  const bin = join(raiz, 'bin');
  mkdirSync(bin, { recursive: true });
  // `curl` simulado: imprime a linha de status de STATUS (padrão 401) e, salvo SEM_CACHE, o cabeçalho de cache de CACHE.
  writeFileSync(
    join(bin, 'curl'),
    [
      '#!/bin/bash',
      '[ -n "${SEM_RESPOSTA:-}" ] && exit 0',
      'printf "HTTP/2 %s\\r\\n" "${STATUS:-401}"',
      '[ -n "${SEM_CACHE:-}" ] || printf "%s\\r\\n" "${CACHE:-Cache-Control: no-store}"',
      'printf "\\r\\n"',
    ].join('\n'),
  );
  chmodSync(join(bin, 'curl'), 0o755);
  afterAll(() => rmSync(raiz, { recursive: true, force: true }));

  function rodar(extra: Record<string, string>) {
    return spawnSync('bash', ['-e', '-c', bloco], {
      encoding: 'utf8',
      env: {
        ...process.env,
        ...extra,
        URL_PUBLICA: 'https://exemplo.test',
        PATH: `${bin}${delimiter}${process.env.PATH ?? ''}`,
      },
    });
  }

  it('FUN-147 FUN-151: 401 com no-store (em qualquer caixa) passa', () => {
    expect(rodar({}).status).toBe(0);
    expect(rodar({ CACHE: 'cache-control: private, NO-STORE' }).status).toBe(0);
  });

  it.each([['200'], ['403'], ['404'], ['500'], ['302']])(
    'FUN-147: status %s em vez de 401 derruba a fumaça e o cita',
    (status) => {
      const r = rodar({ STATUS: status });
      expect(r.status).not.toBe(0);
      expect(r.stdout).toContain(`::error title=Fumaça da API falhou::`);
      expect(r.stdout).toContain(`respondeu ${status}`);
    },
  );

  it('FUN-151: 401 sem cache-control, ou com cache-control sem no-store, derruba a fumaça', () => {
    const casos: Record<string, string>[] = [
      { SEM_CACHE: '1' },
      { CACHE: 'Cache-Control: max-age=60' },
      { CACHE: 'Cache-Control: public' },
    ];
    for (const extra of casos) {
      const r = rodar(extra);
      expect(r.status, JSON.stringify(extra)).not.toBe(0);
      expect(r.stdout).toContain('no-store');
    }
  });

  it('FUN-147: resposta vazia (site fora) derruba a fumaça', () => {
    expect(rodar({ SEM_RESPOSTA: '1' }).status).not.toBe(0);
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
    'if [ -n "${REMOVER_DIRETIVA:-}" ] && [ "${url#"$URL_PUBLICA"}" = "${OMITIR_EM:-}" ]; then',
    '  tudo="${tudo/"$REMOVER_DIRETIVA"/}"',
    'fi',
    'if [ -n "${CAIXA_TITULO:-}" ]; then',
    '  tudo="${tudo//content-security-policy:/Content-Security-Policy:}"; tudo="${tudo//x-content-type-options:/X-Content-Type-Options:}"; tudo="${tudo//referrer-policy:/Referrer-Policy:}"',
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

  it('A-14: FUN-42: cabeçalhos com a caixa de título (HTTP/1.1) passam na fumaça: o grep ignora a caixa', () => {
    const r = rodar({ CAIXA_TITULO: '1' });
    expect(r.stdout + r.stderr).not.toMatch(/::error/);
    expect(r.status).toBe(0);
  });

  const CAMINHOS = ['/', '/sw.js', '/livros/01.json'];
  // Cabeçalho inteiro ausente: a mensagem cita o caminho e o padrão do primeiro cabeçalho que falta.
  it.each(
    CAMINHOS.flatMap((caminho) =>
      ['content-security-policy', 'x-content-type-options', 'referrer-policy'].map((c) => [c, caminho]),
    ),
  )('A-13: FUN-42: sem o cabeçalho %s em %s sai com erro e o cita', (cabecalho, caminho) => {
    const r = rodar({ OMITIR: cabecalho!, OMITIR_EM: caminho! });
    expect(r.status).not.toBe(0);
    expect(r.stdout).toContain(`::error title=Fumaça falhou::${caminho} não traz o cabeçalho esperado: ^${cabecalho}:`);
  });

  // A-15: uma diretiva por vez, só ela sai da linha da CSP; a mensagem cita o caminho e a diretiva.
  it.each(
    CAMINHOS.flatMap((caminho) =>
      ["default-src 'self'", "object-src 'none'", "frame-ancestors 'none'"].map((diretiva) => [diretiva, caminho]),
    ),
  )('A-15: FUN-42: sem a diretiva %s da CSP em %s sai com erro e a cita', (diretiva, caminho) => {
    const r = rodar({ REMOVER_DIRETIVA: diretiva!, OMITIR_EM: caminho! });
    expect(r.status).not.toBe(0);
    expect(r.stdout).toContain(`::error title=Fumaça falhou::${caminho} não traz o cabeçalho esperado: `);
    expect(r.stdout).toContain(diretiva!);
  });

  it('A-13: FUN-42: resposta HTTP com erro (curl -f) derruba a fumaça', () => {
    const r = rodar({ HTTP_500_EM: '/sw.js' });
    expect(r.status).not.toBe(0);
  });
});
