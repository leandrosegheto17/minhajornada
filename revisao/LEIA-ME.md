# Revisão das correções do texto

A revisão é uma página (`index.html`) que mostra as regras mecânicas, os blocos de confiança alta e os itens um a um, e guarda cada decisão. As decisões voltam ao arquivo `correcoes/correcoes.json`, que é a única fonte do build.

## Montar

1. `node scripts/montar-revisao.ts` gera `revisao/dados.json` (cada item e regra com o versículo inteiro antes e depois). Refaça sempre que `correcoes/correcoes.json` mudar.
2. `pnpm revisao:montar` gera `revisao/dist/pagina.js`.

`revisao/dados.json` e `revisao/dist/` são gerados e ficam fora do git.

## Publicar

A página vai como artifact **privado** do claude.ai, com os arquivos `index.html`, `dados.json` e `dist/pagina.js` e as capacidades `db`, `user` e `downloads`. Cada decisão vira uma linha do banco do artifact (`decisoes/<id>`, com `{ id, estado, depois? }`), por isso ela continua ali quando você fecha e reabre a página.

Publicação: **publicada** em 2026-11-18 como artifact privado: https://claude.ai/artifact/MXhc3ed26tA7VtYZUWa8Kz (slug `a6401c0b-687c-4126-ae72-22de16898aa1`, capacidades `db`, `user` e `downloads`). Depois de mudar `correcoes/correcoes.json`, refaça os dois passos de montagem e republique `index.html`, `dados.json` e `dist/pagina.js`.

## Trazer as decisões de volta ao arquivo

Duas formas, as duas terminam em `node scripts/aplicar-decisoes.ts`:

1. **Pelo banco:** peça a uma sessão do Claude para ler a coleção `decisoes` do artifact, gravar a lista em `revisao/decisoes.json` e rodar `node scripts/aplicar-decisoes.ts`.
2. **Pelo arquivo:** na página, "Baixar decisões" entrega `decisoes.json`; ponha-o em `revisao/` e rode `node scripts/aplicar-decisoes.ts`.

`aplicar-decisoes.ts` muda só o estado e o trecho "depois" dos itens decididos, no mesmo formato (um item por linha). Se alguma decisão for recusada (id desconhecido, estado inválido, colchete de itálico sem par, aprovação de item que não confere ou de sentido sem fonte), nada é gravado.

Depois de aplicar, rode `pnpm build`: a próxima versão do site já traz as correções aprovadas.

## Atenção

- `node scripts/consolidar-correcoes.ts` recusa sobrescrever `correcoes/correcoes.json` quando ele já tem decisões; só `--forcar` apaga a revisão.
- A revisão pode continuar depois da integração: cada exportação é uma nova versão de `correcoes/correcoes.json`.
