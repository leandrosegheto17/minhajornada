# Especificação: Página inicial, modo livro e barra de título

- **Base**: print do usuário (página inicial, modo livro com capa, plano pago, barra de título) e respostas em 2026-11-17; spec do `leitor` (`.specs/features/leitor/spec.md`)
- **Tamanho**: Large (várias telas novas, paginação dinâmica, altera requisitos existentes)
- **Aprovação**: spec aprovada pelo usuário em 2026-11-17, com as premissas da tabela abaixo (inclui a mudança dos testes de FUN-20 e FUN-21)

## Problem Statement

O leitor abre direto no texto e só tem o formato de rolagem por capítulo. O dono quer uma porta de entrada com cara de produto (imagem de evangelismo, "Ler Bíblia" e "Criar conta"), a opção de ler como um livro, passando página, e um lugar fixo no topo de todas as telas para as funcionalidades que virão. A capa do modo livro também passa a apresentar o plano pago, que ainda não existe.

## Goals

- [ ] Toda abertura do app mostra a página inicial, e "Ler Bíblia" leva à leitura em 1 toque, no ponto onde a pessoa parou.
- [ ] A pessoa alterna entre rolagem e livro em 1 toque, em qualquer tela de leitura, sem perder o capítulo.
- [ ] O app continua sem conta, sem servidor, offline e sem requisição a terceiros (FUN-33 a FUN-36 e FUN-41 continuam valendo).

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Conta, login, cadastro, banco (Neon) | Decisão do usuário em 2026-11-17: só a interface free; o pago vira linhas do roteiro |
| Tela do plano pago (Bíblia ao lado do editor de anotações) | Depende de conta e do pago (`decisao.md`, validação V1); entra no roteiro |
| Editor de anotações, mesmo só no aparelho | Faz parte do pago |
| Preço, assinatura, pagamento | Pago ainda não validado |
| Capa própria para cada um dos 66 livros | Decisão do usuário: uma capa só, da Bíblia |
| Atalhos de teclado para passar página | Não pedido |
| Animação de virar página | Não pedida; a troca de página é imediata |
| Busca por palavra ou referência | Fora do free atual (spec do `leitor`); "busca facilitada" do print é o seletor de livro e capítulo que já existe |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Escopo do pago | Só a interface free; "Criar conta" e "Entrar" levam a uma tela "em breve" | Decisão do usuário em 2026-11-17 | y |
| Abertura do app | Sempre a página inicial; "Ler Bíblia" abre o ponto gravado ou, sem leitura gravada, a escolha de livro (rolagem) ou a capa (livro) | Decisão do usuário em 2026-11-17; altera FUN-20 e FUN-21 | y |
| Modo livro no celular | 1 página em tela estreita, 2 páginas lado a lado em tela larga | Decisão do usuário em 2026-11-17 | y |
| Limite entre tela estreita e larga | Larga quando a área visível tem pelo menos 900 px de largura e é mais larga que alta | Duas colunas de texto confortável pedem ~420 px cada; o valor exato pode ser ajustado no mockup | n |
| Imagem de fundo da página inicial | Foto de licença livre (Unsplash ou Pexels), escolhida no mockup, salva no próprio site, com o crédito registrado no "Sobre" | Decisão do usuário em 2026-11-17; FUN-41 proíbe outros domínios | y |
| Escolha do formato | Botão "Rolagem / Livro" na barra de título, gravado no aparelho; padrão: rolagem | Decisão do usuário em 2026-11-17 | y |
| Capa | Uma capa só, da Bíblia, antes de Gênesis 1 | Decisão do usuário em 2026-11-17 | y |
| Ida a um capítulo no modo livro | O seletor de hoje (título, grade, "Trocar livro"); escolher um capítulo abre a página onde ele começa | Decisão do usuário em 2026-11-17 | y |
| Itens da barra de título | Marca (vai à inicial), "Rolagem / Livro", "Aa" (letra e tema), "Entrar / Criar conta" | Decisão do usuário em 2026-11-17 | y |
| "Sobre" na barra | Continua na barra, como hoje | O usuário não o marcou, mas o crédito da Bíblia Livre (FUN-38) é exigido pela licença CC BY 4.0 e precisa de acesso em qualquer tela | n |
| Barra em 320 px | "Entrar / Criar conta" vira ícone com rótulo acessível em telas estreitas | Cabe na largura mínima sem rolagem horizontal (FUN-43) | n |
| Ordem da capa em tela estreita | A capa aparece primeiro; avançar mostra o texto do plano pago e depois Gênesis 1 | Na tela larga o texto fica à esquerda e a capa à direita (print); na estreita a capa é o que identifica o livro | n |
| Texto do plano pago na capa | Rascunho: "Em breve, o plano de estudo: suas anotações ao lado do texto, estudos e o preparo de pregações e aulas, guardados na sua conta." Texto final no mockup | O print pede um texto sobre o que tem no pago; não há preço nem data | n |
| Corte de página | Página nunca corta um versículo ao meio, salvo um versículo maior que a página inteira, que continua na seguinte | Leitura mais limpa; o versículo gigante é raro, mas não pode sumir | n |
| Início de livro bíblico | Cada livro começa no topo de uma página nova, com o nome do livro; cada capítulo leva o número dele antes do primeiro versículo | Como num livro impresso | n |
| Ponto gravado no modo livro | Continua livro e capítulo: o capítulo do primeiro versículo da página (a da esquerda, em tela larga) | Mantém o formato de FUN-19 e permite trocar de formato sem perder o lugar | n |
| Troca de letra, tema ou tamanho da tela no modo livro | Repagina e mostra a página que contém o primeiro versículo que estava visível | Evita perder o lugar | n |
| Título no modo livro | Mostra "<Livro> <capítulo>" do primeiro versículo da página (da esquerda); o toque abre a grade, como FUN-49 e FUN-50 | Reaproveita o seletor de hoje | n |
| Passar página em tela larga | Seguinte e anterior avançam e voltam 2 páginas (o par) | Comportamento de livro aberto | n |
| Gesto no modo livro | O mesmo de FUN-16 a FUN-18 (60 px e horizontal maior que o vertical), passando página em vez de capítulo | Mesmo gesto já aprendido | n |
| Modo livro sem rede, livro não baixado | Mesma mensagem de FUN-36 no lugar da página | Reaproveita a regra existente | n |
| Testes existentes de FUN-20 e FUN-21 | Mudam para a nova regra de abertura; esta spec aprovada é a aprovação da mudança | Regra de Testes do `CLAUDE.md`: mudar teste existente exige aprovação | n |

