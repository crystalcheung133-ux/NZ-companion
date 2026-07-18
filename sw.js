importScripts('./theme-config.js', './asset-config.js', './locale-config.js', './formatter.js', './navigation-config.js', './storage-config.js', './trip-config.js');
const CACHE_NAME = `travel-engine-${TRIP_CONFIG.storageNamespace}-${TRIP_CONFIG.version}-stage8a2`;
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './core-runtime.js',
  './trip-runtime.js',
  './moments-compat.js',
  './currency-runtime.js',
  './script.js',
  './guide-runtime.js',
  './expenses.js',
  './moments.js',
  './admin.js',
  './complete-runtime.js',
  './pwa.js',
  './app-runtime.js',
  './theme-config.js',
  './asset-config.js',
  './locale-config.js',
  './formatter.js',
  './money-config.js',
  './money.js',
  './navigation-config.js',
  './navigation.js',
  './storage-config.js',
  './storage.js',
  './trip-config.js',
  './data.js',
  './place.html',
  './day.html',
  './offline.html',
  './' + ASSET_CONFIG.icons.icon192,
  './' + ASSET_CONFIG.icons.icon512,
  './' + ASSET_CONFIG.branding.secondaryMark,
  './' + ASSET_CONFIG.branding.splashLogo,
  './guide.html',
  './itinerary.html',
  './memory.html',
  './moments.html',
  './expenses.html',
  './trip.html'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch (error) {
    let cached = await caches.match(request, { ignoreSearch: true });
    if (!cached) {
      const url = new URL(request.url);
      cached = await caches.match(url.pathname.split('/').pop() || './index.html', { ignoreSearch: true });
    }
    return cached || caches.match('./offline.html');
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await caches.match(request, { ignoreSearch: true });
  const fetched = fetch(request).then(response => {
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => null);
  return cached || fetched || caches.match('./offline.html');
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  const acceptsHtml = event.request.headers.get('accept')?.includes('text/html');
  if (event.request.mode === 'navigate' || acceptsHtml) {
    event.respondWith(networkFirst(event.request));
  } else {
    event.respondWith(staleWhileRevalidate(event.request));
  }
});
