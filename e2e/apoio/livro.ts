import { expect, type Page } from '@playwright/test';

// Apoio dos e2e do modo livro: paginar e achar linha cortada ou versículo escondido (FUN-75, FUN-100).

const regiaoLivro = (page: Page) => page.getByRole('main', { name: 'Leitura em formato livro' });
const paginas = (page: Page) => regiaoLivro(page).getByRole('article');
const seguinte = (page: Page) => page.getByRole('button', { name: 'Página seguinte' });

/** Rótulo da primeira página mostrada (espera o livro carregar). */
export const rotuloPagina = (page: Page) => paginas(page).first().getAttribute('aria-label');

/** Passa uma página e espera o rótulo mudar (o livro seguinte carrega em seguida). */
export async function passar(page: Page, antes: string | null): Promise<void> {
  await seguinte(page).click();
  await expect.poll(async () => rotuloPagina(page).catch(() => null), { timeout: 10_000 }).not.toBe(antes);
}

/**
 * Linhas cortadas pelo fundo (ou pelo topo) da caixa do texto: um versículo dividido entre páginas só pode ser
 * cortado entre duas linhas, nunca no meio de uma (FUN-75). Devolve uma descrição por violação.
 */
export async function linhasCortadas(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const problemas: string[] = [];
    document.querySelectorAll<HTMLElement>('main[aria-label="Leitura em formato livro"] article').forEach((pagina) => {
      const caixa = pagina.firstElementChild as HTMLElement;
      const limite = caixa.getBoundingClientRect();
      caixa.querySelectorAll('p, h2').forEach((bloco) => {
        const r = bloco.getBoundingClientRect();
        const linha = parseFloat(getComputedStyle(bloco).lineHeight);
        if (!(linha > 0)) return;
        if (r.top >= limite.bottom - 1) {
          problemas.push(
            `${pagina.getAttribute('aria-label')}: ${(bloco.textContent ?? '').slice(0, 30)} (escondido abaixo da caixa)`,
          );
          return;
        }
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
