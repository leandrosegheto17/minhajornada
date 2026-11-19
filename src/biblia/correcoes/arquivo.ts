// Formato do arquivo de correções e leitura validada (FUN-103). Os módulos de `correcoes/` são importados em tempo de
// execução por `scripts/converter-biblia.ts` (Node roda o TypeScript direto): só sintaxe de tipo apagável e imports
// relativos com a extensão `.ts`.

export type TipoCorrecao = 'digitacao' | 'ortografia' | 'sentido';
export type EstadoCorrecao = 'proposta' | 'aprovada' | 'recusada';
export type ConfiancaCorrecao = 'alta' | 'media' | 'baixa';
export type IdRegra = 'R-01' | 'R-02' | 'R-03';

export interface RefVersiculo {
  livro: number;
  capitulo: number;
  versiculo: number;
}

export interface ItemCorrecao {
  /** "C-0001", único no arquivo (FUN-126). */
  id: string;
  ref: RefVersiculo;
  tipo: TipoCorrecao;
  /** Trecho exato da fonte, com colchetes (AD-015). */
  antes: string;
  depois: string;
  motivo: string;
  /** Vazio = sem fonte (FUN-111). */
  fonte: string;
  confianca: ConfiancaCorrecao;
  estado: EstadoCorrecao;
  /** Marca derivada da conferência, não é estado (AD-012). */
  confere: boolean;
  /** Pares de colchetes diferentes entre antes e depois (AD-015). */
  italicoMuda?: true;
}

export interface ExemploRegra {
  ref: RefVersiculo;
  antes: string;
  depois: string;
}

export interface RegraNoArquivo {
  id: IdRegra;
  descricao: string;
  estado: EstadoCorrecao;
  /** Versículos que a regra muda na fonte, na consolidação (FUN-106). */
  versiculos: number;
  exemplos: ExemploRegra[];
}

export interface ArquivoCorrecoes {
  versao: 1;
  regras: RegraNoArquivo[];
  itens: ItemCorrecao[];
}

/** Gerado no build, entra no código principal: só o necessário para o Sobre e a capa. */
export interface ResumoCorrecoes {
  total: number;
}

export interface RegraAplicada {
  id: string;
  descricao: string;
  /** Versículos que mudaram neste build (FUN-123). */
  versiculos: number;
}

export interface ItemAplicado {
  ref: RefVersiculo;
  antes: string;
  depois: string;
  motivo: string;
}

/** Gerado no build, carregado sob demanda pela tela "Correções no texto" (FUN-122, FUN-123). */
export interface ListaAplicada {
  regras: RegraAplicada[];
  /** Ordem bíblica. */
  itens: ItemAplicado[];
}

const TIPOS: readonly string[] = ['digitacao', 'ortografia', 'sentido'];
const ESTADOS: readonly string[] = ['proposta', 'aprovada', 'recusada'];
const CONFIANCAS: readonly string[] = ['alta', 'media', 'baixa'];
const IDS_REGRA: readonly string[] = ['R-01', 'R-02', 'R-03'];

function falhar(caminho: string, motivo: string): never {
  throw new Error(`${caminho}: ${motivo}`);
}

const ehObjeto = (valor: unknown): valor is Record<string, unknown> =>
  typeof valor === 'object' && valor !== null && !Array.isArray(valor);

function inteiro(valor: unknown, minimo: number, caminho: string): void {
  if (typeof valor !== 'number' || !Number.isInteger(valor) || valor < minimo) {
    falhar(caminho, `esperado inteiro maior ou igual a ${minimo}`);
  }
}

function texto(valor: unknown, caminho: string, vazioPode: boolean): void {
  if (typeof valor !== 'string' || (!vazioPode && valor === '')) {
    falhar(caminho, vazioPode ? 'esperado texto' : 'esperado texto não vazio');
  }
}

function escolha(valor: unknown, validos: readonly string[], caminho: string): void {
  if (typeof valor !== 'string' || !validos.includes(valor)) {
    falhar(caminho, `${JSON.stringify(valor)} não é ${validos.join(', ')}`);
  }
}

function lerRef(valor: unknown, caminho: string): void {
  if (!ehObjeto(valor)) return falhar(caminho, 'esperado livro, capítulo e versículo');
  inteiro(valor.livro, 1, `${caminho}.livro`);
  inteiro(valor.capitulo, 1, `${caminho}.capitulo`);
  inteiro(valor.versiculo, 1, `${caminho}.versiculo`);
}

function lerItem(valor: unknown, caminho: string): void {
  if (!ehObjeto(valor)) return falhar(caminho, 'esperado um item');
  texto(valor.id, `${caminho}.id`, false);
  lerRef(valor.ref, `${caminho}.ref`);
  escolha(valor.tipo, TIPOS, `${caminho}.tipo`);
  texto(valor.antes, `${caminho}.antes`, false);
  texto(valor.depois, `${caminho}.depois`, true);
  texto(valor.motivo, `${caminho}.motivo`, true);
  texto(valor.fonte, `${caminho}.fonte`, true);
  escolha(valor.confianca, CONFIANCAS, `${caminho}.confianca`);
  escolha(valor.estado, ESTADOS, `${caminho}.estado`);
  if (typeof valor.confere !== 'boolean') falhar(`${caminho}.confere`, 'esperado verdadeiro ou falso');
  if (valor.italicoMuda !== undefined && valor.italicoMuda !== true) {
    falhar(`${caminho}.italicoMuda`, 'esperado verdadeiro ou ausente');
  }
}

function lerRegra(valor: unknown, caminho: string): void {
  if (!ehObjeto(valor)) return falhar(caminho, 'esperado uma regra');
  escolha(valor.id, IDS_REGRA, `${caminho}.id`);
  texto(valor.descricao, `${caminho}.descricao`, false);
  escolha(valor.estado, ESTADOS, `${caminho}.estado`);
  inteiro(valor.versiculos, 0, `${caminho}.versiculos`);
  if (!Array.isArray(valor.exemplos)) return falhar(`${caminho}.exemplos`, 'esperado uma lista');
  valor.exemplos.forEach((exemplo: unknown, i) => {
    const onde = `${caminho}.exemplos[${i}]`;
    if (!ehObjeto(exemplo)) return falhar(onde, 'esperado um exemplo');
    lerRef(exemplo.ref, `${onde}.ref`);
    texto(exemplo.antes, `${onde}.antes`, true);
    texto(exemplo.depois, `${onde}.depois`, true);
  });
}

/** Confere a forma do arquivo (FUN-103); lança com o caminho do campo inválido (ex.: `itens[12].estado`). */
export function lerArquivoCorrecoes(json: unknown): ArquivoCorrecoes {
  if (!ehObjeto(json)) return falhar('arquivo de correções', 'esperado um objeto');
  if (json.versao !== 1) falhar('arquivo de correções', 'versao deve ser 1');
  if (!Array.isArray(json.regras)) falhar('arquivo de correções', 'regras deve ser uma lista');
  if (!Array.isArray(json.itens)) falhar('arquivo de correções', 'itens deve ser uma lista');
  json.regras.forEach((regra: unknown, i) => lerRegra(regra, `regras[${i}]`));
  json.itens.forEach((item: unknown, i) => lerItem(item, `itens[${i}]`));
  return json as unknown as ArquivoCorrecoes;
}
