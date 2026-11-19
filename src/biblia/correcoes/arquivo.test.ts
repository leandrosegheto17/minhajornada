import { describe, expect, it } from 'vitest';
import { lerArquivoCorrecoes } from './arquivo';
import { arquivo, item, regra } from './apoio-teste';

describe('lerArquivoCorrecoes: arquivo e raiz (FUN-103)', () => {
  it('FUN-103: arquivo com item e regra válidos volta igual', () => {
    const entrada = arquivo([item({ italicoMuda: true })], [regra('R-01')]);
    expect(lerArquivoCorrecoes(structuredClone(entrada))).toEqual(entrada);
  });

  it('FUN-103: arquivo sem regras e sem itens é válido', () => {
    expect(lerArquivoCorrecoes(arquivo())).toEqual(arquivo());
  });

  it('FUN-103: versao diferente de 1 é recusada', () => {
    expect(() => lerArquivoCorrecoes({ ...arquivo(), versao: 2 })).toThrow(/versao/);
    expect(() => lerArquivoCorrecoes({ regras: [], itens: [] })).toThrow(/versao/);
  });

  it.each([
    ['nulo', null],
    ['texto', 'x'],
    ['lista', []],
  ])('FUN-103: raiz %s é recusada', (_nome, valor) => {
    expect(() => lerArquivoCorrecoes(valor)).toThrow(/arquivo de correções/);
  });

  it('FUN-103: regras e itens precisam ser listas', () => {
    expect(() => lerArquivoCorrecoes({ versao: 1, regras: {}, itens: [] })).toThrow(/regras/);
    expect(() => lerArquivoCorrecoes({ versao: 1, regras: [], itens: 'x' })).toThrow(/itens/);
  });
});

describe('lerArquivoCorrecoes: campos do item (FUN-103)', () => {
  const invalidos: [string, Parameters<typeof item>[0], RegExp][] = [
    ['id vazio', { id: '' }, /itens\[0\]\.id/],
    ['id número', { id: 1 as unknown as string }, /itens\[0\]\.id/],
    ['ref ausente', { ref: undefined }, /itens\[0\]\.ref/],
    ['ref.livro zero', { ref: { livro: 0, capitulo: 1, versiculo: 1 } }, /itens\[0\]\.ref\.livro/],
    ['ref.capitulo fracionário', { ref: { livro: 1, capitulo: 1.5, versiculo: 1 } }, /itens\[0\]\.ref\.capitulo/],
    [
      'ref.versiculo texto',
      { ref: { livro: 1, capitulo: 1, versiculo: '1' as unknown as number } },
      /itens\[0\]\.ref\.versiculo/,
    ],
    ['tipo arcaico', { tipo: 'arcaico' as never }, /itens\[0\]\.tipo/],
    ['tipo desconhecido', { tipo: 'x' as never }, /itens\[0\]\.tipo/],
    ['antes vazio', { antes: '' }, /itens\[0\]\.antes/],
    ['antes ausente', { antes: undefined }, /itens\[0\]\.antes/],
    ['depois ausente', { depois: undefined }, /itens\[0\]\.depois/],
    ['motivo ausente', { motivo: undefined }, /itens\[0\]\.motivo/],
    ['fonte ausente', { fonte: undefined }, /itens\[0\]\.fonte/],
    ['confianca desconhecida', { confianca: 'altissima' as never }, /itens\[0\]\.confianca/],
    ['estado "aprovado"', { estado: 'aprovado' as never }, /itens\[0\]\.estado/],
    ['confere texto', { confere: 'sim' as never }, /itens\[0\]\.confere/],
    ['italicoMuda falso', { italicoMuda: false as never }, /itens\[0\]\.italicoMuda/],
  ];

  it.each(invalidos)('FUN-103: %s é recusado com o caminho do campo', (_nome, parcial, caminho) => {
    expect(() => lerArquivoCorrecoes(arquivo([item(parcial)]))).toThrow(caminho);
  });

  it('FUN-103: a mensagem cita o índice do item inválido', () => {
    const itens = [item({ id: 'C-0001' }), item({ id: 'C-0002' }), item({ id: 'C-0003', estado: 'x' as never })];
    expect(() => lerArquivoCorrecoes(arquivo(itens))).toThrow(/itens\[2\]\.estado/);
  });

  it('FUN-103: os três estados, os três tipos e as três confianças são aceitos', () => {
    const itens = [
      item({ id: 'C-0001', estado: 'proposta', tipo: 'digitacao', confianca: 'alta' }),
      item({ id: 'C-0002', estado: 'aprovada', tipo: 'ortografia', confianca: 'media' }),
      item({ id: 'C-0003', estado: 'recusada', tipo: 'sentido', confianca: 'baixa' }),
    ];
    expect(() => lerArquivoCorrecoes(arquivo(itens))).not.toThrow();
  });

  it('FUN-103: "depois" e "fonte" vazios são aceitos (remoção de palavra repetida, sem fonte)', () => {
    expect(() => lerArquivoCorrecoes(arquivo([item({ depois: '', fonte: '' })]))).not.toThrow();
  });
});

describe('lerArquivoCorrecoes: regras (FUN-103, FUN-106)', () => {
  const invalidas: [string, Parameters<typeof regra>[1], RegExp][] = [
    ['descrição vazia', { descricao: '' }, /regras\[0\]\.descricao/],
    ['estado desconhecido', { estado: 'x' as never }, /regras\[0\]\.estado/],
    ['versículos negativos', { versiculos: -1 }, /regras\[0\]\.versiculos/],
    ['versículos fracionários', { versiculos: 1.5 }, /regras\[0\]\.versiculos/],
    ['exemplos que não é lista', { exemplos: 'x' as never }, /regras\[0\]\.exemplos/],
    [
      'exemplo sem "antes"',
      {
        exemplos: [
          { ref: { livro: 1, capitulo: 1, versiculo: 1 }, antes: 'a', depois: 'b' },
          { ref: { livro: 1, capitulo: 1, versiculo: 1 }, antes: undefined as never, depois: 'b' },
        ],
      },
      /regras\[0\]\.exemplos\[1\]\.antes/,
    ],
  ];

  it.each(invalidas)('FUN-103: regra com %s é recusada com o caminho do campo', (_nome, parcial, caminho) => {
    expect(() => lerArquivoCorrecoes(arquivo([], [regra('R-01', parcial)]))).toThrow(caminho);
  });

  it('FUN-103: id de regra fora de R-01 a R-03 é recusado', () => {
    expect(() => lerArquivoCorrecoes(arquivo([], [regra('R-04' as never)]))).toThrow(/regras\[0\]\.id/);
  });

  it('FUN-103: as três regras são aceitas', () => {
    expect(() => lerArquivoCorrecoes(arquivo([], [regra('R-01'), regra('R-02'), regra('R-03')]))).not.toThrow();
  });
});
