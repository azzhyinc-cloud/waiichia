import { supabase } from '../config.js'

export default async function messagesRoutes(fastify) {

  // GET mes conversations
  fastify.get('/api/conversations', { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const uid = req.user.id
    const { data, error } = await supabase
      .from('conversations')
      .select(`*, 
        p1:participant_1(id,username,display_name,avatar_url,is_verified),
        p2:participant_2(id,username,display_name,avatar_url,is_verified)`)
      .or(`participant_1.eq.${uid},participant_2.eq.${uid}`)
      .order('last_message_at', { ascending: false })
    if (error) return reply.status(500).send({ error: error.message })
    // Formater pour retourner l'autre participant
    const convs = data.map(c => ({
      ...c,
      other: c.participant_1 === uid ? c.p2 : c.p1,
      unread: c.participant_1 === uid ? c.unread_1 : c.unread_2
    }))
    return { conversations: convs }
  })

  // GET ou créer une conversation avec un user
  fastify.post('/api/conversations', { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const { other_user_id } = req.body
    const uid = req.user.id
    if (uid === other_user_id) return reply.status(400).send({ error: 'Impossible' })
    
    // Chercher si elle existe (dans les 2 sens)
    const { data: existing } = await supabase
      .from('conversations')
      .select('*')
      .or(`and(participant_1.eq.${uid},participant_2.eq.${other_user_id}),and(participant_1.eq.${other_user_id},participant_2.eq.${uid})`)
      .single()
    
    if (existing) return { conversation: existing }
    
    const { data, error } = await supabase.from('conversations').insert({
      participant_1: uid, participant_2: other_user_id
    }).select().single()
    if (error) return reply.status(500).send({ error: error.message })
    return { conversation: data }
  })

  // GET messages d'une conversation
  fastify.get('/api/conversations/:id/messages', { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*, sender:sender_id(id,username,display_name,avatar_url), track:track_id(id,title,cover_url,duration_sec)')
      .eq('conversation_id', req.params.id)
      .order('created_at', { ascending: true })
      .limit(100)
    if (error) return reply.status(500).send({ error: error.message })

    // Marquer comme lu
    const uid = req.user.id
    await supabase.from('messages').update({ is_read: true })
      .eq('conversation_id', req.params.id).neq('sender_id', uid)
    
    // Reset unread count
    const { data: conv } = await supabase.from('conversations').select('participant_1,participant_2').eq('id', req.params.id).single()
    if (conv) {
      const field = conv.participant_1 === uid ? 'unread_1' : 'unread_2'
      await supabase.from('conversations').update({ [field]: 0 }).eq('id', req.params.id)
    }

    return { messages: data }
  })

  // POST envoyer un message
  fastify.post('/api/conversations/:id/messages', { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const { content, message_type = 'text', track_id } = req.body
    if (!content && !track_id) return reply.status(400).send({ error: 'Contenu requis' })
    
    const { data: msg, error } = await supabase.from('messages').insert({
      conversation_id: req.params.id,
      sender_id: req.user.id,
      content: content || '',
      message_type,
      track_id: track_id || null
    }).select('*, sender:sender_id(id,username,display_name,avatar_url), track:track_id(id,title,cover_url)').single()
    if (error) return reply.status(500).send({ error: error.message })

    // Update conversation last_message + increment unread de l'autre
    const { data: conv } = await supabase.from('conversations').select('participant_1,participant_2,unread_1,unread_2').eq('id', req.params.id).single()
    if (conv) {
      const isP1 = conv.participant_1 === req.user.id
      await supabase.from('conversations').update({
        last_message: content || '🎵 Son partagé',
        last_message_at: new Date().toISOString(),
        unread_1: isP1 ? conv.unread_1 : (conv.unread_1 + 1),
        unread_2: isP1 ? (conv.unread_2 + 1) : conv.unread_2,
      }).eq('id', req.params.id)
    }

    return { message: msg }
  })

  // GET rechercher un utilisateur pour nouvelle conv
  fastify.get('/api/users/search', { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const { q } = req.query
    if (!q || q.length < 2) return { users: [] }
    const { data, error } = await supabase
      .from('profiles')
      .select('id,username,display_name,avatar_url,is_verified,profile_type')
      .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
      .neq('id', req.user.id)
      .limit(8)
    if (error) return { users: [] }
    return { users: data }
  })
}
