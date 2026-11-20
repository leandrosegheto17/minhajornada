# Inventário do projeto

- **Atualizado em**: 2026-11-19 (conferido para a resumo-livro: só a área `livro` mudou, livro-paginas e convite-coberto-iphone, já refletida) · **Commit**: 14ecf8a (antes: d93f7e8 e `a9976c4`; o resto vem de 2e90dc5)
- **Stack**: TypeScript ~5.9, React 19, Vite 8, vite-plugin-pwa 2 (Workbox 7, `injectManifest`), CSS Modules; site estático na Cloudflare (Worker com assets, `wrangler.jsonc`); Node >=24 <25, pnpm >=11 <12 (`package.json:6-9`)
- **Testes**: Vitest 5 + Testing Library + jsdom (projetos `componentes`, jsdom, `vite.config.ts:70-76`, e `arquivos`, node, `vite.config.ts:81-85`; setup `test/setup.ts`) · rodar: `pnpm typecheck && pnpm test` (o `pretest` e o `pretypecheck` rodam o conversor) · ficam ao lado do código (`src/**/*.test.ts(x)`) e em `test/arquivos/`; E2E Playwright em `e2e/` (`pnpm build && pnpm e2e`) e `e2e-geral/` (staging)

## Interface

| Peça | Caminho | O que faz |
|---|---|---|
| App | `src/App.tsx:19` | Compõe BarraTitulo (`:83`, única), a tela escolhida (cadeia de `if` em `:28-79`, fallback TelaLivros `:77`) e ConviteInstalacao |
| BarraTitulo | `src/componentes/BarraTitulo.tsx:27` | Barra do topo: marca (→ inicial), Livro/Rolagem, painel "Aa", Sobre, Entrar/Criar conta; props `:8-21` |
| TelaInicial | `src/telas/TelaInicial.tsx:22` | Foto, "Ler Bíblia", "Criar conta" |
| TelaLivros | `src/telas/TelaLivros.tsx:22` | 66 livros em AT e NT |
| TelaCapitulos | `src/telas/TelaCapitulos.tsx:22` | Grade de capítulos e "Trocar livro" |
| TelaLeitor (rolagem) | `src/telas/TelaLeitor.tsx:37` | Capítulo, versículos, anterior/seguinte, deslize |
| TelaLivro (formato livro) | `src/telas/TelaLivro.tsx:69` (props `:26`) | Leitura paginada, 1 ou 2 páginas, capa e plano pago antes de Gênesis |
| TelaSobre | `src/telas/TelaSobre.tsx:19` (props `:9`: `rotuloVoltar`, `aoVoltar`) | Créditos, licença, privacidade, versão |
| TelaEmBreve | `src/telas/TelaEmBreve.tsx:18` | Tela "em breve" com `Estado`; `aoVoltar`, `aoLerBiblia` |
| CapaLivro, PaginaPago | `src/livro/CapaLivro.tsx:5`, `:31` (`TEXTO_PAGO` `:21`) | Capa "Bíblia Sagrada" e página do plano pago |
| BlocoLivro, PaginaLivro | `src/livro/PaginaLivro.tsx:19`, `:57` | Bloco (nome do livro ou versículo) e página com rodapé |
| Paginação | `src/livro/paginacao.ts` (`blocosDoLivro` `:30`, `quebrasDoLivro` `:49`, `paginar` `:73`, `paginaDoVersiculo` `:141`, `alvoDaPagina` `:162`, `primeiroVersiculo` `:178`) | Monta blocos e pagina pela altura medida; cada capítulo do 2 em diante abre página nova (FUN-128) |
| Folhear | `src/livro/folhear.ts` (`visiveis` `:29`, `destinoSeguinte` `:48`, `destinoAnterior` `:68`, `destinoDaCapa` `:88`) | Páginas mostradas e destinos |
| useMedidas, useTelaLarga | `src/livro/useMedidas.ts:58`, `src/livro/useTelaLarga.ts:22` | Medição por ResizeObserver; tela ≥ 900 px deitada |
| PainelAparencia | `src/componentes/PainelAparencia.tsx:28` | Letra −/+ e tema |
| ConviteInstalacao | `src/componentes/ConviteInstalacao.tsx:40` | Convite do Safari iOS (`INSTRUCAO_INSTALAR` `:7`) |
| Versiculo | `src/componentes/Versiculo.tsx:15` | Número + texto com itálico (`segmentar`) |
| Ícones | `src/componentes/icones.tsx` | `IconeAparencia` `:10`, `IconeSobre` `:19`, `IconeAbaixo` `:28`, `IconeMais` `:36`, `IconeMenos` `:44`, `IconeLivro` `:52`, `IconeSemRede` `:66`, `IconeLivroAberto` `:81`, `IconeRolagem` `:95`, `IconeConta` `:103` |
| Botões | `src/componentes/base/Botoes.tsx` | `BotaoPrimario` `:13`, `BotaoSecundario` `:23`, `BotaoIcone` `:40`, `BotaoVoltar` `:49` |
| Estado | `src/componentes/base/Estado.tsx:30` | `vazio` (com `lista?`), `carregando`, `erro`; variantes `:12-29` |
| Aviso | `src/componentes/base/Aviso.tsx:13` | `neutro` e `erro` |
| Tokens e temas | `src/estilo/tokens.css` | `:root` `:8`, escuro do sistema `:85-87`, `claro` `:104`, `escuro` `:120`, `sepia` `:136`, letra `:152-156`, layout `:161-171` |
| CSS e fontes | `src/estilo/global.css`, `src/estilo/fontes.css:10-34`; imagem `src/estilo/imagens/inicial.webp` | Atkinson Hyperlegible e Fraunces |
| CSS das telas | `src/telas/Escolha.module.css` (TelaLivros, TelaCapitulos, TelaEmBreve), `TelaSobre.module.css`, `TelaLeitor.module.css`, `TelaInicial.module.css`, `src/livro/livro.module.css` | Estilos por tela |

