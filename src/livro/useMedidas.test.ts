import { act, render } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Bloco } from './paginacao';
import { medirNoDom, useMedidas, type Medidas, type Medir } from './useMedidas';

/** `ResizeObserver` de mentira: o teste dispara os avisos; `observe` e `disconnect` ficam registrados. */
class ObservadorFalso {
  static todos: ObservadorFalso[] = [];
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  constructor(private readonly chamar: ResizeObserverCallback) {
    ObservadorFalso.todos.push(this);
  }
  avisar(largura: number, altura: number) {
    this.chamar([{ contentRect: { width: largura, height: altura } } as ResizeObserverEntry], this as never);
  }
}

const umBloco = (versiculo: number): Bloco => ({
  tipo: 'versiculo',
  ref: { livro: 8, capitulo: 1 },
  versiculo,
  abreCapitulo: versiculo === 1,
});
const LIVRO_A: Bloco[] = [{ tipo: 'nomeLivro', livro: 8 }, umBloco(1), umBloco(2)];
const LIVRO_B: Bloco[] = [{ tipo: 'nomeLivro', livro: 9 }, umBloco(1)];

/** `medir` que devolve medidas diferentes a cada chamada (altura da página 100, 200, ...), para ver qual valia. */
function medirContando() {
  let chamadas = 0;
  const medir = vi.fn<Medir>(() => {
    chamadas += 1;
    return { alturas: [10 * chamadas], alturaPagina: 100 * chamadas, alturaLinha: 20 };
  });
  return medir;
}

interface Props {
  blocos: Bloco[];
  chave: string | number;
  medir: Medir;
  comContenedor?: boolean;
}

/** Componente de teste: liga o contêiner invisível ao `ref` do hook e guarda tudo o que o hook devolveu. */
function montar(inicial: Props) {
  const devolvidos: (Medidas | null)[] = [];
  function Teste(props: Props) {
    const { ref, medidas } = useMedidas(props.blocos, props.chave, props.medir);
    devolvidos.push(medidas);
    return props.comContenedor === false ? null : createElement('div', { ref, 'data-testid': 'contenedor' });
  }
  const resultado = render(createElement(Teste, inicial));
  return {
    devolvidos,
    ultimo: () => devolvidos[devolvidos.length - 1],
    mudar: (props: Partial<Props>) => resultado.rerender(createElement(Teste, { ...inicial, ...props })),
    desmontar: () => resultado.unmount(),
    contenedor: () => resultado.queryByTestId('contenedor'),
  };
}

