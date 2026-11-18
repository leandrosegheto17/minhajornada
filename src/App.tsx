import { indice } from './biblia/indice';
import { BarraTitulo } from './componentes/BarraTitulo';
import { ConviteInstalacao } from './componentes/ConviteInstalacao';
import { useLeitor } from './estado/useLeitor';
import { TelaCapitulos } from './telas/TelaCapitulos';
import { TelaEmBreve } from './telas/TelaEmBreve';
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
  const { estado, carga } = leitor;
  const ref = estado.ref;

  const voltarALeitura = () => leitor.irPara('leitor');
  const abrirSobre = () => leitor.irPara('sobre');

  let tela;
  if (estado.tela === 'inicial') {
    // FUN-51: o app abre sempre na página inicial, com ou sem leitura gravada.
    tela = <TelaInicial aoLerBiblia={leitor.lerBiblia} aoCriarConta={leitor.abrirEmBreve} />;
  } else if (estado.tela === 'emBreve') {
    tela = <TelaEmBreve aoVoltar={leitor.voltar} aoLerBiblia={leitor.lerBiblia} />;
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
        rotuloVoltar={ref && nome ? `${nome} ${ref.capitulo}` : 'Livros'}
        aoVoltar={() => leitor.irPara(ref ? 'leitor' : 'livros')}
      />
    );
  } else {
    tela = (
      <TelaLivros
        referencia={ref}
        aoEscolherLivro={leitor.escolherLivro}
        aoVoltarALeitura={voltarALeitura}
      />
    );
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
        aoAbrirConta={leitor.abrirEmBreve}
        aoMudarLetra={leitor.mudarLetra}
        aoEscolherTema={leitor.escolherTema}
      />
      {tela}
      <ConviteInstalacao />
    </>
  );
}
