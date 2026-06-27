import { supabase } from '../config.js'
import { Notify } from '../utils/notify.js'

// ─────────────────────────────────────────────────────────────────
// Helper interne : credite le wallet d un user (update si existe, insert sinon).
// Toujours capture { data, error } et log en cas d echec.
// Retourne { ok: true } ou { ok: false, error }.
// ─────────────────────────────────────────────────────────────────
async function creditWallet(app, userId, amount, currency = 'KMF', tag = 'CREDIT') {
  const { data: existing, error: readErr } = await supabase
    .from('wallets')
    .select('balance')
    .eq('user_id', userId)
    .maybeSingle()

  if (readErr) {
    app.log.error({ userId, amount, tag, readErr }, '[' + tag + '] Read wallet failed')
    return { ok: false, error: readErr }
  }

  if (existing) {
    const newBalance = (existing.balance || 0) + amount
    const { error: updErr } = await supabase
      .from('wallets')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
    if (updErr) {
      app.log.error({ userId, amount, tag, updErr }, '[' + tag + '] Update wallet failed')
      return { ok: false, error: updErr }
    }
    app.log.info({ userId, amount, newBalance, tag }, '[' + tag + '] Wallet credited (update)')
    return { ok: true, newBalance }
  } else {
    const { error: insErr } = await supabase
      .from('wallets')
      .insert({ user_id: userId, balance: amount, currency })
    if (insErr) {
      app.log.error({ userId, amount, tag, insErr }, '[' + tag + '] Insert wallet failed')
      return { ok: false, error: insErr }
    }
    app.log.info({ userId, amount, tag }, '[' + tag + '] Wallet created (insert)')
    return { ok: true, newBalance: amount }
  }
}

// ─────────────────────────────────────────────────────────────────
// Helper interne : debite le wallet d un user. Echoue si solde insuffisant.
// ─────────────────────────────────────────────────────────────────
async function debitWallet(app, userId, amount, tag = 'DEBIT') {
  const { data: wallet, error: readErr } = await supabase
    .from('wallets')
    .select('balance')
    .eq('user_id', userId)
    .maybeSingle()

  if (readErr) {
    app.log.error({ userId, amount, tag, readErr }, '[' + tag + '] Read wallet failed')
    return { ok: false, error: readErr, balance: 0 }
  }

  const current = wallet?.balance || 0
  if (current < amount) {
    return { ok: false, insufficient: true, balance: current }
  }

  const newBalance = current - amount
  const { error: updErr } = await supabase
    .from('wallets')
    .update({ balance: newBalance, updated_at: new Date().toISOString() })
    .eq('user_id', userId)

  if (updErr) {
    app.log.error({ userId, amount, tag, updErr }, '[' + tag + '] Update wallet failed')
    return { ok: false, error: updErr, balance: current }
  }

  app.log.info({ userId, amount, newBalance, tag }, '[' + tag + '] Wallet debited')
  return { ok: true, newBalance }
}

