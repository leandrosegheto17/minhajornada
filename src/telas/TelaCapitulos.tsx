import { indice } from '../biblia/indice';
import type { Ref } from '../biblia/tipos';
import { BotaoIcone, BotaoSecundario, BotaoVoltar } from '../componentes/base/Botoes';
import { IconeLivro, IconeSobre } from '../componentes/icones';
import comum from './comum.module.css';
import escolha from './Escolha.module.css';
import estilo from './TelaCapitulos.module.css';

interface Props {
  /** Livro da grade. */
  livro: number;
  /** Capítulo aberto, se houver: marcado na grade quando é deste livro, e destino de "Voltar à leitura". */
  referencia: Ref | null;
  aoAbrirCapitulo: (ref: Ref) => void;
  aoTrocarLivro: () => void;
  aoVoltarALeitura: () => void;
  aoAbrirSobre: () => void;
}

/**
 * Grade de capítulos (FUN-07, FUN-08, FUN-49; .specs/mockup/telas/capitulos.html): o nome do livro, "Trocar livro",
 * "Voltar à leitura" e os números de 1 até o último capítulo, com o atual marcado.
 */
export function TelaCapitulos({
  livro,
  referencia,
  aoAbrirCapitulo,
  aoTrocarLivro,
  aoVoltarALeitura,
  aoAbrirSobre,
}: Props) {
  const entrada = indice.livros[livro - 1];
  if (!entrada) return null;
  const atual = referencia?.livro === livro ? referencia.capitulo : null;

  return (
    <>
      <header className={`${comum['barra-topo']} ${comum['barra-topo--larga']}`}>
        {referencia ? (
          <BotaoVoltar onClick={aoVoltarALeitura}>Voltar à leitura</BotaoVoltar>
        ) : (
          <span className={comum.marca}>MinhaJornada</span>
        )}
        <BotaoIcone rotulo="Sobre o MinhaJornada" onClick={aoAbrirSobre}>
          <IconeSobre />
        </BotaoIcone>
      </header>
      <main className={escolha['tela-escolha']}>
        <div className={estilo['cabeca-grade']}>
          <h1 className={escolha['titulo-tela']}>{entrada.nome}</h1>
          <BotaoSecundario icone={<IconeLivro />} onClick={aoTrocarLivro}>
            Trocar livro
          </BotaoSecundario>
        </div>
        <ol className={estilo['grade-capitulos']} aria-label={`Capítulos de ${entrada.nome}`}>
          {Array.from({ length: entrada.capitulos }, (_, i) => i + 1).map((capitulo) => (
            <li key={capitulo}>
              <button
                type="button"
                className={estilo['botao-capitulo']}
                aria-label={`Capítulo ${capitulo}`}
                aria-current={atual === capitulo ? 'true' : undefined}
                onClick={() => aoAbrirCapitulo({ livro, capitulo })}
              >
                {capitulo}
              </button>
            </li>
          ))}
        </ol>
      </main>
    </>
  );
}
