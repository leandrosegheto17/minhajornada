# Especificação: Leitor bíblico (MVP gratuito)

- **Base**: `.specs/produto/decisao.md` (seção "Se seguir: entrada do MVP"), `.specs/features/leitor/context.md`, em 2026-11-14
- **Tamanho**: Complex (domínio novo, PWA offline)
- **Aprovação**: spec aprovada pelo usuário em 2026-11-14, com as premissas da tabela abaixo

## Problem Statement

O dono quer ler a Bíblia no celular e no computador de forma simples, sem conta e também sem internet. Os apps existentes exigem conta, têm funções demais ou anúncios. O texto da Bíblia Livre já está no repositório (`.biblia/`, 66 livros, 31.102 versículos, CC BY 4.0 Brasil), e o leitor é a base sobre a qual a área paga de estudo será construída depois.

## Goals

- [ ] O dono usa o MinhaJornada como leitor principal nas 4 primeiras semanas depois da publicação.
- [ ] A partir do leitor, outro capítulo do mesmo livro abre em 2 toques e um capítulo de outro livro em 3, com ou sem internet, depois da primeira visita (ajuste aprovado pelo usuário no Desenho, em 2026-11-14).
- [ ] Custo de infraestrutura de R$ 0 por mês, sem servidor de aplicação nem banco.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Busca, marcadores, destaques, histórico, compartilhamento | Candidatos à próxima feature do free, se o uso pedir (`solucao.md`) |
| Conta, login, sincronização, dado em servidor (Neon) | O free é sem conta; tudo fica no aparelho |
| Outras traduções | Só a Bíblia Livre nesta fase; licenciar outras tem custo desconhecido |
| Planos de leitura, versículo do dia, notificações, áudio | Fora do essencial da Opção A |
| Medição de uso (analytics, contador) | Decisão do usuário em 2026-11-14: não medir no MVP; a meta é o uso próprio |
| Área paga (estudo, anotações, redação) | Depende da validação V1 (`decisao.md`) |
| Links diretos para capítulo compartilháveis por URL | Não pedido; pode vir com o compartilhamento |
| App nativo de loja | O formato é PWA (`problema.md`) |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Tela da primeira visita | Escolha de livro | Decisão do usuário | y |
| Disposição dos versículos | Um por linha, número pequeno à esquerda | Decisão do usuário; o texto da fonte não tem marcação de parágrafo | y |
| Acréscimos do tradutor (trechos entre colchetes) | Itálico, sem os colchetes | Decisão do usuário; o "Sobre" explica o itálico | y |
| Medição de uso | Nenhuma no MVP | Decisão do usuário; elimina script de terceiro e a validação V4 | y |
| Seguinte no último capítulo de um livro | Abre o capítulo 1 do livro seguinte; em Apocalipse 22, o botão fica desativado | Leitura contínua, como num livro impresso | n |
| Anterior no capítulo 1 de um livro | Abre o último capítulo do livro anterior; em Gênesis 1, o botão fica desativado | Simetria com o seguinte | n |
| Livro de capítulo único (Obadias, Filemom, 2 João, 3 João, Judas) | Escolher o livro abre o capítulo 1 direto, sem grade | Mantém o "dois toques" sem uma grade de um número só | n |
| Toque no título do capítulo | Abre a grade de capítulos do livro atual, com "Trocar livro"; em livro de capítulo único, abre a lista de livros | Decisão do usuário no Desenho (2026-11-14): o mesmo livro em 2 toques, outro livro em 3 | y |
| Deslize para trocar de capítulo | Deslocamento horizontal de pelo menos 60 px e maior que o vertical; da direita para a esquerda = seguinte, da esquerda para a direita = anterior | Evita trocar de capítulo ao rolar a página; 60 px é o limiar comum de gesto | n |
| Tamanho da letra | 5 níveis (1 a 5), padrão 3 | Faixa suficiente para letra pequena a muito grande; valores em px ficam no Desenho | n |
| Tema padrão | Segue o tema do sistema (claro ou escuro) até a pessoa escolher | Respeita o aparelho sem pedir nada | n |
| Dados no aparelho | Só livro e capítulo atuais, tamanho da letra, tema e convite de instalação dispensado | Nada mais é necessário; nada sai do aparelho | n |
| Download para offline | O livro aberto é baixado primeiro; os outros 65 são guardados em segundo plano depois que o primeiro capítulo aparece | Evita pesar o primeiro carregamento (`viabilidade-tecnica.md`, incerteza 4) | n |
| Atualização do app | Nova versão ativada sem ação do usuário, valendo a partir da próxima abertura do app | Evita versão com defeito presa no aparelho sem interromper a leitura | n |
| Convite de instalação no iPhone e iPad | Faixa discreta com a instrução "Toque em Compartilhar e depois em Adicionar à Tela de Início", dispensável; depois de dispensada não volta | No Safari não instalado o cache é apagado após 7 dias sem uso (`viabilidade-tecnica.md`) | n |
| Hospedagem e segurança HTTP | Site estático na Cloudflare; não há requisição que mude estado, nem servidor próprio que escute porta ou valide `Host` | Itens de escuta local, guarda de origem e `Host` da regra de segurança web não se aplicam; cabeçalhos e saída escapada se aplicam (FUN-42, FUN-04) | n |

