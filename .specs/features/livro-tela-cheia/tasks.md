# Modo livro em tela cheia no PC: tarefas

**Modo**: enxuto
**Base**: `.specs/features/livro-tela-cheia/pedido.md` (FUN-95 a FUN-102, decisões do usuário de 2026-11-18), conferido em 2026-11-18 no commit `bb30182`
**Branch pai**: desenvolvimento
**Status**: Draft

**Segurança padrão de app web:** não se aplica nesta feature. O site é estático na Cloudflare (AD-001), sem servidor que escute porta, receba requisição que mude estado ou valide `Host`. Os cabeçalhos (FUN-42, AD-003) não mudam, e a mudança é só de CSS: nenhum `style` inline nem script novo (a CSP sem `unsafe-inline` de AD-003 continua valendo). Nenhum dado do usuário vira HTML.

**Conferência spec × design:** uma divergência interna da Base, sem decisão: FUN-95 manda a barra de borda a borda "com 900 px ou mais de largura" e FUN-102 manda a barra "como hoje" quando a tela "é mais alta que larga" (ex.: 1024 × 1366). Ver `Perguntas para o usuário` no retorno do planejador; T1 aplica a opção recomendada (condição de FUN-95, só largura) até a AD ser registrada. Decisões anteriores que valem: AD-001 a AD-010.

**Testes existentes que mudam:** nenhum, pela conferência. `src/estilo/estilo.test.ts:74` e `:78` só conferem que `--largura-barra` e `--largura-pagina` existem, e os dois tokens ficam (a tela estreita usa `--largura-pagina`; `tokens.css` e `.specs/mockup/tokens.css` não mudam). Os e2e de tela larga (`e2e/livro.spec.ts:72-81`, `e2e/capa.spec.ts:33-56`, `e2e/entrada.spec.ts:21-40`) conferem ordem e lado, não tamanho, e continuam válidos. Se algum quebrar, a troca está autorizada (`.specs/STATE.md`, `## Autorizações`, 2026-11-18), tão forte quanto antes e com o motivo no commit.

---

## Delta

1. Tudo o que a Base cita existe no HEAD: `livro.module.css:52-65` (`.pagina` com `aspect-ratio: 3 / 4`, `max-height: calc(100vh - var(--altura-barra) - 170px)`, `min-height: 420px`), `BarraTitulo.module.css:17` (`max-width: var(--largura-barra)`, 1240 px), `--esp-6: 24px` em `src/estilo/tokens.css:52`.
2. A Base não viu: `.livro__cabeca` também é limitada (`max-width: calc(2 * var(--largura-pagina))`, `livro.module.css:14`), as colunas idem (`:47`), e `.navegacao-pagina` é centrada (`:123-128`).
3. A Base não viu: `.medida` (`livro.module.css:252-270`) repete a conta da altura da página com o número mágico 170 px. É ela que precisa acompanhar o tamanho novo (A-11, FUN-100).
4. A Base não viu: a margem lateral da barra hoje é 12 px (`--esp-3`, `BarraTitulo.module.css:19`), não 24 px. FUN-95 pede 24 px (`--esp-6`).
5. Decisão nova (mecanismo, sem mudar escopo): o tamanho da página na tela larga sai de duas propriedades locais de `.livro`, `--largura-pagina-larga` e `--altura-pagina-larga`, usadas **pela página e pela medida** (as duas leem a mesma variável, então não divergem). Motivo: medir a página por JS e escrever `style` inline esbarra na CSP de AD-003. Nada entra em `tokens.css`, que continua idêntico ao do mockup.
6. Decisão nova: o "vão entre as páginas" de FUN-96 continua 0 (as páginas encostam pela lombada, como hoje). O teste mede o vão real, então trocá-lo depois não quebra a asserção.
7. Decisão nova: "alinhado à borda" (FUN-98, FUN-99) é provado pela caixa do controle (`boundingBox` do botão do título, do texto da posição e dos botões), com tolerância de 1 px.
8. A altura da barra é 57 px (56 px de `--altura-barra` mais 1 px de borda, `BarraTitulo.module.css:8`): a conta da altura da página desconta os dois, senão sobra 1 px de rolagem (FUN-97).
9. Sem T0 de código: o comportamento existente sem teste é a geometria da tela estreita (FUN-102), caracterizada em T0 por e2e antes da mudança.

