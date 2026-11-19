import { describe, expect, it } from 'vitest';
import { arquivo, item, regra } from '../biblia/correcoes/apoio-teste';
import type { ItemCorrecao } from '../biblia/correcoes/arquivo';
import { agrupar, aprovarGrupo, podeAprovar, primeiroPendente } from './logica';
import type { Decisao } from './logica';

// Quem entra em cada grupo (T11, FUN-108, AD-012, AD-015):
//  - regras: uma por regra do arquivo
//  - bloco: confiança alta, confere, sem italicoMuda e tipo ≠ sentido; um bloco por tipo e livro
//  - um a um: confiança média ou baixa, todo sentido, não confere, italicoMuda
let n = 0;
function it1(parcial: Partial<ItemCorrecao> = {}): ItemCorrecao {
  n += 1;
  return item({ id: `C-${String(n).padStart(4, '0')}`, ...parcial });
}
const ref = (livro: number, versiculo = 1) => ({ livro, capitulo: 1, versiculo });

describe('agrupar (FUN-108)', () => {
  const itens = [
    it1({ ref: ref(1, 1), tipo: 'digitacao', confianca: 'alta' }), // bloco digitação Gênesis
    it1({ ref: ref(1, 2), tipo: 'digitacao', confianca: 'alta' }), // bloco digitação Gênesis
    it1({ ref: ref(2, 1), tipo: 'digitacao', confianca: 'alta' }), // bloco digitação Êxodo
    it1({ ref: ref(1, 3), tipo: 'ortografia', confianca: 'alta' }), // bloco ortografia Gênesis
    it1({ ref: ref(1, 4), tipo: 'digitacao', confianca: 'media' }), // um a um
    it1({ ref: ref(1, 5), tipo: 'digitacao', confianca: 'baixa' }), // um a um
    it1({ ref: ref(1, 6), tipo: 'sentido', confianca: 'alta' }), // um a um (todo sentido)
    it1({ ref: ref(1, 7), tipo: 'digitacao', confianca: 'alta', confere: false }), // um a um
    it1({ ref: ref(1, 8), tipo: 'digitacao', confianca: 'alta', italicoMuda: true }), // um a um
  ];
  const a = arquivo(itens, [regra('R-01'), regra('R-02')]);

  it('FUN-108: separa regras, blocos por tipo e livro, e os itens um a um, cada caso na sua regra de entrada', () => {
    const g = agrupar(a, []);
    expect(g.regras.map((r) => r.regra.id)).toEqual(['R-01', 'R-02']);
    expect(g.blocos.map((b) => [b.tipo, b.livro, b.itens.map((i) => i.id)])).toEqual([
      ['digitacao', 1, [itens[0]?.id, itens[1]?.id]],
      ['digitacao', 2, [itens[2]?.id]],
      ['ortografia', 1, [itens[3]?.id]],
    ]);
    expect(g.umAUm.itens.map((i) => i.id)).toEqual(itens.slice(4).map((i) => i.id));
  });

  it('FUN-108: cada grupo traz a contagem de pendentes', () => {
    const g = agrupar(a, []);
    expect(g.regras.map((r) => r.pendentes)).toEqual([1, 1]);
    expect(g.blocos.map((b) => b.pendentes)).toEqual([2, 1, 1]);
    expect(g.umAUm.pendentes).toBe(5);
  });

  it('FUN-108: a contagem cai com cada decisão, de regra, de bloco e de item um a um', () => {
    const decisoes: Decisao[] = [
      { id: 'R-01', estado: 'aprovada' },
      { id: itens[0]!.id, estado: 'aprovada' },
      { id: itens[4]!.id, estado: 'recusada' },
    ];
    const g = agrupar(a, decisoes);
    expect(g.regras.map((r) => r.pendentes)).toEqual([0, 1]);
    expect(g.blocos[0]?.pendentes).toBe(1);
    expect(g.umAUm.pendentes).toBe(4);
  });

  it('FUN-108: decisão "proposta" não conta como decidida, e o estado que já veio no arquivo vale sem decisão', () => {
    const decidido = it1({ estado: 'aprovada' });
    const g = agrupar(arquivo([decidido, itens[0]!], []), [{ id: itens[0]!.id, estado: 'proposta' }]);
    expect(g.blocos[0]?.pendentes).toBe(1);
    expect(g.blocos[0]?.itens).toHaveLength(2);
  });

  it('FUN-108: sem itens nem regras os grupos vêm vazios', () => {
    const g = agrupar(arquivo([], []), []);
    expect(g).toEqual({ regras: [], blocos: [], umAUm: { itens: [], pendentes: 0 } });
  });
});

