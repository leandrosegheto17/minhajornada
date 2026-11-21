import { describe, expect, it } from 'vitest';
import type { Livro } from '../biblia/tipos.ts';
import type { Resumo } from './formato.ts';
import { contarPalavras, problemasDoResumo } from './validar.ts';

/** Bíblia de exemplo: Gênesis com 3 capítulos (4, 3 e 5 versículos) e Rute com 1 capítulo de 2. Só texto de exemplo (FUN-152). */
const versiculos = (n: number) => Array.from({ length: n }, (_, i) => `versículo ${i + 1}`);
const BIBLIA: Livro[] = [
  { numero: 1, nome: 'Gênesis', capitulos: [versiculos(4), versiculos(3), versiculos(5)] },
  { numero: 8, nome: 'Rute', capitulos: [versiculos(2)] },
];

const palavras = (n: number) => Array.from({ length: n }, (_, i) => `palavra${i}`).join(' ');

/** Resumo de exemplo com exatamente `total` palavras: 2 do título da divisão, 3 da frase, 5 da mensagem e o resto no contexto. */
function resumoCom(total: number, sobre: Partial<Resumo> = {}): Resumo {
  return {
    livro: 1,
    contexto: palavras(total - 10),
    mensagem: 'uma mensagem central de exemplo',
    divisao: [{ titulo: 'Parte um', de: 1, ate: 2 }],
    versiculos: [{ capitulo: 1, versiculo: 2, ate: 3, frase: 'frase de exemplo' }],
    ...sobre,
  };
}

const problemas = (r: Resumo) => problemasDoResumo(r, BIBLIA);

describe('contarPalavras (FUN-174: contexto + mensagem + títulos da divisão + frases)', () => {
  it('o resumo de exemplo tem exatamente a contagem pedida', () => {
    expect(contarPalavras(resumoCom(300))).toBe(300);
    expect(contarPalavras(resumoCom(450))).toBe(450);
  });

  it('títulos de seção e referências não contam: mudar capítulo, versículo e intervalo não muda a contagem', () => {
    const a = resumoCom(320);
    const b = resumoCom(320, {
      divisao: [{ titulo: 'Parte um', de: 1, ate: 3 }],
      versiculos: [{ capitulo: 3, versiculo: 5, frase: 'frase de exemplo' }],
    });
    expect(contarPalavras(a)).toBe(contarPalavras(b));
  });

  it('os títulos da divisão e as frases dos versículos contam', () => {
    const base = resumoCom(320);
    const maisTitulo = { ...base, divisao: [{ titulo: 'Parte um e mais três', de: 1, ate: 2 }] };
    const maisFrase = { ...base, versiculos: [{ capitulo: 1, versiculo: 2, frase: 'frase de exemplo mais duas' }] };
    expect(contarPalavras(maisTitulo)).toBe(320 + 3);
    expect(contarPalavras(maisFrase)).toBe(320 + 2);
  });

  it.each([
    ['guarda-chuva', 1],
    ["d'água", 1],
    ['d’água', 1],
    ['e-mail do pai', 3],
    ['um - dois', 2],
    ['  espaços   demais  ', 2],
    ['300 anos', 2],
    ['vírgula, ponto. fim!', 3],
    ['', 0],
  ])('palavra = letras ou dígitos, com hífen e apóstrofo internos: "%s" = %i', (texto, n) => {
    expect(contarPalavras(resumoCom(300, { contexto: texto, mensagem: '', divisao: [], versiculos: [] }))).toBe(n);
  });
});

describe('problemasDoResumo: quantidade de palavras (FUN-174)', () => {
  it('FUN-174: 299 palavras recusa e diz a contagem', () => {
    expect(problemas(resumoCom(299))).toEqual([expect.stringContaining('299')]);
  });

  it('FUN-174: 300 passa', () => {
    expect(problemas(resumoCom(300))).toEqual([]);
  });

  it('FUN-174: 450 passa', () => {
    expect(problemas(resumoCom(450))).toEqual([]);
  });

  it('FUN-174: 451 recusa e diz a contagem', () => {
    expect(problemas(resumoCom(451))).toEqual([expect.stringContaining('451')]);
  });
});

describe('problemasDoResumo: seções vazias (FUN-163)', () => {
  it.each([
    ['Contexto', { contexto: '' }],
    ['Contexto', { contexto: '     ' }],
    ['Mensagem central', { mensagem: '' }],
    ['Mensagem central', { mensagem: '  ' }],
    ['Divisão do livro', { divisao: [] }],
    ['Versículos-chave', { versiculos: [] }],
  ])('FUN-163: seção vazia recusa, com o nome %s', (nome, sobre) => {
    const lista = problemas(resumoCom(380, sobre));
    expect(lista.some((p) => p.includes(nome) && /vazi/i.test(p))).toBe(true);
  });

  it('FUN-164: título da divisão e frase do versículo vazios recusam', () => {
    const vazioTitulo = problemas(resumoCom(380, { divisao: [{ titulo: ' ', de: 1, ate: 2 }] }));
    expect(vazioTitulo.some((p) => /título/i.test(p) && /vazi/i.test(p))).toBe(true);
    const vazioFrase = problemas(resumoCom(380, { versiculos: [{ capitulo: 1, versiculo: 1, frase: '' }] }));
    expect(vazioFrase.some((p) => /frase/i.test(p) && /vazi/i.test(p))).toBe(true);
  });
});

