// Leitura das tabelas de `levantamento/gNN.md` (FUN-104): cada linha vira um candidato ou, se não se lê, uma linha
// ignorada com o motivo. Nada some em silêncio. Node 24 roda este arquivo direto: só sintaxe de tipo apagável.
import type { ConfiancaCorrecao, RefVersiculo, TipoCorrecao } from '../../src/biblia/correcoes/arquivo.ts';

export interface Candidato {
  arquivo: string;
  /** Linha (1 = primeira) do arquivo de origem. */
  linha: number;
  /** Vazia quando a linha é "N ocorrências": o trecho é procurado no texto inteiro (AD-014). */
  refs: RefVersiculo[];
  ocorrencias?: number;
  tipo: TipoCorrecao;
  antes: string;
  depois: string;
  motivo: string;
  fonte: string;
  confianca: ConfiancaCorrecao;
}

export interface LinhaIgnorada {
  arquivo: string;
  linha: number;
  motivo: string;
  texto: string;
}

export interface LeituraTabelas {
  candidatos: Candidato[];
  ignoradas: LinhaIgnorada[];
  /** Linhas `arcaico`, descartadas (FUN-104). */
  arcaicos: number;
}

const NOMES = [
  'Gênesis', 'Êxodo', 'Levítico', 'Números', 'Deuteronômio', 'Josué', 'Juízes', 'Rute', '1 Samuel', '2 Samuel',
  '1 Reis', '2 Reis', '1 Crônicas', '2 Crônicas', 'Esdras', 'Neemias', 'Ester', 'Jó', 'Salmos', 'Provérbios',
  'Eclesiastes', 'Cânticos', 'Isaías', 'Jeremias', 'Lamentações', 'Ezequiel', 'Daniel', 'Oseias', 'Joel', 'Amós',
  'Obadias', 'Jonas', 'Miqueias', 'Naum', 'Habacuque', 'Sofonias', 'Ageu', 'Zacarias', 'Malaquias', 'Mateus',
  'Marcos', 'Lucas', 'João', 'Atos', 'Romanos', '1 Coríntios', '2 Coríntios', 'Gálatas', 'Efésios', 'Filipenses',
  'Colossenses', '1 Tessalonicenses', '2 Tessalonicenses', '1 Timóteo', '2 Timóteo', 'Tito', 'Filemom', 'Hebreus',
  'Tiago', '1 Pedro', '2 Pedro', '1 João', '2 João', '3 João', 'Judas', 'Apocalipse',
]; // prettier-ignore

/** Abreviações achadas nos 15 arquivos e as usuais. Compara com acento e caixa: "Jó" (18) não é "Jo" (43). */
const ABREVIACOES: Record<string, number> = {
  Gn: 1, Gên: 1, 'Êx': 2, Ex: 2, Lv: 3, Nm: 4, Núm: 4, Dt: 5, Deut: 5, Js: 6, Jz: 7, Rt: 8, '1Sm': 9, '2Sm': 10,
  '1Rs': 11, '2Rs': 12, '1Cr': 13, '2Cr': 14, Esd: 15, Ed: 15, Ne: 16, Et: 17, Sl: 19, Pv: 20, Ec: 21, Ct: 22,
  Is: 23, Jr: 24, Lm: 25, Ez: 26, Dn: 27, Os: 28, Jl: 29, Am: 30, Ob: 31, Jn: 32, Mq: 33, Na: 34, Hc: 35, Sf: 36,
  Ag: 37, Zc: 38, Ml: 39, Mt: 40, Mc: 41, Lc: 42, Jo: 43, At: 44, Rm: 45, '1Co': 46, '2Co': 47, Gl: 48, Ef: 49,
  Fp: 50, Cl: 51, '1Ts': 52, '2Ts': 53, '1Tm': 54, '2Tm': 55, Tt: 56, Fm: 57, Hb: 58, Tg: 59, '1Pe': 60, '2Pe': 61,
  '1Jo': 62, '2Jo': 63, '3Jo': 64, Jd: 65, Ap: 66,
}; // prettier-ignore

const POR_NOME = new Map<string, number>([
  ...NOMES.map((nome, i) => [nome, i + 1] as const),
  ...Object.entries(ABREVIACOES),
]);

/** "1 Cr" e "1Cr" valem o mesmo; devolve undefined para o que não é livro conhecido. */
function numeroDoLivro(nome: string): number | undefined {
  return POR_NOME.get(nome) ?? POR_NOME.get(nome.replace(/^(\d) /, '$1'));
}

