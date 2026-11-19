# Integração: texto-atualizado

- **Data**: 2026-11-19
- **Forma**: merge local (`--no-ff`) de `feature/texto-atualizado` em `desenvolvimento`, sem push
- **Commit**: `a9976c4` (merge); último da feature `093443d`
- **Suíte**: `trava-testes.py --rodar` verde em `093443d` (branch) e em `a9976c4` (desenvolvimento); gate completo da rodada 4 (typecheck, Vitest 996, lint, build, e2e 89) verde
- **Validação**: `validation.md`, PASS na rodada 4 (retrabalhos R1 a R3); A-01 a A-12 fechados; A-13 (teste de caractere astral na guarda) aceito pelo dono como risco, sem retrabalho
- **Decisões**: AD-012 a AD-018 em `.specs/STATE.md` (AD-018 nasceu no `/validar`: "depois" sem caractere de controle nem de formatação)
- **Mockup**: `telas/correcoes.html` promovida para `.specs/mockup/telas/` e acrescentada à galeria; `tokens.css`, `componentes.css` e `barra.js` iguais aos do projeto
- **Contexto do projeto**: sem `CLAUDE.md` de raiz, README ou `docs/` a corrigir; `inventario.md` ganhou as áreas de correções e revisão
- **Pendente**: push de `desenvolvimento` (só a pedido); remoção da worktree `.worktree/texto-atualizado`; sugestões não bloqueantes do `validation.md` (SEC-003, SEC-004, mensagem de erro); ajustes do modo livro combinados para depois desta validação
