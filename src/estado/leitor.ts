import { indice as indiceGerado } from '../biblia/indice';
import type { Formato, Indice, Ref, Tema } from '../biblia/tipos';
import { LETRA_MAX, LETRA_MIN, LETRA_PADRAO } from '../dados/preferencias';
import { anterior, refValida, seguinte } from '../navegacao/navegacao';

export type { Formato };

/** Telas do app, sem rotas de URL (design: "Telas"). */
export type Tela = 'inicial' | 'livros' | 'capitulos' | 'leitor' | 'sobre' | 'emBreve';

/**
 * Lugar no formato livro (design: "Estado do lugar no livro"): o primeiro versículo visível, nunca um número de página,
 * para sobreviver à troca de letra, tela e formato. `fim` é "a última página deste livro", resolvida depois de paginar.
 */
export type Ancora =
  | { tipo: 'capa' }
  | { tipo: 'pago' }
  | { tipo: 'texto'; ref: Ref; versiculo: number; fatia?: number }
  | { tipo: 'fim'; livro: number };

export interface EstadoLeitor {
  tela: Tela;
  /** Capítulo aberto no leitor; `null` antes do primeiro. */
  ref: Ref | null;
  /** Livro da grade de capítulos (tela `capitulos`). */
  livroGrade: number | null;
  /** Tamanho da letra, 1 a 5 (FUN-23). */
  letra: number;
  /** Tema escolhido; `null` = o do sistema (FUN-29). */
  tema: Tema | null;
  /** Formato de leitura (FUN-66); padrão `rolagem`. */
  formato: Formato;
  /** Lugar no formato livro; vale quando `formato` é `livro` e a tela é `leitor`. */
  ancora: Ancora;
  /** Tela de onde se abriu a "em breve", para o "Voltar" dela (FUN-57). */
  voltarPara: Tela;
}

export type AcaoLeitor =
  | { tipo: 'iniciar'; ref: Ref | null; letra: number; tema: Tema | null; formato: Formato }
  | { tipo: 'lerBiblia' }
  | { tipo: 'trocarFormato' }
  | { tipo: 'abrirEmBreve' }
  | { tipo: 'voltar' }
  | { tipo: 'irParaAncora'; ancora: Ancora }
  | { tipo: 'escolherLivro'; livro: number }
  | { tipo: 'abrirCapitulo'; ref: Ref }
  | { tipo: 'tocarTitulo' }
  | { tipo: 'trocarLivro' }
  | { tipo: 'seguinte' }
  | { tipo: 'anterior' }
  | { tipo: 'mudarLetra'; delta: 1 | -1 }
  | { tipo: 'escolherTema'; tema: Tema }
  | { tipo: 'irPara'; tela: Tela };

export const ESTADO_INICIAL: EstadoLeitor = {
  tela: 'inicial',
  ref: null,
  livroGrade: null,
  letra: LETRA_PADRAO,
  tema: null,
  formato: 'rolagem',
  ancora: { tipo: 'capa' },
  voltarPara: 'inicial',
};

function capitulosDo(livro: number, indice: Indice): number | null {
  if (!Number.isInteger(livro) || livro < 1) return null;
  return indice.livros[livro - 1]?.capitulos ?? null;
}

function letraValida(n: number): boolean {
  return Number.isInteger(n) && n >= LETRA_MIN && n <= LETRA_MAX;
}

function abrirNoLeitor(estado: EstadoLeitor, ref: Ref): EstadoLeitor {
  return { ...estado, tela: 'leitor', ref, livroGrade: null };
}

/** Abre o capítulo e, no formato livro, põe a âncora no versículo 1 dele (FUN-83). */
function abrirCapituloNoFormato(estado: EstadoLeitor, ref: Ref): EstadoLeitor {
  const aberto = abrirNoLeitor(estado, ref);
  return estado.formato === 'livro' ? { ...aberto, ancora: comecoDoCapitulo(ref) } : aberto;
}

