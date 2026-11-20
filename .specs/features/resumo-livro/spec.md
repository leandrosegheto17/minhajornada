# Resumo do livro: especificação

**Data**: 2026-11-19 · **Origem**: roteiro (feature 6, AD-019 e AD-020) e as decisões do dono em 2026-11-19 nesta conversa · **Requisitos**: FUN-137 a FUN-176

## Problem Statement

O dono quer, no modo livro, ler a Bíblia na página da esquerda e o resumo do livro aberto na da direita. O resumo é escrito com IA e revisado por ele, e é o primeiro recurso do plano pago. Até existir a assinatura, só o dono pode vê-lo. O app hoje é estático, sem servidor, banco nem login (AD-001), e o repositório no GitHub é público. Por isso o texto pago não pode ir no pacote do site nem no git.

## Goals

- [ ] O dono entra com e-mail e senha e, no modo livro, liga o resumo do livro aberto: à direita na tela larga, alternando com a Bíblia na tela estreita.
- [ ] Quem não é o dono não recebe o texto de nenhum resumo, nem pelo site, nem pela API, nem pelo repositório.
- [ ] Os resumos de Gênesis, Rute, Marcos e Romanos estão revisados e publicados no tst.
- [ ] O caminho escrever, revisar e publicar serve para os outros 62 livros sem código novo.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Cadastro, recuperação e troca de senha, "Criar conta" de verdade | Feature 8 (`conta`); nesta, o único usuário é o dono, criado por script |
| Assinatura, cobrança, outros usuários vendo o resumo | Feature 9 (`assinatura`, AD-020) |
| Resumo guardado para ler sem internet | Decisão do dono em 2026-11-19: entra com a assinatura (AD-020) |
| Toque na referência levando ao versículo | Decisão do dono em 2026-11-19: as referências são só texto; o link pode vir com o estudo (feature 7) |
| Resumo no modo rolagem | O pedido é do modo livro (AD-019) |
| Resumos dos outros 62 livros | O piloto é de 4 livros; os outros seguem o mesmo caminho depois, sem código novo |
| Estudo e editor na página da direita | Features 7 e 10 |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Como só o dono vê | Padrão dos projetos irmãos: Worker com Hono em `/api/*`, sessão própria em cookie com o hash do token no Neon e coluna `dono` no usuário, ligada só por script | Decisão do dono ("siga o padrão dos outros projetos"); levantamento de 2026-11-19 (treInAmento, ControleEmCasa_LJS, EvolucaoSegura_LJS, GestaoDaPelada_v2) | y |
| Login nesta feature | Só entrar e sair, para o usuário dono; sem cadastro | Decisão do dono em 2026-11-19; a `conta` (8) estende | y |
| Onde mora o texto | Só no banco (Neon) e no artifact de revisão; no git só código, formato e textos de exemplo | O repositório é público; decisão do dono em 2026-11-19 | y |
| Botão da barra | "Entrar / Criar conta" passa a abrir o login com e-mail e senha; "Criar conta" na tela inicial segue no "em breve" | Decisão do dono em 2026-11-19 | y |
| Duração da sessão | 30 dias corridos, encerrada antes por 7 dias sem uso | Decisão do dono em 2026-11-19 | y |
| Sem internet | Resumo só com rede, sem cache no aparelho | Decisão do dono em 2026-11-19 | y |
| Tela estreita | Botão "Resumo" alterna a página mostrada entre a Bíblia e o resumo | Decisão do dono em 2026-11-19 | y |
| Tela larga | Botão "Resumo" liga e desliga; ligado, a Bíblia ocupa só a página da esquerda e passa uma página por vez; desligado, volta às duas páginas | Decisão do dono em 2026-11-19 | y |
| Seções do resumo | Contexto, Mensagem central, Divisão do livro e Versículos-chave, nessa ordem | Decisão do dono em 2026-11-19 | y |
| Tamanho | De 300 a 450 palavras no texto das quatro seções | Decisão do dono em 2026-11-19 ("cerca de 1 página") | y |
| Versículos-chave | Cada um com a referência e uma frase própria do resumo dizendo por que importa; o texto do versículo não é copiado | Evita duplicar o texto bíblico e o mantém igual ao da Bíblia mostrada à esquerda | n |
| Revisão | Artifact privado com banco, como a do texto (AD-017): por livro, aprovar, recusar com nota ou editar e aprovar | Decisão do dono em 2026-11-19 ("piloto + artifact") | y |
| Piloto | Gênesis, Rute, Marcos e Romanos | Decisão do dono em 2026-11-19 | y |
| Publicação | Um script lê o arquivo exportado da revisão (pasta ignorada pelo git), valida e grava os aprovados no Neon do ambiente pedido; produção só com confirmação | O texto não pode passar pelo git; regra de ação externa do `CLAUDE.md` | n |
| Livro sem resumo publicado | Com o resumo ligado, a página do resumo mostra "Este livro ainda não tem resumo." | Os 62 livros fora do piloto ficam assim por um tempo | n |
| Onde fica o botão "Resumo" | No modo livro, junto do botão de formato da barra de título; posição final no mockup | A barra já reúne os controles do modo livro (`src/componentes/BarraTitulo.tsx:53-61`) | n |
| Resumo maior que uma página | A página do resumo tem o próprio "anterior" e "seguinte", separado do folhear da Bíblia | Com letra grande, 450 palavras passam de uma página | n |
| Capa e página do plano pago | Com o resumo ligado, a capa e o plano pago (FUN-89, FUN-90) aparecem como hoje; o resumo só aparece com um livro aberto | O resumo é do livro, e a capa não é de nenhum livro | n |
| Limite de tentativas de login | 5 tentativas por minuto por IP; a 6ª recebe 429 | Padrão do treInAmento (Rate Limiting do Worker) | n |

