import { indice } from '../biblia/indice';
import type { Formato, Ref, Tema } from '../biblia/tipos';
import { refValida } from '../navegacao/navegacao';

/**
 * Preferências e leitura no aparelho (FUN-19, FUN-22, FUN-23, FUN-30, FUN-31, FUN-47). Uma chave por dado, com valor
 * em JSON. Valor ilegível ou fora do intervalo cai no padrão; sem `localStorage` (modo privado antigo ou bloqueado),
 * tudo funciona sem lembrar. Nada sai do aparelho.
 */
export const CHAVES = {
  leitura: 'mj:leitura',
  letra: 'mj:letra',
  tema: 'mj:tema',
  formato: 'mj:formato',
  convite: 'mj:convite-ios',
  dono: 'mj:dono',
  resumo: 'mj:resumo',
} as const;

export const LETRA_PADRAO = 3;
export const LETRA_MIN = 1;
export const LETRA_MAX = 5;
const TEMAS: readonly Tema[] = ['claro', 'escuro', 'sepia'];
const FORMATOS: readonly Formato[] = ['rolagem', 'livro'];

/** Marca de valor gravado que não é JSON (diferente de "ausente"). */
const INVALIDO = Symbol('invalido');

function ler(chave: string): unknown {
  let bruto: string | null;
  try {
    bruto = globalThis.localStorage?.getItem(chave) ?? null;
  } catch {
    return undefined;
  }
  if (bruto === null) return undefined;
  try {
    return JSON.parse(bruto) as unknown;
  } catch {
    return INVALIDO;
  }
}

function gravar(chave: string, valor: unknown): void {
  try {
    globalThis.localStorage?.setItem(chave, JSON.stringify(valor));
  } catch {
    // Sem armazenamento local, a escolha vale só enquanto a página estiver aberta.
  }
}

function apagar(chave: string): void {
  try {
    globalThis.localStorage?.removeItem(chave);
  } catch {
    // Nada a apagar sem armazenamento.
  }
}

/** Leitura gravada (FUN-20, FUN-22): válida contra o índice; ilegível ou inválida é apagada e devolve `null`. */
export function lerLeitura(): Ref | null {
  const valor = ler(CHAVES.leitura);
  if (valor === undefined) return null;
  const ref = refValida(valor, indice);
  if (!ref) apagar(CHAVES.leitura);
  return ref;
}

/** Grava o capítulo aberto (FUN-19). */
export function gravarLeitura(ref: Ref): void {
  gravar(CHAVES.leitura, { livro: ref.livro, capitulo: ref.capitulo });
}

export function apagarLeitura(): void {
  apagar(CHAVES.leitura);
}

/** Tamanho da letra (FUN-23, FUN-31): inteiro de 1 a 5; qualquer outro valor (ou nenhum) dá 3. */
export function lerLetra(): number {
  const valor = ler(CHAVES.letra);
  if (typeof valor === 'number' && Number.isInteger(valor) && valor >= LETRA_MIN && valor <= LETRA_MAX) return valor;
  return LETRA_PADRAO;
}

export function gravarLetra(n: number): void {
  if (!Number.isInteger(n) || n < LETRA_MIN || n > LETRA_MAX) return;
  gravar(CHAVES.letra, n);
}

/** Tema escolhido (FUN-29, FUN-31): `null` = seguir o sistema (sem escolha ou valor desconhecido). */
export function lerTema(): Tema | null {
  const valor = ler(CHAVES.tema);
  return TEMAS.includes(valor as Tema) ? (valor as Tema) : null;
}

export function gravarTema(tema: Tema): void {
  if (!TEMAS.includes(tema)) return;
  gravar(CHAVES.tema, tema);
}

/** Formato de leitura (FUN-66, FUN-69): `rolagem` quando não há escolha ou o valor é ilegível ou desconhecido. */
export function lerFormato(): Formato {
  const valor = ler(CHAVES.formato);
  return FORMATOS.includes(valor as Formato) ? (valor as Formato) : 'rolagem';
}

export function gravarFormato(formato: Formato): void {
  if (!FORMATOS.includes(formato)) return;
  gravar(CHAVES.formato, formato);
}

/**
 * Dica de que este aparelho teve sessão de dono (FUN-145; design, Tech Decisions): só decide se o botão "Resumo"
 * aparece sem internet. Não é credencial: o texto do resumo continua exigindo a sessão no servidor.
 */
export function donoNoAparelho(): boolean {
  return ler(CHAVES.dono) === true;
}

export function lembrarDono(): void {
  gravar(CHAVES.dono, true);
}

export function esquecerDono(): void {
  apagar(CHAVES.dono);
}

/** Resumo ligado no formato livro (FUN-157): `false` sem escolha; valor que não é verdadeiro nem falso é apagado. */
export function lerResumoLigado(): boolean {
  const valor = ler(CHAVES.resumo);
  if (valor === undefined) return false;
  if (typeof valor === 'boolean') return valor;
  apagar(CHAVES.resumo);
  return false;
}

export function gravarResumoLigado(ligado: boolean): void {
  gravar(CHAVES.resumo, ligado === true);
}

/** Convite de instalação do iPhone e iPad dispensado (FUN-47). */
export function conviteDispensado(): boolean {
  return ler(CHAVES.convite) === true;
}

export function dispensarConvite(): void {
  gravar(CHAVES.convite, true);
}
