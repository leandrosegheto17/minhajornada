# Páginas do livro: tarefas

**Spec**: `.specs/features/livro-paginas/spec.md` (FUN-128 a FUN-136) · **Reconhecimento**: `.specs/features/livro-paginas/reconhecimento.md`
**Branch pai**: desenvolvimento
**Status**: Approved

**Desenho (inline, sem `design.md`):** a quebra por capítulo é um parâmetro opcional de `paginar` (`src/livro/paginacao.ts:61`): uma lista `quebras` alinhada aos blocos, em que `true` fecha a página atual antes do bloco, se ela já tem partes. `quebrasDoLivro(blocos)` marca o versículo 1 dos capítulos 2 em diante; o capítulo 1 fica junto do nome do livro (FUN-130). Sem `quebras`, `paginar` devolve o mesmo de hoje. O vão entra na fórmula de `--largura-pagina-larga` (`livro.module.css:270`), lida pela página e pela medida, e no `column-gap` de `.livro__aberto`; a linha é um pseudo-elemento de `.livro__aberto` centrado no vão. Nada novo em `tokens.css`.

**Segurança padrão de app web:** não se aplica. O site é estático na Cloudflare (AD-001), sem servidor que escute porta, receba requisição que mude estado ou valide `Host`; os cabeçalhos (FUN-42, AD-003) não mudam; nenhum `style` inline nem script novo; nenhum dado do usuário vira HTML.

**Conferência spec × design:** nenhuma divergência. FUN-96 já previa "o vão entre elas"; a spec fixa o vão em 32 px (FUN-133) e o desenho o desconta da largura de cada página (FUN-135). Decisões que valem: AD-001 a AD-020.

**Testes existentes que mudam** (regra de Testes; autorização registrada em `.specs/STATE.md`, `## Autorizações`, na aprovação do plano):

- `test/arquivos/livro-css.test.ts:45-49`: a fórmula exata de `--largura-pagina-larga` passa a descontar `var(--esp-8)`; continua afirmando que `.livro__aberto` e `.medida` leem a mesma variável (T5).
- `e2e/livro-tela-cheia.spec.ts:171-187` (FUN-96): "metade cada" passa a ser "metade da largura menos as margens e o vão de 32 px", com a mesma tolerância (T5).
- `e2e/livro-tela-cheia.spec.ts:305-320` (FUN-98) e `:344-351` (FUN-99): só se quebrarem com a largura nova, trocados por asserções tão fortes quanto antes, contra as bordas das páginas (T5).

---

## Linha de base

- **Comando**: `pnpm typecheck && pnpm test` (`.specs/projeto/testes.json`), pelo Git Bash
- **Resultado**: rodado em 2026-11-19 no commit `efb0112` (`trava-testes.py --rodar`): typecheck verde; Vitest 60 arquivos, 996 testes, todos passando. Depois dele só entraram commits de `.specs/` (roteiro, spec e reconhecimento desta feature)
- **Falhas preexistentes**: nenhuma. Aviso de ambiente: Node 26 local fora de `engines` (`>=24 <25`). O `bash` do PowerShell é o do WSL e derruba `deploy.test.ts`: rode pelo Git Bash
- **T0 (rede de proteção)**: não precisa. Os comportamentos tocados têm teste: `paginar` (`src/livro/paginacao.test.ts:116-332`, `test/arquivos/paginacao-66.test.ts`), a medida igual à página (`test/arquivos/livro-css.test.ts:37-49`, `e2e/livro-tela-cheia.spec.ts:235-253`), a tela larga (`e2e/livro-tela-cheia.spec.ts:171-353`) e a tela estreita e o retrato (FUN-102, caracterizados na `livro-tela-cheia`)
- **Regra do /executar**: nenhuma falha nova; a suíte inteira e o E2E rodam ao fim da feature

---

## Test Coverage Matrix

> Gerada do código e da spec. Guidelines encontradas: `.claude/CLAUDE.md` (Execução, Testes), `vite.config.ts` (projetos `componentes` e `arquivos`), `.specs/projeto/testes.json`. Amostras: `src/livro/paginacao.test.ts`, `test/arquivos/paginacao-66.test.ts`, `test/arquivos/livro-css.test.ts`, `e2e/livro.spec.ts`, `e2e/livro-tela-cheia.spec.ts`.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Paginação pura (`src/livro/paginacao.ts`) | unit | Um teste por regra e por caso limite: quebra no meio da página, quebra no bloco 0, quebra em bloco maior que a página, quebras seguidas, sem `quebras` igual a hoje; os 66 livros reais com a quebra | `src/livro/*.test.ts`, `test/arquivos/*.test.ts` | `pnpm vitest run src/livro/paginacao.test.ts test/arquivos/paginacao-66.test.ts --reporter=dot` |
| Tela do livro (`src/telas/TelaLivro.tsx`) | e2e | O capítulo começa no topo de página em tela larga e estreita, a página do fim fica sem versículo do seguinte, o capítulo 1 junto do nome, o capítulo que abre à direita, a grade e a troca de letra | `e2e/livro.spec.ts` | `pnpm build && pnpm e2e e2e/livro.spec.ts` |
| CSS do modo livro (`src/livro/livro.module.css`) | e2e e unit (node, lê o arquivo) | Asserção espacial (`boundingBox`, `getComputedStyle`) do vão, da linha, das larguras, dos cantos e da tela estreita, nos três temas; a invariante página = medida no arquivo | `e2e/livro-tela-cheia.spec.ts`, `test/arquivos/livro-css.test.ts` | `pnpm vitest run test/arquivos/livro-css.test.ts --reporter=dot` e `pnpm build && pnpm e2e e2e/livro-tela-cheia.spec.ts` |

