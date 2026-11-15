import { expect, test } from '@playwright/test';

interface IconeManifesto {
  src: string;
  sizes: string;
  type: string;
  purpose?: string;
}

/** Largura e altura de um PNG, lidas do cabeçalho IHDR (bytes 16 a 23). */
function tamanhoPng(corpo: Buffer): { largura: number; altura: number } {
  expect(corpo.subarray(1, 4).toString('ascii')).toBe('PNG');
  return { largura: corpo.readUInt32BE(16), altura: corpo.readUInt32BE(20) };
}

test.describe('manifesto e ícones (FUN-45)', () => {
  test('FUN-45: o manifesto servido tem o nome, standalone e os ícones 192 e 512, cada um com o tamanho declarado', async ({
    page,
    request,
  }) => {
    await page.goto('/');
    const href = await page.locator('link[rel="manifest"]').getAttribute('href');
    expect(href).toBeTruthy();

    const resposta = await request.get(new URL(href!, page.url()).href);
    expect(resposta.status()).toBe(200);
    const manifesto = (await resposta.json()) as {
      name: string;
      short_name: string;
      display: string;
      start_url: string;
      scope: string;
      icons: IconeManifesto[];
    };

    expect(manifesto.name).toBe('MinhaJornada');
    expect(manifesto.short_name).toBe('MinhaJornada');
    expect(manifesto.display).toBe('standalone');
    expect(manifesto.start_url).toBe('/');
    expect(manifesto.scope).toBe('/');

    const tamanhos = manifesto.icons.map((i) => i.sizes);
    expect(tamanhos).toContain('192x192');
    expect(tamanhos).toContain('512x512');
    expect(manifesto.icons.some((i) => i.purpose === 'maskable')).toBe(true);

    for (const icone of manifesto.icons) {
      const arquivo = await request.get(new URL(icone.src, page.url()).href);
      expect(arquivo.status(), icone.src).toBe(200);
      expect(arquivo.headers()['content-type'], icone.src).toContain('image/png');
      const [largura, altura] = icone.sizes.split('x').map(Number);
      expect(tamanhoPng(await arquivo.body()), icone.src).toEqual({ largura, altura });
    }
  });

  test('FUN-45: o manifesto e os ícones vêm do próprio site', async ({ page }) => {
    await page.goto('/');
    const href = await page.locator('link[rel="manifest"]').getAttribute('href');
    expect(new URL(href!, page.url()).origin).toBe(new URL(page.url()).origin);
  });
});
