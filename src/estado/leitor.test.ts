import { describe, expect, it } from 'vitest';
import { indice } from '../biblia/indice';
import { ESTADO_INICIAL, reduzirLeitor, type AcaoLeitor, type EstadoLeitor, type Formato } from './leitor';

/** Número do livro pelo nome, no índice real gerado de `.biblia/`. */
const n = (nome: string) => {
  const livro = indice.livros.find((l) => l.nome === nome);
  if (!livro) throw new Error(`livro ${nome} não está no índice`);
  return livro.numero;
};

const aplicar = (estado: EstadoLeitor, ...acoes: AcaoLeitor[]) =>
  acoes.reduce((atual, acao) => reduzirLeitor(atual, acao, indice), estado);

const iniciar = (ref: EstadoLeitor['ref'], letra = 3, formato: Formato = 'rolagem'): AcaoLeitor => ({
  tipo: 'iniciar',
  ref,
  letra,
  tema: null,
  formato,
});

const lerBiblia: AcaoLeitor = { tipo: 'lerBiblia' };
const trocarFormato: AcaoLeitor = { tipo: 'trocarFormato' };

/** Capítulo aberto no leitor, na rolagem: abre a inicial com a leitura gravada e aciona "Ler Bíblia". */
const noLeitor = (livro: string, capitulo: number) =>
  aplicar(ESTADO_INICIAL, iniciar({ livro: n(livro), capitulo }), lerBiblia);

/** Capítulo aberto no leitor, no formato livro. */
const noLivro = (livro: string, capitulo: number) =>
  aplicar(ESTADO_INICIAL, iniciar({ livro: n(livro), capitulo }, 3, 'livro'), lerBiblia);

describe('iniciar (FUN-51, FUN-66; substitui FUN-20, FUN-21 e FUN-22)', () => {
  it('FUN-51: com leitura gravada válida, abre a página inicial e guarda a leitura em ref', () => {
    const estado = aplicar(ESTADO_INICIAL, iniciar({ livro: n('Romanos'), capitulo: 8 }));
    expect(estado.tela).toBe('inicial');
    expect(estado.ref).toEqual({ livro: n('Romanos'), capitulo: 8 });
  });

  it('FUN-51: sem leitura gravada, abre a página inicial', () => {
    const estado = aplicar(ESTADO_INICIAL, iniciar(null));
    expect(estado.tela).toBe('inicial');
    expect(estado.ref).toBeNull();
  });

  it('FUN-51: leitura fora do índice (Judas 2) abre a página inicial e não guarda a leitura', () => {
    const estado = aplicar(ESTADO_INICIAL, iniciar({ livro: n('Judas'), capitulo: 2 }));
    expect(estado.tela).toBe('inicial');
    expect(estado.ref).toBeNull();
  });

  it('FUN-66: o formato gravado vira estado.formato; o padrão é rolagem', () => {
    expect(aplicar(ESTADO_INICIAL, iniciar(null, 3, 'livro')).formato).toBe('livro');
    expect(aplicar(ESTADO_INICIAL, iniciar(null, 3, 'rolagem')).formato).toBe('rolagem');
    expect(ESTADO_INICIAL.formato).toBe('rolagem');
  });

  it('FUN-23: letra inválida na inicialização vira 3; a válida é mantida', () => {
    expect(aplicar(ESTADO_INICIAL, iniciar(null, 9)).letra).toBe(3);
    expect(aplicar(ESTADO_INICIAL, iniciar(null, 5)).letra).toBe(5);
  });

  it('o tema gravado é mantido; sem tema, segue o sistema (null)', () => {
    expect(
      aplicar(ESTADO_INICIAL, { tipo: 'iniciar', ref: null, letra: 3, tema: 'sepia', formato: 'rolagem' }).tema,
    ).toBe('sepia');
    expect(aplicar(ESTADO_INICIAL, iniciar(null)).tema).toBeNull();
  });
});

