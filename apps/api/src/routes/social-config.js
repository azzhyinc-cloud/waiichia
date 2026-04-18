import { supabase } from '../config.js'

const DEFAULTS = {
  facebook: { enabled: false, client_id: '', client_secret: '', redirect_url: '' },
  google: { enabled: false, client_id: '', client_secret: '', redirect_url: '' },
  wanzani: { enabled: false, api_key: '', api_secret: '', redirect_url: '', base_url: '' },
  x: { enabled: false, client_id: '', client_secret: '', redirect_url: '' },
}

function normalize(raw) {
  const result = {}
  for (const provider of ['facebook', 'google', 'wanzani', 'x']) {
    const val = raw?.[provider]
    if (typeof val === 'boolean') {
      result[provider] = { ...DEFAULTS[provider], enabled: val }
    } else if (val && typeof val === 'object') {
      result[provider] = { ...DEFAULTS[provider], ...val }
    } else {
      result[provider] = { ...DEFAULTS[provider] }
    }
  }
  return result
}

export default async function socialConfigRoutes(app) {

  app.get('/social-config', async (req, reply) => {
    try {
      const { data } = await supabase
        .from('platform_settings').select('value').eq('key', 'social_logins').single()
      const config = normalize(data?.value)
      return reply.send({
        facebook: config.facebook.enabled,
        google: config.google.enabled,
        wanzani: config.wanzani.enabled,
        x: config.x.enabled,
      })
    } catch {
      return reply.send({ facebook: false, google: false, wanzani: false, x: false })
    }
  })

  app.get('/social-config/full', { preHandler: app.authenticate }, async (req, reply) => {
    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', req.user.id).single()
    if (!['admin', 'superadmin'].includes(profile?.role))
      return reply.status(403).send({ error: 'Non autorise' })
    try {
      const { data } = await supabase
        .from('platform_settings').select('value').eq('key', 'social_logins').single()
      return reply.send({ config: normalize(data?.value) })
    } catch {
      return reply.send({ config: DEFAULTS })
    }
  })

  app.patch('/social-config', { preHandler: app.authenticate }, async (req, reply) => {
    console.log('[SOCIAL-CONFIG] PATCH called by user:', req.user?.id)
    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', req.user.id).single()
    console.log('[SOCIAL-CONFIG] User role:', profile?.role)
    if (!['admin', 'superadmin'].includes(profile?.role))
      return reply.status(403).send({ error: 'Non autorise' })

    let existing = DEFAULTS
    try {
      const { data: ex } = await supabase
        .from('platform_settings').select('value').eq('key', 'social_logins').single()
      if (ex?.value) existing = normalize(ex.value)
    } catch {}

    const body = req.body
    console.log('[SOCIAL-CONFIG] Body received:', JSON.stringify(body).slice(0, 200))
    const config = { ...existing }
    for (const provider of ['facebook', 'google', 'wanzani', 'x']) {
      if (body[provider] !== undefined) {
        if (typeof body[provider] === 'object') {
          config[provider] = { ...existing[provider], ...body[provider] }
        } else if (typeof body[provider] === 'boolean') {
          config[provider] = { ...existing[provider], enabled: body[provider] }
        }
      }
    }

    console.log('[SOCIAL-CONFIG] Saving config:', JSON.stringify(config).slice(0, 300))
    const { data: updated, error } = await supabase
      .from('platform_settings')
      .update({
        value: config,
        description: 'Configuration connexions sociales',
        updated_at: new Date().toISOString(),
      })
      .eq('key', 'social_logins')
      .select()
      .maybeSingle()

    if (error) {
      console.log('[SOCIAL-CONFIG] Update error:', error.message)
      return reply.status(500).send({ error: error.message })
    }
    if (!updated) {
      console.log('[SOCIAL-CONFIG] No row updated, trying insert')
      const { error: err2 } = await supabase.from('platform_settings').insert({
        key: 'social_logins', value: config,
        description: 'Configuration connexions sociales',
        updated_at: new Date().toISOString(),
      })
      if (err2) {
        console.log('[SOCIAL-CONFIG] Insert error:', err2.message)
        return reply.status(500).send({ error: err2.message })
      }
    }

    console.log('[SOCIAL-CONFIG] Save OK')
    return reply.send({ config, message: 'Configuration sauvegardee' })
  })
}
