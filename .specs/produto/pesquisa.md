# Pesquisa: MinhaJornada — leitura e estudo bíblico

- **Data**: 2026-11-14
- **Confiança geral nas evidências**: média-baixa. Muitos achados vêm de agregadores e blogs, e não foi possível ler reviews das lojas nem achar dado direto de disposição a pagar.

## Usuários e demanda

- As queixas comuns sobre apps bíblicos (anúncios, peso, login obrigatório, falta de offline) não foram confirmadas: a Play Store não foi lida (404) e só apareceram agregadores. — PREMISSA (confiança: baixa)
- Há sinal indireto de incômodo com anúncios. O Bíblia JFA Offline tem receita estimada de 61% em anúncios e 39% em compras no app, e o "Esboços de Pregações" (Android) tem 100% em anúncios, ambos por estimativa de terceiro. — [fonte: https://appgoblin.info/apps/biblia.jfa.offline.pro ; https://appgoblin.info/apps/com.cristeolapps.esbocos.de.pregacoes] (confiança: média-baixa)
- Apps de esboço de pregação são numerosos e populares (o "Esboços de Pregações" tem 4,8 com 1,9 mil avaliações na App Store BR), o que mostra que pregadores procuram ajuda para preparar. É sinal de oferta e de busca, não de dor confirmada. — [fonte: https://apps.apple.com/BR/app/id1644322239] (confiança: média)
- Não foi encontrada pesquisa sobre como pregadores e professores brasileiros preparam sermões e aulas (Word, Google Docs, caderno, e-Sword, Logos). — PREMISSA (confiança: baixa)

## O que já existe

- **YouVersion**: 1 bilhão de instalações (nov/2025), grátis, sem anúncios nem compras, com destaques, anotações privadas e planos de leitura. Nota 4,9 com 1,5 mi de avaliações na App Store BR. Oferece a ARC. — [fonte: https://churchleaders.com/news/2208848-youversion-celebrates-milestone-billion-downloads.html ; https://apps.apple.com/BR/app/id282935706 ; https://www.bible.com/pt-PT/privacy ; https://www.bible.com/pt/versions/3407] (confiança: alta)
- **Bíblia JFA Offline**: app antigo, que se diz a primeira Bíblia offline nas lojas, mantido por anúncios e com remoção paga. — [fonte: https://apps.apple.com/BR/app/id478686126] (confiança: média)
- **Preparo de pregação**: "Esboços de Pregações" (grátis, com IA e offline), "Bíblia Inteligente" (rascunho de sermão), Sermon AI (pago, português não confirmado) e Sermind (compras no app, em espanhol). — [fonte: https://apps.apple.com/BR/app/id1644322239 ; https://apps.apple.com/us/app/-/id6754614255 ; https://apps.apple.com/py/app/sermind/id6748862242] (confiança: média)
- **Logos**: tem versão em português, com ARA, NTLH e ARC na assinatura Max. Há queixas de preço alto e de catálogo em português parado (relato de fórum). Capterra PT dá 4,8 com 238 avaliações. Não foram achados preços em R$. — [fonte: https://community.logos.com/forums/123.aspx ; https://www.capterra.pt/software/131777/logos] (confiança: média-baixa)
- Não foram encontrados preços de e-Sword, Olive Tree, Accordance ou SBB, nem casos documentados de tentativas que falharam.

## Mercado e contexto

- **Censo 2022**: evangélicos são 26,9% (47,4 mi) da população de 10 anos ou mais, contra 21,6% em 2010. Católicos são 56,7%. — [fonte: https://www.gazetadopovo.com.br/vida-e-cidadania/numero-de-evangelicos-triplica-em-30-anos-no-brasil-diz-censo/ ; https://www.tnh1.com.br/noticia/nid/novos-dados-do-ibge-revelam-um-brasil-87-cristao-ateus-triplicam/] (confiança: alta; imprensa repetindo o IBGE)
- Não foram encontrados o número de igrejas e pastores nem a disposição a pagar por apps religiosos no Brasil. A única referência isolada é o app devocional Pão Diário, a USD 23,99 por ano. (confiança: baixa)
- **Custo de não fazer nada**: para o leitor, nenhum, porque o YouVersion já resolve. Para quem ensina, segue o uso de várias ferramentas soltas (PREMISSA).

## Dados e restrições

- **Bíblia Livre**: licença CC BY 4.0 Brasil. Exige atribuição, a sigla BLIVRE e a data da versão. O texto continua em revisão, sem versão fixa. A "Bíblia Livre Para Todos" é outra obra, com CC BY-SA. — [fonte: https://ebible.org/porbr2018/copyright.htm ; https://ebible.org/porblt/copyright.htm] (confiança: alta)
- **SBB (ARA, ARC, NTLH, NAA)**: direitos reservados. Um relato de fórum diz que a SBB negou redistribuição num software; outro app diz ter traduções "legalmente cedidas" pela SBB. Não foram achados política nem preço. Sobre a NVI (Biblica) e a NVT (Mundo Cristão), nada foi encontrado. — [fonte: https://discuss.openlp.org/d/2474-traducoes-biblicas ; https://apps.apple.com/app/id1387260145] (confiança: média-baixa)
- **LGPD**: convicção religiosa é dado sensível (art. 5º, II). O art. 11 não admite legítimo interesse e exige consentimento específico e destacado ou outra hipótese do inciso II. Anotações que revelem religião podem cair na regra (art. 11, §1º). — [fonte: https://confidata.com.br/blog/lgpd-comentada-09-dados-sensiveis-anonimizacao ; https://barbieriadvogados.com/?p=8821] (confiança: média; blogs de escritório, não o texto da lei). `PREMISSA`: guardar dados só no aparelho reduz a exposição.
- **PWA no iOS**:
  - A instalação é manual (Compartilhar > Adicionar à Tela de Início), sem convite automático.
  - O Safari pode apagar o IndexedDB e o cache depois de cerca de 7 dias sem uso; instalar na tela de início reduz esse risco.
  - Notificação push funciona desde o iOS 16.4, só com o app instalado.
  - Há citação de limite de cerca de 50 MB de cache.

  — [fonte: https://swoff.netlify.app/docs/concepts/ios-safari-limitations ; https://developer.apple.com/forums/thread/710157 ; https://neoteric.eu/blog/all-you-need-to-know-about-pwa-on-ios/] (confiança: média; sem documentação oficial da Apple). O texto da Bíblia ocupa 4,3 MB em Markdown, dentro do limite.

## Evidências contra a ideia

- **O free concorre com o YouVersion**, que é grátis, sem anúncios, tem anotações e planos e tem escala de 1 bilhão de instalações. Isso enfraquece H1 (atrair leitores) e H3 (o free como porta para o pago). — [fonte: ver "O que já existe"] (confiança: alta)
- **Quem busca a Almeida clássica já tem a ARC no YouVersion.** A recepção da Bíblia Livre não foi medida (H4 não testada). — [fonte: https://www.bible.com/pt/versions/3407] (confiança: média)
- **A concorrência em esboço de pregação é grande**, quase sempre grátis ou com anúncios e já com IA, o que pressiona o preço do plano pago (H2). A Logos cobre o público profissional. — [fonte: https://apps.apple.com/BR/app/id1644322239 ; https://www.capterra.pt/software/131777/logos] (confiança: média)
- **Sem ARA, NAA, NVI ou NVT**, o público pode estranhar a tradução. Licenciar é fechado e de custo desconhecido. — [fonte: https://discuss.openlp.org/d/2474-traducoes-biblicas] (confiança: média-baixa)
- **A Bíblia Livre está em revisão e não tem versão fixa**, o que obriga a registrar a versão e pode afetar a consistência das citações em pregações. — [fonte: https://ebible.org/porbr2018/copyright.htm] (confiança: média)

## Evidências a favor

- O público é grande (47,4 mi de evangélicos) e há uso visível de apps de esboço de pregação. — [fonte: ver "Mercado e contexto"] (confiança: média)
- H5: um PWA estático com texto aberto, leitura sem conta e dados no aparelho tem custo de servidor baixo. — PREMISSA técnica (confiança: média-baixa)
- A motivação é uso próprio: o dono é o primeiro usuário, o que barateia validar o plano pago. — PREMISSA

## Lacunas

- [A ESCLARECER: reviews reais da Play Store e da App Store sobre apps bíblicos]
- [A ESCLARECER: preços em R$ da Logos, e-Sword, Olive Tree, Accordance e dos apps de esboço pagos]
- [A ESCLARECER: condições e custo de licenciar ARA, NAA, NVI ou NVT]
- [A ESCLARECER: disposição a pagar de pregadores e professores; número de igrejas e pastores no Brasil]
- [A ESCLARECER: como os leitores recebem a Bíblia Livre]
- [A ESCLARECER: documentação oficial da Apple (WebKit) sobre os limites de PWA; texto oficial da LGPD e orientação da ANPD]
- Sugestão do pesquisador: entrevistar 5 a 10 pregadores ou professores sobre como preparam pregações e aulas e quanto pagariam (fecha H2 e H3 com dado real).

## Fontes

- https://appgoblin.info/apps/biblia.jfa.offline.pro
- https://appgoblin.info/apps/com.cristeolapps.esbocos.de.pregacoes
- https://apps.apple.com/BR/app/id1644322239
- https://churchleaders.com/news/2208848-youversion-celebrates-milestone-billion-downloads.html
- https://apps.apple.com/BR/app/id282935706
- https://www.bible.com/pt-PT/privacy
- https://www.bible.com/pt/versions/3407
- https://apps.apple.com/BR/app/id478686126
- https://apps.apple.com/us/app/-/id6754614255
- https://apps.apple.com/py/app/sermind/id6748862242
- https://community.logos.com/forums/123.aspx
- https://www.capterra.pt/software/131777/logos
- https://www.gazetadopovo.com.br/vida-e-cidadania/numero-de-evangelicos-triplica-em-30-anos-no-brasil-diz-censo/
- https://www.tnh1.com.br/noticia/nid/novos-dados-do-ibge-revelam-um-brasil-87-cristao-ateus-triplicam/
- https://ebible.org/porbr2018/copyright.htm
- https://ebible.org/porblt/copyright.htm
- https://discuss.openlp.org/d/2474-traducoes-biblicas
- https://apps.apple.com/app/id1387260145
- https://confidata.com.br/blog/lgpd-comentada-09-dados-sensiveis-anonimizacao
- https://barbieriadvogados.com/?p=8821
- https://swoff.netlify.app/docs/concepts/ios-safari-limitations
- https://developer.apple.com/forums/thread/710157
- https://neoteric.eu/blog/all-you-need-to-know-about-pwa-on-ios/
