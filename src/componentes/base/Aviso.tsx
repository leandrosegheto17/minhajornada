import type { ReactNode } from 'react';
import estilo from './Aviso.module.css';

interface Props {
  /** `erro` é anunciado na hora (`role="alert"`, FUN-36); `neutro`, não. */
  variante: 'neutro' | 'erro';
  /** Sempre texto: nunca vira HTML (FUN-04). */
  mensagem: string;
  /** Ícone decorativo (um `<svg class="icone" aria-hidden="true">`). */
  icone?: ReactNode;
}

export function Aviso({ variante, mensagem, icone }: Props) {
  const classes = variante === 'erro' ? `${estilo.aviso} ${estilo['aviso--erro']}` : estilo.aviso;
  return (
    <div className={classes} role={variante === 'erro' ? 'alert' : undefined}>
      {icone}
      <p>{mensagem}</p>
    </div>
  );
}
