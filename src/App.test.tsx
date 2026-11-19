import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { indice } from './biblia/indice';
import { criarDubleCaches } from './dados/dubleCache';
import { CACHE_LIVROS } from './dados/livros';
import { CHAVES } from './dados/preferencias';

// FUN-119, FUN-122: o build local pode ter 0 correções aplicadas; o App é testado com 2 e a lista de exemplo.
vi.mock('./biblia/correcoesAplicadas', () => ({
  resumoCorrecoes: { total: 2 },
  carregarCorrecoes: () =>
    Promise.resolve({
      regras: [{ id: 'R-01', descricao: 'Tira o espaço antes da vírgula', versiculos: 3 }],
      itens: [
        {
          ref: { livro: 66, capitulo: 6, versiculo: 1 },
          antes: 'o Coreiro abriu',
          depois: 'o Cordeiro abriu',
          motivo: 'Palavra inexistente.',
        },
      ],
    }),
}));

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

const gravarRomanos8 = () => localStorage.setItem(CHAVES.leitura, JSON.stringify({ livro: ROMANOS, capitulo: 8 }));
const guardarRomanos = () =>
  duble.cache(CACHE_LIVROS).put(indice.livros[ROMANOS - 1]!.arquivo, new Response(romanos()));
const lerBiblia = () => fireEvent.click(screen.getByRole('button', { name: 'Ler Bíblia' }));
const titulo1 = (nome: string) => screen.getByRole('heading', { level: 1, name: nome });

