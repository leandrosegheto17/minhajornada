// Traz as decisões da revisão (`revisao/decisoes.json`) para `correcoes/correcoes.json` (FUN-113):
// `node scripts/aplicar-decisoes.ts [decisoes.json]`. Só grava se todas as decisões forem aceitas.
// Node 24 roda este arquivo direto: só sintaxe de tipo apagável e imports com a extensão `.ts`.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lerArquivoCorrecoes } from '../src/biblia/correcoes/arquivo.ts';
import type { Decisao } from '../src/revisao/logica.ts';
import { mesclarDecisoes } from '../src/revisao/mesclar.ts';
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

/** Mescla as decisões no arquivo de correções e o regrava, uma linha por item. Lança sem gravar se algo for recusado. */
export function aplicarDecisoes(caminhoCorrecoes: string, caminhoDecisoes: string): void {
  const arquivo = lerArquivoCorrecoes(JSON.parse(readFileSync(caminhoCorrecoes, 'utf8')) as unknown);
  const decisoes = lerDecisoes(JSON.parse(readFileSync(caminhoDecisoes, 'utf8')) as unknown);
  writeFileSync(caminhoCorrecoes, serializar(mesclarDecisoes(arquivo, decisoes)));
}

const ehPrincipal = process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (ehPrincipal) {
  const raiz = resolve(fileURLToPath(new URL('..', import.meta.url)));
  const decisoes = process.argv[2] ? resolve(process.argv[2]) : join(raiz, 'revisao', 'decisoes.json');
  aplicarDecisoes(join(raiz, 'correcoes', 'correcoes.json'), decisoes);
  console.log(`aplicar-decisoes: decisões de ${decisoes} gravadas em correcoes/correcoes.json`);
}
