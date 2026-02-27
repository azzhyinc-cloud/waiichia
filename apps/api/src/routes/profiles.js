import { supabase } from '../config.js'

export default async function profilesRoutes(app) {

  // VOIR UN PROFIL PUBLIC
  app.get('/:username', async (request, reply) => {
    const { username } = request.params
    const { data: profile, error } = await supabase
      .from('profiles')
      .select(`*, tracks:tracks(count), followers:follows!following_id(count)`)
      .eq('username', username.toLowerCase())
      .eq('is_active', true)
      .single()
    if (error || !profile) return reply.status(404).send({ error: 'Profil introuvable' })
    return reply.send({ profile })
  })

  // MODIFIER MON PROFIL
  app.patch('/me', { preHandler: app.authenticate }, async (request, reply) => {
    const allowed = ['display_name','bio','avatar_url','cover_url',
      'profile_type','country','currency','phone','website']
    const updates = {}
    allowed.forEach(k => { if (request.body[k] !== undefined) updates[k] = request.body[k] })
    if (Object.keys(updates).length === 0) {
      return reply.status(400).send({ error: 'Aucune donnee a mettre a jour' })
    }
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', request.user.id)
      .select()
      .single()
    if (error) return reply.status(500).send({ error: error.message })
    return reply.send({ profile: data })
  })

  // SUIVRE UN UTILISATEUR
  app.post('/:username/follow', { preHandler: app.authenticate }, async (request, reply) => {
    const { username } = request.params
    const { data: target } = await supabase
      .from('profiles').select('id').eq('username', username).single()
    if (!target) return reply.status(404).send({ error: 'Utilisateur introuvable' })
    if (target.id === request.user.id) {
      return reply.status(400).send({ error: 'Vous ne pouvez pas vous suivre vous-meme' })
    }
    const { error } = await supabase.from('follows').insert({
      follower_id: request.user.id,
      following_id: target.id
    })
    if (error) {
      if (error.code === '23505') return reply.status(409).send({ error: 'Deja suivi' })
      return reply.status(500).send({ error: error.message })
    }
    return reply.send({ message: 'Abonnement effectue' })
  })

  // SE DESABONNER
  app.delete('/:username/follow', { preHandler: app.authenticate }, async (request, reply) => {
    const { username } = request.params
    const { data: target } = await supabase
      .from('profiles').select('id').eq('username', username).single()
    if (!target) return reply.status(404).send({ error: 'Utilisateur introuvable' })
    await supabase.from('follows')
      .delete()
      .eq('follower_id', request.user.id)
      .eq('following_id', target.id)
    return reply.send({ message: 'Desabonnement effectue' })
  })

  // LISTE DES ABONNES
  app.get('/:username/followers', async (request, reply) => {
    const { username } = request.params
    const { data: profile } = await supabase
      .from('profiles').select('id').eq('username', username).single()
    if (!profile) return reply.status(404).send({ error: 'Utilisateur introuvable' })
    const { data } = await supabase
      .from('follows')
      .select('profiles:follower_id(id, username, display_name, avatar_url, is_verified)')
      .eq('following_id', profile.id)
    return reply.send({ followers: data?.map(f => f.profiles) || [] })
  })

  // LISTE DES ABONNEMENTS
  app.get('/:username/following', async (request, reply) => {
    const { username } = request.params
    const { data: profile } = await supabase
      .from('profiles').select('id').eq('username', username).single()
    if (!profile) return reply.status(404).send({ error: 'Utilisateur introuvable' })
    const { data } = await supabase
      .from('follows')
      .select('profiles:following_id(id, username, display_name, avatar_url, is_verified)')
      .eq('follower_id', profile.id)
    return reply.send({ following: data?.map(f => f.profiles) || [] })
  })

  // SONS D UN PROFIL
  app.get('/:username/tracks', async (request, reply) => {
    const { username } = request.params
    const { page = 1, limit = 20 } = request.query
    const { data: profile } = await supabase
      .from('profiles').select('id').eq('username', username).single()
    if (!profile) return reply.status(404).send({ error: 'Utilisateur introuvable' })
    const { data, error } = await supabase
      .from('tracks')
      .select('*')
      .eq('creator_id', profile.id)
      .eq('is_published', true)
      .eq('is_active', true)
      .order('published_at', { ascending: false })
      .range((page-1)*limit, page*limit-1)
    if (error) return reply.status(500).send({ error: error.message })
    return reply.send({ tracks: data })
  })

  // RECHERCHE DE PROFILS
  app.get('/', async (request, reply) => {
    const { search, type, page = 1, limit = 20 } = request.query
    let query = supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, profile_type, country, is_verified, followers_count, tracks_count')
      .eq('is_active', true)
      .order('followers_count', { ascending: false })
      .range((page-1)*limit, page*limit-1)
    if (search) query = query.ilike('display_name', `%${search}%`)
    if (type) query = query.eq('profile_type', type)
    const { data, error } = await query
    if (error) return reply.status(500).send({ error: error.message })
    return reply.send({ profiles: data })
  })

}
