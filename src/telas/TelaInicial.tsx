import { useState } from 'react';
import { BotaoPrimario, BotaoSecundario } from '../componentes/base/Botoes';
import { IconeLivroAberto } from '../componentes/icones';
import foto from '../estilo/imagens/inicial.webp';
import estilo from './TelaInicial.module.css';

interface Props {
  /** "Ler Bíblia" (FUN-54, FUN-55). */
  aoLerBiblia: () => void;
  /** "Criar conta" (FUN-57). */
  aoCriarConta: () => void;
}

export const ALT_FOTO = 'Bíblia aberta sobre uma pedra, iluminada pela luz da tarde';
export const CREDITO_FOTO = 'Foto: Aaron Burden / Unsplash';

/**
 * Página inicial (FUN-51 a FUN-53, FUN-59; mockup `telas/inicial.html`): a foto ocupa a área abaixo da barra, com um
 * véu, e o cartão traz "Ler Bíblia" e "Criar conta". Se a foto não carrega, o fundo é o do tema e o cartão continua
 * legível (FUN-59).
 */
export function TelaInicial({ aoLerBiblia, aoCriarConta }: Props) {
  const [semFoto, setSemFoto] = useState(false);

  return (
    <main className={`${estilo.inicial} ${semFoto ? estilo['inicial--sem-imagem'] : ''}`}>
      {semFoto ? null : (
        <img className={estilo['inicial__imagem']} src={foto} alt={ALT_FOTO} onError={() => setSemFoto(true)} />
      )}
      <section className={estilo['cartao-inicial']} aria-labelledby="titulo-inicial">
        <h1 id="titulo-inicial">A Palavra perto de você, onde estiver</h1>
        <p>Leia a Bíblia no celular ou no computador, sem anúncios, sem cadastro e até sem internet.</p>
        <div className={estilo['cartao-inicial__acoes']}>
          <BotaoPrimario icone={<IconeLivroAberto />} onClick={aoLerBiblia}>
            Ler Bíblia
          </BotaoPrimario>
          <BotaoSecundario onClick={aoCriarConta}>Criar conta</BotaoSecundario>
        </div>
      </section>
      {semFoto ? null : <span className={estilo['credito-imagem']}>{CREDITO_FOTO}</span>}
    </main>
  );
}
