import { expect, test, type Locator, type Page } from '@playwright/test';
import { linhasCortadas, passar, rotuloPagina } from './apoio/livro';
import { abrirGravado, esperarInicial, lerBiblia } from './apoio/navegar';

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

test.describe('barra de borda a borda com 900 px ou mais (FUN-95)', () => {
  for (const [largura, altura] of [
    [900, 600],
    [1280, 800],
    [1920, 1080],
  ] as const) {
    test.describe(`${largura} × ${altura}`, () => {
      test.use({ viewport: { width: largura, height: altura } });

      test(`FUN-95: em ${largura} × ${altura} a barra vai de borda a borda em todas as telas`, async ({ page }) => {
        const conferir = async (onde: string) => {
          const util = await larguraUtil(page);
          const m = await caixa(marca(page));
          const c = await caixa(conta(page));
          expect(Math.abs(m.x - 24), `${onde}: marca a ${m.x} px da esquerda`).toBeLessThanOrEqual(TOL);
          expect(
            Math.abs(c.x + c.width - (util - 24)),
            `${onde}: conta termina a ${util - (c.x + c.width)} px da direita`,
          ).toBeLessThanOrEqual(TOL);
        };

        await page.goto('/');
        await esperarInicial(page);
        await conferir('página inicial');

        await abrirGravado(page, 45, 8);
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(/^Romanos 8\b/);
        await conferir('leitor em rolagem');

        await page.getByRole('button', { name: 'Ler como livro' }).click();
        await expect(regiaoLivro(page)).toBeVisible();
        await conferir('modo livro');

        await page.getByRole('button', { name: 'Sobre o MinhaJornada' }).click();
        await expect(page.getByRole('heading', { level: 1, name: 'Sobre o MinhaJornada' })).toBeVisible();
        await conferir('Sobre');
      });
    });
  }
});

const TAMANHOS_LARGOS = [
  [900, 600],
  [1280, 800],
  [1920, 1080],
  [1920, 1200],
] as const;

const titulo = (page: Page) => regiaoLivro(page).locator('h1');
const posicaoTexto = (page: Page) => regiaoLivro(page).getByText(/, páginas? \d+/);
const medida = (page: Page) => regiaoLivro(page).locator(':scope > div[aria-hidden="true"]');

test.describe('páginas que preenchem a área (FUN-96, FUN-97)', () => {
  for (const [largura, altura] of TAMANHOS_LARGOS) {
    test.describe(`${largura} × ${altura}`, () => {
      test.use({ viewport: { width: largura, height: altura } });

      test(`FUN-96: em ${largura} × ${altura} as duas páginas ocupam a largura menos as margens, metade cada`, async ({
        page,
      }) => {
        await abrirNoLivro(page, RUTE, 1);
        await expect(paginas(page)).toHaveCount(2);
        const util = await larguraUtil(page);
        const a = await caixa(paginas(page).nth(0));
        const b = await caixa(paginas(page).nth(1));
        const vao = b.x - (a.x + a.width);
        expect(Math.abs(a.x - 24), `esquerda a ${a.x} px`).toBeLessThanOrEqual(TOL);
        expect(
          Math.abs(b.x + b.width - (util - 24)),
          `direita termina a ${util - (b.x + b.width)} px`,
        ).toBeLessThanOrEqual(TOL);
        expect(Math.abs(a.width - b.width)).toBeLessThanOrEqual(TOL);
        expect(Math.abs(a.width - (util - 48 - vao) / 2), `largura ${a.width}`).toBeLessThanOrEqual(TOL);
      });

      test(`FUN-97: em ${largura} × ${altura} as páginas ficam entre o título e os botões, sem rolagem vertical`, async ({
        page,
      }) => {
        await abrirNoLivro(page, RUTE, 1);
        const t = await caixa(titulo(page));
        const p = await caixa(paginas(page).first());
        const ant = await caixa(anterior(page));
        expect(p.y, 'topo da página abaixo do título').toBeGreaterThanOrEqual(t.y + t.height - TOL);
        expect(p.y + p.height, 'fundo da página acima dos botões').toBeLessThanOrEqual(ant.y + TOL);
        expect(Math.abs(p.height - (ant.y - (t.y + t.height) - 32)), `altura ${p.height}`).toBeLessThanOrEqual(TOL);
        const rolagem = await page.evaluate(() => [document.documentElement.scrollHeight, window.innerHeight]);
        expect(rolagem[0], 'rolagem vertical').toBeLessThanOrEqual(rolagem[1] ?? 0);
      });
    });
  }
});

