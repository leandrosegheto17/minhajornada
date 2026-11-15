import { defineConfig, devices } from '@playwright/test';

const porta = Number(process.env.PORTA ?? 4173);

export default defineConfig({
  testDir: 'e2e',
  testMatch: '**/*.spec.ts',
  workers: 2,
  use: { baseURL: `http://127.0.0.1:${porta}` },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // O service worker só existe no build: o e2e serve `dist/` por `vite preview` (rode `pnpm build` antes).
  webServer: {
    command: `pnpm exec vite preview --host 127.0.0.1 --port ${porta} --strictPort`,
    url: `http://127.0.0.1:${porta}`,
    reuseExistingServer: !process.env.CI,
  },
});