const TIPOS: readonly string[] = ['digitacao', 'ortografia', 'sentido'];
const CONFIANCAS: Record<string, ConfiancaCorrecao> = { alta: 'alta', média: 'media', baixa: 'baixa' };

function celulas(linha: string): string[] {
  const partes: string[] = [];
  let atual = '';
  for (let i = 0; i < linha.length; i++) {
    const c = linha[i];
    if (c === '\\' && linha[i + 1] === '|') {
      atual += '|';
      i += 1;
    } else if (c === '|') {
      partes.push(atual);
      atual = '';
    } else atual += c;
  }
  partes.push(atual);
  // Linha começa e termina em "|": a primeira e a última parte são vazias.
  return partes.slice(1, -1).map((p) => p.trim());
}

/** O trecho é um único texto entre aspas retas; as de dentro ficam. Qualquer outra forma não se lê. */
function trecho(celula: string): string | null {
  if (celula.length < 3 || !celula.startsWith('"') || !celula.endsWith('"')) return null;
  const texto = celula.slice(1, -1);
  // `"a"; "b"` e `"a" / "b"` são vários trechos numa célula: não se lê como um.
  if (/"\s*(?:;|\/|,|\bou\b)\s*"/.test(texto)) return null;
  return texto;
}

type Referencias = { refs: RefVersiculo[]; ocorrencias?: number } | { erro: string };

function lerReferencias(celula: string): Referencias {
  const n = /^(\d+) ocorrências(?:\s*\(.*\))?$/.exec(celula);
  if (n) return { refs: [], ocorrencias: Number(n[1]) };

  const partes = celula
    .replace(/[()]/g, ';')
    .replace(/\s+e\s+(?=\d+:\d+)/g, ';')
    .split(/[;,]/)
    .map((p) => p.trim().replace(/^e\s+/, ''))
    .filter((p) => p !== '');
  const refs: RefVersiculo[] = [];
  let livro: number | undefined;
  for (const parte of partes) {
    const m = /^(?:(.+?)\s+)?(\d+):(\d+)$/.exec(parte);
    if (!m) return { erro: `referência não lida: "${parte}" (em "${celula}")` };
    if (m[1] !== undefined) {
      livro = numeroDoLivro(m[1]);
      if (livro === undefined) return { erro: `livro desconhecido: "${m[1]}" (em "${celula}")` };
    }
    if (livro === undefined) return { erro: `referência sem livro: "${parte}" (em "${celula}")` };
    refs.push({ livro, capitulo: Number(m[2]), versiculo: Number(m[3]) });
  }
  if (refs.length === 0) return { erro: `referência vazia: "${celula}"` };
  return { refs };
}

/** Lê as linhas de tabela de um `gNN.md`; o que não é linha de dados (título, observações, cabeçalho) é pulado. */
export function lerTabelas(md: string, arquivo: string): LeituraTabelas {
  const candidatos: Candidato[] = [];
  const ignoradas: LinhaIgnorada[] = [];
  let arcaicos = 0;

  md.split(/\r?\n/).forEach((texto, i) => {
    const linha = i + 1;
    if (!texto.startsWith('|') || /^\|\s*-+/.test(texto) || /^\|\s*Ref\s*\|/.test(texto)) return;
    const ignorar = (motivo: string): void => void ignoradas.push({ arquivo, linha, motivo, texto });

    const c = celulas(texto);
    if (c.length !== 7) return ignorar(`${c.length} colunas em vez de 7`);
    const [ref = '', tipo = '', antesBruto = '', depoisBruto = '', motivo = '', fonte = '', confianca = ''] = c;

    if (tipo === 'arcaico') {
      arcaicos += 1;
      return;
    }
    if (!TIPOS.includes(tipo)) return ignorar(`tipo desconhecido: "${tipo}"`);
    const conf = CONFIANCAS[confianca];
    if (conf === undefined) return ignorar(`confiança desconhecida: "${confianca}"`);
    const antes = trecho(antesBruto);
    if (antes === null) return ignorar('"antes" não é um único trecho entre aspas');
    const depois = trecho(depoisBruto);
    if (depois === null) return ignorar('"depois" não é um único trecho entre aspas');
    const referencias = lerReferencias(ref);
    if ('erro' in referencias) return ignorar(referencias.erro);

    candidatos.push({
      arquivo,
      linha,
      refs: referencias.refs,
      ...(referencias.ocorrencias === undefined ? {} : { ocorrencias: referencias.ocorrencias }),
      tipo: tipo as TipoCorrecao,
      antes,
      depois,
      motivo,
      fonte,
      confianca: conf,
    });
  });

  return { candidatos, ignoradas, arcaicos };
}
