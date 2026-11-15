# Verificação do leitor, rodada 5 (retrabalho R4, T49 / A-14 e T50 / A-15)

- **Branch**: `feature/leitor` @ `bac3c35` (árvore `f6000402…`). **Diff**: `241d77c..HEAD`: só `test/arquivos/deploy.test.ts` (+37, -20) e `tasks.md`. Dois commits de código (`019006e`, `dd32513`), ambos só de teste.
- **Veredito**: **A-14 e A-15 fechados**; 1 achado novo (A-16, comum). Com achado aberto o veredito formal é **FAIL ❌** (a sessão pode rebaixar o A-16 a informativo e integrar).

## A-14 e A-15: fechados

| Achado | Prova (`arquivo:linha` e asserção) | Sensor |
|---|---|---|
| A-14 (`-i` do `grep -qi`, FUN-42) | `deploy.test.ts:175-179` roda a fumaça com `CAIXA_TITULO` (stub `:143-145` capitaliza os 3 cabeçalhos) e exige `status` 0 e sem `::error` | M32 (`grep -qi`→`-q`, `deploy.yml:127`): **morta**, 1 falha (o próprio caso A-14); com 34/34 na cópia limpa |
| A-15 (diretiva isolada e mensagem) | `:195-203`: `REMOVER_DIRETIVA` tira só a diretiva da linha da CSP (stub `:139-141`); exige `status !== 0`, `stdout` com `::error title=Fumaça falhou::${caminho} não traz o cabeçalho esperado: ` e com a diretiva | M26 (sem `object-src`), M27 (sem `frame-ancestors`) e M25 (sem `default-src`): **mortas, 4 falhas cada** = 3 casos **nomeados com a diretiva** (um por caminho; ex. `A-15: … sem a diretiva object-src 'none' da CSP em /sw.js …`) + o textual A-05 |

## Nenhum ramo coberto deixou de ser coberto (reescrita aprovada pelo dono)

Antes, 10 casos de omissão; agora 9 de cabeçalho inteiro (`:182-190`: CSP, `nosniff`, `referrer-policy` × `/`, `/sw.js`, livro) + 9 de diretiva (`default-src`, `object-src`, `frame-ancestors` × 3 caminhos). Mapa: CSP `default-src` ×3, `nosniff` ×3 e `referrer` em `/` e livro → cabeçalho inteiro; `object-src` em `/sw.js` e `frame-ancestors` no livro → diretiva (agora nos 3 caminhos); `referrer` em `/sw.js` é ramo novo. A asserção ficou mais forte (de `::error` qualquer para caminho + cabeçalho/diretiva). Nada enfraquecido: **sem lacuna de aprovação**. Nenhum `it` removido sem substituto (34 testes = 25 − 10 + 1 + 9 + 9).

## Sensor (cópia isolada, `node_modules` por junção, só `deploy.test.ts`; limpa = 34/34)

23 mutações no passo da fumaça (`deploy.yml:120-133`): **20 mortas, 3 vivas equivalentes (N4, N13, N19), 2 vivas reais (N20, N21)** (M25, M26, M27, M32 incluídos).
- Mortas: `exit 1`→`true`; sem o `echo ::error`; mensagem sem caminho (12 falhas) ou sem o `exigido` (18); `-fsS`→`-sS` no laço (1); sem `/sw.js` (9) ou sem o livro (7); `if !`→`if` (20); `grep -qiF` (18); `object-src 'none'`→`'self'` (19); sem `nosniff` ou sem `same-origin` no regex (1 e 1, textuais); `nosniff` sem `^` (3); `same-origin`→`same` (1); `default-src` sem `^` (3); `default-src` aceita `*` (4); `-D -`→`-i` (19) e `-D -` com URL fixa em `/` (14).
- Vivas equivalentes: **N4** ordem dos exigidos (só muda qual cabeçalho a mensagem cita quando falta mais de um; os casos omitem um por vez); **N13** `: *nosniff`→`: nosniff` (o stub e o Cloudflare usam um espaço); **N19** `${cabecalhos:-x}` (vazio não casa de nenhum jeito).
- Vivas reais: **N20** regex do `referrer-policy` aceita também `no-referrer`; **N21** o do `nosniff` aceita também `sniff` (alternativas `\|` no `grep`). Nenhum teste faz o stub devolver o cabeçalho com **valor errado**; só o textual `toContain` do A-05 vê o texto do regex. Ver A-16.
- Cópia e junção removidas, `git worktree prune`; `git status --porcelain` da árvore real vazio antes e depois; sem `fumaca-*` órfão em `%TEMP%`.

