import { ESLint } from 'eslint';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

/**
 * Regras de segurança do `eslint.config.mjs` (FUN-04, FUN-41), provadas com código de violação.
 * O caminho do arquivo fictício decide a regra; o código não precisa existir em disco.
 */
const RAIZ = process.cwd();
const eslint = new ESLint({ cwd: RAIZ });

// A primeira análise carrega a configuração inteira: pode passar de 5 s.
vi.setConfig({ testTimeout: 60_000 });

async function regrasVioladas(arquivo: string, codigo: string): Promise<string[]> {
  const [resultado] = await eslint.lintText(codigo, { filePath: join(RAIZ, arquivo) });
  return (resultado?.messages ?? []).map((m) => m.ruleId ?? 'erro-de-sintaxe');
}

describe('FUN-04: o texto nunca vira HTML interpretado', () => {
  it.each([
    [
      'dangerouslySetInnerHTML',
      'export const A = (p: { t: string }) => <div dangerouslySetInnerHTML={{ __html: p.t }} />;',
    ],
    ['innerHTML', 'export function f(el: HTMLElement, t: string) { el.innerHTML = t; }'],
    ['outerHTML', 'export function f(el: HTMLElement, t: string) { el.outerHTML = t; }'],
    ['insertAdjacentHTML', "export function f(el: HTMLElement, t: string) { el.insertAdjacentHTML('beforeend', t); }"],
    ['document.write', 'export function f(t: string) { document.write(t); }'],
  ])('FUN-04: %s é recusado em src/', async (_nome, codigo) => {
    expect(await regrasVioladas('src/componentes/Violacao.tsx', codigo)).toContain('no-restricted-syntax');
  });

  it.each([
    ['eval', 'export const f = (t: string) => eval(t);', 'no-eval'],
    ['new Function', "export const f = () => new Function('return 1');", 'no-new-func'],
    ['setTimeout com texto', "export const f = () => setTimeout('alert(1)', 10);", 'no-restricted-syntax'],
  ])('FUN-04: %s é recusado em src/', async (_nome, codigo, regra) => {
    expect(await regrasVioladas('src/telas/Violacao.ts', codigo)).toContain(regra);
  });

  it('FUN-04: texto comum em JSX passa', async () => {
    expect(
      await regrasVioladas('src/componentes/Ok.tsx', 'export const A = (p: { t: string }) => <p>{p.t}</p>;'),
    ).toEqual([]);
  });
});

describe('FUN-41: requisições só em src/dados/', () => {
  it.each(['src/telas/Violacao.ts', 'src/estado/Violacao.ts', 'src/componentes/Violacao.tsx', 'src/App.tsx'])(
    'FUN-41: fetch em %s é recusado',
    async (arquivo) => {
      expect(await regrasVioladas(arquivo, "export const f = () => fetch('/livros/01.json');")).toContain(
        'no-restricted-globals',
      );
    },
  );

  it('FUN-41: XMLHttpRequest fora de src/dados/ é recusado', async () => {
    expect(await regrasVioladas('src/telas/Violacao.ts', 'export const x = () => new XMLHttpRequest();')).toContain(
      'no-restricted-globals',
    );
  });

  it('FUN-41: fetch em src/dados/ passa', async () => {
    expect(await regrasVioladas('src/dados/Ok.ts', "export const f = () => fetch('/livros/01.json');")).toEqual([]);
  });
});
