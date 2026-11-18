# Validação: interface-livro — FAIL ❌ (rodada 4)

- **Data**: 2026-11-18 · **Branch**: feature/interface-livro @ 9ede147 · **Árvore**: 27dc9eb1de37e7d1ed4c6782524a0ad1b2b89ecc
- **Critérios**: 44/44 com evidência; FUN-84 sem prova na tela larga (A-18) · **Gate**: build e e2e reaproveitados de `tasks.md` (`@ 8245516`, árvore do commit de código `ba902c8`; o HEAD só muda `tasks.md`). Repetidos: typecheck, lint, Vitest 41 arquivos / 628 testes
- **Sensor**: 11 mutações, 9 mortas, 2 sobreviveram: M1 (`TelaLivro.tsx:206`, título pela última página à mostra; não equivalente) e M9 (`useLeitor.ts`, `gravaLeitura = true`; equivalente: na capa, no plano pago e no "fim" o `ref` não muda)
- **Revisão de código**: skill revisao-codigo, modo curto (code-review) sobre `5df9feb..HEAD` (um teste novo): nenhum apontamento
- **Segurança**: não se aplica (site estático, sem login, dado pessoal nem servidor); diff só de teste

## Critérios

Rastreio das rodadas 1 a 3 mantido (histórico do arquivo). Achado da rodada 3:

| Achado | `arquivo:linha` e asserção | Resultado |
|---|---|---|
| A-17 | `src/telas/TelaLivro.test.tsx:306-312` letra 3 → 4 com o mesmo `medir`: `chamadas` 1 → 2 e página 2 → 3 de Rute | ✅ fechado (mutante letra → 0 morto) |

## Achados

| ID | `arquivo:linha` | Achado e evidência | Correção sugerida | Criticidade | Situação |
|---|---|---|---|---|---|
| A-17 | `src/telas/TelaLivro.tsx:82` | ver rodada 3 | — | crítica | fechado |
| A-18 | `src/telas/TelaLivro.tsx:206` | FUN-84 (`spec.md:157`): o título é o do primeiro versículo da página da esquerda, em tela larga. O teste de título é só na estreita; os de tela larga não afirmam o título; nenhum e2e em 1280 px o confere. M1 deixa `TelaLivro.test.tsx` verde | Teste `FUN-84` com `larga: true` num par que cruza capítulos | crítica (critério sem prova) | aberto (T46) |

## Lacunas e o que não foi validado

- Fidelidade visual ao mockup, iOS e toque real, desempenho da paginação de Salmos, CI com Node 24 (local 26.13). Build e e2e não repetidos (gate reaproveitado pela árvore).
- A-01 prova os 66 livros com alturas sintéticas; FUN-75 em e2e só em Rute a 1280 × 800; rolagem lateral só em 320 e 1920 px.
