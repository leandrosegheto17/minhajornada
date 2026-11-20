import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

interface Ambiente {
  routes?: { pattern: string; custom_domain?: boolean }[];
  vars?: { URL_PUBLICA?: string };
  hyperdrive?: { binding: string; id: string; localConnectionString?: string }[];
  ratelimits?: { name: string; namespace_id: string; simple: { limit: number; period: number } }[];
  observability?: { enabled?: boolean };
}

interface Wrangler extends Ambiente {
  main?: string;
  compatibility_flags?: string[];
  workers_dev?: boolean;
  preview_urls?: boolean;
  assets?: { directory?: string; run_worker_first?: string[] };
  dev?: { ip?: string };
  env?: { tst?: Ambiente };
}

const CAMINHO = join(process.cwd(), 'wrangler.jsonc');

/** `wrangler.jsonc` sem os comentários de linha e sem as vírgulas finais, para o JSON.parse. */
function lerWrangler(): Wrangler {
  const texto = readFileSync(CAMINHO, 'utf8')
    .split('\n')
    .filter((linha) => !linha.trimStart().startsWith('//'))
    .join('\n')
    .replace(/,(\s*[}\]])/g, '$1');
  return JSON.parse(texto) as Wrangler;
}

describe('wrangler.jsonc: observabilidade do Worker (item Observabilidade do /preparar)', () => {
  const wrangler = lerWrangler();

  it('produção (topo) liga os logs do Workers', () => {
    expect(wrangler.observability?.enabled).toBe(true);
  });

  it('staging (env.tst) liga os logs do Workers, sem herdar do topo', () => {
    expect(wrangler.env?.tst?.observability?.enabled).toBe(true);
  });
});

describe('wrangler.jsonc: Worker com script em /api/* (AD-022, FUN-140, FUN-151)', () => {
  const wrangler = lerWrangler();
  const ambientes: [string, Ambiente][] = [
    ['produção (topo)', wrangler],
    ['staging (env.tst)', wrangler.env?.tst ?? {}],
  ];

  it('o Worker tem script (`main`) e os assets saem de dist, com só /api/* passando pelo Worker primeiro', () => {
    expect(wrangler.main).toBe('servidor/entrada/worker.ts');
    expect(wrangler.assets?.directory).toBe('dist');
    expect(wrangler.assets?.run_worker_first).toEqual(['/api/*']);
  });

  it('liga nodejs_compat (o `pg` precisa) e fecha *.workers.dev e as URLs de prévia', () => {
    expect(wrangler.compatibility_flags).toContain('nodejs_compat');
    expect(wrangler.workers_dev).toBe(false);
    expect(wrangler.preview_urls).toBe(false);
  });

  it('escuta local só em 127.0.0.1 no `wrangler dev`', () => {
    expect(wrangler.dev?.ip).toBe('127.0.0.1');
  });

  it.each(ambientes)('%s: a URL pública é a do domínio do ambiente (base do Host 421 e da origem 403)', (_n, amb) => {
    const dominio = amb.routes?.[0]?.pattern;
    expect(dominio).toMatch(/^minhajornada(-tst)?\.ljssoftware\.com\.br$/);
    expect(amb.vars?.URL_PUBLICA).toBe(`https://${dominio}`);
  });

  it.each(ambientes)('%s: um Hyperdrive HYPERDRIVE, sem URL de banco no arquivo', (_n, amb) => {
    expect(amb.hyperdrive).toHaveLength(1);
    expect(amb.hyperdrive?.[0]?.binding).toBe('HYPERDRIVE');
    expect(amb.hyperdrive?.[0]?.localConnectionString).toBeUndefined();
  });

  it.each(ambientes)('%s: o limite de login LIMITE_ENTRAR é de 5 por 60 s (FUN-140)', (_n, amb) => {
    expect(amb.ratelimits).toHaveLength(1);
    const limite = amb.ratelimits?.[0];
    expect(limite?.name).toBe('LIMITE_ENTRAR');
    expect(limite?.simple).toEqual({ limit: 5, period: 60 });
  });

  it('produção e staging usam namespaces de limite diferentes', () => {
    expect(wrangler.ratelimits?.[0]?.namespace_id).not.toBe(wrangler.env?.tst?.ratelimits?.[0]?.namespace_id);
  });

  it('nenhuma senha nem URL de conexão com banco no arquivo', () => {
    const texto = readFileSync(CAMINHO, 'utf8');
    expect(texto).not.toMatch(/postgres(ql)?:\/\//i);
    expect(texto).not.toMatch(/password|senha\s*[:=]/i);
  });
});
