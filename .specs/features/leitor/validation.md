# Validação: leitor — FAIL ❌ (rodada 1)

- **Data**: 2026-11-15 · **Branch**: feature/leitor @ 5a6b8af · **Árvore**: 939536c2f2e17b5f15f41c7a6bc6c399462a132d
- **Critérios**: 50/50 com asserção (detalhe em `verificacao-rodada-1.md`) · **Gate**: `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm e2e` = 324 unitários e 25 e2e passaram, 0 falharam
- **Sensor**: 13 mutações, 12 mortas, 1 sobreviveu (equivalente: 1, `baixar` sem o `cache.match`, já coberto por `carregarLivro`)
- **Revisão de código**: skill `revisao-codigo`, modo curto (`code-review`): 0 bloqueios, 2 sugestões confirmadas (A-06, A-07); 2 descartadas (erro de livro tratado como não baixado: decisão do dono; versão do build: mesma constante em `define` e na meta)
- **Segurança**: `auditor-seguranca` (`seguranca.md`): 0 crítico, 0 alto, 2 médios, 3 baixos, todos no retrabalho (A-08 a A-11)
- **Modelo**: /validar pedido em Sonnet; o dono escolheu seguir em Opus em parte da sessão

## Achados

| ID | `arquivo:linha` | Achado e evidência | Correção sugerida | Criticidade | Situação |
|---|---|---|---|---|---|
| A-01 | `src/telas/TelaLeitor.tsx:73-85` | Deslize aceita qualquer ponteiro: arrastar o mouse 60 px (selecionar texto) troca de capítulo; a spec fala em dedo | Só `pointerType === 'touch'`; teste com mouse 100/0 sem troca | comum | aberto |
| A-02 | `src/componentes/Versiculo.test.tsx:14-31`, `e2e/leitura.spec.ts:27-30` | FUN-01 (linha própria, número à esquerda) e FUN-02 (itálico) provados só por DOM | e2e de Filemom 1 confere `fontStyle` e `boundingBox` | comum | aberto |
| A-03 | `.specs/STATE.md` | Testes alterados em 2026-11-15 (convite, aparência 320 px) sem aprovação gravada em `## Autorizações` | Registrar a aprovação do dono, data e escopo | comum | aberto |
| A-04 | `src/estado/useLeitor.ts:62-66` | Decisão do dono estende o FUN-36 a JSON ilegível e erro do servidor, sem AD | AD-004 em `STATE.md` citando o FUN-36 | comum | aberto |
| A-05 | `.github/workflows/deploy.yml:93-94` | FUN-42 provado só sobre o arquivo `_headers`; a fumaça do deploy olha só `/` e 3 cabeçalhos | Fumaça também em `/sw.js` e num livro, com a CSP completa (`frame-ancestors`) | crítica | aberto |
| A-06 | `src/componentes/ConviteInstalacao.test.tsx:17` | `defineProperty` de `maxTouchPoints` não é desfeito no `afterEach`: vaza entre testes | Apagar a propriedade no `afterEach` | comum | aberto |
| A-07 | `e2e/aparencia.spec.ts:114-115` | Fecha o painel sem afirmar que fechou | `expect` do painel oculto antes do clique no título | comum | aberto |
| A-08 | `.github/workflows/deploy.yml:68-69, 79` | SEC-001 e SEC-004: token da Cloudflare no `env` do job inteiro (visível a install e build) e cache do pnpm no job com segredo | Job de build sem segredo com `dist/` como artefato; job de publicar com o token só nos passos do wrangler e sem cache (decisão do dono) | crítica | aberto |
| A-09 | GitHub, environments `producao` e `tst` | SEC-002: trava de branch só no `if` do workflow | Dono configura *Deployment branches* (`producao` ← `main`, `tst` ← `desenvolvimento`) | crítica | aberto |
| A-10 | `src/dados/livros.ts:59-68` | SEC-003: o fallback SPA (200 `text/html`) é gravado no `mj-livros` como livro e `baixarFaltantes` passa a pulá-lo | Exigir JSON válido (e `numero` certo) antes do `cache.put` | crítica | aberto |
| A-11 | `package.json` (wrangler) | SEC-005: `pnpm audit` com 4 altas em dev (`undici` via wrangler; glob/minimatch via workbox-build) | Atualizar o wrangler ou `overrides` do `undici`; `pnpm audit` sem altas | crítica | aberto |

## Lacunas e o que não foi validado

- Cabeçalhos em resposta real da Cloudflare; instalação em Chrome e Safari reais; contraste medido em pixel (só pelos tokens); execução em Node 24 (rodou em 26).
