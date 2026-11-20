# Validação: resumo-livro — FAIL ❌ (rodada 2)

- **Data**: 2026-11-20 · **Branch**: feature/resumo-livro @ defe00a · **Árvore**: 333e4e49e5ea136f72a7c4d3180a432997fa7f92 · Rodada 1: `git show f8f1466:.specs/features/resumo-livro/validation.md`
- **Critérios**: 40/40 com asserção localizada; FUN-162 parcial (A-13), FUN-172 com furo (A-14) · **Gate**: `pnpm typecheck && pnpm test` = 1606 passaram, 0 falharam, 0 pulados; lint e prettier verdes; e2e 129/129
- **Sensor**: 10 mutações, 8 mortas, 2 sobreviveram, não equivalentes (M2 `App.tsx:42` → A-13; M11a `conferir_papel_app.sql:23` → A-15)
- **Revisão de código**: skill revisao-codigo, modo curto (code-review sobre `795b6f0..HEAD`): 1 achado aceito (= A-14), 6 descartados (abaixo)
- **Segurança**: auditor-seguranca: 0 crítico, 0 alto, 0 médio, 3 baixos (N-01 → A-17, N-02 = A-14, dependências como ressalva)
- **Achados da rodada 1**: A-01 a A-07 e A-09 a A-12 fechados com teste que falha sem a correção; A-08 fechado no código (registro e teste), Hyperdrive real fica no Nível 2; A-16 (teste alterado) aprovado pelo dono e registrado em `STATE.md`, `## Autorizações`

## Critérios

| Critério | `arquivo:linha` e asserção | Resultado |
|---|---|---|
| FUN-137 a 151 | sem mudança no retrabalho; `scripts/criar-dono.test.ts:142-235`; `test/arquivos/deploy.test.ts:176-200` | ✅ |
| FUN-152 | `test/arquivos/resumos-fora-do-git.test.ts:127`, varre todo `*.json` | ✅ |
| FUN-153 | `src/App.test.tsx:421` (sessão comum sem botão); `e2e/resumo.spec.ts:186` | ✅ |
| FUN-154 a 161, 163 a 169 | e2e verde; `src/livro/PaginaResumo.test.tsx:44` | ✅ |
| FUN-162 | `src/App.test.tsx:490` só cobre a troca de largura | ⚠️ parcial (A-13) |
| FUN-170 a 172 | `src/revisao-resumos/pagina.test.ts` (A-05, A-06); `logica.test.ts:46-60` | ✅ |
| FUN-172 a 176 | `scripts/resumos/publicar.test.ts:141-236` | ⚠️ furo (A-14) |

## Achados

| ID | `arquivo:linha` | Achado e evidência | Correção sugerida | Criticidade | Situação |
|---|---|---|---|---|---|
| A-13 | `src/App.tsx:42`; `src/App.test.tsx:490` | Falta o teste "ligar em Gênesis, ir a Êxodo e voltar" prometido na T50; M2 (`[larga]`) sobrevive | Teste da troca de livro na tela estreita, que morre com M2 | comum | aberto |
| A-14 | `scripts/resumos/publicar.ts:65-69` | Arquivo só com recusados (e propostas) sai em "Nada a publicar" antes de apagar: o livro recusado continua no banco (sonda do verificador; code-review; N-02) | "Nada a publicar" só sem aprovados e sem recusados; teste do caso | crítica | aberto |
| A-15 | `servidor/migracoes/1795132920000_conferir_papel_app.sql:23`; `conferir-papel.test.ts:74-104` | M11a (`'MEMBER'` → `'USAGE'`) sobrevive: nenhum teste com papel `NOINHERIT` membro de `neon_superuser` ou `pg_*_all_data` | Variante NOINHERIT dos três testes de grupo | crítica | aberto |
| A-17 | `servidor/migracoes/1795132920000_conferir_papel_app.sql:26-38` | Privilégio herdado por `SET ROLE` (papel NOINHERIT membro de outro grupo) e TRUNCATE em `resumos`/`usuarios`/`sessoes`, escrita em `usuarios` passam na conferência (sonda do auditor, N-01) | Recusar qualquer membresia; conferir TRUNCATE e INSERT/UPDATE/DELETE em `usuarios`; um teste por ramo | crítica | aberto |
| A-18 | `.github/workflows/deploy.yml:86-107` | A conferência roda uma vez, como migração: papel alterado depois no Console não é conferido (N-01) | `SELECT conferir_papel_app('mj_app')` a cada deploy no job `migrar`, depois da migração; teste de arquivo | crítica | aberto |

## Lacunas e o que não foi validado

- Worker no workerd, fumaça de deploy, ids do Hyperdrive e `--caching-disabled` no Neon real: Nível 2 do `/preparar` (A-08 fecha lá, com `wrangler hyperdrive get`).
- `glob` e `minimatch` com aviso moderado (via `node-pg-migrate`, só no deploy): atualizar quando sair versão nova.
- Descartados da revisão de código: migração que exige o `mj_app` (decisão da AD-023), efeito do `App.tsx:42` (sem cenário que pisque), `alertaEl` nulo (só existe após `desenhar`), aviso de 72 bytes após gravar (o que o A-10 pediu), migração antes da publicação (aditiva, registrada), livro aprovado e recusado no mesmo arquivo (o export não gera).
- Rotas de login e resumos não mudaram desde a rodada 1 e não foram revistas a fundo de novo.
