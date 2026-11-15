import { useEffect, useState } from 'react';
import { indice } from '../biblia/indice';
import type { Ref } from '../biblia/tipos';
import { BotaoIcone } from '../componentes/base/Botoes';
import { Estado } from '../componentes/base/Estado';
import { IconeAbaixo, IconeAparencia, IconeSobre } from '../componentes/icones';
import { Versiculo } from '../componentes/Versiculo';
import type { CargaLivro } from '../estado/useLeitor';
import { anterior, seguinte } from '../navegacao/navegacao';
import comum from './comum.module.css';
import estilo from './TelaLeitor.module.css';

interface Props {
  referencia: Ref;
  carga: CargaLivro;
  /** Título do capítulo (FUN-49, FUN-50). */
  aoTocarTitulo: () => void;
  aoAnterior: () => void;
  aoSeguinte: () => void;
  aoAbrirSobre: () => void;
}

function nomeDoLivro(livro: number): string {
  return indice.livros[livro - 1]?.nome ?? '';
}

function rotulo(ref: Ref): string {
  return `${nomeDoLivro(ref.livro)} ${ref.capitulo}`;
}

/**
 * Leitura de um capítulo (.specs/mockup/telas/leitor.html): barra com a marca, "Aa" e Sobre; o título como botão
 * (FUN-49, FUN-50); os versículos (FUN-01); os cartões anterior e seguinte, desativados nos limites (FUN-10 a FUN-15).
 */
export function TelaLeitor({ referencia, carga, aoTocarTitulo, aoAnterior, aoSeguinte, aoAbrirSobre }: Props) {
  const [painelAberto, setPainelAberto] = useState(false);
  const { livro, capitulo } = referencia;

  // FUN-05: cada capítulo aberto começa do início.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [livro, capitulo]);

  const titulo = rotulo(referencia);
  const capituloUnico = indice.livros[livro - 1]?.capitulos === 1;
  const destinoAnterior = anterior(referencia, indice);
  const destinoSeguinte = seguinte(referencia, indice);
  const versiculos = carga.situacao === 'pronto' ? (carga.livro.capitulos[capitulo - 1] ?? []) : null;

  return (
    <>
      <header className={comum['barra-topo']}>
        <span className={comum.marca}>MinhaJornada</span>
        <div className={comum['grupo-acoes']}>
          <div className={estilo['ancora-painel']}>
            <BotaoIcone
              rotulo="Aparência: letra e tema"
              aria-expanded={painelAberto}
              aria-controls="painel-aparencia"
              onClick={() => setPainelAberto((aberto) => !aberto)}
            >
              <IconeAparencia />
            </BotaoIcone>
          </div>
          <BotaoIcone rotulo="Sobre o MinhaJornada" onClick={aoAbrirSobre}>
            <IconeSobre />
          </BotaoIcone>
        </div>
      </header>

      <div className={estilo['cabeca-capitulo']}>
        <h1>
          <button
            type="button"
            className={estilo['titulo-capitulo']}
            aria-label={`${titulo}. ${capituloUnico ? 'Escolher outro livro' : 'Escolher outro capítulo'}`}
            onClick={aoTocarTitulo}
          >
            {titulo} <IconeAbaixo />
          </button>
        </h1>
      </div>

      <main className={estilo['texto-capitulo']}>
        {versiculos ? (
          <ol className={estilo.versiculos}>
            {versiculos.map((texto, i) => (
              <Versiculo key={i} numero={i + 1} texto={texto} />
            ))}
          </ol>
        ) : (
          <Estado variante="carregando" rotulo={`Carregando ${titulo}`} />
        )}
      </main>

      <nav className={estilo['navegacao-capitulo']} aria-label="Capítulos">
        <button
          type="button"
          className={estilo['cartao-nav']}
          disabled={!destinoAnterior}
          aria-label={destinoAnterior ? `Capítulo anterior: ${rotulo(destinoAnterior)}` : 'Capítulo anterior: não há'}
          onClick={aoAnterior}
        >
          <small>Anterior</small>
          <strong>{destinoAnterior ? rotulo(destinoAnterior) : 'Início da Bíblia'}</strong>
        </button>
        <button
          type="button"
          className={`${estilo['cartao-nav']} ${estilo['cartao-nav--seguinte']}`}
          disabled={!destinoSeguinte}
          aria-label={destinoSeguinte ? `Capítulo seguinte: ${rotulo(destinoSeguinte)}` : 'Capítulo seguinte: não há'}
          onClick={aoSeguinte}
        >
          <small>Seguinte</small>
          <strong>{destinoSeguinte ? rotulo(destinoSeguinte) : 'Fim da Bíblia'}</strong>
        </button>
      </nav>
    </>
  );
}
