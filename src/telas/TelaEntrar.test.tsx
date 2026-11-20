import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ResultadoEntrar } from '../dados/sessao';
import { MENSAGEM_INCORRETO, MENSAGEM_LIMITE, MENSAGEM_REDE, TelaEntrar } from './TelaEntrar';

function renderizar(resultado: ResultadoEntrar | Promise<ResultadoEntrar> = 'dono') {
  const props = {
    aoEntrar: vi.fn(async () => resultado),
    aoVoltar: vi.fn(),
    aoCriarConta: vi.fn(),
  };
  const { container } = render(<TelaEntrar {...props} />);
  return { props, container };
}

const email = () => screen.getByLabelText('E-mail');
const senha = () => screen.getByLabelText('Senha');

describe('tela Entrar: conteúdo (FUN-137)', () => {
  it('FUN-137: tem os campos E-mail e Senha, o botão "Entrar" e o link "Criar conta"', () => {
    renderizar();
    expect(screen.getByRole('heading', { level: 1, name: 'Entrar' })).toBeInTheDocument();
    expect(email()).toHaveAttribute('type', 'email');
    expect(senha()).toHaveAttribute('type', 'password');
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Criar conta' })).toBeInTheDocument();
  });

  it('FUN-137: "Criar conta" chama aoCriarConta e "Voltar" chama aoVoltar', async () => {
    const { props } = renderizar();
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }));
    expect(props.aoCriarConta).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole('button', { name: 'Voltar' }));
    expect(props.aoVoltar).toHaveBeenCalledTimes(1);
    expect(props.aoEntrar).not.toHaveBeenCalled();
  });

  it('FUN-137: não há <form>, para o envio nativo nunca acontecer (CSP form-action none)', () => {
    const { container } = renderizar();
    expect(container.querySelector('form')).toBeNull();
  });
});

describe('tela Entrar: erros (FUN-139, FUN-140)', () => {
  it('FUN-139: "incorreto" mostra "E-mail ou senha incorretos." (role alert), limpa a senha e marca o campo', async () => {
    renderizar('incorreto');
    await userEvent.type(email(), 'dono@exemplo.com');
    await userEvent.type(senha(), 'errada');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha incorretos.');
    expect(MENSAGEM_INCORRETO).toBe('E-mail ou senha incorretos.');
    expect(senha()).toHaveValue('');
    expect(email()).toHaveValue('dono@exemplo.com');
    expect(senha()).toHaveAttribute('aria-invalid', 'true');
    expect(senha()).toHaveAttribute('aria-describedby');
  });

  it('FUN-140: "limite" mostra "Muitas tentativas. Tente de novo em 1 minuto."', async () => {
    renderizar('limite');
    await userEvent.type(email(), 'a@b.c');
    await userEvent.type(senha(), 'x');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Muitas tentativas. Tente de novo em 1 minuto.');
    expect(MENSAGEM_LIMITE).toBe('Muitas tentativas. Tente de novo em 1 minuto.');
    expect(senha()).not.toHaveAttribute('aria-invalid');
  });

  it('FUN-137: "rede" mostra a mensagem de rede da tela', async () => {
    renderizar('rede');
    await userEvent.type(email(), 'a@b.c');
    await userEvent.type(senha(), 'x');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(MENSAGEM_REDE);
  });

  it('FUN-138: com sessão aberta ("dono" ou "usuario") a tela não mostra erro', async () => {
    for (const resultado of ['dono', 'usuario'] as const) {
      const { props } = renderizar(resultado);
      await userEvent.type(screen.getAllByLabelText('E-mail').at(-1)!, 'a@b.c');
      await userEvent.click(screen.getAllByRole('button', { name: 'Entrar' }).at(-1)!);
      await waitFor(() => expect(props.aoEntrar).toHaveBeenCalled());
      expect(screen.queryByRole('alert')).toBeNull();
    }
  });

  it('FUN-139: tentar de novo depois do erro apaga a mensagem antiga enquanto envia', async () => {
    let resolver: (r: ResultadoEntrar) => void = () => undefined;
    const aoEntrar = vi
      .fn<(e: string, s: string) => Promise<ResultadoEntrar>>()
      .mockResolvedValueOnce('incorreto')
      .mockImplementationOnce(() => new Promise((ok) => (resolver = ok)));
    render(<TelaEntrar aoEntrar={aoEntrar} aoVoltar={() => undefined} aoCriarConta={() => undefined} />);
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(screen.queryByRole('alert')).toBeNull();
    resolver('limite');
    expect(await screen.findByRole('alert')).toHaveTextContent('Muitas tentativas');
  });
});

describe('tela Entrar: envio (FUN-137)', () => {
  it('FUN-137: o botão manda o e-mail e a senha digitados para aoEntrar', async () => {
    const { props } = renderizar();
    await userEvent.type(email(), 'dono@exemplo.com');
    await userEvent.type(senha(), 'segredo 123');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(props.aoEntrar).toHaveBeenCalledTimes(1);
    expect(props.aoEntrar).toHaveBeenCalledWith('dono@exemplo.com', 'segredo 123');
  });

  it('FUN-137: Enter no campo de senha chama aoEntrar uma vez, sem envio nativo', async () => {
    const { props } = renderizar();
    await userEvent.type(email(), 'dono@exemplo.com');
    await userEvent.type(senha(), 'segredo 123{Enter}');
    expect(props.aoEntrar).toHaveBeenCalledTimes(1);
    expect(props.aoEntrar).toHaveBeenCalledWith('dono@exemplo.com', 'segredo 123');
  });

  it('FUN-137: Enter no campo de e-mail também envia, e o evento tem o padrão cancelado', () => {
    const { props } = renderizar();
    const permitido = fireEvent.keyDown(email(), { key: 'Enter' });
    expect(permitido).toBe(false);
    expect(props.aoEntrar).toHaveBeenCalledTimes(1);
  });

  it('FUN-137: outras teclas não enviam', async () => {
    const { props } = renderizar();
    await userEvent.type(email(), 'abc');
    fireEvent.keyDown(email(), { key: 'a' });
    fireEvent.keyDown(senha(), { key: 'Tab' });
    expect(props.aoEntrar).not.toHaveBeenCalled();
  });

  it('FUN-137: enquanto envia o botão e os campos ficam desabilitados e um segundo Enter não envia de novo', async () => {
    let resolver: (r: ResultadoEntrar) => void = () => undefined;
    const aoEntrar = vi.fn(() => new Promise<ResultadoEntrar>((ok) => (resolver = ok)));
    render(<TelaEntrar aoEntrar={aoEntrar} aoVoltar={() => undefined} aoCriarConta={() => undefined} />);
    fireEvent.keyDown(email(), { key: 'Enter' });
    const botao = await screen.findByRole('button', { name: 'Entrando…' });
    expect(botao).toBeDisabled();
    expect(email()).toBeDisabled();
    expect(senha()).toBeDisabled();
    fireEvent.keyDown(email(), { key: 'Enter' });
    fireEvent.click(botao);
    expect(aoEntrar).toHaveBeenCalledTimes(1);
    resolver('dono');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Entrar' })).toBeEnabled());
  });
});
