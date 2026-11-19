// Página de revisão das correções (FUN-108, FUN-109, FUN-111, FUN-112). Roda fora do app, num artifact: lê
// `dados.json`, mostra os grupos e guarda cada decisão numa linha do banco do artifact. Todo texto entra por
// `textContent`, nunca por HTML (FUN-04).
import type { DadosDaRevisao, ItemDaRevisao } from '../../scripts/montar-revisao.ts';
import type { ArquivoCorrecoes, EstadoCorrecao, IdRegra } from '../biblia/correcoes/arquivo';
import { agrupar, aprovarGrupo, podeAprovar, primeiroPendente } from './logica';
import type { Decisao, Grupos } from './logica';

/** Onde as decisões ficam guardadas: o banco do artifact, ou um dublê nos testes. */
export interface BancoDecisoes {
  carregar(): Promise<Decisao[]>;
  gravar(decisao: Decisao): Promise<void>;
}

/** O pedaço do `db` do artifact que a página usa (`claude.use("db")`). */
export interface DbLike {
  collection(caminho: string): {
    get(): Promise<{ docs: Array<{ id: string; data(): Record<string, unknown> | undefined }> }>;
    doc(id: string): { set(dados: Record<string, unknown>): Promise<void> };
  };
}

const COLECAO = 'decisoes';
const ESTADOS: readonly string[] = ['proposta', 'aprovada', 'recusada'];

/** Uma linha por decisão em `decisoes/<id>`: `{ id, estado, depois? }`. Linha mal formada é ignorada ao ler. */
export function bancoDoArtifact(db: DbLike): BancoDecisoes {
  return {
    async carregar() {
      const { docs } = await db.collection(COLECAO).get();
      const decisoes: Decisao[] = [];
      for (const doc of docs) {
        const d = doc.data();
        if (
          d === undefined ||
          typeof d.id !== 'string' ||
          typeof d.estado !== 'string' ||
          !ESTADOS.includes(d.estado)
        ) {
          continue;
        }
        decisoes.push({
          id: d.id,
          estado: d.estado as EstadoCorrecao,
          ...(typeof d.depois === 'string' ? { depois: d.depois } : {}),
        });
      }
      return decisoes;
    },
    gravar(decisao) {
      const { id, estado, depois } = decisao;
      return db
        .collection(COLECAO)
        .doc(id)
        .set(depois === undefined ? { id, estado } : { id, estado, depois });
    },
  };
}

/** O conteúdo de `decisoes.json`: a lista de decisões, no formato de `scripts/aplicar-decisoes.ts`. */
export function decisoesComoJson(decisoes: Decisao[]): string {
  return `${JSON.stringify(decisoes, null, 2)}\n`;
}

type Vista = { tipo: 'regra'; id: string } | { tipo: 'bloco'; chave: string } | { tipo: 'umAUm'; indice: number };

const ROTULO_TIPO: Record<string, string> = { digitacao: 'Digitação', ortografia: 'Ortografia', sentido: 'Sentido' };
const ROTULO_CONFIANCA: Record<string, string> = { alta: 'alta', media: 'média', baixa: 'baixa' };

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  texto?: string,
  atributos: Record<string, string> = {},
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (texto !== undefined) e.textContent = texto;
  for (const [k, v] of Object.entries(atributos)) e.setAttribute(k, v);
  return e;
}

function botao(texto: string, acao: string, aoClicar: () => void, desativado = false): HTMLButtonElement {
  const b = el('button', texto, { type: 'button', 'data-acao': acao });
  b.disabled = desativado;
  b.addEventListener('click', () => {
    if (!b.disabled) aoClicar();
  });
  return b;
}

const nomeDoLivro = (item: ItemDaRevisao): string => item.nomeRef.replace(/ \d+:\d+$/, '');

/**
 * Monta a página dentro de `raiz`. Lê as decisões guardadas, mostra os grupos e abre no primeiro pendente (FUN-112).
 * Sem `banco`, a página funciona, mas avisa que nada fica guardado; "Baixar decisões" entrega `decisoes.json`.
 */
