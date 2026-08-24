const CACHE_NAME = 'sonicvault-v3-release';

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

// Purge any older cache versions automatically on activation
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => {
            console.log('Purging outdated cache version:', k);
            return caches.delete(k);
          })
      );
    })
  );
  self.clients.claim();
});

// Support manual or instant skipWaiting command from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Offline-First + Auto Revalidation Fetch Strategy
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

  // 1. Next.js content-hashed static assets (_next/static/*)
  // Immutable cache: once cached, serve instantly.
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

  // 2. Navigation / App Shell HTML
  // Stale-While-Revalidate with deployment update detection
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, copy);
            });

            // If we had a cached response and the ETag / content changed, notify client
            if (cachedResponse) {
              const oldEtag = cachedResponse.headers.get('ETag');
              const newEtag = networkResponse.headers.get('ETag');
              if (oldEtag && newEtag && oldEtag !== newEtag) {
                self.clients.matchAll().then((clients) => {
                  clients.forEach((client) => {
                    client.postMessage({ type: 'DEPLOYMENT_UPDATED' });
                  });
                });
              }
            }
          }
          return networkResponse;
        })
        .catch(() => {
          // If offline and requesting navigation, return cached root
          if (request.mode === 'navigate') {
            return caches.match('/');
          }
          return cachedResponse || new Response('Offline', { status: 503 });
        });

      // Return cached version immediately for 0ms startup, revalidate in background
      return cachedResponse || fetchPromise;
    })
  );
});
