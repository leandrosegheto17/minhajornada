// Gera `public/livros/NN.<hash8>.json` e `src/biblia/indice.gerado.json` a partir de `.biblia/` (FUN-03, FUN-06;
// AD-002). Roda em `predev`, `prebuild`, `pretest` e `pretypecheck`; a saída fica fora do git. Node 24 roda este
// arquivo direto (type stripping): só sintaxe de tipo apagável e imports com a extensão `.ts`.
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { converterLivro, montarIndice } from '../src/biblia/conversor.ts';
import type { Indice, Livro } from '../src/biblia/tipos.ts';

const ARQUIVO_FONTE = /^(\d{2})-[a-z0-9-]+\.md$/;

/** Nome público do livro: número com 2 dígitos e os 8 primeiros caracteres do SHA-256 do JSON. */
export function nomeDoArquivo(numero: number, json: string): string {
  const hash = createHash('sha256').update(json).digest('hex').slice(0, 8);
  return `${String(numero).padStart(2, '0')}.${hash}.json`;
}

export interface Saida {
  livros: Livro[];
  indice: Indice;
}

/** Converte todos os livros de `pastaFonte`, recria `pastaLivros` e grava o índice em `arquivoIndice`. */
export function gerar(pastaFonte: string, pastaLivros: string, arquivoIndice: string): Saida {
  const fontes = readdirSync(pastaFonte)
    .filter((nome) => ARQUIVO_FONTE.test(nome))
    .sort();
  if (fontes.length !== 66) throw new Error(`esperados 66 livros em ${pastaFonte}, achados ${fontes.length}`);

  rmSync(pastaLivros, { recursive: true, force: true });
  mkdirSync(pastaLivros, { recursive: true });

  const livros: Livro[] = [];
  const arquivos: string[] = [];
  for (const fonte of fontes) {
    const numero = Number(ARQUIVO_FONTE.exec(fonte)?.[1]);
    const livro = converterLivro(readFileSync(join(pastaFonte, fonte), 'utf8'), numero);
    const json = JSON.stringify(livro);
    const nome = nomeDoArquivo(numero, json);
    writeFileSync(join(pastaLivros, nome), json);
    livros.push(livro);
    arquivos.push(`/livros/${nome}`);
  }

  const indice = montarIndice(livros, arquivos);
  writeFileSync(arquivoIndice, `${JSON.stringify(indice, null, 2)}\n`);
  return { livros, indice };
}

const ehPrincipal = process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (ehPrincipal) {
  const raiz = resolve(fileURLToPath(new URL('..', import.meta.url)));
  const { indice } = gerar(
    join(raiz, '.biblia'),
    join(raiz, 'public', 'livros'),
    join(raiz, 'src', 'biblia', 'indice.gerado.json'),
  );
  console.log(`converter-biblia: ${indice.livros.length} livros gerados em public/livros/`);
}
