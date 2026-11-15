import { indice as indiceGerado } from '../biblia/indice';
import type { Indice, Ref, Tema } from '../biblia/tipos';
import { LETRA_MAX, LETRA_MIN, LETRA_PADRAO } from '../dados/preferencias';
import { anterior, refValida, seguinte } from '../navegacao/navegacao';

/** Telas do app, sem rotas de URL (design: "Telas"). */
export type Tela = 'livros' | 'capitulos' | 'leitor' | 'sobre';

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
}

export type AcaoLeitor =
  | { tipo: 'iniciar'; ref: Ref | null; letra: number; tema: Tema | null }
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
  tela: 'livros',
  ref: null,
  livroGrade: null,
  letra: LETRA_PADRAO,
  tema: null,
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

/**
 * Reducer puro do leitor. Ação que não muda nada (limite da letra, Gênesis 1 para trás, Apocalipse 22 para a frente,
 * livro ou capítulo fora do índice) devolve o mesmo objeto, para o React não renderizar de novo.
 */
export function reduzirLeitor(estado: EstadoLeitor, acao: AcaoLeitor, indice: Indice = indiceGerado): EstadoLeitor {
  switch (acao.tipo) {
    case 'iniciar': {
      // FUN-20: leitura gravada e válida abre o leitor nela; FUN-21/FUN-22: sem ela, a escolha de livro.
      const ref = refValida(acao.ref, indice);
      const base: EstadoLeitor = {
        ...ESTADO_INICIAL,
        letra: letraValida(acao.letra) ? acao.letra : LETRA_PADRAO,
        tema: acao.tema,
      };
      return ref ? abrirNoLeitor(base, ref) : base;
    }

    case 'escolherLivro': {
      const total = capitulosDo(acao.livro, indice);
      if (total === null) return estado;
      // FUN-09: livro de capítulo único abre direto no capítulo 1, sem a grade; FUN-07: os outros mostram a grade.
      if (total === 1) return abrirNoLeitor(estado, { livro: acao.livro, capitulo: 1 });
      return { ...estado, tela: 'capitulos', livroGrade: acao.livro };
    }

    case 'abrirCapitulo': {
      // FUN-08.
      const ref = refValida(acao.ref, indice);
      return ref ? abrirNoLeitor(estado, ref) : estado;
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
