# Texto bíblico corrigido: tarefas

**Design**: `.specs/features/texto-atualizado/design.md`
**Spec**: `.specs/features/texto-atualizado/spec.md` (FUN-103 a FUN-127)
**Branch pai**: desenvolvimento
**Status**: Draft

**Segurança padrão de app web:** não se aplica. A feature não cria servidor, rota nem requisição que mude estado; o site continua estático na Cloudflare (AD-001), com os cabeçalhos de AD-003. Texto de correção vira HTML só por React (sem `dangerouslySetInnerHTML`) no app e por `textContent` na página de revisão (T20).

**Conferência spec × design:** seis pontos decididos, cada um com AD em `.specs/STATE.md` e citado na tarefa que o aplica: "não confere" é marca, não estado (AD-012); item coberto por regra sai da lista (AD-013); "N ocorrências" vira um item por versículo (AD-014); "antes" sem colchetes é recuperado e `italicoMuda` vai ao um a um (AD-015); arquivo de exemplo no teste e no e2e (AD-016); revisão com banco do artifact e lista em pedaço separado (AD-017). Decisões anteriores que valem: AD-001 a AD-011 (em especial AD-002, cache por hash).

**Testes existentes que mudam:** `test/arquivos/converter-biblia.test.ts:52-64` (FUN-03, autorizado em `## Autorizações` de 2026-11-18, T6); `src/telas/TelaSobre.test.tsx:33-36` (FUN-38, aprovado na spec, T17); `src/livro/CapaLivro.test.tsx:6-9` (FUN-89, aprovado na spec, T18). Cada troca fica tão forte quanto antes, com o motivo no commit.

## Linha de base

- **Comando**: `pnpm typecheck && pnpm test` (`.specs/projeto/testes.json`), rodado em 2026-11-18 no commit `b4c7550` (branch `desenvolvimento`)
- **Resultado**: typecheck verde; Vitest 42 arquivos, 631 testes, todos passando (30 s). E2E não rodado na linha de base (roda no CI e ao fim do lote de interface)
- **Falhas preexistentes**: nenhuma. **Aviso de ambiente**: rodada pelo PowerShell, `test/arquivos/deploy.test.ts` (A-13, 20 casos) falha porque o `bash` do PATH é o do WSL (saída em UTF-16); pelo Git Bash (`C:/Program Files/Git/usr/bin/bash.exe`) passa 34 de 34. Rode a suíte e os gates pelo Git Bash. Node 26.13 local fora de `engines` (`>=24 <25`)
- **T0 (rede de proteção)**: não necessária. O comportamento existente que a feature toca já tem teste: conversão e hash (`test/arquivos/converter-biblia.test.ts`, `src/biblia/conversor.test.ts`), crédito do Sobre (`src/telas/TelaSobre.test.tsx`, FUN-38), capa (`src/livro/CapaLivro.test.tsx`, FUN-89), navegação do Sobre (`src/estado/leitor.test.ts`, `src/App.test.tsx`) e troca do livro guardado (`src/dados/limparAntigos.test.ts`). O que muda de comportamento (validar antes de apagar `public/livros`) nasce com teste em T5
- **Regra do /executar**: nenhuma falha nova; a suíte inteira e o E2E rodam ao fim da feature

---

**Revisão pelo dono:** decidir os ~1.550 itens é trabalho do dono, fora das tarefas. Ela pode começar depois da Phase 5 e seguir depois da integração (spec: "Integração sem todos os itens decididos"); cada exportação é uma nova versão de `correcoes/correcoes.json`.

---

## Test Coverage Matrix

> Gerada do código e da spec. Guidelines encontradas: `.claude/CLAUDE.md` (Execução, Testes), `vite.config.ts:70-85` (projetos `componentes` e `arquivos`), `.specs/projeto/testes.json`. Amostras: `src/biblia/conversor.test.ts`, `test/arquivos/converter-biblia.test.ts`, `src/telas/TelaSobre.test.tsx`, `src/estado/leitor.test.ts`, `src/dados/livros.test.ts`, `e2e/leitura.spec.ts`.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Núcleo das correções (`src/biblia/correcoes/*.ts`) | unit | Todos os ramos; 1:1 com FUN-103, FUN-107, FUN-114, FUN-115, FUN-117, FUN-125 a FUN-127; cada guarda com um teste por ramo, que falha se a guarda sair | `src/biblia/correcoes/*.test.ts` | `pnpm vitest run --project componentes src/biblia/correcoes --reporter=dot` |
| Build (`scripts/converter-biblia.ts`) | integration (node, gera em `tmpdir`) | Caminho feliz com o arquivo de exemplo, cada falha com a mensagem, `.biblia/` intocado, hash novo só do livro corrigido | `test/arquivos/converter-biblia.test.ts` | `pnpm vitest run --project arquivos --reporter=dot` |
| Consolidação (`scripts/correcoes/*.ts`) | unit (node) | Cada tipo de linha do levantamento, AD-013 a AD-015, linha ignorada com motivo, regras com contagem e 5 exemplos | `test/arquivos/consolidacao-*.test.ts` | `pnpm vitest run --project arquivos --reporter=dot` |
| Revisão, lógica pura (`src/revisao/logica.ts`, `src/revisao/mesclar.ts`) | unit | 1:1 com FUN-108, FUN-110 a FUN-113; todos os ramos | `src/revisao/*.test.ts` | `pnpm vitest run --project componentes src/revisao --reporter=dot` |
| Revisão, página (`src/revisao/pagina.ts`) | unit (jsdom, banco dublê) | FUN-109 e FUN-112 pela página; nada por `innerHTML` | `src/revisao/pagina.test.ts` | idem |
| Telas e estado (`src/telas/*`, `src/livro/CapaLivro.tsx`, `src/estado/leitor.ts`, `src/App.tsx`) | unit (Testing Library) | 1:1 com FUN-119 a FUN-123; estados carregando, erro e vazio | `src/**/*.test.tsx`, `src/estado/*.test.ts` | `pnpm vitest run --project componentes --reporter=dot` |
| Jornada no app | e2e (Playwright sobre `pnpm build:e2e`) | FUN-116, FUN-122, FUN-124 na rolagem e no livro, com e sem rede | `e2e/correcoes.spec.ts` | `pnpm build:e2e && pnpm e2e e2e/correcoes.spec.ts` |
| Dados (`correcoes/correcoes.json`, `test/arquivos/dados/correcoes-exemplo.json`) | integration | O arquivo real passa na leitura e na validação; o exemplo tem as aprovadas que os testes usam | `test/arquivos/correcoes-real.test.ts` | `pnpm vitest run --project arquivos --reporter=dot` |

