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
        country: 'KM', currency: 'KMF', profile_type: 'artist', role: 'user'
      })
      const { data: p2 } = await supabase.from('profiles').select('*').eq('id', data.user.id).single()
      profile = p2
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
        fans_count: profile.fans_count || 0,
        wallet_balance: wallet?.balance || 0,
      }
    })
  })

  /* ══ ME ══ */
  app.get('/me', { preHandler: app.authenticate }, async (request, reply) => {
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', request.user.id).single()
    if (!profile) return reply.status(404).send({ error: 'Profil introuvable' })
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
}
