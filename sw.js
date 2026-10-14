/* MB Suite v3 · service worker template (same folder as index.html so its scope covers the app).
   Network-first for the app's own files, cache as the offline fallback. Never touches user data
   (localStorage / IndexedDB are not involved), never intercepts non-GET or cross-origin requests.
   BUMP VERSION ON EVERY RELEASE so old cached files are dropped. */
const VERSION = 'mbauto-20261014-6149036e';
const SHELL = ['./', 'index.html', 'manifest.json', 'apple-touch-icon.png', 'favicon.svg', 'favicon.ico', 'mb-title.js', 'mb-install.js', 'mb-share.js', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('mbauto-') && k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;            // APIs, map tiles, CDNs: left alone
  e.respondWith(
    fetch(req)
      .then(res => { if (res.ok && res.type === 'basic') { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); } return res; })
      .catch(() => caches.match(req).then(r => r || (req.mode === 'navigate' ? caches.match('index.html') : undefined)))
  );
});
