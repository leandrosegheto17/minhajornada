import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LINK_UNSPLASH, TelaSobre } from './TelaSobre';

function renderizar(totalCorrecoes = 0) {
  const aoVoltar = vi.fn();
  const aoVerCorrecoes = vi.fn();
  render(
    <TelaSobre
      rotuloVoltar="Salmos 27"
      aoVoltar={aoVoltar}
      totalCorrecoes={totalCorrecoes}
      aoVerCorrecoes={aoVerCorrecoes}
    />,
  );
  return { aoVoltar, aoVerCorrecoes, texto: screen.getByRole('main').textContent ?? '' };
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

  it('FUN-38: sem correções, diz que só o formato foi convertido e que os autores não endossam o app', () => {
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

describe('crédito com as correções (FUN-119, FUN-120)', () => {
  it('FUN-119: com correções, diz "baseado na Bíblia Livre (BLIVRE)" e que houve correções de digitação, ortografia e sentido', () => {
    const { texto } = renderizar(12);
    expect(texto).toContain('baseado na Bíblia Livre (BLIVRE)');
    expect(texto).toContain('Diego Santos, Mario Sérgio e Marco Teles');
    expect(texto).toContain('fevereiro de 2018');
    expect(texto).toMatch(/correções de digitação, ortografia e sentido/);
  });

  it('FUN-119: com correções, os autores não endossam as mudanças nem o app', () => {
    const { texto } = renderizar(12);
    expect(texto).toMatch(/não endossam estas mudanças nem este app/);
    expect(texto).not.toMatch(/o texto não foi modificado/);
  });

  it('FUN-119: com correções, mantém os links da licença e da fonte e mostra "Ver as correções no texto", que chama a ação', () => {
    const { aoVerCorrecoes } = renderizar(12);
    expect(screen.getByRole('link', { name: 'Creative Commons Atribuição 4.0 Brasil' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'site da Bíblia Livre' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ver as correções no texto' }));
    expect(aoVerCorrecoes).toHaveBeenCalledTimes(1);
  });

  it('FUN-120: com 0 correções, mantém o texto de hoje e não mostra o link das correções', () => {
    const { texto } = renderizar(0);
    expect(texto).toMatch(/Só o formato do arquivo foi convertido para o app; o texto não foi modificado/);
    expect(texto).not.toMatch(/baseado na Bíblia Livre/);
    expect(screen.queryByRole('button', { name: 'Ver as correções no texto' })).toBeNull();
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
