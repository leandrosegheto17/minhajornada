import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Formato } from '../biblia/tipos';
import { BarraTitulo } from './BarraTitulo';

function props(formato: Formato = 'rolagem') {
  return {
    formato,
    letra: 3,
    tema: null,
    aoIrParaInicial: vi.fn(),
    aoTrocarFormato: vi.fn(),
    aoAbrirSobre: vi.fn(),
    aoAbrirConta: vi.fn(),
    aoMudarLetra: vi.fn(),
    aoEscolherTema: vi.fn(),
  };
}

describe('BarraTitulo', () => {
  it('FUN-61: a ordem é marca, formato, Aa, Sobre e conta', () => {
    render(<BarraTitulo {...props()} />);
    const nomes = screen.getAllByRole('button').map((b) => b.getAttribute('aria-label'));
    expect(nomes).toEqual([
      'MinhaJornada, página inicial',
      'Ler como livro',
      'Aparência: letra e tema',
      'Sobre o MinhaJornada',
      'Entrar ou criar conta',
    ]);
  });

  it('FUN-62: a marca leva à página inicial', () => {
    const p = props();
    render(<BarraTitulo {...p} />);
    fireEvent.click(screen.getByRole('button', { name: 'MinhaJornada, página inicial' }));
    expect(p.aoIrParaInicial).toHaveBeenCalledTimes(1);
  });

  it('FUN-63: o Aa abre o painel com letra e tema e o repassa', () => {
    const p = props();
    render(<BarraTitulo {...p} letra={4} tema="escuro" />);
    const aa = screen.getByRole('button', { name: 'Aparência: letra e tema' });
    expect(aa).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('region', { name: 'Aparência' })).toBeNull();
    fireEvent.click(aa);
    expect(aa).toHaveAttribute('aria-expanded', 'true');
    expect(aa).toHaveAttribute('aria-controls', screen.getByRole('region', { name: 'Aparência' }).id);
    expect(screen.getByText('Letra 4 de 5')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Escuro' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Aumentar letra' }));
    expect(p.aoMudarLetra).toHaveBeenCalledWith(1);
    fireEvent.click(screen.getByRole('button', { name: 'Sépia' }));
    expect(p.aoEscolherTema).toHaveBeenCalledWith('sepia');
    fireEvent.click(aa);
    expect(screen.queryByRole('region', { name: 'Aparência' })).toBeNull();
  });

  it('FUN-72: o botão de formato diz para onde vai e dispara a troca', () => {
    const p = props('rolagem');
    const { rerender } = render(<BarraTitulo {...p} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ler como livro' }));
    expect(p.aoTrocarFormato).toHaveBeenCalledTimes(1);
    rerender(<BarraTitulo {...props('livro')} />);
    expect(screen.getByRole('button', { name: 'Ler em rolagem' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ler como livro' })).toBeNull();
  });

  it('FUN-64: a conta tem rótulo acessível e o texto visível "Entrar / Criar conta"', () => {
    const p = props();
    render(<BarraTitulo {...p} />);
    const conta = screen.getByRole('button', { name: 'Entrar ou criar conta' });
    expect(conta).toHaveTextContent('Entrar / Criar conta');
    fireEvent.click(conta);
    expect(p.aoAbrirConta).toHaveBeenCalledTimes(1);
  });

  it('FUN-142: com sessão o botão da conta vira "Sair", com o mesmo texto no rótulo acessível e no visível', () => {
    const p = props();
    render(<BarraTitulo {...p} comSessao aoSair={vi.fn()} />);
    const sair = screen.getByRole('button', { name: 'Sair' });
    expect(sair).toHaveTextContent('Sair');
    expect(screen.queryByRole('button', { name: 'Entrar ou criar conta' })).toBeNull();
  });

  it('FUN-143: com sessão o botão chama aoSair e não aoAbrirConta', () => {
    const p = props();
    const aoSair = vi.fn();
    render(<BarraTitulo {...p} comSessao aoSair={aoSair} />);
    fireEvent.click(screen.getByRole('button', { name: 'Sair' }));
    expect(aoSair).toHaveBeenCalledTimes(1);
    expect(p.aoAbrirConta).not.toHaveBeenCalled();
  });

  it('FUN-142: sem sessão segue "Entrar / Criar conta" e aoSair não é chamado', () => {
    const p = props();
    const aoSair = vi.fn();
    render(<BarraTitulo {...p} comSessao={false} aoSair={aoSair} />);
    fireEvent.click(screen.getByRole('button', { name: 'Entrar ou criar conta' }));
    expect(p.aoAbrirConta).toHaveBeenCalledTimes(1);
    expect(aoSair).not.toHaveBeenCalled();
  });

  it('FUN-44: o Sobre tem rótulo em português e abre o Sobre', () => {
    const p = props();
    render(<BarraTitulo {...p} />);
    fireEvent.click(screen.getByRole('button', { name: 'Sobre o MinhaJornada' }));
    expect(p.aoAbrirSobre).toHaveBeenCalledTimes(1);
  });

  it('FUN-65: a barra é um header com a classe de barra presa', () => {
    render(<BarraTitulo {...props()} />);
    const barra = screen.getByRole('banner');
    expect(barra.className).toMatch(/barra-titulo/);
  });
});