## Gate Check Commands

> Do `package.json` e de `.specs/projeto/testes.json`.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Tarefas só com teste unitário ou de arquivo | `pnpm typecheck && pnpm vitest run --reporter=dot` |
| Full | Tarefas com e2e | `pnpm typecheck && pnpm vitest run --reporter=dot && pnpm build:e2e && pnpm e2e e2e/correcoes.spec.ts` |
| Build | Fim da feature | `pnpm lint && pnpm typecheck && pnpm vitest run --reporter=dot && pnpm build:e2e && pnpm e2e && pnpm build` |

---

## Execution Plan

As Phases rodam em ordem; dentro de cada uma, as tarefas seguem a ordem indicada. A revisão (Phases 4 e 5) vem antes do app para o dono poder começar a decidir cedo. Lotes previstos (o `progresso.py --lote` confirma): **Lote 1** crítico (Phase 1, 7h30), **Lote 2** crítico (Phase 2, 3h30), **Lote 3** crítico (Phase 3, 7h), **Lote 4** crítico (Phase 4, 3h30), **Lote 5** comum (Phase 5, 4h30), **Lote 6** comum (Phases 6 e 7, 8h15).

### Phase 1: Núcleo das correções (crítica)

```
T1 → T2 → T3 → T4
```

### Phase 2: Build (crítica)

```
T5 → T6
```

### Phase 3: Consolidação do levantamento (crítica)

```
T7 → T8 → T9 → T10
```

### Phase 4: Regras da revisão (crítica)

```
T11 → T12
```

### Phase 5: Página de revisão (comum)

```
T13 → T14 → T15
```

### Phase 6: Correções no app (comum)

```
T16 → T17 → T18 → T19 → T20
```

### Phase 7: Jornada no app (comum)

```
T21
```

### Phase 8: Retrabalho R1

```
T22 -> T23 -> T24 -> T25 -> T26 -> T27 -> T28 -> T29
```

### Phase 9: Retrabalho R2

```
T30 -> T31 -> T32 -> T33
```

---

## Task Breakdown

### T1: Formato e leitura do arquivo de correções (FUN-103)

**What**: Criar os tipos do arquivo (`ItemCorrecao`, `RegraNoArquivo`, `ArquivoCorrecoes`, design "Data Models") e `lerArquivoCorrecoes(json)`, que confere a forma e lança com o caminho do campo inválido.
**Estimativa**: 90 min
**Risco**: alto
**Domínio**: não
**Criticidade**: crítica
**Where**: `src/biblia/correcoes/arquivo.ts` (novo)
**Depends on**: None
**Reuses**: Validação manual no estilo de `lerLivro` (`src/dados/livros.ts:37-45`); tipo `Livro`/`Ref` de `src/biblia/tipos.ts`; `confere` como marca, não estado (AD-012)
**Requirement**: FUN-103

**Done when**:

- [x] Arquivo válido volta tipado; `versao` diferente de 1 é recusado
- [x] Um teste por campo obrigatório ausente ou de tipo errado (id, ref com livro/capítulo/versículo inteiros ≥ 1, tipo, antes não vazio, depois, motivo, fonte, confiança, estado, confere), com a mensagem citando o caminho (ex.: `itens[0].estado`)
- [x] `tipo` `arcaico` e `estado` fora de proposta/aprovada/recusada são recusados
- [x] Gate quick verde

**Tests**: unit, nomes com `FUN-103` (ex.: `FUN-103: item sem fonte como texto é recusado com o caminho do campo`)
**Gate**: quick
**Commit**: `feat(correcoes): formato e leitura do arquivo de correções`

---

### T2: Regras mecânicas R-01, R-02 e R-03 (FUN-106, FUN-117)

**What**: Criar `REGRAS`, as três funções puras de espaço e pontuação descritas no design, idempotentes e sem desfazer colchetes.
**Estimativa**: 2h
**Risco**: alto
**Domínio**: sim
**Criticidade**: crítica
**Where**: `src/biblia/correcoes/regras.ts` (novo)
**Depends on**: T1
**Reuses**: Nenhuma regra parecida no projeto. Exemplos reais de `levantamento/mecanico.md` e `levantamento/RESUMO.md:18-19` como casos de teste
**Requirement**: FUN-106, FUN-117

**Done when**:

- [x] Antes de codar, a lista de casos limite está no corpo do commit: espaço antes de `,.;:?!` com e sem `]` antes (`[dizendo] :`), vários espaços, `”,diz`, `sempre.E`, número com dois-pontos (`3:16`) e com vírgula, reticências, pontuação dupla (`:;`, Js 13:6), fim de versículo, `[` logo depois da pontuação. Caso sem resultado definido pela spec: parar e perguntar (`AskUserQuestion`)
- [x] R-01, R-02 e R-03 resolvem cada exemplo da lista; aplicar duas vezes dá o mesmo texto
- [x] Nenhuma regra muda letra, número ou a quantidade e a ordem de `[` e `]` (teste de propriedade sobre os 31.102 versículos reais da fonte)
- [x] Gate quick verde

**Tests**: unit, nomes com `FUN-106`/`FUN-117`
**Gate**: quick
**Commit**: `feat(correcoes): regras mecânicas de espaço e pontuação`

---

### T3: Validação do arquivo contra a fonte (FUN-107, FUN-115, FUN-125, FUN-126)

**What**: Criar `validarCorrecoes(arquivo, livros)`, que lança na primeira falha com as mensagens do design.
**Estimativa**: 2h
**Risco**: alto
**Domínio**: sim
**Criticidade**: crítica
**Where**: `src/biblia/correcoes/validar.ts` (novo)
**Depends on**: T2
**Reuses**: Forma das mensagens de `converterLivro` (`src/biblia/conversor.ts:19-22`); nomes dos livros de `Livro.nome`
**Requirement**: FUN-107, FUN-115, FUN-125, FUN-126

**Done when**:

- [x] Antes de codar, os casos e o resultado de cada um estão no corpo do commit (incluindo: sobreposição parcial, trechos encostados sem sobrepor, mesmo "antes" duas vezes no versículo, item recusado que não confere, proposta com colchete sem par). Caso sem resultado na spec: parar e perguntar
- [x] Um teste por ramo, cada um falhando se a guarda sair: id repetido; livro, capítulo e versículo inexistentes (três testes); aprovada com "antes" ausente e com "antes" duas vezes (`correção <id> não confere com <Livro c:v>`); duas aprovadas sobrepostas (cita os dois ids); trechos separados no mesmo versículo passam; "depois" com `[` sem `]` e com `]` sem `[`
- [x] Proposta e recusada que não conferem não derrubam (só a aprovada vai ao texto); o colchete sem par vale para todo estado (FUN-125)
- [x] Gate quick verde

