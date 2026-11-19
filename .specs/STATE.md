# STATE

## Retomada

- **Fluxo**: 3, Feature em projeto feito com IA — skill `feature`
- **Item**: `.specs/features/texto-atualizado/`
- **Fase aprovada**: 1, Pedido (`spec.md`, FUN-103 a FUN-127) em 2026-11-18, depois do levantamento dos 66 livros (`levantamento/RESUMO.md`)
- **Fase aprovada também**: 2, Reconhecimento (`reconhecimento.md`, inventário em d93f7e8) em 2026-11-18
- **Fase aprovada também**: 2b, Mockup (só `TelaCorrecoes`, `mockup/`) em 2026-11-18
- **Revisão publicada (T15)**: artifact privado https://claude.ai/artifact/MXhc3ed26tA7VtYZUWa8Kz, slug `a6401c0b-687c-4126-ae72-22de16898aa1`, capacidades `db`, `user` e `downloads` (2026-11-18, confirmado pelo dono). Para republicar após mudar `correcoes/correcoes.json`: `node scripts/montar-revisao.ts`, `pnpm revisao:montar` e `publish_files` de `revisao/index.html`, `dados.json` e `dist/pagina.js`.
- **Fase aprovada também**: 3, Plano (`design.md`, `tasks.md`, AD-012 a AD-017) e 4, Rede de proteção (linha de base 631 verdes, sem T0) em 2026-11-18. **Planejamento concluído.**
- **Próximo passo**: `/executar` (Sonnet), Lote 1 crítico (Phase 1). Rodar suíte e gates pelo Git Bash (o `bash` do PowerShell é o do WSL e derruba `deploy.test.ts`)
- **Serviços no ar**: nenhum
- **Progresso**: Produto: Faltam 3 de 6 features: 50% concluído; texto-atualizado 0 de 21 tarefas, conferida em 2026-11-18
- **Combinado na conversa e não registrado em artefato**:
  - Branches: `desenvolvimento` faz o papel da main; toda feature nasce dela e volta para ela (**Branch pai** = `desenvolvimento`). A `main` só recebe `desenvolvimento` quando o usuário pedir.
  - Publicação: `desenvolvimento` → tst (`minhajornada-tst.ljssoftware.com.br`, workflow `deploy` manual depois do CI verde); `main` → produção. O tst foi publicado em 2026-11-18 com a `livro-tela-cheia` (run 44404040537).
  - Reconhecimento deve olhar: `scripts/converter-biblia.ts` e `src/biblia/conversor.ts` (onde as correções entram no build), `src/biblia/segmentos.ts` (colchetes → itálico), `src/telas/TelaSobre.tsx` e `src/livro/CapaLivro.tsx` (texto do crédito), navegação de telas (onde entra "Correções no texto") e o cache por hash (AD-002). A página de revisão é um artifact privado no claude.ai (com banco do artifact), fora do app.
- **Gravada em**: 2026-11-18

## Modelo

| Data | Fluxo | Item | Fase | Indicado | Usado |
|---|---|---|---|---|---|
| 2026-11-14 | 1 | leitor | /preparar | Sonnet | Opus (escolha do usuário) |
| 2026-11-15 | 1 | leitor | /validar | Sonnet | Opus (escolha do usuário) |
| 2026-11-18 | 3 | interface-livro | /preparar | Sonnet | Opus (escolha do usuário) |
| 2026-11-18 | 3 | interface-livro | /executar | Sonnet | Opus (escolha do usuário) |
| 2026-11-18 | 3 | interface-livro | /validar | Sonnet | Opus (escolha do usuário) |
| 2026-11-18 | 3 | livro-tela-cheia | /executar e /validar | Sonnet | Opus (escolha do usuário) |
| 2026-11-18 | 3 | texto-atualizado | /executar | Sonnet | Opus (escolha do usuário) |
| 2026-11-18 | 3 | texto-atualizado | /validar | Sonnet | Opus (escolha do usuário) |

## Próximas features (pedido de 2026-11-18)

Pedido do usuário, ainda sem planejamento (`/fluxo`, em Opus, depois de integrar a interface-livro). Decisões já tomadas:

