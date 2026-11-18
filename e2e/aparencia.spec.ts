import { expect, test, type Page } from '@playwright/test';
import { abrirGravado, abrirPelaEscolha, esperarCapitulo, esperarInicial, gravarLetra, lerBiblia } from './apoio/navegar';

// J-04 de .specs/projeto/jornadas.md, no build servido por `vite preview`.

/** Cor de fundo do <body>, como o navegador a calculou. */
function fundo(page: Page) {
  return page.evaluate(() => getComputedStyle(document.body).backgroundColor);
}

/** Nada transborda na lateral (FUN-43). */
async function semRolagemLateral(page: Page, onde: string) {
  const { largura, visivel } = await page.evaluate(() => ({
    largura: document.documentElement.scrollWidth,
    visivel: document.documentElement.clientWidth,
  }));
  expect(largura, `${onde}: scrollWidth ${largura} > clientWidth ${visivel}`).toBeLessThanOrEqual(visivel);
}

/** Todo botão sem texto visível tem `aria-label` não vazio (FUN-44). */
async function botoesComRotulo(page: Page, onde: string) {
  const semRotulo = await page.evaluate(() =>
    [...document.querySelectorAll('button')]
      .filter((b) => (b.textContent ?? '').trim() === '' && !(b.getAttribute('aria-label') ?? '').trim())
      .map((b) => b.outerHTML.slice(0, 120)),
  );
  expect(semRotulo, onde).toEqual([]);
}

test.describe('tema do sistema (FUN-29)', () => {
  test('FUN-29: com o sistema escuro e nada gravado, o fundo é o escuro; com o claro, o claro', async ({ browser }) => {
    const escuro = await browser.newContext({ colorScheme: 'dark' });
    const paginaEscura = await escuro.newPage();
    await paginaEscura.goto('/');
    expect(await fundo(paginaEscura)).toBe('rgb(27, 26, 31)'); // #1B1A1F
    await expect(paginaEscura.locator('html')).not.toHaveAttribute('data-tema', /.*/);
    await escuro.close();

    const claro = await browser.newContext({ colorScheme: 'light' });
    const paginaClara = await claro.newPage();
    await paginaClara.goto('/');
    expect(await fundo(paginaClara)).toBe('rgb(255, 255, 255)'); // #FFFFFF
    await claro.close();
  });

  test('FUN-28: o tema escolhido vale mesmo com o sistema escuro', async ({ browser }) => {
    const contexto = await browser.newContext({ colorScheme: 'dark' });
    const page = await contexto.newPage();
    await page.goto('/');
    await abrirPelaEscolha(page, 'Filemom', 1);
    await page.getByRole('button', { name: 'Aparência: letra e tema' }).click();
    await page.getByRole('button', { name: 'Sépia' }).click();
    expect(await fundo(page)).toBe('rgb(246, 238, 220)'); // #F6EEDC
    await contexto.close();
  });
});

test.describe('letra e tema gravados (FUN-30)', () => {
  test('FUN-30: escolher sépia e letra 5, recarregar e ver sépia, letra 5 e "Aumentar letra" desativado', async ({
    page,
  }) => {
    await page.goto('/');
    await abrirPelaEscolha(page, 'Filemom', 1);
    await page.getByRole('button', { name: 'Aparência: letra e tema' }).click();
    await page.getByRole('button', { name: 'Sépia' }).click();
    await page.getByRole('button', { name: 'Aumentar letra' }).click();
    await page.getByRole('button', { name: 'Aumentar letra' }).click();
    await expect(page.getByText('Letra 5 de 5')).toBeVisible();

    await page.reload();
    await esperarInicial(page);
    await lerBiblia(page);
    await esperarCapitulo(page, 'Filemom', 1);
    await expect(page.locator('html')).toHaveAttribute('data-tema', 'sepia');
    await expect(page.locator('html')).toHaveAttribute('data-letra', '5');
    await page.getByRole('button', { name: 'Aparência: letra e tema' }).click();
    await expect(page.getByText('Letra 5 de 5')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Aumentar letra' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Sépia' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('FUN-24: a letra 5 deixa o texto maior que a letra 3', async ({ page }) => {
    await page.goto('/');
    await abrirGravado(page, 19, 23);
    await esperarCapitulo(page, 'Salmos', 23);
    const tamanho = () => page.getByRole('main').evaluate((m) => parseFloat(getComputedStyle(m).fontSize));
    const antes = await tamanho();
    await page.getByRole('button', { name: 'Aparência: letra e tema' }).click();
    await page.getByRole('button', { name: 'Aumentar letra' }).click();
    await page.getByRole('button', { name: 'Aumentar letra' }).click();
    expect(await tamanho()).toBeGreaterThan(antes);
  });
});

for (const largura of [320, 1920]) {
  test.describe(`largura de ${largura} px (FUN-43, FUN-44)`, () => {
    test.use({ viewport: { width: largura, height: 800 } });

    test(`FUN-43/FUN-44: em ${largura} px, nada transborda na lateral e todo botão de ícone tem rótulo`, async ({
      page,
    }) => {
      await page.goto('/');
      await esperarInicial(page);
      await semRolagemLateral(page, 'página inicial');
      await botoesComRotulo(page, 'página inicial');
      await lerBiblia(page);
      await semRolagemLateral(page, 'escolha de livro');
      await botoesComRotulo(page, 'escolha de livro');

      await gravarLetra(page, 5);
      await abrirGravado(page, 19, 119);
      await esperarCapitulo(page, 'Salmos', 119);
      await semRolagemLateral(page, 'leitor, Salmos 119, letra 5');
      await botoesComRotulo(page, 'leitor');

      await page.getByRole('button', { name: 'Aparência: letra e tema' }).click();
      await semRolagemLateral(page, 'leitor com o painel aberto');
      await botoesComRotulo(page, 'painel de aparência');

      // O painel é um popover que cobre o título em telas estreitas: o leitor o fecha tocando em "Aa" de novo.
      await page.getByRole('button', { name: 'Aparência: letra e tema' }).click();
      await expect(page.getByRole('region', { name: 'Aparência' })).toBeHidden();
      await page.getByRole('button', { name: 'Salmos 119. Escolher outro capítulo' }).click();
      await expect(page.getByRole('list', { name: 'Capítulos de Salmos' })).toBeVisible();
      await semRolagemLateral(page, 'grade de Salmos');
      await botoesComRotulo(page, 'grade de capítulos');

      await page.getByRole('button', { name: 'Sobre o MinhaJornada' }).click();
      await expect(page.getByRole('heading', { level: 1, name: 'Sobre o MinhaJornada' })).toBeVisible();
      await semRolagemLateral(page, 'Sobre');
      await botoesComRotulo(page, 'Sobre');
    });
  });
}
