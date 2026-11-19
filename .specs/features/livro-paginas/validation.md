# Validação: livro-paginas — PASS ✅ (rodada 2, retrabalho R1)

- **Data**: 2026-11-19 · **Branch**: feature/livro-paginas @ 9b48217 · **Árvore**: 6a70f269cfb8c2dc05c4989e382c825151a5e257
- **Rodada 2**: o diff `2daa1ec..HEAD` toca só `.specs/STATE.md`, `spec.md`, `tasks.md` e `validation.md`; `git diff c40f9a6..HEAD -- . ':!.specs'` vazio: nenhum código nem teste mudou desde a rodada 1. A-01 fechado (AD-021 em `STATE.md:217-223` e nota em `spec.md:81`, coerentes entre si e com `tasks.md`)
- **Critérios**: 9/9 com asserção (da rodada 1, código inalterado) · **Gate**: `pnpm typecheck && pnpm exec vitest run --reporter=dot` = verde, 60 arquivos e 1015 testes passaram, 0 falharam (repetido na árvore atual, pois o `Gate:` do `tasks.md` é de outra árvore); `pnpm lint` (eslint e prettier) verde; e2e `livro`, `livro-tela-cheia` e `capa` = 70 passaram, 0 falharam (da rodada 1, código inalterado)
- **Sensor**: 8 mutações, 7 mortas, 1 sobreviveu (equivalente: 1); a mais, M2c, também morreu (da rodada 1, código inalterado, não repetido)
- **Revisão de código**: modo curto sobre o diff contra `desenvolvimento` (rodada 1): bloqueios 0, sugestões 0; sem código novo na rodada 2
- **Veredito**: PASS; sem achado aberto, sem retrabalho novo
- **Segurança**: não se aplica: site estático, sem servidor, sem dado do usuário virando HTML (`tasks.md`, "Segurança padrão de app web")

## Critérios (da rodada 1, código inalterado)

| Critério | `arquivo:linha` e asserção | Resultado |
|---|---|---|
| FUN-128 | `src/livro/paginacao.test.ts:236` — `paginar([30,30,30,30],…,[f,f,t,f])` dá `[[0,1],[2,3]]`; `test/arquivos/paginacao-66.test.ts:60-96` — nos 66 livros, com 300 e 60 px, `pagina.partes[0]` é `{bloco:i, recorte:0}` em todo capítulo ≥ 2; `e2e/livro.spec.ts:172` — `esperarCapituloNoTopo(page, 21)` em 1920 × 1080 e 390 × 844 (`topo.y - caixa.y < 80`, número como primeiro `p`) | ✅ |
| FUN-129 | `src/livro/paginacao.test.ts:244` — resto da página fica em branco (`usado < PAGINA`); `e2e/livro.spec.ts:179` — página antes do 21 sem `Capítulo 21` e `locator('p').last()` com `/^18\D/`, nas duas telas | ✅ |
| FUN-130 | `src/livro/paginacao.test.ts` (`quebrasDoLivro`) — `quebras[0]` e `quebras[1]` falsos em Rute; Judas sem quebra; `paginacao-66.test.ts` — `pagina.partes[0].bloco` é 0 no 1:1; `e2e/livro.spec.ts:189` — "Gênesis" (h2) e `Capítulo 1` na primeira página | ✅ |
| FUN-131 | `e2e/livro.spec.ts:203` — achado um par em que a página da direita tem o número do capítulo (> 1) como primeiro `p` e a da esquerda tem `Capítulo N` com contagem 0 (1920 × 1080) | ✅ |
| FUN-132 | `src/livro/paginacao.test.ts:266` — bloco de 250 depois da quebra vira `[{0},{100},{200}]` a partir do topo, e `:290` — os blocos seguintes continuam enchendo a página (`[[0,1],[2,3,4,5]]`) | ✅ |
| FUN-133 | `e2e/livro-tela-cheia.spec.ts:441` — `abs(b.x - (a.x + a.width) - 32) <= TOL` em 900 × 600, 1280 × 800, 1920 × 1080 e 1920 × 1200; capa: `:518`; `test/arquivos/livro-css.test.ts` — `column-gap: var(--vao-paginas)` | ✅ |
| FUN-134 | `e2e/livro-tela-cheia.spec.ts:472` — `linha.width === 1`, `linha.cor === corDaBorda`, centro da linha a ≤ TOL do centro do vão e `abs(linha.height - a.height) <= TOL`, nos temas claro, escuro e sépia; capa: `:518` | ✅ |
| FUN-135 | `e2e/livro-tela-cheia.spec.ts:450` — `abs(a.width - (util - 48 - 32)/2) <= TOL`, larguras iguais, margens de 24 px, `scrollWidth <= innerWidth`, nos quatro tamanhos; `livro-css.test.ts` — fórmula com `var(--vao-paginas)` e `.livro__aberto`/`.medida` leem a mesma variável | ✅ |
| FUN-136 | `e2e/livro-tela-cheia.spec.ts:539` — em 390 × 844 e 1024 × 1366: `toHaveCount(1)`, `linha.content === 'none'`, cantos iguais a `--raio-m` | ✅ |

