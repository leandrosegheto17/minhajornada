import type { EntradaIndice, Indice, Livro } from './tipos';

const TITULO_LIVRO = /^# (.+)$/;
const TITULO_CAPITULO = /^## (.+) (\d+)$/;
const VERSICULO = /^\*\*(\d+)\*\* (.*)$/;
/** O rodapé de crédito começa numa linha `---`; dali em diante nada é texto bíblico. */
const RODAPE = /^---$/;

/**
 * Converte o Markdown de um livro de `.biblia/` (FUN-03). Aceita `# <Nome>`, `## <Nome> <n>`, `**<v>** texto` e
 * linhas vazias; o texto do versículo perde só o espaço do fim. Falha se um capítulo ou versículo sair da sequência
 * 1, 2, 3... ou se uma linha estiver fora do formato: o build nunca publica texto truncado.
 */
export function converterLivro(md: string, numero: number): Livro {
  const linhas = md.split(/\r?\n/);
  let nome: string | null = null;
  const capitulos: string[][] = [];

  const falhar = (motivo: string, linha: number): never => {
    const onde = nome ? `${nome}${capitulos.length > 0 ? ` ${capitulos.length}` : ''}` : `livro ${numero}`;
    throw new Error(`${onde} (linha ${linha}): ${motivo}`);
  };

  for (let i = 0; i < linhas.length; i++) {
    const linha = (linhas[i] ?? '').trimEnd();
    const n = i + 1;
    if (linha === '') continue;
    if (RODAPE.test(linha)) break;

    const livro = TITULO_LIVRO.exec(linha);
    if (livro) {
      if (nome !== null) falhar('título de livro repetido', n);
      nome = (livro[1] ?? '').trim();
      continue;
    }

    const capitulo = TITULO_CAPITULO.exec(linha);
    if (capitulo) {
      if (nome === null) falhar('capítulo antes do título do livro', n);
      if (capitulo[1] !== nome) falhar(`capítulo de outro livro: "${capitulo[1]}"`, n);
      const esperado = capitulos.length + 1;
      if (Number(capitulo[2]) !== esperado) falhar(`capítulo ${capitulo[2]} fora da sequência (esperado ${esperado})`, n);
      capitulos.push([]);
      continue;
    }

    const versiculo = VERSICULO.exec(linha);
    if (versiculo) {
      const atual = capitulos[capitulos.length - 1];
      if (!atual) falhar('versículo antes do primeiro capítulo', n);
      const esperado = atual!.length + 1;
      if (Number(versiculo[1]) !== esperado) {
        falhar(`versículo ${versiculo[1]} fora da sequência (esperado ${esperado})`, n);
      }
      atual!.push((versiculo[2] ?? '').trimEnd());
      continue;
    }

    falhar(`linha fora do formato: "${linha.slice(0, 40)}"`, n);
  }

  if (nome === null) return falhar('sem título do livro', 1);
  if (capitulos.length === 0) falhar('sem capítulos', 1);
  capitulos.forEach((versiculos, c) => {
    if (versiculos.length === 0) throw new Error(`${nome} ${c + 1}: capítulo sem versículos`);
  });
  return { numero, nome, capitulos };
}

/** Monta o índice (FUN-06): 1..39 = AT, 40..66 = NT; `arquivos[i]` é o caminho público do livro `livros[i]`. */
export function montarIndice(livros: Livro[], arquivos: string[]): Indice {
  if (livros.length !== arquivos.length) throw new Error('livros e arquivos com tamanhos diferentes');
  const entradas: EntradaIndice[] = livros
    .map((livro, i) => ({
      numero: livro.numero,
      nome: livro.nome,
      testamento: livro.numero <= 39 ? ('AT' as const) : ('NT' as const),
      capitulos: livro.capitulos.length,
      arquivo: arquivos[i] ?? '',
    }))
    .sort((a, b) => a.numero - b.numero);
  entradas.forEach((entrada, i) => {
    if (entrada.numero !== i + 1) throw new Error(`índice fora da sequência no livro ${entrada.numero}`);
  });
  return { livros: entradas };
}
