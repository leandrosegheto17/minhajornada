# Levantamento de pontos de correção na BLIVRE 2018: resumo (2026-11-18)

**Veredito: existem, e muitos.** Os 66 livros foram lidos por inteiro, em 15 lotes de cerca de 300 KB cada, um agente por lote. Houve também uma checagem automática do texto inteiro. O `.biblia/` foi baixado do eBible sem alteração (`README.md`), então os erros estão na fonte publicada. Nada foi corrigido: isto é só o levantamento. Regras e formato em [INSTRUCOES.md](INSTRUCOES.md).

## Leitura dos agentes (linhas de tabela; ocorrência repetida conta uma linha)

| Tipo | Alta | Média | Baixa | Total |
|---|---|---|---|---|
| digitação | 1001 | 345 | 93 | 1439 |
| ortografia | 67 | 32 | 14 | 113 |
| arcaico | 2 | 133 | 136 | 271 |
| sentido | 6 | 19 | 29 | 54 |

Arquivos por lote: [g01](g01.md) Gn, Rt, Ed, Et · [g02](g02.md) Êx, Lv · [g03](g03.md) Nm, Dt · [g04](g04.md) Js, Jz, 1Sm · [g05](g05.md) 2Sm, 1Rs, Ne · [g06](g06.md) 2Rs, 1Cr, Ct, Lm · [g07](g07.md) 2Cr, Jó, Ec · [g08](g08.md) Sl e profetas menores (Ob a Ag) · [g09](g09.md) Pv, Is · [g10](g10.md) Jr, Os, Jl, Am · [g11](g11.md) Ez, Dn, Zc, Ml · [g12](g12.md) Mt, Mc, Jo · [g13](g13.md) Lc, At · [g14](g14.md) Rm a Hb · [g15](g15.md) Tg a Ap.

## Checagem automática ([mecanico.md](mecanico.md))

- 808 versículos com espaço antes da pontuação. Quase todos ficam colados a um colchete de itálico (`[dizendo] :`), e o leitor do app vê "dizendo :".
- 394 sem espaço depois de vírgula, ponto e vírgula ou dois-pontos (ex.: ",diz o SENHOR"). Mais 70 sem espaço depois do ponto ("seguinte.O que").
- 77 palavras repetidas. Parte é correta ("se se circuncidar") e parte é erro ("as as ovelhas").
- 1 pontuação dupla (Js 13:6, ":;").
- Restos de espanhol: "y" no lugar de "e" (3), "preguntar"/"preguntarás" (4), "establecerei", "aborrecimiento", "herra", "ascuas", "unge" no lugar de "unce" (1Rs 18:44). "los" e "las" são enclíticos do português, não erro.

## Padrões que se resolvem por regra, não versículo a versículo

1. Espaço em volta da pontuação e dos colchetes. É mecânico e não muda palavra nenhuma.
2. Contração ausente ("em este lugar", "a o SENHOR", "de ele"): cerca de 100 casos, concentrados em 1 e 2 Crônicas.
3. "ei" no lugar de "hei", "encima" no lugar de "em cima", crase omitida, "o SENHOR" em minúscula no início de frase.
4. Trocas que se repetem em vários livros: "água" no lugar de "águia" (Êx 19:4, Lv 11:13, Dt 14:12, 28:49, 32:11, Jó 39:27, Ap 12:14) e "veio" no lugar de "vinho" (Gn 49:11, Nm 15:5, Dt 32:38).

## Os mais graves (mudam ou cortam o sentido)

- Versículos truncados: Js 6:13 ("tocando l"), Dt 5:14 (termina em "como"), 2Cr 28:9 ("e vós os").
- Negação que falta e inverte o sentido: Mt 8:4, Dn 3:28, mais 7 casos do tipo "há ninguém" em Lc e At.
- Lc 14:11: os dois lados terminam em "será exaltado"; falta "será humilhado".
- Jr 52:11: o sujeito está trocado (quem cega Zedequias é o rei da Babilônia).
- 1Rs 7:2: "cinco côvados" no lugar de cem.
- Palavras trocadas: Is 7:15 "mal" (mel), Is 59:17 "selo" (zelo), Gn 49:21 "serva" (cerva), At 17:24 "tempos" (templos), Lc 21:18 "parecerá" (perecerá), Zc 12:12 "prateará" (pranteará), Fm 25 "Cirsto".

## Para a decisão do dono

- **Digitação e ortografia** (cerca de 1550 linhas, 2/3 de confiança alta): erro inegável na maior parte. Os mecânicos se resolvem por regra; o resto pede revisão versículo a versículo.
- **Arcaico** (271): quase nada de confiança alta. Os de maior volume ("termo" no sentido de limite, 113 vezes; "ferir" no sentido de matar, 92) mudariam muito o texto se trocados, e um glossário serviria melhor.
- **Sentido** (54): poucos de confiança alta. Os candidatos que valem a revisão são Jr 52:11, 1Rs 7:2, Lc 14:11, 1Rs 18:44 e Nm 4:14.
- Os agentes conferiram cada candidato só por leitura. Antes de corrigir, cada um precisa de conferência contra a fonte do eBible e, nos de sentido, contra a língua original.
