// Gera os PNGs do app (FUN-93) a partir de `public/icones/icone.svg`, rasterizando com o Chromium do Playwright.
// Uso: `node scripts/gerar-icones.mjs` (os PNGs gerados ficam versionados em `public/icones/`).
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

const pasta = join(import.meta.dirname, '..', 'public', 'icones');
const svg = readFileSync(join(pasta, 'icone.svg'), 'utf8');
const VINHO = '#9A3B5B';

/** Ícone comum: o SVG como está (cantos arredondados transparentes). */
const comum = (tamanho) =>
  `<body style="margin:0;background:transparent">${svg.replace('<svg ', `<svg width="${tamanho}" height="${tamanho}" `)}</body>`;

/**
 * Ícone maskable: fundo vinho sangrado até a borda (sem cantos) e o desenho a 88%, dentro da zona segura (círculo de
 * 80% do centro) para o sistema poder recortar em qualquer forma.
 */
const maskable = (tamanho) => {
  const quadrado = svg
    .replace('rx="112"', 'rx="0"')
    .replace('<svg ', `<svg width="${tamanho * 0.88}" height="${tamanho * 0.88}" `);
  return `<body style="margin:0;background:${VINHO};width:${tamanho}px;height:${tamanho}px;display:flex;align-items:center;justify-content:center">${quadrado}</body>`;
};

const saidas = [
  ['icone-192.png', 192, comum],
  ['icone-512.png', 512, comum],
  ['icone-maskable-512.png', 512, maskable],
];

const navegador = await chromium.launch();
try {
  for (const [arquivo, tamanho, html] of saidas) {
    const pagina = await navegador.newPage({ viewport: { width: tamanho, height: tamanho } });
    await pagina.setContent(html(tamanho));
    writeFileSync(join(pasta, arquivo), await pagina.screenshot({ omitBackground: true }));
    await pagina.close();
    console.log(`gerado ${arquivo} (${tamanho} x ${tamanho})`);
  }
} finally {
  await navegador.close();
}