**Open questions:** none - all resolved or logged above (required before the spec is confirmed).

---

## User Stories

### P1: Ler um capítulo ⭐ MVP

**User Story**: Como leitor, quero ler um capítulo com letra confortável, um versículo por linha, para acompanhar o texto sem esforço.

**Why P1**: É o núcleo do produto.

**Acceptance Criteria**:

1. WHEN um capítulo é aberto THEN o sistema SHALL mostrar o título "<Livro> <capítulo>" (ex.: "Gênesis 1") e todos os versículos do capítulo, cada um em linha própria, precedido do seu número. (FUN-01)
2. WHEN um versículo contém um trecho entre colchetes na fonte THEN o sistema SHALL exibir esse trecho em itálico e sem os colchetes. (FUN-02)
3. The sistema SHALL exibir o texto de cada versículo igual ao de `.biblia/` (exceto a troca de colchetes por itálico), para os 66 livros e os 31.102 versículos. (FUN-03)
4. The sistema SHALL inserir o texto bíblico na página como texto, nunca como HTML interpretado. (FUN-04)
5. WHEN um capítulo é aberto THEN o sistema SHALL posicionar a leitura no início do capítulo. (FUN-05)

**Independent Test**: abrir Filemom 1 e conferir os 25 versículos, um por linha, com "[que está]" do versículo 2 em itálico e sem colchetes.

---

### P1: Navegar entre livros e capítulos ⭐ MVP

**User Story**: Como leitor, quero chegar a qualquer capítulo em dois toques e passar ao seguinte ou ao anterior com um toque ou deslizando, para ler sem me perder em menus.

**Why P1**: "Navegar em dois toques" é parte da definição de simples e amigável confirmada pelo dono.

**Acceptance Criteria**:

1. WHEN o leitor aciona "Trocar livro" ou a escolha de livro é aberta THEN o sistema SHALL mostrar os 66 livros na ordem canônica, separados em Antigo Testamento (39) e Novo Testamento (27). (FUN-06)
2. WHEN o leitor escolhe um livro com mais de um capítulo THEN o sistema SHALL mostrar uma grade com os números de 1 até o último capítulo desse livro. (FUN-07)
3. WHEN o leitor escolhe um número na grade de capítulos THEN o sistema SHALL abrir esse capítulo. (FUN-08)
4. WHEN o leitor escolhe um livro de capítulo único THEN o sistema SHALL abrir o capítulo 1 desse livro, sem mostrar a grade. (FUN-09)
5. WHEN o leitor aciona "seguinte" num capítulo que não é o último do livro THEN o sistema SHALL abrir o capítulo seguinte do mesmo livro. (FUN-10)
6. WHEN o leitor aciona "seguinte" no último capítulo de um livro que não é Apocalipse THEN o sistema SHALL abrir o capítulo 1 do livro seguinte. (FUN-11)
7. WHEN o leitor aciona "anterior" num capítulo que não é o primeiro do livro THEN o sistema SHALL abrir o capítulo anterior do mesmo livro. (FUN-12)
8. WHEN o leitor aciona "anterior" no capítulo 1 de um livro que não é Gênesis THEN o sistema SHALL abrir o último capítulo do livro anterior. (FUN-13)
9. WHILE Gênesis 1 está aberto o sistema SHALL manter "anterior" desativado. (FUN-14)
10. WHILE Apocalipse 22 está aberto o sistema SHALL manter "seguinte" desativado. (FUN-15)
11. WHEN o leitor desliza o dedo da direita para a esquerda, com deslocamento horizontal de pelo menos 60 px e maior que o vertical, THEN o sistema SHALL agir como "seguinte". (FUN-16)
12. WHEN o leitor desliza o dedo da esquerda para a direita, com deslocamento horizontal de pelo menos 60 px e maior que o vertical, THEN o sistema SHALL agir como "anterior". (FUN-17)
13. IF o deslocamento horizontal do gesto é menor que 60 px ou não é maior que o vertical THEN o sistema SHALL manter o capítulo atual. (FUN-18)
14. WHEN o leitor toca no título do capítulo de um livro com mais de um capítulo THEN o sistema SHALL mostrar a grade de capítulos desse livro, com a opção "Trocar livro". (FUN-49)
15. WHEN o leitor toca no título do capítulo de um livro de capítulo único THEN o sistema SHALL mostrar a escolha de livro. (FUN-50)

**Independent Test**: de Malaquias 4, tocar "seguinte" e ver Mateus 1; tocar no título e ver a grade de Mateus; tocar "Trocar livro", escolher Salmos e ver a grade de 1 a 150; escolher Judas e ver Judas 1 direto.

---

### P1: Retomar onde parou ⭐ MVP

**User Story**: Como leitor, quero que o app abra no último capítulo que li, para continuar sem procurar.

**Why P1**: "Abrir onde parou" é parte da definição de simples e amigável confirmada pelo dono.

**Acceptance Criteria**:

1. WHEN um capítulo é aberto THEN o sistema SHALL gravar no aparelho o livro e o capítulo. (FUN-19)
2. WHEN o app é aberto com um livro e capítulo gravados e válidos THEN o sistema SHALL abrir esse capítulo. (FUN-20)
3. WHEN o app é aberto sem leitura gravada THEN o sistema SHALL mostrar a escolha de livro. (FUN-21)
4. IF o valor gravado é ilegível, cita um livro inexistente ou um capítulo fora do intervalo do livro THEN o sistema SHALL apagar o valor gravado e mostrar a escolha de livro. (FUN-22)

**Independent Test**: abrir Romanos 8, fechar e reabrir o app, e ver Romanos 8.

---

### P1: Ajustar letra e tema ⭐ MVP

**User Story**: Como leitor, quero ajustar o tamanho da letra e escolher tema claro, escuro ou sépia, para ler com conforto de dia e de noite.

**Why P1**: Letra ajustável e os três temas fazem parte da definição confirmada pelo dono.

**Acceptance Criteria**:

1. The sistema SHALL oferecer 5 tamanhos de letra, numerados de 1 a 5, com o tamanho 3 como padrão. (FUN-23)
2. WHEN o leitor aciona "aumentar letra" num tamanho menor que 5 THEN o sistema SHALL passar ao tamanho seguinte e aplicá-lo ao texto na hora. (FUN-24)
3. WHEN o leitor aciona "diminuir letra" num tamanho maior que 1 THEN o sistema SHALL passar ao tamanho anterior e aplicá-lo ao texto na hora. (FUN-25)
4. WHILE o tamanho 5 está em uso o sistema SHALL manter "aumentar letra" desativado. (FUN-26)
5. WHILE o tamanho 1 está em uso o sistema SHALL manter "diminuir letra" desativado. (FUN-27)
6. WHEN o leitor escolhe o tema claro, escuro ou sépia THEN o sistema SHALL aplicá-lo na hora a toda a interface. (FUN-28)
7. WHILE nenhum tema foi escolhido o sistema SHALL usar o tema escuro quando o sistema operacional prefere escuro e o claro nos demais casos. (FUN-29)
8. WHEN o leitor muda o tamanho da letra ou o tema THEN o sistema SHALL gravar a escolha no aparelho e reaplicá-la nas próximas aberturas. (FUN-30)
9. IF a preferência gravada é ilegível ou fora dos valores válidos THEN o sistema SHALL usar o valor padrão dessa preferência. (FUN-31)
10. The sistema SHALL manter contraste de pelo menos 4,5:1 entre o texto bíblico e o fundo nos três temas. (FUN-32)

**Independent Test**: escolher sépia e tamanho 5, reabrir o app e ver sépia e tamanho 5, com "aumentar letra" desativado.

---

### P1: Ler sem internet ⭐ MVP

**User Story**: Como leitor, quero ler qualquer capítulo sem internet depois da primeira visita, para ler em qualquer lugar.

**Why P1**: Offline completo é parte da Opção A e o principal diferencial técnico.

**Acceptance Criteria**:

1. WHEN o primeiro capítulo aparece numa abertura com rede e o app ou algum dos 66 livros ainda não está guardado no aparelho THEN o sistema SHALL guardar em segundo plano o que falta. (FUN-33)
2. The sistema SHALL exibir o primeiro capítulo aberto depois de baixar só o app e o livro desse capítulo, sem esperar os outros livros. (FUN-34)
3. WHILE o aparelho está sem rede e os 66 livros já foram guardados o sistema SHALL abrir o app e exibir qualquer capítulo. (FUN-35)
4. IF o aparelho está sem rede e o livro escolhido ainda não foi guardado THEN o sistema SHALL mostrar a mensagem "Este livro ainda não foi baixado. Conecte-se à internet para lê-lo." e manter o seletor de livro disponível. (FUN-36)
5. WHEN uma nova versão do app é publicada e o app é aberto com rede THEN o sistema SHALL passar a usar a nova versão, no máximo na abertura seguinte, sem ação do leitor. (FUN-37)

**Independent Test**: abrir o app com rede, esperar o download, cortar a rede, reabrir e ler Apocalipse 22.

---

### P1: Sobre e privacidade ⭐ MVP

**User Story**: Como leitor, quero saber de onde vem o texto e que nada meu sai do aparelho, para confiar no app.

**Why P1**: A licença CC BY 4.0 exige atribuição; sem ela o app não pode ser publicado.

**Acceptance Criteria**:

1. WHEN o leitor abre a tela "Sobre" THEN o sistema SHALL mostrar o crédito da Bíblia Livre: nome e sigla (BLIVRE), autores (Diego Santos, Mario Sérgio e Marco Teles), data da versão (fevereiro de 2018), licença Creative Commons Atribuição 4.0 Brasil com link, link da fonte, a informação de que só o formato foi convertido e de que os autores não endossam o app. (FUN-38)
2. WHEN o leitor abre a tela "Sobre" THEN o sistema SHALL explicar que o itálico marca palavras acrescentadas pelos tradutores. (FUN-39)
3. WHEN o leitor abre a tela "Sobre" THEN o sistema SHALL informar que o app não tem conta e que as preferências e a leitura ficam só no aparelho. (FUN-40)
4. The sistema SHALL não fazer requisição a domínio diferente do próprio site e SHALL não gravar cookies. (FUN-41)

**Independent Test**: abrir "Sobre" e conferir os itens; navegar por 5 capítulos com as ferramentas do navegador abertas e ver zero requisições a outros domínios e zero cookies.

