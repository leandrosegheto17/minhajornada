import { describe, expect, it } from 'vitest';
import type { Livro } from '../biblia/tipos';
import {
  alvoDaPagina,
  blocosDoLivro,
  paginar,
  paginaDoVersiculo,
  primeiroVersiculo,
  type Bloco,
  type Pagina,
} from './paginacao';

/** Livro com a forma de Rute (4 capítulos: 22, 23, 18 e 22 versículos = 85) e texto de mentira. */
function livroComVersiculos(numero: number, nome: string, versiculosPorCapitulo: number[]): Livro {
  return {
    numero,
    nome,
    capitulos: versiculosPorCapitulo.map((total, c) =>
      Array.from({ length: total }, (_, v) => `${nome} ${c + 1}:${v + 1}`),
    ),
  };
}

const rute = () => livroComVersiculos(8, 'Rute', [22, 23, 18, 22]);
const judas = () => livroComVersiculos(65, 'Judas', [25]);

/** Altura (em px) que cada parte ocupa na página: a fatia vai até o recorte da parte seguinte do mesmo bloco. */
function alturasDasPartes(paginas: Pagina[], alturas: number[]): number[][] {
  return paginas.map((pagina, p) =>
    pagina.partes.map((parte) => {
      for (let q = p; q < paginas.length; q += 1) {
        const seguinte = paginas[q]!.partes.find(
          (outra) => outra.bloco === parte.bloco && outra.recorte > parte.recorte,
        );
        if (seguinte) return seguinte.recorte - parte.recorte;
      }
      return alturas[parte.bloco]! - parte.recorte;
    }),
  );
}

const todasAsPartes = (paginas: Pagina[]) => paginas.flatMap((pagina) => pagina.partes);

describe('blocosDoLivro (FUN-76)', () => {
  it('FUN-76: Rute dá 1 + 85 blocos, com o nome do livro primeiro', () => {
    const blocos = blocosDoLivro(rute());
    expect(blocos).toHaveLength(86);
    expect(blocos[0]).toEqual({ tipo: 'nomeLivro', livro: 8 });
    expect(blocos.slice(1).every((bloco) => bloco.tipo === 'versiculo')).toBe(true);
  });

  it('FUN-76: abreCapitulo marca o versículo 1 dos capítulos 1 a 4 e só ele', () => {
    const versiculos = blocosDoLivro(rute()).filter(
      (b): b is Extract<Bloco, { tipo: 'versiculo' }> => b.tipo === 'versiculo',
    );
    const aberturas = versiculos.filter((b) => b.abreCapitulo);
    expect(aberturas.map((b) => [b.ref.capitulo, b.versiculo])).toEqual([
      [1, 1],
      [2, 1],
      [3, 1],
      [4, 1],
    ]);
    expect(versiculos.filter((b) => !b.abreCapitulo).every((b) => b.versiculo > 1)).toBe(true);
  });

  it('FUN-76: os versículos vêm em ordem, com capítulo e versículo corretos', () => {
    const versiculos = blocosDoLivro(rute()).filter(
      (b): b is Extract<Bloco, { tipo: 'versiculo' }> => b.tipo === 'versiculo',
    );
    expect(versiculos[0]).toEqual({
      tipo: 'versiculo',
      ref: { livro: 8, capitulo: 1 },
      versiculo: 1,
      abreCapitulo: true,
    });
    expect(versiculos[21]).toEqual({
      tipo: 'versiculo',
      ref: { livro: 8, capitulo: 1 },
      versiculo: 22,
      abreCapitulo: false,
    });
    expect(versiculos[22]).toEqual({
      tipo: 'versiculo',
      ref: { livro: 8, capitulo: 2 },
      versiculo: 1,
      abreCapitulo: true,
    });
    expect(versiculos[84]).toEqual({
      tipo: 'versiculo',
      ref: { livro: 8, capitulo: 4 },
      versiculo: 22,
      abreCapitulo: false,
    });
  });

  it('FUN-76: livro de capítulo único (Judas) marca só o versículo 1', () => {
    const blocos = blocosDoLivro(judas());
    expect(blocos).toHaveLength(26);
    const abrem = blocos.filter((b) => b.tipo === 'versiculo' && b.abreCapitulo);
    expect(abrem).toHaveLength(1);
    expect(abrem[0]).toMatchObject({ ref: { livro: 65, capitulo: 1 }, versiculo: 1 });
  });

  it('FUN-76: capítulo sem versículos não gera bloco nem quebra a marca do seguinte', () => {
    const livro: Livro = { numero: 8, nome: 'Rute', capitulos: [['a'], [], ['b', 'c']] };
    const blocos = blocosDoLivro(livro);
    expect(blocos).toHaveLength(4);
    expect(blocos[2]).toMatchObject({ ref: { capitulo: 3 }, versiculo: 1, abreCapitulo: true });
  });

  it('FUN-76: livro sem capítulos só tem o nome', () => {
    expect(blocosDoLivro({ numero: 8, nome: 'Rute', capitulos: [] })).toEqual([{ tipo: 'nomeLivro', livro: 8 }]);
  });
});

