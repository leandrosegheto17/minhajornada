# Segurança: feature `leitor`

**Data**: 2026-11-15 · **Branch**: `feature/leitor` (diff contra `desenvolvimento`, 15 commits) · **Auditor**: `auditor-seguranca`
**Resultado**: 0 críticos, 0 altos, 2 médios, 3 baixos, 5 informativos. **Bloqueia o lançamento?** Não.

## Escopo e método

- PWA estática (React 19, Vite 8, vite-plugin-pwa `injectManifest`) na Cloudflare Workers só com assets (AD-001); livros no cache `mj-livros` (AD-002); cabeçalhos em `public/_headers` (AD-003). Sem servidor, login, backend nem cookie.
- **Superfície**: o próprio site (`/`, `/assets/*`, `/livros/NN.<hash>.json`, `/sw.js`, `/manifest.webmanifest`, fallback SPA para qualquer outro caminho); `localStorage` (`mj:leitura`, `mj:letra`, `mj:tema`, `mj:convite-ios`); Cache API (`mj-livros` e o precache do Workbox); workflows `ci` e `deploy` (o deploy guarda `CLOUDFLARE_API_TOKEN`). O ativo de maior valor é o **token de deploy**: quem o tiver publica um service worker que se instala em todos os aparelhos.
- **Ferramentas**: `pnpm audit` (só produção e completo), `gitleaks` (histórico inteiro), busca embutida de segredos no histórico. Não rodaram (não instaladas): `osv-scanner`, `semgrep`.
- **Teste ativo, só local**: `wrangler dev --local` (miniflare) em `127.0.0.1:8799` sobre o `dist/` atual, com `curl` em `/`, `/sw.js`, `/livros/01.619decf0.json`, `/livros/99.deadbeef.json` (inexistente), `/qualquer/rota`, `/_headers` e `/manifest.webmanifest`. Servidor encerrado ao fim, árvore limpa.

## Achados

| ID | Severidade | Título | Local |
|---|---|---|---|
| SEC-001 | Médio | Token da Cloudflare exposto a todo o job, inclusive à instalação e ao build | `.github/workflows/deploy.yml:68-69` |
| SEC-002 | Médio (a confirmar) | Proteção dos environments `producao` e `tst` não está no código | `.github/workflows/deploy.yml:59-61` |
| SEC-003 | Baixo | Resposta HTML do fallback SPA é gravada no cache como se fosse livro | `src/dados/livros.ts:59-68`, `wrangler.jsonc:8` |
| SEC-004 | Baixo | Cache do pnpm reaproveitado no job que publica | `.github/workflows/deploy.yml:79` |
| SEC-005 | Baixo | Dependências de desenvolvimento com vulnerabilidades conhecidas | `pnpm-lock.yaml` (undici, glob, minimatch, deepmerge) |

### SEC-001 — Médio — Token da Cloudflare exposto a todo o job

- **Evidência**: `deploy.yml:68-69` põe `CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID` no `env` do **job** `publicar`. Assim o token está no ambiente de `pnpm install --frozen-lockfile` (`:80`, que roda os scripts de instalação liberados em `pnpm-workspace.yaml`: `esbuild`, `workerd`) e de `pnpm build` (`:83`, que executa `scripts/converter-biblia.ts`, o Vite, os plugins do Rollup e o `workbox-build` com toda a árvore de dependências dele).
- **Cenário**: uma dependência de build comprometida (cadeia de suprimentos) lê `process.env.CLOUDFLARE_API_TOKEN` e o envia para fora. Com o token, o atacante publica no Worker de produção um `sw.js` próprio. Como o SW chama `skipWaiting()` e `clients.claim()` (`src/pwa/sw.ts:20-23`), ele assume todas as abas e fica no aparelho mesmo depois de a versão boa voltar. O efeito é amplo e persistente.
- **Atenuantes já presentes**: lockfile congelado, `minimumReleaseAge: 1440`, `blockExoticSubdeps: true`, `allowBuilds` restrito, actions fixadas por SHA, `persist-credentials: false`. Por isso fica em médio e não em alto.
- **Reprodução**: leitura do workflow. Nenhuma execução, porque exigiria o segredo real.
- **Correção sugerida**: (1) declarar o `env` com o token **só** nos passos `wrangler deploy` (`:86-88`) e `wrangler rollback` (`:102-107`). (2) De preferência, separar em dois jobs: `build` sem segredo, que sobe o `dist/` como artefato, e `publicar`, que baixa o artefato e só roda o `wrangler`. (3) Token da Cloudflare com escopo mínimo: só a conta, `Workers Scripts: Edit` e o necessário para o domínio próprio, sem acesso a outras zonas. Tokens separados para `tst` e `producao`.