describe('Ler Bíblia (FUN-54, FUN-55, FUN-56)', () => {
  const romanos8 = { livro: n('Romanos'), capitulo: 8 };

  it('FUN-54: Romanos 8 gravado abre Romanos 8 na rolagem', () => {
    const estado = aplicar(ESTADO_INICIAL, iniciar(romanos8), lerBiblia);
    expect(estado.tela).toBe('leitor');
    expect(estado.ref).toEqual(romanos8);
  });

  it('FUN-54: Romanos 8 gravado abre a âncora Romanos 8:1 no formato livro', () => {
    const estado = aplicar(ESTADO_INICIAL, iniciar(romanos8, 3, 'livro'), lerBiblia);
    expect(estado.tela).toBe('leitor');
    expect(estado.ref).toEqual(romanos8);
    expect(estado.ancora).toEqual({ tipo: 'texto', ref: romanos8, versiculo: 1 });
  });

  it('FUN-55: sem leitura gravada, a rolagem abre a escolha de livro', () => {
    const estado = aplicar(ESTADO_INICIAL, iniciar(null), lerBiblia);
    expect(estado.tela).toBe('livros');
    expect(estado.ref).toBeNull();
  });

  it('FUN-55: sem leitura gravada, o formato livro abre a capa', () => {
    const estado = aplicar(ESTADO_INICIAL, iniciar(null, 3, 'livro'), lerBiblia);
    expect(estado.tela).toBe('leitor');
    expect(estado.ref).toBeNull();
    expect(estado.ancora).toEqual({ tipo: 'capa' });
  });

  it('FUN-56 (AD-006): leitura inválida na abertura age como sem leitura, nos dois formatos', () => {
    const invalida = { livro: n('Judas'), capitulo: 2 };
    expect(aplicar(ESTADO_INICIAL, iniciar(invalida), lerBiblia).tela).toBe('livros');
    const livro = aplicar(ESTADO_INICIAL, iniciar(invalida, 3, 'livro'), lerBiblia);
    expect(livro.ancora).toEqual({ tipo: 'capa' });
    expect(livro.ref).toBeNull();
  });

  it('FUN-54: voltando à inicial e acionando de novo, retoma o mesmo capítulo', () => {
    const estado = aplicar(noLeitor('Romanos', 8), { tipo: 'irPara', tela: 'inicial' }, lerBiblia);
    expect(estado.tela).toBe('leitor');
    expect(estado.ref).toEqual(romanos8);
  });
});

describe('trocar formato (FUN-67, FUN-70, FUN-71)', () => {
  it('FUN-67: João 3 na rolagem vira o formato livro, com âncora João 3:1', () => {
    const joao3 = { livro: n('João'), capitulo: 3 };
    const estado = aplicar(noLeitor('João', 3), trocarFormato);
    expect(estado.formato).toBe('livro');
    expect(estado.tela).toBe('leitor');
    expect(estado.ref).toEqual(joao3);
    expect(estado.ancora).toEqual({ tipo: 'texto', ref: joao3, versiculo: 1 });
  });

  it('FUN-70: a âncora Rute 1:12 vira rolagem em Rute 1', () => {
    const rute1 = { livro: n('Rute'), capitulo: 1 };
    const noRute = aplicar(noLivro('Rute', 1), {
      tipo: 'trocarFormato',
    });
    expect(noRute.formato).toBe('rolagem');
    const comAncora: EstadoLeitor = {
      ...noLivro('Rute', 1),
      ancora: { tipo: 'texto', ref: rute1, versiculo: 12 },
    };
    const estado = aplicar(comAncora, trocarFormato);
    expect(estado.formato).toBe('rolagem');
    expect(estado.tela).toBe('leitor');
    expect(estado.ref).toEqual(rute1);
  });

  it('FUN-71: com a capa ou o texto do plano pago abertos, voltar à rolagem abre a escolha de livro', () => {
    const naCapa = aplicar(ESTADO_INICIAL, iniciar(null, 3, 'livro'), lerBiblia);
    expect(naCapa.ancora).toEqual({ tipo: 'capa' });
    const daCapa = aplicar(naCapa, trocarFormato);
    expect(daCapa.formato).toBe('rolagem');
    expect(daCapa.tela).toBe('livros');
    const noPago: EstadoLeitor = { ...naCapa, ancora: { tipo: 'pago' } };
    const doPago = aplicar(noPago, trocarFormato);
    expect(doPago.formato).toBe('rolagem');
    expect(doPago.tela).toBe('livros');
  });

  it('FUN-71: a âncora "fim" de um livro vira rolagem no último capítulo dele', () => {
    const noFim: EstadoLeitor = { ...noLivro('Rute', 1), ancora: { tipo: 'fim', livro: n('Rute') } };
    const estado = aplicar(noFim, trocarFormato);
    expect(estado.tela).toBe('leitor');
    expect(estado.ref).toEqual({ livro: n('Rute'), capitulo: 4 });
  });

  it('FUN-67: fora do leitor (inicial, Sobre) só troca o formato, sem mudar a tela nem o capítulo', () => {
    const naInicial = aplicar(ESTADO_INICIAL, iniciar({ livro: n('Romanos'), capitulo: 8 }));
    const trocada = aplicar(naInicial, trocarFormato);
    expect(trocada.formato).toBe('livro');
    expect(trocada.tela).toBe('inicial');
    expect(trocada.ref).toEqual(naInicial.ref);
    const noSobre = aplicar(noLeitor('Romanos', 8), { tipo: 'irPara', tela: 'sobre' }, trocarFormato);
    expect(noSobre.formato).toBe('livro');
    expect(noSobre.tela).toBe('sobre');
  });

  it('FUN-67: trocar duas vezes volta ao formato original', () => {
    const estado = aplicar(ESTADO_INICIAL, iniciar(null), trocarFormato, trocarFormato);
    expect(estado.formato).toBe('rolagem');
  });
});

