import { expect, test } from '@playwright/test';
import {
  abrirGravado,
  abrirPelaEscolha,
  esperarCapitulo,
  esperarSwAtivo,
  irParaEscolhaDeLivro,
  livrosGuardados,
  versiculos,
} from './apoio/navegar';

// J-03 de .specs/projeto/jornadas.md, no build servido por `vite preview`.

/** Número do livro (2 dígitos) no caminho `/livros/NN.<hash>.json`, ou `null` se não for um livro. */
function numeroDoLivro(url: string): string | null {
  return /\/livros\/(\d{2})\.[0-9a-f]+\.json$/.exec(new URL(url).pathname)?.[1] ?? null;
}

const MENSAGEM = 'Este livro ainda não foi baixado. Conecte-se à internet para lê-lo.';

test.describe('ler sem internet (J-03)', () => {
  test('FUN-34: com Romanos 8 gravado, até o primeiro capítulo aparecer só livros/45.*.json foi pedido entre os livros', async ({
    page,
  }) => {
    await page.goto('/');
    const eventos: string[] = [];
    page.on('request', (pedido) => {
      const numero = numeroDoLivro(pedido.url());
      if (numero) eventos.push(`pedido:${numero}`);
    });
    page.on('requestfinished', (pedido) => {
      if (numeroDoLivro(pedido.url()) === '45') eventos.push('fim:45');
    });

    await abrirGravado(page, 45, 8);
    await esperarCapitulo(page, 'Romanos', 8);

    const ate = eventos.indexOf('fim:45');
    expect(ate).toBeGreaterThan(0);
    expect(eventos.slice(0, ate)).toEqual(['pedido:45']);
  });

  test('FUN-33/FUN-35: com os 66 livros guardados, sem rede, o app reabre e mostra Apocalipse 22', async ({
    page,
    context,
  }) => {
    test.setTimeout(120_000);
    await page.goto('/');
    await esperarSwAtivo(page);
    await abrirGravado(page, 45, 8);
    await esperarCapitulo(page, 'Romanos', 8);
    await expect.poll(() => livrosGuardados(page), { timeout: 90_000 }).toBe(66);

    await context.setOffline(true);
    try {
      await page.reload();
      await esperarCapitulo(page, 'Romanos', 8);
      await irParaEscolhaDeLivro(page);
      await abrirPelaEscolha(page, 'Apocalipse', 22);
      await expect(page.getByText(MENSAGEM)).toHaveCount(0);
      await expect(versiculos(page)).not.toHaveCount(0);
    } finally {
      await context.setOffline(false);
    }
  });

  test('FUN-36: sem o livro guardado e sem rede, escolher Apocalipse mostra a mensagem exata e o seletor continua disponível', async ({
    page,
    context,
  }) => {
    test.setTimeout(120_000);
    // Apocalipse (66) nunca chega ao aparelho: o download em segundo plano para nele.
    await context.route(/\/livros\/66\.[0-9a-f]+\.json$/, (rota) => rota.abort('internetdisconnected'));
    await page.goto('/');
    await esperarSwAtivo(page);
    await abrirGravado(page, 45, 8);
    await esperarCapitulo(page, 'Romanos', 8);
    await expect.poll(() => livrosGuardados(page), { timeout: 90_000 }).toBe(65);

    await context.setOffline(true);
    try {
      await irParaEscolhaDeLivro(page);
      await page.getByRole('button', { name: 'Apocalipse, 22 capítulos' }).click();
      await page.getByRole('button', { name: 'Capítulo 22', exact: true }).click();
      await expect(page.getByText(MENSAGEM, { exact: true })).toBeVisible();

      await page.getByRole('button', { name: 'Escolher outro livro' }).click();
      await expect(page.getByRole('heading', { level: 1, name: 'Escolha o livro' })).toBeVisible();
      await abrirPelaEscolha(page, 'Salmos', 23);
    } finally {
      await context.setOffline(false);
    }
  });
});

test.describe('privacidade (FUN-41)', () => {
  test('FUN-41: navegando por 5 capítulos, nenhuma requisição sai de 127.0.0.1 e não há cookies', async ({
    page,
    context,
  }) => {
    const hosts = new Set<string>();
    page.on('request', (pedido) => hosts.add(new URL(pedido.url()).hostname));

    await page.goto('/');
    await abrirPelaEscolha(page, 'Mateus', 1);
    for (let capitulo = 2; capitulo <= 5; capitulo += 1) {
      await page.getByRole('button', { name: `Capítulo seguinte: Mateus ${capitulo}` }).click();
      await esperarCapitulo(page, 'Mateus', capitulo);
    }

    expect([...hosts]).toEqual(['127.0.0.1']);
    expect(await context.cookies()).toEqual([]);
  });
});