### SEC-002 — Médio (a confirmar) — Proteção dos environments fora do código

- **Evidência**: o job escolhe `producao` ou `tst` pela branch (`deploy.yml:59-61`), e a trava de branch fica só no `if` do job `conferir` (`:31`). O `if` está no próprio arquivo do workflow, e um `workflow_dispatch` usa o arquivo **da ref disparada**.
- **Cenário**: alguém com permissão de escrita (colaborador, PAT vazado, action comprometida noutro workflow) cria uma branch, troca o `deploy.yml` por um que declare `environment: producao` sem o `if`, e dispara o workflow nela. Se o environment `producao` não tiver regra de branch de deploy, os segredos de produção são entregues a esse job. Não conferi as configurações do repositório no GitHub (fora do escopo local), por isso o achado fica "a confirmar".
- **Correção sugerida**: no GitHub, environment `producao` com *Deployment branches* restrito a `main` (e, se quiser, revisor obrigatório); `tst` restrito a `desenvolvimento`; segredos só nos environments, nunca no nível do repositório; `main` e `desenvolvimento` protegidas.

### SEC-003 — Baixo — HTML do fallback SPA gravado no cache como livro

- **Evidência**: `wrangler.jsonc:8` usa `not_found_handling: "single-page-application"`. `carregarLivro` aceita qualquer resposta `ok` (`src/dados/livros.ts:59`), grava no `mj-livros` **antes** de conferir que é JSON (`:63`) e só depois faz o parse (`:68`). `baixarFaltantes` pula qualquer URL já presente no cache (`:96`), sem conferir o conteúdo.
- **Reprodução local** (`wrangler dev --local`): `GET /livros/99.deadbeef.json`, também com `Sec-Fetch-Mode: cors` e `Sec-Fetch-Dest: empty` (como um `fetch` do app), devolve `200 OK` com `Content-Type: text/html` e o `index.html`.
- **Cenário**: descompasso de versão. Uma aba aberta com o JS antigo (o SW novo assume sem recarregar, conforme a decisão do FUN-37) pede um livro com o hash antigo depois de um deploy que mudou o texto. Recebe o `index.html` com 200, o grava sob a URL do livro e mostra "Este livro ainda não foi baixado" mesmo com rede. Na abertura seguinte, `limparAntigos` apaga a entrada. **Não há XSS**: o HTML nunca é inserido na página, só falha no `JSON.parse`, e o erro é tratado (`src/estado/useLeitor.ts:70-75`). O impacto é de disponibilidade e integridade do cache, sem atacante externo (HTTPS com HSTS impede injeção pela rede).
- **Correção sugerida**: em `carregarLivro`, exigir `content-type` com `application/json`, fazer o parse (e uma checagem mínima, por exemplo `livro.numero === numero`) **antes** do `cache.put`. Na leitura do cache, uma entrada ilegível deve ser apagada. Teste: dublê de `fetch` com 200 `text/html` que afirma que nada foi gravado.

### SEC-004 — Baixo — Cache do pnpm no job de deploy

- **Evidência**: `deploy.yml:79` (`cache: pnpm`) restaura o store do pnpm salvo por outras execuções da mesma branch (o `ci` em push à `desenvolvimento` e à `main` grava o mesmo cache).
- **Cenário**: envenenamento de cache do GitHub Actions. Um job comprometido que grave o cache naquela branch influencia o que o job com o segredo instala. O risco é atenuado porque o pnpm confere a integridade do lockfile.
- **Correção sugerida**: no job `publicar`, tirar `cache: pnpm` (o deploy é manual e raro, o custo é pequeno), ou fazer o build num job sem segredo (ver SEC-001).

### SEC-005 — Baixo — Vulnerabilidades em dependências de desenvolvimento

