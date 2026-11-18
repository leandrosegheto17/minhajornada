import { indice } from '../biblia/indice';
import { segmentar } from '../biblia/segmentos';
import type { Livro } from '../biblia/tipos';
import { primeiroVersiculo, type Bloco, type Pagina } from './paginacao';
import estilo from './livro.module.css';

interface PropsBloco {
  livro: Livro;
  bloco: Bloco;
  /** Quanto do topo do bloco já saiu na página anterior, em px (FUN-75). */
  recorte?: number;
}

/**
 * Um bloco do livro (FUN-76): o nome do livro, ou um versículo (com o número do capítulo grande no primeiro e o número
 * do versículo pequeno; o acréscimo do tradutor em itálico, FUN-02). O texto entra como texto, nunca HTML (FUN-04).
 * É o mesmo bloco que a medição renderiza, para a altura medida ser a da página.
 */
export function BlocoLivro({ livro, bloco, recorte = 0 }: PropsBloco) {
  const estiloRecorte = recorte > 0 ? { marginTop: -recorte } : undefined;

  if (bloco.tipo === 'nomeLivro') {
    return (
      <h2 className={estilo['pagina__livro']} style={estiloRecorte}>
        {indice.livros[bloco.livro - 1]?.nome ?? livro.nome}
      </h2>
    );
  }

  const texto = livro.capitulos[bloco.ref.capitulo - 1]?.[bloco.versiculo - 1] ?? '';
  return (
    <p style={estiloRecorte}>
      {bloco.abreCapitulo ? (
        <span className={estilo['numero-capitulo']} aria-label={`Capítulo ${bloco.ref.capitulo}`}>
          {bloco.ref.capitulo}
        </span>
      ) : null}
      <span className={estilo['numero-versiculo']}>{bloco.versiculo}</span>
      {segmentar(texto).map((segmento, i) => (segmento.italico ? <em key={i}>{segmento.texto}</em> : segmento.texto))}
    </p>
  );
}

interface Props {
  livro: Livro;
  blocos: Bloco[];
  pagina: Pagina;
  /** Número da página, de 1 a N (FUN-76). */
  numero: number;
  lado: 'esquerda' | 'direita' | 'unica';
}

/**
 * Página do livro (mockup `telas/livro.html`, `.pagina`): os blocos da página (o bloco dividido entra deslocado pelo
 * `recorte`, FUN-75) e o rodapé com o capítulo e o número da página.
 */
export function PaginaLivro({ livro, blocos, pagina, numero, lado }: Props) {
  const primeiro = primeiroVersiculo(pagina, blocos);
  const rodapeCapitulo = primeiro ? `${livro.nome} ${primeiro.ref.capitulo}` : livro.nome;
  const classeLado =
    lado === 'esquerda' ? estilo['pagina--esquerda'] : lado === 'direita' ? estilo['pagina--direita'] : '';

  return (
    <article className={`${estilo.pagina} ${classeLado}`} aria-label={`Página ${numero} de ${livro.nome}`}>
      <div className={estilo['pagina__texto']}>
        {pagina.partes.map((parte) => {
          const bloco = blocos[parte.bloco];
          return bloco ? (
            <BlocoLivro key={`${parte.bloco}-${parte.recorte}`} livro={livro} bloco={bloco} recorte={parte.recorte} />
          ) : null;
        })}
      </div>
      <footer className={estilo['pagina__rodape']}>
        <span>{rodapeCapitulo}</span>
        <span>{numero}</span>
      </footer>
    </article>
  );
}
