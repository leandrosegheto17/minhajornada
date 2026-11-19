import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { conferir } from '../../scripts/correcoes/conferir.ts';
import type { Candidato } from '../../scripts/correcoes/levantamento.ts';
import { converterLivro } from '../../src/biblia/conversor';
import type { Livro } from '../../src/biblia/tipos';

// Tabela caso → resultado (T8, FUN-104, FUN-105, AD-013 a AD-015):
//  1. "antes" exato, uma vez no versículo            → confere
//  2. "antes" exato, duas vezes                      → não confere (antes como escrito)
//  3. "antes" não aparece, nem sem colchetes         → não confere
//  4. só sem colchetes, uma vez                      → confere, antes = trecho exato da fonte (recuperado)
//     4a. pares de colchetes do antes recuperado ≠ pares do depois → italicoMuda
//     4b. pares iguais                                           → sem italicoMuda
//     4c. o trecho sem colchetes corta um par ao meio             → o trecho se estende até fechar o par
//  5. só sem colchetes, mas duas vezes               → não confere
//  6. "N ocorrências"                                → um item por versículo achado no texto inteiro; N ≠ achados vai ao relatório
//  7. "depois" = "antes" com as regras mecânicas     → sai da lista (AD-013)
//  8. referência que não existe na fonte             → não vira item, vai ao relatório
//  9. ids C-0001… em ordem bíblica, todos "proposta"; linha repetida (mesma ref, antes e depois) conta uma vez

const LIVROS: Livro[] = [
  {
    numero: 1,
    nome: 'Gênesis',
    capitulos: [
      [
        'No princípio [Deus] criou os céus e a terra.',
        'A terra era sem forma e vazia, e o Coreiro abriu o livro.',
        'E ele disse sim sim e saiu. Depois sim sim de novo.',
        'diz [dele] ,e vai e [dele] ,e vem',
        'Disse o [homem] a [ela] e foi.',
        'um [vaso] de barro e um vaso [de] barro',
      ],
      ['Rute disse ,vem.', 'Assim falou o [SENHOR] : vem.'],
    ],
  },
  { numero: 2, nome: 'Êxodo', capitulos: [['Coreiro aqui também.', 'sim sim fora do Gênesis']] },
];

let contador = 0;
function cand(parcial: Partial<Candidato> = {}): Candidato {
  contador += 1;
  return {
    arquivo: 'g01.md',
    linha: contador,
    refs: [{ livro: 1, capitulo: 1, versiculo: 2 }],
    tipo: 'digitacao',
    antes: 'Coreiro',
    depois: 'Cordeiro',
    motivo: 'palavra inexistente',
    fonte: 'consistência interna',
    confianca: 'alta',
    ...parcial,
  };
}

const ref = (livro: number, capitulo: number, versiculo: number) => ({ livro, capitulo, versiculo });

