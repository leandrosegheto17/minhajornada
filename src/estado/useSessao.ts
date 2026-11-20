import { useCallback, useEffect, useRef, useState } from 'react';
import { donoNoAparelho, esquecerDono } from '../dados/preferencias';
import { entrar as entrarNaApi, lerSessao, sair as sairDaApi } from '../dados/sessao';
import type { ResultadoEntrar } from '../dados/sessao';

export type EstadoSessao = 'sem' | 'usuario' | 'dono';

export interface Sessao {
  sessao: EstadoSessao;
  /** Tenta entrar; com sessão aberta (`dono` ou `usuario`) o estado muda sozinho (FUN-138). */
  entrar(email: string, senha: string): Promise<ResultadoEntrar>;
  /** Sai: o estado vira `sem` na hora, mesmo sem rede (FUN-143). */
  sair(): Promise<void>;
  /** Uma chamada recebeu 401 com o app aberto: volta a `sem`, sem mensagem (FUN-145; reuso.md R19). */
  perder(): void;
}

/**
 * Sessão do dono no app (design: `useSessao`). Na abertura vale a dica `mj:dono` do aparelho até a API responder; se a
 * rede falhar, a dica continua valendo (caso limite "sem internet com sessão guardada"). Uma resposta que chega
 * depois de um `entrar`, `sair` ou `perder` é descartada, para não desfazer o que o leitor acabou de fazer.
 */
export function useSessao(): Sessao {
  const [sessao, setSessao] = useState<EstadoSessao>(() => (donoNoAparelho() ? 'dono' : 'sem'));
  const versao = useRef(0);

  useEffect(() => {
    let ativo = true;
    const consultada = versao.current;
    void lerSessao().then((resultado) => {
      if (!ativo || versao.current !== consultada || resultado === 'rede') return;
      setSessao(resultado);
    });
    return () => {
      ativo = false;
    };
  }, []);

  const entrar = useCallback(async (email: string, senha: string): Promise<ResultadoEntrar> => {
    const resultado = await entrarNaApi(email, senha);
    if (resultado === 'dono' || resultado === 'usuario') {
      versao.current += 1;
      setSessao(resultado);
    }
    return resultado;
  }, []);

  const sair = useCallback(async (): Promise<void> => {
    versao.current += 1;
    setSessao('sem');
    await sairDaApi();
  }, []);

  const perder = useCallback((): void => {
    versao.current += 1;
    esquecerDono();
    setSessao('sem');
  }, []);

  return { sessao, entrar, sair, perder };
}
