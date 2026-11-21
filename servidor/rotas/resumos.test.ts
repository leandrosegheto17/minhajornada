import { describe, expect, it } from 'vitest';
import type { Resumo } from '../../src/resumos/formato.ts';
import { comAmbiente, SENHA_DE_EXEMPLO, type Ambiente } from '../test/apoio/app.ts';
import { comCliente } from '../test/apoio/banco.ts';

const SEGREDO = 'TEXTO-SECRETO-DO-RESUMO';

/** Resumo de exemplo (o formato é o do design; o conteúdo é só de exemplo, FUN-152). */
const resumoDe = (livro: number): Resumo => ({
  livro,
  contexto: `Contexto ${SEGREDO} do livro ${livro}`,
  mensagem: `Mensagem ${SEGREDO}`,
  divisao: [{ titulo: 'Parte um', de: 1, ate: 2 }],
  versiculos: [{ capitulo: 1, versiculo: 1, ate: 3, frase: `Frase ${SEGREDO}` }],
});

async function publicar(a: Ambiente, livro: number): Promise<void> {
  await comCliente(a.urlDono, (c) =>
    c.query('INSERT INTO resumos (livro, conteudo) VALUES ($1, $2)', [livro, JSON.stringify(resumoDe(livro))]),
  );
}

let ipSeq = 0;
/** Cria o usuário, entra pela API e devolve o cookie da sessão. */
async function cookieDe(a: Ambiente, email: string, dono: boolean): Promise<string> {
  await a.criarUsuario(email, { dono });
  const r = await a.pedir('/api/entrar', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'cf-connecting-ip': `203.0.113.${(ipSeq = (ipSeq + 1) % 200) + 1}` },
    body: JSON.stringify({ email, senha: SENHA_DE_EXEMPLO }),
  });
  return `__Host-sessao=${/__Host-sessao=([^;]+)/.exec(r.headers.get('set-cookie') ?? '')?.[1] ?? ''}`;
}

const buscar = (a: Ambiente, n: string, cookie?: string) =>
  a.pedir(`/api/resumos/${n}`, { headers: cookie ? { cookie } : {} });

describe('GET /api/resumos/:n (FUN-146 a FUN-150, AD-024)', () => {
  it('FUN-146: dono com livro publicado recebe 200 com as quatro seções', async () => {
    await comAmbiente(async (a) => {
      await publicar(a, 1);
      await publicar(a, 66);
      const cookie = await cookieDe(a, 'dono@exemplo.com', true);
      const r = await buscar(a, '1', cookie);
      expect(r.status).toBe(200);
      expect(r.headers.get('content-type')).toMatch(/^application\/json/);
      expect(await r.json()).toEqual(resumoDe(1));
      // Os dois extremos do intervalo valem.
      expect(await (await buscar(a, '66', cookie)).json()).toEqual(resumoDe(66));
    });
  });

  it.each([
    ['sem cookie', undefined],
    ['cookie fora do formato', '__Host-sessao=abc'],
    ['cookie desconhecido', `__Host-sessao=${'A'.repeat(43)}`],
  ])('FUN-147: %s recebe 401 sem texto do resumo', async (_nome, cookie) => {
    await comAmbiente(async (a) => {
      await publicar(a, 1);
      const r = await buscar(a, '1', cookie);
      const corpo = await r.text();
      expect(r.status).toBe(401);
      expect(JSON.parse(corpo)).toEqual({ erro: 'sem_sessao' });
      expect(corpo).not.toContain(SEGREDO);
    });
  });

  it('FUN-147: sessão vencida recebe 401 sem texto do resumo', async () => {
    await comAmbiente(async (a) => {
      await publicar(a, 1);
      const cookie = await cookieDe(a, 'dono@exemplo.com', true);
      a.agora.valor = new Date(a.agora.valor.getTime() + 7 * 24 * 60 * 60 * 1000);
      const r = await buscar(a, '1', cookie);
      expect(r.status).toBe(401);
      expect(await r.text()).not.toContain(SEGREDO);
    });
  });

  it('FUN-148: usuário sem dono recebe 403 sem texto do resumo', async () => {
    await comAmbiente(async (a) => {
      await publicar(a, 1);
      const cookie = await cookieDe(a, 'leitor@exemplo.com', false);
      const r = await buscar(a, '1', cookie);
      const corpo = await r.text();
      expect(r.status).toBe(403);
      expect(JSON.parse(corpo)).toEqual({ erro: 'proibido' });
      expect(corpo).not.toContain(SEGREDO);
    });
  });

  it('FUN-149: dono e livro sem resumo recebe 404', async () => {
    await comAmbiente(async (a) => {
      await publicar(a, 1);
      const cookie = await cookieDe(a, 'dono@exemplo.com', true);
      const r = await buscar(a, '2', cookie);
      expect(r.status).toBe(404);
      expect(await r.json()).toEqual({ erro: 'sem_resumo' });
    });
  });

  it.each(['0', '67', '1.5', 'abc', '-1', '01', '1e1', '+1', '1%20', '999999999999'])(
    'FUN-150: dono e livro %s recebe 400; sem sessão, o mesmo pedido recebe 401 (AD-024)',
    async (n) => {
      await comAmbiente(async (a) => {
        const cookie = await cookieDe(a, 'dono@exemplo.com', true);
        const r = await buscar(a, n, cookie);
        expect(r.status).toBe(400);
        expect(await r.json()).toEqual({ erro: 'livro_invalido' });
        expect((await buscar(a, n)).status).toBe(401);
      });
    },
  );

  it('AD-024: usuário sem dono com livro inválido recebe 403, não 400', async () => {
    await comAmbiente(async (a) => {
      const cookie = await cookieDe(a, 'leitor@exemplo.com', false);
      expect((await buscar(a, '0', cookie)).status).toBe(403);
    });
  });

  it('FUN-151: toda resposta (200, 400, 401, 403 e 404) tem Cache-Control: no-store', async () => {
    await comAmbiente(async (a) => {
      await publicar(a, 1);
      const dono = await cookieDe(a, 'dono@exemplo.com', true);
      const leitor = await cookieDe(a, 'leitor@exemplo.com', false);
      const respostas = [
        await buscar(a, '1', dono),
        await buscar(a, '0', dono),
        await buscar(a, '1'),
        await buscar(a, '1', leitor),
        await buscar(a, '2', dono),
      ];
      expect(respostas.map((r) => r.status)).toEqual([200, 400, 401, 403, 404]);
      for (const r of respostas) expect(r.headers.get('cache-control')).toBe('no-store');
    });
  });

  it('só GET: POST em /api/resumos/1 não devolve o resumo', async () => {
    await comAmbiente(async (a) => {
      await publicar(a, 1);
      const cookie = await cookieDe(a, 'dono@exemplo.com', true);
      const r = await a.pedir('/api/resumos/1', { method: 'POST', headers: { cookie }, body: '{}' });
      expect(r.status).toBe(404);
      expect(await r.text()).not.toContain(SEGREDO);
    });
  });

  it('o resumo de um livro não vaza o de outro', async () => {
    await comAmbiente(async (a) => {
      await publicar(a, 1);
      await publicar(a, 2);
      const cookie = await cookieDe(a, 'dono@exemplo.com', true);
      expect(((await (await buscar(a, '2', cookie)).json()) as Resumo).livro).toBe(2);
    });
  });
});
