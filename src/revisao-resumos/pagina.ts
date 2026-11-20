// Página de revisão dos resumos (FUN-170 a FUN-172). Roda fora do app, num artifact privado: lê os resumos do banco do
// artifact (`resumos/<livro>`), deixa editar as quatro seções, aprovar, recusar com nota e baixar a exportação. Todo
// texto entra por `textContent` ou `value`, nunca por HTML (FUN-165).
import { indice } from '../biblia/indice';
import { lerArquivoExportado } from '../resumos/formato';
import type { ItemRevisao, Resumo } from '../resumos/formato';
import { aprovar, exportar, recusar } from './logica';

/** Onde os resumos ficam guardados: o banco do artifact, ou um dublê nos testes. */
export interface BancoResumos {
  carregar(): Promise<ItemRevisao[]>;
  gravar(item: ItemRevisao): Promise<void>;
}

/** O pedaço do `db` do artifact que a página usa (`claude.use("db")`); molde `src/revisao/pagina.ts:16-21`. */
export interface DbLike {
  collection(caminho: string): {
    get(): Promise<{ docs: Array<{ id: string; data(): Record<string, unknown> | undefined }> }>;
    doc(id: string): { set(dados: Record<string, unknown>): Promise<void> };
  };
}

const COLECAO = 'resumos';
export const NOME_EXPORTACAO = 'resumos.json';

/** Uma linha por livro em `resumos/<livro>`, no formato de um item exportado. Linha mal formada é ignorada ao ler. */
export function bancoDoArtifact(db: DbLike): BancoResumos {
  return {
    async carregar() {
      const { docs } = await db.collection(COLECAO).get();
      const itens: ItemRevisao[] = [];
      for (const doc of docs) {
        try {
          const [item] = lerArquivoExportado(JSON.stringify({ formato: 'mj-resumos-v1', itens: [doc.data()] })).itens;
          if (item && !itens.some((i) => i.livro === item.livro)) itens.push(item);
        } catch {
          // Linha que não é um item válido não entra na revisão.
        }
      }
      return itens.sort((a, b) => a.livro - b.livro);
    },
    gravar(item) {
      return db
        .collection(COLECAO)
        .doc(String(item.livro))
        .set({ ...item } as unknown as Record<string, unknown>);
    },
  };
}

const ROTULO_ESTADO: Record<ItemRevisao['estado'], string> = {
  proposta: 'proposta',
  aprovada: 'aprovada',
  recusada: 'recusada',
};

const nomeDoLivro = (livro: number): string => indice.livros[livro - 1]?.nome ?? `Livro ${livro}`;

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

function botao(texto: string, aoClicar: () => void): HTMLButtonElement {
  const b = el('button', texto, { type: 'button' });
  b.addEventListener('click', aoClicar);
  return b;
}

/** Campo de texto com rótulo; devolve o bloco e a leitura do valor atual. */
function campo(rotulo: string, valor: string, linhas = 4): { bloco: HTMLElement; ler: () => string } {
  const bloco = el('label');
  const area = el('textarea', undefined, { rows: String(linhas) });
  area.value = valor;
  bloco.append(el('span', rotulo), area);
  return { bloco, ler: () => area.value };
}

/**
 * Monta a página dentro de `raiz`: a lista dos livros com o estado e, para o livro escolhido, as quatro seções
 * editáveis, "Aprovar", "Recusar" com nota e "Baixar exportação". Sem `banco`, avisa que nada fica guardado.
 */
