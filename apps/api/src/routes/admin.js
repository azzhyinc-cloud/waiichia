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
    const { data, error } = await supabase.from('tracks')
      .select('*, profiles:creator_id(display_name, username)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) { app.log.error({ err: error }, '[CONTENT] list failed'); return reply.status(500).send({ error: error.message }) }
    return reply.send({ content: data || [] })
  })

  app.patch('/content/:id/status', { preHandler: isAdmin }, async (req, reply) => {
    const { action, type = 'tracks' } = req.body
    const ALLOWED = ['tracks','albums','playlists','events','products']
    if (!ALLOWED.includes(type)) return reply.status(400).send({ error: 'Type invalide' })
    const updates = { updated_at: new Date().toISOString() }
    if (action === 'suspend') { updates.is_active = false; if (type === 'tracks') updates.is_published = false }
    if (action === 'activate') { updates.is_active = true; if (type === 'tracks') updates.is_published = true }
    if (action === 'delete') {
      updates.is_active = false
      if (type === 'tracks') updates.is_published = false
      updates.deleted_at = new Date().toISOString()
    }
    const { data, error } = await supabase.from(type).update(updates).eq('id', req.params.id).select().single()
    if (error) { app.log.error({ err: error, type, id: req.params.id }, '[CONTENT] patch failed'); return reply.status(500).send({ error: error.message }) }
    return reply.send({ item: data, type, message: 'Contenu ' + action })
  })

  // ═════════════════════════════════════════════════════════════
  // CORBEILLE — soft-delete avec rétention 30j (admin uniquement)
  // ═════════════════════════════════════════════════════════════
  app.get('/trash', { preHandler: isAdmin }, async (req, reply) => {
    const TABLES = ['tracks','albums','playlists','events','products']
    const results = []
    for (const t of TABLES) {
      const { data, error } = await supabase.from(t)
        .select('*, profiles:creator_id(display_name, username)')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false })
        .limit(100)
      if (error) {
        app.log.error({ err: error, table: t }, '[TRASH] list failed')
        continue
      }
      for (const item of (data || [])) {
        results.push({ ...item, _type: t })
      }
    }
    results.sort((a, b) => new Date(b.deleted_at) - new Date(a.deleted_at))
    return reply.send({ trash: results })
  })

  app.post('/trash/:type/:id/restore', { preHandler: isAdmin }, async (req, reply) => {
    const ALLOWED = ['tracks','albums','playlists','events','products']
    const { type, id } = req.params
    if (!ALLOWED.includes(type)) return reply.status(400).send({ error: 'Type invalide' })
    const updates = { deleted_at: null, updated_at: new Date().toISOString() }
    const { data, error } = await supabase.from(type).update(updates).eq('id', id).select().single()
    if (error) {
      app.log.error({ err: error, type, id }, '[TRASH] restore failed')
      return reply.status(500).send({ error: error.message })
    }
    return reply.send({ item: data, type, message: 'Restaure' })
  })

  app.delete('/trash/:type/:id', { preHandler: isAdmin }, async (req, reply) => {
    const ALLOWED = ['tracks','albums','playlists','events','products']
    const { type, id } = req.params
    if (!ALLOWED.includes(type)) return reply.status(400).send({ error: 'Type invalide' })
    const { error } = await supabase.from(type).delete().eq('id', id)
    if (error) {
      app.log.error({ err: error, type, id }, '[TRASH] force delete failed')
      return reply.status(500).send({ error: error.message })
    }
    app.log.info({ admin_id: req.user.id, type, id }, '[TRASH] force deleted')
    return reply.send({ ok: true, type, id, message: 'Supprime definitivement' })
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

  // MODERATION RADIO (Session v18)
  app.get('/radio-pending', { preHandler: isAdmin }, async (req, reply) => {
    const { data, error } = await supabase.from('radio_stations')
      .select('*, profiles:creator_id(id, username, display_name)')
      .eq('is_active', false)
      .order('created_at', { ascending: false })
    if (error) return reply.status(500).send({ error: error.message })
    return reply.send({ stations: data || [] })
  })

  app.patch('/radio/:id', { preHandler: isAdmin }, async (req, reply) => {
    const { action } = req.body
    const { id } = req.params
    if (action === 'approve') {
      const { data, error } = await supabase.from('radio_stations')
        .update({ is_active: true, is_live: true })
        .eq('id', id).select().single()
      if (error) return reply.status(500).send({ error: error.message })
      app.log.info({ admin_id: req.user.id, station_id: id }, '[RADIO] approved')
      return reply.send({ station: data, message: 'Approuve' })
    }
    if (action === 'reject') {
      const { error } = await supabase.from('radio_stations').delete().eq('id', id)
      if (error) return reply.status(500).send({ error: error.message })
      app.log.info({ admin_id: req.user.id, station_id: id }, '[RADIO] rejected (deleted)')
      return reply.send({ message: 'Rejete et supprime' })
    }
    return reply.status(400).send({ error: 'Action invalide (approve|reject attendu)' })
  })

  // -------------------------------------------------------------
  // SIGNALEMENTS - moderation reactive (ADMIN_REPORTS_V20)
  // -------------------------------------------------------------
  app.get('/reports', { preHandler: isAdmin }, async (req, reply) => {
    const status = req.query.status || 'pending'
    let q = supabase.from('reports')
      .select('*, reporter:reporter_id(id, username, display_name)')
      .order('created_at', { ascending: false })
      .limit(100)
    if (status !== 'all') q = q.eq('status', status)
    const { data, error } = await q
    if (error) { app.log.error({ err: error }, '[REPORTS] list failed'); return reply.status(500).send({ error: error.message }) }
    return reply.send({ reports: data || [] })
  })

  app.patch('/reports/:id', { preHandler: isAdmin }, async (req, reply) => {
    const { id } = req.params
    const { status, also_remove } = req.body
    const ALLOWED = ['reviewed', 'resolved', 'dismissed']
    if (!ALLOWED.includes(status)) return reply.status(400).send({ error: 'Statut invalide (reviewed|resolved|dismissed)' })

    // 1) Mise a jour du signalement
    const { data: report, error } = await supabase.from('reports')
      .update({ status, moderator_id: req.user.id, resolved_at: new Date().toISOString() })
      .eq('id', id).select().single()
    if (error) { app.log.error({ err: error, id }, '[REPORTS] patch failed'); return reply.status(500).send({ error: error.message }) }

    // 2) Retrait optionnel de la cible (reutilise le levier /content existant)
    let removed = null
    if (also_remove && report) {
      const TYPE_MAP = { track: 'tracks', album: 'albums', event: 'events', comment: 'comments', profile: 'profiles' }
      const tbl = TYPE_MAP[report.target_type]
      if (tbl) {
        const upd = { is_active: false }
        if (tbl === 'tracks') { upd.is_published = false }
        const { error: rmErr } = await supabase.from(tbl).update(upd).eq('id', report.target_id)
        removed = rmErr ? ('echec: ' + rmErr.message) : ('masque: ' + tbl)
      } else {
        removed = 'type non supporte: ' + report.target_type
      }
    }

    // 3) Audit (colonne metadata - pattern non bloquant)
    try {
      await supabase.from('admin_logs').insert({
        admin_id: req.user.id,
        action: 'report_' + status,
        target_type: report?.target_type || null,
        target_id: report?.target_id || null,
        metadata: { report_id: id, also_remove: !!also_remove, removed }
      })
    } catch (e) { app.log.warn({ e: e.message }, '[REPORTS] admin_logs fail (non bloquant)') }

    return reply.send({ report, removed, message: 'Signalement ' + status })
  })

  app.get('/deposits', { preHandler: isAdmin }, async (req, reply) => {
    const { data } = await supabase.from('transactions').select('*, profiles:user_id(display_name, username)').eq('type', 'recharge').eq('status', 'pending').order('created_at', { ascending: false })
    return reply.send({ deposits: data || [] })
  })

  app.patch('/deposits/:id', { preHandler: isAdmin }, async (req, reply) => {
    const { action } = req.body
    app.log.info({ action, tx_id: req.params.id, admin_id: req.user.id }, '[DEPOSITS] PATCH start')

    // 1. Recuperer la transaction
    const { data: tx, error: txErr } = await supabase
      .from('transactions').select('*').eq('id', req.params.id).single()
    if (txErr || !tx) {
      app.log.warn({ txErr, id: req.params.id }, '[DEPOSITS] Transaction introuvable')
      return reply.status(404).send({ error: 'Transaction non trouvee' })
    }
    if (tx.status !== 'pending') {
      app.log.warn({ current_status: tx.status }, '[DEPOSITS] Deja traitee')
      return reply.status(400).send({ error: `Deja ${tx.status}` })
    }

    if (action === 'approve') {
      // 2. Lire le solde actuel (ligne peut ne pas exister)
      const { data: wallet, error: wErr } = await supabase
        .from('wallets').select('balance').eq('user_id', tx.user_id).maybeSingle()
      if (wErr) {
        app.log.error({ wErr }, '[DEPOSITS] Erreur lecture wallet')
        return reply.status(500).send({ error: 'Erreur wallet: ' + wErr.message })
      }
      const currentBal = Number(wallet?.balance || 0)
      const newBal = currentBal + Number(tx.amount)
      app.log.info({ user_id: tx.user_id, currentBal, amount: tx.amount, newBal }, '[DEPOSITS] Credit prevu')

      // 3. Upsert wallet avec onConflict explicite
      const { error: upErr } = await supabase
        .from('wallets')
        .upsert(
          { user_id: tx.user_id, balance: newBal, currency: tx.currency || 'KMF', updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        )
      if (upErr) {
        app.log.error({ upErr }, '[DEPOSITS] Erreur upsert wallet')
        return reply.status(500).send({ error: 'Erreur credit wallet: ' + upErr.message })
      }
      app.log.info('[DEPOSITS] Wallet credite OK')

      // 4. Marquer la transaction comme completed
      const { error: tuErr } = await supabase
        .from('transactions')
        .update({ status: 'completed', validated_at: new Date().toISOString() })
        .eq('id', req.params.id)
      if (tuErr) {
        app.log.error({ tuErr }, '[DEPOSITS] Erreur update transaction')
        return reply.status(500).send({ error: 'Erreur update transaction: ' + tuErr.message })
      }
      app.log.info('[DEPOSITS] Transaction completed OK')

      // 5. Log admin (non bloquant)
      try {
        await supabase.from('admin_logs').insert({
          admin_id: req.user.id,
          action: 'deposit_approve',
          details: { tx_id: req.params.id, user_id: tx.user_id, amount: tx.amount, new_balance: newBal }
        })
      } catch (e) { app.log.warn({ e: e.message }, '[DEPOSITS] admin_logs fail (non bloquant)') }

      return reply.send({ message: 'Depot valide - solde credite', new_balance: newBal })
    } else {
      // Rejet
      const { error: rErr } = await supabase
        .from('transactions')
        .update({ status: 'failed', validated_at: new Date().toISOString() })
        .eq('id', req.params.id)
      if (rErr) {
        app.log.error({ rErr }, '[DEPOSITS] Erreur rejet')
        return reply.status(500).send({ error: 'Erreur rejet: ' + rErr.message })
      }
      try {
        await supabase.from('admin_logs').insert({
          admin_id: req.user.id,
          action: 'deposit_reject',
          details: { tx_id: req.params.id, user_id: tx.user_id, amount: tx.amount }
        })
      } catch (e) {}
      return reply.send({ message: 'Depot rejete' })
    }
  })

  // ═══ WITHDRAWALS ═══
  app.get('/withdrawals', { preHandler: isAdmin }, async (req, reply) => {
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .select('*, profiles:user_id(display_name, username, avatar_url)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    if (error) return reply.status(500).send({ error: error.message })
    return reply.send({ withdrawals: data || [] })
  })

  app.patch('/withdrawals/:id', { preHandler: isAdmin }, async (req, reply) => {
    const { action, notes } = req.body
    if (!['approve', 'reject'].includes(action)) return reply.status(400).send({ error: 'action invalide' })

    const { data: wr, error: wrErr } = await supabase
      .from('withdrawal_requests').select('*').eq('id', req.params.id).single()
    if (wrErr || !wr) return reply.status(404).send({ error: 'Demande introuvable' })
    if (wr.status !== 'pending') return reply.status(400).send({ error: `Deja ${wr.status}` })

    if (action === 'approve') {
      // Debit wallet
      const deb = await debitWallet(app, wr.user_id, wr.amount, 'WITHDRAW')
      if (!deb.ok) {
        if (deb.insufficient) return reply.status(400).send({ error: 'Solde insuffisant', balance: deb.balance })
        return reply.status(500).send({ error: 'Erreur debit wallet: ' + (deb.error?.message || 'inconnue') })
      }
      // Marquer approved
      await supabase.from('withdrawal_requests').update({ status: 'approved', admin_notes: notes, processed_at: new Date().toISOString() }).eq('id', req.params.id)
      // Update transaction
      await supabase.from('transactions').update({ status: 'completed', validated_at: new Date().toISOString() })
        .eq('user_id', wr.user_id).eq('type', 'withdrawal').eq('status', 'pending')
      // Notif user
      try {
        const Notify = (await import('../utils/notify.js')).default
        await Notify.system(wr.user_id, '✅ Retrait approuvé', `Votre retrait de ${wr.amount} KMF a été approuvé.`)
      } catch(e) {}
      try {
        await supabase.from('admin_logs').insert({ admin_id: req.user.id, action: 'withdrawal_approve', details: { wr_id: req.params.id, user_id: wr.user_id, amount: wr.amount } })
      } catch(e) {}
      return reply.send({ message: 'Retrait approuvé, wallet débité', new_balance: deb.newBalance })
    } else {
      await supabase.from('withdrawal_requests').update({ status: 'rejected', admin_notes: notes, processed_at: new Date().toISOString() }).eq('id', req.params.id)
      await supabase.from('transactions').update({ status: 'failed', validated_at: new Date().toISOString() })
        .eq('user_id', wr.user_id).eq('type', 'withdrawal').eq('status', 'pending')
      try {
        const Notify = (await import('../utils/notify.js')).default
        await Notify.system(wr.user_id, '❌ Retrait refusé', `Votre retrait de ${wr.amount} KMF a été refusé.${notes ? ' Motif : ' + notes : ''}`)
      } catch(e) {}
      try {
        await supabase.from('admin_logs').insert({ admin_id: req.user.id, action: 'withdrawal_reject', details: { wr_id: req.params.id, user_id: wr.user_id, amount: wr.amount, notes } })
      } catch(e) {}
      return reply.send({ message: 'Retrait refusé' })
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
