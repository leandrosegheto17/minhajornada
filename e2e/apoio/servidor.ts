import { readFile } from 'node:fs/promises';
import { createServer, type Server } from 'node:http';
import { extname, join, normalize } from 'node:path';

const TIPOS: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
};

/**
 * Servidor estático mínimo para o e2e de atualização (FUN-37): serve a pasta da vez, que o teste troca em
 * `servidor.pasta`, com fallback para o index.html como a Cloudflare (`not_found_handling: single-page-application`).
 */
export function servirPasta(pastaInicial: string, porta: number) {
  const estado = { pasta: pastaInicial };
  const servidor: Server = createServer(async (req, res) => {
    const caminho = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname);
    const relativo = normalize(caminho === '/' ? '/index.html' : caminho).replace(/^([/\\])+/, '');
    if (relativo.startsWith('..')) {
      res.writeHead(400).end();
      return;
    }
    let arquivo = join(estado.pasta, relativo);
    let corpo: Buffer;
    try {
      corpo = await readFile(arquivo);
    } catch {
      arquivo = join(estado.pasta, 'index.html');
      corpo = await readFile(arquivo);
    }
    res.writeHead(200, { 'content-type': TIPOS[extname(arquivo)] ?? 'application/octet-stream', 'cache-control': 'no-cache' });
    res.end(corpo);
  });
  return {
    trocarPasta: (pasta: string) => {
      estado.pasta = pasta;
    },
    iniciar: () => new Promise<void>((ok) => servidor.listen(porta, '127.0.0.1', () => ok())),
    parar: () => new Promise<void>((ok) => servidor.close(() => ok())),
    url: `http://127.0.0.1:${porta}`,
  };
}
