importScripts('./theme-config.js', './asset-config.js', './locale-config.js', './formatter.js', './navigation-config.js', './trip-config.js', './storage-config.js');
const CACHE_NAME = `travel-engine-${TRIP_CONFIG.storageNamespace}-${TRIP_CONFIG.version}-nz25-7-42-field-diag2`;
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
  './booking-sync-runtime.js',
  './itinerary-authority.js',
  './booking-permissions.js',
  './expense-notification-runtime.js',
  './generation-selection-adapter.js',
  './place-authority.js',
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
  './documents.html',
  './documents-runtime.js',
  './documents.js',
  './documents/Edgewater-First-Table-JL8DQZ.pdf',
  './expenses.html',
  './trip.html'
];


self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('install', event => {
  self.skipWaiting();
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
  const sample = String(text || '').replace(/^\uFEFF/, '').trimStart().slice(0, 2048).toLowerCase();
  return sample.startsWith('<!doctype html') || sample.startsWith('<html') || sample.includes('<html ');
}

const ROUTE_PAGE_TITLES = Object.freeze({
  '/index.html':'Home', '/day.html':'Day', '/memory.html':'Moments', '/moments.html':'Moments', '/itinerary.html':'Days', '/expenses.html':'Expenses',
  '/documents.html':'Documents', '/place.html':'Place', '/guide.html':'Guide', '/trip.html':'Trip',
  '/offline.html':'Offline'
});
function normaliseRoutePath(url){
  let path=new URL(url, self.location.origin).pathname;
  if(path==='/' || path.endsWith('/')) path=path+'index.html';
  return '/'+(path.split('/').pop()||'index.html');
}
function expectedPageTitle(url){return ROUTE_PAGE_TITLES[normaliseRoutePath(url)]||null;}
function hasExpectedPageIdentity(text, expectedTitle){
  if(!expectedTitle) return false;
  const escaped=expectedTitle.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  return new RegExp(`<title\\s+[^>]*data-trip-page-title=["']${escaped}["'][^>]*>`, 'i').test(String(text||''));
}

async function validateHtmlResponse(response, expectedTitle) {
  if (!response || !response.ok) return false;
  const mime=String(response.headers.get('content-type')||'').toLowerCase();
  if(!mime.includes('text/html') && !mime.includes('application/xhtml+xml')) return false;
  try {
    const body = await response.clone().text();
    return looksLikeHtmlDocument(body) && hasExpectedPageIdentity(body, expectedTitle);
  } catch (error) {
    return false;
  }
}

async function fetchValidHtml(request) {
  try {
    const response = await fetch(request, { cache: 'no-store', redirect: 'follow' });
    const requestedPath = normaliseRoutePath(request.url);
    const responsePath = normaliseRoutePath(response.url || request.url);
    if (requestedPath !== responsePath) return null;
    return await validateHtmlResponse(response, expectedPageTitle(request.url)) ? response : null;
  } catch (error) {
    return null;
  }
}

async function cachedValidHtml(request) {
  const offlineRequest=new Request('./offline.html', { headers: { accept: 'text/html' } });
  const own=await caches.match(request,{ignoreSearch:true});
  if(await validateHtmlResponse(own,expectedPageTitle(request.url))) return own;
  const offline=await caches.match(offlineRequest,{ignoreSearch:true});
  if(await validateHtmlResponse(offline,'Offline')) return offline;
  return null;
}

async function navigationResponse(request) {
  const cache = await caches.open(CACHE_NAME);
  const direct = await fetchValidHtml(request);
  if (direct) {
    await cache.put(request, direct.clone());
    return direct;
  }
  return await cachedValidHtml(request) || new Response(
    '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Offline</title></head><body><p>This page is temporarily unavailable.</p></body></html>',
    { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}

async function cachedAsset(request) {
  let cached = await caches.match(request, { ignoreSearch: true });
  if (cached) return cached;
  const url = new URL(request.url);
  return caches.match(url.pathname.split('/').pop() || '', { ignoreSearch: true });
}
function validCriticalAssetResponse(response, request) {
  if (!response || !response.ok) return false;
  const url = new URL(request.url);
  const mime = String(response.headers.get('content-type') || '').toLowerCase();
  if (/\.js$/i.test(url.pathname)) return mime.includes('javascript') || mime.includes('ecmascript');
  if (/\.css$/i.test(url.pathname)) return mime.includes('text/css');
  return true;
}
async function criticalAssetResponse(request) {
  // The release cache is populated atomically during SW install. Prefer that
  // coherent bundle so a page transition cannot mix a healthy HTML document
  // with a transient 404/5xx/wrong-MIME runtime response from the network.
  const cached = await cachedAsset(request);
  if (cached) return cached;
  try {
    const response = await fetch(request, { cache: 'no-store' });
    if (validCriticalAssetResponse(response, request)) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
      return response;
    }
  } catch (error) {}
  const url = new URL(request.url);
  const isJs = /\.js$/i.test(url.pathname);
  return new Response('', {status:503,headers:{'Content-Type':isJs?'application/javascript; charset=utf-8':'text/css; charset=utf-8'}});
}
async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    if (response && response.ok) return response;
  } catch (error) {}
  const cached = await cachedAsset(request);
  if (cached) return cached;
  return caches.match('./offline.html');
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
  const documentAsset = /\.(?:pdf|docx?|xlsx?|pptx?|jpe?g|png|gif|webp|heic)(?:$|\?)/i.test(url.pathname);
  if (documentAsset) {
    event.respondWith(networkFirst(event.request));
  } else if (event.request.mode === 'navigate' || acceptsHtml) {
    event.respondWith(navigationResponse(event.request));
  } else if (CRITICAL_EXTENSIONS.test(url.pathname)) {
    event.respondWith(criticalAssetResponse(event.request));
  } else {
    event.respondWith(cacheFirstMedia(event.request));
  }
});
