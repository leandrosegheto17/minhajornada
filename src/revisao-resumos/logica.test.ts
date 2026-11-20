import { describe, expect, it } from 'vitest';
import { lerArquivoExportado } from '../resumos/formato';
import type { ItemRevisao, Resumo } from '../resumos/formato';
import { aprovar, exportar, recusar } from './logica';

const resumo = (livro: number, contexto = `Contexto do livro ${livro}.`): Resumo => ({
  livro,
  contexto,
  mensagem: 'Mensagem central.',
  divisao: [{ titulo: 'Parte única', de: 1, ate: 2 }],
  versiculos: [{ capitulo: 1, versiculo: 1, frase: 'Frase do versículo.' }],
});
const proposta = (livro: number): ItemRevisao => ({ livro, estado: 'proposta', resumo: resumo(livro) });

describe('revisão dos resumos: lógica (FUN-170 a FUN-172)', () => {
  it('FUN-170: aprovar e recusar mudam o estado do livro; a proposta fica como veio', () => {
    const item = proposta(8);
    expect(item.estado).toBe('proposta');
    expect(aprovar(item).estado).toBe('aprovada');
    expect(recusar(item, 'Falta a divisão certa.').estado).toBe('recusada');
    expect(item.estado).toBe('proposta');
  });

  it('FUN-171: aprovar com o texto editado guarda o editado como aprovado', () => {
    const editado = resumo(8, 'Contexto reescrito pelo dono.');
    const aprovado = aprovar(proposta(8), editado);
    expect(aprovado).toEqual({ livro: 8, estado: 'aprovada', resumo: editado });
  });

  it('FUN-171: aprovar sem edição mantém o texto da proposta e tira a nota de uma recusa anterior', () => {
    const recusado = recusar(proposta(8), 'Refazer.');
    const aprovado = aprovar(recusado);
    expect(aprovado.resumo).toEqual(resumo(8));
    expect(aprovado).not.toHaveProperty('nota');
  });

  it('FUN-171: um texto editado de outro livro não é aprovado', () => {
    expect(() => aprovar(proposta(8), resumo(1))).toThrow(/livro 1/);
  });

  it('FUN-172: recusar com nota vazia ou só espaço falha', () => {
    expect(() => recusar(proposta(8), '')).toThrow('Escreva uma nota para recusar.');
    expect(() => recusar(proposta(8), '   \n ')).toThrow('Escreva uma nota para recusar.');
  });

  it('FUN-172: o recusado leva a nota na exportação e não sai como aprovado', () => {
    const arquivo = exportar([recusar(proposta(41), '  Linguagem difícil. '), aprovar(proposta(8))]);
    const marcos = arquivo.itens.find((i) => i.livro === 41);
    expect(marcos).toMatchObject({ estado: 'recusada', nota: 'Linguagem difícil.' });
    expect(arquivo.itens.filter((i) => i.estado === 'aprovada').map((i) => i.livro)).toEqual([8]);
  });

  it('FUN-170: exportar gera mj-resumos-v1 em ordem de livro, aceito por lerArquivoExportado', () => {
    const itens = [proposta(45), aprovar(proposta(1), resumo(1, 'Editado.')), recusar(proposta(41), 'Nota.')];
    const arquivo = exportar(itens);
    expect(arquivo.formato).toBe('mj-resumos-v1');
    expect(arquivo.itens.map((i) => i.livro)).toEqual([1, 41, 45]);
    expect(lerArquivoExportado(JSON.stringify(arquivo))).toEqual(arquivo);
  });

  it('FUN-170: exportar recusa livro repetido', () => {
    expect(() => exportar([proposta(8), aprovar(proposta(8))])).toThrow(/repetido/);
  });
});