**Open questions:** none - all resolved or logged above (required before the spec is confirmed).

---

## Requisitos alterados da spec do `leitor`

| Requisito | Antes | Agora |
| --------- | ----- | ----- |
| FUN-20 | Abre o app no capítulo gravado | Substituído por FUN-51 e FUN-54 |
| FUN-21 | Sem leitura gravada, abre a escolha de livro | Substituído por FUN-51 e FUN-55 |
| FUN-22 | Valor gravado inválido: apaga e mostra a escolha de livro | Continua, acionado por "Ler Bíblia" em vez da abertura |

Os demais FUN-01 a FUN-50 continuam valendo no formato de rolagem; FUN-01 a FUN-04, FUN-06 a FUN-09, FUN-23 a FUN-44 valem também no modo livro.

---

## User Stories

### P1: Página inicial ⭐ MVP

**User Story**: Como visitante, quero uma página de entrada clara, com uma imagem que remeta ao evangelismo e as opções de ler ou criar conta, para entender o app e começar em um toque.

**Why P1**: É a porta de entrada pedida no print e muda a abertura do app.

**Acceptance Criteria**:

1. WHEN o app é aberto THEN o sistema SHALL mostrar a página inicial, com ou sem leitura gravada. (FUN-51)
2. WHILE a página inicial está aberta o sistema SHALL mostrar a imagem de fundo ocupando toda a área abaixo da barra de título e um cartão à direita com os botões "Ler Bíblia" e "Criar conta". (FUN-52)
3. WHILE a página inicial está aberta numa tela estreita o sistema SHALL mostrar o cartão sobre a imagem, centralizado, sem rolagem horizontal. (FUN-53)
4. WHEN o leitor aciona "Ler Bíblia" com livro e capítulo gravados e válidos THEN o sistema SHALL abrir esse capítulo no formato gravado. (FUN-54)
5. WHEN o leitor aciona "Ler Bíblia" sem leitura gravada THEN o sistema SHALL mostrar a escolha de livro no formato rolagem e a capa no formato livro. (FUN-55)
6. IF a leitura gravada é inválida quando o leitor aciona "Ler Bíblia" THEN o sistema SHALL apagá-la e agir como sem leitura gravada. (FUN-56)
7. WHEN o leitor aciona "Criar conta" ou "Entrar / Criar conta" THEN o sistema SHALL mostrar a tela "em breve", que informa que a conta e o plano de estudo ainda não estão disponíveis e oferece "Voltar". (FUN-57)
8. The sistema SHALL servir a imagem de fundo pelo próprio site e guardá-la para uso sem rede junto com o app. (FUN-58)
9. The sistema SHALL dar à imagem de fundo um texto alternativo em português e manter contraste de pelo menos 4,5:1 entre o texto do cartão e o fundo do cartão, nos três temas. (FUN-59)

