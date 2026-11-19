import { beforeEach, describe, expect, it, vi } from 'vitest';
import { montarDados } from '../../scripts/montar-revisao.ts';
import { arquivo, item, livrosFicticios, regra } from '../biblia/correcoes/apoio-teste';
import type { Decisao } from './logica';
import { bancoDoArtifact, decisoesComoJson, iniciar } from './pagina';
import type { BancoDecisoes } from './pagina';

// Dados: uma regra (R-01), um item de sentido sem fonte, um de sentido com fonte, um de digitação em confiança média
// (um a um) e dois de digitação em confiança alta (um bloco).
const sentidoSemFonte = item({
  id: 'C-0001',
  ref: { livro: 1, capitulo: 1, versiculo: 2 },
  tipo: 'sentido',
  fonte: '',
  antes: 'Coreiro',
  depois: 'Cordeiro',
});
const sentidoComFonte = item({
  id: 'C-0002',
  ref: { livro: 1, capitulo: 1, versiculo: 3 },
  tipo: 'sentido',
  fonte: 'hebraico',
  antes: 'sim sim',
  depois: 'sim',
});
const media = item({
  id: 'C-0003',
  ref: { livro: 1, capitulo: 2, versiculo: 1 },
  confianca: 'media',
  antes: 'Rute disse',
  depois: 'Rute falou',
});
const alta1 = item({
  id: 'C-0004',
  ref: { livro: 2, capitulo: 1, versiculo: 2 },
  antes: 'Então saiu',
  depois: 'Então partiu',
});
const alta2 = item({
  id: 'C-0005',
  ref: { livro: 2, capitulo: 1, versiculo: 1 },
  antes: 'Assim falou',
  depois: 'Assim disse',
});

const DADOS = () =>
  montarDados(arquivo([sentidoSemFonte, media, sentidoComFonte, alta1, alta2], [regra('R-01')]), livrosFicticios());

/** Banco dublê: guarda as linhas num mapa e deixa a próxima gravação falhar, se pedido. */
function bancoDuble(inicial: Decisao[] = []) {
  const linhas = new Map<string, Decisao>(inicial.map((d) => [d.id, d]));
  const gravacoes: Decisao[] = [];
  let falhar = false;
  const banco: BancoDecisoes = {
    carregar: () => Promise.resolve([...linhas.values()]),
    gravar: (d) => {
      if (falhar) return Promise.reject(new Error('banco fora do ar'));
      gravacoes.push(d);
      linhas.set(d.id, d);
      return Promise.resolve();
    },
  };
  return { banco, linhas, gravacoes, falharProxima: () => (falhar = true) };
}

let raiz: HTMLElement;
beforeEach(() => {
  document.body.innerHTML = '<div id="revisao"></div>';
  raiz = document.getElementById('revisao') as HTMLElement;
});

const botao = (acao: string): HTMLButtonElement => {
  const b = raiz.querySelector<HTMLButtonElement>(`[data-acao="${acao}"]`);
  if (!b) throw new Error(`sem botão ${acao}: ${raiz.textContent}`);
  return b;
};
const vai = (chave: string) => raiz.querySelector<HTMLButtonElement>(`[data-grupo="${chave}"]`)!.click();
const texto = () => raiz.textContent ?? '';

