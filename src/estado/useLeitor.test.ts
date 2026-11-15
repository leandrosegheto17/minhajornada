import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { indice } from '../biblia/indice';
import type { Livro } from '../biblia/tipos';
import { LivroNaoBaixado } from '../dados/livros';
import { CHAVES } from '../dados/preferencias';
import { useLeitor } from './useLeitor';

const dubles = vi.hoisted(() => ({
  carregarLivro: vi.fn<(numero: number) => Promise<Livro>>(),
  baixarFaltantes: vi.fn<() => Promise<void>>(),
  limparAntigos: vi.fn<() => Promise<void>>(),
}));

vi.mock('../dados/livros', async (original) => ({
  ...(await original<typeof import('../dados/livros')>()),
  ...dubles,
}));

const n = (nome: string) => {
  const livro = indice.livros.find((l) => l.nome === nome);
  if (!livro) throw new Error(`livro ${nome} não está no índice`);
  return livro.numero;
};

function livroFalso(numero: number): Livro {
  const entrada = indice.livros[numero - 1]!;
  return {
    numero,
    nome: entrada.nome,
    capitulos: Array.from({ length: entrada.capitulos }, (_, c) => [`${entrada.nome} ${c + 1}:1`]),
  };
}

/** Promessa controlada pelo teste. */
function adiada<T>() {
  let resolver!: (valor: T) => void;
  let rejeitar!: (erro: unknown) => void;
  const promessa = new Promise<T>((ok, falha) => {
    resolver = ok;
    rejeitar = falha;
  });
  return { promessa, resolver, rejeitar };
}

beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.tema;
  delete document.documentElement.dataset.letra;
  dubles.carregarLivro.mockReset().mockImplementation(async (numero) => livroFalso(numero));
  dubles.baixarFaltantes.mockReset().mockResolvedValue(undefined);
  dubles.limparAntigos.mockReset().mockResolvedValue(undefined);
});

afterEach(() => {
  localStorage.clear();
});

describe('abertura (FUN-20, FUN-21)', () => {
  it('FUN-20: com leitura gravada, abre o leitor nela e carrega o livro', async () => {
    localStorage.setItem(CHAVES.leitura, JSON.stringify({ livro: n('Romanos'), capitulo: 8 }));
    const { result } = renderHook(() => useLeitor());
    expect(result.current.estado.tela).toBe('leitor');
    expect(result.current.estado.ref).toEqual({ livro: n('Romanos'), capitulo: 8 });
    await waitFor(() => expect(result.current.carga?.situacao).toBe('pronto'));
    expect(dubles.carregarLivro).toHaveBeenCalledWith(n('Romanos'));
  });

  it('FUN-21: sem leitura gravada, abre a escolha de livro e não carrega nada', () => {
    const { result } = renderHook(() => useLeitor());
    expect(result.current.estado.tela).toBe('livros');
    expect(result.current.carga).toBeNull();
    expect(dubles.carregarLivro).not.toHaveBeenCalled();
  });

  it('FUN-30: letra e tema gravados são reaplicados na abertura', () => {
    localStorage.setItem(CHAVES.letra, '5');
    localStorage.setItem(CHAVES.tema, JSON.stringify('escuro'));
    const { result } = renderHook(() => useLeitor());
    expect(result.current.estado.letra).toBe(5);
    expect(result.current.estado.tema).toBe('escuro');
    expect(document.documentElement.dataset.letra).toBe('5');
    expect(document.documentElement.dataset.tema).toBe('escuro');
  });

  it('FUN-29: sem tema escolhido, o <html> fica sem data-tema e nada é gravado', () => {
    renderHook(() => useLeitor());
    expect(document.documentElement).not.toHaveAttribute('data-tema');
    expect(localStorage.getItem(CHAVES.tema)).toBeNull();
    expect(localStorage.getItem(CHAVES.letra)).toBeNull();
  });
});

describe('gravar a leitura (FUN-19)', () => {
  it('FUN-19: abrir Romanos 8 grava {livro: 45, capitulo: 8}', () => {
    const { result } = renderHook(() => useLeitor());
    act(() => result.current.escolherLivro(n('Romanos')));
    act(() => result.current.abrirCapitulo({ livro: n('Romanos'), capitulo: 8 }));
    expect(n('Romanos')).toBe(45);
    expect(JSON.parse(localStorage.getItem(CHAVES.leitura) ?? 'null')).toEqual({ livro: 45, capitulo: 8 });
  });

  it('FUN-19: ir ao capítulo seguinte grava o novo capítulo', () => {
    localStorage.setItem(CHAVES.leitura, JSON.stringify({ livro: n('Salmos'), capitulo: 26 }));
    const { result } = renderHook(() => useLeitor());
    act(() => result.current.seguinte());
    expect(JSON.parse(localStorage.getItem(CHAVES.leitura) ?? 'null')).toEqual({ livro: n('Salmos'), capitulo: 27 });
  });
});

