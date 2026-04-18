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
      creator_id: request.user.id, name, description, stream_url, iframe_url, logo_url, country: country || 'KM', language: language || 'fr', category, genre
    }).select().single()
    if (error) return reply.status(500).send({ error: error.message })
    return reply.status(201).send({ station: data })
  })
}
