import { BotaoVoltar } from '../componentes/base/Botoes';
import { Estado } from '../componentes/base/Estado';
import { IconeConta } from '../componentes/icones';
import escolha from './Escolha.module.css';

interface Props {
  aoVoltar: () => void;
  /** "Ler Bíblia" (FUN-54, FUN-55). */
  aoLerBiblia: () => void;
}

export const TITULO_EM_BREVE = 'Conta e plano de estudo: em breve';

/**
 * Tela "em breve" (FUN-57; mockup `telas/em-breve.html`): a conta e o plano de estudo ainda não existem. Oferece
 * "Voltar" (à tela de onde veio) e "Ler Bíblia".
 */
export function TelaEmBreve({ aoVoltar, aoLerBiblia }: Props) {
  return (
    <main className={escolha['tela-escolha']}>
      <BotaoVoltar onClick={aoVoltar}>Voltar</BotaoVoltar>
      <Estado
        variante="vazio"
        nivelTitulo={1}
        icone={<IconeConta />}
        titulo={TITULO_EM_BREVE}
        texto="Ainda não dá para criar conta. Ela vai chegar junto com o plano de estudo:"
        lista={['anotações ao lado do texto;', 'preparo de pregações e aulas;', 'tudo guardado na sua conta.']}
        acao={{ rotulo: 'Ler Bíblia', aoAcionar: aoLerBiblia }}
      />
    </main>
  );
}
