# STATE

## Retomada

- **Fluxo**: 1, Projeto novo — skill `projeto-novo`
- **Item**: `.specs/features/leitor/` (avaliação em `.specs/produto/`)
- **Fase aprovada**: 8, Quebra em tarefas e lotes, concluída em 2026-11-14 (sem aprovação, regra do fluxo): `features/leitor/tasks.md` (35 tarefas, 10 lotes, `**Passada**: rascunho`) e `.specs/projeto/jornadas.md` (J-01 a J-05). Fase 7 aprovada antes: `design.md` (AD-001 a AD-003) e mockup `.specs/mockup/` (direção C)
- **Próxima fase**: planejamento concluído; seguem os comandos `/preparar` (Nível 1 antes de tudo), `/rascunho` (Opus), `/executar` e `/validar` (Sonnet)
- **Execução**: não iniciada
- **Serviços no ar**: nenhum
- **Progresso**: faltam 35 de 35 tarefas (0%), ~49h15 estimadas, conferida em 2026-11-14
- **Combinado na conversa e não registrado em artefato**:
  - Branches: `desenvolvimento` faz o papel da main e é a branch padrão no GitHub (repositório privado `minhajornada`). Toda feature nasce de `desenvolvimento` e volta para ela, então a **Branch pai** dos `tasks.md` é `desenvolvimento`. A `main` só recebe a integração de `desenvolvimento` quando o usuário pedir.
  - Publicação: Cloudflare. `desenvolvimento` → `minhajornada-tst.ljssoftware.com.br`; `main` → `minhajornada.ljssoftware.com.br`. O leitor free não usa Neon (`solucao.md`).
  - Molde de código: `c:/Leandro/Projetos/ControleEmCasa_LJS/frontend/web` (mapa resumido em `design.md`, Code Reuse Analysis).
  - `.specs/projeto/testes.json` está com `dispensado: true` (projeto sem código, aprovado em 2026-11-14). Trocar pelo comando real da suíte no `/preparar`.
  - O texto bíblico já está em `.biblia/` (Bíblia Livre, 66 arquivos Markdown e `README.md` com créditos CC BY 4.0 Brasil). A fonte tem pequenos erros de digitação (ex.: Salmos 27:8 "face.Eu"); FUN-03 manda manter igual.
- **Gravada em**: 2026-11-14

## Modelo

| Data | Fluxo | Item | Fase | Indicado | Usado |
|---|---|---|---|---|---|
| 2026-11-14 | 1 | leitor | /preparar | Sonnet | Opus (escolha do usuário) |

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