export async function iniciar(
  raiz: HTMLElement,
  banco: BancoResumos | null,
  baixar: (nome: string, conteudo: string) => void = baixarArquivo,
): Promise<void> {
  let itens: ItemRevisao[] = [];
  let aviso = banco === null ? 'Sem banco: nada fica guardado; use "Baixar exportação".' : '';
  if (banco !== null) {
    try {
      itens = await banco.carregar();
    } catch (erro) {
      aviso = `Não foi possível ler os resumos guardados: ${(erro as Error).message}`;
    }
  }
  let atual = itens[0]?.livro ?? null;
  let erro = '';

  async function guardar(novo: ItemRevisao): Promise<void> {
    try {
      if (banco !== null) await banco.gravar(novo);
      itens = itens.map((i) => (i.livro === novo.livro ? novo : i));
      erro = '';
    } catch (falha) {
      erro = `Não foi possível gravar: ${(falha as Error).message}`;
    }
    desenhar();
  }

  function painel(item: ItemRevisao): HTMLElement {
    const secao = el('section', undefined, { 'aria-label': `Resumo de ${nomeDoLivro(item.livro)}` });
    const { resumo } = item;
    secao.append(el('h2', `${nomeDoLivro(item.livro)} · ${ROTULO_ESTADO[item.estado]}`));
    if (item.nota !== undefined) secao.append(el('p', `Nota da recusa: ${item.nota}`));

    const contexto = campo('Contexto', resumo.contexto);
    const mensagem = campo('Mensagem central', resumo.mensagem);
    const divisao = resumo.divisao.map((parte) =>
      campo(`Divisão do livro: capítulos ${parte.de} a ${parte.ate}`, parte.titulo, 2),
    );
    const versiculos = resumo.versiculos.map((v) =>
      campo(`Versículos-chave: ${v.capitulo}:${v.versiculo}${v.ate === undefined ? '' : `-${v.ate}`}`, v.frase, 2),
    );
    const nota = campo('Nota da recusa', '', 2);
    const editado = (): Resumo => ({
      livro: resumo.livro,
      contexto: contexto.ler(),
      mensagem: mensagem.ler(),
      divisao: resumo.divisao.map((parte, i) => ({ ...parte, titulo: divisao[i]?.ler() ?? parte.titulo })),
      versiculos: resumo.versiculos.map((v, i) => ({ ...v, frase: versiculos[i]?.ler() ?? v.frase })),
    });

    secao.append(
      contexto.bloco,
      mensagem.bloco,
      ...divisao.map((c) => c.bloco),
      ...versiculos.map((c) => c.bloco),
      botao('Aprovar', () => void guardar(aprovar(item, editado()))),
      nota.bloco,
      botao('Recusar', () => {
        try {
          void guardar(recusar(item, nota.ler()));
        } catch (falha) {
          erro = (falha as Error).message;
          desenhar();
        }
      }),
    );
    return secao;
  }

  function desenhar(): void {
    const topo = el('header');
    topo.append(el('h1', 'Revisão dos resumos'));
    if (aviso !== '') topo.append(el('p', aviso, { role: 'status' }));
    topo.append(
      botao('Baixar exportação', () => baixar(NOME_EXPORTACAO, `${JSON.stringify(exportar(itens), null, 2)}\n`)),
    );
    const alerta = el('p', erro, { role: 'alert' });

    const lista = el('nav', undefined, { 'aria-label': 'Livros' });
    for (const item of itens) {
      const b = botao(`${nomeDoLivro(item.livro)} · ${ROTULO_ESTADO[item.estado]}`, () => {
        atual = item.livro;
        erro = '';
        desenhar();
      });
      if (item.livro === atual) b.setAttribute('aria-current', 'true');
      lista.append(b);
    }

    const escolhido = itens.find((i) => i.livro === atual);
    const corpo = escolhido ? painel(escolhido) : el('p', 'Nenhum resumo para revisar.');
    raiz.replaceChildren(topo, alerta, lista, corpo);
  }

  desenhar();
}

/** Entrega um arquivo de texto ao navegador (o "Baixar exportação"). */
function baixarArquivo(nome: string, conteudo: string): void {
  const url = URL.createObjectURL(new Blob([conteudo], { type: 'application/json' }));
  const a = el('a', undefined, { href: url, download: nome });
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
