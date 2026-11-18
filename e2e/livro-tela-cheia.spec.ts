import { expect, test, type Locator, type Page } from '@playwright/test';
import { abrirGravado, esperarInicial } from './apoio/navegar';

// Modo livro em tela cheia no PC (FUN-95 a FUN-102), no build servido por `vite preview`.

const RUTE = 8;
/** Tolerância das asserções espaciais, em px. */
const TOL = 1;

const regiaoLivro = (page: Page) => page.getByRole('main', { name: 'Leitura em formato livro' });
const paginas = (page: Page) => regiaoLivro(page).getByRole('article');
const anterior = (page: Page) => page.getByRole('button', { name: 'Página anterior' });
const seguinte = (page: Page) => page.getByRole('button', { name: 'Página seguinte' });
const marca = (page: Page) => page.getByRole('button', { name: 'MinhaJornada, página inicial' });
const conta = (page: Page) => page.getByRole('button', { name: 'Entrar ou criar conta' });

/** Grava o formato livro e a leitura no aparelho e abre o livro pela página inicial ("Ler Bíblia"). */
async function abrirNoLivro(page: Page, livro: number, capitulo: number): Promise<void> {
  await page.goto('/');
  await esperarInicial(page);
  await page.evaluate(() => localStorage.setItem('mj:formato', JSON.stringify('livro')));
  await abrirGravado(page, livro, capitulo);
  await expect(regiaoLivro(page)).toBeVisible();
  await expect(paginas(page).first()).toBeVisible();
}

async function caixa(alvo: Locator) {
  const c = await alvo.boundingBox();
  if (!c) throw new Error('elemento sem caixa');
  return c;
}

/** Largura útil da janela (sem a barra de rolagem, se houver). */
const larguraUtil = (page: Page) => page.evaluate(() => document.documentElement.clientWidth);
const alturaJanela = (page: Page) => page.evaluate(() => window.innerHeight);

/** A página e os botões ficam como hoje: uma página de até 520 px, centrada, e os botões em par no meio. */
async function conferirUmaPagina(page: Page) {
  await abrirNoLivro(page, RUTE, 1);
  await expect(paginas(page)).toHaveCount(1);
  const largura = await larguraUtil(page);
  const altura = await alturaJanela(page);
  const pagina = await caixa(paginas(page).first());
  expect(Math.abs(pagina.width - Math.min(520, largura - 24))).toBeLessThanOrEqual(TOL);
  expect(Math.abs(pagina.x + pagina.width / 2 - largura / 2)).toBeLessThanOrEqual(TOL);
  expect(Math.abs(pagina.height - (altura - 56 - 150))).toBeLessThanOrEqual(TOL);
  const ant = await caixa(anterior(page));
  const seg = await caixa(seguinte(page));
  expect(Math.abs((ant.x + seg.x + seg.width) / 2 - largura / 2)).toBeLessThanOrEqual(TOL);
}

test.describe('tela estreita e retrato como hoje (FUN-102)', () => {
  for (const [largura, altura] of [
    [375, 812],
    [899, 800],
    [1024, 1366],
  ] as const) {
    test.describe(`${largura} × ${altura}`, () => {
      test.use({ viewport: { width: largura, height: altura } });

      test(`FUN-102: em ${largura} × ${altura} a página e os botões ficam como hoje`, async ({ page }) => {
        await conferirUmaPagina(page);
      });
    });
  }

  // Margem lateral da barra hoje: 8 px abaixo de 640 px (`--esp-2`) e 12 px acima (`--esp-3`).
  for (const [largura, altura, margem] of [
    [375, 812, 8],
    [899, 800, 12],
  ] as const) {
    test.describe(`barra ${largura} × ${altura}`, () => {
      test.use({ viewport: { width: largura, height: altura } });

      test(`FUN-102: em ${largura} × ${altura} a marca fica a ${margem} px da esquerda e a conta a ${margem} px da direita`, async ({
        page,
      }) => {
        await page.goto('/');
        await esperarInicial(page);
        const util = await larguraUtil(page);
        const m = await caixa(marca(page));
        const c = await caixa(conta(page));
        expect(Math.abs(m.x - margem)).toBeLessThanOrEqual(TOL);
        expect(Math.abs(c.x + c.width - (util - margem))).toBeLessThanOrEqual(TOL);
      });
    });
  }
});
