# Resumo do livro: tarefas

**Spec**: `.specs/features/resumo-livro/spec.md` (FUN-137 a FUN-176) · **Design**: `design.md` · **Reuso**: `reuso.md` · **Mockup**: `mockup/`
**Branch pai**: desenvolvimento
**Status**: Approved

**Pré-requisitos do `/preparar`:** Nível 1 com Postgres local (Docker, `postgres:18`, `127.0.0.1`) e `DATABASE_URL_TESTE` no ambiente; o `testes.json` passa a exigir o banco no ar. Nível 2: Neon tst e produção, papel `mj_app` com senha, Hyperdrive com a URL do `mj_app`, `DATABASE_URL_DONO` como segredo do environment, `namespace_id` livre para `LIMITE_ENTRAR`, `URL_PUBLICA` por ambiente, usuário dono criado com `scripts/criar-dono.ts`.

**Segurança padrão de app web** (tarefas do primeiro lote do servidor, Phase 2, crítica): escuta local só em `127.0.0.1` (`dev.ip` no `wrangler.jsonc`, T2; Vite já usa `127.0.0.1`); método fora de GET e HEAD com `Sec-Fetch-Site` fora de `same-origin`/`none`, ou `Origin` diferente da `URL_PUBLICA`, recusa com 403 sem diferenciar caixa (T4); `Host` diferente, 421 (T4); CSP restritiva, `nosniff` e `Referrer-Policy: same-origin` em toda resposta da API, inclusive recusas (T5); saída escapada: o resumo só por `textContent`/texto do React, sem HTML (T31, T39).

**Conferência spec × design:**

| Ponto | Spec | Design | Vale |
|---|---|---|---|
| Ordem das respostas do resumo | FUN-147 (401) e FUN-150 (400) sem precedência | Sessão antes do livro | AD-024 |
| Papel do banco | não diz | `mj_app` restrito | AD-023 |
| Hash da senha | "bcrypt" (FUN-141) | `crypt(…, gen_salt('bf', 12))` do pgcrypto (AD-022) | Sem divergência: `bf` é bcrypt |
| Contagem de 300 a 450 palavras | "texto das quatro seções" (FUN-174) | contexto + mensagem + títulos da divisão + frases dos versículos-chave | Precisão do design (`design.md`, Data Models); T16 |
| Corpo inválido em `/api/entrar` | só os três casos de FUN-139 | mesma resposta 401 | Extensão de FUN-139; T13 |
| Botão "Resumo" sem internet | caso limite pede o botão | dica `mj:dono` no aparelho | Design (Tech Decisions); T24, T27 |

**Testes existentes que mudam** (autorizados em `.specs/STATE.md`, `## Autorizações`, 2026-11-19): `test/arquivos/wrangler.test.ts:33-36` (T2), `test/arquivos/deploy.test.ts:78-85` (T22), `src/componentes/BarraTitulo.test.tsx:69` e `src/App.test.tsx:105-113` (T27). Motivo no commit; tão fortes quanto antes.

---

## Linha de base

- **Comando**: `pnpm typecheck && pnpm test` (`.specs/projeto/testes.json`), pelo Git Bash
- **Resultado**: rodado em 2026-11-20 no commit `dbc2363`: typecheck verde; Vitest 60 arquivos, 1.015 testes, todos passando (36,9 s)
- **Falhas preexistentes**: nenhuma. Aviso de ambiente: Node 26 local fora de `engines` (`>=24 <25`). O `bash` do PowerShell é o do WSL e derruba `deploy.test.ts`: rode pelo Git Bash. Depois da T1, a suíte exige o Postgres local no ar (`DATABASE_URL_TESTE`, Nível 1 do `/preparar`)
- **T0 (rede de proteção)**: não precisa. Os comportamentos tocados têm teste: modo livro e folhear (`src/telas/TelaLivro.test.tsx:60-475`, `src/livro/folhear.test.ts:13-148`, `e2e/livro.spec.ts`, `e2e/livro-tela-cheia.spec.ts`, `e2e/capa.spec.ts`), barra (`src/componentes/BarraTitulo.test.tsx:21-85`), app (`src/App.test.tsx`), medida (`src/livro/useMedidas.test.ts`), `voltarPara` (`src/estado/leitor.test.ts`), preferências (`src/dados/preferencias.test.ts`), Worker e deploy (`test/arquivos/wrangler.test.ts:25-36`, `test/arquivos/deploy.test.ts:45-227`, `test/arquivos/cabecalhos.test.ts:35-74`) e a navegação do service worker (`e2e/sw.spec.ts:11-40`, FUN-35)
- **Regra do /executar**: nenhuma falha nova; a suíte inteira e o E2E rodam ao fim da feature

---

## Test Coverage Matrix

> Gerada do código, das regras e da spec. Guidelines encontradas: `.claude/CLAUDE.md` (Execução, Testes, Segurança padrão), `vite.config.ts:65-88`, `.specs/projeto/testes.json`. Amostras: `src/dados/livros.test.ts`, `src/telas/TelaLivro.test.tsx`, `src/componentes/BarraTitulo.test.tsx`, `src/revisao/logica.test.ts`, `test/arquivos/wrangler.test.ts`, `test/arquivos/deploy.test.ts`, `e2e/livro.spec.ts`; servidor: T `guarda.test.ts:21-132`, G `test/apoio/banco.ts:35-58`.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Guardas e middlewares (`servidor/middlewares/`) | unit (node) | Um teste por ramo: cada método (GET, HEAD, POST, PUT, PATCH, DELETE), caixa, vazio, `null`, URL ausente; cabeçalhos em 2xx, 4xx, 5xx e recusas; cada teste falha sem a guarda | `servidor/**/*.test.ts` | `pnpm vitest run --project servidor --reporter=dot` |
| Banco (migrações, função, papel `mj_app`) | integration (Postgres real) | Matriz permissão × comando: SELECT, INSERT, UPDATE, DELETE em `usuarios`, `sessoes`, `resumos` pelo `mj_app`, incluindo UPDATE e DELETE sem WHERE; `teste_<hex>` apagado no `finally` | `servidor/**/*.test.ts` | idem, com `DATABASE_URL_TESTE` |
| Repositórios e rotas (`servidor/repositorios/`, `servidor/rotas/`) | integration (`app.request()` + Postgres) | Todo critério de FUN-138 a FUN-151 com o status e o corpo; vencimento por 30 e 7 dias com relógio injetado; rollback em erro; conexão fechada em toda requisição | `servidor/**/*.test.ts` | idem |
| Formato e validação (`src/resumos/`) | unit | 1:1 com FUN-174: 299, 300, 450, 451 palavras; cada seção vazia; livro, capítulo, versículo e intervalo inexistentes; cada classe de caractere de AD-018 | `src/resumos/*.test.ts` | `pnpm vitest run src/resumos --reporter=dot` |
| Scripts (`scripts/resumos/`, `scripts/criar-dono.ts`) | integration (Postgres) | FUN-173 a FUN-175: só aprovados, substitui, contagem impressa, recusa total sem conectar, transação com falha provocada, confirmação de produção | `scripts/**/*.test.ts` | `pnpm vitest run --project servidor --reporter=dot` |
| Configuração (`wrangler.jsonc`, workflows, `.gitignore`, `sw.ts`) | unit (node, lê o arquivo) | Cada chave exigida, por ambiente; segredo só no passo certo | `test/arquivos/*.test.ts` | `pnpm vitest run --project arquivos --reporter=dot` |
| Dados do front (`src/dados/`) | unit (jsdom, `fetch` dublê) | Cada status (200, 401, 403, 404, 429, 5xx), rede fora e JSON inválido | `src/dados/*.test.ts` | `pnpm vitest run src/dados --reporter=dot` |
| Estado e telas (`src/estado/`, `src/telas/`, `src/componentes/`, `src/livro/`) | unit (jsdom) | Cada critério de FUN-137 a FUN-169 com o texto da spec; transições larga/estreita | `src/**/*.test.tsx` | `pnpm vitest run --project componentes --reporter=dot` |
| Modo livro com resumo (navegador) | e2e (`page.route('**/api/**')`) | Independent Tests de FUN-153 a FUN-169 em 1920 × 1080 e 390 × 844; asserção espacial para "esquerda/direita" | `e2e/*.spec.ts` | `pnpm build:e2e && pnpm e2e e2e/<arquivo>` |
| Revisão (`src/revisao-resumos/`) | unit (jsdom, banco dublê) | FUN-170 a FUN-172 e a exportação | `src/revisao-resumos/*.test.ts` | `pnpm vitest run src/revisao-resumos --reporter=dot` |

