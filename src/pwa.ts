export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(() => navigator.serviceWorker.ready)
      .then(registration => {
        registration.active?.postMessage({
          type: 'CACHE_URLS',
          urls: getCurrentAppShellUrls(),
        });
      })
      .catch(error => {
        console.warn('Service worker registration failed', error);
      });
  });
}

function getCurrentAppShellUrls(): string[] {
  const urls = new Set<string>([
    '/',
    '/privacy.html',
    '/manifest.webmanifest',
    '/favicon.svg',
    '/icons/apple-touch-icon.png',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    '/icons/maskable-icon-512.png',
  ]);

  const selectors = [
    'script[src]',
    'link[rel="stylesheet"][href]',
    'link[rel="modulepreload"][href]',
    'link[rel~="icon"][href]',
    'link[rel="manifest"][href]',
  ];

  for (const el of document.querySelectorAll<HTMLLinkElement | HTMLScriptElement>(selectors.join(','))) {
    const href = el instanceof HTMLScriptElement ? el.src : el.href;
    if (!href) continue;
    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin) continue;
    if (url.pathname.startsWith('/assets/') || urls.has(url.pathname)) {
      urls.add(url.pathname + url.search);
    }
  }

  return Array.from(urls);
}
