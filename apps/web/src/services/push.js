import api from './api.js'

/**
 * Vérifie si le navigateur supporte les notifications push
 */
export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

/**
 * Récupère la clé VAPID publique depuis l'API
 */
async function getVapidKey(token) {
  const res = await api.get('/api/notifications/push/vapid-key')
  return res.data?.publicKey
}

/**
 * Convertit une clé VAPID base64 en Uint8Array
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

/**
 * S'abonner aux notifications push
 * @param {string} token - JWT auth token
 * @returns {boolean} success
 */
export async function subscribeToPush(token) {
  try {
    if (!isPushSupported()) {
      console.warn('[Push] Non supporté par ce navigateur')
      return false
    }

    // Demander la permission
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.warn('[Push] Permission refusée')
      return false
    }

    // Récupérer la clé VAPID
    const vapidKey = await getVapidKey(token)
    if (!vapidKey) {
      console.error('[Push] Clé VAPID non disponible')
      return false
    }

    // Attendre le service worker
    const registration = await navigator.serviceWorker.ready

    // Vérifier si déjà abonné
    let subscription = await registration.pushManager.getSubscription()

    if (!subscription) {
      // Créer un nouvel abonnement
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey)
      })
    }

    // Envoyer au serveur
    await api.post('/api/notifications/push/subscribe', {
      subscription: subscription.toJSON()
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })

    console.log('[Push] Abonnement réussi')
    return true
  } catch (e) {
    console.error('[Push] Erreur abonnement:', e)
    return false
  }
}

/**
 * Se désabonner des notifications push
 * @param {string} token - JWT auth token
 * @returns {boolean} success
 */
export async function unsubscribeFromPush(token) {
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()

    if (subscription) {
      const endpoint = subscription.endpoint
      await subscription.unsubscribe()

      // Notifier le serveur
      await api.post('/api/notifications/push/unsubscribe', {
        endpoint
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
    }

    console.log('[Push] Désabonnement réussi')
    return true
  } catch (e) {
    console.error('[Push] Erreur désabonnement:', e)
    return false
  }
}

/**
 * Vérifie si l'utilisateur est abonné aux push
 * @returns {boolean}
 */
export async function isPushSubscribed() {
  try {
    if (!isPushSupported()) return false
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    return !!subscription
  } catch (e) {
    return false
  }
}

/**
 * Vérifie la permission notification actuelle
 * @returns {'granted'|'denied'|'default'}
 */
export function getNotificationPermission() {
  if (!('Notification' in window)) return 'denied'
  return Notification.permission
}