**Tests**: unit, nomes com o FUN de cada ramo
**Gate**: quick
**Commit**: `feat(correcoes): validação do arquivo contra a fonte`

---

### T4: Aplicação das correções aprovadas (FUN-114, FUN-117, FUN-127)

**What**: Criar `aplicarCorrecoes(livros, arquivo)`: itens aprovados primeiro (do fim do versículo para o começo), depois as regras aprovadas em ordem; devolve os livros novos e a `ListaAplicada` (regras com versículos que mudaram, itens em ordem bíblica).
**Estimativa**: 2h
**Risco**: alto
**Domínio**: sim
**Criticidade**: crítica
**Where**: `src/biblia/correcoes/aplicar.ts` (novo)
**Depends on**: T3
**Reuses**: `REGRAS` (T2); `Livro` com as mesmas chaves e ordem (o hash de `scripts/converter-biblia.ts:14-17` depende dela)
**Requirement**: FUN-114, FUN-117, FUN-127

**Done when**:

- [x] Só aprovadas mudam o texto; proposta e recusada não (um teste para cada estado, item e regra)
- [x] Dois itens no mesmo versículo, em trechos separados, entram os dois; item e regra no mesmo versículo: item primeiro, regra depois, e o resultado é igual em duas execuções (FUN-127)
- [x] Mesmos 66 livros, mesma contagem de capítulos e versículos, colchetes em pares depois da aplicação (FUN-117); entrada não é modificada
- [x] A lista traz só o que mudou de fato; regra que não mudou nenhum versículo aparece com 0
- [x] Gate quick verde

**Tests**: unit, nomes com `FUN-114`/`FUN-117`/`FUN-127`
**Gate**: quick
**Commit**: `feat(correcoes): aplica as correções aprovadas ao texto`

---

Gate: pnpm typecheck && pnpm vitest run --reporter=dot @ 240299940a8cea248072e1c15ee8c5c753beea3b = verde

### T5: Correções no build (FUN-114, FUN-115, FUN-118)

**What**: Estender `gerar` para ler o arquivo (`--correcoes`, padrão `correcoes/correcoes.json`), converter os 66 em memória, validar e aplicar, e só então apagar e regravar `public/livros`; gravar `src/biblia/correcoes-resumo.gerado.json` e `src/biblia/correcoes.gerado.json`; criar `correcoes/correcoes.json` inicial (`{versao:1, regras:[], itens:[]}`), o arquivo de exemplo `test/arquivos/dados/correcoes-exemplo.json` (Ap 6:1 "Coreiro" → "Cordeiro" aprovada, mais uma aprovada em outro livro e uma proposta), `build:e2e` no `package.json` e os gerados no `.gitignore`.
**Estimativa**: 2h
**Risco**: alto
**Domínio**: não
**Criticidade**: crítica
**Where**: `scripts/converter-biblia.ts`
**Depends on**: None (a Phase 1 inteira vem antes)
**Reuses**: Estender `gerar` (`scripts/converter-biblia.ts:25-49`) e o `ehPrincipal` (`:51-60`); `lerArquivoCorrecoes`, `validarCorrecoes`, `aplicarCorrecoes` (T1, T3, T4); molde do `indice.gerado.json` para os dois gerados (AD-016, AD-017)
**Requirement**: FUN-114, FUN-115, FUN-118

**Done when**:

- [x] Com o exemplo, Apocalipse 6:1 gerado diz "Cordeiro" e a lista gerada traz o item; o resumo tem `total` igual ao número de aplicadas
- [x] Arquivo com aprovada que não confere: `gerar` lança `correção <id> não confere com <Livro c:v>` **e** `public/livros` anterior continua no lugar (teste em `tmpdir`)
- [x] Hash: o livro corrigido ganha nome novo; um livro sem correção mantém o mesmo nome de antes (FUN-118, AD-002)
- [x] `pnpm test` e `pnpm typecheck` rodam com o arquivo inicial vazio
- [x] Gate quick verde

**Tests**: integration, nomes com `FUN-114`/`FUN-115`/`FUN-118`, em `test/arquivos/converter-biblia.test.ts`
**Gate**: quick
**Commit**: `feat(build): aplica as correções aprovadas na conversão da bíblia`

---

### T6: Teste de FUN-03 com as correções e `.biblia/` intocado (FUN-03, FUN-114, FUN-126)

**What**: Trocar o teste dos 31.102 versículos (autorizado) para comparar com a fonte mais as aprovadas do exemplo, e acrescentar a prova de que `.biblia/` não muda e as falhas de FUN-126 pelo build.
**Estimativa**: 90 min
**Risco**: alto
**Domínio**: não
**Criticidade**: crítica
**Where**: `test/arquivos/converter-biblia.test.ts`
**Depends on**: T5
**Reuses**: O parser próprio do teste (`test/arquivos/converter-biblia.test.ts:14-28`) e a geração em `tmpdir` (`:34-45`)
**Requirement**: FUN-03 (alterado), FUN-114, FUN-126

**Done when**:

- [x] Cada versículo gerado é igual ao da fonte, exceto os das aprovadas do exemplo, que são iguais à fonte com o "antes" trocado pelo "depois" (o teste calcula isso sozinho, sem chamar `aplicarCorrecoes`)
- [x] SHA-256 de cada arquivo de `.biblia/` igual antes e depois de `gerar` (FUN-114)
- [x] Build com id repetido e com referência inexistente falha com o id e a referência (FUN-126)
- [x] O motivo da troca e a autorização (`## Autorizações`, 2026-11-18) estão no corpo do commit
- [x] Gate quick verde

**Tests**: integration, nomes com `FUN-03`/`FUN-114`/`FUN-126`
**Gate**: quick
**Commit**: `test(build): confere os versículos com as correções e a fonte intocada`

---

Gate: pnpm typecheck && pnpm vitest run --reporter=dot @ cbcc535b7b971abbd5de42cb46076041bf4f43c9 = verde

### T7: Leitura das tabelas do levantamento (FUN-104)

**What**: Criar `lerTabelas(md, arquivo)`: cada linha de tabela de `levantamento/gNN.md` vira um candidato (referência pelo nome do livro, trechos sem as aspas, tipo, confiança, motivo, fonte); `arcaico` é descartado; linha que não se lê vai para `ignoradas` com o motivo.
**Estimativa**: 2h
**Risco**: alto
**Domínio**: sim
**Criticidade**: crítica
**Where**: `scripts/correcoes/levantamento.ts` (novo)
**Depends on**: None (a Phase 2 inteira vem antes)
**Reuses**: Formato da tabela em `levantamento/INSTRUCOES.md:31-33`; nomes dos livros de `converterLivro` (`src/biblia/conversor.ts:30-34`)
**Requirement**: FUN-104

