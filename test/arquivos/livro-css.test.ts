import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Invariante do modo livro na tela larga (FUN-96, FUN-97, FUN-100, FUN-133, FUN-135): a página e o contêiner de medida leem as mesmas
// variáveis de largura e altura; se divergirem, o texto quebra em menos linhas que na página mostrada e versículos somem.

const css = readFileSync(new URL('../../src/livro/livro.module.css', import.meta.url), 'utf8').replace(
  /\/\*[\s\S]*?\*\//g,
  '',
);

/** Conteúdo (com as chaves de dentro) do `@media` cujo texto de abertura começa em `abertura`. */
function media(abertura: string): string {
  const inicio = css.indexOf(abertura);
  if (inicio < 0) throw new Error(`media ${abertura} não encontrado`);
  const abre = css.indexOf('{', inicio);
  let nivel = 0;
  for (let i = abre; i < css.length; i++) {
    if (css[i] === '{') nivel++;
    if (css[i] === '}' && --nivel === 0) return css.slice(abre + 1, i);
  }
  throw new Error('media sem fechamento');
}

/** Corpo do bloco cujo seletor é exatamente `seletor`. */
function bloco(trecho: string, seletor: string): string {
  const achado = new RegExp(`(^|[\\s}])${seletor.replace('.', '\\.')}\\s*\\{`).exec(trecho);
  if (!achado) throw new Error(`bloco ${seletor} não encontrado`);
  const abre = trecho.indexOf('{', achado.index);
  return trecho.slice(abre + 1, trecho.indexOf('}', abre));
}

const larga = media('@media (min-width: 900px) and (orientation: landscape)');

describe('modo livro, tela larga: página e medida do mesmo tamanho', () => {
  for (const seletor of ['.pagina', '.medida']) {
    it(`FUN-100: ${seletor} usa as variáveis de largura e altura da página larga, sem proporção fixa nem 170px`, () => {
      const corpo = bloco(larga, seletor);
      expect(corpo).toContain('var(--altura-pagina-larga)');
      expect(corpo).not.toMatch(/aspect-ratio:\s*3\s*\/\s*4/);
      expect(corpo).not.toContain('170px');
    });
  }

  it('FUN-135 (antes FUN-96): a largura da página larga sai da largura da tela menos as margens e o vão, dividida por dois', () => {
    expect(larga).toMatch(/--vao-paginas:\s*var\(--esp-8\)/);
    expect(larga).toMatch(
      /--largura-pagina-larga:\s*calc\(\(100vw - 2 \* var\(--esp-6\) - var\(--vao-paginas\)\) \/ 2\)/,
    );
    expect(bloco(larga, '.livro__aberto')).toContain('var(--largura-pagina-larga)');
    expect(bloco(larga, '.medida')).toContain('var(--largura-pagina-larga)');
  });

  it('FUN-133: o vão entra como column-gap do par de páginas e na largura da cabeça e da navegação', () => {
    expect(bloco(larga, '.livro__aberto')).toContain('column-gap: var(--vao-paginas)');
    for (const seletor of ['.livro__cabeca', '.navegacao-pagina']) {
      expect(bloco(larga, seletor), seletor).toContain('calc(2 * var(--largura-pagina-larga) + var(--vao-paginas))');
    }
  });
});