## Regras e serviços

| Peça | Caminho | O que faz |
|---|---|---|
| Reducer do leitor | `src/estado/leitor.ts:124` | Puro; `Tela = 'inicial'\|'livros'\|'capitulos'\|'leitor'\|'sobre'\|'emBreve'` (`:9`); ações `:39-54`: `iniciar`, `lerBiblia`, `trocarFormato`, `abrirEmBreve`, `voltar`, `irParaAncora`, `escolherLivro`, `abrirCapitulo`, `tocarTitulo`, `trocarLivro`, `seguinte`, `anterior`, `mudarLetra`, `escolherTema`, `irPara` (`:230`); `voltarPara` guardado por `abrirEmBreve` (`:100-103`) |
| useLeitor | `src/estado/useLeitor.ts` | Interface `Leitor` `:23-38`; `irPara` `:169`, `abrirEmBreve` `:172`; carga do livro; `data-letra`/`data-tema` |
| Navegação | `src/navegacao/navegacao.ts` | `seguinte` `:11`, `anterior` `:23`, `refValida` `:35` |
| Deslize | `src/navegacao/deslize.ts` | `LIMIAR_DESLIZE` `:2`, `classificarDeslize` `:9` |
| Índice da Bíblia | `src/biblia/indice.ts` | 66 livros, a partir de `src/biblia/indice.gerado.json` (gerado pelo conversor) |
| Conversor | `src/biblia/conversor.ts`, `scripts/converter-biblia.ts` (`gerar` `:25`, `nomeDoArquivo` `:14`, `ehPrincipal` `:51`) | Lê `.biblia/*.md` e grava `public/livros/NN.<hash8>.json` e o índice gerado |
| Segmentos | `src/biblia/segmentos.ts:9` | Separa acréscimos `[...]` em itálico |
| Tipos | `src/biblia/tipos.ts` | `Livro` `:2`, `Testamento` `:12`, `EntradaIndice` `:14`, `Indice` `:23`, `Ref` `:28`, `Tema` `:29`, `Formato` `:31`, `Segmento` `:32` |
| Correções do texto | `src/biblia/correcoes/` (`arquivo.ts` leitura de `correcoes/correcoes.json`, `regras.ts`, `aplicar.ts`, `validar.ts` com `validarCorrecoes`, `semControle`, `nomeRef`, `posicaoUnica`) | Arquivo versionado de correções (itens e regras, estados proposta/aprovada/recusada), aplicado no build pelo conversor; recusa sobreposição, colchete sem par e caractere de controle ou de formatação (AD-018) (texto-atualizado, 2026-11-19) |
| Revisão do dono | `src/revisao/` (`logica.ts` `agrupar`/`aprovarGrupo`/`podeAprovar`, `mesclar.ts` `mesclarDecisoes`, `pagina.ts` `iniciar`), `scripts/montar-revisao.ts`, `scripts/aplicar-decisoes.ts`, `scripts/consolidar-correcoes.ts` | Página de revisão num artifact com banco (AD-017) e o comando que mescla as decisões no arquivo, listando os "depois" editados antes de gravar |