describe('página de revisão (FUN-108, FUN-109, FUN-111, FUN-112)', () => {
  it('FUN-108: mostra as regras, os blocos por tipo e livro e os um a um, cada grupo com as pendências', () => {
    void iniciar(raiz, DADOS(), bancoDuble().banco);
    return vi.waitFor(() => {
      const grupos = [...raiz.querySelectorAll('[data-grupo]')].map((g) => g.textContent);
      expect(grupos).toHaveLength(3);
      expect(grupos[0]).toContain('R-01');
      expect(grupos[0]).toContain('1');
      expect(grupos[1]).toMatch(/Êxodo/);
      expect(grupos[1]).toContain('2');
      expect(grupos[2]).toMatch(/um a um/i);
      expect(grupos[2]).toContain('3');
    });
  });

  it('FUN-109: o item mostra o versículo inteiro antes e depois, o motivo, a fonte e as ações Aprovar, Recusar e Editar', async () => {
    await iniciar(raiz, DADOS(), bancoDuble().banco);
    vai('umAUm');
    await vi.waitFor(() => expect(botao('aprovar')).toBeDefined());
    const t = texto();
    expect(t).toContain('A terra era sem forma e vazia, e o Coreiro abriu o livro.');
    expect(t).toContain('A terra era sem forma e vazia, e o Cordeiro abriu o livro.');
    expect(t).toContain('palavra inexistente');
    expect(botao('recusar')).toBeDefined();
    expect(botao('editar')).toBeDefined();
  });

  it('FUN-112: aprovar uma regra, recusar um item de sentido e editar um de digitação gravam três linhas; reabrir mostra as três e começa no primeiro pendente', async () => {
    const { banco, gravacoes, linhas } = bancoDuble();
    await iniciar(raiz, DADOS(), banco);

    // 1. aprovar a regra R-01 (a página abre nela, a primeira pendente)
    botao('aprovar').click();
    await vi.waitFor(() => expect(gravacoes).toHaveLength(1));
    expect(gravacoes[0]).toEqual({ id: 'R-01', estado: 'aprovada' });

    // 2. recusar o item de sentido (um a um: C-0001)
    vai('umAUm');
    await vi.waitFor(() => expect(texto()).toContain('Coreiro'));
    botao('recusar').click();
    await vi.waitFor(() => expect(gravacoes).toHaveLength(2));
    expect(gravacoes[1]).toEqual({ id: 'C-0001', estado: 'recusada' });

    // 3. editar o item de digitação média (C-0003) e aprová-lo com o trecho editado
    await vi.waitFor(() => expect(texto()).toContain('Rute disse'));
    botao('editar').click();
    const campo = raiz.querySelector<HTMLTextAreaElement>('textarea[data-campo="depois"]')!;
    campo.value = 'Rute respondeu';
    campo.dispatchEvent(new Event('input', { bubbles: true }));
    botao('aprovar').click();
    await vi.waitFor(() => expect(gravacoes).toHaveLength(3));
    expect(gravacoes[2]).toEqual({ id: 'C-0003', estado: 'aprovada', depois: 'Rute respondeu' });

    // Reabrir com o mesmo banco: as três decisões aparecem e a página começa no primeiro pendente.
    expect([...linhas.keys()].sort()).toEqual(['C-0001', 'C-0003', 'R-01']);
    document.body.innerHTML = '<div id="revisao"></div>';
    raiz = document.getElementById('revisao') as HTMLElement;
    await iniciar(raiz, DADOS(), banco);
    await vi.waitFor(() => expect(texto()).toMatch(/3 decisões/));
    // O primeiro pendente, na ordem regras → blocos → um a um, é o bloco de Êxodo.
    expect(texto()).toContain('Êxodo');
    expect(raiz.querySelector('[data-grupo].ativo')?.getAttribute('data-grupo')).toMatch(/^bloco:/);
  });

  it('FUN-112: o "depois" editado e salvo reaparece na prévia e no campo, e reaprovar não perde a edição', async () => {
    const { banco, gravacoes } = bancoDuble([
      { id: 'C-0001', estado: 'recusada' },
      { id: 'C-0002', estado: 'recusada' },
      { id: 'C-0003', estado: 'aprovada', depois: 'Rute respondeu' },
    ]);
    await iniciar(raiz, DADOS(), banco);
    vai('umAUm');
    await vi.waitFor(() => expect(texto()).toContain('Item 1 de'));
    botao('proximo').click();
    await vi.waitFor(() => expect(texto()).toContain('Rute disse'));
    expect(texto()).toContain('Rute respondeu');
    expect(texto()).not.toContain('Rute falou');
    botao('editar').click();
    expect(raiz.querySelector<HTMLTextAreaElement>('textarea[data-campo="depois"]')?.value).toBe('Rute respondeu');
    botao('aprovar').click();
    await vi.waitFor(() => expect(gravacoes).toHaveLength(1));
    expect(gravacoes[0]).toEqual({ id: 'C-0003', estado: 'aprovada', depois: 'Rute respondeu' });
  });

  it('FUN-112: reaprovar sem abrir a edição também mantém o "depois" salvo', async () => {
    const { banco, gravacoes } = bancoDuble([
      { id: 'C-0001', estado: 'recusada' },
      { id: 'C-0002', estado: 'recusada' },
      { id: 'C-0003', estado: 'recusada', depois: 'Rute respondeu' },
    ]);
    await iniciar(raiz, DADOS(), banco);
    vai('umAUm');
    await vi.waitFor(() => expect(texto()).toContain('Item 1 de'));
    botao('proximo').click();
    await vi.waitFor(() => expect(texto()).toContain('Rute disse'));
    botao('aprovar').click();
    await vi.waitFor(() => expect(gravacoes).toHaveLength(1));
    expect(gravacoes[0]).toEqual({ id: 'C-0003', estado: 'aprovada', depois: 'Rute respondeu' });
  });

  it('FUN-112: recusar um item com "depois" salvo mantém o "depois" na decisão (A-09)', async () => {
    const { banco, gravacoes } = bancoDuble([
      { id: 'C-0001', estado: 'recusada' },
      { id: 'C-0002', estado: 'recusada' },
      { id: 'C-0003', estado: 'proposta', depois: 'Rute respondeu' },
    ]);
    await iniciar(raiz, DADOS(), banco);
    vai('umAUm');
    // Abre no primeiro pendente: o item C-0003, com o "depois" salvo na decisão.
    await vi.waitFor(() => expect(texto()).toContain('Rute disse'));
    expect(texto()).toContain('Rute respondeu');
    botao('recusar').click();
    await vi.waitFor(() => expect(gravacoes).toHaveLength(1));
    expect(gravacoes[0]).toEqual({ id: 'C-0003', estado: 'recusada', depois: 'Rute respondeu' });
  });

  it('FUN-111: item de sentido sem fonte mostra "Falta a fonte" e o Aprovar fica desativado', async () => {
    const { banco, gravacoes } = bancoDuble();
    await iniciar(raiz, DADOS(), banco);
    vai('umAUm');
    await vi.waitFor(() => expect(texto()).toContain('Falta a fonte'));
    expect(botao('aprovar').disabled).toBe(true);
    botao('aprovar').click();
    expect(gravacoes).toHaveLength(0);
  });

  it('FUN-111: sentido com fonte pode ser aprovado', async () => {
    const { banco, gravacoes } = bancoDuble([
      { id: 'C-0001', estado: 'recusada' },
      { id: 'C-0003', estado: 'recusada' },
    ]);
    await iniciar(raiz, DADOS(), banco);
    vai('umAUm');
    await vi.waitFor(() => expect(texto()).toContain('hebraico'));
    expect(texto()).not.toContain('Falta a fonte');
    expect(botao('aprovar').disabled).toBe(false);
    botao('aprovar').click();
    await vi.waitFor(() => expect(gravacoes).toEqual([{ id: 'C-0002', estado: 'aprovada' }]));
  });

  it('FUN-110: aprovar o bloco grava uma decisão por item pendente dele e nenhuma de outro grupo', async () => {
    const { banco, gravacoes } = bancoDuble();
    await iniciar(raiz, DADOS(), banco);
    const bloco = raiz.querySelector<HTMLButtonElement>('[data-grupo^="bloco:"]')!;
    bloco.click();
    botao('aprovar-grupo').click();
    await vi.waitFor(() => expect(gravacoes).toHaveLength(2));
    expect(gravacoes.map((g) => g.id).sort()).toEqual(['C-0004', 'C-0005']);
    expect(gravacoes.every((g) => g.estado === 'aprovada')).toBe(true);
  });

  it('FUN-117: "depois" editado com colchete sem par desativa o Aprovar e mostra o motivo', async () => {
    await iniciar(
      raiz,
      DADOS(),
      bancoDuble([
        { id: 'C-0001', estado: 'recusada' },
        { id: 'C-0002', estado: 'recusada' },
      ]).banco,
    );
    vai('umAUm');
    await vi.waitFor(() => expect(texto()).toContain('Rute disse'));
    botao('editar').click();
    const campo = raiz.querySelector<HTMLTextAreaElement>('textarea[data-campo="depois"]')!;
    campo.value = 'Rute [falou';
    campo.dispatchEvent(new Event('input', { bubbles: true }));
    expect(texto()).toContain('Colchete sem par');
    expect(botao('aprovar').disabled).toBe(true);
  });

  it('FUN-04: nenhum texto entra por innerHTML: um trecho com <b> aparece como texto', async () => {
    const dados = DADOS();
    dados.itens[1] = { ...dados.itens[1]!, motivo: 'motivo com <b>negrito</b>', versiculoAntes: 'antes <b>x</b>' };
    await iniciar(
      raiz,
      dados,
      bancoDuble([
        { id: 'C-0001', estado: 'recusada' },
        { id: 'C-0002', estado: 'recusada' },
      ]).banco,
    );
    vai('umAUm');
    await vi.waitFor(() => expect(texto()).toContain('motivo com <b>negrito</b>'));
    expect(raiz.querySelector('b')).toBeNull();
    expect(texto()).toContain('antes <b>x</b>');
  });

  it('FUN-112: gravação que falha mostra o erro e não marca a decisão', async () => {
    const { banco, gravacoes, falharProxima } = bancoDuble();
    await iniciar(raiz, DADOS(), banco);
    falharProxima();
    botao('aprovar').click();
    await vi.waitFor(() => expect(texto()).toContain('banco fora do ar'));
    expect(gravacoes).toHaveLength(0);
    expect(raiz.querySelector('[data-grupo]')?.textContent).toContain('1');
  });

  it('FUN-112: sem banco a página avisa que as decisões não ficam guardadas e ainda deixa baixar', async () => {
    await iniciar(raiz, DADOS(), null);
    expect(texto()).toMatch(/sem banco/i);
    expect(botao('baixar')).toBeDefined();
  });

  it('FUN-113: "Baixar decisões" entrega decisoes.json com as decisões tomadas', async () => {
    const baixar = vi.fn();
    const { banco } = bancoDuble([{ id: 'R-01', estado: 'aprovada' }]);
    await iniciar(raiz, DADOS(), banco, baixar);
    botao('baixar').click();
    expect(baixar).toHaveBeenCalledTimes(1);
    expect(baixar.mock.calls[0]?.[0]).toBe('decisoes.json');
    expect(JSON.parse(baixar.mock.calls[0]?.[1] as string)).toEqual([{ id: 'R-01', estado: 'aprovada' }]);
  });
});

