import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { lerToken } from '../../scripts/lerToken.mjs';

const ESTILO = new URL('./', import.meta.url);
const SRC = new URL('../', import.meta.url);

function ler(nome: string): string {
  return readFileSync(new URL(nome, ESTILO), 'utf8');
}

const tokens = ler('tokens.css');

/** Corpo (entre chaves) do primeiro bloco cujo seletor é `seletor`, a partir de `inicio`. */
function bloco(css: string, seletor: string, inicio = 0): string {
  const semComentarios = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const posicao = semComentarios.indexOf(`${seletor} {`, inicio);
  if (posicao < 0) throw new Error(`bloco ${seletor} não encontrado`);
  const abre = semComentarios.indexOf('{', posicao);
  const fecha = semComentarios.indexOf('}', abre);
  return semComentarios.slice(abre + 1, fecha);
}

/** Corpo do bloco `@media (prefers-color-scheme: dark)` (com os blocos de dentro). */
function blocoMediaEscuro(css: string): string {
  const semComentarios = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const posicao = semComentarios.indexOf('@media (prefers-color-scheme: dark)');
  if (posicao < 0) throw new Error('@media (prefers-color-scheme: dark) não encontrado');
  const abre = semComentarios.indexOf('{', posicao);
  let profundidade = 0;
  for (let i = abre; i < semComentarios.length; i += 1) {
    if (semComentarios[i] === '{') profundidade += 1;
    if (semComentarios[i] === '}') profundidade -= 1;
    if (profundidade === 0) return semComentarios.slice(abre + 1, i);
  }
  throw new Error('@media sem fechamento');
}

function luminancia(hex: string): number {
  const valor = hex.replace('#', '');
  const canais = [0, 2, 4].map((i) => Number.parseInt(valor.slice(i, i + 2), 16) / 255);
  const [r, g, b] = canais.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)) as [
    number,
    number,
    number,
  ];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contraste(a: string, b: string): number {
  const [maior, menor] = [luminancia(a), luminancia(b)].sort((x, y) => y - x) as [number, number];
  return (maior + 0.05) / (menor + 0.05);
}

function arquivosCss(pasta: URL): string[] {
  return (readdirSync(pasta, { recursive: true }) as string[])
    .map((nome) => nome.replaceAll('\\', '/'))
    .filter((nome) => nome.endsWith('.css'));
}

describe('tokens.css', () => {
  it('é a cópia do mockup aprovado, byte a byte', () => {
    const app = readFileSync(new URL('tokens.css', ESTILO));
    const mockup = readFileSync(new URL('../../.specs/mockup/tokens.css', import.meta.url));
    expect(app.equals(mockup)).toBe(true);
  });

  it('declara a cor de fundo do tema claro', () => {
    expect(lerToken(tokens, '--cor-fundo')).toBe('#FFFFFF');
  });

  it.each([
    '--altura-barra',
    '--largura-barra',
    '--largura-cartao-inicial',
    '--veu-imagem',
    '--veu-imagem-celular',
    '--largura-pagina',
    '--respiro-pagina',
    '--respiro-pagina-celular',
    '--sombra-pagina',
    '--sombra-lombada',
    '--sombra-lombada-direita',
    '--texto-titulo-livro',
    '--texto-numero-capitulo',
    '--cor-capa',
    '--cor-capa-texto',
    '--texto-capa',
    '--quebra-barra-compacta',
    '--quebra-livro-duplo',
  ])('FUN-59 e FUN-73: o token novo %s existe', (nome) => {
    expect(lerToken(tokens, nome)).toBeTruthy();
  });

  it('FUN-59: a capa usa o acento e o texto do acento (contraste já conferido)', () => {
    expect(lerToken(tokens, '--cor-capa')).toBe('var(--cor-acento)');
    expect(lerToken(tokens, '--cor-capa-texto')).toBe('var(--cor-acento-texto)');
  });

  it('FUN-73: a quebra do livro em duas páginas é 900px', () => {
    expect(lerToken(tokens, '--quebra-livro-duplo')).toBe('900px');
  });
});

