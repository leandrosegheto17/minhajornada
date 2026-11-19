# Liberações: MinhaJornada

## 2026-11-17 — Leitor bíblico gratuito, primeira versão (main @ 88746bd, Worker fd88d792)

- **Suíte**: 366 unitários e 27 e2e passaram, 0 falharam (`trava-testes.py --rodar` verde em f3cd0ac) · **Segurança**: sem crítico, alto, médio ou baixo (`features/leitor/seguranca.md`, reteste da rodada 2); informativos I-6 a I-9 sem ação obrigatória
- **Estratégia**: tudo de uma vez (site estático, sem dados, sem flag, sem migração) · **Staging**: sim, `minhajornada-tst.ljssoftware.com.br`, E2E geral 25 verdes (`.specs/e2e-geral.md`)
- **Alcance**: 100% em `minhajornada.ljssoftware.com.br`, publicado pelo `deploy.yml` a partir de `main` (run 44162470631); a mesma suíte E2E (25) passou na produção
- **Monitoramento**: logs do Worker no painel da Cloudflare (Workers & Pages › minhajornada › Observability); uso do dono nas 4 primeiras semanas. Sem alerta automático
- **Critério de parada**: página fora do ar, cabeçalho de segurança faltando ou erro ao abrir um livro
- **Reversão**: `pnpm exec wrangler rollback <versão anterior>` (produção, sem `--env`) · testada no staging em 2026-11-17 (rollback para 76fa12db, site 200 com os cabeçalhos, depois republicado). Em produção a única versão anterior é a do primeiro disparo, igual à atual
- **Resultado**: liberada

## 2026-11-19 — Interface do livro, texto atualizado e páginas do livro (desenvolvimento @ bf74d37)

- **Suíte**: `trava-testes.py --rodar` verde em `bf74d37`; CI do push verde (run 44607569313)
- **Staging**: publicado pelo `deploy.yml` (run 44607847440, fumaça verde); E2E geral 25 passaram, 1 falhou (`e2e-geral/sobre-instalacao.spec.ts:18`, convite coberto no iPhone)
- **Produção**: não publicada; segurada pelo dono até a correção do bug `.specs/bugs/convite-coberto-iphone/`
- **Resultado**: parada no staging

## 2026-11-19 — Interface do livro, texto atualizado, páginas do livro e correção do convite (main @ 64dcd64)

- **Suíte**: `trava-testes.py --rodar` verde em `64dcd64`; CI verde nos pushes da `desenvolvimento` (run 44625904085) e da `main` (run 44627055981)
- **Estratégia**: tudo de uma vez (site estático, sem dados, sem flag, sem migração); `main` avançada por fast-forward de `88746bd` para `64dcd64`
- **Staging**: `deploy.yml` run 44626730320, fumaça verde; E2E geral 26 passaram, 0 falharam (inclui `sobre-instalacao`, que segurou a tentativa anterior)
- **Alcance**: 100% em `minhajornada.ljssoftware.com.br`, `deploy.yml` run 44627280964 a partir de `main`; E2E geral na produção: 26 passaram, 0 falharam
- **Monitoramento**: logs do Worker no painel da Cloudflare; uso do dono
- **Critério de parada**: página fora do ar, cabeçalho de segurança faltando, erro ao abrir um livro ou convite que não fecha no iPhone
- **Reversão**: `pnpm exec wrangler rollback <versão anterior>` (produção, sem `--env`); a versão anterior é a de 2026-11-17
- **Resultado**: liberada