## Gate (árvore `f6000402…`, diferente da registrada em `Gate:`; rodado agora)

`pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm e2e` = **verde**: 27 arquivos e **366** testes (357 + 9), **27** e2e. Sem regressão.

## Qualidade do stub novo

- **`REMOVER_DIRETIVA`** (`${tudo/"$REMOVER_DIRETIVA"/}`): o pattern entre aspas é literal (não glob), tira só a primeira ocorrência e deixa `content-security-policy: ; object-src …`; correto para os 3 casos. Só age quando `OMITIR_EM` é dado (os 9 casos o passam); sem `OMITIR_EM` não remove e o caso falharia alto, nunca passaria em silêncio. O `toContain(diretiva)` não passa por motivo errado: a mensagem cita o `exigido` que falhou, e N22 mostra que mudar o `exigido` quebra os 3 casos.
- **`CAIXA_TITULO`**: capitaliza os 3 cabeçalhos; M32 morre, logo o stub é de fato exercido. Cobre HTTP/1.1; não cobre caixa mista arbitrária (equivalente para `grep -i`).
- **Linux/CI**: container `node:24` (Debian, bash 5.2, `pnpm install --frozen-lockfile --ignore-scripts`): **34/34**. Windows: 34/34, ~15 s o arquivo (um `bash` por caso, 38 execuções).
- **Checagens de processo**: (a) `testes.json` (`pnpm typecheck && pnpm test`) cobre o pacote único, e2e à parte; OK. (b) `typecheck` verde em `019006e` (primeiro commit de código, cópia isolada) e no HEAD (gate); `dd32513` é o último e só mexe em teste. (c) nenhum teste existente enfraquecido (ver acima). (d) IDs `FUN-42`/`A-14`/`A-15` batem com `spec.md:188`. (e) sem banco `teste_*` nem diretório temporário órfão. (f) não se aplica. (g) sem divergência spec × design. (h) `tasks.md` registra `Gate: … @ b68bc6f5… = verde` para a árvore pós-código; a árvore atual (`f6000402…`) inclui o commit de fechamento, por isso o gate foi repetido. Nota: o `Gate:` da T48 cita `pnpm vitest run`, que falha neste ambiente; sem efeito.

## Achados

| ID | `arquivo:linha` | Achado e evidência | Correção sugerida | Criticidade |
|---|---|---|---|---|
| A-16 | `test/arquivos/deploy.test.ts:128-146` (fumaça em `.github/workflows/deploy.yml:128`) | Nenhum caso devolve um cabeçalho de segurança com **valor errado** (`referrer-policy: no-referrer`, `x-content-type-options: sniff`, CSP com `default-src *`), então o conteúdo dos regex de `nosniff` e `same-origin` só é provado por texto (`:105-112`): N20 (aceitar também `no-referrer`) e N21 (aceitar também `sniff`) sobrevivem com 34/34. A fumaça aceitaria um deploy com o cabeçalho trocado (FUN-42 exige os valores) sem teste vermelho; N22 (CSP `default-src *`) já morre, pela mensagem do A-15 | Duas variáveis no stub (ou um `VALOR_ERRADO=<cabecalho>`) que trocam o valor de `referrer-policy`→`no-referrer` e `x-content-type-options`→`sniff`; casos exigem `status !== 0` e a mensagem citando o regex do cabeçalho; N20 e N21 passam a morrer | comum (falha de prova em área de segurança, mas o regex atual está correto e os mutantes são alterações deliberadas; a sessão pode aceitar como informativo) |

## Não validado

Execução real do workflow na Actions (`DEPLOY_ATIVO` inativo), cabeçalhos em resposta real da Cloudflare, Node 24 local (rodou em 26; o container Linux usou Node 24).
