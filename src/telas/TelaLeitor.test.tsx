import { fireEvent, render, screen, within } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { indice } from '../biblia/indice';
import type { Livro, Ref } from '../biblia/tipos';
import type { CargaLivro } from '../estado/useLeitor';
import { TelaLeitor } from './TelaLeitor';

const n = (nome: string) => {
  const livro = indice.livros.find((l) => l.nome === nome);
  if (!livro) throw new Error(`livro ${nome} não está no índice`);
  return livro.numero;
};

/** Livro de mentira: cada capítulo com 3 versículos, menos os pedidos em `versiculosPorCapitulo`. */
function livroFalso(numero: number, versiculosPorCapitulo: Record<number, number> = {}): Livro {
  const entrada = indice.livros[numero - 1]!;
  return {
    numero,
    nome: entrada.nome,
    capitulos: Array.from({ length: entrada.capitulos }, (_, c) =>
      Array.from({ length: versiculosPorCapitulo[c + 1] ?? 3 }, (_, v) => `Texto de ${entrada.nome} ${c + 1}:${v + 1}`),
    ),
  };
}

const pronto = (livro: Livro): CargaLivro => ({ situacao: 'pronto', numero: livro.numero, livro });

type Props = ComponentProps<typeof TelaLeitor>;

function propsPara(referencia: Ref, extra: Partial<Props> = {}): Props {
  return {
    referencia,
    carga: pronto(livroFalso(referencia.livro)),
    aoTocarTitulo: vi.fn(),
    aoAnterior: vi.fn(),
    aoSeguinte: vi.fn(),
    aoAbrirSobre: vi.fn(),
    ...extra,
  };
}

