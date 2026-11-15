# Verificação, rodada 1: leitor

**Veredito**: PASS com achados comuns (50/50 critérios com asserção localizada; 2 lacunas de precisão de aparência; 5 achados, nenhum crítico)
**Árvore**: `939536c2f2e17b5f15f41c7a6bc6c399462a132d` (HEAD `5a6b8af`); verificado de novo, pois a árvore do último `Gate:` (`b05d0aa`) é anterior ao commit do prettier.

## Gate (rodado por mim, árvore atual)

`pnpm lint` 0 · `pnpm typecheck` 0 · `pnpm test` 26 arquivos, 324 testes verdes · `pnpm build` 0 · `pnpm e2e` 25 verdes. `testes.json` (`typecheck && test`) cobre o único pacote. Amostra de typecheck (`5348f35`, `bfada8e`, `1060693`): verde. Ambiente: Node 26.13 (engines pede 24; só aviso). Sem banco, sem `teste_*` órfão, sem policy (itens (e) e (f) não se aplicam).

## Critério → asserção → resultado

| Critérios | `arquivo:linha` e asserção | Res. |
|---|---|---|
| FUN-01, 05 | `e2e/leitura.spec.ts:25` `versiculos.toHaveCount(25)` (Filemom 1); `:56` 176 em Salmos 119; `:104` `scrollY` `toBe(0)` | ok (aparência: A-02) |
| FUN-02, 04 | `src/biblia/segmentos.test.ts:5-50`; `leitura.spec.ts:28-30` `em` = "que está" sem `[`; `Versiculo.test.tsx:45-55` `img` nulo; `regras.test.ts:42` `innerHTML` recusado | ok |
| FUN-03 | `test/arquivos/converter-biblia.test.ts:52-60` 31102 e cada versículo `toBe(texto)` | ok |
| FUN-06 a 09, 49, 50 | `leitura.spec.ts:19-20` 39 e 27; `:45,50-56` grade 28 e 150; `leitor.test.ts:50,56` (Judas direto, Salmos grade), `:89-101` | ok |
| FUN-10 a 15 | `navegacao.test.ts:13-45` (Malaquias 4→Mateus 1, Apocalipse 22 e Gênesis 1 `toBeNull`); `leitura.spec.ts:62,67` `toBeDisabled` | ok |
| FUN-16 a 18 | `deslize.test.ts:5-37` (limiar ±60, empate 80/80 `toBeNull`); `TelaLeitor.test.tsx:182-225`; `leitura.spec.ts:77,83-86` | ok (A-01) |
| FUN-19 a 22 | `preferencias.test.ts:25-49` leitura apagada e `null`; `navegacao.test.ts:53-71`; `leitura.spec.ts:93`; `App.test.tsx:52,58` | ok |
| FUN-23 a 27 | `PainelAparencia.test.tsx:15-45` (`toBeDisabled` em 5 e em 1); `leitor.test.ts:134-156`; `aparencia.spec.ts:190-195` fonte maior | ok |
| FUN-28 a 31 | `aparencia.spec.ts:141,148,159` fundo `rgb(...)`; `:178-182` sépia e letra 5 após `reload`; `preferencias.test.ts:70-106` padrão 3 e `null`; `estilo.test.ts:99-111` | ok |
| FUN-32 | `estilo.test.ts:82-90` `contraste(texto, fundo) >= 4.5` nos 3 temas e no escuro do sistema (calculado sobre os tokens, não sobre pixel) | ok |
| FUN-33, 34 | `baixarFaltantes.test.ts:109-171` (66, 56, 0, falha no 30º, 1 por vez); `livros.test.ts:25-42`; `useLeitor.test.ts:136-166`; `offline.spec.ts:35-39` só `pedido:45` antes do capítulo | ok |
| FUN-35, 36 | `offline.spec.ts:43-65` sem rede mostra Apocalipse 22; `:67-92` mensagem exata `toBeVisible` e seletor segue; `livros.test.ts:47-59` | ok (A-04) |
| FUN-37 | `atualizacao.spec.ts:47-80` `marca` 1 nas 2 abas, depois `versao` `e2e-B`; `limparAntigos.test.ts:32-45` | ok |
| FUN-38 a 40 | `TelaSobre.test.tsx:12-60` textos, links CC e fonte, "não endossam", "itálico", "não tem conta" | ok |
| FUN-41 | `offline.spec.ts:97-114` hosts `['127.0.0.1']` e `cookies` `[]`; `regras.test.ts:59-72`; `estilo.test.ts:123-143` | ok |
| FUN-42 | `cabecalhos.test.ts:36-72` 11 diretivas exatas, sem `unsafe-*`, nosniff, `same-origin` | ok (A-05) |
| FUN-43, 44 | `aparencia.spec.ts:97-130` (320 e 1920 px, 5 telas) `scrollWidth <= clientWidth` e botão sem texto com `aria-label`; `Botoes.test.tsx:8-29` | ok |
| FUN-45 a 48 | `manifesto.spec.ts:17-48` nome, `standalone`, PNG 192 e 512 com IHDR conferido; `ConviteInstalacao.test.tsx:47-79`; `preferencias.test.ts:110` | ok |

Decisões nomeadas (Reuses e AD-001 a AD-003): seguidas (injectManifest, `same-origin`, cache `mj-livros`, `_headers`). O único `SPEC_DEVIATION` (`src/App.tsx:12`) está justificado. Build sem script inline nem `data:` no CSS (compatível com a CSP).