export default async function paymentsRoutes(app) {

  // ── GET /api/payments/methods (public) : retourne les methodes actives ──
  app.get('/methods', async (req, reply) => {
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'payment_methods')
        .single()

      if (error || !data) {
        return reply.send({ methods: [] })
      }

      const raw = data.value || {}
      const methods = Object.entries(raw)
        .filter(([, v]) => v && v.enabled === true)
        .map(([key, v]) => ({
          key,
          name:         v.name || key,
          type:         v.type || 'other',
          phone:        v.phone        || null,
          iban:         v.iban         || null,
          swift:        v.swift        || null,
          bank_name:    v.bank_name    || null,
          client_id:    v.client_id    || null,
        }))

      return reply.send({ methods })
    } catch (err) {
      app.log.error(err)
      return reply.send({ methods: [] })
    }
  })

  // ── ACHAT / LOCATION TRACK ──
  app.post('/track', { preHandler: [app.authenticate] }, async (request, reply) => {
    const { track_id, type, period } = request.body
    if (!track_id || !type) return reply.status(400).send({ error: 'track_id et type requis' })

    const { data: track, error: trackErr } = await supabase.from('tracks')
      .select('id,title,sale_price,rental_price_day,rental_price_week,rental_price_month,currency,user_id,access_type')
      .eq('id', track_id).single()
    if (trackErr || !track) return reply.status(404).send({ error: 'Track introuvable' })

    let amount = 0, expires_at = null
    if (type === 'purchase') { amount = track.sale_price || 0 }
    else if (type === 'rental') {
      const map = { day:[track.rental_price_day,1], week:[track.rental_price_week,7], month:[track.rental_price_month,30] }
      const [price, days] = map[period] || [0,1]
      amount = price || 0
      const exp = new Date(); exp.setDate(exp.getDate() + days); expires_at = exp.toISOString()
    }
    if (amount <= 0) return reply.status(400).send({ error: 'Prix invalide' })

    // DEBIT buyer via wallets
    const deb = await debitWallet(app, request.user.id, amount, 'PAY-TRACK')
    if (!deb.ok) {
      if (deb.insufficient) return reply.status(400).send({ error: 'Solde insuffisant', balance: deb.balance, required: amount })
      return reply.status(500).send({ error: 'Erreur debit wallet: ' + (deb.error?.message || 'inconnue') })
    }

    // CREDIT artist (net apres commission 10%)
    const net = Math.floor(amount * 0.9)
    const cred = await creditWallet(app, track.user_id, net, track.currency || 'KMF', 'PAY-TRACK')
    if (!cred.ok) {
      // Rollback buyer
      app.log.warn({ track_id, buyer: request.user.id, artist: track.user_id }, '[PAY-TRACK] Credit artist failed, rolling back buyer')
      await creditWallet(app, request.user.id, amount, track.currency || 'KMF', 'PAY-TRACK-ROLLBACK')
      return reply.status(500).send({ error: 'Erreur credit vendeur: ' + (cred.error?.message || 'inconnue') })
    }

    // Enregistre transaction
    const { data: tx, error: txErr } = await supabase.from('transactions').insert({
      user_id: request.user.id, recipient_id: track.user_id,
      type: type === 'purchase' ? 'purchase' : 'rental',
      amount, net_amount: net, currency: track.currency || 'KMF',
      description: type === 'purchase' ? 'Achat: ' + track.title : 'Location (' + period + '): ' + track.title,
      status: 'completed', gateway: 'wallet'
    }).select().single()
    if (txErr) app.log.error({ txErr }, '[PAY-TRACK] Transaction insert failed')

    // Acces au track
    const { error: accessErr } = await supabase.from('track_access').upsert({
      track_id, user_id: request.user.id, type, expires_at, transaction_id: tx?.id
    }, { onConflict: 'track_id,user_id' })
    if (accessErr) app.log.error({ accessErr }, '[PAY-TRACK] track_access upsert failed')

    // Notification
    if (type === 'purchase') {
      Notify.purchase(request.user.id, track.user_id, request.user.username, track.title, amount, track.currency || 'KMF')
    } else {
      Notify.rental(request.user.id, track.user_id, request.user.username, track.title, period)
    }

    return { status: 'completed', message: track.title + ' ' + (type === 'purchase' ? 'achete' : 'loue'), new_balance: deb.newBalance }
  })

  // ── RECHARGE WALLET (demande en attente, validation admin) ──
  app.post('/recharge', { preHandler: [app.authenticate] }, async (request, reply) => {
    const { amount, gateway = 'huri_money', phone } = request.body
    if (!amount || amount < 100) return reply.status(400).send({ error: 'Montant minimum 100 KMF' })
    // WORKFLOW: ne PAS crediter immediatement. L admin valide apres paiement recu.
    const { data: tx, error } = await supabase.from('transactions').insert({
      user_id: request.user.id, type: 'recharge', amount, net_amount: amount,
      currency: 'KMF', description: 'Recharge via ' + gateway,
      status: 'pending', gateway, metadata: { phone }
    }).select().single()
    if (error) return reply.status(500).send({ error: 'Erreur creation demande: ' + error.message })
    return { status: 'pending', transaction_id: tx.id, amount, message: 'Demande enregistree. En attente de validation.' }
  })

  // ── ACHAT BILLET ──
  app.post('/ticket', { preHandler: [app.authenticate] }, async (request, reply) => {
    const { event_id, quantity = 1 } = request.body
    const { data: event, error: evErr } = await supabase.from('events')
      .select('id,title,ticket_price,currency,is_free,creator_id,capacity,tickets_sold').eq('id', event_id).single()
    if (evErr || !event) return reply.status(404).send({ error: 'Evenement introuvable' })

    // Evenement gratuit
    if (event.is_free || !event.ticket_price) {
      const { error: freeTicketErr } = await supabase.from('event_tickets').insert({
        event_id, user_id: request.user.id, quantity, amount_paid: 0, status: 'confirmed'
      })
      if (freeTicketErr) {
        app.log.error({ freeTicketErr }, '[PAY-TICKET] Free ticket insert failed')
        return reply.status(500).send({ error: 'Erreur inscription: ' + freeTicketErr.message })
      }
      Notify.ticket(request.user.id, event.creator_id, request.user.username, event.title, quantity)
      return { status: 'completed', message: 'Inscription gratuite confirmee', free: true }
    }

    // Evenement payant
    const amount = event.ticket_price * quantity

    // DEBIT buyer via wallets
    const deb = await debitWallet(app, request.user.id, amount, 'PAY-TICKET')
    if (!deb.ok) {
      if (deb.insufficient) return reply.status(400).send({ error: 'Solde insuffisant', balance: deb.balance, required: amount })
      return reply.status(500).send({ error: 'Erreur debit wallet: ' + (deb.error?.message || 'inconnue') })
    }

    // CREDIT creator (net apres commission 10%)
    const net = Math.floor(amount * 0.9)
    const cred = await creditWallet(app, event.creator_id, net, event.currency || 'KMF', 'PAY-TICKET')
    if (!cred.ok) {
      app.log.warn({ event_id, buyer: request.user.id, creator: event.creator_id }, '[PAY-TICKET] Credit creator failed, rolling back buyer')
      await creditWallet(app, request.user.id, amount, event.currency || 'KMF', 'PAY-TICKET-ROLLBACK')
      return reply.status(500).send({ error: 'Erreur credit organisateur: ' + (cred.error?.message || 'inconnue') })
    }

    // Enregistre transaction
    const { data: tx, error: txErr } = await supabase.from('transactions').insert({
      user_id: request.user.id, recipient_id: event.creator_id,
      type: 'ticket', amount, net_amount: net, currency: event.currency || 'KMF',
      description: 'Billet x' + quantity + ': ' + event.title,
      status: 'completed', gateway: 'wallet'
    }).select().single()
    if (txErr) app.log.error({ txErr }, '[PAY-TICKET] Transaction insert failed')

    // Enregistre le billet
    const { error: ticketErr } = await supabase.from('event_tickets').insert({
      event_id, user_id: request.user.id, quantity, amount_paid: amount, status: 'confirmed', transaction_id: tx?.id
    })
    if (ticketErr) app.log.error({ ticketErr }, '[PAY-TICKET] Ticket insert failed')

    // Increment tickets_sold
    const { error: countErr } = await supabase.from('events').update({
      tickets_sold: (event.tickets_sold || 0) + quantity
    }).eq('id', event_id)
    if (countErr) app.log.error({ countErr }, '[PAY-TICKET] tickets_sold update failed')

    // Notification
    Notify.ticket(request.user.id, event.creator_id, request.user.username, event.title, quantity)

    return { status: 'completed', message: quantity + ' billet(s) pour ' + event.title, new_balance: deb.newBalance }
  })

  // ── SOLDE WALLET (source unique: wallets) ──
  app.get('/wallet/balance', { preHandler: [app.authenticate] }, async (request, reply) => {
    const { data: wallet, error } = await supabase
      .from('wallets')
      .select('balance,currency')
      .eq('user_id', request.user.id)
      .maybeSingle()

    if (error) {
      app.log.error({ userId: request.user.id, error }, '[PAY-BALANCE] Read failed')
      return reply.status(500).send({ error: 'Erreur lecture solde' })
    }

    if (!wallet) {
      // Pas encore de wallet pour cet user -> retourne 0 (l insert se fera au premier credit)
      return { balance: 0, currency: 'KMF' }
    }

    return { balance: wallet.balance || 0, currency: wallet.currency || 'KMF' }
  })

  // ── HISTORIQUE TRANSACTIONS ──
  app.get('/history', { preHandler: [app.authenticate] }, async (request, reply) => {
    const { data, error } = await supabase.from('transactions')
      .select('*').or(`user_id.eq.${request.user.id},recipient_id.eq.${request.user.id}`)
      .order('created_at', { ascending: false }).limit(50)
    if (error) return reply.status(500).send({ error: error.message })
    return { transactions: data }
  })

  // ── RETRAIT ──
  app.post('/withdraw', { preHandler: [app.authenticate] }, async (request, reply) => {
    const { amount, method, destination, notes } = request.body
    if (!amount || amount < 500) return reply.status(400).send({ error: 'Montant minimum 500 KMF' })
    const { data: wallet, error: wErr } = await supabase.from('wallets').select('balance').eq('user_id', request.user.id).maybeSingle()
    if (wErr) return reply.status(500).send({ error: 'Erreur lecture solde' })
    if (!wallet || (wallet.balance || 0) < amount) return reply.status(400).send({ error: 'Solde insuffisant', balance: wallet?.balance || 0 })
    const fee = Math.floor(amount * 0.025)
    const { data, error } = await supabase.from('withdrawal_requests').insert({
      user_id: request.user.id, amount, currency: 'KMF', method: method || 'mvola', destination, notes, status: 'pending'
    }).select().single()
    if (error) return reply.status(500).send({ error: error.message })
    await supabase.from('transactions').insert({
      user_id: request.user.id, type: 'withdrawal', amount, fee, net_amount: amount - fee,
      currency: 'KMF', description: 'Retrait ' + (method || 'mvola') + ' → ' + (destination || ''), status: 'pending', gateway: method || 'mvola'
    })
    return reply.send({ withdrawal: data, message: 'Demande de retrait enregistree', fee })
  })

  // ── TRANSFERT ──
  app.post('/transfer', { preHandler: [app.authenticate] }, async (request, reply) => {
    const { to_username, amount, message } = request.body
    if (!to_username || !amount || amount < 100) return reply.status(400).send({ error: 'Destinataire et montant requis (min 100 KMF)' })

    const { data: recipient, error: rErr } = await supabase.from('profiles').select('id').eq('username', to_username.toLowerCase()).maybeSingle()
    if (rErr || !recipient) return reply.status(404).send({ error: 'Utilisateur introuvable' })
    if (recipient.id === request.user.id) return reply.status(400).send({ error: 'Impossible de transferer a vous-meme' })

    // DEBIT sender
    const deb = await debitWallet(app, request.user.id, amount, 'PAY-TRANSFER')
    if (!deb.ok) {
      if (deb.insufficient) return reply.status(400).send({ error: 'Solde insuffisant', balance: deb.balance })
      return reply.status(500).send({ error: 'Erreur debit: ' + (deb.error?.message || 'inconnue') })
    }

    const fee = Math.floor(amount * 0.01)
    const net = amount - fee

    // CREDIT recipient
    const cred = await creditWallet(app, recipient.id, net, 'KMF', 'PAY-TRANSFER')
    if (!cred.ok) {
      // Rollback sender
      app.log.warn({ from: request.user.id, to: recipient.id }, '[PAY-TRANSFER] Credit recipient failed, rolling back sender')
      await creditWallet(app, request.user.id, amount, 'KMF', 'PAY-TRANSFER-ROLLBACK')
      return reply.status(500).send({ error: 'Erreur credit destinataire: ' + (cred.error?.message || 'inconnue') })
    }

    // Record transfer
    await supabase.from('transfers').insert({ from_user_id: request.user.id, to_user_id: recipient.id, amount, currency: 'KMF', message, status: 'completed' })
    await supabase.from('transactions').insert({
      user_id: request.user.id, recipient_id: recipient.id, type: 'transfer', amount, fee, net_amount: net,
      currency: 'KMF', description: 'Transfert → @' + to_username + (message ? ' · ' + message : ''), status: 'completed', gateway: 'wallet'
    })

    Notify.transfer(request.user.id, recipient.id, request.user.username, net, 'KMF', message)

    return reply.send({ message: net + ' KMF transferes a @' + to_username, fee, new_balance: deb.newBalance })
  })

  // ── TICKETS ACHETES ──
  app.get('/tickets', { preHandler: [app.authenticate] }, async (request, reply) => {
    const { data, error } = await supabase.from('event_tickets')
      .select('*, events(id,title,event_date,location,cover_url)')
      .eq('user_id', request.user.id).order('created_at', { ascending: false })
    if (error) return reply.status(500).send({ error: error.message })
    return { tickets: data }
  })
}
