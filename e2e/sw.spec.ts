import { expect, test } from '@playwright/test';

/** Espera o service worker do build controlar a página. */
async function esperarSwAtivo(page: import('@playwright/test').Page) {
  await page.waitForFunction(async () => {
    const registro = await navigator.serviceWorker.ready;
    return Boolean(registro.active) && navigator.serviceWorker.controller !== null;
  });
}

test.describe('service worker (FUN-35)', () => {
  test('FUN-35: depois da primeira visita, o app abre sem rede', async ({ page, context }) => {
    await page.goto('/');
    await esperarSwAtivo(page);
    await context.setOffline(true);
    await page.reload();
    await expect(page.locator('#raiz')).not.toBeEmpty();
    await expect(page).toHaveTitle('MinhaJornada');
    await context.setOffline(false);
  });

  test('FUN-35: sem rede, outro endereço do app também abre (fallback de navegação)', async ({ page, context }) => {
    await page.goto('/');
    await esperarSwAtivo(page);
    await context.setOffline(true);
    await page.goto('/qualquer/caminho');
    await expect(page.locator('#raiz')).not.toBeEmpty();
    await context.setOffline(false);
  });

  test('FUN-35: o precache tem o app e não tem nenhum livro (livros/)', async ({ page }) => {
    await page.goto('/');
    await esperarSwAtivo(page);
    const urls = await page.evaluate(async () => {
      const lista: string[] = [];
      for (const nome of await caches.keys()) {
        if (!nome.includes('precache')) continue;
        const cache = await caches.open(nome);
        for (const pedido of await cache.keys()) lista.push(new URL(pedido.url).pathname);
      }
      return lista;
    });
    expect(urls).toContain('/index.html');
    expect(urls.some((u) => u.endsWith('.js'))).toBe(true);
    expect(urls.filter((u) => u.includes('livros/'))).toEqual([]);
  });
});
