import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Estado } from './Estado';

describe('Estado', () => {
  it.each([
    ['vazio', 'Comece a ler', 'Escolha um livro. O app guarda onde você parou.'],
    ['erro', 'Sem internet', 'Este livro ainda não foi baixado. Conecte-se à internet para lê-lo.'],
  ] as const)('a variante %s mostra o título e o texto recebidos', (variante, titulo, texto) => {
    render(<Estado variante={variante} titulo={titulo} texto={texto} />);
    expect(screen.getByRole('heading', { name: titulo })).toBeInTheDocument();
    expect(screen.getByText(texto)).toBeInTheDocument();
  });

  it('FUN-21: no vazio, a ação aparece como botão primário e dispara o callback', () => {
    const aoAcionar = vi.fn();
    render(
      <Estado
        variante="vazio"
        titulo="Comece a ler"
        texto="Escolha um livro."
        acao={{ rotulo: 'Escolher livro', aoAcionar }}
      />,
    );
    const botao = screen.getByRole('button', { name: 'Escolher livro' });
    expect(botao.className).toMatch(/botao-primario/);
    fireEvent.click(botao);
    expect(aoAcionar).toHaveBeenCalledTimes(1);
  });

  it('FUN-36: no erro, a ação aparece como botão secundário e dispara o callback', () => {
    const aoAcionar = vi.fn();
    render(
      <Estado
        variante="erro"
        titulo="Sem internet"
        texto="Este livro ainda não foi baixado."
        acao={{ rotulo: 'Escolher outro livro', aoAcionar }}
      />,
    );
    const botao = screen.getByRole('button', { name: 'Escolher outro livro' });
    expect(botao.className).toMatch(/botao-secundario/);
    fireEvent.click(botao);
    expect(aoAcionar).toHaveBeenCalledTimes(1);
  });

  it('sem ação, não há botão', () => {
    render(<Estado variante="vazio" titulo="Comece a ler" texto="Escolha um livro." />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('carregando tem aria-busy="true" e um rótulo para o leitor de tela', () => {
    const { container } = render(<Estado variante="carregando" />);
    expect(container.firstElementChild).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status', { name: 'Carregando o capítulo' })).toBeInTheDocument();
  });

  it('carregando usa o rótulo recebido', () => {
    render(<Estado variante="carregando" rotulo="Carregando os livros" />);
    expect(screen.getByRole('status', { name: 'Carregando os livros' })).toBeInTheDocument();
  });

  it('vazio e erro não ficam ocupados', () => {
    const { container } = render(<Estado variante="erro" titulo="Sem internet" texto="Texto" />);
    expect(container.firstElementChild).not.toHaveAttribute('aria-busy');
  });

  it('título e texto são texto, nunca HTML', () => {
    const { container } = render(<Estado variante="erro" titulo="<b>x</b>" texto="<img src=x onerror=alert(1)>" />);
    expect(container.querySelector('img, b')).toBeNull();
  });

  it('FUN-57: o vazio aceita lista de itens e título de nível 1; sem eles, é h2 e sem lista', () => {
    const { unmount } = render(<Estado variante="vazio" titulo="T" texto="x" lista={['a;', 'b.']} nivelTitulo={1} />);
    expect(screen.getByRole('heading', { level: 1, name: 'T' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem').map((i) => i.textContent)).toEqual(['a;', 'b.']);
    unmount();
    render(<Estado variante="vazio" titulo="T" texto="x" />);
    expect(screen.getByRole('heading', { level: 2, name: 'T' })).toBeInTheDocument();
    expect(screen.queryByRole('list')).toBeNull();
  });
});
