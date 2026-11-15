# Contexto: Leitor bíblico

**Gathered:** 2026-11-14
**Spec:** `.specs/features/leitor/spec.md`
**Status:** Ready for design

---

## Feature Boundary

Leitor da Bíblia Livre em PWA, sem conta e offline: escolher livro e capítulo, ler um versículo por linha, passar ao capítulo seguinte ou anterior, abrir onde parou, ajustar letra e tema, tela "Sobre" com a atribuição e convite de instalação. Nada sai do aparelho.

---

## Implementation Decisions

### Primeira visita

- Sem leitura gravada, o app abre na escolha de livro (não em Gênesis 1).

### Apresentação do texto

- Um versículo por linha, com o número pequeno à esquerda.
- Trechos entre colchetes na fonte aparecem em itálico e sem os colchetes; o "Sobre" explica o itálico.

### Medição de uso

- Nenhuma no MVP: sem script de terceiro, sem contador. A meta do MVP é o uso próprio (`decisao.md`, V2).

### Agent's Discretion

- Valores concretos dos 5 tamanhos de letra, das cores dos três temas e do layout (Desenho e mockup).
- Forma do seletor de livro (lista ou grade de abreviações) e posição dos botões de navegação, desde que dois toques bastem.

### Declined / Undiscussed Gray Areas → Assumptions

Registrados na seção Assumptions & Open Questions da spec, com padrão e motivo: seguinte e anterior entre livros, livro de capítulo único, limiar do deslize, tema padrão do sistema, dados guardados, ordem do download offline, atualização do app, convite de instalação no iPhone, itens da regra de segurança web que não se aplicam a site estático.

---

## Specific References

- "Simples e amigável": abrir onde parou, navegar em dois toques, letra ajustável, tema claro, escuro ou sépia (confirmado pelo dono em 2026-11-14, `solucao.md`).
- Stack e molde de PWA: projetos do dono em `c:\Leandro\Projetos\` (ControleEmCasa_LJS, GestaoDaPelada_v2, EvolucaoSegura_LJS), `viabilidade-tecnica.md`.

---

## Deferred Ideas

- Medir uso (Cloudflare Web Analytics ou contador anônimo próprio), se um dia houver meta para leitores de fora.
- Links por URL para um capítulo, junto com o compartilhamento.
