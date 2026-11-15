# Leitor bíblico: tarefas

**Passada**: rascunho
**Branch pai**: desenvolvimento
**Design**: `.specs/features/leitor/design.md`
**Spec**: `.specs/features/leitor/spec.md` (FUN-01 a FUN-50)
**Mockup**: `.specs/mockup/` (direção C; `tokens.css` copiado sem alterar)
**Status**: Draft

**Pré-requisito (do `/preparar`, Nível 1):** pacote pnpm único na raiz com Node 24, React 19, Vite 8, vite-plugin-pwa 2, TypeScript, Vitest com os projetos `componentes` (jsdom) e `arquivos` (node), Playwright servindo o build por `vite preview` em `127.0.0.1`, ESLint e Prettier, CI e `testes.json`. Molde: `c:/Leandro/Projetos/ControleEmCasa_LJS/frontend/web` (`design.md`, Code Reuse Analysis). Nenhuma tarefa abaixo cria esqueleto, CI ou deploy.

**Segurança padrão de app web:** aplica-se em parte. Não há servidor que escute porta, receba requisição que mude estado ou valide `Host` (site estático na Cloudflare; spec, premissa "Hospedagem e segurança HTTP"): escuta, guarda de origem e `Host` **não se aplicam**. Os cabeçalhos entram em T3 (FUN-42) e a saída escapada em T4 e T21 (FUN-04), no primeiro lote crítico.

**Conferência spec × design:** feita em `design.md` (seção "Conferência spec × design"); a única divergência (dois toques) virou ajuste da spec (FUN-49, FUN-50). Decisões que as tarefas aplicam: AD-001, AD-002 e AD-003 em `.specs/STATE.md`.

---

## Test Coverage Matrix

> Gerada do design, do molde e da spec, porque o projeto ainda não tem testes. Comandos previstos para o esqueleto do `/preparar` (molde ControleEmCasa_LJS); o `/preparar` grava o comando real em `testes.json`. Guidelines encontradas: nenhuma no projeto; `CLAUDE.md` (Execução, Testes); padrões fortes aplicados.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Conversor e índice (`src/biblia/`, `scripts/`) | unit (node) | Todos os ramos; FUN-03 sobre os 31.102 versículos reais; falha em sequência quebrada | `src/biblia/*.test.ts`, `test/arquivos/*.test.ts` | `pnpm vitest run --project arquivos` |
| Regras puras (`src/biblia/segmentos`, `src/navegacao/`, `src/estado/` reducer) | unit | Todos os ramos; 1:1 com os critérios; todos os casos limite da spec (Gênesis 1, Apocalipse 22, capítulo único, 60 px) | `src/**/*.test.ts` | `pnpm vitest run --project componentes` |
| Dados no aparelho (`src/dados/`) | unit | Leitura e gravação válidas, valor ilegível, fora do intervalo, armazenamento indisponível; Cache API por dublê com falha provocada | `src/dados/*.test.ts` | `pnpm vitest run --project componentes` |
| Componentes e telas (`src/componentes/`, `src/telas/`) | unit (Testing Library, jsdom) | Cada critério visível da tela: texto, estado desativado, rótulo acessível, ação disparada | `src/**/*.test.tsx` | `pnpm vitest run --project componentes` |
| Service worker, offline e jornadas (`src/pwa/`, app no build) | e2e (Playwright no `vite preview`) | Caminho feliz, sem rede, atualização, livro não baixado, requisições a outros domínios | `e2e/*.spec.ts` | `pnpm build && pnpm e2e` |
| Configuração (`public/_headers`, `eslint.config.mjs`, `tokens.css`) | unit (node, lê o arquivo) | Cada diretiva e cada regra com um teste que falha se ela for removida | `test/arquivos/*.test.ts`, `test/lint/*.test.ts` | `pnpm vitest run --project arquivos` |

## Gate Check Commands

> Gerados do molde; confirmar no `/preparar`.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Tarefas só com teste unitário | `pnpm typecheck && pnpm vitest run --reporter=dot` |
| Full | Tarefas com e2e (SW, offline, jornadas) | `pnpm typecheck && pnpm vitest run --reporter=dot && pnpm build && pnpm e2e --reporter=dot` |
| Build | Fim da feature | `pnpm lint && pnpm typecheck && pnpm vitest run --reporter=dot && pnpm build && pnpm e2e --reporter=dot` |

---

## Execution Plan

As Phases rodam em ordem; dentro de cada uma, as tarefas seguem a ordem indicada.

### Phase 1: Texto bíblico

```
T1 → T2
```

### Phase 2: Segurança

```
T3
T4
```

### Phase 3: Regras de leitura

```
T5
T6 → T7 → T9
T8
```

### Phase 4: Livros offline

```
T10 → T11
T10 → T12
```

### Phase 5: Service worker

```
T13 → T14
```

### Phase 6: Estilo e componentes base

```
T15 → T16
T15 → T17
T15 → T18
```

### Phase 7: Estado do leitor

```
T19 → T20
```

### Phase 8: Telas

```
T21 → T22 → T23
T22 → T24
T25
T26
T27
T22 → T28
```

### Phase 9: Instalação e app

```
T29 → T30 → T31
T32
```

### Phase 10: Jornadas ponta a ponta

```
T33
T34
T35
```

---

## Task Breakdown

### T1: Conversor de um livro

**What**: Função pura `converterLivro(md, numero)` que lê `# <Nome>`, `## <Nome> <n>` e `**<v>** texto` e devolve `Livro` (`capitulos[c-1][v-1]` = texto cru com colchetes), sem o espaço do fim e falhando se um capítulo ou versículo sair da sequência 1, 2, 3...
**Estimativa**: 2h
**Risco**: alto
**Domínio**: não
**Criticidade**: crítica
**Where**: `src/biblia/conversor.ts`
**Depends on**: None
**Reuses**: formato conferido em `design.md` (Components, Conversor); tipos `Livro` de `design.md` (Data Models)
**Requirement**: FUN-03
**Status**: rascunhada
**Testes**: `src/biblia/conversor.test.ts` › "FUN-03: converte Filemom 1 com os 25 versículos, colchetes preservados e sem o espaço do fim", "FUN-03: converte Salmos com 150 capítulos, Salmos 119 com 176 versículos e Salmos 27:13 igual à fonte", "FUN-03: aceita nome com número e acento", "FUN-03: aceita fim de linha CRLF e LF e ignora o rodapé depois de ---", "FUN-03: capítulo pulado…", "FUN-03: versículo pulado…", "FUN-03: linha fora do formato…", "FUN-03: capítulo que não começa no versículo 1…", "FUN-03: capítulo de outro livro…", "FUN-03: livro sem capítulos…" (FUN-03)
**Código**: `src/biblia/conversor.ts`, `src/biblia/tipos.ts`

**Done when**:

- [ ] Testes `FUN-03` com trechos reais de `.biblia/` (Filemom 1, Salmos 119): nomes com número ("1 Samuel"), acento, colchetes preservados, espaço final removido
- [ ] Teste de erro: capítulo pulado, versículo pulado e linha fora do formato lançam erro com o livro e o capítulo na mensagem
- [ ] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(biblia): converte o markdown de um livro em estrutura de capítulos`

---

### T2: Geração dos livros e do índice no build

**What**: CLI que converte os 66 arquivos de `.biblia/`, grava `public/livros/NN.<hash8>.json` e `src/biblia/indice.gerado.json` (`montarIndice`: nome, testamento 1–39 AT e 40–66 NT, número de capítulos, arquivo), roda em `predev` e `prebuild` e tem a saída no `.gitignore`.
**Estimativa**: 2h
**Risco**: alto
**Domínio**: não
**Criticidade**: crítica
**Where**: `scripts/converter-biblia.ts`
**Depends on**: T1
**Reuses**: `converterLivro` (T1); Node 24 roda `.ts` direto (`node:fs`, `node:crypto`)
**Requirement**: FUN-03, FUN-06
**Status**: rascunhada
**Testes**: `test/arquivos/converter-biblia.test.ts` › "FUN-03: os 31.102 versículos gravados são iguais aos de .biblia/, um a um, nos 66 livros", "FUN-03: cada arquivo gravado tem o nome NN.<hash8>.json" (FUN-03); "FUN-06: 66 livros na ordem canônica, 39 do AT e 27 do NT", "FUN-06: Salmos tem 150 capítulos e Judas tem 1" (FUN-06); "o mesmo texto dá o mesmo nome e um texto diferente muda o hash" (AD-002)
**Código**: `scripts/converter-biblia.ts`, `package.json` (`predev`, `prebuild`, `pretest`, `pretypecheck`), `pnpm-workspace.yaml` (`enablePrePostScripts`), `tsconfig.json` (`allowImportingTsExtensions`, `resolveJsonModule`), `.gitignore`

**Done when**:

- [ ] Teste `FUN-03` (projeto `arquivos`): os 31.102 versículos gerados são iguais aos de `.biblia/`, um a um, nos 66 livros
- [ ] Teste `FUN-06`: índice com 66 livros na ordem canônica, 39 AT e 27 NT, Salmos com 150 capítulos e Judas com 1
- [ ] Teste: mudar o texto muda o hash do nome do arquivo; o mesmo texto dá o mesmo nome
- [ ] `package.json` com `predev`/`prebuild`; `public/livros/` e `indice.gerado.json` no `.gitignore`
- [ ] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(biblia): gera os livros com hash e o índice no build`

