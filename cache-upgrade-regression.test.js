const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = __dirname;
const RC15_CACHE = 'travel-engine-nz-family-v1-1.0-rc15-2-fast-resume';
const RC16_CACHE_SUFFIX = '-rc16-1-master-import';

function loadData() {
  const context = {console};
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root, 'data.js'), 'utf8'), context, {filename: 'data.js'});
  return context;
}

function loadWorker(existingCaches = []) {
  const handlers = {};
  const deleted = [];
  const added = [];
  const stores = new Map(existingCaches.map(name => [name, new Map()]));
  const cacheFor = name => ({
    add: async request => { added.push({name, url:String(request.url || request)}); },
    match: async request => stores.get(name)?.get(String(request.url || request)),
    put: async (request, response) => stores.get(name).set(String(request.url || request), response)
  });
  const caches = {
    keys: async () => [...stores.keys()],
    delete: async name => { deleted.push(name); return stores.delete(name); },
    open: async name => { if (!stores.has(name)) stores.set(name, new Map()); return cacheFor(name); },
    match: async request => {
      const key = String(request.url || request);
      for (const store of stores.values()) if (store.has(key)) return store.get(key);
      return undefined;
    }
  };
  class WorkerRequest {
    constructor(url, options={}) { this.url=String(url); this.method='GET'; this.mode=options.mode||'same-origin'; this.headers={get:()=>null}; }
  }
  const context = {
    console, caches, URL, Request:WorkerRequest, Response,
    fetch: async () => { throw new Error('offline'); },
    importScripts: () => {},
    TRIP_CONFIG: {storageNamespace:'nz-family-v1', version:'1.0'},
    ASSET_CONFIG: {icons:{icon192:'icon-192.png',icon512:'icon-512.png'},branding:{secondaryMark:'nz-adventure-mark.png',splashLogo:'nz-adventure-logo.png'}},
    self: {
      location:{origin:'https://companion.example'},
      clients:{claim:async()=>{}},
      skipWaiting:async()=>{},
      addEventListener:(name, fn) => { handlers[name] = fn; }
    }
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root, 'sw.js'), 'utf8'), context, {filename:'sw.js'});
  return {context, handlers, caches, stores, deleted, added};
}

function dispatchLifecycle(handler) {
  let completion;
  handler({waitUntil: promise => { completion = Promise.resolve(promise); }});
  return completion;
}

test('all active pages request the RC16.1 data and PWA generations', () => {
  const htmlFiles = fs.readdirSync(root).filter(name => name.endsWith('.html'));
  const dataConsumers = htmlFiles.filter(name => fs.readFileSync(path.join(root, name), 'utf8').includes('data.js?v='));
  assert.ok(dataConsumers.length > 0);
  for (const name of dataConsumers) {
    const html = fs.readFileSync(path.join(root, name), 'utf8');
    assert.match(html, /data\.js\?v=nz1\.0-rc16-1/);
    assert.doesNotMatch(html, /data\.js\?v=nz1\.0-rc15/);
    assert.match(html, /pwa\.js\?v=nz1\.0-rc16-1/);
  }
});

test('installed RC15.2 PWA cache is removed when RC16.1 activates', async () => {
  const worker = loadWorker([RC15_CACHE, 'unrelated-stale-generation']);
  await dispatchLifecycle(worker.handlers.activate);
  assert.deepEqual(new Set(worker.deleted), new Set([RC15_CACHE, 'unrelated-stale-generation']));
  assert.equal([...worker.stores.keys()].length, 0);
});

test('RC16.1 install creates a new cache and reloads the application shell', async () => {
  const worker = loadWorker([RC15_CACHE]);
  await dispatchLifecycle(worker.handlers.install);
  const cacheNames = [...worker.stores.keys()];
  const next = cacheNames.find(name => name.endsWith(RC16_CACHE_SUFFIX));
  assert.ok(next, `Expected cache ending ${RC16_CACHE_SUFFIX}`);
  assert.ok(worker.added.some(entry => /data\.js$/.test(entry.url)));
  assert.ok(worker.added.some(entry => /day\.html$/.test(entry.url)));
  assert.ok(worker.added.every(entry => entry.name === next));
});

test('cold relaunch uses RC16 itinerary data rather than RC15 content', () => {
  const data = loadData();
  assert.equal(data.TRAVEL_DATASETS.ITINERARY_DATA['1'].heading, 'Arrival in Christchurch');
  assert.equal(data.TRAVEL_DATASETS.ITINERARY_DATA['3'].items.some(item => item.placeId === 'edgewater'), true);
  assert.equal(data.TRAVEL_DATASETS.ITINERARY_DATA['3'].items.some(item => item.placeId === 'archway' && item.bookingId === 'archway-booking'), false);
  assert.equal(data.MASTER_ITINERARY_REVISION, '72891e42286be');
});
