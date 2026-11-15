import { describe, expect, it } from 'vitest';
import { segmentar } from './segmentos';

describe('segmentar (FUN-02)', () => {
  it('FUN-02: "[que está]" de Filemom 1:2 vira itálico sem colchetes', () => {
    expect(
      segmentar('E à amada Ápia, e a Arquipo nosso companheiro de batalha, e à igreja [que está] em tua casa;'),
    ).toEqual([
      { texto: 'E à amada Ápia, e a Arquipo nosso companheiro de batalha, e à igreja ', italico: false },
      { texto: 'que está', italico: true },
      { texto: ' em tua casa;', italico: false },
    ]);
  });

  it('FUN-02: dois trechos no mesmo versículo', () => {
    expect(segmentar('meus pés não [deixaste] tropeçar; para [eu] andar')).toEqual([
      { texto: 'meus pés não ', italico: false },
      { texto: 'deixaste', italico: true },
      { texto: ' tropeçar; para ', italico: false },
      { texto: 'eu', italico: true },
      { texto: ' andar', italico: false },
    ]);
  });

  it('FUN-02: trecho no início e no fim do versículo', () => {
    expect(segmentar('[Haja] em vós graça')).toEqual([
      { texto: 'Haja', italico: true },
      { texto: ' em vós graça', italico: false },
    ]);
    expect(segmentar('aquilo que te [é]')).toEqual([
      { texto: 'aquilo que te ', italico: false },
      { texto: 'é', italico: true },
    ]);
  });

  it('FUN-02: versículo sem colchete fica num trecho só, sem itálico', () => {
    expect(segmentar('No princípio criou Deus os céus e a terra.')).toEqual([
      { texto: 'No princípio criou Deus os céus e a terra.', italico: false },
    ]);
  });

  it('FUN-02: Salmos 27:13 "[certamente já teria perecido] ." mantém o espaço e o ponto', () => {
    expect(segmentar('na terra dos viventes, [certamente já teria perecido] .')).toEqual([
      { texto: 'na terra dos viventes, ', italico: false },
      { texto: 'certamente já teria perecido', italico: true },
      { texto: ' .', italico: false },
    ]);
  });

  it('FUN-02: nenhum trecho devolvido contém colchete', () => {
    for (const s of segmentar('[a] b [c] d [e]')) expect(s.texto).not.toMatch(/[[\]]/);
  });
});
