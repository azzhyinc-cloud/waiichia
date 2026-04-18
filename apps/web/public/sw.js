// ─── Waiichia Service Worker ───
// Gestion du cache offline + notifications push

const CACHE_NAME = 'waiichia-v3'
const OFFLINE_URL = '/offline.html'

// ─── Install ───
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        OFFLINE_URL,
        '/icons/icon-192x192.png',
        '/icons/icon-72x72.png'
      ]).catch(() => {
        // Si les fichiers n'existent pas encore, on ignore
        console.log('[SW] Certains fichiers de cache non disponibles')
      })
    })
  )
  self.skipWaiting()
})

// ─── Activate ───
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
  self.clients.claim()
})

// ─── Fetch (offline fallback) ───
self.addEventListener('fetch', (event) => {
  // Only handle navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_URL)
      })
    )
  }
})

// ─── Push Notification Received ───
self.addEventListener('push', (event) => {
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
      data = { ...data, ...payload }
    }
  } catch (e) {
    // Si le payload n'est pas du JSON, utiliser le texte brut
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
    renotify: true
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// ─── Notification Click ───
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = event.notification.data?.url || '/'

  if (event.action === 'close') return

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Si une fenêtre Waiichia est déjà ouverte, la focus
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
      // Sinon ouvrir une nouvelle fenêtre
      return self.clients.openWindow('https://waiichia.com' + url)
    })
  )
})

// ─── Push Subscription Change ───
self.addEventListener('pushsubscriptionchange', (event) => {
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
