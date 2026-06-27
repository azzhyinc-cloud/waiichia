import { supabase } from '../config.js'
import { Notify } from '../utils/notify.js'

export default async function radioRoutes(app) {
  app.get('/', async (request, reply) => {
    const { live_only, limit = 20 } = request.query
    let q = supabase.from('radio_stations').select('*, profiles:creator_id(id, username, display_name)')
      .eq('is_active', true).order('listeners', { ascending: false }).limit(parseInt(limit))
    if (live_only === 'true') q = q.eq('is_live', true)
    const { data, error } = await q
    if (error) return reply.status(500).send({ error: error.message })
    return reply.send({ stations: data || [] })
  })

  // ── GET MINE (v19) ── Mes radios (toutes is_active confondues)
  app.get('/mine', { preHandler: app.authenticate }, async (request, reply) => {
    const { data, error } = await supabase.from('radio_stations')
      .select('*').eq('creator_id', request.user.id).order('created_at', { ascending: false })
    if (error) return reply.status(500).send({ error: error.message })
    return reply.send({ stations: data || [] })
  })

  app.get('/:id', async (request, reply) => {
    const { data, error } = await supabase.from('radio_stations').select('*').eq('id', request.params.id).single()
    return reply.send({ station: data })
  })

  app.post('/:id/tip', { preHandler: app.authenticate }, async (request, reply) => {
    const { amount, message, is_anonymous } = request.body
    const { data: wallet } = await supabase.from('wallets').select('balance').eq('user_id', request.user.id).single()
    await supabase.from('wallets').update({ balance: wallet.balance - amount }).eq('user_id', request.user.id)
    const { data, error } = await supabase.from('tips').insert({
      user_id: is_anonymous ? null : request.user.id, radio_id: request.params.id, amount, message, is_anonymous: is_anonymous || false
    }).select().single()
    if (error) return reply.status(500).send({ error: error.message })

    // ── NOTIFICATION ──
    const { data: station } = await supabase.from('radio_stations').select('creator_id, name').eq('id', request.params.id).single()
    if (station && !is_anonymous) {
      Notify.tip(request.user.id, station.creator_id, request.user.username, amount, 'KMF', station.name)
    }

    return reply.send({ tip: data, message: 'Pourboire envoye !' })
  })

  app.post('/', { preHandler: app.authenticate }, async (request, reply) => {
    const { name, description, stream_url, iframe_url, logo_url, country, language, category, genre } = request.body
    const { data, error } = await supabase.from('radio_stations').insert({
      creator_id: request.user.id, name, description, stream_url, iframe_url, logo_url, country: country || 'KM', language: language || 'fr', category, genre, is_active: false, is_live: false
    }).select().single()
    if (error) return reply.status(500).send({ error: error.message })
    return reply.status(201).send({ station: data })
  })

  // ── PATCH EDIT (v19) ── Auth = createur OU admin
  app.patch('/:id', { preHandler: app.authenticate }, async (request, reply) => {
    const { id } = request.params
    const allowed = ['name', 'description', 'stream_url', 'logo_url', 'country', 'genre', 'language']
    const updates = {}
    for (const k of allowed) if (k in request.body) updates[k] = request.body[k]
    if (!Object.keys(updates).length) return reply.status(400).send({ error: 'Aucun champ a mettre a jour' })

    const { data: station } = await supabase.from('radio_stations').select('creator_id').eq('id', id).single()
    if (!station) return reply.status(404).send({ error: 'Station introuvable' })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', request.user.id).single()
    const isOwner = station.creator_id === request.user.id
    const isAdminUser = profile && ['admin', 'superadmin', 'moderator'].includes(profile.role)
    if (!isOwner && !isAdminUser) return reply.status(403).send({ error: 'Acces refuse' })

    const { data, error } = await supabase.from('radio_stations').update(updates).eq('id', id).select().single() // updated_at retire v19
    if (error) return reply.status(500).send({ error: error.message })
    return reply.send({ station: data })
  })
}
