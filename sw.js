const CACHE = 'miedzy-nami-v0917';
const VITE_ASSETS = /*__MN_VITE_ASSETS__*/[];
const STATIC_ASSETS = /*__MN_STATIC_ASSETS__*/[];
const CORE = [...new Set(['/', '/index.html', ...STATIC_ASSETS, ...VITE_ASSETS])];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cache.addAll(CORE);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();

      await Promise.all(
        keys
          .filter((key) => key.startsWith('miedzy-nami-') && key !== CACHE)
          .map((key) => caches.delete(key)),
      );

      await self.clients.claim();
    })(),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

function pathRequest(pathname) {
  return new Request(new URL(pathname, self.location.origin), {
    method: 'GET',
    credentials: 'same-origin',
  });
}

async function networkFirst(request, fallbackPath) {
  const fallback = fallbackPath ? pathRequest(fallbackPath) : request;

  try {
    const response = await fetch(request, { cache: 'no-store' });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} dla ${new URL(request.url).pathname}`);
    }

    const cache = await caches.open(CACHE);
    await cache.put(fallback, response.clone());

    return response;
  } catch (error) {
    const cached =
      (await caches.match(fallback)) ||
      (fallback !== request ? await caches.match(request) : null);

    if (cached) return cached;
    throw error;
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);

  if (cached) return cached;

  const response = await fetch(request);

  if (response.ok) {
    const cache = await caches.open(CACHE);
    await cache.put(request, response.clone());
  }

  return response;
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  if (url.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirst(event.request, '/index.html'));
    return;
  }

  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  if (/\.(?:png|svg|webp|jpg|jpeg)$/i.test(url.pathname)) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  event.respondWith(networkFirst(event.request, url.pathname));
});
