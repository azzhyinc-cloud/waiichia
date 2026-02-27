import Fastify from 'fastify'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import jwt from '@fastify/jwt'
import 'dotenv/config'
import { config } from './config.js'
import authRoutes from './routes/auth.js'
import tracksRoutes from './routes/tracks.js'
import profilesRoutes from './routes/profiles.js'
import paymentsRoutes from './routes/payments.js'
import socialRoutes from './routes/social.js'

const app = Fastify({
  logger: {
    level: config.nodeEnv === 'development' ? 'info' : 'warn',
    transport: config.nodeEnv === 'development' ? {
      target: 'pino-pretty',
      options: { colorize: true }
    } : undefined
  }
})

await app.register(cors, { origin: config.corsOrigin, credentials: true })
await app.register(multipart, {
  limits: { fileSize: (parseInt(process.env.MAX_UPLOAD_SIZE_MB) || 200) * 1024 * 1024 }
})
await app.register(jwt, { secret: config.jwtSecret })

app.decorate('authenticate', async function(request, reply) {
  try {
    await request.jwtVerify()
  } catch (err) {
    reply.status(401).send({ error: 'Non autorise', message: err.message })
  }
})

await app.register(authRoutes,     { prefix: '/api/auth' })
await app.register(tracksRoutes,   { prefix: '/api/tracks' })
await app.register(profilesRoutes, { prefix: '/api/profiles' })
await app.register(paymentsRoutes, { prefix: '/api/payments' })
await app.register(socialRoutes,   { prefix: '/api/social' })

app.get('/health', async () => ({
  status: 'ok',
  version: '1.0.0',
  timestamp: new Date().toISOString(),
  env: config.nodeEnv
}))

app.setErrorHandler((error, request, reply) => {
  app.log.error(error)
  reply.status(error.statusCode || 500).send({
    error: error.message || 'Erreur serveur',
    code: error.code || 'INTERNAL_ERROR'
  })
})

try {
  await app.listen({ port: config.port, host: '0.0.0.0' })
  console.log('Waiichia API demarree sur le port ' + config.port)
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
