import { supabase } from '../config.js'
import { sendPushToUser } from '../services/notify.js'

// ═══════════════════════════════════════════════════════════════════════════
//   WAIICHIA — Système de notifications unifié (BDD + Push navigateur)
// ═══════════════════════════════════════════════════════════════════════════
//
//   Chaque Notify.xxx() fait DEUX choses :
//   1. Crée la notif en base de données (pour la cloche 🔔 dans l'app)
//   2. Envoie automatiquement un push navigateur (Web Push API)
//
//   Les appels push sont en "fire-and-forget" — ils ne bloquent jamais
//   le flow de la requête API même s'ils échouent.
//
//   ── ANTI-SPAM (throttle in-memory) ───────────────────────────────────────
//   Notify.react et Notify.message sont throttlés à 1 notif toutes les 5 min
//   par couple (expéditeur, destinataire, contenu). Si throttled : aucune
//   notif BDD ni push n'est créée (skip total).
// ═══════════════════════════════════════════════════════════════════════════


// ─── THROTTLE in-memory (Map<key, timestamp>) ──────────────────────────────
const THROTTLE_TTL_MS = 5 * 60 * 1000  // 5 minutes
const throttleMap = new Map()

/**
 * Retourne true si la clé a déjà été notifiée dans les TTL dernières ms.
 * Sinon, enregistre la clé avec timestamp courant et retourne false.
 */
function isThrottled(key, ttlMs = THROTTLE_TTL_MS) {
  if (!key) return false
  const now = Date.now()
  const last = throttleMap.get(key)
  if (last && (now - last) < ttlMs) {
    return true
  }
  throttleMap.set(key, now)
  return false
}

// Nettoyage périodique toutes les 10 min (évite que la Map grossisse indéfiniment)
setInterval(() => {
  const now = Date.now()
  let purged = 0
  for (const [k, ts] of throttleMap.entries()) {
    if ((now - ts) >= THROTTLE_TTL_MS) {
      throttleMap.delete(k)
      purged++
    }
  }
  if (purged > 0) console.log(`[notify] 🧹 Throttle cache purged: ${purged} clés expirées`)
}, 10 * 60 * 1000).unref?.()  // .unref() pour ne pas bloquer l'arrêt du process


/**
 * Crée une notification en BDD + envoie le push navigateur
 * Ne notifie jamais l'utilisateur pour ses propres actions
 */
export async function createNotification({ user_id, from_id, title, body, data = {} }) {
  console.log('[notify] 🔔 createNotification appelé → user_id:', user_id, '| from_id:', from_id, '| title:', title)

  if (!user_id || user_id === from_id) {
    console.log('[notify] ⚠️ Skip : user_id manquant ou self-notification')
    return null
  }

  let notif = null

  // 1) Notif en BDD
  try {
    const { data: inserted, error } = await supabase.from('notifications').insert({
      user_id,
      from_id: from_id || null,
      title,
      body: body || null,
      data,
      is_read: false,
    }).select().single()
    if (error) console.error('[notify] ❌ insert BDD error:', error.message)
    else console.log('[notify] ✅ Notif BDD créée id:', inserted?.id)
    notif = inserted
  } catch (e) {
    console.error('[notify] ❌ insert exception:', e.message)
  }

  // 2) Push navigateur (fire-and-forget — on bloque pas la route)
  try {
    console.log('[notify] 📤 Appel sendPushToUser pour user_id:', user_id)
    sendPushToUser(supabase, user_id, {
      title,
      body: body || '',
      url: data?.url || '/',
      icon: data?.icon || '/icons/icon-192x192.png',
    }).then(result => {
      console.log('[notify] 📬 sendPushToUser terminé →', JSON.stringify(result))
    }).catch(err => {
      console.error('[notify] ❌ push error:', err?.message || err)
    })
  } catch (e) {
    console.error('[notify] ❌ push exception:', e.message)
  }

  return notif
}


