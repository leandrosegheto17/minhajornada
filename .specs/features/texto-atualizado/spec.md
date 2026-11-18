# Especificação: Texto bíblico corrigido

- **Base**: roteiro (`.specs/projeto/roadmap.md`, linha 4; AD-009, AD-010), pesquisa de fontes (`pesquisa.md`), levantamento dos 66 livros (`levantamento/RESUMO.md`, 2026-11-18) e respostas do dono em 2026-11-18
- **Tamanho**: Large (dados novos de correção, ferramenta de revisão, mudança no build, duas telas alteradas e uma nova; altera FUN-03 e FUN-38)
- **Aprovação**: pendente

## Problem Statement

A Bíblia Livre (BLIVRE, fev/2018) que o app mostra tem erros visíveis: o levantamento achou cerca de 1.440 erros de digitação, 110 de ortografia, mais de 1.200 versículos com espaço errado na pontuação e 54 candidatos de erro de sentido, como "o Coreiro" (Cordeiro), "asas de águas" (águias) e versículos cortados no meio. Não existe versão mais nova da BLIVRE. A licença CC BY 4.0 permite corrigir, desde que a alteração fique declarada e o crédito continue.

## Goals

- [ ] Todo erro de digitação e ortografia e todo erro de sentido aprovado pelo dono aparece corrigido no app, nos dois formatos de leitura.
- [ ] Nenhuma correção entra sem a decisão do dono, seja por regra, em bloco ou item a item.
- [ ] O leitor encontra, a partir do Sobre, a lista de tudo o que mudou, e o crédito da BLIVRE continua completo.
- [ ] O app continua sem conta, sem servidor, offline e sem requisição a terceiros (FUN-33 a FUN-36 e FUN-41 continuam valendo).

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Trocar palavras arcaicas (271 candidatos) | Decisão do dono em 2026-11-18: muda muito o texto; pode virar um glossário em outra feature |
| Marca no versículo corrigido | Decisão do dono em 2026-11-18: só aviso no Sobre e lista publicada |
| Trocar a BLIVRE por outra tradução ou mesclar com outra | Pesquisa: não há versão livre melhor; a BLPT é só NT e CC BY-SA |
| Copiar texto de tradução com direitos autorais (ARA, ARC, NVI, NAA etc.) | Licença; a redação das correções é própria |
| Correção sugerida pelo leitor dentro do app | Não pedido; o app não tem conta nem servidor |
| Novas varreduras automáticas por IA no build | O levantamento é feito uma vez; correção nova entra pelo mesmo arquivo e pela mesma revisão |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Tipos corrigidos | Digitação (inclui os mecânicos de pontuação e espaço), ortografia e sentido; arcaico fica fora | Decisão do dono em 2026-11-18 | y |
| Forma da revisão | Regras mecânicas aprovadas uma a uma, como regra; digitação e ortografia de confiança alta aprovadas em bloco, por tipo e livro, depois de conferidas contra a fonte; confiança média e baixa e todo item de sentido revisados um a um | Decisão do dono em 2026-11-18 | y |
| Ferramenta da revisão item a item | Página privada no claude.ai (artifact, só o dono vê), com Aprovar, Recusar e Editar, que guarda as decisões entre visitas; ela não faz parte do app publicado | Decisão do dono em 2026-11-18 | y |
| Onde a decisão fica valendo | No arquivo de correções versionado no repositório. As decisões da página são exportadas para ele, e só ele alimenta o build | O build e os testes não podem depender de um serviço externo nem da conversa | n |
| Original preservado | `.biblia/` continua idêntico ao download do eBible; as correções são aplicadas na conversão do build | Mantém a fonte conferível e torna cada correção reversível | n |
| Transparência | Aviso no Sobre e tela "Correções no texto", aberta pelo Sobre, com a lista por livro | Decisão do dono em 2026-11-18 | y |
| Nome da tradução | "Baseado na Bíblia Livre": a capa diz "Baseado na Bíblia Livre" e o Sobre diz "texto baseado na Bíblia Livre (BLIVRE) … com correções" | Decisão do dono em 2026-11-18; evita a questão jurídica do nome com texto alterado | y |
| Regras mecânicas na tela de correções | Cada regra aparece numa linha (o que faz e quantos versículos tocou), não versículo a versículo | São mais de 1.200 versículos de espaço e pontuação; a lista ficaria ilegível | n |
| Itálico (colchetes) | A correção pode mexer dentro ou em volta de um trecho em itálico, mas o resultado precisa manter os colchetes em pares; o leitor continua vendo itálico, nunca colchete | FUN-02 e FUN-03 continuam valendo | n |
| Erro de sentido | Só é aprovável com a fonte preenchida (palavra na língua original, dicionário ou Almeida em domínio público) | Regra das instruções do levantamento; evita trocar escolha de tradução defensável | n |
| Integração sem todos os itens decididos | A feature pode ser integrada com itens ainda "proposta"; o app só aplica os aprovados, e a revisão pode continuar depois, em novas versões do arquivo | A revisão de ~550 itens não deve travar o código | n |
| Cache offline | Livro corrigido ganha arquivo com hash novo (AD-002); quem já o tinha guardado recebe o novo na próxima abertura com rede | Reaproveita o mecanismo de `limparAntigos` | n |
| Testes existentes de FUN-38 (Sobre) e da capa | Mudam para o novo texto do crédito; esta spec aprovada é a aprovação da mudança, tão forte quanto antes | Regra de Testes do `CLAUDE.md` | n |