## Gate Check Commands

> Do `package.json` (com os scripts novos de T1) e de `.specs/projeto/testes.json`. Pelo Git Bash no Windows.

| Gate Level | When to Use | Command |
| --- | --- | --- |
| Quick | Tarefas só com unit do front ou de arquivo | `pnpm typecheck && pnpm vitest run --project componentes --project arquivos --reporter=dot` |
| Full | Tarefas do servidor, do banco, dos scripts ou com e2e | `pnpm typecheck && pnpm vitest run --reporter=dot` (com `DATABASE_URL_TESTE`) e, com e2e, `pnpm build:e2e && pnpm e2e <arquivo>` |
| Build | Fim da feature | `pnpm lint && pnpm typecheck && pnpm vitest run --reporter=dot && pnpm build:e2e && pnpm e2e` |

---

## Execution Plan

As Phases rodam em ordem; dentro de cada uma, as tarefas seguem a ordem indicada. O `progresso.py --lote` define os lotes (até 6h, sem misturar criticidade).

### Phase 1: Esqueleto do servidor (comum)

```
T1 → T2 → T3
```

### Phase 2: Guardas da API (crítica)

```
T4 → T5 → T6
```

### Phase 3: Banco (crítica)

```
T7 → T8 → T9 → T10
```

### Phase 4: Sessão e acesso (crítica)

```
T11 → T12 → T13 → T14 → T15
```

### Phase 5: Resumo no servidor (crítica)

```
T16 → T17
```

### Phase 6: Publicação e dono (crítica)

```
T18 → T19 → T20
```

### Phase 7: Entrega e proteção do texto (comum)

```
T21 → T22 → T23
```

### Phase 8: Entrar no app (comum)

```
T24 → T25 → T26
```

### Phase 9: Sessão no app (comum)

```
T27 → T28
```

### Phase 10: Página do resumo (comum)

```
T29 → T30 → T31 → T32
```

### Phase 11: Modo livro com o resumo (comum, domínio)

```
T33 → T34 → T35
```

### Phase 12: Prova de tela do resumo (comum)

```
T36 → T37
```

### Phase 13: Revisão dos resumos (comum)

```
T38 → T39 → T40
```

### Phase 14: Propostas do piloto (comum)

```
T41
```

---

## Task Breakdown

### T1: Dependências, alvo de typecheck e projeto de teste do servidor

**What**: Instalar `hono`, `pg`, `@types/pg`, `node-pg-migrate`, `@cloudflare/workers-types`; criar `tsconfig.servidor.json` (inclui `servidor/**`) e somá-lo ao `typecheck`; criar o projeto Vitest `servidor` (node, `servidor/**/*.test.ts` e `scripts/**/*.test.ts`, `fileParallelism: false`); exceção do `fetch` para `servidor/` no ESLint; `servidor/app.ts` com `criarApp(deps)` que responde 404 JSON a toda `/api/*` desconhecida.
**Estimativa**: 2h
**Risco**: alto
**Domínio**: não
**Criticidade**: comum
**Where**: `servidor/app.ts`
**Depends on**: None
**Reuses**: R13 (versões e script `migrar`); `vite.config.ts:65-88` (projetos); `eslint.config.mjs:60-71`
**Requirement**: base de FUN-146 a FUN-151

**Done when**:

- [ ] `pnpm typecheck` roda `tsc -p tsconfig.servidor.json` além dos dois de hoje, com tipos do Workers só nesse alvo
- [ ] `pnpm test` roda os três projetos (`componentes`, `arquivos`, `servidor`)
- [ ] `servidor/app.test.ts`: `GET /api/inexistente` e `POST /api/x` respondem 404 com JSON
- [ ] Gate full verde

**Tests**: unit em `servidor/app.test.ts`
**Gate**: full
**Commit**: `build(servidor): dependências, typecheck e projeto de teste do servidor`

---

### T2: Worker com script em `/api/*`

**What**: Ligar o Worker ao app (`servidor/entrada/worker.ts`) e ajustar o `wrangler.jsonc` no topo e em `env.tst` conforme R1; trocar o teste "sem `main`, sem bindings" pelo desenho novo.
**Estimativa**: 90 min
**Risco**: alto
**Domínio**: não
**Criticidade**: comum
**Where**: `wrangler.jsonc`
**Depends on**: T1
**Reuses**: R1, R2; `test/arquivos/wrangler.test.ts:25-36`
**Requirement**: FUN-140, FUN-151; segurança padrão (escuta)

**Done when**:

- [ ] `wrangler.test.ts` afirma, para o topo e para `env.tst`: `main`, `run_worker_first: ["/api/*"]`, `nodejs_compat`, `vars.URL_PUBLICA` com o domínio do ambiente, um `hyperdrive`, `ratelimits` com `LIMITE_ENTRAR` (5 por 60 s), `workers_dev: false`, `preview_urls: false`, `dev.ip` `127.0.0.1`; nenhuma senha nem URL de banco no arquivo (teste alterado com motivo no commit)
- [ ] `worker.ts` monta as dependências do `env` (Hyperdrive, binding, `URL_PUBLICA`) e repassa ao app; typecheck verde
- [ ] Gate quick verde

**Tests**: unit em `test/arquivos/wrangler.test.ts`
**Gate**: quick
**Commit**: `feat(servidor): worker com script em /api`

---

### T3: Postgres no CI

**What**: Serviço `postgres:18` no job `base` do CI, com `DATABASE_URL_TESTE` para `pnpm test`.
**Estimativa**: 1h
**Risco**: alto
**Domínio**: não
**Criticidade**: comum
**Where**: `.github/workflows/ci.yml`
**Depends on**: T2
**Reuses**: R17
**Requirement**: regra de CI do `CLAUDE.md`

**Done when**:

- [ ] Teste de arquivo afirma o serviço `postgres:18` com `pg_isready`, porta 5432 e `DATABASE_URL_TESTE` apontando para `127.0.0.1`/`localhost` no passo `pnpm test`
- [ ] Nenhum segredo real: senha de teste fixa só no CI
- [ ] Gate quick verde

**Tests**: unit em `test/arquivos/ci.test.ts`
**Gate**: quick
**Commit**: `ci: postgres para os testes do servidor`

---

### T4: Guarda de Host e de origem (segurança padrão)

**What**: `servidor/middlewares/guarda.ts`: 500 sem `URL_PUBLICA` válida; 421 com `Host` diferente; 403 em POST, PUT, PATCH e DELETE com `Sec-Fetch-Site` fora de `same-origin`/`none` ou `Origin` diferente (inclusive `null`), sem diferenciar caixa; ligada a toda `/api/*`.
**Estimativa**: 2h
**Risco**: alto
**Domínio**: não
**Criticidade**: crítica
**Where**: `servidor/middlewares/guarda.ts`
**Depends on**: None (a Phase anterior vem antes pela ordem das Phases; usa T1)
**Reuses**: R9, R10
**Requirement**: casos limite de Host e origem da spec; segurança padrão

**Done when**:

- [ ] Um teste por ramo: Host igual, diferente, com porta, em caixa alta; `URL_PUBLICA` ausente e ilegível; para cada método de escrita: `Sec-Fetch-Site` `cross-site`, `same-site`, `SAME-ORIGIN`, `none`, ausente; `Origin` igual, diferente, `null`, em caixa alta; GET e HEAD passam sem conferir origem
- [ ] A rodada vermelha (guarda removida) registrada no commit
- [ ] Gate full verde

**Tests**: unit em `servidor/middlewares/guarda.test.ts`, nomes com "Host 421" ou "origem 403"
**Gate**: full
**Commit**: `feat(servidor): guarda de host e de origem`

