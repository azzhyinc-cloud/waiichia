import { supabase } from '../config.js'
import { Notify } from '../utils/notify.js'

export default async function productsRoutes(fastify) {

  // GET tous les produits publics
  fastify.get('/', async (req, reply) => {
    const { category, sort = 'created_at', seller_id } = req.query
    let query = supabase.from('products').select('*, profiles:creator_id(username, display_name, avatar_url, is_verified)').eq('is_active', true)
    if (category) query = query.eq('category', category)
    if (seller_id) query = query.eq('user_id', seller_id)
    const { content_id } = req.query
    if (content_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(content_id)) query = query.eq('content_id', content_id)
    query = query.order(sort === 'price_asc' ? 'price' : sort === 'price_desc' ? 'price' : 'created_at', { ascending: sort === 'price_asc' })
    const { data, error } = await query
    if (error) return reply.status(500).send({ error: error.message })
    return { products: data }
  })

  // GET mes produits
  fastify.get('/mine', { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const { data, error } = await supabase.from('products')
      .select('*')
      .or(`user_id.eq.${req.user.id},creator_id.eq.${req.user.id}`)
      .order('created_at', { ascending: false })
    if (error) return reply.status(500).send({ error: error.message })
    return { products: data }
  })

  // GET un produit
  fastify.get('/:id', async (req, reply) => {
    const { data, error } = await supabase.from('products').select('*, profiles:creator_id(username, display_name, avatar_url, is_verified)').eq('id', req.params.id).single()
    if (error) return reply.status(404).send({ error: 'Produit introuvable' })
    return { product: data }
  })

  // POST creer produit
  fastify.post('/', { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const { name, description, category, price, currency, emoji, cover_url, background, stock, tags, content_id, content_type } = req.body
    if (!name || !price) return reply.status(400).send({ error: 'name et price requis' })
    const { data, error } = await supabase.from('products').insert({
      user_id: req.user.id, creator_id: req.user.id, name, description,
      category: category || 'digital',
      product_type: category || 'digital',
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

  // PATCH modifier produit — FIX: use or() for user_id/creator_id + maybeSingle
  fastify.patch('/:id', { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const allowed = ['name','description','price','category','emoji','cover_url','background','stock','is_active','tags']
    const updates = {}
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k] })
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', req.params.id)
      .or(`user_id.eq.${req.user.id},creator_id.eq.${req.user.id}`)
      .select()
      .maybeSingle()
    if (error) return reply.status(500).send({ error: error.message })
    if (!data) return reply.status(404).send({ error: 'Produit introuvable ou non autorisé' })
    return { product: data }
  })

  // DELETE supprimer — FIX: use or() for user_id/creator_id
  fastify.delete('/:id', { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', req.params.id)
      .or(`user_id.eq.${req.user.id},creator_id.eq.${req.user.id}`)
    if (error) return reply.status(500).send({ error: error.message })
    return { success: true }
  })

  // POST acheter un produit (depuis wallet)
  fastify.post('/:id/buy', { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const { data: product, error: pErr } = await supabase.from('products').select('*').eq('id', req.params.id).single()
    if (pErr || !product) return reply.status(404).send({ error: 'Produit introuvable' })
    if (!product.is_active) return reply.status(400).send({ error: 'Produit indisponible' })

    // Debiter wallet acheteur
    const { data: wBuyer } = await supabase.from('wallets').select('balance').eq('user_id', req.user.id).maybeSingle()
    const buyerBalance = wBuyer?.balance || 0
    if (buyerBalance < product.price) return reply.status(400).send({ error: 'Solde insuffisant', balance: buyerBalance, required: product.price })

    await supabase.from('wallets').update({ balance: buyerBalance - product.price }).eq('user_id', req.user.id)

    // Crediter vendeur (90%)
    const sellerId = product.creator_id || product.user_id
    const net = Math.floor(product.price * 0.9)
    const { data: wSeller } = await supabase.from('wallets').select('balance').eq('user_id', sellerId).maybeSingle()
    if (wSeller) {
      await supabase.from('wallets').update({ balance: (wSeller.balance || 0) + net }).eq('user_id', sellerId)
    }

    // Transaction
    const { data: tx } = await supabase.from('transactions').insert({
      user_id: req.user.id, recipient_id: sellerId,
      type: 'purchase', amount: product.price, net_amount: net,
      currency: product.currency || 'KMF',
      description: 'Achat: ' + product.name,
      status: 'completed', gateway: 'wallet'
    }).select().single()

    // Enregistrer achat
    await supabase.from('product_purchases').insert({
      product_id: product.id, buyer_id: req.user.id,
      seller_id: sellerId, transaction_id: tx?.id,
      amount: product.price, currency: product.currency || 'KMF'
    })

    // Incrementer sold_count
    await supabase.from('products').update({ sold_count: (product.sold_count || 0) + 1 }).eq('id', product.id)

    // Notification
    Notify.purchase(req.user.id, sellerId, req.user.username, product.name, product.price, product.currency || 'KMF')

    return { status: 'completed', message: `${product.name} achete avec succes`, new_balance: buyerBalance - product.price }
  })
}
