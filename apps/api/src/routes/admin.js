import { supabase } from '../config.js'

export default async function adminRoutes(app) {

  // Middleware : vérifier que l'utilisateur est admin
  const isAdmin = async (request, reply) => {
    await app.authenticate(request, reply)
    const { data } = await supabase.from('profiles').select('role').eq('id', request.user.id).single()
    if (!data || data.role !== 'admin') {
      return reply.status(403).send({ error: 'Accès admin requis' })
    }
  }

  // ═══════════════════════════════════════
  // DASHBOARD — Stats réelles
  // ═══════════════════════════════════════
  app.get('/stats', { preHandler: isAdmin }, async (req, reply) => {
    const [users, tracks, plays, reports, radios, wallets] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('tracks').select('id', { count: 'exact', head: true }).eq('is_published', true),
      supabase.from('tracks').select('play_count').eq('is_published', true),
      supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'open').catch(() => ({ count: 0 })),
      supabase.from('radio_stations').select('id', { count: 'exact', head: true }).eq('is_active', true).catch(() => ({ count: 0 })),
      supabase.from('wallets').select('balance'),
    ])
    const totalPlays = plays.data?.reduce((a, t) => a + (t.play_count || 0), 0) || 0
    const totalRevenue = wallets.data?.reduce((a, w) => a + (w.balance || 0), 0) || 0
    return reply.send({
      users_count: users.count || 0,
      tracks_count: tracks.count || 0,
      total_plays: totalPlays,
      reports_count: reports.count || 0,
      radios_count: radios.count || 0,
      total_revenue: totalRevenue,
    })
  })

  // ═══════════════════════════════════════
  // UTILISATEURS — Liste + CRUD
  // ═══════════════════════════════════════
  app.get('/users', { preHandler: isAdmin }, async (req, reply) => {
    const { page = 1, limit = 20, role, status, search, country } = req.query
    let query = supabase.from('profiles').select('*')
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)
    if (role) query = query.eq('profile_type', role)
    if (status === 'verified') query = query.eq('is_verified', true)
    if (status === 'suspended') query = query.eq('is_suspended', true)
    if (country) query = query.eq('country', country)
    if (search) query = query.or(`display_name.ilike.%${search}%,email.ilike.%${search}%,username.ilike.%${search}%`)
    const { data, error, count } = await query
    if (error) return reply.status(500).send({ error: error.message })
    return reply.send({ users: data || [], total: count || data?.length || 0 })
  })

  // Suspendre / Activer un utilisateur
  app.patch('/users/:id/status', { preHandler: isAdmin }, async (req, reply) => {
    const { action } = req.body // 'suspend' | 'activate' | 'verify' | 'unverify'
    const updates = { updated_at: new Date().toISOString() }
    if (action === 'suspend') updates.is_suspended = true
    if (action === 'activate') updates.is_suspended = false
    if (action === 'verify') updates.is_verified = true
    if (action === 'unverify') updates.is_verified = false
    const { data, error } = await supabase.from('profiles').update(updates).eq('id', req.params.id).select().single()
    if (error) return reply.status(500).send({ error: error.message })
    return reply.send({ user: data, message: `Utilisateur ${action} avec succès` })
  })

  // Changer le rôle/profil d'un utilisateur
  app.patch('/users/:id/role', { preHandler: isAdmin }, async (req, reply) => {
    const { role, profile_type } = req.body
    const updates = { updated_at: new Date().toISOString() }
    if (role) updates.role = role
    if (profile_type) updates.profile_type = profile_type
    const { data, error } = await supabase.from('profiles').update(updates).eq('id', req.params.id).select().single()
    if (error) return reply.status(500).send({ error: error.message })
    return reply.send({ user: data })
  })

  // Supprimer un utilisateur
  app.delete('/users/:id', { preHandler: isAdmin }, async (req, reply) => {
    const { error } = await supabase.from('profiles').update({ is_active: false, is_suspended: true }).eq('id', req.params.id)
    if (error) return reply.status(500).send({ error: error.message })
    return reply.send({ message: 'Utilisateur supprimé' })
  })

  // ═══════════════════════════════════════
  // CONTENU — Liste + Modération
  // ═══════════════════════════════════════
  app.get('/content', { preHandler: isAdmin }, async (req, reply) => {
    const { page = 1, limit = 20, type, status, search } = req.query
    let query = supabase.from('tracks')
      .select('*, profiles:creator_id(display_name, username)')
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)
    if (type) query = query.eq('type', type)
    if (status === 'published') query = query.eq('is_published', true).eq('is_active', true)
    if (status === 'suspended') query = query.eq('is_active', false)
    if (search) query = query.ilike('title', `%${search}%`)
    const { data, error } = await query
    if (error) return reply.status(500).send({ error: error.message })
    return reply.send({ content: data || [] })
  })

  // Suspendre / Activer / Supprimer un contenu
  app.patch('/content/:id/status', { preHandler: isAdmin }, async (req, reply) => {
    const { action } = req.body // 'suspend' | 'activate' | 'delete'
    const updates = { updated_at: new Date().toISOString() }
    if (action === 'suspend') { updates.is_active = false; updates.is_published = false }
    if (action === 'activate') { updates.is_active = true; updates.is_published = true }
    if (action === 'delete') { updates.is_active = false; updates.is_published = false; updates.is_deleted = true }
    const { data, error } = await supabase.from('tracks').update(updates).eq('id', req.params.id).select().single()
    if (error) return reply.status(500).send({ error: error.message })
    return reply.send({ track: data, message: `Contenu ${action} avec succès` })
  })

  // ═══════════════════════════════════════
  // VÉRIFICATIONS — Demandes en attente
  // ═══════════════════════════════════════
  app.get('/verifications', { preHandler: isAdmin }, async (req, reply) => {
    const { data } = await supabase.from('profiles')
      .select('*')
      .eq('verification_requested', true)
      .eq('is_verified', false)
      .order('created_at', { ascending: false })
    return reply.send({ verifications: data || [] })
  })

  app.patch('/verifications/:id', { preHandler: isAdmin }, async (req, reply) => {
    const { action } = req.body // 'approve' | 'reject'
    const updates = { updated_at: new Date().toISOString(), verification_requested: false }
    if (action === 'approve') updates.is_verified = true
    const { data, error } = await supabase.from('profiles').update(updates).eq('id', req.params.id).select().single()
    if (error) return reply.status(500).send({ error: error.message })
    return reply.send({ user: data, message: action === 'approve' ? 'Compte vérifié ✅' : 'Demande rejetée' })
  })

  // ═══════════════════════════════════════
  // DÉPÔTS / RECHARGES — Validation
  // ═══════════════════════════════════════
  app.get('/deposits', { preHandler: isAdmin }, async (req, reply) => {
    const { status = 'pending' } = req.query
    const { data } = await supabase.from('transactions')
      .select('*, profiles:user_id(display_name, username)')
      .eq('type', 'recharge')
      .eq('status', status)
      .order('created_at', { ascending: false })
      .catch(() => ({ data: [] }))
    return reply.send({ deposits: data || [] })
  })

  app.patch('/deposits/:id', { preHandler: isAdmin }, async (req, reply) => {
    const { action } = req.body // 'approve' | 'reject'
    // Récupérer la transaction
    const { data: tx } = await supabase.from('transactions').select('*').eq('id', req.params.id).single()
    if (!tx) return reply.status(404).send({ error: 'Transaction non trouvée' })

    if (action === 'approve') {
      // Créditer le wallet de l'utilisateur
      const { data: wallet } = await supabase.from('wallets').select('balance').eq('user_id', tx.user_id).single()
      const newBalance = (wallet?.balance || 0) + tx.amount
      await supabase.from('wallets').upsert({ user_id: tx.user_id, balance: newBalance, currency: tx.currency || 'KMF' })
      await supabase.from('transactions').update({ status: 'completed', validated_at: new Date().toISOString() }).eq('id', req.params.id)
      return reply.send({ message: `Dépôt de ${tx.amount} KMF validé — solde crédité`, new_balance: newBalance })
    } else {
      await supabase.from('transactions').update({ status: 'rejected' }).eq('id', req.params.id)
      return reply.send({ message: 'Dépôt rejeté' })
    }
  })

  // ═══════════════════════════════════════
  // CONFIG PAIEMENT — Activer/Désactiver méthodes
  // ═══════════════════════════════════════
  app.get('/payment-config', { preHandler: isAdmin }, async (req, reply) => {
    const { data } = await supabase.from('settings').select('*').eq('key', 'payment_methods').single().catch(() => ({ data: null }))
    const defaults = {
      mvola: { enabled: true, mobileOnly: true, merchant: '4102122' },
      cash: { enabled: true, commission_pct: 5 },
      bank: { enabled: true },
      card: { enabled: false, sandbox: true },
      paypal: { enabled: false },
      wave: { enabled: false },
      orange: { enabled: false },
    }
    return reply.send({ config: data?.value ? JSON.parse(data.value) : defaults })
  })

  app.put('/payment-config', { preHandler: isAdmin }, async (req, reply) => {
    const { config } = req.body
    await supabase.from('settings').upsert({ key: 'payment_methods', value: JSON.stringify(config), updated_at: new Date().toISOString() })
    return reply.send({ message: 'Configuration sauvegardée', config })
  })

  // ═══════════════════════════════════════
  // PROFILS — Inscription par défaut = listener
  // ═══════════════════════════════════════
  // Note: Ceci est géré dans auth.js lors de l'inscription.
  // Le profil par défaut est 'listener' (utilisateur normal).
  // L'utilisateur peut demander un changement via Settings.
  // L'admin valide la demande ici.

  app.get('/profile-requests', { preHandler: isAdmin }, async (req, reply) => {
    const { data } = await supabase.from('profiles')
      .select('*')
      .eq('profile_change_requested', true)
      .order('created_at', { ascending: false })
      .catch(() => ({ data: [] }))
    return reply.send({ requests: data || [] })
  })

  app.patch('/profile-requests/:id', { preHandler: isAdmin }, async (req, reply) => {
    const { action, new_profile_type } = req.body
    const updates = { profile_change_requested: false, updated_at: new Date().toISOString() }
    if (action === 'approve' && new_profile_type) updates.profile_type = new_profile_type
    const { data, error } = await supabase.from('profiles').update(updates).eq('id', req.params.id).select().single()
    if (error) return reply.status(500).send({ error: error.message })
    return reply.send({ user: data, message: action === 'approve' ? 'Profil mis à jour' : 'Demande rejetée' })
  })
}
