import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { criarCliente } from '../db/cliente.ts';
import { comAmbiente } from '../test/apoio/app.ts';
import { comCliente } from '../test/apoio/banco.ts';
import { gerarToken } from '../sessao/token.ts';
import { criarRepositorioSessoes } from './sessoes.ts';

const MIN = 60_000;
const HORA = 60 * MIN;
const DIA = 24 * HORA;
const T0 = new Date('2026-11-01T12:00:00Z');
const em = (ms: number) => new Date(T0.getTime() + ms);

/** Repositório sobre o banco como `mj_app` (o que o app usa), com relógio que o teste move. */
async function comRepositorio(
  fn: (ctx: {
    repo: ReturnType<typeof criarRepositorioSessoes>;
    relogio: { valor: Date };
    urlDono: string;
    usuarioId: string;
    donoId: string;
  }) => Promise<void>,
): Promise<void> {
  await comAmbiente(async (a) => {
    const usuarioId = await a.criarUsuario('leitor@exemplo.com');
    const donoId = await a.criarUsuario('dono@exemplo.com', { dono: true });
    const relogio = { valor: T0 };
    const cliente = criarCliente(a.urlApp);
    try {
      await fn({
        repo: criarRepositorioSessoes(cliente, () => relogio.valor),
        relogio,
        urlDono: a.urlDono,
        usuarioId,
        donoId,
      });
    } finally {
      await cliente.fechar();
    }
  });
}

const linhas = (url: string) => comCliente(url, (c) => c.query('SELECT * FROM sessoes ORDER BY criada_em'));

