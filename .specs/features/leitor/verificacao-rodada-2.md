# Verificação da feature `leitor`, rodada 2 (retrabalho R1)

- **Data**: 2026-11-15 · **Branch**: `feature/leitor` @ `c0755e9` · **Árvore**: `73559d05e6cbd0c91960bc14c9df35d7bd136175` · **Diff**: `5a6b8af..HEAD` (11 commits)
- **Veredito**: **FAIL** por 1 achado crítico novo (A-12, mutante vivo na fumaça do deploy). A-01 a A-11 estão **corrigidos**.

## Gate (rodado de novo)

O `Gate:` do `tasks.md` (`@ 4d15aef…`) não é desta árvore: o commit `c0755e9` (prettier em `TelaLeitor.test.tsx`) veio depois. Rodado inteiro: `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm e2e` = **verde**: 27 arquivos e **344** testes unitários (eram 324: +2 mouse/pen, +4 livros, +2 convite, +12 deploy) e **27** e2e (eram 25). `pnpm audit --audit-level high`: 0 altas (3 vulnerabilidades: 1 baixa, 2 moderadas).

## Achados da rodada 1

| ID | Estado | Evidência (`arquivo:linha` e asserção) |
|---|---|---|
| A-01 | corrigido | `src/telas/TelaLeitor.tsx:77` `if (!evento.isPrimary \|\| evento.pointerType !== 'touch') return;`; `TelaLeitor.test.tsx:190-200` (`it.each(['mouse','pen'])`, `deslizar(100,0,tipo)` e `(-100,0,tipo)`, `aoSeguinte`/`aoAnterior` `not.toHaveBeenCalled`) |
| A-02 | corrigido | `e2e/leitura.spec.ts:35-56` FUN-01 (`numero.x + numero.width <= texto.x`, `caixa.y >= fimAnterior`, colunas = 1) e `:58-72` FUN-02 (`fontStyle` do `em` = `italic`, do texto = `normal`) |
| A-03 | corrigido | `.specs/STATE.md` `## Autorizações`, 3 linhas (convite, aparência 320 px, R1 T36/T41/T42) |
| A-04 | corrigido | `STATE.md` AD-004 (cita FUN-36, escopo `useLeitor.ts`); `src/estado/useLeitor.ts:72` cita "AD-004" |
| A-05 | corrigido, com ressalva | `deploy.yml:124-126` (`/`, `/sw.js`, livro; CSP com `frame-ancestors`, `default-src`, `object-src`, nosniff, `same-origin`); teste `test/arquivos/deploy.test.ts:82-98`. Ressalva: **A-12** |
| A-06 | corrigido | `ConviteInstalacao.test.tsx:42` `Reflect.deleteProperty(navigator,'maxTouchPoints')`; `:92-100` `Object.hasOwn(...)` `true` e depois `false` |
| A-07 | corrigido | `e2e/aparencia.spec.ts:116` `expect(region 'Aparência').toBeHidden()` antes do clique no título |
| A-08 | corrigido | `deploy.yml:56-80` job `construir` sem segredo e sem environment, envia `dist/`; `:90-96` sem token no `env` do job; token só em `:114-116` e `:136-139` (wrangler deploy e rollback); `:106` `--ignore-scripts`, sem `cache:` no `publicar`; `deploy.test.ts:36-76` |
| A-09 | corrigido (conferido, depende do dono para mudar) | `.specs/preparacao.md:20` registra a regra. `gh api` somente leitura por mim: `tst` → `desenvolvimento`, `producao` → `main`, `custom_branch_policies: true` nos dois |
| A-10 | corrigido | `src/dados/livros.ts:37-45` `lerLivro` (`numero` e `Array.isArray(capitulos)`), `:77-78` valida antes do `cache.put` (`:82`), `:59-62` apaga entrada ilegível; `livros.test.ts:62-93` (text/html, outro livro, sem capítulos: `caminhos(CACHE_LIVROS)` = `[]` e `LivroNaoBaixado`; entrada ilegível: `delete` 1×, rede 1×) |
| A-11 | corrigido | `package.json` wrangler `4.162.0`; `pnpm audit --audit-level high` sem altas |

## Achados novos

