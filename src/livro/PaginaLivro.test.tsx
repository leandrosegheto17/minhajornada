import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { indice } from '../biblia/indice';
import type { Livro } from '../biblia/tipos';
import { blocosDoLivro } from './paginacao';
import { PaginaLivro } from './PaginaLivro';

const RUTE = indice.livros.find((l) => l.nome === 'Rute')!.numero;

function rute(versiculos: string[][]): Livro {
  return { numero: RUTE, nome: 'Rute', capitulos: versiculos };
}

const livro = rute([
  ['E aconteceu nos dias dos juízes.', 'O nome daquele homem [que está] era Elimeleque.'],
  ['Rute 2:1'],
]);
const blocos = blocosDoLivro(livro);
// Blocos: 0 nome do livro, 1 Rute 1:1, 2 Rute 1:2, 3 Rute 2:1.
const pagina = (...partes: { bloco: number; recorte: number }[]) => ({ partes });

describe('página do livro (FUN-75, FUN-76)', () => {
  it('FUN-76: mostra o nome do livro, o número do capítulo grande e o do versículo pequeno', () => {
    render(
      <PaginaLivro
        livro={livro}
        blocos={blocos}
        pagina={pagina({ bloco: 0, recorte: 0 }, { bloco: 1, recorte: 0 })}
        numero={1}
        lado="esquerda"
      />,
    );
    expect(screen.getByRole('heading', { level: 2, name: 'Rute' })).toBeInTheDocument();
    expect(screen.getByLabelText('Capítulo 1')).toHaveTextContent('1');
    expect(screen.getByText('E aconteceu nos dias dos juízes.')).toBeInTheDocument();
  });

  it('FUN-76: o acréscimo do tradutor fica em itálico, sem colchetes', () => {
    const { container } = render(
      <PaginaLivro livro={livro} blocos={blocos} pagina={pagina({ bloco: 2, recorte: 0 })} numero={2} lado="direita" />,
    );
    expect(container.querySelector('em')).toHaveTextContent('que está');
    expect(container.textContent).not.toContain('[');
    expect(container.textContent).not.toContain(']');
  });

  it('FUN-04: o texto entra como texto, nunca como HTML', () => {
    const mau = rute([['<img src=x onerror=alert(1)>']]);
    const { container } = render(
      <PaginaLivro
        livro={mau}
        blocos={blocosDoLivro(mau)}
        pagina={pagina({ bloco: 1, recorte: 0 })}
        numero={1}
        lado="unica"
      />,
    );
    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toContain('<img src=x onerror=alert(1)>');
  });

  it('FUN-75: a parte recortada desloca o bloco para cima pelo recorte', () => {
    const { container } = render(
      <PaginaLivro
        livro={livro}
        blocos={blocos}
        pagina={pagina({ bloco: 2, recorte: 36 }, { bloco: 3, recorte: 0 })}
        numero={2}
        lado="direita"
      />,
    );
    const [cortado, inteiro] = Array.from(container.querySelectorAll('p'));
    expect(cortado).toHaveStyle({ marginTop: '-36px' });
    expect(inteiro?.getAttribute('style') ?? '').not.toContain('margin');
  });

  it('o rodapé traz o capítulo e o número da página', () => {
    render(
      <PaginaLivro livro={livro} blocos={blocos} pagina={pagina({ bloco: 3, recorte: 0 })} numero={7} lado="unica" />,
    );
    const pagina7 = screen.getByRole('article', { name: 'Página 7 de Rute' });
    const rodape = within(pagina7).getByRole('contentinfo');
    expect(rodape).toHaveTextContent('Rute 2');
    expect(rodape).toHaveTextContent('7');
  });
});