**Done when**:

- [x] Antes de codar, os formatos achados nos 15 arquivos estão no corpo do commit (ref "Livro c:v", "N ocorrências (ex.: …)", livro com número ("1 João"), trecho com aspas tipográficas ou com `|` escapado, linha de cabeçalho e de separador). Formato sem leitura definida: vai para `ignoradas`, nunca some
- [x] Teste com trechos reais de `g15.md` (Tiago 1:13, Apocalipse 6:1) e uma linha `arcaico`, que sai
- [x] Linha "N ocorrências" volta como candidato marcado para expansão (AD-014)
- [x] Gate quick verde

**Tests**: unit, nomes com `FUN-104`, em `test/arquivos/consolidacao-levantamento.test.ts`
**Gate**: quick
**Commit**: `feat(correcoes): lê as tabelas do levantamento`

---

### T8: Conferência dos candidatos contra a fonte (FUN-104, FUN-105)

**What**: Criar `conferir(candidatos, livros)`: "antes" exato uma vez → `confere`; só ignorando colchetes → trecho exato da fonte e `italicoMuda` se os pares mudam (AD-015); "N ocorrências" → um item por versículo achado (AD-014); "depois" igual ao "antes" com as regras → sai, coberto pela regra (AD-013); o resto `confere: false`; ids `C-0001…` na ordem bíblica, todos "proposta".
**Estimativa**: 2h
**Risco**: alto
**Domínio**: sim
**Criticidade**: crítica
**Where**: `scripts/correcoes/conferir.ts` (novo)
**Depends on**: T7
**Reuses**: `REGRAS` (T2) para AD-013; a busca exata de `validarCorrecoes` (T3), sem duplicar a regra de "aparece uma vez"
**Requirement**: FUN-104, FUN-105

**Done when**:

- [x] Antes de codar, a tabela caso → resultado está no corpo do commit (incluindo: trecho que aparece duas vezes, trecho só sem colchetes, colchetes diferentes entre antes e depois, "N ocorrências" com contagem diferente). Caso sem resultado na AD ou na spec: parar e perguntar
- [x] Um teste por linha da tabela; o relatório conta conferem, não conferem, recuperados (AD-015), cobertos por regra (AD-013) e expandidos (AD-014)
- [x] Teste com o texto real: Apocalipse 6:1 "Coreiro" confere com confiança alta; um "antes" inexistente volta `confere: false` (Independent Test da spec)
- [x] Gate quick verde

**Tests**: unit, nomes com `FUN-104`/`FUN-105`, em `test/arquivos/consolidacao-conferir.test.ts`
**Gate**: quick
**Commit**: `feat(correcoes): confere os candidatos contra a fonte`

---

### T9: Descrição das regras e script de consolidação (FUN-106)

**What**: Criar `descreverRegras(livros)` (por regra: descrição, versículos que muda, 5 exemplos antes/depois) e `scripts/consolidar-correcoes.ts`, que lê os 15 `gNN.md`, confere, descreve as regras (todas "proposta") e grava `correcoes/correcoes.json` (um item por linha) e `correcoes/relatorio-consolidacao.md`.
**Estimativa**: 2h
**Risco**: alto
**Domínio**: não
**Criticidade**: crítica
**Where**: `scripts/consolidar-correcoes.ts` (novo)
**Depends on**: T8
**Reuses**: `ehPrincipal` e caminhos de `scripts/converter-biblia.ts:51-60`; `REGRAS` (T2); `lerTabelas`, `conferir` (T7, T8)
**Requirement**: FUN-106

**Done when**:

- [x] Para cada regra, o número de versículos é o de versículos da fonte que a regra muda, e os 5 exemplos são versículos reais com o antes e o depois da regra
- [x] O arquivo gravado passa em `lerArquivoCorrecoes` e `validarCorrecoes`; cada item ocupa uma linha
- [x] Rodar duas vezes sobre a mesma entrada grava o mesmo arquivo, byte a byte
- [x] Gate quick verde

**Tests**: unit, nomes com `FUN-106`, em `test/arquivos/consolidacao-regras.test.ts`
**Gate**: quick
**Commit**: `feat(correcoes): consolida o levantamento no arquivo de correções`

---

### T10: Arquivo real de correções (FUN-104, FUN-105, FUN-106)

**What**: Rodar `node scripts/consolidar-correcoes.ts`, conferir o relatório e commitar `correcoes/correcoes.json` e o relatório, com um teste sobre o arquivo real.
**Estimativa**: 1h
**Risco**: alto
**Domínio**: não
**Criticidade**: crítica
**Where**: `test/arquivos/correcoes-real.test.ts` (novo)
**Depends on**: T9
**Reuses**: `lerArquivoCorrecoes`, `validarCorrecoes` (T1, T3)
**Requirement**: FUN-104, FUN-105, FUN-106

**Done when**:

- [x] O arquivo real passa na leitura e na validação; nenhum item `arcaico`; tem as 3 regras com contagem e 5 exemplos
- [x] Tem o item de Apocalipse 6:1 ("Coreiro" → "Cordeiro", confiança alta, conferindo); o teste não fixa o estado, que muda com a revisão
- [x] As contagens do relatório (por tipo, conferem, não conferem, ignoradas) estão no corpo do commit
- [x] Gate quick verde

**Tests**: integration, nomes com `FUN-104`/`FUN-105`/`FUN-106`
**Gate**: quick
**Commit**: `feat(correcoes): arquivo de correções consolidado do levantamento`

---

Gate: pnpm typecheck && pnpm vitest run --reporter=dot @ 24de835d90a2b393e1811a9e2fc294b5a73f90ab = verde

### T11: Lógica da revisão (FUN-108, FUN-110, FUN-111, FUN-112)

**What**: Criar `agrupar`, `aprovarGrupo`, `podeAprovar` e `primeiroPendente` (design "Revisão"), puras, sobre os itens, as regras e as decisões.
**Estimativa**: 2h
**Risco**: alto
**Domínio**: sim
**Criticidade**: crítica
**Where**: `src/revisao/logica.ts` (novo)
**Depends on**: None (a Phase 3 inteira vem antes)
**Reuses**: Tipos de `src/biblia/correcoes/arquivo.ts` (T1); checagem de pares de `validar.ts` (T3) para o "depois" editado; AD-012, AD-015
**Requirement**: FUN-108, FUN-110, FUN-111, FUN-112

**Done when**:

- [x] Antes de codar, os grupos e as regras de entrada em cada um estão no corpo do commit (bloco = alta, confere, sem `italicoMuda`, por tipo e livro; um a um = média, baixa, todo sentido, não confere, `italicoMuda`). Caso de fronteira sem resposta: parar e perguntar
- [x] Cada grupo traz a contagem de pendentes, que cai com cada decisão (FUN-108)
- [x] Aprovar um bloco aprova só os itens dele que conferem, e nenhum outro (FUN-110), com um teste em que o grupo vizinho fica intacto
- [x] Sentido sem fonte: `podeAprovar` devolve "Falta a fonte" (FUN-111); não confere devolve "Não confere"
- [x] `primeiroPendente` segue a ordem regras → blocos → um a um e devolve `null` quando tudo foi decidido (FUN-112)
- [x] Gate quick verde

**Tests**: unit, nomes com o FUN de cada regra
**Gate**: quick
**Commit**: `feat(revisao): grupos, aprovação em bloco e pendências da revisão`

---

### T12: Mescla das decisões no arquivo (FUN-113)

**What**: Criar `mesclarDecisoes(arquivo, decisoes)` e `scripts/aplicar-decisoes.ts`, que lê `revisao/decisoes.json`, mescla e regrava `correcoes/correcoes.json` no mesmo formato (um item por linha).
**Estimativa**: 90 min
**Risco**: alto
**Domínio**: sim
**Criticidade**: crítica
**Where**: `src/revisao/mesclar.ts` (novo)
**Depends on**: T11
**Reuses**: `lerArquivoCorrecoes` (T1); a gravação de uma linha por item de T9
**Requirement**: FUN-113

**Done when**:

- [x] Muda só `estado` e, quando veio, `depois` dos itens e regras decididos; os não decididos ficam iguais, byte a byte, no arquivo regravado
- [x] Id desconhecido, estado inválido ou "depois" com colchete sem par: recusa e não grava nada (um teste por ramo)
- [x] Mesclar duas vezes as mesmas decisões dá o mesmo arquivo
- [x] Gate quick verde

**Tests**: unit, nomes com `FUN-113`
**Gate**: quick
**Commit**: `feat(revisao): grava as decisões da revisão no arquivo de correções`

---

Gate: pnpm typecheck && pnpm vitest run --reporter=dot @ 821b6e98e28295525727aa489ce653a4bd8bbcf9 = verde

### T13: Dados da página de revisão (FUN-109)

**What**: Criar `scripts/montar-revisao.ts`, que grava `revisao/dados.json` com cada item e cada regra, o versículo inteiro antes e depois (calculado aplicando só aquele item ou regra), o motivo e a fonte.
**Estimativa**: 90 min
**Risco**: alto
**Domínio**: não
**Criticidade**: comum
**Where**: `scripts/montar-revisao.ts` (novo)
**Depends on**: None (a Phase 4 inteira vem antes)
**Reuses**: `converterLivro` (`src/biblia/conversor.ts:14`); `aplicarCorrecoes` (T4) num versículo; `ehPrincipal` de `scripts/converter-biblia.ts:51`
**Requirement**: FUN-109

**Done when**:

- [x] Para Apocalipse 6:1, o versículo "antes" é o da fonte e o "depois" tem "Cordeiro" no lugar de "Coreiro"
- [x] Item que não confere leva o versículo inteiro e `depois` igual ao antes (FUN-105)
- [x] `revisao/dados.json` fora do git (gerado)
- [x] Gate quick verde

**Tests**: unit, nomes com `FUN-109`, em `test/arquivos/montar-revisao.test.ts`
**Gate**: quick
**Commit**: `feat(revisao): monta os dados da página de revisão`

---

### T14: Página de revisão (FUN-108, FUN-109, FUN-111, FUN-112)

**What**: Criar `revisao/index.html` e `src/revisao/pagina.ts`: mostra os grupos com as pendências, o item com o versículo antes e depois, motivo, fonte e Aprovar, Recusar e Editar; grava cada decisão como linha do banco do artifact (`{ id, estado, depois? }`); ao abrir, lê as linhas e vai ao primeiro pendente; "Baixar decisões" entrega `decisoes.json`; `pnpm revisao:montar` monta `revisao/dist/pagina.js` com o Vite em modo biblioteca.
**Estimativa**: 2h
**Risco**: alto
**Domínio**: não
**Criticidade**: comum
**Where**: `src/revisao/pagina.ts` (novo)
**Depends on**: T13
**Reuses**: `agrupar`, `aprovarGrupo`, `podeAprovar`, `primeiroPendente` (T11); uso do banco conforme `describe_capabilities` com `capability: "db"` (ler antes de codar e registrar no corpo do commit a API usada); só `textContent`, no molde da regra do lint (`eslint.config.mjs:8-71`)
**Requirement**: FUN-108, FUN-109, FUN-111, FUN-112

**Done when**:

- [x] Com um banco dublê: aprovar uma regra, recusar um item de sentido e editar um de digitação gravam três linhas; reabrir a página mostra as três decisões e começa no primeiro pendente (Independent Test da spec, parte da página)
- [x] Item de sentido sem fonte mostra "Falta a fonte" e o Aprovar desativado
- [x] Nenhum texto entra por `innerHTML` (teste: trecho com `<b>` aparece como texto)
- [x] `pnpm revisao:montar` gera o JS; `revisao/index.html` só carrega arquivos relativos
- [x] Gate quick verde

**Tests**: unit (jsdom), nomes com o FUN de cada comportamento, em `src/revisao/pagina.test.ts`
**Gate**: quick
**Commit**: `feat(revisao): página de revisão com o banco do artifact`

---

### T15: Publicação da página e roteiro da exportação (FUN-112, FUN-113)

**What**: Escrever `revisao/LEIA-ME.md` (montar, publicar, pedir a uma sessão do Claude para ler o banco e rodar `aplicar-decisoes.ts`, ou usar "Baixar decisões") e, **com confirmação específica do dono**, publicar a página como artifact privado e declarar `db`, `user` e `downloads`.
**Estimativa**: 1h
**Risco**: alto
**Domínio**: não
**Criticidade**: comum
**Where**: `revisao/LEIA-ME.md` (novo)
**Depends on**: T14
**Reuses**: `publish_files` e `declare_capabilities` (servidor de artifacts); AD-017
**Requirement**: FUN-112, FUN-113

**Done when**:

- [x] Teste de arquivo: o LEIA-ME cita os três comandos (`pnpm revisao:montar`, `node scripts/montar-revisao.ts`, `node scripts/aplicar-decisoes.ts`) e eles existem no repositório
- [x] Publicada (se o dono confirmar): link e slug no LEIA-ME e na seção `## Retomada` do `STATE.md`; recusada: registrado "publicação pendente" no LEIA-ME
- [x] Gate quick verde