beforeEach(() => {
  ObservadorFalso.todos = [];
  vi.stubGlobal('ResizeObserver', ObservadorFalso);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useMedidas (FUN-75, FUN-86)', () => {
  it('FUN-86: medidas é null na primeira renderização e passa a valer depois da primeira medida', () => {
    const medir = medirContando();
    const tela = montar({ blocos: LIVRO_A, chave: 1, medir });
    expect(tela.devolvidos[0]).toBeNull();
    expect(tela.ultimo()).toEqual({ alturas: [10], alturaPagina: 100, alturaLinha: 20 });
  });

  it('FUN-86: mede ao montar, uma vez, com o contêiner do ref', () => {
    const medir = medirContando();
    const tela = montar({ blocos: LIVRO_A, chave: 1, medir });
    expect(medir).toHaveBeenCalledTimes(1);
    expect(medir).toHaveBeenCalledWith(tela.contenedor());
  });

  it('FUN-86: sem contêiner montado não mede e medidas segue null', () => {
    const medir = medirContando();
    const tela = montar({ blocos: LIVRO_A, chave: 1, medir, comContenedor: false });
    expect(medir).not.toHaveBeenCalled();
    expect(tela.ultimo()).toBeNull();
    expect(ObservadorFalso.todos).toHaveLength(0);
  });

  it('FUN-86: remede quando a chave (letra, tema) muda, e só então', () => {
    const medir = medirContando();
    const tela = montar({ blocos: LIVRO_A, chave: 'letra-3', medir });
    tela.mudar({ chave: 'letra-3' });
    expect(medir).toHaveBeenCalledTimes(1);
    tela.mudar({ chave: 'letra-4' });
    expect(medir).toHaveBeenCalledTimes(2);
    expect(tela.ultimo()?.alturaPagina).toBe(200);
    tela.mudar({ chave: 'letra-4-escuro' });
    expect(medir).toHaveBeenCalledTimes(3);
  });

  it('FUN-86: remede quando o livro (os blocos) muda e nunca entrega medidas do livro anterior', () => {
    const medir = medirContando();
    const tela = montar({ blocos: LIVRO_A, chave: 1, medir });
    const antes = tela.devolvidos.length;
    tela.mudar({ blocos: LIVRO_B });
    expect(medir).toHaveBeenCalledTimes(2);
    // Enquanto os blocos novos não foram medidos, o hook devolve null; nunca as medidas do livro anterior.
    const depois = tela.devolvidos.slice(antes);
    expect(depois[0]).toBeNull();
    expect(depois[depois.length - 1]?.alturaPagina).toBe(200);
  });

  it('FUN-86: observa o contêiner e remede no aviso de outro tamanho, não no aviso do mesmo tamanho', () => {
    const medir = medirContando();
    const tela = montar({ blocos: LIVRO_A, chave: 1, medir });
    const observador = ObservadorFalso.todos[0]!;
    expect(ObservadorFalso.todos).toHaveLength(1);
    expect(observador.observe).toHaveBeenCalledWith(tela.contenedor());

    // O primeiro aviso do navegador é o tamanho de agora, que já foi medido.
    act(() => observador.avisar(300, 400));
    expect(medir).toHaveBeenCalledTimes(1);
    act(() => observador.avisar(300, 400));
    expect(medir).toHaveBeenCalledTimes(1);
    act(() => observador.avisar(320, 400));
    expect(medir).toHaveBeenCalledTimes(2);
    act(() => observador.avisar(320, 400));
    expect(medir).toHaveBeenCalledTimes(2);
    act(() => observador.avisar(320, 380));
    expect(medir).toHaveBeenCalledTimes(3);
    expect(tela.ultimo()?.alturaPagina).toBe(300);
  });

  it('FUN-86: a chave nova não cria outro observador', () => {
    const tela = montar({ blocos: LIVRO_A, chave: 1, medir: medirContando() });
    tela.mudar({ chave: 2 });
    expect(ObservadorFalso.todos).toHaveLength(1);
  });

  it('desconecta o observador ao desmontar', () => {
    const tela = montar({ blocos: LIVRO_A, chave: 1, medir: medirContando() });
    const observador = ObservadorFalso.todos[0]!;
    expect(observador.disconnect).not.toHaveBeenCalled();
    tela.desmontar();
    expect(observador.disconnect).toHaveBeenCalledTimes(1);
  });

  it('sem ResizeObserver no navegador, mede ao montar e segue sem observar', () => {
    vi.stubGlobal('ResizeObserver', undefined);
    const medir = medirContando();
    const tela = montar({ blocos: LIVRO_A, chave: 1, medir });
    expect(medir).toHaveBeenCalledTimes(1);
    expect(tela.ultimo()).not.toBeNull();
  });
});

describe('medirNoDom (FUN-75)', () => {
  /** Contêiner de mentira: o jsdom não tem layout, então cada elemento diz a própria altura. */
  function contenedor(alturaPagina: number, alturasDosBlocos: number[], estilo: Partial<CSSStyleDeclaration> = {}) {
    const raiz = document.createElement('div');
    Object.assign(raiz.style, estilo);
    raiz.getBoundingClientRect = () => ({ height: alturaPagina }) as DOMRect;
    alturasDosBlocos.forEach((altura) => {
      const filho = document.createElement('p');
      filho.getBoundingClientRect = () => ({ height: altura }) as DOMRect;
      raiz.appendChild(filho);
    });
    document.body.appendChild(raiz);
    return raiz;
  }

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('lê a altura de cada bloco (um filho por bloco), a da página e a da linha em px', () => {
    const medidas = medirNoDom(contenedor(480, [24, 60, 36], { lineHeight: '24px', fontSize: '16px' }));
    expect(medidas).toEqual({ alturas: [24, 60, 36], alturaPagina: 480, alturaLinha: 24 });
  });

  it('FUN-75: a altura de cada bloco inclui as margens de cima e de baixo (o espaço entre versículos ocupa a página)', () => {
    const raiz = contenedor(480, [24, 60], { lineHeight: '24px', fontSize: '16px' });
    (raiz.children[0] as HTMLElement).style.marginBottom = '6px';
    (raiz.children[1] as HTMLElement).style.marginTop = '4px';
    (raiz.children[1] as HTMLElement).style.marginBottom = '6px';
    expect(medirNoDom(raiz).alturas).toEqual([30, 70]);
  });

  it('linha unitária (1.5) vale a letra vezes o número', () => {
    const medidas = medirNoDom(contenedor(480, [30], { lineHeight: '1.5', fontSize: '20px' }));
    expect(medidas.alturaLinha).toBe(30);
  });

  it('linha "normal" (ou ilegível) cai em 1,2 vez a letra', () => {
    const medidas = medirNoDom(contenedor(480, [30], { lineHeight: 'normal', fontSize: '20px' }));
    expect(medidas.alturaLinha).toBe(24);
  });

  it('contêiner sem filhos dá lista de alturas vazia', () => {
    expect(medirNoDom(contenedor(480, [], { lineHeight: '24px' })).alturas).toEqual([]);
  });
});