- **Evidência**: `pnpm audit --prod` = 0. O `pnpm audit` completo dá 4 altas, 6 moderadas e 1 baixa, todas fora do bundle:
  - `undici@7.29.1` (via `wrangler@4.152.0` → `miniflare`): GHSA-xjj6-f33q-929c, GHSA-4w7w-5xrc-9h26, GHSA-2m5v-pch6-74hx e GHSA-qrxm-fqhp-jwvm (altas), mais 4 moderadas. Corrigido em `>=7.30.1`. O `wrangler` roda no deploy com o token, mas as falhas exigem opções TLS próprias, redirecionamento entre origens ou servidor malicioso; o `wrangler` fala só com a API da Cloudflare.
  - `glob@11.1.0` e `minimatch@5.1.9` (moderadas) e `deepmerge@4.3.1` (baixa, sem correção), via `vite-plugin-pwa` → `workbox-build`, só no build, sobre arquivos do próprio projeto.
- **Correção sugerida**: atualizar o `wrangler` (o mais novo é 4.162.0; confira se ele traz `undici >=7.30.1`) ou um `overrides` do pnpm para `undici`. Para o `workbox-build`, aguardar a versão do upstream.

## Informativos (sem ação obrigatória)

- **I-1 Cabeçalhos (FUN-42) conferidos em todos os caminhos.** No `wrangler dev`, `/`, `/sw.js`, `/livros/*.json`, `/manifest.webmanifest`, o fallback SPA e até `/_headers` (que **não** é servido: cai no fallback) trazem a CSP inteira, `nosniff`, `Referrer-Policy: same-origin`, HSTS e `Permissions-Policy`. O `index.html` gerado não tem script nem estilo inline. Em produção, a fumaça (`deploy.yml:90-99`) confere só `/`; vale incluir `/sw.js` e um `/livros/*.json`.
- **I-2 Endurecimento opcional da CSP**: `require-trusted-types-for 'script'` (o código não tem sumidouro de HTML, então não quebra nada) e `Cross-Origin-Opener-Policy: same-origin`. HSTS sem `preload`, o que é adequado para um subdomínio.
- **I-3 Saída escapada (FUN-04) e XSS**: nenhum `dangerouslySetInnerHTML`, `innerHTML`, `eval` ou `document.write` em `src/`. O versículo vira nó de texto do React (`src/componentes/Versiculo.tsx:20-22`, `src/biblia/segmentos.ts:9-20`). `.biblia/*.md` não tem marcação HTML nem texto que pareça instrução para IA. O app não lê `location`, `hash` nem `search`. Os valores do `localStorage` são validados (`src/dados/preferencias.ts:57-104`, `src/navegacao/navegacao.ts:35-43`): tema por lista, letra de 1 a 5, leitura contra o índice, convite `=== true`. Valor adulterado cai no padrão.
- **I-4 Privacidade e LGPD (FUN-40, FUN-41)**: o bundle não faz requisição para fora (o único `fetch` é `src/dados/livros.ts:55`, para `/livros/`); as URLs externas do JS são só os dois links do Sobre (`rel="noopener noreferrer"`); nada de cookie, analytics, Sentry ou fonte externa (fontes `woff2` locais). A Cloudflare recebe IP e caminhos, como em qualquer hospedagem. O texto do Sobre (`src/telas/TelaSobre.tsx:52-56`) é correto: fala de preferências e leitura. Se o plano pago sincronizar a leitura, o histórico de leitura bíblica pode indicar convicção religiosa, que é **dado sensível** (LGPD art. 5º, II) e exigirá base legal e cuidado próprios.
- **I-5 Segredos e cadeia de suprimentos**: o `gitleaks` deu 2 falsos positivos (hashes de arquivo em `.claude/.instalacao.json:17` e `:30`, `533c0f****`). A busca embutida no histórico deu 0. Nenhum `.env` ou `.dev.vars` no histórico. As actions estão fixadas por SHA; `permissions: contents: read`; o `ci` usa `pull_request` (não `pull_request_target`); os valores vão para o `run` por `env`, sem injeção de `${{ }}`. O `workbox-build@7.4.1` depende do fork `@trickfilm400/rollup-plugin-off-main-thread@3.0.0-pre1` (declarado pelo próprio upstream, só no build): vale acompanhar. O `wrangler.jsonc` não define `workers_dev` nem `preview_urls`: defina os dois como `false` se não quiser o site também em `*.workers.dev`.

