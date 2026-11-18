import type { Livro, Ref } from '../biblia/tipos';

/**
 * Paginação do modo livro (design: "Paginação"): funções puras. As alturas vêm de fora (medidas no navegador por
 * `useMedidas`, ou inventadas nos testes), porque o jsdom não tem layout.
 */

export type Bloco =
  { tipo: 'nomeLivro'; livro: number } | { tipo: 'versiculo'; ref: Ref; versiculo: number; abreCapitulo: boolean };

/** Parte de um bloco numa página: `recorte` é quanto do topo do bloco já saiu nas páginas anteriores (0 = inteiro). */
export interface Pagina {
  partes: { bloco: number; recorte: number }[];
}

export interface AlvoVersiculo {
  ref: Ref;
  versiculo: number;
  /**
   * Fatia do versículo dividido entre páginas (0 = a primeira, que é a padrão). Não é número de página: só distingue,
   * entre as páginas do mesmo versículo, qual é a que a âncora mostra (FUN-77, FUN-78, FUN-85).
   */
  fatia?: number;
}

/**
 * Blocos do livro (FUN-76): o nome do livro e depois todos os versículos na ordem; o versículo 1 de cada capítulo
 * leva `abreCapitulo`, e a tela escreve o número do capítulo antes dele. Capítulo sem versículos não gera bloco.
 */
export function blocosDoLivro(livro: Livro): Bloco[] {
  const blocos: Bloco[] = [{ tipo: 'nomeLivro', livro: livro.numero }];
  livro.capitulos.forEach((versiculos, c) => {
    versiculos.forEach((_, v) => {
      blocos.push({
        tipo: 'versiculo',
        ref: { livro: livro.numero, capitulo: c + 1 },
        versiculo: v + 1,
        abreCapitulo: v === 0,
      });
    });
  });
  return blocos;
}

/** Folga para o arredondamento do navegador: 99,99 px num espaço de 100 px cabe. */
const FOLGA = 0.01;

/** Altura que pode entrar na soma: finita e não negativa; qualquer outra vale 0 (o bloco não some, só não ocupa). */
function alturaUtil(altura: number): number {
  return Number.isFinite(altura) && altura > 0 ? altura : 0;
}

/**
 * Agrupa blocos em páginas (FUN-75), de forma gulosa: põe blocos inteiros enquanto cabem; o que não cabe no resto da
 * página abre a seguinte. Um bloco que não cabe nem numa página vazia começa uma página nova e é dividido em fatias
 * de altura múltipla de `alturaLinha` (a última leva o que sobra, e os blocos seguintes continuam nela).
 *
 * Entradas que impedem a conta (altura da página ou da linha inválida, ou página menor que uma linha) dão uma página
 * por bloco: o texto aparece, ainda que apertado, e a função termina. Lista vazia dá uma página vazia.
 */
export function paginar(alturas: number[], alturaPagina: number, alturaLinha: number): Pagina[] {
  if (alturas.length === 0) return [{ partes: [] }];

  const valida =
    Number.isFinite(alturaPagina) && Number.isFinite(alturaLinha) && alturaLinha > 0 && alturaPagina >= alturaLinha;
  if (!valida) return alturas.map((_, bloco) => ({ partes: [{ bloco, recorte: 0 }] }));

  const fatia = Math.floor(alturaPagina / alturaLinha) * alturaLinha;
  const paginas: Pagina[] = [];
  let atual: Pagina = { partes: [] };
  let usado = 0;

  const fechar = () => {
    if (atual.partes.length > 0) paginas.push(atual);
    atual = { partes: [] };
    usado = 0;
  };

  alturas.forEach((bruta, bloco) => {
    const altura = alturaUtil(bruta);
    if (altura <= alturaPagina - usado + FOLGA) {
      atual.partes.push({ bloco, recorte: 0 });
      usado += altura;
      return;
    }
    fechar();
    if (altura <= alturaPagina + FOLGA) {
      atual.partes.push({ bloco, recorte: 0 });
      usado = altura;
      return;
    }
    // Maior que a página: fatias de `fatia` px, cada uma numa página; a última leva o resto.
    let recorte = 0;
    while (altura - recorte > alturaPagina + FOLGA) {
      atual.partes.push({ bloco, recorte });
      recorte += fatia;
      fechar();
    }
    atual.partes.push({ bloco, recorte });
    usado = altura - recorte;
  });

  // `fechar` só empurra página com partes; a última fica em `atual`.
  paginas.push(atual);
  return paginas;
}

