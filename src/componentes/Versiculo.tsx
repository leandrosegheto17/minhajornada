import { Fragment } from 'react';
import { segmentar } from '../biblia/segmentos';
import estilo from './Versiculo.module.css';

interface Props {
  numero: number;
  /** Texto cru do versículo, com os colchetes do tradutor. */
  texto: string;
}

/**
 * Um versículo da lista (FUN-01): o número em pílula e o texto na mesma linha. O acréscimo do tradutor vai em `<em>`,
 * sem os colchetes (FUN-02). Tudo como nó de texto do React, nunca HTML (FUN-04).
 */
export function Versiculo({ numero, texto }: Props) {
  return (
    <li className={estilo.versiculo}>
      <span className={estilo['versiculo-numero']}>{numero}</span>
      <span className={estilo['versiculo-texto']}>
        {segmentar(texto).map((segmento, i) =>
          segmento.italico ? <em key={i}>{segmento.texto}</em> : <Fragment key={i}>{segmento.texto}</Fragment>,
        )}
      </span>
    </li>
  );
}
