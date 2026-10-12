// v3: stop caching personalised pages (old caches are deleted on activate).
const CACHE_NAME = 'ascend-ca-v3';
const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
  '/icon.svg',
  '/manifest.json',
  '/events',
];

/**
 * Private or personalised responses must never be stored in the cache:
 * APIs, the member dashboard, login, registration receipts and registration forms.
 */
function isPrivatePath(pathname) {
  return (
    pathname.startsWith('/api/') ||
    pathname === '/dashboard' ||
    pathname.startsWith('/dashboard/') ||
    pathname === '/login' ||
    pathname.startsWith('/login/') ||
    pathname.startsWith('/registration/') ||
    pathname.startsWith('/directory') ||
    pathname.startsWith('/mentorship') ||
    pathname.startsWith('/membership') ||
    pathname.startsWith('/account') ||
    pathname.startsWith('/verify-email') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/verify/') ||
    /^\/events\/[^/]+\/register(?:\/|$)/.test(pathname)
  );
}

/**
 * Only shared, public responses go into the cache: never one the server marks private / no-store
 * (personalised pages), never React Server Component payloads, never URLs carrying a token.
 */
function cacheable(request, response) {
  if (!response || response.status !== 200) return false;
  const cc = (response.headers.get('Cache-Control') || '').toLowerCase();
  if (cc.includes('no-store') || cc.includes('private')) return false;
  if (request.headers.get('RSC') || request.url.includes('_rsc=')) return false;
  if (/[?&](t|token)=/.test(request.url)) return false;
  return true;
}

// Install: Pre-cache static shell & offline fallback
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Pre-caching partial warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up old cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Strategy dispatcher
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and non-http/https protocols
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // Never intercept (or cache) private pages and API calls — let the browser go to the network.
  if (url.origin === self.location.origin && isPrivatePath(url.pathname)) {
    return;
  }

  // Payment gateway scripts and APIs always come fresh from the network.
  if (url.hostname.endsWith('razorpay.com')) {
    return;
  }

  // Navigation requests: Network-First with Offline Fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (cacheable(request, response)) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(async () => {
          // Attempt to retrieve from cache first
          const cached = await caches.match(request);
          if (cached) return cached;

          // If not in cache, deliver custom offline page
          const fallback = await caches.match('/offline.html');
          return fallback || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
        })
    );
    return;
  }

  // Static Assets (Next.js chunks, fonts, images, styles): Stale-While-Revalidate
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (cacheable(request, networkResponse)) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Default: Network-first
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (cacheable(request, networkResponse)) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return networkResponse;
      })
      .catch(() => caches.match(request))
  );
});

// Communication with client app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
