// Consolida o levantamento (`levantamento/gNN.md`) no arquivo de correções (FUN-104, FUN-105, FUN-106). Roda uma vez,
// à mão: `node scripts/consolidar-correcoes.ts [--forcar]`. Determinístico: a mesma entrada grava os mesmos bytes.
// Node 24 roda este arquivo direto: só sintaxe de tipo apagável e imports com a extensão `.ts`.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { converterLivro } from '../src/biblia/conversor.ts';
import type { ArquivoCorrecoes, ExemploRegra, RegraNoArquivo } from '../src/biblia/correcoes/arquivo.ts';
import { REGRAS } from '../src/biblia/correcoes/regras.ts';
import type { Livro } from '../src/biblia/tipos.ts';
import { conferir } from './correcoes/conferir.ts';
import { lerTabelas } from './correcoes/levantamento.ts';
import type { LinhaIgnorada } from './correcoes/levantamento.ts';

const EXEMPLOS_POR_REGRA = 5;

/**
 * Descreve cada regra mecânica sobre o texto da fonte: quantos versículos ela muda e até 5 exemplos reais, espalhados
 * em ordem bíblica. As regras rodam na ordem de `REGRAS`, como no build; o "antes" de um exemplo é o versículo como
 * a regra o recebe e o "depois" é o que ela devolve. Todas nascem "proposta".
 */
export function descreverRegras(livros: Livro[]): RegraNoArquivo[] {
  const mudados = new Map<string, ExemploRegra[]>(REGRAS.map((regra) => [regra.id, []]));
  for (const livro of livros) {
    livro.capitulos.forEach((versiculos, c) =>
      versiculos.forEach((original, v) => {
        let texto = original;
        for (const regra of REGRAS) {
          const depois = regra.aplicar(texto);
          if (depois !== texto) {
            mudados.get(regra.id)?.push({
              ref: { livro: livro.numero, capitulo: c + 1, versiculo: v + 1 },
              antes: texto,
              depois,
            });
          }
          texto = depois;
        }
      }),
    );
  }
  return REGRAS.map((regra) => {
    const todos = mudados.get(regra.id) ?? [];
    const exemplos =
      todos.length <= EXEMPLOS_POR_REGRA
        ? todos
        : Array.from(
            { length: EXEMPLOS_POR_REGRA },
            (_, i) => todos[Math.floor((i * todos.length) / EXEMPLOS_POR_REGRA)] as ExemploRegra,
          );
    return { id: regra.id, descricao: regra.descricao, estado: 'proposta', versiculos: todos.length, exemplos };
  });
}

export interface Consolidacao {
  arquivo: ArquivoCorrecoes;
  /** Conteúdo de `correcoes.json`: uma regra e um item por linha. */
  json: string;
  /** Conteúdo de `relatorio-consolidacao.md`. */
  relatorio: string;
}

export function serializar(arquivo: ArquivoCorrecoes): string {
  const lista = (itens: unknown[]): string =>
    itens.length === 0 ? '[]' : `[\n${itens.map((i) => `    ${JSON.stringify(i)}`).join(',\n')}\n  ]`;
  return `{\n  "versao": 1,\n  "regras": ${lista(arquivo.regras)},\n  "itens": ${lista(arquivo.itens)}\n}\n`;
}

function relatorioDe(
  arquivo: ArquivoCorrecoes,
  contagens: { arcaicos: number; ignoradas: LinhaIgnorada[]; lidas: number },
  relatorio: ReturnType<typeof conferir>['relatorio'],
): string {
  const porTipo = (tipo: string): number => arquivo.itens.filter((i) => i.tipo === tipo).length;
  const linhas = [
    '# Relatório da consolidação',
    '',
    'Gerado por `scripts/consolidar-correcoes.ts` a partir de `levantamento/gNN.md`. Não edite à mão.',
    '',
    '## Contagens',
    '',
    `- Candidatos lidos: ${contagens.lidas}`,
    `- Itens no arquivo: ${arquivo.itens.length}`,
    `  - Digitação: ${porTipo('digitacao')}`,
    `  - Ortografia: ${porTipo('ortografia')}`,
    `  - Sentido: ${porTipo('sentido')}`,
    `- Conferem: ${relatorio.conferem}`,
    `  - Recuperados sem colchetes (AD-015): ${relatorio.recuperados}`,
    `- Não conferem: ${relatorio.naoConferem}`,
    `- Expandidos de "N ocorrências" (AD-014): ${relatorio.expandidos}`,
    `- Cobertos por regra: ${relatorio.cobertosPorRegra} (fora da lista, AD-013)`,
    `- Arcaico descartado: ${contagens.arcaicos}`,
    `- Linhas repetidas contadas uma vez: ${relatorio.duplicados}`,
    `- Fora do arquivo por colchete de itálico sem par (FUN-125): ${relatorio.semColchetes.length}`,
    `- Linhas ignoradas: ${contagens.ignoradas.length}`,
    '',
    '## Regras mecânicas',
    '',
    ...arquivo.regras.map((r) => `- ${r.id}: ${r.versiculos} versículos. ${r.descricao}`),
  ];
  if (relatorio.ocorrenciasDivergentes.length > 0) {
    linhas.push('', '## "N ocorrências" com contagem diferente (AD-014)', '');
    for (const o of relatorio.ocorrenciasDivergentes) {
      linhas.push(`- ${o.arquivo}:${o.linha}: dizia ${o.esperado}, achadas ${o.achado}`);
    }
  }
  if (relatorio.semVersiculo.length > 0) {
    linhas.push('', '## Referências que não existem na fonte', '');
    for (const s of relatorio.semVersiculo) linhas.push(`- ${s.arquivo}:${s.linha}: ${s.motivo}`);
  }
  if (relatorio.semColchetes.length > 0) {
    linhas.push('', '## Fora do arquivo: o "depois" deixaria colchete de itálico sem par', '');
    for (const s of relatorio.semColchetes) linhas.push(`- ${s.arquivo}:${s.linha}: ${s.motivo}`);
  }
  if (contagens.ignoradas.length > 0) {
    linhas.push('', '## Linhas ignoradas (formato sem leitura definida)', '');
    for (const i of contagens.ignoradas) linhas.push(`- ${i.arquivo}:${i.linha}: ${i.motivo}`);
  }
  return `${linhas.join('\n')}\n`;
}