**Independent Test**: ler Romanos 8, fechar e reabrir o app, ver a página inicial, tocar "Ler Bíblia" e ver Romanos 8; tocar "Criar conta" e ver a tela "em breve".

---

### P1: Barra de título em todas as telas ⭐ MVP

**User Story**: Como leitor, quero uma barra fixa no topo de todas as telas, para chegar às funções do app de qualquer lugar.

**Why P1**: Pedido do print ("em todas as telas pode ter uma barra de título").

**Acceptance Criteria**:

1. The sistema SHALL mostrar a barra de título no topo da página inicial, da escolha de livro, da grade de capítulos, do leitor nos dois formatos, do "Sobre" e da tela "em breve". (FUN-60)
2. The sistema SHALL mostrar na barra, nesta ordem: a marca "MinhaJornada", o botão de formato, o botão "Aa", o botão "Sobre" e o botão "Entrar / Criar conta". (FUN-61)
3. WHEN o leitor toca na marca THEN o sistema SHALL mostrar a página inicial. (FUN-62)
4. WHEN o leitor toca em "Aa" THEN o sistema SHALL abrir o ajuste de letra e tema que existe hoje (FUN-23 a FUN-31). (FUN-63)
5. WHILE a tela tem menos de 480 px de largura o sistema SHALL mostrar "Entrar / Criar conta" só como ícone, com rótulo acessível "Entrar ou criar conta". (FUN-64)
6. The sistema SHALL manter a barra visível no topo enquanto o conteúdo rola. (FUN-65)

**Independent Test**: percorrer as sete telas e ver a barra em todas; em 320 px, ver a barra inteira sem rolagem horizontal.

---

### P1: Escolher o formato de leitura ⭐ MVP

**User Story**: Como leitor, quero alternar entre rolagem e livro, para ler do jeito que preferir naquele momento.

**Why P1**: O print pede os dois formatos no free.

**Acceptance Criteria**:

1. The sistema SHALL oferecer os formatos "Rolagem" e "Livro", com "Rolagem" como padrão. (FUN-66)
2. WHEN o leitor aciona o botão de formato THEN o sistema SHALL trocar para o outro formato na hora. (FUN-67)
3. WHEN o leitor troca de formato THEN o sistema SHALL gravar a escolha no aparelho e usá-la nas próximas aberturas da leitura. (FUN-68)
4. IF o formato gravado é ilegível ou desconhecido THEN o sistema SHALL usar "Rolagem". (FUN-69)
5. WHEN o leitor troca de rolagem para livro com um capítulo aberto THEN o sistema SHALL mostrar a página onde esse capítulo começa. (FUN-70)
6. WHEN o leitor troca de livro para rolagem THEN o sistema SHALL abrir o capítulo do primeiro versículo da página atual (a da esquerda, em tela larga), ou a escolha de livro se a capa estiver aberta. (FUN-71)
7. The sistema SHALL mostrar no botão de formato o rótulo acessível do formato para o qual ele troca ("Ler como livro" ou "Ler em rolagem"). (FUN-72)

**Independent Test**: em João 3 na rolagem, trocar para livro e ver a página com João 3; passar duas páginas, trocar para rolagem e ver o capítulo da página; reabrir o app, tocar "Ler Bíblia" e ver o modo livro.

---

### P1: Ler como livro ⭐ MVP

**User Story**: Como leitor, quero ler a Bíblia como um livro, passando e voltando páginas, para ter a sensação de folhear.

**Why P1**: É o centro do print.

**Acceptance Criteria**:

1. WHILE o formato livro está ativo numa tela larga (pelo menos 900 px de largura e mais larga que alta) o sistema SHALL mostrar duas páginas lado a lado. (FUN-73)
2. WHILE o formato livro está ativo numa tela estreita o sistema SHALL mostrar uma página. (FUN-74)
3. The sistema SHALL encher cada página com versículos inteiros, na ordem, sem rolagem dentro da página, e só dividir um versículo quando ele sozinho não cabe numa página. (FUN-75)
4. The sistema SHALL começar cada livro bíblico no topo de uma página nova, com o nome do livro, e mostrar o número do capítulo antes do primeiro versículo de cada capítulo. (FUN-76)
5. WHEN o leitor aciona "seguinte" THEN o sistema SHALL mostrar a página seguinte (o par seguinte, em tela larga). (FUN-77)
6. WHEN o leitor aciona "anterior" THEN o sistema SHALL mostrar a página anterior (o par anterior, em tela larga). (FUN-78)
7. WHEN o leitor desliza o dedo com deslocamento horizontal de pelo menos 60 px e maior que o vertical THEN o sistema SHALL agir como "seguinte" (direita para a esquerda) ou "anterior" (esquerda para a direita). (FUN-79)
8. IF o deslocamento horizontal do gesto é menor que 60 px ou não é maior que o vertical THEN o sistema SHALL manter a página atual. (FUN-80)
9. WHILE a última página de Apocalipse está visível o sistema SHALL manter "seguinte" desativado. (FUN-81)
10. WHEN o leitor aciona "seguinte" na última página de um livro que não é Apocalipse THEN o sistema SHALL mostrar a primeira página do livro seguinte. (FUN-82)
11. WHEN o leitor escolhe um capítulo pela grade ou pela escolha de livro no formato livro THEN o sistema SHALL mostrar a página onde esse capítulo começa. (FUN-83)
12. WHILE o formato livro está ativo o sistema SHALL mostrar no título "<Livro> <capítulo>" do primeiro versículo da página (a da esquerda, em tela larga), e o toque no título SHALL agir como FUN-49 e FUN-50. (FUN-84)
13. WHEN a página mostrada muda THEN o sistema SHALL gravar no aparelho o livro e o capítulo do primeiro versículo da página (a da esquerda, em tela larga). (FUN-85)
14. WHEN o tamanho da letra, o tema ou o tamanho da tela muda no formato livro THEN o sistema SHALL repaginar e mostrar a página que contém o primeiro versículo que estava visível. (FUN-86)
15. IF o aparelho está sem rede e o livro da página seguinte ou anterior ainda não foi guardado THEN o sistema SHALL mostrar a mensagem de FUN-36 no lugar da página e manter o seletor de livro disponível. (FUN-87)

**Independent Test**: em tela de 1280 × 800, abrir Rute no modo livro, ver duas páginas, passar até a última e ver 1 Samuel começar no topo de página nova; em 375 px, ver uma página e passar com o deslize.

---

### P1: Capa com o plano pago ⭐ MVP

**User Story**: Como leitor, quero que o modo livro comece por uma capa que me apresente o plano pago, para saber o que vem por aí.

**Why P1**: O print pede a capa com o texto do pago.

**Acceptance Criteria**:

1. WHEN o leitor aciona "anterior" na primeira página de Gênesis THEN o sistema SHALL mostrar a capa. (FUN-88)
2. WHILE a capa está aberta numa tela larga o sistema SHALL mostrar à esquerda o texto sobre o plano pago e à direita a capa com "Bíblia Sagrada", "Bíblia Livre" e "MinhaJornada". (FUN-89)
3. WHILE a capa está aberta numa tela estreita o sistema SHALL mostrar a capa primeiro e, com "seguinte", o texto sobre o plano pago, e com outro "seguinte" a primeira página de Gênesis. (FUN-90)
4. WHILE a capa está aberta o sistema SHALL manter "anterior" desativado. (FUN-91)
5. The sistema SHALL incluir no texto do plano pago a informação de que ele ainda não está disponível e um botão "Quero saber" que leva à tela "em breve". (FUN-92)

**Independent Test**: no modo livro, abrir Gênesis 1, tocar "anterior", ver a capa com o texto do pago ao lado e "anterior" desativado.

---

## Edge Cases

