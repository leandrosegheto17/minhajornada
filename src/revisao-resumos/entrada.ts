// Entrada do bundle da revisão dos resumos (`pnpm revisao-resumos:montar` → `revisao-resumos/dist/index.html`): pede o
// banco e os downloads do artifact e inicia a página. O texto dos resumos só vem do banco, nunca do bundle (FUN-152).
import { bancoDoArtifact, iniciar } from './pagina';
import type { BancoResumos, DbLike } from './pagina';

declare global {
  interface Window {
    claude?: { use(nome: string): Promise<unknown> };
  }
}

const ESPERA_DO_BANCO_MS = 10_000;

/** Uma capacidade do artifact (`claude.use(nome)`), ou `null` se a visão não a oferece ou não responde a tempo. */
async function abrir(nome: string): Promise<unknown> {
  if (window.claude === undefined) return null;
  const limite = new Promise<null>((resolver) => setTimeout(() => resolver(null), ESPERA_DO_BANCO_MS));
  return (await Promise.race([window.claude.use(nome), limite])) ?? null;
}

async function abrirBanco(): Promise<BancoResumos | null> {
  const db = (await abrir('db')) as DbLike | null;
  return db ? bancoDoArtifact(db) : null;
}

interface Downloads {
  save(pedido: { filename: string; data: string }): Promise<unknown>;
}

/** "Baixar exportação" pelo `downloads` do artifact (o quadro da página não baixa direto); sem ele, o padrão da página. */
async function abrirDownload(): Promise<((nome: string, conteudo: string) => void) | undefined> {
  const downloads = (await abrir('downloads')) as Downloads | null;
  if (downloads === null) return undefined;
  return (nome, conteudo) => {
    downloads.save({ filename: nome, data: conteudo }).catch(() => undefined);
  };
}

async function arrancar(): Promise<void> {
  const raiz = document.getElementById('revisao-resumos');
  if (raiz === null) return;
  try {
    await iniciar(raiz, await abrirBanco(), await abrirDownload());
  } catch (erro) {
    raiz.textContent = `Não foi possível abrir a revisão: ${(erro as Error).message}`;
  }
}

void arrancar();
