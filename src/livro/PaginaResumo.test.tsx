import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { BuscaResumo } from '../dados/resumos';
import type { Resumo } from '../resumos/formato';
import { MENSAGEM_ERRO, MENSAGEM_SEM_RESUMO, PaginaResumo } from './PaginaResumo';
import type { Medir } from './useMedidas';

// Só texto de exemplo (FUN-152).
const resumoDe = (livro = 1, sobre: Partial<Resumo> = {}): Resumo => ({
  livro,
  contexto: 'Contexto de exemplo do livro.',
  mensagem: 'Mensagem central de exemplo.',
  divisao: [
    { titulo: 'Origens', de: 1, ate: 11 },
    { titulo: 'Fim da história', de: 50, ate: 50 },
  ],
  versiculos: [
    { capitulo: 12, versiculo: 1, ate: 3, frase: 'Frase de exemplo do intervalo.' },
    { capitulo: 15, versiculo: 6, frase: 'Frase de exemplo do versículo único.' },
  ],
  ...sobre,
});

/** Consultas só dentro da página visível: o contêiner de medida (aria-hidden) repete o texto. */
const naPagina = () => within(screen.getByRole('article'));

const pronto = (resumo: Resumo = resumoDe()): BuscaResumo => ({ situacao: 'pronto', resumo });

function renderizar(busca: BuscaResumo | Promise<BuscaResumo>, extras: { medir?: Medir; numeroLivro?: number } = {}) {
  const buscar = vi.fn(async () => busca);
  const aoPerderSessao = vi.fn();
  const utilitarios = render(
    <PaginaResumo
      numeroLivro={extras.numeroLivro ?? 1}
      nome="Gênesis"
      aoPerderSessao={aoPerderSessao}
      buscar={buscar}
      medir={extras.medir}
    />,
  );
  return { buscar, aoPerderSessao, ...utilitarios };
}

describe('A-03 FUN-163: lista de blocos com key', () => {
  it('FUN-163: renderizar o resumo não emite aviso de `key` do React', async () => {
    const erros = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderizar(pronto());
    await screen.findByRole('heading', { level: 3, name: 'Contexto' });
    const avisos = erros.mock.calls.map((c) => c.map(String).join(' ')).filter((m) => /unique "key"/.test(m));
    erros.mockRestore();
    expect(avisos).toEqual([]);
  });
});

