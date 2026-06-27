// ─── Waiichia Service Worker ───
// Gestion du cache offline + notifications push
const CACHE_NAME = 'waiichia-v5'
const CACHE_STATIC = 'waiichia-static-v5'
const CACHE_API    = 'waiichia-api-v5'
const OFFLINE_URL  = '/offline.html'

console.log('[SW] 📄 Script chargé — version', CACHE_NAME)

// Assets statiques à précacher à l'install
const PRECACHE_ASSETS = [
  OFFLINE_URL,
  '/',
  '/icons/icon-192x192.png',
  '/icons/icon-72x72.png',
]

// Préfixes API à mettre en cache (Network First, fallback cache)
const API_CACHE_PATTERNS = [
  '/api/tracks',
  '/api/profiles',
  '/api/emissions',
  '/api/events',
  '/api/karaoke/tracks',
  '/api/karaoke/recordings/public',
]

// ─── Install ───
self.addEventListener('install', (event) => {
  console.log('[SW] 🔧 install event')
  event.waitUntil(
    caches.open(CACHE_STATIC).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch(() => {
        console.log('[SW] Certains fichiers de précache non disponibles')
      })
    })
  )
  self.skipWaiting()
})

// ─── Activate ───
self.addEventListener('activate', (event) => {
  console.log('[SW] ⚡ activate event')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => ![CACHE_NAME, CACHE_STATIC, CACHE_API].includes(name))
          .map((name) => {
            console.log('[SW] 🗑️ Suppression ancien cache:', name)
            return caches.delete(name)
          })
      )
    })
  )
  self.clients.claim()
})

// ─── Fetch ───
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Ignorer les requêtes non-GET et les extensions browser
  if (request.method !== 'GET') return
  if (url.protocol === 'chrome-extension:') return

  // 1. Navigation (HTML) → Network First, fallback offline.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Mettre en cache la page si succès
          const clone = response.clone()
          caches.open(CACHE_STATIC).then((cache) => cache.put(request, clone))
          return response
        })
        .catch(() => {
          return caches.match(OFFLINE_URL)
        })
    )
    return
  }

  // 2. Assets JS/CSS/fonts (même domaine ou CDN) → Cache First
  const isAsset =
    url.pathname.startsWith('/assets/') ||
    url.pathname.match(/\.(js|css|woff2?|ttf|otf|eot)$/) ||
    url.hostname === 'fonts.gstatic.com' ||
    url.hostname === 'fonts.googleapis.com'

  if (isAsset) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((response) => {
          if (!response || response.status !== 200) return response
          const clone = response.clone()
          caches.open(CACHE_STATIC).then((cache) => cache.put(request, clone))
          return response
        }).catch(() => caches.match(request))
      })
    )
    return
  }

  // 3. Images → Cache First avec fallback silencieux
  const isImage =
    url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico)$/) ||
    url.hostname.includes('supabase')

  if (isImage) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((response) => {
          if (!response || response.status !== 200) return response
          const clone = response.clone()
          caches.open(CACHE_STATIC).then((cache) => cache.put(request, clone))
          return response
        }).catch(() => new Response('', { status: 408 }))
      })
    )
    return
  }

  // 4. Appels API Waiichia → Network First, fallback cache 10min
  const isApiCall =
    url.hostname === 'api.waiichia.com' &&
    API_CACHE_PATTERNS.some((pattern) => url.pathname.startsWith(pattern))

  if (isApiCall) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (!response || response.status !== 200) return response
          const clone = response.clone()
          caches.open(CACHE_API).then((cache) => {
            cache.put(request, clone)
            // Nettoyer les entrées API de plus de 10 min
            pruneApiCache()
          })
          return response
        })
        .catch(() => {
          console.log('[SW] 📦 Fallback cache API pour:', url.pathname)
          return caches.match(request).then((cached) => {
            if (cached) return cached
            return new Response(
              JSON.stringify({ error: 'offline', cached: false }),
              { status: 503, headers: { 'Content-Type': 'application/json' } }
            )
          })
        })
    )
    return
  }
})

// ─── Nettoyage cache API (entrées > 10 min) ───
async function pruneApiCache() {
  try {
    const cache = await caches.open(CACHE_API)
    const keys = await cache.keys()
    const TEN_MIN = 10 * 60 * 1000
    const now = Date.now()
    for (const key of keys) {
      const response = await cache.match(key)
      if (!response) continue
      const dateHeader = response.headers.get('date')
      if (dateHeader) {
        const age = now - new Date(dateHeader).getTime()
        if (age > TEN_MIN) {
          await cache.delete(key)
        }
      }
    }
  } catch (e) {}
}

// ─── Push Notification Received ───
self.addEventListener('push', (event) => {
  console.log('[SW] 🔔 PUSH RECU !', event)

  let data = {
    title: 'Waiichia',
    body: 'Nouvelle notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    url: '/'
  }

  try {
    if (event.data) {
      const payload = event.data.json()
      console.log('[SW] 📦 Payload reçu:', payload)
      data = { ...data, ...payload }
    } else {
      console.log('[SW] ⚠️ Pas de data dans event.data (push vide, ex: test DevTools)')
    }
  } catch (e) {
    console.log('[SW] ⚠️ Payload non JSON, fallback texte:', e.message)
    if (event.data) {
      data.body = event.data.text()
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    vibrate: [100, 50, 100],
    data: {
      url: data.url,
      timestamp: data.timestamp || Date.now()
    },
    actions: [
      { action: 'open', title: 'Ouvrir' },
      { action: 'close', title: 'Fermer' }
    ],
    tag: data.tag || 'waiichia-notification',
    renotify: true,
    requireInteraction: false
  }

  console.log('[SW] 🎯 Appel showNotification avec title:', data.title, '| body:', data.body)

  event.waitUntil(
    self.registration.showNotification(data.title, options)
      .then(() => {
        console.log('[SW] ✅ showNotification RESOLU (notif affichée)')
      })
      .catch((err) => {
        console.error('[SW] ❌ showNotification ERREUR:', err?.message || err)
      })
  )
})

// ─── Notification Click ───
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] 👆 Clic sur notification')
  event.notification.close()
  const url = event.notification.data?.url || '/'
  if (event.action === 'close') return

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes('waiichia.com') && 'focus' in client) {
          client.focus()
          client.postMessage({
            type: 'PUSH_NOTIFICATION_CLICK',
            url: url
          })
          return
        }
      }
      return self.clients.openWindow('https://waiichia.com' + url)
    })
  )
})

// ─── Push Subscription Change ───
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[SW] 🔄 pushsubscriptionchange')
  event.waitUntil(
    self.registration.pushManager.subscribe(event.oldSubscription.options).then((subscription) => {
      return fetch('https://api.waiichia.com/api/notifications/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: subscription.toJSON() })
      })
    })
  )
})

// ─── Message depuis l'app (ex: forcer mise à jour cache) ───
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  if (event.data?.type === 'CLEAR_API_CACHE') {
    caches.delete(CACHE_API).then(() => {
      console.log('[SW] 🗑️ Cache API vidé sur demande')
    })
  }
})
