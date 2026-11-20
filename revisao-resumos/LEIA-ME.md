# Revisão dos resumos

A revisão é um artifact **privado** do claude.ai (`revisao-resumos/dist/index.html`, um HTML único) em que cada livro tem o estado `proposta`, `aprovada` ou `recusada` e o texto das quatro seções (Contexto, Mensagem central, Divisão do livro, Versículos-chave). O texto dos resumos fica só no banco do artifact e na pasta local `resumos-exportados/`, fora do git; nunca no repositório nem no bundle.

## Caminho de um resumo

1. **Escrever:** uma sessão do Claude escreve a proposta (linguagem simples, quatro seções, versículo-chave sem copiar o texto bíblico), confere com `problemasDoResumo` (`src/resumos/validar.ts`) e grava a linha `resumos/<livro>` no banco do artifact com o estado `proposta`.
2. **Revisar:** no artifact, você edita as seções, aprova (o texto editado vira o aprovado) ou recusa com uma nota (sem nota, a recusa não é aceita).
3. **Exportar:** "Baixar exportação" entrega `resumos.json` (formato `mj-resumos-v1`, com todos os livros e o estado de cada um). Guarde-o em `resumos-exportados/resumos.json`.
4. **Publicar:** `node scripts/resumos/publicar.ts --ambiente tst` grava no Neon do ambiente só os `aprovada`, numa transação, e imprime quantos livros gravou. Para produção, `node scripts/resumos/publicar.ts --ambiente producao` pede a **confirmação escrita** antes de gravar.

Um livro novo segue o mesmo caminho: nenhum código novo por livro.

## Montar

`pnpm revisao-resumos:montar` gera `revisao-resumos/dist/index.html` (fora do git). Depois de mudar a página, monte de novo e republique o artifact.

## Publicar o artifact

O artifact leva só `index.html` e as capacidades `db`, `user` e `downloads`. Cada livro é uma linha do banco (`resumos/<livro>`, com `{ livro, estado, resumo, nota? }`), por isso a revisão continua ali quando você fecha e reabre a página. Publicar o artifact e gravar no banco dele são ações externas: só com a sua confirmação.

Publicação: **pendente**.