describe('paginar (FUN-75)', () => {
  const PAGINA = 100;
  const LINHA = 20;

  it('FUN-75: agrupa blocos inteiros, cada um uma vez e em ordem', () => {
    const paginas = paginar([30, 30, 30, 30], PAGINA, LINHA);
    expect(paginas.map((p) => p.partes.map((parte) => parte.bloco))).toEqual([[0, 1, 2], [3]]);
    expect(todasAsPartes(paginas).every((parte) => parte.recorte === 0)).toBe(true);
  });

  it('FUN-75: bloco que cabe exato na página fica nela', () => {
    expect(paginar([50, 50, 10], PAGINA, LINHA).map((p) => p.partes.map((parte) => parte.bloco))).toEqual([
      [0, 1],
      [2],
    ]);
  });

  it('FUN-75: bloco 1 px maior que o espaço que sobra vai para a página seguinte, sem ser dividido', () => {
    const paginas = paginar([50, 51, 10], PAGINA, LINHA);
    expect(paginas.map((p) => p.partes.map((parte) => parte.bloco))).toEqual([[0], [1, 2]]);
    expect(todasAsPartes(paginas).every((parte) => parte.recorte === 0)).toBe(true);
  });

  it('FUN-75: bloco do tamanho exato da página ocupa uma página sozinho, sem divisão', () => {
    const paginas = paginar([100, 10], PAGINA, LINHA);
    expect(paginas.map((p) => p.partes)).toEqual([[{ bloco: 0, recorte: 0 }], [{ bloco: 1, recorte: 0 }]]);
  });

  it('FUN-75: bloco maior que a página é dividido em páginas seguidas, com recorte múltiplo da linha', () => {
    const alturas = [30, 250, 10];
    const paginas = paginar(alturas, PAGINA, LINHA);
    expect(paginas.map((p) => p.partes)).toEqual([
      [{ bloco: 0, recorte: 0 }],
      [{ bloco: 1, recorte: 0 }],
      [{ bloco: 1, recorte: 100 }],
      [
        { bloco: 1, recorte: 200 },
        { bloco: 2, recorte: 0 },
      ],
    ]);
    const emFatias = todasAsPartes(paginas).filter((parte) => parte.bloco === 1);
    expect(emFatias.every((parte) => parte.recorte % LINHA === 0)).toBe(true);
  });

  it('FUN-75: a fatia é o maior múltiplo da linha que cabe na página (página de 90 px, linha de 20)', () => {
    const paginas = paginar([250], 90, LINHA);
    expect(paginas.map((p) => p.partes[0]!.recorte)).toEqual([0, 80, 160]);
  });

  it('FUN-75: nenhuma página passa da altura e as partes de cada bloco somam a altura dele', () => {
    const alturas = [20, 35, 90, 10, 260, 45, 0, 100, 5, 330];
    const paginas = paginar(alturas, PAGINA, LINHA);
    const porParte = alturasDasPartes(paginas, alturas);
    porParte.forEach((alturasDaPagina) => {
      expect(alturasDaPagina.reduce((soma, h) => soma + h, 0)).toBeLessThanOrEqual(PAGINA);
    });
    alturas.forEach((altura, bloco) => {
      const partes = todasAsPartes(paginas).filter((parte) => parte.bloco === bloco);
      expect(partes.length).toBeGreaterThan(0);
      expect(partes[0]!.recorte).toBe(0);
      const soma = paginas.flatMap((p, i) =>
        p.partes.map((parte, j) => (parte.bloco === bloco ? porParte[i]![j]! : 0)),
      );
      expect(soma.reduce((a, b) => a + b, 0)).toBe(altura);
    });
    // Ordem preservada: os índices de bloco nunca decrescem.
    const ordem = todasAsPartes(paginas).map((parte) => parte.bloco);
    expect(ordem).toEqual([...ordem].sort((a, b) => a - b));
  });

  it('FUN-75: nenhum bloco que cabe numa página é dividido', () => {
    const alturas = [20, 35, 90, 10, 100, 5, 60, 60];
    const partes = todasAsPartes(paginar(alturas, PAGINA, LINHA));
    expect(partes).toHaveLength(alturas.length);
    expect(partes.every((parte) => parte.recorte === 0)).toBe(true);
  });

  it('FUN-75: lista vazia dá uma página vazia', () => {
    expect(paginar([], PAGINA, LINHA)).toEqual([{ partes: [] }]);
  });

  it('FUN-75: alturas zero (ou inválidas) ocupam a mesma página, sem sumir', () => {
    const paginas = paginar([0, 0, Number.NaN, -5, Number.POSITIVE_INFINITY], PAGINA, LINHA);
    expect(paginas).toHaveLength(1);
    expect(paginas[0]!.partes.map((parte) => parte.bloco)).toEqual([0, 1, 2, 3, 4]);
  });

  it.each([
    ['página menor que uma linha', 10, 20],
    ['página de altura zero', 0, 20],
    ['página de altura inválida', Number.NaN, 20],
    ['página de altura infinita', Number.POSITIVE_INFINITY, 20],
    ['linha de altura zero', 100, 0],
    ['linha de altura inválida', 100, Number.NaN],
    ['linha negativa', 100, -3],
  ])(
    'FUN-75: %s termina e mostra uma página por bloco (design: tabela de erros)',
    (_caso, alturaPagina, alturaLinha) => {
      const paginas = paginar([5, 500, 5], alturaPagina, alturaLinha);
      expect(paginas.map((p) => p.partes)).toEqual([
        [{ bloco: 0, recorte: 0 }],
        [{ bloco: 1, recorte: 0 }],
        [{ bloco: 2, recorte: 0 }],
      ]);
    },
  );

  it('FUN-75: bloco enorme com linha pequena termina e as fatias seguem múltiplas da linha', () => {
    const paginas = paginar([100_000], 400, 1);
    expect(paginas).toHaveLength(250);
    expect(paginas.every((p, i) => p.partes[0]!.recorte === i * 400)).toBe(true);
  });
});

