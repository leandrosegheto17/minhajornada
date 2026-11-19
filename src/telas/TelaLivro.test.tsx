import { fireEvent, render, screen, within } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { useReducer } from 'react';
import { indice } from '../biblia/indice';
import { ESTADO_INICIAL, reduzirLeitor, type AcaoLeitor } from '../estado/leitor';
import type { Livro } from '../biblia/tipos';
import type { CargaLivro } from '../estado/useLeitor';
import type { Medir } from '../livro/useMedidas';
import { MENSAGEM_NAO_BAIXADO } from './TelaLeitor';
import { TelaLivro } from './TelaLivro';

const numero = (nome: string) => indice.livros.find((l) => l.nome === nome)!.numero;
const RUTE = numero('Rute');
const APOCALIPSE = numero('Apocalipse');

/** Livro de mentira com um capítulo de 6 versículos. */
function livroFalso(n: number): Livro {
  const nome = indice.livros[n - 1]!.nome;
  return { numero: n, nome, capitulos: [Array.from({ length: 6 }, (_, v) => `Texto de ${nome} 1:${v + 1}`)] };
}

const pronto = (n: number): CargaLivro => ({ situacao: 'pronto', numero: n, livro: livroFalso(n) });

// Medida injetada (o jsdom não tem layout): o nome do livro tem 40, cada versículo 20 e a página 100 (linha de 20).
// Páginas: [nome, 1, 2, 3] e [4, 5, 6].
const medir: Medir = (contenedor) => ({
  alturas: Array.from(contenedor.children, (_, i) => (i === 0 ? 40 : 20)),
  alturaPagina: 100,
  alturaLinha: 20,
});

type Props = ComponentProps<typeof TelaLivro>;

function renderizar(extra: Partial<Props> = {}) {
  const props: Props = {
    ancora: { tipo: 'texto', ref: { livro: RUTE, capitulo: 1 }, versiculo: 1 },
    carga: pronto(RUTE),
    larga: false,
    letra: 3,
    aoIrParaAncora: vi.fn(),
    aoTocarTitulo: vi.fn(),
    aoEscolherOutroLivro: vi.fn(),
    aoQueroSaber: vi.fn(),
    medir,
    ...extra,
  };
  render(<TelaLivro {...props} />);
  return props;
}

const texto = (livro: number, versiculo: number) => ({
  tipo: 'texto' as const,
  ref: { livro, capitulo: 1 },
  versiculo,
});
const seguinte = () => screen.getByRole('button', { name: 'Página seguinte' });
const anterior = () => screen.getByRole('button', { name: 'Página anterior' });

describe('folhear com os botões (FUN-77, FUN-78, FUN-81, FUN-91)', () => {
  it('FUN-77: "seguinte" vai para o primeiro versículo da página seguinte', () => {
    const props = renderizar();
    expect(screen.getByRole('article', { name: 'Página 1 de Rute' })).toBeInTheDocument();
    fireEvent.click(seguinte());
    expect(props.aoIrParaAncora).toHaveBeenCalledWith(texto(RUTE, 4));
  });

  it('FUN-78: "anterior" volta ao primeiro versículo da página anterior', () => {
    const props = renderizar({ ancora: texto(RUTE, 4) });
    expect(screen.getByRole('article', { name: 'Página 2 de Rute' })).toBeInTheDocument();
    fireEvent.click(anterior());
    expect(props.aoIrParaAncora).toHaveBeenCalledWith(texto(RUTE, 1));
  });

  it('FUN-82: "seguinte" na última página vai ao versículo 1 do livro seguinte', () => {
    const props = renderizar({ ancora: texto(RUTE, 4) });
    fireEvent.click(seguinte());
    expect(props.aoIrParaAncora).toHaveBeenCalledWith(texto(RUTE + 1, 1));
  });

  it('FUN-78: "anterior" na primeira página vai ao fim do livro anterior', () => {
    const props = renderizar();
    fireEvent.click(anterior());
    expect(props.aoIrParaAncora).toHaveBeenCalledWith({ tipo: 'fim', livro: RUTE - 1 });
  });

  it('FUN-81: na última página de Apocalipse, "seguinte" fica desativado', () => {
    const props = renderizar({ ancora: texto(APOCALIPSE, 4), carga: pronto(APOCALIPSE) });
    expect(seguinte()).toBeDisabled();
    expect(anterior()).toBeEnabled();
    fireEvent.click(seguinte());
    expect(props.aoIrParaAncora).not.toHaveBeenCalled();
  });

  it('FUN-91: na capa, "anterior" fica desativado e "seguinte" vai ao plano de estudo (tela estreita)', () => {
    const props = renderizar({ ancora: { tipo: 'capa' }, carga: null });
    expect(anterior()).toBeDisabled();
    fireEvent.click(seguinte());
    expect(props.aoIrParaAncora).toHaveBeenCalledWith({ tipo: 'pago' });
  });

  it('FUN-90: em Gênesis 1, "anterior" na tela estreita vai ao plano pago e, na larga, à capa', () => {
    const gen = renderizar({ ancora: texto(1, 1), carga: pronto(1) });
    fireEvent.click(anterior());
    expect(gen.aoIrParaAncora).toHaveBeenCalledWith({ tipo: 'pago' });
  });
});

