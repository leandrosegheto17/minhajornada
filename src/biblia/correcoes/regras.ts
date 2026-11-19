import type { IdRegra } from './arquivo.ts';

export interface RegraMecanica {
  id: IdRegra;
  descricao: string;
  aplicar(texto: string): string;
}

/**
 * As regras mecânicas de espaço e pontuação (FUN-106). Puras e idempotentes; nenhuma mexe em letra, número nem
 * colchete (FUN-117): só inserem ou tiram espaço. A ordem do array é a ordem de aplicação (FUN-127).
 */
export const REGRAS: readonly RegraMecanica[] = [
  {
    id: 'R-01',
    descricao: 'Tira o espaço antes de vírgula, ponto, ponto e vírgula, dois-pontos, interrogação e exclamação',
    // `[dizendo] :` vira `[dizendo]:`: o espaço entre o colchete e a pontuação também sai.
    aplicar: (texto) => texto.replace(/\s+(?=[,.;:?!])/g, ''),
  },
  {
    id: 'R-02',
    descricao: 'Põe espaço depois de vírgula, ponto e vírgula e dois-pontos',
    // Só antes de letra, `[` ou aspas de abertura: `3:16` e `1,2` (números) e `,]` ou `,”` não mudam.
    aplicar: (texto) => texto.replace(/([,;:])(?=[\p{L}[“‘])/gu, '$1 '),
  },
  {
    id: 'R-03',
    descricao: 'Põe espaço depois do ponto final, entre duas frases',
    // Só antes de letra maiúscula: `1.5`, `a.b` e `.[seja]` não mudam.
    aplicar: (texto) => texto.replace(/\.(?=\p{Lu})/gu, '. '),
  },
];
