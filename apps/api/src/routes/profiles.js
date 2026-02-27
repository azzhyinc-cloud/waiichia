export default async function profilesRoutes(app) {
  app.get('/', async () => ({ module: 'profiles', status: 'ok' }))
}
