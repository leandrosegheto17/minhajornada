import { afterEach, describe, expect, it, vi } from 'vitest';
import { ehSafariIOS, estaInstalado } from './instalacao';

const UA = {
  safariIPhone:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
  safariIPad:
    'Mozilla/5.0 (iPad; CPU OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1',
  safariMac:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15',
  chromeIPhone:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0.6778.73 Mobile/15E148 Safari/604.1',
  firefoxIPhone:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/133.0 Mobile/15E148 Safari/605.1.15',
  edgeIPhone:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 EdgiOS/131.2903.68 Mobile/15E148 Safari/605.1.15',
  chromeAndroid:
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
  chromeMac:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
};

describe('ehSafariIOS (FUN-46)', () => {
  it.each([
    ['Safari do iPhone', UA.safariIPhone, 'iPhone', 5],
    ['Safari do iPad', UA.safariIPad, 'iPad', 5],
    ['Safari do iPad que se apresenta como Mac (MacIntel com toque)', UA.safariMac, 'MacIntel', 5],
  ])('FUN-46: %s = sim', (_nome, ua, plataforma, toques) => {
    expect(ehSafariIOS(ua, plataforma, toques)).toBe(true);
  });

  it.each([
    ['Chrome do iPhone (CriOS)', UA.chromeIPhone, 'iPhone', 5],
    ['Firefox do iPhone (FxiOS)', UA.firefoxIPhone, 'iPhone', 5],
    ['Edge do iPhone (EdgiOS)', UA.edgeIPhone, 'iPhone', 5],
    ['Chrome do Android', UA.chromeAndroid, 'Linux armv8l', 5],
    ['Safari do Mac sem toque', UA.safariMac, 'MacIntel', 0],
    ['Safari do Mac com um ponto de toque só', UA.safariMac, 'MacIntel', 1],
    ['Chrome do Mac com toque', UA.chromeMac, 'MacIntel', 5],
  ])('FUN-46: %s = não', (_nome, ua, plataforma, toques) => {
    expect(ehSafariIOS(ua, plataforma, toques)).toBe(false);
  });

  it('navegador embutido sem "Safari/" no agente não conta', () => {
    const embutido =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148';
    expect(ehSafariIOS(embutido, 'iPhone', 5)).toBe(false);
  });
});

describe('estaInstalado (FUN-48)', () => {
  const matchMediaOriginal = window.matchMedia;

  function simularStandalone(casa: boolean) {
    window.matchMedia = vi.fn((consulta: string) => ({
      matches: casa && consulta === '(display-mode: standalone)',
      media: consulta,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    })) as typeof window.matchMedia;
  }

  afterEach(() => {
    window.matchMedia = matchMediaOriginal;
    Reflect.deleteProperty(navigator, 'standalone');
  });

  it('FUN-48: display-mode standalone por matchMedia = instalado', () => {
    simularStandalone(true);
    expect(estaInstalado()).toBe(true);
  });

  it('FUN-48: navigator.standalone (iOS) = instalado', () => {
    simularStandalone(false);
    Object.defineProperty(navigator, 'standalone', { configurable: true, value: true });
    expect(estaInstalado()).toBe(true);
  });

  it('FUN-48: no navegador, sem standalone = não instalado', () => {
    simularStandalone(false);
    Object.defineProperty(navigator, 'standalone', { configurable: true, value: false });
    expect(estaInstalado()).toBe(false);
  });

  it('FUN-48: sem matchMedia e sem navigator.standalone = não instalado', () => {
    // @ts-expect-error simula um navegador sem matchMedia
    window.matchMedia = undefined;
    expect(estaInstalado()).toBe(false);
  });
});
