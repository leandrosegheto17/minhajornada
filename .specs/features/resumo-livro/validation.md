# Validação: resumo-livro — FAIL ❌ (rodada 3)

- **Data**: 2026-11-20 · **Branch**: feature/resumo-livro @ 1dcae9c · **Árvore**: 7ae543b0314d9331e390468d55a49bdf4f4248c5 · Rodadas anteriores: `git show f8f1466:` (1) e `git show 3cb4188:` (2) deste arquivo
- **Critérios**: 40/40 com asserção localizada, sem parcial · **Gate**: `pnpm typecheck && pnpm test` = 1623 passaram, 0 falharam, 0 pulados; lint verde; e2e 129/129
- **Sensor**: 13 mutações, 12 mortas, 1 sobreviveu equivalente (M7a `'MEMBER'`→`'USAGE'`: a checagem genérica de membresia da T56 cobre os mesmos papéis)
- **Verificador**: PASS; A-13, A-14, A-15, A-17 e A-18 fechados com teste que falha sem a correção
- **Revisão de código**: skill revisao-codigo, modo curto (code-review sobre `3cb4188..HEAD`): 0 achados aceitos, 6 descartados (abaixo)
- **Segurança**: auditor-seguranca: 0 crítico, 0 alto, 1 médio (N-03 → A-19, A-20), 1 baixo (N-04 → A-21)
- **Processo**: teste existente `publicar.test.ts:296` alterado na T54 com aprovação do dono, registrado em `STATE.md`, `## Autorizações`. O dono escolheu seguir com o retrabalho R3 (3ª rodada).

## Critérios que mudaram (os demais herdam da rodada 2)

| Critério | `arquivo:linha` e asserção | Resultado |
|---|---|---|
| FUN-162 | `src/App.test.tsx:502-535`, `aria-pressed` falso depois de ir a Gálatas e voltar | ✅ |
| FUN-172 | `scripts/resumos/publicar.test.ts:193-217`, só recusados remove o livro | ✅ |
| FUN-173, FUN-174 | `publicar.test.ts:220-225` e `:296-312` | ✅ |
| FUN-144 (AD-023) | `servidor/migracoes/conferir-papel.test.ts:109-198`, um teste por ramo | ✅ |
| FUN-147 | `test/arquivos/deploy.test.ts:206-229` | ✅ |

## Achados

| ID | `arquivo:linha` | Achado e evidência | Correção sugerida | Criticidade | Situação |
|---|---|---|---|---|---|
| A-19 | `.github/workflows/deploy.yml:110` | Chamada `SELECT conferir_papel_app('mj_app')` sem schema: papel com CREATE no banco cria o schema `mj_dono` com uma função falsa, e a conferência passa com papel SUPERUSER (sonda N7 do auditor) | `public.conferir_papel_app` com `search_path` fixo (`PGOPTIONS='-c search_path=pg_catalog'`); teste de arquivo | crítica | aberto |
| A-20 | `servidor/migracoes/1795132980000_conferir_papel_app_completa.sql:27-66` | Aceita papel dono do banco (`pg_database_owner`, sem linha em `pg_auth_members`), com CREATE no banco ou num schema, ou dono de schema (sondas N1, N2, N3) | Recusar cada caso, um teste por ramo | crítica | aberto |
| A-21 | mesma migração, `:21-24` e `:47-49` | Aceita `REPLICATION`, `TRIGGER`/`REFERENCES` nas tabelas e SELECT em colunas de `usuarios` fora de `id` e `dono` (ex.: `email`, dado pessoal) (sondas N4, N5, N6) | Recusar cada caso, um teste por ramo | crítica | aberto |
| A-22 | `scripts/resumos/publicar.ts:35-39`; `package.json:13` | `INSERT`/`DELETE` em `resumos` sem schema: a mesma sonda N7 gravou numa tabela falsa `mj_dono.resumos` | Fixar `search_path=public` na conexão do publicar e do `migrar`; teste | crítica | aberto |

## Lacunas e o que não foi validado

- Nível 2 do `/preparar`: Worker no workerd, fumaça de deploy, ids do Hyperdrive e `--caching-disabled` (A-08 fecha lá), `psql` do runner na conferência.
- `glob` e `minimatch` (via `node-pg-migrate`, só no deploy): atualizar quando sair versão nova.
- Descartados da revisão de código: laço dos três grupos redundante com a checagem genérica (estilo), `Down` com `SELECT 1` (o deploy não desfaz; ressalva), escrita em `usuarios` recusada (é a AD-023), `psql` ausente no runner (o `ubuntu-latest` o traz), publicar sem confirmação (a de produção diz quantos remove, FUN-175), `DATABASE_URL_TESTE` vazia no `finally` (o apoio exige antes).
