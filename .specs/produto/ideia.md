# Ideia: MinhaJornada — leitura e estudo bíblico

- **Data**: 2026-11-14
- **Origem**: conversa com o usuário (comando /projeto-novo)
- **Tipo**: produto novo

## Ideia como foi trazida

> Quero construir uma aplicação web PWA como as outras que estamos fazendo.
>
> Nesse caso, o plano free será um app de leitura bíblica apenas.
>
> O plano pago terá uma área de estudo bíblico com possibilidade de fazer anotações e redigir textos para preleção ou aulas.
>
> Vamos desenvolver primeiro a feature free que trata apenas da leitura da bíblia de forma simples e amigável

## Em uma frase

Um app web instalável (PWA) para ler a Bíblia de forma simples, de graça e sem conta. Uma assinatura paga acrescenta uma área de estudo com anotações e redação de textos para pregações e aulas.

## Origem e contexto

- **Quem trouxe**: o usuário, que é o dono do produto (desenvolvedor de outros PWAs no mesmo molde).
- **Motivação**: uso próprio que pode virar produto. O usuário sente a necessidade na prática e quer transformá-la em algo vendável.
- **Por que agora**: o texto bíblico já está no repositório (`.biblia/`, Bíblia Livre, licença CC BY 4.0 Brasil, 66 livros), o ambiente de publicação está definido (Cloudflare e Neon, com teste e produção separados) e há outros PWAs do usuário como referência de stack. `PREMISSA`: reaproveitar o molde desses projetos reduz o custo de começar.

## Público

- **Free (leitura)**: o cristão comum, qualquer pessoa que queira ler a Bíblia.
- **Pago (estudo)**: quem ensina, como pregadores, professores de escola bíblica e líderes de célula ou de grupo.

## Decisões já tomadas pelo usuário

- **Formato**: PWA (web instalável).
- **Ordem**: primeiro a leitura (free), "de forma simples e amigável". O estudo (pago) vem depois.
- **Conta no free**: não exige. A pessoa abre e lê, e a posição e as preferências ficam no aparelho.
- **Tradução**: Bíblia Livre (BLIVRE), domínio aberto com atribuição obrigatória.
- **Ambientes**: teste em `minhajornada-tst.ljssoftware.com.br` (branch `desenvolvimento`, Neon `dev`) e produção em `minhajornada.ljssoftware.com.br` (branch `main`, Neon de produção, só quando o usuário pedir).

## Hipóteses

- H1: um leitor bíblico gratuito, simples e sem conta atrai usuários mesmo concorrendo com apps já estabelecidos (YouVersion, Bíblia JFA e outros).
- H2: uma parte de quem ensina (pregadores, professores) sente falta de um lugar único para estudar, anotar e redigir esboços de pregação ou aula, e pagaria por isso.
- H3: o free funciona como porta de entrada que leva ao pago (conversão de leitor para assinante).
- H4: a Bíblia Livre serve ao público. Ela é baseada na Almeida de 1819 e tem linguagem mais antiga; o leitor comum pode preferir a NVI, a NAA ou a ARA, que são protegidas por direitos.
- H5: dá para oferecer o free sem custo relevante de infraestrutura, com o texto estático e funcionando sem internet.

## Dúvidas iniciais

- [A ESCLARECER: o que torna a leitura "simples e amigável" de fato, frente aos apps que já existem? Qual é o diferencial do free?]
- [A ESCLARECER: oferecer só a Bíblia Livre é suficiente, ou o público espera escolher a tradução (ARA, NVI)? Licenciar uma dessas tem custo e prazo.]
- [A ESCLARECER: quanto quem ensina pagaria, e o que já usa hoje (Logos, e-Sword, Word, caderno)?]
- [A ESCLARECER: no pago, as anotações e os textos ficam na nuvem (Neon) e exigem conta. Como fica a passagem do free sem conta para o pago?]
- [A ESCLARECER: o app inclui algo além do texto no free, como plano de leitura, busca, marcadores ou versículo do dia, ou só o texto puro?]
- [A ESCLARECER: há dados pessoais sensíveis? Convicção religiosa é dado sensível pela LGPD (art. 5º, II), e as anotações do pago podem revelá-la.]
