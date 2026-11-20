import { describe, expect, it } from 'vitest';
import { criarApp } from '../app.ts';
import { recusaDaRequisicao } from './guarda.ts';

// Guarda de Host (421) e de origem (403) da API, mais a falha fechada sem URL pública (500): segurança padrão de app web
// do CLAUDE.md. Um teste por ramo e por método; cada teste de `criarApp` falha quando a guarda é desligada.
const APP = 'https://minhajornada-tst.ljssoftware.com.br';
const METODOS_QUE_MUDAM = ['POST', 'PUT', 'PATCH', 'DELETE'] as const;

interface Opcoes {
  url?: string;
  host?: string;
  origin?: string;
  secFetchSite?: string;
}

function req(metodo: string, o: Opcoes = {}): Request {
  const cabecalhos: Record<string, string> = {};
  if (o.host !== undefined) cabecalhos.host = o.host;
  if (o.origin !== undefined) cabecalhos.origin = o.origin;
  if (o.secFetchSite !== undefined) cabecalhos['sec-fetch-site'] = o.secFetchSite;
  return new Request(o.url ?? `${APP}/api/x`, {
    method: metodo,
    headers: cabecalhos,
    body: metodo === 'GET' || metodo === 'HEAD' ? undefined : '{}',
  });
}

const status = (r: Response | null) => r?.status ?? null;
const pelaApiCom = (urlPublica: string | undefined, metodo: string, o: Opcoes = {}) =>
  criarApp({ urlPublica }).request(req(metodo, o));
const pelaApi = (metodo: string, o: Opcoes = {}) => pelaApiCom(APP, metodo, o);

describe('origem 403: Sec-Fetch-Site em método que muda estado', () => {
  for (const metodo of METODOS_QUE_MUDAM) {
    it(`origem 403: ${metodo} com cross-site é recusado`, async () => {
      expect(status(recusaDaRequisicao(req(metodo, { secFetchSite: 'cross-site' }), APP))).toBe(403);
      const resposta = await pelaApi(metodo, { secFetchSite: 'cross-site' });
      expect(resposta.status).toBe(403);
      expect(await resposta.json()).toEqual({ erro: 'origem' });
    });
    it(`origem 403: ${metodo} com same-site é recusado`, async () => {
      expect(status(recusaDaRequisicao(req(metodo, { secFetchSite: 'same-site' }), APP))).toBe(403);
      expect((await pelaApi(metodo, { secFetchSite: 'same-site' })).status).toBe(403);
    });
    it(`origem 403: ${metodo} com Sec-Fetch-Site vazio é recusado`, async () => {
      expect(status(recusaDaRequisicao(req(metodo, { secFetchSite: '' }), APP))).toBe(403);
      expect((await pelaApi(metodo, { secFetchSite: '' })).status).toBe(403);
    });
    it(`origem 403: ${metodo} com same-origin segue (chega à rota: 404 da API)`, async () => {
      expect(recusaDaRequisicao(req(metodo, { secFetchSite: 'same-origin' }), APP)).toBeNull();
      expect((await pelaApi(metodo, { secFetchSite: 'same-origin' })).status).toBe(404);
    });
    it(`origem 403: ${metodo} com none segue`, async () => {
      expect(recusaDaRequisicao(req(metodo, { secFetchSite: 'none' }), APP)).toBeNull();
      expect((await pelaApi(metodo, { secFetchSite: 'none' })).status).toBe(404);
    });
  }

  it('origem 403: a comparação não diferencia maiúsculas (Same-Origin e NONE passam, Cross-Site é recusado)', async () => {
    expect(recusaDaRequisicao(req('POST', { secFetchSite: 'Same-Origin' }), APP)).toBeNull();
    expect(recusaDaRequisicao(req('POST', { secFetchSite: 'NONE' }), APP)).toBeNull();
    expect(status(recusaDaRequisicao(req('POST', { secFetchSite: 'Cross-Site' }), APP))).toBe(403);
    expect((await pelaApi('POST', { secFetchSite: 'Same-Origin' })).status).toBe(404);
    expect((await pelaApi('POST', { secFetchSite: 'Cross-Site' })).status).toBe(403);
  });

  it('origem 403: GET e HEAD com cross-site passam (só o que muda estado é guardado)', async () => {
    expect(recusaDaRequisicao(req('GET', { secFetchSite: 'cross-site' }), APP)).toBeNull();
    expect(recusaDaRequisicao(req('HEAD', { secFetchSite: 'cross-site' }), APP)).toBeNull();
    expect((await pelaApi('GET', { secFetchSite: 'cross-site' })).status).toBe(404);
    expect((await pelaApi('HEAD', { secFetchSite: 'cross-site' })).status).toBe(404);
  });
});

