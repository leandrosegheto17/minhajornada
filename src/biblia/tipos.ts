/** Um livro convertido de `.biblia/` (`public/livros/NN.<hash8>.json`). */
export interface Livro {
  /** 1..66, ordem canônica. */
  numero: number;
  /** "Gênesis", "1 Samuel". */
  nome: string;
  /** `capitulos[c-1][v-1]` = texto cru do versículo, com colchetes. */
  capitulos: string[][];
}

export type Testamento = 'AT' | 'NT';

export interface EntradaIndice {
  numero: number;
  nome: string;
  testamento: Testamento;
  capitulos: number;
  /** Caminho público do JSON do livro, ex.: `/livros/01.a1b2c3d4.json`. */
  arquivo: string;
}

/** `src/biblia/indice.gerado.json` (entra no bundle). */
export interface Indice {
  livros: EntradaIndice[];
}

export type Ref = { livro: number; capitulo: number };
export type Tema = 'claro' | 'escuro' | 'sepia';
export type Segmento = { texto: string; italico: boolean };
