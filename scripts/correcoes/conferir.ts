// Conferência dos candidatos do levantamento contra o texto de `.biblia/` (FUN-104, FUN-105; AD-013 a AD-015).
// Node 24 roda este arquivo direto: só sintaxe de tipo apagável e imports com a extensão `.ts`.
import type { ItemCorrecao, RefVersiculo } from '../../src/biblia/correcoes/arquivo.ts';
import { REGRAS } from '../../src/biblia/correcoes/regras.ts';
import { colchetesEmPares, nomeRef, posicaoUnica } from '../../src/biblia/correcoes/validar.ts';
import type { Livro } from '../../src/biblia/tipos.ts';
import type { Candidato } from './levantamento.ts';

export interface OcorrenciaDivergente {
  arquivo: string;
  linha: number;
  esperado: number;
  achado: number;
}

export interface RefSemVersiculo {
  arquivo: string;
  linha: number;
  motivo: string;
}

export interface RelatorioConferencia {
  /** Itens com `confere: true` (inclui os recuperados e os expandidos que conferem). */
  conferem: number;
  naoConferem: number;
  /** Itens cujo "antes" só apareceu sem os colchetes e foi trocado pelo trecho exato (AD-015). */
  recuperados: number;
  /** Candidatos que saíram porque a regra mecânica já resolve (AD-013). */
  cobertosPorRegra: number;
  /** Itens nascidos de linhas "N ocorrências" (AD-014). */
  expandidos: number;
  ocorrenciasDivergentes: OcorrenciaDivergente[];
  semVersiculo: RefSemVersiculo[];
  /** Itens que deixariam colchete de itálico sem par no versículo (FUN-125): não entram no arquivo. */
  semColchetes: RefSemVersiculo[];
  /** Linhas repetidas (mesma referência, antes e depois) contadas uma vez. */
  duplicados: number;
}