function mesmaAncora(a: Ancora, b: Ancora): boolean {
  if (a.tipo !== b.tipo) return false;
  if (a.tipo === 'texto' && b.tipo === 'texto') {
    return (
      a.ref.livro === b.ref.livro &&
      a.ref.capitulo === b.ref.capitulo &&
      a.versiculo === b.versiculo &&
      (a.fatia ?? 0) === (b.fatia ?? 0)
    );
  }
  if (a.tipo === 'fim' && b.tipo === 'fim') return a.livro === b.livro;
  return true;
}

function abrirEmBreve(estado: EstadoLeitor): EstadoLeitor {
  // Já em "em breve": mantém a origem guardada.
  if (estado.tela === 'emBreve') return estado;
  return { ...estado, tela: 'emBreve', voltarPara: estado.tela };
}

function comecoDoCapitulo(ref: Ref): Ancora {
  return { tipo: 'texto', ref, versiculo: 1 };
}

/** Capítulo onde a âncora cai na rolagem (FUN-71); `null` na capa e no texto do plano pago, que não têm capítulo. */
function capituloDaAncora(ancora: Ancora, indice: Indice): Ref | null {
  if (ancora.tipo === 'texto') return refValida(ancora.ref, indice);
  if (ancora.tipo === 'fim') {
    const total = capitulosDo(ancora.livro, indice);
    return total === null ? null : { livro: ancora.livro, capitulo: total };
  }
  return null;
}

/**
 * Reducer puro do leitor. Ação que não muda nada (limite da letra, Gênesis 1 para trás, Apocalipse 22 para a frente,
 * livro ou capítulo fora do índice) devolve o mesmo objeto, para o React não renderizar de novo.
 */
