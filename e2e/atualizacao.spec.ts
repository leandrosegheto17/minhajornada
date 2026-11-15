import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { servirPasta } from './apoio/servidor';

/**
 * Atualização do app (FUN-37). Estados cobertos: SW antigo ativo e página aberta; SW novo instalado e ativo (assume a
 * página sem recarregá-la); abertura seguinte com a versão nova; duas abas abertas (nenhuma recarrega).
 * Dois builds com versões diferentes, servidos no mesmo endereço por um servidor próprio, que troca a pasta.
 */
const RAIZ = process.cwd();
const PASTA_A = join(RAIZ, 'dist-e2e', 'a');
const PASTA_B = join(RAIZ, 'dist-e2e', 'b');
const PORTA = 4199;
const servidor = servirPasta(PASTA_A, PORTA);

test.describe.configure({ mode: 'serial', timeout: 180_000 });

test.beforeAll(async () => {
  for (const [versao, pasta] of [
    ['A', PASTA_A],
    ['B', PASTA_B],
  ] as const) {
    execSync(`pnpm exec vite build --outDir "${pasta}" --emptyOutDir`, {
      cwd: RAIZ,
      env: { ...process.env, VERSAO_APP: `e2e-${versao}` },
      stdio: 'ignore',
    });
  }
  await servidor.iniciar();
});

test.afterAll(async () => {
  await servidor.parar();
});

const versaoDaPagina = (page: Page) =>
  page.locator('meta[name="versao-app"]').getAttribute('content', { timeout: 10_000 });

async function esperarControlada(page: Page) {
  await page.waitForFunction(async () => {
    await navigator.serviceWorker.ready;
    return navigator.serviceWorker.controller !== null;
  });
}

test('FUN-37: com o build B publicado, a página aberta não recarrega e a abertura seguinte usa o B', async ({
  context,
}) => {
  servidor.trocarPasta(PASTA_A);
  const pagina = await context.newPage();
  const outraAba = await context.newPage();
  await pagina.goto(servidor.url);
  await outraAba.goto(servidor.url);
  await esperarControlada(pagina);
  await esperarControlada(outraAba);
  expect(await versaoDaPagina(pagina)).toBe('e2e-A');

  // Marca as duas abas: se recarregarem, a marca some.
  for (const aba of [pagina, outraAba]) await aba.evaluate(() => ((window as unknown as { marca: number }).marca = 1));

  servidor.trocarPasta(PASTA_B);
  const scriptAntes = await pagina.evaluate(() => navigator.serviceWorker.controller?.scriptURL ?? '');
  await pagina.evaluate(async () => {
    const trocou = new Promise<void>((ok) => navigator.serviceWorker.addEventListener('controllerchange', () => ok()));
    const registro = await navigator.serviceWorker.ready;
    await registro.update();
    await trocou;
  });

  // O SW novo assumiu sem ação do leitor, e nenhuma aba recarregou.
  for (const aba of [pagina, outraAba]) {
    expect(await aba.evaluate(() => (window as unknown as { marca?: number }).marca)).toBe(1);
    expect(await versaoDaPagina(aba)).toBe('e2e-A');
  }
  expect(scriptAntes).not.toBe('');

  // Abertura seguinte: a versão é a do B.
  await pagina.reload();
  expect(await versaoDaPagina(pagina)).toBe('e2e-B');
});
