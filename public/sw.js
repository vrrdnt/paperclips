const CACHE_PREFIX = 'paperclips-pwa-';
const CACHE_NAME = `${CACHE_PREFIX}v5`;
const APP_SHELL = [
  '/',
  '/privacy.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icons/apple-touch-icon.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/maskable-icon-512.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    precacheAppShell()
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(names
        .filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
        .map(name => caches.delete(name))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data?.type !== 'CACHE_URLS') return;
  const urls = Array.isArray(event.data.urls) ? event.data.urls : [];
  event.waitUntil(cacheUrls(urls));
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, '/'));
    return;
  }

  if (
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/icons/') ||
    APP_SHELL.includes(url.pathname)
  ) {
    event.respondWith(cacheFirst(request));
  }
});

async function precacheAppShell() {
  const cache = await caches.open(CACHE_NAME);
  await cache.addAll(APP_SHELL);

  const response = await fetch(new Request('/', { cache: 'reload' }));
  await cache.put('/', response.clone());

  const html = await response.text();
  await Promise.all(getDocumentAssetUrls(html).map(url => (
    cache.add(new Request(url, { cache: 'reload' }))
  )));
}

function getDocumentAssetUrls(html) {
  const urls = new Set();
  const attrPattern = /\b(?:src|href)=["']([^"']+)["']/g;
  let match;

  while ((match = attrPattern.exec(html))) {
    const parsed = new URL(match[1], self.location.origin);
    if (parsed.origin === self.location.origin && parsed.pathname.startsWith('/assets/')) {
      urls.add(parsed.pathname + parsed.search);
    }
  }

  return Array.from(urls);
}

async function cacheUrls(urls) {
  const cache = await caches.open(CACHE_NAME);
  await Promise.all(urls.map(async url => {
    try {
      const parsed = new URL(url, self.location.origin);
      if (parsed.origin !== self.location.origin) return;
      await cache.add(new Request(parsed.href, { cache: 'reload' }));
    } catch {
      // A single optional asset should not prevent the rest of the app shell from caching.
    }
  }));
}

async function networkFirst(request, fallbackUrl) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (!response.ok) return (await cache.match(request)) || response;
    await cacheResponse(cache, request, response);
    return response;
  } catch {
    return (await cache.match(request)) || (await cache.match(fallbackUrl)) || Response.error();
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  // Vite and some hosts send Vary: Origin. Precache requests lack the Origin
  // header carried by module/CSS requests. Hashed same-origin build assets are
  // identical for both, so use their URL to find the offline copy.
  const isBuildAsset = new URL(request.url).pathname.startsWith('/assets/');
  const cached = await cache.match(request, { ignoreVary: isBuildAsset });
  if (cached) return cached;

  const response = await fetch(request);
  await cacheResponse(cache, request, response);
  return response;
}

async function cacheResponse(cache, request, response) {
  if (!response.ok) return;
  try {
    await cache.put(request, response.clone());
  } catch {
    // Cache quota failures must not turn a successful network request into an error.
  }
}