---

### P1: Segurança e acesso em qualquer tela ⭐ MVP

**User Story**: Como leitor, quero que o app funcione bem em qualquer tela e seja seguro, para usar no celular e no computador.

**Why P1**: Regra de segurança padrão de app web (`CLAUDE.md`) e uso no celular e no computador (`problema.md`).

**Acceptance Criteria**:

1. The sistema SHALL enviar em toda resposta os cabeçalhos `Content-Security-Policy` restrita à própria origem (sem `unsafe-inline` para scripts e com `frame-ancestors 'none'`), `X-Content-Type-Options: nosniff` e `Referrer-Policy: same-origin`. (FUN-42)
2. The sistema SHALL exibir o leitor sem rolagem horizontal em larguras de tela de 320 px a 1920 px. (FUN-43)
3. The sistema SHALL dar a todo botão sem texto visível um rótulo acessível em português (ex.: "Capítulo seguinte"). (FUN-44)

**Independent Test**: conferir os cabeçalhos da resposta de `/` e de um arquivo de livro; abrir em 320 px e em 1920 px sem barra de rolagem horizontal.

---

### P2: Instalar na tela inicial

**User Story**: Como leitor, quero instalar o app na tela inicial, para abri-lo como um app e não perder o offline.

**Why P2**: Reduz o risco de o Safari apagar o cache, mas o leitor funciona sem instalar.

**Acceptance Criteria**:

1. The sistema SHALL publicar um manifesto de web app com nome "MinhaJornada", ícones de 192 px e 512 px e exibição `standalone`, aceito como instalável pelo Chrome. (FUN-45)
2. WHEN o app é aberto no Safari de iPhone ou iPad, fora do modo instalado, e o convite não foi dispensado THEN o sistema SHALL mostrar o convite com a instrução "Toque em Compartilhar e depois em Adicionar à Tela de Início" e um botão para dispensar. (FUN-46)
3. WHEN o leitor dispensa o convite THEN o sistema SHALL escondê-lo e não mostrá-lo de novo nesse aparelho. (FUN-47)
4. WHILE o app roda instalado (modo `standalone`) o sistema SHALL não mostrar o convite. (FUN-48)

**Independent Test**: abrir no Safari do iPhone, ver o convite, dispensar, reabrir e não ver o convite.

---

## Edge Cases

- IF o capítulo tem muitos versículos (Salmos 119, 176 versículos) THEN o sistema SHALL exibir todos, na ordem, sem cortar. (coberto por FUN-01 e FUN-03)
- IF o armazenamento do aparelho é apagado pelo navegador THEN o sistema SHALL tratar a abertura como primeira visita. (coberto por FUN-21 e FUN-33)
- IF o download em segundo plano é interrompido no meio THEN o sistema SHALL completar os livros que faltam na próxima abertura com rede. (coberto por FUN-33)

---

## Requirement Traceability

