import { describe, expect, it } from 'vitest';
import { arquivo, CARACTERES_PERMITIDOS, CARACTERES_PROIBIDOS, item, livrosFicticios } from './apoio-teste';
import { validarCorrecoes } from './validar';

const livros = livrosFicticios();
const validar =
  (...itens: ReturnType<typeof item>[]) =>
  () =>
    validarCorrecoes(arquivo(itens), livros);

// Gênesis 1:2 = 'A terra era sem forma e vazia, e o Coreiro abriu o livro.'

describe('validarCorrecoes: caractere proibido no "depois" (FUN-113, AD-018)', () => {
  it.each(CARACTERES_PROIBIDOS)('FUN-113: "depois" com %s recusa, cita o id, em qualquer estado', (_nome, codigo) => {
    for (const estado of ['proposta', 'aprovada', 'recusada'] as const) {
      const depois = `Cordeiro${String.fromCodePoint(codigo)}x`;
      expect(validar(item({ id: 'C-0001', estado, depois }))).toThrow(/C-0001.*caractere de controle/);
    }
  });

  it.each(CARACTERES_PERMITIDOS)('FUN-113: "depois" com %s passa', (_nome, codigo) => {
    const depois = `Cordeiro${String.fromCodePoint(codigo)}x`;
    expect(validar(item({ id: 'C-0001', estado: 'proposta', depois }))).not.toThrow();
  });
});

describe('validarCorrecoes: arquivo válido', () => {
  it('FUN-115: aprovada que confere, proposta e recusada passam', () => {
    expect(
      validar(
        item({ id: 'C-0001', estado: 'aprovada' }),
        item({
          id: 'C-0002',
          estado: 'proposta',
          ref: { livro: 1, capitulo: 1, versiculo: 1 },
          antes: 'Deus',
          depois: 'Deus',
        }),
        item({
          id: 'C-0003',
          estado: 'recusada',
          ref: { livro: 2, capitulo: 1, versiculo: 2 },
          antes: 'saiu',
          depois: 'saiu',
        }),
      ),
    ).not.toThrow();
  });

  it('FUN-115: arquivo sem itens passa', () => {
    expect(validar()).not.toThrow();
  });
});

describe('validarCorrecoes: identificador e referência (FUN-126)', () => {
  it('FUN-126: id repetido lança com o id', () => {
    expect(validar(item({ id: 'C-0001' }), item({ id: 'C-0002' }), item({ id: 'C-0002' }))).toThrow(
      'correção C-0002: identificador repetido',
    );
  });

  it('FUN-126: livro inexistente lança com o id e a referência', () => {
    const ref = { livro: 99, capitulo: 1, versiculo: 1 };
    expect(validar(item({ ref }))).toThrow('correção C-0001: referência livro 99 1:1 não existe');
  });

  it('FUN-126: capítulo inexistente lança com o id e a referência', () => {
    const ref = { livro: 1, capitulo: 9, versiculo: 1 };
    expect(validar(item({ ref }))).toThrow('correção C-0001: referência Gênesis 9:1 não existe');
  });

  it('FUN-126: versículo inexistente lança com o id e a referência', () => {
    const ref = { livro: 1, capitulo: 1, versiculo: 9 };
    expect(validar(item({ ref }))).toThrow('correção C-0001: referência Gênesis 1:9 não existe');
  });

  it('FUN-126: a referência inexistente vale também para item recusado', () => {
    const ref = { livro: 1, capitulo: 1, versiculo: 9 };
    expect(validar(item({ ref, estado: 'recusada' }))).toThrow('referência Gênesis 1:9 não existe');
  });
});

describe('validarCorrecoes: o "antes" aparece exatamente uma vez (FUN-115)', () => {
  it('FUN-115: aprovada com "antes" ausente lança "não confere"', () => {
    expect(validar(item({ estado: 'aprovada', antes: 'Cordeiro' }))).toThrow(
      'correção C-0001 não confere com Gênesis 1:2',
    );
  });

  it('FUN-115: aprovada com "antes" duas vezes no versículo lança "não confere"', () => {
    const ref = { livro: 1, capitulo: 1, versiculo: 3 };
    expect(validar(item({ estado: 'aprovada', ref, antes: 'sim', depois: 'não' }))).toThrow(
      'correção C-0001 não confere com Gênesis 1:3',
    );
  });

  it('FUN-115: a diferença de maiúscula também é não conferir', () => {
    expect(validar(item({ estado: 'aprovada', antes: 'coreiro' }))).toThrow('não confere com Gênesis 1:2');
  });

  it('FUN-115: proposta que não confere não derruba o arquivo', () => {
    expect(validar(item({ estado: 'proposta', antes: 'inexistente', confere: false }))).not.toThrow();
  });

  it('FUN-115: recusada que não confere não derruba o arquivo', () => {
    expect(validar(item({ estado: 'recusada', antes: 'inexistente', confere: false }))).not.toThrow();
  });
});

