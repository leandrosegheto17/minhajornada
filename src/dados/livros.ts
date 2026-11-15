import { indice as indiceGerado } from '../biblia/indice';
import type { Indice, Livro } from '../biblia/tipos';

/**
 * Livros no aparelho (AD-002; FUN-33, FUN-34, FUN-36, FUN-37). O service worker precacheia só o app; os livros ficam
 * no cache `mj-livros`, gerido aqui, um arquivo por livro com hash no nome. Toda requisição é para o próprio site
 * (`/livros/...`, FUN-41).
 */
export const CACHE_LIVROS = 'mj-livros';

/** Sem rede e sem o livro no cache (FUN-36). */
export class LivroNaoBaixado extends Error {
  readonly numero: number;

  constructor(numero: number) {
    super(`livro ${numero} ainda não foi baixado`);
    this.name = 'LivroNaoBaixado';
    this.numero = numero;
  }
}

async function abrirCache(): Promise<Cache | null> {
  try {
    return (await globalThis.caches?.open(CACHE_LIVROS)) ?? null;
  } catch {
    return null;
  }
}

function arquivoDo(numero: number, indice: Indice): string {
  const entrada = indice.livros[numero - 1];
  if (!entrada) throw new Error(`livro ${numero} fora do índice`);
  return entrada.arquivo;
}

/**
 * Livro pelo cache ou pela rede (FUN-34, FUN-36): no cache, não toca a rede; fora dele, busca só o arquivo desse
 * livro e o guarda. Cache indisponível ou `put` que falha não impedem a leitura pela rede. Sem rede e sem cache,
 * lança `LivroNaoBaixado`.
 */
export async function carregarLivro(numero: number, indice: Indice = indiceGerado): Promise<Livro> {
  const url = arquivoDo(numero, indice);
  const cache = await abrirCache();
  if (cache) {
    try {
      const guardada = await cache.match(url);
      if (guardada) return (await guardada.json()) as Livro;
    } catch {
      // Cache ilegível: segue pela rede.
    }
  }

  let resposta: Response;
  try {
    resposta = await fetch(url);
  } catch {
    throw new LivroNaoBaixado(numero);
  }
  if (!resposta.ok) throw new LivroNaoBaixado(numero);

  if (cache) {
    try {
      await cache.put(url, resposta.clone());
    } catch {
      // Cota cheia ou Cache API recusada: lê pela rede mesmo assim.
    }
  }
  return (await resposta.json()) as Livro;
}
