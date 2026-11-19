import { describe, expect, it } from 'vitest';
import type { IdRegra } from './arquivo';
import { livrosReais } from './apoio-teste';
import { REGRAS } from './regras';

const aplicar = (id: IdRegra, texto: string): string => {
  const regra = REGRAS.find((r) => r.id === id);
  if (!regra) throw new Error(`regra ${id} não existe`);
  return regra.aplicar(texto);
};

describe('REGRAS: as três regras existem (FUN-106)', () => {
  it('FUN-106: R-01, R-02 e R-03, nessa ordem, cada uma com descrição', () => {
    expect(REGRAS.map((r) => r.id)).toEqual(['R-01', 'R-02', 'R-03']);
    for (const r of REGRAS) expect(r.descricao.length).toBeGreaterThan(10);
  });
});

describe('R-01: tira o espaço antes da pontuação (FUN-106, FUN-117)', () => {
  it.each([
    ['ele disse : vem', 'ele disse: vem'],
    ['[dizendo] : vem', '[dizendo]: vem'],
    ['a , b ; c . d ? e !', 'a, b; c. d? e!'],
    ['a   ,b', 'a,b'],
    ['no fim .', 'no fim.'],
    ['espera ...', 'espera...'],
    ['para Deus nos compraste , de toda tribo', 'para Deus nos compraste, de toda tribo'],
  ])('FUN-106: %j vira %j', (antes, depois) => {
    expect(aplicar('R-01', antes)).toBe(depois);
  });

  it.each(['João 3:16', 'a, b; c. d', 'nada a mudar', 'Js 13:6 ', '[seu] irmão'])('FUN-117: %j não muda', (texto) => {
    expect(aplicar('R-01', texto)).toBe(texto);
  });

  it('FUN-106: pontuação dupla só perde o espaço antes (o resto é item, não regra)', () => {
    expect(aplicar('R-01', 'terra :;')).toBe('terra:;');
  });
});

describe('R-02: põe espaço depois de vírgula, ponto e vírgula e dois-pontos (FUN-106, FUN-117)', () => {
  it.each([
    ['o fim”,diz o Senhor', 'o fim”, diz o Senhor'],
    ['Salvador,[seja] a glória', 'Salvador, [seja] a glória'],
    ['a;b', 'a; b'],
    ['a:b', 'a: b'],
    ['[dizendo]:vem', '[dizendo]: vem'],
    ['disse:“Vem”', 'disse: “Vem”'],
    ['a,é', 'a, é'],
    ['a,Ótimo', 'a, Ótimo'],
    // A primeira vírgula vem antes de outra pontuação e fica; a segunda vem antes de letra.
    ['a,,b', 'a,, b'],
  ])('FUN-106: %j vira %j', (antes, depois) => {
    expect(aplicar('R-02', antes)).toBe(depois);
  });

  it.each(['João 3:16', 'Pv 1,2', 'a, b', 'fim,', 'fim:', 'a,]', 'diz,”', 'a,,', 'a, [b]', 'sem pontuação'])(
    'FUN-117: %j não muda',
    (texto) => {
      expect(aplicar('R-02', texto)).toBe(texto);
    },
  );
});

describe('R-03: põe espaço depois do ponto final (FUN-106, FUN-117)', () => {
  it.each([
    ['para sempre.E esta é a palavra', 'para sempre. E esta é a palavra'],
    ['fim.Éramos', 'fim. Éramos'],
    ['Então...Disse', 'Então... Disse'],
  ])('FUN-106: %j vira %j', (antes, depois) => {
    expect(aplicar('R-03', antes)).toBe(depois);
  });

  it.each(['ponto.e minúscula', 'valor 1.5', 'Cap.2', 'fim.', 'fim. Já', 'a.[seja]'])(
    'FUN-117: %j não muda',
    (texto) => {
      expect(aplicar('R-03', texto)).toBe(texto);
    },
  );
});

describe('as regras sobre os 31.102 versículos reais (FUN-106, FUN-117)', () => {
  const versiculos = livrosReais().flatMap((livro) => livro.capitulos.flat());
  const assinatura = (texto: string) => texto.match(/[\p{L}\p{N}[\]]/gu)?.join('') ?? '';
  const todas = (texto: string) => REGRAS.reduce((atual, regra) => regra.aplicar(atual), texto);

  it('FUN-117: a fonte tem os 31.102 versículos', () => {
    expect(versiculos).toHaveLength(31102);
  });

  it.each(['R-01', 'R-02', 'R-03'] as IdRegra[])(
    'FUN-117: %s não muda letra, número nem a ordem e a quantidade de colchetes',
    (id) => {
      for (const texto of versiculos) expect(assinatura(aplicar(id, texto))).toBe(assinatura(texto));
    },
  );

  it('FUN-117: as três juntas também não mudam letra, número nem colchete', () => {
    for (const texto of versiculos) expect(assinatura(todas(texto))).toBe(assinatura(texto));
  });

  it.each(['R-01', 'R-02', 'R-03'] as IdRegra[])('FUN-127: %s aplicada duas vezes dá o mesmo texto', (id) => {
    for (const texto of versiculos) {
      const uma = aplicar(id, texto);
      expect(aplicar(id, uma)).toBe(uma);
    }
  });

  it('FUN-127: as três juntas aplicadas duas vezes dão o mesmo texto', () => {
    for (const texto of versiculos) {
      const uma = todas(texto);
      expect(todas(uma)).toBe(uma);
    }
  });

  // Os números do levantamento (`mecanico.md`: 808, 394 e 70) são do texto sem colchetes; aqui são pisos, não igualdade.
  it.each([
    ['R-01', 700],
    ['R-02', 350],
    ['R-03', 60],
  ] as [IdRegra, number][])('FUN-106: %s muda pelo menos %i versículos da fonte', (id, piso) => {
    const mudados = versiculos.filter((texto) => aplicar(id, texto) !== texto).length;
    expect(mudados).toBeGreaterThanOrEqual(piso);
  });

  it('FUN-106: depois de R-01, nenhum versículo tem espaço antes de , . ; : ? !', () => {
    const sobra = versiculos.filter((texto) => /\s[,.;:?!]/.test(aplicar('R-01', texto)));
    expect(sobra).toEqual([]);
  });
});
