import { expect, test, type Page } from '@playwright/test';
import { abrirGravado, esperarInicial } from './apoio/navegar';

// Jornadas do modo livro (FUN-70 a FUN-76, FUN-82, FUN-83) no build servido por `vite preview`.

const RUTE = 8;
const JOAO = 43;

const regiaoLivro = (page: Page) => page.getByRole('main', { name: 'Leitura em formato livro' });
const paginas = (page: Page) => regiaoLivro(page).getByRole('article');
const seguinte = (page: Page) => page.getByRole('button', { name: 'Página seguinte' });

/** Grava o formato livro e a leitura no aparelho e abre o livro pela página inicial ("Ler Bíblia"). */
async function abrirNoLivro(page: Page, livro: number, capitulo: number): Promise<void> {
  await page.goto('/');
  await esperarInicial(page);
  await page.evaluate(() => localStorage.setItem('mj:formato', JSON.stringify('livro')));
  await abrirGravado(page, livro, capitulo);
  await expect(regiaoLivro(page)).toBeVisible();
  await expect(paginas(page).first()).toBeVisible();
}

/** Rótulo da primeira página mostrada (espera o livro carregar). */
const rotuloPagina = (page: Page) => paginas(page).first().getAttribute('aria-label');

/** Passa uma página e espera o rótulo mudar (o livro seguinte carrega em seguida). */
async function passar(page: Page, antes: string | null): Promise<void> {
  await seguinte(page).click();
  await expect.poll(async () => rotuloPagina(page).catch(() => null), { timeout: 10_000 }).not.toBe(antes);
}

/**
 * Linhas cortadas pelo fundo (ou pelo topo) da caixa do texto: um versículo dividido entre páginas só pode ser
 * cortado entre duas linhas, nunca no meio de uma (FUN-75). Devolve uma descrição por violação.
 */
async function linhasCortadas(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const problemas: string[] = [];
    document.querySelectorAll<HTMLElement>('main[aria-label="Leitura em formato livro"] article').forEach((pagina) => {
      const caixa = pagina.firstElementChild as HTMLElement;
      const limite = caixa.getBoundingClientRect();
      caixa.querySelectorAll('p, h2').forEach((bloco) => {
        const r = bloco.getBoundingClientRect();
        const linha = parseFloat(getComputedStyle(bloco).lineHeight);
        if (!(linha > 0)) return;
        const cortes: number[] = [];
        if (r.bottom > limite.bottom + 1) cortes.push(limite.bottom - r.top);
        if (r.top < limite.top - 1) cortes.push(limite.top - r.top);
        for (const visivel of cortes) {
          const linhas = visivel / linha;
          if (Math.abs(linhas - Math.round(linhas)) * linha > 4) {
            problemas.push(
              `${pagina.getAttribute('aria-label')}: ${(bloco.textContent ?? '').slice(0, 30)} (${linhas.toFixed(2)} linhas)`,
            );
          }
        }
      });
    });
    return problemas;
  });
}

test.describe('duas páginas na tela larga (FUN-73)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('FUN-73: Rute 1 em 1280 × 800 mostra duas páginas lado a lado (mesmo y, x crescente)', async ({ page }) => {
    await abrirNoLivro(page, RUTE, 1);
    await expect(paginas(page)).toHaveCount(2);
    const a = await paginas(page).nth(0).boundingBox();
    const b = await paginas(page).nth(1).boundingBox();
    if (!a || !b) throw new Error('página sem caixa');
    expect(Math.abs(a.y - b.y)).toBeLessThan(1);
    expect(b.x).toBeGreaterThanOrEqual(a.x + a.width - 1);
  });
});

test.describe('uma página na tela estreita (FUN-74)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('FUN-74: Rute 1 em 375 × 812 mostra uma página só', async ({ page }) => {
    await abrirNoLivro(page, RUTE, 1);
    await expect(paginas(page)).toHaveCount(1);
  });

  test('FUN-75: nenhuma linha de Rute fica cortada em nenhuma página', async ({ page }) => {
    await abrirNoLivro(page, RUTE, 1);
    for (let i = 0; i < 60; i++) {
      const rotulo = await rotuloPagina(page);
      if (rotulo?.endsWith('de 1 Samuel')) break;
      expect(await linhasCortadas(page), rotulo ?? '').toEqual([]);
      await passar(page, rotulo);
    }
  });

  test('FUN-76/FUN-82: Rute termina e "1 Samuel" começa no topo de uma página nova', async ({ page }) => {
    await abrirNoLivro(page, RUTE, 1);
    let ultimaDeRute: string | null = null;
    for (let i = 0; i < 60; i++) {
      const rotulo = await rotuloPagina(page);
      if (rotulo?.endsWith('de 1 Samuel')) break;
      ultimaDeRute = rotulo;
      await passar(page, rotulo);
    }
    expect(ultimaDeRute).toMatch(/de Rute$/);
    await expect(paginas(page).first()).toHaveAttribute('aria-label', /^Página 1 de 1 Samuel$/);
    const nome = page.getByRole('heading', { level: 2, name: '1 Samuel' });
    await expect(nome).toBeVisible();
    const caixa = await paginas(page).first().boundingBox();
    const topo = await nome.boundingBox();
    if (!caixa || !topo) throw new Error('sem caixa');
    // O nome do livro é a primeira coisa da página: perto do topo (respiro da página).
    expect(topo.y - caixa.y).toBeLessThan(80);
  });

  test('FUN-70/FUN-71: João 3 → livro → passar páginas → rolagem abre o capítulo da página', async ({ page }) => {
    await abrirNoLivro(page, JOAO, 3);
    // A página do 3:1 pode começar no fim do capítulo 2.
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/^João\s[23]\s*$/);
    await passar(page, await rotuloPagina(page));
    await passar(page, await rotuloPagina(page));
    const titulo = (await page.getByRole('heading', { level: 1 }).textContent()) ?? '';
    const capitulo = /João\s(\d+)/.exec(titulo)?.[1];
    expect(capitulo).toBeTruthy();

    await page.getByRole('button', { name: 'Ler em rolagem' }).click();
    await expect(regiaoLivro(page)).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(new RegExp(`^João ${capitulo}\\b`));
  });

  test('FUN-83: Salmos 23 pela grade abre a página com Salmos 23:1', async ({ page }) => {
    await abrirNoLivro(page, RUTE, 1);
    await page.getByRole('heading', { level: 1 }).getByRole('button').click();
    await page.getByRole('button', { name: 'Trocar livro' }).click();
    await page.getByRole('button', { name: /^Salmos, \d+ cap/ }).click();
    await page
      .getByRole('list', { name: 'Capítulos de Salmos' })
      .getByRole('button', { name: 'Capítulo 23', exact: true })
      .click();
    await expect(regiaoLivro(page)).toBeVisible();
    // O primeiro versículo do capítulo leva o número grande do capítulo.
    await expect(paginas(page).getByLabel('Capítulo 23', { exact: true })).toBeVisible();
  });
});
