import { supabase } from '../config.js'

/**
 * Crée une notification en base de données
 * Ne notifie jamais l'utilisateur pour ses propres actions
 */
export async function createNotification({ user_id, from_id, title, body, data = {} }) {
  if (!user_id || user_id === from_id) return null
  try {
    const { data: notif, error } = await supabase.from('notifications').insert({
      user_id,
      from_id: from_id || null,
      title,
      body: body || null,
      data,
      is_read: false,
    }).select().single()
    if (error) console.error('[notify] insert error:', error.message)
    return notif
  } catch (e) {
    console.error('[notify] exception:', e.message)
    return null
  }
}

/**
 * Raccourcis pour les types courants
 */
export const Notify = {
  follow: (from_id, target_id, from_username) =>
    createNotification({
      user_id: target_id,
      from_id,
      title: 'Nouveau follower',
      body: `@${from_username} vous suit maintenant`,
      data: { type: 'follow', from_username },
    }),

  comment: (from_id, target_owner_id, from_username, target_type, target_title) =>
    createNotification({
      user_id: target_owner_id,
      from_id,
      title: 'Nouveau commentaire',
      body: `@${from_username} a commenté ${target_title || 'votre contenu'}`,
      data: { type: 'comment', target_type, target_title },
    }),

  purchase: (buyer_id, seller_id, buyer_username, item_name, amount, currency) =>
    createNotification({
      user_id: seller_id,
      from_id: buyer_id,
      title: 'Nouvelle vente',
      body: `@${buyer_username} a acheté "${item_name}" — ${amount} ${currency}`,
      data: { type: 'purchase', item_name, amount, currency },
    }),

  rental: (buyer_id, seller_id, buyer_username, track_title, period) =>
    createNotification({
      user_id: seller_id,
      from_id: buyer_id,
      title: 'Nouvelle location',
      body: `@${buyer_username} a loué "${track_title}" (${period})`,
      data: { type: 'rental', track_title, period },
    }),

  ticket: (buyer_id, creator_id, buyer_username, event_title, quantity) =>
    createNotification({
      user_id: creator_id,
      from_id: buyer_id,
      title: 'Billet acheté',
      body: `@${buyer_username} a pris ${quantity} billet(s) pour "${event_title}"`,
      data: { type: 'ticket', event_title, quantity },
    }),

  transfer: (from_id, to_id, from_username, amount, currency, message) =>
    createNotification({
      user_id: to_id,
      from_id,
      title: 'Transfert reçu',
      body: `@${from_username} vous a envoyé ${amount} ${currency}${message ? ' · ' + message : ''}`,
      data: { type: 'transfer', amount, currency },
    }),

  tip: (from_id, radio_creator_id, from_username, amount, currency, radio_name) =>
    createNotification({
      user_id: radio_creator_id,
      from_id,
      title: 'Pourboire reçu',
      body: `@${from_username} a envoyé ${amount} ${currency} à "${radio_name}"`,
      data: { type: 'tip', amount, currency, radio_name },
    }),
}
