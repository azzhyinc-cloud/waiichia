import webpush from 'web-push'

// Configure VAPID — les clés seront lues depuis les variables d'env
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || ''
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ''
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:contact@waiichia.com'

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
}

/**
 * Envoie une notification push à un utilisateur spécifique
 * @param {object} supabase - client Supabase
 * @param {string} userId - ID du destinataire
 * @param {object} payload - { title, body, url, icon }
 * @returns {object} { sent, failed }
 */
export async function sendPushToUser(supabase, userId, payload) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn('[Push] VAPID keys non configurées, push ignoré')
    return { sent: 0, failed: 0 }
  }

  try {
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId)

    if (!subs || subs.length === 0) {
      return { sent: 0, failed: 0 }
    }

    const notification = JSON.stringify({
      title: payload.title || 'Waiichia',
      body: payload.body || '',
      icon: payload.icon || '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      url: payload.url || '/',
      timestamp: Date.now()
    })

    let sent = 0
    let failed = 0

    await Promise.allSettled(subs.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      }

      try {
        await webpush.sendNotification(pushSubscription, notification)
        sent++
      } catch (err) {
        failed++
        // Si le subscription est expirée/invalide (410 Gone ou 404), la supprimer
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('id', sub.id)
          console.log(`[Push] Subscription expirée supprimée: ${sub.id}`)
        } else {
          console.error(`[Push] Erreur envoi à ${sub.endpoint}:`, err.message)
        }
      }
    }))

    return { sent, failed }
  } catch (e) {
    console.error('[Push] Erreur globale:', e)
    return { sent: 0, failed: 0 }
  }
}

/**
 * Envoie une notification push à plusieurs utilisateurs
 * @param {object} supabase - client Supabase
 * @param {string[]} userIds - IDs des destinataires
 * @param {object} payload - { title, body, url, icon }
 */
export async function sendPushToUsers(supabase, userIds, payload) {
  const results = await Promise.allSettled(
    userIds.map(uid => sendPushToUser(supabase, uid, payload))
  )

  let totalSent = 0
  let totalFailed = 0
  results.forEach(r => {
    if (r.status === 'fulfilled') {
      totalSent += r.value.sent
      totalFailed += r.value.failed
    }
  })

  return { sent: totalSent, failed: totalFailed }
}
