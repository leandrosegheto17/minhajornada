# Validação: leitor — PASS ✅ com ressalva (rodada 5)

- **Data**: 2026-11-15 · **Branch**: feature/leitor @ bac3c35 · **Árvore**: f6000402f43fa9c52f3bb48c4b7da6d7d495afb3
- **Escopo**: diff do retrabalho R4 (`241d77c..bac3c35`, T49 e T50) e regressão pela suíte inteira (detalhe em `verificacao-rodada-5.md`; anteriores em `verificacao-rodada-1.md` a `-4.md`; um merge local feito na rodada 3 com uma verificação parcial foi desfeito)
- **Gate**: `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm e2e` = 366 unitários (27 arquivos) e 27 e2e passaram, 0 falharam (árvore diferente da do `Gate:` do R4)
- **Sensor**: 23 mutações na fumaça (`deploy.yml:120-133`), 20 mortas, 3 vivas equivalentes (N4, N13, N19) e 2 vivas reais (N20, N21, no A-16); M32, M25, M26 e M27 da rodada 4 agora morrem
- **Revisão de código**: diff do R4 avaliado pelo verificador (stub `CAIXA_TITULO` e `REMOVER_DIRETIVA`, Linux em container `node:24` 34/34); a reescrita dos casos A-13, aprovada pelo dono no R4, cobre todos os ramos antigos e acrescenta `referrer-policy` em `/sw.js`
- **Segurança**: não reaberta nas rodadas 3 a 5 (R2 a R4 só acrescentam teste); vale o reteste da rodada 2 em `seguranca.md`: SEC-001 a SEC-005 fechados; 0 crítico, 0 alto, 0 médio, 0 baixo; 4 informativos (I-6 a I-9)
- **Decisão do dono (rodada 5)**: A-16 aceito como lacuna, sem retrabalho; feature segue para a integração
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
| A-12 | `test/arquivos/deploy.test.ts:82-87` | O teste não fixa os caminhos que a fumaça confere (FUN-42): os `toMatch` de `/`, `/sw.js` e `/livros/` casam com outras linhas do passo (a atribuição `livro=` e o `curl` da linha 122, que não olha cabeçalho); duas mutações no laço `for caminho in` (`deploy.yml:124`) sobrevivem com 12/12 testes passando | Teste `test/arquivos/deploy.test.ts:89-96` extrai a lista do laço e exige `['"/"', '"/sw.js"', '"${livro}"']` (linha 92); as 2 mutações e a remoção de `/sw.js` morrem | crítica | fechado |
| A-13 | `test/arquivos/deploy.test.ts:82-98` (fumaça em `.github/workflows/deploy.yml:125-129`) | O caminho de falha da fumaça de cabeçalhos (FUN-42) não tem prova: 4 mutantes vivos com 13/13 passando (`exit 1` → `true` ou `:`, `if ! grep -qi` → `if grep -qi`, `curl -fsS` sem `-f`); os testes só casam texto | Executar o bloco `run` da fumaça em `bash` com `curl` simulado: todos os cabeçalhos → sai 0; faltando CSP ou `nosniff` em qualquer caminho → sai ≠ 0 e imprime `::error`; `curl` com falha HTTP → sai ≠ 0 | crítica | fechado |
| A-14 | `test/arquivos/deploy.test.ts:136-138` (fumaça em `.github/workflows/deploy.yml:127`) | O stub só emite cabeçalhos em minúsculas; o `-i` do `grep -qi` não é provado: M32 (`grep -qi` → `grep -q`) passa 25/25. Resposta com `Content-Security-Policy` capitalizado (HTTP/1.1) faria a fumaça recusar um deploy bom e disparar o rollback sem teste vermelho | Caso em que o stub devolve os cabeçalhos com caixa de título e a fumaça sai com 0 | crítica | fechado |
| A-15 | `test/arquivos/deploy.test.ts:170-174, 181-184` | Os casos de `object-src`, `frame-ancestors` e `default-src` tiram a linha inteira da CSP (mesmo comportamento); M26 e M27 (tirar a diretiva dos exigidos) só morrem pelos testes textuais (`:100-109`); a mensagem `::error` não é conferida quanto ao caminho e ao cabeçalho | Stub remove só a diretiva da linha da CSP; cada caso exige a diretiva e o caminho na mensagem `::error` | comum | fechado |
| A-16 | `test/arquivos/deploy.test.ts:128-146` (fumaça em `.github/workflows/deploy.yml:128`) | Nenhum caso devolve cabeçalho de segurança com valor errado (`referrer-policy: no-referrer`, `x-content-type-options: sniff`); os regex de `nosniff` e `same-origin` só são provados por texto (`:105-112`); N20 e N21 vivem com 34/34 | Modo `VALOR_ERRADO` no stub, com casos que exigem saída ≠ 0 e a mensagem do cabeçalho | comum | aceito pelo dono como lacuna |

## Lacunas e o que não foi validado

- A-16 (comum), aceito pelo dono em 2026-11-15: valor errado de `referrer-policy` e `x-content-type-options` não é provado por execução, só por texto.

- O workflow de deploy nunca rodou (`DEPLOY_ATIVO` inativo): `pnpm install --ignore-scripts` + `wrangler deploy`, o artefato entre jobs e a regra de branch dos environments só se provam no primeiro deploy real (Nível 2 do `/preparar`).
- Cabeçalhos em resposta real da Cloudflare; instalação em Chrome e Safari reais; Node 24 (rodou em 26).
- Pendente do dono: confirmar o escopo mínimo do token da Cloudflare.
- Informativos de segurança sem ação obrigatória: I-6 (plano do GitHub não protege `main` e `desenvolvimento`), I-7 (cache do pnpm no job `construir`), I-8 (exigir SHA nas Actions; `package-manager-cache: false` no `publicar`), I-9 (= primeira lacuna acima).
