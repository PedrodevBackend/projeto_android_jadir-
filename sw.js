/* EsgotoZero · service worker: deixa o app abrir mesmo sem internet.
   Estratégia "rede primeiro": com internet, o navegador sempre busca a versão mais nova dos arquivos
   (nada fica desatualizado enquanto o grupo desenvolve); sem internet, usa a última cópia guardada.
   Os blocos do mapa (Esri/OpenStreetMap) e a busca de endereços não são guardados: vêm sempre da rede.

   Ao adicionar um arquivo novo ao app, inclua-o em SHELL e mude a versão em CACHE. */
'use strict';
const CACHE = 'esgotozero-v2.1.0';
const SHELL = [
  './', 'index.html', 'manifest.webmanifest',
  'css/styles.css',
  'vendor/leaflet.css', 'vendor/leaflet.js', 'vendor/leaflet.markercluster.js', 'vendor/leaflet-heat.js',
  'vendor/images/marker-icon.png', 'vendor/images/marker-icon-2x.png', 'vendor/images/marker-shadow.png', 'vendor/images/layers.png', 'vendor/images/layers-2x.png',
  'js/icons.js', 'js/data.js', 'js/core.js', 'js/map.js', 'js/charts.js', 'js/ui.js', 'js/pages.js', 'js/register.js', 'js/app.js', 'js/municipios.js',
  'assets/fonts/figtree.woff2', 'assets/fonts/bricolage-grotesque.woff2', 'assets/fonts/jetbrains-mono.woff2',
  'assets/icons/favicon.svg', 'assets/icons/apple-touch-icon.png', 'assets/icons/icon-192.png', 'assets/icons/icon-512.png', 'assets/icons/icon-maskable-512.png',
  'assets/img/rio-floresta.jpg',
  'assets/img/foto-rio-1.jpg', 'assets/img/foto-rio-2.jpg', 'assets/img/foto-rio-3.jpg', 'assets/img/foto-rio-4.jpg',
  'assets/img/foto-costa-1.jpg', 'assets/img/foto-costa-2.jpg', 'assets/img/foto-costa-3.jpg', 'assets/img/foto-costa-4.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('esgotozero-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // mapas, busca de endereço e links externos: só rede

  event.respondWith(
    fetch(req)
      .then(res => {
        if (res.ok && res.type === 'basic') { const copy = res.clone(); caches.open(CACHE).then(cache => cache.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true })
        .then(hit => hit || (req.mode === 'navigate' ? caches.match('index.html') : Response.error())))
  );
});