**Tests**: unit (arquivo), nomes com `FUN-113`, em `test/arquivos/revisao-leia-me.test.ts`
**Gate**: quick
**Commit**: `docs(revisao): roteiro de publicação e exportação da revisão`

---

Gate: pnpm typecheck && pnpm vitest run --reporter=dot @ d35b6137cf326d8708133cdf9d290da5702a89ea = verde

### T16: Resumo e carga da lista no app (FUN-123, FUN-124)

**What**: Criar `src/biblia/correcoesAplicadas.ts` com `resumoCorrecoes` (import estático do resumo gerado) e `carregarCorrecoes()` (import dinâmico da lista, pedaço separado).
**Estimativa**: 1h
**Risco**: baixo
**Domínio**: não
**Criticidade**: comum
**Where**: `src/biblia/correcoesAplicadas.ts` (novo)
**Depends on**: None (a Phase 5 inteira vem antes)
**Reuses**: Molde de `src/biblia/indice.ts:1-5` (JSON gerado tipado por cast); AD-017
**Requirement**: FUN-123, FUN-124

**Done when**:

- [x] `carregarCorrecoes()` devolve a lista gerada; `resumoCorrecoes.total` igual ao número de regras aplicadas mais itens aplicados
- [x] Depois de `pnpm build`, a lista está num arquivo JS separado de `dist/assets/` e o pré-cache do service worker o lista (teste de arquivo sobre o `dist` do `build:e2e`, junto do e2e em T21, ou conferência registrada no commit)
- [x] Gate quick verde

**Tests**: unit, nomes com `FUN-123`
**Gate**: quick
**Commit**: `feat(correcoes): resumo e carga da lista de correções no app`

---

### T17: Crédito do Sobre com as correções (FUN-119, FUN-120)

**What**: `TelaSobre` ganha `totalCorrecoes` e `aoVerCorrecoes`: com total > 0, o texto de FUN-119 e o botão-link "Ver as correções no texto"; com 0, o texto de hoje (FUN-120). Trocar o teste de FUN-38 (aprovado na spec).
**Estimativa**: 90 min
**Risco**: alto
**Domínio**: não
**Criticidade**: comum
**Where**: `src/telas/TelaSobre.tsx`
**Depends on**: T16
**Reuses**: Estender `TelaSobre` (`src/telas/TelaSobre.tsx:26-42`), links como em `:30`; `BotaoSecundario` ou link no molde de `src/componentes/base/Botoes.tsx:23`
**Requirement**: FUN-119, FUN-120

**Done when**:

- [x] Com total > 0: "texto baseado na Bíblia Livre (BLIVRE)", os três autores, fevereiro de 2018, link da licença CC BY 4.0 Brasil, link da fonte, correções de digitação, ortografia e sentido, não endosso das mudanças nem do app, e "Ver as correções no texto", que chama `aoVerCorrecoes` (FUN-119)
- [x] Com 0: "Só o formato do arquivo foi convertido para o app; o texto não foi modificado" e nenhum link de correções (FUN-120)
- [x] O teste antigo de FUN-38 passa a valer para os dois ramos, tão forte quanto antes; motivo no commit
- [x] Gate quick verde

**Tests**: unit, nomes com `FUN-119`/`FUN-120`
**Gate**: quick
**Commit**: `feat(sobre): crédito da bíblia livre com as correções`

---

### T18: Capa "Baseado na Bíblia Livre" (FUN-121)

**What**: `CapaLivro` ganha `baseado?: boolean` (padrão `resumoCorrecoes.total > 0`) e mostra "Baseado na Bíblia Livre" ou "Bíblia Livre". Trocar o teste da capa (aprovado na spec).
**Estimativa**: 45 min
**Risco**: baixo
**Domínio**: não
**Criticidade**: comum
**Where**: `src/livro/CapaLivro.tsx`
**Depends on**: T17
**Reuses**: Estender `CapaLivro` (`src/livro/CapaLivro.tsx:5-19`), mesma classe `capa__traducao`
**Requirement**: FUN-121

**Done when**:

- [x] `baseado` verdadeiro: "Baseado na Bíblia Livre"; falso: "Bíblia Livre"; o resto da capa igual (FUN-89 continua)
- [x] Gate quick verde

**Tests**: unit, nomes com `FUN-121`
**Gate**: quick
**Commit**: `feat(capa): nome da tradução com as correções`

---

### T19: Tela de correções no estado e no App (FUN-122)

**What**: `Tela` ganha `'correcoes'`; `App` renderiza `TelaCorrecoes` com `aoVoltar = irPara('sobre')` e passa `totalCorrecoes` e `aoVerCorrecoes = irPara('correcoes')` ao Sobre.
**Estimativa**: 1h
**Risco**: baixo
**Domínio**: não
**Criticidade**: comum
**Where**: `src/estado/leitor.ts`
**Depends on**: T18
**Reuses**: `irPara` genérico (`src/estado/leitor.ts:230-241`); ramo do Sobre em `src/App.tsx:69-76`
**Requirement**: FUN-122

**Done when**:

- [x] Reducer: `irPara('correcoes')` a partir do Sobre e `irPara('sobre')` de volta mantêm `ref`, formato e âncora
- [x] App: no Sobre com correções, tocar "Ver as correções no texto" mostra a tela; "Voltar" volta ao Sobre, e o "Voltar" do Sobre continua levando ao capítulo aberto
- [x] Gate quick verde

**Tests**: unit, nomes com `FUN-122`, em `src/estado/leitor.test.ts` e `src/App.test.tsx`
**Gate**: quick
**Commit**: `feat(estado): tela de correções aberta pelo sobre`

---

### T20: Tela "Correções no texto" (FUN-122, FUN-123)

**What**: Criar `TelaCorrecoes` e o CSS conforme `mockup/telas/correcoes.html`: carregando, erro com "Tentar de novo", vazio; regras numa linha com "N versículos"; livros em `<details>` recolhidos, na ordem bíblica, com "N correções"; item com referência, `<del>` antes, `<ins>` depois, motivo e "Antes:"/"Depois:" para leitor de tela; itálico dos colchetes por `segmentar`.
**Estimativa**: 2h
**Risco**: alto
**Domínio**: não
**Criticidade**: comum
**Where**: `src/telas/TelaCorrecoes.tsx` (novo)
**Depends on**: T19
**Reuses**: `BotaoVoltar`, `Estado`, `segmentar`, `indice.livros[n-1].nome`; classes e tokens do mockup aprovado (`linha-regra`, `livro-correcoes`, `item-correcao`); `carregar` injetável com padrão `carregarCorrecoes` (T16)
**Requirement**: FUN-122, FUN-123