describe('em breve, voltar e inicial (FUN-57, FUN-62)', () => {
  it('FUN-57: em breve a partir da inicial volta à inicial', () => {
    const naInicial = aplicar(ESTADO_INICIAL, iniciar(null));
    const emBreve = aplicar(naInicial, { tipo: 'abrirEmBreve' });
    expect(emBreve.tela).toBe('emBreve');
    expect(aplicar(emBreve, { tipo: 'voltar' }).tela).toBe('inicial');
  });

  it('FUN-57: em breve a partir do leitor volta ao mesmo capítulo', () => {
    const emBreve = aplicar(noLeitor('Romanos', 8), { tipo: 'abrirEmBreve' });
    expect(emBreve.tela).toBe('emBreve');
    const volta = aplicar(emBreve, { tipo: 'voltar' });
    expect(volta.tela).toBe('leitor');
    expect(volta.ref).toEqual({ livro: n('Romanos'), capitulo: 8 });
  });

  it('FUN-57: em breve a partir da grade volta à grade do mesmo livro', () => {
    const naGrade = aplicar(ESTADO_INICIAL, iniciar(null), { tipo: 'escolherLivro', livro: n('Salmos') });
    const volta = aplicar(naGrade, { tipo: 'abrirEmBreve' }, { tipo: 'voltar' });
    expect(volta.tela).toBe('capitulos');
    expect(volta.livroGrade).toBe(n('Salmos'));
  });

  it('FUN-57: abrir "em breve" estando nela não perde a origem', () => {
    const emBreve = aplicar(ESTADO_INICIAL, iniciar(null), { tipo: 'abrirEmBreve' });
    expect(reduzirLeitor(emBreve, { tipo: 'abrirEmBreve' }, indice)).toBe(emBreve);
    expect(aplicar(emBreve, { tipo: 'voltar' }).tela).toBe('inicial');
  });

  it('FUN-57: "voltar" sem origem vai à inicial; fora de "em breve" não muda o estado', () => {
    const semOrigem: EstadoLeitor = { ...ESTADO_INICIAL, tela: 'emBreve' };
    expect(aplicar(semOrigem, { tipo: 'voltar' }).tela).toBe('inicial');
    const noLeitorAgora = noLeitor('Romanos', 8);
    expect(reduzirLeitor(noLeitorAgora, { tipo: 'voltar' }, indice)).toBe(noLeitorAgora);
  });

  it.each([
    ['do leitor', () => noLeitor('Romanos', 8)],
    ['da grade', () => aplicar(ESTADO_INICIAL, iniciar(null), { tipo: 'escolherLivro', livro: n('Salmos') })],
    ['do Sobre', () => aplicar(noLeitor('Romanos', 8), { tipo: 'irPara', tela: 'sobre' })],
  ])('FUN-62: irPara inicial %s, mantendo a leitura para o "Ler Bíblia"', (_origem, montar) => {
    const origem = montar();
    const estado = aplicar(origem, { tipo: 'irPara', tela: 'inicial' });
    expect(estado.tela).toBe('inicial');
    expect(estado.ref).toEqual(origem.ref);
  });

  it('irPara emBreve guarda a origem, como abrirEmBreve', () => {
    const emBreve = aplicar(noLeitor('Romanos', 8), { tipo: 'irPara', tela: 'emBreve' });
    expect(emBreve.tela).toBe('emBreve');
    expect(aplicar(emBreve, { tipo: 'voltar' }).tela).toBe('leitor');
  });
});

