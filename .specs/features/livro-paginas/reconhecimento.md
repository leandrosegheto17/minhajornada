# Reconhecimento: livro-paginas

- **Data**: 2026-11-19 · **Commit**: ecd7e48
- **Contexto do projeto**: `.claude/CLAUDE.md` (fluxos), `.specs/projeto/inventario.md` (em dia para `src/livro`: nada mudou ali desde d93f7e8)
- **Encaixe**: estende padrão (paginação pura de `paginar` e a tela larga de `livro-tela-cheia`)
- **Arquitetura**: cabe
- **Telas**: muda o modo livro (`TelaLivro`), na tela larga e na capa
- **Mockup**: dispensado — os valores da spec bastam (vão de 32 px, linha de 1 px em `--cor-borda`, cantos arredondados nas quatro pontas das páginas em tela larga); decisão do dono em 2026-11-19
- **Plano aprovado em**: 2026-11-19

## Onde entra

| Arquivo ou módulo | O que muda | Novo? |
|---|---|---|
| `src/livro/paginacao.ts:61` (`paginar`) | Recebe quais blocos abrem página nova (capítulo 2 em diante) e fecha a página antes deles | não |
| `src/telas/TelaLivro.tsx:81-84` | Passa a `paginar` as quebras tiradas dos blocos (`abreCapitulo`, menos o capítulo 1) | não |
| `src/livro/livro.module.css:261-304` | Tela larga: vão de `--esp-8` no grid, linha de 1 px `--cor-borda` no centro, largura de cada página descontando o vão, cabeça e navegação com a largura nova, cantos | não |
| `test/arquivos/livro-css.test.ts:45-49` | Fórmula de `--largura-pagina-larga` muda (desconta o vão) | não |

## Reaproveitamento

| Necessidade da feature | Peça existente | Decisão | Por que |
|---|---|---|---|
| Saber onde começa cada capítulo | `Bloco.abreCapitulo` (`src/livro/paginacao.ts:9,38`) | reaproveitar | — |
| Fechar a página antes do capítulo | `paginar` e o `fechar()` interno (`paginacao.ts:61,73-77`) | estender | parâmetro opcional de quebras; sem ele, o resultado é o de hoje, e os testes atuais de `paginar` continuam valendo |
| Largura igual para página e medida | `--largura-pagina-larga` (`livro.module.css:270`), lida por `.livro__aberto` (`:276-278`) e `.medida` (`:301-304`) | estender | o vão entra na fórmula da variável; o vão só no `column-gap` deixaria a medida mais larga que a página e esconderia versículo |
| Cor da linha nos temas | `--cor-borda` (`src/estilo/tokens.css:17,95,112,128,144`) | reaproveitar | — |
| Vão de 32 px | `--esp-8` (`tokens.css:53`) | reaproveitar | — |

## Modelo a seguir

- Tela larga da `livro-tela-cheia` — `src/livro/livro.module.css:261-304` — variáveis locais na media query, sem token novo; a mesma variável para página e medida.
- Testes de `paginar` — `src/livro/paginacao.test.ts:116-228` — alturas inventadas, funções puras, um caso por regra.

## Convenções do projeto

- CSS Modules só com `var(--...)` dos tokens; nada novo em `tokens.css` (cópia byte a byte do mockup, `src/estilo/estilo.test.ts:62`).
- Requisito citado no nome do teste (`FUN-NN`); e2e de tela larga em `e2e/livro-tela-cheia.spec.ts`, com `boundingBox`.

## Testes

- **Rodar a suíte**: `pnpm typecheck && pnpm test` (Git Bash); e2e: `pnpm build && pnpm e2e <arquivo>`.
- **Cobrem o trecho**: `src/livro/paginacao.test.ts` (blocos, `paginar`, localizar, fatias), `test/arquivos/paginacao-66.test.ts:21`, `test/arquivos/livro-css.test.ts:37-49`, `e2e/livro.spec.ts:26-126`, `e2e/livro-tela-cheia.spec.ts:171-353`, `e2e/capa.spec.ts:21-115`, `e2e/entrada.spec.ts:122,205-223`.
- **Testes existentes que mudam** (precisam da aprovação da regra de Testes): `test/arquivos/livro-css.test.ts:45-49` (fórmula exata de `--largura-pagina-larga`); `e2e/livro-tela-cheia.spec.ts:171-187` (FUN-96: "metade cada" passa a descontar o vão), `:305-320` (FUN-98: bordas das páginas) e `:344-351` (FUN-99: cantos da navegação), se a posição mudar com a largura nova.
- **Sem teste**: nenhum comportamento tocado fica sem teste; não há T0.

## Fragilidades e riscos

- **Medida × página**: a invariante depende de `.medida` e `.livro__aberto` lerem a mesma largura (`livro-css.test.ts:3-5`); só o e2e pega um vão que entre só no grid. Risco principal.
- **Cabeça e navegação**: `max-width: calc(2 * var(--largura-pagina-larga))` (`livro.module.css:283-285,290-294`) fica 32 px mais estreito que o par de páginas se não somar o vão; o título e os botões deixam de alinhar às bordas (FUN-98, FUN-99).
- **Contagem de páginas**: a quebra aumenta o número de páginas; o e2e que conta ou espera um versículo numa página específica (`e2e/livro.spec.ts:91-126`, `src/App.test.tsx:263-270`) precisa ser conferido.
- Comentários que ficam falsos: `livro.module.css:261-267` ("vão 0") e `:279`. `900px` literal em `:212,268` fora de sincronia com `--quebra-livro-duplo` (fora do escopo).
