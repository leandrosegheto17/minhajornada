# Verificação do leitor, rodada 3 (retrabalho R2, só a T47)

Veredito: **PASS**. A-12 fechado, nenhum achado novo. HEAD 8409d60, árvore 1c90fb1. Diff de código `c0755e9..HEAD`: só `test/arquivos/deploy.test.ts` (+9, 0 linhas removidas).

## A-12 (FUN-42: laço da fumaça) — fechado

| Critério | Evidência | Resultado |
|---|---|---|
| FUN-42: o laço confere `/`, `/sw.js` e o livro | `test/arquivos/deploy.test.ts:89-96`: `expect(laco?.[1]?.trim().split(/\s+/)).toEqual(['"/"', '"/sw.js"', '"${livro}"'])` (linha 92); mais `toMatch(/livro="\/livros\/\$\(ls dist\/livros/)` (94) e `toMatch(/-D - -o \/dev\/null "\$\{URL_PUBLICA\}\$\{caminho\}"/)` (95). Laço real em `.github/workflows/deploy.yml:124`. | OK |

## Sensor (3 mutações em deploy.yml, cópia isolada com junção, só `deploy.test.ts`)

| Mutante | Resultado |
|---|---|
| M1: tirar `"${livro}"` do laço (as duas sobreviventes da rodada 2) | morto, falha em `deploy.test.ts:92` (falta `"${livro}"`) |
| M2: tirar `"/"` do laço (a outra sobrevivente da rodada 2) | morto, falha em `deploy.test.ts:92` (falta `"/"`) |
| M3: tirar `"/sw.js"` | morto, 2 testes falham (a asserção nova e o teste de `/sw.js` já existente) |

3 mortas, 0 vivas. A cópia limpa passou 13/13 em `deploy.test.ts`. Cópia descartada (worktree `_mut` removida; `git status --porcelain` da árvore real vazio, antes e depois). Obs.: `pnpm test --project arquivos` na cópia tentou `pnpm install` por causa da junção (recusou apagar o `node_modules` real), então os mutantes rodaram com `node node_modules/vitest/vitest.mjs run --project arquivos --reporter=dot test/arquivos/deploy.test.ts`.

## Gate (árvore atual, rodado agora)

| Comando | Resultado |
|---|---|
| `pnpm lint` | verde (eslint e prettier) |
| `pnpm typecheck` | verde |
| `pnpm test` | 27 arquivos, 345 testes, 0 falhas |
| `pnpm build` | verde |
| `pnpm e2e` (uma vez, segundo plano) | 27 passaram, 0 falharam |

## Checagens de processo

- Teste existente alterado ou enfraquecido: não. O diff de `test/` só acrescenta (9 linhas adicionadas, 0 removidas).
- Commit da T47 (`c22939a`, só o teste; o único commit de código da rodada) fecha verde: o `typecheck` e a suíte da árvore atual passam; o commit não importa nada novo.
- IDs: o teste novo cita `A-12` e `FUN-42`, e `FUN-42` é o requisito de cabeçalhos da spec. O molde (`deploy.test.ts:82-98`) foi registrado no commit.
- `Gate:` da T47 registrado no `tasks.md` (`pnpm typecheck && pnpm test @ 2e8708d… = verde`); a árvore atual difere só por arquivos de `.specs`, e o gate completo foi repetido acima.
- Cluster: esta rodada não toca banco e não criou banco, role ou dado `teste_*`.

## Achados novos

Nenhum.

Observação de processo (não é achado): existe a worktree `.worktree/_mut_r3` (detached em 8409d60) que não é desta verificação. Parece sobra de outra sessão; convém removê-la ao fim.