## Critérios

| ID | Resumo | Tarefa |
|---|---|---|
| FUN-95 | Com 900 px ou mais, barra de borda a borda em todas as telas: marca a 24 px da esquerda, conta a 24 px da direita | T1 |
| FUN-96 | Tela larga: duas páginas na largura da tela menos as margens e o vão, metade cada, sem proporção fixa | T2 |
| FUN-97 | Tela larga: páginas na altura entre título e botões, sem rolagem vertical de 900 × 600 a 1920 × 1200 | T2 |
| FUN-98 | Tela larga: título alinhado à borda esquerda da página da esquerda; posição à borda direita da página da direita | T4 |
| FUN-99 | Tela larga: "Anterior" no canto inferior esquerdo e "Seguinte" no inferior direito, alinhados às páginas | T5 |
| FUN-100 | Ao mudar o tamanho da janela, repagina sem versículo cortado ou escondido, em 1280 × 800 e 1920 × 1080 | T2 (medida igual à página), T3 (livro inteiro e troca de tamanho) |
| FUN-101 | Tela larga: capa e plano pago do mesmo tamanho das páginas de texto | T6 |
| FUN-102 | Tela não larga (menos de 900 px ou retrato): modo livro, barra e botões como hoje | T0 (caracterização antes), T1 a T6 (o T0 continua verde) |

## Linha de base

- **Comando**: `pnpm typecheck && pnpm test` (`.specs/projeto/testes.json`), rodado em 2026-11-18 no commit `bb30182` (branch `desenvolvimento`)
- **Resultado**: typecheck verde; Vitest 41 arquivos, 628 testes, todos passando (24 s). E2E não rodado na linha de base (roda no CI e ao fim do lote de interface)
- **Falhas preexistentes**: nenhuma. Aviso de ambiente: Node 26.13 local fora de `engines` (`>=24 <25`)
- **T0 (rede de proteção)**: necessária. A feature mexe no CSS que também vale para a tela estreita e para o retrato, e nenhum teste fixa a geometria de lá (os e2e de 375 × 812 conferem contagem de páginas e corte de linha, não tamanho nem posição). T0 caracteriza essa geometria no HEAD antes da mudança
- **Regra do /executar**: nenhuma falha nova; a suíte inteira e o E2E rodam ao fim da feature

---

## Test Coverage Matrix

> Gerada do código e da Base. Guidelines encontradas: `.claude/CLAUDE.md` (Execução, Testes), `vite.config.ts:65-88` (projetos `componentes` e `arquivos`), `.specs/projeto/testes.json`. Amostras: `e2e/livro.spec.ts`, `e2e/capa.spec.ts`, `e2e/entrada.spec.ts`, `src/estilo/estilo.test.ts`.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| CSS do modo livro e da barra (`src/livro/livro.module.css`, `src/componentes/BarraTitulo.module.css`) | e2e (Playwright) | Asserção espacial (`boundingBox`) para cada critério de posição e tamanho, em 900 × 600, 1280 × 800, 1920 × 1080 e 1920 × 1200; tela estreita e retrato caracterizados | `e2e/livro-tela-cheia.spec.ts` | `pnpm build && pnpm e2e e2e/livro-tela-cheia.spec.ts` |
| Invariante página = medida no CSS | unit (node, lê o arquivo) | A regra da tela larga de `.pagina` e a de `.medida` usam as mesmas variáveis de largura e altura; nenhuma usa `aspect-ratio` nem número mágico | `test/arquivos/*.test.ts` | `pnpm vitest run --project arquivos --reporter=dot` |
| Paginação e medida (`src/livro/useMedidas.ts`, `src/livro/paginacao.ts`) | e2e | Livro inteiro sem bloco escondido ou linha cortada, antes e depois de trocar o tamanho da janela | `e2e/livro-tela-cheia.spec.ts` | `pnpm build && pnpm e2e e2e/livro-tela-cheia.spec.ts` |
| Componentes React (`src/telas/TelaLivro.tsx`) | unit (Testing Library) | Só se a tarefa mexer na marcação: os testes de `src/telas/TelaLivro.test.tsx` continuam verdes | `src/**/*.test.tsx` | `pnpm vitest run --project componentes --reporter=dot` |

