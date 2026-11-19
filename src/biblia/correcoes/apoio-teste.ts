// Apoio dos testes de `correcoes/`: fábricas de item, regra e arquivo, livros pequenos e a fonte real.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { converterLivro } from '../conversor';
import type { Livro } from '../tipos';
import type { ArquivoCorrecoes, IdRegra, ItemCorrecao, RegraNoArquivo } from './arquivo';

export function item(parcial: Partial<ItemCorrecao> = {}): ItemCorrecao {
  return {
    id: 'C-0001',
    ref: { livro: 1, capitulo: 1, versiculo: 2 },
    tipo: 'digitacao',
    antes: 'Coreiro',
    depois: 'Cordeiro',
    motivo: 'palavra inexistente',
    fonte: 'consistência interna',
    confianca: 'alta',
    estado: 'proposta',
    confere: true,
    ...parcial,
  };
}

export function regra(id: IdRegra = 'R-01', parcial: Partial<RegraNoArquivo> = {}): RegraNoArquivo {
  return {
    id,
    descricao: 'descrição da regra',
    estado: 'proposta',
    versiculos: 2,
    exemplos: [{ ref: { livro: 1, capitulo: 2, versiculo: 1 }, antes: 'a ,b', depois: 'a,b' }],
    ...parcial,
  };
}

export function arquivo(itens: ItemCorrecao[] = [], regras: RegraNoArquivo[] = []): ArquivoCorrecoes {
  return { versao: 1, regras, itens };
}

/** Dois livros pequenos, com os versículos que os testes citam por referência. */
export function livrosFicticios(): Livro[] {
  return [
    {
      numero: 1,
      nome: 'Gênesis',
      capitulos: [
        [
          'No princípio [Deus] criou os céus e a terra.',
          'A terra era sem forma e vazia, e o Coreiro abriu o livro.',
          'E ele disse sim sim e saiu.',
          'texto [sem fecho aqui',
        ],
        ['Rute disse ,vem.'],
      ],
    },
    {
      numero: 2,
      nome: 'Êxodo',
      capitulos: [['Assim falou o SENHOR : vem.', 'Então saiu.']],
    },
  ];
}

let reais: Livro[] | null = null;

/** Os 66 livros de `.biblia/`, como o build os lê. */
export function livrosReais(): Livro[] {
  if (reais) return reais;
  const pasta = join(process.cwd(), '.biblia');
  const fontes = readdirSync(pasta)
    .filter((nome) => /^(\d{2})-[a-z0-9-]+\.md$/.test(nome))
    .sort();
  reais = fontes.map((nome) => converterLivro(readFileSync(join(pasta, nome), 'utf8'), Number(nome.slice(0, 2))));
  return reais;
}

/**
 * Caracteres que um "depois" não pode ter (AD-018): controle (C0, DEL, C1, U+2028, U+2029) e formatação (bidi e
 * largura zero). Um por ramo e nos limites de cada faixa; escritos por código de ponto, nunca como caractere literal.
 */
export const CARACTERES_PROIBIDOS: readonly (readonly [nome: string, codigo: number])[] = [
  ['NUL', 0x00],
  ['TAB', 0x09],
  ['LF', 0x0a],
  ['CR', 0x0d],
  ['ESC', 0x1b],
  ['US, o último do C0', 0x1f],
  ['DEL', 0x7f],
  ['o primeiro do C1', 0x80],
  ['NEL', 0x85],
  ['CSI, o último do C1', 0x9b],
  ['APC, o último do C1', 0x9f],
  ['separador de linha U+2028', 0x2028],
  ['separador de parágrafo U+2029', 0x2029],
  ['hífen opcional U+00AD', 0x00ad],
  ['marca de letra árabe U+061C', 0x061c],
  ['espaço de largura zero U+200B', 0x200b],
  ['junção sem largura U+200C', 0x200c],
  ['junção de largura zero U+200D', 0x200d],
  ['marca esquerda-direita U+200E', 0x200e],
  ['marca direita-esquerda U+200F', 0x200f],
  ['embutimento U+202A', 0x202a],
  ['sobreposição direita-esquerda U+202E', 0x202e],
  ['junção de palavras U+2060', 0x2060],
  ['isolamento U+2066', 0x2066],
  ['fim de isolamento U+2069', 0x2069],
  ['ordem de bytes U+FEFF', 0xfeff],
];

/** Vizinhos das faixas proibidas que são texto comum e precisam passar. */
export const CARACTERES_PERMITIDOS: readonly (readonly [nome: string, codigo: number])[] = [
  ['espaço', 0x20],
  ['til, o último ASCII', 0x7e],
  ['espaço inseparável U+00A0', 0x00a0],
  ['á', 0xe1],
  ['U+2027', 0x2027],
  ['U+202F', 0x202f],
  ['U+2065', 0x2065],
  ['zero sobrescrito U+2070', 0x2070],
];
