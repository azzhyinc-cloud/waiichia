import { supabase } from '../config.js'

export default async function tracksRoutes(app) {

  app.get('/', async (request, reply) => {
    const { genre, country, type, search, page = 1, limit = 20, creator_id } = request.query
    let query = supabase.from('tracks')
      .select('*, profiles:creator_id(id, username, display_name, avatar_url, is_verified)')
      .eq('is_published', true).eq('is_active', true)
      .order('published_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)
    if (genre)      query = query.eq('genre', genre)
    if (country)    query = query.eq('country', country)
    if (type)       query = query.eq('type', type)
    if (creator_id) query = query.eq('creator_id', creator_id)
    if (search)     query = query.ilike('title', '%' + search + '%')
    const { data, error } = await query
    if (error) return reply.status(500).send({ error: error.message })
    return reply.send({ tracks: data, page: parseInt(page), limit: parseInt(limit) })
  })

  app.get('/trending', async (request, reply) => {
    const { limit = 20, country } = request.query
    let query = supabase.from('tracks')
      .select('*, profiles:creator_id(id, username, display_name, avatar_url, is_verified)')
      .eq('is_published', true).eq('is_active', true)
      .order('play_count', { ascending: false }).limit(parseInt(limit))
    if (country) query = query.eq('country', country)
    const { data, error } = await query
    if (error) return reply.status(500).send({ error: error.message })
    return reply.send({ tracks: data })
  })

  app.get('/my/tracks', { preHandler: app.authenticate }, async (request, reply) => {
    const { data, error } = await supabase.from('tracks')
      .select('*').eq('creator_id', request.user.id).eq('is_active', true)
      .order('created_at', { ascending: false })
    if (error) return reply.status(500).send({ error: error.message })
    return reply.send({ tracks: data })
  })

  app.get('/:id', async (request, reply) => {
    const { data, error } = await supabase.from('tracks')
      .select('*, profiles:creator_id(id, username, display_name, avatar_url, is_verified, country)')
      .eq('id', request.params.id).eq('is_active', true).single()
    return reply.send({ track: data })
  })

  app.post('/:id/play', async (request, reply) => {
    const { id } = request.params
    if (id && id !== 'undefined') {
      await supabase.rpc('increment_play_count', { track_uuid: id }).catch(() => {})
    }
    return reply.send({ ok: true })
  })

  app.post('/', { preHandler: app.authenticate }, async (request, reply) => {
    const body = request.body
    const { data, error } = await supabase.from('tracks').insert({
      creator_id:       request.user.id,
      title:            body.title,
      description:      body.description || null,
      audio_url_128:    body.audio_url_128 || null,
      audio_url_320:    body.audio_url_320 || null,
      cover_url:        body.cover_url || null,
      type:             body.type || body.content_type || 'music',
      genre:            body.genre || null,
      country:          body.country || 'KM',
      language:         body.language || 'fr',
      access_type:      body.access_type || 'free',
      sale_price:       body.sale_price || 0,
      sale_currency:    body.sale_currency || 'KMF',
      rent_price_day:   body.rent_price_day || 0,
      rent_price_week:  body.rent_price_week || 0,
      rent_price_month: body.rent_price_month || 0,
      free_preview_sec: body.preview_end_sec || 30,
      license:          body.license || 'all_rights',
      is_published:     body.is_published === true,
      published_at:     body.is_published === true ? new Date().toISOString() : null,
    }).select().single()
    if (error) return reply.status(500).send({ error: error.message })
    return reply.status(201).send({ track: data })
  })

  app.patch('/:id', { preHandler: app.authenticate }, async (request, reply) => {
    const { id } = request.params
    const { data: existing } = await supabase.from('tracks').select('creator_id').eq('id', id).single()
    if (existing.creator_id !== request.user.id) return reply.status(403).send({ error: 'Non autorise' })
    const allowed = ['title','description','genre','access_type','sale_price','type',
      'rent_price_day','rent_price_week','rent_price_month','free_preview_sec','is_published','cover_url']
    const updates = {}
    allowed.forEach(k => { if (request.body[k] !== undefined) updates[k] = request.body[k] })
    if (updates.is_published) updates.published_at = new Date().toISOString()
    const { data, error } = await supabase.from('tracks').update(updates).eq('id', id).select().single()
    if (error) return reply.status(500).send({ error: error.message })
    return reply.send({ track: data })
  })

  app.delete('/:id', { preHandler: app.authenticate }, async (request, reply) => {
    const { id } = request.params
    const { data: existing } = await supabase.from('tracks').select('creator_id').eq('id', id).single()
    if (existing.creator_id !== request.user.id) return reply.status(403).send({ error: 'Non autorise' })
    await supabase.from('tracks').update({ is_active: false }).eq('id', id)
    return reply.send({ message: 'Son supprime' })
  })

  app.get('/:id/access', { preHandler: app.authenticate }, async (request, reply) => {
    const { id } = request.params
    const uid = request.user.id
    const { data: track } = await supabase.from('tracks').select('access_type, creator_id').eq('id', id).single()
    if (track.access_type === 'free' || track.creator_id === uid)
      return reply.send({ has_access: true, type: 'free' })
    const { data: purchase } = await supabase.from('track_access').select('id').eq('user_id', uid).eq('track_id', id).single()
    if (purchase) return reply.send({ has_access: true, type: 'purchase' })
    const { data: rental } = await supabase.from('rentals')
      .select('id, expires_at').eq('user_id', uid).eq('track_id', id)
      .eq('is_active', true).gt('expires_at', new Date().toISOString()).single()
    if (rental) return reply.send({ has_access: true, type: 'rental', expires_at: rental.expires_at })
    return reply.send({ has_access: false })
  })
}
