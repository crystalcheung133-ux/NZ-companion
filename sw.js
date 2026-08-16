importScripts('./theme-config.js', './asset-config.js', './locale-config.js', './formatter.js', './navigation-config.js', './trip-config.js', './storage-config.js');
const CACHE_NAME = `travel-engine-${TRIP_CONFIG.storageNamespace}-${TRIP_CONFIG.version}-runtime-v22-ci-gate-candidate`;
const CRITICAL_EXTENSIONS = /\.(?:css|js)$/i;
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './core-runtime.js',
  './trip-runtime.js',
  './moments-compat.js',
  './currency-runtime.js',
  './analytics-runtime.js',
  './home-runtime.js',
  './script.js',
  './guide-runtime.js',
  './guide-navigation-runtime.js',
  './expenses.js',
  './supabase-client-runtime.js',
  './expense-sync-runtime.js',
  './moment-sync-runtime.js',
  './generation-runtime.js',
  './moments.js',
  './admin.js',
  './reset-runtime.js',
  './publication-runtime.js',
  './complete-runtime.js',
  './export-runtime.js',
  './pwa.js',
  './app-runtime.js',
  './theme-config.js',
  './asset-config.js',
  './locale-config.js',
  './geo-config.js',
  './party-render-runtime.js',
  './formatter.js',
  './money-config.js',
  './money.js',
  './navigation-config.js',
  './navigation.js',
  './storage-config.js',
  './storage.js',
  './sync-config.js',
  './sync-runtime.js',
  './trip-config.js',
  './engine-integrity.js',
  './data.js',
  './booking-authority.js',
  './booking-permissions.js',
  './booking-sync-runtime.js',
  './itinerary-authority.js',
  './place.html',
  './day.html',
  './offline.html',
  './manifest.webmanifest',
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


self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => Promise.all(ASSETS.map(asset => cache.add(new Request(asset,{cache:'reload'})))))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

function looksLikeHtmlDocument(text) {
  const sample = String(text || '').replace(/^\uFEFF/, '').trimStart().slice(0, 512).toLowerCase();
  return sample.startsWith('<!doctype html') || sample.startsWith('<html') || sample.includes('<html ');
}

async function validateHtmlResponse(response) {
  if (!response || !response.ok) return false;
  try {
    const body = await response.clone().text();
    return looksLikeHtmlDocument(body);
  } catch (error) {
    return false;
  }
}

async function fetchValidHtml(request) {
  try {
    const response = await fetch(request, { cache: 'no-store', redirect: 'follow' });
    return await validateHtmlResponse(response) ? response : null;
  } catch (error) {
    return null;
  }
}

async function cachedValidHtml(request) {
  const candidates = [
    request,
    new Request('./index.html', { headers: { accept: 'text/html' } }),
    new Request('./offline.html', { headers: { accept: 'text/html' } })
  ];
  for (const candidate of candidates) {
    const response = await caches.match(candidate, { ignoreSearch: true });
    if (await validateHtmlResponse(response)) return response;
  }
  return null;
}

async function navigationResponse(request) {
  const cache = await caches.open(CACHE_NAME);
  const direct = await fetchValidHtml(request);
  if (direct) {
    await cache.put(request, direct.clone());
    return direct;
  }

  const indexRequest = new Request(new URL('./index.html', self.location.href), {
    method: 'GET',
    headers: { accept: 'text/html' },
    cache: 'no-store',
    credentials: 'same-origin',
    redirect: 'follow'
  });
  const indexResponse = await fetchValidHtml(indexRequest);
  if (indexResponse) {
    await cache.put('./index.html', indexResponse.clone());
    return indexResponse;
  }

  return await cachedValidHtml(request) || new Response(
    '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Offline</title></head><body><p>This page is temporarily unavailable.</p></body></html>',
    { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}

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

async function cacheFirstMedia(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request, {ignoreSearch:true});
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch (error) {
    return caches.match('./offline.html');
  }
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  const acceptsHtml = event.request.headers.get('accept')?.includes('text/html');
  if (event.request.mode === 'navigate' || acceptsHtml) {
    event.respondWith(navigationResponse(event.request));
  } else if (CRITICAL_EXTENSIONS.test(url.pathname)) {
    event.respondWith(networkFirst(event.request));
  } else {
    event.respondWith(cacheFirstMedia(event.request));
  }
});
