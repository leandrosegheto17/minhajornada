# Inventário do projeto

- **Atualizado em**: 2026-11-17 · **Commit**: 2e90dc5
- **Stack**: TypeScript ~5.9, React 19, Vite 8, vite-plugin-pwa 2 (Workbox 7, `injectManifest`), CSS Modules; site estático na Cloudflare (Worker com assets, `wrangler.jsonc`)
- **Testes**: Vitest 5 + Testing Library + jsdom (projetos `componentes` e `arquivos`, `vite.config.ts:65-84`, setup `test/setup.ts`) · rodar: `pnpm typecheck && pnpm test` · ficam ao lado do código (`src/**/*.test.ts(x)`); E2E Playwright em `e2e/` (`pnpm build && pnpm e2e`) e `e2e-geral/` (staging)

## Interface

| Peça | Caminho | O que faz |
|---|---|---|
| TelaLeitor | `src/telas/TelaLeitor.tsx:45` | Capítulo, versículos, anterior/seguinte, deslize, painel de aparência, barra própria (`:93-117`) |
| TelaLivros | `src/telas/TelaLivros.tsx:25` | 66 livros em AT e NT |
| TelaCapitulos | `src/telas/TelaCapitulos.tsx:24` | Grade de capítulos e "Trocar livro" |
| TelaSobre | `src/telas/TelaSobre.tsx:19` | Créditos, licença (`LINK_LICENCA` `:6`), privacidade |
| PainelAparencia | `src/componentes/PainelAparencia.tsx:28` | Letra −/+ e tema; props `aberto, letra, tema, aoMudarLetra, aoEscolherTema` |
| ConviteInstalacao | `src/componentes/ConviteInstalacao.tsx:40` | Convite do Safari iOS, dispensável |
| Versiculo | `src/componentes/Versiculo.tsx:15` | Número + texto com itálico (`segmentar`) |
| Ícones | `src/componentes/icones.tsx` | `IconeAparencia`, `IconeSobre`, `IconeAbaixo`, `IconeMais`, `IconeMenos`, `IconeLivro`, `IconeSemRede` |
| Botões | `src/componentes/base/Botoes.tsx` | `BotaoPrimario` `:13`, `BotaoSecundario` `:23` (`icone?`), `BotaoIcone` `:40` (`rotulo` → aria-label), `BotaoVoltar` `:49` |
| Estado | `src/componentes/base/Estado.tsx:22` | Variantes `vazio`, `carregando` (esqueleto), `erro` |
| Aviso | `src/componentes/base/Aviso.tsx:13` | `neutro` e `erro` (`role="alert"`) |
| Tokens e temas | `src/estilo/tokens.css:8` | `:root` claro; escuro e sépia por `data-tema` |
| CSS global e fontes | `src/estilo/global.css`, `src/estilo/fontes.css` | Atkinson Hyperlegible e Fraunces em woff2 |
| Barra comum (CSS) | `src/telas/comum.module.css` | `barra-topo`, `barra-topo--larga`, `marca`, `grupo-acoes` |
| Telas de escolha (CSS) | `src/telas/Escolha.module.css` | `tela-escolha`, `titulo-tela`, lista de livros |

## Regras e serviços

| Peça | Caminho | O que faz |
|---|---|---|
| Reducer do leitor | `src/estado/leitor.ts:58` | Puro; `Tela = 'livros'\|'capitulos'\|'leitor'\|'sobre'` (`:7`); ações `iniciar`, `escolherLivro`, `abrirCapitulo`, `tocarTitulo`, `trocarLivro`, `seguinte`, `anterior`, `mudarLetra`, `escolherTema`, `irPara` |
| useLeitor | `src/estado/useLeitor.ts:48` | Liga o reducer ao aparelho; carga `carregando/pronto/naoBaixado`; `data-letra`/`data-tema` no `<html>`; dispara `limparAntigos` e `baixarFaltantes` |
| Navegação | `src/navegacao/navegacao.ts` | `seguinte` `:11`, `anterior` `:23`, `refValida` `:35` (entre livros) |
| Deslize | `src/navegacao/deslize.ts` | `LIMIAR_DESLIZE = 60` `:2`, `classificarDeslize` `:9` |
| Índice da Bíblia | `src/biblia/indice.ts:5` | 66 livros (gerado por `scripts/converter-biblia.ts`) |
| Segmentos | `src/biblia/segmentos.ts:9` | Separa acréscimos `[...]` em itálico |

## API

Não há: site estático, sem servidor de aplicação.

## Dados

| Peça | Caminho | O que faz |
|---|---|---|
| Preferências | `src/dados/preferencias.ts:10` | `mj:leitura`, `mj:letra`, `mj:tema`, `mj:convite-ios` no localStorage, validadas; inválido volta ao padrão ou é apagado |
| Livros | `src/dados/livros.ts:53` | `carregarLivro` (cache `mj-livros`, depois rede), `baixarFaltantes` `:102`, `limparAntigos` `:138` |
| Arquivos de livro | `public/livros/NN.<hash>.json` | Gerados (fora do git), fora do pré-cache |

## Utilitários

| Peça | Caminho | O que faz |
|---|---|---|
| Instalação | `src/pwa/instalacao.ts` | `ehSafariIOS` `:6`, `estaInstalado` `:14` |
| Registro do SW | `src/pwa/registrarSW.ts:5` | Só em produção |
| Service worker | `src/pwa/sw.ts` | Pré-cache, navegação para `/index.html`, `skipWaiting` |
| Dublê de cache | `src/dados/dubleCache.ts` | Cache API e `respostaLivro` para testes |
| Helpers E2E | `e2e/apoio/navegar.ts` | `abrirPelaEscolha`, `deslizar`, `esperarSwAtivo`, `livrosGuardados` |

## Configuração e segurança

| Peça | Caminho | O que faz |
|---|---|---|
| Pré-cache | `vite.config.ts:55-58` | `**/*.{js,css,html,woff2,svg,png,webmanifest}`, ignora `livros/**`: **jpg, webp, avif não entram** |
| CSP | `public/_headers:5` | `default-src 'self'`, `img-src 'self'` (sem `data:`): imagem abaixo de 4 KiB importada por `src/` vira `data:` e é bloqueada |
| Lint | `eslint.config.mjs:8-71` | Proíbe `innerHTML`, `dangerouslySetInnerHTML`, `eval`, `fetch` fora de `src/dados/` |
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
| @playwright/test | E2E |
| eslint, typescript-eslint, prettier | Lint e formato |
| wrangler | Deploy na Cloudflare |

## Integrações

Nenhuma externa: o app não faz requisição a outro domínio (FUN-41).

## Duplicações encontradas

| Faz | Peças | Usar |
|---|---|---|
| Barra do topo (marca + Sobre) | `TelaLeitor.tsx:93-117`, `TelaCapitulos.tsx:38-47`, `TelaLivros.tsx:30-41`, `TelaSobre.tsx:22` | Nenhum componente comum: candidato a `BarraTitulo` |
| `capitulosDo` | `leitor.ts:41-44`, `navegacao.ts:3-5` | `navegacao.ts` |
| Faixa da letra 1 a 5 | `leitor.ts:46-48`, `preferencias.ts:77`, `:82` | `preferencias.ts` |
| Nome do livro pelo número | `App.tsx:52`, `TelaLeitor.tsx:33-35`, `TelaLivros.tsx:26` | `nomeDoLivro` de `TelaLeitor.tsx` (sem módulo comum) |
| Configs do Playwright | `playwright.config.ts`, `playwright.staging.config.ts` | Lista do staging é manual |
