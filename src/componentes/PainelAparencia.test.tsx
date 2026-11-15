import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { PainelAparencia } from './PainelAparencia';

type Props = ComponentProps<typeof PainelAparencia>;

function renderizar(extra: Partial<Props> = {}) {
  const props: Props = { aberto: true, letra: 3, tema: null, aoMudarLetra: vi.fn(), aoEscolherTema: vi.fn(), ...extra };
  render(<PainelAparencia {...props} />);
  return props;
}

describe('tamanho da letra (FUN-24 a FUN-27)', () => {
  it('FUN-24: + dispara aumentar a letra', () => {
    const props = renderizar({ letra: 3 });
    fireEvent.click(screen.getByRole('button', { name: 'Aumentar letra' }));
    expect(props.aoMudarLetra).toHaveBeenCalledWith(1);
  });

  it('FUN-25: − dispara diminuir a letra', () => {
    const props = renderizar({ letra: 3 });
    fireEvent.click(screen.getByRole('button', { name: 'Diminuir letra' }));
    expect(props.aoMudarLetra).toHaveBeenCalledWith(-1);
  });

  it.each([1, 3, 5])('FUN-24/FUN-25: o texto mostra "Letra %i de 5"', (letra) => {
    renderizar({ letra });
    expect(screen.getByText(`Letra ${letra} de 5`)).toBeInTheDocument();
  });

  it('FUN-26: no 5, o + fica desativado e não dispara; o − continua ativo', () => {
    const props = renderizar({ letra: 5 });
    const mais = screen.getByRole('button', { name: 'Aumentar letra' });
    expect(mais).toBeDisabled();
    fireEvent.click(mais);
    expect(props.aoMudarLetra).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Diminuir letra' })).toBeEnabled();
  });

  it('FUN-27: no 1, o − fica desativado e não dispara; o + continua ativo', () => {
    const props = renderizar({ letra: 1 });
    const menos = screen.getByRole('button', { name: 'Diminuir letra' });
    expect(menos).toBeDisabled();
    fireEvent.click(menos);
    expect(props.aoMudarLetra).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Aumentar letra' })).toBeEnabled();
  });

  it('nos níveis do meio, os dois ficam ativos', () => {
    renderizar({ letra: 2 });
    expect(screen.getByRole('button', { name: 'Aumentar letra' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Diminuir letra' })).toBeEnabled();
  });
});

describe('tema (FUN-28)', () => {
  it('FUN-28: escolher Sépia dispara a ação com "sepia"', () => {
    const props = renderizar();
    fireEvent.click(screen.getByRole('button', { name: 'Sépia' }));
    expect(props.aoEscolherTema).toHaveBeenCalledWith('sepia');
  });

  it('FUN-28: com sépia escolhido, aria-pressed="true" só nele', () => {
    renderizar({ tema: 'sepia' });
    expect(screen.getByRole('button', { name: 'Sépia' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Claro' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Escuro' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('FUN-29: sem tema escolhido (o do sistema), nenhuma opção fica marcada', () => {
    renderizar({ tema: null });
    for (const nome of ['Claro', 'Escuro', 'Sépia']) {
      expect(screen.getByRole('button', { name: nome })).toHaveAttribute('aria-pressed', 'false');
    }
  });
});

describe('visibilidade', () => {
  it('fechado, o painel fica escondido', () => {
    renderizar({ aberto: false });
    expect(screen.queryByRole('region', { name: 'Aparência' })).toBeNull();
  });

  it('aberto, o painel aparece com o nome "Aparência"', () => {
    renderizar({ aberto: true });
    expect(screen.getByRole('region', { name: 'Aparência' })).toBeVisible();
  });
});
