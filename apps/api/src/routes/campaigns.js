import { supabase } from '../config.js'

export default async function campaignsRoutes(fastify) {

  // GET mes campagnes
  fastify.get('/api/campaigns', { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const { status } = req.query
    let query = supabase.from('campaigns').select('*').eq('user_id', req.user.id).order('created_at', { ascending: false })
    if (status) query = query.eq('status', status)
    const { data, error } = await query
    if (error) return reply.status(500).send({ error: error.message })
    return { campaigns: data }
  })

  // GET stats campagnes
  fastify.get('/api/campaigns/stats', { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const { data, error } = await supabase.from('campaigns').select('*').eq('user_id', req.user.id)
    if (error) return reply.status(500).send({ error: error.message })
    const stats = {
      total: data.length,
      active: data.filter(c => c.status === 'active').length,
      total_impressions: data.reduce((a, c) => a + (c.impressions || 0), 0),
      total_clicks: data.reduce((a, c) => a + (c.clicks || 0), 0),
      total_spent: data.reduce((a, c) => a + (c.spent || 0), 0),
      ctr: data.reduce((a,c)=>a+(c.impressions||0),0) > 0
        ? ((data.reduce((a,c)=>a+(c.clicks||0),0) / data.reduce((a,c)=>a+(c.impressions||0),0)) * 100).toFixed(2)
        : '0.00'
    }
    return { stats }
  })

  // POST creer campagne
  fastify.post('/api/campaigns', { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const { name, format, titre, description, url_destination, objectif, budget, budget_type, devise, pays, genres, placements, age_range, genre_cible, date_debut, date_fin } = req.body
    if (!name || !format || !budget) return reply.status(400).send({ error: 'name, format et budget requis' })
    const { data, error } = await supabase.from('campaigns').insert({
      user_id: req.user.id,
      name, format, titre, description, url_destination,
      status: 'active',
      objectif: objectif || 'notoriete',
      budget: parseInt(budget),
      budget_type: budget_type || 'journalier',
      devise: devise || 'KMF',
      pays: pays || [],
      genres: genres || [],
      placements: placements || [],
      age_range: age_range || 'Tous ages',
      genre_cible: genre_cible || 'Tous',
      date_debut: date_debut || null,
      date_fin: date_fin || null,
    }).select().single()
    if (error) return reply.status(500).send({ error: error.message })
    return { campaign: data }
  })

  // PATCH modifier statut
  fastify.patch('/api/campaigns/:id', { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const updates = {}
    const allowed = ['status','name','budget','date_fin','titre','description']
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k] })
    updates.updated_at = new Date().toISOString()
    const { data, error } = await supabase.from('campaigns').update(updates).eq('id', req.params.id).eq('user_id', req.user.id).select().single()
    if (error) return reply.status(500).send({ error: error.message })
    return { campaign: data }
  })

  // DELETE supprimer
  fastify.delete('/api/campaigns/:id', { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const { error } = await supabase.from('campaigns').delete().eq('id', req.params.id).eq('user_id', req.user.id)
    if (error) return reply.status(500).send({ error: error.message })
    return { success: true }
  })
}
