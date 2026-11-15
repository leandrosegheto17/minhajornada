/**
 * Safari do iPhone ou do iPad (FUN-46): só nele o convite de instalação aparece, porque o Safari não oferece o
 * pedido de instalação que o Chrome oferece. O iPadOS 13+ se apresenta como Mac (`MacIntel`); só o toque o distingue
 * de um Mac de verdade. Chrome (`CriOS`), Firefox (`FxiOS`), Edge (`EdgiOS`) e Opera (`OPiOS`) do iPhone não contam.
 */
export function ehSafariIOS(ua: string, plataforma: string, toques: number): boolean {
  const aparelhoIOS = /iPhone|iPad|iPod/.test(ua) || (plataforma === 'MacIntel' && toques > 1);
  if (!aparelhoIOS) return false;
  if (/CriOS|FxiOS|EdgiOS|OPiOS|Chrome\/|Edg\//.test(ua)) return false;
  return /Safari\//.test(ua);
}

/** O app roda instalado (FUN-48): `display-mode: standalone` (Chrome, Android) ou `navigator.standalone` (iOS). */
export function estaInstalado(): boolean {
  if (typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches) return true;
  return (navigator as Navigator & { standalone?: boolean }).standalone === true;
}
