# Reconhecimento: texto-atualizado

- **Data**: 2026-11-18 · **Commit**: d93f7e8
- **Contexto do projeto**: nenhum `CLAUDE.md` na raiz nem README (só `.claude/CLAUDE.md`, que é dos fluxos); contexto vivo em `.specs/STATE.md` (AD-001 a AD-011) e no inventário. Criar o contexto mínimo na integração.
- **Encaixe**: estende padrão (conversor do build, índice gerado, telas com `BotaoVoltar`); padrão novo só na página de revisão (artifact fora do app) e na validação do arquivo de correções
- **Arquitetura**: cabe. Nenhuma camada nova no app; o build ganha uma etapa entre o parse e a gravação
- **Telas**: cria `TelaCorrecoes` ("Correções no texto"); muda `TelaSobre` (crédito e link) e `CapaLivro` (nome da tradução); fora do app, a página de revisão do dono (artifact privado)
- **Mockup**: aprovado em 2026-11-18 — só a tela nova `TelaCorrecoes` (`mockup/telas/correcoes.html`, galeria https://claude.ai/artifact/JDQfKJYDSEW9XgcKjUvhWR); Sobre e capa só trocam texto, no visual de hoje (decisão do dono)
- **Plano aprovado em**: 2026-11-18

## Onde entra

| Arquivo ou módulo | O que muda | Novo? |
|---|---|---|
| `correcoes/correcoes.json` (nome a fixar no plano; fora de `.biblia/`, versionado) | Arquivo de correções: itens (FUN-103) e regras mecânicas (FUN-106); só ele alimenta o build | sim |
| `scripts/consolidar-correcoes.ts` | Lê as tabelas de `levantamento/g01.md`…`g15.md` e as classes de `mecanico.md`, gera os itens "proposta" sem os arcaicos (FUN-104), confere cada "antes" contra `.biblia/` (FUN-105) e conta e exemplifica as regras (FUN-106). Roda uma vez, à mão | sim |
| `src/biblia/correcoes.ts` | Puro: valida o arquivo (id repetido, referência inexistente, sobreposição, colchete sem par: FUN-107, FUN-125, FUN-126) e aplica as aprovadas: itens um a um, depois regras (FUN-114, FUN-115, FUN-127) | sim |
| `scripts/converter-biblia.ts:25-49` (`gerar`) | Lê o arquivo de correções, aplica entre `converterLivro` (`:38`) e `JSON.stringify` (`:39`); grava também a lista aplicada (`src/biblia/correcoes.gerado.json`) | não |
| `src/biblia/correcoesAplicadas.ts` | Módulo fino que tipa a lista gerada, no molde de `src/biblia/indice.ts:1-5` | sim |
| `.gitignore` | `src/biblia/correcoes.gerado.json`, como o `indice.gerado.json` | não |
| `src/telas/TelaSobre.tsx:26-42` | Crédito condicional: com correção aplicada, FUN-119 e link "Ver as correções no texto"; sem, o texto de hoje (FUN-120) | não |
| `src/livro/CapaLivro.tsx:14` | "Baseado na Bíblia Livre" quando há correção (FUN-121) | não |
| `src/telas/TelaCorrecoes.tsx` (+ `.module.css`) | Lista por livro em ordem bíblica, regras numa linha com a contagem, "Voltar" ao Sobre (FUN-122, FUN-123) | sim |
| `src/estado/leitor.ts:9` (`Tela`) e `:230` (`irPara`) | Tela `correcoes`; o `irPara` genérico já leva a ela e de volta ao `sobre` | não |
| `src/App.tsx:69-76` | Ramo da `TelaCorrecoes`; `TelaSobre` ganha `aoVerCorrecoes` | não |
| Página de revisão (artifact privado no claude.ai, com banco do artifact) | FUN-108 a FUN-112; exportação para o arquivo (FUN-113) por uma função pura de mescla, com teste | sim (fora do app) |

## Reaproveitamento

| Necessidade da feature | Peça existente | Decisão | Por que (obrigatório em "criar novo") |
|---|---|---|---|
| Ler e numerar os versículos da fonte | `converterLivro` (`src/biblia/conversor.ts:14-69`) | reaproveitar | — (a consolidação e a aplicação usam o mesmo parse; texto já sem espaço final, `:25`, `:56`) |
| Etapa de correção no build | `gerar` (`scripts/converter-biblia.ts:25`) | estender | ganha o caminho do arquivo de correções; assinatura posicional muda, e o teste (`test/arquivos/converter-biblia.test.ts:38`) e o `ehPrincipal` (`:54-58`) acompanham |
| Validar e aplicar correções | nenhuma | criar novo | não há validação de esquema no projeto (sem zod/ajv, `package.json:23-41`); validação manual no estilo de `conversor.ts:21` (`throw` com mensagem) e de `livros.ts:37-45` |
| Pares de colchetes | `segmentar` (`src/biblia/segmentos.ts:9-20`) | reaproveitar para exibir; criar a checagem de pares | `segmentar` não valida pares (`[` solto sai literal); a checagem nasce em `correcoes.ts` |
| Lista aplicada disponível offline no app | `src/biblia/indice.ts` + `indice.gerado.json` (bundle, pré-cache JS `vite.config.ts:56`) | reaproveitar o molde | — |
| Substituir o livro guardado pelo corrigido (FUN-118) | `nomeDoArquivo` (SHA-256 do JSON, `scripts/converter-biblia.ts:14-17`), `limparAntigos` (`src/dados/livros.ts:138-157`), `baixarFaltantes` (`:102`), chamados em `useLeitor.ts:153-155` | reaproveitar | — o texto muda, o hash muda, o antigo sai |
| Tela "Correções no texto" | `TelaSobre` (`BotaoVoltar` + `titulo-tela`, `src/telas/TelaSobre.tsx:22-24`), `Escolha.module.css` | reaproveitar o molde | — |
| Navegação Sobre → Correções → Sobre | `irPara` (`src/estado/leitor.ts:230-241`), `useLeitor.irPara` (`useLeitor.ts:169`) | estender | só a variante nova na union `Tela`; o retorno do Sobre (`App.tsx:73-74`) continua o mesmo |
| Texto condicional do crédito e da capa | `TelaSobre`, `CapaLivro` | estender | — |
| Ler as tabelas do levantamento | nenhuma | criar novo | não há leitor de markdown no projeto; as tabelas têm formato fixo (`levantamento/INSTRUCOES.md`) |
| Revisão do dono com estado entre visitas | nenhuma | criar novo | o app não tem conta nem servidor (FUN-41); decisão do dono: artifact privado |
| Biblioteca nova | — | nenhuma | `node:crypto`, `node:fs` e TS bastam |

## Modelo a seguir

- Conversor puro + script fino — `src/biblia/conversor.ts:14`, `scripts/converter-biblia.ts:25` — função pura testável, I/O só no script, erro por `throw` que derruba o `prebuild`.
- Dado gerado importado no app — `src/biblia/indice.ts:1-5` — JSON gerado fora do git, tipado por cast num módulo fino.
- Tela simples com voltar — `src/telas/TelaSobre.tsx:19-24` — `main`, `BotaoVoltar`, `h1.titulo-tela`.
- Teste de integração do build — `test/arquivos/converter-biblia.test.ts:34-45` — gera em `tmpdir` e confere contra a fonte.

## Convenções do projeto

- Requisito citado no nome do teste (`it('FUN-38: ...')`) — `src/telas/TelaSobre.test.tsx:12`.
- Teste ao lado do código no projeto `componentes`; teste de arquivo/build em `test/arquivos/` (projeto `arquivos`, node) — `vite.config.ts:70-85`.
- Gerados fora do git (`public/livros/`, `src/biblia/indice.gerado.json`) — `.gitignore`.
- O conversor roda antes de `dev`, `build`, `test` e `typecheck` — `package.json:11-20`.
- Nada de `innerHTML` nem `fetch` fora de `src/dados/` — `eslint.config.mjs:8-71`.
- Links externos com `rel="noopener noreferrer"` e `target="_blank"` — `src/telas/TelaSobre.tsx:30`.

## Testes

- **Rodar a suíte**: `pnpm typecheck && pnpm test` (e2e: `pnpm build && pnpm e2e`)
- **Cobrem o trecho**: `src/biblia/conversor.test.ts` (fonte real, `:9-20`, erros `:46-63`); `test/arquivos/converter-biblia.test.ts` (31.102 versículos iguais à fonte `:52-64`, hash `:94-101`); `src/biblia/segmentos.test.ts:5-52`; `src/dados/livros.test.ts`, `limparAntigos.test.ts:21-30`, `baixarFaltantes.test.ts`; `src/telas/TelaSobre.test.tsx:11-37` (FUN-38); `src/livro/CapaLivro.test.tsx:6-9` (FUN-89); `e2e-geral/sobre-instalacao.spec.ts:27`.
- **Testes que vão mudar**: `TelaSobre.test.tsx:33-36` ("só o formato foi convertido") e `CapaLivro.test.tsx:9` ("Bíblia Livre") — aprovados na spec; `test/arquivos/converter-biblia.test.ts:52-64` (versículos iguais à fonte) passa a valer "igual à fonte com as aprovadas aplicadas" pela mudança de FUN-03 — aprovado pelo dono em 2026-11-18 (`## Autorizações` do `STATE.md`).
- **Sem teste**: erro de `gerar` com menos de 66 fontes (`scripts/converter-biblia.ts:29`), `montarIndice` isolado, código de saída do script; nada disso muda de comportamento, então não pede T0. Colchete sem par em `segmentar` (sem caso de teste; o comportamento atual não muda).

## Fragilidades e riscos

- **Teste de FUN-03 muda** — `test/arquivos/converter-biblia.test.ts:52-64` compara cada versículo gerado com `.biblia/`; com correções aprovadas ele quebra. Mudança aprovada em 2026-11-18 (`## Autorizações`), com a condição de continuar tão forte: comparar com a fonte + correções, e provar que `.biblia/` não muda.
- **Tamanho do bundle** — a lista aplicada pode ter ~1.500 itens; importada como o índice, entra no JS principal (pré-cache, `vite.config.ts:56`). O plano decide entre import direto e `import()` dinâmico (pedaço separado, ainda pré-cacheado, FUN-124).
- **Hash depende da ordem das chaves** — `scripts/converter-biblia.ts:39`; a correção não deve acrescentar campos ao JSON do livro, só trocar o texto.
- **`gerar` apaga `public/livros` antes de gravar** (`:31-32`) — uma correção que não confere (FUN-115) falha no meio; validar o arquivo inteiro antes de apagar.
- **Forma do "antes"** — o texto do versículo chega sem espaço final e com colchetes; o levantamento citou trechos como o leitor vê em parte dos casos (`mecanico.md` remove os colchetes). Muitos itens podem cair em "não confere" (FUN-105) e ir para a revisão um a um.
- **Regras mecânicas × colchetes** — 808 casos de espaço antes da pontuação estão colados a `]` (`levantamento/RESUMO.md:18`); a regra precisa operar no texto com colchetes sem desfazer pares (FUN-117).
- **Página de revisão é padrão novo** — guardar decisões entre visitas (FUN-112) depende do banco do artifact; a exportação para o arquivo (FUN-113) passa por uma sessão do Claude que lê o banco e grava o JSON. Conferir as capacidades do artifact no design.
- **Duplicação "nome do livro pelo número"** em 5 pontos (inventário); a `TelaCorrecoes` agrupa por livro e seria o sexto: usar `indice.livros[n-1].nome` sem criar mais um helper local.
