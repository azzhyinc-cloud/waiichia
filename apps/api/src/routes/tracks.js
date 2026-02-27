import { supabase } from '../config.js'

export default async function tracksRoutes(app) {

  // LISTE DES SONS (avec filtres)
  app.get('/', async (request, reply) => {
    const { genre, country, type, search, page = 1, limit = 20, creator_id } = request.query
    let query = supabase.from('tracks')
      .select(`*, profiles:creator_id(id, username, display_name, avatar_url, is_verified)`)
      .eq('is_published', true)
      .eq('is_active', true)
      .order('published_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)
    if (genre) query = query.eq('genre', genre)
    if (country) query = query.eq('country', country)
    if (type) query = query.eq('content_type', type)
    if (creator_id) query = query.eq('creator_id', creator_id)
    if (search) query = query.ilike('title', `%${search}%`)
    const { data, error } = await query
    if (error) return reply.status(500).send({ error: error.message })
    return reply.send({ tracks: data, page: parseInt(page), limit: parseInt(limit) })
  })

  // TENDANCES (plus ecoutés)
  app.get('/trending', async (request, reply) => {
    const { limit = 20, country } = request.query
    let query = supabase.from('tracks')
      .select(`*, profiles:creator_id(id, username, display_name, avatar_url, is_verified)`)
      .eq('is_published', true)
      .eq('is_active', true)
      .order('play_count', { ascending: false })
      .limit(parseInt(limit))
    if (country) query = query.eq('country', country)
    const { data, error } = await query
    if (error) return reply.status(500).send({ error: error.message })
    return reply.send({ tracks: data })
  })

  // DETAIL D UN SON
  app.get('/:id', async (request, reply) => {
    const { id } = request.params
    const { data, error } = await supabase.from('tracks')
      .select(`*, profiles:creator_id(id, username, display_name, avatar_url, is_verified, country)`)
      .eq('id', id)
      .eq('is_active', true)
      .single()
    if (error || !data) return reply.status(404).send({ error: 'Son introuvable' })
    if (!data.is_published) {
      const token = request.headers.authorization?.split(' ')[1]
      if (!token) return reply.status(403).send({ error: 'Non autorise' })
      try {
        const user = app.jwt.verify(token)
        if (user.id !== data.creator_id) return reply.status(403).send({ error: 'Non autorise' })
      } catch { return reply.status(403).send({ error: 'Non autorise' }) }
    }
    return reply.send({ track: data })
  })

  // INCREMENTER PLAY COUNT
  app.post('/:id/play', async (request, reply) => {
    const { id } = request.params
    await supabase.rpc('increment_play_count', { track_uuid: id })
    return reply.send({ ok: true })
  })

  // CREER UN SON (authentifie)
  app.post('/', { preHandler: app.authenticate }, async (request, reply) => {
    const {
      title, description, content_type, genre, tags, country, language,
      access_type, sale_price, sale_currency, rent_price_day, rent_price_week,
      rent_price_month, rent_price_year, rent_currency,
      preview_start_sec, preview_end_sec, featuring_ids, license
    } = request.body
    if (!title) return reply.status(400).send({ error: 'Titre obligatoire' })
    const { data, error } = await supabase.from('tracks').insert({
      creator_id: request.user.id,
      title, description,
      content_type: content_type || 'music',
      genre, tags, country, language,
      access_type: access_type || 'free',
      sale_price: sale_price || 0,
      sale_currency: sale_currency || 'KMF',
      rent_price_day: rent_price_day || 0,
      rent_price_week: rent_price_week || 0,
      rent_price_month: rent_price_month || 0,
      rent_price_year: rent_price_year || 0,
      rent_currency: rent_currency || 'KMF',
      preview_start_sec: preview_start_sec || 0,
      preview_end_sec: preview_end_sec || 10,
      featuring_ids: featuring_ids || [],
      license: license || 'all_rights',
      is_published: false
    }).select().single()
    if (error) return reply.status(500).send({ error: error.message })
    return reply.status(201).send({ track: data })
  })

  // MODIFIER UN SON
  app.patch('/:id', { preHandler: app.authenticate }, async (request, reply) => {
    const { id } = request.params
    const { data: existing } = await supabase.from('tracks')
      .select('creator_id').eq('id', id).single()
    if (!existing) return reply.status(404).send({ error: 'Son introuvable' })
    if (existing.creator_id !== request.user.id) return reply.status(403).send({ error: 'Non autorise' })
    const allowed = ['title','description','genre','tags','access_type','sale_price',
      'rent_price_day','rent_price_week','rent_price_month','rent_price_year',
      'preview_start_sec','preview_end_sec','is_published','cover_url']
    const updates = {}
    allowed.forEach(k => { if (request.body[k] !== undefined) updates[k] = request.body[k] })
    if (updates.is_published && !existing.published_at) updates.published_at = new Date().toISOString()
    const { data, error } = await supabase.from('tracks')
      .update(updates).eq('id', id).select().single()
    if (error) return reply.status(500).send({ error: error.message })
    return reply.send({ track: data })
  })

  // SUPPRIMER UN SON
  app.delete('/:id', { preHandler: app.authenticate }, async (request, reply) => {
    const { id } = request.params
    const { data: existing } = await supabase.from('tracks')
      .select('creator_id').eq('id', id).single()
    if (!existing) return reply.status(404).send({ error: 'Son introuvable' })
    if (existing.creator_id !== request.user.id) return reply.status(403).send({ error: 'Non autorise' })
    await supabase.from('tracks').update({ is_active: false }).eq('id', id)
    return reply.send({ message: 'Son supprime' })
  })

  // SONS DU CREATEUR CONNECTE
  app.get('/my/tracks', { preHandler: app.authenticate }, async (request, reply) => {
    const { data, error } = await supabase.from('tracks')
      .select('*')
      .eq('creator_id', request.user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    if (error) return reply.status(500).send({ error: error.message })
    return reply.send({ tracks: data })
  })

  // VERIFIER ACCES (achat ou location)
  app.get('/:id/access', { preHandler: app.authenticate }, async (request, reply) => {
    const { id } = request.params
    const uid = request.user.id
    const { data: track } = await supabase.from('tracks')
      .select('access_type, creator_id').eq('id', id).single()
    if (!track) return reply.status(404).send({ error: 'Son introuvable' })
    if (track.access_type === 'free' || track.creator_id === uid) {
      return reply.send({ has_access: true, type: 'free' })
    }
    const { data: purchase } = await supabase.from('track_access')
      .select('id').eq('user_id', uid).eq('track_id', id).single()
    if (purchase) return reply.send({ has_access: true, type: 'purchase' })
    const { data: rental } = await supabase.from('rentals')
      .select('id, expires_at').eq('user_id', uid).eq('track_id', id)
      .eq('is_active', true).gt('expires_at', new Date().toISOString()).single()
    if (rental) return reply.send({ has_access: true, type: 'rental', expires_at: rental.expires_at })
    return reply.send({ has_access: false })
  })

}
