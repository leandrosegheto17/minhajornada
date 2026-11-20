import { expect, test, type Locator, type Page } from '@playwright/test';
import { esperarInicial, lerBiblia } from './apoio/navegar';

// Provas de tela do resumo no modo livro (FUN-153 a FUN-169) com a API simulada por `page.route`. O service worker fica
// bloqueado: este teste não é do SW, e ele poderia esconder as chamadas da rota.
test.use({ serviceWorkers: 'block' });

const GENESIS = 1;
const EXODO = 2;
const RUTE = 8;
const MARCOS = 41;
const ROMANOS = 45;
const VAO = 32;
const TOL = 1;

interface ResumoDeExemplo {
  livro: number;
  contexto: string;
  mensagem: string;
  divisao: { titulo: string; de: number; ate: number }[];
  versiculos: { capitulo: number; versiculo: number; ate?: number; frase: string }[];
}

const resumoDe = (livro: number, extra = ''): ResumoDeExemplo => ({
  livro,
  contexto: `Contexto de exemplo do livro ${livro}. ${extra}`.trim(),
  mensagem: `Mensagem central de exemplo do livro ${livro}.`,
  divisao: [
    { titulo: 'Primeira parte', de: 1, ate: 1 },
    { titulo: 'Segunda parte', de: 2, ate: 3 },
  ],
  versiculos: [{ capitulo: 1, versiculo: 1, frase: 'Frase do versículo-chave de exemplo.' }],
});

/** Texto longo (cerca de 900 palavras): não cabe em uma página de 390 × 844. */
const TEXTO_LONGO = Array.from(
  { length: 90 },
  (_, i) => `Frase ${i + 1} do contexto longo com dez palavras para encher.`,
).join(' ');

interface Opcoes {
  /** Resposta de `/api/sessao`: 200 (dono) ou 401. */
  sessao?: 200 | 401;
  /** Resposta de `/api/resumos/:n`, por livro; sem entrada, 404. */
  resumos?: Record<number, { status: number; corpo?: ResumoDeExemplo }>;
  /** Segura as respostas de resumo até a função devolvida ser chamada. */
  segurar?: boolean;
}

async function simularApi(page: Page, opcoes: Opcoes = {}) {
  const { sessao = 200, resumos = {}, segurar = false } = opcoes;
  const estado = { resumos, liberar: () => {} };
  const portao = segurar ? new Promise<void>((resolver) => (estado.liberar = resolver)) : null;
  await page.route('**/api/**', async (rota) => {
    const caminho = new URL(rota.request().url()).pathname;
    if (caminho === '/api/sessao') {
      return sessao === 200
        ? rota.fulfill({ status: 200, json: { dono: true } })
        : rota.fulfill({ status: 401, json: { erro: 'sem_sessao' } });
    }
    const livro = /^\/api\/resumos\/(\d+)$/.exec(caminho)?.[1];
    if (livro) {
      if (portao) await portao;
      const resposta = estado.resumos[Number(livro)];
      if (!resposta) return rota.fulfill({ status: 404, json: { erro: 'sem_resumo' } });
      return rota.fulfill({ status: resposta.status, json: resposta.corpo ?? { erro: 'falha' } });
    }
    return rota.fulfill({ status: 404, json: { erro: 'nao_encontrado' } });
  });
  return estado;
}

const regiaoLivro = (page: Page) => page.getByRole('main', { name: 'Leitura em formato livro' });
const paginasDaBiblia = (page: Page, nome: string) =>
  regiaoLivro(page).getByRole('article', { name: new RegExp(`^Página \\d+ de ${nome}$`) });
const paginaDoResumo = (page: Page, nome: string) =>
  regiaoLivro(page).getByRole('article', { name: new RegExp(`^Resumo de ${nome}`) });
const botaoResumo = (page: Page) => page.getByRole('button', { name: 'Resumo', exact: true });
const seguinte = (page: Page) => page.getByRole('button', { name: 'Página seguinte', exact: true });

