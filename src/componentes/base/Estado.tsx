import type { ReactNode } from 'react';
import { BotaoPrimario, BotaoSecundario } from './Botoes';
import estilo from './Estado.module.css';

interface Acao {
  rotulo: string;
  aoAcionar: () => void;
  /** Ícone decorativo do botão. */
  icone?: ReactNode;
}

type Props =
  /** Vazio: primeira visita (FUN-21). A ação é o botão primário; `lista` e `nivelTitulo` servem à tela "em breve" (FUN-57). */
  | {
      variante: 'vazio';
      titulo: string;
      texto: string;
      acao?: Acao;
      icone?: ReactNode;
      lista?: string[];
      nivelTitulo?: 1 | 2;
    }
  /** Carregando: esqueleto com `aria-busy`. `rotulo` nomeia o que carrega. */
  | { variante: 'carregando'; rotulo?: string }
  /** Erro: ex.: livro não baixado (FUN-36). A ação é o botão secundário. */
  | { variante: 'erro'; titulo: string; texto: string; acao?: Acao; icone?: ReactNode };

const LINHAS_ESQUELETO = 6;

export function Estado(props: Props) {
  if (props.variante === 'carregando') {
    return (
      <div className={estilo.estado} aria-busy="true">
        <div className={estilo.esqueleto} role="status" aria-label={props.rotulo ?? 'Carregando o capítulo'}>
          {Array.from({ length: LINHAS_ESQUELETO }, (_, i) => (
            <span key={i} />
          ))}
        </div>
      </div>
    );
  }

  const { variante, titulo, texto, acao, icone } = props;
  const lista = props.variante === 'vazio' ? props.lista : undefined;
  const Titulo = props.variante === 'vazio' && props.nivelTitulo === 1 ? 'h1' : 'h2';
  const Botao = variante === 'erro' ? BotaoSecundario : BotaoPrimario;
  return (
    <div className={estilo.estado}>
      {icone}
      <Titulo>{titulo}</Titulo>
      <p>{texto}</p>
      {lista ? (
        <ul>
          {lista.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
      {acao ? (
        <Botao icone={acao.icone} onClick={acao.aoAcionar}>
          {acao.rotulo}
        </Botao>
      ) : null}
    </div>
  );
}
