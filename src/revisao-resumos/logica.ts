// Lógica pura da revisão dos resumos (FUN-170 a FUN-172): aprovar, recusar com nota e exportar. Sem DOM, sem banco.
// Só imports relativos com `.ts`: o mesmo formato é lido pelo script de publicação no Node.
import { FORMATO_EXPORTADO } from '../resumos/formato.ts';
import type { ArquivoExportado, ItemRevisao, Resumo } from '../resumos/formato.ts';

/**
 * Aprova o resumo do livro (FUN-171): com `editado`, o texto editado passa a ser o aprovado. Um resumo editado de
 * outro livro é recusado com erro. A nota de uma recusa anterior sai.
 */
export function aprovar(item: ItemRevisao, editado?: Resumo): ItemRevisao {
  const resumo = editado ?? item.resumo;
  if (resumo.livro !== item.livro) throw new Error(`o resumo editado é do livro ${resumo.livro}, não do ${item.livro}`);
  return { livro: item.livro, estado: 'aprovada', resumo };
}

/**
 * Recusa o resumo (FUN-172): exige uma nota que não seja vazia nem só espaço. Com `editado`, o texto editado durante a
 * revisão fica guardado, como em `aprovar` (A-05); sem ele, o texto continua o da proposta para refazer.
 */
export function recusar(item: ItemRevisao, nota: string, editado?: Resumo): ItemRevisao {
  const limpa = nota.trim();
  if (limpa === '') throw new Error('Escreva uma nota para recusar.');
  const resumo = editado ?? item.resumo;
  if (resumo.livro !== item.livro) throw new Error(`o resumo editado é do livro ${resumo.livro}, não do ${item.livro}`);
  return { livro: item.livro, estado: 'recusada', resumo, nota: limpa };
}

/**
 * O arquivo exportado (`mj-resumos-v1`, lido por `lerArquivoExportado`): todos os livros, em ordem, cada um com o
 * estado; o script de publicação grava só os `aprovada` (FUN-172, FUN-173). Livro repetido é erro.
 */
export function exportar(itens: ItemRevisao[]): ArquivoExportado {
  const vistos = new Set<number>();
  for (const item of itens) {
    if (vistos.has(item.livro)) throw new Error(`o livro ${item.livro} está repetido`);
    vistos.add(item.livro);
  }
  return {
    formato: FORMATO_EXPORTADO,
    itens: [...itens]
      .sort((a, b) => a.livro - b.livro)
      .map((item) => ({
        livro: item.livro,
        estado: item.estado,
        resumo: item.resumo,
        ...(item.estado === 'recusada' && item.nota !== undefined ? { nota: item.nota } : {}),
      })),
  };
}
