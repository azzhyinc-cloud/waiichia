import { supabase } from '../config.js'

export default async function socialRoutes(app) {

  // REAGIR A UN CONTENU
  app.post('/react', { preHandler: app.authenticate }, async (request, reply) => {
    const { target_type, target_id, emoji } = request.body
    if (!target_type || !target_id || !emoji) {
      return reply.status(400).send({ error: 'target_type, target_id et emoji requis' })
    }
    const { data: existing } = await supabase.from('reactions')
      .select('id, emoji').eq('user_id', request.user.id)
      .eq('target_type', target_type).eq('target_id', target_id).single()
    if (existing) {
      if (existing.emoji === emoji) {
        await supabase.from('reactions').delete().eq('id', existing.id)
        return reply.send({ action: 'removed', emoji })
      }
      await supabase.from('reactions').update({ emoji }).eq('id', existing.id)
      return reply.send({ action: 'updated', emoji })
    }
    await supabase.from('reactions').insert({
      user_id: request.user.id, target_type, target_id, emoji
    })
    return reply.send({ action: 'added', emoji })
  })

  // COMPTER LES REACTIONS
  app.get('/reactions/:target_type/:target_id', async (request, reply) => {
    const { target_type, target_id } = request.params
    const { data } = await supabase.from('reactions')
      .select('emoji').eq('target_type', target_type).eq('target_id', target_id)
    const counts = {}
    data?.forEach(r => { counts[r.emoji] = (counts[r.emoji] || 0) + 1 })
    return reply.send({ reactions: counts, total: data?.length || 0 })
  })

  // AJOUTER UN COMMENTAIRE
  app.post('/comment', { preHandler: app.authenticate }, async (request, reply) => {
    const { target_type, target_id, content, parent_id } = request.body
    if (!target_type || !target_id || !content) {
      return reply.status(400).send({ error: 'target_type, target_id et content requis' })
    }
    const isEmojiOnly = [...content].every(ch => ch.codePointAt(0) > 0x2000 || ch === ' ')
      && content.replace(/\s/g,'').length <= 6
    const { data, error } = await supabase.from('comments').insert({
      user_id: request.user.id,
      target_type, target_id, content,
      parent_id: parent_id || null,
      is_emoji_only: isEmojiOnly
    }).select(`*, profiles:user_id(id, username, display_name, avatar_url, is_verified)`).single()
    if (error) return reply.status(500).send({ error: error.message })
    return reply.status(201).send({ comment: data })
  })

  // LISTE DES COMMENTAIRES
  app.get('/comments/:target_type/:target_id', async (request, reply) => {
    const { target_type, target_id } = request.params
    const { page = 1, limit = 20 } = request.query
    const { data, error } = await supabase.from('comments')
      .select(`*, profiles:user_id(id, username, display_name, avatar_url, is_verified)`)
      .eq('target_type', target_type)
      .eq('target_id', target_id)
      .eq('is_active', true)
      .is('parent_id', null)
      .order('created_at', { ascending: false })
      .range((page-1)*limit, page*limit-1)
    if (error) return reply.status(500).send({ error: error.message })
    return reply.send({ comments: data })
  })

  // REPONSES A UN COMMENTAIRE
  app.get('/comments/:comment_id/replies', async (request, reply) => {
    const { comment_id } = request.params
    const { data, error } = await supabase.from('comments')
      .select(`*, profiles:user_id(id, username, display_name, avatar_url, is_verified)`)
      .eq('parent_id', comment_id)
      .eq('is_active', true)
      .order('created_at', { ascending: true })
    if (error) return reply.status(500).send({ error: error.message })
    return reply.send({ replies: data })
  })

  // SUPPRIMER UN COMMENTAIRE
  app.delete('/comment/:id', { preHandler: app.authenticate }, async (request, reply) => {
    const { id } = request.params
    const { data } = await supabase.from('comments')
      .select('user_id').eq('id', id).single()
    if (!data) return reply.status(404).send({ error: 'Commentaire introuvable' })
    if (data.user_id !== request.user.id) return reply.status(403).send({ error: 'Non autorise' })
    await supabase.from('comments').update({ is_active: false }).eq('id', id)
    return reply.send({ message: 'Commentaire supprime' })
  })

  // FIL D ACTIVITE (posts des gens suivis)
  app.get('/feed', { preHandler: app.authenticate }, async (request, reply) => {
    const { page = 1, limit = 20 } = request.query
    const { data: following } = await supabase.from('follows')
      .select('following_id').eq('follower_id', request.user.id)
    const ids = following?.map(f => f.following_id) || []
    ids.push(request.user.id)
    const { data, error } = await supabase.from('tracks')
      .select(`*, profiles:creator_id(id, username, display_name, avatar_url, is_verified)`)
      .in('creator_id', ids)
      .eq('is_published', true)
      .eq('is_active', true)
      .order('published_at', { ascending: false })
      .range((page-1)*limit, page*limit-1)
    if (error) return reply.status(500).send({ error: error.message })
    return reply.send({ feed: data })
  })

  // NOTIFICATIONS
  app.get('/notifications', { preHandler: app.authenticate }, async (request, reply) => {
    const { data, error } = await supabase.from('notifications')
      .select(`*, from:from_id(id, username, display_name, avatar_url)`)
      .eq('user_id', request.user.id)
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) return reply.status(500).send({ error: error.message })
    return reply.send({ notifications: data })
  })

  // MARQUER NOTIFICATIONS LU
  app.patch('/notifications/read', { preHandler: app.authenticate }, async (request, reply) => {
    await supabase.from('notifications')
      .update({ is_read: true })
      .eq('user_id', request.user.id)
      .eq('is_read', false)
    return reply.send({ message: 'Notifications marquees comme lues' })
  })

}
