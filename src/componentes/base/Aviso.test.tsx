import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Aviso } from './Aviso';

const MENSAGEM = 'Este livro ainda não foi baixado. Conecte-se à internet para lê-lo.';

describe('Aviso', () => {
  it.each(['neutro', 'erro'] as const)('a variante %s mostra a mensagem', (variante) => {
    render(<Aviso variante={variante} mensagem={MENSAGEM} />);
    expect(screen.getByText(MENSAGEM)).toBeInTheDocument();
  });

  it('FUN-36: a variante erro tem role="alert" com a mensagem', () => {
    render(<Aviso variante="erro" mensagem={MENSAGEM} />);
    expect(screen.getByRole('alert')).toHaveTextContent(MENSAGEM);
  });

  it('a variante neutra não tem role="alert"', () => {
    render(<Aviso variante="neutro" mensagem="Aviso comum" />);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByText('Aviso comum').parentElement).not.toHaveAttribute('role');
  });

  it('a variante erro tem a classe de erro do guia; a neutra não', () => {
    const { rerender } = render(<Aviso variante="erro" mensagem="Erro" />);
    expect(screen.getByText('Erro').parentElement?.className).toMatch(/aviso--erro/);
    rerender(<Aviso variante="neutro" mensagem="Erro" />);
    const classe = screen.getByText('Erro').parentElement?.className ?? '';
    expect(classe).toMatch(/aviso/);
    expect(classe).not.toMatch(/aviso--erro/);
  });

  it('a mensagem é texto, nunca HTML', () => {
    const { container } = render(<Aviso variante="neutro" mensagem="<img src=x onerror=alert(1)>" />);
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeInTheDocument();
  });

  it('mostra o ícone recebido', () => {
    render(<Aviso variante="erro" mensagem="Erro" icone={<svg data-testid="icone" aria-hidden="true" />} />);
    expect(screen.getByTestId('icone')).toHaveAttribute('aria-hidden', 'true');
  });
});
