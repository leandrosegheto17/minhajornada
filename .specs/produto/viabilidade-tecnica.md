# Viabilidade técnica: MinhaJornada — leitor bíblico

- **Data**: 2026-11-14
- **Opção avaliada**: A — Leitor essencial, offline e sem conta (`solucao.md`)
- **Veredito**: viável com riscos
- **Aprovação**: aprovada pelo usuário em 2026-11-14; plano comercial (fase 5) pulado por escolha do usuário, a retomar quando o pago for planejado

## Incertezas e como foram resolvidas

| # | Incerteza | Dimensão | Caminho | Resultado | Evidência |
|---|---|---|---|---|---|
| 1 | Guardar o texto inteiro (4,3 MB em Markdown) no aparelho para ler offline, inclusive no iPhone | plataforma | pesquisa | **Sim, com ressalva.** Cota do Safari (iOS 17+): até 15% do disco por origem; 5 MB é irrisório. Ressalva: no Safari **não instalado**, a regra dos 7 dias sem interação do ITP apaga cache e dados do site; o web app da tela inicial é isento. `navigator.storage.persist()` existe desde o Safari 17, mas é heurístico e pode ser negado | webkit.org/blog/14403 (08/2023); webkit.org/tracking-prevention (página viva) |
| 2 | Instalação do PWA no iPhone | plataforma | pesquisa | **Sim.** Continua por Compartilhar > Adicionar à Tela de Início; no iOS 26 a opção "Abrir como Web App" vem ligada por padrão. Service worker funciona no Safari e no web app instalado (`PREMISSA` para iOS 26: sem texto oficial explícito) | webkit.org/?p=16993 (WWDC25, 06/2025); macrumors.com (06/2025) |
| 3 | Android/Chrome e desktop guardarem ~5 MB | plataforma | risco aceito | — | `PREMISSA`: a cota do Chrome é uma fração grande do disco e 5 MB fica muito abaixo dela; remoção só sob pressão de armazenamento. Não pesquisado |
| 4 | Transformar o Markdown em algo navegável sem pesar o primeiro carregamento | funcionalidade central | risco aceito | — | O formato de `.biblia/` é regular (`## <Livro> <n>` e `**<v>** texto`), então a conversão por livro (ou capítulo) é feita no build, é rotina e não precisa de prova. Abre-se só o livro atual; o resto é baixado em segundo plano pelo service worker. Comprimido, o texto inteiro deve ficar perto de 1,3 MB (`PREMISSA`) |
| 5 | Hospedagem estática na Cloudflare dentro do plano gratuito | custo de operação | pesquisa | **Sim.** Workers com static assets: 20.000 arquivos por versão, 25 MiB por arquivo, requisições de assets gratuitas e ilimitadas (sem `run_worker_first`), `_headers` nativo para CSP e cache, 3.000 min de build/mês. A Cloudflare dá a Workers o conjunto de recursos mais amplo; subdomínio em zona já na Cloudflare é aceito | developers.cloudflare.com/workers/static-assets/billing-and-limitations; /workers/platform/limits |
| 6 | Medir leitores recorrentes e retenção de 30 dias sem conta e sem cookie (métrica do free em `problema.md`) | dados | pesquisa | **Não resolvido.** Cloudflare Web Analytics é gratuito e sem cookie, mas conta só visitas, não visitantes recorrentes; também perde as visitas sem rede. Alternativa a decidir no Desenho: contador anônimo próprio (ex.: o app envia "voltou nesta semana" sem identificador) ou aceitar uma métrica aproximada | developers.cloudflare.com/web-analytics/faq; blog.cloudflare.com (2020) |
| 7 | Licença do texto permite uso no free e, depois, no pago | integrações | pesquisa | **Sim.** A Bíblia Livre (BLIVRE, porbr2018) é CC BY 4.0 Brasil: permite adaptar (converter formato) e uso comercial, com atribuição (fonte, autores, data, indicação de alteração, sem sugerir endosso). Uma tela "Sobre" com o crédito completo atende. Cuidado: não confundir com a "Bíblia Livre Para Todos" (BLT), que é CC BY-SA | ebible.org/porbr2018/copyright.htm; creativecommons.org/licenses/by/4.0/deed.pt-BR |
| 8 | Domínio da stack | capacidade | risco aceito | — | O dono já usa a mesma stack em 3 PWAs (GestaoDaPelada_v2, ControleEmCasa_LJS, EvolucaoSegura_LJS) |
| 9 | Passagem do free (dados no aparelho) para o pago (conta, Neon) | dados | risco aceito | — | O free guarda só preferências e o último capítulo lido; não há dado de valor a migrar. A decisão fica para o pago |
| 10 | Exibir os acréscimos do tradutor (trechos entre colchetes, ex.: "[que está]") | funcionalidade central | risco aceito | — | Decisão de apresentação para o Desenho (ex.: itálico discreto); o texto não é alterado |

