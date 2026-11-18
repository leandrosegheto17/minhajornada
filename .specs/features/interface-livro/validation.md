# Validação: interface-livro — FAIL ❌ (rodada 3)

- **Data**: 2026-11-18 · **Branch**: feature/interface-livro @ b39771e · **Árvore**: 9464b3a610f1a6f7676d6b27ae1ecc449112539b
- **Critérios**: 44/44 com evidência; FUN-86 sem prova da ligação na tela (A-17) · **Gate**: reaproveitado de `tasks.md` (`pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm e2e @ ebe702b = verde`, árvore do commit de código `47f4c0c`; o HEAD só muda `tasks.md`). Conferido de novo: typecheck, lint, Vitest 41 arquivos / 627 testes
- **Sensor**: 13 mutações, 12 mortas, 1 sobreviveu (M17: `TelaLivro.tsx:82` `useMedidas(blocos, letra, medir)` → `useMedidas(blocos, 0, medir)`), não equivalente (teste temporário falha só no mutante; e2e `capa.spec.ts -g FUN-86` passa com o mutante)
- **Revisão de código**: skill revisao-codigo, modo curto (code-review) sobre `41f856c..HEAD` (só testes): nenhum apontamento
- **Segurança**: não se aplica (site estático, sem login, dado pessoal nem servidor); diff só de testes

## Critérios

Rastreio das rodadas 1 e 2 mantido (histórico do arquivo). Achados da rodada 2:

| Achado | `arquivo:linha` e asserção | Resultado |
|---|---|---|
| A-15 | `src/estado/leitor.test.ts:491-509` fatia guardada, fatias distintas, fatia 0 = ausente; `src/telas/TelaLivro.test.tsx:320-352` ligado ao reducer, páginas 2 → 5 | ✅ fechado (M5, M9 mortos) |
| A-16 | `src/telas/TelaLivro.test.tsx:410-420` capa → Gênesis 1:1 na larga, → plano pago na estreita | ✅ fechado (M1 morto) |

## Achados

| ID | `arquivo:linha` | Achado e evidência | Correção sugerida | Criticidade | Situação |
|---|---|---|---|---|---|
| A-15 | `src/estado/leitor.ts:86-96`, `:192` | ver rodada 2 | — | crítica | fechado |
| A-16 | `src/telas/TelaLivro.tsx:106` | ver rodada 2 | — | comum | fechado |
| A-17 | `src/telas/TelaLivro.tsx:82` | FUN-86 (letra nova repagina) sem prova na tela: M17 sobrevive a `TelaLivro.test.tsx`, `useMedidas.test.ts` e ao e2e `capa.spec.ts:91-115` (que só confere o texto visível). O hook prova a chave, mas a ligação `letra → chave` não tem teste | Teste `FUN-86` em `TelaLivro.test.tsx` com `rerender` de `letra` e `medir` estável que conta chamadas | crítica (critério sem prova) | aberto (T45) |

## Lacunas e o que não foi validado

- Fidelidade visual ao mockup, iOS e toque real, desempenho da paginação de Salmos, CI com Node 24 (local 26.13). Build e e2e não repetidos (gate reaproveitado pela árvore).
- A-01 prova os 66 livros com alturas sintéticas; FUN-75 em e2e só em Rute a 1280 × 800; rolagem lateral só em 320 e 1920 px.
- M19 (`trocarFormato` com `estado.ref` em vez da âncora) morreu só no caso da âncora `fim`; quase equivalente nos demais.
