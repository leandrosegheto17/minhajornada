import { fireEvent, screen, waitFor, within } from '@testing-library/dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { lerArquivoExportado } from '../resumos/formato';
import type { ItemRevisao } from '../resumos/formato';
import { bancoDoArtifact, iniciar, NOME_EXPORTACAO } from './pagina';
import type { BancoResumos, DbLike } from './pagina';

const item = (livro: number, contexto = `Contexto do livro ${livro}.`): ItemRevisao => ({
  livro,
  estado: 'proposta',
  resumo: {
    livro,
    contexto,
    mensagem: 'Mensagem central.',
    divisao: [{ titulo: 'Parte única', de: 1, ate: 4 }],
    versiculos: [{ capitulo: 1, versiculo: 16, frase: 'Frase do versículo.' }],
  },
});

/** Banco dublê em memória, com a lista de gravações. */
function bancoDuble(iniciais: ItemRevisao[]): BancoResumos & { gravados: ItemRevisao[] } {
  const gravados: ItemRevisao[] = [];
  return {
    gravados,
    carregar: async () => iniciais,
    gravar: async (novo) => {
      gravados.push(novo);
    },
  };
}

async function montar(banco: BancoResumos | null, baixar = vi.fn()) {
  const raiz = document.createElement('div');
  document.body.append(raiz);
  await iniciar(raiz, banco, baixar);
  return { raiz, baixar };
}

afterEach(() => {
  document.body.replaceChildren();
});

describe('revisão dos resumos: página (FUN-170 a FUN-172)', () => {
  it('FUN-170: lista os livros com o estado e abre o primeiro com as quatro seções', async () => {
    await montar(bancoDuble([item(8), { ...item(41), estado: 'recusada', nota: 'Refazer.' }]));
    const lista = screen.getByRole('navigation', { name: 'Livros' });
    expect(
      within(lista)
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual(['Rute · proposta', 'Marcos · recusada']);
    expect(screen.getByLabelText('Contexto')).toHaveValue('Contexto do livro 8.');
    expect(screen.getByLabelText('Mensagem central')).toBeInTheDocument();
    expect(screen.getByLabelText(/^Divisão do livro/)).toHaveValue('Parte única');
    expect(screen.getByLabelText(/^Versículos-chave: 1:16/)).toHaveValue('Frase do versículo.');
  });

  it('FUN-171: editar "Contexto" e aprovar grava o texto editado como aprovado', async () => {
    const banco = bancoDuble([item(8)]);
    await montar(banco);
    fireEvent.input(screen.getByLabelText('Contexto'), { target: { value: 'Contexto reescrito.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Aprovar' }));
    await waitFor(() => expect(banco.gravados).toHaveLength(1));
    expect(banco.gravados[0]).toMatchObject({
      livro: 8,
      estado: 'aprovada',
      resumo: { contexto: 'Contexto reescrito.' },
    });
    expect(await screen.findByRole('button', { name: 'Rute · aprovada' })).toBeInTheDocument();
  });

  it('FUN-172: recusar sem nota mostra o erro e não grava', async () => {
    const banco = bancoDuble([item(8)]);
    await montar(banco);
    fireEvent.input(screen.getByLabelText('Nota da recusa'), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Recusar' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Escreva uma nota para recusar.');
    expect(banco.gravados).toHaveLength(0);
  });

  it('FUN-172: recusar com nota grava recusada com a nota', async () => {
    const banco = bancoDuble([item(8)]);
    await montar(banco);
    fireEvent.input(screen.getByLabelText('Nota da recusa'), { target: { value: 'Linguagem difícil.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Recusar' }));
    await waitFor(() => expect(banco.gravados).toHaveLength(1));
    expect(banco.gravados[0]).toMatchObject({ estado: 'recusada', nota: 'Linguagem difícil.' });
  });

  it('FUN-170: texto com <img src=x> aparece literal, sem elemento img', async () => {
    const { raiz } = await montar(
      bancoDuble([{ ...item(8), estado: 'recusada', nota: '<img src=x onerror=alert(1)>' }]),
    );
    expect(raiz.querySelector('img')).toBeNull();
    expect(screen.getByText('Nota da recusa: <img src=x onerror=alert(1)>')).toBeInTheDocument();
  });

  it('FUN-170: "Baixar exportação" entrega o JSON de exportar', async () => {
    const { baixar } = await montar(bancoDuble([item(45), item(8)]));
    fireEvent.click(screen.getByRole('button', { name: 'Baixar exportação' }));
    expect(baixar).toHaveBeenCalledTimes(1);
    const [nome, conteudo] = baixar.mock.calls[0] as [string, string];
    expect(nome).toBe(NOME_EXPORTACAO);
    expect(lerArquivoExportado(conteudo).itens.map((i) => i.livro)).toEqual([8, 45]);
  });

  it('FUN-170: sem banco, avisa que nada fica guardado', async () => {
    await montar(null);
    expect(screen.getByRole('status')).toHaveTextContent('Sem banco');
    expect(screen.getByText('Nenhum resumo para revisar.')).toBeInTheDocument();
  });

  it('FUN-170: o banco do artifact grava em resumos/<livro> e ignora linha mal formada ao ler', async () => {
    const set = vi.fn(async () => {});
    const doc = vi.fn(() => ({ set }));
    const db: DbLike = {
      collection: () => ({
        get: async () => ({
          docs: [
            { id: '8', data: () => item(8) as unknown as Record<string, unknown> },
            { id: 'x', data: () => ({ livro: 'oito' }) },
          ],
        }),
        doc,
      }),
    };
    const banco = bancoDoArtifact(db);
    expect((await banco.carregar()).map((i) => i.livro)).toEqual([8]);
    await banco.gravar(item(8));
    expect(doc).toHaveBeenCalledWith('8');
    expect(set).toHaveBeenCalledWith(item(8));
  });
});
