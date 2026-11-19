// Traz as decisões da revisão (`revisao/decisoes.json`) para `correcoes/correcoes.json` (FUN-113):
// `node scripts/aplicar-decisoes.ts [decisoes.json]`. Só grava se todas as decisões forem aceitas.
// Node 24 roda este arquivo direto: só sintaxe de tipo apagável e imports com a extensão `.ts`.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lerArquivoCorrecoes } from '../src/biblia/correcoes/arquivo.ts';
import type { Decisao } from '../src/revisao/logica.ts';
import { mesclarDecisoes } from '../src/revisao/mesclar.ts';
import type { Livro } from '../src/biblia/tipos.ts';
import { lerLivros } from './converter-biblia.ts';
import { serializar } from './consolidar-correcoes.ts';

/** A lista de decisões, solta ou dentro de `{ decisoes: [...] }`; cada uma com `id` e `estado` em texto. */
function lerDecisoes(json: unknown): Decisao[] {
  const lista = Array.isArray(json)
    ? json
    : typeof json === 'object' && json !== null && Array.isArray((json as { decisoes?: unknown }).decisoes)
      ? (json as { decisoes: unknown[] }).decisoes
      : null;
  if (lista === null) throw new Error('arquivo de decisões: esperada uma lista de decisões');
  return lista.map((valor, i) => {
    const d = valor as { id?: unknown; estado?: unknown; depois?: unknown } | null;
    if (
      typeof d !== 'object' ||
      d === null ||
      typeof d.id !== 'string' ||
      typeof d.estado !== 'string' ||
      (d.depois !== undefined && typeof d.depois !== 'string')
    ) {
      throw new Error(`arquivo de decisões: a decisão ${i + 1} precisa de id e estado em texto (e depois, se houver)`);
    }
    return d as unknown as Decisao;
  });
}

/** Uma decisão que mudou o "depois" do item: o que o dono vai ver no site (FUN-113). */
export interface Editada {
  id: string;
  referencia: string;
  antes: string;
  depois: string;
}

/**
 * Mescla as decisões no arquivo de correções e o regrava, uma linha por item. Lança sem gravar se algo for recusado;
 * com `livros` (a fonte), recusa também aprovadas sobrepostas (FUN-107). Devolve os itens com o "depois" editado, que o
 * comando lista antes de gravar (o texto editado vai ao site no próximo build).
 */
export function aplicarDecisoes(caminhoCorrecoes: string, caminhoDecisoes: string, livros?: Livro[]): Editada[] {
  const arquivo = lerArquivoCorrecoes(JSON.parse(readFileSync(caminhoCorrecoes, 'utf8')) as unknown);
  const decisoes = lerDecisoes(JSON.parse(readFileSync(caminhoDecisoes, 'utf8')) as unknown);
  const mesclado = mesclarDecisoes(arquivo, decisoes, livros);
  const editadas = mesclado.itens
    .filter((novo, i) => novo.depois !== arquivo.itens[i]?.depois)
    .map(({ id, ref, antes, depois }) => ({
      id,
      referencia: `${livros?.[ref.livro - 1]?.nome ?? `livro ${ref.livro}`} ${ref.capitulo}:${ref.versiculo}`,
      antes,
      depois,
    }));
  writeFileSync(caminhoCorrecoes, serializar(mesclado));
  return editadas;
}

const ehPrincipal = process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (ehPrincipal) {
  const raiz = resolve(fileURLToPath(new URL('..', import.meta.url)));
  const args = process.argv.slice(2);
  const posicao = args.indexOf('--correcoes');
  const arquivoCorrecoes = posicao >= 0 ? args[posicao + 1] : undefined;
  if (posicao >= 0 && !arquivoCorrecoes) throw new Error('--correcoes pede o caminho do arquivo de correções');
  const solto = posicao < 0 ? args : args.filter((_, i) => i !== posicao && i !== posicao + 1);
  const decisoes = solto[0] ? resolve(solto[0]) : join(raiz, 'revisao', 'decisoes.json');
  const correcoes = arquivoCorrecoes ? resolve(arquivoCorrecoes) : join(raiz, 'correcoes', 'correcoes.json');
  const editadas = aplicarDecisoes(correcoes, decisoes, lerLivros(join(raiz, '.biblia')));
  if (editadas.length > 0) {
    console.log('aplicar-decisoes: itens com o "depois" editado pelo dono (confira antes do próximo build):');
    for (const e of editadas) console.log(`  ${e.id} ${e.referencia}: "${e.antes}" → "${e.depois}"`);
  }
  console.log(`aplicar-decisoes: decisões de ${decisoes} gravadas em ${correcoes}`);
}
