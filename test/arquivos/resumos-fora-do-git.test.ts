import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { lerArquivoExportado } from '../../src/resumos/formato.ts';

const RAIZ = process.cwd();
const EXPORTADO = join(RAIZ, 'resumos-exportados', 'resumos.json');
const TAMANHO_MINIMO = 40;

const git = (...args: string[]) => spawnSync('git', args, { cwd: RAIZ, encoding: 'utf8' });

/** Frases de `texto` com 40 caracteres ou mais (corte em pontuação final e quebra de linha). */
export function frasesLongas(texto: string): string[] {
  return texto
    .split(/[.!?;\n]+/)
    .map((f) => f.trim())
    .filter((f) => f.length >= TAMANHO_MINIMO);
}

/** Todos os arquivos de texto de `pasta`, recursivamente, com o conteúdo. */
function lerPasta(pasta: string): { caminho: string; conteudo: string }[] {
  if (!existsSync(pasta)) return [];
  return readdirSync(pasta, { withFileTypes: true, recursive: true })
    .filter((e) => e.isFile())
    .map((e) => join(e.parentPath, e.name))
    .map((caminho) => ({ caminho, conteudo: readFileSync(caminho, 'utf8') }));
}

/** Arquivos (caminho relativo) em que aparece alguma das frases. */
export function ondeAparece(frases: string[], arquivos: { caminho: string; conteudo: string }[]): string[] {
  return arquivos.filter((a) => frases.some((f) => a.conteudo.includes(f))).map((a) => a.caminho);
}

describe('FUN-176: a pasta da exportação não vai para o git', () => {
  it('FUN-176: `git check-ignore` confirma a regra para o arquivo e para uma subpasta', () => {
    for (const caminho of ['resumos-exportados/resumos.json', 'resumos-exportados/lote-1/resumos.json']) {
      const r = git('check-ignore', caminho);
      expect(r.status, caminho).toBe(0);
      expect(r.stdout.trim()).toBe(caminho);
    }
  });

  it('FUN-176: `git ls-files resumos-exportados` é vazio', () => {
    const r = git('ls-files', 'resumos-exportados');
    expect(r.status).toBe(0);
    expect(r.stdout.trim()).toBe('');
  });

  it('FUN-176: o `.gitignore` traz a pasta, e o pacote do app (`dist/`) também fica fora do git', () => {
    const regras = readFileSync(join(RAIZ, '.gitignore'), 'utf8').split(/\r?\n/);
    expect(regras).toContain('resumos-exportados/');
    expect(regras).toContain('dist/');
  });
});

describe('FUN-152: o texto real não vai para o repositório nem para o pacote', () => {
  const raizTemp = mkdtempSync(join(tmpdir(), 'resumos-vazamento-'));
  afterAll(() => rmSync(raizTemp, { recursive: true, force: true }));

  it('FUN-152: o detector acha a frase longa copiada num arquivo e ignora as curtas', () => {
    const longa = 'Esta é uma frase de exemplo bem mais comprida que o mínimo de quarenta caracteres';
    const frases = frasesLongas(`Curta demais. ${longa}. Outra curta.`);
    expect(frases).toEqual([longa]);
    const pasta = join(raizTemp, 'dist');
    mkdirSync(pasta, { recursive: true });
    writeFileSync(join(pasta, 'a.js'), `x="${longa}"`);
    writeFileSync(join(pasta, 'b.js'), 'sem nada parecido');
    const achados = ondeAparece(frases, lerPasta(pasta));
    expect(achados).toEqual([join(pasta, 'a.js')]);
  });

  // Sem exportação local não há texto real para procurar: o teste é pulado e o relatório mostra "skipped".
  it.skipIf(!existsSync(EXPORTADO))(
    'FUN-152: nenhuma frase de 40 caracteres ou mais da exportação local aparece em dist/ nem nos arquivos do git',
    () => {
      const arquivo = lerArquivoExportado(readFileSync(EXPORTADO, 'utf8'));
      // Só o texto do próprio autor: as frases dos versículos-chave citam a Bíblia, que o app já carrega.
      const frases = arquivo.itens.flatMap((i) => [
        ...frasesLongas(i.resumo.contexto),
        ...frasesLongas(i.resumo.mensagem),
      ]);
      expect(frases.length).toBeGreaterThan(0);

      const rastreados = git('ls-files', '-z')
        .stdout.split('\0')
        .filter((c) => c !== '' && statSync(join(RAIZ, c), { throwIfNoEntry: false })?.isFile())
        .filter((c) => !/\.(png|jpe?g|ico|webp|woff2?|gz|zip)$/i.test(c))
        .map((c) => ({ caminho: c, conteudo: readFileSync(join(RAIZ, c), 'utf8') }));
      const doPacote = lerPasta(join(RAIZ, 'dist'));
      expect(ondeAparece(frases, [...rastreados, ...doPacote])).toEqual([]);
    },
  );
});
