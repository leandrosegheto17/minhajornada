import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, ReactElement } from 'react';
import { Estado } from '../componentes/base/Estado';
import { BotaoIcone } from '../componentes/base/Botoes';
import { IconeLivro, IconeSemRede } from '../componentes/icones';
import { buscarResumo } from '../dados/resumos';
import type { BuscaResumo } from '../dados/resumos';
import type { Resumo } from '../resumos/formato';
import { paginar } from './paginacao';
import type { Pagina } from './paginacao';
import { useMedidas } from './useMedidas';
import type { Medir } from './useMedidas';
import livro from './livro.module.css';
import estilo from './PaginaResumo.module.css';

export const MENSAGEM_CARREGANDO = 'Carregando o resumo…';
export const MENSAGEM_ERRO = 'Não foi possível carregar o resumo. Confira a internet e tente de novo.';
export const MENSAGEM_SEM_RESUMO = 'Este livro ainda não tem resumo.';

interface Props {
  /** Número do livro, de 1 a 66. */
  numeroLivro: number;
  /** Nome do livro, como aparece na página ("Gênesis"). */
  nome: string;
  /** A API respondeu 401: o app volta ao estado sem sessão, sem mensagem (FUN-145). */
  aoPerderSessao: () => void;
  /** Letra da página: remede quando muda (FUN-86). */
  letra?: number;
  /** Busca do resumo; o teste injeta um dublê. */
  buscar?: (numeroLivro: number) => Promise<BuscaResumo>;
  /** Medida das páginas; o teste injeta, porque o jsdom não tem layout. */
  medir?: Medir;
}

type Situacao = { tipo: 'carregando' } | { tipo: 'pronto'; resumo: Resumo } | { tipo: 'semResumo' } | { tipo: 'erro' };

/** Um bloco do resumo: o `recorte` é quanto do topo já saiu na página anterior (mesma técnica da página da Bíblia, FUN-75). */
interface BlocoResumo {
  chave: string;
  desenhar: (recorte: number) => ReactElement;
}

const deslocar = (recorte: number): CSSProperties | undefined => (recorte > 0 ? { marginTop: -recorte } : undefined);

/** "Capítulos 1 a 11" e, para uma parte de um capítulo só, "Capítulo 50" (FUN-164). */
export const intervaloDeCapitulos = (de: number, ate: number): string =>
  de === ate ? `Capítulo ${de}` : `Capítulos ${de} a ${ate}`;

/** "Gênesis 12:1-3" e "Gênesis 15:6" (FUN-164). */
export const referenciaDoVersiculo = (nome: string, v: Resumo['versiculos'][number]): string =>
  `${nome} ${v.capitulo}:${v.versiculo}${v.ate !== undefined && v.ate !== v.versiculo ? `-${v.ate}` : ''}`;

/** Cabeçalho e as quatro seções, nessa ordem (FUN-163). Todo texto entra como texto, nunca como HTML (FUN-165). */
function blocosDe(resumo: Resumo, nome: string): BlocoResumo[] {
  return [
    {
      chave: 'cabeca',
      desenhar: (r) => (
        <header className={estilo.cabeca} style={deslocar(r)}>
          <span className={estilo.selo}>Resumo</span>
          <h2 className={estilo['nome-livro']}>{nome}</h2>
        </header>
      ),
    },
    {
      chave: 'contexto',
      desenhar: (r) => (
        <section className={estilo.secao} style={deslocar(r)} aria-label="Contexto">
          <h3>Contexto</h3>
          <p>{resumo.contexto}</p>
        </section>
      ),
    },
    {
      chave: 'mensagem',
      desenhar: (r) => (
        <section className={estilo.secao} style={deslocar(r)} aria-label="Mensagem central">
          <h3>Mensagem central</h3>
          <p>{resumo.mensagem}</p>
        </section>
      ),
    },
    {
      chave: 'divisao',
      desenhar: (r) => (
        <section className={estilo.secao} style={deslocar(r)} aria-label="Divisão do livro">
          <h3>Divisão do livro</h3>
          <ul className={estilo.divisao}>
            {resumo.divisao.map((parte, i) => (
              <li key={i}>
                <span>{parte.titulo}</span>
                <span className={estilo.intervalo}>{intervaloDeCapitulos(parte.de, parte.ate)}</span>
              </li>
            ))}
          </ul>
        </section>
      ),
    },
    {
      chave: 'versiculos',
      desenhar: (r) => (
        <section className={estilo.secao} style={deslocar(r)} aria-label="Versículos-chave">
          <h3>Versículos-chave</h3>
          <dl className={estilo.chaves}>
            {resumo.versiculos.map((v, i) => (
              <div key={i}>
                <dt>{referenciaDoVersiculo(nome, v)}</dt>
                <dd>{v.frase}</dd>
              </div>
            ))}
          </dl>
        </section>
      ),
    },
  ];
}

