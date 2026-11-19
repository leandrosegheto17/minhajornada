import { describe, expect, it } from 'vitest';
import {
  arquivo,
  CARACTERES_PERMITIDOS,
  CARACTERES_PROIBIDOS,
  item,
  livrosFicticios,
  regra,
} from '../biblia/correcoes/apoio-teste';
import { mesclarDecisoes } from './mesclar';
import type { Decisao } from './logica';

const base = () =>
  arquivo(
    [
      item({ id: 'C-0001' }),
      item({ id: 'C-0002', ref: { livro: 1, capitulo: 1, versiculo: 3 }, tipo: 'sentido', fonte: 'hebraico' }),
      item({ id: 'C-0003', ref: { livro: 1, capitulo: 1, versiculo: 4 }, antes: '[a]', depois: '[b]' }),
    ],
    [regra('R-01'), regra('R-02')],
  );

describe('mesclarDecisoes (FUN-113)', () => {
  it('FUN-113: muda só o estado e, quando veio, o "depois" dos itens e regras decididos', () => {
    const a = base();
    const novo = mesclarDecisoes(a, [
      { id: 'C-0001', estado: 'aprovada', depois: 'Cordeiro!' },
      { id: 'C-0002', estado: 'recusada' },
      { id: 'R-02', estado: 'aprovada' },
    ]);
    expect(novo.itens[0]).toEqual({ ...a.itens[0], estado: 'aprovada', depois: 'Cordeiro!' });
    expect(novo.itens[1]).toEqual({ ...a.itens[1], estado: 'recusada' });
    expect(novo.regras[1]).toEqual({ ...a.regras[1], estado: 'aprovada' });
  });

  it('FUN-113: o que não foi decidido fica igual, byte a byte, e a entrada não é modificada', () => {
    const a = base();
    const antes = JSON.stringify(a);
    const novo = mesclarDecisoes(a, [{ id: 'C-0001', estado: 'aprovada' }]);
    expect(JSON.stringify(novo.itens[1])).toBe(JSON.stringify(a.itens[1]));
    expect(JSON.stringify(novo.itens[2])).toBe(JSON.stringify(a.itens[2]));
    expect(JSON.stringify(novo.regras)).toBe(JSON.stringify(a.regras));
    expect(JSON.stringify(a)).toBe(antes);
  });

  it('FUN-113: mesclar duas vezes as mesmas decisões dá o mesmo arquivo', () => {
    const decisoes: Decisao[] = [
      { id: 'C-0001', estado: 'aprovada', depois: 'x' },
      { id: 'R-01', estado: 'recusada' },
    ];
    const uma = mesclarDecisoes(base(), decisoes);
    const duas = mesclarDecisoes(uma, decisoes);
    expect(JSON.stringify(duas)).toBe(JSON.stringify(uma));
  });

  it('FUN-113: decisão "proposta" desfaz uma decisão anterior; a última decisão do mesmo id vale', () => {
    const decidido = mesclarDecisoes(base(), [{ id: 'C-0001', estado: 'aprovada' }]);
    const voltou = mesclarDecisoes(decidido, [{ id: 'C-0001', estado: 'proposta' }]);
    expect(voltou.itens[0]?.estado).toBe('proposta');
    const ultima = mesclarDecisoes(base(), [
      { id: 'C-0001', estado: 'aprovada' },
      { id: 'C-0001', estado: 'recusada' },
    ]);
    expect(ultima.itens[0]?.estado).toBe('recusada');
  });

  it('FUN-113: id desconhecido recusa com o id', () => {
    expect(() => mesclarDecisoes(base(), [{ id: 'C-9999', estado: 'aprovada' }])).toThrow('C-9999');
  });

  it('FUN-113: estado inválido recusa com o id e o estado', () => {
    const ruim = { id: 'C-0001', estado: 'talvez' } as unknown as Decisao;
    expect(() => mesclarDecisoes(base(), [ruim])).toThrow('C-0001');
    expect(() => mesclarDecisoes(base(), [ruim])).toThrow('talvez');
  });

  it('FUN-113: "depois" com colchete sem par recusa', () => {
    expect(() => mesclarDecisoes(base(), [{ id: 'C-0001', estado: 'aprovada', depois: 'a [b' }])).toThrow('colchete');
    expect(() => mesclarDecisoes(base(), [{ id: 'C-0001', estado: 'aprovada', depois: 'a ] b' }])).toThrow('colchete');
  });

  it('FUN-113: "depois" numa regra recusa, pois a regra não tem texto', () => {
    expect(() => mesclarDecisoes(base(), [{ id: 'R-01', estado: 'aprovada', depois: 'x' }])).toThrow('R-01');
  });

  it('FUN-113: um erro entre várias decisões não deixa nada mesclado (devolve exceção, entrada intacta)', () => {
    const a = base();
    const antes = JSON.stringify(a);
    expect(() =>
      mesclarDecisoes(a, [
        { id: 'C-0001', estado: 'aprovada' },
        { id: 'C-9999', estado: 'aprovada' },
      ]),
    ).toThrow();
    expect(JSON.stringify(a)).toBe(antes);
  });

  it('FUN-111 e FUN-105: aprovar o que não pode (sem fonte, não confere) recusa; recusar é sempre possível', () => {
    const a = arquivo([item({ id: 'C-0001', tipo: 'sentido', fonte: '' }), item({ id: 'C-0002', confere: false })]);
    expect(() => mesclarDecisoes(a, [{ id: 'C-0001', estado: 'aprovada' }])).toThrow('Falta a fonte');
    expect(() => mesclarDecisoes(a, [{ id: 'C-0002', estado: 'aprovada' }])).toThrow('Não confere');
    const ok = mesclarDecisoes(a, [
      { id: 'C-0001', estado: 'recusada' },
      { id: 'C-0002', estado: 'recusada' },
    ]);
    expect(ok.itens.map((i) => i.estado)).toEqual(['recusada', 'recusada']);
  });

  it.each(CARACTERES_PROIBIDOS)(
    'FUN-113: "depois" com %s recusa, cita o id e não muda a entrada (AD-018)',
    (_nome, codigo) => {
      const depois = `texto${String.fromCodePoint(codigo)}trocado`;
      const a = base();
      const antes = JSON.stringify(a);
      expect(() => mesclarDecisoes(a, [{ id: 'C-0001', estado: 'aprovada', depois }])).toThrow(/C-0001.*controle/);
      expect(() => mesclarDecisoes(a, [{ id: 'C-0001', estado: 'recusada', depois }])).toThrow(/C-0001.*controle/);
      expect(JSON.stringify(a)).toBe(antes);
    },
  );

  it.each(CARACTERES_PERMITIDOS)('FUN-113: "depois" com %s passa na mescla (AD-018)', (_nome, codigo) => {
    const depois = `texto${String.fromCodePoint(codigo)}novo`;
    expect(() => mesclarDecisoes(base(), [{ id: 'C-0001', estado: 'recusada', depois }])).not.toThrow();
  });

  it('FUN-107 e FUN-113: duas aprovadas que se sobrepõem no mesmo versículo recusam, com os dois ids, e não gravam', () => {
    const a = arquivo([
      item({ id: 'C-0001', antes: 'Coreiro abriu', depois: 'Cordeiro abriu' }),
      item({ id: 'C-0002', antes: 'o Coreiro', depois: 'o Cordeiro' }),
    ]);
    const antes = JSON.stringify(a);
    expect(() =>
      mesclarDecisoes(
        a,
        [
          { id: 'C-0001', estado: 'aprovada' },
          { id: 'C-0002', estado: 'aprovada' },
        ],
        livrosFicticios(),
      ),
    ).toThrow(/C-0001.*C-0002.*sobrep/);
    expect(JSON.stringify(a)).toBe(antes);
  });

  it('FUN-107: aprovadas encostadas, ou só uma delas aprovada, passam', () => {
    const a = arquivo([
      item({ id: 'C-0001', antes: 'forma', depois: 'fôrma' }),
      item({ id: 'C-0002', antes: 'Coreiro', depois: 'Cordeiro' }),
      item({ id: 'C-0003', antes: 'o Coreiro', depois: 'o Cordeiro' }),
    ]);
    const livros = livrosFicticios();
    expect(() =>
      mesclarDecisoes(
        a,
        [
          { id: 'C-0001', estado: 'aprovada' },
          { id: 'C-0002', estado: 'aprovada' },
        ],
        livros,
      ),
    ).not.toThrow();
    expect(() => mesclarDecisoes(a, [{ id: 'C-0003', estado: 'aprovada' }], livros)).not.toThrow();
  });
});
