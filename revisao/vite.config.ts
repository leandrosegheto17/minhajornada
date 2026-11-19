import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// Monta `src/revisao/entrada.ts` num único `revisao/dist/pagina.js` (modo biblioteca, IIFE), sem depender do app.
export default defineConfig({
  root: resolve(import.meta.dirname, '..'),
  publicDir: false,
  build: {
    outDir: resolve(import.meta.dirname, 'dist'),
    emptyOutDir: true,
    minify: true,
    lib: {
      entry: resolve(import.meta.dirname, '..', 'src', 'revisao', 'entrada.ts'),
      formats: ['iife'],
      name: 'Revisao',
      fileName: () => 'pagina.js',
    },
  },
});
