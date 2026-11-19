# Validação: texto-atualizado — PASS ✅ (rodada 4, com risco aceito)

- **Data**: 2026-11-19 · **Branch**: feature/texto-atualizado @ daa3170 · **Árvore**: 0a0f2249aff78c7c4b4ff250f384cdbc1b133aa5
- **Critérios**: 25/25 com asserção, sem regressão · **Gate**: `pnpm typecheck && pnpm test` (Git Bash) = 996 passaram, 0 falharam; `pnpm lint` verde; `pnpm build:e2e && pnpm e2e` = 89 passaram
- **Sensor**: 22 mutações, 20 mortas, 2 sobreviveram (1 sem significado: redundância entre a checagem do mesclar e a do build, que M16 a M18 provam), ver A-13
- **Revisão de código**: skill revisao-codigo, modo curto (com `code-review`) sobre `cc6a64d..daa3170`: sem bloqueio; sugestões abaixo
- **Segurança**: auditor-seguranca: 0 crítico, 0 alto, 0 médio, 2 baixos (SEC-003, anterior à feature; SEC-004, informativo); `pnpm audit --prod` 0; gitleaks sem vazamento no diff

## Critérios

| Critério | `arquivo:linha` e asserção | Resultado |
|---|---|---|
| FUN-103 a FUN-112, FUN-114 a FUN-127 | Asserções das rodadas anteriores intactas; suíte e e2e verdes | ✅ |
| FUN-113 / AD-018, controle (A-11) | `validar.test.ts:13-18`, `mesclar.test.ts:109-119` com `CARACTERES_PROIBIDOS` (`apoio-teste.ts:76-106`, por código de ponto, limites de C0, DEL, C1, U+2028, U+2029) | ✅ |
| FUN-113 / AD-018, formatação (A-12) | mesma tabela com bidi e largura zero; vizinhos permitidos em `validar.test.ts:21-24`; `aplicar-decisoes.test.ts:170-178` (bidi pelo comando real recusado, nada gravado) | ✅ com lacuna A-13 |
| Arquivo real | `correcoes/correcoes.json` (1.400 itens) sem controle nem Cf; `correcoes-real.test.ts` 6/6 | ✅ |

## Achados

| ID | `arquivo:linha` | Achado e evidência | Correção sugerida | Criticidade | Situação |
|---|---|---|---|---|---|
| A-01 a A-12 | ver rodadas 1 a 3 | Corrigidos, cada um com teste e mutação morta | — | — | fechado |
| A-13 | `src/biblia/correcoes/apoio-teste.ts:76-106`, `src/biblia/correcoes/validar.ts:28-32` | Mutante vivo M12: `semControle` por unidade UTF-16 (`charCodeAt`/`texto[i]`) passa nos 108 testes, e aí os caracteres de etiqueta U+E0000-E007F (astrais, Cf) passariam. Nenhum caso da tabela está acima de U+FFFF | Acrescentar a `CARACTERES_PROIBIDOS` U+E0001, U+E0041, U+E007F e U+1D173, e a `CARACTERES_PERMITIDOS` um astral comum (U+1F600), por código de ponto | crítica | aceito pelo dono em 2026-11-19 (risco aceito, sem retrabalho) |

**Sugestões (não bloqueiam):** SEC-003, `id` e `estado` da decisão crus na mensagem de erro (`mesclar.ts:22,31`, anterior à feature; um id com ESC forja uma linha falsa de "gravadas com sucesso", sem gravar nada); SEC-004, invisíveis que não são Cf (seletores de variação, preenchimentos Hangul, CGJ) e homóglifos passam, sem mudar o que o dono lê; a mensagem diz "caractere de controle (quebra de linha...)" também para bidi e largura zero (`validar.ts:67-69`, `mesclar.ts:41-43`); a guarda é lista de bloqueio, não de permissão. As das rodadas anteriores seguem abertas.

## Decisão do dono

- 2026-11-19: o dono aceitou o A-13 como risco e pediu a integração sem a rodada R4. A guarda de produção recusa os caracteres de etiqueta (o auditor reproduziu); falta só o teste que prende o laço por ponto de código.

## Lacunas e o que não foi validado

- osv-scanner e semgrep não instalados; política de acesso do banco e CSP do host de artifacts fora do alcance; terminais com bidi não testados.
- E2E rodado na worktree; `git status` igual antes e depois.
