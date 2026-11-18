# Página inicial, modo livro e barra de título: tarefas

**Branch pai**: desenvolvimento
**Design**: `.specs/features/interface-livro/design.md`
**Spec**: `.specs/features/interface-livro/spec.md` (FUN-51 a FUN-94; FUN-20 e FUN-21 substituídos)
**Mockup**: `.specs/features/interface-livro/mockup/` (aprovado em 2026-11-17; foto A, ícone 2a)
**Status**: Draft

**Segurança padrão de app web:** aplica-se em parte, como no `leitor`. O site é estático na Cloudflare, sem servidor que escute porta, receba requisição que mude estado ou valide `Host`: escuta, guarda de origem e `Host` **não se aplicam**. Os cabeçalhos (FUN-42, AD-003) não mudam. A foto nova é arquivo do próprio site (T18 confere que não vira `data:`). Texto bíblico e textos novos entram como texto, nunca HTML (FUN-04, lint `eslint.config.mjs:8-18`).

**Conferência spec × design:** duas divergências, decididas em AD-005 (ordem capa → pago → Gênesis também para trás, na tela estreita) e AD-006 (leitura inválida apagada na abertura, não no toque em "Ler Bíblia"), em `.specs/STATE.md`. As tarefas T11 e T3 as aplicam. Decisões anteriores que valem: AD-001 a AD-004.

**Testes existentes que mudam:** os de FUN-20 e FUN-21 (autorizados pela spec aprovada) e os da barra antiga, que passam para `BarraTitulo.test.tsx` (T16, T17; ver a aprovação do plano).

---

## Linha de base

- **Comando**: `pnpm typecheck && pnpm test` (`.specs/projeto/testes.json`), rodado em 2026-11-18 no commit `9a02c38` (branch `desenvolvimento`)
- **Resultado**: typecheck verde; Vitest 28 arquivos, 369 testes, todos passando (21 s). E2E não rodado na linha de base (roda no CI e no gate completo da feature)
- **Falhas preexistentes**: nenhuma. Aviso de ambiente: Node 26.13 local fora de `engines` (`>=24 <25`); o CI usa o Node do `.nvmrc`
- **T0 (rede de proteção)**: não se aplica. Todo comportamento existente que a feature toca já tem teste: abertura e retomada (`src/estado/leitor.test.ts:19-36`, `src/estado/useLeitor.test.ts:59-74`, `src/App.test.tsx:46-66`), barra com "Aa", painel e Sobre (`src/telas/TelaLeitor.test.tsx:165-172`, `:261-280`, `src/telas/TelaLivros.test.tsx:64-75`), "voltar à leitura" (`src/telas/TelaLivros.test.tsx:64-67`, `src/telas/TelaCapitulos.test.tsx:63-71`), deslize (`src/telas/TelaLeitor.test.tsx`), preferências (`src/dados/preferencias.test.ts`), pré-cache sem livros (`e2e/sw.spec.ts:31-45`) e manifesto com os ícones (`e2e/manifesto.spec.ts`). O único comportamento sem teste, o favicon SVG (inválido hoje), é substituído com teste em T30
- **Regra do /executar**: nenhuma falha nova além das preexistentes; a suíte inteira e o E2E rodam ao fim da feature

---

## Test Coverage Matrix

> Gerada do código e da spec. Guidelines encontradas: `CLAUDE.md` (Execução, Testes), `vite.config.ts:65-84` (projetos `componentes` e `arquivos`), `.specs/projeto/testes.json`; amostras: `src/estado/leitor.test.ts`, `src/estado/useLeitor.test.ts`, `src/telas/TelaLeitor.test.tsx`, `src/dados/preferencias.test.ts`, `e2e/leitura.spec.ts`, `src/estilo/estilo.test.ts`.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Regras puras (`src/estado/leitor.ts`, `src/livro/paginacao.ts`, `src/livro/folhear.ts`) | unit | Todos os ramos; 1:1 com os critérios; bordas (Gênesis, Apocalipse, capa, livro de 1 capítulo, versículo maior que a página, página menor que uma linha) | `src/**/*.test.ts` | `pnpm vitest run --project componentes --reporter=dot` |
| Dados no aparelho (`src/dados/preferencias.ts`) | unit | Válido, ilegível, desconhecido, armazenamento indisponível | `src/dados/*.test.ts` | `pnpm vitest run --project componentes --reporter=dot` |
| Hooks (`src/estado/useLeitor.ts`, `src/livro/use*.ts`) | unit (`renderHook`) | Cada efeito: gravação, carga, remedida; medida injetada | `src/**/*.test.ts` | `pnpm vitest run --project componentes --reporter=dot` |
| Componentes e telas (`src/componentes/`, `src/telas/`, `src/livro/*.tsx`) | unit (Testing Library) | Cada critério visível: texto, ordem, rótulo acessível, desativado, ação disparada | `src/**/*.test.tsx` | `pnpm vitest run --project componentes --reporter=dot` |
| Configuração e arquivos (`vite.config.ts`, `public/icones/`, `tokens.css`) | unit (node, lê o arquivo) | Cada item com teste que falha se ele sair | `src/estilo/*.test.ts`, `test/arquivos/*.test.ts` | `pnpm vitest run --project arquivos --reporter=dot` |
| Layout real, offline e jornadas (app no build) | e2e (Playwright) | Asserção espacial (`boundingBox`) para posição e corte; sem rede; 320 px a 1920 px | `e2e/*.spec.ts` | `pnpm build && pnpm e2e` |
| Ícones SVG de interface (`src/componentes/icones.tsx`) | none | Gate de build; cobertos pelos testes das telas que os usam | — | build gate |

## Gate Check Commands

> Do `package.json` e de `.specs/projeto/testes.json`.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Tarefas só com teste unitário | `pnpm typecheck && pnpm vitest run --reporter=dot` |
| Full | Tarefas com e2e | `pnpm typecheck && pnpm vitest run --reporter=dot && pnpm build && pnpm e2e --reporter=dot` |
| Build | Fim da feature | `pnpm lint && pnpm typecheck && pnpm vitest run --reporter=dot && pnpm build && pnpm e2e --reporter=dot` |

---

## Execution Plan

As Phases rodam em ordem; dentro de cada uma, as tarefas seguem a ordem indicada.

### Phase 1: Formato e abertura

```
T1 → T2 → T3 → T4
```

### Phase 2: Estado do modo livro

```
T5 → T6 → T7
```

### Phase 3: Paginação

```
T8 → T9 → T10
```

### Phase 4: Folhear e medir

```
T11 → T12 → T13
```

### Phase 5: Barra de título

```
T14 → T15 → T16 → T17
```

### Phase 6: Página inicial e "em breve"

```
T18 → T19 → T20
```

### Phase 7: Ligação da entrada

```
T21 → T22 → T23
```

### Phase 8: Páginas do livro

```
T24 → T25 → T26
```

### Phase 9: Modo livro no app

```
T27 → T28 → T29
```

### Phase 10: Ícone do app

```
T30 → T31
```

### Phase 11: Jornadas ponta a ponta

```
T32 → T33
```

### Phase 12: Retrabalho R1

```
T34 → T35 → T36 → T37 → T38 → T39 → T40 → T41 → T42
```

### Phase 13: Retrabalho R2

```
T43 → T44
```

