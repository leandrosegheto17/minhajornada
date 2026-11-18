import { expect, test } from '@playwright/test';
import {
  abrirGravado,
  abrirPelaEscolha,
  deslizar,
  esperarCapitulo,
  esperarInicial,
  irParaEscolhaDeLivro,
  lerBiblia,
  versiculos,
} from './apoio/navegar';

// J-01 e J-02 de .specs/projeto/jornadas.md, no build servido por `vite preview`.

test.describe('primeira visita e leitura (J-01)', () => {
  test('FUN-21/FUN-09/FUN-01/FUN-02: a primeira visita abre a escolha de livro; Filemom abre Filemom 1 direto, com 25 versículos e "que está" em itálico', async ({
    page,
  }) => {
    await page.goto('/');
    await esperarInicial(page);
    await lerBiblia(page);
    await expect(page.getByRole('heading', { level: 1, name: 'Escolha o livro' })).toBeVisible();
    await expect(page.getByRole('region', { name: /Antigo Testamento/ }).getByRole('button')).toHaveCount(39);
    await expect(page.getByRole('region', { name: /Novo Testamento/ }).getByRole('button')).toHaveCount(27);

    await page.getByRole('button', { name: 'Filemom, 1 capítulo' }).click();
    await expect(page.getByRole('list', { name: /Capítulos de/ })).toHaveCount(0);
    await esperarCapitulo(page, 'Filemom', 1);
    await expect(versiculos(page)).toHaveCount(25);

    const segundo = versiculos(page).nth(1);
    await expect(segundo.locator('em')).toHaveText('que está');
    await expect(segundo).not.toContainText('[');
    await expect(segundo).not.toContainText(']');
  });
});

test.describe('aparência do versículo (J-01)', () => {
  test('FUN-01: cada versículo começa em linha própria, com o número à esquerda do texto', async ({ page }) => {
    await page.goto('/');
    await abrirPelaEscolha(page, 'Filemom', 1);
    await esperarCapitulo(page, 'Filemom', 1);

    const lista = versiculos(page);
    let fimAnterior = -Infinity;
    const colunas = new Set<number>();
    for (const i of [0, 1, 8, 9, 10, 24]) {
      const item = lista.nth(i);
      const numero = await item.locator('span').first().boundingBox();
      const texto = await item.locator('span').nth(1).boundingBox();
      const caixa = await item.boundingBox();
      if (!numero || !texto || !caixa) throw new Error(`versículo ${i + 1} sem caixa`);
      expect(numero.x + numero.width, `versículo ${i + 1}: número à esquerda do texto`).toBeLessThanOrEqual(texto.x);
      expect(caixa.y, `versículo ${i + 1}: começa abaixo do anterior`).toBeGreaterThanOrEqual(fimAnterior);
      fimAnterior = caixa.y + caixa.height;
      colunas.add(Math.round(texto.x));
    }
    // O texto fica na mesma coluna com número de 1 ou 2 dígitos (a pílula tem coluna própria).
    expect([...colunas]).toHaveLength(1);
  });

  test('FUN-02: o acréscimo do tradutor aparece em itálico (estilo computado) e o resto do versículo não', async ({
    page,
  }) => {
    await page.goto('/');
    await abrirPelaEscolha(page, 'Filemom', 1);
    await esperarCapitulo(page, 'Filemom', 1);

    const segundo = versiculos(page).nth(1);
    expect(await segundo.locator('em').evaluate((el) => getComputedStyle(el).fontStyle)).toBe('italic');
    expect(
      await segundo
        .locator('span')
        .nth(1)
        .evaluate((el) => getComputedStyle(el).fontStyle),
    ).toBe('normal');
  });
});

