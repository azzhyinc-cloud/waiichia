import { supabase } from '../config.js'
export default async function emissionsRoutes(app) {
  app.get('/', async (request, reply) => {
    const { category, limit = 20 } = request.query
    let q = supabase.from('emissions').select('*, profiles:user_id(id, username, display_name, avatar_url)')
      .eq('status', 'published').order('created_at', { ascending: false }).limit(parseInt(limit))
    if (category) q = q.eq('category', category)
    const { data, error } = await q
    if (error) return reply.status(500).send({ error: error.message })
    return reply.send({ emissions: data || [] })
  })
  app.get('/:id', async (request, reply) => {
    const { data, error } = await supabase.from('emissions')
      .select('*, profiles:user_id(id, username, display_name, avatar_url)').eq('id', request.params.id).single()
    return reply.send({ emission: data })
  })
  app.get('/:id/episodes', async (request, reply) => {
    const { data, error } = await supabase.from('episodes')
      .select('*').eq('emission_id', request.params.id).eq('status', 'published').order('number', { ascending: false })
    if (error) return reply.status(500).send({ error: error.message })
    return reply.send({ episodes: data || [] })
  })
  app.post('/', { preHandler: app.authenticate }, async (request, reply) => {
    const { title, channel, host, category, format, language, country, cover_url, description, duration_avg } = request.body
    const { data, error } = await supabase.from('emissions').insert({
      user_id: request.user.id, title, channel, host, category,
      format: format || 'audio', language: language || 'fr', country, cover_url, description, duration_avg, status: 'published'
    }).select().single()
    if (error) return reply.status(500).send({ error: error.message })
    return reply.status(201).send({ emission: data })
  })
}
