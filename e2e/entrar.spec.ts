import { expect, test, type Page } from '@playwright/test';
import { esperarInicial, lerBiblia } from './apoio/navegar';

// Independent Test "Entrar e sair como dono" (FUN-137, FUN-138, FUN-139, FUN-142, FUN-143) com a API simulada por
// `page.route`. O service worker fica bloqueado: este teste não é do SW, e ele poderia esconder as chamadas da rota.
test.use({ serviceWorkers: 'block' });

const SENHA_CERTA = 'senha-de-exemplo';

/** API simulada: a sessão existe depois de um login certo, sobrevive a recarregar e acaba no "sair". */
async function simularApi(page: Page): Promise<{ chamadas: string[] }> {
  let comSessao = false;
  const chamadas: string[] = [];
  await page.route('**/api/**', async (rota) => {
    const requisicao = rota.request();
    const caminho = new URL(requisicao.url()).pathname;
    chamadas.push(`${requisicao.method()} ${caminho}`);
    if (caminho === '/api/sessao') {
      return comSessao
        ? rota.fulfill({ status: 200, json: { dono: true } })
        : rota.fulfill({ status: 401, json: { erro: 'sem_sessao' } });
    }
    if (caminho === '/api/entrar') {
      const corpo = requisicao.postDataJSON() as { email?: string; senha?: string };
      if (corpo.senha === SENHA_CERTA) {
        comSessao = true;
        return rota.fulfill({ status: 200, json: { dono: true } });
      }
      return rota.fulfill({ status: 401, json: { erro: 'credenciais' } });
    }
    if (caminho === '/api/sair') {
      comSessao = false;
      return rota.fulfill({ status: 204 });
    }
    return rota.fulfill({ status: 404, json: { erro: 'nao_encontrado' } });
  });
  return { chamadas };
}

const botaoEntrarDaBarra = (page: Page) => page.getByRole('button', { name: 'Entrar ou criar conta' });
const botaoSair = (page: Page) => page.getByRole('button', { name: 'Sair', exact: true });

for (const { nome, viewport } of [
  { nome: '1280 × 800', viewport: { width: 1280, height: 800 } },
  { nome: '390 × 844', viewport: { width: 390, height: 844 } },
]) {
  test.describe(`entrar e sair como dono em ${nome}`, () => {
    test.use({ viewport });

    test('FUN-137 FUN-139 FUN-138 FUN-142 FUN-143: abre Entrar pela barra, recusa a senha errada, entra, continua entrado ao recarregar e sai', async ({
      page,
    }) => {
      const { chamadas } = await simularApi(page);
      await page.goto('/');
      await esperarInicial(page);

      // FUN-137: a barra abre "Entrar", não a tela "em breve".
      await botaoEntrarDaBarra(page).click();
      await expect(page.getByRole('heading', { level: 1, name: 'Entrar' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Conta e plano de estudo: em breve' })).toHaveCount(0);

      // FUN-139: senha errada, mensagem única e continua na tela.
      await page.getByLabel('E-mail').fill('dono@exemplo.com');
      await page.getByLabel('Senha').fill('senha-errada');
      await page.getByRole('button', { name: 'Entrar', exact: true }).click();
      await expect(page.getByRole('alert')).toHaveText('E-mail ou senha incorretos.');
      await expect(page.getByRole('heading', { level: 1, name: 'Entrar' })).toBeVisible();
      await expect(botaoEntrarDaBarra(page)).toBeVisible();

      // FUN-138: senha certa volta à tela de origem (a inicial) e a barra mostra "Sair" (FUN-142).
      await page.getByLabel('Senha').fill(SENHA_CERTA);
      await page.getByRole('button', { name: 'Entrar', exact: true }).click();
      await esperarInicial(page);
      await expect(botaoSair(page)).toBeVisible();
      await expect(botaoEntrarDaBarra(page)).toHaveCount(0);

      // FUN-142: recarregar mantém a sessão.
      await page.reload();
      await esperarInicial(page);
      await expect(botaoSair(page)).toBeVisible();

      // FUN-143: "Sair" apaga a sessão e a barra volta a "Entrar / Criar conta", também depois de recarregar.
      await botaoSair(page).click();
      await expect(botaoEntrarDaBarra(page)).toBeVisible();
      await expect(botaoSair(page)).toHaveCount(0);
      await expect.poll(() => chamadas).toContain('POST /api/sair');
      await page.reload();
      await esperarInicial(page);
      await expect(botaoEntrarDaBarra(page)).toBeVisible();
    });

    test('FUN-138: aberto a partir da escolha de livros, o login volta a ela', async ({ page }) => {
      await simularApi(page);
      await page.goto('/');
      await esperarInicial(page);
      await lerBiblia(page);
      await expect(page.getByRole('heading', { level: 1, name: 'Escolha o livro' })).toBeVisible();
      await botaoEntrarDaBarra(page).click();
      await page.getByLabel('E-mail').fill('dono@exemplo.com');
      await page.getByLabel('Senha').fill(SENHA_CERTA);
      await page.getByRole('button', { name: 'Entrar', exact: true }).click();
      await expect(page.getByRole('heading', { level: 1, name: 'Escolha o livro' })).toBeVisible();
      await expect(botaoSair(page)).toBeVisible();
    });
  });
}
