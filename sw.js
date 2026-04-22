const CACHE = 'coletes-4rpm-v1';
const ASSETS = [
  '/dashboard-coletes/',
  '/dashboard-coletes/index.html',
  'https://cdn.jsdelivr.net/gh/nucleo-org/rawline@master/fonts/Rawline-400.woff2',
  'https://cdn.jsdelivr.net/gh/nucleo-org/rawline@master/fonts/Rawline-500.woff2',
  'https://cdn.jsdelivr.net/gh/nucleo-org/rawline@master/fonts/Rawline-600.woff2',
  'https://cdn.jsdelivr.net/gh/nucleo-org/rawline@master/fonts/Rawline-700.woff2',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS)).catch(err => console.log('Cache parcial:', err))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Dados do Google Sheets: sempre busca da rede (tempo real)
  if(e.request.url.includes('script.google.com')){
    e.respondWith(fetch(e.request).catch(() => new Response('{"erro":"offline"}',{headers:{'Content-Type':'application/json'}})));
    return;
  }
  // Demais recursos: cache first
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(resp => {
      if(resp && resp.status === 200){
        const clone = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return resp;
    }))
  );
});
