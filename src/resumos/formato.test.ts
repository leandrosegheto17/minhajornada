import { describe, expect, it } from 'vitest';
import { lerArquivoExportado, type ArquivoExportado } from './formato.ts';

const resumo = (livro = 1) => ({
  livro,
  contexto: 'contexto de exemplo',
  mensagem: 'mensagem de exemplo',
  divisao: [{ titulo: 'Parte um', de: 1, ate: 2 }],
  versiculos: [{ capitulo: 1, versiculo: 1, ate: 2, frase: 'frase de exemplo' }],
});

const arquivo = (sobre: Record<string, unknown> = {}): ArquivoExportado & Record<string, unknown> => ({
  formato: 'mj-resumos-v1',
  itens: [{ livro: 1, estado: 'aprovada', resumo: resumo() }],
  ...sobre,
});

const ler = (valor: unknown) => lerArquivoExportado(JSON.stringify(valor));

describe('lerArquivoExportado (forma estrita, FUN-172, FUN-173)', () => {
  it('lê um arquivo válido, com os três estados e a nota opcional', () => {
    const lido = ler(
      arquivo({
        itens: [
          { livro: 1, estado: 'aprovada', resumo: resumo(1) },
          { livro: 2, estado: 'proposta', resumo: resumo(2) },
          { livro: 3, estado: 'recusada', resumo: resumo(3), nota: 'falta o contexto' },
        ],
      }),
    );
    expect(lido.itens.map((i) => i.estado)).toEqual(['aprovada', 'proposta', 'recusada']);
    expect(lido.itens[2]?.nota).toBe('falta o contexto');
    expect(lido.itens[0]).not.toHaveProperty('nota');
  });

  it('o versículo-chave sem intervalo (sem ate) é aceito e continua sem ate', () => {
    const r = { ...resumo(), versiculos: [{ capitulo: 1, versiculo: 1, frase: 'frase de exemplo' }] };
    const lido = ler(arquivo({ itens: [{ livro: 1, estado: 'aprovada', resumo: r }] }));
    expect(lido.itens[0]?.resumo.versiculos[0]).not.toHaveProperty('ate');
  });

  it('o resumo vem como estava no arquivo, sem perder nem acrescentar campos', () => {
    expect(ler(arquivo())).toEqual(arquivo());
  });

  it.each([
    ['campo a mais no arquivo', arquivo({ extra: 1 })],
    ['formato diferente', arquivo({ formato: 'mj-resumos-v2' })],
    ['sem itens', { formato: 'mj-resumos-v1' }],
    ['itens que não é lista', arquivo({ itens: {} })],
    ['campo a mais no item', arquivo({ itens: [{ livro: 1, estado: 'aprovada', resumo: resumo(), extra: true }] })],
    ['estado desconhecido', arquivo({ itens: [{ livro: 1, estado: 'publicada', resumo: resumo() }] })],
    ['estado ausente', arquivo({ itens: [{ livro: 1, resumo: resumo() }] })],
    ['livro 0', arquivo({ itens: [{ livro: 0, estado: 'aprovada', resumo: resumo(0) }] })],
    ['livro 67', arquivo({ itens: [{ livro: 67, estado: 'aprovada', resumo: resumo(67) }] })],
    ['livro 1.5', arquivo({ itens: [{ livro: 1.5, estado: 'aprovada', resumo: resumo(1.5) }] })],
    ['livro em texto', arquivo({ itens: [{ livro: '1', estado: 'aprovada', resumo: resumo() }] })],
    [
      'livro do item diferente do livro do resumo',
      arquivo({ itens: [{ livro: 2, estado: 'aprovada', resumo: resumo(1) }] }),
    ],
    [
      'livro repetido',
      arquivo({
        itens: [
          { livro: 1, estado: 'aprovada', resumo: resumo() },
          { livro: 1, estado: 'proposta', resumo: resumo() },
        ],
      }),
    ],
    ['nota que não é texto', arquivo({ itens: [{ livro: 1, estado: 'recusada', resumo: resumo(), nota: 3 }] })],
    ['resumo ausente', arquivo({ itens: [{ livro: 1, estado: 'aprovada' }] })],
    [
      'campo a mais no resumo',
      arquivo({ itens: [{ livro: 1, estado: 'aprovada', resumo: { ...resumo(), extra: 1 } }] }),
    ],
    [
      'contexto que não é texto',
      arquivo({ itens: [{ livro: 1, estado: 'aprovada', resumo: { ...resumo(), contexto: 1 } }] }),
    ],
    [
      'divisão que não é lista',
      arquivo({ itens: [{ livro: 1, estado: 'aprovada', resumo: { ...resumo(), divisao: 'x' } }] }),
    ],
    [
      'campo a mais na divisão',
      arquivo({
        itens: [
          { livro: 1, estado: 'aprovada', resumo: { ...resumo(), divisao: [{ titulo: 'a', de: 1, ate: 2, x: 1 }] } },
        ],
      }),
    ],
    [
      'capítulo da divisão em texto',
      arquivo({
        itens: [{ livro: 1, estado: 'aprovada', resumo: { ...resumo(), divisao: [{ titulo: 'a', de: '1', ate: 2 }] } }],
      }),
    ],
    [
      'campo a mais no versículo',
      arquivo({
        itens: [
          {
            livro: 1,
            estado: 'aprovada',
            resumo: { ...resumo(), versiculos: [{ capitulo: 1, versiculo: 1, frase: 'a', x: 1 }] },
          },
        ],
      }),
    ],
    [
      'versículo com ate em texto',
      arquivo({
        itens: [
          {
            livro: 1,
            estado: 'aprovada',
            resumo: { ...resumo(), versiculos: [{ capitulo: 1, versiculo: 1, ate: '2', frase: 'a' }] },
          },
        ],
      }),
    ],
    [
      'versículo sem frase',
      arquivo({
        itens: [{ livro: 1, estado: 'aprovada', resumo: { ...resumo(), versiculos: [{ capitulo: 1, versiculo: 1 }] } }],
      }),
    ],
  ])('recusa: %s', (_nome, valor) => {
    expect(() => ler(valor)).toThrow();
  });

  it.each([['isto não é json'], [''], ['null'], ['[]'], ['42']])('recusa JSON que não é o arquivo: %j', (texto) => {
    expect(() => lerArquivoExportado(texto)).toThrow();
  });

  it('a mensagem do erro diz onde está o problema, sem repetir o texto do resumo', () => {
    const r = { ...resumo(), contexto: 42 };
    try {
      ler(arquivo({ itens: [{ livro: 1, estado: 'aprovada', resumo: r }] }));
      expect.unreachable();
    } catch (e) {
      expect((e as Error).message).toMatch(/contexto/);
    }
  });
});
