export default async function albumRoutes(fastify, options) {
  const { supabase } = fastify

  // ─── List albums ───
  fastify.get('/', async (req, reply) => {
    try {
      const { user_id, creator_id, limit = 50 } = req.query
      let query = supabase
        .from('albums')
        .select('*, profiles:creator_id(id, username, display_name, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(Number(limit))

      // Support des 2 params pour rétrocompatibilité (user_id ou creator_id)
      const filterId = creator_id || user_id
      if (filterId) {
        query = query.eq('creator_id', filterId)
      } else {
        // v20: liste publique = exclure les brouillons (is_published=false)
        query = query.eq('is_published', true)
      }

      const { data, error } = await query
      if (error) throw error

      // Add track count
      const albums = await Promise.all((data || []).map(async (album) => {
        const { count } = await supabase
          .from('album_tracks')
          .select('track_id', { count: 'exact', head: true })
          .eq('album_id', album.id)
        return { ...album, track_count: count || 0 }
      }))

      return reply.send({ albums })
    } catch (e) {
      fastify.log.error(e)
      return reply.code(500).send({ error: 'Erreur serveur' })
    }
  })

  // ─── Get album with tracks ───
  fastify.get('/:id', async (req, reply) => {
    try {
      const { data: album, error } = await supabase
        .from('albums')
        .select('*, profiles:creator_id(id, username, display_name, avatar_url)')
        .eq('id', req.params.id)
        .single()

      if (error || !album) return reply.code(404).send({ error: 'Album introuvable' })

      const { data: albumTracks } = await supabase
        .from('album_tracks')
        .select('*, tracks(*, profiles(id, username, display_name, avatar_url))')
        .eq('album_id', album.id)
        .order('position', { ascending: true })

      return reply.send({ ...album, album_tracks: albumTracks || [] })
    } catch (e) {
      fastify.log.error(e)
      return reply.code(500).send({ error: 'Erreur serveur' })
    }
  })

  // ─── Create album ───
  fastify.post('/', { preHandler: [fastify.authenticate] }, async (req, reply) => {
    try {
      const { title, description, cover_url, genre, country, release_year, album_type, is_published, tags } = req.body
      if (!title) return reply.code(400).send({ error: 'Titre requis' })

      const { data, error } = await supabase
        .from('albums')
        .insert({
          title,
          description: description || null,
          cover_url: cover_url || null,
          genre: genre || null,
          country: country || null,
          release_year: release_year || null,
          album_type: album_type || 'album',
          is_published: is_published === true,
          tags: Array.isArray(tags) ? tags : [],
          creator_id: req.user.id
        })
        .select()
        .single()

      if (error) throw error
      // Update tracks_count
      await supabase.from('playlists').update({ tracks_count: position }).eq('id', req.params.id)
      return reply.code(201).send(data)
    } catch (e) {
      fastify.log.error(e)
      return reply.code(500).send({ error: 'Erreur création album' })
    }
  })

  // ─── Add track to album ───
  fastify.post('/:id/tracks', { preHandler: [fastify.authenticate] }, async (req, reply) => {
    try {
      const { track_id, position } = req.body
      if (!track_id) return reply.code(400).send({ error: 'track_id requis' })

      // Verify album ownership
      const { data: album } = await supabase
        .from('albums')
        .select('creator_id')
        .eq('id', req.params.id)
        .single()

      if (!album || album.creator_id !== req.user.id) {
        return reply.code(403).send({ error: 'Accès refusé' })
      }

      // Get next position if not provided
      let pos = position
      if (!pos) {
        const { count } = await supabase
          .from('album_tracks')
          .select('track_id', { count: 'exact', head: true })
          .eq('album_id', req.params.id)
        pos = (count || 0) + 1
      }

      const { data, error } = await supabase
        .from('album_tracks')
        .insert({ album_id: req.params.id, track_id, position: pos })
        .select()
        .single()

      if (error) throw error
      return reply.code(201).send(data)
    } catch (e) {
      fastify.log.error(e)
      return reply.code(500).send({ error: 'Erreur ajout piste' })
    }
  })

  // ─── List public playlists (with user_id filter) ───
  fastify.get('/playlists/public', async (req, reply) => {
    try {
      const { user_id, limit = 50 } = req.query
      let query = supabase
        .from('playlists')
        .select('*, profiles(id, username, display_name, avatar_url)')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(Number(limit))

      // ── Filtre par user_id ──
      if (user_id) {
        query = query.eq('user_id', user_id)
      }

      const { data, error } = await query
      if (error) throw error

      // Add track count (compatible avec colonne BDD tracks_count + recalcul)
      const playlists = await Promise.all((data || []).map(async (pl) => {
        const { count } = await supabase
          .from('playlist_tracks')
          .select('track_id', { count: 'exact', head: true })
          .eq('playlist_id', pl.id)
        return { ...pl, track_count: count || 0, tracks_count: count || 0 }
      }))

      return reply.send({ playlists })
    } catch (e) {
      fastify.log.error(e)
      return reply.code(500).send({ error: 'Erreur serveur' })
    }
  })

  // ─── Get playlist with tracks ───
  fastify.get('/playlists/:id', async (req, reply) => {
    try {
      const { data: playlist, error } = await supabase
        .from('playlists')
        .select('*, profiles(id, username, display_name, avatar_url)')
        .eq('id', req.params.id)
        .single()

      if (error || !playlist) return reply.code(404).send({ error: 'Playlist introuvable' })

      const { data: playlistTracks } = await supabase
        .from('playlist_tracks')
        .select('*, tracks(*, profiles(id, username, display_name, avatar_url))')
        .eq('playlist_id', playlist.id)
        .order('position', { ascending: true })

      return reply.send({ ...playlist, playlist_tracks: playlistTracks || [] })
    } catch (e) {
      fastify.log.error(e)
      return reply.code(500).send({ error: 'Erreur serveur' })
    }
  })

  // ─── Create playlist ───
  fastify.post('/playlists', { preHandler: [fastify.authenticate] }, async (req, reply) => {
    try {
      const { title, description, is_public = true } = req.body
      if (!title) return reply.code(400).send({ error: 'Titre requis' })

      const { data, error } = await supabase
        .from('playlists')
        .insert({
          title,
          description: description || null,
          is_public,
          user_id: req.user.id
        })
        .select()
        .single()

      if (error) throw error
      return reply.code(201).send(data)
    } catch (e) {
      fastify.log.error(e)
      return reply.code(500).send({ error: 'Erreur création playlist' })
    }
  })

  // ─── Add track to playlist ───
  fastify.post('/playlists/:id/tracks', { preHandler: [fastify.authenticate] }, async (req, reply) => {
    try {
      const { track_id } = req.body
      if (!track_id) return reply.code(400).send({ error: 'track_id requis' })

      // Verify playlist ownership
      const { data: playlist } = await supabase
        .from('playlists')
        .select('user_id')
        .eq('id', req.params.id)
        .single()

      if (!playlist || playlist.user_id !== req.user.id) {
        return reply.code(403).send({ error: 'Accès refusé' })
      }

      // Get next position
      const { count } = await supabase
        .from('playlist_tracks')
        .select('track_id', { count: 'exact', head: true })
        .eq('playlist_id', req.params.id)
      const position = (count || 0) + 1

      const { data, error } = await supabase
        .from('playlist_tracks')
        .insert({ playlist_id: req.params.id, track_id, position })
        .select()
        .single()
      if (error) throw error
      await supabase.from('playlists').update({ tracks_count: position }).eq('id', req.params.id)
      return reply.code(201).send(data)
    } catch (e) {
      fastify.log.error(e)
      return reply.code(500).send({ error: 'Erreur ajout son' })
    }
  })
}
