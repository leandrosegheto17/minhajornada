// Formato do resumo e do arquivo exportado pela revisão (design: "Formato e validação"; FUN-163, FUN-164, FUN-172,
// FUN-173). Só sintaxe de tipo apagável e imports relativos com `.ts`: o script de publicação roda este código no Node.

export interface Resumo {
  /** 1 a 66. */
  livro: number;
  contexto: string;
  /** "Mensagem central". */
  mensagem: string;
  /** "Capítulos de a ate". */
  divisao: { titulo: string; de: number; ate: number }[];
  /** "Gênesis 12:1-3": `ate` é o último versículo do intervalo. */
  versiculos: { capitulo: number; versiculo: number; ate?: number; frase: string }[];
}

export type EstadoResumo = 'proposta' | 'aprovada' | 'recusada';

export interface ItemRevisao {
  livro: number;
  estado: EstadoResumo;
  resumo: Resumo;
  /** Motivo da recusa (FUN-172). */
  nota?: string;
}

export interface ArquivoExportado {
  formato: 'mj-resumos-v1';
  itens: ItemRevisao[];
}

export const FORMATO_EXPORTADO = 'mj-resumos-v1';
const ESTADOS: readonly string[] = ['proposta', 'aprovada', 'recusada'];

type Objeto = Record<string, unknown>;

function exigirObjeto(valor: unknown, onde: string, campos: readonly string[]): Objeto {
  if (typeof valor !== 'object' || valor === null || Array.isArray(valor)) {
    throw new Error(`arquivo de resumos: ${onde} deve ser um objeto`);
  }
  const extras = Object.keys(valor).filter((k) => !campos.includes(k));
  if (extras.length > 0) throw new Error(`arquivo de resumos: ${onde} tem campo desconhecido "${extras[0]}"`);
  return valor as Objeto;
}

function exigirTexto(valor: unknown, onde: string): string {
  if (typeof valor !== 'string') throw new Error(`arquivo de resumos: ${onde} deve ser texto`);
  return valor;
}

function exigirInteiro(valor: unknown, onde: string): number {
  if (typeof valor !== 'number' || !Number.isInteger(valor)) {
    throw new Error(`arquivo de resumos: ${onde} deve ser um número inteiro`);
  }
  return valor;
}

function exigirLista(valor: unknown, onde: string): unknown[] {
  if (!Array.isArray(valor)) throw new Error(`arquivo de resumos: ${onde} deve ser uma lista`);
  return valor;
}

function lerResumo(valor: unknown, onde: string): Resumo {
  const o = exigirObjeto(valor, onde, ['livro', 'contexto', 'mensagem', 'divisao', 'versiculos']);
  return {
    livro: exigirInteiro(o.livro, `${onde}.livro`),
    contexto: exigirTexto(o.contexto, `${onde}.contexto`),
    mensagem: exigirTexto(o.mensagem, `${onde}.mensagem`),
    divisao: exigirLista(o.divisao, `${onde}.divisao`).map((p, i) => {
      const d = exigirObjeto(p, `${onde}.divisao[${i}]`, ['titulo', 'de', 'ate']);
      return {
        titulo: exigirTexto(d.titulo, `${onde}.divisao[${i}].titulo`),
        de: exigirInteiro(d.de, `${onde}.divisao[${i}].de`),
        ate: exigirInteiro(d.ate, `${onde}.divisao[${i}].ate`),
      };
    }),
    versiculos: exigirLista(o.versiculos, `${onde}.versiculos`).map((p, i) => {
      const v = exigirObjeto(p, `${onde}.versiculos[${i}]`, ['capitulo', 'versiculo', 'ate', 'frase']);
      return {
        capitulo: exigirInteiro(v.capitulo, `${onde}.versiculos[${i}].capitulo`),
        versiculo: exigirInteiro(v.versiculo, `${onde}.versiculos[${i}].versiculo`),
        ...(v.ate === undefined ? {} : { ate: exigirInteiro(v.ate, `${onde}.versiculos[${i}].ate`) }),
        frase: exigirTexto(v.frase, `${onde}.versiculos[${i}].frase`),
      };
    }),
  };
}

/** Confere a forma de um resumo já lido do JSON (resposta da API): campo a mais ou tipo errado lança. */
export function lerResumoJson(valor: unknown): Resumo {
  return lerResumo(valor, 'resumo');
}

/**
 * Lê o arquivo exportado pela revisão com forma estrita: campo desconhecido em qualquer nível, estado fora de
 * proposta/aprovada/recusada, livro fora de 1 a 66 (ou diferente do livro do resumo, ou repetido) e tipo errado
 * lançam um erro que diz onde. Nunca repete o texto do resumo na mensagem.
 */
export function lerArquivoExportado(json: string): ArquivoExportado {
  let bruto: unknown;
  try {
    bruto = JSON.parse(json);
  } catch {
    throw new Error('arquivo de resumos: não é JSON válido');
  }
  const o = exigirObjeto(bruto, 'o arquivo', ['formato', 'itens']);
  if (o.formato !== FORMATO_EXPORTADO) throw new Error(`arquivo de resumos: formato deve ser "${FORMATO_EXPORTADO}"`);
  const vistos = new Set<number>();
  const itens = exigirLista(o.itens, 'itens').map((bruto, i): ItemRevisao => {
    const onde = `itens[${i}]`;
    const item = exigirObjeto(bruto, onde, ['livro', 'estado', 'resumo', 'nota']);
    const livro = exigirInteiro(item.livro, `${onde}.livro`);
    if (livro < 1 || livro > 66) throw new Error(`arquivo de resumos: ${onde}.livro deve estar entre 1 e 66`);
    if (vistos.has(livro)) throw new Error(`arquivo de resumos: ${onde}.livro ${livro} está repetido`);
    vistos.add(livro);
    if (typeof item.estado !== 'string' || !ESTADOS.includes(item.estado)) {
      throw new Error(`arquivo de resumos: ${onde}.estado deve ser proposta, aprovada ou recusada`);
    }
    const resumo = lerResumo(item.resumo, `${onde}.resumo`);
    if (resumo.livro !== livro) throw new Error(`arquivo de resumos: ${onde}.resumo.livro difere de ${onde}.livro`);
    return {
      livro,
      estado: item.estado as EstadoResumo,
      resumo,
      ...(item.nota === undefined ? {} : { nota: exigirTexto(item.nota, `${onde}.nota`) }),
    };
  });
  return { formato: FORMATO_EXPORTADO, itens };
}