---

### T5: Cabeçalhos em toda resposta da API (FUN-151)

**What**: `servidor/middlewares/cabecalhos.ts` com `no-store`, `nosniff`, CSP `default-src 'none'; frame-ancestors 'none'` e `Referrer-Policy: same-origin`, aplicado antes da guarda.
**Estimativa**: 1h
**Risco**: alto
**Domínio**: não
**Criticidade**: crítica
**Where**: `servidor/middlewares/cabecalhos.ts`
**Depends on**: T4
**Reuses**: R11
**Requirement**: FUN-151; segurança padrão

**Done when**:

- [ ] Os quatro cabeçalhos em 200, 404, 421, 403, 500 (erro provocado numa rota de teste)
- [ ] Gate full verde

**Tests**: unit em `servidor/middlewares/cabecalhos.test.ts`, nomes com `FUN-151`
**Gate**: full
**Commit**: `feat(servidor): cabeçalhos de segurança da api`

---

### T6: Limite de tentativas de login (FUN-140)

**What**: `servidor/middlewares/limite.ts`: binding ausente, 503; chave `entrar:<CF-Connecting-IP>`; negado, 429 com `Retry-After: 60` e `{ erro: 'limite' }`.
**Estimativa**: 90 min
**Risco**: alto
**Domínio**: não
**Criticidade**: crítica
**Where**: `servidor/middlewares/limite.ts`
**Depends on**: T5
**Reuses**: R12
**Requirement**: FUN-140

**Done when**:

- [ ] Com um limite falso de 5 por chave: 5 passam, a 6ª dá 429 com `Retry-After: 60`; outro IP passa; sem `CF-Connecting-IP` usa a chave `entrar:sem-ip`
- [ ] Binding ausente: 503; binding que lança: 503
- [ ] Gate full verde

**Tests**: unit em `servidor/middlewares/limite.test.ts`, nomes com `FUN-140`
**Gate**: full
**Commit**: `feat(servidor): limite de tentativas de login`

---

### T7: Banco de teste e migrador

**What**: `servidor/test/apoio/banco.ts` (cria `teste_<hex>`, aplica as migrações, `DROP … WITH (FORCE)` no `finally`, recusa host fora de `127.0.0.1`/`localhost`/`postgres`) e `servidor/migrar.ts` (`runner` do `node-pg-migrate`, `checkOrder`), mais o script `pnpm migrar`.
**Estimativa**: 90 min
**Risco**: alto
**Domínio**: não
**Criticidade**: crítica
**Where**: `servidor/test/apoio/banco.ts`
**Depends on**: None (a Phase anterior vem antes pela ordem das Phases; usa T6)
**Reuses**: R13, R14, R16
**Requirement**: base de FUN-141 a FUN-149

**Done when**:

- [ ] Teste: migrar um banco vazio duas vezes não falha nem repete migração
- [ ] Teste: falha provocada no meio do teste não deixa `teste_*` no cluster (consulta a `pg_database` depois)
- [ ] Host fora da lista é recusado antes de conectar
- [ ] Gate full verde

**Tests**: integration em `servidor/migrar.test.ts`
**Gate**: full
**Commit**: `feat(servidor): migrador e banco de teste`

---

### T8: Tabelas e função de login (FUN-139, FUN-141)

**What**: Primeira migração: `pgcrypto`, `usuarios`, `sessoes`, `resumos` (design, Data Models) e `usuario_entrar(email, senha)` com hash fixo quando o e-mail não existe, `SECURITY DEFINER`, `search_path` fixo e `REVOKE … FROM PUBLIC`.
**Estimativa**: 2h
**Risco**: alto
**Domínio**: não
**Criticidade**: crítica
**Where**: `servidor/migracoes/<data>_inicial.sql`
**Depends on**: T7
**Reuses**: R8
**Requirement**: FUN-139, FUN-141

**Done when**:

- [ ] `usuario_entrar` devolve o id com a senha certa e `NULL` com senha errada, e-mail inexistente, e-mail vazio e senha vazia (FUN-139)
- [ ] `senha_hash` começa com `$2` (bcrypt) e nunca é igual à senha (FUN-141); `email` em caixa alta é recusado pelo `CHECK`
- [ ] `resumos.livro` fora de 1 a 66 é recusado; apagar o usuário apaga as sessões
- [ ] Gate full verde

**Tests**: integration em `servidor/migracoes/inicial.test.ts`, nomes com `FUN-139` ou `FUN-141`
**Gate**: full
**Commit**: `feat(banco): tabelas de usuário, sessão e resumo`

---

### T9: Permissões do papel `mj_app` (AD-023)

**What**: Migração que concede ao `mj_app` só o desenho da AD-023 (o papel é criado pelo `/preparar`; no teste, pelo apoio).
**Estimativa**: 2h
**Risco**: alto
**Domínio**: sim
**Criticidade**: crítica
**Where**: `servidor/migracoes/<data>_papel_app.sql`
**Depends on**: T8
**Reuses**: AD-023; `servidor/test/apoio/banco.ts` (T7)
**Requirement**: FUN-141, FUN-147, FUN-148 (AD-023)

**Done when**:

- [ ] Matriz como `mj_app`: `usuarios` — SELECT de `id, dono` passa, SELECT de `senha_hash` e `*` falham, INSERT, UPDATE (com e sem WHERE) e DELETE (com e sem WHERE) falham; `resumos` — SELECT passa, INSERT, UPDATE e DELETE (com e sem WHERE) falham; `sessoes` — SELECT, INSERT, UPDATE de `usada_em` e DELETE passam, UPDATE de `usuario_id` falha; `usuario_entrar` executa
- [ ] Papel sem a concessão (PUBLIC) não executa `usuario_entrar`
- [ ] Casos limite e estados listados antes de codar no commit
- [ ] Gate full verde

**Tests**: integration em `servidor/migracoes/papel-app.test.ts`, nomes com `AD-023` e o FUN do item
**Gate**: full
**Commit**: `feat(banco): permissões mínimas do papel do app`

---

### T10: Cliente por requisição e transação

**What**: `servidor/db/cliente.ts`: conexão aberta na primeira consulta, `emTransacao` com `ROLLBACK` no erro, fechamento no `finally` de toda requisição do app, erro de conexão como 500 genérico.
**Estimativa**: 90 min
**Risco**: alto
**Domínio**: não
**Criticidade**: crítica
**Where**: `servidor/db/cliente.ts`
**Depends on**: T9
**Reuses**: R3
**Requirement**: FUN-146, FUN-173 (base); falha de dependência

**Done when**:

- [ ] Erro provocado (`RAISE EXCEPTION`) dentro de `emTransacao` não deixa linha gravada
- [ ] Requisição que consulta e a que não consulta terminam com a conexão fechada (contagem em `pg_stat_activity` ou dublê)
- [ ] URL inválida: 500 `{ erro: 'interno' }` sem host nem senha no corpo nem no log
- [ ] Gate full verde

**Tests**: integration em `servidor/db/cliente.test.ts`
**Gate**: full
**Commit**: `feat(servidor): cliente do banco por requisição`

---

### T11: Token e cookie da sessão (FUN-138, FUN-141)

**What**: `servidor/sessao/token.ts` e `servidor/sessao/cookie.ts` conforme R4 e R5.
**Estimativa**: 1h
**Risco**: alto
**Domínio**: não
**Criticidade**: crítica
**Where**: `servidor/sessao/cookie.ts`
**Depends on**: None (a Phase anterior vem antes pela ordem das Phases; usa T10)
**Reuses**: R4, R5
**Requirement**: FUN-138, FUN-141

**Done when**:

- [ ] Cookie `__Host-sessao` com HttpOnly, Secure, SameSite=Lax, Path=/ e Max-Age de 30 dias; o de expirar tem Max-Age=0 (FUN-138)
- [ ] Token de 43 caracteres base64url; hash de 32 bytes; dois tokens nunca iguais em 1.000 gerações
- [ ] Cookie repetido ou fora do formato: `lerToken` devolve `null`
- [ ] Gate full verde

