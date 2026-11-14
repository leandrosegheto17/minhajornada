---
name: cobertura
description: Orquestra o planejamento para aumentar a cobertura de testes unitários de um projeto existente — mede a cobertura atual com a suíte como linha de base, ranqueia os módulos por risco e falta de teste (não persegue percentual), combina com o usuário quais entram e planeja testes de caracterização do comportamento atual em tarefas pequenas no tasks.md, descobrindo a fase pelos artefatos em .specs/cobertura/<slug>/. Termina no tasks.md, que o /executar executa e o /validar verifica. Use quando o projeto tem pouco teste unitário e se quer proteger o que já existe, ou via /fluxo. Não use para testar uma feature nova (a feature já nasce com teste), para teste E2E (fluxo teste-e2e), para corrigir bug achado no caminho (skill bug) nem para refatorar.
---

# Cobertura de testes unitários (fluxo 33)

Você é o **orquestrador**. Princípio: **cobrir pelo risco, não pelo número**. O percentual é informação; o que importa é que o código onde um erro passa em silêncio (regra de negócio, dinheiro, autorização, dado pessoal, transação, parser de entrada externa) deixe de estar sem teste. Os testes **caracterizam o comportamento atual** (método da skill `rede-de-protecao`): registram o que o código faz hoje, mesmo que pareça errado.

**Este fluxo termina no planejamento**: no `tasks.md`. Pronto, diga apenas: **"O plano está disponível para execução."** Escrever os testes é do `/executar`; a verificação, do `/validar`.

## 1. Qual rodada

Liste `.specs/cobertura/`. Em andamento: as que têm `cobertura.md` com **Resultado** `pendente`. Nenhuma: rodada nova. Uma ou mais: pergunte via `AskUserQuestion` qual retomar, com a opção **Rodada nova**. Slug em kebab-case pelo escopo (ex.: `api-pedidos`, `geral`); pasta existente: acrescente `-2`.

## 2. Descobrir a fase

| Situação em `.specs/cobertura/<slug>/` | Fase |
|---|---|
| **Resultado** preenchido | encerrada (mostre o resumo) |
| sem `cobertura.md`, ou **Linha de base** vazia | 1 Linha de base |
| **Alvo aprovado** `pendente` | 2 Ranking e alvo |
| **Plano aprovado** `pendente` | 3 Tarefas |
| **Plano aprovado** preenchido | planejamento concluído: diga só "O plano está disponível para execução." |

Diga: "**Cobertura <slug>, fase N de 3, <fase>.**" Planejamento pede **Opus**: aplique a trava de modelo do `CLAUDE.md`.

## 3. Fases

**1 Linha de base.** Skill `inventario` se faltar ou estiver velho (traz comando de teste e módulos). Descubra o comando de cobertura do projeto (ex.: `vitest run --coverage`, `pytest --cov`, `go test -cover`); sem ferramenta de cobertura, a **T0** do plano é instalá-la. Rode a suíte e registre em `cobertura.md`: comando, total passou/falhou, cobertura por módulo (linhas e **ramos**), falhas preexistentes e instáveis (como na `rede-de-protecao`; falha preexistente: pergunte registrar e seguir ou parar). Arquivos gerados, migrações e configuração ficam fora, com o motivo.

**2 Ranking e alvo.** Com o `leitor-codigo` em paralelo (um por área grande), pontue cada módulo sem teste ou com ramos descobertos: **risco** (o que quebra se errar), **volatilidade** (`git log` recente), **toque** (quantos chamam) e **esforço**. Apresente o ranking e pergunte via `AskUserQuestion` quais entram (as de maior valor primeiro, recomendadas), o teto de tarefas da rodada e o que fica de fora. Registre em `cobertura.md`: módulos escolhidos, o que cada um deve provar (ramos, erros, limites) e o **fora do escopo**. Marque **Alvo aprovado**. Código sem teste e impossível de testar sem refatorar: anote em **Achados fora do escopo** (skill `refatoracao`), não resolva aqui.

**3 Tarefas.** `tlc-spec-driven`, fase **Tasks**, com as regras do `CLAUDE.md` (tarefa de até 2h, **Estimativa**, **Risco**, **Domínio**, **Criticidade**). Uma tarefa por módulo ou grupo coeso; cada uma traz `**Testes**:` (arquivo de teste a criar), os **comportamentos a caracterizar** (entradas, saídas, erros, limites e cada ramo da condição), `**Reuses**:` com o molde de teste vizinho (`arquivo:linha`) e a meta observável ("todos os ramos de X cobertos"; sem % como critério). Modo **enxuto** do `CLAUDE.md` vale (`**Modo**: enxuto`, Base = `cobertura.md`). Registre `**Branch pai**`. `validate_tasks.py` no `tasks.md`. Marque **Plano aprovado**.

## 4. Fechar a fase

Apresente o produzido (caminho, 3 a 5 linhas e o progresso) e pergunte via `AskUserQuestion`: **seguir / ajustar / parar**. Antes de declarar a fase concluída, aplique `verification-before-completion`. Na última fase **não pergunte**: diga só que o plano está disponível. Parar é resultado válido: **Resultado** `parada — <motivo>`.

## Para o /executar e o /validar

- **Teste de caracterização passa de cara:** não há vermelho prévio. A prova de que o teste vale é o `/validar` (mutações do `verificador`); o `/executar` confere no code review que cada ramo da tarefa tem asserção.
- **Teste que falha no código atual está errado**, não o código. Comportamento estranho é registrado em comentário no teste e em **Achados fora do escopo**; bug **não** se corrige aqui (skill `bug`).
- **Código de produção não muda.** Só teste (e a ferramenta de cobertura, na T0). Teste existente nunca é enfraquecido.
- **Verificação:** `verificador` (modo feature, fonte da verdade: `cobertura.md`): cada comportamento prometido tem asserção, mutações nos módulos de maior risco, cobertura de ramos dos módulos escolhidos medida de novo contra a linha de base.

## Regras

- Nada de teste só para subir o percentual: asserção vazia, teste do detalhe interno ou que repete a implementação é rejeitado no review.
- O que não foi escolhido na fase 2 não entra: sem "já que estou aqui".
- Push, PR e merge exigem confirmação específica.
- Tudo em português.