describe('problemasDoResumo: referências à Bíblia do app (FUN-164, FUN-174)', () => {
  const divisao = (de: number, ate: number) => ({ divisao: [{ titulo: 'Parte um', de, ate }] });
  const versiculo = (capitulo: number, versiculo: number, ate?: number) => ({
    versiculos: [{ capitulo, versiculo, ...(ate === undefined ? {} : { ate }), frase: 'frase de exemplo' }],
  });

  it.each([
    ['capítulo 0', divisao(0, 2)],
    ['capítulo além do último', divisao(1, 4)],
    ['de depois de ate', divisao(3, 2)],
    ['capítulos fracionados', divisao(1.5, 2)],
  ])('FUN-174: divisão com %s recusa', (_nome, sobre) => {
    const lista = problemas(resumoCom(380, sobre));
    expect(lista.some((p) => p.includes('Divisão do livro'))).toBe(true);
  });

  it.each([
    ['1 a 3 (todos os capítulos)', divisao(1, 3)],
    ['1 a 1 (um capítulo só)', divisao(1, 1)],
  ])('divisão %s passa', (_nome, sobre) => {
    expect(problemas(resumoCom(380, sobre))).toEqual([]);
  });

  it.each([
    ['Gênesis 51:1 (capítulo inexistente)', versiculo(51, 1)],
    ['Gênesis 0:1 (capítulo zero)', versiculo(0, 1)],
    ['Gênesis 1:32 (versículo inexistente)', versiculo(1, 32)],
    ['Gênesis 1:0 (versículo zero)', versiculo(1, 0)],
    ['Gênesis 1:3-2 (intervalo invertido)', versiculo(1, 3, 2)],
    ['Gênesis 1:2-5 (fim além do último)', versiculo(1, 2, 5)],
  ])('FUN-174: versículo-chave %s recusa e cita a referência', (nome, sobre) => {
    const lista = problemas(resumoCom(380, sobre));
    expect(lista.some((p) => p.includes('Versículos-chave'))).toBe(true);
    expect(lista.some((p) => p.includes(nome.split(' (')[0] ?? ''))).toBe(true);
  });

  it.each([
    ['Gênesis 12:1-3 (intervalo)', versiculo(1, 1, 3)],
    ['um versículo só', versiculo(1, 4)],
    ['o último do livro', versiculo(3, 5)],
    ['o primeiro do livro', versiculo(1, 1)],
    ['intervalo até o último', versiculo(3, 1, 5)],
  ])('versículo-chave %s passa', (_nome, sobre) => {
    expect(problemas(resumoCom(380, sobre))).toEqual([]);
  });

  it('o livro do resumo precisa existir na Bíblia do app', () => {
    const lista = problemas(resumoCom(380, { livro: 66 }));
    expect(lista.some((p) => /livro 66/i.test(p))).toBe(true);
  });

  it('usa o tamanho do livro do resumo: Rute só tem 1 capítulo', () => {
    const rute = resumoCom(380, { livro: 8, divisao: [{ titulo: 'Parte um', de: 1, ate: 2 }] });
    expect(problemas(rute).some((p) => p.includes('Divisão do livro'))).toBe(true);
    expect(
      problemas({
        ...rute,
        divisao: [{ titulo: 'Parte um', de: 1, ate: 1 }],
        versiculos: [{ capitulo: 1, versiculo: 2, frase: 'frase de exemplo' }],
      }),
    ).toEqual([]);
  });
});

describe('problemasDoResumo: caracteres de controle e de formatação (AD-018, FUN-174)', () => {
  const classes: [string, string][] = [
    ['C0 (nulo)', '\u0000'],
    ['C0 (quebra de linha)', '\n'],
    ['C0 (retorno de carro)', '\r'],
    ['C0 (escape)', '\u001b'],
    ['C0 (tabulação)', '\t'],
    ['DEL', '\u007f'],
    ['C1 (NEL)', '\u0085'],
    ['C1 (limite)', '\u009f'],
    ['U+2028', ' '],
    ['U+2029', ' '],
    ['Cf (largura zero)', '​'],
    ['Cf (bidi)', '‮'],
    ['Cf (BOM)', '﻿'],
  ];

  it.each(classes)('AD-018: %s no contexto recusa', (_nome, c) => {
    const lista = problemas(resumoCom(380, { contexto: `${palavras(370)}${c}fim` }));
    expect(lista.some((p) => p.includes('Contexto') && /controle|formatação/i.test(p))).toBe(true);
  });

  it.each([
    ['mensagem', { mensagem: 'mensagem‮oculta' }, 'Mensagem central'],
    ['título da divisão', { divisao: [{ titulo: 'Parte​ um', de: 1, ate: 2 }] }, 'Divisão do livro'],
    ['frase do versículo', { versiculos: [{ capitulo: 1, versiculo: 1, frase: 'frase\ntroca' }] }, 'Versículos-chave'],
  ] as const)('AD-018: caractere escondido em %s recusa', (_nome, sobre, secao) => {
    const lista = problemas(resumoCom(380, sobre as Partial<Resumo>));
    expect(lista.some((p) => p.includes(secao) && /controle|formatação/i.test(p))).toBe(true);
  });

  it('acentos, cedilha, aspas curvas e travessão passam', () => {
    expect(problemas(resumoCom(380, { mensagem: '“Não” — disse ele: ação, coração, órfão, à vista' }))).toEqual([]);
  });
});

describe('problemasDoResumo: acumula todos os problemas', () => {
  it('devolve cada problema, não só o primeiro', () => {
    const lista = problemas(resumoCom(100, { mensagem: '', divisao: [], versiculos: [] }));
    expect(lista.length).toBeGreaterThanOrEqual(4);
  });
});