**Tests**: unit em `servidor/sessao/*.test.ts`, nomes com `FUN-138` ou `FUN-141`
**Gate**: full
**Commit**: `feat(servidor): token e cookie da sessão`

---

### T12: Repositório de sessões (FUN-141, FUN-144)

**What**: `servidor/repositorios/sessoes.ts`: `criar`, `validar` (vencida por 30 dias de criação ou 7 de uso é apagada; renova `usada_em` depois de 60 s), `apagar`.
**Estimativa**: 2h
**Risco**: alto
**Domínio**: sim
**Criticidade**: crítica
**Where**: `servidor/repositorios/sessoes.ts`
**Depends on**: T11
**Reuses**: R6
**Requirement**: FUN-141, FUN-144

**Done when**:

- [ ] Banco guarda só o hash: nenhuma coluna tem o token (FUN-141)
- [ ] Relógio injetado: 29 dias e 23 h de criação com uso recente vale; 30 dias não vale e a linha some; 6 dias e 23 h sem uso vale; 7 dias não vale e some (FUN-144)
- [ ] Uso renova `usada_em`; dois usos em menos de 60 s gravam uma vez
- [ ] Devolve `dono` do usuário
- [ ] Gate full verde

**Tests**: integration em `servidor/repositorios/sessoes.test.ts`, nomes com `FUN-141` ou `FUN-144`
**Gate**: full
**Commit**: `feat(servidor): sessões com vencimento de 30 e 7 dias`

---

### T13: `POST /api/entrar` (FUN-138, FUN-139, FUN-140)

**What**: Rota de login: limite, corpo JSON `{ email, senha }`, e-mail em caixa baixa, `usuario_entrar`; 200 `{ dono }` com cookie; 401 `{ erro: 'credenciais' }` igual em todo caso de falha.
**Estimativa**: 2h
**Risco**: alto
**Domínio**: não
**Criticidade**: crítica
**Where**: `servidor/rotas/acesso.ts`
**Depends on**: T12
**Reuses**: `servidor/repositorios/usuarios.ts` (novo, chama `usuario_entrar`); R12
**Requirement**: FUN-138, FUN-139, FUN-140

**Done when**:

- [ ] Senha certa: 200, `Set-Cookie` com o cookie de FUN-138, uma linha em `sessoes` (FUN-138)
- [ ] E-mail inexistente, senha errada, e-mail vazio, senha vazia, corpo que não é JSON, campos que não são texto: 401 com corpo idêntico e nenhuma sessão criada (FUN-139)
- [ ] 6ª tentativa do mesmo IP: 429 sem consultar o banco (FUN-140)
- [ ] `POST` com origem de fora: 403 (guarda de T4 ligada)
- [ ] Gate full verde

**Tests**: integration em `servidor/rotas/acesso.test.ts`, nomes com `FUN-138`, `FUN-139` ou `FUN-140`
**Gate**: full
**Commit**: `feat(servidor): rota de entrar`

---

### T14: `GET /api/sessao` e `POST /api/sair` (FUN-142, FUN-143, FUN-144)

**What**: `GET /api/sessao` devolve 200 `{ dono }` ou 401; `POST /api/sair` apaga a sessão do cookie, expira o cookie e responde 204 sempre.
**Estimativa**: 90 min
**Risco**: alto
**Domínio**: não
**Criticidade**: crítica
**Where**: `servidor/rotas/acesso.ts`
**Depends on**: T13
**Reuses**: R7
**Requirement**: FUN-142, FUN-143, FUN-144

**Done when**:

- [ ] Com sessão: 200 `{ dono: true }`; sem cookie, cookie inválido ou vencido: 401 (FUN-142, FUN-144)
- [ ] `sair` com sessão: linha apagada, cookie com Max-Age=0, e o mesmo cookie depois dá 401 em `/api/sessao` (FUN-143)
- [ ] `sair` sem sessão: 204
- [ ] Gate full verde

**Tests**: integration em `servidor/rotas/acesso.test.ts`, nomes com `FUN-142`, `FUN-143` ou `FUN-144`
**Gate**: full
**Commit**: `feat(servidor): rotas de sessão e de sair`

---

### T15: Log da API sem dado sensível

**What**: Uma linha por requisição `MÉTODO rota status` (rota como modelo, ex.: `/api/resumos/:n`); erro inesperado vira 500 `{ erro: 'interno' }`.
**Estimativa**: 1h
**Risco**: alto
**Domínio**: não
**Criticidade**: crítica
**Where**: `servidor/app.ts`
**Depends on**: T14
**Reuses**: `Deps.log` (design)
**Requirement**: observabilidade da spec (varredura de requisitos)

**Done when**:

- [ ] Depois de um login com e-mail e senha de exemplo e de um erro provocado, o log capturado não contém o e-mail, a senha, o token nem o valor do cookie, e tem uma linha por requisição com o status
- [ ] Erro lançado numa rota: 500 genérico, sem pilha no corpo
- [ ] Gate full verde

**Tests**: integration em `servidor/app.test.ts`
**Gate**: full
**Commit**: `feat(servidor): log da api sem dado sensível`

---

### T16: Formato e validação do resumo (FUN-163, FUN-164, FUN-174)

**What**: `src/resumos/formato.ts` (tipos, `lerArquivoExportado` estrito) e `src/resumos/validar.ts` (`contarPalavras`, `problemasDoResumo` contra a Bíblia convertida).
**Estimativa**: 2h
**Risco**: alto
**Domínio**: sim
**Criticidade**: crítica
**Where**: `src/resumos/validar.ts`
**Depends on**: None (a Phase anterior vem antes pela ordem das Phases; usa T15)
**Reuses**: `semControle` e `nomeRef` (`src/biblia/correcoes/validar.ts:5-8`, `:89`); leitura da Bíblia de `validarCorrecoes` (`:74`)
**Requirement**: FUN-163, FUN-164, FUN-174

**Done when**:

- [ ] Contagem pela regra do design: 299 e 451 recusam, 300 e 450 passam; títulos de seção e referências não contam
- [ ] Cada seção vazia (ou só espaço) recusa, com o nome da seção
- [ ] Divisão com capítulo 0, além do último ou `de > ate` recusa; versículo-chave "Gênesis 51:1", "Gênesis 1:32" e intervalo invertido recusam; "Gênesis 12:1-3" passa
- [ ] Cada classe de AD-018 (C0, DEL, C1, U+2028, U+2029, `\p{Cf}`) recusa
- [ ] Arquivo exportado com campo a mais, estado desconhecido ou livro fora de 1 a 66 é recusado por `lerArquivoExportado`
- [ ] Casos limite listados antes de codar no commit; testes só com texto de exemplo
- [ ] Gate quick verde

**Tests**: unit em `src/resumos/*.test.ts`, nomes com `FUN-174`, `FUN-163` ou `FUN-164`
**Gate**: quick
**Commit**: `feat(resumos): formato e validação do resumo`

---

### T17: `GET /api/resumos/:n` (FUN-146 a FUN-150)

**What**: Rota do resumo com a ordem da AD-024 e o repositório `servidor/repositorios/resumos.ts`.
**Estimativa**: 2h
**Risco**: alto
**Domínio**: não
**Criticidade**: crítica
**Where**: `servidor/rotas/resumos.ts`
**Depends on**: T16
**Reuses**: `validar` de sessões (T12); tipo `Resumo` (T16)
**Requirement**: FUN-146, FUN-147, FUN-148, FUN-149, FUN-150

**Done when**:

- [ ] Sessão de dono e livro publicado: 200 com as quatro seções (FUN-146)
- [ ] Sem cookie, cookie inválido e sessão vencida: 401 sem nenhum texto do resumo no corpo (FUN-147)
- [ ] Usuário sem `dono`: 403 sem texto (FUN-148)
- [ ] Dono, livro sem resumo: 404 (FUN-149)
- [ ] Dono e `0`, `67`, `1.5`, `abc`, `-1`, `01`: 400 (FUN-150); sem sessão, os mesmos: 401 (AD-024)
- [ ] Toda resposta com `Cache-Control: no-store` (FUN-151)
- [ ] Gate full verde