describe('âncora do modo livro (FUN-83, FUN-84, FUN-85, FUN-88)', () => {
  const salmos23 = { livro: n('Salmos'), capitulo: 23 };
  const rute2 = { livro: n('Rute'), capitulo: 2 };

  it('FUN-83: Salmos 23 pela grade, no formato livro, dá âncora Salmos 23:1', () => {
    const estado = aplicar(
      ESTADO_INICIAL,
      iniciar(null, 3, 'livro'),
      lerBiblia,
      { tipo: 'escolherLivro', livro: n('Salmos') },
      { tipo: 'abrirCapitulo', ref: salmos23 },
    );
    expect(estado.tela).toBe('leitor');
    expect(estado.ref).toEqual(salmos23);
    expect(estado.ancora).toEqual({ tipo: 'texto', ref: salmos23, versiculo: 1 });
  });

  it('FUN-83: livro de capítulo único escolhido no formato livro abre com âncora no versículo 1', () => {
    const judas1 = { livro: n('Judas'), capitulo: 1 };
    const estado = aplicar(ESTADO_INICIAL, iniciar(null, 3, 'livro'), { tipo: 'escolherLivro', livro: n('Judas') });
    expect(estado.ref).toEqual(judas1);
    expect(estado.ancora).toEqual({ tipo: 'texto', ref: judas1, versiculo: 1 });
  });

  it('FUN-83: na rolagem a âncora não é tocada ao abrir um capítulo', () => {
    const antes = aplicar(ESTADO_INICIAL, iniciar(null));
    const estado = aplicar(antes, { tipo: 'abrirCapitulo', ref: salmos23 });
    expect(estado.ancora).toEqual(antes.ancora);
  });

  it('FUN-85: a âncora Rute 2:5 deixa ref em Rute 2', () => {
    const estado = aplicar(noLivro('Rute', 1), {
      tipo: 'irParaAncora',
      ancora: { tipo: 'texto', ref: rute2, versiculo: 5 },
    });
    expect(estado.ref).toEqual(rute2);
    expect(estado.ancora).toEqual({ tipo: 'texto', ref: rute2, versiculo: 5 });
    expect(estado.tela).toBe('leitor');
  });

  it('FUN-84: a âncora de texto vale também em outro livro (passar de Rute para 1 Samuel)', () => {
    const samuel = { livro: n('1 Samuel'), capitulo: 1 };
    const estado = aplicar(noLivro('Rute', 4), {
      tipo: 'irParaAncora',
      ancora: { tipo: 'texto', ref: samuel, versiculo: 1 },
    });
    expect(estado.ref).toEqual(samuel);
  });

  it.each([
    ['capa', { tipo: 'capa' } as const],
    ['pago', { tipo: 'pago' } as const],
    ['fim', { tipo: 'fim', livro: n('Rute') } as const],
  ])('FUN-88: a âncora %s muda só a âncora, não o ref', (_nome, ancora) => {
    const antes = noLivro('Rute', 2);
    const estado = aplicar(antes, { tipo: 'irParaAncora', ancora });
    expect(estado.ancora).toEqual(ancora);
    expect(estado.ref).toEqual(antes.ref);
  });

  it('FUN-88: âncora igual à atual devolve o mesmo objeto', () => {
    const antes = aplicar(noLivro('Rute', 2), { tipo: 'irParaAncora', ancora: { tipo: 'capa' } });
    expect(reduzirLeitor(antes, { tipo: 'irParaAncora', ancora: { tipo: 'capa' } }, indice)).toBe(antes);
  });

  it.each([
    ['capítulo fora do índice', { tipo: 'texto', ref: { livro: n('Rute'), capitulo: 5 }, versiculo: 1 } as const],
    ['livro fora do índice', { tipo: 'texto', ref: { livro: 67, capitulo: 1 }, versiculo: 1 } as const],
    ['versículo zero', { tipo: 'texto', ref: { livro: n('Rute'), capitulo: 1 }, versiculo: 0 } as const],
    ['versículo negativo', { tipo: 'texto', ref: { livro: n('Rute'), capitulo: 1 }, versiculo: -3 } as const],
    ['versículo fracionário', { tipo: 'texto', ref: { livro: n('Rute'), capitulo: 1 }, versiculo: 1.5 } as const],
    ['fim de livro fora do índice', { tipo: 'fim', livro: 67 } as const],
  ])('FUN-85: âncora com %s é ignorada (mesmo objeto)', (_caso, ancora) => {
    const antes = noLivro('Rute', 2);
    expect(reduzirLeitor(antes, { tipo: 'irParaAncora', ancora }, indice)).toBe(antes);
  });

  it('FUN-85: fora do formato livro ou fora do leitor, a âncora é ignorada', () => {
    const naRolagem = noLeitor('Rute', 2);
    const ancora = { tipo: 'texto', ref: rute2, versiculo: 5 } as const;
    expect(reduzirLeitor(naRolagem, { tipo: 'irParaAncora', ancora }, indice)).toBe(naRolagem);
    const noSobre = aplicar(noLivro('Rute', 2), { tipo: 'irPara', tela: 'sobre' });
    expect(reduzirLeitor(noSobre, { tipo: 'irParaAncora', ancora }, indice)).toBe(noSobre);
  });
});

