import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { inflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';

/** Ícones PNG do app (FUN-93), gerados por `scripts/gerar-icones.mjs`. */
const ler = (nome: string) => readFileSync(join(process.cwd(), 'public', 'icones', nome));

/** Largura, altura (cabeçalho IHDR) e o primeiro pixel (canto superior esquerdo) como [r, g, b, a]. */
function png(corpo: Buffer) {
  expect(corpo.subarray(1, 4).toString('ascii')).toBe('PNG');
  const largura = corpo.readUInt32BE(16);
  const altura = corpo.readUInt32BE(20);
  const tipo = corpo[25]; // 2 = RGB, 6 = RGBA (8 bits)
  const idat: Buffer[] = [];
  for (let i = 8; i < corpo.length;) {
    const tamanho = corpo.readUInt32BE(i);
    if (corpo.subarray(i + 4, i + 8).toString('ascii') === 'IDAT') idat.push(corpo.subarray(i + 8, i + 8 + tamanho));
    i += 12 + tamanho;
  }
  const cru = inflateSync(Buffer.concat(idat));
  // Primeira linha: sem pixel à esquerda nem acima, o primeiro pixel é o dado cru, qualquer que seja o filtro.
  const canais = tipo === 6 ? 4 : 3;
  const [r, g, b, a] = [cru[1]!, cru[2]!, cru[3]!, canais === 4 ? cru[4]! : 255];
  return { largura, altura, pixel: [r, g, b, a] };
}

describe('ícones PNG (FUN-93)', () => {
  it.each([
    ['icone-192.png', 192],
    ['icone-512.png', 512],
    ['icone-maskable-512.png', 512],
  ])('FUN-93: %s tem %i × %i', (nome, lado) => {
    const { largura, altura } = png(ler(nome));
    expect([largura, altura]).toEqual([lado, lado]);
  });

  it('FUN-93: o maskable é vinho até o canto, sem transparência', () => {
    expect(png(ler('icone-maskable-512.png')).pixel).toEqual([0x9a, 0x3b, 0x5b, 255]);
  });

  it('FUN-93: o ícone comum mantém o canto arredondado (transparente)', () => {
    expect(png(ler('icone-512.png')).pixel[3]).toBe(0);
  });
});
