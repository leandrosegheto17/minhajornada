import { devices, expect, test, type Locator, type Page } from '@playwright/test';
import { esperarInicial } from './apoio/navegar';

// Convite de instalação no iPhone, sobre a página inicial (FUN-46, FUN-47), no build. O convite é uma camada fixa no
// pé da tela; a página inicial tem elementos com `z-index` (cartão e crédito da foto) na mesma faixa. O iPhone é o
// agente de usuário e o toque do Safari do iPhone, sobre o Chromium (jsdom não tem layout: só o navegador pega isso).
const { userAgent, viewport, deviceScaleFactor, isMobile, hasTouch } = devices['iPhone 14'];

test.use({ userAgent, viewport, deviceScaleFactor, isMobile, hasTouch });

const convite = (page: Page) => page.getByRole('region', { name: 'Instalar o app' });
const dispensar = (page: Page) => page.getByRole('button', { name: 'Dispensar convite' });

/** O elemento que recebe o toque no centro de `alvo` é o próprio `alvo` ou algo dentro dele. */
async function recebeOToque(alvo: Locator): Promise<{ recebe: boolean; topo: string }> {
  return alvo.evaluate((el) => {
    const c = el.getBoundingClientRect();
    const topo = document.elementFromPoint(c.x + c.width / 2, c.y + c.height / 2);
    return { recebe: !!topo && el.contains(topo), topo: topo ? `${topo.tagName}.${topo.className}` : 'nada' };
  });
}

test.describe('convite de instalação na página inicial (FUN-46, FUN-47)', () => {
  test('FUN-46: o botão "Dispensar convite" e o texto do convite ficam por cima da página inicial', async ({ page }) => {
    await page.goto('/');
    await esperarInicial(page);
    await expect(convite(page)).toBeVisible();

    const botao = await recebeOToque(dispensar(page));
    expect(botao.recebe, `o toque no botão cai em ${botao.topo}`).toBe(true);
    const texto = await recebeOToque(convite(page).locator('p'));
    expect(texto.recebe, `o toque no texto do convite cai em ${texto.topo}`).toBe(true);
  });

  test('FUN-47: dispensar o convite o esconde e ele não volta depois de recarregar', async ({ page }) => {
    await page.goto('/');
    await esperarInicial(page);
    await expect(convite(page)).toBeVisible();

    await dispensar(page).click({ timeout: 5000 });
    await expect(convite(page)).toHaveCount(0);

    await page.reload();
    await esperarInicial(page);
    await expect(convite(page)).toHaveCount(0);
  });
});