- **Forma**: roteiro com 3 features; só a primeira recebe spec e tarefas.
- **Texto bíblico atualizado**: só fontes livres ou em domínio público (revisões da Bíblia Livre, Tradução Brasileira de 1917 etc.); versões protegidas (NVI, NAA, NVT, ARA) nunca são fonte de texto. Ajustes registrados e aviso de alteração no Sobre (CC BY 4.0).
- **Resumo por livro**: texto original escrito com IA, linguagem simples.
- **Estudo bíblico por livro**: original escrito com IA, apoiado em comentários de domínio público (ex.: Matthew Henry, Spurgeon); nada copiado de sites.
- **Revisão**: o usuário revisa cada livro (resumo e estudo) antes de entrar no app.

## Autorizações

| Data | Escopo | Autorização |
|---|---|---|
| 2026-11-15 | Feature `leitor`, `src/componentes/ConviteInstalacao.test.tsx` | Simulação de `maxTouchPoints` por `Object.defineProperty` (o jsdom não define a propriedade); asserções iguais. Aprovada pelo dono. |
| 2026-11-15 | Feature `leitor`, `e2e/aparencia.spec.ts` | Passo de fechar o painel de Aparência antes de abrir a grade em 320 px; asserções iguais. Aprovada pelo dono. |
| 2026-11-15 | Feature `leitor`, retrabalho R1 (T36, T41, T42) | Helper `deslizar` de `TelaLeitor.test.tsx` com `pointerType: 'touch'` (T36); `afterEach` de `ConviteInstalacao.test.tsx` apaga `maxTouchPoints` (T41); uma asserção a mais no e2e de 320 px (T42). Nenhum teste enfraquecido. Aprovada pelo dono. |
| 2026-11-15 | Feature `leitor`, `/validar` rodada 5 | A-16 (comum: valor errado de `referrer-policy` e `x-content-type-options` sem prova por execução) aceito como lacuna, sem retrabalho; feature segue para a integração. Decisão do dono. |
| 2026-11-18 | Feature `interface-livro`, T16 e T17 | Os testes da barra antiga (`src/telas/TelaLeitor.test.tsx:165-172` e `:261-280`, `src/telas/TelaLivros.test.tsx:64-75`) passam para `src/componentes/BarraTitulo.test.tsx`, com as mesmas asserções. Aprovada pelo dono. |
| 2026-11-18 | Feature `livro-tela-cheia` | Testes do desenho antigo da tela larga (proporção 3 × 4, `--largura-pagina`, `--largura-barra`, posição da barra e dos botões nos e2e de tela larga) podem ser trocados por testes do desenho novo, tão fortes quanto antes. Aprovada pelo dono. |
| 2026-11-18 | Feature `texto-atualizado`, `test/arquivos/converter-biblia.test.ts:52-64` (FUN-03) | O teste que compara os 31.102 versículos com `.biblia/` passa a comparar com a fonte mais as correções aprovadas e a provar também que `.biblia/` não muda; tão forte quanto antes. Aprovada pelo dono. |

## Decisions

### AD-001
- **Decision**: O leitor é uma PWA estática em React 19 + Vite 8 + vite-plugin-pwa 2 (`injectManifest`, SW próprio), Node 24 e pnpm 11, num pacote só, publicada na Cloudflare Workers só com assets, sem servidor de aplicação nem banco.
- **Reason**: Mesmo molde dos PWAs do dono (ControleEmCasa_LJS), escolhido pelo usuário em 2026-11-14; o free não tem dado em servidor.
- **Trade-off**: Cerca de 60 KB gzip de React a mais do que Preact ou TypeScript puro.
- **Scope**: Todo o front do MinhaJornada; o pago pode acrescentar backend com um AD novo.
- **Date**: 2026-11-14
- **Status**: active

