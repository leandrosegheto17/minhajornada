# Integração: resumo-livro

- **Data**: 2026-11-20
- **Forma**: merge local (`--no-ff`) de `feature/resumo-livro` em `desenvolvimento` (`6fecca1`), sem push ainda
- **Commit**: último da feature `4ef4de0`
- **Suíte**: `trava-testes.py --rodar` verde em `4ef4de0` (Vitest 92 arquivos, 1653 testes; typecheck; lint)
- **Validação**: `validation.md`, PASS na rodada 6 (retrabalhos R1 a R5); N-08 risco aceito, N-09 e N-10 dívida (decisões do dono)
- **Decisões**: AD-022 a AD-024 em `.specs/STATE.md`
- **Mockup**: `entrar.html`, `livro-resumo.html`, `resumo.css` e `barra.js` (superset da barra do projeto) promovidos para `.specs/mockup/`, com seção na galeria
- **Contexto do projeto**: sem `CLAUDE.md` de raiz, README ou `docs/` a corrigir; `inventario.md` ganhou a seção API (Worker) e a linha de resumos
- **Pendente**: Nível 2 do tst para o backend (Neon dev, papel `mj_app`, Hyperdrive, `DATABASE_URL_DONO`), push de `desenvolvimento` e deploy do tst; remoção da worktree `.worktree/resumo-livro`
