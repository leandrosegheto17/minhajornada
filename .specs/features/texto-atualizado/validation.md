# Validação: texto-atualizado — FAIL ❌ (rodada 1)

- **Data**: 2026-11-18 · **Branch**: feature/texto-atualizado @ 9b5923d · **Árvore**: ec2a6063dc44e094116c0d6d956c9fc8f999785c
- **Critérios**: 25/25 com asserção (24 OK, FUN-113 parcial) · **Gate**: `pnpm typecheck && pnpm test` (Git Bash) = 904 passaram, 0 falharam; `pnpm lint` verde; `pnpm build:e2e && pnpm e2e` = 89 passaram
- **Sensor**: 20 mutações, 19 mortas, 1 sobreviveu (equivalentes: 0), ver A-02
- **Revisão de código**: skill revisao-codigo, modo curto (com `code-review`): 4 achados confirmados (A-03, A-05, A-06), 4 sugestões, 1 descartado (colchete sem par em item recusado: a FUN-125 manda recusar o arquivo)
- **Segurança**: auditor-seguranca: 0 crítico, 0 alto, 0 médio, 1 baixo (A-07); `pnpm audit --prod` 0; gitleaks sem segredo real

## Critérios

| Critério | `arquivo:linha` e asserção | Resultado |
|---|---|---|
| FUN-103 | `src/biblia/correcoes/arquivo.test.ts:11-109`: recusa com o caminho do campo | ✅ |
| FUN-104, FUN-105 | `test/arquivos/consolidacao-conferir.test.ts:63-287`, `correcoes-real.test.ts:27-66` | ✅ |
| FUN-106 | `src/biblia/correcoes/regras.test.ts:13-126`, `consolidacao-regras.test.ts:45-185` | ✅ |
| FUN-107 | `validar.test.ts:97-143` (cruzados, dentro, encostados) | ✅ |
| FUN-108 a FUN-112 | `src/revisao/logica.test.ts:32-168`, `pagina.test.ts:81-243`, `montar-revisao.test.ts:9-85` | ✅ |
| FUN-113 | `mesclar.test.ts:17-79`, `aplicar-decisoes.test.ts:35-91`: lógica passa, o comando real não roda | ⚠️ A-01 |
| FUN-114, FUN-115, FUN-118 | `aplicar.test.ts:15-32`, `converter-biblia.test.ts:165-196` (`.biblia/` com SHA-256 igual; só 43 e 66 mudam de hash) | ✅ |
| FUN-116 | `e2e/correcoes.spec.ts:25-42`, `deploy.test.ts:38,45` | ✅ |
| FUN-117, FUN-127 | `regras.test.ts:87-109`, `aplicar.test.ts:39-138`: a ordem das posições não tem prova | ⚠️ A-02 |
| FUN-119 a FUN-121 | `TelaSobre.test.tsx:58-85`, `CapaLivro.test.tsx:14,25` | ✅ |
| FUN-122, FUN-123 | `TelaCorrecoes.test.tsx:42-118`, `App.test.tsx:172`, `leitor.test.ts:439`, `e2e/correcoes.spec.ts:44` | ✅ |
| FUN-124 | `e2e/correcoes.spec.ts:55-73` (offline com SW); chunk `correcoes.gerado-*.js` no `sw.js` | ✅ |
| FUN-125, FUN-126 | `validar.test.ts:42-63,164-203`, `converter-biblia.test.ts:233` | ✅ |

## Achados

| ID | `arquivo:linha` | Achado e evidência | Correção sugerida | Criticidade | Situação |
|---|---|---|---|---|---|
| A-01 | `src/revisao/mesclar.ts:4-5`, `src/revisao/logica.ts:9` | `node scripts/aplicar-decisoes.ts` lança `ERR_MODULE_NOT_FOUND` (imports sem `.ts`); o teste passa pelo Vitest e não prova o comando | Imports com `.ts`; teste por processo filho em `tmpdir` (regrava e recusa sem gravar) | crítica | aberto |
| A-02 | `src/biblia/correcoes/aplicar.ts:44` | Mutante vivo: inverter `b.inicio - a.inicio` não derruba teste; o par de itens do teste não desloca posições | Teste com dois itens no mesmo versículo em que o primeiro "depois" muda o tamanho, nas duas ordens do arquivo | crítica | aberto |
| A-03 | `src/revisao/mesclar.ts:33`, `src/revisao/logica.ts:97-105`, `correcoes.json` (Jr 6:10, Lc 4:40) | Itens sobrepostos em bloco de confiança alta: aprovar o bloco gera arquivo que o build recusa (FUN-107); a exportação grava sem avisar | `mesclarDecisoes` recusa aprovadas sobrepostas antes de gravar; o agrupamento manda itens sobrepostos ao "um a um" | comum | aberto |
| A-04 | commit 8bc673b (T16) | "Done when" da T16 (lista em JS separado e no pré-cache) sem teste nem conferência registrada | Teste de arquivo sobre `dist-e2e`: chunk próprio e listado no `sw.js` | comum | aberto |
| A-05 | `src/revisao/pagina.ts:216,227` | O cartão usa `item.depois` e ignora o `depois` salvo na decisão: ao voltar ou recarregar, aprovar de novo grava sem a edição | Partir do `depois` da decisão salva; teste que volta ao item editado e reaprova | comum | aberto |
| A-06 | `src/biblia/correcoes/aplicar.ts:74`, `scripts/converter-biblia.ts:65` | Regra aprovada que muda 0 versículos entra no total e na lista: capa e Sobre dizem "com correções" com texto intacto (FUN-123: "exatamente as aplicadas") | Excluir regra com 0 versículos da lista e do total; teste | comum | aberto |
| A-07 | `scripts/aplicar-decisoes.ts:36-39`, `src/revisao/mesclar.ts:93-112` | Segurança, baixo: `depois` editado vindo do banco do artifact vai ao site sem conferência do dono | O script lista os `depois` editados (id, antes, depois) antes de gravar; teste | comum | aberto |

**Sugestões (não bloqueiam):** `--correcoes` sem valor cai no arquivo real em silêncio (`scripts/converter-biblia.ts:102`); templates com quebra de linha literal (`:71`); `carregar` fora das dependências do `useEffect` (`TelaCorrecoes.tsx:54`); `consolidar-correcoes --forcar` renumera os ids e órfã as decisões do banco (`scripts/consolidar-correcoes.ts:139`).

## Lacunas e o que não foi validado

- osv-scanner e semgrep não instalados; política de acesso do banco e CSP do host de artifacts fora do alcance.
- E2E rodado na worktree (o Playwright não sobe na cópia isolada); `git status` igual antes e depois.
