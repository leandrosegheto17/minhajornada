import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CHAVES,
  apagarLeitura,
  conviteDispensado,
  dispensarConvite,
  gravarFormato,
  gravarLeitura,
  gravarLetra,
  gravarTema,
  lerFormato,
  lerLeitura,
  lerLetra,
  lerTema,
} from './preferencias';

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('leitura gravada (FUN-19, FUN-22)', () => {
  it('FUN-19: grava e lê a leitura atual', () => {
    gravarLeitura({ livro: 45, capitulo: 8 });
    expect(localStorage.getItem(CHAVES.leitura)).toBe('{"livro":45,"capitulo":8}');
    expect(lerLeitura()).toEqual({ livro: 45, capitulo: 8 });
  });

  it('FUN-19: sem leitura gravada devolve null', () => {
    expect(lerLeitura()).toBeNull();
  });

  it('FUN-22: leitura ilegível (JSON quebrado) é apagada e devolve null', () => {
    localStorage.setItem(CHAVES.leitura, '{livro:45');
    expect(lerLeitura()).toBeNull();
    expect(localStorage.getItem(CHAVES.leitura)).toBeNull();
  });

  it.each([
    ['livro inexistente', '{"livro":67,"capitulo":1}'],
    ['capítulo fora do intervalo', '{"livro":19,"capitulo":151}'],
    ['tipo errado', '"Romanos 8"'],
  ])('FUN-22: leitura inválida (%s) é apagada e devolve null', (_caso, bruto) => {
    localStorage.setItem(CHAVES.leitura, bruto);
    expect(lerLeitura()).toBeNull();
    expect(localStorage.getItem(CHAVES.leitura)).toBeNull();
  });

  it('apagarLeitura remove a leitura gravada', () => {
    gravarLeitura({ livro: 1, capitulo: 1 });
    apagarLeitura();
    expect(lerLeitura()).toBeNull();
  });
});

describe('letra (FUN-23, FUN-30, FUN-31)', () => {
  it('FUN-30: grava e lê o tamanho da letra', () => {
    gravarLetra(5);
    expect(lerLetra()).toBe(5);
    gravarLetra(1);
    expect(lerLetra()).toBe(1);
  });

  it('FUN-23: sem letra gravada o padrão é 3', () => {
    expect(lerLetra()).toBe(3);
  });

  it.each([
    ['0', '0'],
    ['6', '6'],
    ['"3" em texto', '"3"'],
    ['2.5', '2.5'],
    ['lixo', 'lixo'],
    ['nulo', 'null'],
  ])('FUN-31: letra gravada %s devolve o padrão 3', (_caso, bruto) => {
    localStorage.setItem(CHAVES.letra, bruto);
    expect(lerLetra()).toBe(3);
  });

  it('FUN-30: gravarLetra fora de 1 a 5 não grava', () => {
    gravarLetra(4);
    gravarLetra(9);
    expect(lerLetra()).toBe(4);
  });
});

describe('tema (FUN-30, FUN-31)', () => {
  it.each(['claro', 'escuro', 'sepia'] as const)('FUN-30: grava e lê o tema %s', (tema) => {
    gravarTema(tema);
    expect(lerTema()).toBe(tema);
  });

  it('FUN-31: sem tema gravado devolve null (tema do sistema)', () => {
    expect(lerTema()).toBeNull();
  });

  it.each([
    ['desconhecido', '"azul"'],
    ['ilegível', 'sepia'],
    ['número', '2'],
  ])('FUN-31: tema %s devolve null (tema do sistema)', (_caso, bruto) => {
    localStorage.setItem(CHAVES.tema, bruto);
    expect(lerTema()).toBeNull();
  });
});

describe('formato de leitura (FUN-66, FUN-68, FUN-69)', () => {
  it('FUN-66: sem valor gravado o formato é rolagem', () => {
    expect(lerFormato()).toBe('rolagem');
  });

  it.each(['rolagem', 'livro'] as const)('FUN-68: grava e lê o formato %s em mj:formato', (formato) => {
    gravarFormato(formato);
    expect(localStorage.getItem(CHAVES.formato)).toBe(JSON.stringify(formato));
    expect(lerFormato()).toBe(formato);
  });

  it.each([
    ['ilegível', 'livro'],
    ['desconhecido', '"pagina"'],
    ['número', '2'],
    ['nulo', 'null'],
  ])('FUN-69: formato %s devolve rolagem', (_caso, bruto) => {
    localStorage.setItem(CHAVES.formato, bruto);
    expect(lerFormato()).toBe('rolagem');
  });

  it('FUN-69: sem localStorage, ler dá rolagem e gravar não lança', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() => gravarFormato('livro')).not.toThrow();
    expect(lerFormato()).toBe('rolagem');
  });

  it('FUN-68: formato inválido não é gravado', () => {
    gravarFormato('pagina' as never);
    expect(localStorage.getItem(CHAVES.formato)).toBeNull();
  });
});

describe('convite de instalação (FUN-47)', () => {
  it('FUN-47: dispensar o convite fica gravado', () => {
    expect(conviteDispensado()).toBe(false);
    dispensarConvite();
    expect(conviteDispensado()).toBe(true);
    expect(localStorage.getItem(CHAVES.convite)).toBe('true');
  });
});

describe('armazenamento indisponível', () => {
  it('localStorage que lança em getItem e setItem não quebra e devolve os padrões', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    expect(() => gravarLeitura({ livro: 1, capitulo: 1 })).not.toThrow();
    expect(() => gravarLetra(5)).not.toThrow();
    expect(() => gravarTema('sepia')).not.toThrow();
    expect(() => dispensarConvite()).not.toThrow();
    expect(lerLeitura()).toBeNull();
    expect(lerLetra()).toBe(3);
    expect(lerTema()).toBeNull();
    expect(conviteDispensado()).toBe(false);
  });

  it('sem localStorage nenhum, devolve os padrões', () => {
    vi.stubGlobal('localStorage', undefined);
    expect(() => gravarLetra(5)).not.toThrow();
    expect(lerLetra()).toBe(3);
    expect(lerLeitura()).toBeNull();
  });
});
