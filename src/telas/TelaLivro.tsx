import { useEffect, useMemo, useRef, type PointerEvent, type ReactNode } from 'react';
import { indice } from '../biblia/indice';
import type { Livro } from '../biblia/tipos';
import { BotaoSecundario } from '../componentes/base/Botoes';
import { Estado } from '../componentes/base/Estado';
import { IconeAbaixo, IconeLivro, IconeSemRede } from '../componentes/icones';
import type { Ancora } from '../estado/leitor';
import type { CargaLivro } from '../estado/useLeitor';
import { CapaLivro, PaginaPago } from '../livro/CapaLivro';
import { destinoAnterior, destinoDaCapa, destinoSeguinte, visiveis, type Destino } from '../livro/folhear';
import estilo from '../livro/livro.module.css';
import {
  alvoDaPagina,
  blocosDoLivro,
  paginaDoVersiculo,
  paginar,
  primeiroVersiculo,
  type Bloco,
  type Pagina,
} from '../livro/paginacao';
import { BlocoLivro, PaginaLivro } from '../livro/PaginaLivro';
import { useMedidas, type Medir } from '../livro/useMedidas';
import { classificarDeslize } from '../navegacao/deslize';
import { MENSAGEM_NAO_BAIXADO } from './TelaLeitor';

interface Props {
  /** Lugar no livro (FUN-84, FUN-85): a página mostrada é sempre a da âncora. */
  ancora: Ancora;
  /** Carga do livro da âncora; `null` na capa e no plano pago. */
  carga: CargaLivro | null;
  /** Tela larga: duas páginas (FUN-73); estreita: uma (FUN-74). */
  larga: boolean;
  /** Letra (1 a 5): remede quando muda (FUN-86). */
  letra: number;
  aoIrParaAncora: (ancora: Ancora) => void;
  /** Título do capítulo (FUN-84): abre a grade de capítulos. */
  aoTocarTitulo: () => void;
  aoEscolherOutroLivro: () => void;
  /** "Quero saber" do plano pago (FUN-92). */
  aoQueroSaber: () => void;
  /** Medida injetada nos testes (o jsdom não tem layout). */
  medir?: Medir;
}

const SEM_BLOCOS: Bloco[] = [];

/**
 * Âncora de texto do primeiro versículo da página `indice` (FUN-85); a continuação de um versículo dividido leva o
 * número da fatia, para "seguinte" e "anterior" passarem por todas as páginas dele. Sem versículo, o começo do livro.
 */
function ancoraDaPagina(paginas: Pagina[], blocos: Bloco[], indice: number, livro: number): Ancora {
  const alvo = alvoDaPagina(paginas, blocos, indice);
  if (!alvo) return { tipo: 'texto', ref: { livro, capitulo: 1 }, versiculo: 1 };
  const { fatia, ...base } = alvo;
  return { tipo: 'texto', ...base, ...(fatia > 0 ? { fatia } : {}) };
}

/** O destino como âncora: a página vira o primeiro versículo dela; `null` onde não há para onde ir. */
function comoAncora(destino: Destino, paginas: Pagina[], blocos: Bloco[], livro: number): Ancora | null {
  if (!destino) return null;
  if ('ancora' in destino) return destino.ancora;
  return ancoraDaPagina(paginas, blocos, destino.pagina, livro);
}

/**
 * Leitura em formato livro (FUN-73 a FUN-92; mockup `telas/livro.html`): 1 ou 2 páginas, setas e deslize que passam
 * página, título que abre a grade, capa e plano pago antes de Gênesis, carregando e sem rede.
 */
