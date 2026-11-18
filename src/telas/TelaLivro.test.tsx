import { fireEvent, render, screen, within } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { indice } from '../biblia/indice';
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