**Tests**: integration em `servidor/rotas/resumos.test.ts`, nomes com `FUN-146` a `FUN-150`
**Gate**: full
**Commit**: `feat(servidor): rota do resumo só para o dono`

---

### T18: Script de publicação (FUN-173, FUN-174)

**What**: `scripts/resumos/publicar.ts --ambiente tst|producao [--arquivo]`: URL só da variável do ambiente; valida todos os aprovados antes de conectar; grava numa transação substituindo o livro; imprime `N livros gravados`.
**Estimativa**: 2h
**Risco**: alto
**Domínio**: não
**Criticidade**: crítica
**Where**: `scripts/resumos/publicar.ts`
**Depends on**: None (a Phase anterior vem antes pela ordem das Phases; usa T17)
**Reuses**: `lerArquivoExportado`, `problemasDoResumo` (T16); `emTransacao` (T10)
**Requirement**: FUN-173, FUN-174

**Done when**:

- [ ] 4 aprovados e 1 recusado: grava 4, imprime "4 livros gravados" e o recusado não entra (FUN-173)
- [ ] Publicar de novo com texto mudado substitui o livro (uma linha por livro) (FUN-173)
- [ ] Um aprovado com "Gênesis 51:1": lista `Gênesis: …`, sai com código 1 e não conecta; o banco continua igual (FUN-174)
- [ ] Falha provocada no 3º livro (gatilho `RAISE EXCEPTION` no teste): nenhum livro gravado (caso limite da spec)
- [ ] Sem a variável de URL do ambiente: mensagem clara e código 1
- [ ] Gate full verde

**Tests**: integration em `scripts/resumos/publicar.test.ts`, nomes com `FUN-173` ou `FUN-174`
**Gate**: full
**Commit**: `feat(resumos): script de publicação validada`

---

### T19: Confirmação escrita para produção (FUN-175)

**What**: Com `--ambiente producao`, o script pede que se digite `PRODUÇÃO` antes de gravar; outra resposta encerra sem gravar.
**Estimativa**: 1h
**Risco**: alto
**Domínio**: não
**Criticidade**: crítica
**Where**: `scripts/resumos/publicar.ts`
**Depends on**: T18
**Reuses**: entrada padrão injetada nos testes
**Requirement**: FUN-175

**Done when**:

- [ ] Produção com resposta `PRODUÇÃO`: grava; com `sim`, vazio, `produção` ou entrada fechada: não conecta e sai com código 1 (FUN-175)
- [ ] tst não pergunta
- [ ] Gate full verde

**Tests**: integration em `scripts/resumos/publicar.test.ts`, nomes com `FUN-175`
**Gate**: full
**Commit**: `feat(resumos): confirmação antes de publicar em produção`

---

### T20: Script para criar o dono

**What**: `scripts/criar-dono.ts --email <e-mail>`: senha pela entrada padrão; cria ou atualiza o usuário com `crypt(…, gen_salt('bf', 12))` e `dono = true`.
**Estimativa**: 1h
**Risco**: alto
**Domínio**: não
**Criticidade**: crítica
**Where**: `scripts/criar-dono.ts`
**Depends on**: T19
**Reuses**: `usuario_entrar` (T8) para provar
**Requirement**: FUN-141, FUN-146 (o único usuário é o dono)

**Done when**:

- [ ] Depois do script, `usuario_entrar` com a senha dada devolve o id e o usuário tem `dono = true`; rodar de novo com outra senha troca a senha
- [ ] E-mail em caixa alta é gravado em caixa baixa; senha vazia recusa
- [ ] A senha não aparece na saída
- [ ] Gate full verde

**Tests**: integration em `scripts/criar-dono.test.ts`
**Gate**: full
**Commit**: `feat(servidor): script que cria o usuário dono`

---

### T21: Pasta da exportação fora do git (FUN-152, FUN-176)

**What**: `resumos-exportados/` no `.gitignore` e teste que prova que o texto real não vai para o repositório nem para o pacote.
**Estimativa**: 1h
**Risco**: alto
**Domínio**: não
**Criticidade**: comum
**Where**: `.gitignore`
**Depends on**: None (a Phase anterior vem antes pela ordem das Phases; usa T20)
**Reuses**: `test/arquivos/` (leitura de arquivo em node)
**Requirement**: FUN-152, FUN-176

**Done when**:

- [ ] `git check-ignore resumos-exportados/resumos.json` confirma a regra e `git ls-files resumos-exportados` é vazio (FUN-176)
- [ ] Com exportação local presente, nenhuma frase de 40 caracteres ou mais dela aparece em `dist/` nem nos arquivos do `git ls-files`; sem exportação, o teste diz que pulou essa parte (FUN-152)
- [ ] Gate quick verde

**Tests**: unit em `test/arquivos/resumos-fora-do-git.test.ts`, nomes com `FUN-152` ou `FUN-176`
**Gate**: quick
**Commit**: `chore(resumos): exportação dos resumos fora do git`

---

### T22: Migração e fumaça no deploy

**What**: Passo de migração com `DATABASE_URL_DONO` só nele, antes do `wrangler deploy`; fumaça de `/api/resumos/1` (401 e `no-store`); atualizar `deploy.test.ts:78-85`.
**Estimativa**: 2h
**Risco**: alto
**Domínio**: não
**Criticidade**: comum
**Where**: `.github/workflows/deploy.yml`
**Depends on**: T21
**Reuses**: R15; `test/arquivos/deploy.test.ts:45-227`
**Requirement**: FUN-147, FUN-151

**Done when**:

- [ ] Teste: o passo de migração vem antes de `wrangler deploy`, roda `pnpm migrar`, tem `DATABASE_URL_DONO` e não tem o token da Cloudflare; nenhum outro passo tem a URL do banco; o token continua só em `wrangler deploy|rollback` (teste alterado com motivo no commit)
- [ ] Teste: a fumaça exige 401 e `cache-control: no-store` em `/api/resumos/1`, e a falha aciona a volta da versão
- [ ] Gate quick verde

**Tests**: unit em `test/arquivos/deploy.test.ts`
**Gate**: quick
**Commit**: `ci(deploy): migração antes do deploy e fumaça da api`

---

### T23: Service worker não guarda `/api/*` (FUN-151)

**What**: `/^\/api\//` na denylist da navegação de `src/pwa/sw.ts` e teste de arquivo da regra.
**Estimativa**: 1h
**Risco**: baixo
**Domínio**: não
**Criticidade**: comum
**Where**: `src/pwa/sw.ts:16`
**Depends on**: T22
**Reuses**: `test/arquivos/` (leitura do arquivo)
**Requirement**: FUN-151

**Done when**:

- [ ] Teste: a denylist inclui `/^\/api\//`, e nenhum `registerRoute` do SW casa com `/api/resumos/1` (FUN-151)
- [ ] Gate quick verde

**Tests**: unit em `test/arquivos/sw.test.ts`, nomes com `FUN-151`
**Gate**: quick
**Commit**: `fix(pwa): service worker fora das rotas da api`

---

### T24: Chamadas de sessão no front (FUN-138, FUN-139, FUN-140, FUN-145)

**What**: `src/dados/sessao.ts` com `lerSessao`, `entrar` e `sair`, e a dica `mj:dono` (gravada com sessão de dono, apagada em `sem` e no `sair`).
**Estimativa**: 90 min
**Risco**: alto
**Domínio**: não
**Criticidade**: comum
**Where**: `src/dados/sessao.ts`
**Depends on**: None (a Phase anterior vem antes pela ordem das Phases; usa T23)
**Reuses**: R18; `vi.stubGlobal('fetch')` (`src/dados/livros.test.ts:14`); `src/dados/preferencias.ts:111-117`
**Requirement**: FUN-138, FUN-139, FUN-140, FUN-145

**Done when**:

- [ ] `entrar`: 200 → `dono`/`usuario`; 401 → `incorreto`; 429 → `limite`; rede fora, 5xx e 503 → `rede`; corpo enviado como JSON com `credentials: 'same-origin'`
- [ ] `lerSessao`: 200 → `dono`/`usuario`; 401 → `sem` (apaga `mj:dono`); rede fora → `rede` (mantém `mj:dono`)
- [ ] `sair` chama `POST /api/sair` e apaga `mj:dono` mesmo sem rede
- [ ] Gate quick verde

**Tests**: unit em `src/dados/sessao.test.ts`, nomes com o FUN de cada caso
**Gate**: quick
**Commit**: `feat(dados): chamadas de sessão do app`

---

### T25: Tela "Entrar" no estado do leitor (FUN-137, FUN-138)

**What**: Tela `entrar` em `src/estado/leitor.ts`, ação `abrirEntrar` que guarda `voltarPara`, e `voltar` que serve `emBreve` e `entrar`.
**Estimativa**: 90 min
**Risco**: baixo
**Domínio**: não
**Criticidade**: comum
**Where**: `src/estado/leitor.ts`
**Depends on**: T24
**Reuses**: `voltarPara` (`src/estado/leitor.ts:36`, `:100-104`, `:179-183`)
**Requirement**: FUN-137, FUN-138

**Done when**:

- [ ] De cada tela (inicial, livros, leitor rolagem, leitor livro, sobre), `abrirEntrar` vai a `entrar` e `voltar` volta à mesma tela com a mesma âncora (FUN-138)
- [ ] `abrirEntrar` em `entrar` não muda `voltarPara`; de `entrar`, "Criar conta" vai a `emBreve` e o voltar de lá volta a `entrar`
- [ ] Testes existentes de `emBreve` verdes sem mudança
- [ ] Gate quick verde

**Tests**: unit em `src/estado/leitor.test.ts`, nomes com `FUN-137` ou `FUN-138`
**Gate**: quick
**Commit**: `feat(estado): tela de entrar com volta à origem`

---

### T26: Tela "Entrar" (FUN-137, FUN-139, FUN-140)

**What**: `src/telas/TelaEntrar.tsx` com e-mail, senha, "Entrar", link "Criar conta", as mensagens de erro e o estado enviando, como no mockup `telas/entrar.html`.
**Estimativa**: 2h
**Risco**: baixo
**Domínio**: não
**Criticidade**: comum
**Where**: `src/telas/TelaEntrar.tsx`
**Depends on**: T25
**Reuses**: `BotaoPrimario` (`Botoes.tsx:13`), `Aviso` (`Aviso.tsx:13`); `mockup/telas/entrar.html`
**Requirement**: FUN-137, FUN-139, FUN-140

**Done when**:

- [ ] Campos com rótulo "E-mail" e "Senha", botão "Entrar" e link "Criar conta" que chama `aoCriarConta` (FUN-137)
- [ ] `incorreto` mostra "E-mail ou senha incorretos." (FUN-139); `limite` mostra "Muitas tentativas. Tente de novo em 1 minuto." (FUN-140); `rede` mostra a mensagem de rede da tela
- [ ] Envio com Enter chama `aoEntrar` uma vez, sem envio nativo do formulário; o botão fica desabilitado enquanto envia
- [ ] Gate quick verde

**Tests**: unit em `src/telas/TelaEntrar.test.tsx`, nomes com `FUN-137`, `FUN-139` ou `FUN-140`
**Gate**: quick
**Commit**: `feat(telas): tela de entrar`

---

### T27: Sessão no app e "Sair" na barra (FUN-138, FUN-142, FUN-143, FUN-145)

**What**: `src/estado/useSessao.ts` e a ligação em `App.tsx` e `BarraTitulo.tsx`: a barra abre "Entrar" (troca os testes de `BarraTitulo.test.tsx:69` e `App.test.tsx:105-113`), mostra "Sair" com sessão e `perder()` volta a sem sessão.
**Estimativa**: 2h
**Risco**: alto
**Domínio**: não
**Criticidade**: comum
**Where**: `src/estado/useSessao.ts`
**Depends on**: None (a Phase anterior vem antes pela ordem das Phases; usa T26)
**Reuses**: R19; `src/App.tsx:30-99`; `src/componentes/BarraTitulo.tsx:82-90`
**Requirement**: FUN-137, FUN-138, FUN-142, FUN-143, FUN-145

**Done when**:

- [ ] "Entrar / Criar conta" abre a tela "Entrar" (testes trocados com motivo no commit) (FUN-137)
- [ ] Login de dono volta à tela de origem e a barra mostra "Sair" com o mesmo texto no rótulo acessível (FUN-138, FUN-142)
- [ ] "Sair" chama `sair`, mostra "Entrar / Criar conta" e esconde o botão "Resumo" (FUN-143)
- [ ] `perder()` faz o mesmo sem mensagem (FUN-145); abertura sem rede com `mj:dono` mantém o estado de dono
- [ ] Gate quick verde

**Tests**: unit em `src/App.test.tsx` e `src/componentes/BarraTitulo.test.tsx`, nomes com o FUN de cada caso
**Gate**: quick
**Commit**: `feat(app): sessão do dono e botão sair`

---

### T28: Prova de tela de entrar e sair

**What**: e2e com `page.route('**/api/**')`: abrir "Entrar" pela barra, senha errada, entrar, recarregar e continuar entrado, sair.
**Estimativa**: 90 min
**Risco**: baixo
**Domínio**: não
**Criticidade**: comum
**Where**: `e2e/entrar.spec.ts`
**Depends on**: T27
**Reuses**: auxiliares de `e2e/livro.spec.ts:9-21`; `e2e/apoio/servidor.ts:33-36`
**Requirement**: FUN-137, FUN-138, FUN-139, FUN-142, FUN-143

**Done when**:

- [ ] Independent Test de "Entrar e sair como dono" em 1280 × 800 e 390 × 844, com a API simulada
- [ ] A rodada sem a mudança (barra indo ao "em breve") falha o teste de FUN-137
- [ ] Gate full verde (`e2e/entrar.spec.ts`)

**Tests**: e2e em `e2e/entrar.spec.ts`, nomes com o FUN de cada passo
**Gate**: full
**Commit**: `test(e2e): entrar e sair como dono`

---

### T29: Preferência "resumo ligado" (FUN-157)

**What**: `lerResumoLigado` e `gravarResumoLigado` com a chave `mj:resumo` em `src/dados/preferencias.ts`.
**Estimativa**: 45 min
**Risco**: baixo
**Domínio**: não
**Criticidade**: comum
**Where**: `src/dados/preferencias.ts`
**Depends on**: None (a Phase anterior vem antes pela ordem das Phases; usa T28)
**Reuses**: `conviteDispensado` (`src/dados/preferencias.ts:111-117`)
**Requirement**: FUN-157

**Done when**:

- [ ] Grava e lê `true`/`false`; valor inválido ou ausente lê `false` e é apagado; `localStorage` que lança não quebra (FUN-157)
- [ ] Gate quick verde

**Tests**: unit em `src/dados/preferencias.test.ts`, nomes com `FUN-157`
**Gate**: quick
**Commit**: `feat(dados): preferência do resumo ligado`

---

### T30: Busca do resumo no front (FUN-145, FUN-166 a FUN-168)

**What**: `src/dados/resumos.ts` com `buscarResumo(livro)` e as situações do design.
**Estimativa**: 1h
**Risco**: alto
**Domínio**: não
**Criticidade**: comum
**Where**: `src/dados/resumos.ts`
**Depends on**: T29
**Reuses**: `src/dados/livros.ts` (molde de `fetch`); tipo `Resumo` (T16)
**Requirement**: FUN-145, FUN-167, FUN-168

**Done when**:

- [ ] 200 com resumo bem formado → `pronto`; 404 → `semResumo` (FUN-168); 401 → `semSessao` (FUN-145); rede fora, 5xx, 400, 403 e JSON fora do formato → `erro` (FUN-167)
- [ ] Pede `GET /api/resumos/<n>` com `credentials: 'same-origin'` e `cache: 'no-store'`
- [ ] Gate quick verde

**Tests**: unit em `src/dados/resumos.test.ts`, nomes com `FUN-145`, `FUN-167` ou `FUN-168`
**Gate**: quick
**Commit**: `feat(dados): busca do resumo do livro`