## Service worker (sem achado)

Escopo `/` (`src/pwa/registrarSW.ts:8`), registrado só no build. O precache vem do manifesto do Workbox, com revisão e sem `livros/**` (`vite.config.ts:55-58`). O fallback de navegação serve o `index.html` do precache e exclui `/livros/` (`src/pwa/sw.ts:16`). Não há rota de runtime para outra origem nem cache de respostas arbitrárias, então não há como envenenar o precache pela rede. `cleanupOutdatedCaches` apaga as versões velhas. O `sw.js` é servido com `Cache-Control: max-age=0, must-revalidate`, e a atualização não fica presa.

## Reteste rodada 2

**Data**: 2026-11-15 · **HEAD**: `c0755e9` (`feature/leitor`) · **Diff conferido**: `5a6b8af..HEAD` (11 commits do Retrabalho R1)
**Resultado**: SEC-001 a SEC-005 **fechados**. Nenhum achado novo de severidade baixa ou maior; 4 informativos novos (I-6 a I-9). **Bloqueia o lançamento?** Não.

**Ferramentas**: `pnpm audit` (completo e `--prod`), `gitleaks` nos 11 commits do retrabalho (0 vazamentos), `gh api` **somente leitura** no repositório (environments, políticas de branch, nomes dos secrets, variáveis, permissões de Actions) e nas tags públicas das actions usadas. Nada foi disparado, gravado ou alterado no GitHub. `osv-scanner` e `semgrep` seguem indisponíveis.

| ID | Estado | Prova |
|---|---|---|
| SEC-001 | Fechado | `deploy.yml:56-80`: job `construir` sem `environment` e sem `secrets.*`, instala, faz o build e sobe o `dist/` (`upload-artifact`, `retention-days: 1`). `deploy.yml:90-94`: o `env` do job `publicar` não tem mais o token. O token só aparece em `:114-116` (`wrangler deploy`) e `:136-139` (`wrangler rollback`). O `publicar` instala com `--ignore-scripts` (`:106`) e não faz build. O `wrangler.jsonc` não tem `build.command`, então o `wrangler deploy` não roda código do projeto com o token. Com o token, só rodam o `wrangler` e as dependências dele. Teste: `test/arquivos/deploy.test.ts` (casos A-08). |
| SEC-002 | Fechado (configuração conferida) | `gh api repos/<dono>/<repo>/environments`: `producao` e `tst` com `protection_rules: [branch_policy]` e `custom_branch_policies: true`. `.../deployment-branch-policies`: `producao` → `main`, `tst` → `desenvolvimento`. `gh secret list`: `CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID` existem só nos dois environments, e **nenhum** secret está no nível do repositório. Um colaborador. Resíduo em I-6. |
| SEC-003 | Fechado | `src/dados/livros.ts:37-45`: `lerLivro` faz o parse e exige `numero` igual ao pedido e `capitulos` como lista, senão devolve `null`. `:77-78`: a resposta da rede é validada **antes** do `cache.put` (`:82`), e uma resposta inválida lança `LivroNaoBaixado` sem gravar nada. `:59-62`: uma entrada ilegível no cache é apagada e o livro vem da rede. `baixarFaltantes` (`:115-116`) grava só por `carregarLivro`, então o "pula o que já está no cache" não guarda mais HTML. O `content-type` não é conferido, mas o HTML do fallback falha no `JSON.parse`, o que basta. Testes: `src/dados/livros.test.ts` (fallback `text/html`, JSON de outro livro, JSON sem capítulos, entrada ilegível apagada). |
| SEC-004 | Fechado | O `publicar` não tem `cache: pnpm` (`deploy.yml:103-105`). O `setup-node@v7.1.0` só liga o cache automático quando o `packageManager` é `npm` (aqui é `pnpm@11.23.0`), e o `pnpm/action-setup` vem com `cache: 'false'` por padrão (conferido no `action.yml` dos SHAs fixados). O `construir` mantém o cache, mas não tem segredo. Resíduo em I-7. |
| SEC-005 | Fechado | `wrangler` 4.162.0 → `undici@7.30.1` (`pnpm-lock.yaml:2896`), fora das 4 altas. `pnpm audit --prod`: 0. `pnpm audit` completo: 0 altas, 2 moderadas e 1 baixa, todas de build ou lint, sem caminho para o bundle nem para o job com token: `glob` (GHSA-3g3m-2fjr-6pw4, via `workbox-build`), `minimatch` (GHSA-g3hv-75wg-m249, via `typescript-eslint`) e `deepmerge` (GHSA-gcqx-w48m-w2h4, sem correção). |