describe('folhear com o deslize (FUN-79, FUN-80)', () => {
  function deslizar(dx: number, tipo = 'touch') {
    const area = screen.getByRole('main');
    fireEvent.pointerDown(area, { pointerId: 1, pointerType: tipo, isPrimary: true, clientX: 200, clientY: 300 });
    fireEvent.pointerUp(area, { pointerId: 1, pointerType: tipo, isPrimary: true, clientX: 200 + dx, clientY: 300 });
  }

  it('FUN-79: deslizar 60 px da direita para a esquerda passa a página', () => {
    const props = renderizar();
    deslizar(-60);
    expect(props.aoIrParaAncora).toHaveBeenCalledWith(texto(RUTE, 4));
  });

  it('FUN-79: deslizar 59 px não passa a página', () => {
    const props = renderizar();
    deslizar(-59);
    expect(props.aoIrParaAncora).not.toHaveBeenCalled();
  });

  it('FUN-80: deslizar 60 px da esquerda para a direita volta a página', () => {
    const props = renderizar({ ancora: texto(RUTE, 4) });
    deslizar(60);
    expect(props.aoIrParaAncora).toHaveBeenCalledWith(texto(RUTE, 1));
  });

  it('o mouse não desliza (selecionar texto não passa página)', () => {
    const props = renderizar();
    deslizar(-100, 'mouse');
    expect(props.aoIrParaAncora).not.toHaveBeenCalled();
  });
});

