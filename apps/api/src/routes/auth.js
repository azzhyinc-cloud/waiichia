import { supabase } from '../config.js'

export default async function authRoutes(app) {

  /* ══ REGISTER ══ */
  app.post('/register', async (request, reply) => {
    const { email, password, username, display_name, country } = request.body
    if (!email || !password || !username || !display_name)
      return reply.status(400).send({ error: 'Champs obligatoires manquants' })
    if (password.length < 6)
      return reply.status(400).send({ error: 'Mot de passe trop court (6 min)' })

    // Vérifier username unique
    const { data: ex } = await supabase.from('profiles')
      .select('id').eq('username', username.toLowerCase()).maybeSingle()
    if (ex) return reply.status(409).send({ error: 'Nom utilisateur déjà pris' })

    // Créer compte Supabase Auth
    const { data, error } = await supabase.auth.signUp({ email, password,
      options: { data: { username: username.toLowerCase(), display_name, country: country || 'KM' } }
    })
    if (error) return reply.status(400).send({ error: error.message })

    const uid = data.user?.id
    if (!uid) return reply.status(500).send({ error: 'Création compte échouée' })

    // Créer profil manuellement (bypass trigger défaillant)
    const { error: pErr } = await supabase.from('profiles').upsert({
      id: uid,
      username: username.toLowerCase(),
      display_name,
      email,
      country: country || 'KM',
      currency: 'KMF',
      profile_type: 'artist',
      role: 'user',
      is_verified: false,
      is_active: true,
      fans_count: 0,
      followers_count: 0,
    }, { onConflict: 'id' })
    if (pErr) app.log.warn('Profile upsert warn:', pErr.message)

    // Créer wallet
    await supabase.from('wallets').upsert({
      user_id: uid, balance: 0, currency: 'KMF'
    }, { onConflict: 'user_id' })

    // Tentative auto-login (si pas de confirmation email requise)
    const { data: loginData } = await supabase.auth.signInWithPassword({ email, password })
    if (loginData?.session) {
      const token = app.jwt.sign(
        { id: uid, email, username: username.toLowerCase(), role: 'user' },
        { expiresIn: '7d' }
      )
      return reply.status(201).send({
        token, needsConfirmation: false,
        user: { id: uid, email, username: username.toLowerCase(), display_name, country: country || 'KM' }
      })
    }

    return reply.status(201).send({
      needsConfirmation: true,
      message: 'Compte créé ! Vérifiez votre boîte mail pour confirmer.'
    })
  })

  /* ══ LOGIN ══ */
  app.post('/login', async (request, reply) => {
    const { email, password } = request.body
    if (!email || !password)
      return reply.status(400).send({ error: 'Email et mot de passe requis' })

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      if (error.message?.includes('Email not confirmed'))
        return reply.status(401).send({ error: 'Email non confirmé. Vérifiez votre boîte mail.', code: 'EMAIL_NOT_CONFIRMED' })
      return reply.status(401).send({ error: 'Email ou mot de passe incorrect' })
    }

    // Récupérer/créer profil
    let { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single()
    if (!profile) {
      await supabase.from('profiles').insert({
        id: data.user.id, email,
        username: data.user.user_metadata?.username || email.split('@')[0],
        display_name: data.user.user_metadata?.display_name || email.split('@')[0],
        country: 'KM', currency: 'KMF', profile_type: 'artist', role: 'user', is_active: true
      })
      const { data: p2 } = await supabase.from('profiles').select('*').eq('id', data.user.id).single()
      profile = p2
    }

    // ── Blocage si compte désactivé ──
    if (profile && profile.is_active === false) {
      return reply.status(403).send({ error: 'Votre compte a été désactivé. Contactez le support.' })
    }

    // Récupérer/créer wallet
    let { data: wallet } = await supabase.from('wallets').select('balance').eq('user_id', data.user.id).single()
    if (!wallet) {
      await supabase.from('wallets').insert({ user_id: data.user.id, balance: 0, currency: 'KMF' })
      wallet = { balance: 0 }
    }

    const token = app.jwt.sign(
      { id: data.user.id, email, username: profile.username, role: profile.role || 'user' },
      { expiresIn: '7d' }
    )
    return reply.send({
      token,
      user: {
        id: data.user.id, email,
        username: profile.username,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        cover_url: profile.cover_url,
        profile_type: profile.profile_type,
        country: profile.country,
        currency: profile.currency,
        role: profile.role || 'user',
        is_verified: profile.is_verified,
        is_active: profile.is_active,
        fans_count: profile.fans_count || 0,
        wallet_balance: wallet?.balance || 0,
      }
    })
  })

  /* ══ ME ══ */
  app.get('/me', { preHandler: app.authenticate }, async (request, reply) => {
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', request.user.id).single()
    if (!profile) return reply.status(404).send({ error: 'Profil introuvable' })

    // ── Blocage si compte désactivé ──
    if (profile.is_active === false) {
      return reply.status(403).send({ error: 'Votre compte a été désactivé. Contactez le support.' })
    }

    const { data: wallet } = await supabase.from('wallets').select('balance').eq('user_id', request.user.id).single()
    return reply.send({ profile: { ...profile, wallet_balance: wallet?.balance || 0 } })
  })

  /* ══ LOGOUT ══ */
  app.post('/logout', { preHandler: app.authenticate }, async (request, reply) => {
    return reply.send({ message: 'Déconnecté' })
  })

  /* ══ RESET PASSWORD ══ */
  app.post('/reset-password', async (request, reply) => {
    const { email } = request.body
    if (!email) return reply.status(400).send({ error: 'Email requis' })
    await supabase.auth.resetPasswordForEmail(email)
    return reply.send({ message: 'Email envoyé si le compte existe' })
  })

  /* ══ CHANGE PASSWORD ══ */
  app.post('/change-password', { preHandler: app.authenticate }, async (request, reply) => {
    try {
      const { old_password, new_password } = request.body
      if (!old_password || !new_password)
        return reply.status(400).send({ error: 'Ancien et nouveau mot de passe requis' })
      if (new_password.length < 6)
        return reply.status(400).send({ error: 'Le nouveau mot de passe doit faire au moins 6 caractères' })

      // Get user email
      const { data: profile } = await supabase.from('profiles').select('email').eq('id', request.user.id).single()
      if (!profile) return reply.status(404).send({ error: 'Profil introuvable' })

      // Verify old password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: old_password
      })
      if (signInError) return reply.status(401).send({ error: 'Ancien mot de passe incorrect' })

      // Update password via admin API
      const { error: updateError } = await supabase.auth.admin.updateUserById(request.user.id, {
        password: new_password
      })
      if (updateError) return reply.status(500).send({ error: 'Erreur changement mot de passe' })

      return reply.send({ success: true, message: 'Mot de passe changé avec succès' })
    } catch (e) {
      app.log.error(e)
      return reply.status(500).send({ error: 'Erreur serveur' })
    }
  })

  /* ══ SOCIAL CONFIG (public) ══ */
  app.get('/social-config', async (request, reply) => {
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'social_logins')
        .single()

      if (error || !data) return reply.send({ providers: {} })

      const settings = typeof data.value === 'string' ? JSON.parse(data.value) : data.value
      const providers = {}
      for (const [key, val] of Object.entries(settings)) {
        if (val && val.enabled) {
          providers[key] = {
            enabled: true,
            client_id: val.client_id || null,
            app_id: val.app_id || null
          }
        }
      }
      return reply.send({ providers })
    } catch (e) {
      app.log.error(e)
      return reply.send({ providers: {} })
    }
  })

  /* ══ SOCIAL CONFIG FULL (admin) ══ */
  app.get('/social-config/full', { preHandler: app.authenticate }, async (request, reply) => {
    try {
      if (!['admin', 'superadmin'].includes(request.user.role)) {
        return reply.status(403).send({ error: 'Accès refusé' })
      }

      const { data, error } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'social_logins')
        .single()

      if (error || !data) return reply.send({ providers: {} })

      const settings = typeof data.value === 'string' ? JSON.parse(data.value) : data.value
      return reply.send({ providers: settings })
    } catch (e) {
      app.log.error(e)
      return reply.status(500).send({ error: 'Erreur serveur' })
    }
  })

  /* ══ SOCIAL CONFIG UPDATE (admin) ══ */
  app.patch('/social-config', { preHandler: app.authenticate }, async (request, reply) => {
    try {
      if (!['admin', 'superadmin'].includes(request.user.role)) {
        return reply.status(403).send({ error: 'Accès refusé' })
      }

      const { providers } = request.body
      if (!providers) return reply.status(400).send({ error: 'providers requis' })

      const { error } = await supabase
        .from('platform_settings')
        .upsert({ key: 'social_logins', value: providers }, { onConflict: 'key' })

      if (error) throw error

      // Log admin action
      try {
        await supabase.from('admin_logs').insert({
          admin_id: request.user.id,
          action: 'update_social_config',
          details: { providers_updated: Object.keys(providers) }
        })
      } catch (logErr) {}

      return reply.send({ success: true })
    } catch (e) {
      app.log.error(e)
      return reply.status(500).send({ error: 'Erreur serveur' })
    }
  })
}