Decisões da Base: seguidas (vão em `--vao-paginas: var(--esp-8)`, `max-width` de cabeça e navegação somado ao vão, linha em pseudo-elemento de `.livro__aberto`, `quebras` opcional em `paginar`, capítulo 1 sem quebra). Spec × design: sem divergência. Testes existentes alterados (`TelaLivro.test.tsx`, `livro-css.test.ts`) estão autorizados em `STATE.md` (2026-11-19, T3 e T5); nenhum enfraquecido. O teste de FUN-96 (`e2e/livro-tela-cheia.spec.ts:171`) já descontava o vão sem mudança e continua verde. Typecheck de 073d3c9, e58b348 e c40f9a6: verde. Pacotes: workspace de um pacote só, coberto pelo `testes.json` (que não inclui o e2e, como o próprio arquivo registra). Sem banco, role ou policy.

## Sensor (da rodada 1, código inalterado; cópia isolada em pasta temporária, `node_modules` por junção, descartada; `git status --porcelain` igual ao de antes: vazio)

| Mutação | Teste que a matou | Resultado |
|---|---|---|
| M1 `paginacao.ts`: remove `if (quebras?.[bloco]) fechar()` | `paginacao.test.ts` (5 testes) e `paginacao-66.test.ts` (2) | morta |
| M2 `quebrasDoLivro`: `capitulo > 1` → `> 0` | `paginacao.test.ts` (4), `paginacao-66.test.ts` (1) | morta |
| M2c `capitulo > 1` → `> 2` | `paginacao.test.ts` (2) | morta |
| M3 `TelaLivro.tsx`: `paginar` sem `quebrasDoLivro` | `TelaLivro.test.tsx` (FUN-84/71 e FUN-77) | morta |
| M4 CSS: remove `column-gap` | e2e FUN-133, FUN-135, FUN-96, FUN-98, FUN-99, FUN-101 | morta |
| M5 CSS: linha com `--cor-texto` em vez de `--cor-borda` | e2e FUN-134 (3 temas) | morta |
| M6 CSS: tira `.pagina--direita` do seletor de cantos | nenhum: `.pagina` já está na lista e vem depois no arquivo | equivalente |
| M6b CSS: apaga a regra dos quatro cantos | e2e FUN-133 (cantos) | morta |
| M7 CSS: linha com `bottom: 10px` | e2e FUN-134 (`altura 577 × 587`) | morta |

## Achados

| ID | `arquivo:linha` | Achado e evidência | Correção sugerida | Criticidade | Situação |
|---|---|---|---|---|---|
| A-01 | `spec.md:81`, `e2e/livro.spec.ts:239-252` | O caso limite "trocar a letra repagina com a regra de FUN-128" não tem prova: o e2e de FUN-86 só afirma que o 21 continua no topo, e diz no comentário que não afirma repaginação (defeito anterior à feature, `.specs/bugs/letra-livro-sem-repaginar/relato.md`; `useMedidas.ts` e `useLeitor.ts` não estão no diff, e eu não reproduzi o defeito na `desenvolvimento`). A exclusão foi decisão do dono na execução, gravada só no `tasks.md:168`; a spec ainda diz SHALL e o `STATE.md` não a registra | Registrar a decisão em `STATE.md` (AD ou `## Autorizações`) e acrescentar à spec que esse caso limite fica com o bug `letra-livro-sem-repaginar`; ou, se o dono preferir, corrigir o bug antes de integrar. Não gera código na feature | comum | fechado |

A-01, rodada 2: fechado. `STATE.md:217` registra a AD-021 (decisão do dono, escopo `e2e/livro.spec.ts:239-252` e a linha da spec) e `spec.md:81` diz que a troca de letra fica com o bug `letra-livro-sem-repaginar`, restando provado só que o capítulo continua no topo (FUN-86). Não há código no retrabalho; sem regressão (suíte e lint verdes).

## Lacunas e o que não foi validado

- Lacuna de precisão: nenhuma na spec; o espaço de 32 px e a linha de 1 px estão com valores exatos e medidos no navegador.
- A tolerância `TOL` do e2e (±1 px) não distingue um deslocamento de 0,5 px da linha; mutante nesse deslocamento não foi tentado.
