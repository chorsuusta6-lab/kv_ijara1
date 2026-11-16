/* ============================================================
   KVARTIRA BOSHqARUV — SERVICE WORKER
   ============================================================ */

const CACHE_NAME = 'kvartira-v1';

const CACHE_URLS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './supabase.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

/* ---------- O'RNATISH ---------- */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CACHE_URLS).catch(err => {
        console.warn('[SW] Ba\'zi fayllar keshlanmadi:', err);
      }))
      .then(() => self.skipWaiting())
  );
});

/* ---------- FAOLLASHTIRISH ---------- */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

/* ---------- SO'ROVLARNI USHLASH ---------- */
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (req.method !== 'GET') return;

  /* Supabase API va Storage — har doim tarmoqdan (keshlamaymiz) */
  if (url.hostname.includes('supabase.co') || url.hostname.includes('supabase.in')) {
    return;
  }

  /* Tashqi resurslar (CDN) — network-first */
  if (url.origin !== self.location.origin) {
    event.respondWith(
      fetch(req).catch(() => caches.match(req))
    );
    return;
  }

  /* O'z fayllarimiz — cache-first, keyin network */
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;

      return fetch(req).then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, clone));
        }
        return res;
      }).catch(() => {
        if (req.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});