describe('escolher livro e capítulo (FUN-07, FUN-08, FUN-09)', () => {
  it('FUN-09: escolher Judas (capítulo único) abre o leitor em Judas 1, sem a grade', () => {
    const estado = aplicar(ESTADO_INICIAL, iniciar(null), { tipo: 'escolherLivro', livro: n('Judas') });
    expect(estado.tela).toBe('leitor');
    expect(estado.ref).toEqual({ livro: n('Judas'), capitulo: 1 });
  });

  it('FUN-07: escolher Salmos abre a grade de Salmos', () => {
    const estado = aplicar(ESTADO_INICIAL, iniciar(null), { tipo: 'escolherLivro', livro: n('Salmos') });
    expect(estado.tela).toBe('capitulos');
    expect(estado.livroGrade).toBe(n('Salmos'));
    expect(estado.ref).toBeNull();
  });

  it('FUN-08: escolher o 27 na grade abre Salmos 27', () => {
    const estado = aplicar(
      ESTADO_INICIAL,
      iniciar(null),
      { tipo: 'escolherLivro', livro: n('Salmos') },
      { tipo: 'abrirCapitulo', ref: { livro: n('Salmos'), capitulo: 27 } },
    );
    expect(estado.tela).toBe('leitor');
    expect(estado.ref).toEqual({ livro: n('Salmos'), capitulo: 27 });
  });

  it('livro fora do índice (0 e 67) não muda o estado', () => {
    const antes = aplicar(ESTADO_INICIAL, iniciar(null));
    expect(reduzirLeitor(antes, { tipo: 'escolherLivro', livro: 0 }, indice)).toBe(antes);
    expect(reduzirLeitor(antes, { tipo: 'escolherLivro', livro: 67 }, indice)).toBe(antes);
  });

  it('capítulo fora do intervalo (Salmos 151) não muda o estado', () => {
    const antes = aplicar(ESTADO_INICIAL, iniciar(null), { tipo: 'escolherLivro', livro: n('Salmos') });
    expect(reduzirLeitor(antes, { tipo: 'abrirCapitulo', ref: { livro: n('Salmos'), capitulo: 151 } }, indice)).toBe(
      antes,
    );
  });
});

describe('título e trocar livro (FUN-49, FUN-50, FUN-06)', () => {
  it('FUN-49: tocar no título em Salmos 27 abre a grade de Salmos', () => {
    const estado = aplicar(noLeitor('Salmos', 27), { tipo: 'tocarTitulo' });
    expect(estado.tela).toBe('capitulos');
    expect(estado.livroGrade).toBe(n('Salmos'));
    expect(estado.ref).toEqual({ livro: n('Salmos'), capitulo: 27 });
  });

  it('FUN-50: tocar no título em Filemom 1 (capítulo único) abre a escolha de livro', () => {
    const estado = aplicar(noLeitor('Filemom', 1), { tipo: 'tocarTitulo' });
    expect(estado.tela).toBe('livros');
  });

  it('FUN-49: "Trocar livro" na grade abre a escolha de livro', () => {
    const estado = aplicar(noLeitor('Salmos', 27), { tipo: 'tocarTitulo' }, { tipo: 'trocarLivro' });
    expect(estado.tela).toBe('livros');
    expect(estado.livroGrade).toBeNull();
  });

  it('tocar no título sem capítulo aberto não muda o estado', () => {
    const antes = aplicar(ESTADO_INICIAL, iniciar(null));
    expect(reduzirLeitor(antes, { tipo: 'tocarTitulo' }, indice)).toBe(antes);
  });
});

