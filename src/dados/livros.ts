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

let downloadEmAndamento: Promise<void> | null = null;

/**
 * Guarda em segundo plano os livros que faltam (FUN-33), um por vez, na ordem do índice, pulando os que já estão no
 * `mj-livros`. Casos limite:
 * - cache vazio: baixa os 66, em sequência; cache completo: nenhuma requisição;
 * - falha no meio (sem rede, erro do servidor): o laço para, o que já foi guardado fica, e a próxima chamada começa no
 *   livro que falhou; o erro é só registrado no console (nada visível para o leitor);
 * - chamada dupla ao mesmo tempo: a segunda recebe a mesma promessa, e nenhum livro é baixado duas vezes;
 * - sem Cache API: não faz nada (a leitura segue pela rede);
 * - ao terminar sem falha, pede `navigator.storage.persist()` se existir; ausente, negado ou com erro, segue igual.
 */
export function baixarFaltantes(indice: Indice = indiceGerado): Promise<void> {
  if (downloadEmAndamento) return downloadEmAndamento;
  downloadEmAndamento = baixar(indice).finally(() => {
    downloadEmAndamento = null;
  });
  return downloadEmAndamento;
}

async function baixar(indice: Indice): Promise<void> {
  const cache = await abrirCache();
  if (!cache) return;
  try {
    for (const entrada of indice.livros) {
      if (await cache.match(entrada.arquivo)) continue;
      await carregarLivro(entrada.numero, indice);
    }
  } catch (erro) {
    console.warn('Download dos livros interrompido; continua na próxima abertura com rede.', erro);
    return;
  }
  await pedirPersistencia();
}

async function pedirPersistencia(): Promise<void> {
  try {
    await globalThis.navigator?.storage?.persist?.();
  } catch {
    // Sem persistência, o navegador pode apagar o cache; o texto se baixa de novo com rede.
  }
}

/**
 * Apaga do `mj-livros` toda URL que não está no índice atual (FUN-33, FUN-37): um texto novo gera um nome novo, e os
 * arquivos de versões antigas não ficam ocupando espaço. Cache vazio ou ausente não falha; erro ao apagar uma entrada
 * não impede as outras.
 */
export async function limparAntigos(indice: Indice = indiceGerado): Promise<void> {
  const cache = await abrirCache();
  if (!cache) return;
  const atuais = new Set(indice.livros.map((l) => l.arquivo));
  let pedidos: readonly Request[];
  try {
    pedidos = await cache.keys();
  } catch {
    return;
  }
  for (const pedido of pedidos) {
    const caminho = new URL(pedido.url, 'http://localhost').pathname;
    if (atuais.has(caminho)) continue;
    try {
      await cache.delete(pedido);
    } catch {
      // Fica para a próxima abertura.
    }
  }
}
