# Validação: interface-livro — FAIL ❌ (rodada 1)

- **Data**: 2026-11-18 · **Branch**: feature/interface-livro @ c9108ac · **Árvore**: 060060eccc52ccb890a2632c0384488e462a5447
- **Critérios**: 44/44 com evidência, 7 com prova parcial (A-02 a A-08) · **Gate**: `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm e2e` = 589 + 45 passaram, 0 falharam (rodado de novo: a árvore não bate com o último `Gate:`)
- **Sensor**: 12 mutações, 10 mortas, 1 sobreviveu (`TelaLivro.tsx:106-107`, `larga` → `false`), 1 equivalente (`useLeitor.ts:122`)
- **Revisão de código**: skill revisao-codigo, modo curto (code-review): 8 apontamentos, 4 confirmados (A-11 a A-14), 4 descartados (carga de outro livro: `useLeitor.ts:180` já entrega "carregando"; `useTelaLarga` e `lerFormato`: sem efeito observável)
- **Segurança**: não se aplica (site estático, sem login, dado pessoal nem servidor); `public/_headers` inalterado, foto como arquivo (sem `data:`)

## Critérios

Rastreio completo no relatório do verificador. Resumo: FUN-51..57 `src/estado/leitor.test.ts`, `src/App.test.tsx`; FUN-52/53/58/60/64/65 `e2e/entrada.spec.ts`; FUN-61..63/72 `src/componentes/BarraTitulo.test.tsx`; FUN-66..69 `src/dados/preferencias.test.ts`; FUN-70..76/82/83 `src/livro/folhear.test.ts`, `src/livro/paginacao.test.ts`, `e2e/livro.spec.ts`; FUN-77..92 `src/telas/TelaLivro.test.tsx`, `src/livro/CapaLivro.test.tsx`, `e2e/capa.spec.ts`; FUN-93/94 `test/arquivos/icone-svg.test.ts`, `test/arquivos/icones-png.test.ts`. Valores ✅, com as ressalvas dos achados.

## Achados

| ID | `arquivo:linha` | Achado e evidência | Correção sugerida | Criticidade | Situação |
|---|---|---|---|---|---|
| A-11 | `src/livro/livro.module.css:252-259`, `src/livro/useMedidas.ts:33` | FUN-75 violado na tela larga: em 1280 × 800 a medida tem 520 px de largura e a página 430,5 px; o texto quebra em mais linhas e versículos inteiros ficam escondidos pelo `overflow: hidden` (Rute pág. 10: v. 16 começa em 490 px numa caixa de 459 px; também págs. 12 e 13). As margens dos `p` (0,35em) não entram nas alturas | Medir com a largura real da página mostrada e somar as margens; e2e de FUN-75 também em 1280 px | crítica | aberto |
| A-14 | `src/telas/TelaLivro.tsx:47-50`, `src/livro/paginacao.ts:118-143` | Versículo maior que a página trava "Seguinte": a âncora da página de continuação é o mesmo versículo, e `paginaDoVersiculo` devolve a primeira fatia | Âncora que guarde a fatia (ou destino por página); teste com bloco dividido em 3 páginas | crítica | aberto |
| A-01 | `src/livro/paginacao.test.ts` | Critério de sucesso "nenhum versículo some ou se repete nos 66 livros, por teste automatizado" sem teste: só Rute e alturas sintéticas | Teste sobre os 66 JSON reais, cada bloco uma vez e em ordem | crítica | aberto |
| A-12 | `src/livro/useMedidas.ts:45-76` | Na capa o contêiner de medida é desmontado; trocar a letra ou girar lá e voltar ao mesmo livro mantém a medida velha (deps não mudam; `ResizeObserver` no nó antigo) | Ref de callback ou invalidar ao remontar; teste | comum | aberto |
| A-13 | `src/App.tsx` (Sobre, `aoVoltar`) | Formato livro sem leitura (capa, `ref` nulo): Sobre → voltar cai na escolha de livro, não na capa | Voltar ao leitor no formato livro; teste | comum | aberto |
| A-02 | `src/telas/TelaLivro.tsx:106-107` | Mutante `larga` → `false` sobreviveu: nada exercita "seguinte"/"anterior" na tela larga (FUN-77, 78, 82, 85, 88) | Testes com `larga: true` e e2e em 1280 px | comum | aberto |
| A-03 | `src/telas/TelaLivro.test.tsx:15-19`, `e2e/livro.spec.ts:118` | Sem teste com página que começa no capítulo anterior ao da âncora; o e2e tolera `João [23]`. Decidido em AD-007 | Testes exatos conforme AD-007 | comum | aberto |
| A-04 | `src/estilo/estilo.test.ts:105-122` | FUN-59: contraste `--cor-suave` × `--cor-superficie` do cartão sem teste (valores passam: 5,04 a 6,45) | Acrescentar o par aos temas | comum | aberto |
| A-05 | `e2e/entrada.spec.ts:21-27` | FUN-52 "imagem ocupando toda a área abaixo da barra" sem asserção espacial | `boundingBox` da foto | comum | aberto |
| A-06 | `src/componentes/BarraTitulo.module.css:97` | FUN-64 "menos de 480 px": limite sem prova (só 320 px) | E2E em 479 e 480 px | comum | aberto |
| A-07 | `e2e/entrada.spec.ts`, `e2e/aparencia.spec.ts:106-137` | "Sem rolagem horizontal de 320 a 1920 px": faltam em breve, livro, capa e plano pago | `semRolagemLateral` nessas telas | comum | aberto |
| A-08 | `test/arquivos/icones-png.test.ts:33-48` | FUN-93: qualquer PNG vinho do tamanho passa; o desenho 2a não é conferido | Pixel do desenho no centro | comum | aberto |
| A-09 | `tasks.md` (lote 10, commit `1b7db5f`) | Lote 10 marcou T32/T33 antes do código delas; nenhum `Gate:` completo registrado para o HEAD | `Gate:` completo ao fechar o retrabalho | comum | aberto |
| A-10 | `src/telas/TelaLivro.tsx:76`, `design.md:112` | Tema fora da chave de remedir, sem AD | Decidido: AD-008 | comum | fechado (AD-008) |

## Lacunas e o que não foi validado

- Fidelidade visual ao mockup, aparelho real (iOS/Safari), toque real, desempenho da paginação de Salmos, CI remoto com Node 24 (local 26.13).
- Mutante M12 não rodado no e2e (sobrevivência inferida pela leitura).
- E2Es `esqueleto.spec.ts` e `e2e-geral/sobre-instalacao.spec.ts` trocaram a asserção de abertura pela substituição de FUN-20/21 (spec aprovada), sem linha em `## Autorizações`.