describe('título, páginas visíveis e estados (FUN-73, FUN-84, FUN-87)', () => {
  it('FUN-84: o título "Rute 1" abre a grade de capítulos', () => {
    const props = renderizar();
    fireEvent.click(screen.getByRole('button', { name: 'Rute 1. Escolher outro capítulo' }));
    expect(props.aoTocarTitulo).toHaveBeenCalledTimes(1);
  });

  it('FUN-74: na tela estreita, uma página só', () => {
    renderizar();
    expect(screen.getAllByRole('article')).toHaveLength(1);
    expect(screen.getByText('Rute, página 1 de 2')).toBeInTheDocument();
  });

  it('FUN-73: na tela larga, duas páginas', () => {
    renderizar({ larga: true });
    expect(screen.getAllByRole('article')).toHaveLength(2);
    expect(screen.getByText('Rute, páginas 1 e 2 de 2')).toBeInTheDocument();
  });

  it('FUN-87: sem rede e fora do cache, mostra a mensagem e "Escolher outro livro"', () => {
    const props = renderizar({ carga: { situacao: 'naoBaixado', numero: RUTE } });
    expect(screen.getByText(MENSAGEM_NAO_BAIXADO)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Escolher outro livro' }));
    expect(props.aoEscolherOutroLivro).toHaveBeenCalledTimes(1);
  });

  it('enquanto o livro carrega, mostra o carregando e nenhuma página', () => {
    renderizar({ carga: { situacao: 'carregando', numero: RUTE } });
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByRole('article')).toBeNull();
  });

  it('FUN-85: a âncora "fim" é resolvida na última página depois de paginar', () => {
    const props = renderizar({ ancora: { tipo: 'fim', livro: RUTE } });
    expect(props.aoIrParaAncora).toHaveBeenCalledWith(texto(RUTE, 4));
  });

  it('FUN-92: no plano pago, "Quero saber" dispara a ação', () => {
    const props = renderizar({ ancora: { tipo: 'pago' }, carga: null });
    fireEvent.click(screen.getByRole('button', { name: 'Quero saber' }));
    expect(props.aoQueroSaber).toHaveBeenCalledTimes(1);
  });

  it('FUN-89: na tela larga, o plano pago e a capa aparecem juntos', () => {
    renderizar({ ancora: { tipo: 'capa' }, carga: null, larga: true });
    expect(screen.getByRole('article', { name: 'Capa' })).toBeInTheDocument();
    expect(screen.getByRole('article', { name: 'Plano de estudo' })).toBeInTheDocument();
  });
});

describe('lugar no livro e capa (FUN-82, FUN-85, FUN-86, FUN-89, FUN-90)', () => {
  /** Livro de mentira com um capítulo de 12 versículos de uma linha cada. */
  const livroLongo = (n: number): CargaLivro => ({
    situacao: 'pronto',
    numero: n,
    livro: {
      numero: n,
      nome: indice.livros[n - 1]!.nome,
      capitulos: [Array.from({ length: 12 }, (_, v) => `Texto de ${indice.livros[n - 1]!.nome} 1:${v + 1}`)],
    },
  });
  const medirComPagina =
    (alturaPagina: number): Medir =>
    (contenedor) => ({
      alturas: Array.from(contenedor.children, (_, i) => (i === 0 ? 40 : 20)),
      alturaPagina,
      alturaLinha: 20,
    });

  it('FUN-86: com a medida nova, o versículo da âncora (Rute 1:12) continua visível', () => {
    const ancora = texto(RUTE, 12);
    const props: Props = {
      ancora,
      carga: livroLongo(RUTE),
      larga: false,
      letra: 3,
      aoIrParaAncora: vi.fn(),
      aoTocarTitulo: vi.fn(),
      aoEscolherOutroLivro: vi.fn(),
      aoQueroSaber: vi.fn(),
      medir: medirComPagina(100),
    };
    const { rerender } = render(<TelaLivro {...props} />);
    // Página de 100: [nome, 1-3], [4-8], [9-12].
    expect(
      within(screen.getByRole('article', { name: 'Página 3 de Rute' })).getByText('Texto de Rute 1:12'),
    ).toBeVisible();
    rerender(<TelaLivro {...props} letra={1} medir={medirComPagina(200)} />);
    // Página de 200: [nome, 1-8], [9-12]: o 1:12 está agora na página 2.
    expect(
      within(screen.getByRole('article', { name: 'Página 2 de Rute' })).getByText('Texto de Rute 1:12'),
    ).toBeVisible();
    expect(props.aoIrParaAncora).not.toHaveBeenCalled();
  });

  it('FUN-82: a âncora "fim" de Rute mostra a última página', () => {
    const props = renderizar({ ancora: { tipo: 'fim', livro: RUTE } });
    expect(screen.getByRole('article', { name: 'Página 2 de Rute' })).toBeInTheDocument();
    expect(props.aoIrParaAncora).toHaveBeenCalledWith(texto(RUTE, 4));
  });

  it('âncora "fim" com o livro ainda carregando: espera, sem despachar nada', () => {
    const props = renderizar({ ancora: { tipo: 'fim', livro: RUTE }, carga: { situacao: 'carregando', numero: RUTE } });
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(props.aoIrParaAncora).not.toHaveBeenCalled();
  });

  it('FUN-85: mudar de página despacha a âncora do primeiro versículo da página nova', () => {
    const props = renderizar({ carga: livroLongo(RUTE) });
    fireEvent.click(seguinte());
    expect(props.aoIrParaAncora).toHaveBeenCalledWith(texto(RUTE, 4));
  });

  it('FUN-90: na tela estreita, a capa aparece sozinha (sem o plano pago)', () => {
    renderizar({ ancora: { tipo: 'capa' }, carga: null, larga: false });
    expect(screen.getByRole('article', { name: 'Capa' })).toBeInTheDocument();
    expect(screen.queryByRole('article', { name: 'Plano de estudo' })).toBeNull();
  });

  it('FUN-89: ao passar da larga para a estreita na capa, o plano pago sai e fica só a capa', () => {
    const props: Props = {
      ancora: { tipo: 'capa' },
      carga: null,
      larga: true,
      letra: 3,
      aoIrParaAncora: vi.fn(),
      aoTocarTitulo: vi.fn(),
      aoEscolherOutroLivro: vi.fn(),
      aoQueroSaber: vi.fn(),
      medir,
    };
    const { rerender } = render(<TelaLivro {...props} />);
    expect(screen.getAllByRole('article')).toHaveLength(2);
    rerender(<TelaLivro {...props} larga={false} />);
    expect(screen.getAllByRole('article')).toHaveLength(1);
    expect(screen.getByRole('article', { name: 'Capa' })).toBeInTheDocument();
  });
});

