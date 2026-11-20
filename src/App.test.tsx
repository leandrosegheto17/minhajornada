import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { indice } from './biblia/indice';
import { criarDubleCaches } from './dados/dubleCache';
import { CACHE_LIVROS } from './dados/livros';
import { CHAVES, donoNoAparelho, lembrarDono } from './dados/preferencias';

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

  // Teste trocado na T27 (autorizado em `.specs/STATE.md`, 2026-11-19): a conta da barra deixa de abrir a tela "em
  // breve" e passa a abrir "Entrar" (FUN-137); o "Voltar" continua levando à tela de origem, com a mesma força.
  it('FUN-137: a conta da barra abre a tela "Entrar" e "Voltar" volta à tela de onde veio', () => {
    render(<App />);
    lerBiblia();
    fireEvent.click(screen.getByRole('button', { name: 'Entrar ou criar conta' }));
    expect(titulo1('Entrar')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 1, name: 'Conta e plano de estudo: em breve' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));
    expect(titulo1('Escolha o livro')).toBeInTheDocument();
  });

  it('FUN-137: "Criar conta" da tela "Entrar" abre a tela em breve e o voltar de lá volta a "Entrar"', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Entrar ou criar conta' }));
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));
    expect(titulo1('Conta e plano de estudo: em breve')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));
    expect(titulo1('Entrar')).toBeInTheDocument();
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