---

### T3: Cabeçalhos de segurança

**What**: `public/_headers` com o bloco `/*`: CSP só `'self'` (`default-src`, `script-src`, `style-src`, `img-src`, `connect-src`, `manifest-src`, `worker-src`), `object-src 'none'`, `base-uri 'none'`, `form-action 'none'`, `frame-ancestors 'none'`, sem `unsafe-inline`; `X-Content-Type-Options: nosniff`; `Referrer-Policy: same-origin`.
**Estimativa**: 1h
**Risco**: alto
**Domínio**: não
**Criticidade**: crítica
**Where**: `public/_headers`
**Depends on**: None
**Reuses**: `ControleEmCasa_LJS/frontend/web/public/_headers:4-9` e `src/cabecalhos.test.ts:12-36`, trocando `no-referrer` por `same-origin` (AD-003)
**Requirement**: FUN-42
**Status**: rascunhada
**Testes**: `test/arquivos/cabecalhos.test.ts` › "FUN-42: os cabeçalhos valem para todo o site (bloco /*)", "FUN-42: a CSP traz %s com o valor exato %s" (11 diretivas), "FUN-42: a CSP não libera unsafe-inline, unsafe-eval, curinga, data:, blob: nem domínio externo", "FUN-42: X-Content-Type-Options é nosniff", "FUN-42: Referrer-Policy é same-origin e não no-referrer" (FUN-42)
**Código**: `public/_headers` (a fumaça dos cabeçalhos servidos já está no `.github/workflows/deploy.yml`, passo 3)

**Done when**:

- [ ] Testes `FUN-42` (projeto `arquivos`), um por diretiva: cada diretiva exigida presente com o valor exato; falha se `unsafe-inline`, `unsafe-eval`, `*` ou domínio externo aparecer; o bloco vale para `/*`
- [ ] Teste: `Referrer-Policy` é `same-origin` e não `no-referrer`
- [ ] A conferência dos cabeçalhos servidos pela Cloudflare fica no smoke de deploy do `/preparar` (Nível 2), anotado em `## Retomada` se ainda não existir
- [ ] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(seguranca): adiciona csp e cabeçalhos de segurança`

---

### T4: Regras de lint de segurança

**What**: Regras no ESLint que proíbem `dangerouslySetInnerHTML`, `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `eval`/`new Function` e `fetch` fora de `src/dados/`.
**Estimativa**: 1,5h
**Risco**: alto
**Domínio**: não
**Criticidade**: crítica
**Where**: `eslint.config.mjs`
**Depends on**: None
**Reuses**: `ControleEmCasa_LJS/frontend/web/eslint.config.mjs:90, 168, 175-176` e `test/lint/regras.test.ts`
**Requirement**: FUN-04, FUN-41
**Status**: rascunhada
**Testes**: `test/lint/regras.test.ts` › "FUN-04: %s é recusado em src/" (dangerouslySetInnerHTML, innerHTML, outerHTML, insertAdjacentHTML, document.write, eval, new Function, setTimeout com texto), "FUN-04: texto comum em JSX passa" (FUN-04); "FUN-41: fetch em %s é recusado", "FUN-41: XMLHttpRequest fora de src/dados/ é recusado", "FUN-41: fetch em src/dados/ passa" (FUN-41)
**Código**: `eslint.config.mjs`

**Done when**:

- [ ] Testes `FUN-04` e `FUN-41` (`test/lint/regras.test.ts`): um trecho de código que viola cada regra é recusado pelo ESLint, e um trecho permitido (`fetch` em `src/dados/`) passa
- [ ] `pnpm lint` passa no código atual
- [ ] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(seguranca): bloqueia html interpretado e fetch fora da camada de dados`

---

### T5: Segmentos do versículo

**What**: `segmentar(texto)` devolve `{ texto, italico }[]`, com os trechos entre colchetes como itálico e sem os colchetes.
**Estimativa**: 1h
**Risco**: alto
**Domínio**: não
**Criticidade**: comum
**Where**: `src/biblia/segmentos.ts`
**Depends on**: None
**Reuses**: tipo `Segmento` de `design.md`
**Requirement**: FUN-02
**Status**: rascunhada
**Testes**: `src/biblia/segmentos.test.ts` › "FUN-02: \"[que está]\" de Filemom 1:2 vira itálico sem colchetes", "FUN-02: dois trechos no mesmo versículo", "FUN-02: trecho no início e no fim do versículo", "FUN-02: versículo sem colchete fica num trecho só, sem itálico", "FUN-02: Salmos 27:13 … mantém o espaço e o ponto", "FUN-02: nenhum trecho devolvido contém colchete" (FUN-02)
**Código**: `src/biblia/segmentos.ts`

**Done when**:

- [ ] Testes `FUN-02`: "[que está]" de Filemom 1:2 vira itálico sem colchetes; dois trechos no mesmo versículo; trecho no início e no fim; versículo sem colchete; Salmos 27:13 "[certamente já teria perecido] ." mantém o espaço e o ponto
- [ ] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(biblia): separa os acréscimos do tradutor em itálico`

---

### T6: Seguinte e anterior

**What**: `seguinte(ref, indice)` e `anterior(ref, indice)` com a passagem entre livros e `null` em Apocalipse 22 e Gênesis 1.
**Estimativa**: 1,5h
**Risco**: alto
**Domínio**: não
**Criticidade**: comum
**Where**: `src/navegacao/navegacao.ts`
**Depends on**: None
**Reuses**: `indice.gerado.json` (T2) como dado real nos testes
**Requirement**: FUN-10, FUN-11, FUN-12, FUN-13, FUN-14, FUN-15
**Status**: rascunhada
**Testes**: `src/navegacao/navegacao.test.ts` › "FUN-10: Salmos 26 → Salmos 27", "FUN-11: Malaquias 4 → Mateus 1", "FUN-11: Obadias 1 → Jonas 1 (capítulo único)", "FUN-15: Apocalipse 22 não tem seguinte (null)", "FUN-12: Salmos 27 → Salmos 26", "FUN-13: Mateus 1 → Malaquias 4", "FUN-13: Jonas 1 → Obadias 1 (capítulo único)", "FUN-14: Gênesis 1 não tem anterior (null)" (FUN-10 a FUN-15)
**Código**: `src/navegacao/navegacao.ts`, `src/biblia/indice.ts` (índice tipado lido de `indice.gerado.json`)

**Done when**:

- [ ] Testes `FUN-10` a `FUN-15`: Salmos 26 → 27; Malaquias 4 → Mateus 1; Salmos 27 → 26; Mateus 1 → Malaquias 4; Gênesis 1 anterior = `null`; Apocalipse 22 seguinte = `null`; Obadias 1 → Jonas 1 e Jonas 1 → Obadias 1 (capítulo único)
- [ ] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(navegacao): calcula o capítulo seguinte e o anterior`

---

### T7: Validação da referência gravada

**What**: `refValida(valor, indice)` devolve a `Ref` quando o livro existe e o capítulo está no intervalo, e `null` nos demais casos.
**Estimativa**: 45 min
**Risco**: alto
**Domínio**: não
**Criticidade**: comum
**Where**: `src/navegacao/navegacao.ts` (acréscimo)
**Depends on**: T6
**Reuses**: índice (T2)
**Requirement**: FUN-22
**Status**: rascunhada
**Testes**: `src/navegacao/navegacao.test.ts` › "FUN-22: Romanos 8 é válido", "FUN-22: %s é inválido (null)" (livro 0 e 67, capítulo 0 e 151 em Salmos, capítulo 2 em Judas, fracionários, texto, nulo, objeto sem campos, número), "FUN-22: devolve só livro e capítulo, sem campos a mais" (FUN-22)
**Código**: `src/navegacao/navegacao.ts` (`refValida`)

**Done when**:

- [ ] Testes `FUN-22`: Romanos 8 válido; livro 0 e 67; capítulo 0 e 151 em Salmos; capítulo 2 em Judas; tipos errados (texto, nulo, objeto sem campos, número fracionário)
- [ ] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(navegacao): valida a leitura gravada contra o índice`