describe('letra nova repagina (FUN-86; AD-008)', () => {
  it('FUN-86: ao mudar a letra a tela remede e repagina, mantendo a página do versículo da âncora', () => {
    // Mesma função `medir` nos dois renders: só a letra muda. Na segunda medida os versículos ficam mais altos.
    let chamadas = 0;
    const medirPorLetra: Medir = (contenedor) => {
      chamadas += 1;
      const alto = chamadas > 1;
      return {
        alturas: Array.from(contenedor.children, (_, i) => (i === 0 ? 40 : alto ? 40 : 20)),
        alturaPagina: 100,
        alturaLinha: 20,
      };
    };
    const props: Props = {
      ancora: texto(RUTE, 4),
      carga: pronto(RUTE),
      larga: false,
      letra: 3,
      aoIrParaAncora: vi.fn(),
      aoTocarTitulo: vi.fn(),
      aoEscolherOutroLivro: vi.fn(),
      aoQueroSaber: vi.fn(),
      medir: medirPorLetra,
    };
    const { rerender } = render(<TelaLivro {...props} />);
    // Letra 3: páginas [nome, 1, 2, 3] e [4, 5, 6]; o versículo 4 está na página 2 de 2.
    expect(chamadas).toBe(1);
    expect(screen.getByRole('article', { name: 'Página 2 de Rute' })).toBeInTheDocument();

    rerender(<TelaLivro {...props} letra={4} />);
    // Letra 4: [nome, 1], [2, 3], [4, 5] e [6]; o versículo 4 passa para a página 3.
    expect(chamadas).toBe(2);
    expect(screen.getByRole('article', { name: 'Página 3 de Rute' })).toBeInTheDocument();
  });
});

