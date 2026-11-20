# Validação: resumo-livro — FAIL ❌ (rodada 4)

- **Data**: 2026-11-20 · **Branch**: feature/resumo-livro @ a05a1fd · **Árvore**: 7f2b2bf7c6b34064d78c3392cec027b6bc541899 · Rodadas anteriores: `git show f8f1466:`, `3cb4188:` e `4a4ac02:` deste arquivo
- **Gate**: `pnpm typecheck && pnpm test` = 1641 passaram, 0 falharam (92 arquivos); lint verde; e2e 129/129
- **Sensor**: 14 mutações, 12 mortas, 2 sobreviveram, não equivalentes (M13 `publicar.ts:40` sem `public.` → A-23; M14 `criar-dono.ts:21,25` sem `public.` → A-24)
- **Verificador**: A-19, A-20, A-21 fechados; A-22 fechado em parte (A-23, A-24). Nenhum teste existente alterado; sem órfãos no cluster
- **Revisão de código**: modo curto (code-review sobre `4a4ac02..HEAD`): 0 aceitos novos; `crypt` sem schema = A-24; `PGOPTIONS` no pooler do Neon como ressalva; 5 descartados (cópia da função entre migrações e loop redundante, estilo; `finally` com a URL de teste; PG anterior ao 15; upgrade de banco já migrado, tst e produção ainda não migrados)
- **Segurança**: auditor-seguranca: 0 crítico, 0 alto, 1 médio (N-05 → A-26), 2 baixos (N-07 → A-24, N-06 → A-27); A-19 a A-22 fechados no que foi pedido
- **Decisão**: o dono escolheu seguir com o retrabalho R4 completo (4ª rodada)

## Achados

| ID | `arquivo:linha` | Achado e evidência | Correção sugerida | Criticidade | Situação |
|---|---|---|---|---|---|
| A-23 | `scripts/resumos/publicar.ts:40`; `publicar.test.ts:227-253` | O `public.` do `DELETE` não tem teste: o teste do schema sombra não deixa o recusado publicado antes (M13 vivo) | Semear 1 e 3 em `public.resumos`; esperar `public` só com [1] e a sombra vazia | crítica | aberto |
| A-24 | `scripts/criar-dono.ts:21,25` | `public.usuarios`/`public.sessoes` sem teste de schema sombra (M14 vivo); `crypt`/`gen_salt` sem schema capturam a senha numa função falsa (sonda N9) | `public.crypt`/`public.gen_salt`; teste com schema sombra (usuário e sessão em `public`, sombra intocada, a falsa não é chamada) | crítica | aberto |
| A-25 | `package.json:13`; `servidor/migracoes/conferir-papel.test.ts` | `pnpm migrar` falha com "Cannot determine numeric prefix for conferir-papel.test.ts" (confirmado pela sessão num banco descartável): o job `migrar` do deploy nunca migra; o teste de arquivo só lê o texto do comando | Testes fora da pasta de migrações (ou filtro `*.sql` no CLI); teste que roda o script `migrar` de verdade num banco descartável | crítica | aberto |
| A-26 | `.github/workflows/deploy.yml:111`; `1795133100000_conferir_papel_app_atributos.sql:95` | Sobrecarga `public.conferir_papel_app(text)` criada pelo papel ganha do literal sem tipo e a conferência passa com SUPERUSER, mesmo depois de revogado o CREATE (sondas N8, N8b) | Chamar com `'mj_app'::name` (deploy e migrações); recusar papel dono de qualquer função, tabela ou tipo | crítica | aberto |
| A-27 | `1795133100000_conferir_papel_app_atributos.sql:68` | `GRANT REFERENCES (email) ON usuarios` passa (só a tabela inteira é olhada) (sonda N5b) | `has_any_column_privilege(..., 'REFERENCES')` nas três tabelas | crítica | aberto |

## Lacunas e o que não foi validado

- Nível 2 do `/preparar`: Worker no workerd, fumaça de deploy, Hyperdrive com `--caching-disabled` (A-08), e a `DATABASE_URL_DONO` precisa ser a conexão direta do Neon (o pooler recusa o `PGOPTIONS` do passo de conferência).
- `glob` e `minimatch` via `node-pg-migrate`; privilégios fora do banco atual não são conferidos.
