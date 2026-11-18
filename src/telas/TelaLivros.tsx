import { indice } from '../biblia/indice';
import type { Ref, Testamento } from '../biblia/tipos';
import { BotaoVoltar } from '../componentes/base/Botoes';
import estilo from './Escolha.module.css';

interface Props {
  /** Capítulo aberto, se houver: o livro dele fica marcado e a barra oferece voltar a ele. */
  referencia: Ref | null;
  aoEscolherLivro: (livro: number) => void;
  aoVoltarALeitura: () => void;
}

const GRUPOS: { testamento: Testamento; id: string; titulo: string }[] = [
  { testamento: 'AT', id: 'grupo-at', titulo: 'Antigo Testamento' },
  { testamento: 'NT', id: 'grupo-nt', titulo: 'Novo Testamento' },
];

/**
 * Escolha de livro (FUN-06; .specs/mockup/telas/livros.html): os 66 livros na ordem do índice, em Antigo (39) e Novo
 * Testamento (27), com o número de capítulos; o livro atual fica marcado.
 */
export function TelaLivros({ referencia, aoEscolherLivro, aoVoltarALeitura }: Props) {
  const nomeAtual = referencia ? indice.livros[referencia.livro - 1]?.nome : undefined;

  return (
    <>
      <main className={estilo['tela-escolha']}>
        {referencia && nomeAtual ? (
          <BotaoVoltar onClick={aoVoltarALeitura}>
            {nomeAtual} {referencia.capitulo}
          </BotaoVoltar>
        ) : null}
        <h1 className={estilo['titulo-tela']}>Escolha o livro</h1>
        {GRUPOS.map((grupo) => {
          const livros = indice.livros.filter((l) => l.testamento === grupo.testamento);
          return (
            <section key={grupo.id} className={estilo['grupo-livros']} aria-labelledby={grupo.id}>
              <h2 id={grupo.id}>
                {grupo.titulo} <span>{livros.length} livros</span>
              </h2>
              <ul className={estilo['lista-livros']}>
                {livros.map((livro) => (
                  <li key={livro.numero}>
                    <button
                      type="button"
                      className={estilo['item-livro']}
                      aria-current={referencia?.livro === livro.numero ? 'true' : undefined}
                      aria-label={`${livro.nome}, ${livro.capitulos} ${livro.capitulos === 1 ? 'capítulo' : 'capítulos'}`}
                      onClick={() => aoEscolherLivro(livro.numero)}
                    >
                      {livro.nome} <small>{livro.capitulos}</small>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </main>
    </>
  );
}
