import type { ArquivoCorrecoes, ItemAplicado, ItemCorrecao, ListaAplicada } from './arquivo.ts';
import { REGRAS } from './regras.ts';
import { nomeRef, posicaoUnica } from './validar.ts';
import type { Livro } from '../tipos.ts';

const chaveDe = (livro: number, capitulo: number, versiculo: number) => `${livro}:${capitulo}:${versiculo}`;

/**
 * Aplica as correções aprovadas ao texto (FUN-114) e devolve também a lista do que foi aplicado (FUN-122, FUN-123).
 * Por versículo: primeiro os itens aprovados, do fim do trecho para o começo (as posições valem para o texto da fonte,
 * e os trechos não se sobrepõem, FUN-107), depois as regras aprovadas na ordem R-01, R-02, R-03 (FUN-127). Puro e
 * determinístico: não muda a entrada, e o livro devolvido tem as mesmas chaves na mesma ordem (o hash depende dela).
 * Espera um arquivo já validado por `validarCorrecoes`; um "antes" que não confere aqui ainda assim lança.
 */
export function aplicarCorrecoes(
  livros: Livro[],
  arquivo: ArquivoCorrecoes,
): { livros: Livro[]; aplicadas: ListaAplicada } {
  const itensPorVersiculo = new Map<string, ItemCorrecao[]>();
  for (const item of arquivo.itens) {
    if (item.estado !== 'aprovada') continue;
    const chave = chaveDe(item.ref.livro, item.ref.capitulo, item.ref.versiculo);
    itensPorVersiculo.set(chave, [...(itensPorVersiculo.get(chave) ?? []), item]);
  }

  const regras = REGRAS.filter((regra) => arquivo.regras.some((r) => r.id === regra.id && r.estado === 'aprovada'));
  const mudados = new Map<string, number>(regras.map((regra) => [regra.id, 0]));
  const aplicados: ItemCorrecao[] = [];

  const novos = livros.map((livro) => ({
    numero: livro.numero,
    nome: livro.nome,
    capitulos: livro.capitulos.map((versiculos, c) =>
      versiculos.map((original, v) => {
        const itens = itensPorVersiculo.get(chaveDe(livro.numero, c + 1, v + 1)) ?? [];
        const posicoes = itens
          .map((item) => {
            const inicio = posicaoUnica(original, item.antes);
            if (inicio === null) {
              throw new Error(`correção ${item.id} não confere com ${nomeRef(livros, item.ref)}`);
            }
            return { item, inicio };
          })
          .sort((a, b) => b.inicio - a.inicio);

        let texto = original;
        for (const { item, inicio } of posicoes) {
          texto = texto.slice(0, inicio) + item.depois + texto.slice(inicio + item.antes.length);
          aplicados.push(item);
        }
        for (const regra of regras) {
          const depois = regra.aplicar(texto);
          if (depois !== texto) mudados.set(regra.id, (mudados.get(regra.id) ?? 0) + 1);
          texto = depois;
        }
        return texto;
      }),
    ),
  }));

  const itens: ItemAplicado[] = aplicados
    .sort(
      (a, b) =>
        a.ref.livro - b.ref.livro ||
        a.ref.capitulo - b.ref.capitulo ||
        a.ref.versiculo - b.ref.versiculo ||
        (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
    )
    .map(({ ref, antes, depois, motivo }) => ({ ref, antes, depois, motivo }));

  return {
    livros: novos,
    aplicadas: {
      // Regra aprovada que não mudou versículo nenhum fica de fora: o texto não foi corrigido por ela (FUN-123).
      regras: regras
        .map((regra) => ({ id: regra.id, descricao: regra.descricao, versiculos: mudados.get(regra.id) ?? 0 }))
        .filter((regra) => regra.versiculos > 0),
      itens,
    },
  };
}
