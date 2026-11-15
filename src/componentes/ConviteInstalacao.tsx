import { useState } from 'react';
import { conviteDispensado, dispensarConvite } from '../dados/preferencias';
import { ehSafariIOS, estaInstalado } from '../pwa/instalacao';
import { BotaoIcone } from './base/Botoes';
import estilo from './ConviteInstalacao.module.css';

export const INSTRUCAO_INSTALAR = 'Toque em Compartilhar e depois em Adicionar à Tela de Início';

/** Mostrar o convite (FUN-46 a FUN-48): só no Safari do iPhone e do iPad, fora do modo instalado e sem dispensa. */
function deveMostrar(): boolean {
  if (!ehSafariIOS(navigator.userAgent, navigator.platform, navigator.maxTouchPoints ?? 0)) return false;
  if (estaInstalado()) return false;
  return !conviteDispensado();
}

function IconeCompartilhar() {
  return (
    <svg className="icone" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 15V3M8 7l4-4 4 4M5 11v9h14v-9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconeFechar() {
  return (
    <svg className="icone" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

/** Convite de instalação no iPhone e no iPad (FUN-46); dispensado, some e não volta neste aparelho (FUN-47). */
export function ConviteInstalacao() {
  const [visivel, setVisivel] = useState(deveMostrar);
  if (!visivel) return null;

  return (
    <div className={estilo['convite-instalacao']} role="region" aria-label="Instalar o app">
      <IconeCompartilhar />
      <p>Para ler sem internet, instale o app. {INSTRUCAO_INSTALAR}.</p>
      <BotaoIcone
        rotulo="Dispensar convite"
        onClick={() => {
          dispensarConvite();
          setVisivel(false);
        }}
      >
        <IconeFechar />
      </BotaoIcone>
    </div>
  );
}
