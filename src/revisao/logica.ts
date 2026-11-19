// Lógica pura da revisão (FUN-108 a FUN-112): grupos, aprovação em bloco, pendências. Sem DOM, sem banco.
import type {
  ArquivoCorrecoes,
  EstadoCorrecao,
  ItemCorrecao,
  RegraNoArquivo,
  TipoCorrecao,
} from '../biblia/correcoes/arquivo.ts';
import { colchetesEmPares } from '../biblia/correcoes/validar.ts';

/** Uma decisão do dono, uma linha do banco do artifact. `depois` só em item (edição do trecho). */
export interface Decisao {
  id: string;
  estado: EstadoCorrecao;
  depois?: string;
}

export interface GrupoRegra {
  chave: string;
  regra: RegraNoArquivo;
  pendentes: number;
}

/** Confiança alta, confere, sem "itálico muda" e fora de sentido, por tipo e livro. */
export interface GrupoBloco {
  chave: string;
  tipo: TipoCorrecao;
  livro: number;
  itens: ItemCorrecao[];
  pendentes: number;
}

/** Confiança média ou baixa, todo sentido, não confere e itálico muda: um por vez. */
export interface GrupoUmAUm {
  itens: ItemCorrecao[];
  pendentes: number;
}

export interface Grupos {
  regras: GrupoRegra[];
  blocos: GrupoBloco[];
  umAUm: GrupoUmAUm;
}

const ORDEM_TIPO: readonly TipoCorrecao[] = ['digitacao', 'ortografia', 'sentido'];

function estadoDe(id: string, estadoNoArquivo: EstadoCorrecao, decisoes: Decisao[]): EstadoCorrecao {
  // A última decisão do mesmo id vale; sem decisão, vale o estado que já veio no arquivo.
  for (let i = decisoes.length - 1; i >= 0; i--) {
    if (decisoes[i]?.id === id) return decisoes[i]?.estado ?? estadoNoArquivo;
  }
  return estadoNoArquivo;
}

const pendente = (id: string, estadoNoArquivo: EstadoCorrecao, decisoes: Decisao[]): boolean =>
  estadoDe(id, estadoNoArquivo, decisoes) === 'proposta';

const ehBloco = (item: ItemCorrecao): boolean =>
  item.confianca === 'alta' && item.confere && item.italicoMuda !== true && item.tipo !== 'sentido';

/** Trecho em comum mínimo, nas pontas, para dois "antes" valerem como sobrepostos sem a posição no versículo. */
const PONTA_MINIMA = 3;

/** Um "antes" contém o outro, ou o fim de um é o começo do outro (pelo menos `PONTA_MINIMA` caracteres). */
function podemSeSobrepor(a: string, b: string): boolean {
  if (a.includes(b) || b.includes(a)) return true;
  const ponta = (x: string, y: string): boolean => {
    for (let n = Math.min(x.length, y.length) - 1; n >= PONTA_MINIMA; n--) {
      if (x.endsWith(y.slice(0, n))) return true;
    }
    return false;
  };
  return ponta(a, b) || ponta(b, a);
}

/** Ids dos itens que podem se sobrepor a outro item do mesmo versículo: nunca entram em bloco (FUN-107, FUN-110). */
function sobrepostos(itens: ItemCorrecao[]): Set<string> {
  const porVersiculo = new Map<string, ItemCorrecao[]>();
  for (const item of itens) {
    const chave = `${item.ref.livro}:${item.ref.capitulo}:${item.ref.versiculo}`;
    porVersiculo.set(chave, [...(porVersiculo.get(chave) ?? []), item]);
  }
  const ids = new Set<string>();
  for (const doVersiculo of porVersiculo.values()) {
    doVersiculo.forEach((a, i) => {
      for (const b of doVersiculo.slice(i + 1)) {
        if (podemSeSobrepor(a.antes, b.antes)) {
          ids.add(a.id);
          ids.add(b.id);
        }
      }
    });
  }
  return ids;
}

