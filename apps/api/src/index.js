import Fastify from 'fastify'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import multipart from '@fastify/multipart'
import jwt from '@fastify/jwt'
import 'dotenv/config'
import { config, supabase } from './config.js'
import authRoutes      from './routes/auth.js'
import tracksRoutes    from './routes/tracks.js'
import profilesRoutes  from './routes/profiles.js'
import paymentsRoutes  from './routes/payments.js'
import campaignsRoutes from './routes/campaigns.js'
import productsRoutes  from './routes/products.js'
import messagesRoutes  from './routes/messages.js'
import socialRoutes    from './routes/social.js'
import uploadRoutes    from './routes/upload.js'
import eventsRoutes    from './routes/events.js'
import emissionsRoutes from './routes/emissions.js'
import radioRoutes     from './routes/radio.js'
import karaokeRoutes   from './routes/karaoke.js'

const app = Fastify({
  logger: {
    level: config.nodeEnv === 'development' ? 'info' : 'warn',
    transport: config.nodeEnv === 'development' ? { target: 'pino-pretty', options: { colorize: true } } : undefined
  }
})

await app.register(cors, { origin: config.corsOrigin, credentials: true })
await app.register(rateLimit, { max: 100, timeWindow: '1 minute' })
await app.register(multipart, { limits: { fileSize: (parseInt(process.env.MAX_UPLOAD_SIZE_MB) || 200) * 1024 * 1024 } })
await app.register(jwt, { secret: config.jwtSecret })

app.decorate('authenticate', async function(request, reply) {
  try { await request.jwtVerify() }
  catch (err) { reply.status(401).send({ error: 'Non autorise', message: err.message }) }
})

await app.register(authRoutes,      { prefix: '/api/auth' })
await app.register(tracksRoutes,    { prefix: '/api/tracks' })
await app.register(profilesRoutes,  { prefix: '/api/profiles' })
await app.register(paymentsRoutes,  { prefix: '/api/payments' })
await app.register(socialRoutes,    { prefix: '/api/social' })
await app.register(uploadRoutes,    { prefix: '/api/upload' })
await app.register(eventsRoutes,    { prefix: '/api/events' })
await app.register(campaignsRoutes, { prefix: '/api/campaigns' })
await app.register(productsRoutes,  { prefix: '/api/products' })
await app.register(messagesRoutes,  { prefix: '/api/messages' })
await app.register(emissionsRoutes, { prefix: '/api/emissions' })
await app.register(radioRoutes,     { prefix: '/api/radio' })
await app.register(karaokeRoutes,   { prefix: '/api/karaoke' })

app.get('/api/wallet/balance', { preHandler: app.authenticate }, async (req, reply) => {
  const { data } = await supabase.from('wallets').select('balance, currency').eq('user_id', req.user.id).single()
  return reply.send({ balance: data?.balance || 0, currency: data?.currency || 'KMF' })
})

app.get('/health', async () => ({ status: 'ok', version: '1.1.0', timestamp: new Date().toISOString() }))

app.setErrorHandler((error, request, reply) => {
  app.log.error(error)
  reply.status(error.statusCode || 500).send({ error: error.message || 'Erreur serveur' })
})

try {
  await app.listen({ port: config.port, host: '0.0.0.0' })
  console.log('Waiichia API demarree sur le port ' + config.port)
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