**Open questions:** none - all resolved or logged above (required before the spec is confirmed).

---

## Requisitos alterados

| Requisito | Antes | Agora |
| --------- | ----- | ----- |
| FUN-03 (leitor) | Texto de cada versículo igual ao de `.biblia/` (exceto colchetes por itálico) | Igual ao de `.biblia/` com as correções aprovadas aplicadas (FUN-114), exceto colchetes por itálico |
| FUN-38 (leitor) | Crédito com "só o formato foi convertido" | Crédito com "texto baseado na Bíblia Livre, com correções" (FUN-119); autores, data, licença, link e não endosso continuam |

---

## User Stories

### P1: Lista de correções conferida contra a fonte ⭐ MVP

**User Story**: Como dono, quero que os candidatos do levantamento virem uma lista única e conferida contra o texto original, para revisar só o que de fato existe no versículo.

**Why P1**: Sem a lista conferida, nada pode ser aprovado nem aplicado.

**Acceptance Criteria**:

1. The sistema SHALL manter um arquivo versionado de correções em que cada item tem identificador único, referência (livro, capítulo, versículo), tipo (digitação, ortografia, sentido), trecho "antes", trecho "depois", motivo, fonte, confiança (alta, média, baixa) e estado (proposta, aprovada, recusada). (FUN-103)
2. WHEN os candidatos do levantamento são consolidados THEN o sistema SHALL gerar um item por ocorrência, com estado "proposta", excluindo os do tipo arcaico. (FUN-104)
3. IF o trecho "antes" de um item não aparece exatamente uma vez no versículo de `.biblia/` THEN o sistema SHALL marcar o item como "não confere", mostrando o versículo inteiro, e não deixá-lo ser aprovado em bloco. (FUN-105)
4. The sistema SHALL descrever cada regra mecânica (ex.: tirar o espaço antes de vírgula, ponto, ponto e vírgula, dois-pontos, interrogação e exclamação; pôr espaço depois deles) com o número de versículos que ela altera e 5 exemplos de antes e depois. (FUN-106)
5. IF dois itens aprovados alteram trechos que se sobrepõem no mesmo versículo THEN o sistema SHALL recusar o arquivo, apontando os dois identificadores. (FUN-107)

**Independent Test**: consolidar o levantamento num arquivo, ver um item de Apocalipse 6:1 ("Coreiro") com estado "proposta" e confiança alta, e ver um item com "antes" inexistente marcado "não confere".

---

### P1: Revisão pelo dono ⭐ MVP

**User Story**: Como dono, quero aprovar as regras e os blocos seguros de uma vez e revisar um a um o que é incerto, para corrigir o texto sem ler 1.550 itens.

**Why P1**: Nenhuma correção entra sem a decisão do dono.