/** Divide o arquivo nos grupos da revisão, cada um com a contagem de pendentes (cai a cada decisão). */
export function agrupar(arquivo: ArquivoCorrecoes, decisoes: Decisao[]): Grupos {
  const regras = arquivo.regras.map((regra) => ({
    chave: `regra:${regra.id}`,
    regra,
    pendentes: pendente(regra.id, regra.estado, decisoes) ? 1 : 0,
  }));

  const porChave = new Map<string, GrupoBloco>();
  const umAUm: ItemCorrecao[] = [];
  const cruzados = sobrepostos(arquivo.itens);
  for (const item of arquivo.itens) {
    if (!ehBloco(item) || cruzados.has(item.id)) {
      umAUm.push(item);
      continue;
    }
    const chave = `bloco:${item.tipo}:${item.ref.livro}`;
    const grupo = porChave.get(chave) ?? { chave, tipo: item.tipo, livro: item.ref.livro, itens: [], pendentes: 0 };
    grupo.itens.push(item);
    if (pendente(item.id, item.estado, decisoes)) grupo.pendentes += 1;
    porChave.set(chave, grupo);
  }
  const blocos = [...porChave.values()].sort(
    (a, b) => ORDEM_TIPO.indexOf(a.tipo) - ORDEM_TIPO.indexOf(b.tipo) || a.livro - b.livro,
  );

  return {
    regras,
    blocos,
    umAUm: { itens: umAUm, pendentes: umAUm.filter((i) => pendente(i.id, i.estado, decisoes)).length },
  };
}

/**
 * O que aprovar um grupo decide: a própria regra (grupo de regra) ou os itens do bloco que conferem e ainda estão
 * pendentes (FUN-110). Item já decidido, mesmo recusado, não é tocado; os itens um a um nunca se aprovam em bloco.
 */
export function aprovarGrupo(grupo: GrupoRegra | GrupoBloco | GrupoUmAUm, decisoes: Decisao[]): Decisao[] {
  if ('regra' in grupo) {
    return pendente(grupo.regra.id, grupo.regra.estado, decisoes) ? [{ id: grupo.regra.id, estado: 'aprovada' }] : [];
  }
  if (!('tipo' in grupo)) return [];
  return grupo.itens
    .filter((item) => item.confere && pendente(item.id, item.estado, decisoes) && podeAprovar(item) === true)
    .map((item) => ({ id: item.id, estado: 'aprovada' as const }));
}

/**
 * Se o item pode ser aprovado (FUN-111). "Não confere" vem antes de "Falta a fonte"; `depois` é o trecho editado, se
 * o dono o mudou, e precisa manter os colchetes de itálico em pares (FUN-117).
 */
export function podeAprovar(
  item: ItemCorrecao,
  depois?: string,
): true | 'Falta a fonte' | 'Não confere' | 'Colchete sem par' {
  if (!item.confere) return 'Não confere';
  if (item.tipo === 'sentido' && item.fonte.trim() === '') return 'Falta a fonte';
  if (depois !== undefined && !colchetesEmPares(depois)) return 'Colchete sem par';
  return true;
}

/**
 * Onde continuar: a primeira regra pendente, depois o primeiro item pendente dos blocos, depois o dos um a um; `null`
 * quando tudo foi decidido (FUN-112).
 */
export function primeiroPendente(grupos: Grupos, decisoes: Decisao[]): string | null {
  for (const grupo of grupos.regras) {
    if (pendente(grupo.regra.id, grupo.regra.estado, decisoes)) return grupo.regra.id;
  }
  for (const grupo of grupos.blocos) {
    const achado = grupo.itens.find((i) => pendente(i.id, i.estado, decisoes));
    if (achado) return achado.id;
  }
  return grupos.umAUm.itens.find((i) => pendente(i.id, i.estado, decisoes))?.id ?? null;
}
