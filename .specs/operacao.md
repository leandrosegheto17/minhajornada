# Operação e aprendizado: MinhaJornada

- **Produto**: leitor bíblico gratuito, PWA estático em `https://minhajornada.ljssoftware.com.br` (staging: `minhajornada-tst.ljssoftware.com.br`), Cloudflare Workers só com assets, R$ 0/mês
- **Como acompanhar**: logs do Worker no painel da Cloudflare (Workers & Pages › minhajornada › Observability); conferir pelo uso. Não há alerta automático nem servidor próprio. Verificação rápida: `URL_STAGING=https://minhajornada.ljssoftware.com.br pnpm exec playwright test -c playwright.staging.config.ts` (25 verificações, só leitura)
- **Quem responde**: o dono do projeto
- **Problema em produção**: voltar a versão com `pnpm exec wrangler rollback <versão>` (lista: `pnpm exec wrangler deployments list`); depois corrigir pelo `/fluxo` (bug)
- **Hipótese**: o dono passa a usar o MinhaJornada como leitor principal (H1 de `decisao.md`); leitores de fora sem meta numérica (V2)
- **Como saber se se confirmou**: o dono lê pelo app nas 4 primeiras semanas e diz se voltou ao YouVersion ou a outro leitor
- **Pendências de `decisao.md`** (nenhuma bloqueia o leitor): V1 entrevistas (condição para planejar o pago), V3 recepção da linguagem da Bíblia Livre, V4 medição de uso sem cookie e LGPD
- **Primeira revisão**: 2026-12-15. **Decisão**: persistir, pivotar, evoluir ou encerrar; evoluir volta ao `/fluxo` como feature
- **Lacunas conhecidas** (`features/leitor/validation.md`, `e2e-geral.md`): instalar pelo Safari do iPhone real não foi testado à mão; A-16 aceito como lacuna (valor errado de `referrer-policy` e `nosniff` sem prova por execução)
