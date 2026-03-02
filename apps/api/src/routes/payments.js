import { supabase } from '../config.js'

export default async function paymentsRoutes(app) {

  // INITIER UN PAIEMENT USSD (achat ou location)
  app.post('/initiate', { preHandler: app.authenticate }, async (request, reply) => {
    const { track_id, type, period, phone, currency = 'KMF', gateway = 'huri_money' } = request.body
    if (!track_id || !type || !phone) {
      return reply.status(400).send({ error: 'track_id, type et phone requis' })
    }

    // Recuperer le son
    const { data: track } = await supabase.from('tracks')
      .select('id, title, creator_id, access_type, sale_price, sale_currency, rent_price_day, rent_price_week, rent_price_month, rent_price_year, rent_currency')
      .eq('id', track_id).single()
    if (!track) return reply.status(404).send({ error: 'Son introuvable' })

    // Verifier acces existant
    if (type === 'purchase') {
      const { data: existing } = await supabase.from('track_access')
        .select('id').eq('user_id', request.user.id).eq('track_id', track_id).single()
      if (existing) return reply.status(409).send({ error: 'Vous possedez deja ce son' })
    }

    // Calculer montant
    let amount = 0
    let rentalPeriod = null
    if (type === 'purchase') {
      amount = track.sale_price
    } else if (type === 'rental') {
      if (!period) return reply.status(400).send({ error: 'Periode requise pour location' })
      const prices = { day: track.rent_price_day, week: track.rent_price_week, month: track.rent_price_month, year: track.rent_price_year }
      amount = prices[period]
      rentalPeriod = period
      if (!amount) return reply.status(400).send({ error: 'Prix non defini pour cette periode' })
    }
    if (amount <= 0) return reply.status(400).send({ error: 'Prix invalide' })

    // Calculer commission et taxe
    const { data: fees } = await supabase.rpc('calculate_transaction_fees', {
      amount, tx_type: type === 'purchase' ? 'purchase' : 'rental', country: 'KM'
    })
    const feeRow = fees?.[0]
    const commission = feeRow?.commission || Math.round(amount * 0.15)
    const taxAmount = feeRow?.tax_amount || 0
    const total = amount + taxAmount

    // Creer transaction en attente
    const { data: tx, error: txError } = await supabase.from('transactions').insert({
      user_id: request.user.id,
      recipient_id: track.creator_id,
      track_id,
      type: type === 'purchase' ? 'purchase' : 'rental',
      status: 'pending',
      amount,
      currency,
      fee: commission,
      net_amount: amount - commission,
      gateway,
      phone_number: phone,
      description: type === 'purchase' ? `Achat: ${track.title}` : `Location ${period}: ${track.title}`,
      metadata: { period: rentalPeriod, tax_amount: taxAmount, total },
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
    }).select().single()
    if (txError) return reply.status(500).send({ error: txError.message })

    // Simulation USSD push (en production: appel API Africa Talking / Huri Money)
    const ussdMessage = `Waiichia - Confirmez le paiement de ${total.toLocaleString()} ${currency} pour "${track.title}" ?`
    
    // En production ce serait:
    // await africasTalking.payments.mobileCheckout({ productName: 'Waiichia', phoneNumber: phone, amount: total, currencyCode: currency, metadata: { tx_id: tx.id } })

    return reply.status(202).send({
      status: 'pending',
      message: 'Verification en cours. Confirmez sur votre telephone.',
      transaction_id: tx.id,
      amount: total,
      currency,
      ussd_message: ussdMessage,
      expires_in: 600
    })
  })

  // WEBHOOK PAIEMENT (callback operateur)
  app.post('/webhook/:gateway', async (request, reply) => {
    const { gateway } = request.params
    const body = request.body
    app.log.info({ gateway, body }, 'Webhook paiement recu')

    let txRef, status
    if (gateway === 'africa_talking') {
      txRef = body.requestMetadata?.tx_id
      status = body.status === 'Success' ? 'completed' : 'failed'
    } else if (gateway === 'huri_money') {
      txRef = body.transaction_id
      status = body.status === 'SUCCESS' ? 'completed' : 'failed'
    } else if (gateway === 'orange_money') {
      txRef = body.txid
      status = body.code === '200' ? 'completed' : 'failed'
    } else {
      return reply.status(400).send({ error: 'Gateway inconnu' })
    }

    const { data: tx } = await supabase.from('transactions')
      .select('*').eq('id', txRef).single()
    if (!tx) return reply.status(404).send({ error: 'Transaction introuvable' })
    if (tx.status !== 'pending') return reply.send({ ok: true })

    await supabase.from('transactions').update({
      status, gateway_status: body.status,
      completed_at: status === 'completed' ? new Date().toISOString() : null
    }).eq('id', tx.id)

    if (status === 'completed') {
      if (tx.type === 'purchase') {
        await supabase.from('track_access').insert({ user_id: tx.user_id, track_id: tx.track_id })
        await supabase.rpc('increment_play_count', { track_uuid: tx.track_id })
      } else if (tx.type === 'rental') {
        const period = tx.metadata?.period || 'week'
        const durations = { day: 1, week: 7, month: 30, year: 365 }
        const days = durations[period] || 7
        const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
        await supabase.from('rentals').insert({
          user_id: tx.user_id, track_id: tx.track_id,
          period, price_paid: tx.amount, currency: tx.currency,
          expires_at: expiresAt, auto_renew: false
        })
      }
      // Crediter le createur
      await supabase.rpc('add_to_wallet', { user_uuid: tx.recipient_id, amount: tx.net_amount })
      // Creer facture
      const { data: profile } = await supabase.from('profiles')
        .select('display_name, phone, country').eq('id', tx.user_id).single()
      await supabase.from('invoices').insert({
        user_id: tx.user_id, transaction_id: tx.id,
        invoice_type: tx.type,
        client_name: profile?.display_name || 'Client',
        client_phone: profile?.phone || tx.phone_number,
        client_country: profile?.country || 'KM',
        subtotal: tx.amount, commission: tx.fee,
        tax_rate: tx.metadata?.tax_rate || 0.09,
        tax_amount: tx.metadata?.tax_amount || 0,
        total: tx.metadata?.total || tx.amount,
        currency: tx.currency,
        line_items: JSON.stringify([{ desc: tx.description, qty: 1, unit: tx.amount, total: tx.amount }]),
        status: 'paid', paid_at: new Date().toISOString()
      })
    }
    return reply.send({ ok: true })
  })

  // SIMULER CONFIRMATION (pour tests sans vrai operateur)
  app.post('/simulate-confirm/:tx_id', async (request, reply) => {
    const { tx_id } = request.params
    const { success = true } = request.body
    const status = success ? 'completed' : 'failed'
    const { data: tx } = await supabase.from('transactions')
      .select('*').eq('id', tx_id).single()
    if (!tx) return reply.status(404).send({ error: 'Transaction introuvable' })
    await supabase.from('transactions').update({
      status, completed_at: new Date().toISOString()
    }).eq('id', tx_id)
    if (status === 'completed') {
      if (tx.type === 'purchase') {
        await supabase.from('track_access').insert({ user_id: tx.user_id, track_id: tx.track_id })
      } else if (tx.type === 'rental') {
        const period = tx.metadata?.period || 'week'
        const durations = { day: 1, week: 7, month: 30, year: 365 }
        const days = durations[period] || 7
        const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
        await supabase.from('rentals').insert({
          user_id: tx.user_id, track_id: tx.track_id,
          period, price_paid: tx.amount, currency: tx.currency,
          expires_at: expiresAt, auto_renew: false
        })
      }
      await supabase.from('profiles').update({
        wallet_balance: supabase.raw(`wallet_balance + ${tx.net_amount}`)
      }).eq('id', tx.recipient_id)
    }
    return reply.send({ status, transaction_id: tx_id, message: status === 'completed' ? 'Paiement confirme' : 'Paiement echoue' })
  })

  // RECHARGER LE WALLET
  app.post('/recharge', { preHandler: app.authenticate }, async (request, reply) => {
    const { amount, phone, gateway = 'huri_money' } = request.body
    if (!amount || amount < 100) return reply.status(400).send({ error: 'Montant minimum 100 KMF' })
    if (!phone) return reply.status(400).send({ error: 'Numero de telephone requis' })

    // Creer transaction recharge en attente
    const { data: tx, error } = await supabase.from('transactions').insert({
      user_id: request.user.id,
      type: 'recharge',
      status: 'pending',
      amount,
      currency: 'KMF',
      fee: 0,
      net_amount: amount,
      gateway,
      phone_number: phone,
      description: `Recharge wallet: ${amount.toLocaleString()} KMF`,
      metadata: { phone, gateway },
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
    }).select().single()
    if (error) return reply.status(500).send({ error: error.message })

    // Simulation: crediter immediatement (en prod: attendre webhook operateur)
    await supabase.from('profiles')
      .update({ wallet_balance: supabase.rpc ? undefined : undefined })
      .eq('id', request.user.id)

    // Recuperer solde actuel et incrementer
    const { data: profile } = await supabase.from('profiles')
      .select('wallet_balance').eq('id', request.user.id).single()
    const newBalance = (profile?.wallet_balance || 0) + amount
    await supabase.from('profiles').update({ wallet_balance: newBalance }).eq('id', request.user.id)
    await supabase.from('transactions').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', tx.id)

    return reply.send({
      status: 'completed',
      message: `${amount.toLocaleString()} KMF ajoutes a votre portefeuille`,
      new_balance: newBalance,
      transaction_id: tx.id
    })
  })


  // ACHETER UN BILLET EVENEMENT
  app.post('/ticket', { preHandler: app.authenticate }, async (request, reply) => {
    const { event_id, quantity = 1, phone, gateway = 'huri_money' } = request.body
    if (!event_id || !phone) return reply.status(400).send({ error: 'event_id et phone requis' })

    const { data: event } = await supabase.from('events')
      .select('id, title, ticket_price, currency, is_free, creator_id, capacity, tickets_sold')
      .eq('id', event_id).single()
    if (!event) return reply.status(404).send({ error: 'Evenement introuvable' })
    if (event.is_free) return reply.status(400).send({ error: 'Cet evenement est gratuit' })

    // Verifier capacite
    if (event.capacity && (event.tickets_sold + quantity) > event.capacity)
      return reply.status(409).send({ error: 'Plus de places disponibles' })

    // Verifier si deja achete
    const { data: existing } = await supabase.from('event_tickets')
      .select('id').eq('event_id', event_id).eq('user_id', request.user.id).eq('status', 'confirmed').single()
    if (existing) return reply.status(409).send({ error: 'Vous avez deja un billet pour cet evenement' })

    const amount = event.ticket_price * quantity
    const commission = Math.round(amount * 0.10)
    const net_amount = amount - commission

    // Verifier solde wallet
    const { data: buyer } = await supabase.from('profiles')
      .select('wallet_balance, currency').eq('id', request.user.id).single()
    if (!buyer) return reply.status(404).send({ error: 'Profil introuvable' })
    if ((buyer.wallet_balance || 0) < amount)
      return reply.status(402).send({
        error: 'Solde insuffisant',
        balance: buyer.wallet_balance || 0,
        required: amount,
        currency: event.currency || 'KMF'
      })

    // Debiter le wallet acheteur
    const { error: debitError } = await supabase.from('profiles')
      .update({ wallet_balance: (buyer.wallet_balance - amount) })
      .eq('id', request.user.id)
    if (debitError) return reply.status(500).send({ error: 'Erreur debit wallet' })

    // Crediter le createur
    const { data: creator } = await supabase.from('profiles')
      .select('wallet_balance').eq('id', event.creator_id).single()
    await supabase.from('profiles')
      .update({ wallet_balance: ((creator?.wallet_balance || 0) + net_amount) })
      .eq('id', event.creator_id)

    // Creer transaction
    const { data: tx, error: txError } = await supabase.from('transactions').insert({
      user_id: request.user.id,
      recipient_id: event.creator_id,
      type: 'purchase',
      status: 'completed',
      amount,
      currency: event.currency || 'KMF',
      fee: commission,
      net_amount,
      gateway: 'wallet',
      description: `Billet x${quantity}: ${event.title}`,
      metadata: { event_id, quantity },
      completed_at: new Date().toISOString()
    }).select().single()
    if (txError) return reply.status(500).send({ error: txError.message })

    // Creer billet confirme
    const { data: ticket } = await supabase.from('event_tickets').insert({
      event_id,
      user_id: request.user.id,
      transaction_id: tx.id,
      quantity,
      amount,
      currency: event.currency || 'KMF',
      status: 'confirmed',
      phone_number: phone
    }).select().single()

    // Mettre a jour tickets_sold
    await supabase.from('events')
      .update({ tickets_sold: (event.tickets_sold || 0) + quantity })
      .eq('id', event_id)

    return reply.status(201).send({
      status: 'confirmed',
      message: `Billet confirme ! ${amount.toLocaleString()} ${event.currency||'KMF'} debite de votre portefeuille`,
      transaction_id: tx.id,
      ticket_id: ticket.id,
      ticket_code: ticket.ticket_code,
      amount,
      new_balance: buyer.wallet_balance - amount,
      currency: event.currency || 'KMF',
    })
  })

  // CONFIRMER BILLET (simulation)
  app.post('/ticket/confirm/:tx_id', async (request, reply) => {
    const { tx_id } = request.params
    const { success = true } = request.body

    const { data: tx } = await supabase.from('transactions').select('*').eq('id', tx_id).single()
    if (!tx) return reply.status(404).send({ error: 'Transaction introuvable' })

    const status = success ? 'completed' : 'failed'
    await supabase.from('transactions').update({ status, completed_at: new Date().toISOString() }).eq('id', tx_id)

    if (success) {
      const event_id = tx.metadata?.event_id
      const quantity = tx.metadata?.quantity || 1
      await supabase.from('event_tickets').update({ status: 'confirmed' }).eq('transaction_id', tx_id)
      await supabase.from('events').update({ tickets_sold: supabase.raw(`tickets_sold + ${quantity}`) }).eq('id', event_id)
      await supabase.rpc('add_to_wallet', { user_uuid: tx.recipient_id, amount: tx.net_amount }).catch(()=>{})
    } else {
      await supabase.from('event_tickets').update({ status: 'cancelled' }).eq('transaction_id', tx_id)
    }

    return reply.send({ status, transaction_id: tx_id, message: success ? 'Billet confirme !' : 'Paiement echoue' })
  })

  // MES BILLETS
  app.get('/tickets', { preHandler: app.authenticate }, async (request, reply) => {
    const { data, error } = await supabase.from('event_tickets')
      .select('*, events:event_id(id, title, location, event_date, cover_url, country)')
      .eq('user_id', request.user.id)
      .order('created_at', { ascending: false })
    if (error) return reply.status(500).send({ error: error.message })
    return reply.send({ tickets: data })
  })


  // HISTORIQUE TRANSACTIONS
  app.get('/history', { preHandler: app.authenticate }, async (request, reply) => {
    const { page = 1, limit = 20 } = request.query
    const { data, error } = await supabase.from('transactions')
      .select('*, tracks:track_id(title, cover_url)')
      .eq('user_id', request.user.id)
      .order('created_at', { ascending: false })
      .range((page-1)*limit, page*limit-1)
    if (error) return reply.status(500).send({ error: error.message })
    return reply.send({ transactions: data })
  })

  // SOLDE WALLET
  app.get('/wallet', { preHandler: app.authenticate }, async (request, reply) => {
    const { data: profile } = await supabase.from('profiles')
      .select('wallet_balance, currency, ad_credit').eq('id', request.user.id).single()
    if (!profile) return reply.status(404).send({ error: 'Profil introuvable' })
    return reply.send({
      balance: profile.wallet_balance,
      currency: profile.currency,
      ad_credit: profile.ad_credit
    })
  })

  // LOCATIONS ACTIVES
  app.get('/rentals', { preHandler: app.authenticate }, async (request, reply) => {
    const { data, error } = await supabase.from('rentals')
      .select('*, tracks:track_id(id, title, cover_url, creator_id, profiles:creator_id(username, display_name))')
      .eq('user_id', request.user.id)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: true })
    if (error) return reply.status(500).send({ error: error.message })
    return reply.send({ rentals: data })
  })

  // ACTIVER AUTO-RENOUVELLEMENT
  app.patch('/rentals/:id/auto-renew', { preHandler: app.authenticate }, async (request, reply) => {
    const { id } = request.params
    const { enabled } = request.body
    const { data: rental } = await supabase.from('rentals')
      .select('user_id').eq('id', id).single()
    if (!rental) return reply.status(404).send({ error: 'Location introuvable' })
    if (rental.user_id !== request.user.id) return reply.status(403).send({ error: 'Non autorise' })
    await supabase.from('rentals').update({ auto_renew: enabled }).eq('id', id)
    return reply.send({ message: enabled ? 'Renouvellement automatique active' : 'Renouvellement automatique desactive' })
  })

  // FACTURES
  app.get('/invoices', { preHandler: app.authenticate }, async (request, reply) => {
    const { data, error } = await supabase.from('invoices')
      .select('*')
      .eq('user_id', request.user.id)
      .order('created_at', { ascending: false })
    if (error) return reply.status(500).send({ error: error.message })
    return reply.send({ invoices: data })
  })

  // DETAIL FACTURE
  app.get('/invoices/:id', { preHandler: app.authenticate }, async (request, reply) => {
    const { id } = request.params
    const { data, error } = await supabase.from('invoices')
      .select('*').eq('id', id).eq('user_id', request.user.id).single()
    if (error || !data) return reply.status(404).send({ error: 'Facture introuvable' })
    return reply.send({ invoice: data })
  })

}
