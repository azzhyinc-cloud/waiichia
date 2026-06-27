import { supabase } from '../config.js'
import { execSync } from 'child_process'
import { writeFileSync, unlinkSync, readFileSync, existsSync, mkdirSync } from 'fs'
import { randomUUID } from 'crypto'
import { Notify, createNotification } from '../utils/notify.js'

// ═══════════════════════════════════════════════════════════════════════════
//   Helper : notifie les followers d'un user + lui-même quand il publie
//   une performance karaoké en public
// ═══════════════════════════════════════════════════════════════════════════
async function notifyFollowersOfPublicRecording(ownerId, recordingTitle, recordingId) {
  try {
    const { data: owner } = await supabase
      .from('profiles')
      .select('id, username, display_name')
      .eq('id', ownerId)
      .single()

    if (!owner) {
      console.warn('[karaoke] notif: propriétaire introuvable', ownerId)
      return
    }

    const ownerName = owner.display_name || owner.username
    const title = recordingTitle || 'Sans titre'

    const { data: followers } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('following_id', ownerId)

    if (followers && followers.length > 0) {
      for (const f of followers) {
        Notify.karaokeRecording(ownerId, f.follower_id, owner.username, title, recordingId)
          .catch(err => console.error('[karaoke] notif follower err:', err?.message))
      }
      console.log('[karaoke] 📢 Notifs envoyées à', followers.length, 'followers pour recording:', title, '(id:', recordingId, ')')
    }

    createNotification({
      user_id: ownerId,
      from_id: null,
      title: '🎤 Votre performance est publiée',
      body: `"${title}" est maintenant visible par vos fans`,
      data: {
        type: 'karaoke_published',
        recording_title: title,
        recording_id: recordingId || null,
        url: '/?page=my_content',
      },
    }).catch(err => console.error('[karaoke] notif self err:', err?.message))

  } catch (e) {
    console.error('[karaoke] notifyFollowersOfPublicRecording err:', e.message)
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//   Helper : parse LRC → tableau { time, text }
//   Utilisé pour valider le format LRC avant sauvegarde
// ═══════════════════════════════════════════════════════════════════════════
function parseLRC(lrc) {
  const lines = lrc.split('\n')
  const result = []
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/
  for (const line of lines) {
    const match = line.match(timeRegex)
    if (match) {
      const minutes = parseInt(match[1])
      const seconds = parseInt(match[2])
      const ms = parseInt(match[3].padEnd(3, '0'))
      const time = minutes * 60 + seconds + ms / 1000
      result.push({ time, text: match[4].trim() })
    }
  }
  return result
}


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

  // ─── Lyrics sync : upload/update paroles LRC ─────────────────────────────
  // Accessible au créateur du track ou aux admins/modérateurs
  // Body: { lyrics_lrc: string }  — format LRC standard
  // Retourne: { track, parsed: [{time, text}] }
  app.patch('/tracks/:id/lyrics', { preHandler: app.authenticate }, async (request, reply) => {
    const { lyrics_lrc } = request.body

    if (typeof lyrics_lrc !== 'string') {
      return reply.status(400).send({ error: 'lyrics_lrc (string) requis' })
    }

    // Vérifier que l'appelant est le créateur du track ou admin
    const { data: track } = await supabase
      .from('karaoke_tracks')
      .select('id, creator_id, title')
      .eq('id', request.params.id)
      .single()

    if (!track) return reply.status(404).send({ error: 'Track introuvable' })

    const { data: caller } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', request.user.id)
      .single()

    const isAdmin = caller && ['admin', 'superadmin', 'moderator'].includes(caller.role)

    if (!isAdmin && track.creator_id !== request.user.id) {
      return reply.status(403).send({ error: 'Non autorisé : vous devez être le créateur du track ou administrateur' })
    }

    // Valider le format LRC (au moins une ligne avec timestamp)
    const parsed = parseLRC(lyrics_lrc)
    if (lyrics_lrc.trim().length > 0 && parsed.length === 0) {
      return reply.status(400).send({ error: 'Format LRC invalide. Exemple : [00:12.50]Première ligne' })
    }

    const { data: updated, error } = await supabase
      .from('karaoke_tracks')
      .update({ lyrics_lrc })
      .eq('id', request.params.id)
      .select()
      .single()

    if (error) return reply.status(500).send({ error: error.message })

    console.log('[karaoke] ✍️ Lyrics mis à jour pour track:', track.title, '—', parsed.length, 'lignes')

    return reply.send({ track: updated, parsed })
  })

  // ─── Lyrics sync : récupérer les paroles parsées d'un track ──────────────
  // Retourne { lrc: string, parsed: [{time, text}] }
  app.get('/tracks/:id/lyrics', async (request, reply) => {
    const { data: track, error } = await supabase
      .from('karaoke_tracks')
      .select('id, title, lyrics_lrc')
      .eq('id', request.params.id)
      .single()

    if (error || !track) return reply.status(404).send({ error: 'Track introuvable' })

    const lrc = track.lyrics_lrc || ''
    const parsed = parseLRC(lrc)

    return reply.send({ lrc, parsed })
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

  // ─── Création d'un enregistrement karaoké ─────────────────────────────────
  app.post('/recordings', { preHandler: app.authenticate }, async (request, reply) => {
    const { track_id, audio_url, duration, effects, status, title } = request.body
    const finalStatus = status || 'private'

    const { data, error } = await supabase.from('karaoke_recordings').insert({
      user_id: request.user.id, original_track_id: track_id, audio_url, duration, effects, status: finalStatus, title: title || null
    }).select().single()
    if (error) return reply.status(500).send({ error: error.message })

    if (finalStatus === 'public' && data?.id) {
      notifyFollowersOfPublicRecording(request.user.id, title, data.id)
        .catch(err => console.error('[karaoke] POST notif err:', err?.message))
    }

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
      const vRes = await fetch(voice_url)
      const vBuf = Buffer.from(await vRes.arrayBuffer())
      writeFileSync(voicePath, vBuf)

      const tRes = await fetch(track_url)
      const tBuf = Buffer.from(await tRes.arrayBuffer())
      writeFileSync(trackPath, tBuf)

      const vVol = (voice_vol / 100).toFixed(2)
      const iVol = mute_voice ? (instr_vol / 200).toFixed(2) : (instr_vol / 100).toFixed(2)

      execSync('ffmpeg -y -i "' + voicePath + '" -i "' + trackPath + '" -filter_complex "[0:a]aformat=fltp:44100:stereo,volume=' + vVol + '*2[v];[1:a]aformat=fltp:44100:stereo,volume=' + iVol + '[i];[v][i]amerge=inputs=2,pan=stereo|c0<c0+c2|c1<c1+c3,dynaudnorm=f=150:g=15[out]" -map "[out]" -ac 2 -ar 44100 -b:a 256k "' + outPath + '"', { timeout: 120000 })

      const mixBuf = readFileSync(outPath)
      const filename = 'duet_mix_' + id + '.mp3'
      const { error: upErr } = await supabase.storage.from('covers').upload(filename, mixBuf, { contentType: 'audio/mpeg', upsert: false })

      try { unlinkSync(voicePath) } catch(e) {}
      try { unlinkSync(trackPath) } catch(e) {}
      try { unlinkSync(outPath) } catch(e) {}

      if (upErr) return reply.status(500).send({ error: upErr.message })

      const { data: urlData } = supabase.storage.from('covers').getPublicUrl(filename)
      return reply.send({ mix_url: urlData.publicUrl })
    } catch(e) {
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

  // ─── Modifier titre/status d'un enregistrement ────────────────────────────
  app.patch('/recordings/:id', { preHandler: app.authenticate }, async (request, reply) => {
    const { title, status } = request.body
    const updates = {}
    if (title !== undefined) updates.title = title
    if (status !== undefined) updates.status = status

    let oldStatus = null
    if (status !== undefined) {
      const { data: existing } = await supabase.from('karaoke_recordings')
        .select('status')
        .eq('id', request.params.id)
        .eq('user_id', request.user.id)
        .single()
      oldStatus = existing?.status
    }

    const { data, error } = await supabase.from('karaoke_recordings')
      .update(updates)
      .eq('id', request.params.id)
      .eq('user_id', request.user.id)
      .select().single()
    if (error) return reply.status(500).send({ error: error.message })

    if (status === 'public' && oldStatus && oldStatus !== 'public' && data?.id) {
      notifyFollowersOfPublicRecording(request.user.id, data?.title || title, data.id)
        .catch(err => console.error('[karaoke] PATCH notif err:', err?.message))
    }

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

  // ─── ADMIN : Mettre en vedette une performance karaoké ────────────────────
  app.patch('/recordings/:id/feature', { preHandler: app.authenticate }, async (request, reply) => {
    const { data: caller } = await supabase.from('profiles')
      .select('role')
      .eq('id', request.user.id)
      .single()

    if (!caller || !['admin', 'superadmin', 'moderator'].includes(caller.role)) {
      return reply.status(403).send({ error: 'Action réservée aux administrateurs' })
    }

    const { is_featured } = request.body

    const { data: recording, error: getErr } = await supabase.from('karaoke_recordings')
      .select('id, user_id, title, is_featured')
      .eq('id', request.params.id)
      .single()

    if (getErr || !recording) {
      return reply.status(404).send({ error: 'Enregistrement introuvable' })
    }

    const newValue = is_featured !== undefined ? is_featured : !recording.is_featured

    const { data: updated, error } = await supabase.from('karaoke_recordings')
      .update({ is_featured: newValue })
      .eq('id', request.params.id)
      .select().single()

    if (error) return reply.status(500).send({ error: error.message })

    if (newValue === true && recording.is_featured !== true) {
      Notify.karaokeFeatured(recording.user_id, recording.title || 'Sans titre', recording.id)
        .catch(err => console.error('[karaoke] feature notif err:', err?.message))
    }

    return reply.send({ recording: updated })
  })

  // ─── LIST : Récupérer les performances en vedette (public) ────────────────
  app.get('/recordings/featured', async (request, reply) => {
    const { data, error } = await supabase.from('karaoke_recordings')
      .select('*, profiles:user_id(id,username,display_name,avatar_url), tracks:original_track_id(id,title,cover_url)')
      .eq('is_featured', true)
      .eq('status', 'public')
      .order('created_at', { ascending: false })
      .limit(20)
    if (error) return reply.status(500).send({ error: error.message })
    return reply.send({ recordings: data || [] })
  })
}