describe('seguinte e anterior (FUN-10 a FUN-15)', () => {
  it('FUN-10: seguinte em Salmos 26 abre Salmos 27', () => {
    expect(aplicar(noLeitor('Salmos', 26), { tipo: 'seguinte' }).ref).toEqual({ livro: n('Salmos'), capitulo: 27 });
  });

  it('FUN-13: anterior em Mateus 1 abre Malaquias 4', () => {
    expect(aplicar(noLeitor('Mateus', 1), { tipo: 'anterior' }).ref).toEqual({ livro: n('Malaquias'), capitulo: 4 });
  });

  it('FUN-15: seguinte em Apocalipse 22 não muda o estado', () => {
    const antes = noLeitor('Apocalipse', 22);
    expect(reduzirLeitor(antes, { tipo: 'seguinte' }, indice)).toBe(antes);
  });

  it('FUN-14: anterior em Gênesis 1 não muda o estado', () => {
    const antes = noLeitor('Gênesis', 1);
    expect(reduzirLeitor(antes, { tipo: 'anterior' }, indice)).toBe(antes);
  });
});

describe('letra (FUN-23 a FUN-27)', () => {
  it('FUN-23: a letra começa em 3', () => {
    expect(ESTADO_INICIAL.letra).toBe(3);
  });

  it('FUN-24/FUN-26: +1 vai até 5 e para', () => {
    const mais: AcaoLeitor = { tipo: 'mudarLetra', delta: 1 };
    expect(aplicar(ESTADO_INICIAL, mais).letra).toBe(4);
    const no5 = aplicar(ESTADO_INICIAL, mais, mais);
    expect(no5.letra).toBe(5);
    expect(reduzirLeitor(no5, mais, indice)).toBe(no5);
  });

  it('FUN-25/FUN-27: -1 vai até 1 e para', () => {
    const menos: AcaoLeitor = { tipo: 'mudarLetra', delta: -1 };
    expect(aplicar(ESTADO_INICIAL, menos).letra).toBe(2);
    const no1 = aplicar(ESTADO_INICIAL, menos, menos);
    expect(no1.letra).toBe(1);
    expect(reduzirLeitor(no1, menos, indice)).toBe(no1);
  });
});

describe('tema (FUN-28)', () => {
  it('FUN-28: escolher sépia guarda o tema', () => {
    expect(aplicar(ESTADO_INICIAL, { tipo: 'escolherTema', tema: 'sepia' }).tema).toBe('sepia');
  });
});

describe('irPara', () => {
  it('abre o Sobre a partir do leitor e volta ao mesmo capítulo', () => {
    const sobre = aplicar(noLeitor('Romanos', 8), { tipo: 'irPara', tela: 'sobre' });
    expect(sobre.tela).toBe('sobre');
    const volta = aplicar(sobre, { tipo: 'irPara', tela: 'leitor' });
    expect(volta.tela).toBe('leitor');
    expect(volta.ref).toEqual({ livro: n('Romanos'), capitulo: 8 });
  });

  it('FUN-122: do Sobre abre as correções e volta ao Sobre mantendo capítulo, formato e âncora', () => {
    const sobre = aplicar(noLeitor('Romanos', 8), { tipo: 'irPara', tela: 'sobre' });
    const correcoes = aplicar(sobre, { tipo: 'irPara', tela: 'correcoes' });
    expect(correcoes.tela).toBe('correcoes');
    expect(correcoes.ref).toEqual(sobre.ref);
    expect(correcoes.formato).toBe(sobre.formato);
    expect(correcoes.ancora).toEqual(sobre.ancora);
    const volta = aplicar(correcoes, { tipo: 'irPara', tela: 'sobre' });
    expect(volta).toEqual(sobre);
  });

  it('não abre o leitor sem capítulo', () => {
    const antes = aplicar(ESTADO_INICIAL, iniciar(null));
    expect(reduzirLeitor(antes, { tipo: 'irPara', tela: 'leitor' }, indice)).toBe(antes);
  });
});

