# Verificação do leitor, rodada 4 (retrabalho R3, T48 / A-13)

- **Branch**: `feature/leitor` @ `9d6b374` (árvore `c58e6068…`). **Diff**: `d465c00..HEAD`: só `test/arquivos/deploy.test.ts` (+89, -3: as 3 linhas removidas são os imports reescritos; nenhum teste removido ou enfraquecido) e `tasks.md`.
- **Veredito**: **FAIL**: **A-13 fechado**; 2 achados novos (A-14 crítica, A-15 comum) no mesmo trecho da fumaça.

## A-13 (FUN-42, caminho de falha da fumaça): fechado

`test/arquivos/deploy.test.ts:150` roda o bloco `run` do passo em `bash -e` (shell padrão do Actions) com `curl` simulado (`:127-145`). Casos: tudo presente sai 0 e sem `::error` (`:162-167`); 10 casos de cabeçalho ausente por caminho exigem `status !== 0` e `/::error title=Fumaça falhou::/` (`:180-188`); HTTP 500 em `/sw.js` com `-f` derruba (`:190-193`).

## Sensor (cópia isolada, `node_modules` por junção, só `deploy.test.ts`; limpa = 25/25)

| Mutante em `deploy.yml` (passo da fumaça) | Resultado |
|---|---|
| M19 `exit 1`→`true`; M22 →`:`; M47 →`exit 0`; M40 →`break`; M39 sem o `echo ::error` | mortas (10 falhas cada) |
| M21 `if ! grep`→`if grep` | morta (1 falha: o caso "tudo presente") |
| M23 `curl -fsS`→`-sS` no laço | morta (1 falha: o caso HTTP 500) |
| M25/M26/M27 tirar `default-src`/`object-src`/`frame-ancestors` dos exigidos | mortas, **só pelos testes textuais** (1 falha cada); ver A-15 |
| M28 sem `nosniff`; M29 sem `referrer-policy` | mortas (4 e 3 falhas) |
| M30, M36 `nosniff` frouxo; M35 CSP frouxa; M38 `referrer` frouxo; M46 `same-origin`→`same`; M31 →`no-referrer`; M37 `grep -F` | mortas (1 a 2 falhas, textuais) |
| M34 sem o primeiro `curl` de `/` | morta (1, textual) |
| **M32** `grep -qi`→`grep -q` | **viva** (25/25); A-14 |
| M33 tirar `--retry` do `curl` do laço | viva (25/25); quase equivalente: o primeiro `curl` de `/` já retenta e aquece o deploy, e o stub não observa retry; informativo |
| M42 `curl … \|\| true` no laço | viva; equivalente quanto ao resultado: o `curl` falho deixa os cabeçalhos vazios, o `grep` falha e sai 1 (muda só a mensagem) |
| M48 primeiro `curl` sem `-f` | viva; equivalente: o `curl -f` do laço em `/` cobre o mesmo |

24 mutações executadas: 20 mortas, 4 vivas (3 equivalentes ou quase; **1 real: M32**). Cópia e junção removidas, `git worktree prune`; `git status --porcelain` da árvore real vazio antes e depois.

## Gate (árvore `c58e6068…`, diferente da registrada em `Gate:`; rodado agora)

`pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm e2e` = **verde**: 27 arquivos e **357** testes (345 + 12 novos), **27** e2e. Sem regressão.

## Qualidade do teste novo

- **Linux/CI**: rodei `deploy.test.ts` num container `node:24` (Debian, bash 5, `pnpm install --ignore-scripts`): **25/25**. `delimiter`, `mkdtempSync(tmpdir())`, `chmod 0o755` e shebang `#!/bin/bash` são portáveis; `afterAll` remove a raiz (nenhum `fumaca-*` sobrou em `%TEMP%`). Ressalva só do Windows: `{...process.env, PATH}` pode duplicar `Path`/`PATH` e `bash` pode resolver para o WSL; passou aqui e o CI é `ubuntu-latest`.
- **Extração do bloco** (`:118`): se o YAML mudar (`run: >`, outra indentação), `bloco` fica vazio e falha alto (`:163` exige `for caminho in`; os casos de omissão exigem status ≠ 0). Sem passagem silenciosa.
- **Flakiness**: nenhuma em 6 execuções; ~0,5 s por caso (um `bash` cada), dentro do timeout padrão.
- **Motivo errado**: os casos de omissão afirmam `::error`, mas não o caminho nem o cabeçalho da mensagem; ver A-15.
- **Checagens de processo**: (a) `testes.json` cobre o pacote único (e2e à parte), OK; (b) `typecheck` verde no HEAD (o único commit de código, `dbfbd8f`, só mexe em teste); (c) 0 teste enfraquecido; (d) IDs `FUN-42`/`A-13` batem com `spec.md:188`; (e) sem banco `teste_*`, sem diretório temporário órfão; (f) não se aplica; (g) sem divergência spec × design. Nota: o `Gate:` da T48 em `tasks.md:1360` cita `pnpm vitest run`, que falha neste ambiente; sem efeito.

## Achados

| ID | `arquivo:linha` | Achado e evidência | Correção sugerida | Criticidade |
|---|---|---|---|---|
| A-14 | `test/arquivos/deploy.test.ts:136-138` (fumaça em `.github/workflows/deploy.yml:127`) | O stub só emite cabeçalhos em minúsculas, então o `-i` do `grep -qi` não é provado: M32 (`grep -q`) passa 25/25. Servidor que responder em HTTP/1.1 ou com `Content-Security-Policy` capitalizado faria a fumaça recusar um deploy bom e disparar o rollback sem teste vermelho | Caso extra: stub que devolve os cabeçalhos com a caixa de título (`Content-Security-Policy:`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: same-origin`) e exige saída 0; M32 passa a morrer | crítica (mutante vivo em área de segurança, na dúvida crítica; ressalva: falha fechada, com aviso, não escapa em silêncio, a sessão pode rebaixar a comum) |
| A-15 | `test/arquivos/deploy.test.ts:170-174, 181-184` | Os casos `object-src` e `frame-ancestors` (e `default-src`) tiram a linha inteira da CSP, então os 5 casos de CSP são o mesmo comportamento: M26 e M27 (tirar `object-src`/`frame-ancestors` dos exigidos) só morrem pelos testes textuais (`:100-109`), não pelos casos nomeados com a diretiva. Fere "um teste por ramo": o nome promete uma prova que a execução não dá | O stub remover só a diretiva (`sed "s/ *$OMITIR_DIRETIVA[^;]*;\?//"`) da linha da CSP; cada caso exige o `::error` com a diretiva omitida (`/${exigido}/` na mensagem), e confira também o caminho na mensagem | comum (os mutantes morrem pelos testes textuais) |

## Não validado

Execução real do workflow na Actions (`DEPLOY_ATIVO` inativo), cabeçalhos em resposta real da Cloudflare, Node 24 local (rodou em 26; o container Linux usou Node 24).
