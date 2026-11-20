import { join } from 'node:path';
import { runner } from 'node-pg-migrate';

export const PASTA_MIGRACOES = join(import.meta.dirname, 'migracoes');
export const TABELA_MIGRACOES = 'pgmigrations';

export interface OpcoesMigrar {
  /** Pasta das migrações `.sql`; padrão: `servidor/migracoes`. Os testes usam pastas de exemplo. */
  pasta?: string | undefined;
  /** Saída do runner; padrão: silencioso. */
  log?: (mensagem: string) => void;
}

/**
 * Aplica as migrações `.sql` pendentes (reuso.md R14): uma transação por migração (`singleTransaction: false`),
 * ordem conferida (`checkOrder`) e o lock do próprio `node-pg-migrate`, que faz uma segunda execução simultânea
 * esperar a primeira. Devolve os nomes aplicados nesta execução; rodar de novo não aplica nada.
 */
export async function migrar(url: string, opcoes: OpcoesMigrar = {}): Promise<string[]> {
  const pasta = opcoes.pasta ?? PASTA_MIGRACOES;
  const aplicadas = await runner({
    databaseUrl: url,
    // O glob só entende `/`: no Windows o `join` sai com `\`.
    dir: join(pasta, '*.sql').replaceAll('\\', '/'),
    useGlob: true,
    migrationsTable: TABELA_MIGRACOES,
    // `SET search_path TO "public"`: um schema com o nome do papel dono não recebe as tabelas (A-22).
    schema: 'public',
    direction: 'up',
    count: Infinity,
    singleTransaction: false,
    checkOrder: true,
    noLock: false,
    verbose: false,
    log: opcoes.log ?? (() => undefined),
  });
  return aplicadas.map((m) => m.name);
}
