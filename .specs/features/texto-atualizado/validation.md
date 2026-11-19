# Validação: texto-atualizado — FAIL ❌ (rodada 2)

- **Data**: 2026-11-19 · **Branch**: feature/texto-atualizado @ 695d6ee · **Árvore**: 5d6cbb43a19aad2568b49eaabe2f0a5b2b428446
- **Critérios**: 25/25 com asserção (FUN-113 e FUN-117/FUN-127 agora provados) · **Gate**: `pnpm typecheck && pnpm test` (Git Bash) = 921 passaram, 0 falharam; `pnpm lint` verde; `pnpm build:e2e && pnpm e2e` = 89 passaram
- **Sensor**: 15 mutações, 13 mortas, 2 sobreviveram (equivalentes: 0), ver A-08 e A-09
- **Revisão de código**: skill revisao-codigo, modo curto (com `code-review`) sobre `9b5923d..695d6ee`: 1 achado confirmado (lista do A-07 inclui recusados, somado ao A-07), 4 sugestões
- **Segurança**: auditor-seguranca: 0 crítico, 0 alto, 0 médio, 1 baixo (A-10); `pnpm audit --prod` 0; gitleaks só falsos positivos (hashes do `.instalacao.json`)

## Critérios

| Critério | `arquivo:linha` e asserção | Resultado |
|---|---|---|
| FUN-103 a FUN-106, FUN-108, FUN-109, FUN-111, FUN-114 a FUN-116, FUN-118 a FUN-122, FUN-124 a FUN-126 | Asserções da rodada 1 intactas; suíte e e2e verdes | ✅ |
| FUN-107, FUN-113 | `mesclar.test.ts:102-139`, `aplicar-decisoes.test.ts:100-172` (comando real por processo filho: roda, recusa sobreposição sem gravar, lista os editados) | ✅ |
| FUN-110 | `logica.test.ts:75-110` (sobrepostos fora do bloco); falta a ordem inversa | ⚠️ A-08 |
| FUN-112 | `pagina.test.ts:144-177` (volta ao item editado e reaprova com o `depois` salvo); a recusa com `depois` salvo sem prova | ⚠️ A-09 |
| FUN-117, FUN-127 | `aplicar.test.ts:47-54`: dois itens no mesmo versículo, primeiro "depois" muda o tamanho, nas duas ordens | ✅ |
| FUN-123 | `aplicar.test.ts:93-107`: regra com 0 versículos fora da lista e do total | ✅ |

## Achados

| ID | `arquivo:linha` | Achado e evidência | Correção sugerida | Criticidade | Situação |
|---|---|---|---|---|---|
| A-01 a A-06 | ver rodada 1 | Corrigidos, cada um com teste e mutação morta (M1 a M5, M7, M15) | — | — | fechado |
| A-07 | `scripts/aplicar-decisoes.ts:59-64,77-80` | A lista dos `depois` editados sai **depois** do `writeFileSync` (T29 pedia antes) e inclui itens **recusados** com `depois` salvo, que não vão ao site | Montar e imprimir a lista antes de gravar; listar só itens que ficam `aprovada`; teste que confere a ordem (saída antes da gravação) e que recusado não aparece | comum | reaberto |
| A-08 | `src/revisao/logica.ts:67` | Mutante vivo: `a.includes(b) \|\| b.includes(a)` → `a.includes(b)` passa (21/21); o teste de contenção só põe o item maior primeiro | Teste com `arquivo([menor, maior])`: os dois vão ao "um a um" e o bloco fica vazio | comum | aberto |
| A-09 | `src/revisao/pagina.ts:251` | Mutante vivo: Recusar sem o `depois` salvo passa (15/15); o efeito novo da R1 não tem teste | Teste: item com `depois` salvo, Recusar, `gravacoes[0]` = `{id, estado:'recusada', depois: <salvo>}` | comum | aberto |
| A-10 | `src/revisao/mesclar.ts:40-46`, `src/biblia/correcoes/validar.ts:41-83`, `scripts/aplicar-decisoes.ts:79` | Segurança, baixo: `depois` com `\r`/`\n` vindo do banco do artifact é gravado e, impresso cru, sobrescreve a linha no terminal; reproduzido: o dono vê a correção legítima e "TEXTO TROCADO" vai ao site | Recusar `depois` com caracteres de controle (`[\u0000-\u001F\u007F-\u009F  ]`) no `mesclarDecisoes` e no `validarCorrecoes`; imprimir com `JSON.stringify`; testes | crítica | aberto |

**Sugestões (não bloqueiam):** `PONTA_MINIMA = 3` deixa sobreposição de 1-2 caracteres ir ao bloco (o export recusa com erro claro); `sobrepostos` recalculado a cada `agrupar` (poderia ser calculado uma vez); nome do livro por índice em `aplicar-decisoes.ts:62` (usar `nomeRef`); o comando passa a exigir `.biblia/`. As 4 da rodada 1 seguem abertas.

## Lacunas e o que não foi validado

- osv-scanner e semgrep não instalados; política de acesso do banco e CSP do host de artifacts fora do alcance.
- E2E rodado na worktree; `git status` igual antes e depois. Aviso de engine (Node 26 contra `>=24 <25`) sem efeito no resultado.