const setaAnterior = (
  <svg className="icone-p" viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M14.5 6 8.5 12l6 6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const setaSeguinte = (
  <svg className="icone-p" viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="m9.5 6 6 6-6 6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Página do resumo do livro (FUN-163 a FUN-169; mockup `telas/livro-resumo.html`): busca o resumo (só em memória), mostra
 * as quatro seções e os estados carregando, erro com "Tentar de novo" e sem resumo, e divide o texto em páginas próprias
 * quando ele não cabe numa (as da Bíblia não mudam). Sem layout medido (jsdom, ou antes da primeira medida) mostra tudo
 * numa página só.
 */
export function PaginaResumo({ numeroLivro, nome, aoPerderSessao, letra = 0, buscar = buscarResumo, medir }: Props) {
  const [situacao, setSituacao] = useState<Situacao>({ tipo: 'carregando' });
  const [tentativa, setTentativa] = useState(0);
  const [indice, setIndice] = useState(0);
  const perderAtual = useRef(aoPerderSessao);
  const buscarAtual = useRef(buscar);

  useEffect(() => {
    perderAtual.current = aoPerderSessao;
    buscarAtual.current = buscar;
  }, [aoPerderSessao, buscar]);

  // Trocar de livro (ou tentar de novo) busca outra vez e volta à página 1 do resumo (FUN-169).
  useEffect(() => {
    let vivo = true;
    setSituacao({ tipo: 'carregando' });
    setIndice(0);
    void buscarAtual.current(numeroLivro).then((resultado) => {
      if (!vivo) return;
      if (resultado.situacao === 'semSessao') {
        perderAtual.current();
        return;
      }
      setSituacao(
        resultado.situacao === 'pronto' ? { tipo: 'pronto', resumo: resultado.resumo } : { tipo: resultado.situacao },
      );
    });
    return () => {
      vivo = false;
    };
  }, [numeroLivro, tentativa]);

  const resumo = situacao.tipo === 'pronto' ? situacao.resumo : null;
  const blocos = useMemo(() => (resumo ? blocosDe(resumo, nome) : []), [resumo, nome]);
  const { ref: refMedida, medidas } = useMedidas(blocos, letra, medir);

  const paginas: Pagina[] = useMemo(() => {
    const tudo: Pagina = { partes: blocos.map((_, bloco) => ({ bloco, recorte: 0 })) };
    if (!medidas || !(medidas.alturaPagina > 0) || !(medidas.alturaLinha > 0)) return [tudo];
    return paginar(medidas.alturas, medidas.alturaPagina, medidas.alturaLinha);
  }, [blocos, medidas]);

  const atual = Math.min(indice, paginas.length - 1);
  const pagina = paginas[atual] ?? { partes: [] };
  const comPaginador = paginas.length > 1;
  const rotulo = `Resumo de ${nome}, página ${atual + 1} de ${paginas.length}`;

  let corpo;
  if (situacao.tipo === 'carregando') {
    corpo = <Estado variante="carregando" rotulo={MENSAGEM_CARREGANDO} />;
  } else if (situacao.tipo === 'erro') {
    corpo = (
      <Estado
        variante="erro"
        icone={<IconeSemRede />}
        titulo="Resumo indisponível"
        texto={MENSAGEM_ERRO}
        acao={{ rotulo: 'Tentar de novo', aoAcionar: () => setTentativa((n) => n + 1) }}
      />
    );
  } else if (situacao.tipo === 'semResumo') {
    corpo = <Estado variante="vazio" icone={<IconeLivro />} titulo={nome} texto={MENSAGEM_SEM_RESUMO} />;
  } else {
    corpo = pagina.partes.map((parte) => {
      const bloco = blocos[parte.bloco];
      return bloco ? <Fragment key={bloco.chave}>{bloco.desenhar(parte.recorte)}</Fragment> : null;
    });
  }

  return (
    <>
      {resumo ? (
        // O invólucro não é `.pagina`: na tela estreita `.pagina + .pagina` esconde a página seguinte, e o contêiner de
        // medida (uma `.pagina`) escondia o resumo; fora do fluxo da grade, ele também não ocupa coluna.
        <div className={estilo['involucro-medida']}>
          <div className={`${livro.pagina} ${livro.medida} ${estilo['pagina-resumo']}`} aria-hidden="true">
            <div className={livro['pagina__texto']} ref={refMedida}>
              {blocos.map((bloco) => (
                <Fragment key={bloco.chave}>{bloco.desenhar(0)}</Fragment>
              ))}
            </div>
            <footer className={livro['pagina__rodape']}>
              <span>&nbsp;</span>
            </footer>
          </div>
        </div>
      ) : null}
      <article
        className={`${livro.pagina} ${livro['pagina--direita']} ${estilo['pagina-resumo']}`}
        aria-label={resumo ? rotulo : `Resumo de ${nome}`}
        aria-busy={situacao.tipo === 'carregando' ? 'true' : undefined}
      >
        <div className={`${livro['pagina__texto']} ${resumo ? '' : estilo['texto-estado']}`}>{corpo}</div>
        {resumo ? (
          <footer className={`${livro['pagina__rodape']} ${estilo.rodape}`}>
            <span>Resumo de {nome}</span>
            {comPaginador ? (
              <span className={estilo.paginador} role="group" aria-label="Páginas do resumo">
                <BotaoIcone
                  rotulo="Página anterior do resumo"
                  disabled={atual === 0}
                  onClick={() => setIndice(Math.max(0, atual - 1))}
                >
                  {setaAnterior}
                </BotaoIcone>
                <span>
                  {atual + 1} de {paginas.length}
                </span>
                <BotaoIcone
                  rotulo="Página seguinte do resumo"
                  disabled={atual === paginas.length - 1}
                  onClick={() => setIndice(Math.min(paginas.length - 1, atual + 1))}
                >
                  {setaSeguinte}
                </BotaoIcone>
              </span>
            ) : null}
          </footer>
        ) : null}
      </article>
    </>
  );
}
