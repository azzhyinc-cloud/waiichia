import { supabase } from '../config.js'

export default async function adminRoutes(app) {
  const isAdmin = async (request, reply) => {
    await app.authenticate(request, reply)
    const { data } = await supabase.from('profiles').select('role').eq('id', request.user.id).single()
    if (!data || (data.role !== 'admin' && data.role !== 'superadmin' && data.role !== 'moderator')) return reply.status(403).send({ error: 'Acces admin requis' })
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

  // ─── SUSPEND / ACTIVATE / VERIFY ─── FIX: is_active au lieu de is_suspended
  app.patch('/users/:id/status', { preHandler: isAdmin }, async (req, reply) => {
    const { action } = req.body
    const updates = { updated_at: new Date().toISOString() }
    if (action === 'suspend') updates.is_active = false
    if (action === 'activate') updates.is_active = true
    if (action === 'verify') updates.is_verified = true
    if (action === 'unverify') updates.is_verified = false
    const { data, error } = await supabase.from('profiles').update(updates).eq('id', req.params.id).select().single()
    if (error) return reply.status(500).send({ error: error.message })

    // Si suspension, masquer aussi tout le contenu de l'utilisateur
    if (action === 'suspend') {
      await supabase.from('tracks').update({ is_active: false, is_published: false }).eq('creator_id', req.params.id)
      await supabase.from('products').update({ is_active: false }).or(`user_id.eq.${req.params.id},creator_id.eq.${req.params.id}`)
      await supabase.from('events').update({ is_active: false }).eq('creator_id', req.params.id)
    }

    // Si réactivation, réactiver le contenu
    if (action === 'activate') {
      await supabase.from('tracks').update({ is_active: true, is_published: true }).eq('creator_id', req.params.id)
      await supabase.from('products').update({ is_active: true }).or(`user_id.eq.${req.params.id},creator_id.eq.${req.params.id}`)
      await supabase.from('events').update({ is_active: true }).eq('creator_id', req.params.id)
    }

    // Log admin action
    try {
      await supabase.from('admin_logs').insert({
        admin_id: req.user.id,
        action: 'user_' + action,
        details: { target_user_id: req.params.id }
      })
    } catch (e) {}

    return reply.send({ user: data, message: 'Utilisateur ' + action + ' avec succes' })
  })

  // ─── DELETE USER ─── Suppression complète d'un utilisateur
  app.delete('/users/:id', { preHandler: isAdmin }, async (req, reply) => {
    const targetId = req.params.id

    // Vérifier que ce n'est pas un superadmin
    const { data: target } = await supabase.from('profiles').select('role').eq('id', targetId).single()
    if (!target) return reply.status(404).send({ error: 'Utilisateur introuvable' })
    if (target.role === 'superadmin') return reply.status(403).send({ error: 'Impossible de supprimer un superadmin' })

    // Désactiver le profil et masquer tout le contenu
    await supabase.from('profiles').update({ is_active: false }).eq('id', targetId)
    await supabase.from('tracks').update({ is_active: false, is_published: false }).eq('creator_id', targetId)
    await supabase.from('products').update({ is_active: false }).or(`user_id.eq.${targetId},creator_id.eq.${targetId}`)
    await supabase.from('events').update({ is_active: false }).eq('creator_id', targetId)

    // Désactiver dans Supabase Auth
    try {
      await supabase.auth.admin.updateUserById(targetId, { ban_duration: '876000h' })
    } catch (e) {
      app.log.warn('Auth ban error:', e.message)
    }

    // Log
    try {
      await supabase.from('admin_logs').insert({
        admin_id: req.user.id,
        action: 'user_delete',
        details: { target_user_id: targetId }
      })
    } catch (e) {}

    return reply.send({ message: 'Utilisateur supprimé et contenu masqué' })
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

  // ═══ PAYMENT CONFIG ═══
  app.get('/payment-config', { preHandler: isAdmin }, async (req, reply) => {
    const defaults = {
      mvola: { enabled: true, name: 'Mvola', type: 'mobile', phone: '' },
      cash: { enabled: true, name: 'Especes', type: 'cash' },
      bank: { enabled: false, name: 'Virement bancaire', type: 'bank', iban: '', swift: '', bank_name: '' },
      card: { enabled: false, name: 'Carte bancaire', type: 'card', stripe_key: '' },
      paypal: { enabled: false, name: 'PayPal', type: 'international', client_id: '', client_secret: '' },
      wave: { enabled: false, name: 'Wave', type: 'mobile', api_key: '' },
      orange_money: { enabled: false, name: 'Orange Money', type: 'mobile', phone: '' },
      mpesa: { enabled: false, name: 'M-Pesa', type: 'mobile', phone: '' },
    }
    try {
      const { data } = await supabase
        .from('platform_settings').select('value').eq('key', 'payment_methods').single()
      if (data?.value && typeof data.value === 'object') {
        const merged = {}
        for (const [k, def] of Object.entries(defaults)) {
          merged[k] = { ...def, ...(data.value[k] || {}) }
        }
        return reply.send({ config: merged })
      }
      return reply.send({ config: defaults })
    } catch (e) {
      return reply.send({ config: defaults })
    }
  })

  app.put('/payment-config', { preHandler: isAdmin }, async (req, reply) => {
    const config = req.body.config
    if (!config) return reply.status(400).send({ error: 'config requise' })

    console.log('[PAY-CONFIG] Saving:', JSON.stringify(config).slice(0, 300))
    const { data: updated, error } = await supabase
      .from('platform_settings')
      .update({
        value: config,
        description: 'Configuration des modes de paiement',
        updated_at: new Date().toISOString(),
      })
      .eq('key', 'payment_methods')
      .select()
      .maybeSingle()

    if (error) {
      console.log('[PAY-CONFIG] Update error:', error.message)
      return reply.status(500).send({ error: error.message })
    }
    if (!updated) {
      console.log('[PAY-CONFIG] No row, inserting')
      const { error: err2 } = await supabase.from('platform_settings').insert({
        key: 'payment_methods', value: config,
        description: 'Configuration des modes de paiement',
        updated_at: new Date().toISOString(),
      })
      if (err2) return reply.status(500).send({ error: err2.message })
    }

    console.log('[PAY-CONFIG] Save OK')
    return reply.send({ message: 'Configuration sauvegardee', config })
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
