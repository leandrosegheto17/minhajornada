# Validação: resumo-livro — FAIL ❌ (rodada 1)

- **Data**: 2026-11-20 · **Branch**: feature/resumo-livro @ 795b6f0 · **Árvore**: 922f9005ce58e7d5ebb62bf4f2ea21fc196c6b68
- **Critérios**: 40/40 com asserção localizada; FUN-153 parcial (A-01) · **Gate**: `pnpm typecheck && pnpm test` = 1564 passaram, 0 falharam, 1 pulado (A-02); lint verde; e2e 128/128
- **Sensor**: 10 mutações, 9 mortas, 1 sobreviveu (M9, `App.tsx:40`, não equivalente → A-01)
- **Revisão de código**: skill revisao-codigo, modo curto (code-review): 3 achados aceitos (A-04 a A-06), 5 descartados ou registrados como ressalva
- **Segurança**: auditor-seguranca: 0 crítico, 0 alto, 1 médio (A-07), 6 baixos (A-08 a A-12; dependências como ressalva)

## Critérios

| Critério | `arquivo:linha` e asserção | Resultado |
|---|---|---|
| FUN-137 a 145 | `src/App.test.tsx:115,321,333,343,355`; `servidor/rotas/acesso.test.ts:21,80,104,152,192`; `servidor/repositorios/sessoes.test.ts:47,89-125`; `servidor/middlewares/limite.test.ts:43` | ✅ |
| FUN-146 a 151 | `servidor/rotas/resumos.test.ts:39,57,68,79,91,101,114,121`; `servidor/middlewares/cabecalhos.test.ts:29-75`; `test/arquivos/sw.test.ts` | ✅ |
| FUN-152 | `test/arquivos/resumos-fora-do-git.test.ts:84` pulado; conferência manual do verificador sem vazamento | ✅ com ressalva (A-02) |
| FUN-153 | `src/App.test.tsx:398-415`; falta sessão de usuário comum | ⚠️ parcial (A-01) |
| FUN-154 a 162 | `e2e/resumo.spec.ts:125-233` (`boundingBox`, `aria-pressed`); `src/telas/TelaLivro.test.tsx:495-588` | ✅ |
| FUN-163 a 169 | `src/livro/PaginaResumo.test.tsx:45-220`; `src/dados/resumos.test.ts:27-47` | ✅ |
| FUN-170 a 172 | `src/revisao-resumos/logica.test.ts:16-46`; `pagina.test.ts:44-90` | ✅ |
| FUN-173 a 176 | `scripts/resumos/publicar.test.ts:86,126,142,189,273-320`; `src/resumos/validar.test.ts:68-187`; `resumos-fora-do-git.test.ts:46-60` | ✅ |

## Achados

| ID | `arquivo:linha` | Achado e evidência | Correção sugerida | Criticidade | Situação |
|---|---|---|---|---|---|
| A-01 | `src/App.tsx:40` | Sem teste para sessão `{dono:false}`; mutante M9 (`!== 'sem'`) sobrevive aos 33 testes | Teste com sessão comum sem botão | crítica | aberto |
| A-02 | `test/arquivos/resumos-fora-do-git.test.ts:18,84` | Só lê `resumos.json`; com `propostas.json` o teste é pulado | Varrer todo `*.json` da pasta, com títulos e frases | comum | aberto |
| A-03 | `src/livro/PaginaResumo.tsx:212,223` | Elementos do `map` sem `key` (aviso do React na suíte) | `key` estável por bloco | comum | aberto |
| A-04 | `src/App.tsx:36-48` | `resumoEstreita` guarda o número do livro: voltar ao livro religa o resumo | Desligar ao trocar de livro ou largura | comum | aberto |
| A-05 | `src/revisao-resumos/logica.ts:17`; `pagina.ts:149` | `recusar` ignora o texto editado | Aceitar `editado` como em `aprovar` | comum | aberto |
| A-06 | `src/revisao-resumos/pagina.ts:190` | Erro ao recusar ou gravar redesenha tudo e perde a edição | Mostrar o aviso sem redesenhar | comum | aberto |
| A-07 | `servidor/migracoes/1795132860000_papel_app.sql:2-5` | Papel criado no Neon herda `neon_superuser`; AD-023 só provada localmente | Migração de conferência que falha; criar o papel por SQL | crítica | aberto |
| A-08 | `wrangler.jsonc:24,37`; `servidor/repositorios/sessoes.ts:48-62` | Cache do Hyperdrive não tratado: sessão encerrada pode valer até 60 s | Hyperdrive com `--caching-disabled`, registrado no Nível 2 | comum | aberto |
| A-09 | `scripts/criar-dono.ts:19-20` | Trocar a senha não encerra as sessões abertas | Apagar as sessões do usuário no mesmo comando | crítica | aberto |
| A-10 | `scripts/criar-dono.ts:35` | Aceita qualquer senha não vazia | Mínimo de 12; aviso acima de 72 bytes | crítica | aberto |
| A-11 | `.github/workflows/deploy.yml:106,114-125` | Dependências da migração rodam no job com o token da Cloudflare | Job próprio para a migração | crítica | aberto |
| A-12 | `scripts/resumos/publicar.ts:35-36,62` | Livro recusado depois de publicado continua no banco (FUN-172) | Apagar os recusados na mesma transação | crítica | aberto |

## Lacunas e o que não foi validado

- Worker no workerd e fumaça de deploy não rodados (Nível 2 do `/preparar`: ids do Hyperdrive e `namespace_id` ainda provisórios).
- `glob` e `minimatch` com aviso moderado no `pnpm audit` (via `node-pg-migrate`): não exploráveis aqui; atualizar quando sair versão nova.
- Descartados da revisão de código: `sair()` limpa a dica antes da rede (FUN-143 pede isso), chave `sem-ip` do limite (o Cloudflare sempre envia `CF-Connecting-IP`), 421 no `wrangler dev` (configuração local), sessões órfãs (somem no vencimento; sem impacto no uso de um dono).
