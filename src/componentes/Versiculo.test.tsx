import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Versiculo } from './Versiculo';

function renderizar(numero: number, texto: string) {
  return render(
    <ol>
      <Versiculo numero={numero} texto={texto} />
    </ol>,
  );
}

describe('Versiculo', () => {
  it('FUN-01: mostra o número e o texto no mesmo item da lista', () => {
    renderizar(7, 'Ouve, SENHOR, minha voz; tem piedade de mim, e responde-me.');
    const item = screen.getByRole('listitem');
    expect(item.children).toHaveLength(2);
    expect(item.children[0]).toHaveTextContent(/^7$/);
    expect(item.children[1]).toHaveTextContent('Ouve, SENHOR, minha voz; tem piedade de mim, e responde-me.');
  });

  it('FUN-02: "[que está]" de Filemom 1:2 aparece em <em>, sem colchetes', () => {
    const { container } = renderizar(
      2,
      'E à amada Ápia, e a Arquipo nosso companheiro de batalha, e à igreja [que está] em tua casa;',
    );
    const em = container.querySelector('em');
    expect(em).toHaveTextContent(/^que está$/);
    expect(container.textContent).not.toMatch(/[[\]]/);
    expect(screen.getByRole('listitem')).toHaveTextContent(
      '2E à amada Ápia, e a Arquipo nosso companheiro de batalha, e à igreja que está em tua casa;',
    );
  });

  it('FUN-02: dois acréscimos no mesmo versículo viram dois <em>', () => {
    const { container } = renderizar(1, '[um] meio [dois]');
    expect([...container.querySelectorAll('em')].map((e) => e.textContent)).toEqual(['um', 'dois']);
  });

  it('FUN-02: versículo sem colchete não tem <em>', () => {
    const { container } = renderizar(1, 'No princípio criou Deus os céus e a terra.');
    expect(container.querySelector('em')).toBeNull();
  });

  it('FUN-04: um texto com <img src=x onerror=alert(1)> aparece literal, sem criar elemento img', () => {
    const { container } = renderizar(1, 'antes <img src=x onerror=alert(1)> depois');
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByRole('listitem')).toHaveTextContent('antes <img src=x onerror=alert(1)> depois');
  });

  it('FUN-04: HTML dentro do acréscimo também fica literal', () => {
    const { container } = renderizar(1, '[<b>negrito</b>]');
    expect(container.querySelector('b')).toBeNull();
    expect(container.querySelector('em')).toHaveTextContent('<b>negrito</b>');
  });
});