## Gate Check Commands

> Do `package.json` e de `.specs/projeto/testes.json`.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Tarefas só com teste unitário | `pnpm typecheck && pnpm vitest run --reporter=dot` |
| Full | Tarefas com e2e (todas desta feature) | `pnpm typecheck && pnpm vitest run --reporter=dot && pnpm build && pnpm e2e e2e/livro-tela-cheia.spec.ts` |
| Build | Fim da feature | `pnpm lint && pnpm typecheck && pnpm vitest run --reporter=dot && pnpm build && pnpm e2e` |

---

## Execution Plan

As Phases rodam em ordem; dentro de cada uma, as tarefas seguem a ordem indicada. Lotes previstos: **Lote 1** comum (Phases 1 e 2, 2h30), **Lote 2** crítico (Phase 3, 4h), **Lote 3** comum (Phase 4, 2h45).

### Phase 1: Rede de proteção (comum)

```
T0
```

### Phase 2: Barra de borda a borda (comum)

```
T1
```

### Phase 3: Página e medida do mesmo tamanho (crítica)

```
T2 → T3
```

### Phase 4: Alinhamentos, botões nos cantos e capa (comum)

```
T4 → T5 → T6
```

### Phase 5: Retrabalho R1 (comum)

```
T7
```

### Phase 6: Retrabalho R2 (comum)

```
T8
```

---

## Task Breakdown

### T0: Caracterizar a tela estreita e o retrato antes da mudança (FUN-102)

**What**: Criar `e2e/livro-tela-cheia.spec.ts` com testes que fixam, no HEAD, a geometria de hoje da tela não larga, e confirmar que passam antes de qualquer mudança de CSS.
**Estimativa**: 90 min
**Risco**: baixo
**Domínio**: não
**Criticidade**: comum
**Where**: `e2e/livro-tela-cheia.spec.ts` (novo)
**Depends on**: None
**Reuses**: `abrirNoLivro` e `paginas` como em `e2e/livro.spec.ts:9-21`; `barra` como em `e2e/entrada.spec.ts:7`; viewport por `test.use` como em `e2e/livro.spec.ts:100`
**Requirement**: FUN-102

**Done when**:

- [x] Em 375 × 812 e 899 × 800 (Rute 1, modo livro): uma página; largura = `min(520, innerWidth - 24)` e centrada (meio da caixa a 1 px do meio da tela); altura = `innerHeight - 56 - 150` (±1 px, `livro.module.css:234`); "Anterior" e "Seguinte" centrados como par (meio entre os dois a 1 px do meio da tela)
- [x] Em 1024 × 1366 (retrato): as mesmas asserções de página e botões
- [x] Em 375 × 812 e 899 × 800: marca começa a 12 px da esquerda e a conta termina a 12 px da direita (±1 px; `BarraTitulo.module.css:19`)
- [x] Os testes passam no HEAD, antes de T1 (registre a rodada no commit)

**Tests**: e2e, nomes com `FUN-102` (ex.: `FUN-102: em 375 × 812 a página e os botões ficam como hoje`)
**Gate**: full
**Commit**: `test(e2e): caracteriza o modo livro na tela estreita e no retrato`

---

### T1: Barra de título de borda a borda com 900 px ou mais (FUN-95)

