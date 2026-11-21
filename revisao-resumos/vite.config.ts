import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

// Monta `src/revisao-resumos/entrada.ts` (modo biblioteca, IIFE) e o põe dentro de `index.html`: o artifact é um HTML
// único, `revisao-resumos/dist/index.html`, sem texto de resumo (ele só vem do banco do artifact). Molde:
// `revisao/vite.config.ts`.
const SCRIPT = '<script src="./dist/pagina.js"></script>';

function htmlUnico(): Plugin {
  return {
    name: 'html-unico',
    generateBundle(_, bundle) {
      const pagina = bundle['pagina.js'];
      if (!pagina || pagina.type !== 'chunk') throw new Error('pagina.js não foi gerado');
      const html = readFileSync(resolve(import.meta.dirname, 'index.html'), 'utf8');
      if (!html.includes(SCRIPT)) throw new Error('index.html sem o script da página');
      const codigo = pagina.code.replaceAll('</script', '<\\/script');
      this.emitFile({
        type: 'asset',
        fileName: 'index.html',
        source: html.replace(SCRIPT, () => `<script>${codigo}</script>`),
      });
      delete bundle['pagina.js'];
    },
  };
}

export default defineConfig({
  root: resolve(import.meta.dirname, '..'),
  publicDir: false,
  plugins: [htmlUnico()],
  build: {
    outDir: resolve(import.meta.dirname, 'dist'),
    emptyOutDir: true,
    minify: true,
    lib: {
      entry: resolve(import.meta.dirname, '..', 'src', 'revisao-resumos', 'entrada.ts'),
      formats: ['iife'],
      name: 'RevisaoResumos',
      fileName: () => 'pagina.js',
    },
  },
});