let rolagem: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  rolagem = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('capítulo (FUN-01)', () => {
  it('FUN-01: mostra o título "Salmos 27" e os 14 versículos, cada um com o número', () => {
    const salmos = livroFalso(n('Salmos'), { 27: 14 });
    render(<TelaLeitor {...propsPara({ livro: n('Salmos'), capitulo: 27 }, { carga: pronto(salmos) })} />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Salmos 27');
    const itens = within(screen.getByRole('main')).getAllByRole('listitem');
    expect(itens).toHaveLength(14);
    itens.forEach((item, i) => {
      expect(item.firstElementChild).toHaveTextContent(new RegExp(`^${i + 1}$`));
      expect(item).toHaveTextContent(`Texto de Salmos 27:${i + 1}`);
    });
  });

  it('enquanto o livro carrega, mostra o estado carregando', () => {
    render(
      <TelaLeitor
        {...propsPara({ livro: n('Salmos'), capitulo: 27 }, { carga: { situacao: 'carregando', numero: n('Salmos') } })}
      />,
    );
    expect(screen.getByRole('status', { name: 'Carregando Salmos 27' })).toBeInTheDocument();
    expect(within(screen.getByRole('main')).queryAllByRole('listitem')).toHaveLength(0);
  });
});

describe('rolagem ao topo (FUN-05)', () => {
  it('FUN-05: abrir e trocar de capítulo rola ao topo', () => {
    const props = propsPara({ livro: n('Salmos'), capitulo: 26 });
    const { rerender } = render(<TelaLeitor {...props} />);
    expect(rolagem).toHaveBeenCalledTimes(1);
    expect(rolagem).toHaveBeenLastCalledWith(0, 0);

    rerender(<TelaLeitor {...props} referencia={{ livro: n('Salmos'), capitulo: 27 }} />);
    expect(rolagem).toHaveBeenCalledTimes(2);
    expect(rolagem).toHaveBeenLastCalledWith(0, 0);
  });

  it('FUN-05: renderizar de novo o mesmo capítulo não rola', () => {
    const props = propsPara({ livro: n('Salmos'), capitulo: 26 });
    const { rerender } = render(<TelaLeitor {...props} />);
    rerender(<TelaLeitor {...props} referencia={{ livro: n('Salmos'), capitulo: 26 }} />);
    expect(rolagem).toHaveBeenCalledTimes(1);
  });
});

describe('anterior e seguinte (FUN-10 a FUN-15)', () => {
  it('FUN-10/FUN-12: em Salmos 27, os cartões mostram Salmos 26 e Salmos 28 e disparam anterior e seguinte', () => {
    const props = propsPara({ livro: n('Salmos'), capitulo: 27 });
    render(<TelaLeitor {...props} />);

    const anteriorBotao = screen.getByRole('button', { name: 'Capítulo anterior: Salmos 26' });
    const seguinteBotao = screen.getByRole('button', { name: 'Capítulo seguinte: Salmos 28' });
    expect(anteriorBotao).toHaveTextContent('Salmos 26');
    expect(seguinteBotao).toHaveTextContent('Salmos 28');

    fireEvent.click(anteriorBotao);
    expect(props.aoAnterior).toHaveBeenCalledTimes(1);
    fireEvent.click(seguinteBotao);
    expect(props.aoSeguinte).toHaveBeenCalledTimes(1);
  });

  it('FUN-11: em Malaquias 4, o seguinte mostra Mateus 1', () => {
    render(<TelaLeitor {...propsPara({ livro: n('Malaquias'), capitulo: 4 })} />);
    expect(screen.getByRole('button', { name: 'Capítulo seguinte: Mateus 1' })).toHaveTextContent('Mateus 1');
  });

  it('FUN-13: em Mateus 1, o anterior mostra Malaquias 4', () => {
    render(<TelaLeitor {...propsPara({ livro: n('Mateus'), capitulo: 1 })} />);
    expect(screen.getByRole('button', { name: 'Capítulo anterior: Malaquias 4' })).toHaveTextContent('Malaquias 4');
  });

  it('FUN-14: em Gênesis 1, o anterior fica desativado e não dispara', () => {
    const props = propsPara({ livro: n('Gênesis'), capitulo: 1 });
    render(<TelaLeitor {...props} />);
    const botao = screen.getByRole('button', { name: 'Capítulo anterior: não há' });
    expect(botao).toBeDisabled();
    fireEvent.click(botao);
    expect(props.aoAnterior).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Capítulo seguinte: Gênesis 2' })).toBeEnabled();
  });

  it('FUN-15: em Apocalipse 22, o seguinte fica desativado e não dispara', () => {
    const props = propsPara({ livro: n('Apocalipse'), capitulo: 22 });
    render(<TelaLeitor {...props} />);
    const botao = screen.getByRole('button', { name: 'Capítulo seguinte: não há' });
    expect(botao).toBeDisabled();
    fireEvent.click(botao);
    expect(props.aoSeguinte).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Capítulo anterior: Apocalipse 21' })).toBeEnabled();
  });
});

describe('título e barra (FUN-49, FUN-50, FUN-44)', () => {
  it('FUN-49: tocar no título dispara a ação do título', () => {
    const props = propsPara({ livro: n('Salmos'), capitulo: 27 });
    render(<TelaLeitor {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Salmos 27. Escolher outro capítulo' }));
    expect(props.aoTocarTitulo).toHaveBeenCalledTimes(1);
  });

  it('FUN-50: em livro de capítulo único, o título oferece outro livro', () => {
    const props = propsPara({ livro: n('Filemom'), capitulo: 1 });
    render(<TelaLeitor {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Filemom 1. Escolher outro livro' }));
    expect(props.aoTocarTitulo).toHaveBeenCalledTimes(1);
  });

  it('FUN-44: os botões de ícone da barra têm rótulo em português', () => {
    const props = propsPara({ livro: n('Salmos'), capitulo: 27 });
    render(<TelaLeitor {...props} />);
    expect(screen.getByRole('button', { name: 'Aparência: letra e tema' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Sobre o MinhaJornada' }));
    expect(props.aoAbrirSobre).toHaveBeenCalledTimes(1);
  });
});