| ID | `arquivo:linha` | Achado e evidência | Correção sugerida | Criticidade |
|---|---|---|---|---|
| A-12 | `test/arquivos/deploy.test.ts:82-87` | A prova do A-05 não fixa os caminhos conferidos. Mutantes **vivos** (12 de 12 testes passam): (M13) tirar `"${livro}"` do `for caminho in "/" "/sw.js" "${livro}"` (`deploy.yml:124`); (M15) tirar `"/"` do mesmo laço. Os `toMatch` (`/\/sw\.js/`, `/\/livros\//`, `${URL_PUBLICA}/`) casam com a linha `livro=...` e o `curl` simples da linha 122, que não olha cabeçalho. A fumaça de cabeçalhos (FUN-42) pode voltar a cobrir só `/sw.js` sem nenhum teste falhar. Não equivalentes | Teste que extrai a lista do `for caminho in ...` e exige exatamente `/`, `/sw.js` e `${livro}`; vermelho ao tirar cada um | crítica (mutante vivo em segurança/contrato, FUN-42) |

## Sensor (sobre o diff do R1, cópia isolada com `node_modules` por junção)

16 mutações: **14 mortas, 2 vivas (A-12)**.

- `TelaLeitor.tsx`: M1 sem checar `touch` (morta, 2 testes); M2 só `mouse` bloqueado, caneta passa (morta pelo caso `pen`).
- `livros.ts`: M3 sem conferir `numero` (morta); M4 sem `Array.isArray` (morta); M5 sem `cache.delete` da entrada ruim (morta); M6 cache lido sem validar (morta).
- `deploy.yml` (só `deploy.test.ts`): M7 token no `env` do job `construir` (morta, 2); M8 sem `/sw.js` no laço (morta); M9 sem `--ignore-scripts` (morta); M10 sem `frame-ancestors` (morta); M11 cache pnpm no `publicar` (morta); M12 token no passo `pnpm install` (morta); M14 `publicar` volta a rodar `pnpm build` (morta); M16 sem `nosniff` (morta); **M13 e M15 vivas**.
- e2e (um build e uma rodada, `leitura.spec.ts`): M-E1 `font-style: normal` no `em` (morta: FUN-02); M-E2 `order: 2` no número (morta: FUN-01). Contam como 2 das 14.
- Não mutados: afirmação do A-07 (não muda comportamento do app) e a ordem dos testes do A-06 (o par de testes `:92-100` prova o isolamento).
- Cópia descartada (`git worktree remove`, junção removida, preview encerrado). `git status --porcelain` da árvore real: só `.specs/features/leitor/seguranca.md` modificado, **não por mim** (o `auditor-seguranca` roda em paralelo e acrescentou o "Reteste rodada 2").

## Checagens de processo

- (a) `testes.json` (`pnpm typecheck && pnpm test`) cobre o único pacote; o e2e roda à parte e entrou no gate. OK.
- (b) `typecheck` fecha verde em `a75a101`, `6d3a7e3` e `c0755e9` (último, pelo gate). OK.
- (c) Testes existentes alterados: helper `deslizar` (T36), `afterEach` do convite (T41), `aparencia.spec.ts:116` (T42), todos cobertos por `## Autorizações` (linha R1); `livros.test.ts`, `leitura.spec.ts` e `deploy.test.ts` só acrescentam. O commit `c0755e9` só reformata (prettier). OK.
- (d) IDs `FUN-NN` dos testes novos batem com a spec (FUN-01, 02, 16/17, 34, 36, 42, 43, 46). OK.
- (e) Banco, role e dado `teste_*`: não se aplica (sem banco).
- (f) Autorização por comando: não se aplica (sem RLS ou papéis).
- (g) AD-004 existe, cita FUN-36 e é referenciada no código. Sem outra divergência spec × design.
- Observação: o `Gate:` do lote R1 ficou numa árvore anterior ao `c0755e9` (lint vermelho no fechamento, corrigido depois sem registrar de novo). Refeito aqui, verde; sem achado.

## Não validado

Execução real do workflow na Actions (`DEPLOY_ATIVO` ainda inativo; inclui o `pnpm install --ignore-scripts` + `wrangler deploy` sem scripts de dependência), cabeçalhos em resposta real da Cloudflare, instalação em Chrome e Safari reais, execução em Node 24 (rodou em Node 26).