/** Percorre Rute inteira (até 1 Samuel) sem linha cortada nem bloco escondido. */
async function lerRuteInteira(page: Page): Promise<void> {
  for (let i = 0; i < 80; i++) {
    const rotulo = await rotuloPagina(page);
    if (rotulo?.endsWith('de 1 Samuel')) return;
    expect(await linhasCortadas(page), rotulo ?? '').toEqual([]);
    await passar(page, rotulo);
  }
}

/** A medida tem o tamanho da página mostrada (espera a repaginação assentar). */
async function conferirMedida(page: Page): Promise<void> {
  await expect
    .poll(async () => {
      const m = await caixa(medida(page));
      const p = await caixa(paginas(page).first());
      return Math.abs(m.width - p.width) <= TOL && Math.abs(m.height - p.height) <= TOL;
    })
    .toBe(true);
}

test.describe('medida do tamanho da página mostrada (FUN-100)', () => {
  for (const [largura, altura] of [
    [1280, 800],
    [1920, 1080],
  ] as const) {
    test.describe(`${largura} × ${altura}`, () => {
      test.use({ viewport: { width: largura, height: altura } });

      test(`FUN-100: em ${largura} × ${altura} a medida tem o tamanho da página mostrada`, async ({ page }) => {
        await abrirNoLivro(page, RUTE, 1);
        const m = await caixa(medida(page));
        const p = await caixa(paginas(page).first());
        expect(Math.abs(m.width - p.width), `largura ${m.width} × ${p.width}`).toBeLessThanOrEqual(TOL);
        expect(Math.abs(m.height - p.height), `altura ${m.height} × ${p.height}`).toBeLessThanOrEqual(TOL);
      });

      test(`FUN-100: em ${largura} × ${altura} nenhum versículo de Rute fica escondido ou cortado`, async ({
        page,
      }) => {
        await abrirNoLivro(page, RUTE, 1);
        await lerRuteInteira(page);
      });
    });
  }

  test.describe('troca de tamanho', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test('FUN-100: de 1280 × 800 para 1920 × 1080 o livro repagina sem versículo escondido', async ({ page }) => {
      const posicao = async () => (await posicaoTexto(page).first().textContent()) ?? '';

      await abrirNoLivro(page, RUTE, 1);
      const pequena = await posicao();
      expect(await linhasCortadas(page)).toEqual([]);

      await page.setViewportSize({ width: 1920, height: 1080 });
      await expect.poll(posicao).not.toBe(pequena);
      await conferirMedida(page);
      expect(await linhasCortadas(page)).toEqual([]);
      await lerRuteInteira(page);

      await abrirNoLivro(page, RUTE, 1);
      const grande = await posicao();
      await page.setViewportSize({ width: 1280, height: 800 });
      await expect.poll(posicao).not.toBe(grande);
      await conferirMedida(page);
      expect(await linhasCortadas(page)).toEqual([]);
      await lerRuteInteira(page);
    });
  });
});

const capaLivro = (page: Page) => page.getByRole('article', { name: 'Capa' });
const planoPago = (page: Page) => page.getByRole('article', { name: 'Plano de estudo' });

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
  await expect(capaLivro(page)).toBeVisible();
}

const TAMANHOS_ALINHAMENTO = [
  [1280, 800],
  [1920, 1080],
] as const;

test.describe('título e posição alinhados às páginas (FUN-98)', () => {
  for (const [largura, altura] of TAMANHOS_ALINHAMENTO) {
    test.describe(`${largura} × ${altura}`, () => {
      test.use({ viewport: { width: largura, height: altura } });

      test(`FUN-98: em ${largura} × ${altura} o título e a posição alinham com as bordas das páginas`, async ({
        page,
      }) => {
        await abrirNoLivro(page, RUTE, 1);
        const a = await caixa(paginas(page).nth(0));
        const b = await caixa(paginas(page).nth(1));
        const botaoTitulo = await caixa(titulo(page).getByRole('button'));
        const posicao = await caixa(posicaoTexto(page).first());
        expect(Math.abs(botaoTitulo.x - a.x), `título a ${botaoTitulo.x}, página a ${a.x}`).toBeLessThanOrEqual(TOL);
        expect(
          Math.abs(posicao.x + posicao.width - (b.x + b.width)),
          `posição termina a ${posicao.x + posicao.width}, página a ${b.x + b.width}`,
        ).toBeLessThanOrEqual(TOL);
      });
    });
  }
});