// ─── Helper : construit l'URL de redirection selon le type de contenu ───
function buildReactUrl(target_type, target_id) {
  if (!target_id) return '/'
  switch (target_type) {
    case 'track':     return `/?play=${target_id}`
    case 'recording': return `/?page=karaoke&recording=${target_id}`
    case 'album':     return `/?album=${target_id}`
    case 'event':     return `/?event=${target_id}`
    case 'product':   return `/?page=shop`
    case 'episode':
    case 'emission':  return `/?page=emission`
    case 'radio':     return `/?page=radio`
    default:          return '/'
  }
}

// ─── Helper : nettoie l'emoji (certains frontends envoient "like" au lieu de ❤️) ───
function cleanEmoji(emoji) {
  if (!emoji) return '❤️'
  // Si c'est un mot anglais ("like", "love", "heart", etc.) → remplacer par emoji
  const wordMap = {
    like: '❤️', love: '❤️', heart: '❤️',
    fire: '🔥', flame: '🔥',
    clap: '👏', hands: '👏',
    laugh: '😂', haha: '😂',
    wow: '😮', surprise: '😮',
    sad: '😢', cry: '😢',
    angry: '😡',
  }
  const lower = String(emoji).toLowerCase().trim()
  if (wordMap[lower]) return wordMap[lower]
  // Sinon garder tel quel (c'est déjà un emoji ou un caractère spécial)
  return emoji
}


/**
 * Raccourcis par type d'événement
 * Chaque raccourci construit un `data.url` pour que le clic sur la push
 * ouvre la bonne page dans Waiichia.
 */
