# Resumo do livro: mapa de reuso

Base: GestaoDaPelada_v2 @ c95e0dce (G), ControleEmCasa_LJS @ 41debe6 (C), treInAmento @ d2acb96 (T; o HEAD de lá é 0253470, ler com `git show d2acb96:<arquivo>`), conferido em 2026-11-20.

Os testes copiados recebem o `FUN-NN` desta spec, nunca o ID da origem. **Tipo**: `valor` = só troca nome ou valor (a tarefa roda o comando e confere); `adaptado` = a lógica muda (a origem é aberta na execução).

| # | Origem (`arquivo:linhas`) | Destino | Tipo | O que muda na adaptação | FUN | Tarefa |
|---|---|---|---|---|---|---|
| R1 | G `wrangler.jsonc:8,19,23-29,35-41`; T `wrangler.jsonc:14,16` | `wrangler.jsonc` | adaptado | `main` = `servidor/entrada/worker.ts`; um binding `LIMITE_ENTRAR` (5 por 60 s); `hyperdrive` com id do `/preparar`; `vars.URL_PUBLICA`; `compatibility_flags: ["nodejs_compat"]`; tudo no topo e em `env.tst`; `namespace_id` livre (G 2001-2005, C 2001-2003, T 3001-3005 e 3101-3105 ocupados) | FUN-140, FUN-151 | T2 |
| R2 | G `backend/api/src/entrada/worker.ts:8,15-17` | `servidor/entrada/worker.ts` | adaptado | Sem `queue` nem `scheduled`; monta `Deps` do `env` (Hyperdrive, `LIMITE_ENTRAR`, `URL_PUBLICA`) | — | T2 |
| R3 | G `backend/api/src/infraestrutura/db/cliente.ts:17,31-116` | `servidor/db/cliente.ts` | adaptado | Sem `aoAbrir` de RLS; `emTransacao` própria; mensagem de `ErroBancoIndisponivel` em português sem host; fechar no `finally` do app em vez de `waitUntil` | FUN-146, FUN-173 | T10 |
| R4 | C `backend/api/src/infraestrutura/seguranca/token.ts:7-19` | `servidor/sessao/token.ts` | valor | Copiar sem mudança `gerarToken`, `hashToken`, `tokenTemFormato` | FUN-141 | T11 |
| R5 | C `backend/api/src/infraestrutura/sessao/cookie.ts:9-41` | `servidor/sessao/cookie.ts` | valor | Nome `__Host-sid` → `__Host-sessao`; `MAX_AGE_SESSAO_S` 12 h → 30 dias (`60 * 60 * 24 * 30`) | FUN-138 | T11 |
| R6 | C `backend/api/src/infraestrutura/db/repositorios/sessoes.ts:8-11,13-67` | `servidor/repositorios/sessoes.ts` | adaptado | `INATIVIDADE_MS` 15 min → 7 dias; `ABSOLUTA_MS` 12 h → 30 dias; tabela `app.sessao` → `sessoes` (`criada_em`, `usada_em`); vencida é apagada (FUN-144); devolve `dono` | FUN-141, FUN-144 | T12 |
| R7 | C `backend/api/src/entrada/rotas/acesso.ts:91-95` | `servidor/rotas/acesso.ts` (`POST /api/sair`) | adaptado | Caminho `/api/sessao/sair` → `/api/sair`; 204 idempotente | FUN-143 | T14 |
| R8 | T `db/schema.sql:66,85-106,109-110` | `servidor/migracoes/<data>_inicial.sql` (`usuario_entrar`) | adaptado | Tabela `usuarios`; `RETURNS uuid`; sem `usuario_cadastrar`; `GRANT EXECUTE` só a `mj_app`; hash fixo próprio gerado com `crypt('x', gen_salt('bf', 12))` | FUN-139, FUN-141 | T8 |
| R9 | G `backend/api/src/entrada/middlewares/origem-host.ts:29-37,44-56` + T `src/lib/acesso/guarda.ts:15-40` | `servidor/middlewares/guarda.ts` | adaptado | `APP_URL` → `URL_PUBLICA`; sem exceção de webhook nem loopback; 421 por Host e 500 sem URL (de T) | casos limite (Host, origem) | T4 |
| R10 | T `src/lib/acesso/guarda.test.ts:21-132` | `servidor/middlewares/guarda.test.ts` | adaptado | IDs `PAG-30` a `PAG-33` → nomes com "Host 421", "origem 403" e o FUN da rota; mesmos casos por método (POST, PUT, PATCH, DELETE), caixa, `null`, URL ausente | casos limite | T4 |
| R11 | G `backend/api/src/entrada/middlewares/cabecalhos.ts:9-33` | `servidor/middlewares/cabecalhos.ts` | valor | Copiar; CSP `default-src 'none'; frame-ancestors 'none'` igual | FUN-151 | T5 |
| R12 | G `backend/api/src/entrada/middlewares/limite-taxa.ts:23-40` + C `backend/api/src/middleware/limite.ts:11-14` | `servidor/middlewares/limite.ts` | adaptado | Um binding; chave por `ipDoCliente` de C (no lugar de `chaveIp` de G); binding ausente → 503 (falha fechada, AD-022); corpo `{ erro: 'limite' }` | FUN-140 | T6 |
| R13 | C `backend/scripts/package.json:9,28-29,33` | `package.json` (script `migrar`, dependências) | valor | `-m servidor/migracoes --database-url-var DATABASE_URL_DONO --no-single-transaction`; `node-pg-migrate ^9.0.0`, `pg ^8.23.1`, `@types/pg ^8.23.1` | — | T1, T7 |
| R14 | G `backend/api/src/infraestrutura/db/migrar.ts:2,17-30` | `servidor/migrar.ts` | adaptado | Sem `detectarEstado`; `checkOrder: true`, `singleTransaction: false`; lock do `node-pg-migrate` | — | T7 |
| R15 | C `.github/workflows/deploy.yml:108-112` | `.github/workflows/deploy.yml` (passo de migração) | adaptado | Sem o dump cifrado (`:101-106`) e sem `--sim`; `DATABASE_URL_DONO` só neste passo; antes do `wrangler deploy` | — | T22 |
| R16 | G `backend/api/test/apoio/banco.ts:6,35-58` | `servidor/test/apoio/banco.ts` | adaptado | Sem molde do workerd (`:44-48`): cria `teste_<hex>` e aplica as migrações; host só `127.0.0.1`/`localhost`/`postgres`; `DROP DATABASE … WITH (FORCE)` no `finally` | — | T7 |
| R17 | C `.github/workflows/ci.yml:40-62` | `.github/workflows/ci.yml` (serviço no job `base`) | valor | `postgres:18`, banco `minhajornada`, usuário `mj_dono`; `DATABASE_URL_TESTE`; sem `_APP`/`_BACKUP` | — | T3 |
| R18 | C `frontend/web/src/dados/sessao.ts:37-63` | `src/dados/sessao.ts` | adaptado | `obterSessao` → `lerSessao` com `'dono' \| 'usuario' \| 'sem' \| 'rede'`; `entrar`; dica `mj:dono` no lugar de `encerrarNoAparelho` | FUN-138, FUN-142, FUN-145 | T24 |
| R19 | C `frontend/web/src/dados/transporte.ts:22,25,28-30` | `src/estado/useSessao.ts` (`perder`) | adaptado | Sem transporte global: 401 do resumo chama `perder()` (FUN-145) | FUN-145 | T27 |

Moldes do próprio projeto (não entram no mapa): `src/revisao/pagina.ts:10-58`, `src/telas/TelaCorrecoes.tsx:51-93`, `src/dados/preferencias.ts:111-117`, `src/biblia/correcoes/validar.ts:5-8,74,89`.
