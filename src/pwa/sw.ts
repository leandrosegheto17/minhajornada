/// <reference lib="webworker" />
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<string | { url: string; revision: string | null }>;
};

// Service worker do app (injectManifest; AD-001, AD-002). Precache só do app (o shell): os livros ficam no cache
// `mj-livros`, gerido por `src/dados/livros.ts`, e não passam por aqui.
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// Sem rede, abrir qualquer endereço do app serve o index.html do precache (FUN-35). Os livros (/livros/) não são
// navegação e ficam fora da rota. `/api/*` também: a resposta do resumo só vem da rede, nunca do cache nem do shell (FUN-151).
registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html'), { denylist: [/^\/livros\//, /^\/api\//] }));

// Atualização sem ação do leitor (FUN-37): o SW novo não espera as abas fecharem e assume as abertas, mas a página
// não recarrega; a abertura seguinte já usa a versão nova (ver `registrarSW.ts`).
self.addEventListener('install', () => {
  void self.skipWaiting();
});
self.addEventListener('activate', (evento) => evento.waitUntil(self.clients.claim()));
