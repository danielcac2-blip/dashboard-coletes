/* Painel de Viaturas — 4ª RPM
   O painel é um arquivo único e pesado, então guardamos uma cópia local para
   abrir mesmo sem rede. A estratégia é "rede primeiro": quando há conexão o
   navegador busca a versão publicada e atualiza a cópia; sem conexão, serve a
   guardada. Os dados da planilha nunca entram no cache — são sempre buscados
   ao vivo e, faltando rede, o próprio painel usa os dados embutidos.

   VERSÃO: incremente a data a cada publicação. Isso descarta o cache antigo e
   garante que quem já instalou receba a versão nova na abertura seguinte. */
const CACHE = 'viaturas-4rpm-2026-10-02';
const ARQUIVOS = ['./', './index.html', './manifest.json',
                  './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (url.hostname.indexOf('docs.google.com') >= 0) return;   /* dados sempre ao vivo */
  if (url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then(r => {
        const copia = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, copia));
        return r;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});

/* permite que a página peça a troca imediata da versão */
self.addEventListener('message', e => { if (e.data === 'atualizar') self.skipWaiting(); });
