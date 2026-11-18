import { expect, test } from '@playwright/test';

// Ajuste do teste do esqueleto (T31, aprovado pelo usuário em 2026-11-15): o app abre na escolha de livro, com o
// nome na marca da barra, em vez do título "MinhaJornada" do esqueleto. T23 (FUN-51): agora abre na página inicial.
test('o app abre no build e mostra o nome', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('MinhaJornada', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: 'A Palavra perto de você, onde estiver' })).toBeVisible();
});

test('o service worker do build é servido', async ({ request }) => {
  const resposta = await request.get('/sw.js');
  expect(resposta.status()).toBe(200);
});
