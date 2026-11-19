# Causa: convite-coberto-iphone

- **Reproduzido**: sim
- **Teste planejado**: `e2e/convite-instalacao.spec.ts` (novo)
- **Causa confirmada**: sim
- **Plano da correção**: `tasks.md` pronto
- **Commit da correção** (preenchido na execução): pendente

## Reprodução

- **Caso mínimo**: `pnpm build:e2e`, `vite preview --outDir dist-e2e --port 4173`, abrir `/` num contexto Playwright `devices['iPhone 14']` e ler `document.elementFromPoint` no centro do botão "Dispensar convite"; ou `URL_STAGING=http://127.0.0.1:4173 pnpm exec playwright test -c playwright.staging.config.ts e2e-geral/sobre-instalacao.spec.ts`
- **Resultado**: no centro do botão (325, 572, 44 × 44) o elemento de cima é `.cartao-inicial` (`z-index: 1`, caixa de y 288 a 617); o convite (`z-index: auto`, `position: fixed`) fica atrás do cartão e do crédito da foto (captura local). Na produção (`88746bd`, sem a página inicial nova) o botão é o elemento de cima · **Taxa**: sempre (local e staging)

## Teste que falha, planejado

- **Teste**: `e2e/convite-instalacao.spec.ts`, iPhone 14 emulado (`test.use` de `devices['iPhone 14']`), na página inicial: (a) o elemento em `elementFromPoint` no centro do botão "Dispensar convite" é o próprio botão (ou está dentro dele), e o mesmo para o texto do convite; (b) tocar em "Dispensar convite" esconde o convite e, depois de `reload`, ele não volta, com o título da página inicial visível (FUN-46, FUN-47)
- **Comando**: `pnpm build:e2e && pnpm e2e e2e/convite-instalacao.spec.ts`
- **Falha esperada**: a asserção (a) falha com o elemento de cima `cartao-inicial` em vez do botão; (b) estoura o tempo no clique ("subtree intercepts pointer events") · **Saída vermelha real** (T1, sem a correção): FUN-46 `Error: o toque no botão cai em SECTION._cartao-inicial_oxljy_69` (`e2e/convite-instalacao.spec.ts:30`); FUN-47 `TimeoutError: locator.click: Timeout 5000ms exceeded`. Com a correção: 19 passaram (`convite-instalacao`, `entrada`, `aparencia`)

## Causa raiz

- **Origem**: `src/componentes/ConviteInstalacao.module.css:3-17` — o convite é uma camada fixa sobre a página, mas não declara `z-index`; fica no nível `auto`, abaixo de qualquer elemento posicionado com `z-index` positivo
- **Desde**: `1dc0b5c` (`interface-livro`, T19): a página inicial passou a ter `.cartao-inicial` e `.credito-imagem` com `z-index: 1` (`src/telas/TelaInicial.module.css:37,77`), que no iPhone ocupam a faixa do rodapé onde o convite fica
- **Por quês**: não dá para dispensar o convite ← o toque cai no cartão ← o cartão é pintado por cima do convite ← o cartão tem `z-index: 1` e o convite `auto` ← o convite nunca declarou a camada em que vive (antes não havia nada posicionado com `z-index` na tela)
- **Hipóteses descartadas**: o convite não fica atrás da barra (`z-index: 3`, no topo); o defeito não é do `ehSafariIOS` (o convite aparece)
- **Mesmo defeito em outros pontos**: nenhum outro elemento fixo sem `z-index` (o painel da aparência tem `2` e a barra `3`); as outras telas não têm elemento com `z-index` sob o convite