describe('localizar na paginação (FUN-70, FUN-83, FUN-85, FUN-86)', () => {
  // Nome com 20 px e versículos com 10 px, página de 100 px: a página 0 leva o nome e 8 versículos; as demais, 10.
  const blocos = blocosDoLivro(rute());
  const alturas = blocos.map((b) => (b.tipo === 'nomeLivro' ? 20 : 10));
  const paginas = paginar(alturas, 100, 10);
  const alvo = (capitulo: number, versiculo: number) => ({ ref: { livro: 8, capitulo }, versiculo });

  it('FUN-83: o versículo 1 do capítulo 1 está na página 0, junto do nome do livro', () => {
    expect(paginaDoVersiculo(paginas, blocos, alvo(1, 1))).toBe(0);
  });

  it('FUN-70: versículo no meio de uma página (1:12) e no início dela (1:9)', () => {
    expect(paginaDoVersiculo(paginas, blocos, alvo(1, 12))).toBe(1);
    expect(paginaDoVersiculo(paginas, blocos, alvo(1, 9))).toBe(1);
    expect(paginaDoVersiculo(paginas, blocos, alvo(1, 8))).toBe(0);
  });

  it('FUN-83: o capítulo 2 começa na página 2 (versículo global 23)', () => {
    expect(paginaDoVersiculo(paginas, blocos, alvo(2, 1))).toBe(2);
  });

  it('FUN-85: o primeiro versículo da página 0 pula o nome do livro', () => {
    expect(primeiroVersiculo(paginas[0]!, blocos)).toEqual(alvo(1, 1));
  });

  it('FUN-85: o primeiro versículo de cada página volta para a mesma página (ida e volta)', () => {
    paginas.forEach((pagina, indice) => {
      const primeiro = primeiroVersiculo(pagina, blocos);
      expect(primeiro).not.toBeNull();
      expect(paginaDoVersiculo(paginas, blocos, primeiro!)).toBe(indice);
    });
  });

  it('FUN-86: versículo dividido: a página dele é a da primeira fatia; a fatia seguinte tem o mesmo primeiro versículo', () => {
    const lista: Bloco[] = [
      { tipo: 'nomeLivro', livro: 8 },
      { tipo: 'versiculo', ref: { livro: 8, capitulo: 1 }, versiculo: 1, abreCapitulo: true },
      { tipo: 'versiculo', ref: { livro: 8, capitulo: 1 }, versiculo: 2, abreCapitulo: false },
      { tipo: 'versiculo', ref: { livro: 8, capitulo: 1 }, versiculo: 3, abreCapitulo: false },
    ];
    const listaPaginas = paginar([10, 30, 250, 10], 100, 20);
    // páginas: [nome, v1] [v2 0..100] [v2 100..200] [v2 200..250, v3]
    expect(listaPaginas).toHaveLength(4);
    expect(paginaDoVersiculo(listaPaginas, lista, alvo(1, 2))).toBe(1);
    expect(primeiroVersiculo(listaPaginas[2]!, lista)).toEqual(alvo(1, 2));
    expect(primeiroVersiculo(listaPaginas[3]!, lista)).toEqual(alvo(1, 2));
    expect(paginaDoVersiculo(listaPaginas, lista, alvo(1, 3))).toBe(3);
  });

  it('FUN-86: alvo inexistente cai na primeira página do capítulo (versículo 99 do capítulo 2)', () => {
    expect(paginaDoVersiculo(paginas, blocos, alvo(2, 99))).toBe(2);
  });

  it('FUN-86: alvo em capítulo ou livro inexistente cai na primeira página do livro', () => {
    expect(paginaDoVersiculo(paginas, blocos, alvo(9, 1))).toBe(0);
    expect(paginaDoVersiculo(paginas, blocos, { ref: { livro: 1, capitulo: 1 }, versiculo: 1 })).toBe(0);
    expect(paginaDoVersiculo(paginas, blocos, alvo(1, 0))).toBe(0);
  });

  it('FUN-85: página sem versículo (só o nome do livro, ou vazia) não tem primeiro versículo', () => {
    expect(primeiroVersiculo({ partes: [{ bloco: 0, recorte: 0 }] }, blocos)).toBeNull();
    expect(primeiroVersiculo({ partes: [] }, blocos)).toBeNull();
  });

  it('FUN-83: livro sem páginas ou sem blocos devolve a página 0', () => {
    expect(paginaDoVersiculo([{ partes: [] }], [], alvo(1, 1))).toBe(0);
  });
});