## Gate Check Commands

> Do `package.json` e de `.specs/projeto/testes.json`.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Tarefas só com teste unitário | `pnpm typecheck && pnpm vitest run --reporter=dot` |
| Full | Tarefas com e2e | `pnpm typecheck && pnpm vitest run --reporter=dot && pnpm build && pnpm e2e <arquivo do e2e>` |
| Build | Fim da feature | `pnpm lint && pnpm typecheck && pnpm vitest run --reporter=dot && pnpm build && pnpm e2e` |

---

## Execution Plan

As Phases rodam em ordem; dentro de cada uma, as tarefas seguem a ordem indicada. Lotes previstos: **Lote 1** comum (Phase 1, 5h30) e **Lote 2** comum (Phase 2, 5h). O e2e roda uma vez ao fim de cada lote (prova de tela).

### Phase 1: Capítulo em página nova (comum)

```
T1 → T2 → T3 → T4
```

### Phase 2: Páginas separadas em tela larga (comum)

```
T5 → T6 → T7
```

---

## Task Breakdown

### T1: `paginar` fecha a página antes de um bloco marcado (FUN-128, FUN-129, FUN-132)

**What**: Acrescentar a `paginar` o parâmetro opcional `quebras?: readonly boolean[]`, alinhado aos blocos: com `quebras[i]` verdadeiro, a página atual fecha antes do bloco `i` quando já tem partes.
**Estimativa**: 90 min
**Risco**: alto
**Domínio**: não
**Criticidade**: comum
**Where**: `src/livro/paginacao.ts`
**Depends on**: None
**Reuses**: `paginar` e o `fechar()` interno (`src/livro/paginacao.ts:61-106`), estendidos; casos no molde de `src/livro/paginacao.test.ts:116-228` (alturas inventadas)
**Requirement**: FUN-128, FUN-129, FUN-132

**Done when**:

- [x] Quebra num bloco que caberia no resto da página: ele abre a página seguinte e a página anterior termina no bloco de antes (FUN-128, FUN-129)
- [x] Quebra no bloco 0, ou num bloco que já abriria página nova (página atual vazia): nenhuma página vazia é criada
- [x] Quebra num bloco maior que a página: as fatias começam no topo da página nova, como hoje (FUN-132)
- [x] Depois da quebra, os blocos seguintes do mesmo capítulo continuam enchendo a página (FUN-132)
- [x] Duas quebras seguidas (capítulo de um bloco): cada um numa página, o resto em branco (FUN-129)
- [x] Sem `quebras`, ou com todas falsas, o resultado é igual ao de hoje em todos os casos existentes (os testes atuais passam sem mudança)
- [x] Gate quick verde

**Tests**: unit em `src/livro/paginacao.test.ts`, nomes com `FUN-128`, `FUN-129` ou `FUN-132`
**Gate**: quick
**Commit**: `feat(livro): paginar fecha a página antes do bloco marcado`

---

### T2: `quebrasDoLivro` marca o começo dos capítulos 2 em diante (FUN-128, FUN-130)

**What**: Criar `quebrasDoLivro(blocos)` em `paginacao.ts`, que devolve `true` para o versículo 1 dos capítulos 2 em diante e `false` para o resto, e provar a regra nos 66 livros reais.
**Estimativa**: 1h
**Risco**: alto
**Domínio**: não
**Criticidade**: comum
**Where**: `src/livro/paginacao.ts`
**Depends on**: T1
**Reuses**: `Bloco.abreCapitulo` (`src/livro/paginacao.ts:9,38`); o laço dos 66 livros de `test/arquivos/paginacao-66.test.ts:21-40`
**Requirement**: FUN-128, FUN-130

**Done when**:

- [x] Rute (4 capítulos): `true` só nos blocos de 2:1, 3:1 e 4:1; o nome do livro e o 1:1 dão `false` (FUN-130)
- [x] Judas (1 capítulo): nenhuma quebra
- [x] Nos 66 livros, com páginas de 300 e de 60 px: todo versículo 1 de capítulo 2 em diante é a primeira parte de uma página; o 1:1 fica na página do nome do livro; nenhum bloco some e a ordem se mantém
- [x] Gate quick verde

**Tests**: unit em `src/livro/paginacao.test.ts` e `test/arquivos/paginacao-66.test.ts`, nomes com `FUN-128` ou `FUN-130`
**Gate**: quick
**Commit**: `feat(livro): marca o começo dos capítulos para a paginação`

---

### T3: A tela do livro pagina com as quebras dos capítulos (FUN-128, FUN-129, FUN-130)

**What**: Passar `quebrasDoLivro(blocos)` a `paginar` em `TelaLivro.tsx` e provar no navegador, em tela larga e estreita, que o capítulo começa no topo de uma página.
**Estimativa**: 90 min
**Risco**: alto
**Domínio**: não
**Criticidade**: comum
**Where**: `src/telas/TelaLivro.tsx:81-85`
**Depends on**: T2
**Reuses**: `useMemo` de `blocos` e `paginas` (`src/telas/TelaLivro.tsx:81-85`); `abrirNoLivro`, `rotuloPagina`, `passar` e a asserção de topo de `e2e/livro.spec.ts:71-89`
**Requirement**: FUN-128, FUN-129, FUN-130

**Done when**:

- [x] Em 1920 × 1080 e em 390 × 844, Gênesis 20 até o 21: a página com 21:1 tem o número do capítulo 21 como primeira coisa (topo da página, como `e2e/livro.spec.ts:84-88`) (FUN-128)
- [x] A página onde o 20 termina não tem versículo do 21 (FUN-129)
- [x] Gênesis 1: o nome "Gênesis" e o 1:1 na mesma página (FUN-130)
- [x] Os testes passam com a mudança e o de FUN-128 falha sem ela (rodada vermelha registrada no commit)
- [x] Gate full verde (`e2e/livro.spec.ts`)

**Tests**: e2e em `e2e/livro.spec.ts`, nomes com `FUN-128`, `FUN-129` ou `FUN-130`
**Gate**: full
**Commit**: `feat(livro): começa cada capítulo numa página nova`

---

### T4: Capítulo à direita, grade e troca de letra com as quebras (FUN-131)

**What**: Provar no navegador os casos de borda da quebra: capítulo que começa na página da direita, escolha pela grade e troca do tamanho da letra.
**Estimativa**: 90 min
**Risco**: alto
**Domínio**: não
**Criticidade**: comum
**Where**: `e2e/livro.spec.ts`
**Depends on**: T3
**Reuses**: auxiliares de `e2e/livro.spec.ts:9-21`; troca de letra como em `e2e/capa.spec.ts:91-115`
**Requirement**: FUN-131 (e os casos limite de FUN-83 e FUN-86 com FUN-128)

**Done when**:

- [x] Em 1920 × 1080, percorrendo Gênesis: há ao menos um par em que a página da esquerda termina um capítulo, e nele a página da direita começa com o número do capítulo seguinte no topo (FUN-131)
- [x] Escolher Gênesis 21 pela grade mostra a página que começa com o 21 no topo (FUN-83 com FUN-128)
- [x] Trocar a letra para o maior tamanho em Gênesis 21:1 mantém o capítulo 21 no topo da página mostrada (FUN-86 com FUN-128). Não afirma repaginação: o defeito anterior de `.specs/bugs/letra-livro-sem-repaginar/relato.md` fica fora desta feature (decisão do dono na execução, 2026-11-19)
- [x] Gate full verde (`e2e/livro.spec.ts`)

**Tests**: e2e em `e2e/livro.spec.ts`, nomes com `FUN-131`, `FUN-83` ou `FUN-86`
**Gate**: full
**Commit**: `test(e2e): prova o capítulo à direita, a grade e a troca de letra com a quebra`

---

Gate: pnpm typecheck && pnpm exec vitest run --reporter=dot @ 3c407daf91ae3697369cc07d2753db89af42ce8e = verde

### T5: Vão de 32 px entre as páginas, com a medida igual à página (FUN-133, FUN-135)

**What**: Na tela larga, descontar `var(--esp-8)` de `--largura-pagina-larga`, pôr `column-gap: var(--esp-8)` em `.livro__aberto` e somar o vão ao `max-width` de `.livro__cabeca` e `.navegacao-pagina`; corrigir o comentário de `livro.module.css:261-267`.
**Estimativa**: 2h
**Risco**: alto
**Domínio**: não
**Criticidade**: comum
**Where**: `src/livro/livro.module.css:261-304`
**Depends on**: None (a Phase 1 vem antes pela ordem das Phases)
**Reuses**: variáveis locais da tela larga (`src/livro/livro.module.css:268-304`), estendidas; asserções de `e2e/livro-tela-cheia.spec.ts:171-187` e `:235-253`
**Requirement**: FUN-133, FUN-135

