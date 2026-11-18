import { expect, type Page } from '@playwright/test';

/** A página inicial está aberta (FUN-51): o app sempre abre nela. */
export async function esperarInicial(page: Page): Promise<void> {
  await expect(page.getByRole('heading', { level: 1, name: 'A Palavra perto de você, onde estiver' })).toBeVisible();
}

/** Na página inicial, toca em "Ler Bíblia" (FUN-54, FUN-55). */
export async function lerBiblia(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Ler Bíblia', exact: true }).click();
}

/** Grava a leitura no aparelho e reabre o app nela: recarrega, vê a inicial e toca em "Ler Bíblia" (FUN-54). */
export async function abrirGravado(page: Page, livro: number, capitulo: number): Promise<void> {
  await page.evaluate(([l, c]) => localStorage.setItem('mj:leitura', JSON.stringify({ livro: l, capitulo: c })), [
    livro,
    capitulo,
  ] as const);
  await page.reload();
  await esperarInicial(page);
  await lerBiblia(page);
}

/** Grava a letra (1 a 5) no aparelho; vale a partir da próxima abertura. */
export async function gravarLetra(page: Page, letra: number): Promise<void> {
  await page.evaluate((n) => localStorage.setItem('mj:letra', JSON.stringify(n)), letra);
}

/** Na escolha de livro, toca no livro pelo nome (o rótulo é "<nome>, <n> capítulo(s)"). */
export async function escolherLivro(page: Page, nome: string): Promise<void> {
  await page.getByRole('button', { name: new RegExp(`^${nome}, \\d+ cap`) }).click();
}

/**
 * Abre `nome` `capitulo` pela escolha de livro (pela grade, ou direto em livro de capítulo único). Se a página
 * inicial está aberta, passa antes por "Ler Bíblia" (FUN-55).
 */
export async function abrirPelaEscolha(page: Page, nome: string, capitulo: number): Promise<void> {
  const inicial = page.getByRole('heading', { level: 1, name: 'A Palavra perto de você, onde estiver' });
  if (await inicial.isVisible().catch(() => false)) await lerBiblia(page);
  await escolherLivro(page, nome);
  const grade = page.getByRole('list', { name: `Capítulos de ${nome}` });
  if (await grade.isVisible().catch(() => false)) {
    await grade.getByRole('button', { name: `Capítulo ${capitulo}`, exact: true }).click();
  }
  await esperarCapitulo(page, nome, capitulo);
}

/** O leitor mostra `nome` `capitulo` com os versículos carregados. */
export async function esperarCapitulo(page: Page, nome: string, capitulo: number): Promise<void> {
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(new RegExp(`^${nome} ${capitulo}\\b`));
  await expect(versiculos(page).first()).toBeVisible();
}

/** Itens da lista de versículos do leitor. */
export function versiculos(page: Page) {
  return page.getByRole('main').getByRole('listitem');
}

/** Do leitor, vai à escolha de livro (título; na grade, "Trocar livro"). */
export async function irParaEscolhaDeLivro(page: Page): Promise<void> {
  await page.getByRole('heading', { level: 1 }).getByRole('button').click();
  const trocar = page.getByRole('button', { name: 'Trocar livro' });
  if (await trocar.isVisible().catch(() => false)) await trocar.click();
  await expect(page.getByRole('heading', { level: 1, name: 'Escolha o livro' })).toBeVisible();
}

/** Simula um deslize de toque (Pointer Events, `pointerType: 'touch'`) na área do texto. */
export async function deslizar(page: Page, dx: number, dy = 0): Promise<void> {
  const area = page.getByRole('main');
  const caixa = await area.boundingBox();
  if (!caixa) throw new Error('área do texto sem caixa');
  const x = caixa.x + caixa.width / 2;
  const y = caixa.y + Math.min(caixa.height / 2, 200);
  const base = { pointerId: 7, isPrimary: true, pointerType: 'touch', bubbles: true };
  await area.dispatchEvent('pointerdown', { ...base, clientX: x, clientY: y });
  await area.dispatchEvent('pointerup', { ...base, clientX: x + dx, clientY: y + dy });
}

/** Espera o service worker do build controlar a página (FUN-35). */
export async function esperarSwAtivo(page: Page): Promise<void> {
  await page.waitForFunction(async () => {
    const registro = await navigator.serviceWorker.ready;
    return Boolean(registro.active) && navigator.serviceWorker.controller !== null;
  });
}

/** Quantos livros estão no cache `mj-livros` (FUN-33). */
export async function livrosGuardados(page: Page): Promise<number> {
  return page.evaluate(async () => (await (await caches.open('mj-livros')).keys()).length);
}