**Open questions:** none - all resolved or logged above (required before the spec is confirmed).

---

## User Stories

### P1: Entrar e sair como dono ⭐ MVP

**User Story**: Como dono, quero entrar com meu e-mail e senha no app publicado, para ver no celular e no PC o que só eu posso ver.

**Why P1**: Sem login não há como mostrar o resumo só ao dono fora da máquina dele.

**Acceptance Criteria** (each line is one EARS pattern):

1. WHEN o leitor toca "Entrar / Criar conta" na barra de título THEN o sistema SHALL abrir a tela "Entrar", com e-mail, senha, o botão "Entrar" e o link "Criar conta" para a tela "em breve". (FUN-137)
2. WHEN o dono envia e-mail e senha corretos THEN o sistema SHALL criar uma sessão, gravar o cookie `__Host-sessao` (HttpOnly, Secure, SameSite=Lax, Path=/) e voltar à tela de onde o login foi aberto. (FUN-138)
3. IF o e-mail não existe, a senha está errada ou um dos campos está vazio THEN o sistema SHALL mostrar "E-mail ou senha incorretos." e não criar sessão, com a mesma resposta nos três casos. (FUN-139)
4. IF o mesmo IP faz mais de 5 tentativas de login em 1 minuto THEN o sistema SHALL responder 429 e mostrar "Muitas tentativas. Tente de novo em 1 minuto." (FUN-140)
5. The sistema SHALL guardar no banco só o hash SHA-256 do token da sessão e só o hash da senha (bcrypt), nunca o token nem a senha. (FUN-141)
6. WHILE há sessão o sistema SHALL mostrar na barra de título "Sair" no lugar de "Entrar / Criar conta". (FUN-142)
7. WHEN o dono toca "Sair" THEN o sistema SHALL apagar a sessão no banco, expirar o cookie e esconder o botão "Resumo" e qualquer resumo na tela. (FUN-143)
8. IF a sessão passou de 30 dias desde a criação ou de 7 dias desde o último uso THEN o sistema SHALL tratá-la como inexistente e apagá-la do banco. (FUN-144)
9. WHEN uma chamada à API recebe 401 com o app aberto THEN o sistema SHALL voltar ao estado sem sessão (FUN-143) sem mostrar erro. (FUN-145)

**Independent Test**: No tst, entrar com o usuário dono, ver "Sair" na barra, recarregar e continuar entrado; tocar "Sair" e ver "Entrar / Criar conta" de novo; tentar uma senha errada e ver a mensagem.

---

### P1: Resumo só para o dono ⭐ MVP

**User Story**: Como dono, quero que o texto do resumo só saia do servidor para mim, para que o conteúdo pago não vaze antes da assinatura.

**Why P1**: É a restrição da AD-019 e a razão de existir o servidor.

**Acceptance Criteria**:

1. WHEN uma sessão de dono pede `GET /api/resumos/<n>` de um livro (1 a 66) com resumo publicado THEN o sistema SHALL responder 200 com as quatro seções do resumo em JSON. (FUN-146)
2. IF a requisição a `/api/resumos/<n>` não tem sessão válida THEN o sistema SHALL responder 401 sem texto de resumo. (FUN-147)
3. IF a sessão é de um usuário sem a marca `dono` THEN o sistema SHALL responder 403 sem texto de resumo. (FUN-148)
4. IF o livro não tem resumo publicado THEN o sistema SHALL responder 404 a uma sessão de dono. (FUN-149)
5. IF `<n>` não é um inteiro de 1 a 66 THEN o sistema SHALL responder 400. (FUN-150)
6. The sistema SHALL responder às rotas `/api/*` com `Cache-Control: no-store`, e o service worker SHALL não guardar nenhuma resposta de `/api/*`. (FUN-151)
7. The sistema SHALL não ter texto de resumo real em nenhum arquivo do pacote publicado (`dist/`) nem do repositório; os testes usam só textos de exemplo. (FUN-152)

**Independent Test**: Com e sem o cookie de dono, chamar `/api/resumos/1` e conferir 200, 401 e 403; procurar uma frase do resumo real de Gênesis em `dist/` e no `git grep` e não achar.

---

### P1: Resumo na página da direita (tela larga) ⭐ MVP

**User Story**: Como dono no PC, quero ligar o resumo do livro aberto na página da direita, para ler a Bíblia à esquerda com o resumo ao lado.

**Why P1**: É a entrega principal da feature (AD-019).

**Acceptance Criteria**:

1. WHILE há sessão de dono e um livro está aberto no modo livro o sistema SHALL mostrar o botão "Resumo"; sem sessão de dono, o botão não existe na tela. (FUN-153)
2. WHEN o dono liga o resumo na tela larga THEN o sistema SHALL mostrar a Bíblia só na página da esquerda e o resumo do livro aberto na da direita, com o vão e a linha de FUN-133 e FUN-134. (FUN-154)
3. WHILE o resumo está ligado na tela larga, WHEN o leitor avança ou volta THEN o sistema SHALL passar uma página da Bíblia por vez, com a regra de capítulo em página nova (FUN-128) e sem mudar o resumo da direita. (FUN-155)
4. WHEN o dono desliga o resumo na tela larga THEN o sistema SHALL voltar às duas páginas da Bíblia, mostrando a página do primeiro versículo que estava à esquerda. (FUN-156)
5. The sistema SHALL guardar no aparelho se o resumo está ligado e reabrir o modo livro do mesmo jeito. (FUN-157)
6. WHEN o leitor troca de livro com o resumo ligado THEN o sistema SHALL mostrar à direita o resumo do livro novo. (FUN-158)
7. WHILE a capa ou a página do plano pago estão abertas o sistema SHALL mostrá-las como em FUN-89 e FUN-90, sem o resumo. (FUN-159)

**Independent Test**: Em 1920 × 1080, com sessão de dono, abrir Gênesis 1 no modo livro, ligar o resumo, avançar três vezes (a esquerda passa 1 página por vez e a direita continua no resumo de Gênesis), desligar e ver as duas páginas da Bíblia.

---

### P1: Resumo na tela estreita ⭐ MVP

**User Story**: Como dono no celular, quero alternar entre a Bíblia e o resumo do livro, para consultar o resumo sem perder onde parei.

**Why P1**: O dono lê no celular e testa no ambiente real.

**Acceptance Criteria**:

1. WHEN o dono toca "Resumo" na tela estreita THEN o sistema SHALL trocar a página mostrada pelo resumo do livro aberto. (FUN-160)
2. WHEN o dono toca "Resumo" de novo, com o resumo na tela estreita THEN o sistema SHALL voltar à página da Bíblia que estava aberta antes. (FUN-161)
3. WHILE o resumo está na tela, na tela estreita, o sistema SHALL marcar o botão "Resumo" como pressionado (`aria-pressed="true"`). (FUN-162)

**Independent Test**: Em 390 × 844, abrir Rute 2 no modo livro, tocar "Resumo", ver o resumo de Rute, tocar de novo e voltar à mesma página de Rute 2.

---

### P1: Conteúdo e estados do resumo ⭐ MVP

**User Story**: Como dono, quero que todo resumo tenha as mesmas quatro partes e que os problemas de rede apareçam claros, para consultar rápido e saber quando tentar de novo.

**Why P1**: Define o que aparece na página da direita.

**Acceptance Criteria**:

1. The sistema SHALL mostrar o resumo com os títulos "Contexto", "Mensagem central", "Divisão do livro" e "Versículos-chave", nessa ordem, cada um com o seu texto. (FUN-163)
2. The sistema SHALL mostrar cada parte da "Divisão do livro" com um título e o intervalo de capítulos (ex.: "Capítulos 1 a 11"), e cada versículo-chave com a referência (ex.: "Gênesis 12:1-3") e a frase dele. (FUN-164)
3. The sistema SHALL mostrar todo texto do resumo como texto, sem interpretar HTML. (FUN-165)
4. WHILE o resumo está sendo buscado o sistema SHALL mostrar "Carregando o resumo…" na página dele. (FUN-166)
5. IF a busca falha por falta de rede ou por erro do servidor (5xx) THEN o sistema SHALL mostrar "Não foi possível carregar o resumo. Confira a internet e tente de novo." e o botão "Tentar de novo". (FUN-167)
6. IF a API responde 404 para o livro aberto THEN o sistema SHALL mostrar "Este livro ainda não tem resumo." (FUN-168)
7. WHILE o resumo não cabe numa página o sistema SHALL dividi-lo em páginas com "anterior" e "seguinte" próprios, sem mexer na página da Bíblia. (FUN-169)

**Independent Test**: Com o dono entrado, abrir Romanos (publicado), Êxodo (sem resumo) e, com a rede desligada, Marcos; ver as quatro seções, a mensagem de sem resumo e a de falha com "Tentar de novo".

---

### P1: Revisar e publicar os resumos ⭐ MVP

**User Story**: Como dono, quero revisar cada resumo escrito com IA e só publicar o que aprovei, para que nada entre no app sem a minha leitura.

**Why P1**: Revisão do dono é regra do produto (`.specs/STATE.md`, Próximas features).

**Acceptance Criteria**:

1. The sistema SHALL oferecer uma página de revisão num artifact privado com banco (como AD-017), em que cada livro tem estado `proposta`, `aprovada` ou `recusada` e o texto das quatro seções. (FUN-170)
2. WHEN o dono edita o texto de um resumo na revisão e o aprova THEN o sistema SHALL guardar o texto editado como o aprovado. (FUN-171)
3. WHEN o dono recusa um resumo THEN o sistema SHALL exigir uma nota e manter o livro fora da publicação. (FUN-172)
4. WHEN o script de publicação roda para um ambiente THEN o sistema SHALL gravar no Neon desse ambiente só os resumos `aprovada`, substituindo a versão anterior do mesmo livro, e imprimir quantos livros gravou. (FUN-173)
5. IF um resumo aprovado tem menos de 300 ou mais de 450 palavras, uma seção vazia, uma referência a livro, capítulo ou versículo que não existe na Bíblia Livre do app ou caractere de controle (AD-018) THEN o script SHALL recusar a publicação inteira, listar cada problema com o livro e gravar nada. (FUN-174)
6. IF o ambiente pedido é produção THEN o script SHALL pedir confirmação escrita antes de gravar. (FUN-175)
7. The sistema SHALL guardar o arquivo exportado da revisão numa pasta ignorada pelo git. (FUN-176)

**Independent Test**: Exportar a revisão com 4 aprovados e 1 recusado, rodar o script no tst e ver "4 livros gravados"; trocar uma referência por "Gênesis 51:1" e ver a publicação recusada sem gravar nada.

---

## Edge Cases

- IF o dono liga o resumo e a sessão expira enquanto lê THEN o sistema SHALL voltar ao estado sem sessão (coberto por FUN-145).
- WHEN a letra, o tema ou o tamanho da tela mudam com o resumo ligado THEN o sistema SHALL repaginar o resumo e manter a Bíblia no primeiro versículo visível (FUN-86; a troca de letra depende do bug `letra-livro-sem-repaginar`, AD-021).
- WHEN a tela passa de larga a estreita com o resumo ligado THEN o sistema SHALL mostrar a página da Bíblia e manter o resumo disponível pelo botão (coberto por FUN-157 e FUN-160).
- IF o dono abre o app sem internet com sessão guardada THEN o sistema SHALL mostrar o botão "Resumo" e, ao ligar, a mensagem de FUN-167.
- IF o script de publicação perde a conexão com o banco no meio THEN o sistema SHALL gravar todos os livros numa transação só, sem deixar parte gravada (coberto por FUN-173 e FUN-174).
- IF chega requisição a `/api/*` com `Host` diferente do domínio do ambiente THEN o sistema SHALL responder 421 (segurança padrão de app web do `CLAUDE.md`).
- IF chega `POST` (entrar ou sair) com `Sec-Fetch-Site` diferente de `same-origin` ou `none`, ou com `Origin` diferente do próprio site THEN o sistema SHALL responder 403, sem diferenciar maiúsculas (segurança padrão de app web do `CLAUDE.md`).

Varredura de requisitos implícitos (Large):

