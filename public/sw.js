const CACHE_NAME = 'sonicvault-v2-offline-first';

const CORE_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-maskable-512x512.png',
  '/icons/favicon.svg'
];

// Pre-cache core shell during SW installation
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_ASSETS).catch((err) => {
        console.warn('SonicVault pre-cache error:', err);
      });
    })
  );
  self.skipWaiting();
});

// Clean older cache versions on activation
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

// Offline-First Fetch Strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-GET requests and internal blob / data URLs
  if (
    request.method !== 'GET' ||
    url.protocol.startsWith('blob:') ||
    url.protocol.startsWith('data:') ||
    url.protocol.startsWith('chrome-extension:')
  ) {
    return;
  }

  // 1. Next.js immutable static assets (_next/static/*) -> 100% CACHE FIRST FOREVER
  // Since Next.js uses content hashing, once downloaded it never needs to be re-downloaded!
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          return cached;
        }
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

  // 2. Navigation / App Shell HTML -> CACHE FIRST with background revalidation
  // Loads instantly from local storage without downloading again if no update
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        })
        .catch(() => {
          // If offline and request is a navigation, fallback to cached root '/'
          if (request.mode === 'navigate') {
            return caches.match('/');
          }
          return cached;
        });

      // If we already have it in local cache, return immediately (0ms delay, 0 data usage)
      if (cached) {
        return cached;
      }

      // Otherwise wait for network response and cache it
      return fetchPromise;
    })
  );
});
