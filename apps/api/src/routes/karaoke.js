import { supabase } from '../config.js'
export default async function karaokeRoutes(app) {
  app.get('/tracks', async (request, reply) => {
    const { data, error } = await supabase.from('karaoke_tracks').select('*').eq('is_active', true).order('created_at', { ascending: false })
    if (error) return reply.status(500).send({ error: error.message })
    return reply.send({ tracks: data || [] })
  })
  app.get('/tracks/:id', async (request, reply) => {
    const { data, error } = await supabase.from('karaoke_tracks').select('*').eq('id', request.params.id).single()
    return reply.send({ track: data })
  })
  app.get('/duets', async (request, reply) => {
    const { data, error } = await supabase.from('karaoke_duets')
      .select('*, profiles:initiator_id(id, username, display_name, avatar_url), karaoke_tracks:track_id(id, title, artist)')
      .eq('status', 'open').order('created_at', { ascending: false })
    if (error) return reply.status(500).send({ error: error.message })
    return reply.send({ duets: data || [] })
  })
  app.get('/recordings/my', { preHandler: app.authenticate }, async (request, reply) => {
    const { data, error } = await supabase.from('karaoke_recordings')
      .select('*, tracks:original_track_id(id, title, cover_url, creator_id)')
      .eq('user_id', request.user.id).order('created_at', { ascending: false })
    if (error) return reply.status(500).send({ error: error.message })
    return reply.send({ recordings: data || [] })
  })
  app.post('/recordings', { preHandler: app.authenticate }, async (request, reply) => {
    const { track_id, audio_url, duration, effects, status } = request.body
    const { data, error } = await supabase.from('karaoke_recordings').insert({
      user_id: request.user.id, original_track_id: track_id, audio_url, duration, effects, status: status || 'private'
    }).select().single()
    if (error) return reply.status(500).send({ error: error.message })
    return reply.status(201).send({ recording: data })
  })

  // Rename recording
  app.patch('/recordings/:id', { preHandler: app.authenticate }, async (request, reply) => {
    const { title } = request.body
    const { data, error } = await supabase.from('karaoke_recordings')
      .update({ title })
      .eq('id', request.params.id)
      .eq('user_id', request.user.id)
      .select().single()
    if (error) return reply.status(500).send({ error: error.message })
    return reply.send({ recording: data })
  })

  // Delete recording
  app.delete('/recordings/:id', { preHandler: app.authenticate }, async (request, reply) => {
    const { error } = await supabase.from('karaoke_recordings')
      .delete()
      .eq('id', request.params.id)
      .eq('user_id', request.user.id)
    if (error) return reply.status(500).send({ error: error.message })
    return reply.send({ ok: true })
  })
}
