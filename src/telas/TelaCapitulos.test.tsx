import { fireEvent, render, screen, within } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { TelaCapitulos } from './TelaCapitulos';

const SALMOS = 19;
const ROMANOS = 45;

type Props = ComponentProps<typeof TelaCapitulos>;

function renderizar(extra: Partial<Props> = {}) {
  const props: Props = {
    livro: SALMOS,
    referencia: null,
    aoAbrirCapitulo: vi.fn(),
    aoTrocarLivro: vi.fn(),
    aoVoltarALeitura: vi.fn(),
    aoAbrirSobre: vi.fn(),
    ...extra,
  };
  render(<TelaCapitulos {...props} />);
  return props;
}

describe('grade de capítulos (FUN-07, FUN-08, FUN-49)', () => {
  it('FUN-07: Salmos mostra 150 botões, de 1 a 150, na ordem', () => {
    renderizar();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Salmos');
    const grade = screen.getByRole('list', { name: 'Capítulos de Salmos' });
    const botoes = within(grade).getAllByRole('button');
    expect(botoes).toHaveLength(150);
    expect(botoes.map((b) => b.textContent)).toEqual(Array.from({ length: 150 }, (_, i) => String(i + 1)));
  });

  it('FUN-07: Romanos mostra 16 botões', () => {
    renderizar({ livro: ROMANOS });
    expect(within(screen.getByRole('list', { name: 'Capítulos de Romanos' })).getAllByRole('button')).toHaveLength(16);
  });

  it('FUN-08: tocar no 27 dispara abrir Salmos 27', () => {
    const props = renderizar();
    fireEvent.click(screen.getByRole('button', { name: 'Capítulo 27' }));
    expect(props.aoAbrirCapitulo).toHaveBeenCalledWith({ livro: SALMOS, capitulo: 27 });
  });

  it('FUN-49: "Trocar livro" dispara a ação de trocar livro', () => {
    const props = renderizar({ referencia: { livro: SALMOS, capitulo: 27 } });
    fireEvent.click(screen.getByRole('button', { name: 'Trocar livro' }));
    expect(props.aoTrocarLivro).toHaveBeenCalledTimes(1);
  });

  it('o capítulo aberto fica marcado quando é deste livro', () => {
    renderizar({ referencia: { livro: SALMOS, capitulo: 27 } });
    expect(screen.getByRole('button', { name: 'Capítulo 27' })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('button', { name: 'Capítulo 26' })).not.toHaveAttribute('aria-current');
  });

  it('capítulo aberto de outro livro não marca nada na grade', () => {
    renderizar({ referencia: { livro: ROMANOS, capitulo: 8 } });
    expect(screen.getByRole('button', { name: 'Capítulo 8' })).not.toHaveAttribute('aria-current');
  });

  it('"Voltar à leitura" dispara a volta quando há capítulo aberto', () => {
    const props = renderizar({ referencia: { livro: SALMOS, capitulo: 27 } });
    fireEvent.click(screen.getByRole('button', { name: 'Voltar à leitura' }));
    expect(props.aoVoltarALeitura).toHaveBeenCalledTimes(1);
  });

  it('sem capítulo aberto, não há "Voltar à leitura"', () => {
    renderizar({ referencia: null });
    expect(screen.queryByRole('button', { name: 'Voltar à leitura' })).toBeNull();
  });
});
