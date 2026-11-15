import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { Livro, Ref, Tema } from '../biblia/tipos';
import { baixarFaltantes, carregarLivro, limparAntigos } from '../dados/livros';
import { gravarLeitura, gravarLetra, gravarTema, lerLeitura, lerLetra, lerTema } from '../dados/preferencias';
import { ESTADO_INICIAL, reduzirLeitor, type AcaoLeitor, type EstadoLeitor, type Tela } from './leitor';

/** Situação do livro da `Ref` aberta. */
export type CargaLivro =
  | { situacao: 'carregando'; numero: number }
  | { situacao: 'pronto'; numero: number; livro: Livro }
  /** Sem rede e fora do cache (FUN-36). */
  | { situacao: 'naoBaixado'; numero: number };

export interface Leitor {
  estado: EstadoLeitor;
  /** `null` enquanto nenhum capítulo foi aberto. */
  carga: CargaLivro | null;
  escolherLivro(livro: number): void;
  abrirCapitulo(ref: Ref): void;
  tocarTitulo(): void;
  trocarLivro(): void;
  seguinte(): void;
  anterior(): void;
  mudarLetra(delta: 1 | -1): void;
  escolherTema(tema: Tema): void;
  irPara(tela: Tela): void;
}

function reduzir(estado: EstadoLeitor, acao: AcaoLeitor): EstadoLeitor {
  return reduzirLeitor(estado, acao);
}

/** Estado da primeira renderização: o que está gravado no aparelho (FUN-20 a FUN-23, FUN-30). */
function estadoGravado(): EstadoLeitor {
  return reduzirLeitor(ESTADO_INICIAL, { tipo: 'iniciar', ref: lerLeitura(), letra: lerLetra(), tema: lerTema() });
}

/**
 * Liga o reducer ao aparelho. Estados e casos limite:
 * - carregando → pronto, ou → naoBaixado (sem rede e fora do cache, FUN-36);
 * - troca rápida para outro livro com o anterior ainda carregando: só vale o último pedido (o efeito antigo é
 *   descartado na limpeza, e a resposta dele é ignorada);
 * - outro capítulo do mesmo livro: não carrega de novo;
 * - voltar ao leitor no mesmo livro depois de naoBaixado (ex.: escolher o livro de novo, já com rede): tenta de novo;
 * - download dos livros que faltam (FUN-33): uma vez por abertura, só depois do primeiro capítulo pronto, e
 *   `baixarFaltantes` não duplica um download já em curso; antes, `limparAntigos` apaga as versões antigas.
 */
export function useLeitor(): Leitor {
  const [estado, despachar] = useReducer(reduzir, undefined, estadoGravado);
  const [carga, setCarga] = useState<CargaLivro | null>(null);
  const downloadDisparado = useRef(false);
  const cargaRef = useRef<CargaLivro | null>(null);
  useEffect(() => {
    cargaRef.current = carga;
  }, [carga]);

  const numero = estado.ref?.livro ?? null;
  const noLeitor = estado.tela === 'leitor';

  // Carrega o livro da Ref aberta; só a última pedida vale.
  useEffect(() => {
    if (numero === null || !noLeitor) return;
    // O livro já pronto (outro capítulo dele, ou a volta do Sobre) não carrega de novo.
    if (cargaRef.current?.numero === numero && cargaRef.current.situacao === 'pronto') return;
    let valido = true;
    setCarga({ situacao: 'carregando', numero });
    carregarLivro(numero).then(
      (livro) => {
        if (valido) setCarga({ situacao: 'pronto', numero, livro });
      },
      () => {
        // [LACUNA] a spec só define "sem rede e fora do cache" (LivroNaoBaixado, FUN-36). Outro erro (JSON
        // ilegível, servidor com erro) é tratado do mesmo jeito: a mensagem de não baixado com a escolha de livro.
        if (valido) setCarga({ situacao: 'naoBaixado', numero });
      },
    );
    return () => {
      valido = false;
    };
  }, [numero, noLeitor]);

  // FUN-19: grava o capítulo aberto.
  const ref = estado.ref;
  useEffect(() => {
    if (ref && noLeitor) gravarLeitura(ref);
  }, [ref, noLeitor]);

  // FUN-23 a FUN-27 e FUN-30: a letra no <html> (o CSS lê `data-letra`) e gravada quando muda.
  useEffect(() => {
    document.documentElement.dataset.letra = String(estado.letra);
    if (estado.letra !== lerLetra()) gravarLetra(estado.letra);
  }, [estado.letra]);

  // FUN-28 a FUN-30: o tema no <html>; sem escolha, sem atributo (o CSS segue o sistema).
  useEffect(() => {
    if (estado.tema === null) {
      delete document.documentElement.dataset.tema;
      return;
    }
    document.documentElement.dataset.tema = estado.tema;
    if (estado.tema !== lerTema()) gravarTema(estado.tema);
  }, [estado.tema]);

  // FUN-33: depois do primeiro capítulo pronto, limpa as versões antigas e guarda o que falta, uma vez.
  const pronto = carga?.situacao === 'pronto';
  useEffect(() => {
    if (!pronto || downloadDisparado.current) return;
    downloadDisparado.current = true;
    void limparAntigos()
      .catch(() => undefined)
      .then(() => baixarFaltantes())
      .catch(() => undefined);
  }, [pronto]);

  const acoes = useMemo(
    () => ({
      escolherLivro: (livro: number) => despachar({ tipo: 'escolherLivro', livro }),
      abrirCapitulo: (r: Ref) => despachar({ tipo: 'abrirCapitulo', ref: r }),
      tocarTitulo: () => despachar({ tipo: 'tocarTitulo' }),
      trocarLivro: () => despachar({ tipo: 'trocarLivro' }),
      seguinte: () => despachar({ tipo: 'seguinte' }),
      anterior: () => despachar({ tipo: 'anterior' }),
      mudarLetra: (delta: 1 | -1) => despachar({ tipo: 'mudarLetra', delta }),
      escolherTema: (tema: Tema) => despachar({ tipo: 'escolherTema', tema }),
      irPara: (tela: Tela) => despachar({ tipo: 'irPara', tela }),
    }),
    [],
  );

  // Só a carga do livro da Ref atual aparece; enquanto o efeito ainda não começou o pedido novo, é "carregando".
  let cargaAtual: CargaLivro | null = null;
  if (numero !== null) cargaAtual = carga?.numero === numero ? carga : { situacao: 'carregando', numero };

  return { estado, carga: cargaAtual, ...acoes };
}