async function caixa(alvo: Locator) {
  const c = await alvo.boundingBox();
  if (!c) throw new Error('elemento sem caixa');
  return c;
}

/** Grava formato, resumo ligado (opcional) e leitura no aparelho e abre o livro pela página inicial ("Ler Bíblia"). */
async function abrirNoLivro(
  page: Page,
  livro: number,
  capitulo: number,
  opcoes: { formato?: 'livro' | 'rolagem'; resumoLigado?: boolean; semLeitura?: boolean } = {},
): Promise<void> {
  const { formato = 'livro', resumoLigado, semLeitura = false } = opcoes;
  await page.goto('/');
  await esperarInicial(page);
  await page.evaluate(
    ([f, r, l, c, sem]) => {
      localStorage.setItem('mj:formato', JSON.stringify(f));
      if (r !== undefined) localStorage.setItem('mj:resumo', JSON.stringify(r));
      if (sem) localStorage.removeItem('mj:leitura');
      else localStorage.setItem('mj:leitura', JSON.stringify({ livro: l, capitulo: c }));
    },
    [formato, resumoLigado, livro, capitulo, semLeitura] as const,
  );
  await page.reload();
  await esperarInicial(page);
  await lerBiblia(page);
}

test.describe('resumo na página da direita em 1920 × 1080', () => {
  test.use({ viewport: { width: 1920, height: 1080 } });

  test('FUN-154 FUN-155 FUN-156 FUN-157: liga à direita, passa uma página por vez, desliga no par e lembra ao recarregar', async ({
    page,
  }) => {
    await simularApi(page, { resumos: { [GENESIS]: { status: 200, corpo: resumoDe(GENESIS) } } });
    await abrirNoLivro(page, GENESIS, 1);
    await expect(paginasDaBiblia(page, 'Gênesis')).toHaveCount(2);

    // FUN-153: com sessão de dono, no formato livro, o botão existe e começa desligado.
    await expect(botaoResumo(page)).toHaveAttribute('aria-pressed', 'false');

    // FUN-154: uma página da Bíblia à esquerda e o resumo à direita, a 32 px, com a linha no meio do vão.
    await botaoResumo(page).click();
    await expect(botaoResumo(page)).toHaveAttribute('aria-pressed', 'true');
    await expect(paginasDaBiblia(page, 'Gênesis')).toHaveCount(1);
    const esquerda = paginasDaBiblia(page, 'Gênesis').first();
    const direita = paginaDoResumo(page, 'Gênesis');
    await expect(direita).toBeVisible();
    await expect(direita.getByRole('heading', { level: 3 }).first()).toBeVisible();
    await expect(page.getByText('Gênesis, página 1 de', { exact: false })).toBeVisible();
    const a = await caixa(esquerda);
    const b = await caixa(direita);
    expect(Math.abs(a.y - b.y), `y ${a.y} e ${b.y}`).toBeLessThanOrEqual(TOL);
    expect(Math.abs(a.height - b.height), `alturas ${a.height} e ${b.height}`).toBeLessThanOrEqual(TOL);
    expect(Math.abs(b.x - (a.x + a.width) - VAO), `vão ${b.x - (a.x + a.width)}`).toBeLessThanOrEqual(TOL);
    const linha = await page.evaluate(() => {
      let alvo: HTMLElement | null | undefined = document.querySelector<HTMLElement>(
        'main[aria-label="Leitura em formato livro"] article',
      );
      while (alvo && getComputedStyle(alvo).display !== 'grid') alvo = alvo.parentElement;
      if (!alvo) throw new Error('par de páginas não encontrado');
      const css = getComputedStyle(alvo, '::before');
      return { x: alvo.getBoundingClientRect().x + parseFloat(css.left), largura: parseFloat(css.width) };
    });
    expect(linha.largura).toBe(1);
    expect(Math.abs(linha.x + 0.5 - (a.x + a.width + b.x) / 2), `linha em ${linha.x}`).toBeLessThanOrEqual(TOL);

    // FUN-155: três vezes "seguinte": a Bíblia anda uma página por vez e o resumo fica.
    for (const n of [2, 3, 4]) {
      await seguinte(page).click();
      await expect(paginasDaBiblia(page, 'Gênesis')).toHaveAttribute('aria-label', `Página ${n} de Gênesis`);
      await expect(paginaDoResumo(page, 'Gênesis')).toBeVisible();
    }

    // FUN-156: desligar na página 4 mostra o par que a contém (páginas 3 e 4).
    await botaoResumo(page).click();
    await expect(paginaDoResumo(page, 'Gênesis')).toHaveCount(0);
    await expect(regiaoLivro(page).getByRole('article', { name: 'Página 3 de Gênesis' })).toBeVisible();
    await expect(regiaoLivro(page).getByRole('article', { name: 'Página 4 de Gênesis' })).toBeVisible();

    // FUN-157: ligado de novo, recarregar mantém o resumo ligado.
    await botaoResumo(page).click();
    await expect(paginaDoResumo(page, 'Gênesis')).toBeVisible();
    await page.reload();
    await esperarInicial(page);
    await lerBiblia(page);
    await expect(paginaDoResumo(page, 'Gênesis')).toBeVisible();
    await expect(botaoResumo(page)).toHaveAttribute('aria-pressed', 'true');
  });

  test('FUN-159 FUN-153: na capa com o resumo ligado o par de hoje, sem resumo e sem botão; "seguinte" abre Gênesis com o resumo', async ({
    page,
  }) => {
    await simularApi(page, { resumos: { [GENESIS]: { status: 200, corpo: resumoDe(GENESIS) } } });
    await abrirNoLivro(page, GENESIS, 1, { resumoLigado: true, semLeitura: true });
    await expect(regiaoLivro(page).getByRole('article', { name: 'Capa' })).toBeVisible();
    await expect(regiaoLivro(page).getByRole('article', { name: 'Plano de estudo' })).toBeVisible();
    await expect(page.getByRole('article', { name: /^Resumo de/ })).toHaveCount(0);
    await expect(botaoResumo(page)).toHaveCount(0);
    await seguinte(page).click();
    await expect(paginasDaBiblia(page, 'Gênesis')).toHaveCount(1);
    await expect(paginaDoResumo(page, 'Gênesis')).toBeVisible();
  });

  test('FUN-153: sem sessão e na rolagem não há botão "Resumo"', async ({ page }) => {
    await simularApi(page, { sessao: 401 });
    await abrirNoLivro(page, GENESIS, 1);
    await expect(paginasDaBiblia(page, 'Gênesis').first()).toBeVisible();
    await expect(botaoResumo(page)).toHaveCount(0);

    await page.unroute('**/api/**');
    await simularApi(page);
    await abrirNoLivro(page, GENESIS, 1, { formato: 'rolagem' });
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/^Gênesis 1\b/);
    await expect(botaoResumo(page)).toHaveCount(0);
  });
});

