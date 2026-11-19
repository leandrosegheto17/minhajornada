# Validação: convite-coberto-iphone — PASS ✅ (rodada 2; a rodada 1 foi FAIL pelo A-01)

- **Data**: 2026-11-19 · **Branch**: feature/convite-coberto-iphone @ 718ab88 (rodada 2) · **Árvore**: 5f564a743d229b0f112f987b51de295a79600252 (rodada 1: 0698c75, d832d79)
- **Rodada 2 (retrabalho R1, T3)**: `git diff 0698c75..HEAD --name-only` = só `.specs/` (`STATE.md`, `causa.md`, `tasks.md`, `validation.md`); nenhum código nem teste mudou. Regressão repetida na árvore atual (o `Gate:` do `tasks.md` está na árvore `c61f9af`, anterior ao fechamento): `pnpm typecheck && vitest run --reporter=dot` = 60 arquivos, 1015 testes passaram, 0 falharam; `pnpm lint` (eslint + prettier) verde; `git status --porcelain` vazio. Sensor e e2e completo não repetidos: da rodada 1, código inalterado.
- **Critérios**: 2/2 (o 2 sem a parte do staging, ver Lacunas) · **Gate**: `pnpm typecheck && vitest run` = 60 arquivos, 1015 testes passaram, 0 falharam; `pnpm lint` verde; `pnpm build:e2e && pnpm e2e` = 115 passaram, 0 falharam
- **Sensor**: 1 mutação (a correção desfeita), 1 morta, 0 sobreviveram; 1 mutante pensado (z-index acima da barra) não rodado, equivalente por geometria (ver Lacunas)
- **Revisão de código**: a do PR do projeto (só tarefas de risco baixo) · **Segurança**: não se aplica (site estático, só CSS e e2e)
- **Veredito**: PASS; A-01 fechado, sem achado novo, sem retrabalho

## Critérios (da rodada 1, código inalterado)

| Critério | `arquivo:linha` e asserção | Resultado |
|---|---|---|
| 1. Convite dispensável no iPhone, não volta, cartão visível | `e2e/convite-instalacao.spec.ts:32` — `expect(botao.recebe, ...).toBe(true)` (`elementFromPoint` no botão e, em `:34`, no texto do convite); `:46` `dispensar(page).click({ timeout: 5000 })` + `:47` `toHaveCount(0)`; após `page.reload()` `:50` `esperarInicial` e `:51` `toHaveCount(0)` | ✅ (vizinhos: `entrada.spec.ts` e `aparencia.spec.ts` verdes no e2e completo) |
| 2. E2E local que falha com o defeito e passa com a correção | Sem `z-index: 2` (cópia isolada, porta 4291): FUN-46 falha em `:32` com "o toque no botão cai em SECTION._cartao-inicial_oxljy_69"; FUN-47 `TimeoutError: locator.click: Timeout 5000ms exceeded` ("`<section class=_cartao-inicial_...>` subtree intercepts pointer events"). Com a correção: 2 passed | ✅ local |

## Verificações pedidas (da rodada 1, código inalterado)

- **Reversão**: só a linha `z-index: 2` removida em `git worktree` temporário (`node_modules` por junção, build `dist-e2e` conferido sem a regra, servidor de pré-visualização próprio na porta 4291; nada ouvia em 4173). Vermelho pelo motivo certo; com a correção, verde. E2E completo na cópia: 114 de 115 (a falha é `atualizacao.spec.ts`, que chama `pnpm exec` e quebra na cópia por causa da junção; no worktree real passa).
- **Cenário original e vizinhos**: convite aparece e dispensa (FUN-47); barra `z-index: 3` (`BarraTitulo.module.css:6`) e painel `2` (`PainelAparencia.module.css:15`) ficam acima ou no mesmo nível do convite `2`, sem sobreposição geométrica (barra no topo, convite no rodapé); página inicial, cartão e crédito seguem visíveis nos e2e existentes.
- **Mesmo defeito em outro ponto**: `grep` de `z-index|position` em `src/**/*.css`: o único `fixed` é o convite; os `absolute` sem `z-index` (`global.css:69`, `livro.module.css:253,286`, `TelaCorrecoes.module.css:172`) são ocultos, medida invisível ou decoração e não competem com o convite. Nada além do convite.
- **Diff mínimo** (`git diff desenvolvimento...HEAD`): só `ConviteInstalacao.module.css` (+2: comentário e `z-index`), `e2e/convite-instalacao.spec.ts` (novo) e `.specs/bugs/` (`causa.md`, `tasks.md`). Nenhum teste existente alterado ou apagado; decisão do desenho (`z-index: 2`, molde `PainelAparencia.module.css:15`) seguida.
- **Processo**: commit `9bb089d` cita T1/T2, FUN-46/47 e `Molde:`; o commit de estilo só reformata o e2e (3 linhas). `Gate:` do `tasks.md` está na árvore `e343b43` (anterior ao fechamento) e cobre só typecheck e vitest, então tudo foi repetido na árvore atual. Limpeza: cópia removida, `git status --porcelain` igual ao de antes (vazio), sem banco nem role (não há banco).

## Achados

| ID | `arquivo:linha` | Achado e evidência | Correção sugerida | Criticidade | Situação |
|---|---|---|---|---|---|
| A-01 | `.specs/bugs/convite-coberto-iphone/causa.md:7,18` | `Commit da correção` segue "pendente" (`:7`) e a saída vermelha cita `convite-instalacao.spec.ts:30`, mas o prettier moveu a asserção para `:32` | Preencher `9bb089d` em `:7` e corrigir a referência para `:32` | comum | **fechado** (rodada 2) |

Rodada 2, A-01: `causa.md:7` traz `Commit da correção`: `9bb089d` (existe, é ancestral de HEAD, `fix: convite coberto pela página inicial no iphone`); `causa.md:18` cita `e2e/convite-instalacao.spec.ts:32` e a linha 32 do arquivo é `expect(botao.recebe, ...).toBe(true)`, a asserção citada.

## Lacunas e o que não foi validado

- **E2E não executado: staging.** O "`e2e-geral/sobre-instalacao.spec.ts` verde no staging" (critério 2) só pode ser confirmado depois da publicação em `tst`; não rodei contra o staging. O fluxo do iPhone é o mesmo do e2e local.
- **Precisão do critério 1:** "o cartão continua visível e inteiro" só é provado pelo título visível (`esperarInicial`) e pelos e2e da página inicial; não há asserção de caixa do cartão. Lacuna baixa.
- **Mutante equivalente não rodado:** `z-index` acima de 3 (convite sobre a barra) não é morto por nenhum teste, pois barra e convite não se sobrepõem no iPhone 14 (390 × 664); sem comportamento observável a provar.
