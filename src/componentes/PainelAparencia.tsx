import type { Tema } from '../biblia/tipos';
import { LETRA_MAX, LETRA_MIN } from '../dados/preferencias';
import { BotaoIcone } from './base/Botoes';
import { IconeMais, IconeMenos } from './icones';
import estilo from './PainelAparencia.module.css';

export const ID_PAINEL_APARENCIA = 'painel-aparencia';

const TEMAS: { tema: Tema; nome: string }[] = [
  { tema: 'claro', nome: 'Claro' },
  { tema: 'escuro', nome: 'Escuro' },
  { tema: 'sepia', nome: 'Sépia' },
];

interface Props {
  aberto: boolean;
  letra: number;
  /** `null` = o tema do sistema: nenhuma opção marcada. */
  tema: Tema | null;
  aoMudarLetra: (delta: 1 | -1) => void;
  aoEscolherTema: (tema: Tema) => void;
}

/**
 * Letra e tema (.specs/mockup/guia.html, "Painel de aparência"): − e + mudam a letra na hora e ficam desativados nos
 * limites (FUN-24 a FUN-27); Claro, Escuro e Sépia mudam o tema na hora, com `aria-pressed` no escolhido (FUN-28).
 */
export function PainelAparencia({ aberto, letra, tema, aoMudarLetra, aoEscolherTema }: Props) {
  return (
    <section id={ID_PAINEL_APARENCIA} className={estilo['painel-aparencia']} aria-label="Aparência" hidden={!aberto}>
      <h2>Aparência</h2>
      <div className={estilo['painel-linha']}>
        <span className={estilo['painel-rotulo']} id="rotulo-letra">
          Tamanho da letra
        </span>
        <div className={estilo['controle-letra']} role="group" aria-labelledby="rotulo-letra">
          <BotaoIcone rotulo="Diminuir letra" disabled={letra <= LETRA_MIN} onClick={() => aoMudarLetra(-1)}>
            <IconeMenos />
          </BotaoIcone>
          <output aria-live="polite">
            Letra {letra} de {LETRA_MAX}
          </output>
          <BotaoIcone rotulo="Aumentar letra" disabled={letra >= LETRA_MAX} onClick={() => aoMudarLetra(1)}>
            <IconeMais />
          </BotaoIcone>
        </div>
      </div>
      <div className={estilo['painel-linha']}>
        <span className={estilo['painel-rotulo']} id="rotulo-tema">
          Tema
        </span>
        <div className={estilo['seletor-tema']} role="group" aria-labelledby="rotulo-tema">
          {TEMAS.map((opcao) => (
            <button
              key={opcao.tema}
              type="button"
              className={estilo['opcao-tema']}
              aria-pressed={tema === opcao.tema}
              onClick={() => aoEscolherTema(opcao.tema)}
            >
              {opcao.nome}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
