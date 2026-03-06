import { supabase } from '../config.js'

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
    const { data } = await supabase.from('tracks')
      .select('*').eq('creator_id', profile.id).eq('is_published', true).eq('is_active', true)
      .order('created_at', { ascending: false })
    return reply.send({ tracks: data || [] })
  })

  app.post('/:username/follow', { preHandler: app.authenticate }, async (request, reply) => {
    const { data: target } = await supabase.from('profiles').select('id').eq('username', request.params.username).single()
    await supabase.from('follows').upsert({ follower_id: request.user.id, following_id: target.id })
    return reply.send({ following: true })
  })

  app.delete('/:username/follow', { preHandler: app.authenticate }, async (request, reply) => {
    const { data: target } = await supabase.from('profiles').select('id').eq('username', request.params.username).single()
    await supabase.from('follows').delete().eq('follower_id', request.user.id).eq('following_id', target.id)
    return reply.send({ following: false })
  })

  app.get('/', async (request, reply) => {
    const { limit = 50, type } = request.query
    let query = supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(parseInt(limit))
    if (type) query = query.eq('profile_type', type)
    const { data } = await query
    return reply.send({ profiles: data || [] })
  })

  app.get('/:username', async (request, reply) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('username', request.params.username.toLowerCase()).single()
    return reply.send({ profile: data })
  })
}
