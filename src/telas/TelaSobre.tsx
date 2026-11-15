import { BotaoVoltar } from '../componentes/base/Botoes';
import comum from './comum.module.css';
import escolha from './Escolha.module.css';
import estilo from './TelaSobre.module.css';

export const LINK_LICENCA = 'https://creativecommons.org/licenses/by/4.0/br/';
export const LINK_FONTE = 'https://sites.google.com/site/biblialivre/';

interface Props {
  /** Texto do botão de voltar (ex.: "Salmos 27", ou "Livros" sem capítulo aberto). */
  rotuloVoltar: string;
  aoVoltar: () => void;
}

/**
 * Sobre o app (FUN-38 a FUN-40): crédito completo da Bíblia Livre, o que o itálico significa, a privacidade e a
 * versão do app (FUN-37). Créditos de `.biblia/README.md`. Os links só navegam: nenhuma requisição sai da página.
 */
export function TelaSobre({ rotuloVoltar, aoVoltar }: Props) {
  return (
    <>
      <header className={comum['barra-topo']}>
        <BotaoVoltar onClick={aoVoltar}>{rotuloVoltar}</BotaoVoltar>
      </header>
      <main className={estilo['texto-sobre']}>
        <h1 className={escolha['titulo-tela']}>Sobre o MinhaJornada</h1>

        <h2>O texto bíblico</h2>
        <p>
          Todas as Escrituras são da Bíblia Livre (BLIVRE), Copyright © Diego Santos, Mario Sérgio e Marco Teles,
          versão de fevereiro de 2018, sob a licença{' '}
          <a href={LINK_LICENCA} rel="noopener noreferrer" target="_blank">
            Creative Commons Atribuição 4.0 Brasil
          </a>
          . Fonte:{' '}
          <a href={LINK_FONTE} rel="noopener noreferrer" target="_blank">
            site da Bíblia Livre
          </a>
          .
        </p>
        <p>
          Só o formato do arquivo foi convertido para o app; o texto não foi modificado. Os autores da Bíblia Livre
          não endossam este app.
        </p>

        <h2>O itálico</h2>
        <p>
          As palavras em itálico foram acrescentadas pelos tradutores para dar sentido à frase em português; elas não
          estão no texto original.
        </p>

        <h2>Privacidade</h2>
        <p>
          O app não tem conta nem cadastro. Suas preferências e o ponto onde você parou ficam só neste aparelho; nada
          é enviado para outro lugar.
        </p>

        <p className={estilo.versao}>Versão {__VERSAO__}</p>
      </main>
    </>
  );
}
