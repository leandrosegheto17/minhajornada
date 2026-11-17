# Liberações: MinhaJornada

## 2026-11-17 — Leitor bíblico gratuito, primeira versão (main @ 88746bd, Worker fd88d792)

- **Suíte**: 366 unitários e 27 e2e passaram, 0 falharam (`trava-testes.py --rodar` verde em f3cd0ac) · **Segurança**: sem crítico, alto, médio ou baixo (`features/leitor/seguranca.md`, reteste da rodada 2); informativos I-6 a I-9 sem ação obrigatória
- **Estratégia**: tudo de uma vez (site estático, sem dados, sem flag, sem migração) · **Staging**: sim, `minhajornada-tst.ljssoftware.com.br`, E2E geral 25 verdes (`.specs/e2e-geral.md`)
- **Alcance**: 100% em `minhajornada.ljssoftware.com.br`, publicado pelo `deploy.yml` a partir de `main` (run 44162470631); a mesma suíte E2E (25) passou na produção
- **Monitoramento**: logs do Worker no painel da Cloudflare (Workers & Pages › minhajornada › Observability); uso do dono nas 4 primeiras semanas. Sem alerta automático
- **Critério de parada**: página fora do ar, cabeçalho de segurança faltando ou erro ao abrir um livro
- **Reversão**: `pnpm exec wrangler rollback <versão anterior>` (produção, sem `--env`) · testada no staging em 2026-11-17 (rollback para 76fa12db, site 200 com os cabeçalhos, depois republicado). Em produção a única versão anterior é a do primeiro disparo, igual à atual
- **Resultado**: liberada