describe('versículo maior que a página (FUN-75, FUN-77, FUN-78, FUN-85)', () => {
  // Páginas: P1 [nome, v1, v2], P2 [v3 fatia 0], P3 [v3 fatia 1], P4 [v3 fatia 2, v4, v5], P5 [v6].
  const medirDividido: Medir = (contenedor) => ({
    alturas: Array.from(contenedor.children, (_, i) => (i === 0 ? 40 : i === 3 ? 250 : 20)),
    alturaPagina: 100,
    alturaLinha: 20,
  });
  const comFatia = (versiculo: number, fatia: number) => ({ ...texto(RUTE, versiculo), fatia });
  const dividido = (ancora: Props['ancora']) => renderizar({ ancora, medir: medirDividido });

  it('FUN-77: "seguinte" passa pelas três fatias do versículo e chega ao versículo seguinte', () => {
    const p2 = dividido(texto(RUTE, 3));
    fireEvent.click(seguinte());
    expect(p2.aoIrParaAncora).toHaveBeenCalledWith(comFatia(3, 1));
  });

  it('FUN-77: da segunda fatia, "seguinte" vai à terceira', () => {
    const p3 = dividido(comFatia(3, 1));
    fireEvent.click(seguinte());
    expect(p3.aoIrParaAncora).toHaveBeenCalledWith(comFatia(3, 2));
  });

  it('FUN-77: da última fatia, "seguinte" vai ao primeiro versículo da página seguinte', () => {
    const p4 = dividido(comFatia(3, 2));
    fireEvent.click(seguinte());
    expect(p4.aoIrParaAncora).toHaveBeenCalledWith(texto(RUTE, 6));
  });

  it('FUN-78: "anterior" volta pelas fatias, e da primeira volta ao versículo sem fatia', () => {
    const p4 = dividido(comFatia(3, 2));
    fireEvent.click(anterior());
    expect(p4.aoIrParaAncora).toHaveBeenCalledWith(comFatia(3, 1));
  });

  it('FUN-78: "anterior" da segunda fatia vai à primeira (âncora sem o campo de fatia)', () => {
    const p3 = dividido(comFatia(3, 1));
    fireEvent.click(anterior());
    expect(p3.aoIrParaAncora).toHaveBeenCalledWith(texto(RUTE, 3));
  });

  it('FUN-77: ligado ao estado do leitor, "seguinte" passa pelas três fatias e chega ao versículo 6', () => {
    const inicial = [
      { tipo: 'iniciar', ref: { livro: RUTE, capitulo: 1 }, letra: 3, tema: null, formato: 'livro' },
      { tipo: 'lerBiblia' },
      { tipo: 'irParaAncora', ancora: texto(RUTE, 3) },
    ].reduce((e, a) => reduzirLeitor(e, a as AcaoLeitor, indice), ESTADO_INICIAL);
    function Ligado() {
      const [estado, despachar] = useReducer(
        (e: typeof inicial, a: AcaoLeitor) => reduzirLeitor(e, a, indice),
        inicial,
      );
      return (
        <TelaLivro
          ancora={estado.ancora}
          carga={pronto(RUTE)}
          larga={false}
          letra={3}
          aoIrParaAncora={(ancora) => despachar({ tipo: 'irParaAncora', ancora })}
          aoTocarTitulo={vi.fn()}
          aoEscolherOutroLivro={vi.fn()}
          aoQueroSaber={vi.fn()}
          medir={medirDividido}
        />
      );
    }
    render(<Ligado />);
    const pagina = (n: number) => screen.getByRole('article', { name: `Página ${n} de Rute` });
    expect(pagina(2)).toBeInTheDocument();
    for (const n of [3, 4, 5]) {
      fireEvent.click(seguinte());
      expect(pagina(n)).toBeInTheDocument();
    }
  });

  it('FUN-85: a âncora com fatia mostra a página da fatia (página 3 de Rute)', () => {
    dividido(comFatia(3, 1));
    expect(screen.getByRole('article', { name: 'Página 3 de Rute' })).toBeInTheDocument();
  });
});

