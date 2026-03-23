import { supabase } from '../config.js'
import { execSync } from 'child_process'
import { writeFileSync, unlinkSync, readFileSync, existsSync, mkdirSync } from 'fs'
import { randomUUID } from 'crypto'
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
    const { track_id, audio_url, duration, effects, status, title } = request.body
    const { data, error } = await supabase.from('karaoke_recordings').insert({
      user_id: request.user.id, original_track_id: track_id, audio_url, duration, effects, status: status || 'private', title: title || null
    }).select().single()
    if (error) return reply.status(500).send({ error: error.message })
    return reply.status(201).send({ recording: data })
  })

  // Mix voice + instrumental into one file
  app.post('/mix', { preHandler: app.authenticate }, async (request, reply) => {
    const { voice_url, track_url, voice_vol = 100, instr_vol = 70, mute_voice = false } = request.body
    if (!voice_url || !track_url) return reply.status(400).send({ error: 'voice_url et track_url requis' })
    
    const tmpDir = '/tmp/waiichia_mix'
    if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true })
    const id = randomUUID().slice(0, 8)
    const voicePath = tmpDir + '/voice_' + id + '.webm'
    const trackPath = tmpDir + '/track_' + id + '.mp3'
    const outPath = tmpDir + '/mix_' + id + '.mp3'
    
    try {
      // Download voice
      const vRes = await fetch(voice_url)
      const vBuf = Buffer.from(await vRes.arrayBuffer())
      writeFileSync(voicePath, vBuf)
      
      // Download track
      const tRes = await fetch(track_url)
      const tBuf = Buffer.from(await tRes.arrayBuffer())
      writeFileSync(trackPath, tBuf)
      
      // Calculate volumes (0.0 to 1.0)
      const vVol = (voice_vol / 100).toFixed(2)
      const iVol = mute_voice ? (instr_vol / 200).toFixed(2) : (instr_vol / 100).toFixed(2)
      
      // FFmpeg: mix both tracks, voice on top, trim to shortest
      execSync('ffmpeg -y -i "' + voicePath + '" -i "' + trackPath + '" -filter_complex "[0:a]aformat=fltp:44100:stereo,volume=' + vVol + '*2[v];[1:a]aformat=fltp:44100:stereo,volume=' + iVol + '[i];[v][i]amerge=inputs=2,pan=stereo|c0<c0+c2|c1<c1+c3,dynaudnorm=f=150:g=15[out]" -map "[out]" -ac 2 -ar 44100 -b:a 256k "' + outPath + '"', { timeout: 120000 })
      
      // Upload to Supabase
      const mixBuf = readFileSync(outPath)
      const filename = 'duet_mix_' + id + '.mp3'
      const { error: upErr } = await supabase.storage.from('covers').upload(filename, mixBuf, { contentType: 'audio/mpeg', upsert: false })
      
      // Cleanup
      try { unlinkSync(voicePath) } catch(e) {}
      try { unlinkSync(trackPath) } catch(e) {}
      try { unlinkSync(outPath) } catch(e) {}
      
      if (upErr) return reply.status(500).send({ error: upErr.message })
      
      const { data: urlData } = supabase.storage.from('covers').getPublicUrl(filename)
      return reply.send({ mix_url: urlData.publicUrl })
    } catch(e) {
      // Cleanup on error
      try { unlinkSync(voicePath) } catch(ex) {}
      try { unlinkSync(trackPath) } catch(ex) {}
      try { unlinkSync(outPath) } catch(ex) {}
      return reply.status(500).send({ error: 'Erreur mixage: ' + e.message })
    }
  })

  // Get public recordings
  app.get('/recordings/public', async (request, reply) => {
    const { data, error } = await supabase.from('karaoke_recordings')
      .select('*, profiles:user_id(id,username,display_name,avatar_url), tracks:original_track_id(id,title,cover_url)')
      .eq('status', 'public')
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) return reply.status(500).send({ error: error.message })
    return reply.send({ recordings: data || [] })
  })

  // Rename recording
  app.patch('/recordings/:id', { preHandler: app.authenticate }, async (request, reply) => {
    const { title, status } = request.body
    const updates = {}
    if (title !== undefined) updates.title = title
    if (status !== undefined) updates.status = status
    const { data, error } = await supabase.from('karaoke_recordings')
      .update(updates)
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