**Acceptance Criteria**:

1. WHEN o dono abre a página de revisão THEN o sistema SHALL mostrar as regras mecânicas, os blocos de confiança alta (por tipo e livro) e os itens um a um (confiança média e baixa e todos os de sentido), cada grupo com a contagem de itens pendentes. (FUN-108)
2. WHEN o dono revisa um item THEN o sistema SHALL mostrar o versículo inteiro antes e depois da correção, o motivo, a fonte e as ações "Aprovar", "Recusar" e "Editar" (que muda o trecho "depois"). (FUN-109)
3. WHEN o dono aprova uma regra ou um bloco THEN o sistema SHALL marcar como aprovados todos os itens daquela regra ou bloco que conferem com a fonte, e nenhum outro. (FUN-110)
4. IF o item é do tipo sentido e não tem fonte preenchida THEN o sistema SHALL impedir a aprovação e mostrar "Falta a fonte". (FUN-111)
5. WHEN o dono fecha a página e volta depois THEN o sistema SHALL mostrar as decisões já tomadas e continuar do primeiro item pendente. (FUN-112)
6. WHEN as decisões da página são exportadas THEN o sistema SHALL gravar no arquivo de correções o estado e o trecho "depois" editado de cada item, sem mudar os itens que a página não decidiu. (FUN-113)

**Independent Test**: aprovar a regra "espaço antes da vírgula", recusar um item de sentido, editar um de digitação, fechar e reabrir a página, ver as três decisões, exportar e ver os três estados no arquivo.

---

### P1: Texto corrigido no app ⭐ MVP

**User Story**: Como leitor, quero ler o texto sem os erros de digitação e com os erros de sentido corrigidos, nos dois formatos e offline.

**Why P1**: É a entrega de valor ao leitor.

**Acceptance Criteria**:

1. WHEN o build converte `.biblia/` THEN o sistema SHALL aplicar ao texto exatamente as correções com estado "aprovada" e nenhuma outra, deixando os arquivos de `.biblia/` sem mudança. (FUN-114)
2. IF uma correção aprovada tem um trecho "antes" que não aparece exatamente uma vez no versículo THEN o build SHALL falhar com a mensagem "correção <id> não confere com <referência>". (FUN-115)
3. WHILE o leitor lê um versículo corrigido, na rolagem ou no modo livro, o sistema SHALL mostrar o texto corrigido. (FUN-116)
4. The sistema SHALL manter, depois das correções, os 66 livros, os 31.102 versículos na mesma numeração e os colchetes de itálico em pares, sem nenhum colchete visível ao leitor. (FUN-117)
5. WHEN o leitor que já tem um livro guardado no aparelho abre o app com rede depois da publicação THEN o sistema SHALL substituir o livro guardado pela versão corrigida (arquivo de hash novo, AD-002). (FUN-118)

**Independent Test**: aprovar a correção de Apocalipse 6:1, gerar o build, abrir Apocalipse 6 na rolagem e no modo livro e ler "Cordeiro"; conferir que `.biblia/66-apocalipse.md` continua com "Coreiro".

---

### P1: Aviso, nome e lista das correções ⭐ MVP

**User Story**: Como leitor, quero saber que o texto foi corrigido e ver o que mudou, para confiar no texto e para que o crédito da BLIVRE continue honesto.

**Why P1**: A licença CC BY 4.0 exige declarar a alteração.

**Acceptance Criteria**:

1. WHILE há pelo menos uma correção aplicada, WHEN o leitor abre o Sobre THEN o sistema SHALL mostrar: "texto baseado na Bíblia Livre (BLIVRE)", os autores (Diego Santos, Mario Sérgio e Marco Teles), a versão de fevereiro de 2018, a licença Creative Commons Atribuição 4.0 Brasil com link, o link da fonte, que o texto recebeu correções de digitação, ortografia e sentido, que os autores da Bíblia Livre não endossam essas mudanças nem o app, e o link "Ver as correções no texto". (FUN-119)
2. IF nenhuma correção está aplicada THEN o Sobre SHALL manter o texto de hoje ("só o formato do arquivo foi convertido para o app; o texto não foi modificado"). (FUN-120)
3. WHILE há pelo menos uma correção aplicada a capa do modo livro SHALL mostrar "Baseado na Bíblia Livre" no lugar de "Bíblia Livre". (FUN-121)
4. WHEN o leitor aciona "Ver as correções no texto" THEN o sistema SHALL abrir a tela "Correções no texto", com as correções aplicadas agrupadas por livro, na ordem bíblica, cada uma com referência, trecho antes, trecho depois e motivo, e com "Voltar" para o Sobre. (FUN-122)
5. The tela "Correções no texto" SHALL listar exatamente as correções aplicadas no build, mostrando cada regra mecânica numa linha com o que ela faz e quantos versículos tocou. (FUN-123)
6. WHILE o aparelho está sem rede a tela "Correções no texto" SHALL abrir com a lista completa, como o resto do app. (FUN-124)

**Independent Test**: com correções aplicadas, abrir o Sobre, ler o novo crédito, tocar "Ver as correções no texto", ver Apocalipse com "Coreiro → Cordeiro" e a linha da regra de espaço com a contagem; repetir sem rede.

---

## Edge Cases

- IF o "depois" de uma correção deixa um colchete de itálico sem par THEN o sistema SHALL recusar o arquivo de correções, apontando o identificador. (FUN-125)
- IF a correção muda um versículo que outra correção aprovada também muda, em trechos separados THEN o sistema SHALL aplicar as duas. (coberto por FUN-107 e FUN-114)
- IF o arquivo de correções tem um identificador repetido ou uma referência que não existe (livro, capítulo ou versículo) THEN o build SHALL falhar com o identificador e a referência. (FUN-126)
- WHEN uma regra mecânica e um item um a um tocam o mesmo versículo THEN o sistema SHALL aplicar primeiro os itens um a um e depois as regras, e o resultado SHALL ser o mesmo a cada build. (FUN-127)

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| FUN-103 | P1: Lista conferida | Design | Pending |
| FUN-104 | P1: Lista conferida | Design | Pending |
| FUN-105 | P1: Lista conferida | Design | Pending |
| FUN-106 | P1: Lista conferida | Design | Pending |
| FUN-107 | P1: Lista conferida | Design | Pending |
| FUN-108 | P1: Revisão | Design | Pending |
| FUN-109 | P1: Revisão | Design | Pending |
| FUN-110 | P1: Revisão | Design | Pending |
| FUN-111 | P1: Revisão | Design | Pending |
| FUN-112 | P1: Revisão | Design | Pending |
| FUN-113 | P1: Revisão | Design | Pending |
| FUN-114 | P1: Texto corrigido | Design | Pending |
| FUN-115 | P1: Texto corrigido | Design | Pending |
| FUN-116 | P1: Texto corrigido | Design | Pending |
| FUN-117 | P1: Texto corrigido | Design | Pending |
| FUN-118 | P1: Texto corrigido | Design | Pending |
| FUN-119 | P1: Aviso e lista | Design | Pending |
| FUN-120 | P1: Aviso e lista | Design | Pending |
| FUN-121 | P1: Aviso e lista | Design | Pending |
| FUN-122 | P1: Aviso e lista | Design | Pending |
| FUN-123 | P1: Aviso e lista | Design | Pending |
| FUN-124 | P1: Aviso e lista | Design | Pending |
| FUN-125 | Edge Cases | Design | Pending |
| FUN-126 | Edge Cases | Design | Pending |
| FUN-127 | Edge Cases | Design | Pending |

**Coverage:** 25 total, 0 mapped to tasks, 25 unmapped ⚠️ (o mapeamento sai no plano)

---

## Success Criteria

- [ ] Os 6 erros de sentido de confiança alta e os 1.001 de digitação de confiança alta foram decididos pelo dono (aprovados ou recusados), e os aprovados aparecem no app.
- [ ] Nenhum versículo do app mostra espaço antes de vírgula, ponto, ponto e vírgula ou dois-pontos depois da regra aprovada (contagem da checagem mecânica = 0 no texto gerado).
- [ ] O Sobre e a tela de correções abrem sem rede e listam o mesmo número de correções que o build aplicou.
