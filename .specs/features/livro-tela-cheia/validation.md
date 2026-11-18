# Validação: livro-tela-cheia — FAIL ❌ (rodada 1)

- **Data**: 2026-11-18 · **Branch**: feature/livro-tela-cheia @ 92344c2 · **Árvore**: 7f5b3bb9e48377c96e6bf864331071ce3bc6e612
- **Critérios**: 8/8 com asserção (FUN-95 a FUN-102) · **Gate**: `Gate:` de T4 a T6 (árvore do commit de código 99e9faa, `36e3d70`) reaproveitado: HEAD só difere por `tasks.md`. Refeito numa cópia limpa do HEAD: typecheck verde, Vitest 42 arquivos / 631 testes passaram, 0 falharam, lint e prettier verdes, build verde, e2e completo 82 passaram, 0 falharam
- **Sensor**: 13 mutações, 12 mortas, 1 sobreviveu (equivalente: 1)
- **Revisão de código**: `revisao-codigo`, modo curto: bloqueios 0, sugestões 1 (condição da barra só por largura e do livro por largura e paisagem: coerente com AD-011)
- **Segurança**: não se aplica: só CSS e testes, sem `style` inline nem servidor (`tasks.md`, seção Segurança padrão)

## Critérios

| Critério | `arquivo:linha` e asserção | Resultado |
|---|---|---|
| FUN-95 | `e2e/livro-tela-cheia.spec.ts:105-109` — `marca.x ≈ 24` e `conta.x + width ≈ util - 24` em 900×600, 1280×800, 1920×1080, em 4 telas | ✅ |
| FUN-96 | `:157-163` — `a.x ≈ 24`, `b.x + b.width ≈ util - 24`, larguras iguais, `a.width ≈ (util - 48 - vão) / 2` (4 tamanhos); invariante em `test/arquivos/livro-css.test.ts:35-49` | ✅ |
| FUN-97 | `:173-177` — topo da página ≥ fundo do título, fundo ≤ topo dos botões, `p.height ≈ ant.y - fundo do título - 32`, `scrollHeight <= innerHeight` | ✅ |
| FUN-98 | `:290-294` — `botaoTitulo.x ≈ a.x` e `posição.x + width ≈ b.x + b.width` (1280×800, 1920×1080) | ✅ |
| FUN-99 | `:311-319` — `ant.x ≈ a.x`, `seg.x + width ≈ b.x + b.width`, mesmo `y`, abaixo das páginas, em Rute e na capa; `pe - fundo <= 17` só em Rute (`:319`) | ✅ (ver A-01) |
| FUN-100 | `:216-217` medida = página (±1 px); `:188` `linhasCortadas == []` em Rute inteira; `:232-252` troca 1280↔1920 muda a posição, medida = página, sem corte | ✅ |
| FUN-101 | `:357-366` — largura e altura de capa e plano pago ≈ página de Rute; `pago.x ≈ 24`, `capa.x + width ≈ util - 24` | ✅ |
| FUN-102 | `:45-50` (375×812, 899×800, 1024×1366: largura, centro, altura = `innerHeight - 206`, botões em par) e `:84-85` (marca a 8/12 px, conta a 8/12 px) | ✅ |

Critérios de posição ("alinhado", "canto", "abaixo") são provados por `boundingBox` (±1 px), não por texto. Valores conferem com a Base.

## Sensor (cópia isolada de HEAD, `node_modules` por junção)

| Mutação | Morta por |
|---|---|
| U1 `.medida` volta à conta antiga (170 px) | `livro-css.test.ts` (2) e e2e FUN-100 (medida 1280×616; versículo escondido) |
| U2 `.pagina` volta a `aspect-ratio: 3 / 4` | `livro-css.test.ts` FUN-100 |
| U3 `.medida` com `--largura-pagina` | `livro-css.test.ts` FUN-96 |
| U4 largura `/ 3` | `livro-css.test.ts` FUN-96 |
| E1 padding direito da barra 12 px | e2e FUN-95 (3 tamanhos) |
| E2 tira `padding: 0` do título | e2e FUN-98 (título a 32 px, página a 24) |
| E3 `.navegacao-pagina` com `center` | e2e FUN-99 (4 casos; anterior a 525 px) |
| E4 tira `min-height: 0` de `.pagina` | e2e FUN-97 900×600 (rolagem 633 > 600) |
| E5 tira o `- 1px` da altura | e2e FUN-97 em 4 tamanhos (801 > 800) |
| E6 tira `orientation: landscape` do @media | e2e FUN-102 1024×1366 |
| E8 `.livro__cabeca` com 1 página de largura | e2e FUN-98 (título a 340 px) |
| E9 barra a partir de 1000 px | e2e FUN-95 900×600 |
| E7 padding lateral de `.livro` 24→12 px | sobreviveu, **equivalente**: `.livro` centraliza o grid (`align-items: center`), então as páginas ficam a 24 px de qualquer jeito |

## Checagens de processo

(a) `testes.json` roda a raiz, único pacote (`pnpm-workspace.yaml`); o e2e só roda no CI e foi refeito aqui. (b) `tsc` verde em 256be37, 2f0b34b e 99e9faa. (c) `e2e/livro.spec.ts`: só os helpers saíram para `e2e/apoio/livro.ts`, corpo idêntico, asserções intactas; `estilo.test.ts`, `capa.spec.ts` e `entrada.spec.ts` não mudaram; troca autorizada em `STATE.md` (2026-11-18). (d) nomes de teste citam FUN-95 a FUN-102, batem com o pedido. (e) sem banco no projeto. (f) sem policy. (g) conflito FUN-95 × FUN-102 tem AD-011, aplicada em `BarraTitulo.module.css:22-28`. Reuses seguidos: `@media` da medida estendido, variáveis locais `--largura-pagina-larga` e `--altura-pagina-larga` lidas por `.pagina` e `.medida`, nenhum `style` inline, `tokens.css` intacto. Acréscimo não nomeado, sem efeito: `.livro__cabeca > .titulo-capitulo { padding: 0 }` (`livro.module.css:283`).

## Achados

| ID | `arquivo:linha` | Achado e evidência | Correção sugerida | Criticidade | Situação |
|---|---|---|---|---|---|
| A-01 | `src/livro/livro.module.css:272-296`; `e2e/livro-tela-cheia.spec.ts:318-319` | Na capa e no plano pago não há linha de título e `.livro` centraliza o conjunto: medido em 1280×800, 1920×1080 e 900×600, os botões ficam a 76 px do pé da tela (Rute: 16 px) e as páginas começam em y=77 (Rute: 137). Ao passar da capa para Gênesis, os botões saltam 60 px. FUN-99 só diz "canto inferior" e "alinhado às páginas", então o teste não assevera o pé na capa; lacuna de precisão da spec, não violação | Decidido pelo usuário em 2026-11-18: reservar a altura da linha de título na capa e no plano pago e asserir `pertoDoPe` também na capa (Retrabalho R1, T7) | comum | aberto |

## Lacunas e o que não foi validado

- Lacuna de precisão: FUN-99 e FUN-97 não definem a posição vertical na capa e no plano pago (A-01).
- Alturas abaixo de 600 px em tela larga ficam fora do critério (FUN-97 vai de 900×600 a 1920×1200); páginas de 279 px de altura em 900×500 não foram vistas.
- Revisão visual no navegador não feita (só asserções espaciais automatizadas).
