# Roadmap

Roteiro aprovado em 2026-11-18 (decisão AD-009 em `.specs/STATE.md`; feature 3 inserida pela AD-010; features 5 a 10 refeitas pela AD-019 em 2026-11-19, com o plano pago pela AD-020). As linhas 1 e 2 já existiam como features e entram aqui com a situação que têm.

| # | Feature | Situação | Tamanho | Depende de | Requisitos | Entrega (o que o usuário vê) |
|---|---|---|---|---|---|---|
| 1 | `leitor` | Concluída | G | n/a | FUN-01 a FUN-50 | Ler a Bíblia Livre no celular e no PC, offline, com letra e tema |
| 2 | `interface-livro` | Concluída | G | 1 | FUN-51 a FUN-94 | Página inicial, barra de título nova e leitura em formato livro |
| 3 | `livro-tela-cheia` | Concluída | P | 2 | FUN-95 a FUN-102 | No PC, o modo livro ocupa a tela toda: páginas de borda a borda, botões nos cantos e barra de título larga |
| 4 | `texto-atualizado` | Concluída | M | 3 | a definir (FUN-103 em diante) | Texto bíblico com ajustes pontuais vindos só de versões livres ou em domínio público, com o aviso de alteração no Sobre |
| 5 | `livro-paginas` | Concluída | P | 4 | FUN-128 a FUN-136 | No modo livro, as duas páginas aparecem separadas e cada capítulo começa numa página nova |
| 6 | `resumo-livro` | Em andamento | G | 5 | FUN-137 a FUN-176 | Com um livro aberto, a Bíblia fica na página da esquerda e o resumo do livro (escrito com IA e revisado pelo dono) na da direita; recurso do plano pago, por enquanto visível só ao dono |
| 7 | `estudo-livro` | Não começada | G | 6 | a definir | Na mesma página da direita, o estudo bíblico original do livro, escrito com IA a partir de comentários em domínio público e revisado pelo dono; recurso do plano pago |
| 8 | `conta` | Não começada | G | 4 | a definir | Criar conta, entrar e sair, com a sessão guardada no aparelho; a leitura continua livre e sem conta |
| 9 | `assinatura` | Não começada | G | 7, 8 | a definir | Assinar o plano pago pelo Asaas e passar a ver resumo e estudo, também sem internet depois de entrar |
| 10 | `editor-estudo` | Não começada | G | 9 | a definir | Na página da direita, anotações e textos para pregação ou aula, guardados na conta; recurso do plano pago |