describe('repositório de sessões (FUN-141, FUN-144)', () => {
  it('FUN-141: o banco guarda só o hash: nenhuma coluna tem o token', async () => {
    await comRepositorio(async ({ repo, urlDono, usuarioId }) => {
      const { token } = await repo.criar(usuarioId);
      const { rows, rowCount } = await linhas(urlDono);
      expect(rowCount).toBe(1);
      expect(JSON.stringify(rows[0])).not.toContain(token);
      expect(Buffer.from(rows[0].token_hash).equals(createHash('sha256').update(token).digest())).toBe(true);
      const todas = await comCliente(urlDono, (c) => c.query('SELECT s::text AS t FROM sessoes s'));
      expect(todas.rows[0].t).not.toContain(token);
    });
  });

  it('FUN-141: o token criado vale e devolve o usuário', async () => {
    await comRepositorio(async ({ repo, usuarioId }) => {
      const { token } = await repo.criar(usuarioId);
      expect(await repo.validar(token)).toEqual({ usuarioId, dono: false });
    });
  });

  it('devolve dono verdadeiro para o dono e falso para o leitor', async () => {
    await comRepositorio(async ({ repo, usuarioId, donoId }) => {
      const leitor = await repo.criar(usuarioId);
      const dono = await repo.criar(donoId);
      expect(leitor.dono).toBe(false);
      expect(dono.dono).toBe(true);
      expect((await repo.validar(dono.token))?.dono).toBe(true);
      expect((await repo.validar(leitor.token))?.dono).toBe(false);
    });
  });

  it('FUN-141: token desconhecido ou fora do formato devolve null; fora do formato nem consulta o banco', async () => {
    await comRepositorio(async ({ repo }) => {
      expect(await repo.validar(gerarToken())).toBeNull();
    });
    const consultar = vi.fn();
    const repo = criarRepositorioSessoes({ consultar, aberto: () => false, fechar: async () => undefined }, () => T0);
    expect(await repo.validar('curto')).toBeNull();
    expect(await repo.validar('')).toBeNull();
    expect(consultar).not.toHaveBeenCalled();
  });

  describe('vencimento por 30 dias de criação (FUN-144)', () => {
    it('FUN-144: 29 dias e 23 h de criação, com uso recente, ainda vale', async () => {
      await comRepositorio(async ({ repo, relogio, usuarioId }) => {
        const { token } = await repo.criar(usuarioId);
        // Uso a cada 6 dias mantém a sessão viva até o prazo absoluto.
        for (const dias of [6, 12, 18, 24]) {
          relogio.valor = em(dias * DIA);
          expect(await repo.validar(token)).not.toBeNull();
        }
        relogio.valor = em(29 * DIA + 23 * HORA);
        expect(await repo.validar(token)).not.toBeNull();
      });
    });

    it('FUN-144: 30 dias de criação não vale e a linha some', async () => {
      await comRepositorio(async ({ repo, relogio, urlDono, usuarioId }) => {
        const { token } = await repo.criar(usuarioId);
        for (const dias of [6, 12, 18, 24, 29]) {
          relogio.valor = em(dias * DIA);
          expect(await repo.validar(token)).not.toBeNull();
        }
        relogio.valor = em(30 * DIA);
        expect(await repo.validar(token)).toBeNull();
        expect((await linhas(urlDono)).rowCount).toBe(0);
      });
    });
  });

  describe('vencimento por 7 dias sem uso (FUN-144)', () => {
    it('FUN-144: 6 dias e 23 h sem uso ainda vale', async () => {
      await comRepositorio(async ({ repo, relogio, usuarioId }) => {
        const { token } = await repo.criar(usuarioId);
        relogio.valor = em(6 * DIA + 23 * HORA);
        expect(await repo.validar(token)).not.toBeNull();
      });
    });

    it('FUN-144: 7 dias sem uso não vale e a linha some', async () => {
      await comRepositorio(async ({ repo, relogio, urlDono, usuarioId }) => {
        const { token } = await repo.criar(usuarioId);
        relogio.valor = em(7 * DIA);
        expect(await repo.validar(token)).toBeNull();
        expect((await linhas(urlDono)).rowCount).toBe(0);
      });
    });

    it('FUN-144: sessão vencida apagada não volta a valer com o relógio de volta', async () => {
      await comRepositorio(async ({ repo, relogio, usuarioId }) => {
        const { token } = await repo.criar(usuarioId);
        relogio.valor = em(8 * DIA);
        expect(await repo.validar(token)).toBeNull();
        relogio.valor = em(MIN);
        expect(await repo.validar(token)).toBeNull();
      });
    });

    it('FUN-144: vencer uma sessão não apaga a de outro token', async () => {
      await comRepositorio(async ({ repo, relogio, urlDono, usuarioId }) => {
        const velha = await repo.criar(usuarioId);
        relogio.valor = em(6 * DIA);
        const nova = await repo.criar(usuarioId);
        relogio.valor = em(7 * DIA);
        expect(await repo.validar(velha.token)).toBeNull();
        expect(await repo.validar(nova.token)).not.toBeNull();
        expect((await linhas(urlDono)).rowCount).toBe(1);
      });
    });
  });

  describe('renovação do uso (FUN-144)', () => {
    const usadaEm = async (url: string) => new Date((await linhas(url)).rows[0].usada_em).getTime();

    it('FUN-144: o uso renova usada_em e estende o prazo de 7 dias', async () => {
      await comRepositorio(async ({ repo, relogio, urlDono, usuarioId }) => {
        const { token } = await repo.criar(usuarioId);
        relogio.valor = em(5 * DIA);
        expect(await repo.validar(token)).not.toBeNull();
        expect(await usadaEm(urlDono)).toBe(em(5 * DIA).getTime());
        relogio.valor = em(11 * DIA);
        expect(await repo.validar(token)).not.toBeNull();
      });
    });

    it('FUN-144: dois usos em menos de 60 s gravam usada_em uma vez só', async () => {
      await comRepositorio(async ({ repo, relogio, urlDono, usuarioId }) => {
        const { token } = await repo.criar(usuarioId);
        relogio.valor = em(2 * MIN);
        await repo.validar(token);
        expect(await usadaEm(urlDono)).toBe(em(2 * MIN).getTime());
        relogio.valor = em(2 * MIN + 59_000);
        await repo.validar(token);
        expect(await usadaEm(urlDono)).toBe(em(2 * MIN).getTime());
        relogio.valor = em(3 * MIN + 1000);
        await repo.validar(token);
        expect(await usadaEm(urlDono)).toBe(em(3 * MIN + 1000).getTime());
      });
    });

    it('FUN-144: o uso nunca muda criada_em, então o prazo absoluto não estende', async () => {
      await comRepositorio(async ({ repo, relogio, urlDono, usuarioId }) => {
        const { token } = await repo.criar(usuarioId);
        relogio.valor = em(3 * DIA);
        await repo.validar(token);
        expect(new Date((await linhas(urlDono)).rows[0].criada_em).getTime()).toBe(T0.getTime());
      });
    });
  });

  describe('apagar (FUN-143)', () => {
    it('FUN-143: apagar tira só a sessão do token dado', async () => {
      await comRepositorio(async ({ repo, urlDono, usuarioId }) => {
        const a = await repo.criar(usuarioId);
        const b = await repo.criar(usuarioId);
        await repo.apagar(a.token);
        expect(await repo.validar(a.token)).toBeNull();
        expect(await repo.validar(b.token)).not.toBeNull();
        expect((await linhas(urlDono)).rowCount).toBe(1);
      });
    });

    it('FUN-143: apagar token inexistente ou fora do formato não falha', async () => {
      await comRepositorio(async ({ repo }) => {
        await expect(repo.apagar(gerarToken())).resolves.toBeUndefined();
        await expect(repo.apagar('curto')).resolves.toBeUndefined();
      });
    });
  });
});
