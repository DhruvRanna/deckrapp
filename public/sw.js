const CACHE_NAME = 'deckr-v5';
const urlsToCache = ['/', '/swipe', '/calendar', '/scripts', '/profile', '/manifest.json', '/icon-192.png', '/icon-512.png', '/apple-touch-icon.png', '/screenshot1.png', '/screenshot2.png', '/screenshot3.png', '/screenshot4.png', '/screenshot5.png', '/screenshot6.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Never intercept OAuth routes — they must always hit the network
  if (url.pathname.startsWith('/~oauth')) {
    return;
  }

  // Never intercept Supabase auth callbacks
  if (url.pathname.startsWith('/auth/callback')) {
    return;
  }

   if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone)).catch(() => {});
          return response;
        })
        .catch(() => caches.match(event.request).then(response => response || caches.match('/')))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request).catch(() => caches.match('/')))
  );
});