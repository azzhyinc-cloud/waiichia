export default async function tracksRoutes(app) {
  app.get('/', async () => ({ module: 'tracks', status: 'ok' }))
}
