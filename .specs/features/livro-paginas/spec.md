# Páginas do livro: especificação

**Data**: 2026-11-19 · **Origem**: pedido do dono em 2026-11-18, com print do modo livro em tela larga (Gênesis 20, páginas 81 e 82), e as decisões de 2026-11-19 · **Roteiro**: feature 5 (AD-019) · **Requisitos**: FUN-128 a FUN-136

## Problem Statement

No modo livro, o capítulo seguinte começa logo depois do fim do anterior, no meio da página: no print, o capítulo 21 de Gênesis começa no meio da página 82. Em tela larga, as duas páginas encostam uma na outra (vão 0, `src/livro/livro.module.css:262`) e parecem uma área só. O dono quer a leitura parecida com a de um livro de verdade.

## Goals

- [ ] Todo capítulo, do 2 em diante, começa no topo de uma página, em qualquer tela.
- [ ] Em tela larga, as duas páginas aparecem como áreas separadas, com vão e linha no meio.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Resumo, estudo e editor na página da direita | Features 6, 7 e 10 do roteiro (AD-019) |
| Modo rolagem | O pedido é só do modo livro |
| Capítulo sempre na página da esquerda | O dono escolheu "na próxima página, qualquer lado" (2026-11-19) |
| Sombra, textura ou curvatura de lombada | O pedido é separar as páginas; enfeite fica para outro pedido |
| Mudar a abertura de livro (FUN-76) | O livro já começa no topo de uma página nova |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Lado em que o capítulo começa em tela larga | Na página seguinte ao fim do anterior, esquerda ou direita | Decisão do dono em 2026-11-19: sobra no máximo o resto de uma página em branco | y |
| Regra no celular e na tela estreita | Vale em todo o modo livro | Decisão do dono em 2026-11-19 | y |
| Forma da separação | Vão de 32 px (`--esp-8`) com uma linha de 1 px no centro, na cor `--cor-borda` do tema | Decisão do dono em 2026-11-19 (afastar e pôr linha fina); os valores vêm dos tokens existentes e são conferidos no mockup | y |
| Capítulo 1 | Fica na mesma página do nome do livro, logo abaixo dele | FUN-76 já abre o livro numa página nova; pular de novo deixaria a página do nome vazia | y |
| Capa e plano pago (FUN-89) | Recebem o mesmo vão e a mesma linha | O par de páginas fica igual em todo o livro | y |
| Cantos das páginas | Em tela larga, as duas páginas têm os quatro cantos arredondados (`--raio-m`); hoje só os de fora (`livro.module.css:67,71`) | Com o vão, cada página é uma área separada; mockup dispensado pelo dono em 2026-11-19 | y |
| Posição gravada (FUN-85, FUN-86) | Continua por livro, capítulo, versículo e fatia; a página muda, o lugar não | A paginação nova muda os números de página, não o versículo gravado | y |

**Open questions:** none - all resolved or logged above (required before the spec is confirmed).

---

## User Stories

### P1: Capítulo em página nova ⭐ MVP

**User Story**: Como leitor no modo livro, quero que cada capítulo comece numa página nova, para ler como num livro impresso.

**Why P1**: É o pedido principal do dono (print de Gênesis 20 e 21).

**Acceptance Criteria** (each line is one EARS pattern):

1. The sistema SHALL começar cada capítulo, do 2 em diante, no topo de uma página do modo livro, com o número do capítulo como primeiro conteúdo da página, em tela larga e em tela estreita. (FUN-128)
2. The sistema SHALL deixar em branco o resto da última página de um capítulo, sem trazer para ela versículo do capítulo seguinte. (FUN-129)
3. The sistema SHALL mostrar o capítulo 1 na mesma página do nome do livro, logo abaixo dele (FUN-76). (FUN-130)
4. WHEN um capítulo termina na página da esquerda em tela larga THEN o sistema SHALL começar o capítulo seguinte na página da direita do mesmo par. (FUN-131)
5. WHILE um capítulo ocupa mais de uma página o sistema SHALL encher as páginas dele com versículos inteiros na ordem, como em FUN-75, e só dividir um versículo quando ele sozinho não cabe numa página. (FUN-132)