---

### T8: Classificação do deslize

**What**: `classificarDeslize(dx, dy)` devolve `'seguinte'` quando `dx <= -60` e `|dx| > |dy|`, `'anterior'` quando `dx >= 60` e `|dx| > |dy|`, e `null` nos demais casos.
**Estimativa**: 45 min
**Risco**: alto
**Domínio**: não
**Criticidade**: comum
**Where**: `src/navegacao/deslize.ts`
**Depends on**: None
**Reuses**: nada
**Requirement**: FUN-16, FUN-17, FUN-18
**Status**: rascunhada
**Testes**: `src/navegacao/deslize.test.ts` › "FUN-16: -60/0 … é seguinte", "FUN-16: -80/79 … é seguinte" (FUN-16); "FUN-17: 60/0 … é anterior", "FUN-17: 80/-79 é anterior" (FUN-17); "FUN-18: %i/%i (menos de 60 px) mantém o capítulo (null)", "FUN-18: %i/%i (horizontal não maior que o vertical) mantém o capítulo (null)" (FUN-18)
**Código**: `src/navegacao/deslize.ts`

**Done when**:

- [ ] Testes `FUN-16` a `FUN-18`: -60/0 seguinte; 60/0 anterior; -59/0 e 59/0 nulo; -80/80 e -80/90 nulo (não maior que o vertical); -80/79 seguinte
- [ ] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(navegacao): classifica o deslize lateral`

---

### T9: Preferências no aparelho

**What**: Leitura e gravação em `localStorage` (`mj:leitura`, `mj:letra`, `mj:tema`, `mj:convite-ios`), com recaída no padrão quando o valor é ilegível ou inválido e `try/catch` quando o armazenamento não existe.
**Estimativa**: 2h
**Risco**: alto
**Domínio**: não
**Criticidade**: comum
**Where**: `src/dados/preferencias.ts`
**Depends on**: T7
**Reuses**: molde de chave única de `ControleEmCasa_LJS/frontend/web/src/dados/sessao.ts:13-23`; `refValida` (T7)
**Requirement**: FUN-19, FUN-22, FUN-23, FUN-30, FUN-31, FUN-47
**Status**: rascunhada
**Testes**: `src/dados/preferencias.test.ts` › "FUN-19: grava e lê a leitura atual", "FUN-19: sem leitura gravada devolve null" (FUN-19); "FUN-22: leitura ilegível (JSON quebrado) é apagada e devolve null", "FUN-22: leitura inválida (%s) é apagada e devolve null" (FUN-22); "FUN-30: grava e lê o tamanho da letra", "FUN-30: gravarLetra fora de 1 a 5 não grava", "FUN-30: grava e lê o tema %s" (FUN-30); "FUN-23: sem letra gravada o padrão é 3" (FUN-23); "FUN-31: letra gravada %s devolve o padrão 3", "FUN-31: sem tema gravado devolve null", "FUN-31: tema %s devolve null" (FUN-31); "FUN-47: dispensar o convite fica gravado" (FUN-47); "localStorage que lança em getItem e setItem não quebra e devolve os padrões", "sem localStorage nenhum, devolve os padrões"
**Código**: `src/dados/preferencias.ts`

**Done when**:

- [ ] Testes `FUN-19`/`FUN-30`: gravar e ler leitura, letra e tema
- [ ] Testes `FUN-22`: leitura ilegível (JSON quebrado) ou inválida é apagada e devolve `null`
- [ ] Testes `FUN-23`/`FUN-31`: letra ausente, 0, 6, "3" texto ou lixo devolve 3; tema desconhecido devolve `null` (tema do sistema)
- [ ] Teste `FUN-47`: dispensar o convite fica gravado
- [ ] Teste de erro: `localStorage` que lança em `getItem` e `setItem` (dublê) não quebra; devolve os padrões
- [ ] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(dados): grava leitura e preferências no aparelho`

---

### T10: Carregar um livro pelo cache ou pela rede

**What**: `carregarLivro(numero)` procura no cache `mj-livros`; sem cache, faz `fetch` do arquivo do índice, guarda e devolve; sem rede e sem cache, lança `LivroNaoBaixado`.
**Estimativa**: 1,5h
**Risco**: alto
**Domínio**: não
**Criticidade**: crítica
**Where**: `src/dados/livros.ts`
**Depends on**: None
**Reuses**: AD-002; índice (T2); regra de lint "`fetch` só em `src/dados/`" (T4)
**Requirement**: FUN-34, FUN-36
**Status**: rascunhada
**Testes**: `src/dados/livros.test.ts` › "FUN-34: livro que já está no cache não chama fetch", "FUN-34: livro fora do cache chama fetch uma vez, só para o arquivo dele, e guarda a resposta", "FUN-34: o arquivo buscado é do próprio site (/livros/NN.<hash8>.json)" (FUN-34); "FUN-36: fetch que rejeita (sem rede) e cache vazio lançam LivroNaoBaixado", "FUN-36: resposta de erro do servidor e cache vazio lançam LivroNaoBaixado" (FUN-36); "cache.put que lança não impede a leitura pela rede", "Cache API ausente não impede a leitura pela rede", "caches.open que rejeita não impede a leitura pela rede"
**Código**: `src/dados/livros.ts` (`carregarLivro`, `LivroNaoBaixado`, `CACHE_LIVROS`), `src/dados/dubleCache.ts` (dublê da Cache API, só para testes)

**Done when**:

- [ ] Testes `FUN-34` com dublê de `caches` e `fetch`: livro no cache não chama `fetch`; livro fora do cache chama `fetch` uma vez, só para o arquivo dele, e guarda a resposta
- [ ] Teste `FUN-36`: `fetch` que rejeita (sem rede) e cache vazio lançam `LivroNaoBaixado`
- [ ] Teste de erro: `cache.put` que lança não impede a leitura pela rede
- [ ] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(dados): carrega o livro pelo cache ou pela rede`

---

### T11: Baixar os livros que faltam

**What**: `baixarFaltantes(indice)` guarda no `mj-livros`, um por vez, os livros do índice que ainda não estão lá; uma falha no meio para o laço sem apagar o que já foi guardado; ao terminar, pede `navigator.storage.persist()` se existir.
**Estimativa**: 1,5h
**Risco**: alto
**Domínio**: sim
**Criticidade**: crítica
**Where**: `src/dados/livros.ts` (acréscimo)
**Depends on**: T10
**Reuses**: `carregarLivro` (T10)
**Requirement**: FUN-33
**Status**: rascunhada
**Testes**: `src/dados/baixarFaltantes.test.ts` › "FUN-33: com o cache vazio, baixa os 66 livros em sequência, na ordem do índice", "FUN-33: um por vez: o próximo fetch só começa depois que o anterior foi guardado", "FUN-33: com 10 livros guardados, baixa só os 56 que faltam", "FUN-33: com o cache completo, nenhuma requisição", "FUN-33: falha no 30º mantém os 29 guardados e a próxima chamada começa no 30º", "FUN-33: chamada dupla ao mesmo tempo não baixa o mesmo livro duas vezes", "FUN-33: ao terminar, pede navigator.storage.persist()", "FUN-33: persist ausente ou que rejeita não quebra o download", "FUN-33: sem Cache API, não faz requisição nenhuma" (FUN-33)
**Código**: `src/dados/livros.ts` (`baixarFaltantes`)

**Done when**:

- [ ] Antes de codar: casos limite listados no commit (cache vazio, cache completo, falha no livro 30, chamada dupla ao mesmo tempo, `persist` ausente ou negado); lacuna da spec vira pergunta
- [ ] Testes `FUN-33`: cache vazio baixa os 66 em sequência; com 10 guardados baixa só os 56; falha no 30º mantém os 29 e a próxima chamada começa no 30º; chamada dupla não baixa o mesmo livro duas vezes
- [ ] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(dados): guarda em segundo plano os livros que faltam`

---

### T12: Limpar versões antigas dos livros

