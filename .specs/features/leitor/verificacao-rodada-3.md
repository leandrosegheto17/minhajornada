# Verificação do leitor, rodada 3 (retrabalho R2, T47 / A-12)

- **Branch**: `feature/leitor` @ `8409d60` (árvore `1c90fb1c…`; o HEAD atual `8dfb166` só acrescenta `.specs`). **Diff**: `c0755e9..8409d60`: só `test/arquivos/deploy.test.ts` (+9, 0 removidas).
- **Veredito**: **FAIL** por 1 achado crítico novo (A-13, mutantes vivos no mesmo trecho da fumaça). **A-12 fechado**.
- Esta versão substitui a de `8dfb166` (PASS, de uma verificação paralela). Concordo com ela no A-12, no gate e nas 3 mutações; divirjo por ter mutado também o caminho de falha da fumaça.

## A-12 (FUN-42, laço da fumaça): fechado

`test/arquivos/deploy.test.ts:92` `expect(laco?.[1]?.trim().split(/\s+/)).toEqual(['"/"', '"/sw.js"', '"${livro}"'])`; `:94` `toMatch(/livro="\/livros\/\$\(ls dist\/livros/)`; `:95` `toMatch(/-D - -o \/dev\/null "\$\{URL_PUBLICA\}\$\{caminho\}"/)`. Laço real em `deploy.yml:124`, curl em `:125`.

## Sensor (cópia isolada, `node_modules` por junção, só `deploy.test.ts`; limpa = 13/13)

| Mutante em `deploy.yml` | Resultado |
|---|---|
| M13 tirar `"${livro}"` do laço (viva na rodada 2) | morta (1 falha) |
| M15 tirar `"/"` do laço (viva na rodada 2) | morta (1 falha) |
| M8 tirar `"/sw.js"` | morta (2 falhas) |
| M17 curl lê `${URL_PUBLICA}/` em vez de `${caminho}` | morta (1 falha) |
| M18 `livro="/"` | morta (2 falhas) |
| M20 trocar a ordem do laço | morta (1 falha, igualdade exata; aceitável) |
| M24 tirar `nosniff` da lista de exigidos | morta (1 falha) |
| **M19** `exit 1` -> `true` (`deploy.yml:129`) | **viva** (13/13) |
| **M22** `exit 1` -> `:` | **viva** (igual à M19) |
| **M21** `if ! grep -qi` -> `if grep -qi` (`:127`) | **viva** (13/13) |
| **M23** `curl -fsS` -> `curl -sS` no curl do laço (`:125`) | **viva** (13/13) |

11 mutações: 7 mortas, 4 vivas (3 efeitos distintos). Nenhuma é equivalente. Cópia removida (junção e `git worktree remove`); `git status --porcelain` da árvore real vazio.

## Gate (árvore `1c90fb1c…`, rodado agora)

`pnpm lint && pnpm typecheck && pnpm test --reporter=dot && pnpm build && pnpm e2e --reporter=dot` = **verde**: 27 arquivos e **345** testes, **27** e2e. Sem regressão em relação à rodada 2 (344 + o teste novo).

## Checagens de processo

(a) `testes.json` (`pnpm typecheck && pnpm test`) cobre o único pacote; e2e rodou à parte. OK. (b) `typecheck` verde no HEAD (gate); o único commit de código do R2 (`c22939a`) só acrescenta teste. OK. (c) Teste existente enfraquecido: nenhum (0 linhas removidas em `test/`). (d) `A-12` e `FUN-42` batem com a spec (`spec.md:188`). (e) Banco `teste_*`: não se aplica. (f) RLS/papéis: não se aplica. (g) Sem divergência spec × design nova. Nota: o nome do teste na T47 (`tasks.md:1336`) difere do nome real (`deploy.test.ts:89`); sem efeito.

## Achados

| ID | `arquivo:linha` | Achado e evidência | Correção sugerida | Criticidade |
|---|---|---|---|---|
| A-13 | `test/arquivos/deploy.test.ts:82-98` (fumaça em `.github/workflows/deploy.yml:125-129`) | O caminho de **falha** da fumaça de cabeçalhos (FUN-42) não é provado: trocar `exit 1` por `true`/`:` (M19, M22), inverter `if ! grep` (M21) e tirar `-f` do curl do laço (M23) passam 13/13. A conferência pode virar inócua (nunca falhar, ou falhar em deploy bom e disparar o rollback) sem teste vermelho. Os testes só casam texto de nomes de cabeçalho e caminhos | Teste que extrai o bloco `run` da fumaça, executa em `bash` com `curl` substituído por stub (um com todos os cabeçalhos: sai 0; outro sem `nosniff`/CSP: sai não zero e imprime `::error`), para cada caminho; ou, no mínimo, asserções textuais em `if ! grep -qi`, `exit 1` dentro do laço e `curl -fsS` | crítica (mutante vivo em segurança, na dúvida crítica) |

## Não validado

Execução real do workflow na Actions (`DEPLOY_ATIVO` inativo), cabeçalhos em resposta real da Cloudflare, Node 24 (roda em Node 26).
