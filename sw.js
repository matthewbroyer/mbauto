/* mbfishing.online service worker. Only does anything when the app is served over https (or localhost).
   It lets the app open with no signal (the app files, plus the map code and tide files once you've used them)
   and remembers map tiles you've already viewed. Your fishing data (local storage and the photo database)
   is never touched by this file. "Delete all data" in the app also empties the tile cache below.
   BUMP VERSION ON EVERY RELEASE so old cached files are dropped. */
const VERSION = 'mbfishing-20261014-v15-topbar-search';
const SHELL = ['./', 'index.html', 'manifest.json', 'favicon.ico', 'favicon.svg', 'apple-touch-icon.png', 'mb-suite-topbar.css', 'mb-install.js', 'mb-share.js', 'fish-art.js', 'species-data.js', 'privacy.html', 'terms.html', 'vendor/LICENSES.txt', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];
const RUNTIME = 'mbfishing-runtime-v1';
const MAX_RUNTIME = 900;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

/* Only this app's own caches are cleaned up; anything else on the origin is left alone. */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('mbfishing-') && k !== VERSION && k !== RUNTIME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function trim(cache) {
  const keys = await cache.keys();
  if (keys.length > MAX_RUNTIME) await Promise.all(keys.slice(0, keys.length - MAX_RUNTIME).map(k => cache.delete(k)));
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // The app itself: network first so updates arrive, cache as the offline fallback.
  if (url.origin === location.origin) {
    e.respondWith(
      fetch(req)
        .then(res => { if (res.ok && res.type === 'basic') { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); } return res; })
        .catch(() => caches.match(req).then(r => r || (req.mode === 'navigate' ? caches.match('index.html') : undefined)))
    );
    return;
  }

  // Map tiles: show the cached copy instantly, refresh it in the background.
  // Everything else from other sites (weather, place search) is left alone and never cached.
  if (/(^|\.)openfreemap\.org$/.test(url.hostname)) {
    e.respondWith(
      caches.open(RUNTIME).then(async cache => {
        const hit = await cache.match(req);
        const net = fetch(req).then(res => { if (res.ok) { cache.put(req, res.clone()); trim(cache); } return res; }).catch(() => hit);
        return hit || net;
      })
    );
  }
});