**Done when**:

- [x] Com uma lista de exemplo fora de ordem: livros saem na ordem bíblica e os itens por capítulo e versículo; livro sem correção não aparece (FUN-122)
- [x] Cada regra aparece numa linha com a descrição e "N versículos" (FUN-123)
- [x] Item mostra referência, antes, depois e motivo; colchete nunca aparece, o trecho fica em itálico
- [x] Carregando enquanto a promessa não volta; erro com "Tentar de novo", que chama `carregar` de novo; vazio com a mensagem do mockup
- [x] Gate quick verde

**Tests**: unit, nomes com `FUN-122`/`FUN-123`, em `src/telas/TelaCorrecoes.test.tsx`
**Gate**: quick
**Commit**: `feat(telas): tela correções no texto`

---

### T21: Jornada no app, com e sem rede (FUN-116, FUN-122, FUN-124)

**What**: Criar `e2e/correcoes.spec.ts` sobre `pnpm build:e2e`; o CI troca o build do e2e para `pnpm build:e2e`; `test/arquivos/deploy.test.ts` garante que o deploy usa `pnpm build`.
**Estimativa**: 2h
**Risco**: alto
**Domínio**: não
**Criticidade**: comum
**Where**: `e2e/correcoes.spec.ts` (novo)
**Depends on**: None (a Phase 6 inteira vem antes)
**Reuses**: `abrirPelaEscolha`, `esperarSwAtivo`, `versiculos` (`e2e/apoio/navegar.ts:38`, `:81`, `:56`); modo livro e `rotuloPagina` (`e2e/apoio/livro.ts:10`); offline como em `e2e/offline.spec.ts`; AD-016
**Requirement**: FUN-116, FUN-122, FUN-124

**Done when**:

- [x] Apocalipse 6:1 mostra "Cordeiro" (e não "Coreiro") na rolagem e no modo livro (FUN-116)
- [x] Sobre → "Ver as correções no texto" → Apocalipse aberto mostra "Coreiro" riscado e "Cordeiro" → "Voltar" volta ao Sobre (FUN-122)
- [x] Com o service worker ativo e a rede cortada, a tela abre com a lista completa (FUN-124)
- [x] Teste de arquivo: o job de e2e do CI roda `pnpm build:e2e`; o deploy roda `pnpm build` sem `--correcoes`
- [x] Rodada sem a mudança (teste vermelho) registrada; teto de 2 tentativas de 5 min
- [x] Gate full verde

**Tests**: e2e, nomes com `FUN-116`/`FUN-122`/`FUN-124`
**Gate**: full
**Commit**: `test(e2e): jornada das correções com e sem rede`

---

Gate: pnpm typecheck && pnpm test @ 069a0ee0c916eb1c5941b14442575164e11cf205 = verde

### T22: Comando de exportação roda pelo Node (A-01)

**What**: Imports com extensão `.ts` em `src/revisao/mesclar.ts` e `src/revisao/logica.ts` (e no que o encadeamento de `scripts/aplicar-decisoes.ts` carregar), e teste que roda o comando por processo filho.
**Estimativa**: 1h30
**Risco**: alto
**Domínio**: não
**Criticidade**: crítica
**Depends on**: —
**Reuses**: Cabeçalho de `src/biblia/correcoes/arquivo.ts:1-3` (imports relativos com `.ts`); processo filho como em `test/arquivos/converter-biblia.test.ts`
**Requirement**: FUN-113 · Achado: A-01 (validation.md)
**Tests**: `test/arquivos/aplicar-decisoes.test.ts`: `node scripts/aplicar-decisoes.ts <decisoes>` em `tmpdir` regrava o arquivo; decisão recusada sai com erro e não grava; falha antes da correção com `ERR_MODULE_NOT_FOUND`
**Gate**: quick

- [x] Concluída

---

### T23: Aplicação com deslocamento de posição (A-02)

**What**: Teste de dois itens aprovados no mesmo versículo em que o primeiro "depois" muda o tamanho do texto, nas duas ordens do arquivo, esperando o versículo exato.
**Estimativa**: 45 min
**Risco**: alto
**Domínio**: não
**Criticidade**: crítica
**Depends on**: T22
**Reuses**: `src/biblia/correcoes/aplicar.test.ts:39-45`
**Requirement**: FUN-114, FUN-127 · Achado: A-02 (validation.md)
**Tests**: `src/biblia/correcoes/aplicar.test.ts`, nome com `FUN-127`; falha com a ordem de `aplicar.ts:44` invertida
**Gate**: quick

- [x] Concluída

---

### T24: Exportação recusa aprovadas sobrepostas (A-03)

**What**: `mesclarDecisoes` recusa, antes de gravar, duas aprovadas que se sobrepõem no mesmo versículo, apontando os dois ids (mesma regra de `validarCorrecoes`).
**Estimativa**: 1h
**Risco**: alto
**Domínio**: não
**Criticidade**: comum
**Depends on**: T23
**Reuses**: Checagem de sobreposição de `src/biblia/correcoes/validar.ts:66-78` (reaproveitar, não duplicar)
**Requirement**: FUN-107, FUN-113 · Achado: A-03 (validation.md)
**Tests**: `src/revisao/mesclar.test.ts`: par sobreposto aprovado é recusado com os dois ids; encostados passam
**Gate**: quick

- [x] Concluída

---

### T25: Item sobreposto vai ao um a um (A-03)

**What**: O agrupamento da revisão manda ao "um a um" todo item cujo trecho se sobrepõe ao de outro item do mesmo versículo, para o bloco nunca aprovar os dois.
**Estimativa**: 1h30
**Risco**: alto
**Domínio**: não
**Criticidade**: comum
**Depends on**: T24
**Reuses**: `src/revisao/logica.ts:97-105` (`ehBloco`/agrupar)
**Requirement**: FUN-110 · Achado: A-03 (validation.md)
**Tests**: `src/revisao/logica.test.ts`: dois itens sobrepostos de confiança alta não entram no bloco
**Gate**: quick

- [x] Concluída

---

### T26: Prova da lista em pedaço separado e no pré-cache (A-04)

**What**: Teste de arquivo sobre o `dist-e2e`: a lista de correções está num JS próprio de `assets/` e o `sw.js` o lista.
**Estimativa**: 1h
**Risco**: baixo
**Domínio**: não
**Criticidade**: comum
**Depends on**: T25
**Reuses**: `test/arquivos/` (testes de arquivo sobre o build); critério da T16
**Requirement**: FUN-124 · Achado: A-04 (validation.md)
**Tests**: `test/arquivos/correcoes-pedaco.test.ts`, nome com `FUN-124`; pula com aviso se `dist-e2e` não existe ou roda após `pnpm build:e2e`, conforme o molde do projeto
**Gate**: quick