describe('contraste do texto (FUN-32)', () => {
  const temas: [string, () => string][] = [
    ['claro (padrão)', () => bloco(tokens, ':root')],
    ['claro', () => bloco(tokens, ':root[data-tema="claro"]')],
    ['escuro', () => bloco(tokens, ':root[data-tema="escuro"]')],
    ['sépia', () => bloco(tokens, ':root[data-tema="sepia"]')],
    ['escuro do sistema', () => bloco(blocoMediaEscuro(tokens), ':root:not([data-tema])')],
  ];

  it.each(temas)('FUN-32: no tema %s, texto sobre o fundo tem pelo menos 4,5:1', (_tema, corpo) => {
    const css = corpo();
    expect(contraste(lerToken(css, '--cor-texto'), lerToken(css, '--cor-fundo'))).toBeGreaterThanOrEqual(4.5);
  });

  it.each(temas)('FUN-32: no tema %s, texto sobre a superfície tem pelo menos 4,5:1', (_tema, corpo) => {
    const css = corpo();
    expect(contraste(lerToken(css, '--cor-texto'), lerToken(css, '--cor-superficie'))).toBeGreaterThanOrEqual(4.5);
  });

  it.each(temas)(
    'FUN-59: no tema %s, o texto suave sobre a superfície do cartão tem pelo menos 4,5:1',
    (_tema, corpo) => {
      const css = corpo();
      expect(contraste(lerToken(css, '--cor-suave'), lerToken(css, '--cor-superficie'))).toBeGreaterThanOrEqual(4.5);
    },
  );

  it('a conta de contraste reconhece um par ruim (cinza claro sobre branco)', () => {
    expect(contraste('#CCCCCC', '#FFFFFF')).toBeLessThan(4.5);
    expect(contraste('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
  });
});

describe('tema do sistema (FUN-29)', () => {
  it('FUN-29: o @media (prefers-color-scheme: dark) só vale para :root:not([data-tema])', () => {
    const corpo = blocoMediaEscuro(tokens);
    const seletores = [...corpo.matchAll(/([^{}]+)\{/g)].map((m) => (m[1] ?? '').trim());
    expect(seletores).toEqual([':root:not([data-tema])']);
  });

  it('FUN-29: o bloco do sistema escuro troca a cor de fundo e o color-scheme', () => {
    const corpo = bloco(blocoMediaEscuro(tokens), ':root:not([data-tema])');
    expect(lerToken(corpo, '--cor-fundo')).toBe('#1B1A1F');
    expect(lerToken(corpo, 'color-scheme')).toBe('dark');
  });

  it('FUN-29: só o tokens.css consulta prefers-color-scheme', () => {
    const outros = arquivosCss(SRC).filter((nome) => nome !== 'estilo/tokens.css');
    for (const nome of outros) {
      expect(readFileSync(new URL(nome, SRC), 'utf8'), nome).not.toContain('prefers-color-scheme');
    }
  });
});

describe('fontes do próprio site (FUN-41)', () => {
  const fontes = ler('fontes.css');
  const urls = [...fontes.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)].map((m) => m[1] ?? '');

  it('FUN-41: nenhum CSS em src/ cita http:// ou https://', () => {
    const todos = arquivosCss(SRC);
    expect(todos).toContain('estilo/fontes.css');
    for (const nome of todos) {
      expect(readFileSync(new URL(nome, SRC), 'utf8'), nome).not.toMatch(/https?:\/\//i);
    }
  });

  it('FUN-41: nenhum CSS em src/ usa @import', () => {
    for (const nome of arquivosCss(SRC)) {
      expect(readFileSync(new URL(nome, SRC), 'utf8'), nome).not.toMatch(/@import/);
    }
  });

  it('FUN-41: cada @font-face aponta para um .woff2 em src/estilo/fontes/ que existe', () => {
    expect(urls).toHaveLength(4);
    for (const url of urls) {
      expect(url).toMatch(/^\.\/fontes\/[a-z0-9-]+\.woff2$/);
      expect(existsSync(new URL(url, ESTILO)), url).toBe(true);
    }
  });

  it('declara Atkinson Hyperlegible 400, 400 itálico e 700 e Fraunces 600', () => {
    const faces = [...fontes.matchAll(/@font-face\s*\{([^}]*)\}/g)].map((m) => {
      const corpo = m[1] ?? '';
      const familia = /font-family:\s*['"]([^'"]+)['"]/.exec(corpo)?.[1];
      const estilo = /font-style:\s*(\w+)/.exec(corpo)?.[1];
      const peso = /font-weight:\s*(\d+)/.exec(corpo)?.[1];
      return `${familia} ${peso} ${estilo}`;
    });
    expect(faces.sort()).toEqual(
      [
        'Atkinson Hyperlegible 400 italic',
        'Atkinson Hyperlegible 400 normal',
        'Atkinson Hyperlegible 700 normal',
        'Fraunces 600 normal',
      ].sort(),
    );
  });

  it('a licença OFL acompanha as fontes', () => {
    expect(existsSync(new URL('fontes/LICENSE-OFL.txt', ESTILO))).toBe(true);
  });

  it('as famílias de fonte do tokens.css são as declaradas no fontes.css', () => {
    expect(lerToken(tokens, '--fonte-texto')).toMatch(/^"Atkinson Hyperlegible"/);
    expect(lerToken(tokens, '--fonte-titulo')).toMatch(/^"Fraunces"/);
  });
});

describe('global.css', () => {
  const css = ler('global.css');

  it('traz a base do guia: foco visível, reset de botão e caixa', () => {
    expect(bloco(css, ':focus-visible')).toContain('outline: var(--largura-foco) solid var(--cor-acento)');
    expect(bloco(css, 'button')).toContain('background: none');
    expect(css).toContain('box-sizing: border-box');
  });

  it('não usa cor literal: só var(--...)', () => {
    expect(css).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });
});

describe('foto da página inicial (FUN-58)', () => {
  const foto = new URL('imagens/inicial.webp', ESTILO);

  it('FUN-58: o pré-cache do app inclui webp', () => {
    const config = readFileSync(new URL('../../vite.config.ts', import.meta.url), 'utf8');
    expect(config).toMatch(/globPatterns:[^\]]*\bwebp\b/);
  });

  it('FUN-58: inicial.webp existe, é WebP e tem de 4 KiB a 2 MiB (não vira data: e cabe no pré-cache)', () => {
    expect(existsSync(foto)).toBe(true);
    const bytes = readFileSync(foto);
    expect(bytes.subarray(0, 4).toString('ascii')).toBe('RIFF');
    expect(bytes.subarray(8, 12).toString('ascii')).toBe('WEBP');
    const tamanho = statSync(foto).size;
    expect(tamanho).toBeGreaterThan(4 * 1024);
    expect(tamanho).toBeLessThan(2 * 1024 * 1024);
  });
});
