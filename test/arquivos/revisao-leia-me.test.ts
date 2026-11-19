import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const RAIZ = process.cwd();
const leiaMe = readFileSync(join(RAIZ, 'revisao', 'LEIA-ME.md'), 'utf8');
const pacote = JSON.parse(readFileSync(join(RAIZ, 'package.json'), 'utf8')) as { scripts: Record<string, string> };

describe('revisao/LEIA-ME.md (FUN-113)', () => {
  it('FUN-113: cita os três comandos da revisão', () => {
    expect(leiaMe).toContain('pnpm revisao:montar');
    expect(leiaMe).toContain('node scripts/montar-revisao.ts');
    expect(leiaMe).toContain('node scripts/aplicar-decisoes.ts');
  });

  it('FUN-113: os comandos citados existem no repositório', () => {
    expect(pacote.scripts['revisao:montar']).toBeDefined();
    expect(existsSync(join(RAIZ, 'scripts', 'montar-revisao.ts'))).toBe(true);
    expect(existsSync(join(RAIZ, 'scripts', 'aplicar-decisoes.ts'))).toBe(true);
  });

  it('FUN-112: diz o que o artifact leva (db, user, downloads) e registra a situação da publicação', () => {
    for (const capacidade of ['`db`', '`user`', '`downloads`']) expect(leiaMe).toContain(capacidade);
    expect(leiaMe).toMatch(/Publicação: \*\*(pendente|publicada)/);
  });
});