/** Primeira página do capítulo (a do versículo 1), ou `null` se o capítulo não está nos blocos. */
function paginaDoCapitulo(paginas: Pagina[], blocos: Bloco[], ref: Ref): number | null {
  const indice = blocos.findIndex(
    (b) => b.tipo === 'versiculo' && b.ref.livro === ref.livro && b.ref.capitulo === ref.capitulo && b.abreCapitulo,
  );
  if (indice < 0) return null;
  const pagina = paginas.findIndex((p) => p.partes.some((parte) => parte.bloco === indice));
  return pagina < 0 ? null : pagina;
}

/**
 * Página onde o versículo começa (um versículo dividido fica na página da primeira fatia). Alvo que não existe
 * (versículo ou capítulo fora do livro) cai na primeira página do capítulo, e se o capítulo também não existe, na
 * primeira página do livro (FUN-83, FUN-86).
 */
export function paginaDoVersiculo(paginas: Pagina[], blocos: Bloco[], alvo: AlvoVersiculo): number {
  const indice = blocos.findIndex(
    (b) =>
      b.tipo === 'versiculo' &&
      b.ref.livro === alvo.ref.livro &&
      b.ref.capitulo === alvo.ref.capitulo &&
      b.versiculo === alvo.versiculo,
  );
  if (indice >= 0) {
    const doBloco = paginas.flatMap((p, i) => (p.partes.some((parte) => parte.bloco === indice) ? [i] : []));
    // Fatia que não existe mais (a paginação mudou): a última do versículo (FUN-86).
    const alvoFatia = Math.min(Math.max(alvo.fatia ?? 0, 0), doBloco.length - 1);
    if (doBloco.length > 0) return doBloco[alvoFatia]!;
  }
  return paginaDoCapitulo(paginas, blocos, alvo.ref) ?? 0;
}

/**
 * O primeiro versículo da página `indice` com o número da fatia (0 se a página traz o começo do versículo, 1 ou mais se
 * traz uma continuação); `null` se a página não tem versículo (FUN-85).
 */
export function alvoDaPagina(paginas: Pagina[], blocos: Bloco[], indice: number): Required<AlvoVersiculo> | null {
  const pagina = paginas[indice];
  if (!pagina) return null;
  const parte = pagina.partes.find((p) => blocos[p.bloco]?.tipo === 'versiculo');
  const bloco = parte ? blocos[parte.bloco] : undefined;
  if (!parte || bloco?.tipo !== 'versiculo') return null;
  const fatia = paginas
    .slice(0, indice)
    .filter((anterior) => anterior.partes.some((p) => p.bloco === parte.bloco)).length;
  return { ref: bloco.ref, versiculo: bloco.versiculo, fatia };
}

/**
 * Primeiro versículo da página (FUN-85): o nome do livro não conta, e a fatia de um versículo dividido conta como o
 * versículo dele. `null` na página sem versículo (vazia, ou só com o nome do livro).
 */
export function primeiroVersiculo(pagina: Pagina, blocos: Bloco[]): AlvoVersiculo | null {
  for (const parte of pagina.partes) {
    const bloco = blocos[parte.bloco];
    if (bloco?.tipo === 'versiculo') return { ref: bloco.ref, versiculo: bloco.versiculo };
  }
  return null;
}
