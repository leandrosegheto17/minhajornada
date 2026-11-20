# Reconhecimento: resumo-livro

- **Data**: 2026-11-19 · **Commit**: 14ecf8a
- **Contexto do projeto**: `CLAUDE.md` da raiz não existe (o contexto do projeto está em `.specs/STATE.md` e no inventário); criar na integração
- **Encaixe**: padrão novo no projeto (servidor, banco, sessão), seguindo o padrão dos projetos irmãos; no front, estende o modo livro e a barra
- **Arquitetura**: exige mudança. Site só estático (AD-001) → Worker com script (Hono em `/api/*`), Neon via Hyperdrive, sessão e migrações. Decisão do dono: seguir com o risco registrado (AD-022)
- **Telas**: cria "Entrar"; muda a barra de título ("Sair", "Resumo") e o modo livro (resumo à direita na tela larga, alternado na estreita, estados do resumo)
- **Mockup**: aprovado em 2026-11-20 (`mockup/`, https://claude.ai/artifact/MQKVxYCMLeavYaThufGqTA)
- **Plano aprovado em**: 2026-11-20 (`design.md`, `reuso.md`, `tasks.md`; AD-023 e AD-024)

## Onde entra

| Arquivo ou módulo | O que muda | Novo? |
|---|---|---|
| `servidor/` (nome a fixar no design) | Entrada do Worker, app Hono, guarda de Host e origem, cabeçalhos, limite de login, sessão, rotas `/api/sessao`, `/api/entrar`, `/api/sair`, `/api/resumos/:n` | sim |
| `servidor/migracoes/` | Tabelas `usuarios` (com `dono`), `sessoes`, `resumos`; pgcrypto | sim |
| `scripts/publicar-resumos.ts`, `scripts/criar-dono.ts` | Publicação validada em transação (FUN-173 a FUN-175); criação do usuário dono | sim |
| `revisao-resumos/` e página em `src/revisao/` (ou pasta irmã) | Revisão dos resumos no artifact (FUN-170 a FUN-172) | sim |
| `wrangler.jsonc:6-19` | `main`, `run_worker_first: ["/api/*"]`, Hyperdrive e `ratelimits` no topo e em `env.tst` | não |
| `tsconfig.servidor.json`, `package.json` (`typecheck`), `vite.config.ts:70-85` | Alvo de typecheck do Worker; projeto de teste do servidor (node) | sim/não |
| `eslint.config.mjs:60-71` | Exceção do `fetch` para o servidor | não |
| `.github/workflows/ci.yml:16-47`, `deploy.yml:82-144` | Postgres no CI; migração antes do deploy; fumaça de `/api/resumos/1` (401) | não |
| `.gitignore:1-23` | Pasta da exportação dos resumos (FUN-176) | não |
| `src/dados/sessao.ts`, `src/dados/resumos.ts` | Chamadas à API (a regra de `fetch` só em `src/dados/`) | sim |
| `src/dados/preferencias.ts:10-16` | Chave `mj:resumo` (FUN-157), no molde de `conviteDispensado` `:111-117` | não |
| `src/estado/leitor.ts:9`, `:100-104`, `:179-183` | Tela `entrar`; `voltarPara` generalizado (FUN-138) | não |
| `src/telas/TelaEntrar.tsx` | Formulário de login (FUN-137, FUN-139, FUN-140) | sim |
| `src/componentes/BarraTitulo.tsx:8-21`, `:52-61`, `:82-90` | "Sair" (FUN-142) e botão "Resumo" depois do de formato (FUN-153) | não |
| `src/livro/folhear.ts:29-35`, `:58`, `:77`, `:88-95` | Separar "duas páginas" (larga e resumo desligado) de "capa em par" (larga) (FUN-155, FUN-159) | não |
| `src/telas/TelaLivro.tsx:108-122`, `:176-180`, `:209`, `:250-261` | Página da direita com o resumo, contador próprio, região com nome próprio | não |
| `src/livro/PaginaResumo.tsx` (ou similar) | Quatro seções, estados, páginas próprias (FUN-163 a FUN-169) | sim |
| `src/pwa/sw.ts:16` | `/^\/api\//` na denylist da navegação (FUN-151) | não |
| `src/App.tsx:30-99` | Ramo da tela "Entrar", estado de sessão, props novas | não |

## Reaproveitamento

| Necessidade da feature | Peça existente | Decisão | Por que (obrigatório em "criar novo") |
|---|---|---|---|
| Carregar resumo com carregando, erro e tentar de novo | `TelaCorrecoes.tsx:16`, `:51-70`; `Estado` (`base/Estado.tsx:30-66`) | reaproveitar | — |
| Mensagem "E-mail ou senha incorretos." | `Aviso` (`base/Aviso.tsx:13`, variante `erro`) | reaproveitar | — |
| Botões do formulário e "Resumo" | `BotaoPrimario` `Botoes.tsx:13`, `BotaoIcone` `:40` (aceita `aria-pressed`, molde `PainelAparencia.tsx:58`) | reaproveitar | — |
| Preferência "resumo ligado" | `preferencias.ts:111-117` | estender | chave nova `mj:resumo` |
| Voltar à tela de origem do login | `voltarPara` (`leitor.ts:36`, `:100-104`) | estender | hoje só a tela `emBreve` usa |
| Uma ou duas páginas, folhear | `folhear.ts` | estender | `larga` faz duas coisas (duas páginas e capa em par) |
| Medir e paginar o resumo | `useMedidas.ts:36-94`, `paginar` (`paginacao.ts:73`) | estender | o tipo `Bloco` é de livro; o resumo vira blocos de texto |
| Página de revisão no artifact | `src/revisao/pagina.ts` (`DbLike` `:16-21`, banco `:27-58`, `textarea` `:217`), `revisao/vite.config.ts`, `revisao/LEIA-ME.md` | estender | item novo (quatro seções, estado, nota obrigatória na recusa) |
| Validar referências e caracteres | `validarCorrecoes` e `semControle` (`src/biblia/correcoes/validar.ts:74`, `:89`), `nomeRef` `:5-8` | reaproveitar | — |
| Contar palavras (300 a 450) | nenhuma | criar novo | não há contagem de palavras no projeto |
| Validar "Livro cap:vers" contra o texto | `refValida` (`navegacao.ts:35-43`) só vê livro e capítulo | criar novo | precisa do versículo; usa a Bíblia convertida, como `validarCorrecoes` |
| Servidor, sessão, login, guarda, limite, migrações | nenhuma no projeto; moldes nos irmãos (abaixo) | criar novo | o projeto não tem servidor (AD-001); vira `reuso.md` no plano |
| Simular a API nos testes | `vi.stubGlobal('fetch')` (`livros.test.ts:14`); e2e com `page.route('**/api/**')` | reaproveitar | `e2e/apoio/servidor.ts:33-36` devolve `index.html` para `/api` |

## Modelo a seguir (moldes externos; o plano grava o `reuso.md`)

Commits: treInAmento `d2acb96` (2026-11-19), ControleEmCasa_LJS `41debe6` (2026-11-14), GestaoDaPelada_v2 `c95e0dce` (2026-11-14).

- Worker com assets e `/api/*`: GestaoDaPelada `wrangler.jsonc` (L8 `main`, L19 `run_worker_first`, L23 `ratelimits`, L35 `hyperdrive`), `backend/api/src/entrada/worker.ts:8-17`; `workers_dev: false` e `preview_urls: false` do treInAmento `wrangler.jsonc`.
- Cliente `pg` por requisição e transação: GestaoDaPelada `backend/api/src/infraestrutura/db/cliente.ts:31-70` (sem Kysely).
- Cookie e token: ControleEmCasa `infraestrutura/sessao/cookie.ts:9-41`, `seguranca/token.ts:7-19`; validar e renovar sessão: `repositorios/sessoes.ts:13-58` (trocar 15 min e 12 h por 7 dias e 30 dias); sair: `entrada/rotas/acesso.ts:91-95`.
- Senha: treInAmento `db/schema.sql:66-111` (`usuario_entrar` com hash fixo, `REVOKE ... FROM PUBLIC`).
- Guarda: GestaoDaPelada `entrada/middlewares/origem-host.ts:44-55` (origem) + treInAmento `src/lib/acesso/guarda.ts:15-40` (Host 421 com URL configurada, falha fechada); testes por método e variante: treInAmento `guarda.test.ts:21-132`.
- Cabeçalhos da API: GestaoDaPelada `middlewares/cabecalhos.ts:17-33` (`no-store`, `nosniff`, CSP `default-src 'none'`, Referrer `same-origin`).
- Limite: GestaoDaPelada `middlewares/limite-taxa.ts:23-40` (429 com `Retry-After`), chave `CF-Connecting-IP` (ControleEmCasa `middleware/limite.ts:11-14`); aqui com falha fechada (AD-022).
- Migrações: `node-pg-migrate` como ControleEmCasa (`backend/scripts/package.json`, `migracoes/`) e GestaoDaPelada `db/migrar.ts:1-25` (advisory lock); no deploy: ControleEmCasa `.github/workflows/deploy.yml:101-112`.
- Banco de teste: GestaoDaPelada `backend/api/test/apoio/banco.ts:32-60` (`teste_<hex>`, drop no `finally`); Postgres no CI: ControleEmCasa `ci.yml` job `banco`.
- Front: ControleEmCasa `frontend/web/src/dados/sessao.ts:37-60` (`GET /api/sessao`, 401 → sem sessão, sem rede → `rede`); 401 global `dados/transporte.ts:21-27`.
- No próprio projeto: estados do resumo como `TelaCorrecoes.tsx:51-93`; revisão como `src/revisao/pagina.ts`.

## Convenções do projeto

- `fetch` só em `src/dados/` — `eslint.config.mjs:60-71`; texto só por `textContent`, sem `innerHTML` — `eslint.config.mjs:8-71`, `src/revisao/pagina.ts:2-3`.
- Preferências validadas no localStorage com prefixo `mj:` — `src/dados/preferencias.ts:10-16`.
- Testes ao lado do código (`src/**/*.test.tsx`, jsdom) e de arquivo em `test/arquivos/` (node) — `vite.config.ts:70-85`.
- CSP só `'self'`, `form-action 'none'` — `public/_headers:5`: o login usa `fetch`, não envio de `<form>`.
- Commits em português, `tipo(escopo): descrição` — hook `commit-msg`.

## Testes

- **Rodar a suíte**: `pnpm typecheck && pnpm test` (`.specs/projeto/testes.json`); e2e `pnpm build:e2e && pnpm e2e`. No Windows, pelo Git Bash.
- **Cobrem o trecho**: `TelaLivro.test.tsx:60-475`, `folhear.test.ts:13-148`, `BarraTitulo.test.tsx:21-85`, `App.test.tsx:105-113`, `useMedidas.test.ts`, `wrangler.test.ts:25-36`, `deploy.test.ts:45-227`, `cabecalhos.test.ts:35-74`, e2e `livro.spec.ts`, `livro-tela-cheia.spec.ts`.
- **Mudam (autorização em `## Autorizações`)**: `wrangler.test.ts:33-36` ("sem `main`, sem bindings"), `deploy.test.ts:78-85` (token só em `wrangler deploy|rollback`, com o migrador), `BarraTitulo.test.tsx:69` e `App.test.tsx:105-113` (a barra deixa de ir ao "em breve").
- **Sem teste**: `src/pwa/sw.ts` (nenhuma rota testada); o resto é novo.

## Fragilidades e riscos

- Maior risco: primeiro servidor, banco e login do projeto; tudo novo, com o CI ganhando Postgres e o deploy ganhando migração e segredos do Neon — `.github/workflows/ci.yml:16-47`, `deploy.yml:82-144`, `.specs/preparacao.md` (banco "fora do escopo" hoje).
- `larga` sobrecarregada em `TelaLivro.tsx:33,110,117,177` e `folhear.ts:29,58,77,88`: mexer no "1 página por vez" pode quebrar a capa em par (FUN-88, FUN-89, AD-005).
- `TelaLivro.tsx` (270 linhas) junta medida, paginação, navegação, deslize, capa e estados; o resumo deve entrar em componente próprio.
- `_headers` não vale para as respostas do script do Worker (PREMISSA a conferir com `wrangler dev`): os cabeçalhos da API saem do Hono; `not_found_handling` SPA com `run_worker_first` a conferir.
- Ids de namespace do `ratelimits` podem colidir com os dos irmãos na mesma conta (ControleEmCasa 2001-2003, GestaoDaPelada 2001-2005, treInAmento 3001-3005 e 3101-3105): escolher ids livres no `/preparar`.
- Seletores do e2e dependem de `aria-label="Leitura em formato livro"` (`TelaLivro.tsx:161`) e do título `:239`: o resumo precisa de região com nome próprio.
- `aria-label` e texto da conta divergem (`BarraTitulo.tsx:85`, `:89`).
- Repositório público: nenhum resumo real em teste, fixture ou commit (FUN-152).
