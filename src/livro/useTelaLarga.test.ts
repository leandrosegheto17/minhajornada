import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useTelaLarga } from './useTelaLarga';

const CONSULTA = '(min-width: 900px) and (orientation: landscape)';

/** `matchMedia` controlável: o teste liga e desliga a consulta e conta os ouvintes ativos. */
function simular(inicial: boolean) {
  let matches = inicial;
  const ouvintes = new Set<() => void>();
  const consultas: string[] = [];
  vi.spyOn(window, 'matchMedia').mockImplementation((consulta: string) => {
    consultas.push(consulta);
    return {
      get matches() {
        return matches;
      },
      media: consulta,
      onchange: null,
      addEventListener: (_tipo: string, ouvinte: () => void) => ouvintes.add(ouvinte),
      removeEventListener: (_tipo: string, ouvinte: () => void) => ouvintes.delete(ouvinte),
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    } as unknown as MediaQueryList;
  });
  return {
    consultas,
    ouvintes,
    mudar(valor: boolean) {
      matches = valor;
      ouvintes.forEach((ouvinte) => ouvinte());
    },
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useTelaLarga (FUN-73, FUN-74)', () => {
  it('FUN-73: usa a consulta exata (pelo menos 900 px de largura e mais larga que alta)', () => {
    const tela = simular(true);
    renderHook(() => useTelaLarga());
    expect(tela.consultas.length).toBeGreaterThan(0);
    expect(new Set(tela.consultas)).toEqual(new Set([CONSULTA]));
  });

  it('FUN-73: tela que casa com a consulta é larga', () => {
    simular(true);
    expect(renderHook(() => useTelaLarga()).result.current).toBe(true);
  });

  it('FUN-74: tela que não casa é estreita', () => {
    simular(false);
    expect(renderHook(() => useTelaLarga()).result.current).toBe(false);
  });

  it('FUN-73/FUN-74: muda quando a consulta muda (girar o aparelho, redimensionar)', () => {
    const tela = simular(false);
    const { result } = renderHook(() => useTelaLarga());
    expect(result.current).toBe(false);
    act(() => tela.mudar(true));
    expect(result.current).toBe(true);
    act(() => tela.mudar(false));
    expect(result.current).toBe(false);
  });

  it('remove o ouvinte ao desmontar', () => {
    const tela = simular(true);
    const { unmount } = renderHook(() => useTelaLarga());
    expect(tela.ouvintes.size).toBe(1);
    unmount();
    expect(tela.ouvintes.size).toBe(0);
  });

  it('FUN-74: sem matchMedia no navegador, a tela é estreita', () => {
    const original = window.matchMedia;
    Object.defineProperty(window, 'matchMedia', { configurable: true, writable: true, value: undefined });
    try {
      expect(renderHook(() => useTelaLarga()).result.current).toBe(false);
    } finally {
      Object.defineProperty(window, 'matchMedia', { configurable: true, writable: true, value: original });
    }
  });
});