### AD-002
- **Decision**: O texto bíblico é convertido no build em um JSON por livro com hash no nome (`public/livros/NN.<hash8>.json`); o service worker precacheia só o app, e os livros ficam num cache próprio (`mj-livros`) gerido pelo app, baixados um por vez depois do primeiro capítulo.
- **Reason**: O primeiro capítulo não espera os outros 65 livros (FUN-34), e a interrupção do download não perde o que já foi guardado (FUN-33); o precache seria tudo ou nada.
- **Trade-off**: Lógica de cache no app, e não só no SW; exige `limparAntigos` para as versões velhas.
- **Scope**: Feature `leitor` e qualquer conteúdo grande offline no futuro.
- **Date**: 2026-11-14
- **Status**: active

### AD-003
- **Decision**: Os cabeçalhos de segurança vêm de `public/_headers` estático, com CSP só `'self'` (`frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'none'`, `form-action 'none'`, sem `unsafe-inline`), `X-Content-Type-Options: nosniff` e `Referrer-Policy: same-origin` (não `no-referrer`, como no molde), travados por teste.
- **Reason**: FUN-42 e a regra de segurança web do `CLAUDE.md`; sem Sentry, o gerador de cabeçalhos do molde não tem motivo.
- **Trade-off**: Nenhum script ou estilo inline; o tema e a letra vão por atributo `data-*` e CSS.
- **Scope**: Todo o site.
- **Date**: 2026-11-14
- **Status**: active

### AD-004
- **Decision**: Qualquer falha ao carregar um livro (sem rede, JSON ilegível, resposta de erro do servidor) mostra a mensagem de "não baixado" do FUN-36, com a escolha de livro.
- **Reason**: A spec (FUN-36) só define o caso sem rede e fora do cache; o dono decidiu em 2026-11-15 não criar uma segunda mensagem.
- **Trade-off**: Com rede e erro do servidor, a mensagem "Conecte-se à internet" pode enganar; o erro real não aparece ao leitor.
- **Scope**: `src/estado/useLeitor.ts` (carga do livro); testes em `src/estado/useLeitor.test.ts` (FUN-36).
- **Date**: 2026-11-15
- **Status**: active

### AD-005
- **Decision**: Na tela estreita, "anterior" na primeira página de Gênesis mostra a página do plano pago, e "anterior" nela mostra a capa. Na tela larga, mostra o par capa e plano pago, como manda FUN-88.
- **Reason**: A spec manda FUN-88 ("anterior" na primeira página de Gênesis mostra a capa) e FUN-90 (na tela estreita, a ordem é capa → pago → Gênesis). Na tela estreita, voltar direto à capa pularia a página do pago, que fica entre as duas. Vale a ordem de FUN-90 nos dois sentidos.
- **Trade-off**: Na tela estreita, chegar à capa a partir de Gênesis custa dois toques.
- **Scope**: Feature `interface-livro`, `src/livro/folhear.ts`; testes de FUN-88 e FUN-90.
- **Date**: 2026-11-17
- **Status**: active

### AD-006
- **Decision**: A leitura gravada inválida continua sendo apagada na abertura do app, por `lerLeitura` (`src/dados/preferencias.ts:57-63`). Quando "Ler Bíblia" é acionado, o estado já não tem leitura e age como sem leitura gravada.
- **Reason**: FUN-56 manda apagar quando "Ler Bíblia" é acionado. O efeito visível é o mesmo (escolha de livro ou capa), e a validação fica onde já está testada (FUN-22).
- **Trade-off**: O valor inválido é apagado antes do toque, mesmo que a pessoa nunca toque em "Ler Bíblia".
- **Scope**: Feature `interface-livro`; testes de FUN-56 em `src/estado/leitor.test.ts` e `src/estado/useLeitor.test.ts`.
- **Date**: 2026-11-17
- **Status**: active

### AD-007
- **Decision**: No formato livro, o lugar é o da âncora: voltar à rolagem abre o capítulo da âncora (o capítulo escolhido), mesmo quando a página mostrada começa no fim do capítulo anterior (ex.: entrar por João 3 e a página começar em João 2).
- **Reason**: A spec manda FUN-71 (a rolagem abre o capítulo do primeiro versículo da página atual); o código abre o da âncora. Decisão do dono no /validar (A-03): o leitor volta ao capítulo que escolheu.
- **Trade-off**: O título da página pode mostrar o capítulo anterior (primeiro versículo da página, FUN-84) e a rolagem abrir o seguinte.
- **Scope**: Feature `interface-livro`, `src/estado/leitor.ts` (`trocarFormato`); teste exato em `TelaLivro`/`App` e no e2e (T39).
- **Date**: 2026-11-18
- **Status**: active