**Done when**:

- [x] `test/arquivos/livro-css.test.ts`: a fórmula de `--largura-pagina-larga` desconta `var(--esp-8)`, e `.livro__aberto` e `.medida` continuam lendo a mesma variável (teste alterado com o motivo no commit)
- [x] Em 1280 × 800 e 1920 × 1080: distância entre a borda direita da página da esquerda e a esquerda da da direita = 32 px (±1) (FUN-133)
- [x] Nos mesmos tamanhos e em 900 × 600 e 1920 × 1200: as duas páginas com a mesma largura (±1), somando a largura da tela menos 2 × 24 px menos 32 px, sem rolagem horizontal (FUN-135, troca do teste de FUN-96)
- [x] A medida tem a largura da página mostrada (`e2e/livro-tela-cheia.spec.ts:235-253` verde) e nenhum versículo de Rute fica escondido em 1280 × 800 (`e2e/livro.spec.ts:40`)
- [x] Título e posição continuam alinhados às bordas das páginas, e os botões aos cantos (FUN-98, FUN-99 verdes)
- [x] Gate full verde (`e2e/livro-tela-cheia.spec.ts`, `e2e/livro.spec.ts`)

**Tests**: unit em `test/arquivos/livro-css.test.ts` e e2e em `e2e/livro-tela-cheia.spec.ts`, nomes com `FUN-133` ou `FUN-135`
**Gate**: full
**Commit**: `feat(livro): afasta as duas páginas em tela larga`

---

### T6: Linha de 1 px no centro do vão (FUN-134)

**What**: Desenhar com um pseudo-elemento de `.livro__aberto`, só na tela larga, uma linha vertical de 1 px na cor `var(--cor-borda)`, centrada no vão e com a altura das páginas.
**Estimativa**: 90 min
**Risco**: baixo
**Domínio**: não
**Criticidade**: comum
**Where**: `src/livro/livro.module.css`
**Depends on**: T5
**Reuses**: `--cor-borda` (`src/estilo/tokens.css:17,95,112,128,144`); troca de tema como nos e2e de aparência existentes
**Requirement**: FUN-134

**Done when**:

- [x] Em 1280 × 800, nos temas claro, escuro e sépia: o `::before` (ou `::after`) de `.livro__aberto` tem 1 px de largura e `background-color` igual ao valor computado de `--cor-borda` do tema (FUN-134)
- [x] O meio da linha fica a 1 px do meio do vão, e o topo e a altura dela coincidem com os das páginas (±1) (FUN-134)
- [x] Gate full verde (`e2e/livro-tela-cheia.spec.ts`)

**Tests**: e2e em `e2e/livro-tela-cheia.spec.ts`, nomes com `FUN-134`
**Gate**: full
**Commit**: `feat(livro): linha fina entre as duas páginas`

---

### T7: Cantos, capa e tela estreita com a separação (FUN-133, FUN-134, FUN-136)

**What**: Na tela larga, arredondar os quatro cantos das duas páginas com `--raio-m`; provar que a capa e o plano pago têm o mesmo vão e a mesma linha e que a tela estreita não tem vão nem linha.
**Estimativa**: 90 min
**Risco**: baixo
**Domínio**: não
**Criticidade**: comum
**Where**: `src/livro/livro.module.css:66-73`
**Depends on**: T6
**Reuses**: `.pagina--esquerda` e `.pagina--direita` (`src/livro/livro.module.css:66-73`); a capa de `e2e/capa.spec.ts:21-35`
**Requirement**: FUN-133, FUN-134, FUN-136

**Done when**:

- [x] Em 1280 × 800: as duas páginas de texto têm os quatro `border-*-radius` iguais ao valor de `--raio-m`
- [x] Em 1280 × 800, na capa: plano pago à esquerda e capa à direita com o vão de 32 px e a linha de 1 px no meio (FUN-133, FUN-134)
- [x] Em 390 × 844 e 1024 × 1366: uma página só, sem pseudo-elemento visível de linha e com os cantos de hoje (FUN-136; o teste de FUN-102 continua verde)
- [x] Gate full verde (`e2e/livro-tela-cheia.spec.ts`, `e2e/capa.spec.ts`)

**Tests**: e2e em `e2e/livro-tela-cheia.spec.ts`, nomes com `FUN-133`, `FUN-134` ou `FUN-136`
**Gate**: full
**Commit**: `feat(livro): cantos e capa com as páginas separadas`

Gate: pnpm typecheck && pnpm exec vitest run --reporter=dot @ 55eecc480c1c4f15d8aefb6ce1a4fd6f270bef4b = verde
