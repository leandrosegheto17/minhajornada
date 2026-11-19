// Monta `revisao/dados.json` para a página de revisão (FUN-109): cada item e cada regra com o versículo inteiro antes
// e depois, calculado aplicando só aquele item ou regra. `node scripts/montar-revisao.ts`. O arquivo é gerado e fica
// fora do git. Node 24 roda este arquivo direto: só sintaxe de tipo apagável e imports com a extensão `.ts`.
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { converterLivro } from '../src/biblia/conversor.ts';
import { aplicarCorrecoes } from '../src/biblia/correcoes/aplicar.ts';
import { lerArquivoCorrecoes } from '../src/biblia/correcoes/arquivo.ts';
import type {
  ArquivoCorrecoes,
  ConfiancaCorrecao,
  EstadoCorrecao,
  RefVersiculo,
  TipoCorrecao,
} from '../src/biblia/correcoes/arquivo.ts';
import { nomeRef, validarCorrecoes } from '../src/biblia/correcoes/validar.ts';
import type { Livro } from '../src/biblia/tipos.ts';

export interface ItemDaRevisao {
  id: string;
  ref: RefVersiculo;
  nomeRef: string;
  tipo: TipoCorrecao;
  antes: string;
  depois: string;
  motivo: string;
  fonte: string;
  confianca: ConfiancaCorrecao;
  estado: EstadoCorrecao;
  confere: boolean;
  italicoMuda?: true;
  /** O versículo inteiro como está na fonte. */
  versiculoAntes: string;
  /** O mesmo versículo com só este item aplicado; igual ao antes se o item não confere. */
  versiculoDepois: string;
}

export interface ExemploDaRevisao {
  ref: RefVersiculo;
  nomeRef: string;
  antes: string;
  depois: string;
}

export interface RegraDaRevisao {
  id: string;
  descricao: string;
  estado: EstadoCorrecao;
  versiculos: number;
  exemplos: ExemploDaRevisao[];
}

export interface DadosDaRevisao {
  regras: RegraDaRevisao[];
  itens: ItemDaRevisao[];
}

function versiculoDe(livros: Livro[], ref: RefVersiculo): string {
  return livros.find((l) => l.numero === ref.livro)?.capitulos[ref.capitulo - 1]?.[ref.versiculo - 1] ?? '';
}

/** Um livro com só aquele versículo no lugar certo (os outros vazios), para aplicar uma correção sem varrer a Bíblia. */
function livroDeUmVersiculo(ref: RefVersiculo, texto: string): Livro {
  const capitulos = Array.from({ length: ref.capitulo }, (_, c) =>
    c === ref.capitulo - 1
      ? Array.from({ length: ref.versiculo }, (_, v) => (v === ref.versiculo - 1 ? texto : ''))
      : [],
  );
  return { numero: ref.livro, nome: '', capitulos };
}

function aplicarNoVersiculo(ref: RefVersiculo, texto: string, correcoes: ArquivoCorrecoes): string {
  const { livros } = aplicarCorrecoes([livroDeUmVersiculo(ref, texto)], correcoes);
  return livros[0]?.capitulos[ref.capitulo - 1]?.[ref.versiculo - 1] ?? texto;
}

/** Os dados da página: o arquivo de correções com o versículo inteiro antes e depois de cada item e de cada exemplo. */
export function montarDados(arquivo: ArquivoCorrecoes, livros: Livro[]): DadosDaRevisao {
  const itens = arquivo.itens.map((item): ItemDaRevisao => {
    const versiculoAntes = versiculoDe(livros, item.ref);
    // Item que não confere não se aplica: mostra o versículo como está (FUN-105).
    const versiculoDepois = item.confere
      ? aplicarNoVersiculo(item.ref, versiculoAntes, {
          versao: 1,
          regras: [],
          itens: [{ ...item, estado: 'aprovada' }],
        })
      : versiculoAntes;
    return { ...item, nomeRef: nomeRef(livros, item.ref), versiculoAntes, versiculoDepois };
  });

  const regras = arquivo.regras.map((regra): RegraDaRevisao => {
    const so = { versao: 1 as const, regras: [{ ...regra, estado: 'aprovada' as const }], itens: [] };
    return {
      id: regra.id,
      descricao: regra.descricao,
      estado: regra.estado,
      versiculos: regra.versiculos,
      exemplos: regra.exemplos.map((exemplo) => {
        const antes = versiculoDe(livros, exemplo.ref);
        return {
          ref: exemplo.ref,
          nomeRef: nomeRef(livros, exemplo.ref),
          antes,
          depois: aplicarNoVersiculo(exemplo.ref, antes, so),
        };
      }),
    };
  });

  return { regras, itens };
}

const ehPrincipal = process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (ehPrincipal) {
  const raiz = resolve(fileURLToPath(new URL('..', import.meta.url)));
  const fonte = join(raiz, '.biblia');
  const livros = readdirSync(fonte)
    .filter((nome) => /^\d{2}-[a-z0-9-]+\.md$/.test(nome))
    .sort()
    .map((nome) => converterLivro(readFileSync(join(fonte, nome), 'utf8'), Number(nome.slice(0, 2))));
  const arquivo = lerArquivoCorrecoes(
    JSON.parse(readFileSync(join(raiz, 'correcoes', 'correcoes.json'), 'utf8')) as unknown,
  );
  validarCorrecoes(arquivo, livros);
  const destino = join(raiz, 'revisao', 'dados.json');
  mkdirSync(dirname(destino), { recursive: true });
  writeFileSync(destino, `${JSON.stringify(montarDados(arquivo, livros))}\n`);
  console.log(`montar-revisao: ${arquivo.itens.length} itens e ${arquivo.regras.length} regras em revisao/dados.json`);
}
