# Instruções do levantamento de pontos de correção (2026-11-18)

Objetivo: descobrir **se existem de fato** pontos de correção na Bíblia Livre (BLIVRE, fev/2018) usada pelo app, antes de escrever a spec da feature `texto-atualizado`. É um levantamento, não uma correção: **não altere nenhum arquivo de `.biblia/`** nem de código. Grave só o seu arquivo de resultado.

## Fonte

- Texto: `.biblia/NN-<livro>.md` (um livro por arquivo; `## <Livro> <capítulo>`; versículo como `**N** texto`). Leia cada livro do seu lote **inteiro** com a ferramenta Read (use `offset`/`limit` se passar de 2000 linhas).
- Itálico (`*palavra*`) é convenção da tradução (palavra acrescentada para dar sentido): **não é erro**. `SENHOR` em maiúsculas também é convenção.

## Tipos de candidato (os quatro que o dono pediu)

1. **digitacao**: erro evidente de digitação ou edição — letra trocada ou faltando, palavra repetida ("de de"), palavra que não existe, concordância quebrada por erro de digitação, pontuação quebrada (aspas ou parênteses sem par, vírgula/ponto duplicado), versículo com texto de outro versículo.
2. **ortografia**: grafia que contraria a ortografia oficial vigente (Acordo Ortográfico de 1990, VOLP). Ex.: trema, acento diferencial abolido, hífen errado. Não conte formas apenas antigas mas corretas.
3. **arcaico**: palavra ou expressão que um leitor brasileiro comum de hoje **não entende** (ex.: termos que só aparecem em dicionário histórico). **Fora**: conjugação de "vós", "tu/teu", "eis", "porquanto", "pois", "assim", ordem de palavras antiga, e palavras apenas formais mas compreensíveis. Seja seletivo: só o que realmente atrapalha a compreensão.
4. **sentido**: trecho em que a tradução está **claramente errada** quanto ao sentido (contradiz o texto original segundo o consenso das traduções), não uma escolha de tradução defensável. Raro: na dúvida, não liste.

## Regras para a proposta ("depois")

- Escreva a correção com palavras suas, mínimas (troque só o necessário).
- **Nunca copie texto de tradução com direitos autorais** (ARA, ARC, NVI, NAA, NTLH, ACF etc.). Para `sentido` e `arcaico`, a fonte aceitável é: língua original (hebraico/grego, citando a palavra), dicionário de português, ou Almeida em domínio público (anterior a 1923) — escreva "Almeida domínio público — a conferir" se você não tem o texto exato à mão. Não invente citações.
- Confiança: **alta** (erro inegável), **média** (provável), **baixa** (vale olhar). Não liste nada abaixo de baixa.

## Formato do arquivo de resultado (`levantamento/gNN.md`)

```markdown
# Levantamento gNN: <livros>

- Livros lidos por inteiro: <lista> (ou o que ficou sem ler e por quê)
- Totais: digitacao N · ortografia N · arcaico N · sentido N

| Ref | Tipo | Antes (trecho exato) | Depois (proposta) | Motivo | Fonte | Confiança |
|---|---|---|---|---|---|---|
| Rute 1:2 | digitacao | "e assentaram ali" | ... | ... | ... | alta |

## Observações

- <padrões que se repetem no lote (ex.: mesma palavra arcaica em 30 versículos: liste 3 exemplos e a contagem), até 8 linhas>
```

Repetição: a mesma ocorrência sistemática (ex.: a mesma grafia antiga em muitos versículos) vira **uma linha** com "Ref" = "N ocorrências (ex.: Gn 1:2, 5:3)", não N linhas.

Devolva no fim, em até 5 linhas: totais por tipo e os 3 candidatos mais fortes.
