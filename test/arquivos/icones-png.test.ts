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
  return {
    largura,
    altura,
    pixel: [r, g, b, a],
    pixelEm: (x: number, y: number) => pixelEm(cru, largura, canais, x, y),
  };
}

/** Desfaz os filtros de linha do PNG (8 bits, sem entrelaçamento) e devolve [r, g, b, a] em (x, y). */
function pixelEm(cru: Buffer, largura: number, canais: number, x: number, y: number) {
  const linha = largura * canais;
  let anterior = Buffer.alloc(linha);
  let atual = Buffer.alloc(linha);
  for (let j = 0; j <= y; j++) {
    const inicio = j * (linha + 1);
    const filtro = cru[inicio]!;
    atual = Buffer.alloc(linha);
    for (let i = 0; i < linha; i++) {
      const dado = cru[inicio + 1 + i]!;
      const esquerda = i >= canais ? atual[i - canais]! : 0;
      const acima = anterior[i]!;
      const acimaEsquerda = i >= canais ? anterior[i - canais]! : 0;
      let valor = dado;
      if (filtro === 1) valor = dado + esquerda;
      else if (filtro === 2) valor = dado + acima;
      else if (filtro === 3) valor = dado + Math.floor((esquerda + acima) / 2);
      else if (filtro === 4) {
        const p = esquerda + acima - acimaEsquerda;
        const pa = Math.abs(p - esquerda);
        const pb = Math.abs(p - acima);
        const pc = Math.abs(p - acimaEsquerda);
        valor = dado + (pa <= pb && pa <= pc ? esquerda : pb <= pc ? acima : acimaEsquerda);
      }
      atual[i] = valor & 255;
    }
    if (j < y) anterior = atual;
  }
  const base = x * canais;
  return [atual[base]!, atual[base + 1]!, atual[base + 2]!, canais === 4 ? atual[base + 3]! : 255];
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

  // O desenho 2a (icone.svg): página esquerda do livro, branca, no ponto (190, 260) de 512 (o maskable a desenha a 88%).
  it.each([
    ['icone-192.png', 192, 1],
    ['icone-512.png', 512, 1],
    ['icone-maskable-512.png', 512, 0.88],
  ])('FUN-93: %s traz a página clara do desenho 2a, não só o fundo vinho', (nome, lado, escala) => {
    const f = (v: number) => Math.round(lado / 2 + (v - 256) * escala * (lado / 512));
    const [r, g, b] = png(ler(nome)).pixelEm(f(190), f(260));
    expect([r, g, b]).toEqual([255, 255, 255]);
  });
});
