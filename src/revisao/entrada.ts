// Entrada do bundle da página de revisão (`pnpm revisao:montar` → `revisao/dist/pagina.js`): lê `dados.json`, pede o
// banco do artifact e inicia a página. Só arquivos relativos; nada de rede além do `dados.json` ao lado.
import type { DadosDaRevisao } from '../../scripts/montar-revisao.ts';
import { bancoDoArtifact, iniciar } from './pagina';
import type { BancoDecisoes, DbLike } from './pagina';

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

/** O banco do artifact, ou `null` se esta visão não o oferece (sem login, sem permissão) ou ele não responde a tempo. */
async function abrirBanco(): Promise<BancoDecisoes | null> {
  const db = (await abrir('db')) as DbLike | null;
  return db ? bancoDoArtifact(db) : null;
}

interface Downloads {
  save(pedido: { filename: string; data: string }): Promise<unknown>;
}

/** "Baixar decisões" pelo `downloads` do artifact (o quadro da página não baixa direto); sem ele, o padrão da página. */
async function abrirDownload(): Promise<((nome: string, conteudo: string) => void) | undefined> {
  const downloads = (await abrir('downloads')) as Downloads | null;
  if (downloads === null) return undefined;
  return (nome, conteudo) => {
    // O dono pode recusar a confirmação; nada a fazer além de deixá-lo tentar de novo.
    downloads.save({ filename: nome, data: conteudo }).catch(() => undefined);
  };
}

async function arrancar(): Promise<void> {
  const raiz = document.getElementById('revisao');
  if (raiz === null) return;
  try {
    // A página de revisão roda fora do app (num artifact); a regra de fetch só em src/dados/ (FUN-41) é do app.
    // eslint-disable-next-line no-restricted-globals
    const resposta = await fetch('./dados.json');
    if (!resposta.ok) throw new Error(`dados.json: ${resposta.status}`);
    const dados = (await resposta.json()) as DadosDaRevisao;
    await iniciar(raiz, dados, await abrirBanco(), await abrirDownload());
  } catch (erro) {
    raiz.textContent = `Não foi possível abrir a revisão: ${(erro as Error).message}`;
  }
}

void arrancar();
