# Jornadas: MinhaJornada

- **Base**: `.specs/features/leitor/spec.md` (FUN-01 a FUN-50; sem `roadmap.md`, o MVP é uma feature só), em 2026-11-14
- **Onde roda**: staging `minhajornada-tst.ljssoftware.com.br` (ou o build local servido por `vite preview`), num navegador de PC e num celular emulado

## J-01 — Primeira visita e leitura
- **Quem**: leitor sem nada gravado no aparelho
- **Passos**: 1. Abrir o app · 2. Ver a escolha de livro com o Antigo (39) e o Novo Testamento (27) · 3. Tocar em Filemom · 4. Ler Filemom 1
- **Resultado esperado**: Filemom 1 abre direto, sem grade, com os 25 versículos um por linha, número à esquerda e "que está" (versículo 2) em itálico, sem colchetes
- **Requisitos que atravessa**: FUN-01, FUN-02, FUN-03, FUN-04, FUN-06, FUN-09, FUN-21

## J-02 — Navegar e retomar onde parou
- **Quem**: leitor que já leu algum capítulo
- **Passos**: 1. Em Malaquias 4, tocar em "Seguinte" · 2. Ver Mateus 1 · 3. Tocar no título e ver a grade de Mateus · 4. Tocar em "Trocar livro", escolher Salmos e o capítulo 27 · 5. Deslizar da direita para a esquerda · 6. Abrir Romanos 8, fechar e reabrir o app
- **Resultado esperado**: Mateus 1 depois de Malaquias 4; Salmos 28 depois do deslize; Romanos 8 aberto na reabertura, no início do capítulo; em Gênesis 1 o "Anterior" fica desativado e em Apocalipse 22, o "Seguinte"
- **Requisitos que atravessa**: FUN-05, FUN-07, FUN-08, FUN-10, FUN-11, FUN-14, FUN-15, FUN-16, FUN-19, FUN-20, FUN-49

## J-03 — Ler sem internet
- **Quem**: leitor que já abriu o app uma vez com rede
- **Passos**: 1. Abrir o app com rede e ler um capítulo · 2. Esperar o download em segundo plano · 3. Cortar a rede · 4. Fechar e reabrir o app · 5. Abrir Apocalipse 22
- **Resultado esperado**: o primeiro capítulo aparece antes do download dos outros livros; sem rede, o app abre e mostra Apocalipse 22; se o livro ainda não tivesse sido baixado, a mensagem "Este livro ainda não foi baixado. Conecte-se à internet para lê-lo." com o seletor disponível; nenhuma requisição a outro domínio e nenhum cookie
- **Requisitos que atravessa**: FUN-33, FUN-34, FUN-35, FUN-36, FUN-41

## J-04 — Ajustar letra e tema
- **Quem**: leitor no celular, à noite
- **Passos**: 1. Abrir o app com o sistema em modo escuro · 2. Tocar em "Aa" · 3. Aumentar a letra até 5 · 4. Escolher Sépia · 5. Reabrir o app
- **Resultado esperado**: o app começa no tema escuro; a letra cresce na hora e "Aumentar letra" fica desativado no 5; o sépia vale para toda a interface; na reabertura, sépia e letra 5 continuam; nada transborda na lateral em 320 px
- **Requisitos que atravessa**: FUN-23, FUN-24, FUN-26, FUN-28, FUN-29, FUN-30, FUN-32, FUN-43, FUN-44

## J-05 — Sobre e instalação no iPhone
- **Quem**: leitor no Safari do iPhone, sem o app instalado
- **Passos**: 1. Abrir o app no Safari · 2. Ver o convite de instalação · 3. Dispensar · 4. Reabrir · 5. Abrir "Sobre" · 6. Instalar pela tela inicial e abrir instalado
- **Resultado esperado**: o convite aparece uma vez e não volta depois de dispensado; o Sobre traz o crédito da Bíblia Livre, a explicação do itálico e a privacidade; instalado, abre em tela cheia com o nome "MinhaJornada" e sem convite
- **Requisitos que atravessa**: FUN-37, FUN-38, FUN-39, FUN-40, FUN-42, FUN-45, FUN-46, FUN-47, FUN-48
