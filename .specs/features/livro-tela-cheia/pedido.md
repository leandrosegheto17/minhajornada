# Pedido: livro-tela-cheia

**Data**: 2026-11-18 · **Origem**: print do usuário em `minhajornada-tst` (Gênesis 8, 1920 × 1080, modo livro), com as decisões tomadas na conversa
**Branch pai**: desenvolvimento · **Requisitos**: FUN-95 a FUN-102

## Problema

No PC, o modo livro usa pouco da tela: a página tem proporção fixa 3 × 4, limitada pela altura (`src/livro/livro.module.css:52-65`), e a barra de título para em 1240 px (`--largura-barra`, `src/componentes/BarraTitulo.module.css:17`). Em 1920 × 1080 sobram faixas vazias dos lados.

## Decisões do usuário (2026-11-18)

- Páginas **preenchem a área** disponível, sem proporção fixa (cabe mais texto, o livro tem menos páginas).
- "Anterior" e "Seguinte" nos **cantos de baixo**, esquerdo e direito.
- Barra de título de borda a borda em **todas as telas** no PC.

## Critérios de aceite

"Tela larga" é a condição de duas páginas que já existe (FUN-73: largura ≥ 900 px e mais larga que alta). "Margem lateral" é 24 px (`--esp-6`).

1. WHILE a tela tem 900 px ou mais de largura o sistema SHALL mostrar a barra de título de borda a borda em todas as telas: a marca começa na margem lateral esquerda e o botão da conta termina na margem lateral direita. (FUN-95)
2. WHILE o modo livro está na tela larga o sistema SHALL mostrar as duas páginas ocupando a largura da tela menos as duas margens laterais e o vão entre elas, cada uma com metade dessa largura, sem proporção fixa. (FUN-96)
3. WHILE o modo livro está na tela larga o sistema SHALL mostrar as páginas ocupando a altura entre a linha do título e a linha dos botões, sem rolagem vertical da tela de 900 × 600 a 1920 × 1200. (FUN-97)
4. WHILE o modo livro está na tela larga o sistema SHALL alinhar o título do capítulo à borda esquerda da página da esquerda e "páginas X e Y de N" à borda direita da página da direita. (FUN-98)
5. WHILE o modo livro está na tela larga o sistema SHALL mostrar "Anterior" no canto inferior esquerdo, alinhado à borda esquerda da página da esquerda, e "Seguinte" no canto inferior direito, alinhado à borda direita da página da direita. (FUN-99)
6. WHEN as páginas mudam de tamanho (nova largura ou altura da janela) THEN o sistema SHALL repaginar com a medida do tamanho novo, sem versículo cortado ou escondido, em 1280 × 800 e 1920 × 1080. (FUN-100)
7. WHILE o modo livro está na tela larga o sistema SHALL mostrar a capa e o plano pago com o mesmo tamanho das páginas de texto. (FUN-101)
8. WHILE a tela não é larga (menos de 900 px ou mais alta que larga) o sistema SHALL manter o modo livro, a barra e os botões como estão hoje. (FUN-102)

## Fora do escopo

- Tela estreita e celular (FUN-102 garante que não mudam).
- Modo rolagem, além da barra de borda a borda.
- Limite de caracteres por linha em telas muito largas (o usuário escolheu preencher sem limite).

## Testes existentes que mudam

Os que conferem a proporção 3 × 4, `--largura-pagina` ou `--largura-barra` (ex.: `src/estilo/estilo.test.ts:78`) e as posições da barra e dos botões nos e2e de tela larga. A mudança decorre das decisões acima; precisa da aprovação da regra de Testes no plano.