describe('sessão do dono no app (FUN-138, FUN-142, FUN-143, FUN-145)', () => {
  const json = (status: number, corpo: unknown = {}) =>
    new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } });

  /** API simulada: `/api/sessao` sem sessão, `/api/entrar` conforme `entrar` e `/api/sair` 204. */
  function simularApi(entrar: Response = json(200, { dono: true })) {
    const chamadas: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        chamadas.push(url);
        if (url === '/api/sessao') return json(401);
        if (url === '/api/entrar') return entrar.clone();
        if (url === '/api/sair') return new Response(null, { status: 204 });
        throw new TypeError('sem rede');
      }),
    );
    return chamadas;
  }

  const botaoConta = (nome: string) => screen.getByRole('button', { name: nome });

  async function entrarComoDono() {
    fireEvent.click(botaoConta('Entrar ou criar conta'));
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'dono@exemplo.com' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'senha-de-exemplo' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
  }

  it('FUN-138 FUN-142: login de dono volta à tela de origem e a barra mostra "Sair" com o mesmo texto no rótulo', async () => {
    simularApi();
    render(<App />);
    lerBiblia();
    await entrarComoDono();
    expect(await screen.findByRole('heading', { level: 1, name: 'Escolha o livro' })).toBeInTheDocument();
    const sair = botaoConta('Sair');
    expect(sair).toHaveTextContent('Sair');
    expect(screen.queryByRole('button', { name: 'Entrar ou criar conta' })).toBeNull();
    expect(donoNoAparelho()).toBe(true);
  });

  it('FUN-139: senha errada mostra a mensagem, fica na tela "Entrar" e a barra segue com "Entrar / Criar conta"', async () => {
    simularApi(json(401, { erro: 'credenciais' }));
    render(<App />);
    await entrarComoDono();
    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha incorretos.');
    expect(titulo1('Entrar')).toBeInTheDocument();
    expect(botaoConta('Entrar ou criar conta')).toBeInTheDocument();
    expect(donoNoAparelho()).toBe(false);
  });

  it('FUN-143: "Sair" chama POST /api/sair, volta a "Entrar / Criar conta" e não deixa botão "Resumo"', async () => {
    const chamadas = simularApi();
    render(<App />);
    await entrarComoDono();
    fireEvent.click(await screen.findByRole('button', { name: 'Sair' }));
    expect(botaoConta('Entrar ou criar conta')).toHaveTextContent('Entrar / Criar conta');
    await waitFor(() => expect(chamadas).toContain('/api/sair'));
    expect(screen.queryByRole('button', { name: 'Sair' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Resumo' })).toBeNull();
    expect(donoNoAparelho()).toBe(false);
  });

  it('FUN-145: abrir sem rede com a dica mj:dono mantém o estado de dono na barra', async () => {
    lembrarDono();
    render(<App />);
    expect(botaoConta('Sair')).toHaveTextContent('Sair');
    await act(async () => undefined);
    expect(botaoConta('Sair')).toBeInTheDocument();
  });

  it('FUN-145: abrir com a dica mj:dono e 401 da API volta ao estado sem sessão, sem mensagem', async () => {
    lembrarDono();
    simularApi();
    render(<App />);
    await waitFor(() => expect(botaoConta('Entrar ou criar conta')).toBeInTheDocument());
    expect(screen.queryByRole('alert')).toBeNull();
    expect(donoNoAparelho()).toBe(false);
  });
});

describe('resumo no modo livro (FUN-153, FUN-157, FUN-162)', () => {
  // Largura controlável: `girar` muda a consulta e avisa quem assinou, como o navegador ao girar a tela.
  const largura = { larga: true, ouvintes: new Set<() => void>() };
  const telaLarga = (larga: boolean) => {
    largura.larga = larga;
    largura.ouvintes.clear();
    vi.stubGlobal('matchMedia', (consulta: string) => ({
      get matches() {
        return largura.larga;
      },
      media: consulta,
      addEventListener: (_tipo: string, ouvinte: () => void) => largura.ouvintes.add(ouvinte),
      removeEventListener: (_tipo: string, ouvinte: () => void) => largura.ouvintes.delete(ouvinte),
    }));
  };
  const girar = (larga: boolean) => {
    largura.larga = larga;
    act(() => largura.ouvintes.forEach((ouvinte) => ouvinte()));
  };
  const botaoResumo = () => screen.getByRole('button', { name: 'Resumo' });
  const semBotaoResumo = () => expect(screen.queryByRole('button', { name: 'Resumo' })).toBeNull();

  async function abrirRomanos(opcoes: { dono?: boolean; formato?: 'livro' | 'rolagem'; larga?: boolean } = {}) {
    const { dono = true, formato = 'livro', larga = true } = opcoes;
    telaLarga(larga);
    if (dono) lembrarDono();
    localStorage.setItem(CHAVES.formato, JSON.stringify(formato));
    gravarRomanos8();
    await guardarRomanos();
    render(<App />);
    lerBiblia();
    // Na tela larga o par pode começar no capítulo 7 (o nome do livro ocupa a primeira página).
    if (formato === 'livro') expect(await screen.findByRole('button', { name: /^Romanos [78]\./ })).toBeInTheDocument();
    else expect(await screen.findByText('Romanos 8:1')).toBeInTheDocument();
  }

  it('FUN-153: dono no formato livro com um livro aberto vê o botão "Resumo", depois do de formato', async () => {
    await abrirRomanos();
    const nomes = screen.getAllByRole('button').map((b) => b.getAttribute('aria-label'));
    expect(nomes.indexOf('Resumo')).toBe(nomes.indexOf('Ler em rolagem') + 1);
    expect(botaoResumo()).toHaveAttribute('aria-pressed', 'false');
  });

  it('FUN-153: sem sessão de dono não há botão "Resumo"', async () => {
    await abrirRomanos({ dono: false });
    semBotaoResumo();
  });

  it('FUN-153: sessão de usuário comum (não dono) não tem botão "Resumo"', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url === '/api/sessao') {
          return new Response(JSON.stringify({ dono: false }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        throw new TypeError('sem rede');
      }),
    );
    await abrirRomanos({ dono: false });
    // A sessão de usuário já foi confirmada (a barra oferece "Sair"); só então a ausência do botão prova algo.
    expect(await screen.findByRole('button', { name: 'Sair' })).toBeInTheDocument();
    semBotaoResumo();
  });

  it('FUN-153: na rolagem não há botão "Resumo"', async () => {
    await abrirRomanos({ formato: 'rolagem' });
    semBotaoResumo();
  });

  it('FUN-153: na capa não há botão "Resumo"', () => {
    telaLarga(true);
    lembrarDono();
    localStorage.setItem(CHAVES.formato, JSON.stringify('livro'));
    render(<App />);
    lerBiblia();
    expect(screen.getByRole('article', { name: 'Capa' })).toBeInTheDocument();
    semBotaoResumo();
  });

  it('FUN-157: na tela larga, ligar mostra o resumo à direita, grava mj:resumo e reabrir volta ligado', async () => {
    await abrirRomanos();
    fireEvent.click(botaoResumo());
    expect(botaoResumo()).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('article', { name: 'Resumo de Romanos' })).toBeInTheDocument();
    expect(screen.getAllByRole('article', { name: /^Página \d+ de Romanos$/ })).toHaveLength(1);
    expect(localStorage.getItem(CHAVES.resumo)).toBe('true');
    cleanup();
    render(<App />);
    lerBiblia();
    expect(await screen.findByRole('article', { name: 'Resumo de Romanos' })).toBeInTheDocument();
    expect(botaoResumo()).toHaveAttribute('aria-pressed', 'true');
  });

  it('FUN-157: desligar na tela larga grava mj:resumo falso', async () => {
    await abrirRomanos();
    fireEvent.click(botaoResumo());
    fireEvent.click(botaoResumo());
    expect(localStorage.getItem(CHAVES.resumo)).toBe('false');
    expect(screen.queryByRole('article', { name: 'Resumo de Romanos' })).toBeNull();
  });

  it('FUN-162: na tela estreita, "Resumo" alterna e a mesma página da Bíblia volta; nada é gravado', async () => {
    await abrirRomanos({ larga: false });
    const pagina = screen.getByRole('article', { name: /^Página \d+ de Romanos$/ }).getAttribute('aria-label');
    fireEvent.click(botaoResumo());
    expect(botaoResumo()).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('article', { name: 'Resumo de Romanos' })).toBeInTheDocument();
    expect(screen.queryByRole('article', { name: /^Página \d+ de Romanos$/ })).toBeNull();
    fireEvent.click(botaoResumo());
    expect(botaoResumo()).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('article', { name: pagina! })).toBeInTheDocument();
    expect(localStorage.getItem(CHAVES.resumo)).toBeNull();
  });

  it('A-04 FUN-162: ligado na tela estreita, girar para larga e voltar à estreita deixa o resumo desligado', async () => {
    await abrirRomanos({ larga: false });
    fireEvent.click(botaoResumo());
    expect(botaoResumo()).toHaveAttribute('aria-pressed', 'true');
    girar(true);
    expect(botaoResumo()).toHaveAttribute('aria-pressed', 'false'); // na larga vale a preferência gravada (desligada)
    girar(false);
    expect(botaoResumo()).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByRole('article', { name: 'Resumo de Romanos' })).toBeNull();
    expect(screen.getByRole('article', { name: /^Página \d+ de Romanos$/ })).toBeInTheDocument();
  });

  it('FUN-162: com o resumo ligado na tela larga, abrir na estreita mostra a Bíblia com o botão não pressionado', async () => {
    localStorage.setItem(CHAVES.resumo, 'true');
    await abrirRomanos({ larga: false });
    expect(screen.getByRole('article', { name: /^Página \d+ de Romanos$/ })).toBeInTheDocument();
    expect(botaoResumo()).toHaveAttribute('aria-pressed', 'false');
  });
});
