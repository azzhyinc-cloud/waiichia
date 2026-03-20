import { supabase } from '../config.js'

export default async function adminRoutes(app) {
  const isAdmin = async (request, reply) => {
    await app.authenticate(request, reply)
    const { data } = await supabase.from('profiles').select('role').eq('id', request.user.id).single()
    if (!data || (data.role !== 'admin' && data.role !== 'superadmin')) return reply.status(403).send({ error: 'Acces admin requis' })
  }

  app.get('/stats', { preHandler: isAdmin }, async (req, reply) => {
    const profiles = await supabase.from('profiles').select('id')
    const tracks = await supabase.from('tracks').select('id').eq('is_published', true)
    const plays = await supabase.from('tracks').select('play_count').eq('is_published', true)
    const countries = await supabase.from('profiles').select('country')
    const totalPlays = plays.data?.reduce((a, t) => a + (t.play_count || 0), 0) || 0
    const uniqueCountries = new Set(countries.data?.map(p => p.country).filter(Boolean)).size
    return reply.send({ users_count: profiles.data?.length || 0, tracks_count: tracks.data?.length || 0, total_plays: totalPlays, countries_count: uniqueCountries })
  })

  app.get('/users', { preHandler: isAdmin }, async (req, reply) => {
    const { search } = req.query
    let query = supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(50)
    if (search) query = query.or('display_name.ilike.%'+search+'%,username.ilike.%'+search+'%')
    const { data } = await query
    return reply.send({ users: data || [] })
  })

  app.patch('/users/:id/status', { preHandler: isAdmin }, async (req, reply) => {
    const { action } = req.body
    const updates = { updated_at: new Date().toISOString() }
    if (action === 'suspend') updates.is_suspended = true
    if (action === 'activate') updates.is_suspended = false
    if (action === 'verify') updates.is_verified = true
    if (action === 'unverify') updates.is_verified = false
    const { data, error } = await supabase.from('profiles').update(updates).eq('id', req.params.id).select().single()
    if (error) return reply.status(500).send({ error: error.message })
    return reply.send({ user: data, message: 'Utilisateur ' + action + ' avec succes' })
  })

  app.patch('/users/:id/role', { preHandler: isAdmin }, async (req, reply) => {
    const { profile_type } = req.body
    const { data, error } = await supabase.from('profiles').update({ profile_type, updated_at: new Date().toISOString() }).eq('id', req.params.id).select().single()
    if (error) return reply.status(500).send({ error: error.message })
    return reply.send({ user: data })
  })

  app.get('/content', { preHandler: isAdmin }, async (req, reply) => {
    const { data } = await supabase.from('tracks').select('*, profiles:creator_id(display_name, username)').order('created_at', { ascending: false }).limit(50)
    return reply.send({ content: data || [] })
  })

  app.patch('/content/:id/status', { preHandler: isAdmin }, async (req, reply) => {
    const { action } = req.body
    const updates = { updated_at: new Date().toISOString() }
    if (action === 'suspend') { updates.is_active = false; updates.is_published = false }
    if (action === 'activate') { updates.is_active = true; updates.is_published = true }
    if (action === 'delete') { updates.is_active = false; updates.is_published = false }
    const { data, error } = await supabase.from('tracks').update(updates).eq('id', req.params.id).select().single()
    if (error) return reply.status(500).send({ error: error.message })
    return reply.send({ track: data, message: 'Contenu ' + action })
  })

  app.get('/verifications', { preHandler: isAdmin }, async (req, reply) => {
    const { data } = await supabase.from('profiles').select('*').eq('verification_requested', true).eq('is_verified', false)
    return reply.send({ verifications: data || [] })
  })

  app.patch('/verifications/:id', { preHandler: isAdmin }, async (req, reply) => {
    const { action } = req.body
    const updates = { verification_requested: false, updated_at: new Date().toISOString() }
    if (action === 'approve') updates.is_verified = true
    const { data, error } = await supabase.from('profiles').update(updates).eq('id', req.params.id).select().single()
    if (error) return reply.status(500).send({ error: error.message })
    return reply.send({ user: data, message: action === 'approve' ? 'Verifie' : 'Rejete' })
  })

  app.get('/deposits', { preHandler: isAdmin }, async (req, reply) => {
    const { data } = await supabase.from('transactions').select('*, profiles:user_id(display_name, username)').eq('type', 'recharge').eq('status', 'pending').order('created_at', { ascending: false })
    return reply.send({ deposits: data || [] })
  })

  app.patch('/deposits/:id', { preHandler: isAdmin }, async (req, reply) => {
    const { action } = req.body
    const { data: tx } = await supabase.from('transactions').select('*').eq('id', req.params.id).single()
    if (!tx) return reply.status(404).send({ error: 'Transaction non trouvee' })
    if (action === 'approve') {
      const { data: wallet } = await supabase.from('wallets').select('balance').eq('user_id', tx.user_id).single()
      const newBal = (wallet?.balance || 0) + tx.amount
      await supabase.from('wallets').upsert({ user_id: tx.user_id, balance: newBal, currency: tx.currency || 'KMF' })
      await supabase.from('transactions').update({ status: 'completed', validated_at: new Date().toISOString() }).eq('id', req.params.id)
      return reply.send({ message: 'Depot valide - solde credite', new_balance: newBal })
    } else {
      await supabase.from('transactions').update({ status: 'rejected' }).eq('id', req.params.id)
      return reply.send({ message: 'Depot rejete' })
    }
  })

  app.get('/payment-config', { preHandler: isAdmin }, async (req, reply) => {
    const defaults = { mvola:{enabled:true}, cash:{enabled:true}, bank:{enabled:true}, card:{enabled:false}, paypal:{enabled:false}, wave:{enabled:false}, orange:{enabled:false} }
    try {
      const { data } = await supabase.from('settings').select('*').eq('key', 'payment_methods').single()
      return reply.send({ config: data?.value ? JSON.parse(data.value) : defaults })
    } catch(e) {
      return reply.send({ config: defaults })
    }
  })

  app.put('/payment-config', { preHandler: isAdmin }, async (req, reply) => {
    await supabase.from('settings').upsert({ key: 'payment_methods', value: JSON.stringify(req.body.config), updated_at: new Date().toISOString() })
    return reply.send({ message: 'Configuration sauvegardee' })
  })

  app.get('/profile-requests', { preHandler: isAdmin }, async (req, reply) => {
    const { data } = await supabase.from('profiles').select('*').eq('profile_change_requested', true)
    return reply.send({ requests: data || [] })
  })

  app.patch('/profile-requests/:id', { preHandler: isAdmin }, async (req, reply) => {
    const { action, new_profile_type } = req.body
    const updates = { profile_change_requested: false, updated_at: new Date().toISOString() }
    if (action === 'approve' && new_profile_type) updates.profile_type = new_profile_type
    const { data, error } = await supabase.from('profiles').update(updates).eq('id', req.params.id).select().single()
    if (error) return reply.status(500).send({ error: error.message })
    return reply.send({ user: data })
  })
}
