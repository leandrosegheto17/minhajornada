# Reconhecimento: interface-livro

- **Data**: 2026-11-17 · **Commit**: 2e90dc5
- **Contexto do projeto**: nenhum na raiz (sem `CLAUDE.md`, `AGENTS.md` ou README); base em `.specs/features/leitor/design.md` e `.specs/projeto/inventario.md`. Criar o contexto mínimo na integração
- **Encaixe**: estende padrão (telas, reducer, preferências, barra) e padrão novo (paginação com medição de layout, `ResizeObserver`)
- **Arquitetura**: cabe. A paginação entra como camada nova (função pura + componente que mede), sem mudar dados nem contratos
- **Telas**: cria página inicial, tela "em breve", leitor em formato livro e capa; muda a barra de todas as telas (leitor, livros, capítulos, Sobre)
- **Mockup**: aprovado em 2026-11-17 (`mockup/`, imagem de fundo A: Bíblia aberta na luz, Aaron Burden / Unsplash)
- **Plano aprovado em**: pendente

## Onde entra

| Arquivo ou módulo | O que muda | Novo? |
|---|---|---|
| `src/estado/leitor.ts:7`, `:9-19`, `:60-69`, `:116-126` | `Tela` ganha `inicial`, `emBreve` (e o livro como formato do leitor); estado ganha `formato`; `iniciar` passa a abrir a inicial; nova ação "Ler Bíblia" com a regra de FUN-54 a FUN-56 | não |
| `src/estado/useLeitor.ts:8-12`, `:33-36`, `:61-80`, `:84-86` | Lê e grava o formato; carrega também o livro vizinho no modo livro; grava o capítulo da página (FUN-85) | não |
| `src/dados/preferencias.ts:10-15`, `:86-95` | Chave `mj:formato` validada (`rolagem`/`livro`, padrão `rolagem`) | não |
| `src/App.tsx:23-68` | Novos ramos: inicial, em breve, leitor livro; barra comum em volta das telas | não |
| `src/componentes/BarraTitulo.tsx` | Barra única: marca, formato, Aa, Sobre, Entrar/Criar conta (FUN-60 a FUN-65) | sim |
| `src/telas/TelaLeitor.tsx:93-117`, `TelaLivros.tsx:30-41`, `TelaCapitulos.tsx:38-47`, `TelaSobre.tsx:22` | Trocam o `<header>` próprio pela `BarraTitulo`; o painel "Aa" (`TelaLeitor.tsx:58`) sobe para a barra | não |
| `src/telas/TelaInicial.tsx` | Imagem de fundo + cartão "Ler Bíblia" / "Criar conta" | sim |
| `src/telas/TelaEmBreve.tsx` | Aviso de conta e plano de estudo ainda indisponíveis, "Voltar" | sim |
| `src/navegacao/paginacao.ts` | Função pura: versículos + alturas medidas + altura da página → páginas; localizar a página de um capítulo ou versículo | sim |
| `src/telas/TelaLivro.tsx` | Leitor em formato livro: 1 ou 2 páginas, capa, texto do pago, setas e deslize por página; mede com `ResizeObserver` | sim |
| `public/` ou `src/estilo/` | Imagem de fundo (PNG ou SVG, ver riscos) e crédito no "Sobre" (`TelaSobre.tsx`) | sim |
| `src/estilo/tokens.css` | Tokens da página, da capa e do cartão | não |
| `e2e/apoio/navegar.ts:4-30` | Helpers passam pela página inicial ("Ler Bíblia") | não |

## Reaproveitamento

| Necessidade da feature | Peça existente | Decisão | Por que (obrigatório em "criar novo") |
|---|---|---|---|
| Barra de título em todas as telas | CSS `comum.module.css` (`barra-topo`, `marca`, `grupo-acoes`) + 4 cabeçalhos duplicados | estender | O CSS serve; o JSX repetido vira o componente `BarraTitulo`, pedido pela própria feature |
| Botões da barra e do cartão | `BotaoIcone`, `BotaoPrimario`, `BotaoSecundario`, `BotaoVoltar` (`src/componentes/base/Botoes.tsx`) | reaproveitar | — |
| Ajuste de letra e tema na barra | `PainelAparencia` (`src/componentes/PainelAparencia.tsx:28`) | reaproveitar | — |
| Preferência "formato" | `preferencias.ts` (molde do tema, `:20`, `:86-95`) | estender | — |
| Estado de tela e transições | `reduzirLeitor` (`src/estado/leitor.ts:58`) | estender | — |
| Gesto de deslize por página | `classificarDeslize` (`src/navegacao/deslize.ts:9`) | reaproveitar | — |
| Livro seguinte e anterior entre livros | `seguinte`/`anterior`/`refValida` (`src/navegacao/navegacao.ts:11-43`) | reaproveitar | — |
| Carregar o livro vizinho | `carregarLivro` (`src/dados/livros.ts:53`) | reaproveitar | — |
| Texto do versículo com itálico | `Versiculo` (`src/componentes/Versiculo.tsx:15`) | reaproveitar | — |
| Mensagem sem rede (FUN-87) | `MENSAGEM_NAO_BAIXADO` (`TelaLeitor.tsx:30`) + `Estado`/`Aviso` | reaproveitar | — |
| Seletor de livro e capítulo no modo livro | `TelaLivros`, `TelaCapitulos` | reaproveitar | — |
| Página inicial | nenhuma | criar novo | Nenhuma tela de entrada; `TelaLivros` é uma escolha, não uma porta |
| Tela "em breve" | `Estado` variante `vazio` (`src/componentes/base/Estado.tsx:22`) | reaproveitar | Monta a tela com `Estado` + `BotaoVoltar` |
| Paginação | nenhuma | criar novo | Nenhum cálculo de layout no projeto (sem `ResizeObserver`, `clientHeight` ou `getBoundingClientRect` em `src/`) |
| Capa e texto do pago | nenhuma | criar novo | Conteúdo novo, sem molde |
| Ícones novos (livro aberto/rolagem, conta) | `icones.tsx` | estender | — |
| Nome do livro pelo número | `nomeDoLivro` (`TelaLeitor.tsx:33-35`) | reaproveitar | Duplicado em 3 lugares; usar este |
| Biblioteca de paginação ou de livro | nenhuma instalada | não entra | O cálculo é pequeno e testável como função pura; biblioteca nova não se justifica |