### Phase 14: Retrabalho R3

```
T45
```

---

## Task Breakdown

### T1: Preferência de formato

**What**: `lerFormato()` (padrão `rolagem`; ilegível ou desconhecido dá `rolagem`) e `gravarFormato(f)` com a chave `mj:formato`.
**Estimativa**: 30 min
**Risco**: baixo
**Domínio**: não
**Criticidade**: comum
**Where**: `src/dados/preferencias.ts`
**Depends on**: None
**Reuses**: `lerTema`/`gravarTema` (`src/dados/preferencias.ts:86-95`), `CHAVES` (`:10`)
**Requirement**: FUN-66, FUN-68, FUN-69

**Done when**:

- [x] Testes `FUN-66`, `FUN-68`, `FUN-69` em `src/dados/preferencias.test.ts`: sem valor dá `rolagem`; grava e lê `livro`; JSON ilegível, `"pagina"` e número dão `rolagem`; sem `localStorage` não lança
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(dados): grava o formato de leitura no aparelho`

---

### T2: Abertura na página inicial

**What**: Tipos `Formato`, `Ancora` e telas `inicial` e `emBreve` em `leitor.ts`; `iniciar` recebe o formato gravado e abre sempre `inicial`, guardando a leitura válida em `ref` (substitui FUN-20 e FUN-21).
**Estimativa**: 1,5h
**Risco**: alto
**Domínio**: sim
**Criticidade**: comum
**Where**: `src/estado/leitor.ts`
**Depends on**: T1
**Reuses**: `refValida` (`src/navegacao/navegacao.ts:35`), ação `iniciar` (`src/estado/leitor.ts:60-69`)
**Requirement**: FUN-51, FUN-66

**Done when**:

- [x] Testes `FUN-51` em `src/estado/leitor.test.ts`: com leitura válida, sem leitura e com leitura inválida, a tela é `inicial`; `ref` guarda só a leitura válida; formato gravado `livro` vira `estado.formato`
- [x] Os testes de `iniciar` de FUN-20/FUN-21 (`src/estado/leitor.test.ts:19-36`) passam a esperar `inicial`, com o motivo no commit (mudança autorizada pela spec)
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(estado): o app abre na página inicial`

---

### T3: Ler Bíblia

**What**: Ação `lerBiblia`: com `ref`, abre o leitor no formato atual (no livro, âncora no versículo 1 do capítulo); sem `ref`, abre a escolha de livro (rolagem) ou a capa (livro).
**Estimativa**: 1h
**Risco**: alto
**Domínio**: sim
**Criticidade**: comum
**Where**: `src/estado/leitor.ts`
**Depends on**: T2
**Reuses**: `abrirNoLeitor` (`src/estado/leitor.ts:50`); AD-006
**Requirement**: FUN-54, FUN-55, FUN-56

**Done when**:

- [x] Testes `FUN-54`, `FUN-55`, `FUN-56` em `src/estado/leitor.test.ts`: Romanos 8 gravado abre Romanos 8 na rolagem e a âncora Romanos 8:1 no livro; sem leitura abre `livros` (rolagem) e a âncora `capa` (livro); leitura inválida na abertura (AD-006) age como sem leitura
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(estado): ler bíblia abre o ponto gravado`

---

### T4: Trocar formato

**What**: Ação `trocarFormato`: alterna o formato; de rolagem para livro com capítulo aberto, âncora no versículo 1 dele; de livro para rolagem, o capítulo da âncora, ou a escolha de livro se a âncora é capa ou pago.
**Estimativa**: 1,5h
**Risco**: alto
**Domínio**: sim
**Criticidade**: comum
**Where**: `src/estado/leitor.ts`
**Depends on**: T3
**Reuses**: `abrirNoLeitor` (`src/estado/leitor.ts:50`)
**Requirement**: FUN-67, FUN-70, FUN-71

**Done when**:

- [x] Testes `FUN-67`, `FUN-70`, `FUN-71` em `src/estado/leitor.test.ts`: João 3 na rolagem vira âncora João 3:1; âncora Rute 1:12 vira rolagem em Rute 1; âncora `capa` e `pago` viram a tela `livros`; fora do leitor (inicial, sobre) só troca o formato, sem mudar a tela
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(estado): troca entre rolagem e livro sem perder o capítulo`

---

Gate: pnpm typecheck && pnpm exec vitest run src/dados src/estado/leitor.test.ts src/navegacao src/biblia --reporter=dot @ 5f3580d3b88987e3004ad091285e6db064936b1c = verde

### T5: Em breve, voltar e inicial

**What**: Ações `abrirEmBreve` (guarda a tela atual em `voltarPara`) e `voltar` (volta a ela); `irPara('inicial')` aceito de qualquer tela.
**Estimativa**: 1h
**Risco**: baixo
**Domínio**: não
**Criticidade**: comum
**Where**: `src/estado/leitor.ts`
**Depends on**: None (a Phase anterior inteira vem antes)
**Reuses**: `irPara` (`src/estado/leitor.ts:116-126`)
**Requirement**: FUN-57, FUN-62

**Done when**:

- [x] Testes `FUN-57`, `FUN-62` em `src/estado/leitor.test.ts`: em breve a partir da inicial e do leitor volta à tela de origem; `voltar` sem origem vai à `inicial`; `irPara('inicial')` do leitor, da grade e do Sobre
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(estado): tela em breve com volta à tela de origem`

---

### T6: Âncora do livro no estado

**What**: Ação `irParaAncora` (texto: atualiza `ref` para o capítulo; capa, pago e fim: só a âncora) e `abrirCapitulo`/`escolherLivro` de capítulo único no formato livro com âncora no versículo 1.
**Estimativa**: 2h
**Risco**: alto
**Domínio**: sim
**Criticidade**: comum
**Where**: `src/estado/leitor.ts`
**Depends on**: T5
**Reuses**: `abrirCapitulo` (`src/estado/leitor.ts:79-83`), `refValida`
**Requirement**: FUN-83, FUN-84, FUN-85, FUN-88

**Done when**:

- [x] Testes `FUN-83`, `FUN-84`, `FUN-85`, `FUN-88` em `src/estado/leitor.test.ts`: Salmos 23 pela grade no livro dá âncora Salmos 23:1; âncora Rute 2:5 deixa `ref` em Rute 2; âncora `capa` não muda `ref`; âncora com versículo ou capítulo fora do índice é ignorada (mesmo objeto)
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(estado): âncora do modo livro no primeiro versículo da página`

---

### T7: useLeitor com formato e âncora

**What**: `useLeitor` lê o formato gravado, grava o formato quando muda, grava o capítulo da âncora de texto (não na capa nem no pago), carrega o livro da âncora (texto ou fim) e expõe `lerBiblia`, `trocarFormato`, `abrirEmBreve`, `voltar`, `irParaAncora`.
**Estimativa**: 2h
**Risco**: alto
**Domínio**: não
**Criticidade**: comum
**Where**: `src/estado/useLeitor.ts`
**Depends on**: T6
**Reuses**: efeitos de carga e gravação (`src/estado/useLeitor.ts:61-86`), dublê `src/dados/dubleCache.ts`
**Requirement**: FUN-51, FUN-68, FUN-85, FUN-87

**Done when**:

- [x] Testes `FUN-68`, `FUN-85`, `FUN-87` em `src/estado/useLeitor.test.ts`: troca de formato grava `mj:formato`; âncora Rute 2:5 grava `{livro: 8, capitulo: 2}`; capa não grava; âncora `fim` de Rute carrega o livro 8; livro fora do cache sem rede dá `naoBaixado`
- [x] Os testes de FUN-20/FUN-21 (`src/estado/useLeitor.test.ts:59-74`) passam a esperar `inicial` e a carga só depois de `lerBiblia` (mudança autorizada pela spec)
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(estado): liga formato e âncora ao aparelho`

---

Gate: pnpm typecheck && pnpm exec vitest run src/dados src/estado src/navegacao src/biblia --reporter=dot @ 0b8d667b590c0be7af54f841971568b22c2eb492 = verde

### T8: Blocos do livro

**What**: `blocosDoLivro(livro)`: o nome do livro e todos os versículos em ordem, com `abreCapitulo` no versículo 1 de cada capítulo.
**Estimativa**: 1h
**Risco**: alto
**Domínio**: sim
**Criticidade**: comum
**Where**: `src/livro/paginacao.ts`
**Depends on**: None (a Phase anterior inteira vem antes)
**Reuses**: tipo `Livro` (`src/biblia/tipos.ts:2-9`)
**Requirement**: FUN-76

**Done when**:

- [x] Testes `FUN-76` em `src/livro/paginacao.test.ts`: Rute dá 1 + 85 blocos, com o nome primeiro e `abreCapitulo` nos versículos 1 dos capítulos 1 a 4; livro de capítulo único (Judas) marca só o versículo 1
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(livro): blocos do livro para paginar`

---

### T9: Paginar

**What**: `paginar(alturas, alturaPagina, alturaLinha)`: agrupa blocos inteiros por página; bloco maior que a página é dividido em fatias múltiplas da linha; entrada inválida não entra em laço.
**Estimativa**: 2h
**Risco**: alto
**Domínio**: sim
**Criticidade**: comum
**Where**: `src/livro/paginacao.ts`
**Depends on**: T8
**Reuses**: nenhum (padrão novo, `design.md` "Paginação")
**Requirement**: FUN-75

**Done when**:

- [x] Casos limite e estados listados antes de codar (Domínio: sim): bloco que cabe exato, bloco 1 px maior, bloco maior que 2 páginas, página menor que uma linha, lista vazia, alturas zero
- [x] Testes `FUN-75` em `src/livro/paginacao.test.ts`: cada bloco aparece uma vez e em ordem; nenhuma página passa da altura; bloco maior que a página ocupa páginas seguidas com `recorte` múltiplo da linha; nenhum bloco que cabe é dividido; entradas inválidas terminam
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(livro): agrupa os versículos em páginas sem cortar`

---

### T10: Localizar na paginação

**What**: `paginaDoVersiculo(paginas, blocos, alvo)` e `primeiroVersiculo(pagina, blocos)`, com queda para a primeira página do capítulo ou do livro quando o alvo não existe.
**Estimativa**: 1h
**Risco**: alto
**Domínio**: sim
**Criticidade**: comum
**Where**: `src/livro/paginacao.ts`
**Depends on**: T9
**Reuses**: tipos de T8 e T9
**Requirement**: FUN-70, FUN-83, FUN-85, FUN-86

**Done when**:

- [x] Testes `FUN-70`, `FUN-83`, `FUN-85`, `FUN-86` em `src/livro/paginacao.test.ts`: versículo no meio, no início e na fatia seguinte de um versículo dividido; primeiro versículo de página que começa com o nome do livro; alvo inexistente cai no capítulo ou no livro
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(livro): acha a página de um versículo`

---

Gate: pnpm typecheck && pnpm exec vitest run src/livro src/estado src/dados src/navegacao src/biblia --reporter=dot @ 748995df7dd69e82972139d857ef4232f86519e0 = verde

### T11: Folhear

**What**: `visiveis(pagina, larga)`, `destinoSeguinte` e `destinoAnterior`: pares em tela larga; bordas de livro (livro seguinte, `fim` do anterior), Apocalipse, Gênesis e capa nas duas larguras (AD-005).
**Estimativa**: 2h
**Risco**: alto
**Domínio**: sim
**Criticidade**: comum
**Where**: `src/livro/folhear.ts`
**Depends on**: None (a Phase anterior inteira vem antes)
**Reuses**: lógica de `seguinte`/`anterior` (`src/navegacao/navegacao.ts:11-29`)
**Requirement**: FUN-73, FUN-74, FUN-77, FUN-78, FUN-81, FUN-82, FUN-88, FUN-89, FUN-90, FUN-91

**Done when**:

- [x] Casos limite e estados listados antes de codar: livro de 1 página, número ímpar de páginas em tela larga, última página de Apocalipse (larga e estreita), primeira de Gênesis, capa, pago; se a spec não define algum, parar e perguntar
- [x] Testes com os IDs em `src/livro/folhear.test.ts`: par 0–1 e 2–3 na larga, página única na estreita; seguinte na última de Rute vai a 1 Samuel 1:1; anterior na primeira de 1 Samuel vai a `fim` de Rute; Apocalipse sem seguinte; capa sem anterior; Gênesis → capa (larga) e → pago → capa (estreita, AD-005); capa → pago → Gênesis (estreita) e capa → Gênesis (larga)
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(livro): passa páginas e atravessa livros e a capa`

---

### T12: Tela larga

**What**: `useTelaLarga()` com `matchMedia('(min-width: 900px) and (orientation: landscape)')`, atualizando na mudança.
**Estimativa**: 45 min
**Risco**: baixo
**Domínio**: não
**Criticidade**: comum
**Where**: `src/livro/useTelaLarga.ts`
**Depends on**: T11
**Reuses**: simulação de `matchMedia` de `test/setup.ts`
**Requirement**: FUN-73, FUN-74

**Done when**:

- [x] Testes `FUN-73`, `FUN-74` em `src/livro/useTelaLarga.test.ts`: consulta exata; verdadeiro e falso; muda quando a consulta muda; remove o ouvinte ao desmontar
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(livro): detecta a tela larga para duas páginas`

---

### T13: Medir os blocos

**What**: `useMedidas(blocos, chave, medir?)`: renderiza os blocos num contêiner invisível com a largura da página, mede as alturas, a altura da página e a da linha, e remede quando a chave muda ou o `ResizeObserver` avisa outro tamanho.
**Estimativa**: 2h
**Risco**: alto
**Domínio**: não
**Criticidade**: comum
**Where**: `src/livro/useMedidas.ts`
**Depends on**: T12
**Reuses**: nenhum (padrão novo, `design.md` "useMedidas")
**Requirement**: FUN-75, FUN-86

**Done when**:

- [x] Testes `FUN-86` em `src/livro/useMedidas.test.ts` com `medir` e `ResizeObserver` dublês: mede ao montar; remede quando a chave (letra, tema, livro) muda; remede no aviso de outro tamanho e não no aviso do mesmo tamanho; desconecta o observador ao desmontar; `medidas` é `null` até a primeira medida
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(livro): mede os versículos na largura da página`

---

Gate: pnpm typecheck && pnpm exec vitest run src/livro src/estado src/dados src/navegacao src/biblia --reporter=dot @ b16156b337be807eeab17bf41e036291be58d662 = verde

### T14: Ícones da barra

**What**: `IconeLivroAberto`, `IconeRolagem` e `IconeConta` em `icones.tsx`, com os traçados do mockup (`mockup/barra.js`).
**Estimativa**: 30 min
**Risco**: baixo
**Domínio**: não
**Criticidade**: comum
**Where**: `src/componentes/icones.tsx`
**Depends on**: None (a Phase anterior inteira vem antes)
**Reuses**: ícones existentes de `src/componentes/icones.tsx`
**Requirement**: FUN-61

**Done when**:

- [x] Ícones com `aria-hidden` e `viewBox` 24, no molde dos existentes
- [x] Gate quick passa

**Tests**: none
**Gate**: quick
**Commit**: `feat(componentes): ícones de livro, rolagem e conta`

---

### T15: Tokens novos

**What**: Acrescentar ao `tokens.css` os tokens de `mockup/tokens-novos.css` (barra, inicial, página, capa, quebras).
**Estimativa**: 30 min
**Risco**: baixo
**Domínio**: não
**Criticidade**: comum
**Where**: `src/estilo/tokens.css`
**Depends on**: T14
**Reuses**: `mockup/tokens-novos.css`; teste `src/estilo/estilo.test.ts`
**Requirement**: FUN-59, FUN-73

**Done when**:

- [x] Teste em `src/estilo/estilo.test.ts`: cada token novo existe; `--cor-capa` e `--cor-capa-texto` apontam para o acento e o texto do acento (contraste já conferido, FUN-59); `--quebra-livro-duplo` é 900px
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(estilo): tokens da barra, da página inicial e do livro`

---

### T16: Barra de título

**What**: `BarraTitulo` com marca (vai à inicial), botão de formato com o rótulo do destino, "Aa" com `PainelAparencia`, Sobre e "Entrar / Criar conta" (só ícone abaixo de 480 px), presa ao topo.
**Estimativa**: 2h
**Risco**: baixo
**Domínio**: não
**Criticidade**: comum
**Where**: `src/componentes/BarraTitulo.tsx`
**Depends on**: T15
**Reuses**: barra do leitor (`src/telas/TelaLeitor.tsx:93-117`), `PainelAparencia`, `BotaoIcone`, CSS `src/telas/comum.module.css`, mockup `barra.js` e `componentes.css` (`.barra-titulo`)
**Requirement**: FUN-60, FUN-61, FUN-62, FUN-63, FUN-64, FUN-65, FUN-72

**Done when**:

- [x] Testes em `src/componentes/BarraTitulo.test.tsx`: `FUN-61` ordem marca, formato, Aa, Sobre, conta; `FUN-62` marca dispara a ida à inicial; `FUN-63` Aa abre o painel com letra e tema; `FUN-72` rótulo "Ler como livro" na rolagem e "Ler em rolagem" no livro; `FUN-64` rótulo acessível "Entrar ou criar conta"; `FUN-65` classe de barra presa (posição `sticky` no CSS, conferida no E2E de T32)
- [x] Os testes da barra antiga (`src/telas/TelaLeitor.test.tsx:165-172`, `:261-280`) passam para este arquivo, com as mesmas asserções
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(componentes): barra de título comum a todas as telas`

---

### T17: Telas sem header próprio

**What**: `App` mostra a `BarraTitulo` acima de toda tela; `TelaLeitor`, `TelaLivros`, `TelaCapitulos` e `TelaSobre` perdem o `<header>` e o painel; `TelaLivros` mantém "voltar à leitura" como `BotaoVoltar` no topo do conteúdo.
**Estimativa**: 2h
**Risco**: baixo
**Domínio**: não
**Criticidade**: comum
**Where**: `src/App.tsx`
**Depends on**: T16
**Reuses**: `BarraTitulo` (T16); `TelaLivros.tsx:31-37` (voltar à leitura)
**Requirement**: FUN-60

**Done when**:

- [x] Teste `FUN-60` em `src/App.test.tsx`: a barra aparece na escolha de livro, na grade, no leitor e no Sobre, uma vez só
- [x] Testes das telas ajustados: `TelaLivros.test.tsx:64-75` (marca e Sobre saem da tela; "voltar à leitura" continua), `TelaLeitor.test.tsx` sem a barra (já movida em T16)
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `refactor(telas): a barra de título sai das telas e vai para o app`

---

Gate: pnpm typecheck && pnpm exec vitest run src/componentes src/telas src/estilo src/estado src/livro src/dados src/navegacao src/biblia --reporter=dot @ f610f26ecf1d08f57227372b5a1fecf19e0d8e67 = verde

### T18: Foto da página inicial

**What**: Converter a foto A (`mockup/imagens/a-biblia-luz.jpg`) para WebP de 1920 px, qualidade 75, em `src/estilo/imagens/inicial.webp`, e acrescentar `webp` ao `globPatterns` do pré-cache.
**Estimativa**: 1h
**Risco**: alto
**Domínio**: não
**Criticidade**: comum
**Where**: `vite.config.ts`
**Depends on**: None (a Phase anterior inteira vem antes)
**Reuses**: `vite.config.ts:55-58`; teste de arquivos `src/estilo/estilo.test.ts`
**Requirement**: FUN-58

**Done when**:

- [x] Teste `FUN-58` (projeto `arquivos`): o `globPatterns` inclui `webp`; `inicial.webp` existe, tem mais de 4 KiB (não vira `data:`) e menos de 2 MiB (cabe no pré-cache)
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(estilo): foto da página inicial no pré-cache`

---

### T19: Página inicial

**What**: `TelaInicial` com a foto (texto alternativo, véu, foco ajustado), o cartão "A Palavra perto de você, onde estiver", "Ler Bíblia", "Criar conta" e o crédito; sem foto (erro de carga), fundo do tema.
**Estimativa**: 1,5h
**Risco**: baixo
**Domínio**: não
**Criticidade**: comum
**Where**: `src/telas/TelaInicial.tsx`
**Depends on**: T18
**Reuses**: mockup `telas/inicial.html` e `componentes.css` (`.inicial`, `.cartao-inicial`); `BotaoPrimario`, `BotaoSecundario`
**Requirement**: FUN-52, FUN-53, FUN-59

**Done when**:

- [x] Testes em `src/telas/TelaInicial.test.tsx`: `FUN-52` foto e cartão com os dois botões; `FUN-59` texto alternativo em português; "Ler Bíblia" e "Criar conta" disparam as ações; o erro da foto a esconde e mantém o cartão; crédito "Foto: Aaron Burden / Unsplash"
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(telas): página inicial com a foto e o cartão de entrada`

---

### T20: Tela em breve

**What**: `TelaEmBreve` com o `Estado` vazio: título "Conta e plano de estudo: em breve", a lista do plano, "Voltar" e "Ler Bíblia".
**Estimativa**: 1h
**Risco**: baixo
**Domínio**: não
**Criticidade**: comum
**Where**: `src/telas/TelaEmBreve.tsx`
**Depends on**: T19
**Reuses**: `Estado` (`src/componentes/base/Estado.tsx:22`), `BotaoVoltar`; mockup `telas/em-breve.html`
**Requirement**: FUN-57

**Done when**:

- [x] Testes `FUN-57` em `src/telas/TelaEmBreve.test.tsx`: informa que conta e plano não estão disponíveis; "Voltar" e "Ler Bíblia" disparam as ações
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(telas): tela em breve da conta e do plano de estudo`