describe('versículo dividido em fatias (FUN-75, FUN-77, FUN-78, FUN-85)', () => {
  // Rute 1 de 6 versículos; o v. 3 mede 250 e a página 100 (linha de 20): o nome 40, v1 e v2 em P1; v3 em P2, P3 e P4
  // (fatias 0, 1 e 2, a última com v4 e v5); v6 em P5.
  const blocos = blocosDoLivro(livroComVersiculos(8, 'Rute', [6]));
  const alturas = [40, 20, 20, 250, 20, 20, 20];
  const paginas = paginar(alturas, 100, 20);

  it('a paginação de partida: cinco páginas, o v. 3 nas páginas 2, 3 e 4', () => {
    expect(paginas).toHaveLength(5);
    expect(paginas[1]!.partes.map((p) => p.bloco)).toEqual([3]);
    expect(paginas[2]!.partes.map((p) => p.bloco)).toEqual([3]);
    expect(paginas[3]!.partes.map((p) => p.bloco)).toEqual([3, 4, 5]);
  });

  it('alvoDaPagina: a primeira fatia não leva fatia; as de continuação levam o número da fatia', () => {
    const alvo = (i: number) => alvoDaPagina(paginas, blocos, i);
    expect(alvo(0)).toEqual({ ref: { livro: 8, capitulo: 1 }, versiculo: 1, fatia: 0 });
    expect(alvo(1)).toEqual({ ref: { livro: 8, capitulo: 1 }, versiculo: 3, fatia: 0 });
    expect(alvo(2)).toEqual({ ref: { livro: 8, capitulo: 1 }, versiculo: 3, fatia: 1 });
    expect(alvo(3)).toEqual({ ref: { livro: 8, capitulo: 1 }, versiculo: 3, fatia: 2 });
    expect(alvo(4)).toEqual({ ref: { livro: 8, capitulo: 1 }, versiculo: 6, fatia: 0 });
  });

  it('paginaDoVersiculo com fatia vai à página da fatia; sem fatia, à primeira', () => {
    const v3 = { ref: { livro: 8, capitulo: 1 }, versiculo: 3 };
    expect(paginaDoVersiculo(paginas, blocos, v3)).toBe(1);
    expect(paginaDoVersiculo(paginas, blocos, { ...v3, fatia: 1 })).toBe(2);
    expect(paginaDoVersiculo(paginas, blocos, { ...v3, fatia: 2 })).toBe(3);
  });

  it('FUN-86: fatia que não existe mais depois de repaginar cai na última fatia do versículo', () => {
    const v3 = { ref: { livro: 8, capitulo: 1 }, versiculo: 3, fatia: 2 };
    const larga = paginar(alturas, 300, 20); // o v. 3 (250) cabe inteiro: uma só fatia
    expect(paginaDoVersiculo(larga, blocos, v3)).toBe(paginaDoVersiculo(larga, blocos, { ...v3, fatia: 0 }));
  });
});
