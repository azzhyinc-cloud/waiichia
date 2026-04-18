import { supabase } from '../config.js'

export default async function currencyRoutes(app) {

  // GET tous les taux de change
  app.get('/rates', async (request, reply) => {
    const { base = 'KMF' } = request.query
    const { data, error } = await supabase.from('currency_rates')
      .select('*')
      .order('updated_at', { ascending: false })
    if (error) return reply.status(500).send({ error: error.message })

    // Organiser les taux en objet { "KMF_USD": 0.00204, ... }
    const rates = {}
    for (const r of (data || [])) {
      rates[r.from_currency + '_' + r.to_currency] = parseFloat(r.rate)
    }
    return reply.send({ rates, base, updated_at: data?.[0]?.updated_at || null })
  })

  // GET convertir un montant
  app.get('/convert', async (request, reply) => {
    const { amount, from = 'KMF', to = 'USD' } = request.query
    const amt = parseFloat(amount) || 0
    if (!amt) return reply.send({ original: 0, converted: 0, rate: 0, from, to })

    // Chercher le taux direct
    const { data: direct } = await supabase.from('currency_rates')
      .select('rate')
      .eq('from_currency', from)
      .eq('to_currency', to)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (direct) {
      const rate = parseFloat(direct.rate)
      return reply.send({ original: amt, converted: Math.round(amt * rate * 100) / 100, rate, from, to })
    }

    // Chercher le taux inverse
    const { data: reverse } = await supabase.from('currency_rates')
      .select('rate')
      .eq('from_currency', to)
      .eq('to_currency', from)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (reverse) {
      const rate = 1 / parseFloat(reverse.rate)
      return reply.send({ original: amt, converted: Math.round(amt * rate * 100) / 100, rate, from, to })
    }

    // Pas de taux trouvé
    return reply.send({ original: amt, converted: null, rate: null, from, to, error: 'Taux non disponible' })
  })
}