## Modelo a seguir

- Tela com barra, título e conteúdo — `src/telas/TelaCapitulos.tsx:24` — estrutura, `BotaoVoltar`, CSS de `Escolha.module.css`
- Leitor com deslize e cartões anterior/seguinte — `src/telas/TelaLeitor.tsx:76-82`, `:160` — molde da `TelaLivro`
- Preferência validada — `src/dados/preferencias.ts:86-95` (tema) — molde de `mj:formato`
- Transição de tela no reducer — `src/estado/leitor.ts:116-126` (`irPara`) e `:60-69` (`iniciar`)
- Teste de reducer sem React — `src/estado/leitor.test.ts`; teste de hook — `src/estado/useLeitor.test.ts:59-74`; teste de tela — `src/telas/TelaLeitor.test.tsx:31` (`propsPara`)
- Teste de layout por `boundingBox` — `e2e/leitura.spec.ts:45-52`

## Convenções do projeto

- Nomes em português; tela em `src/telas/` com `.module.css` e `.test.tsx` ao lado — `src/telas/TelaSobre.tsx`
- Classes CSS com hífen lidas por `estilo['...']` — `src/telas/TelaLeitor.tsx:94`
- Props de ação com prefixo `ao` (`aoAbrirSobre`) — `src/telas/TelaLeitor.tsx:22`
- Botão sem texto sempre com `rotulo` (aria-label) — `src/componentes/base/Botoes.tsx:39-46`
- Texto bíblico nunca como HTML; lint proíbe `innerHTML` e `fetch` fora de `src/dados/` — `eslint.config.mjs:8-71`
- Toda falha de carga vira `naoBaixado` (AD-004) — `src/estado/useLeitor.ts:72`

## Testes

- **Rodar a suíte**: `pnpm typecheck && pnpm test` (`.specs/projeto/testes.json`); E2E: `pnpm build && pnpm e2e`
- **Cobrem o trecho**: `src/estado/leitor.test.ts`, `src/estado/useLeitor.test.ts`, `src/App.test.tsx`, `src/telas/*.test.tsx`, `src/dados/preferencias.test.ts`, `src/navegacao/*.test.ts`; E2E `e2e/leitura.spec.ts`, `aparencia.spec.ts`, `offline.spec.ts`
- **Testes existentes que mudam** (autorizados pela spec aprovada, tabela de requisitos alterados):
  - `src/App.test.tsx:46-50`, `:52-56` (FUN-21), `:58-66` (FUN-20)
  - `src/estado/leitor.test.ts:19-36` (FUN-20, FUN-21, FUN-22 em `iniciar`)
  - `src/estado/useLeitor.test.ts:59-74` (FUN-20, FUN-21)
  - `e2e/leitura.spec.ts:14-31` (linha 18), `:131-136`, `:138-147`; `e2e/esqueleto.spec.ts:8`; `e2e/offline.spec.ts:88`; `e2e-geral/sobre-instalacao.spec.ts:22`
  - helpers `e2e/apoio/navegar.ts:4-30`, usados em 26 pontos de `aparencia`, `leitura` e `offline`
- **Sem teste**: ordem dos itens da barra (só os rótulos de Aa e Sobre, `TelaLeitor.test.tsx:165-172`); largura de tela (nenhum uso de `matchMedia`/`innerWidth` no leitor); carga de livro vizinho

## Fragilidades e riscos

- **Paginação sem layout no jsdom**: o cálculo precisa ser função pura com alturas injetadas (unitário) e a medição real só no E2E. Repaginar ao mudar letra, tema ou tamanho é a parte mais frágil (FUN-75, FUN-86) — padrão novo
- **Imagem de fundo e PWA**: o pré-cache só pega `png`, `svg`, `woff2` etc. (`vite.config.ts:55-58`); JPG ou WebP não funcionariam sem rede (FUN-58). Imagem abaixo de 4 KiB importada por `src/` vira `data:` e a CSP (`public/_headers:5`, `img-src 'self'`) a bloqueia. Foto em PNG grande pode passar de 2 MiB e ser pulada do pré-cache sem erro. Decisão no plano: formato e caminho (ex.: WebP com o glob ampliado, ou PNG otimizado)
- **Mudança larga nos E2E**: 26 usos de `abrirPelaEscolha`/`abrirGravado` dependem da abertura antiga; o helper precisa passar pela inicial — `e2e/apoio/navegar.ts:4-30`
- **Barra duplicada em 4 telas** (`TelaLeitor.tsx:93-117`, `TelaLivros.tsx:30-41`, `TelaCapitulos.tsx:38-47`, `TelaSobre.tsx:22`): a feature extrai `BarraTitulo`, o que toca as quatro telas
- **Carga de um livro por vez** (`useLeitor.ts:8-12`, `:61-80`): passar página entre livros exige carregar o vizinho, também sem rede (FUN-87)
- **`TelaLeitor.tsx`** (184 linhas) mistura barra, título, deslize e cartões; o deslize usa destinos por capítulo (`:76`, `:82`), então a `TelaLivro` é tela nova, não variação dela
- Duplicações fora do escopo (`capitulosDo`, faixa da letra): não entram nesta feature
