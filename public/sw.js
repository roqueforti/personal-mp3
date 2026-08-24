const CACHE_NAME = 'sonicvault-v4-live';

const CORE_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-maskable-512x512.png',
  '/icons/favicon.svg'
];

// 1. Install Event: Cache core shell and immediately activate
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_ASSETS).catch((err) => {
        console.warn('SonicVault pre-cache error:', err);
      });
    })
  );
});

// 2. Activate Event: Purge old cache versions and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => {
            console.log('Purging outdated cache:', k);
            return caches.delete(k);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Skip waiting on message
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 4. Fetch Event:
// - Navigation / HTML: Network-First (Always loads latest deployment on refresh!) with Offline Cache Fallback.
// - Static Next.js Assets (_next/static/*): Cache-First (Fast load, immutable content-hashed).
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-GET, blob:, data:, chrome-extension:, and /api/ routes
  if (
    request.method !== 'GET' ||
    url.protocol.startsWith('blob:') ||
    url.protocol.startsWith('data:') ||
    url.protocol.startsWith('chrome-extension:') ||
    url.pathname.startsWith('/api/')
  ) {
    return;
  }

  // A. Navigation / Document requests (HTML pages) -> NETWORK-FIRST
  // Guarantees that refreshing ALWAYS fetches the newest Vercel deployment!
  if (request.mode === 'navigate' || request.destination === 'document' || url.pathname === '/') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        })
        .catch(() => {
          // Fallback to offline cache if network is unavailable
          return caches.match(request).then((cached) => cached || caches.match('/'));
        })
    );
    return;
  }

  // B. Content-hashed static assets (_next/static/*, /icons/*) -> CACHE-FIRST
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // C. Other assets (Network-First with Cache fallback)
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return networkResponse;
      })
      .catch(() => caches.match(request))
  );
});
