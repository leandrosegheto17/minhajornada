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

    test('FUN-52: a foto cobre toda a área abaixo da barra (de ponta a ponta e até o pé da tela)', async ({ page }) => {
      await page.goto('/');
      await esperarInicial(page);
      const foto = await page.getByRole('img', { name: /Bíblia aberta sobre uma pedra/ }).boundingBox();
      const topo = await barra(page).boundingBox();
      if (!foto || !topo) throw new Error('foto ou barra sem caixa');
      expect(Math.abs(foto.y - (topo.y + topo.height))).toBeLessThanOrEqual(1);
      expect(foto.x).toBeLessThanOrEqual(1);
      expect(foto.x + foto.width).toBeGreaterThanOrEqual(1440 - 1);
      expect(foto.y + foto.height).toBeGreaterThanOrEqual(900 - 1);
    });

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

test.describe('barra de título: limite de 480 px (FUN-64)', () => {
  const conta = (page: Page) => page.getByRole('button', { name: 'Entrar ou criar conta' });

  test.describe('479 px', () => {
    test.use({ viewport: { width: 479, height: 800 } });

    test('FUN-64: em 479 px a conta é só o ícone', async ({ page }) => {
      await page.goto('/');
      await esperarInicial(page);
      await expect(page.getByText('Entrar / Criar conta')).toBeHidden();
      await expect(conta(page)).toBeVisible();
    });
  });

  test.describe('480 px', () => {
    test.use({ viewport: { width: 480, height: 800 } });

    test('FUN-64: em 480 px a conta mostra o texto "Entrar / Criar conta"', async ({ page }) => {
      await page.goto('/');
      await esperarInicial(page);
      await expect(page.getByText('Entrar / Criar conta')).toBeVisible();
      await expect(conta(page)).toBeVisible();
    });
  });
});

/** Formato livro gravado e sem leitura: "Ler Bíblia" abre a capa (FUN-88). */
async function abrirNaCapa(page: Page): Promise<void> {
  await page.goto('/');
  await esperarInicial(page);
  await page.evaluate(() => {
    localStorage.removeItem('mj:leitura');
    localStorage.setItem('mj:formato', JSON.stringify('livro'));
  });
  await page.reload();
  await esperarInicial(page);
  await lerBiblia(page);
  await expect(page.getByRole('article', { name: 'Capa' })).toBeVisible();
}

for (const largura of [320, 1920]) {
  test.describe(`sem rolagem lateral em ${largura} px nas telas novas (FUN-43)`, () => {
    test.use({ viewport: { width: largura, height: 900 } });

    test(`FUN-43: em breve, livro, capa e plano pago não transbordam em ${largura} px`, async ({ page }) => {
      await page.goto('/');
      await esperarInicial(page);
      await page.getByRole('button', { name: 'Criar conta', exact: true }).click();
      await expect(page.getByRole('heading', { level: 1, name: /em breve/ })).toBeVisible();
      await semRolagemLateral(page, `em breve, ${largura} px`);

      await page.goto('/');
      await abrirGravado(page, 45, 8);
      await esperarCapitulo(page, 'Romanos', 8);
      await page.getByRole('button', { name: 'Ler como livro' }).click();
      await expect(page.getByRole('main', { name: 'Leitura em formato livro' })).toBeVisible();
      await semRolagemLateral(page, `livro, ${largura} px`);

      await abrirNaCapa(page);
      await semRolagemLateral(page, `capa, ${largura} px`);

      if (largura < 900) await page.getByRole('button', { name: 'Página seguinte' }).click();
      await expect(page.getByRole('article', { name: 'Plano de estudo' })).toBeVisible();
      await semRolagemLateral(page, `plano pago, ${largura} px`);
    });
  });
}
