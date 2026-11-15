import { expect, test } from '@playwright/test';

test('o app abre no build e mostra o nome', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'MinhaJornada' })).toBeVisible();
});

test('o service worker do build é servido', async ({ request }) => {
  const resposta = await request.get('/sw.js');
  expect(resposta.status()).toBe(200);
});
