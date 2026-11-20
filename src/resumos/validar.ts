// Validação do resumo contra a Bíblia do app (FUN-163, FUN-164, FUN-174, AD-018). Roda no script de publicação e na
// tarefa das propostas; não entra no pacote do app. Imports relativos com `.ts` (o Node roda este código direto).
import { semControle } from '../biblia/correcoes/validar.ts';
import type { Livro } from '../biblia/tipos.ts';
import type { Resumo } from './formato.ts';

export const MINIMO_PALAVRAS = 300;
export const MAXIMO_PALAVRAS = 450;

const SECAO = {
  contexto: 'Contexto',
  mensagem: 'Mensagem central',
  divisao: 'Divisão do livro',
  versiculos: 'Versículos-chave',
} as const;

/** Palavra: sequência de letras ou dígitos, com hífen e apóstrofo (reto ou curvo) só no meio (design, Data Models). */
const PALAVRA = /[\p{L}\p{N}]+(?:[-'’][\p{L}\p{N}]+)*/gu;

const palavrasDe = (texto: string): number => texto.match(PALAVRA)?.length ?? 0;

/** Palavras do contexto, da mensagem, dos títulos da divisão e das frases; títulos de seção e referências não contam. */
export function contarPalavras(resumo: Resumo): number {
  return (
    palavrasDe(resumo.contexto) +
    palavrasDe(resumo.mensagem) +
    resumo.divisao.reduce((soma, d) => soma + palavrasDe(d.titulo), 0) +
    resumo.versiculos.reduce((soma, v) => soma + palavrasDe(v.frase), 0)
  );
}

const vazio = (texto: string): boolean => texto.trim() === '';
const escondido = (secao: string, quem: string): string =>
  `${secao}: ${quem} tem caractere de controle ou de formatação (quebra de linha, tabulação, largura zero etc.)`;

/**
 * Problemas do resumo, um texto por problema (lista vazia = pode publicar): contagem fora de 300 a 450, seção ou parte
 * vazia, referência a livro, capítulo ou versículo que não existe na Bíblia do app, intervalo invertido e caractere de
 * controle ou de formatação (AD-018). Devolve todos, não só o primeiro.
 */
export function problemasDoResumo(resumo: Resumo, biblia: Livro[]): string[] {
  const problemas: string[] = [];
  const livro = biblia.find((l) => l.numero === resumo.livro);
  if (!livro) problemas.push(`livro ${resumo.livro} não existe na Bíblia do app`);

  const total = contarPalavras(resumo);
  if (total < MINIMO_PALAVRAS || total > MAXIMO_PALAVRAS) {
    problemas.push(`tem ${total} palavras; o resumo deve ter de ${MINIMO_PALAVRAS} a ${MAXIMO_PALAVRAS}`);
  }

  if (vazio(resumo.contexto)) problemas.push(`${SECAO.contexto}: seção vazia`);
  else if (!semControle(resumo.contexto)) problemas.push(escondido(SECAO.contexto, 'o texto'));
  if (vazio(resumo.mensagem)) problemas.push(`${SECAO.mensagem}: seção vazia`);
  else if (!semControle(resumo.mensagem)) problemas.push(escondido(SECAO.mensagem, 'o texto'));

  if (resumo.divisao.length === 0) problemas.push(`${SECAO.divisao}: seção vazia`);
  resumo.divisao.forEach((parte, i) => {
    const quem = `parte ${i + 1}`;
    if (vazio(parte.titulo)) problemas.push(`${SECAO.divisao}: ${quem} com título vazio`);
    else if (!semControle(parte.titulo)) problemas.push(escondido(SECAO.divisao, `o título da ${quem}`));
    const { de, ate } = parte;
    const ultimo = livro?.capitulos.length;
    const valido =
      Number.isInteger(de) && Number.isInteger(ate) && de >= 1 && de <= ate && (ultimo === undefined || ate <= ultimo);
    if (!valido) {
      const onde = ultimo === undefined ? '' : ` (o livro tem ${ultimo} capítulos)`;
      problemas.push(`${SECAO.divisao}: ${quem} com capítulos ${de} a ${ate} inválidos${onde}`);
    }
  });

  if (resumo.versiculos.length === 0) problemas.push(`${SECAO.versiculos}: seção vazia`);
  resumo.versiculos.forEach((v) => {
    const nome = livro?.nome ?? `livro ${resumo.livro}`;
    const ref = `${nome} ${v.capitulo}:${v.versiculo}${v.ate === undefined ? '' : `-${v.ate}`}`;
    if (vazio(v.frase)) problemas.push(`${SECAO.versiculos}: ${ref} com frase vazia`);
    else if (!semControle(v.frase)) problemas.push(escondido(SECAO.versiculos, `a frase de ${ref}`));
    if (!livro) return;
    const versiculosDoCapitulo = livro.capitulos[v.capitulo - 1]?.length;
    const existe =
      Number.isInteger(v.capitulo) &&
      Number.isInteger(v.versiculo) &&
      versiculosDoCapitulo !== undefined &&
      v.versiculo >= 1 &&
      v.versiculo <= versiculosDoCapitulo;
    if (!existe) {
      problemas.push(`${SECAO.versiculos}: ${ref} não existe`);
    } else if (
      v.ate !== undefined &&
      (!Number.isInteger(v.ate) || v.ate < v.versiculo || v.ate > (versiculosDoCapitulo ?? 0))
    ) {
      problemas.push(`${SECAO.versiculos}: ${ref} tem intervalo inválido`);
    }
  });

  return problemas;
}
