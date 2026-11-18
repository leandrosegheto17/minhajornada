import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LINK_UNSPLASH, TelaSobre } from './TelaSobre';

function renderizar() {
  const aoVoltar = vi.fn();
  render(<TelaSobre rotuloVoltar="Salmos 27" aoVoltar={aoVoltar} />);
  return { aoVoltar, texto: screen.getByRole('main').textContent ?? '' };
}

describe('crédito da Bíblia Livre (FUN-38)', () => {
  it('FUN-38: nome e sigla, autores e data da versão', () => {
    const { texto } = renderizar();
    expect(texto).toContain('Bíblia Livre (BLIVRE)');
    expect(texto).toContain('Diego Santos, Mario Sérgio e Marco Teles');
    expect(texto).toContain('fevereiro de 2018');
  });

  it('FUN-38: link da licença Creative Commons Atribuição 4.0 Brasil', () => {
    renderizar();
    const link = screen.getByRole('link', { name: 'Creative Commons Atribuição 4.0 Brasil' });
    expect(link).toHaveAttribute('href', 'https://creativecommons.org/licenses/by/4.0/br/');
  });

  it('FUN-38: link da fonte', () => {
    renderizar();
    expect(screen.getByRole('link', { name: 'site da Bíblia Livre' })).toHaveAttribute(
      'href',
      'https://sites.google.com/site/biblialivre/',
    );
  });

  it('FUN-38: diz que só o formato foi convertido e que os autores não endossam o app', () => {
    const { texto } = renderizar();
    expect(texto).toMatch(/Só o formato do arquivo foi convertido/);
    expect(texto).toMatch(/o texto não foi modificado/);
    expect(texto).toMatch(/não endossam este app/);
  });

  it('FUN-41: os links abrem sem passar a página de origem', () => {
    renderizar();
    for (const link of screen.getAllByRole('link')) {
      expect(link.getAttribute('rel')).toMatch(/noopener/);
      expect(link.getAttribute('rel')).toMatch(/noreferrer/);
    }
  });
});

describe('itálico (FUN-39)', () => {
  it('FUN-39: explica que o itálico marca palavras acrescentadas pelos tradutores', () => {
    const { texto } = renderizar();
    expect(texto).toMatch(/itálico foram acrescentadas pelos tradutores/);
  });
});

describe('privacidade (FUN-40)', () => {
  it('FUN-40: diz que não há conta e que tudo fica no aparelho', () => {
    const { texto } = renderizar();
    expect(texto).toMatch(/não tem conta/);
    expect(texto).toMatch(/ficam só neste aparelho/);
  });
});

describe('crédito da foto da página inicial (FUN-58)', () => {
  it('FUN-58: cita a foto, o autor e a licença Unsplash, com link para a licença', () => {
    const { texto } = renderizar();
    expect(texto).toContain('A foto da página inicial');
    expect(texto).toContain('Aaron Burden');
    expect(texto).toContain('licença Unsplash');
    expect(screen.getByRole('link', { name: 'Unsplash' })).toHaveAttribute('href', LINK_UNSPLASH);
  });
});

describe('versão e volta', () => {
  it('FUN-37: mostra a versão do app', () => {
    renderizar();
    expect(screen.getByText(`Versão ${__VERSAO__}`)).toBeInTheDocument();
  });

  it('o botão de voltar mostra o destino e dispara a volta', () => {
    const { aoVoltar } = renderizar();
    fireEvent.click(screen.getByRole('button', { name: 'Salmos 27' }));
    expect(aoVoltar).toHaveBeenCalledTimes(1);
  });
});
