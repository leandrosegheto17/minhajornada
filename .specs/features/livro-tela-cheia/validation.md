# Validação: livro-tela-cheia — FAIL ❌ (rodada 2)

- **Data**: 2026-11-18 · **Branch**: feature/livro-tela-cheia @ c01f34b · **Árvore**: f94f8d1a074e3bbcc28636be97cf21b780d1584f (código = árvore `7b1a846` do commit 4b256d2; HEAD só difere por `tasks.md`)
- **Escopo**: diff do retrabalho R1 (`4b256d2`: `livro.module.css` +4, `livro-tela-cheia.spec.ts` +10/-5) mais regressão. Critérios, mutações e revisão da rodada 1 valem para o resto (nada mais mudou em `src` nem `e2e`).
- **Critérios**: 8/8 com asserção (FUN-95 a FUN-102) · **Gate**: `Gate:` de T7 reaproveitado (mesma árvore de código) e refeito inteiro numa cópia limpa do HEAD: typecheck (2 tsconfig), eslint e prettier verdes, Vitest 42 arquivos / 631 testes passaram, 0 falharam, build verde, e2e completo 82 passaram, 0 falharam
- **Sensor**: 4 mutações novas, 3 mortas, 1 sobreviveu (equivalentes: 0); da rodada 1: 12 de 13 mortas, 1 equivalente
- **Revisão de código**: diff de 4 linhas de CSS e testes lido por mim; sem bloqueio (a rodada 1 já fez a revisão da feature)
- **Segurança**: não se aplica: só CSS e testes, sem servidor nem `style` inline

## Critérios alterados pelo retrabalho

| Critério | `arquivo:linha` e asserção | Resultado |
|---|---|---|
| FUN-99 | `e2e/livro-tela-cheia.spec.ts:318` — `pe - (ant.y + ant.height) <= 16 + TOL`, agora incondicional (Rute e capa); `:337-338` na capa `|planoPago.y - yTexto| <= TOL` e `|anterior.y - yBotoes| <= TOL` (y medido em Rute 1 do mesmo tamanho) | ✅ |
| FUN-101 | `:357-366` inalterado (largura e altura da capa e do plano pago = página de Rute), verde na suíte | ✅ |
| FUN-102 | `:45-50` inalterado, verde; medido na capa em 375×812, 899×800, 1024×1366: `pagY=69`, botões a 77 px do pé, idêntico ao da rodada 1 (a regra está dentro do `@media`) | ✅ |

Os demais (FUN-95, 96, 97, 98, 100) seguem como na rodada 1: mesmas asserções, e2e completo verde. Sem enfraquecimento: no diff de `livro-tela-cheia.spec.ts` só saiu o parâmetro `pertoDoPe` (a asserção do pé virou incondicional) e entraram 2 asserções novas; nenhum teste removido ou pulado.

## Verificação fora da amostra do e2e (medido num spec descartável, build limpo)

| Tamanho | Rute 1: pág y / botões y / pé | Capa: pág y / botões y / pé |
|---|---|---|
| 900×600 | 137 / 540 / 16 | 137 / 540 / 16 |
| 1280×800 | 137 / 740 / 16 | 137 / 740 / 16 |
| 1920×1080 | 137 / 1020 / 16 | 137 / 1020 / 16 |
| 1920×1200 | 137 / 1140 / 16 | 137 / 1140 / 16 |

## Sensor (cópia isolada de HEAD, `node_modules` por junção; e2e `livro-tela-cheia`, `capa`, `livro`)

| Mutação | Resultado |
|---|---|
| M1 remove a regra `.livro__aberto:has(.pagina--capa)` | morta: FUN-99 capa 1280×800 e 1920×1080 |
| M2 `margin-top` só `var(--alvo-toque)` (sem o `gap`) | morta: FUN-99 capa 1280×800 e 1920×1080 |
| M3 move a regra para fora do `@media` (vale também na tela estreita) | **sobreviveu**: 43 passaram. Medido: capa em 375×812, 899×800 e 1024×1366 desce de `pagY=69` para 129 e os botões de 77 para 17 px do pé; FUN-102 pede "como estão hoje" |
| M4 `margin-bottom` no lugar de `margin-top` | morta: FUN-99 capa 1280×800 e 1920×1080 |

## Achados

| ID | `arquivo:linha` | Achado e evidência | Correção sugerida | Criticidade | Situação |
|---|---|---|---|---|---|
| A-01 | `src/livro/livro.module.css:279-282`; `e2e/livro-tela-cheia.spec.ts:318,337-338` | Fechado: capa e plano pago reservam a linha do título; botões a 16 px do pé e mesmo `y` que em Rute nos 4 tamanhos largos (tabela acima); M1, M2 e M4 matam o teste | — | comum | fechado |
| A-02 | `e2e/livro-tela-cheia.spec.ts:45-50`; `src/livro/livro.module.css:279` | Nenhum teste mede a capa na tela estreita ou em retrato (FUN-102 só abre Rute 1, `conferirUmaPagina`). O mutante M3 (regra da capa sem o `@media`) mexe 60 px na capa dos celulares e todos os 43 testes passam | Em FUN-102, abrir a capa (`abrirNaCapa`) em 375×812, 899×800 e 1024×1366 e afirmar `pagY` = Rute 1 menos 60 px, ou botões a 77 px do pé; a asserção deve falhar com M3 | comum | aberto |

## Lacunas e o que não foi validado

- Alturas abaixo de 600 px em tela larga seguem fora do critério (FUN-97 vai de 900×600 a 1920×1200).
- Revisão visual no navegador não feita (só `boundingBox`). A falha do `atualizacao.spec.ts` na primeira rodada da cópia veio de `pnpm exec` recusar a junção de `node_modules`; refeito com atalho para o `vite` local e passou.