describe('aparência (FUN-28, FUN-30)', () => {
  it('FUN-28/FUN-30: escolher sépia põe data-tema="sepia" no <html> e grava', () => {
    const { result } = renderHook(() => useLeitor());
    act(() => result.current.escolherTema('sepia'));
    expect(document.documentElement.dataset.tema).toBe('sepia');
    expect(JSON.parse(localStorage.getItem(CHAVES.tema) ?? 'null')).toBe('sepia');
  });

  it('FUN-24/FUN-30: aumentar a letra põe data-letra="4" e grava 4', () => {
    const { result } = renderHook(() => useLeitor());
    expect(document.documentElement.dataset.letra).toBe('3');
    act(() => result.current.mudarLetra(1));
    expect(document.documentElement.dataset.letra).toBe('4');
    expect(JSON.parse(localStorage.getItem(CHAVES.letra) ?? 'null')).toBe(4);
  });

  it('FUN-25/FUN-30: diminuir a letra põe data-letra="2" e grava 2', () => {
    const { result } = renderHook(() => useLeitor());
    act(() => result.current.mudarLetra(-1));
    expect(document.documentElement.dataset.letra).toBe('2');
    expect(JSON.parse(localStorage.getItem(CHAVES.letra) ?? 'null')).toBe(2);
  });
});

describe('download dos livros que faltam (FUN-33)', () => {
  it('FUN-33: baixarFaltantes é chamado uma vez, só depois do primeiro capítulo pronto', async () => {
    const primeiro = adiada<Livro>();
    dubles.carregarLivro.mockImplementationOnce(() => primeiro.promessa);
    localStorage.setItem(CHAVES.leitura, JSON.stringify({ livro: n('Salmos'), capitulo: 26 }));
    const { result } = renderHook(() => useLeitor());

    expect(result.current.carga?.situacao).toBe('carregando');
    expect(dubles.baixarFaltantes).not.toHaveBeenCalled();
    expect(dubles.limparAntigos).not.toHaveBeenCalled();

    await act(async () => primeiro.resolver(livroFalso(n('Salmos'))));
    await waitFor(() => expect(dubles.baixarFaltantes).toHaveBeenCalledTimes(1));
    expect(dubles.limparAntigos).toHaveBeenCalledTimes(1);
    expect(dubles.limparAntigos.mock.invocationCallOrder[0]).toBeLessThan(
      dubles.baixarFaltantes.mock.invocationCallOrder[0]!,
    );

    // Outro capítulo e outro livro não disparam de novo.
    act(() => result.current.seguinte());
    act(() => result.current.trocarLivro());
    act(() => result.current.escolherLivro(n('Judas')));
    await waitFor(() => expect(result.current.carga?.situacao).toBe('pronto'));
    expect(dubles.baixarFaltantes).toHaveBeenCalledTimes(1);
  });

  it('FUN-33: sem capítulo aberto (escolha de livro), não baixa nada', () => {
    renderHook(() => useLeitor());
    expect(dubles.baixarFaltantes).not.toHaveBeenCalled();
  });

  it('FUN-33: livro não baixado não dispara o download', async () => {
    dubles.carregarLivro.mockRejectedValue(new LivroNaoBaixado(n('Salmos')));
    localStorage.setItem(CHAVES.leitura, JSON.stringify({ livro: n('Salmos'), capitulo: 26 }));
    const { result } = renderHook(() => useLeitor());
    await waitFor(() => expect(result.current.carga?.situacao).toBe('naoBaixado'));
    expect(dubles.baixarFaltantes).not.toHaveBeenCalled();
  });

  it('erro em limparAntigos não impede o download', async () => {
    dubles.limparAntigos.mockRejectedValue(new Error('cache recusado'));
    localStorage.setItem(CHAVES.leitura, JSON.stringify({ livro: n('Salmos'), capitulo: 26 }));
    renderHook(() => useLeitor());
    await waitFor(() => expect(dubles.baixarFaltantes).toHaveBeenCalledTimes(1));
  });
});

