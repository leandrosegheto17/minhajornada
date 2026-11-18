import { fireEvent, render, screen, within } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { indice } from '../biblia/indice';
import { TelaLivros } from './TelaLivros';

type Props = ComponentProps<typeof TelaLivros>;

function renderizar(extra: Partial<Props> = {}) {
  const props: Props = {
    referencia: null,
    aoEscolherLivro: vi.fn(),
    aoVoltarALeitura: vi.fn(),
    ...extra,
  };
  render(<TelaLivros {...props} />);
  return props;
}

const nomes = (secao: HTMLElement) =>
  within(secao)
    .getAllByRole('button')
    .map((b) => b.getAttribute('aria-label')?.split(',')[0]);

describe('escolha de livro (FUN-06)', () => {
  it('FUN-06: duas seções, com 39 livros no Antigo e 27 no Novo Testamento', () => {
    renderizar();
    const at = screen.getByRole('region', { name: /Antigo Testamento/ });
    const nt = screen.getByRole('region', { name: /Novo Testamento/ });
    expect(within(at).getAllByRole('button')).toHaveLength(39);
    expect(within(nt).getAllByRole('button')).toHaveLength(27);
  });

  it('FUN-06: os livros seguem a ordem do índice (Gênesis primeiro, Malaquias último do AT, Apocalipse último do NT)', () => {
    renderizar();
    const at = nomes(screen.getByRole('region', { name: /Antigo Testamento/ }));
    const nt = nomes(screen.getByRole('region', { name: /Novo Testamento/ }));
    expect(at[0]).toBe('Gênesis');
    expect(at.at(-1)).toBe('Malaquias');
    expect(nt[0]).toBe('Mateus');
    expect(nt.at(-1)).toBe('Apocalipse');
    expect([...at, ...nt]).toEqual(indice.livros.map((l) => l.nome));
  });

  it('FUN-06: tocar num livro dispara a escolha com o número dele', () => {
    const props = renderizar();
    fireEvent.click(screen.getByRole('button', { name: 'Romanos, 16 capítulos' }));
    expect(props.aoEscolherLivro).toHaveBeenCalledWith(45);
  });

  it('cada livro mostra o número de capítulos', () => {
    renderizar();
    expect(screen.getByRole('button', { name: 'Salmos, 150 capítulos' })).toHaveTextContent('Salmos 150');
    expect(screen.getByRole('button', { name: 'Judas, 1 capítulo' })).toHaveTextContent('Judas 1');
  });

  it('o livro do capítulo aberto fica marcado; os outros não', () => {
    renderizar({ referencia: { livro: 19, capitulo: 27 } });
    expect(screen.getByRole('button', { name: 'Salmos, 150 capítulos' })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('button', { name: 'Gênesis, 50 capítulos' })).not.toHaveAttribute('aria-current');
  });

  it('FUN-60: com capítulo aberto, o topo do conteúdo volta à leitura', () => {
    const props = renderizar({ referencia: { livro: 19, capitulo: 27 } });
    fireEvent.click(screen.getByRole('button', { name: 'Salmos 27' }));
    expect(props.aoVoltarALeitura).toHaveBeenCalledTimes(1);
  });

  it('FUN-60: a tela não traz marca nem Sobre (são da barra de título) e sem capítulo não há "voltar"', () => {
    renderizar({ referencia: null });
    expect(screen.queryByText('MinhaJornada')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Sobre o MinhaJornada' })).toBeNull();
    expect(screen.queryByRole('banner')).toBeNull();
  });
});
