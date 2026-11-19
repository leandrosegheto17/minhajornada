# Reconhecimento: convite-coberto-iphone

- **Convite**: `src/componentes/ConviteInstalacao.tsx` (só no Safari do iPhone e do iPad, `:9-11`), estilo em `src/componentes/ConviteInstalacao.module.css:3-17` (`position: fixed`, sem `z-index`); montado em `src/App.tsx:101`, depois da tela.
- **Página inicial**: `src/telas/TelaInicial.module.css`: `.cartao-inicial` (`:35-37`, `position: relative; z-index: 1`) e `.credito-imagem` (`:73-77`, `position: absolute; z-index: 1`), da `interface-livro` (`1dc0b5c`).
- **Camadas do projeto**: `BarraTitulo.module.css:6` (`z-index: 3`), `PainelAparencia.module.css:15` (`2`), `TelaInicial.module.css:37,77` (`1`). Não há token de camada em `tokens.css`.
- **Testes**: `src/componentes/ConviteInstalacao.test.tsx` (jsdom, sem layout: não pega sobreposição); nenhum e2e local cobre o convite. Só `e2e-geral/sobre-instalacao.spec.ts` (staging, iPhone 14 emulado) o cobre.
- **Suíte**: `pnpm typecheck && pnpm test` (`testes.json`); e2e local `pnpm build:e2e && pnpm e2e <arquivo>` (`playwright.config.ts`, `vite preview` de `dist-e2e/`).