test.describe('"Anterior" e "Seguinte" nos cantos de baixo (FUN-99)', () => {
  for (const [largura, altura] of TAMANHOS_ALINHAMENTO) {
    test.describe(`${largura} × ${altura}`, () => {
      test.use({ viewport: { width: largura, height: altura } });

      const conferirCantos = async (page: Page, esquerda: Locator, direita: Locator) => {
        const a = await caixa(esquerda);
        const b = await caixa(direita);
        const ant = await caixa(anterior(page));
        const seg = await caixa(seguinte(page));
        const pe = await alturaJanela(page);
        expect(Math.abs(ant.x - a.x), `anterior a ${ant.x}, página a ${a.x}`).toBeLessThanOrEqual(TOL);
        expect(
          Math.abs(seg.x + seg.width - (b.x + b.width)),
          `seguinte termina a ${seg.x + seg.width}`,
        ).toBeLessThanOrEqual(TOL);
        expect(Math.abs(ant.y - seg.y)).toBeLessThanOrEqual(TOL);
        expect(ant.y).toBeGreaterThanOrEqual(a.y + a.height - TOL);
        expect(pe - (ant.y + ant.height), 'distância do pé da tela').toBeLessThanOrEqual(16 + TOL);
      };

      test(`FUN-99: em ${largura} × ${altura} "Anterior" e "Seguinte" ficam nos cantos de baixo, em Rute 1`, async ({
        page,
      }) => {
        await abrirNoLivro(page, RUTE, 1);
        await conferirCantos(page, paginas(page).nth(0), paginas(page).nth(1));
      });

      test(`FUN-99: em ${largura} × ${altura} "Anterior" e "Seguinte" ficam nos cantos de baixo, na capa`, async ({
        page,
      }) => {
        await abrirNoLivro(page, RUTE, 1);
        const yTexto = (await caixa(paginas(page).first())).y;
        const yBotoes = (await caixa(anterior(page))).y;
        await abrirNaCapa(page);
        await conferirCantos(page, planoPago(page), capaLivro(page));
        // A capa reserva a linha do título (A-01): páginas e botões na mesma altura que em Rute, sem salto ao passar.
        expect(Math.abs((await caixa(planoPago(page))).y - yTexto), 'topo das páginas').toBeLessThanOrEqual(TOL);
        expect(Math.abs((await caixa(anterior(page))).y - yBotoes), 'topo dos botões').toBeLessThanOrEqual(TOL);
      });
    });
  }
});

test.describe('capa e plano pago do tamanho das páginas de texto (FUN-101)', () => {
  for (const [largura, altura] of TAMANHOS_ALINHAMENTO) {
    test.describe(`${largura} × ${altura}`, () => {
      test.use({ viewport: { width: largura, height: altura } });

      test(`FUN-101: em ${largura} × ${altura} a capa e o plano pago têm o tamanho das páginas de texto`, async ({
        page,
      }) => {
        await abrirNoLivro(page, RUTE, 1);
        const texto = await caixa(paginas(page).first());
        await abrirNaCapa(page);
        const util = await larguraUtil(page);
        const pago = await caixa(planoPago(page));
        const capa = await caixa(capaLivro(page));
        for (const [nome, c] of [
          ['plano pago', pago],
          ['capa', capa],
        ] as const) {
          expect(Math.abs(c.width - texto.width), `${nome}: largura ${c.width} × ${texto.width}`).toBeLessThanOrEqual(
            TOL,
          );
          expect(
            Math.abs(c.height - texto.height),
            `${nome}: altura ${c.height} × ${texto.height}`,
          ).toBeLessThanOrEqual(TOL);
        }
        expect(Math.abs(pago.x - 24)).toBeLessThanOrEqual(TOL);
        expect(Math.abs(capa.x + capa.width - (util - 24))).toBeLessThanOrEqual(TOL);
      });
    });
  }
});
