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

describe('abertura (FUN-51, FUN-54, FUN-55; substitui FUN-20 e FUN-21)', () => {
  it('FUN-51: com leitura gravada, abre a página inicial sem carregar nada; "Ler Bíblia" abre o capítulo e carrega o livro', async () => {
    localStorage.setItem(CHAVES.leitura, JSON.stringify({ livro: n('Romanos'), capitulo: 8 }));
    const { result } = renderHook(() => useLeitor());
    expect(result.current.estado.tela).toBe('inicial');
    expect(result.current.estado.ref).toEqual({ livro: n('Romanos'), capitulo: 8 });
    expect(result.current.carga).toBeNull();
    expect(dubles.carregarLivro).not.toHaveBeenCalled();
    act(() => result.current.lerBiblia());
    expect(result.current.estado.tela).toBe('leitor');
    await waitFor(() => expect(result.current.carga?.situacao).toBe('pronto'));
    expect(dubles.carregarLivro).toHaveBeenCalledWith(n('Romanos'));
  });

  it('FUN-51/FUN-55: sem leitura gravada, abre a página inicial; "Ler Bíblia" abre a escolha de livro, sem carregar nada', () => {
    const { result } = renderHook(() => useLeitor());
    expect(result.current.estado.tela).toBe('inicial');
    expect(result.current.carga).toBeNull();
    act(() => result.current.lerBiblia());
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

describe('formato e âncora (FUN-66, FUN-68, FUN-85, FUN-87)', () => {
  const rute = () => n('Rute');
  const aberturaNoLivro = (ref: { livro: number; capitulo: number } | null) => {
    localStorage.setItem(CHAVES.formato, JSON.stringify('livro'));
    if (ref) localStorage.setItem(CHAVES.leitura, JSON.stringify(ref));
    const pronto = renderHook(() => useLeitor());
    act(() => pronto.result.current.lerBiblia());
    return pronto;
  };

  it('FUN-66: o formato gravado é lido na abertura e nada é regravado', () => {
    localStorage.setItem(CHAVES.formato, JSON.stringify('livro'));
    const { result } = renderHook(() => useLeitor());
    expect(result.current.estado.formato).toBe('livro');
    expect(localStorage.getItem(CHAVES.formato)).toBe('"livro"');
  });

  it('FUN-68: trocar o formato grava mj:formato nas duas direções', () => {
    const { result } = renderHook(() => useLeitor());
    expect(localStorage.getItem(CHAVES.formato)).toBeNull();
    act(() => result.current.trocarFormato());
    expect(result.current.estado.formato).toBe('livro');
    expect(JSON.parse(localStorage.getItem(CHAVES.formato) ?? 'null')).toBe('livro');
    act(() => result.current.trocarFormato());
    expect(JSON.parse(localStorage.getItem(CHAVES.formato) ?? 'null')).toBe('rolagem');
  });

  it('FUN-85: a âncora Rute 2:5 grava {livro: 8, capitulo: 2}', () => {
    const { result } = aberturaNoLivro({ livro: rute(), capitulo: 1 });
    act(() => result.current.irParaAncora({ tipo: 'texto', ref: { livro: rute(), capitulo: 2 }, versiculo: 5 }));
    expect(rute()).toBe(8);
    expect(JSON.parse(localStorage.getItem(CHAVES.leitura) ?? 'null')).toEqual({ livro: 8, capitulo: 2 });
  });

  it('FUN-85: a capa e o texto do plano pago não gravam nem apagam a leitura', () => {
    const { result } = aberturaNoLivro({ livro: rute(), capitulo: 2 });
    act(() => result.current.irParaAncora({ tipo: 'capa' }));
    expect(JSON.parse(localStorage.getItem(CHAVES.leitura) ?? 'null')).toEqual({ livro: 8, capitulo: 2 });
    act(() => result.current.irParaAncora({ tipo: 'pago' }));
    expect(JSON.parse(localStorage.getItem(CHAVES.leitura) ?? 'null')).toEqual({ livro: 8, capitulo: 2 });
  });

  it('FUN-85: sem leitura gravada, abrir a capa do livro não grava nem carrega nada', () => {
    const { result } = aberturaNoLivro(null);
    expect(result.current.estado.ancora).toEqual({ tipo: 'capa' });
    expect(localStorage.getItem(CHAVES.leitura)).toBeNull();
    expect(dubles.carregarLivro).not.toHaveBeenCalled();
  });

  it('FUN-85: a âncora "fim" não grava a leitura', () => {
    const { result } = aberturaNoLivro({ livro: n('Salmos'), capitulo: 23 });
    act(() => result.current.irParaAncora({ tipo: 'fim', livro: rute() }));
    expect(JSON.parse(localStorage.getItem(CHAVES.leitura) ?? 'null')).toEqual({ livro: n('Salmos'), capitulo: 23 });
  });

  it('FUN-84: a âncora "fim" de Rute carrega o livro 8', async () => {
    const { result } = aberturaNoLivro({ livro: n('Salmos'), capitulo: 23 });
    await waitFor(() => expect(result.current.carga).toMatchObject({ situacao: 'pronto', numero: n('Salmos') }));
    act(() => result.current.irParaAncora({ tipo: 'fim', livro: rute() }));
    expect(dubles.carregarLivro).toHaveBeenCalledWith(8);
    await waitFor(() => expect(result.current.carga).toMatchObject({ situacao: 'pronto', numero: 8 }));
  });

  it('FUN-84: a âncora de texto em outro livro carrega o livro dela', async () => {
    const { result } = aberturaNoLivro({ livro: rute(), capitulo: 4 });
    await waitFor(() => expect(result.current.carga?.situacao).toBe('pronto'));
    const samuel = n('1 Samuel');
    act(() => result.current.irParaAncora({ tipo: 'texto', ref: { livro: samuel, capitulo: 1 }, versiculo: 1 }));
    await waitFor(() => expect(result.current.carga).toMatchObject({ situacao: 'pronto', numero: samuel }));
  });

  it('FUN-87: livro da âncora fora do cache e sem rede fica naoBaixado', async () => {
    dubles.carregarLivro.mockRejectedValue(new LivroNaoBaixado(rute()));
    const { result } = aberturaNoLivro({ livro: n('Salmos'), capitulo: 23 });
    act(() => result.current.irParaAncora({ tipo: 'fim', livro: rute() }));
    await waitFor(() => expect(result.current.carga).toEqual({ situacao: 'naoBaixado', numero: rute() }));
  });

  it('FUN-57: "em breve" guarda a tela de origem e "voltar" retorna a ela', () => {
    const { result } = renderHook(() => useLeitor());
    act(() => result.current.abrirEmBreve());
    expect(result.current.estado.tela).toBe('emBreve');
    act(() => result.current.voltar());
    expect(result.current.estado.tela).toBe('inicial');
  });
});

describe('download dos livros que faltam (FUN-33)', () => {
  it('FUN-33: baixarFaltantes é chamado uma vez, só depois do primeiro capítulo pronto', async () => {
    const primeiro = adiada<Livro>();
    dubles.carregarLivro.mockImplementationOnce(() => primeiro.promessa);
    localStorage.setItem(CHAVES.leitura, JSON.stringify({ livro: n('Salmos'), capitulo: 26 }));
    const { result } = renderHook(() => useLeitor());
    act(() => result.current.lerBiblia());

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

  it('FUN-33: sem capítulo aberto (página inicial e escolha de livro), não baixa nada', () => {
    const { result } = renderHook(() => useLeitor());
    act(() => result.current.lerBiblia());
    expect(dubles.baixarFaltantes).not.toHaveBeenCalled();
  });

  it('FUN-33: livro não baixado não dispara o download', async () => {
    dubles.carregarLivro.mockRejectedValue(new LivroNaoBaixado(n('Salmos')));
    localStorage.setItem(CHAVES.leitura, JSON.stringify({ livro: n('Salmos'), capitulo: 26 }));
    const { result } = renderHook(() => useLeitor());
    act(() => result.current.lerBiblia());
    await waitFor(() => expect(result.current.carga?.situacao).toBe('naoBaixado'));
    expect(dubles.baixarFaltantes).not.toHaveBeenCalled();
  });

  it('erro em limparAntigos não impede o download', async () => {
    dubles.limparAntigos.mockRejectedValue(new Error('cache recusado'));
    localStorage.setItem(CHAVES.leitura, JSON.stringify({ livro: n('Salmos'), capitulo: 26 }));
    const { result } = renderHook(() => useLeitor());
    act(() => result.current.lerBiblia());
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
    act(() => result.current.lerBiblia());

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
    act(() => result.current.lerBiblia());

    act(() => result.current.trocarLivro());
    act(() => result.current.escolherLivro(n('Judas')));
    await act(async () => salmos.resolver(livroFalso(n('Salmos'))));

    expect(result.current.carga).toEqual({ situacao: 'carregando', numero: n('Judas') });
  });

  it('FUN-36: sem rede e fora do cache, a carga fica naoBaixado', async () => {
    dubles.carregarLivro.mockRejectedValue(new LivroNaoBaixado(n('Romanos')));
    localStorage.setItem(CHAVES.leitura, JSON.stringify({ livro: n('Romanos'), capitulo: 8 }));
    const { result } = renderHook(() => useLeitor());
    act(() => result.current.lerBiblia());
    await waitFor(() => expect(result.current.carga).toEqual({ situacao: 'naoBaixado', numero: n('Romanos') }));
  });

  it('FUN-36: erro que não é falta de rede (JSON ilegível, servidor com erro) também fica naoBaixado', async () => {
    dubles.carregarLivro.mockRejectedValue(new SyntaxError('Unexpected token < in JSON'));
    localStorage.setItem(CHAVES.leitura, JSON.stringify({ livro: n('Romanos'), capitulo: 8 }));
    const { result } = renderHook(() => useLeitor());
    act(() => result.current.lerBiblia());
    await waitFor(() => expect(result.current.carga).toEqual({ situacao: 'naoBaixado', numero: n('Romanos') }));
    expect(dubles.baixarFaltantes).not.toHaveBeenCalled();
  });

  it('outro capítulo do mesmo livro não carrega o livro de novo', async () => {
    localStorage.setItem(CHAVES.leitura, JSON.stringify({ livro: n('Salmos'), capitulo: 26 }));
    const { result } = renderHook(() => useLeitor());
    act(() => result.current.lerBiblia());
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
    act(() => result.current.lerBiblia());
    await waitFor(() => expect(result.current.carga?.situacao).toBe('naoBaixado'));

    act(() => result.current.trocarLivro());
    act(() => result.current.escolherLivro(n('Salmos')));
    act(() => result.current.abrirCapitulo({ livro: n('Salmos'), capitulo: 26 }));
    await waitFor(() => expect(result.current.carga?.situacao).toBe('pronto'));
  });
});

describe('tela "entrar" (FUN-137, FUN-138)', () => {
  it('FUN-138: abrirEntrar abre a tela e "voltar" retorna à tela de origem', () => {
    const { result } = renderHook(() => useLeitor());
    act(() => result.current.abrirEntrar());
    expect(result.current.estado.tela).toBe('entrar');
    act(() => result.current.voltar());
    expect(result.current.estado.tela).toBe('inicial');
  });
});