describe('agrupar: itens sobrepostos vão ao um a um (FUN-110, FUN-107)', () => {
  const doVersiculo = (antes: string, n = 1) => it1({ ref: ref(5, n), antes, depois: `${antes}!` });

  it('FUN-110: item cujo trecho contém o de outro item do mesmo versículo sai do bloco, e o outro também', () => {
    const maior = doVersiculo('Eis que que seus ouvidos');
    const menor = doVersiculo('Eis que que');
    const livre = it1({ ref: ref(5, 2), antes: 'Ele disse' });
    const g = agrupar(arquivo([maior, menor, livre], []), []);
    expect(g.blocos.flatMap((b) => b.itens.map((i) => i.id))).toEqual([livre.id]);
    expect(g.umAUm.itens.map((i) => i.id)).toEqual([maior.id, menor.id]);
  });

  it('FUN-110: trechos que se sobrepõem só pelas pontas (o fim de um é o começo do outro) também vão ao um a um', () => {
    const a = doVersiculo('o Coreiro abriu');
    const b = doVersiculo('abriu um dos selos');
    const g = agrupar(arquivo([a, b], []), []);
    expect(g.blocos).toEqual([]);
    expect(g.umAUm.itens.map((i) => i.id)).toEqual([a.id, b.id]);
  });

  it('FUN-110: trechos separados no mesmo versículo, e trechos iguais em versículos diferentes, ficam no bloco', () => {
    const a = doVersiculo('forma');
    const b = doVersiculo('Coreiro');
    const c = it1({ ref: ref(5, 2), antes: 'forma' });
    const g = agrupar(arquivo([a, b, c], []), []);
    expect(g.blocos[0]?.itens.map((i) => i.id)).toEqual([a.id, b.id, c.id]);
    expect(g.umAUm.itens).toEqual([]);
  });

  it('FUN-110: aprovar o bloco nunca decide dois itens sobrepostos', () => {
    const maior = doVersiculo('Eis que que seus ouvidos');
    const menor = doVersiculo('Eis que que');
    const g = agrupar(arquivo([maior, menor], []), []);
    expect(g.blocos.flatMap((b) => aprovarGrupo(b, []))).toEqual([]);
    expect(aprovarGrupo(g.umAUm, [])).toEqual([]);
  });
});

describe('aprovarGrupo (FUN-110)', () => {
  it('FUN-110: aprovar um bloco aprova só os itens dele que conferem, e o bloco vizinho fica intacto', () => {
    const a1 = it1({ ref: ref(1, 1) });
    const a2 = it1({ ref: ref(1, 2) });
    const b1 = it1({ ref: ref(2, 1) });
    const g = agrupar(arquivo([a1, a2, b1], []), []);
    const novas = aprovarGrupo(g.blocos[0]!, []);
    expect(novas).toEqual([
      { id: a1.id, estado: 'aprovada' },
      { id: a2.id, estado: 'aprovada' },
    ]);
    expect(novas.map((d) => d.id)).not.toContain(b1.id);
  });

  it('FUN-110: item que não confere nunca é aprovado em bloco, mesmo que o grupo o contenha', () => {
    const ok = it1();
    const nao = it1({ confere: false });
    const grupo = { chave: 'x', tipo: 'digitacao' as const, livro: 1, itens: [ok, nao], pendentes: 2 };
    expect(aprovarGrupo(grupo, [])).toEqual([{ id: ok.id, estado: 'aprovada' }]);
  });

  it('FUN-110: item já decidido (recusado à mão) não é ressuscitado pelo bloco', () => {
    const a1 = it1();
    // T25 (autorizado em 2026-11-18): o segundo item sai do versículo do primeiro, que tinha o mesmo trecho e agora vai
    // ao um a um; as asserções são as mesmas.
    const a2 = it1({ ref: ref(1, 3) });
    const g = agrupar(arquivo([a1, a2], []), [{ id: a1.id, estado: 'recusada' }]);
    expect(aprovarGrupo(g.blocos[0]!, [{ id: a1.id, estado: 'recusada' }])).toEqual([
      { id: a2.id, estado: 'aprovada' },
    ]);
  });

  it('FUN-110: aprovar uma regra devolve a decisão da regra; regra já decidida não gera nada', () => {
    const g = agrupar(arquivo([], [regra('R-01'), regra('R-02')]), [{ id: 'R-02', estado: 'recusada' }]);
    expect(aprovarGrupo(g.regras[0]!, [])).toEqual([{ id: 'R-01', estado: 'aprovada' }]);
    expect(aprovarGrupo(g.regras[1]!, [{ id: 'R-02', estado: 'recusada' }])).toEqual([]);
  });

  it('FUN-110: os itens um a um não se aprovam em bloco', () => {
    const g = agrupar(arquivo([it1({ confianca: 'media' })], []), []);
    expect(aprovarGrupo(g.umAUm, [])).toEqual([]);
  });
});