describe('seções (FUN-163, FUN-164, FUN-165)', () => {
  it('FUN-163: os títulos vêm nesta ordem: Contexto, Mensagem central, Divisão do livro, Versículos-chave', async () => {
    renderizar(pronto());
    await screen.findByRole('heading', { level: 3, name: 'Contexto' });
    const titulos = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(titulos).toEqual(['Contexto', 'Mensagem central', 'Divisão do livro', 'Versículos-chave']);
    expect(screen.getByRole('heading', { level: 2, name: 'Gênesis' })).toBeInTheDocument();
    expect(naPagina().getByText('Contexto de exemplo do livro.')).toBeInTheDocument();
    expect(naPagina().getByText('Mensagem central de exemplo.')).toBeInTheDocument();
  });

  it('FUN-164: parte da divisão com título e "Capítulos 1 a 11"; parte de um capítulo como "Capítulo 50"', async () => {
    renderizar(pronto());
    expect(await naPagina().findByText('Origens')).toBeInTheDocument();
    expect(naPagina().getByText('Capítulos 1 a 11')).toBeInTheDocument();
    expect(naPagina().getByText('Fim da história')).toBeInTheDocument();
    expect(naPagina().getByText('Capítulo 50')).toBeInTheDocument();
  });

  it('FUN-164: versículo-chave "Gênesis 12:1-3" e "Gênesis 15:6", cada um com a sua frase', async () => {
    renderizar(pronto());
    const intervalo = await naPagina().findByText('Gênesis 12:1-3');
    expect(intervalo.tagName).toBe('DT');
    expect(intervalo.nextElementSibling).toHaveTextContent('Frase de exemplo do intervalo.');
    const unico = naPagina().getByText('Gênesis 15:6');
    expect(unico.nextElementSibling).toHaveTextContent('Frase de exemplo do versículo único.');
  });

  it('FUN-165: texto com <b>x</b> aparece literal, sem elemento b', async () => {
    const { container } = renderizar(
      pronto(resumoDe(1, { contexto: 'Antes <b>x</b> depois', mensagem: '<img src=x onerror=alert(1)>' })),
    );
    expect(await naPagina().findByText('Antes <b>x</b> depois')).toBeInTheDocument();
    expect(naPagina().getByText('<img src=x onerror=alert(1)>')).toBeInTheDocument();
    expect(container.querySelector('b')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
  });

  it('FUN-165: o título da divisão e a frase do versículo também entram como texto', async () => {
    const { container } = renderizar(
      pronto(
        resumoDe(1, {
          divisao: [{ titulo: '<i>Parte</i>', de: 1, ate: 2 }],
          versiculos: [{ capitulo: 1, versiculo: 1, frase: '<u>frase</u>' }],
        }),
      ),
    );
    expect(await naPagina().findByText('<i>Parte</i>')).toBeInTheDocument();
    expect(naPagina().getByText('<u>frase</u>')).toBeInTheDocument();
    expect(container.querySelector('i, u')).toBeNull();
  });
});

describe('estados (FUN-145, FUN-166, FUN-167, FUN-168)', () => {
  it('FUN-166: enquanto busca mostra "Carregando o resumo…" e a página fica ocupada', () => {
    const { container } = renderizar(new Promise<BuscaResumo>(() => undefined));
    expect(screen.getByRole('status', { name: 'Carregando o resumo…' })).toBeInTheDocument();
    expect(container.querySelector('article')).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByRole('heading', { level: 3 })).toBeNull();
  });

  it('FUN-167: erro mostra a mensagem e "Tentar de novo", que busca de novo', async () => {
    const buscar = vi
      .fn<(n: number) => Promise<BuscaResumo>>()
      .mockResolvedValueOnce({ situacao: 'erro' })
      .mockResolvedValueOnce(pronto());
    render(<PaginaResumo numeroLivro={1} nome="Gênesis" aoPerderSessao={vi.fn()} buscar={buscar} />);
    expect(await naPagina().findByText(MENSAGEM_ERRO)).toBeInTheDocument();
    expect(MENSAGEM_ERRO).toBe('Não foi possível carregar o resumo. Confira a internet e tente de novo.');
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByRole('heading', { level: 3, name: 'Contexto' })).toBeInTheDocument();
    expect(buscar).toHaveBeenCalledTimes(2);
    expect(naPagina().queryByText(MENSAGEM_ERRO)).toBeNull();
  });

  it('FUN-168: livro sem resumo mostra "Este livro ainda não tem resumo." e nenhuma seção', async () => {
    renderizar({ situacao: 'semResumo' });
    expect(await naPagina().findByText(MENSAGEM_SEM_RESUMO)).toBeInTheDocument();
    expect(MENSAGEM_SEM_RESUMO).toBe('Este livro ainda não tem resumo.');
    expect(screen.queryByRole('heading', { level: 3 })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Tentar de novo' })).toBeNull();
  });

  it('FUN-145: resposta sem sessão chama aoPerderSessao uma vez, sem mostrar erro nem texto', async () => {
    const { aoPerderSessao } = renderizar({ situacao: 'semSessao' });
    await waitFor(() => expect(aoPerderSessao).toHaveBeenCalledTimes(1));
    expect(naPagina().queryByText(MENSAGEM_ERRO)).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByRole('heading', { level: 3 })).toBeNull();
  });

  it('FUN-166: a resposta que chega depois de trocar de livro não substitui a do livro novo', async () => {
    let resolverPrimeira: (b: BuscaResumo) => void = () => undefined;
    const buscar = vi.fn((n: number) =>
      n === 1
        ? new Promise<BuscaResumo>((ok) => (resolverPrimeira = ok))
        : Promise.resolve(pronto(resumoDe(2, { contexto: 'Do livro dois.' }))),
    );
    const { rerender } = render(
      <PaginaResumo numeroLivro={1} nome="Gênesis" aoPerderSessao={vi.fn()} buscar={buscar} />,
    );
    rerender(<PaginaResumo numeroLivro={2} nome="Êxodo" aoPerderSessao={vi.fn()} buscar={buscar} />);
    expect(await naPagina().findByText('Do livro dois.')).toBeInTheDocument();
    resolverPrimeira(pronto(resumoDe(1, { contexto: 'Do livro um.' })));
    await new Promise((ok) => setTimeout(ok, 0));
    expect(naPagina().queryByText('Do livro um.')).toBeNull();
    expect(naPagina().getByText('Do livro dois.')).toBeInTheDocument();
  });
});