describe('tela larga e lugar da âncora (FUN-71, FUN-77, FUN-84, FUN-85, FUN-88; AD-007)', () => {
  /** Livro de mentira de dois capítulos de 3 versículos (uma linha de 20 cada); o nome mede 20 e a página 100. */
  const doisCapitulos = (n: number): CargaLivro => ({
    situacao: 'pronto',
    numero: n,
    livro: {
      numero: n,
      nome: indice.livros[n - 1]!.nome,
      capitulos: [1, 2].map((c) =>
        Array.from({ length: 3 }, (_, v) => `Texto de ${indice.livros[n - 1]!.nome} ${c}:${v + 1}`),
      ),
    },
  });
  const medirDois: Medir = (contenedor) => ({
    alturas: Array.from(contenedor.children, () => 20),
    alturaPagina: 100,
    alturaLinha: 20,
  });
  // Páginas (FUN-128, o capítulo 2 abre uma página): P1 [nome, 1:1, 1:2, 1:3] e P2 [2:1, 2:2, 2:3].
  const noCapitulo2 = (extra: Partial<Props> = {}) =>
    renderizar({
      ancora: { tipo: 'texto', ref: { livro: RUTE, capitulo: 2 }, versiculo: 1 },
      carga: doisCapitulos(RUTE),
      medir: medirDois,
      ...extra,
    });

  it('FUN-84/FUN-71 com FUN-128: a âncora no 2:1, que abre uma página, mostra o título do capítulo 2 (primeiro versículo da página)', () => {
    noCapitulo2();
    expect(screen.getByRole('button', { name: 'Rute 2. Escolher outro capítulo' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Rute 1. Escolher outro capítulo' })).not.toBeInTheDocument();
    expect(screen.getByRole('article', { name: 'Página 2 de Rute' })).toBeInTheDocument();
  });

  it('FUN-84/FUN-71 com FUN-128: a âncora no 1:3, última da página do capítulo 1, mostra o título do capítulo 1', () => {
    renderizar({
      ancora: { tipo: 'texto', ref: { livro: RUTE, capitulo: 1 }, versiculo: 3 },
      carga: doisCapitulos(RUTE),
      medir: medirDois,
    });
    expect(screen.getByRole('button', { name: 'Rute 1. Escolher outro capítulo' })).toBeInTheDocument();
    expect(screen.getByRole('article', { name: 'Página 1 de Rute' })).toBeInTheDocument();
  });

  it('FUN-77: na tela larga, "seguinte" de um par que não é o último vai ao primeiro versículo da página seguinte ao par', () => {
    const medirTres: Medir = (contenedor) => ({
      alturas: Array.from(contenedor.children, (_, i) => (i === 0 ? 20 : 40)),
      alturaPagina: 100,
      alturaLinha: 20,
    });
    // Nome 20 e versículos de 40, página de 100 (FUN-128): P1 [nome, 1:1, 1:2], P2 [1:3], P3 [2:1, 2:2], P4 [2:3]; o
    // par é P1 e P2, e a página seguinte ao par abre o capítulo 2.
    const props = renderizar({ carga: doisCapitulos(RUTE), medir: medirTres, larga: true });
    expect(screen.getAllByRole('article')).toHaveLength(2);
    fireEvent.click(seguinte());
    expect(props.aoIrParaAncora).toHaveBeenCalledWith({
      tipo: 'texto',
      ref: { livro: RUTE, capitulo: 2 },
      versiculo: 1,
    });
  });

  it('FUN-89: na tela larga, "seguinte" a partir da capa vai direto a Gênesis 1:1 (sem passar pelo plano pago)', () => {
    const props = renderizar({ ancora: { tipo: 'capa' }, carga: pronto(1), larga: true });
    fireEvent.click(seguinte());
    expect(props.aoIrParaAncora).toHaveBeenCalledWith(texto(1, 1));
  });

  it('FUN-89: na tela estreita, "seguinte" a partir da capa vai ao plano pago', () => {
    const props = renderizar({ ancora: { tipo: 'capa' }, carga: pronto(1), larga: false });
    fireEvent.click(seguinte());
    expect(props.aoIrParaAncora).toHaveBeenCalledWith({ tipo: 'pago' });
  });

  it('FUN-88: na tela larga, "anterior" em Gênesis 1 vai à capa (AD-005)', () => {
    const gen = renderizar({ ancora: texto(1, 1), carga: pronto(1), larga: true });
    fireEvent.click(anterior());
    expect(gen.aoIrParaAncora).toHaveBeenCalledWith({ tipo: 'capa' });
  });
});