### AD-008
- **Decision**: A medida das páginas do livro não é refeita ao trocar o tema; a chave de `useMedidas` é a letra (e o livro, pelos blocos).
- **Reason**: O design manda remedir por "letra, tema, livro"; os temas só mudam cor (`src/estilo/tokens.css`), sem alterar altura. Decisão do dono no /validar (A-10).
- **Trade-off**: Se um tema futuro mudar fonte ou espaçamento, a chave precisa incluir o tema.
- **Scope**: Feature `interface-livro`, `src/telas/TelaLivro.tsx:76`.
- **Date**: 2026-11-18
- **Status**: active

### AD-009
- **Decision**: As três features pedidas em 2026-11-18 entram no roteiro (`.specs/projeto/roadmap.md`) na ordem `texto-atualizado` → `resumo-livro` → `estudo-livro`.
- **Reason**: O texto é a maior incerteza (a pesquisa pode concluir que não há ajuste) e resumo e estudo citam versículos, que devem sair do texto final; o resumo cria o armazenamento por livro, a revisão do dono e o ponto de entrada no leitor que o estudo reaproveita.
- **Trade-off**: Alternativa descartada: resumo primeiro (valor visível antes), com risco de revisar citações depois de mudar o texto.
- **Scope**: Roteiro do produto, features 3 a 5.
- **Date**: 2026-11-18
- **Status**: active

### AD-010
- **Decision**: A feature `livro-tela-cheia` (modo livro ocupando a tela no PC) entra no roteiro antes da `texto-atualizado`, que volta a `Não começada`.
- **Reason**: Pedido do usuário em 2026-11-18, com o print do tst; é pequena e melhora o que já está publicado. A pesquisa da `texto-atualizado` fica em `.specs/features/texto-atualizado/pesquisa.md`.
- **Trade-off**: A spec da `texto-atualizado` espera; os requisitos dela passam a começar em FUN-103.
- **Scope**: Roteiro, features 3 e 4.
- **Date**: 2026-11-18
- **Status**: active

### AD-011
- **Decision**: A barra de título de borda a borda (margem de 24 px, FUN-95) vale para toda tela com 900 px ou mais de largura, em pé ou deitada; FUN-102 ("como está hoje" quando a tela não é larga) vale para a barra só abaixo de 900 px. O modo livro em pé continua como hoje.
- **Reason**: O pedido manda FUN-95 por largura e FUN-102 também no retrato; o dono escolheu a largura (2026-11-18).
- **Trade-off**: Tablet em pé ganha margem de 24 px na barra, diferente do retrato abaixo de 900 px.
- **Scope**: Feature `livro-tela-cheia`, T1 (`src/componentes/BarraTitulo.module.css`).
- **Date**: 2026-11-18
- **Status**: active

### AD-012
- **Decision**: "Não confere" (FUN-105) é uma marca derivada, o campo `confere` do item, e não um quarto valor de `estado`; o estado continua `proposta`, `aprovada` ou `recusada` (FUN-103).
- **Reason**: A spec manda três estados em FUN-103 e manda "marcar o item como não confere" em FUN-105. A conferência depende da fonte e é recalculada; o estado é a decisão do dono.
- **Trade-off**: Um item pode estar "aprovado" e deixar de conferir se a fonte mudar; o build recusa (FUN-115).
- **Scope**: Feature `texto-atualizado`, `src/biblia/correcoes/`, `scripts/correcoes/`, `src/revisao/`.
- **Date**: 2026-11-18
- **Status**: active