## Dados e LGPD

- **Dados guardados**: no aparelho, só tamanho de letra, tema e último livro e capítulo lidos (`localStorage` ou IndexedDB). Nada vai para servidor; não há Neon no free.
- **Dado pessoal ou sensível**: não. O hábito de leitura bíblica poderia indicar convicção religiosa (dado sensível), mas fica só no aparelho e não é coletado pelo controlador.
- **Cuidados exigidos**: tela "Sobre" dizendo que nada sai do aparelho. Métrica de uso sem cookie, sem identificador e sem IP guardado; `PREMISSA` de risco baixo pela LGPD, sem fonte oficial da ANPD. O pago (conta e anotações) exigirá consentimento específico, retenção e exclusão, a avaliar quando ele for planejado.

## Segurança

- Sem login, sem pagamento e sem dado de usuário no servidor: a superfície é um site estático.
- Exige `Content-Security-Policy` restritiva, `X-Content-Type-Options: nosniff` e `Referrer-Policy: same-origin` via `_headers`. O texto é renderizado como texto, não como HTML vindo do Markdown, sem injeção.
- Atualização do service worker: uma versão com defeito pode ficar presa no aparelho; exige estratégia de atualização (ex.: `autoUpdate`) testada.

## Custo de operação estimado

| Item | Início (mês) | Com o volume esperado (mês) | Fonte |
|---|---|---|---|
| Hospedagem (Workers static assets) | R$ 0 | R$ 0 | Limites do plano gratuito da Cloudflare (incerteza 5) |
| Banco de dados | R$ 0 (não há) | R$ 0 | `solucao.md`: nada de Neon no free |
| Domínio (`ljssoftware.com.br`, já do dono) | R$ 0 adicional | R$ 0 adicional | `STATE.md` |
| Medição de uso | R$ 0 | R$ 0 | Cloudflare Web Analytics gratuito, ou contador próprio dentro do plano gratuito de Workers (`PREMISSA`) |
| **Total** | **R$ 0** | **R$ 0** | |

## Stack candidata (não decidida)

- **Stack padrão do dono**: pnpm, React 19 + Vite 8, vite-plugin-pwa (`injectManifest`, SW próprio em `src/pwa/sw.ts`), Vitest e Playwright, Cloudflare Worker com static assets publicado por GitHub Actions. Atende tudo e é conhecida; neste projeto entra **sem** Hono, Hyperdrive nem banco. Molde mais próximo: `c:\Leandro\Projetos\ControleEmCasa_LJS` (Node 24, vite-plugin-pwa 2.0, `scripts/gerar-headers.mjs`).
- **Variante mais leve**: Vite sem React (ou Preact), para um app de poucas telas e carregamento menor. Ganha peso e velocidade, perde o molde pronto dos outros projetos.
- A escolha (inclusive Node 24 ou 26, que divergem entre os projetos) fica para a fase 7.

## Riscos e mitigação

| Risco | Impacto | Probabilidade | Mitigação |
|---|---|---|---|
| No Safari sem instalar, o cache offline é apagado após 7 dias sem uso | médio | média | Convidar a instalar na tela inicial (com instrução para iPhone); o texto é baixado de novo ao abrir com rede; preferências perdidas são poucas e reconfiguráveis; pedir `storage.persist()` |
| Não há como medir leitores recorrentes com Cloudflare Web Analytics | médio | alta (confirmado) | Decidir no Desenho entre contador anônimo próprio e métrica aproximada; registrar a decisão em AD |
| Service worker com defeito preso no aparelho | médio | baixa | Atualização automática testada (E2E offline e de atualização) |
| Primeiro carregamento pesado no celular | baixo | baixa | Conversão por livro no build, abrir só o livro atual, baixar o resto em segundo plano |
| Atribuição da licença incompleta | médio | baixa | Tela "Sobre" com o crédito do ebible.org, indicação da conversão de formato e link da licença |

## Veredito e motivo

**Viável com riscos.** Nada no leitor exige tecnologia nova: é um site estático com service worker, numa stack que o dono já usa em três PWAs, e cabe inteiro no plano gratuito da Cloudflare (custo R$ 0 por mês). O armazenamento offline cabe com folga no iPhone, e a licença CC BY 4.0 permite o uso no free e no pago, com atribuição. Os riscos que restam têm mitigação: a remoção de dados no Safari não instalado (convite a instalar e texto que se baixa de novo) e a falta de métrica de recorrência sem conta, que precisa de decisão no Desenho para não deixar a métrica do free sem medida.
