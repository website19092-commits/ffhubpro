/* FF HUB PRO — Service Worker */
const CACHE_NAME = 'ffhub-v1';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;800;900&family=Rajdhani:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700;800&display=swap',
  'https://i.postimg.cc/fRsQ9XRP/f3fdd85fbe04992687d23e9334d7c71f-(1).jpg',
  'https://i.postimg.cc/bNPcWkfm/9b456155cd35f9bdfcbca58b397edb75.jpg',
  'https://i.postimg.cc/ZRdwV2vg/verified.png',
  'https://i.postimg.cc/2yy25Tf9/images-(1).png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.all(
        CORE_ASSETS.map(url => cache.add(url).catch(() => null))
      );
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  /* Network-first for HTML (fresh content) */
  if (req.headers.get('accept') && req.headers.get('accept').includes('text/html')) {
    event.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, copy)).catch(()=>{});
        return res;
      }).catch(() => caches.match(req).then(c => c || caches.match('./index.html')))
    );
    return;
  }

  /* Cache-first for others */
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, copy)).catch(()=>{});
        }
        return res;
      }).catch(() => cached);
    })
  );
});