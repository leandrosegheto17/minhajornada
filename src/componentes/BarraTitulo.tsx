import { useState } from 'react';
import type { Formato, Tema } from '../biblia/tipos';
import { BotaoIcone } from './base/Botoes';
import estilo from './BarraTitulo.module.css';
import { IconeAparencia, IconeConta, IconeLivroAberto, IconeResumo, IconeRolagem, IconeSobre } from './icones';
import { ID_PAINEL_APARENCIA, PainelAparencia } from './PainelAparencia';

interface Props {
  formato: Formato;
  letra: number;
  tema: Tema | null;
  /** A marca leva à página inicial (FUN-62). */
  aoIrParaInicial: () => void;
  /** Botão de formato (FUN-67, FUN-72). */
  aoTrocarFormato: () => void;
  aoAbrirSobre: () => void;
  /** "Entrar / Criar conta" (FUN-64, FUN-137): abre a tela "Entrar". */
  aoAbrirConta: () => void;
  /** Há sessão aberta: o botão da conta passa a ser "Sair" (FUN-142). */
  comSessao?: boolean;
  /** "Sair" (FUN-143); só vale com sessão. */
  aoSair?: () => void;
  /** Botão "Resumo" (FUN-153, FUN-157, FUN-162): só existe quando a prop vem; `ligado` vira `aria-pressed`. */
  resumo?: { ligado: boolean; aoAlternar: () => void };
  aoMudarLetra: (delta: 1 | -1) => void;
  aoEscolherTema: (tema: Tema) => void;
}

/**
 * Barra de título comum a todas as telas (FUN-60, FUN-61; mockup `barra.js` e `componentes.css`): marca, formato,
 * "Aa" com o painel, Sobre e conta. Presa ao topo (FUN-65, `position: sticky` no CSS).
 */
export function BarraTitulo({
  formato,
  letra,
  tema,
  aoIrParaInicial,
  aoTrocarFormato,
  aoAbrirSobre,
  aoAbrirConta,
  comSessao = false,
  aoSair,
  resumo,
  aoMudarLetra,
  aoEscolherTema,
}: Props) {
  const [painelAberto, setPainelAberto] = useState(false);
  const paraLivro = formato === 'rolagem';

  return (
    <header className={estilo['barra-titulo']}>
      <div className={estilo['barra-titulo__conteudo']}>
        <button
          type="button"
          className={estilo.marca}
          aria-label="MinhaJornada, página inicial"
          onClick={aoIrParaInicial}
        >
          MinhaJornada
        </button>
        <div className={estilo['grupo-acoes']}>
          <button
            type="button"
            className={estilo['botao-formato']}
            aria-label={paraLivro ? 'Ler como livro' : 'Ler em rolagem'}
            onClick={aoTrocarFormato}
          >
            {paraLivro ? <IconeLivroAberto /> : <IconeRolagem />}
            <span className={estilo['rotulo-formato']}>{paraLivro ? 'Livro' : 'Rolagem'}</span>
          </button>
          {resumo ? (
            <button
              type="button"
              className={estilo['botao-alternar']}
              aria-label="Resumo"
              aria-pressed={resumo.ligado}
              onClick={resumo.aoAlternar}
            >
              <IconeResumo />
              <span className={estilo['rotulo-alternar']}>Resumo</span>
            </button>
          ) : null}
          <div className={estilo['ancora-painel']}>
            <BotaoIcone
              rotulo="Aparência: letra e tema"
              aria-expanded={painelAberto}
              aria-controls={ID_PAINEL_APARENCIA}
              onClick={() => setPainelAberto((aberto) => !aberto)}
            >
              <IconeAparencia />
            </BotaoIcone>
            <PainelAparencia
              aberto={painelAberto}
              letra={letra}
              tema={tema}
              aoMudarLetra={aoMudarLetra}
              aoEscolherTema={aoEscolherTema}
            />
          </div>
          <BotaoIcone rotulo="Sobre o MinhaJornada" onClick={aoAbrirSobre}>
            <IconeSobre />
          </BotaoIcone>
          <button
            type="button"
            className={estilo['botao-conta']}
            aria-label={comSessao ? 'Sair' : 'Entrar ou criar conta'}
            onClick={comSessao ? aoSair : aoAbrirConta}
          >
            <IconeConta />
            <span className={estilo['rotulo-conta']}>{comSessao ? 'Sair' : 'Entrar / Criar conta'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