export async function iniciar(
  raiz: HTMLElement,
  dados: DadosDaRevisao,
  banco: BancoDecisoes | null,
  baixar: (nome: string, conteudo: string) => void = baixarArquivo,
): Promise<void> {
  const arquivo: ArquivoCorrecoes = {
    versao: 1,
    regras: dados.regras.map((r) => ({
      id: r.id as IdRegra,
      descricao: r.descricao,
      estado: r.estado,
      versiculos: r.versiculos,
      exemplos: [],
    })),
    itens: dados.itens,
  };
  const itemPorId = new Map(dados.itens.map((i) => [i.id, i] as const));
  const regraPorId = new Map(dados.regras.map((r) => [r.id, r] as const));

  let decisoes: Decisao[] = [];
  let aviso = banco === null ? 'Sem banco: as decisões não ficam guardadas; use "Baixar decisões".' : '';
  if (banco !== null) {
    try {
      decisoes = await banco.carregar();
    } catch (erro) {
      aviso = `Não foi possível ler as decisões guardadas: ${(erro as Error).message}`;
    }
  }
  let grupos: Grupos = agrupar(arquivo, decisoes);
  let vista: Vista = { tipo: 'umAUm', indice: 0 };
  let editando = false;
  let rascunho = '';

  const ehPendente = (id: string, noArquivo: EstadoCorrecao): boolean =>
    (decisoes.find((d) => d.id === id)?.estado ?? noArquivo) === 'proposta';

  const indicePendente = (): number => {
    const i = grupos.umAUm.itens.findIndex((x) => ehPendente(x.id, x.estado));
    return i < 0 ? 0 : i;
  };

  /** Leva a vista ao lugar do primeiro pendente; sem pendente, fica onde está. */
  const irAoPrimeiroPendente = (): void => {
    const id = primeiroPendente(grupos, decisoes);
    editando = false;
    if (id === null) return;
    if (regraPorId.has(id)) {
      vista = { tipo: 'regra', id };
      return;
    }
    const bloco = grupos.blocos.find((b) => b.itens.some((i) => i.id === id));
    if (bloco) {
      vista = { tipo: 'bloco', chave: bloco.chave };
      return;
    }
    vista = {
      tipo: 'umAUm',
      indice: Math.max(
        0,
        grupos.umAUm.itens.findIndex((i) => i.id === id),
      ),
    };
  };

  /** Grava em ordem; só marca como decidido o que o banco confirmou. Devolve se tudo foi gravado. */
  const decidir = async (novas: Decisao[]): Promise<boolean> => {
    for (const d of novas) {
      try {
        if (banco !== null) await banco.gravar(d);
      } catch (erro) {
        aviso = `Não foi possível gravar a decisão ${d.id}: ${(erro as Error).message}`;
        desenhar();
        return false;
      }
      decisoes = [...decisoes.filter((x) => x.id !== d.id), d];
    }
    aviso = banco === null ? aviso : '';
    grupos = agrupar(arquivo, decisoes);
    return true;
  };

  const depoisDe = (item: ItemDaRevisao, depois: string): string =>
    item.confere && depois !== item.depois
      ? item.versiculoAntes.replace(item.antes, () => depois)
      : item.versiculoDepois;

  /** Depois de decidir: no um a um, o próximo pendente da lista; nos outros casos (ou se acabou), o primeiro pendente. */
  const avancar = (): void => {
    editando = false;
    rascunho = '';
    if (vista.tipo === 'umAUm') {
      const itens = grupos.umAUm.itens;
      const inicio = vista.indice;
      for (let passo = 0; passo < itens.length; passo++) {
        const i = (inicio + passo) % itens.length;
        const x = itens[i];
        if (x && ehPendente(x.id, x.estado)) {
          vista = { tipo: 'umAUm', indice: i };
          desenhar();
          return;
        }
      }
    }
    irAoPrimeiroPendente();
    desenhar();
  };

  function cartaoDoItem(item: ItemDaRevisao): HTMLElement {
    const cartao = el('section', undefined, { 'data-item': item.id });
    cartao.append(
      el(
        'h2',
        `${item.nomeRef} · ${ROTULO_TIPO[item.tipo] ?? item.tipo} · confiança ${ROTULO_CONFIANCA[item.confianca] ?? item.confianca}`,
      ),
    );
    if (item.italicoMuda) cartao.append(el('p', 'Os colchetes de itálico mudam: revise com atenção.'));
    if (!item.confere) cartao.append(el('p', 'Não confere: o trecho "antes" não está no versículo da fonte.'));
    cartao.append(el('h3', 'Antes'), el('p', item.versiculoAntes, { class: 'versiculo' }));
    // O "depois" que o dono já salvou vale mais que o do arquivo (FUN-112): voltar ao item não perde a edição.
    const salvo = decisoes.find((d) => d.id === item.id)?.depois ?? item.depois;
    const campo = el('textarea', undefined, { 'data-campo': 'depois', rows: '3' });
    campo.value = rascunho !== '' ? rascunho : salvo;
    const depoisTexto = el('p', depoisDe(item, campo.value), { class: 'versiculo', 'data-depois': '' });
    cartao.append(el('h3', 'Depois'), depoisTexto);
    cartao.append(
      el('p', `Motivo: ${item.motivo}`),
      el('p', `Fonte: ${item.fonte === '' ? '(sem fonte)' : item.fonte}`),
    );

    const motivoBloqueio = (): string | true => podeAprovar(item, editando ? campo.value : undefined);
    const bloqueio = el('p', '', { role: 'alert' });
    const aprovar = botao('Aprovar', 'aprovar', () => {
      const valor = editando ? campo.value : salvo;
      const editado = valor !== item.depois;
      void decidir([{ id: item.id, estado: 'aprovada', ...(editado ? { depois: valor } : {}) }]).then(
        (ok) => ok && avancar(),
      );
    });
    const atualizarBloqueio = (): void => {
      const m = motivoBloqueio();
      bloqueio.textContent = m === true ? '' : m;
      aprovar.disabled = m !== true;
    };
    campo.addEventListener('input', () => {
      rascunho = campo.value;
      depoisTexto.textContent = depoisDe(item, campo.value);
      atualizarBloqueio();
    });
    atualizarBloqueio();

    const acoes = el('p');
    acoes.append(
      aprovar,
      botao('Recusar', 'recusar', () => {
        void decidir([{ id: item.id, estado: 'recusada', ...(salvo !== item.depois ? { depois: salvo } : {}) }]).then(
          (ok) => ok && avancar(),
        );
      }),
      botao('Editar', 'editar', () => {
        editando = true;
        desenhar();
      }),
    );
    if (editando) cartao.append(el('h3', 'Editar o trecho "depois"'), campo);
    cartao.append(bloqueio, acoes);
    return cartao;
  }

  function painel(): HTMLElement {
    const principal = el('main');
    if (vista.tipo === 'regra') {
      const regra = regraPorId.get(vista.id);
      if (!regra) return principal;
      const decidida = decisoes.find((d) => d.id === regra.id)?.estado ?? regra.estado;
      principal.append(
        el('h2', `Regra ${regra.id}`),
        el('p', regra.descricao),
        el('p', `Muda ${regra.versiculos} versículos. Estado: ${decidida}.`),
      );
      for (const exemplo of regra.exemplos) {
        principal.append(
          el('h3', exemplo.nomeRef),
          el('p', `Antes: ${exemplo.antes}`, { class: 'versiculo' }),
          el('p', `Depois: ${exemplo.depois}`, { class: 'versiculo' }),
        );
      }
      const acoes = el('p');
      acoes.append(
        botao('Aprovar a regra', 'aprovar', () => {
          void decidir([{ id: regra.id, estado: 'aprovada' }]).then((ok) => ok && avancar());
        }),
        botao('Recusar a regra', 'recusar', () => {
          void decidir([{ id: regra.id, estado: 'recusada' }]).then((ok) => ok && avancar());
        }),
      );
      principal.append(acoes);
    } else if (vista.tipo === 'bloco') {
      const chave = vista.chave;
      const bloco = grupos.blocos.find((b) => b.chave === chave);
      if (!bloco) return principal;
      principal.append(
        el(
          'h2',
          `${ROTULO_TIPO[bloco.tipo] ?? bloco.tipo} · ${bloco.itens[0] ? nomeDoLivro(bloco.itens[0] as ItemDaRevisao) : ''}`,
        ),
        el('p', `${bloco.pendentes} pendentes de ${bloco.itens.length}. Só entram os que conferem.`),
      );
      principal.append(
        botao(
          'Aprovar o bloco',
          'aprovar-grupo',
          () => {
            void decidir(aprovarGrupo(bloco, decisoes)).then((ok) => ok && avancar());
          },
          bloco.pendentes === 0,
        ),
      );
      for (const i of bloco.itens) {
        const item = itemPorId.get(i.id);
        if (!item) continue;
        const estado = decisoes.find((d) => d.id === item.id)?.estado ?? item.estado;
        const linha = el('p', `${item.nomeRef}: "${item.antes}" → "${item.depois}" (${estado})`, {
          'data-item': item.id,
        });
        principal.append(linha);
      }
    } else {
      const itens = grupos.umAUm.itens;
      const item = itemPorId.get(itens[vista.indice]?.id ?? '');
      if (!item) {
        principal.append(el('p', 'Nenhum item para revisar um a um.'));
        return principal;
      }
      const posicao = vista.indice;
      const nav = el('p');
      nav.append(
        botao(
          'Anterior',
          'anterior',
          () => {
            vista = { tipo: 'umAUm', indice: Math.max(0, posicao - 1) };
            editando = false;
            rascunho = '';
            desenhar();
          },
          posicao === 0,
        ),
        botao(
          'Próximo',
          'proximo',
          () => {
            vista = { tipo: 'umAUm', indice: Math.min(itens.length - 1, posicao + 1) };
            editando = false;
            rascunho = '';
            desenhar();
          },
          posicao >= itens.length - 1,
        ),
      );
      const estado = decisoes.find((d) => d.id === item.id)?.estado ?? item.estado;
      principal.append(el('p', `Item ${posicao + 1} de ${itens.length} (${estado})`), nav, cartaoDoItem(item));
    }
    return principal;
  }

  function desenhar(): void {
    const pendentes =
      grupos.regras.reduce((n, g) => n + g.pendentes, 0) +
      grupos.blocos.reduce((n, g) => n + g.pendentes, 0) +
      grupos.umAUm.pendentes;
    const topo = el('header');
    topo.append(
      el('h1', 'Revisão das correções do texto'),
      el('p', `${pendentes} pendentes · ${decisoes.length} decisões guardadas`),
    );
    if (aviso !== '') topo.append(el('p', aviso, { role: 'alert' }));
    topo.append(botao('Baixar decisões', 'baixar', () => baixar('decisoes.json', decisoesComoJson(decisoes))));

    const nav = el('nav');
    const ativo = (chave: string): boolean =>
      (vista.tipo === 'regra' && chave === `regra:${vista.id}`) ||
      (vista.tipo === 'bloco' && chave === vista.chave) ||
      (vista.tipo === 'umAUm' && chave === 'umAUm');
    const entrada = (chave: string, rotulo: string, pend: number, aoIr: () => void): HTMLButtonElement => {
      const b = el('button', `${rotulo} (${pend})`, { type: 'button', 'data-grupo': chave });
      if (ativo(chave)) b.classList.add('ativo');
      b.addEventListener('click', () => {
        editando = false;
        rascunho = '';
        aoIr();
        desenhar();
      });
      return b;
    };
    for (const g of grupos.regras) {
      nav.append(
        entrada(g.chave, `Regra ${g.regra.id}`, g.pendentes, () => (vista = { tipo: 'regra', id: g.regra.id })),
      );
    }
    for (const g of grupos.blocos) {
      const livro = g.itens[0] ? nomeDoLivro(g.itens[0] as ItemDaRevisao) : String(g.livro);
      nav.append(
        entrada(
          g.chave,
          `${ROTULO_TIPO[g.tipo] ?? g.tipo} · ${livro}`,
          g.pendentes,
          () => (vista = { tipo: 'bloco', chave: g.chave }),
        ),
      );
    }
    nav.append(
      entrada(
        'umAUm',
        'Itens um a um',
        grupos.umAUm.pendentes,
        () => (vista = { tipo: 'umAUm', indice: indicePendente() }),
      ),
    );

    raiz.replaceChildren(topo, nav, painel());
  }

  irAoPrimeiroPendente();
  desenhar();
}

/** Entrega um arquivo de texto ao navegador (o "Baixar decisões"). */
function baixarArquivo(nome: string, conteudo: string): void {
  const url = URL.createObjectURL(new Blob([conteudo], { type: 'application/json' }));
  const a = el('a', undefined, { href: url, download: nome });
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
