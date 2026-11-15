# Preparação: MinhaJornada

- **Data**: 2026-11-14 · **Destino**: Cloudflare Workers (só assets); `desenvolvimento` → tst, `main` → produção
- **Base**: `.specs/produto/decisao.md`, `.specs/features/leitor/design.md` (AD-001 a AD-003) e `tasks.md`

## Nível 1 — síncrono (necessário para /executar)

- [x] Repositório e remoto — branch base `desenvolvimento`; evidência: `git remote -v` → `origin https://github.com/leandrosegheto17/minhajornada.git`; `origin/desenvolvimento` e `origin/main` existem
- [x] Ambiente local — `pnpm install` e `pnpm dev` sobem o app em `127.0.0.1`, sem Docker; evidência: `pnpm dev` → `http://127.0.0.1:5173/` respondeu 200 (2026-11-14)
- [x] Esqueleto ponta a ponta — React 19 + Vite 8 + vite-plugin-pwa (`injectManifest`), Vitest (`componentes` e `arquivos`), Playwright sobre `vite preview`, ESLint e Prettier, `tokens.css`; evidência: `pnpm lint`, `pnpm typecheck`, `pnpm test` (3 testes), `pnpm build` e `pnpm e2e` (2 testes) verdes. `public/_headers`, manifesto e ícones são das tarefas T3 e T32, não do esqueleto
- [x] Comando de teste — `.specs/projeto/testes.json`: `pnpm typecheck && pnpm test` (reporter `dot`); o e2e roda no CI e ao fim do lote de interface
- [x] CI — GitHub Actions (`.github/workflows/ci.yml`: jobs `base` com lint, typecheck e testes, e `e2e` sobre o build) em push e PR; execução verde: https://github.com/leandrosegheto17/minhajornada/actions/runs/43660551409
- [x] Pré-voo — `preparar-ambiente.py`: "Ambiente pronto". Aviso restante: Node local v26.13.0 fora de `engines` (>=24 <25); o CI usa o `.nvmrc` (24)
- [x] Hook de commit — `.git/hooks/commit-msg` instalado (marca `# fluxos: commit-msg`)

## Nível 2 — assíncrono (até o fim da execução)

- [ ] Staging — Cloudflare Workers, `minhajornada-tst.ljssoftware.com.br`, a partir de `desenvolvimento`
- [ ] Produção — Cloudflare Workers, `minhajornada.ljssoftware.com.br`, a partir de `main`
- [x] Segredos dos ambientes — environments `tst` (só `desenvolvimento`) e `producao` (só `main`) no GitHub, cada um com os secrets `CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID`; nada no repositório; evidência: `gh secret list --env tst|producao` e `gh api .../deployment-branch-policies` (2026-11-15)
- [ ] Pipeline de deploy — workflow com smoke de cabeçalhos (CSP, nosniff, Referrer-Policy); reversão testada
  - Andamento (2026-11-14): `.github/workflows/deploy.yml` escrito (manual; `desenvolvimento` → tst, `main` → produção; confere CI verde, build, `wrangler deploy`, fumaça de cabeçalhos e `wrangler rollback` se a fumaça falhar) e `wrangler.jsonc` com `env.tst`; `wrangler deploy --dry-run` ok nos dois ambientes. Inerte até `DEPLOY_ATIVO=true`. Falta: primeiro deploy e reversão testada, combinados para depois da T3 (`public/_headers`) integrada na `desenvolvimento` (decisão do usuário em 2026-11-15); aí liga `DEPLOY_ATIVO=true`
- [ ] Observabilidade — logs e métricas do Workers na Cloudflare

## Fora do escopo deste projeto

- Banco e carga inicial — o leitor free não tem dado em servidor (AD-001)
- Docker e `docker compose` — não há serviço de apoio
- Backup e restauração testada — não há dado em servidor
- Sentry — sem servidor; sem motivo para o gerador de cabeçalhos do molde (AD-003)
