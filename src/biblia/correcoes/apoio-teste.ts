// Apoio dos testes de `correcoes/`: fábricas de item, regra e arquivo, livros pequenos e a fonte real.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { converterLivro } from '../conversor';
import type { Livro } from '../tipos';
import type { ArquivoCorrecoes, IdRegra, ItemCorrecao, RegraNoArquivo } from './arquivo';

export function item(parcial: Partial<ItemCorrecao> = {}): ItemCorrecao {
  return {
    id: 'C-0001',
    ref: { livro: 1, capitulo: 1, versiculo: 2 },
    tipo: 'digitacao',
    antes: 'Coreiro',
    depois: 'Cordeiro',
    motivo: 'palavra inexistente',
    fonte: 'consistência interna',
    confianca: 'alta',
    estado: 'proposta',
    confere: true,
    ...parcial,
  };
}

export function regra(id: IdRegra = 'R-01', parcial: Partial<RegraNoArquivo> = {}): RegraNoArquivo {
  return {
    id,
    descricao: 'descrição da regra',
    estado: 'proposta',
    versiculos: 2,
    exemplos: [{ ref: { livro: 1, capitulo: 2, versiculo: 1 }, antes: 'a ,b', depois: 'a,b' }],
    ...parcial,
  };
}

export function arquivo(itens: ItemCorrecao[] = [], regras: RegraNoArquivo[] = []): ArquivoCorrecoes {
  return { versao: 1, regras, itens };
}

/** Dois livros pequenos, com os versículos que os testes citam por referência. */
export function livrosFicticios(): Livro[] {
  return [
    {
      numero: 1,
      nome: 'Gênesis',
      capitulos: [
        [
          'No princípio [Deus] criou os céus e a terra.',
          'A terra era sem forma e vazia, e o Coreiro abriu o livro.',
          'E ele disse sim sim e saiu.',
          'texto [sem fecho aqui',
        ],
        ['Rute disse ,vem.'],
      ],
    },
    {
      numero: 2,
      nome: 'Êxodo',
      capitulos: [['Assim falou o SENHOR : vem.', 'Então saiu.']],
    },
  ];
}

let reais: Livro[] | null = null;

/** Os 66 livros de `.biblia/`, como o build os lê. */
export function livrosReais(): Livro[] {
  if (reais) return reais;
  const pasta = join(process.cwd(), '.biblia');
  const fontes = readdirSync(pasta)
    .filter((nome) => /^(\d{2})-[a-z0-9-]+\.md$/.test(nome))
    .sort();
  reais = fontes.map((nome) => converterLivro(readFileSync(join(pasta, nome), 'utf8'), Number(nome.slice(0, 2))));
  return reais;
}