const tirarColchetes = (texto: string): string => texto.replace(/[[\]]/g, '');
const pares = (texto: string): number => (texto.match(/\[/g) ?? []).length;
const aplicarRegras = (texto: string): string => REGRAS.reduce((atual, regra) => regra.aplicar(atual), texto);

/** Posição exata do trecho no versículo, ou `null` se aparece zero ou mais de uma vez. */
function posicaoSemColchetes(versiculo: string, trecho: string): { inicio: number; fim: number } | null {
  const indices: number[] = [];
  let sem = '';
  for (let i = 0; i < versiculo.length; i++) {
    if (versiculo[i] !== '[' && versiculo[i] !== ']') {
      indices.push(i);
      sem += versiculo[i];
    }
  }
  const alvo = tirarColchetes(trecho);
  if (alvo === '') return null;
  const achado = posicaoUnica(sem, alvo);
  if (achado === null) return null;

  return estenderAoPar(versiculo, indices[achado] ?? 0, (indices[achado + alvo.length - 1] ?? 0) + 1);
}

/** O trecho não pode cortar um par de colchetes ao meio: estende até fechar o par. `null` se o par não fecha. */
function estenderAoPar(
  versiculo: string,
  inicioBruto: number,
  fimBruto: number,
): { inicio: number; fim: number } | null {
  let inicio = inicioBruto;
  let fim = fimBruto;
  let aberto = 0;
  let fecharSemAbrir = false;
  for (const c of versiculo.slice(inicio, fim)) {
    if (c === '[') aberto += 1;
    else if (c === ']') {
      if (aberto === 0) fecharSemAbrir = true;
      else aberto -= 1;
    }
  }
  if (fecharSemAbrir) inicio = versiculo.lastIndexOf('[', inicio);
  if (aberto > 0) fim = versiculo.indexOf(']', fim - 1) + 1;
  if (inicio < 0 || fim <= 0) return null;
  return { inicio, fim };
}

interface Achado {
  antes: string;
  confere: boolean;
  recuperado: boolean;
}

/** Procura o "antes" no versículo: exato uma vez, só sem colchetes uma vez, ou não confere. */
function procurar(versiculo: string, antes: string): Achado {
  const exato = posicaoUnica(versiculo, antes);
  if (exato !== null) {
    if (colchetesEmPares(antes)) return { antes, confere: true, recuperado: false };
    // Trecho exato que corta um par de colchetes: estende até fechar o par (AD-015).
    const par = colchetesEmPares(versiculo) ? estenderAoPar(versiculo, exato, exato + antes.length) : null;
    if (par === null) return { antes, confere: true, recuperado: false };
    return { antes: versiculo.slice(par.inicio, par.fim), confere: true, recuperado: true };
  }
  if (versiculo.includes(antes)) return { antes, confere: false, recuperado: false }; // aparece mais de uma vez
  const sem = posicaoSemColchetes(versiculo, antes);
  if (sem === null) return { antes, confere: false, recuperado: false };
  return { antes: versiculo.slice(sem.inicio, sem.fim), confere: true, recuperado: true };
}

function versiculoDe(livros: Livro[], ref: RefVersiculo): string | undefined {
  return livros.find((l) => l.numero === ref.livro)?.capitulos[ref.capitulo - 1]?.[ref.versiculo - 1];
}

/** O "depois" só repete o "antes" com as regras mecânicas aplicadas (AD-013). Comparação exata: pôr ou tirar colchete não é regra. */
function cobertoPorRegra(antes: string, depois: string): boolean {
  return aplicarRegras(antes) === depois;
}

interface Provisorio {
  ref: RefVersiculo;
  ordem: number;
  item: Omit<ItemCorrecao, 'id'>;
}

/**
 * Transforma os candidatos em itens "proposta" com ids `C-0001…` em ordem bíblica. Tudo o que não vira item (regra
 * mecânica, referência inexistente) fica contado no relatório, nunca some.
 */
export function conferir(
  candidatos: Candidato[],
  livros: Livro[],
): { itens: ItemCorrecao[]; relatorio: RelatorioConferencia } {
  const relatorio: RelatorioConferencia = {
    conferem: 0,
    naoConferem: 0,
    recuperados: 0,
    cobertosPorRegra: 0,
    expandidos: 0,
    ocorrenciasDivergentes: [],
    semVersiculo: [],
    semColchetes: [],
    duplicados: 0,
  };
  const provisorios: Provisorio[] = [];
  const vistos = new Set<string>();
  let ordem = 0;

  const adicionar = (candidato: Candidato, ref: RefVersiculo, versiculo: string, expandido: boolean): void => {
    const chave = `${ref.livro}|${ref.capitulo}|${ref.versiculo}|${candidato.antes}|${candidato.depois}`;
    if (vistos.has(chave)) {
      relatorio.duplicados += 1;
      return;
    }
    vistos.add(chave);

    const achado = procurar(versiculo, candidato.antes);
    const item: Omit<ItemCorrecao, 'id'> = {
      ref,
      tipo: candidato.tipo,
      antes: achado.antes,
      depois: candidato.depois,
      motivo: candidato.motivo,
      fonte: candidato.fonte,
      confianca: candidato.confianca,
      estado: 'proposta',
      confere: achado.confere,
      ...(achado.recuperado && pares(achado.antes) !== pares(candidato.depois) ? { italicoMuda: true as const } : {}),
    };
    // O versículo corrigido precisa ficar em pares (FUN-125), como `validarCorrecoes` confere; versículo da fonte que
    // já estava sem par não é culpa da correção.
    const inicio = posicaoUnica(versiculo, item.antes);
    const corrigido =
      inicio === null
        ? item.depois
        : versiculo.slice(0, inicio) + item.depois + versiculo.slice(inicio + item.antes.length);
    if (!colchetesEmPares(corrigido) && (inicio === null || colchetesEmPares(versiculo))) {
      relatorio.semColchetes.push({
        arquivo: candidato.arquivo,
        linha: candidato.linha,
        motivo: `${nomeRef(livros, ref)}: o "depois" deixaria colchete de itálico sem par`,
      });
      return;
    }
    if (achado.confere) relatorio.conferem += 1;
    else relatorio.naoConferem += 1;
    if (achado.recuperado) relatorio.recuperados += 1;
    if (expandido) relatorio.expandidos += 1;
    provisorios.push({ ref, ordem: (ordem += 1), item });
  };

  for (const candidato of candidatos) {
    if (cobertoPorRegra(candidato.antes, candidato.depois)) {
      relatorio.cobertosPorRegra += 1;
      continue;
    }

    if (candidato.ocorrencias !== undefined) {
      // AD-014: um item por versículo em que o trecho aparece, no texto inteiro.
      let achados = 0;
      for (const livro of livros) {
        livro.capitulos.forEach((versiculos, c) =>
          versiculos.forEach((texto, v) => {
            if (!texto.includes(candidato.antes) && posicaoSemColchetes(texto, candidato.antes) === null) return;
            achados += 1;
            adicionar(candidato, { livro: livro.numero, capitulo: c + 1, versiculo: v + 1 }, texto, true);
          }),
        );
      }
      if (achados !== candidato.ocorrencias) {
        relatorio.ocorrenciasDivergentes.push({
          arquivo: candidato.arquivo,
          linha: candidato.linha,
          esperado: candidato.ocorrencias,
          achado: achados,
        });
      }
      continue;
    }

    for (const ref of candidato.refs) {
      const versiculo = versiculoDe(livros, ref);
      if (versiculo === undefined) {
        relatorio.semVersiculo.push({
          arquivo: candidato.arquivo,
          linha: candidato.linha,
          motivo: `referência ${nomeRef(livros, ref)} não existe na fonte`,
        });
        continue;
      }
      adicionar(candidato, ref, versiculo, false);
    }
  }

  provisorios.sort(
    (a, b) =>
      a.ref.livro - b.ref.livro ||
      a.ref.capitulo - b.ref.capitulo ||
      a.ref.versiculo - b.ref.versiculo ||
      a.ordem - b.ordem,
  );
  const itens = provisorios.map((p, i) => ({ id: `C-${String(i + 1).padStart(4, '0')}`, ...p.item }));
  return { itens, relatorio };
}
