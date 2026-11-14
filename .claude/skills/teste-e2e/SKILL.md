---
name: teste-e2e
description: Orquestra o planejamento de testes E2E de uma feature já desenvolvida — lê spec e critérios da feature, escolhe os que são jornada de usuário, detecta a ferramenta E2E do projeto (senão propõe Playwright), define ambiente, dados e cenários rastreáveis por FUN-NN (caminho feliz e erros) e planeja a escrita em tarefas pequenas no tasks.md, descobrindo a fase pelos artefatos em .specs/e2e/<slug>/. Termina no tasks.md, que o /executar executa e o /validar verifica. Use depois que a feature tem spec e está construída, ou via /fluxo. Não use para teste unitário (fluxo cobertura), para a E2E geral do projeto inteiro (é do /finalizar) nem para feature sem critérios escritos (rode a spec antes).
---

# Teste E2E de uma feature (fluxo 34)

Você é o **orquestrador**. Princípio: **cada cenário prova um critério da spec pela interface real**, do ponto de vista de quem usa, e falha se a feature for removida. Fonte da verdade: os critérios (`FUN-NN`) da feature, nunca o código.

**Este fluxo termina no planejamento**: no `tasks.md`. Pronto, diga apenas: **"O plano está disponível para execução."** Escrever e rodar os testes é do `/executar`; a verificação, do `/validar`.

## 1. Qual feature

Liste as pastas de `.specs/features/` com `spec.md` (ou `tasks.md` com seção Critérios, no modo enxuto) e código já construído (tarefas concluídas). Respeite o argumento recebido. Mais de uma: pergunte via `AskUserQuestion`. Slug da rodada = o da feature; a pasta de trabalho é `.specs/e2e/<slug>/` (nunca sobrescreva outra).

## 2. Descobrir a fase

| Situação em `.specs/e2e/<slug>/` | Fase |
|---|---|
| **Resultado** preenchido | encerrada (mostre o resumo) |
| sem `e2e.md`, ou **Ambiente** vazio | 1 Entrada e ambiente |
| **Cenários aprovados** `pendente` | 2 Cenários |
| **Plano aprovado** `pendente` | 3 Tarefas |
| **Plano aprovado** preenchido | planejamento concluído: diga só "O plano está disponível para execução." |

Diga: "**E2E <slug>, fase N de 3, <fase>.**" Planejamento pede **Opus**: aplique a trava de modelo do `CLAUDE.md`.

## 3. Fases

**1 Entrada e ambiente.** Leia os critérios da feature e separe em `e2e.md` os que são **jornada observável** (tela, rota HTTP ponta a ponta, fluxo entre serviços) dos que o teste unitário já prova (lista os que ficam de fora, com o motivo). Ferramenta: **detecte a do projeto** (`package.json`, `playwright.config.*`, `cypress.config.*`, testes e2e existentes; o `testes.json` e o CI dizem como rodam); sem nenhuma, proponha **Playwright** e a T0 do plano a instala. Registre o **Ambiente**: como subir a app (comando, porta, URL), banco e dados de teste (seed, limpeza), autenticação (usuário de teste) e como o teste roda no CI. Não depure o ambiente aqui: se não sobe, diga o motivo e pergunte (via `AskUserQuestion`) se resolve antes ou segue só com o plano.

**2 Cenários.** Para cada critério escolhido, um cenário em `e2e.md`: `FUN-NN`, pré-condição e dados, passos do usuário, **asserções observáveis** e prioridade. Regras: caminho feliz **e** cada erro que o critério descreve (gravação recusada, dado inválido, serviço fora) com gatilho real de falha e asserção da mensagem e do estado depois; critério com palavra de posição ou aparência ("ao lado", "abaixo", cor) exige asserção espacial ou visual; elementos achados por papel, rótulo e texto, nunca por classe CSS; sem espera fixa (`sleep`), só espera por condição; cenários independentes, cada um cria e limpa os próprios dados. Critério sem como ser provado pela interface: **lacuna**, pergunte via `AskUserQuestion` (ajustar o critério, cobrir em outro nível ou aceitar sem prova) e registre. Aprove o conjunto (**seguir / ajustar / parar**) e marque **Cenários aprovados**.

**3 Tarefas.** `tlc-spec-driven`, fase **Tasks**, com as regras do `CLAUDE.md` (até 2h, **Estimativa**, **Risco**, **Domínio**, **Criticidade**). T0 (só se faltar): ferramenta, configuração, comando em `testes.json` e etapa no CI. Depois, uma tarefa por cenário ou por jornada curta, cada uma com `**Testes**:` (arquivo e nome do teste citando o `FUN-NN`), `**Reuses**:` (page objects, fixtures e molde vizinho, `arquivo:linha`) e o gatilho de falha dos cenários de erro. Modo **enxuto** do `CLAUDE.md` vale (Base = `e2e.md` e a spec da feature). Registre `**Branch pai**`. `validate_tasks.py` no `tasks.md`. Marque **Plano aprovado**.

## 4. Fechar a fase

Apresente o produzido e o progresso e pergunte via `AskUserQuestion`: **seguir / ajustar / parar**, aplicando antes `verification-before-completion`. Na última fase **não pergunte**: diga só que o plano está disponível. Parar é resultado válido: **Resultado** `parada — <motivo>`.

## Para o /executar e o /validar

- **Prova de que o teste vale:** a rodada **sem** a funcionalidade (flag desligada, rota ou trecho desativado em cópia ou revertido) precisa ficar **vermelha**; só então a rodada com ela, verde. É a prova de tela da seção Execução do `CLAUDE.md`.
- **Teto:** o E2E roda uma vez ao fim do lote, só o spec novo, com 2 tentativas de 5 min, em segundo plano e sem laço de `sleep`. Passou disso: `E2E não executado: <motivo>`, que entra no que não foi validado. O ambiente é preparado antes, não depurado no lote.
- **Teste instável** (passa e falha sem mudança) não fecha verde: ache a causa (espera, dado compartilhado, ordem) em vez de repetir até passar.
- **Código de produção não muda**, salvo atributo estável de teste (ex.: `data-testid`) quando papel e rótulo não bastam, com motivo no commit. Bug achado no caminho vai para **Achados fora do escopo** (skill `bug`), sem correção aqui.
- **Verificação:** `verificador` (modo feature, fonte da verdade: critérios da spec): cada cenário rastreado até `arquivo:linha` e asserção, mutações que a feature deveria quebrar, e a suíte E2E rodada.

## Regras

- Nunca apague, pule ou enfraqueça um teste (nem marque `skip`/`fixme`) para passar.
- Cenário sem `FUN-NN` não entra; critério fora dos escolhidos não ganha teste "de brinde".
- Push, PR, merge e deploy exigem confirmação específica.
- Tudo em português.
