import { supabase } from '../config.js'
import { createNotification } from '../utils/notify.js'

export default async function messagesRoutes(fastify) {

  fastify.get('/conversations', { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const uid = req.user.id
    const { data, error } = await supabase
      .from('conversations')
      .select('*, p1:participant_1(id,username,display_name,avatar_url,is_verified), p2:participant_2(id,username,display_name,avatar_url,is_verified)')
      .or('participant_1.eq.' + uid + ',participant_2.eq.' + uid)
      .order('last_message_at', { ascending: false })
    if (error) return reply.status(500).send({ error: error.message })
    const convs = (data || []).map(c => ({
      ...c,
      other: c.participant_1 === uid ? c.p2 : c.p1,
      unread: c.participant_1 === uid ? c.unread_1 : c.unread_2
    }))
    return { conversations: convs }
  })

  fastify.post('/conversations', { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const { other_user_id } = req.body
    const uid = req.user.id
    if (uid === other_user_id) return reply.status(400).send({ error: 'Impossible' })
    const { data: existing } = await supabase
      .from('conversations')
      .select('*')
      .or('and(participant_1.eq.' + uid + ',participant_2.eq.' + other_user_id + '),and(participant_1.eq.' + other_user_id + ',participant_2.eq.' + uid + ')')
      .maybeSingle()
    if (existing) return { conversation: existing }
    const { data, error } = await supabase.from('conversations').insert({
      participant_1: uid, participant_2: other_user_id, last_message_at: new Date().toISOString()
    }).select().single()
    if (error) return reply.status(500).send({ error: error.message })
    return { conversation: data }
  })

  fastify.get('/conversations/:id/messages', { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*, sender:sender_id(id,username,display_name,avatar_url)')
      .eq('conversation_id', req.params.id)
      .order('created_at', { ascending: true })
      .limit(100)
    if (error) return reply.status(500).send({ error: error.message })
    const uid = req.user.id
    await supabase.from('messages').update({ is_read: true }).eq('conversation_id', req.params.id).neq('sender_id', uid)
    const { data: conv } = await supabase.from('conversations').select('participant_1,participant_2').eq('id', req.params.id).single()
    if (conv) {
      const field = conv.participant_1 === uid ? 'unread_1' : 'unread_2'
      await supabase.from('conversations').update({ [field]: 0 }).eq('id', req.params.id)
    }
    return { messages: data || [] }
  })

  fastify.post('/conversations/:id/messages', { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const { content, message_type = 'text', track_id } = req.body
    if (!content && !track_id) return reply.status(400).send({ error: 'Contenu requis' })
    const { data: msg, error } = await supabase.from('messages').insert({
      conversation_id: req.params.id,
      sender_id: req.user.id,
      content: content || '',
      message_type,
      track_id: track_id || null
    }).select('*, sender:sender_id(id,username,display_name,avatar_url)').single()
    if (error) return reply.status(500).send({ error: error.message })
    const { data: conv } = await supabase.from('conversations').select('participant_1,participant_2,unread_1,unread_2').eq('id', req.params.id).single()
    if (conv) {
      const isP1 = conv.participant_1 === req.user.id
      const recipientId = isP1 ? conv.participant_2 : conv.participant_1
      const preview = content?.startsWith('http') ? (message_type === 'voice' ? '🎤 Vocal' : '📷 Photo') : content || 'Son partagé'
      await supabase.from('conversations').update({
        last_message: preview,
        last_message_at: new Date().toISOString(),
        unread_1: isP1 ? conv.unread_1 : (conv.unread_1 + 1),
        unread_2: isP1 ? (conv.unread_2 + 1) : conv.unread_2,
      }).eq('id', req.params.id)

      // ── NOTIFICATION MESSAGE ──
      const notifPreview = content?.startsWith('http') ? (message_type === 'voice' ? '🎤 Message vocal' : message_type === 'image' ? '📷 Photo' : '📎 Fichier') : (content || '').length > 50 ? content.slice(0, 47) + '...' : (content || 'Message')
      createNotification({
        user_id: recipientId,
        from_id: req.user.id,
        title: 'Nouveau message',
        body: '@' + req.user.username + ': ' + notifPreview,
        data: { type: 'message', conversation_id: req.params.id },
      })
    }
    return { message: msg }
  })

  // React to a message
  fastify.post('/react', { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const { message_id, reaction, user_id } = req.body
    if (!message_id) return reply.status(400).send({ error: 'message_id requis' })
    const { data: msg } = await supabase.from('messages').select('reaction').eq('id', message_id).single()
    const current = (msg?.reaction && typeof msg.reaction === 'object') ? msg.reaction : {}
    const uid = user_id || req.user.id
    if (current[uid] === reaction) delete current[uid]
    else current[uid] = reaction
    const newReaction = Object.keys(current).length ? current : null
    const { error } = await supabase.from('messages').update({ reaction: newReaction }).eq('id', message_id)
    if (error) return reply.status(500).send({ error: error.message })
    return { ok: true }
  })

  // Edit a message
  fastify.patch('/edit', { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const { message_id, content } = req.body
    if (!message_id || !content) return reply.status(400).send({ error: 'message_id et content requis' })
    const { data, error } = await supabase.from('messages')
      .update({ content, edited: true })
      .eq('id', message_id)
      .eq('sender_id', req.user.id)
      .select().single()
    if (error) return reply.status(500).send({ error: error.message })
    return { message: data }
  })

  // Delete a message
  fastify.delete('/delete', { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const { message_id } = req.body
    if (!message_id) return reply.status(400).send({ error: 'message_id requis' })
    const { error } = await supabase.from('messages')
      .delete()
      .eq('id', message_id)
      .eq('sender_id', req.user.id)
    if (error) return reply.status(500).send({ error: error.message })
    return { ok: true }
  })

  // Search users
  fastify.get('/users/search', { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const { q } = req.query
    if (!q || q.length < 2) return { users: [] }
    const { data } = await supabase
      .from('profiles')
      .select('id,username,display_name,avatar_url,is_verified,profile_type')
      .or('username.ilike.%' + q + '%,display_name.ilike.%' + q + '%')
      .neq('id', req.user.id)
      .limit(8)
    return { users: data || [] }
  })
}
