import { expect, test, type Page } from '@playwright/test';
import { rotuloPagina } from './apoio/livro';
import { abrirGravado, esperarCapitulo, esperarInicial, esperarSwAtivo, versiculos } from './apoio/navegar';

// Texto corrigido no app (FUN-116, FUN-122, FUN-124), no build do e2e (`pnpm build:e2e`, AD-016): o arquivo de exemplo
// aprova "Coreiro" → "Cordeiro" em Apocalipse 6:1 (e uma troca em João 1:1).

const APOCALIPSE = 66;

const regiaoLivro = (page: Page) => page.getByRole('main', { name: 'Leitura em formato livro' });

const abrirSobre = (page: Page) => page.getByRole('button', { name: 'Sobre o MinhaJornada' }).click();

/** Do Sobre, abre a tela e o bloco do Apocalipse, e confere o item de Apocalipse 6:1. */
async function verCorrecaoDoApocalipse(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Ver as correções no texto' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Correções no texto' })).toBeVisible();
  await page.locator('summary', { hasText: 'Apocalipse' }).click();
  const item = page.getByRole('listitem').filter({ hasText: 'Apocalipse 6:1' });
  await expect(item.locator('del')).toContainText('Coreiro');
  await expect(item.locator('ins')).toContainText('Cordeiro');
}

test.describe('texto corrigido no app (FUN-116, FUN-122, FUN-124)', () => {
  test('FUN-116: Apocalipse 6:1 mostra "Cordeiro" (e não "Coreiro") na rolagem', async ({ page }) => {
    await page.goto('/');
    await abrirGravado(page, APOCALIPSE, 6);
    await esperarCapitulo(page, 'Apocalipse', 6);
    await expect(versiculos(page).first()).toContainText('Cordeiro');
    await expect(versiculos(page).first()).not.toContainText('Coreiro');
  });

  test('FUN-116: Apocalipse 6:1 mostra "Cordeiro" (e não "Coreiro") no modo livro', async ({ page }) => {
    await page.goto('/');
    await esperarInicial(page);
    await page.evaluate(() => localStorage.setItem('mj:formato', JSON.stringify('livro')));
    await abrirGravado(page, APOCALIPSE, 6);
    await expect(regiaoLivro(page)).toBeVisible();
    expect(await rotuloPagina(page)).not.toBeNull();
    await expect(regiaoLivro(page)).toContainText('Cordeiro');
    await expect(regiaoLivro(page)).not.toContainText('Coreiro');
  });

  test('FUN-122: Sobre → "Ver as correções no texto" mostra "Coreiro" riscado e "Cordeiro"; "Voltar" volta ao Sobre', async ({
    page,
  }) => {
    await page.goto('/');
    await esperarInicial(page);
    await abrirSobre(page);
    await verCorrecaoDoApocalipse(page);
    await page.getByRole('button', { name: 'Sobre', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Sobre o MinhaJornada' })).toBeVisible();
  });

  test('FUN-124: com o service worker ativo e a rede cortada, a tela abre com a lista completa', async ({
    page,
    context,
  }) => {
    test.setTimeout(120_000);
    await page.goto('/');
    await esperarSwAtivo(page);
    await esperarInicial(page);

    await context.setOffline(true);
    try {
      await page.reload();
      await esperarInicial(page);
      await abrirSobre(page);
      await verCorrecaoDoApocalipse(page);
    } finally {
      await context.setOffline(false);
    }
  });
});
