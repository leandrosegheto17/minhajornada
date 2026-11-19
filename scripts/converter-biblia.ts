// Gera `public/livros/NN.<hash8>.json` e `src/biblia/indice.gerado.json` a partir de `.biblia/` (FUN-03, FUN-06;
// AD-002). Roda em `predev`, `prebuild`, `pretest` e `pretypecheck`; a saída fica fora do git. Node 24 roda este
// arquivo direto (type stripping): só sintaxe de tipo apagável e imports com a extensão `.ts`.
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { converterLivro, montarIndice } from '../src/biblia/conversor.ts';
import { lerArquivoCorrecoes } from '../src/biblia/correcoes/arquivo.ts';
import type { ResumoCorrecoes } from '../src/biblia/correcoes/arquivo.ts';
import { aplicarCorrecoes } from '../src/biblia/correcoes/aplicar.ts';
import { validarCorrecoes } from '../src/biblia/correcoes/validar.ts';
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

/** Arquivos de correções (entrada) e os dois gerados (saída). Sem `correcoes`, o texto sai como está na fonte. */
export interface OpcoesCorrecoes {
  correcoes?: string;
  resumo?: string;
  lista?: string;
}

/**
 * Converte todos os livros de `pastaFonte`, aplica as correções aprovadas, recria `pastaLivros` e grava o índice em
 * `arquivoIndice` (FUN-03, FUN-114). Tudo é convertido, lido, validado e aplicado em memória antes de apagar
 * `pastaLivros`: arquivo de correções inválido não deixa o site sem livros (FUN-115). `.biblia/` só é lida.
 */
export function gerar(
  pastaFonte: string,
  pastaLivros: string,
  arquivoIndice: string,
  opcoes: OpcoesCorrecoes = {},
): Saida {
  const fontes = readdirSync(pastaFonte)
    .filter((nome) => ARQUIVO_FONTE.test(nome))
    .sort();
  if (fontes.length !== 66) throw new Error(`esperados 66 livros em ${pastaFonte}, achados ${fontes.length}`);

  const convertidos: Livro[] = fontes.map((fonte) =>
    converterLivro(readFileSync(join(pastaFonte, fonte), 'utf8'), Number(ARQUIVO_FONTE.exec(fonte)?.[1])),
  );

  let livros = convertidos;
  let resumo: ResumoCorrecoes | undefined;
  let lista: ReturnType<typeof aplicarCorrecoes>['aplicadas'] | undefined;
  if (opcoes.correcoes !== undefined) {
    const arquivo = lerArquivoCorrecoes(JSON.parse(readFileSync(opcoes.correcoes, 'utf8')) as unknown);
    validarCorrecoes(arquivo, convertidos);
    const aplicado = aplicarCorrecoes(convertidos, arquivo);
    livros = aplicado.livros;
    lista = aplicado.aplicadas;
    // Design: total = regras aprovadas aplicadas + itens aplicados.
    resumo = { total: lista.itens.length + lista.regras.length };
  }

  rmSync(pastaLivros, { recursive: true, force: true });
  mkdirSync(pastaLivros, { recursive: true });

  const arquivos: string[] = [];
  for (const livro of livros) {
    const json = JSON.stringify(livro);
    const nome = nomeDoArquivo(livro.numero, json);
    writeFileSync(join(pastaLivros, nome), json);
    arquivos.push(`/livros/${nome}`);
  }

  const indice = montarIndice(livros, arquivos);
  writeFileSync(
    arquivoIndice,
    `${JSON.stringify(indice, null, 2)}
`,
  );
  if (resumo !== undefined && opcoes.resumo !== undefined)
    writeFileSync(
      opcoes.resumo,
      `${JSON.stringify(resumo)}
`,
    );
  if (lista !== undefined && opcoes.lista !== undefined)
    writeFileSync(
      opcoes.lista,
      `${JSON.stringify(lista)}
`,
    );
  return { livros, indice };
}

const ehPrincipal = process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (ehPrincipal) {
  const raiz = resolve(fileURLToPath(new URL('..', import.meta.url)));
  const posicao = process.argv.indexOf('--correcoes');
  const arquivoCorrecoes = posicao > 0 ? process.argv[posicao + 1] : undefined;
  const { indice } = gerar(
    join(raiz, '.biblia'),
    join(raiz, 'public', 'livros'),
    join(raiz, 'src', 'biblia', 'indice.gerado.json'),
    {
      correcoes: arquivoCorrecoes ? resolve(arquivoCorrecoes) : join(raiz, 'correcoes', 'correcoes.json'),
      resumo: join(raiz, 'src', 'biblia', 'correcoes-resumo.gerado.json'),
      lista: join(raiz, 'src', 'biblia', 'correcoes.gerado.json'),
    },
  );
  console.log(`converter-biblia: ${indice.livros.length} livros gerados em public/livros/`);
}