---

### T31: Página do resumo: seções e estados (FUN-163 a FUN-168)

**What**: `src/livro/PaginaResumo.tsx` com cabeçalho, as quatro seções, carregando, erro com "Tentar de novo" e sem resumo, no estilo do mockup (`mockup/resumo.css`).
**Estimativa**: 2h
**Risco**: alto
**Domínio**: não
**Criticidade**: comum
**Where**: `src/livro/PaginaResumo.tsx`
**Depends on**: T30
**Reuses**: `Estado` (`src/componentes/base/Estado.tsx:30-66`), molde de `TelaCorrecoes.tsx:51-93`; `nomeRef` para "Gênesis 12:1-3"
**Requirement**: FUN-163, FUN-164, FUN-165, FUN-166, FUN-167, FUN-168

**Done when**:

- [ ] Títulos "Contexto", "Mensagem central", "Divisão do livro", "Versículos-chave" nessa ordem (FUN-163)
- [ ] Parte da divisão com título e "Capítulos 1 a 11"; parte de um capítulo como "Capítulo 50"; versículo-chave "Gênesis 12:1-3" e "Gênesis 15:6" com a frase (FUN-164)
- [ ] Texto com `<b>x</b>` aparece literal, sem elemento `b` (FUN-165)
- [ ] "Carregando o resumo…" (FUN-166); "Não foi possível carregar o resumo. Confira a internet e tente de novo." com "Tentar de novo" que busca de novo (FUN-167); "Este livro ainda não tem resumo." (FUN-168); `semSessao` chama `aoPerderSessao`
- [ ] Gate quick verde

**Tests**: unit em `src/livro/PaginaResumo.test.tsx`, nomes com `FUN-163` a `FUN-168`
**Gate**: quick
**Commit**: `feat(livro): página do resumo com seções e estados`

---

### T32: Páginas próprias do resumo (FUN-169)

**What**: Tornar `useMedidas` genérico na lista de blocos e paginar o resumo com `paginar`, com "‹ 1 de 2 ›" no rodapé, sem mexer na página da Bíblia.
**Estimativa**: 2h
**Risco**: alto
**Domínio**: não
**Criticidade**: comum
**Where**: `src/livro/PaginaResumo.tsx`
**Depends on**: T31
**Reuses**: `useMedidas` (`src/livro/useMedidas.ts:58-97`), `paginar` (`src/livro/paginacao.ts:73`); paginador do mockup (`telas/livro-resumo.html:55-62`)
**Requirement**: FUN-169

**Done when**:

- [ ] Medida injetada que não cabe numa página: "1 de 2", "Página anterior do resumo" desabilitado; "seguinte" mostra a 2 e a âncora da Bíblia não muda (FUN-169)
- [ ] Cabe numa página: sem paginador
- [ ] Trocar de livro volta à página 1 do resumo
- [ ] Testes de `useMedidas` e `TelaLivro` existentes verdes sem mudança
- [ ] Gate quick verde

**Tests**: unit em `src/livro/PaginaResumo.test.tsx`, nomes com `FUN-169`
**Gate**: quick
**Commit**: `feat(livro): páginas próprias do resumo`

---

### T33: Resumo à direita na tela larga (FUN-154 a FUN-156, FUN-158, FUN-159)

**What**: `TelaLivro` com `resumo='lado'`: `duasPaginas = false` no texto (capa com `larga`), Bíblia à esquerda e `paginaResumo` à direita.
**Estimativa**: 2h
**Risco**: alto
**Domínio**: sim
**Criticidade**: comum
**Where**: `src/telas/TelaLivro.tsx`
**Depends on**: None (a Phase anterior vem antes pela ordem das Phases; usa T32)
**Reuses**: `visiveis`, `destinoSeguinte`, `destinoAnterior` (`src/livro/folhear.ts:29-81`) sem mudança; `PaginaLivro` com `lado="esquerda"`
**Requirement**: FUN-154, FUN-155, FUN-156, FUN-158, FUN-159

**Done when**:

- [ ] Ligado: uma `PaginaLivro` à esquerda e o resumo à direita, posição "Gênesis, página X de Y" (FUN-154)
- [ ] "Seguinte" e "Anterior" passam uma página por vez, com a quebra de capítulo, e o resumo continua (FUN-155)
- [ ] Desligar na página 3 mostra o par que contém a página 3 (FUN-156)
- [ ] Trocar de livro mostra à direita o resumo do livro novo (FUN-158)
- [ ] Capa e plano pago com o resumo ligado: o par de hoje, sem resumo, e "seguinte" da capa vai a Gênesis (FUN-159)
- [ ] Estados e transições listados antes de codar no commit; testes de capa e de FUN-73 a FUN-91 verdes
- [ ] Gate quick verde

**Tests**: unit em `src/telas/TelaLivro.test.tsx`, nomes com `FUN-154` a `FUN-159`
**Gate**: quick
**Commit**: `feat(livro): resumo na página da direita em tela larga`

---

### T34: Resumo alternado na tela estreita (FUN-160 a FUN-162)

**What**: `TelaLivro` com `resumo='sozinho'`: só o resumo, sem "Anterior/Seguinte" da Bíblia nem deslize; ao sair, a mesma página da Bíblia.
**Estimativa**: 90 min
**Risco**: alto
**Domínio**: sim
**Criticidade**: comum
**Where**: `src/telas/TelaLivro.tsx`
**Depends on**: T33
**Reuses**: `area` e `navegacao` de `src/telas/TelaLivro.tsx:139-170`
**Requirement**: FUN-160, FUN-161, FUN-162

**Done when**:

- [ ] `sozinho`: o resumo do livro aberto ocupa a página e não há botões "Página anterior/seguinte" da Bíblia; deslize não passa página (FUN-160)
- [ ] Voltar a `desligado` mostra a mesma página da Bíblia de antes (FUN-161)
- [ ] O título do capítulo continua o da Bíblia
- [ ] Gate quick verde

**Tests**: unit em `src/telas/TelaLivro.test.tsx`, nomes com `FUN-160` ou `FUN-161`
**Gate**: quick
**Commit**: `feat(livro): resumo alternado na tela estreita`

---

### T35: Botão "Resumo" na barra e estado no app (FUN-153, FUN-157, FUN-162)

**What**: Prop `resumo` da `BarraTitulo` (depois do botão de formato, `aria-pressed`, só ícone abaixo de 640 px) e, no `App`, `resumoLarga` (persistido) e `resumoEstreita` (memória) ligados à `TelaLivro` e à `PaginaResumo`.
**Estimativa**: 90 min
**Risco**: alto
**Domínio**: sim
**Criticidade**: comum
**Where**: `src/App.tsx`
**Depends on**: T34
**Reuses**: `BotaoIcone` com `aria-pressed` (molde `PainelAparencia.tsx:58`); `src/componentes/BarraTitulo.tsx:52-61`; T29
**Requirement**: FUN-153, FUN-157, FUN-162

**Done when**:

- [ ] Botão só com sessão de dono, formato livro e livro aberto; sem sessão, sessão sem dono, capa, plano pago e rolagem: não existe (FUN-153)
- [ ] Larga: alterna e grava `mj:resumo`; reabrir o app volta ligado (FUN-157)
- [ ] Estreita: `aria-pressed="true"` com o resumo na tela (FUN-162); passar de larga ligada a estreita mostra a Bíblia, com o botão não pressionado
- [ ] Ordem na barra: formato, "Resumo", "Aa"
- [ ] Gate quick verde

**Tests**: unit em `src/App.test.tsx` e `src/componentes/BarraTitulo.test.tsx`, nomes com `FUN-153`, `FUN-157` ou `FUN-162`
**Gate**: quick
**Commit**: `feat(app): botão resumo no modo livro`

---

### T36: Prova de tela do resumo em tela larga