- IF a pessoa nunca leu e abre o modo livro THEN o sistema SHALL mostrar a capa (coberto por FUN-55).
- IF o capítulo é muito longo (Salmos 119) THEN o sistema SHALL espalhá-lo por várias páginas sem perder versículo (coberto por FUN-75).
- IF a tela gira de retrato para paisagem no modo livro THEN o sistema SHALL repaginar sem perder o lugar (coberto por FUN-86).
- IF a imagem de fundo não carrega THEN o sistema SHALL mostrar a página inicial com a cor de fundo do tema e o cartão legível (coberto por FUN-59).

Varredura de requisitos implícitos (Large): validação de entrada coberta por FUN-56 e FUN-69; falha parcial coberta por FUN-87 e pelo caso da imagem; idempotência, concorrência, limites de taxa e autorização N/A porque não há servidor, conta nem escrita fora do aparelho; ciclo de vida do dado coberto por FUN-68 e FUN-85 (só preferências locais); observabilidade N/A porque o app não mede uso (decisão da spec do `leitor`); dependência externa coberta por FUN-58; integridade de estado coberta por FUN-81, FUN-88 e FUN-91.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| FUN-51 | P1: Página inicial | Design | Pending |
| FUN-52 | P1: Página inicial | Design | Pending |
| FUN-53 | P1: Página inicial | Design | Pending |
| FUN-54 | P1: Página inicial | Design | Pending |
| FUN-55 | P1: Página inicial | Design | Pending |
| FUN-56 | P1: Página inicial | Design | Pending |
| FUN-57 | P1: Página inicial | Design | Pending |
| FUN-58 | P1: Página inicial | Design | Pending |
| FUN-59 | P1: Página inicial | Design | Pending |
| FUN-60 | P1: Barra de título | Design | Pending |
| FUN-61 | P1: Barra de título | Design | Pending |
| FUN-62 | P1: Barra de título | Design | Pending |
| FUN-63 | P1: Barra de título | Design | Pending |
| FUN-64 | P1: Barra de título | Design | Pending |
| FUN-65 | P1: Barra de título | Design | Pending |
| FUN-66 | P1: Formato | Design | Pending |
| FUN-67 | P1: Formato | Design | Pending |
| FUN-68 | P1: Formato | Design | Pending |
| FUN-69 | P1: Formato | Design | Pending |
| FUN-70 | P1: Formato | Design | Pending |
| FUN-71 | P1: Formato | Design | Pending |
| FUN-72 | P1: Formato | Design | Pending |
| FUN-73 | P1: Ler como livro | Design | Pending |
| FUN-74 | P1: Ler como livro | Design | Pending |
| FUN-75 | P1: Ler como livro | Design | Pending |
| FUN-76 | P1: Ler como livro | Design | Pending |
| FUN-77 | P1: Ler como livro | Design | Pending |
| FUN-78 | P1: Ler como livro | Design | Pending |
| FUN-79 | P1: Ler como livro | Design | Pending |
| FUN-80 | P1: Ler como livro | Design | Pending |
| FUN-81 | P1: Ler como livro | Design | Pending |
| FUN-82 | P1: Ler como livro | Design | Pending |
| FUN-83 | P1: Ler como livro | Design | Pending |
| FUN-84 | P1: Ler como livro | Design | Pending |
| FUN-85 | P1: Ler como livro | Design | Pending |
| FUN-86 | P1: Ler como livro | Design | Pending |
| FUN-87 | P1: Ler como livro | Design | Pending |
| FUN-88 | P1: Capa | Design | Pending |
| FUN-89 | P1: Capa | Design | Pending |
| FUN-90 | P1: Capa | Design | Pending |
| FUN-91 | P1: Capa | Design | Pending |
| FUN-92 | P1: Capa | Design | Pending |

**ID format:** `FUN-NN` (continua a numeração da spec do `leitor`)

**Coverage:** 42 total, 0 mapped to tasks, 42 unmapped ⚠️

---

## Success Criteria

- [ ] Da abertura do app ao último capítulo lido em 1 toque ("Ler Bíblia").
- [ ] Troca de formato sem perder o capítulo, conferida por teste automatizado nos dois sentidos.
- [ ] Nenhum versículo some ou se repete na paginação dos 66 livros, conferido por teste automatizado.
- [ ] Zero requisições a outros domínios e zero cookies, com a imagem de fundo incluída.
- [ ] Sem rolagem horizontal de 320 px a 1920 px em todas as telas novas.
