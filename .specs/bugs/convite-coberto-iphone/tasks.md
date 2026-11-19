# Correção: convite-coberto-iphone — tarefas

**Relato**: `.specs/bugs/convite-coberto-iphone/relato.md` (P2) · **Causa**: `.specs/bugs/convite-coberto-iphone/causa.md`
**Branch pai**: desenvolvimento
**Status**: Approved

**Desenho (inline):** o convite passa a declarar a camada dele: `z-index: 2` em `.convite-instalacao` (`src/componentes/ConviteInstalacao.module.css:3`), acima do conteúdo das telas (`1`, `TelaInicial.module.css:37,77`) e abaixo da barra (`3`, `BarraTitulo.module.css:6`), no mesmo nível do painel da aparência (`2`, `PainelAparencia.module.css:15`), que abre no topo e não se sobrepõe ao convite do rodapé. Nada novo em `tokens.css`; sem refatorar as camadas.

**Segurança padrão de app web:** não se aplica. Site estático (AD-001), só CSS e um e2e.

**Conferência spec × design:** nenhuma divergência; FUN-46 e FUN-47 (spec do `leitor`) valem como estão.

---

## Linha de base

- **Comando**: `pnpm typecheck && pnpm test` (`.specs/projeto/testes.json`), pelo Git Bash
- **Resultado**: rodado em 2026-11-19 em `8d9fef3` (`desenvolvimento`): typecheck verde; Vitest 60 arquivos, 1015 testes, todos passando
- **Falhas preexistentes**: nenhuma na suíte. No e2e geral do staging, `e2e-geral/sobre-instalacao.spec.ts:18` falha (é este bug). Aviso de ambiente: Node 26 local fora de `engines`
- **T0 (rede de proteção)**: não precisa. O convite tem testes de comportamento (`src/componentes/ConviteInstalacao.test.tsx`) e a mudança é uma linha de CSS; a página inicial tem os e2e de `e2e/entrada.spec.ts`

---

## Test Coverage Matrix

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| CSS do convite (`src/componentes/ConviteInstalacao.module.css`) | e2e | iPhone emulado: o botão "Dispensar convite" e o texto do convite são o elemento de cima (`elementFromPoint`); tocar dispensa e o convite não volta depois de recarregar | `e2e/*.spec.ts` | `pnpm build:e2e && pnpm e2e e2e/convite-instalacao.spec.ts` |

## Gate Check Commands

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Antes de cada commit | `pnpm typecheck && pnpm exec vitest run --reporter=dot` |
| Full | Fim do lote | `pnpm typecheck && pnpm exec vitest run --reporter=dot && pnpm build:e2e && pnpm e2e e2e/convite-instalacao.spec.ts` |
| Build | Fim da correção | `pnpm lint && pnpm typecheck && pnpm exec vitest run --reporter=dot && pnpm build:e2e && pnpm e2e` |

---

## Execution Plan

Um lote só (comum), T1 e T2 num commit `fix:`.

### Phase 1: Convite por cima da página inicial (comum)

```
T1 → T2
```

### Phase 2: Retrabalho R1

```
T3
```

---

## Task Breakdown

### T1: E2E que reproduz o convite coberto no iPhone (FUN-46, FUN-47)

**What**: Criar `e2e/convite-instalacao.spec.ts`, em iPhone 14 emulado na página inicial, que prova que o botão "Dispensar convite" e o texto do convite estão por cima de tudo e que o convite some ao ser dispensado e não volta depois de recarregar; rodar sem a correção e registrar o vermelho.
**Estimativa**: 1h
**Risco**: baixo
**Domínio**: não
**Criticidade**: comum
**Where**: `e2e/convite-instalacao.spec.ts` (novo)
**Depends on**: None
**Reuses**: `test.use` com `devices['iPhone 14']` e os passos de `e2e-geral/sobre-instalacao.spec.ts:6-23`; asserção espacial com `elementFromPoint` como em `e2e/livro-tela-cheia.spec.ts` (sondas por `page.evaluate`)
**Requirement**: FUN-46, FUN-47 · Bug: convite-coberto-iphone

**Done when**:

- [x] Em 390 × 664 (iPhone 14), com o convite visível: `elementFromPoint` no centro do botão "Dispensar convite" devolve o botão ou um filho dele, e no centro do texto do convite devolve um elemento dentro do convite (FUN-46)
- [x] Tocar em "Dispensar convite" esconde o convite; depois de `reload`, o título "A Palavra perto de você, onde estiver" está visível e o convite não volta (FUN-47)
- [x] Sem a correção, o teste falha pela asserção espacial (elemento de cima `cartao-inicial`), não por ambiente; a saída vermelha vai para `causa.md` e para o commit
- [x] Nomes dos testes citam `FUN-46` ou `FUN-47`

**Tests**: e2e em `e2e/convite-instalacao.spec.ts`
**Gate**: full

---

### T2: O convite declara a camada acima da página (FUN-46, FUN-47)

**What**: Acrescentar `z-index: 2` a `.convite-instalacao`, com um comentário curto da ordem das camadas (página 1, convite e painel 2, barra 3).
**Estimativa**: 15 min
**Risco**: baixo
**Domínio**: não
**Criticidade**: comum
**Where**: `src/componentes/ConviteInstalacao.module.css:3-17`
**Depends on**: T1
**Reuses**: valores de camada de `src/componentes/PainelAparencia.module.css:15` e `src/componentes/BarraTitulo.module.css:6`
**Requirement**: FUN-46, FUN-47 · Bug: convite-coberto-iphone

**Done when**:

- [x] O e2e da T1 passa
- [x] Os e2e da página inicial e da aparência (`e2e/entrada.spec.ts`, `e2e/aparencia.spec.ts`) continuam verdes
- [x] Commit único `fix: convite coberto pela página inicial no iphone (convite-coberto-iphone)` com T1 e T2
- [x] Gate full verde

**Tests**: e2e em `e2e/convite-instalacao.spec.ts`
**Gate**: full

Gate: pnpm typecheck && pnpm exec vitest run --reporter=dot @ e343b43603c900327f6e802778e1e5ebe526adfb = verde

---

### T3: Completar o causa.md com o commit e a linha do teste (A-01)

**What**: Em `causa.md`, preencher **Commit da correção** com `9bb089d` e trocar a referência da saída vermelha de `e2e/convite-instalacao.spec.ts:30` para `:32` (o prettier moveu a asserção).
**Estimativa**: 10 min
**Risco**: baixo
**Domínio**: não
**Criticidade**: comum
**Where**: `.specs/bugs/convite-coberto-iphone/causa.md:7,18`
**Depends on**: —
**Reuses**: modelo de `causa.md` (`.claude/skills/bug/references/causa.md`)
**Requirement**: critério 2 do relato · Achado: A-01 (validation.md)
**Tests**: nenhum teste novo (só documentação); `e2e/convite-instalacao.spec.ts` continua verde
**Gate**: `pnpm typecheck && pnpm exec vitest run --reporter=dot`

- [ ] Concluída
