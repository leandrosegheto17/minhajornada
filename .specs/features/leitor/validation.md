# Validação: leitor — FAIL ❌ (rodada 2)

- **Data**: 2026-11-15 · **Branch**: feature/leitor @ c0755e9 · **Árvore**: 73559d05e6cbd0c91960bc14c9df35d7bd136175
- **Escopo**: diff do retrabalho R1 (`5a6b8af..c0755e9`) e regressão pela suíte inteira (detalhe em `verificacao-rodada-2.md`; rodada 1 em `verificacao-rodada-1.md`)
- **Gate**: `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm e2e` = 344 unitários e 27 e2e passaram, 0 falharam (rodado de novo: o `Gate:` do R1 é de árvore anterior ao commit do prettier); `pnpm audit --audit-level high` sem altas
- **Sensor**: 16 mutações, 14 mortas, 2 sobreviveram (equivalentes: 0; ambas no A-12)
- **Revisão de código**: skill `revisao-codigo`, modo curto, sobre o diff do R1: 0 bloqueios; 1 sugestão (o `pnpm install --ignore-scripts` seguido do `wrangler deploy` no job `publicar` nunca rodou de verdade, ver lacunas)
- **Segurança**: `auditor-seguranca` (`seguranca.md`, "Reteste rodada 2"): SEC-001 a SEC-005 fechados; 0 crítico, 0 alto, 0 médio, 0 baixo; 4 informativos (I-6 a I-9)
- **Modelo**: /validar pedido em Sonnet; o dono escolheu seguir em Opus

## Achados

| ID | `arquivo:linha` | Achado e evidência | Correção sugerida | Criticidade | Situação |
|---|---|---|---|---|---|
| A-01 | `src/telas/TelaLeitor.tsx:77` | Só `pointerType === 'touch'`; teste com mouse e caneta em `TelaLeitor.test.tsx:190-200` | — | comum | fechado |
| A-02 | `e2e/leitura.spec.ts:35-72` | `boundingBox` (número à esquerda, linha própria) e `fontStyle` computado | — | comum | fechado |
| A-03 | `.specs/STATE.md` (`## Autorizações`) | Aprovações registradas | — | comum | fechado |
| A-04 | `.specs/STATE.md` (AD-004), `src/estado/useLeitor.ts:72` | AD gravada e citada | — | comum | fechado |
| A-05 | `.github/workflows/deploy.yml:124-126` | Fumaça em `/`, `/sw.js` e um livro, com a CSP completa; prova incompleta, ver A-12 | — | crítica | fechado |
| A-06 | `src/componentes/ConviteInstalacao.test.tsx:42, 92-100` | Propriedade apagada no `afterEach` e isolamento provado | — | comum | fechado |
| A-07 | `e2e/aparencia.spec.ts:116` | `toBeHidden()` do painel | — | comum | fechado |
| A-08 | `.github/workflows/deploy.yml:56-80, 106, 114-116, 136-139` | Job `construir` sem segredo; token só nos passos do wrangler; `publicar` sem cache e com `--ignore-scripts`; testes em `test/arquivos/deploy.test.ts:36-76` | — | crítica | fechado |
| A-09 | GitHub, environments; `.specs/preparacao.md:20` | `gh api` (só leitura): `producao` ← `main`, `tst` ← `desenvolvimento` | — | crítica | fechado |
| A-10 | `src/dados/livros.ts:37-45, 59-62, 77-82` | JSON validado (número e capítulos) antes do `cache.put`; entrada ilegível apagada; testes em `livros.test.ts:62-93` | — | crítica | fechado |
| A-11 | `package.json` (wrangler 4.162.0) | `pnpm audit --audit-level high` sem altas | — | crítica | fechado |
| A-12 | `test/arquivos/deploy.test.ts:82-87` | O teste não fixa os caminhos que a fumaça confere (FUN-42): os `toMatch` de `/`, `/sw.js` e `/livros/` casam com outras linhas do passo (a atribuição `livro=` e o `curl` da linha 122, que não olha cabeçalho); duas mutações no laço `for caminho in` (`deploy.yml:124`) sobrevivem com 12/12 testes passando | Extrair a lista do `for caminho in ...` e exigir exatamente `/`, `/sw.js` e `${livro}` | crítica | aberto |

## Lacunas e o que não foi validado

- O workflow de deploy nunca rodou (`DEPLOY_ATIVO` inativo): `pnpm install --ignore-scripts` + `wrangler deploy`, o artefato entre jobs e a regra de branch dos environments só se provam no primeiro deploy real (Nível 2 do `/preparar`).
- Cabeçalhos em resposta real da Cloudflare; instalação em Chrome e Safari reais; Node 24 (rodou em 26).
- Pendente do dono: confirmar o escopo mínimo do token da Cloudflare.
- Informativos de segurança sem ação obrigatória: I-6 (plano do GitHub não protege `main` e `desenvolvimento`), I-7 (cache do pnpm no job `construir`), I-8 (exigir SHA nas Actions; `package-manager-cache: false` no `publicar`), I-9 (= primeira lacuna acima).
