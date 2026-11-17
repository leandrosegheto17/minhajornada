import { devices, expect, test } from '@playwright/test';

// J-05 no ambiente publicado, num iPhone emulado (agente de usuário e toque do Safari do iPhone, sobre o Chromium):
// o convite aparece uma vez e não volta depois de dispensado, e o Sobre traz o crédito, o itálico e a privacidade.
// Fica de fora (não automatizável): instalar de verdade pela tela inicial e abrir em tela cheia no Safari real.
const { userAgent, viewport, deviceScaleFactor, isMobile, hasTouch } = devices['iPhone 14'];

test.use({ userAgent, viewport, deviceScaleFactor, isMobile, hasTouch });

test('FUN-46/FUN-47/FUN-37 a FUN-40 (staging): o convite aparece, é dispensado e não volta; o Sobre traz o crédito, o itálico e a privacidade', async ({
  page,
}) => {
  await page.goto('/');
  const convite = page.getByRole('region', { name: 'Instalar o app' });
  await expect(convite).toBeVisible();
  await expect(convite).toContainText('Toque em Compartilhar e depois em Adicionar à Tela de Início');

  await page.getByRole('button', { name: 'Dispensar convite' }).click();
  await expect(convite).toHaveCount(0);

  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Escolha o livro' })).toBeVisible();
  await expect(convite).toHaveCount(0);

  await page.getByRole('button', { name: 'Sobre o MinhaJornada' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Sobre o MinhaJornada' })).toBeVisible();
  await expect(page.getByText('Bíblia Livre (BLIVRE)')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'O itálico' })).toBeVisible();
  await expect(page.getByText(/acrescentadas pelos tradutores/)).toBeVisible();
  await expect(page.getByRole('heading', { name: /rivacidade/ })).toBeVisible();
});
