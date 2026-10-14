const CACHE_PREFIX = `loop-${encodeURIComponent(new URL(self.registration.scope).pathname)}-`;
const CACHE_NAME = `${CACHE_PREFIX}v8`;
const CORE_ASSETS = [
  './',
  './index.html',
  './styles.css?v=8',
  './src/app.js?v=8',
  './src/data.js?v=8',
  './src/discovered-data.js?v=8',
  './src/config.js?v=8',
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/icon-192.svg',
  './icons/icon-512.svg'
];
const ASSET_URLS = new Set(CORE_ASSETS.map(asset => new URL(asset, self.registration.scope).href));

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map(key => caches.delete(key))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin ||
    !url.href.startsWith(self.registration.scope) || url.pathname.includes('/api/')) return;
  const navigation = request.mode === 'navigate';
  if (!navigation && !ASSET_URLS.has(url.href)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      const response = await fetch(request);
      if (response.ok && (ASSET_URLS.has(url.href) || navigation && response.headers.get('content-type')?.includes('text/html'))) {
        const copy = response.clone();
        event.waitUntil(cache.put(request, copy).catch(() => {}));
      }
      return response;
    } catch {
      const cached = await cache.match(request);
      if (cached) return cached;
      if (navigation) {
        const shell = await cache.match(new URL('./index.html', self.registration.scope).href);
        if (shell) return shell;
      }
      return Response.error();
    }
  })());
});