**What**: Com `min-width: 900px`, `.barra-titulo__conteudo` perde o limite de largura e passa a ter margem lateral de 24 px; abaixo disso nada muda.
**Estimativa**: 1h
**Risco**: baixo
**Domínio**: não
**Criticidade**: comum
**Where**: `src/componentes/BarraTitulo.module.css`
**Depends on**: None (a Phase 1 inteira vem antes)
**Reuses**: Estender `.barra-titulo__conteudo` em `src/componentes/BarraTitulo.module.css:11-20` com um `@media (min-width: 900px)` (`max-width: none`, padding lateral `var(--esp-6)`), no molde das media queries do mesmo arquivo (`:84-94`). O token `--largura-barra` fica em `tokens.css` (o `estilo.test.ts:74` confere que existe). Condição só de largura (AD-011)
**Requirement**: FUN-95, FUN-102

**Done when**:

- [x] Em 1280 × 800, 1920 × 1080 e 900 × 600, na página inicial, no leitor em rolagem, no modo livro e no Sobre: caixa da marca (`MinhaJornada, página inicial`) com `x` = 24 e caixa do botão da conta com `x + width` = `innerWidth - 24` (±1 px)
- [x] Os testes de T0 da barra (375 e 899 px) continuam verdes; os de `e2e/entrada.spec.ts` (FUN-64, FUN-65, FUN-43) também

**Tests**: e2e, nomes com `FUN-95` (ex.: `FUN-95: em 1920 × 1080 a barra vai de borda a borda em todas as telas`)
**Gate**: full
**Commit**: `feat(barra): barra de borda a borda no pc`

---

Gate: pnpm typecheck && pnpm vitest run --reporter=dot && pnpm build && pnpm e2e e2e/livro-tela-cheia.spec.ts e2e/entrada.spec.ts @ 9590326455fc462bef02cea6a265812e8eaa3e14 = verde

### T2: Páginas que preenchem a área, com a medida do mesmo tamanho (FUN-96, FUN-97, FUN-100)

**What**: Na tela larga, a página deixa a proporção 3 × 4 e passa a ter a largura `(100vw - 2 × 24 px - vão) / 2` e a altura entre a linha do título e a dos botões, e a `.medida` usa as mesmas duas variáveis.
**Estimativa**: 2h
**Risco**: alto
**Domínio**: não
**Criticidade**: crítica
**Where**: `src/livro/livro.module.css`
**Depends on**: None (as Phases 1 e 2 inteiras vêm antes)
**Reuses**: Estender o `@media (min-width: 900px) and (orientation: landscape)` de `src/livro/livro.module.css:265-270` (o da medida) com as regras da tela larga, sem tocar no bloco da tela estreita (`:212-249`). Em `.livro`, definir `--largura-pagina-larga: calc((100vw - 2 * var(--esp-6)) / 2)` e `--altura-pagina-larga: calc(100vh - var(--altura-barra) - 1px - <padding de cima e de baixo de .livro> - 2 * var(--alvo-toque) - 2 * var(--esp-4))` (barra de 56 + 1 px de borda, `BarraTitulo.module.css:8`; título e botões com `min-height: var(--alvo-toque)`, `livro.module.css:28` e `Botoes.module.css:26`; dois `gap` de `.livro`, `:8`), padding lateral `var(--esp-6)`. `.livro__aberto`: `grid-template-columns: repeat(2, var(--largura-pagina-larga))` (vão 0, Delta 6). `.pagina`: `aspect-ratio: auto; height: var(--altura-pagina-larga); max-height: none; min-height: 0`. `.medida`: `width: var(--largura-pagina-larga); height: var(--altura-pagina-larga)` no lugar da conta de `:268`. Medida que diverge da página esconde versículos (A-11, `.specs/features/interface-livro/tasks.md:938`)
**Requirement**: FUN-96, FUN-97, FUN-100

**Done when**:

