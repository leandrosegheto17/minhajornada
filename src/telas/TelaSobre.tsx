import { BotaoSecundario, BotaoVoltar } from '../componentes/base/Botoes';
import escolha from './Escolha.module.css';
import estilo from './TelaSobre.module.css';

export const LINK_LICENCA = 'https://creativecommons.org/licenses/by/4.0/br/';
export const LINK_UNSPLASH = 'https://unsplash.com/license';
export const LINK_FONTE = 'https://sites.google.com/site/biblialivre/';

interface Props {
  /** Texto do botão de voltar (ex.: "Salmos 27", ou "Livros" sem capítulo aberto). */
  rotuloVoltar: string;
  aoVoltar: () => void;
  /** Correções aplicadas no build (FUN-119, FUN-120): 0 mantém o texto de antes e esconde o link das correções. */
  totalCorrecoes: number;
  aoVerCorrecoes: () => void;
}

/**
 * Sobre o app (FUN-38 a FUN-40): crédito completo da Bíblia Livre, o que o itálico significa, a privacidade e a
 * versão do app (FUN-37). Créditos de `.biblia/README.md`. Os links só navegam: nenhuma requisição sai da página.
 */
export function TelaSobre({ rotuloVoltar, aoVoltar, totalCorrecoes, aoVerCorrecoes }: Props) {
  const corrigido = totalCorrecoes > 0;
  return (
    <>
      <main className={estilo['texto-sobre']}>
        <BotaoVoltar onClick={aoVoltar}>{rotuloVoltar}</BotaoVoltar>
        <h1 className={escolha['titulo-tela']}>Sobre o MinhaJornada</h1>

        <h2>O texto bíblico</h2>
        <p>
          {corrigido
            ? 'O texto é baseado na Bíblia Livre (BLIVRE)'
            : 'Todas as Escrituras são da Bíblia Livre (BLIVRE)'}
          , Copyright © Diego Santos, Mario Sérgio e Marco Teles, versão de fevereiro de 2018, sob a licença{' '}
          <a href={LINK_LICENCA} rel="noopener noreferrer" target="_blank">
            Creative Commons Atribuição 4.0 Brasil
          </a>
          . Fonte:{' '}
          <a href={LINK_FONTE} rel="noopener noreferrer" target="_blank">
            site da Bíblia Livre
          </a>
          .
        </p>
        {corrigido ? (
          <>
            <p>
              O texto recebeu correções de digitação, ortografia e sentido. Os autores da Bíblia Livre não endossam
              estas mudanças nem este app.
            </p>
            <p>
              <BotaoSecundario onClick={aoVerCorrecoes}>Ver as correções no texto</BotaoSecundario>
            </p>
          </>
        ) : (
          <p>
            Só o formato do arquivo foi convertido para o app; o texto não foi modificado. Os autores da Bíblia Livre
            não endossam este app.
          </p>
        )}

        <h2>A foto da página inicial</h2>
        <p>
          A foto da página inicial é de Aaron Burden, publicada no{' '}
          <a href={LINK_UNSPLASH} rel="noopener noreferrer" target="_blank">
            Unsplash
          </a>{' '}
          sob a licença Unsplash.
        </p>

        <h2>O itálico</h2>
        <p>
          As palavras em itálico foram acrescentadas pelos tradutores para dar sentido à frase em português; elas não
          estão no texto original.
        </p>

        <h2>Privacidade</h2>
        <p>
          O app não tem conta nem cadastro. Suas preferências e o ponto onde você parou ficam só neste aparelho; nada é
          enviado para outro lugar.
        </p>

        <p className={estilo.versao}>Versão {__VERSAO__}</p>
      </main>
    </>
  );
}