| Requirement ID | Story | Critério | Tarefas | Status |
| -------------- | ----- | -------- | ----- | ------ |
| FUN-01 | P1: Ler um capítulo | 1 | T21, T22, T33 | Pending |
| FUN-02 | P1: Ler um capítulo | 2 | T5, T21, T33 | Pending |
| FUN-03 | P1: Ler um capítulo | 3 | T1, T2 | Pending |
| FUN-04 | P1: Ler um capítulo | 4 | T4, T21 | Pending |
| FUN-05 | P1: Ler um capítulo | 5 | T22 | Pending |
| FUN-06 | P1: Navegar | 1 | T2, T25, T33 | Pending |
| FUN-07 | P1: Navegar | 2 | T26, T33 | Pending |
| FUN-08 | P1: Navegar | 3 | T26, T33 | Pending |
| FUN-09 | P1: Navegar | 4 | T19, T26, T33 | Pending |
| FUN-10 | P1: Navegar | 5 | T6, T22, T33 | Pending |
| FUN-11 | P1: Navegar | 6 | T6, T22, T33 | Pending |
| FUN-12 | P1: Navegar | 7 | T6, T22, T33 | Pending |
| FUN-13 | P1: Navegar | 8 | T6, T22, T33 | Pending |
| FUN-14 | P1: Navegar | 9 | T6, T22, T33 | Pending |
| FUN-15 | P1: Navegar | 10 | T6, T22, T33 | Pending |
| FUN-16 | P1: Navegar | 11 | T8, T23, T33 | Pending |
| FUN-17 | P1: Navegar | 12 | T8, T23, T33 | Pending |
| FUN-18 | P1: Navegar | 13 | T8, T23, T33 | Pending |
| FUN-19 | P1: Retomar | 1 | T9, T20 | Pending |
| FUN-20 | P1: Retomar | 2 | T19, T31, T33 | Pending |
| FUN-21 | P1: Retomar | 3 | T19, T31, T33 | Pending |
| FUN-22 | P1: Retomar | 4 | T7, T9 | Pending |
| FUN-23 | P1: Letra e tema | 1 | T9, T19 | Pending |
| FUN-24 | P1: Letra e tema | 2 | T19, T24 | Pending |
| FUN-25 | P1: Letra e tema | 3 | T19, T24 | Pending |
| FUN-26 | P1: Letra e tema | 4 | T19, T24 | Pending |
| FUN-27 | P1: Letra e tema | 5 | T19, T24 | Pending |
| FUN-28 | P1: Letra e tema | 6 | T20, T24 | Pending |
| FUN-29 | P1: Letra e tema | 7 | T15, T35 | Pending |
| FUN-30 | P1: Letra e tema | 8 | T9, T20, T35 | Pending |
| FUN-31 | P1: Letra e tema | 9 | T9 | Pending |
| FUN-32 | P1: Letra e tema | 10 | T15 | Pending |
| FUN-33 | P1: Sem internet | 1 | T11, T12, T20, T34 | Pending |
| FUN-34 | P1: Sem internet | 2 | T10, T34 | Pending |
| FUN-35 | P1: Sem internet | 3 | T13, T34 | Pending |
| FUN-36 | P1: Sem internet | 4 | T10, T17, T18, T28, T34 | Pending |
| FUN-37 | P1: Sem internet | 5 | T12, T14 | Pending |
| FUN-38 | P1: Sobre | 1 | T27 | Pending |
| FUN-39 | P1: Sobre | 2 | T27 | Pending |
| FUN-40 | P1: Sobre | 3 | T27 | Pending |
| FUN-41 | P1: Sobre | 4 | T4, T15, T34 | Pending |
| FUN-42 | P1: Segurança e acesso | 1 | T3 | Pending |
| FUN-43 | P1: Segurança e acesso | 2 | T35 | Pending |
| FUN-44 | P1: Segurança e acesso | 3 | T16, T35 | Pending |
| FUN-45 | P2: Instalar | 1 | T32 | Pending |
| FUN-46 | P2: Instalar | 2 | T29, T30 | Pending |
| FUN-47 | P2: Instalar | 3 | T9, T30 | Pending |
| FUN-48 | P2: Instalar | 4 | T29, T30 | Pending |
| FUN-49 | P1: Navegar | 14 | T19, T22, T26, T33 | Pending |
| FUN-50 | P1: Navegar | 15 | T19, T22, T26, T33 | Pending |

**ID format:** `FUN-NN`

**Coverage:** 50 total, 50 mapped to tasks, 0 unmapped

---

## Success Criteria

- [ ] O dono usa o MinhaJornada como leitor principal por 4 semanas seguidas depois da publicação (autodeclarado; sem medição no app).
- [ ] Os 31.102 versículos dos 66 livros aparecem iguais à fonte, conferidos por teste automatizado.
- [ ] Com o aparelho sem rede, qualquer capítulo abre depois da primeira visita completa.
- [ ] Zero requisições a domínios de terceiros e zero cookies.
- [ ] Custo mensal de infraestrutura de R$ 0.