- [x] Teste de arquivo (`test/arquivos/livro-css.test.ts`, molde de `bloco()` em `src/estilo/estilo.test.ts:15-22`): no bloco da tela larga, `.pagina` e `.medida` usam `var(--largura-pagina-larga)` e `var(--altura-pagina-larga)`; nenhum dos dois tem `aspect-ratio: 3 / 4` nem `170px`
- [x] e2e em 900 × 600, 1280 × 800, 1920 × 1080 e 1920 × 1200 (Rute 1): página da esquerda com `x` = 24, página da direita com `x + width` = `innerWidth - 24`, larguras iguais e = `(innerWidth - 48 - vão) / 2` com o vão medido (±1 px)
- [x] Nos mesmos tamanhos: topo da página abaixo do fundo da linha do título, fundo da página acima do topo da linha dos botões, a altura da página = topo dos botões − fundo do título − 2 × 16 (±1 px), e `document.documentElement.scrollHeight <= innerHeight` (sem rolagem vertical)
- [x] Em 1280 × 800 e 1920 × 1080: a caixa da `.medida` (`[aria-hidden="true"]` com a classe da página, dentro da região do livro) tem a mesma largura e altura da página da esquerda (±1 px)
- [x] Vermelho registrado: no HEAD de T1, o teste de largura e o de medida igual à página falham pelo motivo certo (página de 3 × 4 estreita)

**Tests**: unit (arquivo) e e2e, nomes com `FUN-96`, `FUN-97` e `FUN-100` (ex.: `FUN-100: em 1920 × 1080 a medida tem o tamanho da página mostrada`)
**Gate**: full
**Commit**: `feat(livro): páginas preenchem a tela larga com a medida do mesmo tamanho`

---

### T3: Repaginar ao mudar o tamanho da janela, sem versículo escondido (FUN-100)

**What**: Provar que, em 1280 × 800 e 1920 × 1080 e ao trocar de um tamanho para o outro com o livro aberto, o livro repagina com a medida nova e nenhum versículo fica cortado ou escondido; corrigir `useMedidas` só se a prova falhar.
**Estimativa**: 2h
**Risco**: alto
**Domínio**: não
**Criticidade**: crítica
**Where**: `e2e/livro-tela-cheia.spec.ts`
**Depends on**: T2
**Reuses**: `linhasCortadas` de `e2e/livro.spec.ts:36-66` e `passar` de `e2e/livro.spec.ts:28-31` (mover para `e2e/apoio/` se usados nos dois arquivos, sem mudar as asserções); a remedida por `ResizeObserver` de `src/livro/useMedidas.ts:80-94` (a medida usa `vw`/`vh`, então muda com a janela). Correção, se precisar, fica em `useMedidas.ts`, sem `style` inline (AD-003)
**Requirement**: FUN-100

**Done when**:

- [x] Em 1280 × 800 e em 1920 × 1080, Rute inteira (até chegar a 1 Samuel): `linhasCortadas` vazio em toda página
- [x] Rute aberta em 1280 × 800, janela trocada para 1920 × 1080 (`page.setViewportSize`) e depois de volta: o total de páginas (`páginas X e Y de N`) muda, a medida volta a ter o tamanho da página (±1 px) e `linhasCortadas` fica vazio nas páginas mostradas e ao passar Rute até o fim
- [x] Vermelho registrado: com a `.medida` presa à conta antiga (`livro.module.css:268`, revertida numa cópia), o teste de 1920 × 1080 acha versículo escondido

**Tests**: e2e, nomes com `FUN-100` (ex.: `FUN-100: de 1280 × 800 para 1920 × 1080 o livro repagina sem versículo escondido`)
**Gate**: full
**Commit**: `test(e2e): repaginação do livro ao mudar o tamanho da janela`

---

Gate: pnpm typecheck && pnpm vitest run --reporter=dot && pnpm build && pnpm e2e e2e/livro-tela-cheia.spec.ts e2e/livro.spec.ts @ 8b0fd47be07ed19a62812e863a978fc014f9ab4b = verde

### T4: Título e posição alinhados às bordas das páginas (FUN-98)

