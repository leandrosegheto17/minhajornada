# Validação: livro-tela-cheia — PASS ✅ (rodada 3)

- **Data**: 2026-11-18 · **Branch**: feature/livro-tela-cheia @ c4d897f · **Árvore**: 73ebb8ab1b34e127b30afb06432980fa0bb4ba76 (código = árvore `42ecb71` do commit e9d3ed7; HEAD só difere por `tasks.md`)
- **Escopo**: diff do retrabalho R2 (`e9d3ed7`: só `e2e/livro-tela-cheia.spec.ts` +23, nenhum `src` tocado) mais regressão. Critérios, mutações e revisão das rodadas 1 e 2 valem para o resto (nada mais mudou em `src`).
- **Critérios**: 8/8 com asserção (FUN-95 a FUN-102) · **Gate**: `Gate:` de T8 vale (mesma árvore de código, `42ecb71`), mas é filtrado; refeito inteiro numa cópia limpa do HEAD: typecheck (2 tsconfig), eslint e prettier verdes, Vitest 42 arquivos / 631 testes passaram, 0 falharam, build verde, e2e completo 85 passaram, 0 falharam
- **Sensor**: 3 mutações, 3 mortas, 0 sobreviveram (equivalentes: 0); das rodadas anteriores: 15 de 17 mortas até a rodada 2 (M3 era o sobrevivente, agora morto; 1 equivalente na rodada 1)
- **Revisão de código**: diff só de testes lido por mim, modo curto; bloqueios 0, sugestões 0
- **Segurança**: não se aplica: só testes (rodada 2: CSS), sem servidor nem `style` inline

## Critério alterado pelo retrabalho

| Critério | `arquivo:linha` e asserção | Resultado |
|---|---|---|
| FUN-102 | `e2e/livro-tela-cheia.spec.ts:78-88` (laço 375×812, 899×800, 1024×1366, `abrirNaCapa`): `expect(Math.abs(pagina.y - 69)).toBeLessThanOrEqual(TOL)` e `expect(Math.abs(pe - (ant.y + ant.height) - 77)).toBeLessThanOrEqual(TOL)`; `:45-50` (Rute 1) inalterado | ✅ |

Os demais seguem como nas rodadas 1 e 2 (e2e completo verde). Valores 69 e 77: `src` não mudou desde antes do R1, exceto a regra de 4 linhas dentro do `@media (min-width: 900px) and (orientation: landscape)` (`git diff 4b256d2^ HEAD -- src`), então a tela estreita e o retrato medem hoje o que mediam antes da feature; 69 coincide com o `pagY` de Rute 1 e com a medição da rodada 2. A asserção vem de FUN-102 ("como estão hoje"), não do código novo. Sem enfraquecimento: o diff só acrescenta 23 linhas, nenhum teste removido, pulado ou alterado.

## Sensor (cópia isolada de HEAD, `node_modules` por junção; `e2e/livro-tela-cheia.spec.ts`, build refeito por mutante)

| Mutação | Resultado |
|---|---|
| M3 (rodada 2) move a regra `.livro__aberto:has(.pagina--capa)` para fora do `@media` | **morta**: 3 falhas, `capa 375×812`, `capa 899×800` e `capa 1024×1366` |
| M5 `@media (min-width: 900px)` sem `and (orientation: landscape)` (o retrato 1024×1366 entra na regra larga) | morta: `capa 1024×1366` e o teste de Rute 1 do mesmo tamanho |
| M6 `margin-top: 2px` na capa só na tela estreita e no retrato (desvio de 2 px, acima de TOL = 1) | morta: as 3 capas |

## Achados

| ID | `arquivo:linha` | Achado e evidência | Correção sugerida | Criticidade | Situação |
|---|---|---|---|---|---|
| A-01 | `src/livro/livro.module.css:279-282`; `e2e/livro-tela-cheia.spec.ts:318,337-338` | Capa e plano pago reservam a linha do título; sem regressão (e2e completo 85/85) | — | comum | fechado |
| A-02 | `e2e/livro-tela-cheia.spec.ts:78-88` | A capa agora é medida nos 3 tamanhos estreitos/retrato; M3 morre (3 falhas), M5 e M6 também | — | comum | fechado |

## Lacunas e o que não foi validado

- Alturas abaixo de 600 px em tela larga seguem fora do critério (FUN-97 vai de 900×600 a 1920×1200).
- Revisão visual no navegador não feita (só `boundingBox`). Na cópia, `pnpm` recusa a junção de `node_modules` (verificação de dependências): rodei as ferramentas direto pelo Node e o `atualizacao.spec.ts` (que chama `pnpm exec vite build`) com o `vite` local, e ele passou; sem junção, no repositório real, o `pnpm` roda normal.
