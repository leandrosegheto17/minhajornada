# Relato: no iPhone, o cartão da página inicial cobre o botão de dispensar o convite

**Data**: 2026-11-19 · **Achado em**: E2E geral no staging, depois de publicar `desenvolvimento` @ `bf74d37` (deploy run 44607847440) · **Situação**: aberto, sem triagem · **Bloqueia**: a liberação em produção

## O que acontece

Em `https://minhajornada-tst.ljssoftware.com.br`, num iPhone 14 emulado, o convite "Instalar o app" aparece, mas tocar em "Dispensar convite" não faz nada: a `<section class="cartao-inicial">` (`aria-labelledby="titulo-inicial"`) da página inicial fica por cima do botão e recebe o toque. Na produção (`main` @ `88746bd`, antes da página inicial nova) o mesmo passo funciona.

## Como reproduzir

`pnpm exec playwright test -c playwright.staging.config.ts e2e-geral/sobre-instalacao.spec.ts` (staging): falha em `:18` com "`section._cartao-inicial…` from `main._inicial…` subtree intercepts pointer events", também no retry.

## Suspeita (não confirmada)

Sobreposição (posição ou `z-index`) entre o convite e o cartão da página inicial, que nasceu na `interface-livro` (`1dc0b5c`, T19, FUN-52). O E2E local não cobre o convite no iPhone com a página inicial nova.

## Critério esperado

FUN-46 e FUN-47 (spec do `leitor`): o convite pode ser dispensado e não volta.
