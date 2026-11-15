import { indice } from './biblia/indice';
import { ConviteInstalacao } from './componentes/ConviteInstalacao';
import { useLeitor } from './estado/useLeitor';
import { TelaCapitulos } from './telas/TelaCapitulos';
import { TelaLeitor } from './telas/TelaLeitor';
import { TelaLivros } from './telas/TelaLivros';
import { TelaSobre } from './telas/TelaSobre';

/**
 * Composição do app (design: "Telas", sem rotas): a tela do estado do leitor, o painel (dentro do leitor) e o convite
 * de instalação. Na primeira visita (FUN-21), a própria escolha de livro é o estado vazio.
 * SPEC_DEVIATION: o vazio "Comece a ler" do guia não vira uma tela à parte antes da escolha de livro: a spec (FUN-21)
 * manda mostrar a escolha direto, e a tela intermediária acrescentaria um toque.
 */
export function App() {
  const leitor = useLeitor();
  const { estado, carga } = leitor;
  const ref = estado.ref;

  const voltarALeitura = () => leitor.irPara('leitor');
  const abrirSobre = () => leitor.irPara('sobre');

  let tela;
  if (estado.tela === 'leitor' && ref && carga) {
    tela = (
      <TelaLeitor
        referencia={ref}
        carga={carga}
        aoTocarTitulo={leitor.tocarTitulo}
        aoAnterior={leitor.anterior}
        aoSeguinte={leitor.seguinte}
        aoAbrirSobre={abrirSobre}
        letra={estado.letra}
        tema={estado.tema}
        aoMudarLetra={leitor.mudarLetra}
        aoEscolherTema={leitor.escolherTema}
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
        aoAbrirSobre={abrirSobre}
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
        aoAbrirSobre={abrirSobre}
      />
    );
  }

  return (
    <>
      {tela}
      <ConviteInstalacao />
    </>
  );
}
