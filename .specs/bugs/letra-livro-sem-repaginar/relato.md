# Relato: a troca de letra no modo livro não repagina

**Data**: 2026-11-19 · **Achado em**: `/executar` da `livro-paginas` (T4), fora do escopo dela · **Situação**: aberto, sem triagem

## O que acontece

No modo livro em tela larga (1920 × 1080), com o livro aberto, tocar em "Aumentar letra" até a letra 5 não refaz a paginação: as páginas mantêm os versículos da letra anterior e, com a letra maior, o fim de algumas fica cortado no meio da linha ou escondido abaixo da caixa. Recarregar a página corrige (a letra gravada entra já na primeira medida).

## Como reproduzir

1. Abrir o app em 1920 × 1080, gravar `mj:formato = "livro"` e abrir Gênesis 1, Gênesis 21 ou Rute 1 pela página inicial.
2. Abrir "Aparência: letra e tema" e tocar duas vezes em "Aumentar letra" (letra 5 de 5).
3. Rodar `linhasCortadas` de `e2e/apoio/livro.ts`: Gênesis 1 devolve versículos 10 (0,86 linha), 18 a 20 (cortado ou escondido); Gênesis 21, o 10 e o 11; Rute 1, o 7, o 8 e o 16.

Com a letra 5 gravada antes de abrir, as mesmas páginas ficam certas (Gênesis 21 abre com o 9 terminando em 731 px de uma caixa de 752 px).

## Suspeita (não confirmada)

`data-letra` vai para o `<html>` num `useEffect` (`src/estado/useLeitor.ts:132-134`) e `useMedidas` mede num `useLayoutEffect` (`src/livro/useMedidas.ts:73-77`), antes do CSS da letra nova valer; o `ResizeObserver` (`:79-94`) só remede se o tamanho do contêiner da medida mudar. O jsdom não mede layout, então os testes de `FUN-86` não pegam isso.

## Critério esperado

FUN-86 (spec da `interface-livro`): ao trocar a letra, o tema ou o tamanho da tela no formato livro, o sistema repagina e mostra a página que contém o primeiro versículo que estava visível.
