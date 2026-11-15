import { vi } from 'vitest';

/**
 * Dublê da Cache API para os testes de `livros.ts`: um mapa por nome de cache, chaveado pelo caminho da URL.
 * Guarda o corpo como texto e devolve uma `Response` nova a cada `match`. Só é importado por testes.
 */
export function criarDubleCaches() {
  const caches = new Map<string, Map<string, string>>();
  const caminho = (pedido: RequestInfo | URL) =>
    new URL(typeof pedido === 'string' ? pedido : pedido instanceof URL ? pedido.href : pedido.url, 'http://localhost')
      .pathname;

  const abrir = (nome: string) => {
    if (!caches.has(nome)) caches.set(nome, new Map());
    const mapa = caches.get(nome)!;
    return {
      match: vi.fn(async (pedido: RequestInfo | URL) => {
        const corpo = mapa.get(caminho(pedido));
        return corpo === undefined
          ? undefined
          : new Response(corpo, { headers: { 'content-type': 'application/json' } });
      }),
      put: vi.fn(async (pedido: RequestInfo | URL, resposta: Response) => {
        mapa.set(caminho(pedido), await resposta.text());
      }),
      keys: vi.fn(async () => [...mapa.keys()].map((p) => ({ url: `http://localhost${p}` }) as Request)),
      delete: vi.fn(async (pedido: RequestInfo | URL) => mapa.delete(caminho(pedido))),
    };
  };

  const abertos = new Map<string, ReturnType<typeof abrir>>();
  const storage = {
    open: vi.fn(async (nome: string) => {
      if (!abertos.has(nome)) abertos.set(nome, abrir(nome));
      return abertos.get(nome)!;
    }),
  };

  return {
    storage,
    /** O cache aberto (cria se preciso), para semear e inspecionar. */
    cache: (nome: string) => {
      if (!abertos.has(nome)) abertos.set(nome, abrir(nome));
      return abertos.get(nome)!;
    },
    /** Caminhos guardados no cache `nome`. */
    caminhos: (nome: string) => [...(caches.get(nome)?.keys() ?? [])],
  };
}

/** Corpo JSON de um livro fictício, para respostas do dublê de `fetch`. */
export function respostaLivro(numero: number): Response {
  return new Response(JSON.stringify({ numero, nome: `Livro ${numero}`, capitulos: [['v1']] }), { status: 200 });
}
