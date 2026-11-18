import { expect, test, type Page } from '@playwright/test';
import { abrirGravado, esperarCapitulo, esperarInicial, esperarSwAtivo, lerBiblia } from './apoio/navegar';

// Página inicial, barra de título e foto sem rede (FUN-52, FUN-53, FUN-58, FUN-60, FUN-64, FUN-65), no build.

const cartao = (page: Page) => page.locator('section[aria-labelledby="titulo-inicial"]');
const barra = (page: Page) => page.getByRole('banner');

async function semRolagemLateral(page: Page, onde: string) {
  const { largura, visivel } = await page.evaluate(() => ({
    largura: document.documentElement.scrollWidth,
    visivel: document.documentElement.clientWidth,
  }));
  expect(largura, `${onde}: scrollWidth ${largura} > clientWidth ${visivel}`).toBeLessThanOrEqual(visivel);
}

test.describe('cartão da página inicial (FUN-52, FUN-53)', () => {
  test.describe('tela larga', () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test('FUN-52: em 1440 px o cartão fica à direita (x maior que o meio da tela)', async ({ page }) => {
      await page.goto('/');
      await esperarInicial(page);
      const caixa = await cartao(page).boundingBox();
      if (!caixa) throw new Error('cartão sem caixa');
      expect(caixa.x).toBeGreaterThan(1440 / 2);
    });
  });

  test.describe('tela estreita', () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test('FUN-53: em 375 px o cartão fica centralizado e embaixo da foto', async ({ page }) => {
      await page.goto('/');
      await esperarInicial(page);
      const caixa = await cartao(page).boundingBox();
      if (!caixa) throw new Error('cartão sem caixa');
      expect(Math.abs(caixa.x + caixa.width / 2 - 375 / 2)).toBeLessThan(4);
      expect(caixa.y + caixa.height / 2).toBeGreaterThan(812 / 2);
    });
  });
});

test('FUN-58: sem rede, a foto da página inicial carrega (naturalWidth > 0)', async ({ page, context }) => {
  test.setTimeout(120_000);
  await page.goto('/');
  await esperarSwAtivo(page);
  await esperarInicial(page);
  await expect(page.getByRole('img', { name: /Bíblia aberta sobre uma pedra/ })).toBeVisible();
  // Espera o service worker guardar a foto (o pré-cache termina depois da ativação).
  await expect
    .poll(
      () =>
        page.evaluate(async () => {
          const chaves = await caches.keys();
          for (const nome of chaves) {
            const itens = await (await caches.open(nome)).keys();
            if (itens.some((i) => /inicial.*\.webp$/.test(new URL(i.url).pathname))) return true;
          }
          return false;
        }),
      { timeout: 60_000 },
    )
    .toBe(true);

  await context.setOffline(true);
  try {
    await page.reload();
    await esperarInicial(page);
    const foto = page.getByRole('img', { name: /Bíblia aberta sobre uma pedra/ });
    await expect(foto).toBeVisible();
    expect(await foto.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  } finally {
    await context.setOffline(false);
  }
});

test.describe('barra de título (FUN-60, FUN-64, FUN-65)', () => {
  test('FUN-60: a barra aparece uma vez nas sete telas (inicial, em breve, escolha, grade, leitor, livro, Sobre)', async ({
    page,
  }) => {
    const umaBarra = async (onde: string) => {
      await expect(barra(page), onde).toHaveCount(1);
      await expect(barra(page), onde).toBeVisible();
    };

    await page.goto('/');
    await esperarInicial(page);
    await umaBarra('inicial');

    await page.getByRole('button', { name: 'Criar conta', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1, name: /em breve/ })).toBeVisible();
    await umaBarra('em breve');

    await page.getByRole('button', { name: 'MinhaJornada, página inicial' }).click();
    await esperarInicial(page);
    await lerBiblia(page);
    await expect(page.getByRole('heading', { level: 1, name: 'Escolha o livro' })).toBeVisible();
    await umaBarra('escolha de livro');

    await page.getByRole('button', { name: /^Romanos, \d+ cap/ }).click();
    await expect(page.getByRole('list', { name: 'Capítulos de Romanos' })).toBeVisible();
    await umaBarra('grade');

    await page.getByRole('button', { name: 'Capítulo 8', exact: true }).click();
    await esperarCapitulo(page, 'Romanos', 8);
    await umaBarra('leitor');

    await page.getByRole('button', { name: 'Ler como livro' }).click();
    await expect(page.getByRole('main', { name: 'Leitura em formato livro' })).toBeVisible();
    await umaBarra('livro');

    await page.getByRole('button', { name: 'Sobre o MinhaJornada' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Sobre o MinhaJornada' })).toBeVisible();
    await umaBarra('Sobre');
  });

  test('FUN-65: depois de rolar o capítulo, a barra continua presa ao topo', async ({ page }) => {
    await page.goto('/');
    await abrirGravado(page, 19, 119);
    await esperarCapitulo(page, 'Salmos', 119);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(500);
    const caixa = await barra(page).boundingBox();
    if (!caixa) throw new Error('barra sem caixa');
    expect(caixa.y).toBeGreaterThanOrEqual(-1);
    expect(caixa.y).toBeLessThanOrEqual(1);
  });

  test.describe('320 px', () => {
    test.use({ viewport: { width: 320, height: 800 } });

    test('FUN-64: em 320 px não há rolagem lateral e a conta fica só com o ícone', async ({ page }) => {
      await page.goto('/');
      await esperarInicial(page);
      await semRolagemLateral(page, 'página inicial');
      await expect(page.getByText('Entrar / Criar conta')).toBeHidden();
      await expect(page.getByRole('button', { name: 'Entrar ou criar conta' })).toBeVisible();

      await abrirGravado(page, 45, 8);
      await esperarCapitulo(page, 'Romanos', 8);
      await semRolagemLateral(page, 'leitor');
      await expect(page.getByText('Entrar / Criar conta')).toBeHidden();
      await expect(page.getByRole('button', { name: 'Entrar ou criar conta' })).toBeVisible();
    });
  });
});
