import { useEffect, useState } from 'react';
import type { ItemAplicado, ListaAplicada } from '../biblia/correcoes/arquivo';
import { carregarCorrecoes } from '../biblia/correcoesAplicadas';
import { indice } from '../biblia/indice';
import { segmentar } from '../biblia/segmentos';
import { BotaoVoltar } from '../componentes/base/Botoes';
import { Estado } from '../componentes/base/Estado';
import { IconeAbaixo, IconeLivro, IconeSemRede } from '../componentes/icones';
import escolha from './Escolha.module.css';
import estilo from './TelaCorrecoes.module.css';

interface Props {
  /** "Voltar" leva ao Sobre (FUN-122). */
  aoVoltar: () => void;
  /** Injetável nos testes; o padrão pede o pedaço separado com a lista (AD-017). */
  carregar?: () => Promise<ListaAplicada>;
}

type Situacao = { tipo: 'carregando' } | { tipo: 'erro' } | { tipo: 'pronta'; lista: ListaAplicada };

const nomeDoLivro = (livro: number) => indice.livros[livro - 1]?.nome ?? '';
const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

/** Trecho do versículo: o que está entre colchetes vira itálico, sem os colchetes (FUN-02); sempre nó de texto (FUN-04). */
function Trecho({ texto }: { texto: string }) {
  return (
    <>{segmentar(texto).map((s, i) => (s.italico ? <em key={i}>{s.texto}</em> : <span key={i}>{s.texto}</span>))}</>
  );
}

function agruparPorLivro(itens: ItemAplicado[]): { livro: number; itens: ItemAplicado[] }[] {
  const porLivro = new Map<number, ItemAplicado[]>();
  for (const item of itens) porLivro.set(item.ref.livro, [...(porLivro.get(item.ref.livro) ?? []), item]);
  return [...porLivro.entries()]
    .sort(([a], [b]) => a - b)
    .map(([livro, lista]) => ({
      livro,
      itens: [...lista].sort((a, b) => a.ref.capitulo - b.ref.capitulo || a.ref.versiculo - b.ref.versiculo),
    }));
}

/**
 * "Correções no texto" (FUN-122, FUN-123; mockup `telas/correcoes.html`): as regras mecânicas numa linha cada e as
 * correções por livro, na ordem bíblica, em blocos recolhidos. A lista vem sob demanda (AD-017): carregando e erro com
 * "Tentar de novo" são estados da própria tela.
 */
export function TelaCorrecoes({ aoVoltar, carregar = carregarCorrecoes }: Props) {
  const [situacao, setSituacao] = useState<Situacao>({ tipo: 'carregando' });
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let vivo = true;
    carregar().then(
      (lista) => {
        if (vivo) setSituacao({ tipo: 'pronta', lista });
      },
      () => {
        if (vivo) setSituacao({ tipo: 'erro' });
      },
    );
    return () => {
      vivo = false;
    };
    // `carregar` é estável na prática (padrão do módulo ou dublê do teste); só a tentativa refaz o pedido.
  }, [tentativa]);

  const tentarDeNovo = () => {
    setSituacao({ tipo: 'carregando' });
    setTentativa((n) => n + 1);
  };

  let corpo;
  if (situacao.tipo === 'carregando') {
    corpo = <Estado variante="carregando" rotulo="Carregando as correções" />;
  } else if (situacao.tipo === 'erro') {
    corpo = (
      <Estado
        variante="erro"
        icone={<IconeSemRede />}
        titulo="Não deu para abrir a lista"
        texto="Tente de novo. Se o app foi atualizado agora, abra-o mais uma vez com internet."
        acao={{ rotulo: 'Tentar de novo', aoAcionar: tentarDeNovo }}
      />
    );
  } else if (situacao.lista.regras.length === 0 && situacao.lista.itens.length === 0) {
    corpo = (
      <Estado
        variante="vazio"
        icone={<IconeLivro />}
        titulo="Nenhuma correção aplicada"
        texto="O texto é o da Bíblia Livre, sem modificação."
      />
    );
  } else {
    const { regras, itens } = situacao.lista;
    const livros = agruparPorLivro(itens);
    corpo = (
      <>
        <p>
          O texto do app é baseado na Bíblia Livre (BLIVRE), versão de fevereiro de 2018. Corrigimos erros de digitação,
          ortografia e sentido. Os autores da Bíblia Livre não endossam estas mudanças.
        </p>
        <p className={estilo['resumo-correcoes']}>
          {`${plural(regras.length + itens.length, 'correção', 'correções')}: ${plural(regras.length, 'regra', 'regras')} em todo o texto e ${plural(itens.length, 'trecho', 'trechos')} em ${plural(livros.length, 'livro', 'livros')}.`}
        </p>

        {regras.length > 0 ? (
          <section className={estilo['grupo-correcoes']} aria-labelledby="titulo-regras">
            <h2 id="titulo-regras">
              Em todo o texto <span>{plural(regras.length, 'regra', 'regras')}</span>
            </h2>
            <ul className={estilo['lista-regras']}>
              {regras.map((regra) => (
                <li key={regra.id} className={estilo['linha-regra']}>
                  <span>{regra.descricao}</span>
                  <small>{plural(regra.versiculos, 'versículo', 'versículos')}</small>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {livros.length > 0 ? (
          <section className={estilo['grupo-correcoes']} aria-labelledby="titulo-livros">
            <h2 id="titulo-livros">
              Por livro <span>{plural(livros.length, 'livro', 'livros')}</span>
            </h2>
            {livros.map(({ livro, itens: doLivro }) => (
              <details key={livro} className={estilo['livro-correcoes']}>
                <summary>
                  {nomeDoLivro(livro)}
                  <small>{plural(doLivro.length, 'correção', 'correções')}</small>
                  <IconeAbaixo />
                </summary>
                <ul className={estilo['lista-itens']}>
                  {doLivro.map((item) => (
                    <li
                      key={`${item.ref.capitulo}:${item.ref.versiculo}:${item.antes}`}
                      className={estilo['item-correcao']}
                    >
                      <span className={estilo['item-correcao__ref']}>
                        {`${nomeDoLivro(livro)} ${item.ref.capitulo}:${item.ref.versiculo}`}
                      </span>
                      <p className={estilo['item-correcao__troca']}>
                        <span className={estilo['rotulo-oculto']}>Antes: </span>
                        <del>
                          <Trecho texto={item.antes} />
                        </del>
                        <span className={estilo['item-correcao__seta']} aria-hidden="true">
                          →
                        </span>
                        <span className={estilo['rotulo-oculto']}>Depois: </span>
                        <ins>
                          <Trecho texto={item.depois} />
                        </ins>
                      </p>
                      <p className={estilo['item-correcao__motivo']}>{item.motivo}</p>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </section>
        ) : null}
      </>
    );
  }

  return (
    <main className={estilo['texto-correcoes']}>
      <BotaoVoltar onClick={aoVoltar}>Sobre</BotaoVoltar>
      <h1 className={escolha['titulo-tela']}>Correções no texto</h1>
      {corpo}
    </main>
  );
}
