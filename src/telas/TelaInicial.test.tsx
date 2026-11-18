import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ALT_FOTO, CREDITO_FOTO, TelaInicial } from './TelaInicial';

function renderizar() {
  const props = { aoLerBiblia: vi.fn(), aoCriarConta: vi.fn() };
  render(<TelaInicial {...props} />);
  return props;
}

describe('página inicial (FUN-52, FUN-59)', () => {
  it('FUN-52: mostra a foto e o cartão com "Ler Bíblia" e "Criar conta"', () => {
    renderizar();
    expect(screen.getByRole('img')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: 'A Palavra perto de você, onde estiver' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ler Bíblia' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Criar conta' })).toBeInTheDocument();
  });

  it('FUN-59: a foto tem texto alternativo em português', () => {
    renderizar();
    expect(screen.getByRole('img')).toHaveAttribute('alt', ALT_FOTO);
    expect(ALT_FOTO).toBe('Bíblia aberta sobre uma pedra, iluminada pela luz da tarde');
  });

  it('FUN-54 e FUN-57: "Ler Bíblia" e "Criar conta" disparam as ações', () => {
    const props = renderizar();
    fireEvent.click(screen.getByRole('button', { name: 'Ler Bíblia' }));
    expect(props.aoLerBiblia).toHaveBeenCalledTimes(1);
    expect(props.aoCriarConta).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));
    expect(props.aoCriarConta).toHaveBeenCalledTimes(1);
  });

  it('FUN-59: se a foto falha ao carregar, ela some e o cartão continua com os dois botões', () => {
    renderizar();
    fireEvent.error(screen.getByRole('img'));
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByRole('button', { name: 'Ler Bíblia' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Criar conta' })).toBeInTheDocument();
  });

  it('mostra o crédito da foto', () => {
    renderizar();
    expect(CREDITO_FOTO).toBe('Foto: Aaron Burden / Unsplash');
    expect(screen.getByText('Foto: Aaron Burden / Unsplash')).toBeInTheDocument();
  });
});
