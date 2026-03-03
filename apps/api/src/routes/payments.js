import { supabase } from '../config.js'

export default async function paymentsRoutes(app) {

  // ── ACHAT / LOCATION TRACK ──
  app.post('/api/payments/track', { preHandler: [app.authenticate] }, async (request, reply) => {
    const { track_id, type, period } = request.body
    if (!track_id || !type) return reply.status(400).send({ error: 'track_id et type requis' })

    const { data: track } = await supabase.from('tracks')
      .select('id,title,sale_price,rental_price_day,rental_price_week,rental_price_month,currency,user_id,access_type')
      .eq('id', track_id).single()
    if (!track) return reply.status(404).send({ error: 'Track introuvable' })

    let amount = 0, expires_at = null
    if (type === 'purchase') { amount = track.sale_price || 0 }
    else if (type === 'rental') {
      const map = { day:[track.rental_price_day,1], week:[track.rental_price_week,7], month:[track.rental_price_month,30] }
      const [price, days] = map[period] || [0,1]
      amount = price || 0
      const exp = new Date(); exp.setDate(exp.getDate() + days); expires_at = exp.toISOString()
    }
    if (amount <= 0) return reply.status(400).send({ error: 'Prix invalide' })

    const { data: buyer } = await supabase.from('profiles').select('wallet_balance').eq('id', request.user.id).single()
    if (!buyer) return reply.status(404).send({ error: 'Profil introuvable' })
    if ((buyer.wallet_balance || 0) < amount) return reply.status(400).send({ error: 'Solde insuffisant', balance: buyer.wallet_balance || 0, required: amount })

    const net = Math.floor(amount * 0.9)
    await supabase.from('profiles').update({ wallet_balance: buyer.wallet_balance - amount }).eq('id', request.user.id)
    const { data: artist } = await supabase.from('profiles').select('wallet_balance').eq('id', track.user_id).single()
    if (artist) await supabase.from('profiles').update({ wallet_balance: (artist.wallet_balance || 0) + net }).eq('id', track.user_id)

    const { data: tx } = await supabase.from('transactions').insert({
      user_id: request.user.id, recipient_id: track.user_id,
      type: type === 'purchase' ? 'purchase' : 'rental',
      amount, net_amount: net, currency: track.currency || 'KMF',
      description: type === 'purchase' ? 'Achat: ' + track.title : 'Location (' + period + '): ' + track.title,
      status: 'completed', gateway: 'wallet'
    }).select().single()

    await supabase.from('track_access').upsert({
      track_id, user_id: request.user.id, type, expires_at, transaction_id: tx?.id
    }, { onConflict: 'track_id,user_id' })

    return { status: 'completed', message: track.title + ' ' + (type === 'purchase' ? 'achete' : 'loue'), new_balance: buyer.wallet_balance - amount }
  })

  // ── RECHARGE WALLET ──
  app.post('/api/payments/recharge', { preHandler: [app.authenticate] }, async (request, reply) => {
    const { amount, gateway = 'huri_money', phone } = request.body
    if (!amount || amount < 100) return reply.status(400).send({ error: 'Montant minimum 100 KMF' })

    const { data: profile } = await supabase.from('profiles').select('wallet_balance').eq('id', request.user.id).single()
    const newBalance = (profile?.wallet_balance || 0) + amount
    await supabase.from('profiles').update({ wallet_balance: newBalance }).eq('id', request.user.id)
    await supabase.from('transactions').insert({
      user_id: request.user.id, type: 'recharge', amount, net_amount: amount,
      currency: 'KMF', description: 'Recharge via ' + gateway,
      status: 'completed', gateway, metadata: { phone }
    })
    return { status: 'completed', new_balance: newBalance, amount }
  })

  // ── ACHAT BILLET ──
  app.post('/api/payments/ticket', { preHandler: [app.authenticate] }, async (request, reply) => {
    const { event_id, quantity = 1 } = request.body
    const { data: event } = await supabase.from('events')
      .select('id,title,ticket_price,currency,is_free,creator_id,capacity,tickets_sold').eq('id', event_id).single()
    if (!event) return reply.status(404).send({ error: 'Evenement introuvable' })

    if (event.is_free || !event.ticket_price) {
      await supabase.from('event_tickets').insert({ event_id, user_id: request.user.id, quantity, amount_paid: 0, status: 'confirmed' })
      return { status: 'completed', message: 'Inscription gratuite confirmee', free: true }
    }

    const amount = event.ticket_price * quantity
    const { data: buyer } = await supabase.from('profiles').select('wallet_balance').eq('id', request.user.id).single()
    if (!buyer) return reply.status(404).send({ error: 'Profil introuvable' })
    if ((buyer.wallet_balance || 0) < amount) return reply.status(400).send({ error: 'Solde insuffisant', balance: buyer.wallet_balance || 0, required: amount })

    const net = Math.floor(amount * 0.9)
    await supabase.from('profiles').update({ wallet_balance: buyer.wallet_balance - amount }).eq('id', request.user.id)
    const { data: creator } = await supabase.from('profiles').select('wallet_balance').eq('id', event.creator_id).single()
    if (creator) await supabase.from('profiles').update({ wallet_balance: (creator.wallet_balance || 0) + net }).eq('id', event.creator_id)

    const { data: tx } = await supabase.from('transactions').insert({
      user_id: request.user.id, recipient_id: event.creator_id,
      type: 'ticket', amount, net_amount: net, currency: event.currency || 'KMF',
      description: 'Billet x' + quantity + ': ' + event.title,
      status: 'completed', gateway: 'wallet'
    }).select().single()

    await supabase.from('event_tickets').insert({ event_id, user_id: request.user.id, quantity, amount_paid: amount, status: 'confirmed', transaction_id: tx?.id })
    await supabase.from('events').update({ tickets_sold: (event.tickets_sold || 0) + quantity }).eq('id', event_id)
    return { status: 'completed', message: quantity + ' billet(s) pour ' + event.title, new_balance: buyer.wallet_balance - amount }
  })

  // ── SOLDE WALLET ──
  app.get('/api/wallet/balance', { preHandler: [app.authenticate] }, async (request, reply) => {
    const { data } = await supabase.from('profiles').select('wallet_balance,currency').eq('id', request.user.id).single()
    return { balance: data?.wallet_balance || 0, currency: data?.currency || 'KMF' }
  })

  // ── HISTORIQUE TRANSACTIONS ──
  app.get('/api/payments/history', { preHandler: [app.authenticate] }, async (request, reply) => {
    const { data, error } = await supabase.from('transactions')
      .select('*').eq('user_id', request.user.id)
      .order('created_at', { ascending: false }).limit(50)
    if (error) return reply.status(500).send({ error: error.message })
    return { transactions: data }
  })

  // ── TICKETS ACHETES ──
  app.get('/api/payments/tickets', { preHandler: [app.authenticate] }, async (request, reply) => {
    const { data, error } = await supabase.from('event_tickets')
      .select('*, events(id,title,event_date,location,cover_url)')
      .eq('user_id', request.user.id).order('created_at', { ascending: false })
    if (error) return reply.status(500).send({ error: error.message })
    return { tickets: data }
  })
}
