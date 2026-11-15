# Decisão: MinhaJornada — leitor bíblico

- **Data**: 2026-11-14
- **Veredito**: seguir
- **Aprovação**: parecer aceito e fase aprovada pelo usuário em 2026-11-14
- **Artefatos lidos**: ideia.md | pesquisa.md | problema.md | solucao.md | viabilidade-tecnica.md | plano-comercial.md (ausente: fase 5 pulada pelo usuário)

## Notas

| Critério | Nota | Justificativa |
|---|---|---|
| Validade do problema | adequado | O leitor atende a uma necessidade real do dono (uso próprio, `problema.md`); a dor de quem ensina não foi confirmada |
| Força das evidências | adequado | Para o leitor de uso próprio, a evidência é direta: o dono confirmou o que é "simples e amigável" e aceitou a Bíblia Livre (`solucao.md`). Para H1 (atrair leitores de fora), H2 e H3 (pago), a evidência é fraca (`pesquisa.md`, confiança média-baixa) |
| Valor contra não fazer nada | adequado | Ferramenta própria a custo zero e base obrigatória do pago; para o leitor comum, o YouVersion já resolve (`problema.md`) |
| Opção de solução | forte | Opção A cabe em dias, com escopo fechado e lista explícita do que fica de fora (`solucao.md`) |
| Viabilidade técnica | adequado | Viável com riscos, todos com mitigação, custo R$ 0/mês (`viabilidade-tecnica.md`) |
| Viabilidade comercial | não avaliada | Plano comercial pulado; o free não gera receita e o pago ainda depende de V1 |
| Riscos | adequado | Remoção do cache no Safari não instalado, falta de métrica de recorrência e atualização do service worker têm mitigação; a métrica fica para decisão no Desenho |

## Veredito e motivo

**Seguir**, com o escopo do leitor gratuito (Opção A). O problema e a evidência ficam em `adequado` porque o MVP se justifica pelo uso próprio, onde a necessidade foi confirmada pelo dono; a opção é forte e a viabilidade técnica é boa, a custo zero. A fraqueza da evidência de mercado (concorrência com o YouVersion) não bloqueia um MVP de dias e custo zero, mas impede tratá-lo como produto validado: o sucesso do MVP é o uso próprio. O plano pago continua fora e depende de V1.

## Validações pendentes

| # | Validação | Condição para | Situação |
|---|---|---|---|
| V1 | Entrevistar 5 a 10 pregadores ou professores sobre como preparam pregações e aulas e quanto pagariam (fecha H2 e H3) | nenhuma (no leitor); condição para planejar o pago, conforme `solucao.md` | pendente |
| V2 | Meta numérica de uso do free | nenhuma | feita (2026-11-14: a meta do MVP é só o uso próprio; leitores de fora sem meta por agora) |
| V3 | Recepção da linguagem da Bíblia Livre por leitores de fora (H4) | nenhuma | pendente |
| V4 | Confirmar que a medição de uso sem cookie e sem identificador dispensa consentimento pela LGPD | nenhuma | pendente |

## Se seguir: entrada do MVP

- **Problema**: o dono quer ler a Bíblia no celular e no computador de forma simples, sem conta e sem internet, numa base que depois receberá a área paga de estudo.
- **Solução escolhida**: Opção A — leitor essencial, offline e sem conta, em PWA, com o texto da Bíblia Livre (`.biblia/`).
- **Entra**: abrir no último capítulo lido (na primeira vez, Gênesis 1 ou uma escolha simples); escolher livro e capítulo em dois toques; ler com letra grande; capítulo anterior e seguinte por toque ou deslize; tamanho de letra ajustável; tema claro, escuro ou sépia; funcionamento offline depois da primeira visita; convite a instalar na tela inicial (com instrução para iPhone); tela "Sobre" com o crédito completo da BLIVRE (CC BY 4.0, indicação da conversão de formato) e a informação de que nada sai do aparelho.
- **Fica de fora**: busca, marcadores, destaques, histórico, compartilhamento; conta, login, sincronização e qualquer dado em servidor (sem Neon no free); outras traduções; planos de leitura, versículo do dia, notificações, áudio; toda a área paga.
- **Métricas de sucesso**: o dono usa o MinhaJornada como leitor principal nas 4 primeiras semanas. Leitores de fora sem meta numérica (V2). Infraestrutura a R$ 0/mês.
- **Restrições e riscos técnicos**: site estático em Cloudflare Workers com static assets (`minhajornada-tst.ljssoftware.com.br` a partir de `desenvolvimento`; `minhajornada.ljssoftware.com.br` a partir de `main`, só a pedido); stack candidata padrão do dono (React + Vite + vite-plugin-pwa), escolha na fase 7. Riscos: cache apagado no Safari não instalado após 7 dias; Cloudflare Web Analytics não mede recorrência; service worker com defeito preso no aparelho; cabeçalhos de segurança (CSP, nosniff, Referrer-Policy) obrigatórios; texto renderizado sem HTML vindo do Markdown.
- **Perguntas em aberto**:
  - Como medir uso (se medir) sem cookie: Cloudflare Web Analytics só com visitas, contador anônimo próprio ou nada — decidir no Desenho, numa AD.
  - Como exibir os acréscimos do tradutor (trechos entre colchetes).
  - Tela da primeira visita: Gênesis 1 direto ou escolha de livro.
  - Versão de Node (24 ou 26) e uso ou não de React.
