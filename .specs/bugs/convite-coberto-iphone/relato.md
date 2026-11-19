# Bug: no iPhone, não dá para dispensar o convite de instalação na página inicial

- **Slug**: convite-coberto-iphone · **Data**: 2026-11-19
- **Relatado por**: E2E geral no staging, na liberação de 2026-11-19 · **Fonte**: teste
- **Chamado por**: nenhum
- **Devolver após**: —

## Relato

**Esperado**: tocar em "Dispensar convite" fecha o convite "Instalar o app", e ele não volta depois de recarregar (FUN-46, FUN-47, spec do `leitor`; J-05 de `.specs/projeto/jornadas.md`). Era assim na produção (`main` @ `88746bd`).
**Obtido**: o toque não chega ao botão: a `<section class="cartao-inicial">` (`aria-labelledby="titulo-inicial"`) da página inicial fica por cima dele e recebe o toque. O convite continua na tela.

**Passos**:
1. Abrir `https://minhajornada-tst.ljssoftware.com.br/` num iPhone 14 (emulado pelo Playwright: agente de usuário, toque e tela do Safari do iPhone).
2. Esperar o convite "Instalar o app" aparecer.
3. Tocar em "Dispensar convite".

- **Ambiente**: staging · **Versão ou commit**: `desenvolvimento` @ `bf74d37` (deploy run 44607847440) · **Dispositivo**: iPhone 14 emulado no Chromium
- **Frequência**: sempre (falhou também no retry) · **Desde quando**: a página inicial nova da `interface-livro` (`1dc0b5c`, T19, FUN-52); na produção, antes dela, o passo funciona
- **Evidência**: `pnpm exec playwright test -c playwright.staging.config.ts e2e-geral/sobre-instalacao.spec.ts` falha em `:18` com "`<section class="_cartao-inicial_1d60c_35" aria-labelledby="titulo-inicial">` from `<main class="_inicial_1d60c_1 ">` subtree intercepts pointer events"
- **Impacto**: quem abre o app no iPhone (o público principal do convite) não consegue fechar o convite, que fica ocupando a página inicial · **Contorno**: instalar o app pela tela inicial, ou usar o resto da página mesmo com o convite aberto

## Triagem

- **Veredito**: bug confirmado (falta reproduzir localmente)
- **Por quê**: contraria FUN-46 e FUN-47 (o convite pode ser dispensado e não volta), que funcionavam antes da página inicial nova
- **Severidade**: P2 — o convite não fecha, mas o leitor continua usável e há contorno · **Urgência**: próxima liberação (segura a publicação em produção de 2026-11-19)
- **Duplicados ou relacionados**: nenhum duplicado; relacionado só pela mesma liberação a `letra-livro-sem-repaginar` (outra causa)

## Critérios de aceite da correção

1. **O comportamento esperado vale**: dado o app aberto na página inicial num iPhone, com o convite visível, quando se toca em "Dispensar convite", então o convite some e não volta depois de recarregar, e o cartão da página inicial continua visível e inteiro.
2. **Testes cobrem o defeito**: um E2E local (servidor de pré-visualização, iPhone emulado) que falha com o defeito e passa com a correção, e o `e2e-geral/sobre-instalacao.spec.ts` verde no staging.
