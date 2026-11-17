import { defineConfig, devices } from '@playwright/test';

// E2E geral (/finalizar): as jornadas de `.specs/projeto/jornadas.md` contra o staging publicado, sem servidor local.
// Uso: `pnpm exec playwright test -c playwright.staging.config.ts`. `atualizacao.spec.ts` fica de fora: ele sobe um
// servidor próprio para trocar a versão do app, o que não se faz num ambiente publicado.
const url = process.env.URL_STAGING ?? 'https://minhajornada-tst.ljssoftware.com.br';

export default defineConfig({
  testDir: '.',
  testMatch: [
    ...['leitura', 'aparencia', 'offline', 'manifesto', 'sw'].map((nome) => `e2e/${nome}.spec.ts`),
    'e2e-geral/*.spec.ts',
  ],
  // O teste de privacidade do `offline.spec.ts` fixa o host `127.0.0.1`; no staging vale o de `e2e-geral/privacidade.spec.ts`.
  grepInvert: /nenhuma requisição sai de 127\.0\.0\.1/,
  workers: 2,
  retries: 1,
  use: { baseURL: url },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