test.describe('navegar e retomar (J-02)', () => {
  test('FUN-11/FUN-49/FUN-06/FUN-07: Malaquias 4 → seguinte → Mateus 1; o título mostra a grade de Mateus; "Trocar livro" → Salmos → 1 a 150 → 119 com 176 versículos', async ({
    page,
  }) => {
    await page.goto('/');
    await abrirPelaEscolha(page, 'Malaquias', 4);

    await page.getByRole('button', { name: 'Capítulo seguinte: Mateus 1' }).click();
    await esperarCapitulo(page, 'Mateus', 1);

    await page.getByRole('button', { name: 'Mateus 1. Escolher outro capítulo' }).click();
    await expect(page.getByRole('list', { name: 'Capítulos de Mateus' }).getByRole('button')).toHaveCount(28);

    await page.getByRole('button', { name: 'Trocar livro' }).click();
    await page.getByRole('button', { name: 'Salmos, 150 capítulos' }).click();
    const grade = page.getByRole('list', { name: 'Capítulos de Salmos' }).getByRole('button');
    await expect(grade).toHaveCount(150);
    await expect(grade.first()).toHaveText('1');
    await expect(grade.last()).toHaveText('150');

    await page.getByRole('button', { name: 'Capítulo 119', exact: true }).click();
    await esperarCapitulo(page, 'Salmos', 119);
    await expect(versiculos(page)).toHaveCount(176);
  });

  test('FUN-14/FUN-15: em Gênesis 1 o anterior está desativado; em Apocalipse 22, o seguinte', async ({ page }) => {
    await page.goto('/');
    await abrirPelaEscolha(page, 'Gênesis', 1);
    await expect(page.getByRole('button', { name: 'Capítulo anterior: não há' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Capítulo seguinte: Gênesis 2' })).toBeEnabled();

    await irParaEscolhaDeLivro(page);
    await abrirPelaEscolha(page, 'Apocalipse', 22);
    await expect(page.getByRole('button', { name: 'Capítulo seguinte: não há' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Capítulo anterior: Apocalipse 21' })).toBeEnabled();
  });

  test('FUN-16: um deslize de 100 px da direita para a esquerda em Salmos 27 abre Salmos 28 (toque emulado)', async ({
    page,
  }) => {
    await page.goto('/');
    await abrirPelaEscolha(page, 'Salmos', 27);
    await deslizar(page, -100, 5);
    await esperarCapitulo(page, 'Salmos', 28);
  });

  test('FUN-17/FUN-18: deslize para a direita volta um capítulo; deslize curto não troca', async ({ page }) => {
    await page.goto('/');
    await abrirPelaEscolha(page, 'Salmos', 27);
    await deslizar(page, 40, 0);
    await esperarCapitulo(page, 'Salmos', 27);
    await deslizar(page, 100, 5);
    await esperarCapitulo(page, 'Salmos', 26);
  });

  test('FUN-19/FUN-20: abrir Romanos 8, recarregar e ver Romanos 8', async ({ page }) => {
    await page.goto('/');
    await abrirPelaEscolha(page, 'Romanos', 8);
    await page.reload();
    // FUN-51: o app abre sempre na página inicial; FUN-54: "Ler Bíblia" continua de onde parou.
    await esperarInicial(page);
    await lerBiblia(page);
    await esperarCapitulo(page, 'Romanos', 8);
  });

  test('FUN-51/FUN-54: com Romanos 8 gravado, abrir mostra a inicial e "Ler Bíblia" abre Romanos 8; recarregar volta à inicial', async ({
    page,
  }) => {
    await page.goto('/');
    await esperarInicial(page);
    await abrirGravado(page, 45, 8);
    await esperarCapitulo(page, 'Romanos', 8);
    await page.reload();
    await esperarInicial(page);
  });

  test('FUN-05: o capítulo novo abre no início', async ({ page }) => {
    await page.goto('/');
    await abrirGravado(page, 19, 119);
    await esperarCapitulo(page, 'Salmos', 119);
    await page.mouse.wheel(0, 5000);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    await page.getByRole('button', { name: 'Capítulo seguinte: Salmos 120' }).click();
    await esperarCapitulo(page, 'Salmos', 120);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  });
});