### AD-013
- **Decision**: Na consolidação, o candidato cujo "depois" é igual ao "antes" com as regras mecânicas aplicadas sai da lista de itens: ele é coberto pela regra.
- **Reason**: O levantamento lista como digitação muitos erros de espaço (ex.: Ap 5:9 "compraste , de"), que a regra R-01 ou R-02 já resolve. Sem isso, o mesmo erro contaria duas vezes na tela de correções (FUN-123) e na revisão.
- **Trade-off**: Se o dono recusar a regra, esses erros não voltam como itens; reconsolidar com a regra recusada os recupera.
- **Scope**: Feature `texto-atualizado`, `scripts/correcoes/conferir.ts`.
- **Date**: 2026-11-18
- **Status**: active

### AD-014
- **Decision**: Linha do levantamento com "Ref" do tipo "N ocorrências" vira um item por versículo em que o trecho "antes" aparece no texto inteiro; se a contagem achada difere de N, a linha vai ao relatório da consolidação.
- **Reason**: FUN-104 manda um item por ocorrência; o levantamento agrupou ocorrências repetidas numa linha (`levantamento/INSTRUCOES.md:40`).
- **Trade-off**: Trecho curto demais pode achar versículos que não eram erro; esses ficam "proposta" e vão ao dono, nunca entram sem decisão.
- **Scope**: Feature `texto-atualizado`, `scripts/correcoes/conferir.ts`.
- **Date**: 2026-11-18
- **Status**: active

### AD-015
- **Decision**: Quando o "antes" do levantamento só aparece no versículo ignorando os colchetes de itálico, a consolidação o troca pelo trecho exato da fonte (com colchetes) e marca `confere`. Se o número de pares de colchetes do "antes" e do "depois" for diferente, o item ganha a marca `italicoMuda` e vai para a revisão um a um, nunca em bloco.
- **Reason**: FUN-105 manda conferir contra a fonte; parte do levantamento citou o texto como o leitor vê (sem colchetes). FUN-117 e FUN-125 exigem os colchetes em pares, e um "depois" sem colchetes apagaria o itálico em silêncio.
- **Trade-off**: A revisão um a um cresce com esses itens.
- **Scope**: Feature `texto-atualizado`, `scripts/correcoes/conferir.ts`, `src/revisao/logica.ts`.
- **Date**: 2026-11-18
- **Status**: active

### AD-016
- **Decision**: O conversor lê o arquivo de correções do argumento `--correcoes <arquivo>`, com padrão `correcoes/correcoes.json`. Os testes de build e o build do e2e (`pnpm build:e2e` = conversor com `--correcoes test/arquivos/dados/correcoes-exemplo.json` e `vite build`) usam um arquivo de exemplo; o deploy usa `pnpm build`, sem o argumento.
- **Reason**: O arquivo real muda a cada exportação da revisão; os testes precisam de correções aprovadas fixas (ex.: Ap 6:1) para provar FUN-114, FUN-116 e FUN-122. Argumento em vez de variável de ambiente: o `package.json` não define variável do mesmo jeito no Windows e no Linux sem biblioteca nova.
- **Trade-off**: O e2e não roda sobre o texto que vai para produção; o teste de build com o arquivo real (válido, 66 livros, 31.102 versículos) cobre essa diferença.
- **Scope**: Feature `texto-atualizado`, `scripts/converter-biblia.ts`, `.github/workflows/ci.yml`, `test/arquivos/deploy.test.ts`.
- **Date**: 2026-11-18
- **Status**: active

### AD-017
- **Decision**: A revisão do dono é uma página num artifact privado do claude.ai com as capacidades `db`, `user` e `downloads`: cada decisão é uma linha do banco; a exportação é feita por uma sessão do Claude que lê o banco e roda `scripts/aplicar-decisoes.ts` (ou pelo arquivo de "Baixar decisões"). No app, a lista de correções é um pedaço separado (import dinâmico) e só um resumo entra no código principal.
- **Reason**: Decisão do dono em 2026-11-18; o app não tem conta nem servidor (FUN-41), e o arquivo versionado é a única fonte do build.
- **Trade-off**: A exportação depende de uma sessão do Claude (ou de baixar o arquivo); a tela de correções ganha os estados carregando e erro.
- **Scope**: Feature `texto-atualizado`, `src/revisao/`, `revisao/`, `src/biblia/correcoesAplicadas.ts`.
- **Date**: 2026-11-18
- **Status**: active

