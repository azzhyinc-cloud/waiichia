import { supabase } from '../config.js'

export default async function authRoutes(app) {

  app.post('/register', async (request, reply) => {
    const { email, password, username, display_name, country } = request.body
      return reply.status(400).send({ error: 'Champs obligatoires manquants' })
    const { data: ex } = await supabase.from('profiles')
      .select('id').eq('username', username.toLowerCase()).single()
    if (ex) return reply.status(409).send({ error: 'Nom utilisateur deja pris' })
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { username: username.toLowerCase(), display_name, country: country || 'KM' } }
    })
    if (error) return reply.status(400).send({ error: error.message })
    return reply.status(201).send({ message: 'Compte cree', user: { id: data.user.id, email, username, display_name } })
  })

  app.post('/login', async (request, reply) => {
    const { email, password } = request.body
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return reply.status(401).send({ error: 'Email ou mot de passe incorrect' })
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single()
    const { data: wallet } = await supabase.from('wallets').select('balance').eq('user_id', data.user.id).single()
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

  app.get('/me', { preHandler: app.authenticate }, async (request, reply) => {
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', request.user.id).single()
    const { data: wallet } = await supabase.from('wallets').select('balance').eq('user_id', request.user.id).single()
    return reply.send({ profile: { ...profile, wallet_balance: wallet?.balance || 0 } })
  })

  app.post('/logout', { preHandler: app.authenticate }, async (request, reply) => {
    return reply.send({ message: 'Deconnecte' })
  })

  app.post('/reset-password', async (request, reply) => {
    const { email } = request.body
    await supabase.auth.resetPasswordForEmail(email)
    return reply.send({ message: 'Email envoye si le compte existe' })
  })
}
