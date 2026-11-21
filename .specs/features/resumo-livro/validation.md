# Validação: resumo-livro — PASS ✅ (rodada 6)

**Result**: PASS

- **Data**: 2026-11-20 · **Branch**: feature/resumo-livro @ 04b592c · **Árvore**: 0a631cb7cf1bed9095fea0d877c8390e2b56cfe1 · Rodada 5 (FAIL) abaixo; anteriores em `git show 62c1bef:`, `f8f1466:`, `3cb4188:`, `4a4ac02:`
- **Escopo**: retrabalho R5 (T68, A-30) + regressão · **Critérios**: A-30 fechado (`git grep FUN-144` só aponta sessão e expiração; `deploy.test.ts:206` cita AD-023); nenhuma asserção mudou
- **Gate**: `pnpm typecheck && pnpm test` = 1653 passaram, 0 falharam (92 arquivos); `pnpm lint` verde; sem banco ou papel `teste_*` órfão
- **Sensor**: 0 mutações (diff só de nome e rastreio)
- **Revisão de código**: diff de 1 linha de teste e rastreio no `tasks.md`; sem achado · **Segurança**: sem mudança de superfície; N-08 (risco aceito) e N-09, N-10 (dívida) seguem como na rodada 5

Nenhum achado.

---

## Rodada 5 — FAIL ❌

- **Data**: 2026-11-20 · **Branch**: feature/resumo-livro @ ae4104d · **Árvore**: d55be6c7ed909117248a7db9d68a04c8403562cf · Rodadas anteriores: `git show 62c1bef:` (rodada 4), `f8f1466:`, `3cb4188:` e `4a4ac02:` deste arquivo
- **Critérios**: A-23 a A-27 fechados, cada um com asserção e mutante morto; regressão FUN-137 a FUN-176 pela suíte inteira
- **Gate**: `pnpm typecheck && pnpm test` repetido (árvore mudou desde o `Gate:` 3632a07) = 1653 passaram, 0 falharam (92 arquivos); lint e prettier verdes; e2e não repetido (diff sem interface)
- **Sensor**: 15 mutações, 14 mortas, 1 sobreviveu equivalente (M15: `::name` dentro da migração `1795133160000:106`; sem sobrecarga no `migrar`, o deploy é coberto por M12)
- **Verificador**: typecheck por amostragem (`5a44891`, `80d7d40`, `0a0348d`) verde; sem órfãos no cluster; `testes.json` cobre o pacote único
- **Revisão de código**: modo curto sobre `a05a1fd..ae4104d`: 0 bloqueios, 0 sugestões novas
- **Segurança**: auditor-seguranca: 0 crítico, 0 alto, 1 médio (N-08, risco aceito pelo dono), 2 baixos (N-09, N-10, dívida registrada)
- **Decisões do dono (rodada 5)**: N-08 aceito como risco; N-09 e N-10 como dívida; mudanças de teste do R4 aprovadas (A-28, em `STATE.md` `## Autorizações`); A-30 corrigido trocando o ID para AD-023

## Critérios

| Achado | `arquivo:linha` e asserção | Resultado |
|---|---|---|
| A-23 | `scripts/resumos/publicar.test.ts:236-252` semeia 1 e 3; `toEqual([1])` e sombra `[]` | ✅ fechado (M1) |
| A-24 | `scripts/criar-dono.test.ts:188-224` sombra com tabelas e `crypt`/`gen_salt` falsas; hash `/^\$2[aby]\$12\$/` | ✅ fechado (M2 a M5) |
| A-25 | `servidor/migrar.test.ts:56-75` roda `pnpm migrar`; `status` 0 e `pgmigrations` = nº de `.sql` | ✅ fechado (M13, M14) |
| A-26 | `servidor/test/migracoes/conferir-papel.test.ts:343-365`; `test/arquivos/deploy.test.ts:228-231` | ✅ fechado (M6 a M8, M11, M12) |
| A-27 | `conferir-papel.test.ts:367-376` REFERENCES por coluna nas 3 tabelas | ✅ fechado (M9, M10) |

## Achados

| ID | `arquivo:linha` | Achado e evidência | Correção sugerida | Criticidade | Situação |
|---|---|---|---|---|---|
| A-28 | `test/arquivos/deploy.test.ts:211,215,223`; `servidor/test/migracoes/*.test.ts` | Testes existentes alterados no R4 sem aprovação registrada (nenhum enfraquecido) | Registrar a aprovação | comum | fechado (aprovada pelo dono, `STATE.md` `## Autorizações`) |
| A-29 | `.specs/STATE.md:257` | Linha duplicada de `## Modelo` solta nas decisões; rodada 5 sem registro | Apagar a linha e registrar a rodada | comum | fechado (corrigido no registro desta rodada) |
| A-30 | `test/arquivos/deploy.test.ts:206`; `tasks.md:1521,1541,1562,1607,1628,1649,1753,1775` | A conferência do papel é rastreada como FUN-144, que na spec (`spec.md:77`) é expiração de sessão | Trocar o ID para AD-023 no teste e nas tarefas | comum | fechado (T68, rodada 6) |

## Lacunas e o que não foi validado

- **Risco aceito (N-08, médio):** as migrações `1795132920000:44`, `1795132980000:62`, `1795133040000:80` e `1795133100000:95` chamam `conferir_papel_app('mj_app')` sem `public.` e sem `::name`; num banco ainda não migrado, uma sobrecarga plantada pelo `mj_app` (que tivesse CREATE em public antes da 1ª migração) roda como dono. Aceito pelo dono em 2026-11-20: exige configuração errada e credencial vazada antes do primeiro deploy. Conferir no `/preparar` que o `mj_app` nunca teve CREATE em tst e produção antes do 1º `migrar`.
- **Dívida (N-09, N-10, baixos):** a conferência é lista negativa das 3 tabelas e não vê default privileges, EXECUTE em função SECURITY DEFINER, escrita em `pgmigrations`, definição do `usuario_entrar`, posse de operador/collation/extensão etc., nem MAINTAIN. Correção sugerida: lista positiva via `pg_shdepend` e `pg_default_acl`.
- Nível 2 do `/preparar`: Worker no workerd, fumaça de deploy, Hyperdrive com `--caching-disabled` (A-08), `DATABASE_URL_DONO` pela conexão direta do Neon (o pooler recusa `PGOPTIONS`).
- `glob` e `minimatch` via `node-pg-migrate` (moderados); `osv-scanner` e `semgrep` não instalados; aviso DEP0190 do `spawnSync` com `shell: true` no teste A-25.
