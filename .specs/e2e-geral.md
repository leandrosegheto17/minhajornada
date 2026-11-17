# E2E geral: MinhaJornada

- **Data**: 2026-11-17 · **Base**: `.specs/projeto/jornadas.md` (J-01 a J-05) · **Commit**: `desenvolvimento` @ f3cd0ac
- **Comando**: `pnpm exec playwright test -c playwright.staging.config.ts` (`URL_STAGING` troca o ambiente; padrão: staging)
- **Resultado**: staging `https://minhajornada-tst.ljssoftware.com.br`: **25 passaram, 0 falharam**; produção `https://minhajornada.ljssoftware.com.br` (mesmo comando, só leitura): **25 passaram, 0 falharam**

| Jornada | Ambiente | Onde está provada | Resultado |
|---|---|---|---|
| J-01 Primeira visita e leitura | staging e produção | `e2e/leitura.spec.ts` | verde |
| J-02 Navegar e retomar | staging e produção | `e2e/leitura.spec.ts` | verde |
| J-03 Ler sem internet | staging e produção | `e2e/offline.spec.ts`, `e2e/sw.spec.ts` e `e2e-geral/privacidade.spec.ts` (o teste de privacidade do `offline.spec.ts` fixa `127.0.0.1`; fica de fora por `grepInvert` e vale o do `e2e-geral`, que exige só o host do app e nenhum cookie) | verde |
| J-04 Ajustar letra e tema | staging e produção | `e2e/aparencia.spec.ts` | verde |
| J-05 Sobre e instalação no iPhone | staging e produção | `e2e-geral/sobre-instalacao.spec.ts` (iPhone emulado: agente de usuário e toque, sobre o Chromium) e `e2e/manifesto.spec.ts` | verde, com a lacuna abaixo |

## Não executado

- **J-05, passos 5 e 6 no aparelho real:** instalar pela tela inicial do Safari do iPhone e abrir em tela cheia, com o nome "MinhaJornada" e sem convite, não se automatiza. Conferir à mão num iPhone: abrir o app, tocar em Compartilhar › Adicionar à Tela de Início e abrir pelo ícone.
- **`e2e/atualizacao.spec.ts`:** sobe um servidor próprio para trocar a versão do app; só roda local (verde no gate da feature).
- Safari real e Node 24 nunca rodaram (o gate local usa Chromium e Node 26).