**What**: Na tela larga, `.livro__cabeca` ocupa a largura das duas páginas (sem o limite de `2 × --largura-pagina`), com o título encostado à borda esquerda da página da esquerda e "páginas X e Y de N" à borda direita da página da direita.
**Estimativa**: 1h
**Risco**: baixo
**Domínio**: não
**Criticidade**: comum
**Where**: `src/livro/livro.module.css`
**Depends on**: None (a Phase 3 inteira vem antes)
**Reuses**: Estender `.livro__cabeca` (`src/livro/livro.module.css:12-19`) no mesmo bloco da tela larga de T2: `max-width: calc(2 * var(--largura-pagina-larga))`; o `justify-content: space-between` de `:17` já põe a posição à direita
**Requirement**: FUN-98

**Done when**:

- [x] Em 1280 × 800 e 1920 × 1080 (Rute 1): caixa do botão do título (`button` dentro do `h1`) com `x` = `x` da página da esquerda, e caixa de "páginas X e Y de N" com `x + width` = `x + width` da página da direita (±1 px)
- [x] Os testes de T0 (tela estreita e retrato) continuam verdes

**Tests**: e2e, nomes com `FUN-98` (ex.: `FUN-98: em 1920 × 1080 o título e a posição alinham com as bordas das páginas`)
**Gate**: full
**Commit**: `feat(livro): título e posição alinhados às páginas na tela larga`

---

### T5: "Anterior" e "Seguinte" nos cantos de baixo (FUN-99)

**What**: Na tela larga, `.navegacao-pagina` ocupa a largura das duas páginas e põe "Anterior" no canto inferior esquerdo e "Seguinte" no inferior direito.
**Estimativa**: 1h
**Risco**: baixo
**Domínio**: não
**Criticidade**: comum
**Where**: `src/livro/livro.module.css`
**Depends on**: T4
**Reuses**: Estender `.navegacao-pagina` (`src/livro/livro.module.css:123-128`) no bloco da tela larga de T2: `width: 100%`, `max-width: calc(2 * var(--largura-pagina-larga))`, `justify-content: space-between`; a ordem dos botões no DOM (`src/telas/TelaLivro.tsx:135-152`) já é Anterior, Seguinte
**Requirement**: FUN-99

**Done when**:

- [x] Em 1280 × 800 e 1920 × 1080, em Rute 1 e na capa: caixa de "Página anterior" com `x` = `x` da página da esquerda e caixa de "Página seguinte" com `x + width` = `x + width` da página da direita (±1 px); as duas com o mesmo `y`, abaixo do fundo das páginas, e o fundo delas a até 16 px do pé da tela (`innerHeight`)
- [x] Os testes de T0 (botões centrados na tela estreita e no retrato) continuam verdes

**Tests**: e2e, nomes com `FUN-99` (ex.: `FUN-99: em 1280 × 800 "Anterior" e "Seguinte" ficam nos cantos de baixo`)
**Gate**: full
**Commit**: `feat(livro): botões de página nos cantos de baixo na tela larga`

---

### T6: Capa e plano pago do tamanho das páginas de texto (FUN-101)

**What**: Provar que, na tela larga, a capa e o plano pago têm a mesma largura e altura das páginas de texto (as duas usam `.pagina`, então herdam T2) e ajustar o CSS da capa só se a prova falhar.
**Estimativa**: 45 min
**Risco**: baixo
**Domínio**: não
**Criticidade**: comum
**Where**: `e2e/livro-tela-cheia.spec.ts`
**Depends on**: T5
**Reuses**: `abrirNaCapa`, `capa` e `pago` de `e2e/capa.spec.ts:6-22`; `.pagina--capa` em `src/livro/livro.module.css:178-185` e `.pagina--pago` em `:134-139`
**Requirement**: FUN-101

**Done when**:

- [x] Em 1280 × 800 e 1920 × 1080: caixas da capa e do plano pago com largura e altura iguais às das páginas de Rute 1 no mesmo tamanho (±1 px), e o plano pago com `x` = 24 e a capa com `x + width` = `innerWidth - 24`
- [x] Os testes de `e2e/capa.spec.ts` (FUN-88, FUN-89, FUN-91) continuam verdes

**Tests**: e2e, nomes com `FUN-101` (ex.: `FUN-101: em 1920 × 1080 a capa e o plano pago têm o tamanho das páginas de texto`)
**Gate**: full
**Commit**: `test(e2e): capa e plano pago do tamanho das páginas na tela larga`

