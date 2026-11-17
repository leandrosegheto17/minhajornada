import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/** `wrangler.jsonc` sem os comentários de linha e sem as vírgulas finais, para o JSON.parse. */
function lerWrangler(): Record<string, any> {
  const texto = readFileSync(join(process.cwd(), 'wrangler.jsonc'), 'utf8')
    .split('\n')
    .filter((linha) => !linha.trimStart().startsWith('//'))
    .join('\n')
    .replace(/,(\s*[}\]])/g, '$1');
  return JSON.parse(texto) as Record<string, any>;
}

describe('wrangler.jsonc: observabilidade do Worker (item Observabilidade do /preparar)', () => {
  const wrangler = lerWrangler();

  it('produção (topo) liga os logs do Workers', () => {
    expect(wrangler.observability?.enabled).toBe(true);
  });

  it('staging (env.tst) liga os logs do Workers, sem herdar do topo', () => {
    expect(wrangler.env?.tst?.observability?.enabled).toBe(true);
  });

  it('o Worker continua só de assets: sem `main`, sem bindings de dados', () => {
    expect(wrangler.main).toBeUndefined();
    expect(wrangler.assets?.directory).toBe('dist');
  });
});
