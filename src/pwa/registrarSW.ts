/**
 * Registra o service worker depois do `load` (FUN-35, FUN-37), só no build. Não usa `virtual:pwa-register`: no modo
 * `autoUpdate` ele recarrega a página quando o SW novo assume, e a leitura em curso não pode ser interrompida.
 */
export function registrarSW(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((erro: unknown) => {
      console.warn('Service worker não registrado; o app funciona só com rede.', erro);
    });
  });
}
