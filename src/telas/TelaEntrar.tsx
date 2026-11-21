import { useId, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { ResultadoEntrar } from '../dados/sessao';
import { Aviso } from '../componentes/base/Aviso';
import { BotaoPrimario, BotaoVoltar } from '../componentes/base/Botoes';
import estilo from './TelaEntrar.module.css';

interface Props {
  /** Tenta entrar; a tela só mostra os erros, quem chama leva ao destino quando a sessão abre (FUN-138). */
  aoEntrar: (email: string, senha: string) => Promise<ResultadoEntrar>;
  aoVoltar: () => void;
  /** "Criar conta" leva à tela "em breve" (FUN-137). */
  aoCriarConta: () => void;
}

export const MENSAGEM_INCORRETO = 'E-mail ou senha incorretos.';
export const MENSAGEM_LIMITE = 'Muitas tentativas. Tente de novo em 1 minuto.';
export const MENSAGEM_REDE = 'Não foi possível entrar agora. Verifique a conexão e tente de novo.';

const MENSAGENS: Partial<Record<ResultadoEntrar, string>> = {
  incorreto: MENSAGEM_INCORRETO,
  limite: MENSAGEM_LIMITE,
  rede: MENSAGEM_REDE,
};

/**
 * Tela "Entrar" (FUN-137, FUN-139, FUN-140; mockup `telas/entrar.html`). O envio é por `fetch`, nunca pelo envio nativo
 * do formulário (CSP `form-action 'none'`): não há `<form>`, e o Enter nos campos faz o mesmo que o botão.
 */
export function TelaEntrar({ aoEntrar, aoVoltar, aoCriarConta }: Props) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const idAviso = useId();

  async function enviar() {
    if (enviando) return;
    setEnviando(true);
    setErro(null);
    const resultado = await aoEntrar(email, senha);
    setEnviando(false);
    const mensagem = MENSAGENS[resultado];
    if (mensagem) {
      setErro(mensagem);
      setSenha('');
    }
  }

  function aoTeclar(evento: KeyboardEvent<HTMLInputElement>) {
    if (evento.key !== 'Enter') return;
    evento.preventDefault();
    void enviar();
  }

  return (
    <main className={estilo['tela-estado']}>
      <BotaoVoltar onClick={aoVoltar}>Voltar</BotaoVoltar>
      <section className={estilo['cartao-entrar']} aria-labelledby="titulo-entrar">
        <h1 id="titulo-entrar">Entrar</h1>
        <p className={estilo.apoio}>Entre com o e-mail e a senha da sua conta.</p>
        {erro && (
          <div id={idAviso}>
            <Aviso variante="erro" mensagem={erro} />
          </div>
        )}
        <div className={estilo.campo}>
          <label htmlFor="entrar-email">E-mail</label>
          <input
            id="entrar-email"
            type="email"
            autoComplete="username"
            inputMode="email"
            value={email}
            disabled={enviando}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={aoTeclar}
          />
        </div>
        <div className={estilo.campo}>
          <label htmlFor="entrar-senha">Senha</label>
          <input
            id="entrar-senha"
            type="password"
            autoComplete="current-password"
            value={senha}
            disabled={enviando}
            aria-invalid={erro === MENSAGEM_INCORRETO ? 'true' : undefined}
            aria-describedby={erro ? idAviso : undefined}
            onChange={(e) => setSenha(e.target.value)}
            onKeyDown={aoTeclar}
          />
        </div>
        <BotaoPrimario disabled={enviando} onClick={() => void enviar()}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </BotaoPrimario>
        <p className={estilo.rodape}>
          Ainda não tem conta?{' '}
          <button type="button" className={estilo['link-criar']} onClick={aoCriarConta}>
            Criar conta
          </button>
        </p>
      </section>
    </main>
  );
}
