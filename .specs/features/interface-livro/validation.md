# Validação: interface-livro — FAIL ❌ (rodada 2)

- **Data**: 2026-11-18 · **Branch**: feature/interface-livro @ aef10c1 · **Árvore**: 4d30bd26cbc6d4698402a6e116a3eb36aa44cf73
- **Critérios**: 44/44 com evidência; A-14 com prova parcial (A-15) · **Gate**: reaproveitado de `tasks.md` (`pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm e2e @ 77a673a = verde`; `354415c..aef10c1` só muda `tasks.md`). Conferido na cópia limpa: typecheck, lint, Vitest 41 arquivos / 620 testes, e2e `livro`, `capa`, `entrada` 25 passaram
- **Sensor**: 15 mutações, 12 mortas, 3 sobreviveram (M1 `destinoDaCapa` `larga`→`false`; M5 `mesmaAncora` ignora a fatia; M9 reducer descarta a fatia), 0 equivalentes
- **Revisão de código**: skill revisao-codigo, modo curto (code-review) sobre `c9108ac..HEAD`: 7 apontamentos, 0 confirmados. Descartados: largura e `min-height` da `.medida` (o contêiner também tem a classe `.pagina`, `TelaLivro.tsx:219`, e herda `aspect-ratio` e `min-height`; e2e de 1280 px verde); fatia não inteira e `NaN` em `paginaDoVersiculo` (a única origem é `TelaLivro.tsx:54-55`, inteiro ≥ 0; a âncora não é gravada nem vem de fora); fatia pelo primeiro versículo da página (comportamento de AD-007/FUN-85); rótulo "Capa" no Sobre com âncora `pago` (o leitor volta ao lugar certo); `isConnected` sem zerar a medida (o próximo nó remede antes da pintura)
- **Segurança**: não se aplica (site estático, sem login, dado pessoal nem servidor); `public/_headers` inalterado

## Critérios

Rastreio da rodada 1 mantido (ver histórico do arquivo). Achados da rodada 1:

| Achado | `arquivo:linha` e asserção | Resultado |
|---|---|---|
| A-11 | `src/livro/useMedidas.test.ts:204` alturas com margem `[30, 70]`; `e2e/livro.spec.ts:86` Rute em 1280 × 800 sem linha cortada nem escondida | ✅ fechado |
| A-14 | `src/livro/paginacao.test.ts:313,322`; `src/telas/TelaLivro.test.tsx:288-340` `comFatia(3, 1)` | ⚠️ parcial (A-15) |
| A-01 | `test/arquivos/paginacao-66.test.ts:27` 66 livros, cada bloco uma vez e em ordem | ✅ fechado |
| A-12 | `src/livro/useMedidas.test.ts:109` remede e observa o nó novo | ✅ fechado |
| A-13 | `src/App.test.tsx:215`; `src/estado/leitor.test.ts:446` | ✅ fechado |
| A-02 | `src/telas/TelaLivro.test.tsx:357,374`; `e2e/capa.spec.ts:39` | ✅ fechado (resta a capa: A-16) |
| A-03 | `src/telas/TelaLivro.test.tsx:351`; `src/estado/leitor.test.ts:461,473`; `e2e/livro.spec.ts:152` | ✅ fechado |
| A-04 | `src/estilo/estilo.test.ts:125` suave × superfície ≥ 4,5 por tema | ✅ fechado |
| A-05 | `e2e/entrada.spec.ts:21` `boundingBox` da foto | ✅ fechado |
| A-06 | `e2e/entrada.spec.ts:167,178` 479 e 480 px | ✅ fechado |
| A-07 | `e2e/entrada.spec.ts:202` 320 e 1920 px nas 4 telas | ✅ fechado |
| A-08 | `test/arquivos/icones-png.test.ts:89` pixel branco em (190, 260) | ✅ fechado |
| A-09 | `tasks.md` `Gate:` completo da árvore `77a673a` | ✅ fechado |

## Achados

| ID | `arquivo:linha` | Achado e evidência | Correção sugerida | Criticidade | Situação |
|---|---|---|---|---|---|
| A-15 | `src/estado/leitor.ts:86-96`, `:192` | A correção de A-14 depende do estado guardar a fatia, mas nenhum teste de reducer, `App` ou e2e usa `fatia`: M5 (`mesmaAncora` ignora a fatia) e M9 (reducer descarta a fatia) sobreviveram à suíte unitária e ao e2e; com eles "Seguinte" volta a travar | Teste de `reduzirLeitor` com `fatia: 1` e teste no `App` passando as 3 fatias | crítica | aberto (T43) |
| A-16 | `src/telas/TelaLivro.tsx:106` | M1 (`destinoDaCapa` com `larga`→`false`) sobreviveu: nada clica "seguinte" a partir da capa na tela larga (FUN-89) | Teste de `TelaLivro` com `larga: true` e âncora `capa`/`pago` | comum | aberto (T44) |

## Lacunas e o que não foi validado

- Fidelidade visual ao mockup, iOS e toque real, desempenho da paginação de Salmos, CI com Node 24 (local 26.13). Build e e2e completos não repetidos (gate reaproveitado pela árvore).
- A-01 prova a paginação dos 66 livros com alturas sintéticas, não medidas no navegador; FUN-75 em e2e só em Rute a 1280 × 800.
- Rolagem lateral provada em 320 e 1920 px, não em toda a faixa.