## API

Não há: site estático, sem servidor de aplicação.

## Dados

| Peça | Caminho | O que faz |
|---|---|---|
| Preferências | `src/dados/preferencias.ts:10-16` | `mj:leitura`, `mj:letra`, `mj:tema`, `mj:formato`, `mj:convite-ios` no localStorage, validadas; `LETRA_MIN`/`LETRA_MAX` `:19-20`, `TEMAS` `:21` |
| Livros | `src/dados/livros.ts:53` | `carregarLivro` (cache `mj-livros`, depois rede), `baixarFaltantes` `:102`, `limparAntigos` `:138` |
| Arquivos de livro | `public/livros/NN.<hash>.json` | Gerados (fora do git), fora do pré-cache |

## Utilitários

| Peça | Caminho | O que faz |
|---|---|---|
| Instalação | `src/pwa/instalacao.ts` | `ehSafariIOS` `:6`, `estaInstalado` `:14` |
| Registro do SW | `src/pwa/registrarSW.ts:5` | Só em produção |
| Service worker | `src/pwa/sw.ts` | Pré-cache, navegação para `/index.html`, `skipWaiting` |
| Dublê de cache | `src/dados/dubleCache.ts` | Cache API e `respostaLivro` para testes |
| Ler token CSS | `scripts/lerToken.mjs:2` | Lê `--nome` de um CSS; usado por `vite.config.ts:5` |
| Gerar ícones | `scripts/gerar-icones.mjs` | PNGs de `public/icones/` a partir do SVG (manual, Chromium do Playwright) |
| Helpers E2E | `e2e/apoio/navegar.ts` | `esperarInicial` `:4`, `lerBiblia` `:9`, `abrirGravado` `:14`, `escolherLivro` `:30`, `abrirPelaEscolha` `:38`, `esperarCapitulo` `:50`, `versiculos` `:56`, `deslizar` `:69`, `esperarSwAtivo` `:81`, `livrosGuardados` `:89` |
| Helpers E2E do livro | `e2e/apoio/livro.ts` | `rotuloPagina` `:10`, `passar` `:13`, `linhasCortadas` `:22` |
| Servidor E2E | `e2e/apoio/servidor.ts:20` | `servirPasta`/`trocarPasta` em 127.0.0.1 (FUN-37) |

## Testes de arquivo (`test/arquivos/`, projeto `arquivos`)