- [x] Concluída

---

### T27: Edição salva do "depois" não se perde (A-05)

**What**: O cartão do item parte do `depois` da decisão salva (quando houver) no campo, na prévia e na reaprovação.
**Estimativa**: 1h30
**Risco**: alto
**Domínio**: não
**Criticidade**: comum
**Depends on**: T26
**Reuses**: `src/revisao/pagina.ts:205-230`
**Requirement**: FUN-112 · Achado: A-05 (validation.md)
**Tests**: `src/revisao/pagina.test.ts`: editar e aprovar, voltar ao item (ou recarregar do banco dublê) mostra o texto editado e reaprovar grava o mesmo `depois`
**Gate**: quick

- [x] Concluída

---

### T28: Regra sem versículo mudado não conta (A-06)

**What**: Regra aprovada que muda 0 versículos fica fora da lista aplicada e do total do resumo.
**Estimativa**: 1h
**Risco**: alto
**Domínio**: não
**Criticidade**: comum
**Depends on**: T27
**Reuses**: `src/biblia/correcoes/aplicar.ts:70-78`, `scripts/converter-biblia.ts:65`
**Requirement**: FUN-123 · Achado: A-06 (validation.md)
**Tests**: `src/biblia/correcoes/aplicar.test.ts`, nome com `FUN-123`: regra aprovada sem efeito não aparece; total 0 quando nada muda
**Gate**: quick

- [x] Concluída

---

### T29: Exportação lista os "depois" editados (A-07)

**What**: `scripts/aplicar-decisoes.ts` imprime, antes de gravar, cada item com `depois` editado (id, referência, antes e depois) para o dono conferir.
**Estimativa**: 1h
**Risco**: alto
**Domínio**: não
**Criticidade**: comum
**Depends on**: T28
**Reuses**: `scripts/aplicar-decisoes.ts:36-39`
**Requirement**: FUN-113 · Achado: A-07 (validation.md)
**Tests**: `test/arquivos/aplicar-decisoes.test.ts`: a saída lista o item editado e não lista o aprovado sem edição
**Gate**: quick

- [x] Concluída

---

Gate: pnpm typecheck && pnpm test @ 419e5fd4d93473abca73d8492ec6be9689d141f7 = verde

### T30: Recusar caracteres de controle no "depois" (A-10)

**What**: `mesclarDecisoes` e `validarCorrecoes` recusam `depois` com caracteres de controle (`[ --  ]`), com a mensagem citando o id, sem gravar.
**Estimativa**: 1h
**Risco**: alto
**Domínio**: não
**Criticidade**: crítica
**Depends on**: None
**Reuses**: `src/biblia/correcoes/validar.ts:41-83` (molde da recusa por campo), `src/revisao/mesclar.ts:40-46`
**Requirement**: FUN-113, FUN-125 · Achado: A-10 (validation.md)
**Tests**: `src/revisao/mesclar.test.ts` e `src/biblia/correcoes/validar.test.ts`: `depois` com ``, `
`, `` e ` ` é recusado (um teste por variante) e o arquivo de entrada não muda; `test/arquivos/aplicar-decisoes.test.ts`: o comando real sai com erro e não grava
**Gate**: quick

- [ ] Concluída

---

### T31: Lista dos editados antes de gravar e só com aprovados (A-07)

**What**: `scripts/aplicar-decisoes.ts` monta a lista dos `depois` editados antes do `writeFileSync`, imprime com `JSON.stringify` em antes e depois e lista só itens que ficam `aprovada` (recusados não aparecem).
**Estimativa**: 1h
**Risco**: alto
**Domínio**: não
**Criticidade**: comum
**Depends on**: T30
**Reuses**: `scripts/aplicar-decisoes.ts:50-80`
**Requirement**: FUN-113 · Achado: A-07 (validation.md, reaberto)
**Tests**: `test/arquivos/aplicar-decisoes.test.ts`: item recusado com `depois` salvo não aparece na saída; a lista é impressa antes da gravação (ex.: falha de gravação provocada depois da listagem e a saída já traz o item); texto com aspas sai escapado
**Gate**: quick

- [ ] Concluída

---

### T32: Sobreposição por contenção na ordem inversa (A-08)

**What**: Teste de `agrupar` com o item menor listado antes do maior que o contém: os dois vão ao "um a um" e o bloco fica vazio.
**Estimativa**: 30 min
**Risco**: baixo
**Domínio**: não
**Criticidade**: comum
**Depends on**: T31
**Reuses**: `src/revisao/logica.test.ts:78-85`
**Requirement**: FUN-110 · Achado: A-08 (validation.md)
**Tests**: `src/revisao/logica.test.ts`: `arquivo([menor, maior])`, os dois ids em `umAUm`
**Gate**: quick

- [ ] Concluída

---

### T33: Recusar mantém o "depois" salvo (A-09)

**What**: Teste da página de revisão: item com `depois` salvo na decisão, o dono clica Recusar e a gravação leva o `depois` salvo.
**Estimativa**: 30 min
**Risco**: baixo
**Domínio**: não
**Criticidade**: comum
**Depends on**: T32
**Reuses**: `src/revisao/pagina.test.ts:144-177`
**Requirement**: FUN-112 · Achado: A-09 (validation.md)
**Tests**: `src/revisao/pagina.test.ts`: `gravacoes[0]` igual a `{id, estado: 'recusada', depois: <salvo>}`
**Gate**: quick

- [ ] Concluída

---

## Critérios

| ID | Tarefa |
|---|---|
| FUN-103 | T1 |
| FUN-104 | T7, T8, T10 |
| FUN-105 | T8, T10 |
| FUN-106 | T2, T9, T10 |
| FUN-107 | T3 |
| FUN-108 | T11, T14 |
| FUN-109 | T13, T14 |
| FUN-110 | T11 |
| FUN-111 | T11, T14 |
| FUN-112 | T11, T14, T15 |
| FUN-113 | T12, T15 |
| FUN-114 | T4, T5, T6 |
| FUN-115 | T3, T5 |
| FUN-116 | T21 |
| FUN-117 | T2, T4 |
| FUN-118 | T5 |
| FUN-119 | T17 |
| FUN-120 | T17 |
| FUN-121 | T18 |
| FUN-122 | T19, T20, T21 |
| FUN-123 | T16, T20 |
| FUN-124 | T16, T21 |
| FUN-125 | T3 |
| FUN-126 | T3, T6 |
| FUN-127 | T4 |
