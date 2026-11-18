import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CapaLivro, PaginaPago, TEXTO_PAGO } from './CapaLivro';

describe('capa e plano pago (FUN-89, FUN-92)', () => {
  it('FUN-89: a capa traz "Bíblia Sagrada", "Bíblia Livre" e "MinhaJornada"', () => {
    render(<CapaLivro />);
    expect(screen.getByRole('heading', { name: 'Bíblia Sagrada' })).toBeInTheDocument();
    expect(screen.getByText('Bíblia Livre')).toBeInTheDocument();
    expect(screen.getByText('MinhaJornada')).toBeInTheDocument();
  });

  it('FUN-92: o plano pago diz que ainda não está disponível e "Quero saber" dispara a ação', () => {
    const aoQueroSaber = vi.fn();
    render(<PaginaPago aoQueroSaber={aoQueroSaber} />);
    expect(screen.getByText('Em breve')).toBeInTheDocument();
    expect(screen.getByText(TEXTO_PAGO)).toHaveTextContent('ainda não está disponível');
    fireEvent.click(screen.getByRole('button', { name: 'Quero saber' }));
    expect(aoQueroSaber).toHaveBeenCalledTimes(1);
  });
});