describe('podeAprovar (FUN-111)', () => {
  it('FUN-111: sentido sem fonte devolve "Falta a fonte"; fonte só com espaços também', () => {
    expect(podeAprovar(item({ tipo: 'sentido', fonte: '' }))).toBe('Falta a fonte');
    expect(podeAprovar(item({ tipo: 'sentido', fonte: '   ' }))).toBe('Falta a fonte');
  });

  it('FUN-111: sentido com fonte, e digitação ou ortografia sem fonte, podem ser aprovados', () => {
    expect(podeAprovar(item({ tipo: 'sentido', fonte: 'hebraico' }))).toBe(true);
    expect(podeAprovar(item({ tipo: 'digitacao', fonte: '' }))).toBe(true);
    expect(podeAprovar(item({ tipo: 'ortografia', fonte: '' }))).toBe(true);
  });

  it('FUN-105: item que não confere devolve "Não confere", com ou sem fonte, e vence "Falta a fonte"', () => {
    expect(podeAprovar(item({ confere: false }))).toBe('Não confere');
    expect(podeAprovar(item({ confere: false, tipo: 'sentido', fonte: '' }))).toBe('Não confere');
  });

  it('FUN-117: "depois" editado com colchete sem par devolve "Colchete sem par"', () => {
    expect(podeAprovar(item(), 'texto [sem fecho')).toBe('Colchete sem par');
    expect(podeAprovar(item(), 'texto ] sem abrir')).toBe('Colchete sem par');
    expect(podeAprovar(item(), 'texto [com] par')).toBe(true);
  });
});

describe('primeiroPendente (FUN-112)', () => {
  const bloco1 = it1({ ref: ref(1, 1) });
  const bloco2 = it1({ ref: ref(1, 2) });
  const um = it1({ ref: ref(1, 3), confianca: 'media' });
  const a = arquivo([bloco1, bloco2, um], [regra('R-01')]);

  it('FUN-112: segue a ordem regras → blocos → um a um', () => {
    expect(primeiroPendente(agrupar(a, []), [])).toBe('R-01');
    const d1: Decisao[] = [{ id: 'R-01', estado: 'aprovada' }];
    expect(primeiroPendente(agrupar(a, d1), d1)).toBe(bloco1.id);
    const d2: Decisao[] = [...d1, { id: bloco1.id, estado: 'aprovada' }];
    expect(primeiroPendente(agrupar(a, d2), d2)).toBe(bloco2.id);
    const d3: Decisao[] = [...d2, { id: bloco2.id, estado: 'recusada' }];
    expect(primeiroPendente(agrupar(a, d3), d3)).toBe(um.id);
  });

  it('FUN-112: devolve null quando tudo foi decidido, e também sem nada para decidir', () => {
    const todas: Decisao[] = [
      { id: 'R-01', estado: 'aprovada' },
      { id: bloco1.id, estado: 'aprovada' },
      { id: bloco2.id, estado: 'aprovada' },
      { id: um.id, estado: 'recusada' },
    ];
    expect(primeiroPendente(agrupar(a, todas), todas)).toBeNull();
    expect(primeiroPendente(agrupar(arquivo([], []), []), [])).toBeNull();
  });

  it('FUN-112: reabrir com as decisões guardadas continua do primeiro pendente, não do começo', () => {
    const guardadas: Decisao[] = [
      { id: 'R-01', estado: 'aprovada' },
      { id: bloco1.id, estado: 'aprovada' },
    ];
    expect(primeiroPendente(agrupar(a, guardadas), guardadas)).toBe(bloco2.id);
  });
});
