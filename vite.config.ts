import { readFileSync } from 'node:fs';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';
import { lerToken } from './scripts/lerToken.mjs';

const porta = Number(process.env.PORTA ?? 5173);
const versaoPacote = (JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string })
  .version;
// Versão do build (FUN-37): a do pacote mais um carimbo, para dois builds nunca terem a mesma; o e2e de atualização
// fixa a sua por VERSAO_APP. Vai no JS (`__VERSAO__`, mostrada no Sobre) e numa meta do index.html.
const versaoApp = process.env.VERSAO_APP ?? `${versaoPacote}+${process.env.GITHUB_SHA?.slice(0, 7) ?? Date.now().toString(36)}`;
const corFundo = lerToken(readFileSync(new URL('./src/estilo/tokens.css', import.meta.url), 'utf8'), '--cor-fundo');

export default defineConfig({
  define: { __VERSAO__: JSON.stringify(versaoApp) },
  plugins: [
    react(),
    {
      name: 'cor-do-tema',
      transformIndexHtml: () => [
        { tag: 'meta', attrs: { name: 'theme-color', content: corFundo }, injectTo: 'head' },
        { tag: 'meta', attrs: { name: 'versao-app', content: versaoApp }, injectTo: 'head' },
      ],
    },
    // injectManifest (AD-001): o service worker é nosso (`src/pwa/sw.ts`). Manifesto e ícones: tarefa T32.
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src/pwa',
      filename: 'sw.ts',
      // O registro é nosso (`src/pwa/registrarSW.ts`), sem recarregar a página (FUN-37).
      registerType: 'autoUpdate',
      injectRegister: false,
      scope: '/',
      manifest: false,
      // Só o app (o shell): os livros (`livros/*.json`) ficam no cache `mj-livros`, gerido pelo app (AD-002).
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,woff2,svg,png,webmanifest}'],
        globIgnores: ['livros/**'],
      },
      devOptions: { enabled: false },
    }),
  ],
  build: { outDir: 'dist', target: ['es2022', 'safari18'] },
  server: { host: '127.0.0.1', port: porta, strictPort: true },
  preview: { host: '127.0.0.1', port: porta, strictPort: true },
  test: {
    maxWorkers: 4,
    projects: [
      {
        extends: true,
        test: {
          name: 'componentes',
          environment: 'jsdom',
          setupFiles: ['./test/setup.ts'],
          include: ['src/**/*.test.{ts,tsx}'],
          exclude: ['src/estilo/estilo.test.ts'],
        },
      },
      {
        // jsdom troca a classe URL global e quebra `readFileSync(new URL(...))`: o que lê o disco roda em node.
        extends: true,
        test: {
          name: 'arquivos',
          environment: 'node',
          include: ['src/estilo/estilo.test.ts', 'test/**/*.test.ts', 'scripts/**/*.test.mjs'],
        },
      },
    ],
  },
});