---

Gate: pnpm typecheck && pnpm test @ 6e8a87166874646f98332aa0148ccc9e5323c8f6 = verde

### T21: Crédito da foto no Sobre

**What**: Parágrafo de crédito da foto da página inicial (Aaron Burden, licença Unsplash) na `TelaSobre`.
**Estimativa**: 30 min
**Risco**: baixo
**Domínio**: não
**Criticidade**: comum
**Where**: `src/telas/TelaSobre.tsx`
**Depends on**: None (a Phase anterior inteira vem antes)
**Reuses**: seções existentes de `src/telas/TelaSobre.tsx`
**Requirement**: FUN-58

**Done when**:

- [x] Teste em `src/telas/TelaSobre.test.tsx`: o Sobre cita a foto, o autor e a licença Unsplash
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `docs(sobre): crédito da foto da página inicial`

---

### T22: App com a entrada nova

**What**: `App` mostra `TelaInicial` (FUN-51), `TelaEmBreve` e liga "Ler Bíblia", "Criar conta", a conta da barra e a marca.
**Estimativa**: 1,5h
**Risco**: baixo
**Domínio**: não
**Criticidade**: comum
**Where**: `src/App.tsx`
**Depends on**: T21
**Reuses**: composição de `src/App.tsx:23-68`
**Requirement**: FUN-51, FUN-54, FUN-55, FUN-57, FUN-62

**Done when**:

- [x] Testes em `src/App.test.tsx`: `FUN-51` abre na inicial com e sem leitura; `FUN-54` Romanos 8 gravado e "Ler Bíblia" mostra Romanos 8; `FUN-55` sem leitura mostra "Escolha o livro"; `FUN-57` "Criar conta" e a conta da barra abrem "em breve" e "Voltar" volta; `FUN-62` a marca volta à inicial
- [x] Os testes `src/App.test.tsx:46-66` (FUN-20, FUN-21) mudam para a abertura nova (autorizado pela spec)
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(app): entrada pela página inicial`

---

### T23: E2E pela página inicial

**What**: Helpers de `e2e/apoio/navegar.ts` passam por "Ler Bíblia"; `e2e/leitura.spec.ts` (primeira visita e retomada), `e2e/esqueleto.spec.ts:8`, `e2e/offline.spec.ts:88` e `e2e-geral/sobre-instalacao.spec.ts:22` esperam a página inicial.
**Estimativa**: 2h
**Risco**: baixo
**Domínio**: não
**Criticidade**: comum
**Where**: `e2e/apoio/navegar.ts`
**Depends on**: T22
**Reuses**: `abrirGravado`, `abrirPelaEscolha` (`e2e/apoio/navegar.ts:4-30`)
**Requirement**: FUN-51, FUN-54, FUN-55

**Done when**:

- [x] E2E `FUN-51`/`FUN-54` em `e2e/leitura.spec.ts`: abrir, ver a inicial, "Ler Bíblia", ver Romanos 8 gravado; recarregar e ver a inicial de novo
- [x] Mudanças nos testes E2E existentes só no caminho de abertura, asserções iguais (autorizado pela spec)
- [x] Gate full passa

**Tests**: e2e
**Gate**: full
**Commit**: `test(e2e): jornadas entram pela página inicial`

---

Gate: pnpm typecheck && pnpm test && pnpm build && pnpm e2e @ f1e572971e2470e688dc5768ffcf644051590daa = verde

### T24: Página do livro

**What**: `PaginaLivro`: blocos de uma página (nome do livro, número do capítulo grande, número do versículo pequeno, itálico), recorte de bloco dividido e rodapé com capítulo e número da página.
**Estimativa**: 1,5h
**Risco**: baixo
**Domínio**: não
**Criticidade**: comum
**Where**: `src/livro/PaginaLivro.tsx`
**Depends on**: None (a Phase anterior inteira vem antes)
**Reuses**: `segmentar` (`src/biblia/segmentos.ts:9`); mockup `telas/livro.html` (`.pagina`, `.numero-capitulo`, `.numero-versiculo`)
**Requirement**: FUN-75, FUN-76

**Done when**:

- [x] Testes em `src/livro/PaginaLivro.test.tsx`: `FUN-76` nome do livro e número do capítulo; versículo com "[que está]" em itálico sem colchetes; texto como texto (`<img onerror>` não vira elemento, FUN-04); `FUN-75` parte recortada desloca pelo `recorte`; rodapé "Rute 1" e número da página
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(livro): página do livro com capítulo e versículos`

---

### T25: Capa e plano pago

**What**: `CapaLivro` ("Bíblia Sagrada", "Bíblia Livre", "MinhaJornada") e `PaginaPago` (selo "Em breve", texto do plano, "Quero saber").
**Estimativa**: 1h
**Risco**: baixo
**Domínio**: não
**Criticidade**: comum
**Where**: `src/livro/CapaLivro.tsx`
**Depends on**: T24
**Reuses**: mockup `telas/capa.html` (`.pagina--capa`, `.pagina--pago`), `BotaoPrimario`
**Requirement**: FUN-89, FUN-92

**Done when**:

- [x] Testes em `src/livro/CapaLivro.test.tsx`: `FUN-89` textos da capa; `FUN-92` o pago diz que não está disponível e "Quero saber" dispara a ação
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(livro): capa e página do plano de estudo`

---

### T26: Tela do livro: navegação

**What**: `TelaLivro` com título-botão, 1 ou 2 páginas visíveis, setas e deslize por página, botões desativados nas bordas, carregando e sem rede.
**Estimativa**: 2h
**Risco**: alto
**Domínio**: não
**Criticidade**: comum
**Where**: `src/telas/TelaLivro.tsx`
**Depends on**: T25
**Reuses**: deslize de `src/telas/TelaLeitor.tsx:74-89`, `classificarDeslize`, `MENSAGEM_NAO_BAIXADO`, `Estado`; `folhear` (T11), `useMedidas` (T13) com medida injetada no teste
**Requirement**: FUN-77, FUN-78, FUN-79, FUN-80, FUN-81, FUN-84, FUN-87, FUN-91

**Done when**:

- [x] Testes em `src/telas/TelaLivro.test.tsx`: `FUN-77`/`FUN-78` setas despacham a âncora certa; `FUN-79`/`FUN-80` deslize de 60 px passa e de 59 px não; `FUN-81` seguinte desativado na última de Apocalipse; `FUN-91` anterior desativado na capa; `FUN-84` título "Rute 1" e toque dispara a grade; `FUN-87` mensagem de não baixado e "Escolher outro livro"; carregando enquanto não há medida
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(telas): folhear o livro com setas e deslize`

---

Gate: pnpm typecheck && pnpm test @ d7cef5b22f524855ee915617bde98c532374e109 = verde

### T27: Tela do livro: lugar e capa