## Sensor (13 mutações, cópia isolada com junção; cada uma só no teste do arquivo; e2e uma vez)

| Mutação | Teste que a matou |
|---|---|
| `deslize.ts` `<=` → `<` | `deslize.test.ts` FUN-18 (-80/80, 80/-80) |
| `navegacao.ts` `< length` → `<=` | `navegacao.test.ts:25` (Apocalipse 22) |
| `preferencias.ts` sem `apagar` | `preferencias.test.ts:35-49` (4 falhas) |
| `lerLetra` aceita 0 | `preferencias.test.ts` FUN-31 "0" |
| `carregarLivro` sem `cache.put` | `livros.test.ts:32`, `baixarFaltantes.test.ts` (3 falhas) |
| `limparAntigos` invertido | `limparAntigos.test.ts` (2 falhas) |
| `_headers` `no-referrer` | `cabecalhos.test.ts:70` |
| `Versiculo` com `dangerouslySetInnerHTML` | `Versiculo.test.tsx:45,51` |
| `estaInstalado` sempre falso | `ConviteInstalacao.test.tsx` e `instalacao.test.ts` FUN-48 |
| `useLeitor` baixa antes do capítulo pronto | `useLeitor.test.ts` (3 falhas) |
| `ConviteInstalacao` sem `dispensarConvite()` | `ConviteInstalacao.test.tsx` FUN-47 |
| `sw.ts` sem `skipWaiting` | `atualizacao.spec.ts:47` (estourou os 180 s) |
| `baixar` sem o `cache.match`/`continue` | **sobreviveu, equivalente**: `carregarLivro` já faz `match` e não busca |

12 mortas, 1 sobrevivente equivalente. Cópia descartada (junção removida antes); `git status` da árvore real igual ao inicial, exceto `seguranca.md` não rastreado, criado pelo `auditor-seguranca` em paralelo.

## Achados

| ID | `arquivo:linha` | Achado e evidência | Correção sugerida | Crit. |
|---|---|---|---|---|
| A-01 | `src/telas/TelaLeitor.tsx:73-85` | O deslize vale para qualquer ponteiro: não há teste de `pointerType`. FUN-16/17 falam em "deslizar o dedo". No computador, arrastar o mouse mais de 60 px na horizontal (selecionar texto) troca de capítulo. Os testes (`TelaLeitor.test.tsx:176-180`, `e2e/apoio/navegar.ts`) não provam o contrário. | Aceitar só `pointerType === 'touch'` (e caneta, se quiser) em `aoComecarDeslize`; teste: `pointerDown/Up` com `pointerType: 'mouse'`, dx 100, não chama `aoSeguinte`. | comum |
| A-02 | `src/componentes/Versiculo.test.tsx:14-31`, `e2e/leitura.spec.ts:27-30` | Lacuna de precisão: "cada um em linha própria, precedido do número" (FUN-01) e "em itálico" (FUN-02) só têm prova por DOM (`<em>`, `children`); o jsdom não carrega o CSS e nenhum teste lê `font-style` nem posição. | No e2e de Filemom 1: `getComputedStyle(em).fontStyle === 'italic'`; `boundingBox` com `y` crescente entre versículos e `x` do número menor que o do texto. | comum |
| A-03 | `src/componentes/ConviteInstalacao.test.tsx:16-17`, `e2e/aparencia.spec.ts:114-115` | Dois testes existentes alterados na execução (e um novo em `useLeitor.test.ts:225`) sem a aprovação gravada em artefato: `STATE.md` não tem `## Autorizações`, e `tasks.md:980` só registra `App.test.tsx` e `esqueleto.spec.ts`. As asserções não mudaram (motivo está nos commits `1060693`, `49d6200`). | Gravar em `STATE.md`, `## Autorizações`, a aprovação de 2026-11-15 e o escopo (três itens). | comum |
| A-04 | `src/estado/useLeitor.ts:62-66`, `.specs/features/leitor/tasks.md:669` | FUN-36 condiciona a mensagem a "sem rede e livro não guardado"; a decisão do dono (2026-11-15) a estende a JSON ilegível e erro do servidor (teste `useLeitor.test.ts:225`). Só há nota em `tasks.md` e comentário no código; sem AD nem ajuste da spec. | AD em `STATE.md` ou emenda do FUN-36. | comum |
| A-05 | `test/arquivos/cabecalhos.test.ts:36-72`, `.github/workflows/deploy.yml:93-94` | FUN-42 vale "em toda resposta", mas só o arquivo `_headers` é testado (o `vite preview` do e2e não o serve). A fumaça do deploy checa só `/` e 3 cabeçalhos, sem `/livros/*.json` nem `frame-ancestors`, que o teste independente da spec pede. Uma violação da CSP no app real não seria vista pelo e2e. | Ampliar a fumaça (`curl -D -` em `/livros/01.<hash>.json` e a CSP completa); opcionalmente, o servidor do e2e (`e2e/apoio/servidor.ts`) servir `_headers` e o teste falhar em `securitypolicyviolation`. | comum |

## Não validado

Cabeçalhos em resposta real da Cloudflare, instalação no Chrome/Safari reais e contraste medido em pixel (só o cálculo sobre os tokens). Execução em Node 24 (rodei em 26).
