import { expect, test } from '@playwright/test';
import { abrirPelaEscolha, esperarCapitulo } from '../e2e/apoio/navegar';

// J-03 / FUN-41 no ambiente publicado: o `e2e/offline.spec.ts` confere o host fixo `127.0.0.1` (build local); aqui o único
// host contatado tem de ser o do próprio staging, e nenhum cookie pode existir.
test('FUN-41 (staging): navegando por 5 capítulos, nenhuma requisição sai do domínio do app e não há cookies', async ({
  page,
  context,
  baseURL,
}) => {
  const hosts = new Set<string>();
  page.on('request', (pedido) => {
    const url = new URL(pedido.url());
    if (url.protocol.startsWith('http')) hosts.add(url.hostname);
  });

  await page.goto('/');
  await abrirPelaEscolha(page, 'Mateus', 1);
  for (let capitulo = 2; capitulo <= 5; capitulo += 1) {
    await page.getByRole('button', { name: `Capítulo seguinte: Mateus ${capitulo}` }).click();
    await esperarCapitulo(page, 'Mateus', capitulo);
  }

  expect([...hosts]).toEqual([new URL(baseURL ?? '').hostname]);
  expect(await context.cookies()).toEqual([]);
});
