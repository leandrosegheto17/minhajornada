import { describe, expect, it } from 'vitest';
import { carregarCorrecoes, resumoCorrecoes } from './correcoesAplicadas';

describe('correções aplicadas no app (FUN-123)', () => {
  it('FUN-123: carregarCorrecoes devolve a lista gerada, com regras e itens', async () => {
    const lista = await carregarCorrecoes();
    expect(Array.isArray(lista.regras)).toBe(true);
    expect(Array.isArray(lista.itens)).toBe(true);
  });

  it('FUN-123: o total do resumo é o número de regras aplicadas mais o de itens aplicados', async () => {
    const lista = await carregarCorrecoes();
    expect(resumoCorrecoes.total).toBe(lista.regras.length + lista.itens.length);
  });
});
