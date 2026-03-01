import { supabase } from '../config.js'

export default async function uploadRoutes(app) {

  // UPLOAD FICHIER AUDIO
  app.post('/audio', { preHandler: app.authenticate }, async (request, reply) => {
    const data = await request.file()
    if (!data) return reply.status(400).send({ error: 'Aucun fichier recu' })
    const ext = data.filename.split('.').pop().toLowerCase()
    const allowed = ['mp3', 'wav', 'flac', 'aac', 'm4a', 'ogg']
    if (!allowed.includes(ext)) return reply.status(400).send({ error: 'Format non supporte' })
    const filename = request.user.id + '_' + Date.now() + '.' + ext
    const buffer = await data.toBuffer()
    const { data: uploaded, error } = await supabase.storage
      .from('audio')
      .upload(filename, buffer, { contentType: data.mimetype, upsert: false })
    if (error) return reply.status(500).send({ error: error.message })
    const { data: urlData } = supabase.storage.from('audio').getPublicUrl(filename)
    return reply.status(201).send({ url: urlData.publicUrl, filename })
  })

  // UPLOAD COVER IMAGE
  app.post('/cover', { preHandler: app.authenticate }, async (request, reply) => {
    const data = await request.file()
    if (!data) return reply.status(400).send({ error: 'Aucun fichier recu' })
    const ext = data.filename.split('.').pop().toLowerCase()
    const allowed = ['jpg', 'jpeg', 'png', 'webp']
    if (!allowed.includes(ext)) return reply.status(400).send({ error: 'Format non supporte' })
    const filename = request.user.id + '_' + Date.now() + '.' + ext
    const buffer = await data.toBuffer()
    const { error } = await supabase.storage
      .from('covers')
      .upload(filename, buffer, { contentType: data.mimetype, upsert: false })
    if (error) return reply.status(500).send({ error: error.message })
    const { data: urlData } = supabase.storage.from('covers').getPublicUrl(filename)
    return reply.status(201).send({ url: urlData.publicUrl, filename })
  })

}
