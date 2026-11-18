import { BotaoPrimario } from '../componentes/base/Botoes';
import estilo from './livro.module.css';

/** Capa do livro (FUN-89; mockup `telas/capa.html`, `.pagina--capa`): "Bíblia Sagrada", a tradução e a marca. */
export function CapaLivro({ lado = 'unica' }: { lado?: 'direita' | 'unica' }) {
  return (
    <article
      className={`${estilo.pagina} ${estilo['pagina--capa']} ${lado === 'direita' ? estilo['pagina--direita'] : ''}`}
      aria-label="Capa"
    >
      <span className={estilo['capa__filete']} aria-hidden="true" />
      <div>
        <h2 className={estilo['capa__titulo']}>Bíblia Sagrada</h2>
        <p className={estilo['capa__traducao']}>Bíblia Livre</p>
      </div>
      <span className={estilo['capa__marca']}>MinhaJornada</span>
    </article>
  );
}

export const TEXTO_PAGO =
  'O plano de estudo ainda não está disponível. Quando chegar, você poderá fazer anotações ao lado do texto, preparar pregações e aulas e guardar tudo na sua conta.';

interface PropsPago {
  /** "Quero saber" (FUN-92): abre a tela "em breve". */
  aoQueroSaber: () => void;
  lado?: 'esquerda' | 'unica';
}

/** Página do plano de estudo, antes de Gênesis (FUN-90, FUN-92): diz que ainda não está disponível. */
export function PaginaPago({ aoQueroSaber, lado = 'unica' }: PropsPago) {
  return (
    <article
      className={`${estilo.pagina} ${estilo['pagina--pago']} ${lado === 'esquerda' ? estilo['pagina--esquerda'] : ''}`}
      aria-label="Plano de estudo"
    >
      <span className={estilo['selo-em-breve']}>Em breve</span>
      <h2>Plano de estudo</h2>
      <p>{TEXTO_PAGO}</p>
      <BotaoPrimario onClick={aoQueroSaber}>Quero saber</BotaoPrimario>
    </article>
  );
}