**What**: `limparAntigos(indice)` apaga do `mj-livros` toda URL que não está no índice atual.
**Estimativa**: 1h
**Risco**: alto
**Domínio**: não
**Criticidade**: crítica
**Where**: `src/dados/livros.ts` (acréscimo)
**Depends on**: T10
**Reuses**: nomes com hash (T2)
**Requirement**: FUN-33, FUN-37
**Status**: rascunhada
**Testes**: `src/dados/limparAntigos.test.ts` › "FUN-37: entradas com hash antigo são apagadas e as do índice atual ficam", "FUN-37: erro de cache.delete numa entrada não interrompe as outras" (FUN-37); "FUN-33: cache vazio não falha", "FUN-33: sem Cache API não falha" (FUN-33)
**Código**: `src/dados/livros.ts` (`limparAntigos`)

**Done when**:

- [ ] Testes: entradas com hash antigo são apagadas; as do índice atual ficam; cache vazio não falha; erro de `cache.delete` não interrompe as outras
- [ ] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(dados): apaga livros de versões antigas do cache`

---

### T13: Service worker do app

**What**: `sw.ts` com precache só do shell (`globPatterns` sem `livros/`), `cleanupOutdatedCaches`, fallback de navegação para `/index.html`, `skipWaiting()` no install e `clients.claim()` no activate, sem recarregar a página; `registrarSW.ts` registra no `load`; `vite.config.ts` com `VitePWA` em `injectManifest`.
**Estimativa**: 2h
**Risco**: alto
**Domínio**: não
**Criticidade**: crítica
**Where**: `src/pwa/sw.ts`
**Depends on**: None
**Reuses**: `ControleEmCasa_LJS/frontend/web/src/pwa/sw.ts:13-14, 20-25, 31-32` (sem push e sem rota de API), `src/pwa/registrarSW.ts:4-6`, `vite.config.ts:34-58`
**Requirement**: FUN-35
**Status**: rascunhada
**Testes**: `e2e/sw.spec.ts` › "FUN-35: depois da primeira visita, o app abre sem rede", "FUN-35: sem rede, outro endereço do app também abre (fallback de navegação)", "FUN-35: o precache tem o app e não tem nenhum livro (livros/)" (FUN-35)
**Código**: `src/pwa/sw.ts`, `src/pwa/registrarSW.ts` (registro próprio no `load`, só no build, sem `virtual:pwa-register`), `vite.config.ts` (`globIgnores: livros/**`)

**Done when**:

- [ ] E2E `FUN-35` (`e2e/sw.spec.ts`, no build): abrir `/` com rede, esperar o SW ativo, ficar sem rede (`context.setOffline`), recarregar e ver o app abrir
- [ ] E2E: a lista do precache não contém `livros/`
- [ ] Gate full passa

**Tests**: e2e
**Gate**: full
**Commit**: `feat(pwa): adiciona service worker com precache do app`

---

### T14: Atualização automática do app

**What**: Versão do build exposta (`define` com `__VERSAO__`, mostrada no Sobre em T27) e garantia de que um SW novo assume sem ação do leitor, valendo no máximo na abertura seguinte, sem recarregar a leitura em curso.
**Estimativa**: 2h
**Risco**: alto
**Domínio**: sim
**Criticidade**: crítica
**Where**: `vite.config.ts`
**Depends on**: T13
**Reuses**: `skipWaiting`/`clients.claim` (T13)
**Requirement**: FUN-37
**Status**: rascunhada
**Testes**: `e2e/atualizacao.spec.ts` › "FUN-37: com o build B publicado, a página aberta não recarrega e a abertura seguinte usa o B" (FUN-37)
**Código**: `vite.config.ts` (`define: __VERSAO__`, meta `versao-app`, `VERSAO_APP`), `src/ambiente.d.ts`, `e2e/apoio/servidor.ts` (servidor estático do e2e que troca a pasta), `.gitignore`/`.prettierignore`/`eslint.config.mjs` (`dist-e2e/`)

**Done when**:

- [ ] Antes de codar: estados listados no commit (SW antigo ativo e página aberta; SW novo instalado; página recarregada; duas abas); lacuna da spec vira pergunta
- [ ] E2E `FUN-37`: com o build A servido e o app aberto, servir o build B no mesmo endereço; a página aberta não recarrega sozinha; na abertura seguinte, `__VERSAO__` é a do B
- [ ] Gate full passa

**Tests**: e2e
**Gate**: full
**Commit**: `feat(pwa): ativa a versão nova na abertura seguinte`

---

### T15: Tokens, fontes e estilo global

**What**: `src/estilo/tokens.css` copiado sem alterar de `.specs/mockup/tokens.css`, `fontes.css` com `@font-face` para Atkinson Hyperlegible (400, 400 itálico, 700) e Fraunces (600) em `.woff2` no próprio site, e `global.css` com o reset do guia.
**Estimativa**: 1,5h
**Risco**: baixo
**Domínio**: não
**Criticidade**: comum
**Where**: `src/estilo/global.css`
**Depends on**: None
**Reuses**: `.specs/mockup/tokens.css` e `guia.html` (CSS dos componentes); molde `ControleEmCasa_LJS/frontend/web/src/estilo/` e `estilo.test.ts`
**Requirement**: FUN-29, FUN-32, FUN-41
**Status**: rascunhada
**Testes**: `src/estilo/estilo.test.ts` › "é a cópia do mockup aprovado, byte a byte", "FUN-32: no tema %s, texto sobre o fundo tem pelo menos 4,5:1", "FUN-32: no tema %s, texto sobre a superfície tem pelo menos 4,5:1", "a conta de contraste reconhece um par ruim (cinza claro sobre branco)" (FUN-32); "FUN-29: o @media (prefers-color-scheme: dark) só vale para :root:not([data-tema])", "FUN-29: o bloco do sistema escuro troca a cor de fundo e o color-scheme", "FUN-29: só o tokens.css consulta prefers-color-scheme" (FUN-29); "FUN-41: nenhum CSS em src/ cita http:// ou https://", "FUN-41: nenhum CSS em src/ usa @import", "FUN-41: cada @font-face aponta para um .woff2 em src/estilo/fontes/ que existe", "declara Atkinson Hyperlegible 400, 400 itálico e 700 e Fraunces 600", "a licença OFL acompanha as fontes" (FUN-41); "traz a base do guia: foco visível, reset de botão e caixa", "não usa cor literal: só var(--...)"
**Código**: `src/estilo/fontes.css`, `src/estilo/global.css`, `src/main.tsx` (importa `fontes.css` e `global.css`)
**Pendência**: os arquivos `src/estilo/fontes/atkinson-hyperlegible-400.woff2`, `atkinson-hyperlegible-400-italico.woff2`, `atkinson-hyperlegible-700.woff2`, `fraunces-600.woff2` e `LICENSE-OFL.txt` não existem no disco nem no mockup (que usa Google Fonts); o rascunho não baixa nada. O `/executar` os obtém (fonte oficial, licença OFL, subconjunto latino) antes do gate; sem eles, os testes de existência ficam vermelhos de propósito.

**Done when**:

- [ ] Teste: `src/estilo/tokens.css` idêntico, byte a byte, a `.specs/mockup/tokens.css`
- [ ] Teste `FUN-32`: lê as cores de `tokens.css` e confirma texto/fundo ≥ 4,5:1 nos três temas e no tema escuro do sistema
- [ ] Teste `FUN-29`: o bloco `@media (prefers-color-scheme: dark)` vale só para `:root:not([data-tema])`
- [ ] Teste `FUN-41`: nenhum CSS em `src/` cita `http://` ou `https://`; as fontes vêm de `src/estilo/fontes/`
- [ ] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(estilo): adiciona tokens, fontes próprias e estilo global`

---

### T16: Botões do guia

**What**: `BotaoPrimario`, `BotaoSecundario`, `BotaoIcone` (rótulo acessível obrigatório no tipo) e `BotaoVoltar`, com as classes e os estados do `guia.html`.
**Estimativa**: 1,5h
**Risco**: baixo
**Domínio**: não
**Criticidade**: comum
**Where**: `src/componentes/base/Botoes.tsx`
**Depends on**: T15
**Reuses**: `.specs/mockup/guia.html` (seção Botões)
**Requirement**: FUN-44
**Status**: rascunhada
**Testes**: `src/componentes/base/Botoes.test.tsx` › "FUN-44: expõe o rótulo recebido como nome acessível", "FUN-44: o ícone é decorativo e não entra no nome", "FUN-44: o rótulo é obrigatório no tipo", "FUN-44: desativado fica disabled e não dispara o clique" (FUN-44); "ativo dispara o clique uma vez", "%s tem a classe do guia e type=\"button\"", "as variantes não compartilham a classe", "BotaoSecundario mostra o ícone antes do texto", "BotaoPrimario desativado não dispara o clique", "BotaoVoltar dispara o clique e a seta é decorativa"
**Código**: `src/componentes/base/Botoes.tsx`, `src/componentes/base/Botoes.module.css`

**Done when**:

- [ ] Testes `FUN-44`: `BotaoIcone` expõe o `aria-label` recebido; desativado fica `disabled` e não dispara o clique; cada variante tem a classe do guia
- [ ] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(componentes): adiciona os botões do guia de estilo`

---

### T17: Aviso

**What**: Componente `Aviso` (neutro e erro, com `role="alert"` no erro) como no `guia.html`.
**Estimativa**: 1h
**Risco**: baixo
**Domínio**: não
**Criticidade**: comum
**Where**: `src/componentes/base/Aviso.tsx`
**Depends on**: T15
**Reuses**: `.specs/mockup/guia.html` (seção Avisos)
**Requirement**: FUN-36
**Status**: rascunhada
**Testes**: `src/componentes/base/Aviso.test.tsx` › "a variante %s mostra a mensagem", "FUN-36: a variante erro tem role=\"alert\" com a mensagem" (FUN-36), "a variante neutra não tem role=\"alert\"", "a variante erro tem a classe de erro do guia; a neutra não", "a mensagem é texto, nunca HTML", "mostra o ícone recebido"
**Código**: `src/componentes/base/Aviso.tsx`, `src/componentes/base/Aviso.module.css`

**Done when**:

- [ ] Testes: a mensagem aparece; a variante erro tem `role="alert"`; a neutra não
- [ ] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(componentes): adiciona o aviso do guia de estilo`

---

### T18: Estados vazio, carregando e erro

**What**: Componente `Estado` com as variantes vazio (título, texto e ação), carregando (esqueleto com `aria-busy`) e erro (texto e ação), como no `guia.html`.
**Estimativa**: 1h
**Risco**: baixo
**Domínio**: não
**Criticidade**: comum
**Where**: `src/componentes/base/Estado.tsx`
**Depends on**: T15
**Reuses**: `.specs/mockup/guia.html` (seção Estados)
**Requirement**: FUN-21, FUN-36
**Status**: rascunhada
**Testes**: `src/componentes/base/Estado.test.tsx` › "a variante %s mostra o título e o texto recebidos", "FUN-21: no vazio, a ação aparece como botão primário e dispara o callback" (FUN-21), "FUN-36: no erro, a ação aparece como botão secundário e dispara o callback" (FUN-36), "sem ação, não há botão", "carregando tem aria-busy=\"true\" e um rótulo para o leitor de tela", "carregando usa o rótulo recebido", "vazio e erro não ficam ocupados", "título e texto são texto, nunca HTML"
**Código**: `src/componentes/base/Estado.tsx`, `src/componentes/base/Estado.module.css`

**Done when**:

- [ ] Testes: cada variante mostra o título e o texto recebidos; a ação dispara o callback; carregando tem `aria-busy="true"`
- [ ] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(componentes): adiciona os estados vazio, carregando e erro`

---

### T19: Reducer do leitor

**What**: Reducer puro com `tela` (`livros`, `capitulos`, `leitor`, `sobre`), `ref`, `livroGrade`, `letra`, `tema` e as ações abrir na inicialização, escolher livro, abrir capítulo, tocar no título, trocar livro, seguinte, anterior, mudar letra e escolher tema.
**Estimativa**: 2h
**Risco**: alto
**Domínio**: não
**Criticidade**: comum
**Where**: `src/estado/leitor.ts`
**Depends on**: None
**Reuses**: `seguinte`/`anterior` (T6), índice (T2)
**Requirement**: FUN-09, FUN-20, FUN-21, FUN-23, FUN-24, FUN-25, FUN-26, FUN-27, FUN-49, FUN-50
**Status**: rascunhada
**Testes**: `src/estado/leitor.test.ts` › "FUN-20: com Ref válida, abre o leitor nela" (FUN-20); "FUN-21: sem Ref, abre a escolha de livro" (FUN-21); "FUN-22: Ref fora do índice (Judas 2) abre a escolha de livro" (FUN-22); "FUN-23: letra inválida na inicialização vira 3; a válida é mantida", "FUN-23: a letra começa em 3" (FUN-23); "o tema gravado é mantido; sem tema, segue o sistema (null)"; "FUN-09: escolher Judas (capítulo único) abre o leitor em Judas 1, sem a grade" (FUN-09); "FUN-07: escolher Salmos abre a grade de Salmos" (FUN-07); "FUN-08: escolher o 27 na grade abre Salmos 27" (FUN-08); "livro fora do índice (0 e 67) não muda o estado", "capítulo fora do intervalo (Salmos 151) não muda o estado"; "FUN-49: tocar no título em Salmos 27 abre a grade de Salmos", "FUN-49: \"Trocar livro\" na grade abre a escolha de livro" (FUN-49); "FUN-50: tocar no título em Filemom 1 (capítulo único) abre a escolha de livro" (FUN-50); "tocar no título sem capítulo aberto não muda o estado"; "FUN-10: seguinte em Salmos 26 abre Salmos 27", "FUN-13: anterior em Mateus 1 abre Malaquias 4", "FUN-15: seguinte em Apocalipse 22 não muda o estado", "FUN-14: anterior em Gênesis 1 não muda o estado" (FUN-10, FUN-13, FUN-14, FUN-15); "FUN-24/FUN-26: +1 vai até 5 e para" (FUN-24, FUN-26); "FUN-25/FUN-27: -1 vai até 1 e para" (FUN-25, FUN-27); "FUN-28: escolher sépia guarda o tema" (FUN-28); "abre o Sobre a partir do leitor e volta ao mesmo capítulo", "não abre o leitor sem capítulo"
**Código**: `src/estado/leitor.ts` (`reduzirLeitor`, `ESTADO_INICIAL`, tipos `Tela`, `EstadoLeitor`, `AcaoLeitor`; limites da letra de `src/dados/preferencias.ts`)

**Done when**:

- [ ] Testes `FUN-20`/`FUN-21`: iniciar com `Ref` válida abre o leitor nela; sem `Ref` abre `livros`
- [ ] Teste `FUN-09`: escolher Judas abre o leitor em Judas 1; escolher Salmos abre a grade de Salmos
- [ ] Testes `FUN-49`/`FUN-50`: tocar no título em Salmos 27 abre a grade de Salmos; em Filemom 1 abre `livros`
- [ ] Testes `FUN-23` a `FUN-27`: letra começa em 3; +1 até 5 e para; -1 até 1 e para
- [ ] Teste: seguinte em Apocalipse 22 e anterior em Gênesis 1 não mudam o estado
- [ ] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(estado): adiciona o reducer de telas e leitura`

---

### T20: Gancho do leitor e efeitos

**What**: `useLeitor()` que inicia pelo que está gravado, carrega o livro da `Ref` (só a última pedida vale), grava a leitura a cada capítulo aberto, aplica `data-tema` e `data-letra` no `<html>`, grava as preferências e dispara `limparAntigos` e `baixarFaltantes` depois que o primeiro capítulo aparece.
**Estimativa**: 2h
**Risco**: alto
**Domínio**: sim
**Criticidade**: comum
**Where**: `src/estado/useLeitor.ts`
**Depends on**: T19
**Reuses**: reducer (T19), preferências (T9), livros (T10, T11, T12)
**Requirement**: FUN-19, FUN-28, FUN-30, FUN-33
**Status**: rascunhada
**Testes**: `src/estado/useLeitor.test.ts` › "FUN-20: com leitura gravada, abre o leitor nela e carrega o livro" (FUN-20); "FUN-21: sem leitura gravada, abre a escolha de livro e não carrega nada" (FUN-21); "FUN-30: letra e tema gravados são reaplicados na abertura" (FUN-30); "FUN-29: sem tema escolhido, o <html> fica sem data-tema e nada é gravado" (FUN-29); "FUN-19: abrir Romanos 8 grava {livro: 45, capitulo: 8}", "FUN-19: ir ao capítulo seguinte grava o novo capítulo" (FUN-19); "FUN-28/FUN-30: escolher sépia põe data-tema=\"sepia\" no <html> e grava" (FUN-28, FUN-30); "FUN-24/FUN-30: aumentar a letra põe data-letra=\"4\" e grava 4", "FUN-25/FUN-30: diminuir a letra põe data-letra=\"2\" e grava 2" (FUN-24, FUN-25, FUN-30); "FUN-33: baixarFaltantes é chamado uma vez, só depois do primeiro capítulo pronto", "FUN-33: sem capítulo aberto (escolha de livro), não baixa nada", "FUN-33: livro não baixado não dispara o download" (FUN-33); "erro em limparAntigos não impede o download"; "trocar de livro antes do anterior carregar mostra só o último pedido", "a resposta atrasada do livro anterior não troca o estado do livro atual"; "FUN-36: sem rede e fora do cache, a carga fica naoBaixado" (FUN-36); "outro capítulo do mesmo livro não carrega o livro de novo", "depois de naoBaixado, abrir o mesmo livro de novo tenta outra vez"
**Código**: `src/estado/useLeitor.ts` (`useLeitor`, tipo `CargaLivro`)
**Lacunas**: erro ao carregar o livro que não é `LivroNaoBaixado` (JSON ilegível, servidor com erro) não tem resultado na spec; o rascunho o trata como não baixado (mensagem do FUN-36 com a escolha de livro). Confirmar antes do verde.

**Done when**:

- [ ] Antes de codar: estados listados no commit (carregando, pronto, livro não baixado; troca rápida de capítulo com o carregamento anterior pendente; download já em curso); lacuna da spec vira pergunta
- [ ] Teste `FUN-19`: abrir Romanos 8 grava `{livro: 45, capitulo: 8}`
- [ ] Testes `FUN-28`/`FUN-30`: escolher sépia põe `data-tema="sepia"` no `<html>` e grava; mudar a letra põe `data-letra` e grava
- [ ] Teste `FUN-33`: `baixarFaltantes` é chamado uma vez, só depois do primeiro capítulo pronto
- [ ] Teste: trocar de capítulo antes do livro anterior carregar mostra só o último pedido
- [ ] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(estado): liga leitura, preferências e download ao leitor`

---

### T21: Versículo

**What**: Componente `Versiculo` com o número em pílula e o texto em segmentos, itálico em `<em>`, sempre como nó de texto.
**Estimativa**: 1h
**Risco**: alto
**Domínio**: não
**Criticidade**: comum
**Where**: `src/componentes/Versiculo.tsx`
**Depends on**: None
**Reuses**: `segmentar` (T5); `.specs/mockup/guia.html` (seção Versículo)
**Requirement**: FUN-01, FUN-02, FUN-04
**Status**: rascunhada
**Testes**: `src/componentes/Versiculo.test.tsx` › "FUN-01: mostra o número e o texto no mesmo item da lista" (FUN-01); "FUN-02: \"[que está]\" de Filemom 1:2 aparece em <em>, sem colchetes", "FUN-02: dois acréscimos no mesmo versículo viram dois <em>", "FUN-02: versículo sem colchete não tem <em>" (FUN-02); "FUN-04: um texto com <img src=x onerror=alert(1)> aparece literal, sem criar elemento img", "FUN-04: HTML dentro do acréscimo também fica literal" (FUN-04)
**Código**: `src/componentes/Versiculo.tsx`, `src/componentes/Versiculo.module.css`

**Done when**:

- [ ] Teste `FUN-01`: mostra o número e o texto na mesma linha da lista
- [ ] Teste `FUN-02`: "[que está]" aparece em `<em>` sem colchetes
- [ ] Teste `FUN-04`: um texto com `<img src=x onerror=alert(1)>` aparece literal, sem criar elemento `img`
- [ ] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(leitor): adiciona o componente de versículo`

---

### T22: Tela do leitor

**What**: `TelaLeitor` com a barra (marca, "Aa", Sobre), o título do capítulo como botão, a lista de versículos, a rolagem ao topo a cada capítulo e os cartões anterior e seguinte (desativados nos limites).
**Estimativa**: 2h
**Risco**: alto
**Domínio**: não
**Criticidade**: comum
**Where**: `src/telas/TelaLeitor.tsx`
**Depends on**: T21
**Reuses**: `.specs/mockup/telas/leitor.html`; botões (T16)
**Requirement**: FUN-01, FUN-05, FUN-10, FUN-11, FUN-12, FUN-13, FUN-14, FUN-15, FUN-49, FUN-50
**Status**: rascunhada
**Testes**: `src/telas/TelaLeitor.test.tsx` › "FUN-01: mostra o título \"Salmos 27\" e os 14 versículos, cada um com o número" (FUN-01); "enquanto o livro carrega, mostra o estado carregando"; "FUN-05: abrir e trocar de capítulo rola ao topo", "FUN-05: renderizar de novo o mesmo capítulo não rola" (FUN-05); "FUN-10/FUN-12: em Salmos 27, os cartões mostram Salmos 26 e Salmos 28 e disparam anterior e seguinte" (FUN-10, FUN-12); "FUN-11: em Malaquias 4, o seguinte mostra Mateus 1" (FUN-11); "FUN-13: em Mateus 1, o anterior mostra Malaquias 4" (FUN-13); "FUN-14: em Gênesis 1, o anterior fica desativado e não dispara" (FUN-14); "FUN-15: em Apocalipse 22, o seguinte fica desativado e não dispara" (FUN-15); "FUN-49: tocar no título dispara a ação do título" (FUN-49); "FUN-50: em livro de capítulo único, o título oferece outro livro" (FUN-50); "FUN-44: os botões de ícone da barra têm rótulo em português" (FUN-44)
**Código**: `src/telas/TelaLeitor.tsx`, `src/telas/TelaLeitor.module.css`, `src/telas/comum.module.css` (barra do topo), `src/componentes/icones.tsx` (ícones do mockup)

**Done when**:

- [ ] Teste `FUN-01`: título "Salmos 27" e os 14 versículos, cada um com o número
- [ ] Teste `FUN-05`: trocar de capítulo chama a rolagem ao topo
- [ ] Testes `FUN-10` a `FUN-13`: os cartões mostram "Salmos 26" e "Salmos 28" e disparam anterior e seguinte; em Malaquias 4 o seguinte mostra "Mateus 1"
- [ ] Testes `FUN-14`/`FUN-15`: em Gênesis 1 o anterior fica desativado; em Apocalipse 22, o seguinte
- [ ] Teste `FUN-49`: tocar no título dispara a ação do título
- [ ] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(leitor): adiciona a tela de leitura do capítulo`

---

### T23: Gesto de deslize no leitor

**What**: Pointer Events na área do texto (`touch-action: pan-y`) que medem `dx` e `dy` e chamam seguinte ou anterior conforme `classificarDeslize`.
**Estimativa**: 1h
**Risco**: alto
**Domínio**: não
**Criticidade**: comum
**Where**: `src/telas/TelaLeitor.tsx` (acréscimo)
**Depends on**: T22
**Reuses**: `classificarDeslize` (T8)
**Requirement**: FUN-16, FUN-17, FUN-18
**Status**: rascunhada
**Testes**: `src/telas/TelaLeitor.test.tsx` › "FUN-16: deslizar -100/10 (direita para a esquerda) chama seguinte" (FUN-16); "FUN-17: deslizar 100/10 (esquerda para a direita) chama anterior" (FUN-17); "FUN-18: deslize %i/%i não troca de capítulo" (FUN-18); "FUN-15/FUN-16: em Apocalipse 22, o deslize para seguinte não faz nada" (FUN-15, FUN-16); "FUN-14/FUN-17: em Gênesis 1, o deslize para anterior não faz nada" (FUN-14, FUN-17); "gesto cancelado pelo navegador não troca de capítulo", "pointerUp de outro ponteiro não conta como deslize"
**Código**: `src/telas/TelaLeitor.tsx` (Pointer Events na área do texto)

**Done when**:

- [ ] Testes `FUN-16` a `FUN-18` (eventos de ponteiro simulados): -100/10 chama seguinte; 100/10 chama anterior; 40/0 e -100/120 não chamam nada; em Apocalipse 22 o deslize para seguinte não faz nada
- [ ] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(leitor): troca de capítulo pelo deslize lateral`

---

### T24: Painel de aparência

**What**: `PainelAparencia` aberto pelo "Aa": controle de letra (−, "Letra N de 5", +, com os limites desativados) e seletor de tema Claro, Escuro e Sépia com `aria-pressed`.
**Estimativa**: 1,5h
**Risco**: baixo
**Domínio**: não
**Criticidade**: comum
**Where**: `src/componentes/PainelAparencia.tsx`
**Depends on**: T22
**Reuses**: `.specs/mockup/guia.html` (Painel de aparência); botões (T16)
**Requirement**: FUN-24, FUN-25, FUN-26, FUN-27, FUN-28
**Status**: rascunhada
**Testes**: `src/componentes/PainelAparencia.test.tsx` › "FUN-24: + dispara aumentar a letra" (FUN-24); "FUN-25: − dispara diminuir a letra" (FUN-25); "FUN-24/FUN-25: o texto mostra \"Letra %i de 5\"" (FUN-24, FUN-25); "FUN-26: no 5, o + fica desativado e não dispara; o − continua ativo" (FUN-26); "FUN-27: no 1, o − fica desativado e não dispara; o + continua ativo" (FUN-27); "nos níveis do meio, os dois ficam ativos"; "FUN-28: escolher Sépia dispara a ação com \"sepia\"", "FUN-28: com sépia escolhido, aria-pressed=\"true\" só nele" (FUN-28); "FUN-29: sem tema escolhido (o do sistema), nenhuma opção fica marcada" (FUN-29); "fechado, o painel fica escondido", "aberto, o painel aparece com o nome \"Aparência\""; `src/telas/TelaLeitor.test.tsx` › "o \"Aa\" alterna aria-expanded e mostra ou esconde o painel", "FUN-24/FUN-28: o painel aberto repassa a letra e o tema ao leitor" (FUN-24, FUN-28)
**Código**: `src/componentes/PainelAparencia.tsx`, `src/componentes/PainelAparencia.module.css`, `src/telas/TelaLeitor.tsx` (painel no "Aa"; props `letra`, `tema`, `aoMudarLetra`, `aoEscolherTema`)

**Done when**:

- [ ] Testes `FUN-24`/`FUN-25`: + e − disparam as ações e o texto mostra o nível
- [ ] Testes `FUN-26`/`FUN-27`: no 5 o + fica desativado; no 1, o −
- [ ] Teste `FUN-28`: escolher Sépia dispara a ação e marca `aria-pressed="true"` só nele
- [ ] Teste: o "Aa" alterna `aria-expanded` e mostra ou esconde o painel
- [ ] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(leitor): adiciona o painel de letra e tema`

---

### T25: Tela de escolha de livro

**What**: `TelaLivros` com os 66 livros em duas listas, Antigo (39) e Novo Testamento (27), com o número de capítulos e o livro atual marcado.
**Estimativa**: 1h
**Risco**: baixo
**Domínio**: não
**Criticidade**: comum
**Where**: `src/telas/TelaLivros.tsx`
**Depends on**: None
**Reuses**: `.specs/mockup/telas/livros.html`; índice (T2)
**Requirement**: FUN-06
**Status**: rascunhada
**Testes**: `src/telas/TelaLivros.test.tsx` › "FUN-06: duas seções, com 39 livros no Antigo e 27 no Novo Testamento", "FUN-06: os livros seguem a ordem do índice (Gênesis primeiro, Malaquias último do AT, Apocalipse último do NT)", "FUN-06: tocar num livro dispara a escolha com o número dele" (FUN-06); "cada livro mostra o número de capítulos", "o livro do capítulo aberto fica marcado; os outros não", "com capítulo aberto, a barra volta à leitura; sem ele, mostra a marca", "na primeira visita (FUN-21), a barra mostra a marca e o Sobre" (FUN-21)
**Código**: `src/telas/TelaLivros.tsx`, `src/telas/Escolha.module.css`

**Done when**:

- [ ] Testes `FUN-06`: duas seções com 39 e 27 botões, na ordem do índice (Gênesis primeiro, Malaquias último do AT, Apocalipse último do NT); tocar num livro dispara a escolha com o número dele
- [ ] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(leitor): adiciona a escolha de livro`

---

### T26: Tela da grade de capítulos

**What**: `TelaCapitulos` com o nome do livro, "Trocar livro", "Voltar à leitura" e a grade de 1 até o último capítulo, com o atual marcado.
**Estimativa**: 1h
**Risco**: baixo
**Domínio**: não
**Criticidade**: comum
**Where**: `src/telas/TelaCapitulos.tsx`
**Depends on**: None
**Reuses**: `.specs/mockup/telas/capitulos.html`; botões (T16)
**Requirement**: FUN-07, FUN-08, FUN-09, FUN-49
**Status**: rascunhada
**Testes**: `src/telas/TelaCapitulos.test.tsx` › "FUN-07: Salmos mostra 150 botões, de 1 a 150, na ordem", "FUN-07: Romanos mostra 16 botões" (FUN-07); "FUN-08: tocar no 27 dispara abrir Salmos 27" (FUN-08); "FUN-49: \"Trocar livro\" dispara a ação de trocar livro" (FUN-49); "o capítulo aberto fica marcado quando é deste livro", "capítulo aberto de outro livro não marca nada na grade", "\"Voltar à leitura\" dispara a volta quando há capítulo aberto", "sem capítulo aberto, não há \"Voltar à leitura\"". FUN-09 (capítulo único sem grade) fica no reducer: `src/estado/leitor.test.ts` › "FUN-09: escolher Judas (capítulo único) abre o leitor em Judas 1, sem a grade"
**Código**: `src/telas/TelaCapitulos.tsx`, `src/telas/TelaCapitulos.module.css`

**Done when**:

- [ ] Teste `FUN-07`: Salmos mostra 150 botões, de 1 a 150
- [ ] Teste `FUN-08`: tocar no 27 dispara abrir Salmos 27
- [ ] Teste `FUN-49`: "Trocar livro" dispara a ação de trocar livro
- [ ] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(leitor): adiciona a grade de capítulos`

---

### T27: Tela Sobre

**What**: `TelaSobre` com o crédito completo da Bíblia Livre, a explicação do itálico, a privacidade e a versão do app.
**Estimativa**: 1h
**Risco**: baixo
**Domínio**: não
**Criticidade**: comum
**Where**: `src/telas/TelaSobre.tsx`
**Depends on**: None
**Reuses**: `.biblia/README.md` (créditos); classe `texto-sobre` do guia
**Requirement**: FUN-38, FUN-39, FUN-40
**Status**: rascunhada
**Testes**: `src/telas/TelaSobre.test.tsx` › "FUN-38: nome e sigla, autores e data da versão", "FUN-38: link da licença Creative Commons Atribuição 4.0 Brasil", "FUN-38: link da fonte", "FUN-38: diz que só o formato foi convertido e que os autores não endossam o app" (FUN-38); "FUN-41: os links abrem sem passar a página de origem" (FUN-41); "FUN-39: explica que o itálico marca palavras acrescentadas pelos tradutores" (FUN-39); "FUN-40: diz que não há conta e que tudo fica no aparelho" (FUN-40); "FUN-37: mostra a versão do app" (FUN-37); "o botão de voltar mostra o destino e dispara a volta"
**Código**: `src/telas/TelaSobre.tsx`, `src/telas/TelaSobre.module.css`

**Done when**:

- [ ] Teste `FUN-38`: Bíblia Livre (BLIVRE), Diego Santos, Mario Sérgio e Marco Teles, fevereiro de 2018, link da licença CC BY 4.0 Brasil, link da fonte, conversão só de formato e não endosso
- [ ] Teste `FUN-39`: explica que o itálico marca palavras acrescentadas pelos tradutores
- [ ] Teste `FUN-40`: diz que não há conta e que tudo fica no aparelho
- [ ] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(leitor): adiciona a tela sobre com créditos e privacidade`

---

### T28: Aviso de livro não baixado no leitor

**What**: Quando o carregamento falha com `LivroNaoBaixado`, o leitor mostra o estado de erro com "Este livro ainda não foi baixado. Conecte-se à internet para lê-lo." e a ação "Escolher outro livro".
**Estimativa**: 45 min
**Risco**: alto
**Domínio**: não
**Criticidade**: comum
**Where**: `src/telas/TelaLeitor.tsx` (acréscimo)
**Depends on**: T22
**Reuses**: `Estado` (T18), `LivroNaoBaixado` (T10)
**Requirement**: FUN-36

**Done when**:

- [ ] Teste `FUN-36`: com o estado "não baixado", a mensagem exata aparece e a ação abre a escolha de livro
- [ ] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(leitor): avisa quando o livro ainda não foi baixado`

---

### T29: Detecção de Safari do iPhone e do modo instalado

**What**: `ehSafariIOS(ua, plataforma, toques)` (inclui o iPad que se apresenta como Mac) e `estaInstalado()` (`display-mode: standalone` ou `navigator.standalone`).
**Estimativa**: 1h
**Risco**: alto
**Domínio**: não
**Criticidade**: comum
**Where**: `src/pwa/instalacao.ts`
**Depends on**: None
**Reuses**: molde `ControleEmCasa_LJS/frontend/web/src/pwa/instalacao.ts:44, 98`
**Requirement**: FUN-46, FUN-48

**Done when**:

- [ ] Testes `FUN-46`: Safari do iPhone e do iPad (incluindo `MacIntel` com toque) = sim; Chrome do iPhone (`CriOS`), Firefox do iPhone (`FxiOS`), Android e Mac sem toque = não
- [ ] Testes `FUN-48`: `standalone` por `matchMedia` ou por `navigator.standalone` = instalado
- [ ] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(pwa): detecta o safari do iphone e o modo instalado`

---

### T30: Convite de instalação

**What**: `ConviteInstalacao` mostrado só no Safari do iPhone e do iPad, fora do modo instalado e sem dispensa gravada, com a instrução e o botão "Dispensar convite".
**Estimativa**: 1h
**Risco**: baixo
**Domínio**: não
**Criticidade**: comum
**Where**: `src/componentes/ConviteInstalacao.tsx`
**Depends on**: T29
**Reuses**: `.specs/mockup/guia.html` (Avisos); preferências (T9)
**Requirement**: FUN-46, FUN-47, FUN-48

**Done when**:

- [ ] Teste `FUN-46`: no Safari do iPhone, sem dispensa, mostra "Toque em Compartilhar e depois em Adicionar à Tela de Início"
- [ ] Teste `FUN-47`: dispensar esconde o convite e grava; montado de novo, não aparece
- [ ] Teste `FUN-48`: instalado, não aparece
- [ ] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(pwa): adiciona o convite de instalação no iphone`

---

### T31: Composição do app

**What**: `App` que usa `useLeitor` e mostra a tela do estado (livros, capítulos, leitor ou Sobre), o painel e o convite, com o vazio da primeira visita e o carregando do capítulo.
**Estimativa**: 1,5h
**Risco**: baixo
**Domínio**: não
**Criticidade**: comum
**Where**: `src/App.tsx`
**Depends on**: T30
**Reuses**: telas (T22 a T28), gancho (T20)
**Requirement**: FUN-20, FUN-21

**Done when**:

- [ ] Teste `FUN-21`: sem leitura gravada, abre a escolha de livro
- [ ] Teste `FUN-20`: com Romanos 8 gravado e o livro no dublê de cache, abre "Romanos 8"
- [ ] Teste: do leitor, "Sobre" abre a tela Sobre e voltar retorna ao capítulo
- [ ] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(app): compõe as telas do leitor`

---

### T32: Manifesto e ícones

**What**: Manifesto no `VitePWA` com nome e nome curto "MinhaJornada", `display: standalone`, `start_url` e `scope` `/`, cores dos tokens e ícones de 192, 512 e maskable em `public/icones/`, gerados de um SVG próprio.
**Estimativa**: 1h
**Risco**: baixo
**Domínio**: não
**Criticidade**: comum
**Where**: `public/icones/icone.svg`
**Depends on**: None
**Reuses**: `ControleEmCasa_LJS/frontend/web/vite.config.ts:41-55` (manifesto e `lerToken`)
**Requirement**: FUN-45

**Done when**:

- [ ] E2E `FUN-45` (no build): o `manifest.webmanifest` servido tem o nome, `standalone` e os ícones 192 e 512, e cada ícone responde 200 com o tamanho declarado
- [ ] Gate full passa

**Tests**: e2e
**Gate**: full
**Commit**: `feat(pwa): adiciona manifesto e ícones do app`

---

### T33: Jornada de leitura e navegação

**What**: E2E no build da navegação inteira pela interface.
**Estimativa**: 2h
**Risco**: baixo
**Domínio**: não
**Criticidade**: comum
**Where**: `e2e/leitura.spec.ts`
**Depends on**: None
**Reuses**: J-01 e J-02 de `.specs/projeto/jornadas.md`
**Requirement**: FUN-01, FUN-02, FUN-06, FUN-07, FUN-09, FUN-11, FUN-14, FUN-15, FUN-16, FUN-20, FUN-49

**Done when**:

- [ ] E2E: primeira visita abre a escolha de livro; Filemom abre Filemom 1 direto com 25 versículos e "que está" em itálico
- [ ] E2E: Malaquias 4 → seguinte → Mateus 1; tocar no título mostra a grade de Mateus; "Trocar livro" → Salmos → grade de 1 a 150 → 119 mostra 176 versículos
- [ ] E2E: em Gênesis 1 o anterior está desativado; em Apocalipse 22, o seguinte; deslize de 100 px em Salmos 27 abre Salmos 28 (toque emulado)
- [ ] E2E `FUN-20`: abrir Romanos 8, recarregar e ver Romanos 8
- [ ] Gate full passa

**Tests**: e2e
**Gate**: full
**Commit**: `test(e2e): cobre a jornada de leitura e navegação`

---

### T34: Jornada offline e privacidade

**What**: E2E no build do download em segundo plano, da leitura sem rede, do aviso de livro não baixado e da ausência de requisições a outros domínios e de cookies.
**Estimativa**: 2h
**Risco**: alto
**Domínio**: não
**Criticidade**: comum
**Where**: `e2e/offline.spec.ts`
**Depends on**: None
**Reuses**: J-03 de `.specs/projeto/jornadas.md`
**Requirement**: FUN-33, FUN-34, FUN-35, FUN-36, FUN-41

**Done when**:

- [ ] E2E `FUN-34`: com Romanos 8 gravado, até o primeiro capítulo aparecer só `livros/45.*.json` foi pedido entre os livros
- [ ] E2E `FUN-33`/`FUN-35`: esperar o `mj-livros` ter 66 entradas, ficar sem rede, recarregar e ler Apocalipse 22
- [ ] E2E `FUN-36`: com a rede bloqueada para `livros/66.*` antes do download, escolher Apocalipse sem rede mostra a mensagem exata e o seletor continua disponível
- [ ] E2E `FUN-41`: navegando por 5 capítulos, nenhuma requisição sai de `127.0.0.1` e `context.cookies()` é vazio
- [ ] Gate full passa

**Tests**: e2e
**Gate**: full
**Commit**: `test(e2e): cobre a leitura sem internet e a privacidade`

---

### T35: Jornada de aparência, telas e acessibilidade

**What**: E2E no build de tema, letra, largura de tela e rótulos acessíveis.
**Estimativa**: 2h
**Risco**: baixo
**Domínio**: não
**Criticidade**: comum
**Where**: `e2e/aparencia.spec.ts`
**Depends on**: None
**Reuses**: J-04 de `.specs/projeto/jornadas.md`
**Requirement**: FUN-29, FUN-30, FUN-43, FUN-44

**Done when**:

- [ ] E2E `FUN-29`: com `colorScheme: 'dark'` e nada gravado, o fundo é o `--cor-fundo` escuro; com `light`, o claro
- [ ] E2E `FUN-30`: escolher sépia e letra 5, recarregar e ver sépia, letra 5 e "Aumentar letra" desativado
- [ ] E2E `FUN-43`: em 320 px e 1920 px de largura, no leitor (Salmos 119, letra 5), nas grades e no Sobre, `scrollWidth <= clientWidth`
- [ ] E2E `FUN-44`: todo `button` sem texto visível tem `aria-label` não vazio em todas as telas
- [ ] Gate full passa

**Tests**: e2e
**Gate**: full
**Commit**: `test(e2e): cobre aparência, larguras de tela e rótulos`

---

## Requirement Coverage

| Requisito | Tarefas |
| --------- | ------- |
| FUN-01 | T21, T22, T33 |
| FUN-02 | T5, T21, T33 |
| FUN-03 | T1, T2 |
| FUN-04 | T4, T21 |
| FUN-05 | T22 |
| FUN-06 | T2, T25, T33 |
| FUN-07, FUN-08 | T26, T33 |
| FUN-09 | T19, T26, T33 |
| FUN-10 a FUN-13 | T6, T22, T33 |
| FUN-14, FUN-15 | T6, T22, T33 |
| FUN-16 a FUN-18 | T8, T23, T33 |
| FUN-19 | T9, T20 |
| FUN-20, FUN-21 | T19, T31, T33 |
| FUN-22 | T7, T9 |
| FUN-23 | T9, T19 |
| FUN-24 a FUN-27 | T19, T24 |
| FUN-28 | T20, T24 |
| FUN-29 | T15, T35 |
| FUN-30 | T9, T20, T35 |
| FUN-31 | T9 |
| FUN-32 | T15 |
| FUN-33 | T11, T12, T20, T34 |
| FUN-34 | T10, T34 |
| FUN-35 | T13, T34 |
| FUN-36 | T10, T17, T18, T28, T34 |
| FUN-37 | T12, T14 |
| FUN-38 a FUN-40 | T27 |
| FUN-41 | T4, T15, T34 |
| FUN-42 | T3 |
| FUN-43 | T35 |
| FUN-44 | T16, T35 |
| FUN-45 | T32 |
| FUN-46 a FUN-48 | T9 (47), T29, T30 |
| FUN-49, FUN-50 | T19, T22, T26, T33 |
