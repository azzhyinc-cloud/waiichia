import { supabase } from '../config.js'

export default async function eventsRoutes(app) {

  // LISTE DES EVENEMENTS
  app.get('/', async (request, reply) => {
    const { country, search, page = 1, limit = 20 } = request.query
    let query = supabase.from('events')
      .select('*, profiles:creator_id(id, username, display_name, avatar_url, is_verified)')
      .eq('is_active', true)
      .gte('event_date', new Date().toISOString())
      .order('event_date', { ascending: true })
    if (country) query = query.eq('country', country)
    if (search) query = query.ilike('title', '%'+search+'%')
    query = query.range((page-1)*limit, page*limit-1)
    const { data, error } = await query
    if (error) return reply.status(500).send({ error: error.message })
    return reply.send({ events: data })
  })

  // UN EVENEMENT
  app.get('/:id', async (request, reply) => {
    const { data, error } = await supabase.from('events')
      .select('*, profiles:creator_id(id, username, display_name, avatar_url, is_verified)')
      .eq('id', request.params.id)
      .single()
    if (error || !data) return reply.status(404).send({ error: 'Evenement introuvable' })
    return reply.send({ event: data })
  })

  // CREER UN EVENEMENT
  app.post('/', { preHandler: app.authenticate }, async (request, reply) => {
    const { title, description, cover_url, location, country, event_date, ticket_price, is_free, capacity } = request.body
    if (!title || !event_date) return reply.status(400).send({ error: 'Titre et date requis' })
    const { data, error } = await supabase.from('events').insert({
      creator_id: request.user.id,
      title, description, cover_url, location,
      country: country || 'KM',
      event_date,
      ticket_price: ticket_price || 0,
      is_free: is_free !== false,
      capacity: capacity || null,
    }).select().single()
    if (error) return reply.status(500).send({ error: error.message })
    return reply.status(201).send({ event: data })
  })

  // MODIFIER UN EVENEMENT
  app.patch('/:id', { preHandler: app.authenticate }, async (request, reply) => {
    const { data: existing } = await supabase.from('events').select('creator_id').eq('id', request.params.id).single()
    if (!existing) return reply.status(404).send({ error: 'Introuvable' })
    if (existing.creator_id !== request.user.id) return reply.status(403).send({ error: 'Non autorise' })
    const updates = {}
    const allowed = ['title','description','cover_url','location','country','event_date','ticket_price','is_free','capacity']
    allowed.forEach(k => { if (request.body[k] !== undefined) updates[k] = request.body[k] })
    const { data, error } = await supabase.from('events').update(updates).eq('id', request.params.id).select().single()
    if (error) return reply.status(500).send({ error: error.message })
    return reply.send({ event: data })
  })

  // SUPPRIMER UN EVENEMENT
  app.delete('/:id', { preHandler: app.authenticate }, async (request, reply) => {
    const { data: existing } = await supabase.from('events').select('creator_id').eq('id', request.params.id).single()
    if (!existing) return reply.status(404).send({ error: 'Introuvable' })
    if (existing.creator_id !== request.user.id) return reply.status(403).send({ error: 'Non autorise' })
    await supabase.from('events').update({ is_active: false }).eq('id', request.params.id)
    return reply.send({ message: 'Evenement supprime' })
  })

}