### Regressões procuradas no diff (nenhuma)

- **Artefato entre jobs**: `download-artifact` sem `run-id` e sem `github-token`, então só baixa da **mesma execução**. Ele grava em `dist/`, e a v8.0.2 é posterior à correção de *zip slip* (GHSA-cxww-7g56-2vh6). O artefato traz só o site público e nenhum segredo. Uma dependência de build comprometida ainda consegue alterar o que se publica, como já acontecia antes. Isso é inerente ao build e não dá acesso ao token.
- **Permissions**: continua `contents: read` no workflow. O `construir` e o `publicar` herdam esse valor, e o `conferir` tem só `actions: read`. A permissão padrão dos workflows no repositório é `read`.
- **Injeção em `${{ }}`**: nenhum `run:` interpola contexto. Todos os valores passam por `env` (`SHA`, `URL_PUBLICA`, `WRANGLER_ENV`, `RUN`). `github.ref_name` aparece só em `concurrency.group`. Em `deploy.yml:123-125`, `$(ls dist/livros | head -1)` só entra em variável entre aspas no `curl`, sem `eval`.
- **Versões fixas**: as 5 actions estão fixadas por SHA, e cada SHA confere com a tag do comentário (`upload-artifact` v7.0.2, `download-artifact` v8.0.2, `checkout` v7.0.1, `action-setup` v6.1.0, `setup-node` v7.1.0), resolvido por `gh api .../git/ref/tags/<tag>`.
- **Cadeia do job com token**: `wrangler@4.162.0` depende de `miniflare@5.20261113.0-beta`. A pré-versão foi declarada pelo próprio upstream, sem `overrides` no projeto (I-9).

### Informativos novos

- **I-6 Branches sem proteção no plano atual.** `gh api .../branches/{main,desenvolvimento}/protection` e `.../rules/branches/*` devolvem 403 ("Upgrade to GitHub Pro or make this repository public"). O repositório é privado e de conta pessoal. A política do environment diz só "ref `main`", então quem tiver escrita consegue pôr qualquer commit na `main` e publicar. Hoje há **um** colaborador, e quem tem a credencial dele já controla os environments, por isso fica como informativo. Também não conferi se a GitHub **aplica** a política de branch do environment num repositório privado desse plano: a API aceitou e devolveu a regra (`PREMISSA`: aplicada). A confirmação definitiva vem no primeiro deploy real, com uma tentativa a partir de outra branch, se o dono quiser. Se entrar um segundo colaborador, vale o GitHub Pro (proteção de `main` e `desenvolvimento`) ou um revisor obrigatório no `producao`.
- **I-7 Cache do pnpm no `construir`.** Um cache envenenado nessa branch influenciaria o `dist/` que o `publicar` sobe, mas sem acesso ao token. O pnpm confere a integridade dos pacotes contra o lockfile. Se quiser fechar também isso, tire o `cache: pnpm` de `deploy.yml:71` (o deploy é manual e raro).
- **I-8 Endurecimento do repositório e do workflow.** Em *Settings → Actions*, `sha_pinning_required` está `false` e `allowed_actions: all`. Como todas as actions já estão fixadas, ligar "exigir SHA" não quebra nada e impede uma regressão futura. No `publicar`, `package-manager-cache: false` explícito no `setup-node` protege contra uma mudança de padrão do upstream. O escopo mínimo do token da Cloudflare (item 3 da correção do SEC-001) não dá para conferir daqui: é **pendente do dono**.
- **I-9 Execução do `publicar` ainda não provada.** A variável `DEPLOY_ATIVO` não existe no repositório (`gh variable list` vazio), então o workflow está inerte e o `publicar` com `--ignore-scripts` (sem o postinstall do `workerd` e do `esbuild`) ainda não rodou de verdade. O risco é de funcionamento, não de segurança. Ele aparece no primeiro deploy do Nível 2.