describe('bancoDoArtifact', () => {
  it('FUN-112: lê as linhas da coleção "decisoes" e grava uma linha por decisão, com o id do item como id do documento', async () => {
    const sets: Array<[string, Record<string, unknown>]> = [];
    const db = {
      collection: (caminho: string) => ({
        get: () =>
          Promise.resolve({
            docs: [
              { id: 'R-01', data: () => ({ id: 'R-01', estado: 'aprovada' }) },
              { id: 'C-0003', data: () => ({ id: 'C-0003', estado: 'aprovada', depois: 'x', lixo: 1 }) },
              { id: 'ruim', data: () => ({ id: 'ruim', estado: 'talvez' }) },
            ],
          }),
        doc: (id: string) => ({
          set: (d: Record<string, unknown>) => (sets.push([`${caminho}/${id}`, d]), Promise.resolve()),
        }),
      }),
    };
    const banco = bancoDoArtifact(db);
    expect(await banco.carregar()).toEqual([
      { id: 'R-01', estado: 'aprovada' },
      { id: 'C-0003', estado: 'aprovada', depois: 'x' },
    ]);
    await banco.gravar({ id: 'C-0003', estado: 'recusada' });
    expect(sets).toEqual([['decisoes/C-0003', { id: 'C-0003', estado: 'recusada' }]]);
  });

  it('FUN-113: decisoesComoJson dá uma lista com id e estado, e depois só quando veio', () => {
    expect(
      JSON.parse(
        decisoesComoJson([
          { id: 'a', estado: 'aprovada', depois: 'x' },
          { id: 'b', estado: 'recusada' },
        ]),
      ),
    ).toEqual([
      { id: 'a', estado: 'aprovada', depois: 'x' },
      { id: 'b', estado: 'recusada' },
    ]);
  });
});
