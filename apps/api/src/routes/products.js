import { supabase } from '../config.js'

export default async function productsRoutes(fastify) {

  // GET tous les produits publics
  fastify.get('/api/products', async (req, reply) => {
    const { category, sort = 'created_at', seller_id } = req.query
    let query = supabase.from('products').select('*, profiles(username, display_name, avatar_url, is_verified), tracks(id, title, cover_url, play_count, genre), albums:tracks(id, title, cover_url)').eq('is_active', true)
    if (category) query = query.eq('category', category)
    if (seller_id) query = query.eq('user_id', seller_id)
    query = query.order(sort === 'price_asc' ? 'price' : sort === 'price_desc' ? 'price' : 'created_at', { ascending: sort === 'price_asc' })
    const { data, error } = await query
    if (error) return reply.status(500).send({ error: error.message })
    return { products: data }
  })

  // GET mes produits
  fastify.get('/api/products/mine', { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const { data, error } = await supabase.from('products').select('*').eq('user_id', req.user.id).order('created_at', { ascending: false })
    if (error) return reply.status(500).send({ error: error.message })
    return { products: data }
  })

  // GET un produit
  fastify.get('/api/products/:id', async (req, reply) => {
    const { data, error } = await supabase.from('products').select('*, profiles(username, display_name, avatar_url, is_verified)').eq('id', req.params.id).single()
    if (error) return reply.status(404).send({ error: 'Produit introuvable' })
    return { product: data }
  })

  // POST creer produit
  fastify.post('/api/products', { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const { name, description, category, price, currency, emoji, cover_url, background, stock, tags, content_id, content_type } = req.body
    if (!name || !price) return reply.status(400).send({ error: 'name et price requis' })
    const { data, error } = await supabase.from('products').insert({
      user_id: req.user.id, name, description,
      category: category || 'digital',
      price: parseInt(price),
      currency: currency || 'KMF',
      emoji: emoji || '🛍️',
      cover_url, background, stock: stock ?? -1,
      tags: tags || [],
      content_id: content_id || null,
      content_type: content_type || null
    }).select().single()
    if (error) return reply.status(500).send({ error: error.message })
    return { product: data }
  })

  // PATCH modifier produit
  fastify.patch('/api/products/:id', { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const allowed = ['name','description','price','category','emoji','cover_url','background','stock','is_active','tags']
    const updates = {}
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k] })
    updates.updated_at = new Date().toISOString()
    const { data, error } = await supabase.from('products').update(updates).eq('id', req.params.id).eq('user_id', req.user.id).select().single()
    if (error) return reply.status(500).send({ error: error.message })
    return { product: data }
  })

  // DELETE supprimer
  fastify.delete('/api/products/:id', { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const { error } = await supabase.from('products').delete().eq('id', req.params.id).eq('user_id', req.user.id)
    if (error) return reply.status(500).send({ error: error.message })
    return { success: true }
  })

  // POST acheter un produit (depuis wallet)
  fastify.post('/api/products/:id/buy', { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const { data: product, error: pErr } = await supabase.from('products').select('*').eq('id', req.params.id).single()
    if (pErr || !product) return reply.status(404).send({ error: 'Produit introuvable' })
    if (!product.is_active) return reply.status(400).send({ error: 'Produit indisponible' })

    const { data: buyer, error: bErr } = await supabase.from('profiles').select('wallet_balance').eq('id', req.user.id).single()
    if (bErr) return reply.status(500).send({ error: bErr.message })
    if (buyer.wallet_balance < product.price) return reply.status(400).send({ error: 'Solde insuffisant', balance: buyer.wallet_balance, required: product.price })

    // Debiter acheteur
    await supabase.from('profiles').update({ wallet_balance: buyer.wallet_balance - product.price }).eq('id', req.user.id)

    // Crediter vendeur (90%)
    const net = Math.floor(product.price * 0.9)
    const { data: seller } = await supabase.from('profiles').select('wallet_balance').eq('id', product.user_id).single()
    if (seller) await supabase.from('profiles').update({ wallet_balance: (seller.wallet_balance||0) + net }).eq('id', product.user_id)

    // Transaction
    const { data: tx } = await supabase.from('transactions').insert({
      user_id: req.user.id, recipient_id: product.user_id,
      type: 'purchase', amount: product.price, net_amount: net,
      currency: product.currency || 'KMF',
      description: 'Achat: ' + product.name,
      status: 'completed', gateway: 'wallet'
    }).select().single()

    // Enregistrer achat
    await supabase.from('product_purchases').insert({
      product_id: product.id, buyer_id: req.user.id,
      seller_id: product.user_id, transaction_id: tx?.id,
      amount: product.price, currency: product.currency || 'KMF'
    })

    // Incrementer sold_count
    await supabase.from('products').update({ sold_count: (product.sold_count||0) + 1 }).eq('id', product.id)

    return { status: 'completed', message: `${product.name} achete avec succes`, new_balance: buyer.wallet_balance - product.price }
  })
}
