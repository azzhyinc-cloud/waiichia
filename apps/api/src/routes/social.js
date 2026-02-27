export default async function socialRoutes(app) {
  app.get('/', async () => ({ module: 'social', status: 'ok' }))
}
