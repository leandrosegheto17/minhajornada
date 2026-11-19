# Validação: texto-atualizado — FAIL ❌ (rodada 3)

- **Data**: 2026-11-19 · **Branch**: feature/texto-atualizado @ cc6a64d · **Árvore**: c2d8aba7271996e3f97889ebd44c1876f4454209
- **Critérios**: 25/25 com asserção, sem regressão · **Gate**: `pnpm typecheck && pnpm test` (Git Bash) = 937 passaram, 0 falharam; `pnpm lint` verde; `pnpm build:e2e && pnpm e2e` = 89 passaram
- **Sensor**: 15 mutações, 13 mortas, 2 sobreviveram (equivalentes: 0), ver A-11
- **Revisão de código**: skill revisao-codigo, modo curto (com `code-review`) sobre `695d6ee..cc6a64d`: 1 confirmado (U+2028 e U+0085 literais e invisíveis nos testes, somado ao A-11), sugestões abaixo
- **Segurança**: auditor-seguranca: 0 crítico, 0 alto, 0 médio, 2 baixos (A-12; SEC-003 anterior à feature, em sugestões); `pnpm audit --prod` 0; gitleaks só falsos positivos

## Critérios

| Critério | `arquivo:linha` e asserção | Resultado |
|---|---|---|
| FUN-103 a FUN-109, FUN-111, FUN-114 a FUN-127 | Asserções das rodadas anteriores intactas; suíte e e2e verdes | ✅ |
| FUN-110 (A-08) | `logica.test.ts:87-93`: `arquivo([menor, maior])` → bloco vazio, os dois no "um a um" | ✅ |
| FUN-112 (A-09) | `pagina.test.ts:180-194`: Recusar grava `{id, estado:'recusada', depois:'Rute respondeu'}` | ✅ |
| FUN-113 (A-07, A-10) | `aplicar-decisoes.test.ts:161-201` (controle recusado sem gravar; lista só de aprovados, antes da gravação, escapada); `mesclar.test.ts:102-114`, `validar.test.ts:13-22` | ✅ com lacunas A-11 e A-12 |
| Arquivo real | `correcoes/correcoes.json` (1.400 itens) passa por `validarCorrecoes` com o `.biblia` real; nenhum campo com controle | ✅ |

## Achados

| ID | `arquivo:linha` | Achado e evidência | Correção sugerida | Criticidade | Situação |
|---|---|---|---|---|---|
| A-01 a A-10 | ver rodadas 1 e 2 | Corrigidos, cada um com teste e mutação morta | — | — | fechado |
| A-11 | `src/biblia/correcoes/validar.test.ts:13-22`, `src/revisao/mesclar.test.ts:102-114` | Mutantes vivos: tirar DEL (0x7F) ou U+2029 de `ehControle` passa (33/33). As tabelas só cobrem `\r`, `\n`, ESC, U+2028, U+0085, e o prettier deixou U+2028 e U+0085 como caracteres literais invisíveis | Acrescentar DEL e U+2029 às duas tabelas, todos escritos como escape (`' '`), um por linha | crítica | aberto |
| A-12 | `src/biblia/correcoes/validar.ts:17-25`, `scripts/aplicar-decisoes.ts:88` | Segurança, baixo (SEC-002): caracteres de formatação (bidi U+202A-202E, U+2066-2069, U+200E/F, U+061C; largura zero U+200B-200D, U+2060, U+FEFF, U+00AD) passam. Reproduzido: a lista mostra "Caim matou Abel" e o site, "Abel matou Caim" | Recusar `\p{Cf}` em `semControle` (vale no mesclar e no build); teste por caractere | crítica | aberto |

**Sugestões (não bloqueiam):** a recusa de controle não tem requisito na spec e os testes citam FUN-125 (colchete): registrar uma AD e citá-la; SEC-003: `id` e `estado` da decisão vão crus à mensagem de erro (`mesclar.ts:22,31`, anterior à feature, nada é gravado); o teste com `chmod 0o444` falha se a suíte rodar como root; TAB passa a ser recusado (o arquivo real não tem nenhum); mensagem de controle duplicada em `validar.ts` e `mesclar.ts`; `editadas` liga os arrays por índice. As das rodadas anteriores seguem abertas.

## Lacunas e o que não foi validado

- osv-scanner e semgrep não instalados; política de acesso do banco e CSP do host de artifacts fora do alcance; terminais com bidi (Konsole, mlterm) não testados.
- E2E rodado na worktree; `git status` igual antes e depois.