export const Notify = {

  // ─── Follow ───────────────────────────────────────
  follow: (from_id, target_id, from_username) =>
    createNotification({
      user_id: target_id,
      from_id,
      title: '👥 Nouveau follower',
      body: `@${from_username} vous suit maintenant`,
      data: {
        type: 'follow',
        from_username,
        url: `/?u=${from_username}`,
      },
    }),

  // ─── Commentaires ─────────────────────────────────
  comment: (from_id, target_owner_id, from_username, target_type, target_title) =>
    createNotification({
      user_id: target_owner_id,
      from_id,
      title: '💬 Nouveau commentaire',
      body: `@${from_username} a commenté ${target_title || 'votre contenu'}`,
      data: {
        type: 'comment',
        target_type,
        target_title,
        url: '/',
      },
    }),

  // ─── Réactions (like / emoji) ─────────────────────
  // 🛡️ Throttlée : 1 notif max toutes les 5 min par (from, target_type, target_id)
  // Permet de changer d'emoji (❤️ → 🔥) sans spammer le destinataire.
  react: (from_id, target_owner_id, from_username, emoji, target_type, target_title, target_id) => {
    const cleanedEmoji = cleanEmoji(emoji)
    const throttleKey = `react:${from_id}:${target_type}:${target_id}`
    if (isThrottled(throttleKey)) {
      console.log(`[notify] 🛡️ React throttlée → ${throttleKey}`)
      return Promise.resolve(null)
    }
    return createNotification({
      user_id: target_owner_id,
      from_id,
      title: `${cleanedEmoji} Nouvelle réaction`,
      body: `@${from_username} a réagi à ${target_title || 'votre contenu'}`,
      data: {
        type: 'react',
        emoji: cleanedEmoji,
        target_type,
        target_title,
        target_id: target_id || null,
        url: buildReactUrl(target_type, target_id),
      },
    })
  },

  // ─── Achat produit boutique ───────────────────────
  purchase: (buyer_id, seller_id, buyer_username, item_name, amount, currency) =>
    createNotification({
      user_id: seller_id,
      from_id: buyer_id,
      title: '🛒 Nouvelle vente',
      body: `@${buyer_username} a acheté "${item_name}" — ${amount} ${currency}`,
      data: {
        type: 'purchase',
        item_name,
        amount,
        currency,
        url: '/',
      },
    }),

  // ─── Location de piste ─────────────────────────────
  rental: (buyer_id, seller_id, buyer_username, track_title, period) =>
    createNotification({
      user_id: seller_id,
      from_id: buyer_id,
      title: '🎵 Nouvelle location',
      body: `@${buyer_username} a loué "${track_title}" (${period})`,
      data: {
        type: 'rental',
        track_title,
        period,
        url: '/',
      },
    }),

  // ─── Billet d'événement ───────────────────────────
  ticket: (buyer_id, creator_id, buyer_username, event_title, quantity) =>
    createNotification({
      user_id: creator_id,
      from_id: buyer_id,
      title: '🎫 Billet acheté',
      body: `@${buyer_username} a pris ${quantity} billet(s) pour "${event_title}"`,
      data: {
        type: 'ticket',
        event_title,
        quantity,
        url: '/',
      },
    }),

  // ─── Transfert wallet ─────────────────────────────
  transfer: (from_id, to_id, from_username, amount, currency, message) =>
    createNotification({
      user_id: to_id,
      from_id,
      title: '💸 Transfert reçu',
      body: `@${from_username} vous a envoyé ${amount} ${currency}${message ? ' · ' + message : ''}`,
      data: {
        type: 'transfer',
        amount,
        currency,
        url: '/',
      },
    }),

  // ─── Pourboire radio ──────────────────────────────
  tip: (from_id, radio_creator_id, from_username, amount, currency, radio_name) =>
    createNotification({
      user_id: radio_creator_id,
      from_id,
      title: '💰 Pourboire reçu',
      body: `@${from_username} a envoyé ${amount} ${currency} à "${radio_name}"`,
      data: {
        type: 'tip',
        amount,
        currency,
        radio_name,
        url: '/',
      },
    }),

  // ─── Nouveau message privé ────────────────────────
  // 🛡️ Throttlée : 1 notif max toutes les 5 min par (from, to)
  // Évite qu'un échange rapide de 10 messages génère 10 pushs au destinataire.
  message: (from_id, to_id, from_username, preview) => {
    const throttleKey = `message:${from_id}:${to_id}`
    if (isThrottled(throttleKey)) {
      console.log(`[notify] 🛡️ Message throttlée → ${throttleKey}`)
      return Promise.resolve(null)
    }
    return createNotification({
      user_id: to_id,
      from_id,
      title: '✉️ Nouveau message',
      body: `@${from_username} : ${preview || '...'}`,
      data: {
        type: 'message',
        from_username,
        url: '/',
      },
    })
  },

  // ─── KARAOKÉ — Nouveau duet sur ma piste ──────────
  karaokeDuet: (from_id, track_creator_id, from_username, track_title) =>
    createNotification({
      user_id: track_creator_id,
      from_id,
      title: '🎤 Nouveau duet karaoké',
      body: `@${from_username} a enregistré un duet sur "${track_title}"`,
      data: {
        type: 'karaoke_duet',
        track_title,
        url: '/?page=karaoke',
      },
    }),

  // ─── KARAOKÉ — Quelqu'un a publié un duet/performance ─────────────
  // Signature étendue : on passe maintenant recording_id pour focus dans la page Karaoké
  karaokeRecording: (from_id, recording_owner_id, from_username, recording_title, recording_id) =>
    createNotification({
      user_id: recording_owner_id,
      from_id,
      title: '🎙️ Nouvelle performance karaoké',
      body: `@${from_username} a publié "${recording_title}"`,
      data: {
        type: 'karaoke_recording',
        recording_title,
        recording_id: recording_id || null,
        from_username,
        url: recording_id
          ? `/?page=karaoke&recording=${recording_id}&u=${from_username}`
          : `/?page=karaoke&u=${from_username}`,
      },
    }),

  // ─── KARAOKÉ — Votre performance a été featured ───
  karaokeFeatured: (recording_owner_id, recording_title, recording_id) =>
    createNotification({
      user_id: recording_owner_id,
      from_id: null,
      title: '🌟 Votre performance est en vedette !',
      body: `"${recording_title}" a été mise en avant sur Waiichia`,
      data: {
        type: 'karaoke_featured',
        recording_title,
        recording_id: recording_id || null,
        url: recording_id
          ? `/?page=karaoke&recording=${recording_id}`
          : '/?page=karaoke',
      },
    }),
}
