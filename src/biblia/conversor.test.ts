import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { converterLivro } from './conversor';

const lerFonte = (arquivo: string) => readFileSync(join(process.cwd(), '.biblia', arquivo), 'utf8');

describe('converterLivro (FUN-03)', () => {
  it('FUN-03: converte Filemom 1 com os 25 versículos, colchetes preservados e sem o espaço do fim', () => {
    const livro = converterLivro(lerFonte('57-filemom.md'), 57);
    expect(livro.numero).toBe(57);
    expect(livro.nome).toBe('Filemom');
    expect(livro.capitulos).toHaveLength(1);
    expect(livro.capitulos[0]).toHaveLength(25);
    expect(livro.capitulos[0]?.[1]).toBe(
      'E à amada Ápia, e a Arquipo nosso companheiro de batalha, e à igreja [que está] em tua casa;',
    );
    expect(livro.capitulos[0]?.[2]).toBe('[Haja] em vós graça e paz de Deus nosso Pai, e do Senhor Jesus Cristo.');
    for (const versiculo of livro.capitulos[0] ?? []) expect(versiculo).toBe(versiculo.trimEnd());
  });

  it('FUN-03: converte Salmos com 150 capítulos, Salmos 119 com 176 versículos e Salmos 27:13 igual à fonte', () => {
    const livro = converterLivro(lerFonte('19-salmos.md'), 19);
    expect(livro.nome).toBe('Salmos');
    expect(livro.capitulos).toHaveLength(150);
    expect(livro.capitulos[118]).toHaveLength(176);
    expect(livro.capitulos[26]?.[12]).toBe(
      'Se eu não tivesse crido que veria a bondade do SENHOR na terra dos viventes, [certamente já teria perecido] .',
    );
  });

  it('FUN-03: aceita nome com número e acento ("1 Samuel", "Gênesis")', () => {
    expect(converterLivro(lerFonte('09-1-samuel.md'), 9).nome).toBe('1 Samuel');
    expect(converterLivro(lerFonte('01-genesis.md'), 1).capitulos[0]?.[0]).toBe(
      'No princípio criou Deus os céus e a terra.',
    );
  });

  it('FUN-03: aceita fim de linha CRLF e LF e ignora o rodapé depois de ---', () => {
    const md = '# Judas\r\n\r\n## Judas 1\r\n\r\n**1** Um.  \r\n**2** Dois.  \n\n---\n\nFonte: crédito qualquer\n';
    expect(converterLivro(md, 65)).toEqual({ numero: 65, nome: 'Judas', capitulos: [['Um.', 'Dois.']] });
  });
});

describe('converterLivro: fonte fora do formato (FUN-03)', () => {
  it('FUN-03: capítulo pulado lança erro com o livro e o capítulo', () => {
    const md = '# Rute\n\n## Rute 1\n\n**1** Um.\n\n## Rute 3\n\n**1** Três.\n';
    expect(() => converterLivro(md, 8)).toThrow(/Rute 1.*capítulo 3 fora da sequência/);
  });

  it('FUN-03: versículo pulado lança erro com o livro e o capítulo', () => {
    const md = '# Rute\n\n## Rute 1\n\n**1** Um.\n\n## Rute 2\n\n**1** Um.\n**3** Três.\n';
    expect(() => converterLivro(md, 8)).toThrow(/Rute 2.*versículo 3 fora da sequência/);
  });

  it('FUN-03: linha fora do formato lança erro com o livro e o capítulo', () => {
    const md = '# Rute\n\n## Rute 1\n\n**1** Um.\ncontinuação solta do versículo\n';
    expect(() => converterLivro(md, 8)).toThrow(/Rute 1.*linha fora do formato/);
  });

  it('FUN-03: capítulo que não começa no versículo 1 lança erro', () => {
    const md = '# Rute\n\n## Rute 1\n\n**2** Dois.\n';
    expect(() => converterLivro(md, 8)).toThrow(/Rute 1.*versículo 2 fora da sequência/);
  });

  it('FUN-03: capítulo de outro livro lança erro', () => {
    const md = '# Rute\n\n## Ester 1\n\n**1** Um.\n';
    expect(() => converterLivro(md, 8)).toThrow(/capítulo de outro livro/);
  });

  it('FUN-03: livro sem capítulos lança erro', () => {
    expect(() => converterLivro('# Rute\n', 8)).toThrow(/sem capítulos/);
  });
});