describe('carregamento do livro', () => {
  it('trocar de livro antes do anterior carregar mostra só o último pedido', async () => {
    const salmos = adiada<Livro>();
    const judas = adiada<Livro>();
    dubles.carregarLivro.mockImplementation((numero) =>
      numero === n('Salmos') ? salmos.promessa : numero === n('Judas') ? judas.promessa : Promise.reject(new Error()),
    );
    localStorage.setItem(CHAVES.leitura, JSON.stringify({ livro: n('Salmos'), capitulo: 26 }));
    const { result } = renderHook(() => useLeitor());

    act(() => result.current.trocarLivro());
    act(() => result.current.escolherLivro(n('Judas')));
    expect(result.current.carga).toEqual({ situacao: 'carregando', numero: n('Judas') });

    await act(async () => judas.resolver(livroFalso(n('Judas'))));
    await act(async () => salmos.resolver(livroFalso(n('Salmos'))));

    expect(result.current.estado.ref).toEqual({ livro: n('Judas'), capitulo: 1 });
    expect(result.current.carga?.situacao).toBe('pronto');
    expect(result.current.carga?.situacao === 'pronto' && result.current.carga.livro.numero).toBe(n('Judas'));
  });

  it('a resposta atrasada do livro anterior não troca o estado do livro atual', async () => {
    const salmos = adiada<Livro>();
    const judas = adiada<Livro>();
    dubles.carregarLivro.mockImplementation((numero) => (numero === n('Salmos') ? salmos.promessa : judas.promessa));
    localStorage.setItem(CHAVES.leitura, JSON.stringify({ livro: n('Salmos'), capitulo: 26 }));
    const { result } = renderHook(() => useLeitor());

    act(() => result.current.trocarLivro());
    act(() => result.current.escolherLivro(n('Judas')));
    await act(async () => salmos.resolver(livroFalso(n('Salmos'))));

    expect(result.current.carga).toEqual({ situacao: 'carregando', numero: n('Judas') });
  });

  it('FUN-36: sem rede e fora do cache, a carga fica naoBaixado', async () => {
    dubles.carregarLivro.mockRejectedValue(new LivroNaoBaixado(n('Romanos')));
    localStorage.setItem(CHAVES.leitura, JSON.stringify({ livro: n('Romanos'), capitulo: 8 }));
    const { result } = renderHook(() => useLeitor());
    await waitFor(() => expect(result.current.carga).toEqual({ situacao: 'naoBaixado', numero: n('Romanos') }));
  });

  it('FUN-36: erro que não é falta de rede (JSON ilegível, servidor com erro) também fica naoBaixado', async () => {
    dubles.carregarLivro.mockRejectedValue(new SyntaxError('Unexpected token < in JSON'));
    localStorage.setItem(CHAVES.leitura, JSON.stringify({ livro: n('Romanos'), capitulo: 8 }));
    const { result } = renderHook(() => useLeitor());
    await waitFor(() => expect(result.current.carga).toEqual({ situacao: 'naoBaixado', numero: n('Romanos') }));
    expect(dubles.baixarFaltantes).not.toHaveBeenCalled();
  });

  it('outro capítulo do mesmo livro não carrega o livro de novo', async () => {
    localStorage.setItem(CHAVES.leitura, JSON.stringify({ livro: n('Salmos'), capitulo: 26 }));
    const { result } = renderHook(() => useLeitor());
    await waitFor(() => expect(result.current.carga?.situacao).toBe('pronto'));
    const chamadas = dubles.carregarLivro.mock.calls.length;
    act(() => result.current.seguinte());
    expect(result.current.carga?.situacao).toBe('pronto');
    expect(dubles.carregarLivro).toHaveBeenCalledTimes(chamadas);
  });

  it('depois de naoBaixado, abrir o mesmo livro de novo tenta outra vez', async () => {
    dubles.carregarLivro.mockRejectedValueOnce(new LivroNaoBaixado(n('Salmos')));
    localStorage.setItem(CHAVES.leitura, JSON.stringify({ livro: n('Salmos'), capitulo: 26 }));
    const { result } = renderHook(() => useLeitor());
    await waitFor(() => expect(result.current.carga?.situacao).toBe('naoBaixado'));

    act(() => result.current.trocarLivro());
    act(() => result.current.escolherLivro(n('Salmos')));
    act(() => result.current.abrirCapitulo({ livro: n('Salmos'), capitulo: 26 }));
    await waitFor(() => expect(result.current.carga?.situacao).toBe('pronto'));
  });
});
