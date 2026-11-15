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
    letra: 3,
    tema: null,
    aoMudarLetra: vi.fn(),
    aoEscolherTema: vi.fn(),
    aoEscolherOutroLivro: vi.fn(),
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

describe('deslize lateral (FUN-16 a FUN-18)', () => {
  /** Simula um gesto de ponteiro na área do texto: começa em (200, 300) e anda (dx, dy). */
  function deslizar(dx: number, dy: number, pointerId = 1) {
    const area = screen.getByRole('main');
    fireEvent.pointerDown(area, { pointerId, isPrimary: true, clientX: 200, clientY: 300 });
    fireEvent.pointerUp(area, { pointerId, isPrimary: true, clientX: 200 + dx, clientY: 300 + dy });
  }

  it('FUN-16: deslizar -100/10 (direita para a esquerda) chama seguinte', () => {
    const props = propsPara({ livro: n('Salmos'), capitulo: 27 });
    render(<TelaLeitor {...props} />);
    deslizar(-100, 10);
    expect(props.aoSeguinte).toHaveBeenCalledTimes(1);
    expect(props.aoAnterior).not.toHaveBeenCalled();
  });

  it('FUN-17: deslizar 100/10 (esquerda para a direita) chama anterior', () => {
    const props = propsPara({ livro: n('Salmos'), capitulo: 27 });
    render(<TelaLeitor {...props} />);
    deslizar(100, 10);
    expect(props.aoAnterior).toHaveBeenCalledTimes(1);
    expect(props.aoSeguinte).not.toHaveBeenCalled();
  });

  it.each([
    [40, 0],
    [-40, 0],
    [-100, 120],
    [100, -120],
    [-80, 80],
  ])('FUN-18: deslize %i/%i não troca de capítulo', (dx, dy) => {
    const props = propsPara({ livro: n('Salmos'), capitulo: 27 });
    render(<TelaLeitor {...props} />);
    deslizar(dx, dy);
    expect(props.aoSeguinte).not.toHaveBeenCalled();
    expect(props.aoAnterior).not.toHaveBeenCalled();
  });

  it('FUN-15/FUN-16: em Apocalipse 22, o deslize para seguinte não faz nada', () => {
    const props = propsPara({ livro: n('Apocalipse'), capitulo: 22 });
    render(<TelaLeitor {...props} />);
    deslizar(-100, 10);
    expect(props.aoSeguinte).not.toHaveBeenCalled();
  });

  it('FUN-14/FUN-17: em Gênesis 1, o deslize para anterior não faz nada', () => {
    const props = propsPara({ livro: n('Gênesis'), capitulo: 1 });
    render(<TelaLeitor {...props} />);
    deslizar(100, 10);
    expect(props.aoAnterior).not.toHaveBeenCalled();
  });

  it('gesto cancelado pelo navegador não troca de capítulo', () => {
    const props = propsPara({ livro: n('Salmos'), capitulo: 27 });
    render(<TelaLeitor {...props} />);
    const area = screen.getByRole('main');
    fireEvent.pointerDown(area, { pointerId: 1, isPrimary: true, clientX: 200, clientY: 300 });
    fireEvent.pointerCancel(area, { pointerId: 1, isPrimary: true });
    fireEvent.pointerUp(area, { pointerId: 1, isPrimary: true, clientX: 50, clientY: 300 });
    expect(props.aoSeguinte).not.toHaveBeenCalled();
  });

  it('pointerUp de outro ponteiro não conta como deslize', () => {
    const props = propsPara({ livro: n('Salmos'), capitulo: 27 });
    render(<TelaLeitor {...props} />);
    const area = screen.getByRole('main');
    fireEvent.pointerDown(area, { pointerId: 1, isPrimary: true, clientX: 200, clientY: 300 });
    fireEvent.pointerUp(area, { pointerId: 2, isPrimary: true, clientX: 50, clientY: 300 });
    expect(props.aoSeguinte).not.toHaveBeenCalled();
  });
});

describe('painel de aparência no leitor (FUN-24 a FUN-28)', () => {
  it('o "Aa" alterna aria-expanded e mostra ou esconde o painel', () => {
    render(<TelaLeitor {...propsPara({ livro: n('Salmos'), capitulo: 27 })} />);
    const aa = screen.getByRole('button', { name: 'Aparência: letra e tema' });
    expect(aa).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('region', { name: 'Aparência' })).toBeNull();

    fireEvent.click(aa);
    expect(aa).toHaveAttribute('aria-expanded', 'true');
    const painel = screen.getByRole('region', { name: 'Aparência' });
    expect(aa).toHaveAttribute('aria-controls', painel.id);

    fireEvent.click(aa);
    expect(aa).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('region', { name: 'Aparência' })).toBeNull();
  });

  it('FUN-24/FUN-28: o painel aberto repassa a letra e o tema ao leitor', () => {
    const props = propsPara({ livro: n('Salmos'), capitulo: 27 }, { letra: 4, tema: 'escuro' });
    render(<TelaLeitor {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Aparência: letra e tema' }));
    expect(screen.getByText('Letra 4 de 5')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Escuro' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Aumentar letra' }));
    expect(props.aoMudarLetra).toHaveBeenCalledWith(1);
    fireEvent.click(screen.getByRole('button', { name: 'Sépia' }));
    expect(props.aoEscolherTema).toHaveBeenCalledWith('sepia');
  });
});

describe('livro não baixado (FUN-36)', () => {
  const naoBaixado = (numero: number): CargaLivro => ({ situacao: 'naoBaixado', numero });

  it('FUN-36: com o estado "não baixado", a mensagem exata aparece e a ação abre a escolha de livro', () => {
    const props = propsPara({ livro: n('Romanos'), capitulo: 8 }, { carga: naoBaixado(n('Romanos')) });
    render(<TelaLeitor {...props} />);
    expect(
      screen.getByText('Este livro ainda não foi baixado. Conecte-se à internet para lê-lo.'),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Escolher outro livro' }));
    expect(props.aoEscolherOutroLivro).toHaveBeenCalledTimes(1);
  });

  it('FUN-36: no estado "não baixado", não há versículos nem carregando', () => {
    render(<TelaLeitor {...propsPara({ livro: n('Romanos'), capitulo: 8 }, { carga: naoBaixado(n('Romanos')) })} />);
    expect(within(screen.getByRole('main')).queryAllByRole('listitem')).toHaveLength(0);
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('FUN-36: o título e os cartões continuam disponíveis', () => {
    render(<TelaLeitor {...propsPara({ livro: n('Romanos'), capitulo: 8 }, { carga: naoBaixado(n('Romanos')) })} />);
    expect(screen.getByRole('button', { name: 'Romanos 8. Escolher outro capítulo' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Capítulo seguinte: Romanos 9' })).toBeEnabled();
  });
});
