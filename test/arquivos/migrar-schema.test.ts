import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// A-22: o script `migrar` do deploy fixa o schema `public` (o node-pg-migrate roda `SET search_path TO "public"`),
// para uma migração sem schema nunca cair num schema com o nome do papel dono.
const pacote = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8')) as {
  scripts: Record<string, string>;
};

describe('package.json: o script migrar fixa o schema (A-22, FUN-173)', () => {
  it('A-22 FUN-173: `migrar` passa `--schema public` ao node-pg-migrate', () => {
    expect(pacote.scripts.migrar).toMatch(/node-pg-migrate\.js up\b.*--schema public\b/);
  });
});
