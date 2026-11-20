import { useState } from 'react';
import { resumoCorrecoes } from './biblia/correcoesAplicadas';
import { indice } from './biblia/indice';
import { BarraTitulo } from './componentes/BarraTitulo';
import { ConviteInstalacao } from './componentes/ConviteInstalacao';
import { gravarResumoLigado, lerResumoLigado } from './dados/preferencias';
import { useLeitor } from './estado/useLeitor';
import { useSessao } from './estado/useSessao';
import { PaginaResumo } from './livro/PaginaResumo';
import { useTelaLarga } from './livro/useTelaLarga';
import { TelaLivro } from './telas/TelaLivro';
import { TelaCapitulos } from './telas/TelaCapitulos';
import { TelaCorrecoes } from './telas/TelaCorrecoes';
import { TelaEmBreve } from './telas/TelaEmBreve';
import { TelaEntrar } from './telas/TelaEntrar';
import { TelaInicial } from './telas/TelaInicial';
import { TelaLeitor } from './telas/TelaLeitor';
import { TelaLivros } from './telas/TelaLivros';
import { TelaSobre } from './telas/TelaSobre';

/**
 * Composição do app (design: "Telas", sem rotas): a barra de título (FUN-60), a tela do estado do leitor e o convite
 * de instalação. O app abre na página inicial (FUN-51); sem leitura gravada, "Ler Bíblia" mostra a escolha de livro
 * (FUN-55).
 */
export function App() {
  const leitor = useLeitor();
  const sessao = useSessao();
  const larga = useTelaLarga();
  const { estado, carga } = leitor;
  const ref = estado.ref;

  // Resumo no modo livro (FUN-153, FUN-157, FUN-162): na tela larga a escolha é gravada; na estreita fica só na memória
  // e vale para o livro em que foi ligada (trocar de livro a desliga).
  const [resumoLarga, setResumoLarga] = useState(lerResumoLigado);
  const [resumoEstreita, setResumoEstreita] = useState<number | null>(null);
  const numeroLivro =
    estado.ancora.tipo === 'texto' ? estado.ancora.ref.livro : estado.ancora.tipo === 'fim' ? estado.ancora.livro : 0;
  const comBotaoResumo =
    sessao.sessao === 'dono' && estado.tela === 'leitor' && estado.formato === 'livro' && numeroLivro > 0;
  const resumoLigado = larga ? resumoLarga : resumoEstreita === numeroLivro;
  const modoResumo = !comBotaoResumo || !resumoLigado ? 'desligado' : larga ? 'lado' : 'sozinho';
  const alternarResumo = () => {
    if (larga) {
      gravarResumoLigado(!resumoLarga);
      setResumoLarga(!resumoLarga);
    } else {
      setResumoEstreita(resumoEstreita === numeroLivro ? null : numeroLivro);
    }
  };

  const voltarALeitura = () => leitor.irPara('leitor');
  const abrirSobre = () => leitor.irPara('sobre');

  let tela;
  if (estado.tela === 'inicial') {
    // FUN-51: o app abre sempre na página inicial, com ou sem leitura gravada.
    tela = <TelaInicial aoLerBiblia={leitor.lerBiblia} aoCriarConta={leitor.abrirEmBreve} />;
  } else if (estado.tela === 'emBreve') {
    tela = <TelaEmBreve aoVoltar={leitor.voltar} aoLerBiblia={leitor.lerBiblia} />;
  } else if (estado.tela === 'entrar') {
    // FUN-137, FUN-138: com a sessão aberta, volta à tela de onde o login foi aberto; "Criar conta" vai à "em breve".
    tela = (
      <TelaEntrar
        aoEntrar={async (email, senha) => {
          const resultado = await sessao.entrar(email, senha);
          if (resultado === 'dono' || resultado === 'usuario') leitor.voltar();
          return resultado;
        }}
        aoVoltar={leitor.voltar}
        aoCriarConta={leitor.abrirEmBreve}
      />
    );
  } else if (estado.tela === 'leitor' && estado.formato === 'livro') {
    // FUN-66, FUN-67: no formato livro a tela é a do livro, com a âncora; a capa e o plano pago não têm livro (carga nula).
    tela = (
      <TelaLivro
        ancora={estado.ancora}
        carga={carga}
        larga={larga}
        letra={estado.letra}
        aoIrParaAncora={leitor.irParaAncora}
        aoTocarTitulo={leitor.tocarTitulo}
        aoEscolherOutroLivro={leitor.trocarLivro}
        aoQueroSaber={leitor.abrirEmBreve}
        resumo={modoResumo}
        paginaResumo={
          modoResumo === 'desligado' ? undefined : (
            <PaginaResumo
              numeroLivro={numeroLivro}
              nome={indice.livros[numeroLivro - 1]?.nome ?? ''}
              aoPerderSessao={sessao.perder}
              letra={estado.letra}
            />
          )
        }
      />
    );
  } else if (estado.tela === 'leitor' && ref && carga) {
    tela = (
      <TelaLeitor
        referencia={ref}
        carga={carga}
        aoTocarTitulo={leitor.tocarTitulo}
        aoAnterior={leitor.anterior}
        aoSeguinte={leitor.seguinte}
        aoEscolherOutroLivro={leitor.trocarLivro}
      />
    );
  } else if (estado.tela === 'capitulos' && estado.livroGrade !== null) {
    tela = (
      <TelaCapitulos
        livro={estado.livroGrade}
        referencia={ref}
        aoAbrirCapitulo={leitor.abrirCapitulo}
        aoTrocarLivro={leitor.trocarLivro}
        aoVoltarALeitura={voltarALeitura}
      />
    );
  } else if (estado.tela === 'sobre') {
    const nome = ref ? indice.livros[ref.livro - 1]?.nome : undefined;
    tela = (
      <TelaSobre
        rotuloVoltar={ref && nome ? `${nome} ${ref.capitulo}` : estado.formato === 'livro' ? 'Capa' : 'Livros'}
        aoVoltar={() => leitor.irPara(ref || estado.formato === 'livro' ? 'leitor' : 'livros')}
        totalCorrecoes={resumoCorrecoes.total}
        aoVerCorrecoes={() => leitor.irPara('correcoes')}
      />
    );
  } else if (estado.tela === 'correcoes') {
    tela = <TelaCorrecoes aoVoltar={() => leitor.irPara('sobre')} />;
  } else {
    tela = <TelaLivros referencia={ref} aoEscolherLivro={leitor.escolherLivro} aoVoltarALeitura={voltarALeitura} />;
  }

  return (
    <>
      <BarraTitulo
        formato={estado.formato}
        letra={estado.letra}
        tema={estado.tema}
        aoIrParaInicial={() => leitor.irPara('inicial')}
        aoTrocarFormato={leitor.trocarFormato}
        aoAbrirSobre={abrirSobre}
        aoAbrirConta={leitor.abrirEntrar}
        comSessao={sessao.sessao !== 'sem'}
        aoSair={() => void sessao.sair()}
        resumo={comBotaoResumo ? { ligado: resumoLigado, aoAlternar: alternarResumo } : undefined}
        aoMudarLetra={leitor.mudarLetra}
        aoEscolherTema={leitor.escolherTema}
      />
      {tela}
      <ConviteInstalacao />
    </>
  );
}