export function TelaLivro({
  ancora,
  carga,
  larga,
  letra,
  aoIrParaAncora,
  aoTocarTitulo,
  aoEscolherOutroLivro,
  aoQueroSaber,
  medir,
}: Props) {
  const livro: Livro | null = carga?.situacao === 'pronto' ? carga.livro : null;
  const blocos = useMemo(() => (livro ? blocosDoLivro(livro) : SEM_BLOCOS), [livro]);
  const { ref: refMedida, medidas } = useMedidas(blocos, letra, medir);
  const paginas = useMemo(
    () => (livro && medidas ? paginar(medidas.alturas, medidas.alturaPagina, medidas.alturaLinha) : null),
    [livro, medidas],
  );

  const emCapa = ancora.tipo === 'capa' || ancora.tipo === 'pago';
  const numeroLivro = ancora.tipo === 'texto' ? ancora.ref.livro : ancora.tipo === 'fim' ? ancora.livro : 0;
  const total = paginas?.length ?? 0;
  const atual = !paginas
    ? 0
    : ancora.tipo === 'fim'
      ? total - 1
      : ancora.tipo === 'texto'
        ? paginaDoVersiculo(paginas, blocos, { ref: ancora.ref, versiculo: ancora.versiculo, fatia: ancora.fatia })
        : 0;

  // "fim" é resolvida depois de paginar: o primeiro versículo da última página vira a âncora de texto (FUN-85).
  useEffect(() => {
    if (ancora.tipo === 'fim' && paginas) aoIrParaAncora(ancoraDaPagina(paginas, blocos, total - 1, ancora.livro));
  }, [ancora, paginas, total, blocos, aoIrParaAncora]);

  function destino(sentido: 'seguinte' | 'anterior'): Ancora | null {
    if (ancora.tipo === 'capa' || ancora.tipo === 'pago') {
      const d = destinoDaCapa(ancora.tipo, sentido, larga);
      return d && 'ancora' in d ? d.ancora : null;
    }
    if (!paginas) return null;
    const d =
      sentido === 'seguinte'
        ? destinoSeguinte(atual, total, numeroLivro, larga)
        : destinoAnterior(atual, total, numeroLivro, larga);
    return comoAncora(d, paginas, blocos, numeroLivro);
  }

  const proxima = destino('seguinte');
  const anterior = destino('anterior');

  const inicioDeslize = useRef<{ id: number; x: number; y: number } | null>(null);
  function aoComecarDeslize(evento: PointerEvent<HTMLElement>) {
    // Só o dedo desliza: arrastar o mouse (selecionar texto) não passa página.
    if (!evento.isPrimary || evento.pointerType !== 'touch') return;
    inicioDeslize.current = { id: evento.pointerId, x: evento.clientX, y: evento.clientY };
  }
  function aoTerminarDeslize(evento: PointerEvent<HTMLElement>) {
    const inicio = inicioDeslize.current;
    inicioDeslize.current = null;
    if (!inicio || inicio.id !== evento.pointerId) return;
    const direcao = classificarDeslize(evento.clientX - inicio.x, evento.clientY - inicio.y);
    if (direcao === 'seguinte' && proxima) aoIrParaAncora(proxima);
    if (direcao === 'anterior' && anterior) aoIrParaAncora(anterior);
  }

  const navegacao = (
    <nav className={estilo['navegacao-pagina']} aria-label="Páginas">
      <BotaoSecundario
        disabled={!anterior}
        aria-label="Página anterior"
        onClick={() => anterior && aoIrParaAncora(anterior)}
      >
        Anterior
      </BotaoSecundario>
      <BotaoSecundario
        disabled={!proxima}
        aria-label="Página seguinte"
        onClick={() => proxima && aoIrParaAncora(proxima)}
      >
        Seguinte
      </BotaoSecundario>
    </nav>
  );

  const area = (conteudo: ReactNode) => (
    <main
      className={estilo.livro}
      aria-label="Leitura em formato livro"
      onPointerDown={aoComecarDeslize}
      onPointerUp={aoTerminarDeslize}
      onPointerCancel={() => {
        inicioDeslize.current = null;
      }}
    >
      {conteudo}
    </main>
  );

  if (emCapa) {
    // FUN-89, FUN-90, AD-005: na tela larga o plano pago e a capa formam um par; na estreita, uma página de cada vez.
    return area(
      <>
        <div className={estilo['livro__aberto']}>
          {larga ? (
            <>
              <PaginaPago aoQueroSaber={aoQueroSaber} lado="esquerda" />
              <CapaLivro lado="direita" />
            </>
          ) : ancora.tipo === 'pago' ? (
            <PaginaPago aoQueroSaber={aoQueroSaber} />
          ) : (
            <CapaLivro />
          )}
        </div>
        {navegacao}
      </>,
    );
  }

  if (carga?.situacao === 'naoBaixado') {
    // FUN-87: sem rede e fora do cache; a escolha de outro livro continua disponível.
    return (
      <main className={estilo.livro} aria-label="Leitura em formato livro">
        <Estado
          variante="erro"
          icone={<IconeSemRede />}
          titulo="Sem internet"
          texto={MENSAGEM_NAO_BAIXADO}
          acao={{ rotulo: 'Escolher outro livro', aoAcionar: aoEscolherOutroLivro, icone: <IconeLivro /> }}
        />
      </main>
    );
  }

  const nomeLivro = indice.livros[numeroLivro - 1]?.nome ?? '';
  const mostradas = livro && paginas ? visiveis(atual, larga, total) : [];
  const primeira = paginas ? primeiroVersiculo(paginas[mostradas[0] ?? 0] ?? { partes: [] }, blocos) : null;
  const capitulo = primeira?.ref.capitulo ?? (ancora.tipo === 'texto' ? ancora.ref.capitulo : 1);
  const titulo = `${nomeLivro} ${capitulo}`;
  const capituloUnico = indice.livros[numeroLivro - 1]?.capitulos === 1;
  const posicao =
    mostradas.length === 2
      ? `${nomeLivro}, páginas ${(mostradas[0] ?? 0) + 1} e ${(mostradas[1] ?? 0) + 1} de ${total}`
      : `${nomeLivro}, página ${(mostradas[0] ?? 0) + 1} de ${total}`;

  return area(
    <>
      {/* Contêiner de medida: invisível, com os mesmos blocos e a largura da página (FUN-75, FUN-86). */}
      {livro ? (
        <div className={`${estilo.pagina} ${estilo.medida}`} aria-hidden="true">
          <div className={estilo['pagina__texto']} ref={refMedida}>
            {blocos.map((bloco, i) => (
              <BlocoLivro key={i} livro={livro} bloco={bloco} />
            ))}
          </div>
          <footer className={estilo['pagina__rodape']}>
            <span>&nbsp;</span>
          </footer>
        </div>
      ) : null}

      {livro && paginas ? (
        <>
          <div className={estilo['livro__cabeca']}>
            <h1 className={estilo['titulo-capitulo']}>
              <button
                type="button"
                className={estilo['titulo-capitulo']}
                aria-label={`${titulo}. ${capituloUnico ? 'Escolher outro livro' : 'Escolher outro capítulo'}`}
                onClick={aoTocarTitulo}
              >
                {titulo} <IconeAbaixo />
              </button>
            </h1>
            <span className={estilo['livro__posicao']}>{posicao}</span>
          </div>
          <div className={estilo['livro__aberto']}>
            {mostradas.map((indicePagina, i) => (
              <PaginaLivro
                key={indicePagina}
                livro={livro}
                blocos={blocos}
                pagina={paginas[indicePagina] ?? { partes: [] }}
                numero={indicePagina + 1}
                lado={mostradas.length === 2 ? (i === 0 ? 'esquerda' : 'direita') : 'unica'}
              />
            ))}
          </div>
          {navegacao}
        </>
      ) : (
        <Estado variante="carregando" rotulo={`Carregando ${nomeLivro}`} />
      )}
    </>,
  );
}
