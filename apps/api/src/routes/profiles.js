import { supabase } from '../config.js'
import { Notify } from '../utils/notify.js'

export default async function profilesRoutes(app) {

  app.get('/stats', async (request, reply) => {
    const [tracks, profiles, plays, countries] = await Promise.all([
      supabase.from('tracks').select('id', { count: 'exact', head: true }).eq('is_published', true).eq('is_active', true),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('tracks').select('play_count').eq('is_published', true),
      supabase.from('profiles').select('country').neq('country', null),
    ])
    const totalPlays = plays.data?.reduce((a, t) => a + (t.play_count || 0), 0) || 0
    const uniqueCountries = new Set(countries.data?.map(p => p.country)).size
    return reply.send({
      tracks_count: tracks.count || 0,
      creators_count: profiles.count || 0,
      total_plays: totalPlays,
      countries_count: uniqueCountries,
    })
  })

  app.get('/me/profile', { preHandler: app.authenticate }, async (request, reply) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', request.user.id).single()
    return reply.send({ profile: data })
  })

  // Liste des IDs que l'utilisateur suit (pour vérifier en batch)
  app.get('/me/following-ids', { preHandler: app.authenticate }, async (request, reply) => {
    const { data } = await supabase.from('follows')
      .select('following_id')
      .eq('follower_id', request.user.id)
    return reply.send({ ids: (data || []).map(f => f.following_id) })
  })

  app.patch('/me', { preHandler: app.authenticate }, async (request, reply) => {
    const allowed = ['display_name','bio','avatar_url','cover_url','website','phone','country','currency','language','profile_type','role']
    const updates = {}
    allowed.forEach(k => { if (request.body[k] !== undefined) updates[k] = request.body[k] })
    updates.updated_at = new Date().toISOString()
    const { data, error } = await supabase.from('profiles').update(updates).eq('id', request.user.id).select().single()
    if (error) return reply.status(500).send({ error: error.message })
    return reply.send({ profile: data })
  })

  app.get('/:username/tracks', async (request, reply) => {
    const { data: profile } = await supabase.from('profiles').select('id').eq('username', request.params.username).single()
    if (!profile) return reply.send({ tracks: [] })
    const { data } = await supabase.from('tracks')
      .select('*').eq('creator_id', profile.id).eq('is_published', true).eq('is_active', true)
      .order('created_at', { ascending: false })
    return reply.send({ tracks: data || [] })
  })

  // Verifier si l'utilisateur courant suit un profil
  app.get('/:username/is-following', { preHandler: app.authenticate }, async (request, reply) => {
    const { data: target } = await supabase.from('profiles').select('id').eq('username', request.params.username).single()
    if (!target) return reply.send({ following: false })
    const { data } = await supabase.from('follows')
      .select('id')
      .eq('follower_id', request.user.id)
      .eq('following_id', target.id)
      .maybeSingle()
    return reply.send({ following: !!data })
  })

  app.post('/:username/follow', { preHandler: app.authenticate }, async (request, reply) => {
    const { data: target } = await supabase.from('profiles').select('id').eq('username', request.params.username).single()
    if (!target) return reply.status(404).send({ error: 'Profil introuvable' })
    if (target.id === request.user.id) return reply.status(400).send({ error: 'Impossible de se suivre soi-meme' })
    await supabase.from('follows').upsert({ follower_id: request.user.id, following_id: target.id })
    const { count } = await supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', target.id)
    await supabase.from('profiles').update({ followers_count: count || 0, fans_count: count || 0 }).eq('id', target.id)
    Notify.follow(request.user.id, target.id, request.user.username)
    return reply.send({ following: true })
  })

  app.delete('/:username/follow', { preHandler: app.authenticate }, async (request, reply) => {
    const { data: target } = await supabase.from('profiles').select('id').eq('username', request.params.username).single()
    if (!target) return reply.status(404).send({ error: 'Profil introuvable' })
    await supabase.from('follows').delete().eq('follower_id', request.user.id).eq('following_id', target.id)
    const { count } = await supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', target.id)
    await supabase.from('profiles').update({ followers_count: count || 0, fans_count: count || 0 }).eq('id', target.id)
    return reply.send({ following: false })
  })

  app.get('/', async (request, reply) => {
    const { limit = 50, type, search } = request.query
    let query = supabase.from('profiles').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(parseInt(limit))
    if (type) query = query.eq('profile_type', type)
    if (search) query = query.or('display_name.ilike.%' + search + '%,username.ilike.%' + search + '%')
    const { data } = await query
    return reply.send({ profiles: data || [] })
  })

  app.get('/:username', async (request, reply) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('username', request.params.username.toLowerCase()).single()
    if (!data) return reply.send({ profile: null })
    if (data.is_active === false) return reply.status(403).send({ error: "Utilisateur suspendu ou introuvable" })

    // ── Stats calculées à la volée (albums_count + total_earned) ──
    try {
      const [albumsRes, earnedRes] = await Promise.all([
        supabase.from('albums')
          .select('id', { count: 'exact', head: true })
          .eq('creator_id', data.id)
          .eq('is_active', true),
        supabase.from('transactions')
          .select('net_amount, currency')
          .eq('recipient_id', data.id)
          .eq('status', 'completed'),
      ])
      data.albums_count = albumsRes.count || 0
      // Somme net_amount en KMF uniquement (pour l'affichage "X KMF gagnés")
      const earned = (earnedRes.data || [])
        .filter(t => (t.currency || 'KMF') === 'KMF')
        .reduce((sum, t) => sum + (t.net_amount || 0), 0)
      data.total_earned = earned
    } catch (e) {
      app.log?.error?.('profile stats error: ' + e.message)
      data.albums_count = data.albums_count ?? 0
      data.total_earned = 0
    }

    return reply.send({ profile: data })
  })
}
