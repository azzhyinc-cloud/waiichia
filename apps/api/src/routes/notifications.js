import { supabase } from '../config.js'

export default async function notificationsRoutes(app, options) {

  // ─── Subscribe to push notifications ───
  app.post('/push/subscribe', { preHandler: app.authenticate }, async (request, reply) => {
    try {
      const { subscription } = request.body
      if (!subscription || !subscription.endpoint) {
        return reply.status(400).send({ error: 'Subscription invalide' })
      }

      // Upsert: if endpoint already exists for this user, update it
      const { data: existing } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('user_id', request.user.id)
        .eq('endpoint', subscription.endpoint)
        .maybeSingle()

      if (existing) {
        await supabase
          .from('push_subscriptions')
          .update({
            p256dh: subscription.keys?.p256dh || null,
            auth: subscription.keys?.auth || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
      } else {
        await supabase
          .from('push_subscriptions')
          .insert({
            user_id: request.user.id,
            endpoint: subscription.endpoint,
            p256dh: subscription.keys?.p256dh || null,
            auth: subscription.keys?.auth || null
          })
      }

      return reply.send({ success: true })
    } catch (e) {
      app.log.error(e)
      return reply.status(500).send({ error: 'Erreur enregistrement push' })
    }
  })

  // ─── Unsubscribe from push notifications ───
  app.post('/push/unsubscribe', { preHandler: app.authenticate }, async (request, reply) => {
    try {
      const { endpoint } = request.body

      if (endpoint) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', request.user.id)
          .eq('endpoint', endpoint)
      } else {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', request.user.id)
      }

      return reply.send({ success: true })
    } catch (e) {
      app.log.error(e)
      return reply.status(500).send({ error: 'Erreur désinscription push' })
    }
  })

  // ─── Get VAPID public key ───
  app.get('/push/vapid-key', async (request, reply) => {
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || ''
    if (!vapidPublicKey) {
      return reply.status(500).send({ error: 'VAPID non configuré' })
    }
    return reply.send({ publicKey: vapidPublicKey })
  })

  // ─── Check push subscription status ───
  app.get('/push/status', { preHandler: app.authenticate }, async (request, reply) => {
    try {
      const { data } = await supabase
        .from('push_subscriptions')
        .select('id, endpoint, created_at')
        .eq('user_id', request.user.id)

      return reply.send({
        subscribed: (data || []).length > 0,
        count: (data || []).length
      })
    } catch (e) {
      app.log.error(e)
      return reply.status(500).send({ error: 'Erreur serveur' })
    }
  })

  // ─── Admin: send push to user (for testing) ───
  app.post('/push/send', { preHandler: app.authenticate }, async (request, reply) => {
    try {
      if (!['admin', 'superadmin'].includes(request.user.role)) {
        return reply.status(403).send({ error: 'Accès refusé' })
      }

      const { user_id, title, body, url } = request.body
      if (!user_id || !title) {
        return reply.status(400).send({ error: 'user_id et title requis' })
      }

      const { sendPushToUser } = await import('../services/notify.js')
      const result = await sendPushToUser(supabase, user_id, { title, body: body || '', url: url || '/' })

      return reply.send({ success: true, sent: result.sent, failed: result.failed })
    } catch (e) {
      app.log.error(e)
      return reply.status(500).send({ error: 'Erreur envoi push' })
    }
  })
}