describe('páginas próprias do resumo (FUN-169)', () => {
  /** 5 blocos (cabeça e as quatro seções) de 100 px; a página mede `alturaPagina`. */
  const medidaDe =
    (alturaPagina: number): Medir =>
    () => ({ alturas: [100, 100, 100, 100, 100], alturaPagina, alturaLinha: 20 });

  const paginador = () => screen.queryByRole('group', { name: 'Páginas do resumo' });
  const anterior = () => screen.getByRole('button', { name: 'Página anterior do resumo' });
  const seguinte = () => screen.getByRole('button', { name: 'Página seguinte do resumo' });

  it('FUN-169: o resumo que não cabe numa página mostra "1 de 2" e "Página anterior do resumo" desabilitado', async () => {
    renderizar(pronto(), { medir: medidaDe(300) });
    await screen.findByRole('heading', { level: 3, name: 'Contexto' });
    expect(paginador()).toHaveTextContent('1 de 2');
    expect(anterior()).toBeDisabled();
    expect(seguinte()).toBeEnabled();
    expect(screen.getByRole('article', { name: 'Resumo de Gênesis, página 1 de 2' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 3, name: 'Divisão do livro' })).toBeNull();
  });

  it('FUN-169: "seguinte" mostra a página 2, com o resto do resumo, e "anterior" volta', async () => {
    renderizar(pronto(), { medir: medidaDe(300) });
    await screen.findByRole('heading', { level: 3, name: 'Contexto' });
    fireEvent.click(seguinte());
    expect(paginador()).toHaveTextContent('2 de 2');
    expect(seguinte()).toBeDisabled();
    expect(anterior()).toBeEnabled();
    expect(screen.getByRole('article', { name: 'Resumo de Gênesis, página 2 de 2' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Divisão do livro' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Versículos-chave' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 3, name: 'Contexto' })).toBeNull();
    fireEvent.click(anterior());
    expect(paginador()).toHaveTextContent('1 de 2');
    expect(screen.getByRole('heading', { level: 3, name: 'Contexto' })).toBeInTheDocument();
  });

  it('FUN-169: o resumo que cabe numa página não mostra paginador', async () => {
    renderizar(pronto(), { medir: medidaDe(1000) });
    await screen.findByRole('heading', { level: 3, name: 'Contexto' });
    expect(paginador()).toBeNull();
    expect(screen.getByRole('heading', { level: 3, name: 'Versículos-chave' })).toBeInTheDocument();
    expect(screen.getByRole('article', { name: 'Resumo de Gênesis, página 1 de 1' })).toBeInTheDocument();
  });

  it('FUN-169: sem layout medido (altura 0) mostra o resumo todo numa página, sem paginador', async () => {
    renderizar(pronto(), { medir: () => ({ alturas: [0, 0, 0, 0, 0], alturaPagina: 0, alturaLinha: 0 }) });
    await screen.findByRole('heading', { level: 3, name: 'Contexto' });
    expect(paginador()).toBeNull();
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(4);
  });

  it('FUN-169: trocar de livro volta à página 1 do resumo do livro novo', async () => {
    const buscar = vi.fn(async (n: number) => pronto(resumoDe(n)));
    const medir = medidaDe(300);
    const { rerender } = render(
      <PaginaResumo numeroLivro={1} nome="Gênesis" aoPerderSessao={vi.fn()} buscar={buscar} medir={medir} />,
    );
    await screen.findByRole('heading', { level: 3, name: 'Contexto' });
    fireEvent.click(seguinte());
    expect(paginador()).toHaveTextContent('2 de 2');
    rerender(<PaginaResumo numeroLivro={2} nome="Êxodo" aoPerderSessao={vi.fn()} buscar={buscar} medir={medir} />);
    expect(await screen.findByRole('article', { name: 'Resumo de Êxodo, página 1 de 2' })).toBeInTheDocument();
    expect(paginador()).toHaveTextContent('1 de 2');
    expect(screen.getByRole('heading', { level: 3, name: 'Contexto' })).toBeInTheDocument();
  });

  it('FUN-169: bloco maior que a página vira fatias, com o recorte do que já saiu', async () => {
    // Só a seção "Contexto" é maior que a página (250 px contra 100): ocupa várias páginas e o recorte desloca o texto.
    const medir: Medir = () => ({ alturas: [60, 250, 40, 40, 40], alturaPagina: 100, alturaLinha: 20 });
    renderizar(pronto(), { medir });
    await waitFor(() => expect(paginador()).not.toBeNull());
    const total = Number(/de (\d+)$/.exec(paginador()?.textContent ?? '')?.[1]);
    expect(total).toBeGreaterThan(3);
    fireEvent.click(seguinte()); // 2: primeira fatia do Contexto, sem recorte
    expect(screen.getByRole('region', { name: 'Contexto' }).style.marginTop).toBe('');
    fireEvent.click(seguinte()); // 3: segunda fatia, com o que já saiu recortado
    expect(screen.getByRole('region', { name: 'Contexto' }).style.marginTop).toMatch(/^-\d+(\.\d+)?px$/);
  });
});
