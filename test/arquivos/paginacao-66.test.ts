import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Livro } from '../../src/biblia/tipos';
import { blocosDoLivro, paginar } from '../../src/livro/paginacao';

/** Os 66 livros reais gerados em `public/livros/` (`pnpm converter-biblia`, rodado antes dos testes). */
const PASTA = join(process.cwd(), 'public', 'livros');
const arquivos = readdirSync(PASTA).filter((nome) => /^\d{2}\.[0-9a-f]+\.json$/.test(nome));

/** Alturas determinísticas: o nome do livro 40, o versículo 20 mais 8 por 60 caracteres de texto (de 1 a muitas linhas). */
function alturasDe(livro: Livro, blocos: ReturnType<typeof blocosDoLivro>): number[] {
  return blocos.map((bloco) =>
    bloco.tipo === 'nomeLivro'
      ? 40
      : 20 + 8 * Math.ceil((livro.capitulos[bloco.ref.capitulo - 1]![bloco.versiculo - 1]!.length || 1) / 60),
  );
}

describe('paginação dos 66 livros (FUN-75, FUN-76)', () => {
  it('há os 66 livros', () => {
    expect(arquivos).toHaveLength(66);
  });

  // Páginas de 300 (comum) e de 60 (força versículos divididos em fatias).
  it.each([300, 60])(
    'FUN-75: com página de %i px, todo bloco aparece, em ordem, e só se repete como fatias seguidas do mesmo bloco',
    (alturaPagina) => {
      for (const arquivo of arquivos) {
        const livro = JSON.parse(readFileSync(join(PASTA, arquivo), 'utf8')) as Livro;
        const blocos = blocosDoLivro(livro);
        const paginas = paginar(alturasDe(livro, blocos), alturaPagina, 20);
        const partes = paginas.flatMap((pagina) => pagina.partes);

        // Cada bloco: sua primeira parte tem recorte 0 e as seguintes crescem (fatias); nenhum some.
        const porBloco = new Map<number, number[]>();
        for (const parte of partes) porBloco.set(parte.bloco, [...(porBloco.get(parte.bloco) ?? []), parte.recorte]);
        expect(porBloco.size, `${livro.nome}: blocos presentes`).toBe(blocos.length);
        for (const [bloco, recortes] of porBloco) {
          expect(recortes[0], `${livro.nome}: bloco ${bloco} começa em 0`).toBe(0);
          expect(recortes, `${livro.nome}: bloco ${bloco} sem fatia repetida`).toEqual(
            [...recortes].sort((a, b) => a - b),
          );
          expect(new Set(recortes).size, `${livro.nome}: bloco ${bloco} sem fatia repetida`).toBe(recortes.length);
        }
        // Ordem: o índice do bloco nunca diminui ao percorrer as partes.
        const ordem = partes.map((parte) => parte.bloco);
        expect(ordem, `${livro.nome}: ordem dos blocos`).toEqual([...ordem].sort((a, b) => a - b));
        // Nenhuma página vazia (além do caso de livro sem blocos, que não existe aqui).
        expect(
          paginas.every((pagina) => pagina.partes.length > 0),
          `${livro.nome}: páginas vazias`,
        ).toBe(true);
      }
    },
    60_000,
  );
});