describe('validarCorrecoes: sobreposição entre aprovadas (FUN-107)', () => {
  it('FUN-107: trechos que se cruzam lançam citando os dois ids', () => {
    expect(
      validar(
        item({ id: 'C-0001', estado: 'aprovada', antes: 'e o Coreiro', depois: 'e o Cordeiro' }),
        item({ id: 'C-0002', estado: 'aprovada', antes: 'Coreiro abriu', depois: 'Cordeiro abriu' }),
      ),
    ).toThrow('correções C-0001 e C-0002 se sobrepõem em Gênesis 1:2');
  });

  it('FUN-107: um trecho dentro do outro lança', () => {
    expect(
      validar(
        item({ id: 'C-0001', estado: 'aprovada', antes: 'o Coreiro abriu', depois: 'o Cordeiro abriu' }),
        item({ id: 'C-0002', estado: 'aprovada', antes: 'Coreiro', depois: 'Cordeiro' }),
      ),
    ).toThrow('correções C-0001 e C-0002 se sobrepõem em Gênesis 1:2');
  });

  it('FUN-107: trechos que só se encostam passam', () => {
    expect(
      validar(
        item({ id: 'C-0001', estado: 'aprovada', antes: 'e o ', depois: 'e o ' }),
        item({ id: 'C-0002', estado: 'aprovada', antes: 'Coreiro', depois: 'Cordeiro' }),
      ),
    ).not.toThrow();
  });

  it('FUN-107: trechos separados no mesmo versículo passam (aplica os dois)', () => {
    expect(
      validar(
        item({ id: 'C-0001', estado: 'aprovada', antes: 'forma', depois: 'fôrma' }),
        item({ id: 'C-0002', estado: 'aprovada', antes: 'livro', depois: 'Livro' }),
      ),
    ).not.toThrow();
  });

  it('FUN-107: a sobreposição só conta entre aprovadas (proposta e recusada cruzando passam)', () => {
    expect(
      validar(
        item({ id: 'C-0001', estado: 'aprovada', antes: 'e o Coreiro', depois: 'e o Cordeiro' }),
        item({ id: 'C-0002', estado: 'proposta', antes: 'Coreiro abriu', depois: 'Cordeiro abriu' }),
        item({ id: 'C-0003', estado: 'recusada', antes: 'o Coreiro', depois: 'o Cordeiro' }),
      ),
    ).not.toThrow();
  });

  it('FUN-107: aprovadas em versículos diferentes não se sobrepõem', () => {
    expect(
      validar(
        item({ id: 'C-0001', estado: 'aprovada' }),
        item({
          id: 'C-0002',
          estado: 'aprovada',
          ref: { livro: 1, capitulo: 1, versiculo: 1 },
          antes: 'Deus',
          depois: 'Deus',
        }),
      ),
    ).not.toThrow();
  });
});

describe('validarCorrecoes: colchetes de itálico em pares (FUN-125)', () => {
  const colchete = 'correção C-0001: colchete de itálico sem par';
  const v1 = { livro: 1, capitulo: 1, versiculo: 1 };
  // Gênesis 1:1 = 'No princípio [Deus] criou os céus e a terra.'

  it('FUN-125: "depois" com "[" sem "]" lança', () => {
    expect(validar(item({ ref: v1, antes: 'No princípio', depois: 'No princípio [' }))).toThrow(colchete);
  });

  it('FUN-125: "depois" com "]" sem "[" lança', () => {
    expect(validar(item({ ref: v1, antes: 'No princípio', depois: 'No princípio ]' }))).toThrow(colchete);
  });

  it('FUN-125: colchete aninhado lança', () => {
    expect(validar(item({ ref: v1, antes: 'No princípio', depois: 'No princípio [[x]' }))).toThrow(colchete);
  });

  it('FUN-125: "]" antes de "[" lança', () => {
    expect(validar(item({ ref: v1, antes: 'No princípio', depois: 'No princípio ][x]' }))).toThrow(colchete);
  });

  it('FUN-125: vale para todo estado, também a recusada', () => {
    expect(validar(item({ ref: v1, estado: 'recusada', antes: 'No princípio', depois: '[' }))).toThrow(colchete);
  });

  it('FUN-125: item que não confere confere o "depois" sozinho', () => {
    expect(validar(item({ antes: 'inexistente', depois: '[x', confere: false }))).toThrow(colchete);
    expect(validar(item({ antes: 'inexistente', depois: '[x]', confere: false }))).not.toThrow();
  });

  it('FUN-125: "depois" balanceado passa e o itálico pode ficar dentro do trecho', () => {
    expect(validar(item({ ref: v1, antes: '[Deus] criou', depois: '[Deus] criaria' }))).not.toThrow();
  });

  it('FUN-125: trecho que cruza o colchete passa quando o versículo corrigido fica em pares', () => {
    // O "depois" sozinho tem um "]" solto, mas o versículo inteiro continua em pares.
    expect(validar(item({ ref: v1, antes: 'Deus] criou', depois: 'Deus] criaria' }))).not.toThrow();
  });

  it('FUN-125: versículo da fonte já sem par não é culpa da correção que não mexe em colchete', () => {
    const v4 = { livro: 1, capitulo: 1, versiculo: 4 };
    expect(validar(item({ ref: v4, antes: 'texto', depois: 'Texto' }))).not.toThrow();
  });

  it('FUN-125: versículo da fonte que já estava sem par não é recusado por uma correção que mexe em colchete', () => {
    const v4 = { livro: 1, capitulo: 1, versiculo: 4 };
    expect(validar(item({ ref: v4, antes: 'texto', depois: 'texto [' }))).not.toThrow();
  });
});
