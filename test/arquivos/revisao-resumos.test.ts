import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { build } from 'vite';
import { beforeAll, describe, expect, it } from 'vitest';

// Artifact da revisão dos resumos (FUN-170, FUN-173; T40): um HTML único sem texto de resumo e um roteiro com os
// comandos reais.
const RAIZ = process.cwd();
const SAIDA = join(RAIZ, 'revisao-resumos', 'dist');
const leiaMe = readFileSync(join(RAIZ, 'revisao-resumos', 'LEIA-ME.md'), 'utf8');
const pacote = JSON.parse(readFileSync(join(RAIZ, 'package.json'), 'utf8')) as { scripts: Record<string, string> };

/** Os textos de resumo que existem no aparelho (a exportação local de `resumos-exportados/`, se houver). */
function textosDeResumo(): string[] {
  const pasta = join(RAIZ, 'resumos-exportados');
  if (!existsSync(pasta)) return [];
  const textos: string[] = [];
  for (const nome of readdirSync(pasta).filter((n) => n.endsWith('.json'))) {
    const { itens } = JSON.parse(readFileSync(join(pasta, nome), 'utf8')) as {
      itens: Array<{ resumo: { contexto: string; mensagem: string } }>;
    };
    for (const { resumo } of itens) textos.push(resumo.contexto, resumo.mensagem);
  }
  return textos.filter((t) => t.trim().length > 20);
}

let html = '';

beforeAll(async () => {
  await build({ configFile: join(RAIZ, 'revisao-resumos', 'vite.config.ts'), logLevel: 'silent' });
  html = readFileSync(join(SAIDA, 'index.html'), 'utf8');
}, 120_000);

describe('pnpm revisao-resumos:montar (FUN-170, FUN-173)', () => {
  it('FUN-170: o script existe e gera um HTML único, sem script externo nem endereço de outro site', () => {
    expect(pacote.scripts['revisao-resumos:montar']).toContain('revisao-resumos/vite.config.ts');
    expect(readdirSync(SAIDA)).toEqual(['index.html']);
    expect(html).not.toMatch(/<script[^>]*\ssrc=/);
    expect(html).not.toMatch(/https?:\/\/(?!www\.w3\.org)/);
    expect(html).toContain('id="revisao-resumos"');
  });

  it('FUN-170: as seções aparecem só como rótulos, e nenhum texto de resumo está no HTML', () => {
    for (const rotulo of ['Contexto', 'Mensagem central', 'Divisão do livro', 'Versículos-chave']) {
      expect(html).toContain(rotulo);
    }
    for (const texto of textosDeResumo()) expect(html).not.toContain(texto);
  });
});

describe('revisao-resumos/LEIA-ME.md (FUN-173, FUN-175)', () => {
  it('FUN-173: cita os comandos reais, que existem no repositório', () => {
    expect(leiaMe).toContain('pnpm revisao-resumos:montar');
    expect(leiaMe).toContain('node scripts/resumos/publicar.ts --ambiente tst');
    expect(existsSync(join(RAIZ, 'scripts', 'resumos', 'publicar.ts'))).toBe(true);
    expect(leiaMe).toContain('resumos-exportados/');
  });

  it('FUN-175: diz que produção pede confirmação escrita e que não há código novo por livro', () => {
    expect(leiaMe).toContain('--ambiente producao');
    expect(leiaMe).toMatch(/confirmação escrita/);
    expect(leiaMe).toMatch(/nenhum código novo por livro/);
    for (const capacidade of ['`db`', '`user`', '`downloads`']) expect(leiaMe).toContain(capacidade);
  });
});
