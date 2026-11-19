import type { ArquivoCorrecoes, ItemCorrecao, RefVersiculo } from './arquivo.ts';
import type { Livro } from '../tipos.ts';

/** "Gênesis 1:2"; livro fora da lista vira "livro 99 1:1". */
export function nomeRef(livros: Livro[], ref: RefVersiculo): string {
  const livro = livros.find((l) => l.numero === ref.livro);
  return `${livro?.nome ?? `livro ${ref.livro}`} ${ref.capitulo}:${ref.versiculo}`;
}

/** Onde o trecho aparece, se aparece exatamente uma vez no texto (inclusive sem contar com sobreposição); senão `null`. */
export function posicaoUnica(texto: string, trecho: string): number | null {
  const primeira = texto.indexOf(trecho);
  if (primeira < 0 || texto.indexOf(trecho, primeira + 1) >= 0) return null;
  return primeira;
}

/** Colchetes de itálico em pares, sem aninhar (a mesma forma que `segmentar` lê). */
export function colchetesEmPares(texto: string): boolean {
  let aberto = false;
  for (const caractere of texto) {
    if (caractere === '[') {
      if (aberto) return false;
      aberto = true;
    } else if (caractere === ']') {
      if (!aberto) return false;
      aberto = false;
    }
  }
  return !aberto;
}

function versiculoDe(livros: Livro[], ref: RefVersiculo): string | undefined {
  return livros.find((l) => l.numero === ref.livro)?.capitulos[ref.capitulo - 1]?.[ref.versiculo - 1];
}

/**
 * Recusa o arquivo de correções antes de gerar qualquer livro: id repetido, referência inexistente, colchete sem par
 * (FUN-125, FUN-126), aprovada que não confere com a fonte (FUN-115) e aprovadas sobrepostas (FUN-107). Proposta e
 * recusada que não conferem não derrubam; só a aprovada vai ao texto. Lança na primeira falha.
 */
export function validarCorrecoes(arquivo: ArquivoCorrecoes, livros: Livro[]): void {
  const ids = new Set<string>();
  const aprovadas = new Map<string, { item: ItemCorrecao; inicio: number }[]>();

  for (const item of arquivo.itens) {
    if (ids.has(item.id)) throw new Error(`correção ${item.id}: identificador repetido`);
    ids.add(item.id);

    const versiculo = versiculoDe(livros, item.ref);
    if (versiculo === undefined) {
      throw new Error(`correção ${item.id}: referência ${nomeRef(livros, item.ref)} não existe`);
    }

    const inicio = posicaoUnica(versiculo, item.antes);
    // O versículo corrigido precisa ficar em pares; sem trecho único para aplicar, vale o "depois" sozinho. Versículo
    // da fonte que já estava sem par não é culpa da correção.
    const corrigido =
      inicio === null
        ? item.depois
        : versiculo.slice(0, inicio) + item.depois + versiculo.slice(inicio + item.antes.length);
    if (!colchetesEmPares(corrigido) && (inicio === null || colchetesEmPares(versiculo))) {
      throw new Error(`correção ${item.id}: colchete de itálico sem par`);
    }

    if (item.estado !== 'aprovada') continue;
    if (inicio === null) throw new Error(`correção ${item.id} não confere com ${nomeRef(livros, item.ref)}`);
    const chave = `${item.ref.livro}:${item.ref.capitulo}:${item.ref.versiculo}`;
    aprovadas.set(chave, [...(aprovadas.get(chave) ?? []), { item, inicio }]);
  }

  for (const doVersiculo of aprovadas.values()) {
    doVersiculo.forEach((a, i) => {
      for (const b of doVersiculo.slice(i + 1)) {
        const fimA = a.inicio + a.item.antes.length;
        const fimB = b.inicio + b.item.antes.length;
        if (a.inicio < fimB && b.inicio < fimA) {
          const onde = nomeRef(livros, a.item.ref);
          throw new Error(`correções ${a.item.id} e ${b.item.id} se sobrepõem em ${onde}`);
        }
      }
    });
  }
}
