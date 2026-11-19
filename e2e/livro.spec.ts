import { expect, test, type Page } from '@playwright/test';
import { linhasCortadas, passar, rotuloPagina } from './apoio/livro';
import { abrirGravado, esperarInicial } from './apoio/navegar';

// Jornadas do modo livro (FUN-70 a FUN-76, FUN-82, FUN-83) no build servido por `vite preview`.

const RUTE = 8;
const JOAO = 43;

const regiaoLivro = (page: Page) => page.getByRole('main', { name: 'Leitura em formato livro' });
const paginas = (page: Page) => regiaoLivro(page).getByRole('article');

/** Grava o formato livro e a leitura no aparelho e abre o livro pela página inicial ("Ler Bíblia"). */
async function abrirNoLivro(page: Page, livro: number, capitulo: number): Promise<void> {
  await page.goto('/');
  await esperarInicial(page);
  await page.evaluate(() => localStorage.setItem('mj:formato', JSON.stringify('livro')));
  await abrirGravado(page, livro, capitulo);
  await expect(regiaoLivro(page)).toBeVisible();
  await expect(paginas(page).first()).toBeVisible();
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

test.describe('texto inteiro nas duas páginas (FUN-75)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('FUN-75: em 1280 × 800 nenhum versículo de Rute fica escondido ou cortado no meio de uma linha', async ({
    page,
  }) => {
    await abrirNoLivro(page, RUTE, 1);
    for (let i = 0; i < 40; i++) {
      const rotulo = await rotuloPagina(page);
      if (rotulo?.endsWith('de 1 Samuel')) break;
      expect(await linhasCortadas(page), rotulo ?? '').toEqual([]);
      await passar(page, rotulo);
    }
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

  test('FUN-71 (AD-007): João 3 no livro e de volta à rolagem sem passar página abre exatamente João 3', async ({
    page,
  }) => {
    await abrirNoLivro(page, JOAO, 3);
    await page.getByRole('button', { name: 'Ler em rolagem' }).click();
    await expect(regiaoLivro(page)).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/^João\s3\s*$/);
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

// Capítulo em página nova (FUN-128 a FUN-131): cada capítulo do 2 em diante abre uma página, em qualquer tela.

const GENESIS = 1;

/** Páginas mostradas que trazem o número grande do capítulo (a marca do primeiro versículo dele). */
const comCapitulo = (page: Page, capitulo: number) =>
  paginas(page).filter({ has: page.getByLabel(`Capítulo ${capitulo}`, { exact: true }) });

/** O capítulo abre a página: o número é a primeira coisa do primeiro bloco e fica perto do topo (FUN-128). */
async function esperarCapituloNoTopo(page: Page, capitulo: number): Promise<void> {
  const pagina = comCapitulo(page, capitulo);
  await expect(pagina).toHaveCount(1);
  const marca = pagina.locator('p').first().getByLabel(`Capítulo ${capitulo}`, { exact: true });
  await expect(marca).toBeVisible();
  const caixa = await pagina.boundingBox();
  const topo = await marca.boundingBox();
  if (!caixa || !topo) throw new Error('sem caixa');
  expect(topo.y - caixa.y).toBeLessThan(80);
}

/** A página que vem logo antes da que abre `capitulo`: no mesmo par, ou a da direita do par anterior. */
async function paginaAntesDe(page: Page, capitulo: number) {
  const todas = await paginas(page).all();
  let indice = -1;
  for (const [i, pagina] of todas.entries()) {
    if ((await pagina.getByLabel(`Capítulo ${capitulo}`, { exact: true }).count()) > 0) indice = i;
  }
  expect(indice).toBeGreaterThanOrEqual(0);
  if (indice > 0) return paginas(page).nth(indice - 1);
  const antes = await rotuloPagina(page);
  await page.getByRole('button', { name: 'Página anterior' }).click();
  await expect.poll(() => rotuloPagina(page), { timeout: 10_000 }).not.toBe(antes);
  return paginas(page).last();
}

for (const tela of [
  { nome: 'tela larga', largura: 1920, altura: 1080 },
  { nome: 'tela estreita', largura: 390, altura: 844 },
]) {
  test.describe(`capítulo em página nova, ${tela.nome} (FUN-128, FUN-129, FUN-130)`, () => {
    test.use({ viewport: { width: tela.largura, height: tela.altura } });

    test(`FUN-128: em ${tela.largura} × ${tela.altura} o capítulo 21 de Gênesis começa no topo de uma página`, async ({
      page,
    }) => {
      await abrirNoLivro(page, GENESIS, 21);
      await esperarCapituloNoTopo(page, 21);
    });

    test(`FUN-129: em ${tela.largura} × ${tela.altura} a página antes do capítulo 21 termina no versículo 18 do 20`, async ({
      page,
    }) => {
      await abrirNoLivro(page, GENESIS, 21);
      const antes = await paginaAntesDe(page, 21);
      // Gênesis 20 tem 18 versículos: a última página dele acaba no 18 e não leva nada do capítulo 21.
      await expect(antes.getByLabel('Capítulo 21', { exact: true })).toHaveCount(0);
      await expect(antes.locator('p').last()).toHaveText(/^18\D/);
    });

    test(`FUN-130: em ${tela.largura} × ${tela.altura} Gênesis 1 fica na mesma página do nome do livro`, async ({
      page,
    }) => {
      await abrirNoLivro(page, GENESIS, 1);
      const primeira = paginas(page).first();
      await expect(primeira.getByRole('heading', { level: 2, name: 'Gênesis' })).toBeVisible();
      await expect(primeira.getByLabel('Capítulo 1', { exact: true })).toBeVisible();
    });
  });
}

test.describe('capítulo à direita, grade e troca de letra (FUN-131, FUN-83, FUN-86)', () => {
  test.use({ viewport: { width: 1920, height: 1080 } });

  test('FUN-131: percorrendo Gênesis há um par em que a página da direita abre o capítulo seguinte', async ({
    page,
  }) => {
    await abrirNoLivro(page, GENESIS, 1);
    let achou = false;
    for (let i = 0; i < 60 && !achou; i++) {
      const direita = paginas(page).nth(1);
      const marcas = direita.locator('p [aria-label^="Capítulo "]');
      if ((await marcas.count()) > 0) {
        const rotulo = (await marcas.first().getAttribute('aria-label')) ?? '';
        const capitulo = Number(/\d+/.exec(rotulo)?.[0]);
        expect(capitulo).toBeGreaterThan(1);
        // O número do capítulo é a primeira coisa da página da direita; a da esquerda terminou o anterior.
        await expect(direita.locator('p').first().getByLabel(`Capítulo ${capitulo}`, { exact: true })).toBeVisible();
        await expect(paginas(page).nth(0).getByLabel(`Capítulo ${capitulo}`, { exact: true })).toHaveCount(0);
        achou = true;
      } else {
        await passar(page, await rotuloPagina(page));
      }
    }
    expect(achou).toBe(true);
  });

  test('FUN-83 com FUN-128: Gênesis 21 pela grade abre a página que começa com o 21 no topo', async ({ page }) => {
    await abrirNoLivro(page, RUTE, 1);
    await page.getByRole('heading', { level: 1 }).getByRole('button').click();
    await page.getByRole('button', { name: 'Trocar livro' }).click();
    await page.getByRole('button', { name: /^Gênesis, \d+ cap/ }).click();
    await page
      .getByRole('list', { name: 'Capítulos de Gênesis' })
      .getByRole('button', { name: 'Capítulo 21', exact: true })
      .click();
    await expect(regiaoLivro(page)).toBeVisible();
    await esperarCapituloNoTopo(page, 21);
  });

  test('FUN-86 com FUN-128: trocar a letra para a maior em Gênesis 21 mantém o capítulo 21 no topo de uma página', async ({
    page,
  }) => {
    await abrirNoLivro(page, GENESIS, 21);
    await esperarCapituloNoTopo(page, 21);
    await page.getByRole('button', { name: 'Aparência: letra e tema' }).click();
    for (let i = 0; i < 2; i++) await page.getByRole('button', { name: 'Aumentar letra' }).click();
    await expect(page.getByText('Letra 5 de 5')).toBeVisible();
    await page.getByRole('button', { name: 'Aparência: letra e tema' }).click();
    await esperarCapituloNoTopo(page, 21);
    // Não afirma que repaginou: a troca de letra com o livro aberto já não repagina (defeito anterior a esta feature,
    // `.specs/bugs/letra-livro-sem-repaginar/relato.md`). O que vale aqui é o capítulo continuar no topo da página.
  });
});