Gate: pnpm typecheck && pnpm vitest run --reporter=dot && pnpm build && pnpm e2e e2e/livro-tela-cheia.spec.ts e2e/livro.spec.ts e2e/capa.spec.ts e2e/entrada.spec.ts @ 36e3d70b64d2079ca7574d7d173648b53074a5c6 = verde

---

### T7: Reservar a linha do título na capa e no plano pago (A-01)

**What**: Na tela larga, a capa e o plano pago reservam a altura da linha do título (`--alvo-toque` mais o `gap`), para os botões ficarem a até 16 px do pé da tela, como em Rute, e não saltarem ao passar da capa para Gênesis.
**Estimativa**: 1h
**Risco**: baixo
**Domínio**: não
**Criticidade**: comum
**Where**: `src/livro/livro.module.css`, `e2e/livro-tela-cheia.spec.ts`
**Depends on**: None
**Reuses**: Bloco da tela larga de `src/livro/livro.module.css:272-296` (o mesmo de T2 a T5); sem `style` inline (AD-003) e sem mudar a marcação, se o CSS bastar. Em `e2e/livro-tela-cheia.spec.ts:333`, passar `pertoDoPe` a `true` na capa
**Requirement**: FUN-99, FUN-101 · Achado: A-01 (validation.md)

**Done when**:

- [x] Em 1280 × 800 e 1920 × 1080, na capa: os botões a até 16 px do pé da tela (±1 px) e com o mesmo `y` que em Rute 1 no mesmo tamanho; as páginas da capa com o mesmo `y` das de Rute 1
- [x] Os testes de FUN-99 e FUN-101 continuam verdes, e os de T0 (tela estreita e retrato) também
- [x] Vermelho: no HEAD atual, a asserção do pé na capa falha (76 px)

**Tests**: e2e, nomes com `FUN-99` (ex.: `FUN-99: em 1280 × 800 "Anterior" e "Seguinte" ficam nos cantos de baixo, na capa`)
**Gate**: full
**Commit**: `fix(livro): capa e plano pago reservam a linha do título na tela larga`

Gate: pnpm typecheck && pnpm vitest run --reporter=dot && pnpm build && pnpm e2e e2e/livro-tela-cheia.spec.ts e2e/capa.spec.ts @ 7b1a84687b4a89f27f63433ad909c095def28654 = verde

---

### T8: Caracterizar a capa na tela estreita e no retrato (A-02)

**What**: Acrescentar a FUN-102 testes que abrem a capa em 375 × 812, 899 × 800 e 1024 × 1366 e fixam a posição de hoje, para que a reserva da linha do título (T7) nunca vaze da tela larga.
**Estimativa**: 45 min
**Risco**: baixo
**Domínio**: não
**Criticidade**: comum
**Where**: `e2e/livro-tela-cheia.spec.ts`
**Depends on**: None
**Reuses**: `abrirNaCapa` e `capaLivro` do mesmo arquivo; laço de tamanhos de FUN-102 em `e2e/livro-tela-cheia.spec.ts:52-65`
**Requirement**: FUN-102 · Achado: A-02 (validation.md)

**Done when**:

- [ ] Em 375 × 812, 899 × 800 e 1024 × 1366, na capa: topo da página = o de hoje (y = 69, ±1 px) e o fundo dos botões a 77 px do pé da tela (±1 px), valores medidos no HEAD antes da mudança
- [ ] Vermelho: com a regra `.livro__aberto:has(.pagina--capa)` movida para fora do `@media` da tela larga (numa cópia), o teste falha; restaurada, passa
- [ ] Os demais testes de `e2e/livro-tela-cheia.spec.ts` e `e2e/capa.spec.ts` continuam verdes

**Tests**: e2e, nomes com `FUN-102` (ex.: `FUN-102: em 375 × 812 a capa fica como hoje`)
**Gate**: full
**Commit**: `test(e2e): caracteriza a capa na tela estreita e no retrato`
