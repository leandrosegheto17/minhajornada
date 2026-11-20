import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/** `ci.yml` lido como texto (sem biblioteca de YAML), como o `deploy.test.ts`. */
const texto = readFileSync(join(process.cwd(), '.github', 'workflows', 'ci.yml'), 'utf8').replace(/\r\n/g, '\n');

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

describe('ci.yml: Postgres para os testes do servidor (AD-022)', () => {
  const base = job('base');
  const e2e = job('e2e');

  it('o job base sobe um serviço postgres:18 na porta 5432, com pg_isready como verificação de saúde', () => {
    expect(base).toMatch(/services:\n {6}postgres:\n {8}image: postgres:18\n/);
    expect(base).toMatch(/- 5432:5432/);
    expect(base).toMatch(/--health-cmd "pg_isready[^"]*"/);
    expect(base).toMatch(/--health-retries \d+/);
  });

  it('o usuário do serviço pode criar bancos (superusuário) e a senha é fixa, só do CI', () => {
    expect(base).toMatch(/POSTGRES_USER: mj_dono/);
    expect(base).toMatch(/POSTGRES_PASSWORD: \S+/);
    expect(base).not.toMatch(/secrets\./);
  });

  it('o passo `pnpm test` recebe DATABASE_URL_TESTE apontando para o banco local do serviço', () => {
    const passo = base.split(/\n(?= {6}- )/).find((p) => /run: pnpm test$/m.test(p)) ?? '';
    expect(passo).not.toBe('');
    expect(passo).toMatch(/DATABASE_URL_TESTE: postgres(ql)?:\/\/mj_dono:[^@\s]+@(127\.0\.0\.1|localhost):5432\//);
  });

  it('o e2e não ganha banco nem a variável: o servidor é simulado no navegador', () => {
    expect(e2e).not.toMatch(/services:|postgres|DATABASE_URL/);
  });

  it('a suíte continua inteira no CI: lint, typecheck e test no job base', () => {
    expect(base).toMatch(/run: pnpm lint/);
    expect(base).toMatch(/run: pnpm typecheck/);
    expect(base).toMatch(/run: pnpm test$/m);
  });
});
