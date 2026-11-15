import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BotaoIcone, BotaoPrimario, BotaoSecundario, BotaoVoltar } from './Botoes';

const icone = <svg data-testid="icone" aria-hidden="true" />;

describe('BotaoIcone (FUN-44)', () => {
  it('FUN-44: expõe o rótulo recebido como nome acessível', () => {
    render(<BotaoIcone rotulo="Capítulo seguinte">{icone}</BotaoIcone>);
    const botao = screen.getByRole('button', { name: 'Capítulo seguinte' });
    expect(botao).toHaveAttribute('aria-label', 'Capítulo seguinte');
  });

  it('FUN-44: o ícone é decorativo e não entra no nome', () => {
    render(<BotaoIcone rotulo="Sobre o MinhaJornada">{icone}</BotaoIcone>);
    expect(screen.getByTestId('icone')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('button')).toHaveAccessibleName('Sobre o MinhaJornada');
  });

  it('FUN-44: o rótulo é obrigatório no tipo', () => {
    // Só para o typecheck: nunca é renderizado.
    function semRotulo() {
      // @ts-expect-error `rotulo` é obrigatório (FUN-44)
      return <BotaoIcone>{icone}</BotaoIcone>;
    }
    expect(typeof semRotulo).toBe('function');
  });

  it('FUN-44: desativado fica disabled e não dispara o clique', () => {
    const aoClicar = vi.fn();
    render(
      <BotaoIcone rotulo="Aumentar letra" disabled onClick={aoClicar}>
        {icone}
      </BotaoIcone>,
    );
    const botao = screen.getByRole('button', { name: 'Aumentar letra' });
    expect(botao).toBeDisabled();
    fireEvent.click(botao);
    expect(aoClicar).not.toHaveBeenCalled();
  });

  it('ativo dispara o clique uma vez', () => {
    const aoClicar = vi.fn();
    render(
      <BotaoIcone rotulo="Aumentar letra" onClick={aoClicar}>
        {icone}
      </BotaoIcone>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Aumentar letra' }));
    expect(aoClicar).toHaveBeenCalledTimes(1);
  });
});

describe('variantes do guia', () => {
  it.each([
    ['BotaoPrimario', <BotaoPrimario key="p">Ler Gênesis 1</BotaoPrimario>, 'Ler Gênesis 1', /botao-primario/],
    ['BotaoSecundario', <BotaoSecundario key="s">Trocar livro</BotaoSecundario>, 'Trocar livro', /botao-secundario/],
    ['BotaoVoltar', <BotaoVoltar key="v">Salmos 27</BotaoVoltar>, 'Salmos 27', /botao-voltar/],
    [
      'BotaoIcone',
      <BotaoIcone key="i" rotulo="Aparência: letra e tema">
        {icone}
      </BotaoIcone>,
      'Aparência: letra e tema',
      /botao-icone/,
    ],
  ] as const)('%s tem a classe do guia e type="button"', (_nome, elemento, nome, classe) => {
    render(elemento);
    const botao = screen.getByRole('button', { name: nome });
    expect(botao.className).toMatch(classe);
    expect(botao).toHaveAttribute('type', 'button');
  });

  it('as variantes não compartilham a classe', () => {
    render(
      <>
        <BotaoPrimario>Um</BotaoPrimario>
        <BotaoSecundario>Dois</BotaoSecundario>
      </>,
    );
    expect(screen.getByRole('button', { name: 'Um' }).className).not.toMatch(/botao-secundario/);
    expect(screen.getByRole('button', { name: 'Dois' }).className).not.toMatch(/botao-primario/);
  });

  it('BotaoSecundario mostra o ícone antes do texto', () => {
    render(<BotaoSecundario icone={icone}>Trocar livro</BotaoSecundario>);
    const botao = screen.getByRole('button', { name: 'Trocar livro' });
    expect(botao.firstElementChild).toBe(screen.getByTestId('icone'));
  });

  it('BotaoPrimario desativado não dispara o clique', () => {
    const aoClicar = vi.fn();
    render(
      <BotaoPrimario disabled onClick={aoClicar}>
        Ler
      </BotaoPrimario>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Ler' }));
    expect(aoClicar).not.toHaveBeenCalled();
  });

  it('BotaoVoltar dispara o clique e a seta é decorativa', () => {
    const aoClicar = vi.fn();
    render(<BotaoVoltar onClick={aoClicar}>Salmos 27</BotaoVoltar>);
    const botao = screen.getByRole('button', { name: 'Salmos 27' });
    expect(botao.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    fireEvent.click(botao);
    expect(aoClicar).toHaveBeenCalledTimes(1);
  });
});
