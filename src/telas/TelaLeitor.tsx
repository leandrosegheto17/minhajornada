import { useEffect, useRef, type PointerEvent } from 'react';
import { indice } from '../biblia/indice';
import type { Ref } from '../biblia/tipos';
import { Estado } from '../componentes/base/Estado';
import { IconeAbaixo, IconeLivro, IconeSemRede } from '../componentes/icones';
import { Versiculo } from '../componentes/Versiculo';
import type { CargaLivro } from '../estado/useLeitor';
import { classificarDeslize } from '../navegacao/deslize';
import { anterior, seguinte } from '../navegacao/navegacao';
import estilo from './TelaLeitor.module.css';

interface Props {
  referencia: Ref;
  carga: CargaLivro;
  /** Título do capítulo (FUN-49, FUN-50). */
  aoTocarTitulo: () => void;
  aoAnterior: () => void;
  aoSeguinte: () => void;
  /** Ação do estado "não baixado" (FUN-36): abre a escolha de livro. */
  aoEscolherOutroLivro: () => void;
}

export const MENSAGEM_NAO_BAIXADO = 'Este livro ainda não foi baixado. Conecte-se à internet para lê-lo.';

function nomeDoLivro(livro: number): string {
  return indice.livros[livro - 1]?.nome ?? '';
}

function rotulo(ref: Ref): string {
  return `${nomeDoLivro(ref.livro)} ${ref.capitulo}`;
}

/**
 * Leitura de um capítulo (.specs/mockup/telas/leitor.html): o título como botão (FUN-49, FUN-50); a barra é a
 * `BarraTitulo` do app (FUN-60); os versículos (FUN-01); os cartões anterior e seguinte, desativados nos limites (FUN-10 a FUN-15).
 */
export function TelaLeitor({
  referencia,
  carga,
  aoTocarTitulo,
  aoAnterior,
  aoSeguinte,
  aoEscolherOutroLivro,
}: Props) {
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

  // FUN-16 a FUN-18: deslize lateral na área do texto (Pointer Events; `touch-action: pan-y` deixa a rolagem
  // vertical com o navegador). Nos limites (Gênesis 1, Apocalipse 22) o deslize não faz nada.
  const inicioDeslize = useRef<{ id: number; x: number; y: number } | null>(null);

  function aoComecarDeslize(evento: PointerEvent<HTMLElement>) {
    // Só o dedo desliza: arrastar o mouse (selecionar texto) não troca de capítulo (A-01).
    if (!evento.isPrimary || evento.pointerType !== 'touch') return;
    inicioDeslize.current = { id: evento.pointerId, x: evento.clientX, y: evento.clientY };
  }

  function aoTerminarDeslize(evento: PointerEvent<HTMLElement>) {
    const inicio = inicioDeslize.current;
    inicioDeslize.current = null;
    if (!inicio || inicio.id !== evento.pointerId) return;
    const direcao = classificarDeslize(evento.clientX - inicio.x, evento.clientY - inicio.y);
    if (direcao === 'seguinte' && destinoSeguinte) aoSeguinte();
    if (direcao === 'anterior' && destinoAnterior) aoAnterior();
  }

  return (
    <>
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

      <main
        className={estilo['texto-capitulo']}
        onPointerDown={aoComecarDeslize}
        onPointerUp={aoTerminarDeslize}
        onPointerCancel={() => {
          inicioDeslize.current = null;
        }}
      >
        {carga.situacao === 'naoBaixado' ? (
          // FUN-36: sem rede e fora do cache; a escolha de outro livro continua disponível.
          <Estado
            variante="erro"
            icone={<IconeSemRede />}
            titulo="Sem internet"
            texto={MENSAGEM_NAO_BAIXADO}
            acao={{ rotulo: 'Escolher outro livro', aoAcionar: aoEscolherOutroLivro, icone: <IconeLivro /> }}
          />
        ) : versiculos ? (
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