describe('Sobre no formato livro sem leitura (FUN-60)', () => {
  it('FUN-60: irPara leitor volta à capa quando o formato é livro e não há capítulo', () => {
    const sobre = aplicar(ESTADO_INICIAL, trocarFormato, lerBiblia, { tipo: 'irPara', tela: 'sobre' });
    expect(sobre.tela).toBe('sobre');
    const volta = aplicar(sobre, { tipo: 'irPara', tela: 'leitor' });
    expect(volta.tela).toBe('leitor');
    expect(volta.ancora).toEqual({ tipo: 'capa' });
  });

  it('FUN-60: na rolagem sem capítulo, irPara leitor continua ignorado', () => {
    const estado = aplicar(ESTADO_INICIAL, { tipo: 'irPara', tela: 'leitor' });
    expect(estado.tela).toBe('inicial');
  });
});

describe('lugar no livro e capítulo na rolagem (FUN-71; AD-007)', () => {
  it('AD-007: voltar à rolagem abre o capítulo da âncora, mesmo que a página comece no capítulo anterior', () => {
    const noLivro = aplicar(
      ESTADO_INICIAL,
      iniciar({ livro: n('João'), capitulo: 3 }, 3, 'livro'),
      lerBiblia,
      { tipo: 'irParaAncora', ancora: { tipo: 'texto', ref: { livro: n('João'), capitulo: 3 }, versiculo: 1 } },
      trocarFormato,
    );
    expect(noLivro.formato).toBe('rolagem');
    expect(noLivro.ref).toEqual({ livro: n('João'), capitulo: 3 });
  });

  it('FUN-71: depois de passar páginas, a rolagem abre o capítulo da âncora de agora (primeiro versículo da página)', () => {
    const estado = aplicar(
      ESTADO_INICIAL,
      iniciar({ livro: n('João'), capitulo: 3 }, 3, 'livro'),
      lerBiblia,
      { tipo: 'irParaAncora', ancora: { tipo: 'texto', ref: { livro: n('João'), capitulo: 4 }, versiculo: 2 } },
      trocarFormato,
    );
    expect(estado.ref).toEqual({ livro: n('João'), capitulo: 4 });
  });
});

describe('fatia da âncora num versículo maior que a página (FUN-77, FUN-78, FUN-85)', () => {
  const rute = { livro: n('Rute'), capitulo: 1 };
  const versiculo = (v: number, fatia?: number) =>
    ({ tipo: 'texto', ref: rute, versiculo: v, ...(fatia === undefined ? {} : { fatia }) }) as const;
  const noRute = () => noLivro('Rute', 1);

  it('FUN-77: irParaAncora com fatia 1 guarda a fatia na âncora e muda o estado', () => {
    const antes = aplicar(noRute(), { tipo: 'irParaAncora', ancora: versiculo(3) });
    const depois = aplicar(antes, { tipo: 'irParaAncora', ancora: versiculo(3, 1) });
    expect(depois).not.toBe(antes);
    expect(depois.ancora).toEqual(versiculo(3, 1));
  });

  it('FUN-77: da fatia 1 para a 2 do mesmo versículo, a âncora muda (as fatias não são a mesma âncora)', () => {
    const f1 = aplicar(noRute(), { tipo: 'irParaAncora', ancora: versiculo(3, 1) });
    const f2 = aplicar(f1, { tipo: 'irParaAncora', ancora: versiculo(3, 2) });
    expect(f2.ancora).toEqual(versiculo(3, 2));
  });

  it('FUN-78: voltar da fatia 1 ao versículo sem fatia muda a âncora e tira a fatia', () => {
    const f1 = aplicar(noRute(), { tipo: 'irParaAncora', ancora: versiculo(3, 1) });
    const volta = aplicar(f1, { tipo: 'irParaAncora', ancora: versiculo(3) });
    expect(volta.ancora).toEqual(versiculo(3));
    expect(volta.ancora).not.toHaveProperty('fatia');
  });

  it('FUN-85: fatia 0 e fatia ausente são a mesma âncora (o estado não muda)', () => {
    const sem = aplicar(noRute(), { tipo: 'irParaAncora', ancora: versiculo(3) });
    expect(reduzirLeitor(sem, { tipo: 'irParaAncora', ancora: versiculo(3, 0) }, indice)).toBe(sem);
  });
});

