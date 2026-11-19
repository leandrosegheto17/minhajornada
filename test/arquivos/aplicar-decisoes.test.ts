import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { aplicarDecisoes } from '../../scripts/aplicar-decisoes.ts';
import { serializar } from '../../scripts/consolidar-correcoes.ts';
import { arquivo, item, regra } from '../../src/biblia/correcoes/apoio-teste';

let pasta: string;
let correcoes: string;
let decisoes: string;

const ORIGINAL = serializar(
  arquivo(
    [
      item({ id: 'C-0001' }),
      item({ id: 'C-0002', ref: { livro: 1, capitulo: 1, versiculo: 3 } }),
      item({ id: 'C-0003', ref: { livro: 1, capitulo: 1, versiculo: 4 } }),
    ],
    [regra('R-01')],
  ),
);

beforeEach(() => {
  pasta = mkdtempSync(join(tmpdir(), 'mj-decisoes-'));
  correcoes = join(pasta, 'correcoes.json');
  decisoes = join(pasta, 'decisoes.json');
  writeFileSync(correcoes, ORIGINAL);
});
afterEach(() => rmSync(pasta, { recursive: true, force: true }));

const escrever = (valor: unknown) => writeFileSync(decisoes, JSON.stringify(valor));

describe('aplicar-decisoes (FUN-113)', () => {
  it('FUN-113: regrava o arquivo no mesmo formato (um item por linha), mudando só os itens decididos', () => {
    escrever([
      { id: 'C-0001', estado: 'aprovada', depois: 'Cordeiro!' },
      { id: 'R-01', estado: 'recusada' },
    ]);
    aplicarDecisoes(correcoes, decisoes);
    const antes = ORIGINAL.split('\n');
    const depois = readFileSync(correcoes, 'utf8').split('\n');
    expect(depois).toHaveLength(antes.length);
    const diferentes = depois.map((linha, i) => (linha === antes[i] ? null : i)).filter((i) => i !== null);
    expect(diferentes).toHaveLength(2);
    expect(depois.join('\n')).toContain('"estado":"aprovada","confere":true');
    expect(depois.join('\n')).toContain('"depois":"Cordeiro!"');
    // Os não decididos ficam iguais, byte a byte.
    for (const trecho of ['"id":"C-0002"', '"id":"C-0003"']) {
      expect(depois.find((l) => l.includes(trecho))).toBe(antes.find((l) => l.includes(trecho)));
    }
  });

  it('FUN-113: aplicar duas vezes as mesmas decisões dá o mesmo arquivo', () => {
    escrever([{ id: 'C-0002', estado: 'aprovada' }]);
    aplicarDecisoes(correcoes, decisoes);
    const uma = readFileSync(correcoes, 'utf8');
    aplicarDecisoes(correcoes, decisoes);
    expect(readFileSync(correcoes, 'utf8')).toBe(uma);
  });

  it('FUN-113: id desconhecido recusa e não grava nada', () => {
    escrever([
      { id: 'C-0001', estado: 'aprovada' },
      { id: 'C-9999', estado: 'aprovada' },
    ]);
    expect(() => aplicarDecisoes(correcoes, decisoes)).toThrow('C-9999');
    expect(readFileSync(correcoes, 'utf8')).toBe(ORIGINAL);
  });

  it('FUN-113: estado inválido recusa e não grava nada', () => {
    escrever([{ id: 'C-0001', estado: 'talvez' }]);
    expect(() => aplicarDecisoes(correcoes, decisoes)).toThrow('talvez');
    expect(readFileSync(correcoes, 'utf8')).toBe(ORIGINAL);
  });

  it('FUN-113: "depois" com colchete sem par recusa e não grava nada', () => {
    escrever([{ id: 'C-0001', estado: 'aprovada', depois: 'a [b' }]);
    expect(() => aplicarDecisoes(correcoes, decisoes)).toThrow('colchete');
    expect(readFileSync(correcoes, 'utf8')).toBe(ORIGINAL);
  });

  it('FUN-113: arquivo de decisões que não é uma lista de { id, estado } recusa e não grava nada', () => {
    for (const ruim of [{ id: 'C-0001' }, [{ estado: 'aprovada' }], [{ id: 1, estado: 'aprovada' }], [null], 'x']) {
      escrever(ruim);
      expect(() => aplicarDecisoes(correcoes, decisoes)).toThrow('decisões');
      expect(readFileSync(correcoes, 'utf8')).toBe(ORIGINAL);
    }
  });

  it('FUN-113: aceita a lista também dentro de { decisoes: [...] }, como o banco a entrega', () => {
    escrever({ decisoes: [{ id: 'C-0003', estado: 'recusada' }] });
    aplicarDecisoes(correcoes, decisoes);
    expect(readFileSync(correcoes, 'utf8')).toContain('"estado":"recusada"');
  });
});
