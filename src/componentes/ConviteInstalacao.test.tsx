import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CHAVES } from '../dados/preferencias';
import { ConviteInstalacao } from './ConviteInstalacao';

const SAFARI_IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1';
const CHROME_ANDROID =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36';

const matchMediaOriginal = window.matchMedia;

function simularNavegador(ua: string, plataforma: string, toques: number) {
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(ua);
  vi.spyOn(navigator, 'platform', 'get').mockReturnValue(plataforma);
  // O jsdom não define maxTouchPoints: vi.spyOn não alcança a propriedade ausente.
  Object.defineProperty(navigator, 'maxTouchPoints', { value: toques, configurable: true });
}

function simularInstalado(instalado: boolean) {
  window.matchMedia = vi.fn((consulta: string) => ({
    matches: instalado && consulta === '(display-mode: standalone)',
    media: consulta,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
}

const convite = () => screen.queryByRole('region', { name: 'Instalar o app' });

beforeEach(() => {
  localStorage.clear();
  simularInstalado(false);
});

afterEach(() => {
  vi.restoreAllMocks();
  window.matchMedia = matchMediaOriginal;
  localStorage.clear();
});

describe('ConviteInstalacao', () => {
  it('FUN-46: no Safari do iPhone, sem dispensa, mostra a instrução e o botão de dispensar', () => {
    simularNavegador(SAFARI_IPHONE, 'iPhone', 5);
    render(<ConviteInstalacao />);
    expect(convite()).toHaveTextContent('Toque em Compartilhar e depois em Adicionar à Tela de Início');
    expect(screen.getByRole('button', { name: 'Dispensar convite' })).toBeInTheDocument();
  });

  it('FUN-46: fora do Safari do iPhone e do iPad (Chrome do Android), não aparece', () => {
    simularNavegador(CHROME_ANDROID, 'Linux armv8l', 5);
    render(<ConviteInstalacao />);
    expect(convite()).toBeNull();
  });

  it('FUN-47: dispensar esconde o convite e grava; montado de novo, não aparece', () => {
    simularNavegador(SAFARI_IPHONE, 'iPhone', 5);
    const { unmount } = render(<ConviteInstalacao />);
    fireEvent.click(screen.getByRole('button', { name: 'Dispensar convite' }));
    expect(convite()).toBeNull();
    expect(localStorage.getItem(CHAVES.convite)).toBe('true');

    unmount();
    render(<ConviteInstalacao />);
    expect(convite()).toBeNull();
  });

  it('FUN-48: instalado (standalone), não aparece', () => {
    simularNavegador(SAFARI_IPHONE, 'iPhone', 5);
    simularInstalado(true);
    render(<ConviteInstalacao />);
    expect(convite()).toBeNull();
  });

  it('FUN-48: instalado pelo navigator.standalone do iOS, não aparece', () => {
    simularNavegador(SAFARI_IPHONE, 'iPhone', 5);
    Object.defineProperty(navigator, 'standalone', { configurable: true, value: true });
    try {
      render(<ConviteInstalacao />);
      expect(convite()).toBeNull();
    } finally {
      Reflect.deleteProperty(navigator, 'standalone');
    }
  });
});