describe('origem 403: Origin em método que muda estado', () => {
  for (const metodo of METODOS_QUE_MUDAM) {
    it(`origem 403: ${metodo} com Origin de outro site é recusado`, async () => {
      expect(status(recusaDaRequisicao(req(metodo, { origin: 'https://outro.exemplo' }), APP))).toBe(403);
      expect((await pelaApi(metodo, { origin: 'https://outro.exemplo' })).status).toBe(403);
    });
    it(`origem 403: ${metodo} com Origin null é recusado`, async () => {
      expect(status(recusaDaRequisicao(req(metodo, { origin: 'null' }), APP))).toBe(403);
      expect((await pelaApi(metodo, { origin: 'null' })).status).toBe(403);
    });
    it(`origem 403: ${metodo} com Origin vazio é recusado`, async () => {
      expect(status(recusaDaRequisicao(req(metodo, { origin: '' }), APP))).toBe(403);
      expect((await pelaApi(metodo, { origin: '' })).status).toBe(403);
    });
    it(`origem 403: ${metodo} com Origin igual ao do site segue`, async () => {
      expect(recusaDaRequisicao(req(metodo, { origin: APP }), APP)).toBeNull();
      expect((await pelaApi(metodo, { origin: APP })).status).toBe(404);
    });
  }

  it('origem 403: Origin com esquema http ou com porta diferente é recusado', async () => {
    const http = 'http://minhajornada-tst.ljssoftware.com.br';
    expect(status(recusaDaRequisicao(req('POST', { origin: http }), APP))).toBe(403);
    expect(status(recusaDaRequisicao(req('POST', { origin: `${APP}:8443` }), APP))).toBe(403);
    expect((await pelaApi('POST', { origin: http })).status).toBe(403);
    expect((await pelaApi('POST', { origin: `${APP}:8443` })).status).toBe(403);
  });

  it('origem 403: Origin com caixa diferente da do site segue (sem diferenciar maiúsculas)', async () => {
    const maiusculas = 'HTTPS://Minhajornada-TST.ljssoftware.com.br';
    expect(recusaDaRequisicao(req('POST', { origin: maiusculas }), APP)).toBeNull();
    expect((await pelaApi('POST', { origin: maiusculas })).status).toBe(404);
  });

  it('origem 403: GET e HEAD com Origin de fora passam', async () => {
    expect(recusaDaRequisicao(req('GET', { origin: 'https://outro.exemplo' }), APP)).toBeNull();
    expect(recusaDaRequisicao(req('HEAD', { origin: 'null' }), APP)).toBeNull();
    expect((await pelaApi('GET', { origin: 'https://outro.exemplo' })).status).toBe(404);
  });

  it('origem 403: POST sem Origin nem Sec-Fetch-Site (cliente que não é navegador) segue', async () => {
    expect(recusaDaRequisicao(req('POST'), APP)).toBeNull();
    expect((await pelaApi('POST')).status).toBe(404);
  });
});

describe('Host 421', () => {
  it('Host 421: URL de outro domínio é recusada em GET, HEAD e POST', async () => {
    for (const metodo of ['GET', 'HEAD', 'POST']) {
      const o = { url: 'https://outro.exemplo/api/x' };
      expect(status(recusaDaRequisicao(req(metodo, o), APP))).toBe(421);
      expect((await pelaApi(metodo, o)).status).toBe(421);
    }
  });

  it('Host 421: corpo da recusa é { erro: "host" }', async () => {
    const resposta = await pelaApi('GET', { url: 'https://outro.exemplo/api/x' });
    expect(await resposta.json()).toEqual({ erro: 'host' });
  });

  it('Host 421: porta diferente é recusada', async () => {
    expect(status(recusaDaRequisicao(req('GET', { url: `${APP}:8443/api/x` }), APP))).toBe(421);
    expect((await pelaApi('GET', { url: `${APP}:8443/api/x` })).status).toBe(421);
  });

  it('Host 421: cabeçalho Host de outro domínio é recusado mesmo com a URL certa', async () => {
    expect(status(recusaDaRequisicao(req('GET', { host: 'outro.exemplo' }), APP))).toBe(421);
    expect((await pelaApi('GET', { host: 'outro.exemplo' })).status).toBe(421);
  });

  it('Host 421: caixa diferente da do site segue (URL e cabeçalho)', async () => {
    const url = 'https://Minhajornada-TST.LJSSoftware.com.br/api/x';
    expect(recusaDaRequisicao(req('GET', { url }), APP)).toBeNull();
    expect(recusaDaRequisicao(req('GET', { host: 'MINHAJORNADA-tst.ljssoftware.com.br' }), APP)).toBeNull();
    expect((await pelaApi('GET', { url })).status).toBe(404);
  });

  it('Host 421: vale antes da origem (POST de outro domínio com Origin certo ainda é 421)', async () => {
    const o = { url: 'https://outro.exemplo/api/x', origin: APP };
    expect(status(recusaDaRequisicao(req('POST', o), APP))).toBe(421);
    expect((await pelaApi('POST', o)).status).toBe(421);
  });
});

describe('URL pública ausente ou ilegível: falha fechada (500)', () => {
  const casos: [string, string | undefined][] = [
    ['ausente', undefined],
    ['vazia', ''],
    ['ilegível', 'isto nao e url'],
  ];
  for (const [nome, valor] of casos) {
    it(`URL pública ${nome}: GET e POST respondem 500`, async () => {
      expect(status(recusaDaRequisicao(req('GET'), valor))).toBe(500);
      expect(status(recusaDaRequisicao(req('POST'), valor))).toBe(500);
      const resposta = await pelaApiCom(valor, 'GET');
      expect(resposta.status).toBe(500);
      expect(await resposta.json()).toEqual({ erro: 'configuracao' });
      expect((await pelaApiCom(valor, 'POST')).status).toBe(500);
    });
  }
});

describe('requisição legítima', () => {
  it('GET na própria origem e POST com Origin e Sec-Fetch-Site certos chegam à rota', async () => {
    expect(recusaDaRequisicao(req('GET'), APP)).toBeNull();
    expect(recusaDaRequisicao(req('POST', { origin: APP, secFetchSite: 'same-origin' }), APP)).toBeNull();
    expect((await pelaApi('GET')).status).toBe(404);
    expect((await pelaApi('POST', { origin: APP, secFetchSite: 'same-origin' })).status).toBe(404);
  });
});
