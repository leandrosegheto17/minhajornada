// Mescla as decisões da revisão no arquivo de correções (FUN-113). Pura: não muda a entrada e, se uma decisão for
// recusada, lança antes de devolver qualquer coisa, para quem chama não gravar nada pela metade.
import type { ArquivoCorrecoes } from '../biblia/correcoes/arquivo';
import { colchetesEmPares } from '../biblia/correcoes/validar';
import { podeAprovar } from './logica';
import type { Decisao } from './logica';

const ESTADOS: readonly string[] = ['proposta', 'aprovada', 'recusada'];

/**
 * Muda só o `estado` e, quando veio, o `depois` dos itens e regras decididos; o resto fica igual (mesmas chaves, na
 * mesma ordem). A última decisão do mesmo id vale. Recusa id desconhecido, estado inválido, "depois" com colchete
 * sem par ou numa regra, e aprovação de item que não confere ou de sentido sem fonte.
 */
export function mesclarDecisoes(arquivo: ArquivoCorrecoes, decisoes: Decisao[]): ArquivoCorrecoes {
  const porId = new Map<string, Decisao>();
  for (const decisao of decisoes) {
    if (!ESTADOS.includes(decisao.estado)) {
      throw new Error(`decisão ${decisao.id}: estado "${String(decisao.estado)}" não é ${ESTADOS.join(', ')}`);
    }
    porId.set(decisao.id, decisao);
  }

  const itens = new Map(arquivo.itens.map((i) => [i.id, i] as const));
  const regras = new Map(arquivo.regras.map((r) => [r.id as string, r] as const));
  for (const decisao of porId.values()) {
    const item = itens.get(decisao.id);
    if (item === undefined && !regras.has(decisao.id)) throw new Error(`decisão para id desconhecido: ${decisao.id}`);
    if (decisao.depois === undefined) {
      if (item !== undefined && decisao.estado === 'aprovada') {
        const motivo = podeAprovar(item);
        if (motivo !== true) throw new Error(`decisão ${decisao.id}: ${motivo}`);
      }
      continue;
    }
    if (item === undefined) throw new Error(`decisão ${decisao.id}: uma regra não tem trecho "depois" para editar`);
    if (!colchetesEmPares(decisao.depois)) {
      throw new Error(`decisão ${decisao.id}: colchete de itálico sem par no "depois"`);
    }
    if (decisao.estado === 'aprovada') {
      const motivo = podeAprovar(item, decisao.depois);
      if (motivo !== true) throw new Error(`decisão ${decisao.id}: ${motivo}`);
    }
  }

  return {
    ...arquivo,
    regras: arquivo.regras.map((regra) => {
      const d = porId.get(regra.id);
      return d === undefined ? regra : { ...regra, estado: d.estado };
    }),
    itens: arquivo.itens.map((item) => {
      const d = porId.get(item.id);
      if (d === undefined) return item;
      return d.depois === undefined ? { ...item, estado: d.estado } : { ...item, estado: d.estado, depois: d.depois };
    }),
  };
}
