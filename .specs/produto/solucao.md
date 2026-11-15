# Solução: MinhaJornada — leitura e estudo bíblico

- **Data**: 2026-11-14
- **Opção recomendada**: A — Leitor essencial, offline e sem conta
- **Aprovação**: Opção A aprovada pelo usuário em 2026-11-14

## Opções

### Opção A — Leitor essencial, offline e sem conta
- **Esboço**: a pessoa abre o endereço, ou o app instalado na tela inicial, e cai direto no último capítulo que leu (na primeira vez, em Gênesis 1 ou numa tela simples de escolha). Escolhe o livro e o capítulo em dois toques, lê com letra grande e confortável e passa ao capítulo seguinte ou anterior com um toque ou deslizando o dedo. Pode ajustar o tamanho da letra e o tema (claro, escuro ou sépia). Tudo funciona sem internet depois da primeira visita. Não há conta, anúncio nem pedido de cadastro. O crédito da Bíblia Livre aparece numa tela "Sobre".
- **Investimento aceitável**: pequeno (dias)
- **Ganhos e perdas**: entrega rápido o uso próprio, e o custo de manter é quase zero (texto estático). Testa a hipótese da leitura "simples e amigável" com pouco gasto. Em troca, fica com menos recursos que o YouVersion: não tem busca, marcadores nem planos. Isso basta para o dono, mas talvez não atraia leitores de fora.
- **Armadilhas**:
  - Fazer o offline funcionar bem no iPhone (instalação manual, dados apagados se o app não estiver instalado).
  - Transformar o texto em Markdown em algo navegável sem pesar o primeiro carregamento.
  - Ceder à tentação de pôr busca, destaques e versículo do dia já nesta entrega.

### Opção B — Leitor completo, com busca e marcadores
- **Esboço**: tudo da opção A, mais busca por palavra ou referência ("Jo 3:16"), marcadores e destaques de versículos guardados no aparelho, histórico de leitura e compartilhar um versículo como texto ou imagem. Continua sem conta.
- **Investimento aceitável**: médio (semanas)
- **Ganhos e perdas**: fica mais perto do que o leitor comum espera e prepara terreno para o pago (destaques viram ponto de partida do estudo). Em troca, leva semanas em vez de dias, antes de qualquer validação do pago. Os destaques guardados no aparelho também terão que migrar para a conta depois.
- **Armadilhas**:
  - Fazer a busca em português sem acento ("joao", "genesis") funcionar bem e offline.
  - Compartilhar como imagem.
  - Os destaques empurrarem o projeto para sincronização e conta antes da hora.

### Opção C — Não construir o leitor e validar direto o pago
- **Esboço**: o dono continua lendo no YouVersion ou noutro app. O esforço vai para entrevistar de 5 a 10 pregadores e professores e montar um protótipo da área de estudo e redação.
- **Investimento aceitável**: pequeno (dias), para entrevistas e protótipo
- **Ganhos e perdas**: ataca primeiro a maior incerteza (alguém paga?) e não gasta com um leitor que o YouVersion já resolve. Em troca, contraria a ordem que o dono escolheu ("primeiro a feature free") e deixa o pago sem a porta de entrada nem a base de leitura sobre a qual ele seria construído.
- **Armadilhas**:
  - Entrevistas viram conversa de conhecidos, que dizem que sim por educação.
  - Um protótipo sem o leitor fica artificial.

## Recomendação

**Opção A.** Ela atende o primeiro objetivo do `problema.md` (o dono usar como leitor principal em 4 semanas) com investimento pequeno e custo de infraestrutura próximo de zero. Também é a base obrigatória do pago, que estuda e redige sobre o texto. A pesquisa mostrou que recursos não vencem o YouVersion, então o diferencial que vale testar é justamente ser simples, rápido, sem conta e sem distração; acrescentar recursos (opção B) não muda isso e atrasa.

A incerteza do pago não se resolve construindo o leitor, por isso a validação com quem ensina (o núcleo da opção C) deve correr **em paralelo**, antes de construir o pago, e entra na decisão como condição para o plano pago.

## Fora do escopo da opção recomendada

- Busca, marcadores, destaques, histórico e compartilhamento (candidatos à próxima feature do free, se o uso pedir).
- Conta, login, sincronização e qualquer dado guardado em servidor (portanto, nada de Neon no free).
- Outras traduções além da Bíblia Livre.
- Planos de leitura, versículo do dia, notificações, áudio.
- Toda a área paga: estudo, anotações e redação de pregações e aulas.

## Premissas a validar

- O texto da Bíblia Livre (4,3 MB em Markdown) pode ser guardado inteiro no aparelho para funcionar offline, inclusive no iPhone (fase 4).
- O dono aceita a Bíblia Livre como texto principal de leitura. **Confirmado pelo usuário em 2026-11-14**; outras traduções ficam para o futuro.
- "Simples e amigável" é: abrir onde parou, navegar em dois toques, letra ajustável e tema claro, escuro ou sépia. **Confirmado pelo usuário em 2026-11-14**.
- O free pode ser publicado sem conta e sem dados pessoais, ficando fora da LGPD de dados sensíveis (fase 4).
- Quem ensina pagaria por estudo e redação: validação com 5 a 10 entrevistas, condição para construir o pago (não para o leitor).