describe('App', () => {
  // Ajuste do teste do esqueleto (T31, aprovado em 2026-11-15) e da T22 desta feature: o nome fica na marca da barra.
  it('abre no app e mostra o nome', () => {
    render(<App />);
    expect(screen.getByText('MinhaJornada')).toBeVisible();
    expect(titulo1('A Palavra perto de você, onde estiver')).toBeInTheDocument();
  });

  it('FUN-51: abre na página inicial sem leitura gravada', () => {
    render(<App />);
    expect(titulo1('A Palavra perto de você, onde estiver')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ler Bíblia' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 1, name: 'Escolha o livro' })).toBeNull();
  });

  it('FUN-51: abre na página inicial também com leitura gravada (não abre o capítulo)', () => {
    gravarRomanos8();
    render(<App />);
    expect(titulo1('A Palavra perto de você, onde estiver')).toBeInTheDocument();
    expect(screen.queryByText('Romanos 8')).toBeNull();
  });

  it('FUN-55: sem leitura gravada, "Ler Bíblia" mostra a escolha de livro', () => {
    render(<App />);
    lerBiblia();
    expect(titulo1('Escolha o livro')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /Antigo Testamento/ })).toBeInTheDocument();
  });

  it('FUN-54: com Romanos 8 gravado e o livro no dublê de cache, "Ler Bíblia" abre "Romanos 8"', async () => {
    gravarRomanos8();
    await guardarRomanos();
    render(<App />);
    lerBiblia();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Romanos 8');
    expect(await screen.findByText('Romanos 8:1')).toBeInTheDocument();
    expect(screen.getByText('Romanos 8:2')).toBeInTheDocument();
  });

  it('FUN-57: "Criar conta" abre a tela em breve e "Voltar" volta à inicial', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));
    expect(titulo1('Conta e plano de estudo: em breve')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));
    expect(titulo1('A Palavra perto de você, onde estiver')).toBeInTheDocument();
  });

  it('FUN-57: a conta da barra abre a tela em breve e "Voltar" volta à tela de onde veio', () => {
    render(<App />);
    lerBiblia();
    fireEvent.click(screen.getByRole('button', { name: 'Entrar ou criar conta' }));
    expect(titulo1('Conta e plano de estudo: em breve')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));
    expect(titulo1('Escolha o livro')).toBeInTheDocument();
  });

  it('FUN-57: "Ler Bíblia" da tela em breve segue como na inicial', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));
    lerBiblia();
    expect(titulo1('Escolha o livro')).toBeInTheDocument();
  });

  it('FUN-62: a marca da barra volta à página inicial', () => {
    render(<App />);
    lerBiblia();
    expect(titulo1('Escolha o livro')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'MinhaJornada, página inicial' }));
    expect(titulo1('A Palavra perto de você, onde estiver')).toBeInTheDocument();
  });

  it('FUN-60: a barra de título aparece uma vez só na escolha de livro, na grade, no leitor e no Sobre', async () => {
    await guardarRomanos();
    render(<App />);
    lerBiblia();
    expect(titulo1('Escolha o livro')).toBeInTheDocument();
    expect(screen.getAllByRole('banner')).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: 'Romanos, 16 capítulos' }));
    expect(screen.getByRole('list', { name: 'Capítulos de Romanos' })).toBeInTheDocument();
    expect(screen.getAllByRole('banner')).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: 'Capítulo 8' }));
    expect(await screen.findByText('Romanos 8:1')).toBeInTheDocument();
    expect(screen.getAllByRole('banner')).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: 'Sobre o MinhaJornada' }));
    expect(titulo1('Sobre o MinhaJornada')).toBeInTheDocument();
    expect(screen.getAllByRole('banner')).toHaveLength(1);
  });

  it('do leitor, "Sobre" abre a tela Sobre e voltar retorna ao capítulo', async () => {
    gravarRomanos8();
    await guardarRomanos();
    render(<App />);
    lerBiblia();
    await screen.findByText('Romanos 8:1');

    fireEvent.click(screen.getByRole('button', { name: 'Sobre o MinhaJornada' }));
    expect(titulo1('Sobre o MinhaJornada')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Romanos 8' }));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Romanos 8');
    expect(await screen.findByText('Romanos 8:1')).toBeInTheDocument();
  });

  it('FUN-122: no Sobre com correções, "Ver as correções no texto" abre a tela; "Voltar" volta ao Sobre e o Voltar do Sobre ao capítulo', async () => {
    gravarRomanos8();
    await guardarRomanos();
    render(<App />);
    lerBiblia();
    await screen.findByText('Romanos 8:1');

    fireEvent.click(screen.getByRole('button', { name: 'Sobre o MinhaJornada' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ver as correções no texto' }));
    expect(titulo1('Correções no texto')).toBeInTheDocument();
    expect(await screen.findByText('Apocalipse 6:1')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Sobre' }));
    expect(titulo1('Sobre o MinhaJornada')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Romanos 8' }));
    expect(await screen.findByText('Romanos 8:1')).toBeInTheDocument();
  });

  it('FUN-36: livro fora do cache e sem rede mostra o aviso e "Escolher outro livro" volta à escolha', async () => {
    gravarRomanos8();
    render(<App />);
    lerBiblia();
    expect(
      await screen.findByText('Este livro ainda não foi baixado. Conecte-se à internet para lê-lo.'),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Escolher outro livro' }));
    expect(titulo1('Escolha o livro')).toBeInTheDocument();
  });

  it('FUN-49: do leitor, o título abre a grade e "Trocar livro" abre a escolha de livro', async () => {
    gravarRomanos8();
    await guardarRomanos();
    render(<App />);
    lerBiblia();
    fireEvent.click(screen.getByRole('button', { name: 'Romanos 8. Escolher outro capítulo' }));
    expect(screen.getByRole('list', { name: 'Capítulos de Romanos' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Trocar livro' }));
    expect(titulo1('Escolha o livro')).toBeInTheDocument();
  });

  const regiaoLivro = () => screen.queryByRole('main', { name: 'Leitura em formato livro' });
  const paraLivro = () => fireEvent.click(screen.getByRole('button', { name: 'Ler como livro' }));
  const paraRolagem = () => fireEvent.click(screen.getByRole('button', { name: 'Ler em rolagem' }));

  it('FUN-66: sem formato gravado, o leitor abre em rolagem', async () => {
    gravarRomanos8();
    await guardarRomanos();
    render(<App />);
    lerBiblia();
    expect(await screen.findByText('Romanos 8:1')).toBeInTheDocument();
    expect(regiaoLivro()).toBeNull();
  });

  it('FUN-67, FUN-70, FUN-71: o botão de formato troca a rolagem pelo livro e volta, no mesmo capítulo', async () => {
    gravarRomanos8();
    await guardarRomanos();
    render(<App />);
    lerBiblia();
    expect(await screen.findByText('Romanos 8:1')).toBeInTheDocument();

    paraLivro();
    expect(regiaoLivro()).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /^Romanos 8\./ })).toBeInTheDocument();

    paraRolagem();
    expect(regiaoLivro()).toBeNull();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Romanos 8');
    expect(await screen.findByText('Romanos 8:1')).toBeInTheDocument();
  });

  it('FUN-67: sem leitura gravada e no formato livro, "Ler Bíblia" abre a capa', () => {
    localStorage.setItem(CHAVES.formato, JSON.stringify('livro'));
    render(<App />);
    lerBiblia();
    expect(regiaoLivro()).toBeInTheDocument();
    expect(screen.getByRole('article', { name: 'Capa' })).toBeInTheDocument();
  });

  it('FUN-60: no formato livro sem leitura, o Sobre volta à capa (não à escolha de livro)', () => {
    localStorage.setItem(CHAVES.formato, JSON.stringify('livro'));
    render(<App />);
    lerBiblia();
    expect(screen.getByRole('article', { name: 'Capa' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Sobre o MinhaJornada' }));
    expect(titulo1('Sobre o MinhaJornada')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Capa' }));
    expect(screen.getByRole('article', { name: 'Capa' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 1, name: 'Escolha o livro' })).toBeNull();
  });

  it('FUN-71: no livro, passar página muda o lugar e voltar à rolagem abre o capítulo da página', async () => {
    gravarRomanos8();
    await guardarRomanos();
    localStorage.setItem(CHAVES.formato, JSON.stringify('livro'));
    render(<App />);
    lerBiblia();
    expect(await screen.findByRole('button', { name: /^Romanos 8\./ })).toBeInTheDocument();
    // No jsdom cada versículo é uma página (sem layout): duas páginas à frente já é o capítulo 9.
    const seguinte = () => fireEvent.click(screen.getByRole('button', { name: 'Página seguinte' }));
    seguinte();
    seguinte();
    expect(screen.getByRole('button', { name: /^Romanos 9\./ })).toBeInTheDocument();
    paraRolagem();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Romanos 9');
  });
});
