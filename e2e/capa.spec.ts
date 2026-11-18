import { expect, test, type Page } from '@playwright/test';
import { abrirGravado, esperarInicial, lerBiblia } from './apoio/navegar';

// Capa, plano pago e repaginação do livro (FUN-86, FUN-88 a FUN-92), no build servido por `vite preview`.

const regiaoLivro = (page: Page) => page.getByRole('main', { name: 'Leitura em formato livro' });
const paginas = (page: Page) => regiaoLivro(page).getByRole('article');
const capa = (page: Page) => page.getByRole('article', { name: 'Capa' });
const pago = (page: Page) => page.getByRole('article', { name: 'Plano de estudo' });
const seguinte = (page: Page) => page.getByRole('button', { name: 'Página seguinte' });
const anterior = (page: Page) => page.getByRole('button', { name: 'Página anterior' });

/** Formato livro gravado e sem leitura: "Ler Bíblia" abre a capa (FUN-88). */
async function abrirNaCapa(page: Page): Promise<void> {
  await page.goto('/');
  await esperarInicial(page);
  await page.evaluate(() => localStorage.setItem('mj:formato', JSON.stringify('livro')));
  await page.reload();
  await esperarInicial(page);
  await lerBiblia(page);
  await expect(capa(page)).toBeVisible();
}

async function xDe(page: Page, pagina: ReturnType<typeof capa>): Promise<number> {
  const caixa = await pagina.boundingBox();
  if (!caixa) throw new Error('página sem caixa');
  return caixa.x;
}

test.describe('capa e plano pago na tela larga (FUN-88, FUN-89)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('FUN-88/FUN-89: em 1280 px a capa fica à direita e o plano pago à esquerda', async ({ page }) => {
    await abrirNaCapa(page);
    await expect(pago(page)).toBeVisible();
    expect(await xDe(page, capa(page))).toBeGreaterThan(await xDe(page, pago(page)));
  });

  test('FUN-91: na capa, "Página anterior" fica desativada', async ({ page }) => {
    await abrirNaCapa(page);
    await expect(anterior(page)).toBeDisabled();
  });
});

test.describe('capa, plano pago e Gênesis na tela estreita (FUN-90, FUN-91, FUN-92, FUN-86)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('FUN-90/FUN-91: em 375 px a capa vem sozinha; "seguinte" mostra o plano pago e depois Gênesis', async ({
    page,
  }) => {
    await abrirNaCapa(page);
    await expect(paginas(page)).toHaveCount(1);
    await expect(pago(page)).toHaveCount(0);
    await expect(anterior(page)).toBeDisabled();

    await seguinte(page).click();
    await expect(pago(page)).toBeVisible();
    await expect(paginas(page)).toHaveCount(1);

    await seguinte(page).click();
    await expect(paginas(page).first()).toHaveAttribute('aria-label', /^Página 1 de Gênesis$/);
    await expect(page.getByRole('heading', { level: 2, name: 'Gênesis' })).toBeVisible();

    // De Gênesis 1, "anterior" volta ao plano pago e depois à capa.
    await anterior(page).click();
    await expect(pago(page)).toBeVisible();
    await anterior(page).click();
    await expect(capa(page)).toBeVisible();
  });

  test('FUN-92: "Quero saber" abre a tela em breve', async ({ page }) => {
    await abrirNaCapa(page);
    await seguinte(page).click();
    await expect(pago(page)).toBeVisible();
    await page.getByRole('button', { name: 'Quero saber' }).click();
    await expect(page.getByRole('heading', { level: 1, name: /em breve/ })).toBeVisible();
  });

  test('FUN-86: Rute 1:12 continua visível depois de mudar a letra para 5', async ({ page }) => {
    await page.goto('/');
    await esperarInicial(page);
    await page.evaluate(() => localStorage.setItem('mj:formato', JSON.stringify('livro')));
    await abrirGravado(page, 8, 1);
    await expect(paginas(page).first()).toBeVisible();

    // Vai passando páginas até a que traz o versículo 12 do capítulo 1.
    const versiculo12 = paginas(page).locator('p', { has: page.locator('span', { hasText: /^12$/ }) });
    for (let i = 0; i < 20 && (await versiculo12.count()) === 0; i++) {
      const rotulo = await paginas(page).first().getAttribute('aria-label');
      await seguinte(page).click();
      await expect.poll(() => paginas(page).first().getAttribute('aria-label')).not.toBe(rotulo);
    }
    await expect(versiculo12.first()).toBeVisible();
    // O texto do versículo, sem o número, identifica o mesmo versículo antes e depois.
    const texto = ((await versiculo12.first().textContent()) ?? '').replace(/^\d+/, '').trim().slice(0, 25);
    expect(texto.length).toBeGreaterThan(10);

    await page.getByRole('button', { name: 'Aparência: letra e tema' }).click();
    await page.getByRole('button', { name: 'Aumentar letra' }).click();
    await page.getByRole('button', { name: 'Aumentar letra' }).click();
    await expect(page.getByText('Letra 5 de 5')).toBeVisible();

    await expect(paginas(page).locator('p', { hasText: texto }).first()).toBeVisible();
  });
});
