import type { ButtonHTMLAttributes, ReactNode } from 'react';
import estilo from './Botoes.module.css';

type Base = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'className' | 'aria-label'>;

type PropsComTexto = Base & {
  children: ReactNode;
  /** Ícone decorativo antes do texto (um `<svg aria-hidden="true">`). */
  icone?: ReactNode;
};

/** Botão de destaque (fundo na cor de acento). */
export function BotaoPrimario({ icone, children, ...resto }: PropsComTexto) {
  return (
    <button {...resto} type="button" className={estilo['botao-primario']}>
      {icone}
      {children}
    </button>
  );
}

/** Botão de contorno. */
export function BotaoSecundario({ icone, children, ...resto }: PropsComTexto) {
  return (
    <button {...resto} type="button" className={estilo['botao-secundario']}>
      {icone}
      {children}
    </button>
  );
}

type PropsIcone = Base & {
  /** Rótulo acessível em português, obrigatório: o botão não tem texto visível (FUN-44). */
  rotulo: string;
  /** O ícone (um `<svg aria-hidden="true">`). */
  children: ReactNode;
};

/** Botão só com ícone. O `rotulo` vira o `aria-label` (FUN-44). */
export function BotaoIcone({ rotulo, children, ...resto }: PropsIcone) {
  return (
    <button {...resto} type="button" className={estilo['botao-icone']} aria-label={rotulo}>
      {children}
    </button>
  );
}

/** Botão de voltar: seta à esquerda e o destino como texto (ex.: "Salmos 27"). */
export function BotaoVoltar({ children, ...resto }: Base & { children: ReactNode }) {
  return (
    <button {...resto} type="button" className={estilo['botao-voltar']}>
      <svg className="icone-p" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M15 6l-6 6 6 6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {children}
    </button>
  );
}