describe('conferir (FUN-104, FUN-105)', () => {
  it('FUN-105: "antes" exato uma vez no versículo confere, e os campos do levantamento passam para o item', () => {
    const { itens, relatorio } = conferir([cand()], LIVROS);
    expect(itens).toEqual([
      {
        id: 'C-0001',
        ref: ref(1, 1, 2),
        tipo: 'digitacao',
        antes: 'Coreiro',
        depois: 'Cordeiro',
        motivo: 'palavra inexistente',
        fonte: 'consistência interna',
        confianca: 'alta',
        estado: 'proposta',
        confere: true,
      },
    ]);
    expect(relatorio).toMatchObject({
      conferem: 1,
      naoConferem: 0,
      recuperados: 0,
      cobertosPorRegra: 0,
      expandidos: 0,
    });
  });

  it('FUN-105: "antes" que aparece duas vezes no versículo não confere e fica como escrito', () => {
    const { itens, relatorio } = conferir([cand({ refs: [ref(1, 1, 3)], antes: 'sim sim', depois: 'sim' })], LIVROS);
    expect(itens[0]).toMatchObject({ confere: false, antes: 'sim sim' });
    expect(relatorio).toMatchObject({ conferem: 0, naoConferem: 1 });
  });

  it('FUN-105: "antes" que não aparece, nem sem os colchetes, não confere e fica como escrito', () => {
    const { itens } = conferir([cand({ antes: 'Cordeiro inexistente', depois: 'x' })], LIVROS);
    expect(itens[0]).toMatchObject({ confere: false, antes: 'Cordeiro inexistente' });
  });

  it('FUN-105 (AD-015): só aparece sem os colchetes → troca pelo trecho exato da fonte e marca italicoMuda se os pares mudam', () => {
    const { itens, relatorio } = conferir(
      [cand({ refs: [ref(1, 1, 1)], antes: 'No princípio Deus criou', depois: 'No princípio Deus fez' })],
      LIVROS,
    );
    expect(itens[0]).toMatchObject({
      confere: true,
      antes: 'No princípio [Deus] criou',
      depois: 'No princípio Deus fez',
      italicoMuda: true,
    });
    expect(relatorio).toMatchObject({ conferem: 1, recuperados: 1 });
  });

  it('FUN-105 (AD-015): pares de colchetes iguais no antes recuperado e no depois não marcam italicoMuda', () => {
    const { itens } = conferir(
      [cand({ refs: [ref(1, 1, 1)], antes: 'No princípio Deus criou', depois: 'No princípio [Deus] fez' })],
      LIVROS,
    );
    expect(itens[0]).toMatchObject({ confere: true, antes: 'No princípio [Deus] criou' });
    expect(itens[0]).not.toHaveProperty('italicoMuda');
  });

  it('FUN-105 (AD-015): o trecho sem colchetes que corta um par ao meio se estende até fechar o par', () => {
    const { itens } = conferir(
      [cand({ refs: [ref(1, 1, 5)], antes: 'homem a ela', depois: 'homem para ela' })],
      LIVROS,
    );
    expect(itens[0]).toMatchObject({ confere: true, antes: '[homem] a [ela]', italicoMuda: true });
  });

  it('FUN-105 (AD-015): trecho sem colchetes que aparece duas vezes (com e sem colchetes) não confere', () => {
    const { itens } = conferir(
      [cand({ refs: [ref(1, 1, 6)], antes: 'vaso de barro', depois: 'vaso de argila' })],
      LIVROS,
    );
    expect(itens[0]).toMatchObject({ confere: false, antes: 'vaso de barro' });
  });

  it('FUN-104 (AD-014): "N ocorrências" vira um item por versículo em que o trecho aparece, no texto inteiro', () => {
    const { itens, relatorio } = conferir(
      [cand({ refs: [], ocorrencias: 3, antes: 'Coreiro', depois: 'Cordeiro' })],
      LIVROS,
    );
    expect(itens.map((i) => i.ref)).toEqual([ref(1, 1, 2), ref(2, 1, 1)]);
    expect(itens.every((i) => i.confere && i.estado === 'proposta')).toBe(true);
    expect(relatorio.expandidos).toBe(2);
    expect(relatorio.conferem).toBe(2);
    expect(relatorio.ocorrenciasDivergentes).toEqual([
      expect.objectContaining({ arquivo: 'g01.md', esperado: 3, achado: 2 }),
    ]);
  });

  it('FUN-104 (AD-014): contagem igual a N não vai ao relatório; trecho que não aparece em lugar nenhum não vira item', () => {
    const igual = conferir([cand({ refs: [], ocorrencias: 2 })], LIVROS);
    expect(igual.itens).toHaveLength(2);
    expect(igual.relatorio.ocorrenciasDivergentes).toEqual([]);

    const nenhum = conferir([cand({ refs: [], ocorrencias: 4, antes: 'trecho que não existe' })], LIVROS);
    expect(nenhum.itens).toEqual([]);
    expect(nenhum.relatorio.ocorrenciasDivergentes).toEqual([expect.objectContaining({ esperado: 4, achado: 0 })]);
  });

  it('FUN-104 (AD-014): versículo com o trecho duas vezes entra como item que não confere', () => {
    const { itens } = conferir([cand({ refs: [], ocorrencias: 2, antes: 'sim sim', depois: 'sim' })], LIVROS);
    expect(itens.map((i) => [i.ref, i.confere])).toEqual([
      [ref(1, 1, 3), false],
      [ref(2, 1, 2), true],
    ]);
  });

  it('FUN-104 (AD-013): "depois" igual ao "antes" com as regras mecânicas sai da lista, coberto pela regra', () => {
    const { itens, relatorio } = conferir(
      [
        cand({ refs: [ref(1, 2, 1)], antes: 'disse ,vem', depois: 'disse, vem' }),
        cand({ refs: [ref(1, 2, 2)], antes: '[SENHOR] : vem', depois: '[SENHOR]: vem' }),
      ],
      LIVROS,
    );
    expect(itens).toEqual([]);
    expect(relatorio.cobertosPorRegra).toBe(2);
  });

  it('FUN-104 (AD-013): "depois" que muda mais do que a regra mecânica continua na lista', () => {
    const { itens, relatorio } = conferir(
      [cand({ refs: [ref(1, 2, 1)], antes: 'disse ,vem', depois: 'disse, venha' })],
      LIVROS,
    );
    expect(itens).toHaveLength(1);
    expect(relatorio.cobertosPorRegra).toBe(0);
  });

  it('FUN-104: referência que não existe na fonte não vira item e vai ao relatório com o motivo', () => {
    const { itens, relatorio } = conferir(
      [cand({ refs: [ref(1, 99, 1)] }), cand({ refs: [ref(1, 1, 99)] }), cand({ refs: [ref(77, 1, 1)] })],
      LIVROS,
    );
    expect(itens).toEqual([]);
    expect(relatorio.semVersiculo).toHaveLength(3);
    expect(relatorio.semVersiculo[0]?.motivo).toContain('Gênesis 99:1');
  });

  it('FUN-104: várias referências da mesma linha geram um item por referência', () => {
    const { itens } = conferir([cand({ refs: [ref(2, 1, 1), ref(1, 1, 2)] })], LIVROS);
    expect(itens.map((i) => i.ref)).toEqual([ref(1, 1, 2), ref(2, 1, 1)]);
  });

  it('FUN-104: ids C-0001… em ordem bíblica, na ordem de chegada dentro do versículo, todos "proposta"', () => {
    const { itens } = conferir(
      [
        cand({ refs: [ref(2, 1, 1)] }),
        cand({ refs: [ref(1, 1, 2)], antes: 'Coreiro', depois: 'A' }),
        cand({ refs: [ref(1, 1, 2)], antes: 'abriu', depois: 'B' }),
        cand({ refs: [ref(1, 1, 1)], antes: 'céus', depois: 'C' }),
      ],
      LIVROS,
    );
    expect(itens.map((i) => i.id)).toEqual(['C-0001', 'C-0002', 'C-0003', 'C-0004']);
    expect(itens.map((i) => [i.ref.livro, i.ref.versiculo, i.depois])).toEqual([
      [1, 1, 'C'],
      [1, 2, 'A'],
      [1, 2, 'B'],
      [2, 1, 'Cordeiro'],
    ]);
    expect(itens.every((i) => i.estado === 'proposta')).toBe(true);
  });

  it('FUN-104: a mesma linha repetida (mesma referência, antes e depois) conta uma vez e o relatório diz quantas', () => {
    const { itens, relatorio } = conferir([cand(), cand()], LIVROS);
    expect(itens).toHaveLength(1);
    expect(relatorio.duplicados).toBe(1);
  });

  it('FUN-104: o relatório conta conferem, não conferem, recuperados, cobertos por regra e expandidos', () => {
    const { relatorio } = conferir(
      [
        cand(),
        cand({ antes: 'não existe' }),
        cand({ refs: [ref(1, 1, 1)], antes: 'No princípio Deus criou', depois: 'x' }),
        cand({ refs: [ref(1, 2, 1)], antes: 'disse ,vem', depois: 'disse, vem' }),
        cand({ refs: [], ocorrencias: 2, antes: 'sim sim', depois: 'sim' }),
      ],
      LIVROS,
    );
    expect(relatorio).toMatchObject({
      conferem: 3,
      naoConferem: 2,
      recuperados: 1,
      cobertosPorRegra: 1,
      expandidos: 2,
    });
  });
});

describe('conferir sobre o texto real (FUN-104, FUN-105)', () => {
  const fonte = join(process.cwd(), '.biblia', '66-apocalipse.md');
  const apocalipse: Livro = converterLivro(readFileSync(fonte, 'utf8'), 66);

  it('FUN-105: Apocalipse 6:1 "Coreiro" confere com confiança alta; um "antes" inexistente volta confere: false', () => {
    const { itens } = conferir(
      [
        cand({
          refs: [ref(66, 6, 1)],
          antes: 'quando o Coreiro abriu um dos selos',
          depois: 'quando o Cordeiro abriu um dos selos',
        }),
        cand({ refs: [ref(66, 6, 1)], antes: 'trecho que não está lá', depois: 'x' }),
      ],
      [apocalipse],
    );
    expect(itens[0]).toMatchObject({ confere: true, confianca: 'alta', estado: 'proposta' });
    expect(itens[1]).toMatchObject({ confere: false });
  });
});