| Teste | O que verifica |
|---|---|
| `converter-biblia.test.ts` (`:51`, `:76`, `:94`) | 31.102 versículos iguais à fonte (FUN-03), nome `NN.<hash8>.json`, índice com 66 livros (FUN-06, AD-002) |
| `cabecalhos.test.ts:35` | `public/_headers` (FUN-42) |
| `deploy.test.ts`, `wrangler.test.ts` | Workflow de deploy e Worker só de assets |
| `icones-png.test.ts`, `icone-svg.test.ts` | Ícones (FUN-93, FUN-94) |
| `paginacao-66.test.ts:20` | Paginação dos 66 livros gerados (FUN-75, FUN-76) |
| `livro-css.test.ts` | Variáveis de largura e altura do livro (FUN-96, FUN-97, FUN-100) e o vão de `--esp-8` entre as páginas (FUN-133, FUN-135) |

## Configuração e segurança

| Peça | Caminho | O que faz |
|---|---|---|
| Pré-cache | `vite.config.ts:56-57` | `**/*.{js,css,html,woff2,svg,png,webp,webmanifest}`, ignora `livros/**` (jpg e avif não entram) |
| Versão | `vite.config.ts:8-18` | `__VERSAO__` do `package.json` + `VERSAO_APP` ou SHA |
| CSP | `public/_headers:5` | `default-src 'self'`, `img-src 'self'` (sem `data:`) |
| Lint | `eslint.config.mjs:8-71` | Proíbe `innerHTML`, `dangerouslySetInnerHTML`, `eval`, `fetch` fora de `src/dados/` |
| Scripts | `package.json:11-22` | `converter-biblia` roda em `predev`, `prebuild`, `pretypecheck`, `pretest` |
| CI | `.github/workflows/ci.yml` | lint, typecheck, test; build e e2e |
| Deploy | `.github/workflows/deploy.yml` | Manual, fumaça e rollback |

## Bibliotecas

| Biblioteca | Para quê |
|---|---|
| react, react-dom 19 | Interface |
| workbox-precaching, workbox-routing | Service worker |
| workbox-window | **Sem uso** |
| vite, vite-plugin-pwa, @vitejs/plugin-react | Build e PWA |
| vitest, jsdom, @testing-library/* | Testes unitários |
| @playwright/test | E2E e rasterização dos ícones |
| eslint, typescript-eslint, prettier | Lint e formato |
| wrangler | Deploy na Cloudflare |

Não há biblioteca de validação de esquema (zod etc.).

## Integrações

Nenhuma externa: o app não faz requisição a outro domínio (FUN-41).

## Duplicações encontradas

| Faz | Peças | Usar |
|---|---|---|
| Nome do livro pelo número | `TelaLeitor.tsx:25` (helper local), `App.tsx:70`, `TelaLivros.tsx:23`, `TelaLivro.tsx:204`, `PaginaLivro.tsx:25` | `indice.livros[n-1]?.nome`, sem módulo comum |
| Rótulo "Nome capítulo" | `TelaLeitor.tsx:29-31`, `TelaLivro.tsx:208`, `App.tsx:73`, `TelaLivros.tsx:30`, `PaginaLivro.tsx:59` | Sem módulo comum |
| `capitulosDo` | `leitor.ts:67-70` (com guarda), `navegacao.ts:3-5` (sem guarda) | `navegacao.ts` |
| Faixa da letra 1 a 5 | `leitor.ts:72-74`, `preferencias.ts:79`, `:84` | Constantes de `preferencias.ts:19-20` |
| Lista de temas | `tipos.ts:29`, `preferencias.ts:21`, `PainelAparencia.tsx:6-10`, `tokens.css` | `TEMAS` de `preferencias.ts` |
| Deslize (ponteiro) | `TelaLeitor.tsx:53-65`, `TelaLivro.tsx:120-132` | `classificarDeslize` de `deslize.ts` |
| Configs do Playwright | `playwright.config.ts`, `playwright.staging.config.ts` | Lista do staging é manual |

Barra do topo: **resolvida** (`BarraTitulo`, única em `App.tsx:83`).