**What**: e2e em 1920 × 1080 com a API simulada: Independent Test de "Resumo na página da direita" e a posição das páginas.
**Estimativa**: 2h
**Risco**: baixo
**Domínio**: não
**Criticidade**: comum
**Where**: `e2e/resumo.spec.ts`
**Depends on**: None (a Phase anterior vem antes pela ordem das Phases; usa T35)
**Reuses**: `abrirNoLivro`, `passar` (`e2e/livro.spec.ts:9-21`); medidas de vão e linha de `e2e/livro-tela-cheia.spec.ts`
**Requirement**: FUN-153, FUN-154, FUN-155, FUN-156, FUN-157, FUN-159

**Done when**:

- [ ] Ligar em Gênesis 1: a página da Bíblia fica à esquerda e o resumo à direita (`boundingBox`), com o vão de 32 px e a linha (FUN-154)
- [ ] Avançar três vezes: a esquerda passa uma página por vez e a direita continua no resumo de Gênesis (FUN-155); desligar volta às duas páginas (FUN-156)
- [ ] Recarregar mantém o resumo ligado (FUN-157); capa sem resumo (FUN-159); sem sessão, sem botão (FUN-153)
- [ ] Gate full verde (`e2e/resumo.spec.ts`)

**Tests**: e2e em `e2e/resumo.spec.ts`, nomes com o FUN de cada passo
**Gate**: full
**Commit**: `test(e2e): resumo na página da direita`

---

### T37: Prova de tela do resumo na tela estreita e dos estados

**What**: e2e em 390 × 844 (alternar em Rute 2) e dos estados (Romanos publicado, Êxodo sem resumo, Marcos com falha, resumo de duas páginas).
**Estimativa**: 90 min
**Risco**: baixo
**Domínio**: não
**Criticidade**: comum
**Where**: `e2e/resumo.spec.ts`
**Depends on**: T36
**Reuses**: `page.route('**/api/**')` com respostas de exemplo
**Requirement**: FUN-160, FUN-161, FUN-162, FUN-163, FUN-166, FUN-167, FUN-168, FUN-169

**Done when**:

- [ ] Rute 2: "Resumo" mostra o resumo de Rute com `aria-pressed="true"`; de novo, a mesma página de Rute 2 (FUN-160 a FUN-162)
- [ ] Quatro títulos na ordem (FUN-163); 404 mostra a mensagem de sem resumo (FUN-168); falha mostra a mensagem e "Tentar de novo" (FUN-167); resposta lenta mostra "Carregando o resumo…" (FUN-166)
- [ ] Resumo longo: "1 de 2" e "seguinte" sem mudar a página da Bíblia (FUN-169)
- [ ] Gate full verde (`e2e/resumo.spec.ts`)

**Tests**: e2e em `e2e/resumo.spec.ts`, nomes com o FUN de cada passo
**Gate**: full
**Commit**: `test(e2e): resumo na tela estreita e estados`

---

### T38: Lógica da revisão dos resumos (FUN-170 a FUN-172)

**What**: `src/revisao-resumos/logica.ts` com `aprovar(item, editado?)`, `recusar(item, nota)` e `exportar(itens)`.
**Estimativa**: 2h
**Risco**: alto
**Domínio**: não
**Criticidade**: comum
**Where**: `src/revisao-resumos/logica.ts`
**Depends on**: None (a Phase anterior vem antes pela ordem das Phases; usa T37)
**Reuses**: `src/revisao/logica.ts` (molde); tipos de T16
**Requirement**: FUN-170, FUN-171, FUN-172

**Done when**:

- [ ] Estados `proposta`, `aprovada`, `recusada` por livro (FUN-170)
- [ ] Aprovar com texto editado guarda o editado como aprovado (FUN-171)
- [ ] Recusar com nota vazia ou só espaço falha; recusado sai da exportação de aprovados e leva a nota (FUN-172)
- [ ] `exportar` gera `{ formato: 'mj-resumos-v1', itens }` aceito por `lerArquivoExportado`
- [ ] Gate quick verde

**Tests**: unit em `src/revisao-resumos/logica.test.ts`, nomes com `FUN-170` a `FUN-172`
**Gate**: quick
**Commit**: `feat(revisao): lógica da revisão dos resumos`

---

### T39: Página da revisão dos resumos (FUN-170 a FUN-172)

**What**: `src/revisao-resumos/pagina.ts`: lista de livros com estado, seções editáveis, aprovar, recusar com nota, "Baixar exportação"; banco do artifact `resumos/<livro>`; texto só por `textContent`.
**Estimativa**: 2h
**Risco**: alto
**Domínio**: não
**Criticidade**: comum
**Where**: `src/revisao-resumos/pagina.ts`
**Depends on**: T38
**Reuses**: `DbLike` e `bancoDoArtifact` (`src/revisao/pagina.ts:10-58`); `textarea` (`:217`)
**Requirement**: FUN-170, FUN-171, FUN-172

**Done when**:

- [ ] Com banco dublê: abre a lista, edita "Contexto", aprova e a linha gravada tem o texto editado e `aprovada` (FUN-171)
- [ ] Recusar sem nota mostra o erro e não grava (FUN-172)
- [ ] Texto com `<img src=x>` aparece literal (sem elemento `img`)
- [ ] "Baixar exportação" entrega o JSON de `exportar`
- [ ] Gate quick verde

**Tests**: unit em `src/revisao-resumos/pagina.test.ts`, nomes com `FUN-170` a `FUN-172`
**Gate**: quick
**Commit**: `feat(revisao): página de revisão dos resumos`

---

### T40: Montagem do artifact e roteiro de operação

**What**: `revisao-resumos/vite.config.ts`, script `pnpm revisao-resumos:montar` e `revisao-resumos/LEIA-ME.md` com o caminho escrever → revisar → exportar para `resumos-exportados/` → `publicar.ts`, sem código novo por livro.
**Estimativa**: 1h
**Risco**: baixo
**Domínio**: não
**Criticidade**: comum
**Where**: `revisao-resumos/vite.config.ts`
**Depends on**: T39
**Reuses**: `revisao/vite.config.ts`, `revisao/LEIA-ME.md`
**Requirement**: FUN-170, FUN-173 (meta "outros 62 livros sem código novo")

**Done when**:

- [ ] `pnpm revisao-resumos:montar` gera um HTML único sem nenhum texto de resumo dentro (teste de arquivo procura os nomes das seções só como rótulos)
- [ ] O LEIA-ME cita os comandos reais e diz que produção pede confirmação escrita
- [ ] Gate quick verde

**Tests**: unit em `test/arquivos/revisao-resumos.test.ts`
**Gate**: quick
**Commit**: `build(revisao): artifact da revisão dos resumos`

---

### T41: Propostas de Gênesis, Rute, Marcos e Romanos

**What**: Escrever com IA as quatro propostas (linguagem simples, quatro seções, versículo-chave sem copiar o texto bíblico), conferir com `problemasDoResumo` e gravá-las como `proposta` no banco do artifact de revisão.
**Estimativa**: 2h
**Risco**: baixo
**Domínio**: não
**Criticidade**: comum
**Where**: banco do artifact de revisão (fora do repositório)
**Depends on**: None (a Phase anterior vem antes pela ordem das Phases; usa T40)
**Reuses**: `problemasDoResumo` (T16); `revisao-resumos/LEIA-ME.md` (T40)
**Requirement**: Goals da spec (piloto); FUN-152, FUN-170

**Done when**:

- [ ] As quatro propostas passam em `problemasDoResumo` (lista vazia), rodado na sessão sobre um arquivo em `resumos-exportados/`
- [ ] Publicar o artifact e gravar no banco dele só com a confirmação do dono (ação externa)
- [ ] Nada do texto em arquivo versionado: `git status` limpo além de `tasks.md`; o teste de T21 verde com a exportação presente
- [ ] Gate quick verde

**Tests**: unit (o teste de T21 com a exportação local e a validação de T16)
**Gate**: quick
**Commit**: `docs(resumos): propostas do piloto enviadas à revisão`

---

## Depois da feature (fora do `/executar`)

O dono revisa as quatro propostas no artifact; uma sessão exporta para `resumos-exportados/resumos.json`; com o Nível 2 do `/preparar` pronto, `publicar.ts --ambiente tst` grava no tst (ação externa, com confirmação). Produção só com o `/finalizar`.
