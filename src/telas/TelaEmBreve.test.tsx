import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TITULO_EM_BREVE, TelaEmBreve } from './TelaEmBreve';

function renderizar() {
  const props = { aoVoltar: vi.fn(), aoLerBiblia: vi.fn() };
  render(<TelaEmBreve {...props} />);
  return props;
}

describe('tela em breve (FUN-57)', () => {
  it('FUN-57: informa que a conta e o plano de estudo ainda não estão disponíveis', () => {
    renderizar();
    expect(screen.getByRole('heading', { level: 1, name: TITULO_EM_BREVE })).toBeInTheDocument();
    expect(TITULO_EM_BREVE).toBe('Conta e plano de estudo: em breve');
    expect(screen.getByText(/Ainda não dá para criar conta/)).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('FUN-57: "Voltar" e "Ler Bíblia" disparam as ações', () => {
    const props = renderizar();
    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));
    expect(props.aoVoltar).toHaveBeenCalledTimes(1);
    expect(props.aoLerBiblia).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Ler Bíblia' }));
    expect(props.aoLerBiblia).toHaveBeenCalledTimes(1);
  });
});