export function reduzirLeitor(estado: EstadoLeitor, acao: AcaoLeitor, indice: Indice = indiceGerado): EstadoLeitor {
  switch (acao.tipo) {
    case 'iniciar': {
      // FUN-51: o app abre sempre na página inicial; a leitura válida fica em `ref` para o "Ler Bíblia" (FUN-54), e a
      // inválida não entra (AD-006: quem lê o aparelho já a apagou).
      return {
        ...ESTADO_INICIAL,
        ref: refValida(acao.ref, indice),
        letra: letraValida(acao.letra) ? acao.letra : LETRA_PADRAO,
        tema: acao.tema,
        formato: acao.formato,
      };
    }

    case 'lerBiblia': {
      // FUN-54: com leitura, abre o capítulo no formato atual (no livro, no versículo 1); FUN-55: sem ela, a escolha
      // de livro (rolagem) ou a capa (livro).
      if (estado.ref) {
        const aberto = abrirNoLeitor(estado, estado.ref);
        return estado.formato === 'livro' ? { ...aberto, ancora: comecoDoCapitulo(estado.ref) } : aberto;
      }
      if (estado.formato === 'livro') return { ...estado, tela: 'leitor', livroGrade: null, ancora: { tipo: 'capa' } };
      return { ...estado, tela: 'livros', livroGrade: null };
    }

    case 'trocarFormato': {
      // FUN-67: fora do leitor só o formato muda; no leitor o capítulo se mantém (FUN-70, FUN-71).
      if (estado.formato === 'rolagem') {
        const livro: EstadoLeitor = { ...estado, formato: 'livro' };
        return estado.tela === 'leitor' && estado.ref ? { ...livro, ancora: comecoDoCapitulo(estado.ref) } : livro;
      }
      const rolagem: EstadoLeitor = { ...estado, formato: 'rolagem' };
      if (estado.tela !== 'leitor') return rolagem;
      const destino = capituloDaAncora(estado.ancora, indice);
      if (destino) return abrirNoLeitor(rolagem, destino);
      return { ...rolagem, tela: 'livros', livroGrade: null };
    }

    case 'escolherLivro': {
      const total = capitulosDo(acao.livro, indice);
      if (total === null) return estado;
      // FUN-09: livro de capítulo único abre direto no capítulo 1, sem a grade; FUN-07: os outros mostram a grade.
      if (total === 1) return abrirCapituloNoFormato(estado, { livro: acao.livro, capitulo: 1 });
      return { ...estado, tela: 'capitulos', livroGrade: acao.livro };
    }

    case 'abrirCapitulo': {
      // FUN-08.
      const ref = refValida(acao.ref, indice);
      return ref ? abrirCapituloNoFormato(estado, ref) : estado;
    }

    case 'abrirEmBreve':
      return abrirEmBreve(estado);

    case 'voltar':
      // FUN-57: sem origem guardada (ou fora de "em breve"), a ação não inventa destino.
      if (estado.tela !== 'emBreve') return estado;
      return { ...estado, tela: estado.voltarPara === 'emBreve' ? 'inicial' : estado.voltarPara };

    case 'irParaAncora': {
      // FUN-84, FUN-85, FUN-88: só no leitor em formato livro; a âncora de texto leva o `ref` junto, as demais não.
      if (estado.formato !== 'livro' || estado.tela !== 'leitor') return estado;
      const ancora = acao.ancora;
      if (mesmaAncora(ancora, estado.ancora)) return estado;
      if (ancora.tipo === 'texto') {
        const ref = refValida(ancora.ref, indice);
        if (!ref || !Number.isInteger(ancora.versiculo) || ancora.versiculo < 1) return estado;
        const fatia = ancora.fatia !== undefined && ancora.fatia > 0 ? { fatia: ancora.fatia } : {};
        return { ...estado, ref, ancora: { tipo: 'texto', ref, versiculo: ancora.versiculo, ...fatia } };
      }
      if (ancora.tipo === 'fim' && capitulosDo(ancora.livro, indice) === null) return estado;
      return { ...estado, ancora };
    }

    case 'tocarTitulo': {
      if (!estado.ref) return estado;
      const total = capitulosDo(estado.ref.livro, indice);
      // FUN-50: livro de capítulo único vai para a escolha de livro; FUN-49: os outros, para a grade do livro atual.
      if (total === null || total === 1) return { ...estado, tela: 'livros', livroGrade: null };
      return { ...estado, tela: 'capitulos', livroGrade: estado.ref.livro };
    }

    case 'trocarLivro':
      // FUN-06 e FUN-49 ("Trocar livro" na grade).
      return { ...estado, tela: 'livros', livroGrade: null };

    case 'seguinte':
    case 'anterior': {
      // FUN-10 a FUN-15.
      if (!estado.ref) return estado;
      const destino = acao.tipo === 'seguinte' ? seguinte(estado.ref, indice) : anterior(estado.ref, indice);
      return destino ? abrirNoLeitor(estado, destino) : estado;
    }

    case 'mudarLetra': {
      // FUN-24 a FUN-27: no limite, nada muda.
      const letra = estado.letra + acao.delta;
      if (!letraValida(letra)) return estado;
      return { ...estado, letra };
    }

    case 'escolherTema':
      // FUN-28.
      return estado.tema === acao.tema ? estado : { ...estado, tema: acao.tema };

    case 'irPara': {
      if (acao.tela === estado.tela) return estado;
      if (acao.tela === 'emBreve') return abrirEmBreve(estado);
      // Leitor sem capítulo e grade sem livro não existem: a ação é ignorada.
      if (acao.tela === 'leitor' && !estado.ref) return estado;
      if (acao.tela === 'capitulos') {
        const livro = estado.livroGrade ?? estado.ref?.livro ?? null;
        if (livro === null || capitulosDo(livro, indice) === null) return estado;
        return { ...estado, tela: 'capitulos', livroGrade: livro };
      }
      return { ...estado, tela: acao.tela, livroGrade: acao.tela === 'livros' ? null : estado.livroGrade };
    }
  }
}
