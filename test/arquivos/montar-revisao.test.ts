import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { montarDados } from '../../scripts/montar-revisao.ts';
import { arquivo, item, livrosFicticios, regra } from '../../src/biblia/correcoes/apoio-teste';
import { converterLivro } from '../../src/biblia/conversor';

describe('montarDados (FUN-109)', () => {
  it('FUN-109: para Apocalipse 6:1, o versículo "antes" é o da fonte e o "depois" tem "Cordeiro" no lugar de "Coreiro"', () => {
    const apocalipse = converterLivro(readFileSync(join(process.cwd(), '.biblia', '66-apocalipse.md'), 'utf8'), 66);
    const dados = montarDados(
      arquivo([
        item({
          id: 'C-0001',
          ref: { livro: 66, capitulo: 6, versiculo: 1 },
          antes: 'quando o Coreiro abriu um dos selos',
          depois: 'quando o Cordeiro abriu um dos selos',
        }),
      ]),
      [apocalipse],
    );
    const i = dados.itens[0];
    expect(i?.versiculoAntes).toBe(apocalipse.capitulos[5]?.[0]);
    expect(i?.versiculoAntes).toContain('o Coreiro abriu');
    expect(i?.versiculoDepois).toBe(i?.versiculoAntes.replace('Coreiro', 'Cordeiro'));
    expect(i?.nomeRef).toBe('Apocalipse 6:1');
  });

  it('FUN-105: item que não confere leva o versículo inteiro e o "depois" igual ao antes', () => {
    const dados = montarDados(arquivo([item({ antes: 'trecho que não existe', confere: false })]), livrosFicticios());
    const i = dados.itens[0];
    expect(i?.versiculoAntes).toBe('A terra era sem forma e vazia, e o Coreiro abriu o livro.');
    expect(i?.versiculoDepois).toBe(i?.versiculoAntes);
    expect(i?.confere).toBe(false);
  });

  it('FUN-109: cada item traz tipo, motivo, fonte, confiança, estado e os trechos; o "depois" só muda aquele item', () => {
    const outro = item({ id: 'C-0002', ref: { livro: 1, capitulo: 1, versiculo: 3 }, antes: 'sim sim', depois: 'sim' });
    const dados = montarDados(arquivo([item(), outro]), livrosFicticios());
    expect(dados.itens[0]).toMatchObject({
      id: 'C-0001',
      tipo: 'digitacao',
      motivo: 'palavra inexistente',
      fonte: 'consistência interna',
      confianca: 'alta',
      estado: 'proposta',
      antes: 'Coreiro',
      depois: 'Cordeiro',
      versiculoDepois: 'A terra era sem forma e vazia, e o Cordeiro abriu o livro.',
    });
    expect(dados.itens[1]?.versiculoDepois).toBe('E ele disse sim e saiu.');
  });

  it('FUN-109: a regra traz o versículo inteiro antes e depois de cada exemplo, calculado só com aquela regra', () => {
    const dados = montarDados(
      arquivo(
        [],
        [
          regra('R-01', {
            exemplos: [
              { ref: { livro: 1, capitulo: 2, versiculo: 1 }, antes: '', depois: '' },
              { ref: { livro: 2, capitulo: 1, versiculo: 1 }, antes: '', depois: '' },
            ],
          }),
        ],
      ),
      livrosFicticios(),
    );
    const r = dados.regras[0];
    expect(r?.id).toBe('R-01');
    expect(r?.exemplos.map((e) => [e.nomeRef, e.antes, e.depois])).toEqual([
      ['Gênesis 2:1', 'Rute disse ,vem.', 'Rute disse,vem.'],
      ['Êxodo 1:1', 'Assim falou o SENHOR : vem.', 'Assim falou o SENHOR: vem.'],
    ]);
  });

  it('FUN-109: o estado e a contagem da regra passam ao dado; o arquivo de entrada não é modificado', () => {
    const a = arquivo([item()], [regra('R-02', { estado: 'aprovada', versiculos: 7 })]);
    const antes = JSON.stringify(a);
    const dados = montarDados(a, livrosFicticios());
    expect(dados.regras[0]).toMatchObject({ id: 'R-02', estado: 'aprovada', versiculos: 7 });
    expect(JSON.stringify(a)).toBe(antes);
  });

  it('FUN-109: o dado montado é texto puro (JSON), sem funções nem referências', () => {
    const dados = montarDados(arquivo([item()], [regra()]), livrosFicticios());
    expect(JSON.parse(JSON.stringify(dados))).toEqual(dados);
  });
});
