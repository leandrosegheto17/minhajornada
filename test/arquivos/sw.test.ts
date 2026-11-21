import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/** O service worker não pode guardar nem servir do cache nada de `/api/*` (FUN-151): o resumo só vem da rede. */
const texto = readFileSync(join(process.cwd(), 'src', 'pwa', 'sw.ts'), 'utf8');

/** As expressões do `denylist: [...]` da rota de navegação, como `RegExp`. */
function denylist(): RegExp[] {
  const lista = /denylist:\s*\[([^\]]*)\]/.exec(texto)?.[1] ?? '';
  return [...lista.matchAll(/\/((?:\\.|[^/\\])+)\//g)].map((m) => new RegExp(m[1] ?? ''));
}

describe('FUN-151: service worker fora das rotas da api', () => {
  it('FUN-151: a denylist da navegação inclui /^\\/api\\// e continua com /^\\/livros\\//', () => {
    const fontes = denylist().map((r) => r.source);
    expect(fontes).toContain('^\\/api\\/');
    expect(fontes).toContain('^\\/livros\\/');
  });

  it('FUN-151: o endereço do resumo e os das rotas de acesso caem na denylist', () => {
    const lista = denylist();
    for (const caminho of ['/api/resumos/1', '/api/entrar', '/api/sessao', '/api/sair']) {
      expect(
        lista.some((r) => r.test(caminho)),
        caminho,
      ).toBe(true);
    }
  });

  it('FUN-151: o endereço de uma tela do app continua servido pelo shell (não cai na denylist)', () => {
    const lista = denylist();
    for (const caminho of ['/', '/genesis/1', '/resumo/1', '/apinhado']) {
      expect(
        lista.some((r) => r.test(caminho)),
        caminho,
      ).toBe(false);
    }
  });

  it('FUN-151: o único registerRoute é a rota de navegação; nenhuma rota de fetch guarda /api', () => {
    const rotas = [...texto.matchAll(/registerRoute\(([^;]*)\);/g)].map((m) => m[1] ?? '');
    expect(rotas).toHaveLength(1);
    expect(rotas[0]).toMatch(/^new NavigationRoute\(/);
    expect(texto).not.toMatch(/StaleWhileRevalidate|CacheFirst|NetworkFirst|setDefaultHandler|setCatchHandler/);
    expect(texto).not.toMatch(/caches\.(open|match)/);
  });
});