test.describe('resumo na tela estreita e estados em 390 × 844', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('FUN-160 FUN-161 FUN-162 FUN-163: alterna em Rute 2, mostra as quatro seções e volta à mesma página', async ({
    page,
  }) => {
    await simularApi(page, { resumos: { [RUTE]: { status: 200, corpo: resumoDe(RUTE) } } });
    await abrirNoLivro(page, RUTE, 2);
    const biblia = paginasDaBiblia(page, 'Rute');
    await expect(biblia).toHaveCount(1);
    const rotulo = await biblia.getAttribute('aria-label');

    await expect(botaoResumo(page)).toHaveAttribute('aria-pressed', 'false');
    await botaoResumo(page).click();
    await expect(botaoResumo(page)).toHaveAttribute('aria-pressed', 'true');
    // FUN-160: só o resumo, sem os botões da Bíblia.
    await expect(paginaDoResumo(page, 'Rute')).toBeVisible();
    await expect(biblia).toHaveCount(0);
    await expect(seguinte(page)).toHaveCount(0);
    // FUN-163: as quatro seções, na ordem.
    await expect(paginaDoResumo(page, 'Rute').locator('h3')).toHaveText([
      'Contexto',
      'Mensagem central',
      'Divisão do livro',
      'Versículos-chave',
    ]);

    // FUN-161, FUN-162: de novo, a mesma página de Rute 2 e o botão solto.
    await botaoResumo(page).click();
    await expect(botaoResumo(page)).toHaveAttribute('aria-pressed', 'false');
    await expect(paginaDoResumo(page, 'Rute')).toHaveCount(0);
    await expect(paginasDaBiblia(page, 'Rute')).toHaveAttribute('aria-label', rotulo ?? '');
  });

  test('FUN-163: Romanos publicado mostra o texto do resumo', async ({ page }) => {
    await simularApi(page, { resumos: { [ROMANOS]: { status: 200, corpo: resumoDe(ROMANOS) } } });
    await abrirNoLivro(page, ROMANOS, 1);
    await botaoResumo(page).click();
    await expect(paginaDoResumo(page, 'Romanos')).toContainText('Mensagem central de exemplo do livro 45.');
  });

  test('FUN-168: Êxodo sem resumo mostra a mensagem de sem resumo', async ({ page }) => {
    await simularApi(page);
    await abrirNoLivro(page, EXODO, 1);
    await botaoResumo(page).click();
    await expect(page.getByText('Este livro ainda não tem resumo.')).toBeVisible();
  });

  test('FUN-167: Marcos com falha mostra a mensagem e "Tentar de novo" busca outra vez', async ({ page }) => {
    const api = await simularApi(page, { resumos: { [MARCOS]: { status: 500 } } });
    await abrirNoLivro(page, MARCOS, 1);
    await botaoResumo(page).click();
    await expect(
      page.getByText('Não foi possível carregar o resumo. Confira a internet e tente de novo.'),
    ).toBeVisible();
    api.resumos[MARCOS] = { status: 200, corpo: resumoDe(MARCOS) };
    await page.getByRole('button', { name: 'Tentar de novo' }).click();
    await expect(paginaDoResumo(page, 'Marcos')).toContainText('Mensagem central de exemplo do livro 41.');
  });

  test('FUN-166: resposta lenta mostra "Carregando o resumo…" até chegar', async ({ page }) => {
    const api = await simularApi(page, {
      resumos: { [ROMANOS]: { status: 200, corpo: resumoDe(ROMANOS) } },
      segurar: true,
    });
    await abrirNoLivro(page, ROMANOS, 1);
    await botaoResumo(page).click();
    await expect(page.getByRole('status', { name: 'Carregando o resumo…' })).toBeVisible();
    api.liberar();
    await expect(paginaDoResumo(page, 'Romanos')).toContainText('Mensagem central de exemplo do livro 45.');
    await expect(page.getByRole('status', { name: 'Carregando o resumo…' })).toHaveCount(0);
  });

  test('FUN-169: resumo longo tem "1 de 2" e "seguinte" não muda a página da Bíblia', async ({ page }) => {
    await simularApi(page, { resumos: { [RUTE]: { status: 200, corpo: resumoDe(RUTE, TEXTO_LONGO) } } });
    await abrirNoLivro(page, RUTE, 2);
    const rotulo = await paginasDaBiblia(page, 'Rute').getAttribute('aria-label');
    await botaoResumo(page).click();
    await expect(paginaDoResumo(page, 'Rute')).toBeVisible();
    await expect(page.getByText(/^1 de \d+$/)).toBeVisible();
    await page.getByRole('button', { name: 'Página seguinte do resumo' }).click();
    await expect(page.getByText(/^2 de \d+$/)).toBeVisible();
    await botaoResumo(page).click();
    await expect(paginasDaBiblia(page, 'Rute')).toHaveAttribute('aria-label', rotulo ?? '');
  });
});
