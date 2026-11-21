// Cria ou atualiza o usuário dono (FUN-141, FUN-146): `node scripts/criar-dono.ts --email <e-mail>`.
// A senha vem da entrada padrão (nunca de argumento, para não ficar no histórico do terminal) e a URL do banco de
// `DATABASE_URL_DONO` (papel dono). Node 24 roda este arquivo direto: só sintaxe de tipo apagável.
import { resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import { criarCliente } from '../servidor/db/cliente.ts';

export interface OpcoesCriarDono {
  email: string;
  env: Record<string, string | undefined>;
  /** Linha digitada; `null` quando a entrada está fechada. */
  lerSenha: () => Promise<string | null>;
  saida: (linha: string) => void;
  erro: (linha: string) => void;
}

// bcrypt de custo 12 no próprio banco (AD-022); o e-mail em caixa baixa é exigido pelo CHECK da tabela. Trocar a senha
// encerra as sessões abertas do usuário no mesmo comando (A-09): um cookie roubado não sobrevive à troca.
const SQL = `WITH gravado AS (
    INSERT INTO public.usuarios (email, senha_hash, dono) VALUES ($1, public.crypt($2, public.gen_salt('bf', 12)), true)
    ON CONFLICT (email) DO UPDATE SET senha_hash = EXCLUDED.senha_hash, dono = true
    RETURNING id
  ), encerradas AS (
    DELETE FROM public.sessoes WHERE usuario_id IN (SELECT id FROM gravado)
  )
  SELECT count(*)::int AS n FROM gravado`;

/** Mínimo de caracteres da senha do dono (A-10) e o limite de bytes que o bcrypt lê (o resto é ignorado). */
export const SENHA_MINIMA = 12;
export const BCRYPT_BYTES = 72;

/** Devolve o código de saída. Nenhuma mensagem leva a senha. */
export async function criarDono(opcoes: OpcoesCriarDono): Promise<number> {
  const email = opcoes.email.trim().toLowerCase();
  if (email === '') {
    opcoes.erro('Informe o e-mail: --email <e-mail>.');
    return 1;
  }
  const url = opcoes.env.DATABASE_URL_DONO?.trim();
  if (!url) {
    opcoes.erro('Defina DATABASE_URL_DONO com a URL do banco (papel dono) e rode de novo.');
    return 1;
  }
  const senha = await opcoes.lerSenha();
  if (senha === null || senha.trim() === '') {
    opcoes.erro('A senha não pode ser vazia: informe a senha pela entrada padrão.');
    return 1;
  }
  if ([...senha].length < SENHA_MINIMA) {
    opcoes.erro(`A senha deve ter pelo menos ${SENHA_MINIMA} caracteres.`);
    return 1;
  }
  const cliente = criarCliente(url);
  try {
    await cliente.consultar(SQL, [email, senha]);
  } catch (e) {
    // O erro do cliente já é uma mensagem fixa quando a conexão falha; outros erros do banco não trazem parâmetros.
    opcoes.erro(`Não consegui gravar o usuário: ${e instanceof Error ? e.message : 'erro desconhecido'}`);
    return 1;
  } finally {
    await cliente.fechar();
  }
  opcoes.saida(`Usuário dono ${email} gravado.`);
  if (Buffer.byteLength(senha, 'utf8') > BCRYPT_BYTES) {
    opcoes.saida(`Aviso: o bcrypt lê só os primeiros ${BCRYPT_BYTES} bytes da senha; o resto é ignorado.`);
  }
  return 0;
}

const ehPrincipal = process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (ehPrincipal) {
  const i = process.argv.indexOf('--email');
  const leitor = createInterface({ input: process.stdin });
  process.exitCode = await criarDono({
    email: i >= 0 ? (process.argv[i + 1] ?? '') : '',
    env: process.env,
    lerSenha: async () => {
      try {
        return await new Promise<string | null>((ok) => {
          leitor.once('line', ok);
          leitor.once('close', () => ok(null));
        });
      } finally {
        leitor.close();
      }
    },
    saida: (l) => console.log(l),
    erro: (l) => console.error(l),
  });
}