describe('tela "entrar" com volta à origem (FUN-137, FUN-138)', () => {
  const origens: [string, () => EstadoLeitor][] = [
    ['inicial', () => aplicar(ESTADO_INICIAL, iniciar(null))],
    ['livros', () => aplicar(ESTADO_INICIAL, iniciar(null), lerBiblia)],
    ['leitor na rolagem', () => noLeitor('Romanos', 8)],
    ['leitor no livro', () => noLivro('Rute', 2)],
    ['sobre', () => aplicar(noLeitor('Romanos', 8), { tipo: 'irPara', tela: 'sobre' })],
  ];

  it.each(origens)(
    'FUN-138: de %s, abrirEntrar vai a "entrar" e voltar volta à mesma tela com a mesma âncora',
    (_nome, montar) => {
      const origem = montar();
      const aberta = aplicar(origem, { tipo: 'abrirEntrar' });
      expect(aberta.tela).toBe('entrar');
      expect(aberta.voltarPara).toBe(origem.tela);
      const volta = aplicar(aberta, { tipo: 'voltar' });
      expect(volta.tela).toBe(origem.tela);
      expect(volta.ref).toEqual(origem.ref);
      expect(volta.ancora).toEqual(origem.ancora);
      expect(volta.livroGrade).toBe(origem.livroGrade);
    },
  );

  it('FUN-138: de uma tela de grade de capítulos, voltar volta à grade do mesmo livro', () => {
    const naGrade = aplicar(ESTADO_INICIAL, iniciar(null), { tipo: 'escolherLivro', livro: n('Salmos') });
    const volta = aplicar(naGrade, { tipo: 'abrirEntrar' }, { tipo: 'voltar' });
    expect(volta.tela).toBe('capitulos');
    expect(volta.livroGrade).toBe(n('Salmos'));
  });

  it('FUN-137: irPara "entrar" abre a tela como abrirEntrar', () => {
    const estado = aplicar(noLeitor('Romanos', 8), { tipo: 'irPara', tela: 'entrar' });
    expect(estado.tela).toBe('entrar');
    expect(aplicar(estado, { tipo: 'voltar' }).tela).toBe('leitor');
  });

  it('FUN-138: abrirEntrar estando em "entrar" não muda a origem guardada (mesmo objeto)', () => {
    const aberta = aplicar(noLeitor('Romanos', 8), { tipo: 'abrirEntrar' });
    expect(reduzirLeitor(aberta, { tipo: 'abrirEntrar' }, indice)).toBe(aberta);
    expect(aplicar(aberta, { tipo: 'voltar' }).tela).toBe('leitor');
  });

  it('FUN-137: de "entrar", "Criar conta" vai a "em breve" e o voltar de lá volta a "entrar"', () => {
    const emBreve = aplicar(noLeitor('Romanos', 8), { tipo: 'abrirEntrar' }, { tipo: 'abrirEmBreve' });
    expect(emBreve.tela).toBe('emBreve');
    expect(aplicar(emBreve, { tipo: 'voltar' }).tela).toBe('entrar');
  });

  it('FUN-138: de "entrar" aberta por "em breve" o voltar não cai em si mesma: vai à inicial', () => {
    const cicloDeVolta = aplicar(
      noLeitor('Romanos', 8),
      { tipo: 'abrirEntrar' },
      { tipo: 'abrirEmBreve' },
      { tipo: 'voltar' },
    );
    expect(cicloDeVolta.tela).toBe('entrar');
    expect(aplicar(cicloDeVolta, { tipo: 'voltar' }).tela).toBe('inicial');
  });

  it('FUN-138: "voltar" sem origem guardada em "entrar" vai à inicial', () => {
    const semOrigem: EstadoLeitor = { ...ESTADO_INICIAL, tela: 'entrar' };
    expect(aplicar(semOrigem, { tipo: 'voltar' }).tela).toBe('inicial');
  });
});
