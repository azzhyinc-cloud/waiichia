export default async function paymentsRoutes(app) {
  app.get('/', async () => ({ module: 'payments', status: 'ok' }))
}