**Independent Test**: Abrir Gênesis 20 no modo livro, em 1920 × 1080 e em 390 × 844, e avançar até o fim do capítulo: a página seguinte começa com o número 21 no topo, e a última página do 20 não tem versículo do 21.

---

### P1: Páginas separadas em tela larga ⭐ MVP

**User Story**: Como leitor no PC, quero ver as duas páginas como áreas separadas, para que pareçam as duas páginas de um livro aberto.

**Why P1**: É o segundo pedido do dono, do mesmo print.

**Acceptance Criteria**:

1. WHILE o modo livro está na tela larga (FUN-73) o sistema SHALL mostrar um vão de 32 px entre a página da esquerda e a da direita. (FUN-133)
2. WHILE o modo livro está na tela larga o sistema SHALL mostrar no centro do vão uma linha vertical de 1 px na cor `--cor-borda` do tema atual, com a altura das páginas. (FUN-134)
3. WHILE o modo livro está na tela larga o sistema SHALL mostrar as duas páginas com a mesma largura, ocupando a largura da tela menos as duas margens laterais e o vão (FUN-96), sem rolagem horizontal de 900 × 600 a 1920 × 1200. (FUN-135)
4. WHILE a tela não é larga o sistema SHALL mostrar uma página só, sem vão e sem linha (FUN-74, FUN-102). (FUN-136)

**Independent Test**: Em 1280 × 800 e 1920 × 1080, medir no navegador a distância entre as duas páginas (32 px) e a linha no meio (1 px, cor da borda), nos temas claro, escuro e sépia; em 390 × 844, conferir que há uma página só.

---

## Edge Cases

- WHEN o tamanho da letra, o tema ou o tamanho da tela muda THEN o sistema SHALL repaginar com a regra de FUN-128 e mostrar a página do primeiro versículo que estava visível (coberto por FUN-86). **Fora desta feature a troca de letra** (AD-021): o defeito de repaginação é do bug `letra-livro-sem-repaginar`; a feature prova só que o capítulo continua no topo da página mostrada.
- WHEN o leitor escolhe um capítulo pela grade (FUN-83) THEN o sistema SHALL mostrar a página que começa com esse capítulo (coberto por FUN-83 com FUN-128).
- IF o capítulo tem um versículo só ou é curto THEN o sistema SHALL mostrá-lo sozinho na página, com o resto em branco (coberto por FUN-129).
- IF um versículo sozinho não cabe numa página (ex.: letra no maior tamanho) THEN o sistema SHALL dividi-lo como hoje, começando a primeira fatia no topo da página nova (coberto por FUN-128 e FUN-132).
- WHILE a capa está aberta em tela larga o sistema SHALL mostrar o mesmo vão e a mesma linha entre as duas páginas (coberto por FUN-133 e FUN-134; premissa registrada acima).

Varredura de requisitos implícitos (Medium): validação de entrada coberta pelas alturas inválidas que `paginar` já trata (`src/livro/paginacao.ts:58-66`); integridade de estado coberta por FUN-86; as demais dimensões são N/A neste escopo, porque não há servidor, conta, escrita fora do aparelho nem dependência externa.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| FUN-128 | P1: Capítulo em página nova | Tasks | In Tasks |
| FUN-129 | P1: Capítulo em página nova | Tasks | In Tasks |
| FUN-130 | P1: Capítulo em página nova | Tasks | In Tasks |
| FUN-131 | P1: Capítulo em página nova | Tasks | In Tasks |
| FUN-132 | P1: Capítulo em página nova | Tasks | In Tasks |
| FUN-133 | P1: Páginas separadas em tela larga | Tasks | In Tasks |
| FUN-134 | P1: Páginas separadas em tela larga | Tasks | In Tasks |
| FUN-135 | P1: Páginas separadas em tela larga | Tasks | In Tasks |
| FUN-136 | P1: Páginas separadas em tela larga | Tasks | In Tasks |

**ID format:** `FUN-NNN`, continuando a numeração do projeto.

**Coverage:** 9 total, 9 mapped to tasks (T1 a T7), 0 unmapped

---

## Success Criteria

- [ ] Em Gênesis, nenhum capítulo do 2 ao 50 começa no meio de uma página, em 1920 × 1080 e em 390 × 844.
- [ ] Em tela larga, o vão de 32 px e a linha de 1 px aparecem nos três temas.