**What**: `TelaLivro` resolve a âncora `fim` na última página, mantém o primeiro versículo visível ao repaginar e mostra a capa e o pago nas duas larguras.
**Estimativa**: 1,5h
**Risco**: alto
**Domínio**: sim
**Criticidade**: comum
**Where**: `src/telas/TelaLivro.tsx`
**Depends on**: None (a Phase anterior inteira vem antes)
**Reuses**: `paginaDoVersiculo`, `primeiroVersiculo` (T10), `visiveis` (T11); AD-005
**Requirement**: FUN-82, FUN-85, FUN-86, FUN-88, FUN-89, FUN-90

**Done when**:

- [x] Casos limite listados antes de codar: âncora `fim` com livro ainda carregando, repaginar com âncora num versículo dividido, troca de larga para estreita na capa
- [x] Testes em `src/telas/TelaLivro.test.tsx`: `FUN-86` medida nova mantém Rute 1:12 visível; `FUN-82` fim de Rute vai à última página; `FUN-85` mudar de página despacha a âncora do primeiro versículo; `FUN-89` capa e pago lado a lado na larga; `FUN-90` capa sozinha na estreita
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(telas): o livro mantém o lugar ao repaginar`

---

### T28: App com o modo livro

**What**: `App` mostra `TelaLivro` no leitor quando o formato é livro e liga o botão de formato da barra.
**Estimativa**: 1h
**Risco**: baixo
**Domínio**: não
**Criticidade**: comum
**Where**: `src/App.tsx`
**Depends on**: T27
**Reuses**: ramo do leitor em `src/App.tsx:24-39`
**Requirement**: FUN-66, FUN-67, FUN-70, FUN-71

**Done when**:

- [x] Testes em `src/App.test.tsx`: `FUN-67` o botão de formato troca de `TelaLeitor` para `TelaLivro` e volta; `FUN-70`/`FUN-71` o título continua no mesmo capítulo; `FUN-66` sem formato gravado, rolagem
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(app): modo livro no leitor`

---

### T29: E2E do modo livro

**What**: Jornadas do livro no build: duas páginas em 1280 × 800, uma em 375 × 812; nenhum versículo cortado; Rute termina e 1 Samuel começa no topo de página nova; troca de formato mantém o capítulo.
**Estimativa**: 2h
**Risco**: alto
**Domínio**: não
**Criticidade**: comum
**Where**: `e2e/livro.spec.ts`
**Depends on**: T28
**Reuses**: helpers `e2e/apoio/navegar.ts`, asserção espacial de `e2e/leitura.spec.ts:45-52`
**Requirement**: FUN-70, FUN-71, FUN-73, FUN-74, FUN-75, FUN-76, FUN-82, FUN-83

**Done when**:

- [x] E2E com os IDs: `FUN-73` duas páginas lado a lado (mesmo `y`, `x` crescente); `FUN-74` uma página; `FUN-75` todo versículo visível cabe na caixa da página (`boundingBox`); `FUN-76`/`FUN-82` "1 Samuel" no topo da página depois da última de Rute; `FUN-70`/`FUN-71` João 3 → livro → passar páginas → rolagem no capítulo da página; `FUN-83` Salmos 23 pela grade abre a página com Salmos 23:1
- [x] E2E rodado sem a mudança (vermelho) e com ela (verde), uma vez ao fim do lote
- [x] Gate full passa

**Tests**: e2e
**Gate**: full
**Commit**: `test(e2e): jornadas do modo livro`

---

Gate: pnpm typecheck && pnpm vitest run --reporter=dot @ 4f574b730581f529f5f55b2357e613f5ca75ae4b = verde

### T30: Ícone SVG

**What**: `public/icones/icone.svg` passa a ser o ícone 2a (`mockup/icones/2a-vinho-caminho-largo.svg`), XML válido, sem `--` em comentário.
**Estimativa**: 45 min
**Risco**: baixo
**Domínio**: não
**Criticidade**: comum
**Where**: `public/icones/icone.svg`
**Depends on**: None (a Phase anterior inteira vem antes)
**Reuses**: `mockup/icones/2a-vinho-caminho-largo.svg`
**Requirement**: FUN-93, FUN-94

**Done when**:

- [x] Teste `FUN-94` (projeto `arquivos`): o SVG faz parse como XML (`DOMParser` ou parser node) e nenhum comentário contém `--`
- [x] Teste `FUN-93`: o SVG tem o caminho em vinho (`#9A3B5B`) e o `viewBox` 512
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `fix(icones): ícone novo do app em svg válido`

---

### T31: Ícones PNG

**What**: Script `scripts/gerar-icones.mjs` que rasteriza o SVG com o Chromium do Playwright em `icone-192.png`, `icone-512.png` e `icone-maskable-512.png` (fundo vinho sangrado, sem cantos), e os PNGs gerados.
**Estimativa**: 1h
**Risco**: alto
**Domínio**: não
**Criticidade**: comum
**Where**: `scripts/gerar-icones.mjs`
**Depends on**: T30
**Reuses**: `e2e/manifesto.spec.ts:17`, `:56` (tamanhos conferidos)
**Requirement**: FUN-93

**Done when**:

- [x] Teste `FUN-93` (projeto `arquivos`): os três PNGs têm 192 × 192, 512 × 512 e 512 × 512 (cabeçalho PNG) e o maskable tem o pixel do canto vinho (sem transparência)
- [x] `e2e/manifesto.spec.ts` continua verde
- [x] Gate full passa

**Tests**: unit
**Gate**: full
**Commit**: `feat(icones): ícones png do novo desenho`

---

### T32: E2E da entrada e da barra

**What**: Página inicial, barra e foto sem rede no build: cartão à direita no PC e embaixo no celular; barra em todas as telas, presa ao topo e sem rolagem horizontal em 320 px; foto da inicial abre sem rede.
**Estimativa**: 2h
**Risco**: alto
**Domínio**: não
**Criticidade**: comum
**Where**: `e2e/entrada.spec.ts`
**Depends on**: None (a Phase anterior inteira vem antes)
**Reuses**: `e2e/offline.spec.ts` (cortar a rede), `e2e/aparencia.spec.ts` (largura sem transbordo)
**Requirement**: FUN-52, FUN-53, FUN-58, FUN-60, FUN-64, FUN-65

**Done when**:

- [x] E2E com os IDs: `FUN-52` cartão com `x` maior que o meio da tela em 1440 px; `FUN-53` cartão centralizado em 375 px; `FUN-58` sem rede, a foto carrega (`naturalWidth > 0`); `FUN-60` barra nas sete telas; `FUN-65` barra no topo depois de rolar; `FUN-64` 320 px sem rolagem horizontal e conta só ícone
- [x] Gate full passa

**Tests**: e2e
**Gate**: full
**Commit**: `test(e2e): página inicial, barra e foto sem rede`

---

### T33: E2E da capa e da repaginação

**What**: Capa e repaginação no build: anterior em Gênesis 1 mostra a capa (larga) e o pago e a capa (estreita); trocar a letra mantém o primeiro versículo visível.
**Estimativa**: 1,5h
**Risco**: alto
**Domínio**: não
**Criticidade**: comum
**Where**: `e2e/capa.spec.ts`
**Depends on**: T32
**Reuses**: helpers de T23 e T29
**Requirement**: FUN-86, FUN-88, FUN-89, FUN-90, FUN-91, FUN-92

**Done when**:

- [x] E2E com os IDs: `FUN-88`/`FUN-89` capa à direita e pago à esquerda em 1280 px; `FUN-90` capa, pago e Gênesis em 375 px; `FUN-91` anterior desativado na capa; `FUN-92` "Quero saber" abre "em breve"; `FUN-86` Rute 1:12 visível antes e depois de mudar a letra para 5
- [x] Gate full passa

**Tests**: e2e
**Gate**: full
**Commit**: `test(e2e): capa e repaginação do livro`

---

Gate: pnpm typecheck && pnpm vitest run --reporter=dot @ a059ac12e26a9178b8e7d5b814943a2a20f60498 = verde

## Phase 12: Retrabalho R1

### T34: Medida com a largura real da página (A-11)

**What**: Na tela larga, medir os blocos com a largura da página mostrada (hoje a medida tem 520 px e a página 430,5 px em 1280 × 800) e somar as margens dos blocos às alturas, para nenhum versículo ficar escondido.
**Estimativa**: 2h
**Risco**: alto
**Domínio**: sim
**Criticidade**: crítica
**Where**: `src/livro/useMedidas.ts`, `src/livro/livro.module.css`, `e2e/livro.spec.ts`
**Depends on**: None (as Phases anteriores inteiras vêm antes)
**Reuses**: `medirNoDom` em `src/livro/useMedidas.ts:33`; `.medida` em `src/livro/livro.module.css:252-259`
**Requirement**: FUN-75, FUN-73 · Achado: A-11 (validation.md)
**Tests**: `e2e/livro.spec.ts`: `FUN-75` em 1280 × 800, Rute inteira sem bloco que comece abaixo da caixa do texto ou fique escondido; `useMedidas.test.ts`: a altura medida inclui a margem do bloco. Vermelho antes da correção
**Gate**: full

- [x] Concluída

---

### T35: Versículo dividido não trava a navegação (A-14)

**What**: "Seguinte" e "anterior" passam pelas fatias de um versículo maior que a página: a âncora (ou o destino) distingue a fatia, e a repaginação mantém a fatia visível.
**Estimativa**: 2h
**Risco**: alto
**Domínio**: sim
**Criticidade**: crítica
**Where**: `src/telas/TelaLivro.tsx`, `src/livro/paginacao.ts`, `src/estado/leitor.ts`
**Depends on**: T34
**Reuses**: `ancoraDaPagina` em `src/telas/TelaLivro.tsx:47-50`; `paginaDoVersiculo`/`primeiroVersiculo` em `src/livro/paginacao.ts:118-143`; tipo `Ancora` em `src/estado/leitor.ts:15`
**Requirement**: FUN-77, FUN-78, FUN-85, FUN-75 · Achado: A-14 (validation.md)
**Tests**: `TelaLivro.test.tsx`: `FUN-77` versículo dividido em 3 páginas, "seguinte" passa pelas três e chega ao versículo seguinte; `FUN-78` "anterior" volta pelas fatias. Vermelho antes
**Gate**: quick

- [x] Concluída

---

### T36: Paginação dos 66 livros sem perda nem repetição (A-01)

**What**: Teste sobre os 66 JSON reais de `public/livros/`: `blocosDoLivro` e `paginar` com alturas determinísticas (inclusive página pequena, que força divisão) cobrem cada bloco uma vez, em ordem.
**Estimativa**: 1,5h
**Risco**: alto
**Domínio**: não
**Criticidade**: crítica
**Where**: `test/arquivos/paginacao-66.test.ts`
**Depends on**: T35
**Reuses**: `todasAsPartes` em `src/livro/paginacao.test.ts:19-30`; leitura de arquivo como em `test/arquivos/converter-biblia.test.ts`
**Requirement**: FUN-75, FUN-76 · Achado: A-01 (validation.md)
**Tests**: `test/arquivos/paginacao-66.test.ts` (projeto `arquivos`): `FUN-75` nos 66 livros, cada versículo uma vez e em ordem
**Gate**: quick

- [x] Concluída

---

### T37: Remedir ao remontar o contêiner de medida (A-12)

**What**: `useMedidas` remede quando o contêiner volta a existir (capa ou plano pago → livro), e o `ResizeObserver` segue o nó atual.
**Estimativa**: 1h
**Risco**: alto
**Domínio**: não
**Criticidade**: comum
**Where**: `src/livro/useMedidas.ts`
**Depends on**: T36
**Reuses**: `src/livro/useMedidas.ts:45-76`
**Requirement**: FUN-86 · Achado: A-12 (validation.md)
**Tests**: `useMedidas.test.ts` ou `TelaLivro.test.tsx`: `FUN-86` a letra muda com a capa à mostra e, ao voltar ao mesmo livro, a medida é a nova. Vermelho antes
**Gate**: quick

- [x] Concluída

---

### T38: Sobre volta à capa no formato livro (A-13)

**What**: No formato livro sem leitura (capa), voltar do Sobre retorna ao leitor (capa), não à escolha de livro.
**Estimativa**: 45 min
**Risco**: baixo
**Domínio**: não
**Criticidade**: comum
**Where**: `src/App.tsx`
**Depends on**: T37
**Reuses**: ramo do Sobre em `src/App.tsx` (`aoVoltar`)
**Requirement**: FUN-60 · Achado: A-13 (validation.md)
**Tests**: `App.test.tsx`: formato livro, capa → Sobre → voltar mostra a capa. Vermelho antes
**Gate**: quick

- [x] Concluída

---

### T39: Folhear na tela larga e lugar da âncora (A-02, A-03)

**What**: Testes da ligação na tela larga e do lugar conforme AD-007.
**Estimativa**: 1,5h
**Risco**: alto
**Domínio**: não
**Criticidade**: comum
**Where**: `src/telas/TelaLivro.test.tsx`, `src/App.test.tsx`, `e2e/capa.spec.ts`, `e2e/livro.spec.ts`
**Depends on**: T38
**Reuses**: `src/telas/TelaLivro.test.tsx:58-105`; `e2e/capa.spec.ts`; `e2e/livro.spec.ts`; AD-007
**Requirement**: FUN-77, FUN-78, FUN-82, FUN-85, FUN-88, FUN-71, FUN-84 · Achados: A-02, A-03 (validation.md)
**Tests**: `TelaLivro.test.tsx` com `larga: true`: `FUN-77` "seguinte" vai ao primeiro versículo do par seguinte, `FUN-88` "anterior" em Gênesis 1 vai à capa; `FUN-71` página que começa no capítulo anterior ao da âncora, rolagem no capítulo da âncora (AD-007); e2e 1280 px: Gênesis 1 → anterior → capa à direita; e2e João 3 com título e rolagem exatos
**Gate**: full

- [x] Concluída

---

### T40: Contraste do cartão e desenho dos PNGs (A-04, A-08)

**What**: Testes de contraste `--cor-suave` × `--cor-superficie` nos temas e do desenho 2a nos PNGs.
**Estimativa**: 1h
**Risco**: baixo
**Domínio**: não
**Criticidade**: comum
**Where**: `src/estilo/estilo.test.ts`, `test/arquivos/icones-png.test.ts`
**Depends on**: T39
**Reuses**: `src/estilo/estilo.test.ts:105-122`; `test/arquivos/icones-png.test.ts`
**Requirement**: FUN-59, FUN-93 · Achados: A-04, A-08 (validation.md)
**Tests**: `estilo.test.ts`: `FUN-59` par suave × superfície ≥ 4,5:1 nos temas; `icones-png.test.ts`: `FUN-93` pixel do desenho (página clara) no centro dos três PNGs
**Gate**: quick