/** Lê as tabelas, confere contra a fonte e monta o arquivo de correções e o relatório. Sem escrever nada. */
export function consolidar(tabelas: Array<{ arquivo: string; md: string }>, livros: Livro[]): Consolidacao {
  const ordenadas = [...tabelas].sort((a, b) => (a.arquivo < b.arquivo ? -1 : a.arquivo > b.arquivo ? 1 : 0));
  const candidatos = [];
  const ignoradas: LinhaIgnorada[] = [];
  let arcaicos = 0;
  for (const tabela of ordenadas) {
    const leitura = lerTabelas(tabela.md, tabela.arquivo);
    candidatos.push(...leitura.candidatos);
    ignoradas.push(...leitura.ignoradas);
    arcaicos += leitura.arcaicos;
  }
  const { itens, relatorio } = conferir(candidatos, livros);
  const arquivo: ArquivoCorrecoes = { versao: 1, regras: descreverRegras(livros), itens };
  return {
    arquivo,
    json: serializar(arquivo),
    relatorio: relatorioDe(arquivo, { arcaicos, ignoradas, lidas: candidatos.length }, relatorio),
  };
}

/**
 * Grava `correcoes.json` e `relatorio-consolidacao.md` em `pasta`. Se o arquivo que já existe tem alguma decisão do
 * dono (item ou regra fora de "proposta"), recusa sem tocar em nada, a menos que `forcar` (a revisão se perderia).
 */
export function gravarConsolidacao(pasta: string, consolidacao: Consolidacao, opcoes: { forcar: boolean }): void {
  const destino = join(pasta, 'correcoes.json');
  if (!opcoes.forcar && existsSync(destino)) {
    const atual = JSON.parse(readFileSync(destino, 'utf8')) as ArquivoCorrecoes;
    const decidido = [...atual.regras, ...atual.itens].some((x) => x.estado !== 'proposta');
    if (decidido) {
      throw new Error(`${destino} já tem decisões do dono (aprovadas ou recusadas); use --forcar para sobrescrever`);
    }
  }
  mkdirSync(pasta, { recursive: true });
  writeFileSync(destino, consolidacao.json);
  writeFileSync(join(pasta, 'relatorio-consolidacao.md'), consolidacao.relatorio);
}

const ehPrincipal = process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (ehPrincipal) {
  const raiz = resolve(fileURLToPath(new URL('..', import.meta.url)));
  const fonte = join(raiz, '.biblia');
  const levantamento = join(raiz, '.specs', 'features', 'texto-atualizado', 'levantamento');
  const livros = readdirSync(fonte)
    .filter((nome) => /^(\d{2})-[a-z0-9-]+\.md$/.test(nome))
    .sort()
    .map((nome) => converterLivro(readFileSync(join(fonte, nome), 'utf8'), Number(nome.slice(0, 2))));
  const tabelas = readdirSync(levantamento)
    .filter((nome) => /^g\d{2}\.md$/.test(nome))
    .sort()
    .map((nome) => ({ arquivo: nome, md: readFileSync(join(levantamento, nome), 'utf8') }));
  const consolidacao = consolidar(tabelas, livros);
  gravarConsolidacao(join(raiz, 'correcoes'), consolidacao, { forcar: process.argv.includes('--forcar') });
  console.log(
    `consolidar-correcoes: ${consolidacao.arquivo.itens.length} itens e 3 regras em correcoes/correcoes.json`,
  );
}
