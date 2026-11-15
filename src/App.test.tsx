import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { indice } from './biblia/indice';
import { criarDubleCaches } from './dados/dubleCache';
import { CACHE_LIVROS } from './dados/livros';
import { CHAVES } from './dados/preferencias';

const ROMANOS = 45;

/** Corpo JSON de Romanos com 16 capítulos de 2 versículos. */
function romanos(): string {
  return JSON.stringify({
    numero: ROMANOS,
    nome: 'Romanos',
    capitulos: Array.from({ length: 16 }, (_, c) => [`Romanos ${c + 1}:1`, `Romanos ${c + 1}:2`]),
  });
}

let duble: ReturnType<typeof criarDubleCaches>;

beforeEach(() => {
  localStorage.clear();
  duble = criarDubleCaches();
  vi.stubGlobal('caches', duble.storage);
  // Sem rede: tudo o que o teste lê vem do dublê de cache.
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => {
      throw new TypeError('sem rede');
    }),
  );
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('App', () => {
  // Ajuste do teste do esqueleto (T31, aprovado pelo usuário em 2026-11-15): o app deixa de abrir num título
  // "MinhaJornada" e abre na escolha de livro, com o nome na marca da barra.
  it('abre no app e mostra o nome', () => {
    render(<App />);
    expect(screen.getByText('MinhaJornada')).toBeVisible();
    expect(screen.getByRole('heading', { level: 1, name: 'Escolha o livro' })).toBeInTheDocument();
  });

  it('FUN-21: sem leitura gravada, abre a escolha de livro', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: 'Escolha o livro' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /Antigo Testamento/ })).toBeInTheDocument();
  });

  it('FUN-20: com Romanos 8 gravado e o livro no dublê de cache, abre "Romanos 8"', async () => {
    localStorage.setItem(CHAVES.leitura, JSON.stringify({ livro: ROMANOS, capitulo: 8 }));
    await duble.cache(CACHE_LIVROS).put(indice.livros[ROMANOS - 1]!.arquivo, new Response(romanos()));

    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Romanos 8');
    expect(await screen.findByText('Romanos 8:1')).toBeInTheDocument();
    expect(screen.getByText('Romanos 8:2')).toBeInTheDocument();
  });

  it('do leitor, "Sobre" abre a tela Sobre e voltar retorna ao capítulo', async () => {
    localStorage.setItem(CHAVES.leitura, JSON.stringify({ livro: ROMANOS, capitulo: 8 }));
    await duble.cache(CACHE_LIVROS).put(indice.livros[ROMANOS - 1]!.arquivo, new Response(romanos()));
    render(<App />);
    await screen.findByText('Romanos 8:1');

    fireEvent.click(screen.getByRole('button', { name: 'Sobre o MinhaJornada' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Sobre o MinhaJornada' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Romanos 8' }));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Romanos 8');
    expect(await screen.findByText('Romanos 8:1')).toBeInTheDocument();
  });

  it('FUN-36: livro fora do cache e sem rede mostra o aviso e "Escolher outro livro" volta à escolha', async () => {
    localStorage.setItem(CHAVES.leitura, JSON.stringify({ livro: ROMANOS, capitulo: 8 }));
    render(<App />);
    expect(
      await screen.findByText('Este livro ainda não foi baixado. Conecte-se à internet para lê-lo.'),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Escolher outro livro' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Escolha o livro' })).toBeInTheDocument();
  });

  it('FUN-49: do leitor, o título abre a grade e "Trocar livro" abre a escolha de livro', async () => {
    localStorage.setItem(CHAVES.leitura, JSON.stringify({ livro: ROMANOS, capitulo: 8 }));
    await duble.cache(CACHE_LIVROS).put(indice.livros[ROMANOS - 1]!.arquivo, new Response(romanos()));
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Romanos 8. Escolher outro capítulo' }));
    expect(screen.getByRole('list', { name: 'Capítulos de Romanos' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Trocar livro' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Escolha o livro' })).toBeInTheDocument();
  });
});
