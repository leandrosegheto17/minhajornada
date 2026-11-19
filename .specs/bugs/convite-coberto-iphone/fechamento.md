# Fechamento: convite-coberto-iphone

- **Data**: 2026-11-19 · **Resultado**: corrigido
- **Severidade**: P2 · **Do relato à correção**: 0 dias

## Resumo

No iPhone, o botão "Dispensar convite" ficava atrás do cartão e do crédito da foto da página inicial nova (`z-index: 1`), porque o convite, camada fixa, não declarava `z-index`. O convite passou a declarar `z-index: 2` (acima da página, abaixo da barra).

## Correção

- **Commit**: `9bb089d` · **Teste que fica na suíte**: `e2e/convite-instalacao.spec.ts:32` (e o de FUN-47 no mesmo arquivo)
- **Verificação**: `validation.md` PASS (rodada 2) · **Revisão**: a do PR do projeto (risco baixo) · **Segurança**: não se aplica
- **Checagem final**: 1015 unitários e 115 e2e passaram, 0 falharam
- **Integração**: merge local em `desenvolvimento` (`64dcd64`)
- **Liberação**: `.specs/liberacao.md`, entrada de 2026-11-19 (main @ 64dcd64)
- **Confirmado onde foi visto**: sim, em 2026-11-19: `e2e-geral/sobre-instalacao.spec.ts` verde no staging e na produção

## Aviso ao relator

- **Para**: dono (o relato veio do E2E geral) · **Enviado**: dispensado

## Aprendizado

- **Recorrente?** não
- **Prevenção**: teste (`e2e/convite-instalacao.spec.ts` roda no e2e local e no CI); o e2e local não cobria o convite no iPhone
- **Armadilha registrada no contexto do projeto**: não (sem `CLAUDE.md` de raiz); a ordem das camadas está comentada em `ConviteInstalacao.module.css`
