import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ListaAplicada } from '../biblia/correcoes/arquivo';
import { TelaCorrecoes } from './TelaCorrecoes';

const LISTA: ListaAplicada = {
  regras: [
    { id: 'R-01', descricao: 'Tira o espaço antes da vírgula', versiculos: 806 },
    { id: 'R-02', descricao: 'Põe espaço depois da vírgula', versiculos: 1 },
  ],
  // Fora de ordem de propósito: Apocalipse (66) antes de Êxodo (2); capítulo e versículo também trocados.
  itens: [
    {
      ref: { livro: 66, capitulo: 6, versiculo: 1 },
      antes: 'o Coreiro abriu',
      depois: 'o Cordeiro abriu',
      motivo: 'Palavra inexistente.',
    },
    {
      ref: { livro: 2, capitulo: 19, versiculo: 4 },
      antes: 'asas de águas',
      depois: 'asas de águias',
      motivo: 'Imagem de águias.',
    },
    { ref: { livro: 66, capitulo: 2, versiculo: 20 }, antes: 'profetiza', depois: 'profetisa', motivo: 'Grafia.' },
    {
      ref: { livro: 66, capitulo: 2, versiculo: 3 },
      antes: 'a [sua] casa',
      depois: 'a [tua] casa',
      motivo: 'Acréscimo em itálico.',
    },
  ],
};

function renderizar(carregar: () => Promise<ListaAplicada>) {
  const aoVoltar = vi.fn();
  render(<TelaCorrecoes aoVoltar={aoVoltar} carregar={carregar} />);
  return { aoVoltar };
}

describe('tela "Correções no texto" (FUN-122, FUN-123)', () => {
  it('FUN-122: os livros saem na ordem bíblica, só os que têm correção, e os itens por capítulo e versículo', async () => {
    renderizar(() => Promise.resolve(LISTA));
    await screen.findByRole('heading', { name: 'Correções no texto' });
    const livros = await screen.findAllByText(/^(Êxodo|Apocalipse)$/);
    expect(livros.map((l) => l.firstChild?.textContent)).toEqual(['Êxodo', 'Apocalipse']);
    expect(screen.queryByText('Gênesis')).toBeNull();
    const apocalipse = screen.getByText('Apocalipse').closest('details') as HTMLElement;
    const refs = within(apocalipse)
      .getAllByText(/^Apocalipse \d+:\d+$/)
      .map((r) => r.textContent);
    expect(refs).toEqual(['Apocalipse 2:3', 'Apocalipse 2:20', 'Apocalipse 6:1']);
    expect(within(apocalipse).getByText('3 correções')).toBeInTheDocument();
    expect(screen.getByText('1 correção')).toBeInTheDocument();
  });

  it('FUN-122: os livros começam recolhidos', async () => {
    renderizar(() => Promise.resolve(LISTA));
    const apocalipse = (await screen.findByText('Apocalipse')).closest('details') as HTMLDetailsElement;
    expect(apocalipse.open).toBe(false);
  });

  it('FUN-123: cada regra aparece numa linha com a descrição e quantos versículos tocou', async () => {
    renderizar(() => Promise.resolve(LISTA));
    const linha1 = (await screen.findByText('Tira o espaço antes da vírgula')).closest('li') as HTMLElement;
    expect(within(linha1).getByText('806 versículos')).toBeInTheDocument();
    const linha2 = screen.getByText('Põe espaço depois da vírgula').closest('li') as HTMLElement;
    expect(within(linha2).getByText('1 versículo')).toBeInTheDocument();
  });

  it('FUN-122: o item mostra referência, antes riscado, depois e motivo, com rótulos para leitor de tela', async () => {
    renderizar(() => Promise.resolve(LISTA));
    const item = (await screen.findByText('Êxodo 19:4')).closest('li') as HTMLElement;
    expect(item.querySelector('del')?.textContent).toBe('asas de águas');
    expect(item.querySelector('ins')?.textContent).toBe('asas de águias');
    expect(within(item).getByText('Imagem de águias.')).toBeInTheDocument();
    expect(item.textContent).toContain('Antes: ');
    expect(item.textContent).toContain('Depois: ');
  });

  it('FUN-122: colchete nunca aparece; o trecho entre colchetes fica em itálico', async () => {
    renderizar(() => Promise.resolve(LISTA));
    const item = (await screen.findByText('Apocalipse 2:3')).closest('li') as HTMLElement;
    expect(item.textContent).not.toMatch(/[[\]]/);
    expect(item.querySelector('del em')?.textContent).toBe('sua');
    expect(item.querySelector('ins em')?.textContent).toBe('tua');
  });

  it('FUN-123: o resumo conta correções, regras, trechos e livros', async () => {
    renderizar(() => Promise.resolve(LISTA));
    expect(
      await screen.findByText('6 correções: 2 regras em todo o texto e 4 trechos em 2 livros.'),
    ).toBeInTheDocument();
  });

  it('FUN-122: "Voltar" chama a ação de voltar ao Sobre', async () => {
    const { aoVoltar } = renderizar(() => Promise.resolve(LISTA));
    fireEvent.click(screen.getByRole('button', { name: 'Sobre' }));
    expect(aoVoltar).toHaveBeenCalledTimes(1);
  });

  it('FUN-122: mostra "carregando" enquanto a promessa não volta', async () => {
    renderizar(() => new Promise(() => undefined));
    expect(screen.getByRole('status', { name: 'Carregando as correções' })).toBeInTheDocument();
    expect(screen.queryByText('Êxodo')).toBeNull();
  });

  it('FUN-122: erro mostra "Tentar de novo", que chama `carregar` outra vez e abre a lista', async () => {
    const carregar = vi.fn().mockRejectedValueOnce(new Error('sem rede')).mockResolvedValueOnce(LISTA);
    renderizar(carregar);
    expect(await screen.findByText('Não deu para abrir a lista')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByText('Êxodo')).toBeInTheDocument();
    expect(carregar).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(screen.queryByText('Não deu para abrir a lista')).toBeNull());
  });

  it('FUN-122: lista sem regra nem item mostra o estado vazio', async () => {
    renderizar(() => Promise.resolve({ regras: [], itens: [] }));
    expect(await screen.findByText('Nenhuma correção aplicada')).toBeInTheDocument();
    expect(screen.getByText('O texto é o da Bíblia Livre, sem modificação.')).toBeInTheDocument();
  });
});