- [x] Concluída

---

### T41: Foto, limite de 480 px e rolagem lateral nas telas novas (A-05, A-06, A-07)

**What**: E2E da foto cobrindo a área abaixo da barra, do limite 479/480 px da conta e da ausência de rolagem lateral em em breve, livro, capa e plano pago.
**Estimativa**: 2h
**Risco**: baixo
**Domínio**: não
**Criticidade**: comum
**Where**: `e2e/entrada.spec.ts`
**Depends on**: T40
**Reuses**: `e2e/entrada.spec.ts`; `semRolagemLateral` de `e2e/aparencia.spec.ts:11-18`
**Requirement**: FUN-52, FUN-64 · Achados: A-05, A-06, A-07 (validation.md)
**Tests**: `entrada.spec.ts`: `FUN-52` foto cobre a área abaixo da barra; `FUN-64` 479 px só ícone, 480 px com texto; sem rolagem lateral em 320 e 1920 px nas 4 telas novas
**Gate**: full

- [x] Concluída

---

### T42: Gate completo registrado (A-09)

**What**: Fechar o retrabalho com o `Gate:` completo (lint, typecheck, test, build, e2e) da árvore final no `tasks.md`.
**Estimativa**: 15 min
**Risco**: baixo
**Domínio**: não
**Criticidade**: comum
**Where**: `.specs/features/interface-livro/tasks.md`
**Depends on**: T41
**Reuses**: `.claude/scripts/fechar-lote.py --gate`
**Requirement**: Achado: A-09 (validation.md)
**Tests**: o próprio gate completo
**Gate**: build

- [x] Concluída

---

Gate: pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm e2e @ 77a673a8562860fc521a3415355f823e5875e671 = verde

## Phase 13: Retrabalho R2

### T43: Fatia da âncora guardada no estado (A-15)

**What**: Provar e, se preciso, corrigir que o reducer guarda a fatia da âncora (`irParaAncora`) e que `mesmaAncora` distingue fatias, para "seguinte" não travar num versículo maior que a página.
**Estimativa**: 1,5h
**Risco**: alto
**Domínio**: não
**Criticidade**: crítica
**Where**: `src/estado/leitor.test.ts`, `src/App.test.tsx` (e `src/estado/leitor.ts`, se o teste revelar defeito)
**Depends on**: None
**Reuses**: `mesmaAncora` em `src/estado/leitor.ts:86-96`; `irParaAncora` em `src/estado/leitor.ts:184-196`; testes de âncora em `src/estado/leitor.test.ts:446-473`; versículo dividido em `src/telas/TelaLivro.test.tsx:288-340`
**Requirement**: FUN-77, FUN-78, FUN-85 · Achado: A-15 (validation.md)
**Tests**: `leitor.test.ts`: `FUN-77` `irParaAncora` com `fatia: 1` guarda `ancora.fatia === 1` e muda o estado; fatia 0 e ausente são a mesma âncora; `App.test.tsx`: `FUN-77` versículo dividido em 3 páginas, "seguinte" passa pelas três fatias. Cada teste falha com o reducer descartando a fatia ou com `mesmaAncora` ignorando-a
**Gate**: quick

- [x] Concluída

---

### T44: "Seguinte" da capa na tela larga (A-16)

**What**: Teste de `TelaLivro` com `larga: true`: da capa (e do plano pago), "seguinte" vai a Gênesis 1:1, não ao plano pago.
**Estimativa**: 45 min
**Risco**: baixo
**Domínio**: não
**Criticidade**: comum
**Where**: `src/telas/TelaLivro.test.tsx`
**Depends on**: T43
**Reuses**: testes com `larga: true` em `src/telas/TelaLivro.test.tsx:357-374`; `destinoDaCapa` em `src/telas/TelaLivro.tsx:106`
**Requirement**: FUN-89, FUN-77 · Achado: A-16 (validation.md)
**Tests**: `TelaLivro.test.tsx`: `FUN-89` na tela larga, "seguinte" a partir da capa chama `aoIrParaAncora` com Gênesis 1:1; falha com `larga` → `false` em `destinoDaCapa`
**Gate**: quick

- [x] Concluída

---

Gate: pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm e2e @ ebe702b630761b1f0e68d964d21378418c43cb2d = verde

## Phase 14: Retrabalho R3

### T45: Letra nova repagina na tela do livro (A-17)

**What**: Teste de `TelaLivro` que prova a ligação `letra → chave` de `useMedidas` (AD-008): ao mudar a letra, a tela remede e repagina, mantendo a página do versículo da âncora.
**Estimativa**: 45 min
**Risco**: alto
**Domínio**: não
**Criticidade**: crítica
**Where**: `src/telas/TelaLivro.test.tsx`
**Depends on**: None
**Reuses**: chamada `useMedidas(blocos, letra, medir)` em `src/telas/TelaLivro.tsx:82`; teste da chave em `src/livro/useMedidas.test.ts:97`; AD-008
**Requirement**: FUN-86 · Achado: A-17 (validation.md)
**Tests**: `TelaLivro.test.tsx`: `FUN-86` `rerender` com `letra` 3 → 4 e o mesmo `medir` (identidade estável), que conta chamadas e devolve alturas maiores na segunda: `medir` chamado de novo e o total de páginas muda, com a página do versículo da âncora à mostra. Falha com `useMedidas(blocos, 0, medir)`
**Gate**: quick

- [ ] Concluída

---

## Requirement Coverage

| Requisito | Tarefas |
| --- | --- |
| FUN-51 | T2, T7, T22, T23 |
| FUN-52, FUN-53 | T19, T32 |
| FUN-54, FUN-55 | T3, T22, T23 |
| FUN-56 | T3 (AD-006) |
| FUN-57 | T5, T20, T22 |
| FUN-58 | T18, T21, T32 |
| FUN-59 | T15, T19 |
| FUN-60, FUN-61 | T14, T16, T17, T32 |
| FUN-62 | T5, T16, T22 |
| FUN-63, FUN-72 | T16 |
| FUN-64, FUN-65 | T16, T32 |
| FUN-66 | T1, T2, T28 |
| FUN-67 | T4, T28 |
| FUN-68 | T1, T7 |
| FUN-69 | T1 |
| FUN-70, FUN-71 | T4, T10, T28, T29 |
| FUN-73, FUN-74 | T11, T12, T29 |
| FUN-75 | T9, T13, T24, T29 |
| FUN-76 | T8, T24, T29 |
| FUN-77, FUN-78, FUN-79, FUN-80 | T11, T26 |
| FUN-81 | T11, T26 |
| FUN-82 | T11, T27, T29 |
| FUN-83 | T6, T10, T29 |
| FUN-84 | T6, T26 |
| FUN-85 | T6, T7, T10, T27 |
| FUN-86 | T10, T13, T27, T33 |
| FUN-87 | T7, T26 |
| FUN-88 | T6, T11, T27, T33 |
| FUN-89, FUN-90 | T11, T25, T27, T33 |
| FUN-91 | T11, T26, T33 |
| FUN-92 | T25, T33 |
| FUN-93 | T30, T31 |
| FUN-94 | T30 |