| Dimensão | Cobertura |
| -------- | --------- |
| Validação de entrada | FUN-139 (campos vazios), FUN-150 (livro), FUN-174 (formato do resumo) |
| Falha parcial | FUN-167 no app; transação única na publicação (casos limite) |
| Idempotência | FUN-173: publicar de novo substitui o mesmo livro |
| Autorização e limite | FUN-147, FUN-148, FUN-140; origem e Host nos casos limite |
| Concorrência | N/A porque há um único usuário (o dono) e a publicação é feita por uma pessoa de cada vez |
| Ciclo de vida do dado | FUN-144 (sessão expira e é apagada); recusado não é publicado (FUN-172) |
| Observabilidade | O log do Worker registra método, rota e status, nunca e-mail, senha, token ou texto do resumo (premissa do desenho) |
| Dependência externa | FUN-167 (rede ou servidor fora); banco fora responde 5xx e cai em FUN-167 |
| Integridade de estado | FUN-170 a FUN-172 (proposta, aprovada, recusada); FUN-155 e FUN-156 (resumo ligado e desligado) |

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| FUN-137 | P1: Entrar e sair como dono | Design | Pending |
| FUN-138 | P1: Entrar e sair como dono | Design | Pending |
| FUN-139 | P1: Entrar e sair como dono | Design | Pending |
| FUN-140 | P1: Entrar e sair como dono | Design | Pending |
| FUN-141 | P1: Entrar e sair como dono | Design | Pending |
| FUN-142 | P1: Entrar e sair como dono | Design | Pending |
| FUN-143 | P1: Entrar e sair como dono | Design | Pending |
| FUN-144 | P1: Entrar e sair como dono | Design | Pending |
| FUN-145 | P1: Entrar e sair como dono | Design | Pending |
| FUN-146 | P1: Resumo só para o dono | Design | Pending |
| FUN-147 | P1: Resumo só para o dono | Design | Pending |
| FUN-148 | P1: Resumo só para o dono | Design | Pending |
| FUN-149 | P1: Resumo só para o dono | Design | Pending |
| FUN-150 | P1: Resumo só para o dono | Design | Pending |
| FUN-151 | P1: Resumo só para o dono | Design | Pending |
| FUN-152 | P1: Resumo só para o dono | Design | Pending |
| FUN-153 | P1: Resumo na página da direita | Design | Pending |
| FUN-154 | P1: Resumo na página da direita | Design | Pending |
| FUN-155 | P1: Resumo na página da direita | Design | Pending |
| FUN-156 | P1: Resumo na página da direita | Design | Pending |
| FUN-157 | P1: Resumo na página da direita | Design | Pending |
| FUN-158 | P1: Resumo na página da direita | Design | Pending |
| FUN-159 | P1: Resumo na página da direita | Design | Pending |
| FUN-160 | P1: Resumo na tela estreita | Design | Pending |
| FUN-161 | P1: Resumo na tela estreita | Design | Pending |
| FUN-162 | P1: Resumo na tela estreita | Design | Pending |
| FUN-163 | P1: Conteúdo e estados do resumo | Design | Pending |
| FUN-164 | P1: Conteúdo e estados do resumo | Design | Pending |
| FUN-165 | P1: Conteúdo e estados do resumo | Design | Pending |
| FUN-166 | P1: Conteúdo e estados do resumo | Design | Pending |
| FUN-167 | P1: Conteúdo e estados do resumo | Design | Pending |
| FUN-168 | P1: Conteúdo e estados do resumo | Design | Pending |
| FUN-169 | P1: Conteúdo e estados do resumo | Design | Pending |
| FUN-170 | P1: Revisar e publicar os resumos | Design | Pending |
| FUN-171 | P1: Revisar e publicar os resumos | Design | Pending |
| FUN-172 | P1: Revisar e publicar os resumos | Design | Pending |
| FUN-173 | P1: Revisar e publicar os resumos | Design | Pending |
| FUN-174 | P1: Revisar e publicar os resumos | Design | Pending |
| FUN-175 | P1: Revisar e publicar os resumos | Design | Pending |
| FUN-176 | P1: Revisar e publicar os resumos | Design | Pending |

**ID format:** `FUN-NNN`, continuando a numeração do projeto.

**Coverage:** 40 total, 0 mapped to tasks, 40 unmapped ⚠️ (fase de Design)

---

## Success Criteria

- [ ] No tst, o dono entra pelo celular e pelo PC e lê os resumos de Gênesis, Rute, Marcos e Romanos no modo livro.
- [ ] Sem sessão de dono, `/api/resumos/1` a `/api/resumos/66` respondem 401, e nenhuma frase dos 4 resumos aparece em `dist/` nem no repositório.
- [ ] Publicar um 5º livro é só gerar, revisar e rodar o script, sem mudar código.
