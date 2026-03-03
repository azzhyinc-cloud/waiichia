import { useState, useEffect } from 'react'
import { useAuthStore, usePageStore } from '../stores/index.js'
import api from '../services/api.js'

const CATS = [['merch','👕','Merch'],['digital','💿','Digital'],['coaching','🎓','Coaching'],['beats','🎵','Beats/Instru'],['autre','📦','Autre']]
const CAT_BG = { merch:'linear-gradient(135deg,#0d2a3a,#1a5060)', digital:'linear-gradient(135deg,#1a0020,#5a0060)', coaching:'linear-gradient(135deg,#002a10,#007040)', beats:'linear-gradient(135deg,#1a1000,#5a3800)', autre:'linear-gradient(135deg,#1a1a2e,#16213e)' }
const inp = {background:'var(--card)',border:'1px solid var(--border)',borderRadius:8,padding:'10px 14px',color:'var(--text)',width:'100%',fontSize:14,boxSizing:'border-box'}
const lbl = {display:'block',fontSize:11,fontWeight:700,letterSpacing:1,color:'var(--text3)',marginBottom:6}

export default function MyShop() {
  const { user } = useAuthStore()
  const { setPage } = usePageStore()
  const [products, setProducts] = useState([])
  const [myTracks, setMyTracks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [form, setForm] = useState({ name:'', description:'', category:'digital', price:'', currency:'KMF', emoji:'🛍️', stock:'-1', content_id:'', content_type:'track' })
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  useEffect(() => { if(user) { loadProducts(); loadTracks() } }, [user])
  const loadTracks = async () => {
    try {
      const data = await api.tracks.myTracks()
      setMyTracks(data.tracks || [])
    } catch(e) {}
  }

  const loadProducts = async () => {
    setLoading(true)
    try { const data = await api.products.mine(); setProducts(data.products||[]) } catch(e) {}
    setLoading(false)
  }

  const handleCreate = async () => {
    if (!form.name || !form.price) return
    setSaving(true)
    try {
      const res = await api.products.create({ ...form, price: parseInt(form.price), stock: parseInt(form.stock), background: CAT_BG[form.category], content_id: form.content_id||null, content_type: form.content_id?form.content_type:null })
      setProducts(p => [res.product, ...p])
      setShowForm(false)
      setForm({ name:'', description:'', category:'digital', price:'', currency:'KMF', emoji:'🛍️', stock:'-1' })
    } catch(e) {}
    setSaving(false)
  }

  const toggleActive = async (p) => {
    await api.products.update(p.id, { is_active: !p.is_active })
    setProducts(ps => ps.map(x => x.id===p.id ? {...x, is_active: !x.is_active} : x))
  }

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce produit ?')) return
    setDeleting(id)
    await api.products.delete(id)
    setProducts(ps => ps.filter(x => x.id!==id))
    setDeleting(null)
  }

  const totalRevenue = products.reduce((a,p) => a + ((p.sold_count||0)*p.price), 0)

  if (!user) return (
    <div style={{textAlign:'center',padding:80}}>
      <button onClick={()=>setPage('login')} style={{background:'var(--primary)',border:'none',color:'#fff',padding:'10px 24px',borderRadius:8,cursor:'pointer'}}>Se connecter</button>
    </div>
  )

  return (
    <div style={{padding:'24px 20px 100px'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:12}}>
        <div>
          <h1 style={{fontSize:24,fontWeight:900,margin:'0 0 4px'}}>🏪 Ma Boutique</h1>
          <p style={{color:'var(--text2)',fontSize:13,margin:0}}>Seuls les profils verifies peuvent vendre ✓</p>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={()=>setPage('shop')} style={{background:'var(--card)',border:'1px solid var(--border)',color:'var(--text)',borderRadius:8,padding:'8px 16px',cursor:'pointer',fontSize:13}}>🛍️ Voir la boutique</button>
          <button onClick={()=>setShowForm(!showForm)} style={{background:'linear-gradient(135deg,var(--gold),#e8920a)',border:'none',color:'#000',borderRadius:8,padding:'8px 16px',cursor:'pointer',fontWeight:700,fontSize:13}}>+ Ajouter produit</button>
        </div>
      </div>

      {/* STATS */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:12,marginBottom:24}}>
        {[
          { icon:'📦', val:products.length, label:'Produits', color:'#4d9fff' },
          { icon:'✅', val:products.filter(p=>p.is_active).length, label:'Actifs', color:'#2cc653' },
          { icon:'🛒', val:products.reduce((a,p)=>a+(p.sold_count||0),0), label:'Ventes', color:'var(--gold)' },
          { icon:'💰', val:totalRevenue.toLocaleString()+' KMF', label:'Revenus', color:'#a855f7' },
        ].map((s,i)=>(
          <div key={i} style={{background:'var(--card)',borderRadius:12,padding:16,border:'1px solid var(--border)'}}>
            <div style={{fontSize:24,marginBottom:6}}>{s.icon}</div>
            <div style={{fontSize:18,fontWeight:900,color:s.color}}>{s.val}</div>
            <div style={{fontSize:12,color:'var(--text2)',marginTop:4}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* FORMULAIRE AJOUT */}
      {showForm && (
        <div style={{background:'var(--card)',borderRadius:14,padding:24,border:'1px solid var(--gold)',marginBottom:24}}>
          <div style={{fontWeight:800,fontSize:16,marginBottom:20}}>➕ Nouveau produit</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
            <div><label style={lbl}>NOM *</label><input style={inp} value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Ex: Beat Pack Twarab Vol.1"/></div>
            <div><label style={lbl}>CATEGORIE</label>
              <select style={inp} value={form.category} onChange={e=>set('category',e.target.value)}>
                {CATS.map(([v,icon,l])=><option key={v} value={v}>{icon} {l}</option>)}
              </select>
            </div>
          </div>
          <div style={{marginBottom:14}}><label style={lbl}>DESCRIPTION</label><textarea style={{...inp,height:70,resize:'vertical'}} value={form.description} onChange={e=>set('description',e.target.value)} placeholder="Decrivez votre produit..."/></div>
          <div style={{marginBottom:14,background:'rgba(245,166,35,0.07)',border:'1px solid rgba(245,166,35,0.2)',borderRadius:10,padding:14}}>
            <label style={{...lbl,color:'var(--gold)'}}>🔗 LIER A UN CONTENU (obligatoire)</label>
            <p style={{fontSize:12,color:'var(--text2)',margin:'0 0 10px'}}>Chaque produit doit etre attache a un de vos sons, albums ou podcasts.</p>
            <div style={{display:'flex',gap:8,marginBottom:10}}>
              {['track','album','podcast'].map(t=>(
                <button key={t} type="button" onClick={()=>set('content_type',t)}
                  style={{padding:'5px 14px',borderRadius:99,border:'1px solid var(--border)',cursor:'pointer',fontSize:12,fontWeight:700,
                    background:form.content_type===t?'var(--primary)':'transparent',color:form.content_type===t?'#fff':'var(--text2)'}}>
                  {t==='track'?'🎵 Son':t==='album'?'💿 Album':'🎙️ Podcast'}
                </button>
              ))}
            </div>
            {myTracks.length===0 ? (
              <div style={{fontSize:12,color:'var(--text3)',padding:'10px 0'}}>⚠️ Aucun contenu publie — publiez d abord un son pour vendre un produit.</div>
            ) : (
              <select style={inp} value={form.content_id} onChange={e=>set('content_id',e.target.value)}>
                <option value="">-- Choisir un contenu --</option>
                {myTracks.map(t=>(
                  <option key={t.id} value={t.id}>{t.title} · {(t.play_count||0).toLocaleString()} ecoutes</option>
                ))}
              </select>
            )}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:14,marginBottom:20}}>
            <div><label style={lbl}>PRIX *</label><input type="number" style={inp} value={form.price} onChange={e=>set('price',e.target.value)} placeholder="5000"/></div>
            <div><label style={lbl}>DEVISE</label><select style={inp} value={form.currency} onChange={e=>set('currency',e.target.value)}>{['KMF','USD','EUR','XOF'].map(d=><option key={d}>{d}</option>)}</select></div>
            <div><label style={lbl}>EMOJI</label><input style={inp} value={form.emoji} onChange={e=>set('emoji',e.target.value)} placeholder="🛍️"/></div>
            <div><label style={lbl}>STOCK (-1 = illimite)</label><input type="number" style={inp} value={form.stock} onChange={e=>set('stock',e.target.value)}/></div>
          </div>
          <div style={{display:'flex',gap:10}}>
            <button onClick={()=>setShowForm(false)} style={{background:'var(--card)',border:'1px solid var(--border)',color:'var(--text)',borderRadius:8,padding:'10px 20px',cursor:'pointer',fontWeight:600}}>Annuler</button>
            <button onClick={handleCreate} disabled={saving||!form.name||!form.price||!form.content_id}
              style={{background:saving||!form.name||!form.price||!form.content_id?'var(--border)':'var(--primary)',border:'none',color:'#fff',borderRadius:8,padding:'10px 24px',cursor:saving?'not-allowed':'pointer',fontWeight:700,fontSize:14}}>
              {saving?'⏳ Sauvegarde...':'💾 Publier'}
            </button>
          </div>
        </div>
      )}

      {/* LISTE PRODUITS */}
      {loading ? (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:12}}>
          {[...Array(4)].map((_,i)=><div key={i} className="skeleton" style={{height:240,borderRadius:12}}/>)}
        </div>
      ) : products.length===0 ? (
        <div style={{textAlign:'center',padding:60,color:'var(--text3)'}}>
          <div style={{fontSize:56,marginBottom:12}}>🏪</div>
          <h3 style={{margin:'0 0 8px'}}>Boutique vide</h3>
          <p style={{marginBottom:20}}>Ajoutez votre premier produit et commencez a vendre !</p>
          <button onClick={()=>setShowForm(true)} style={{background:'var(--primary)',border:'none',color:'#fff',padding:'10px 24px',borderRadius:8,cursor:'pointer',fontWeight:700}}>+ Ajouter un produit</button>
        </div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:14}}>
          {products.map(p=>(
            <div key={p.id} style={{background:'var(--card)',borderRadius:12,border:`1px solid ${p.is_active?'var(--border)':'rgba(230,57,70,0.2)'}`,overflow:'hidden',opacity:p.is_active?1:0.65}}>
              <div style={{height:130,background:p.cover_url?'#000':(p.background||CAT_BG[p.category]||'var(--card2)'),display:'flex',alignItems:'center',justifyContent:'center',fontSize:40,position:'relative'}}>
                {p.cover_url ? <img src={p.cover_url} style={{width:'100%',height:'100%',objectFit:'cover',opacity:0.85}}/> : (p.emoji||'🛍️')}
                <span style={{position:'absolute',top:8,left:8,background:p.is_active?'rgba(44,198,83,0.9)':'rgba(230,57,70,0.9)',borderRadius:6,padding:'2px 8px',fontSize:10,fontWeight:700,color:'#fff'}}>
                  {p.is_active?'ACTIF':'INACTIF'}
                </span>
              </div>
              <div style={{padding:'12px 14px'}}>
                <div style={{fontWeight:700,fontSize:13,marginBottom:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.name}</div>
                <div style={{fontSize:15,fontWeight:800,color:'#2cc653',fontFamily:'monospace',marginBottom:6}}>{(p.price||0).toLocaleString()} {p.currency||'KMF'}</div>
                <div style={{fontSize:11,color:'var(--text3)',marginBottom:10}}>🛒 {p.sold_count||0} vendus · {p.stock<0?'Illimite':p.stock+' en stock'}</div>
                <div style={{display:'flex',gap:6}}>
                  <button onClick={()=>toggleActive(p)}
                    style={{flex:1,background:p.is_active?'rgba(230,57,70,0.1)':'rgba(44,198,83,0.1)',border:`1px solid ${p.is_active?'rgba(230,57,70,0.3)':'rgba(44,198,83,0.3)'}`,borderRadius:7,padding:'6px',cursor:'pointer',fontSize:12,fontWeight:600,color:p.is_active?'#e74c3c':'#2cc653'}}>
                    {p.is_active?'⏸ Pause':'▶ Activer'}
                  </button>
                  <button onClick={()=>handleDelete(p.id)} disabled={deleting===p.id}
                    style={{background:'rgba(230,57,70,0.1)',border:'1px solid rgba(230,57,70,0.3)',borderRadius:7,padding:'6px 10px',cursor:'pointer',fontSize:12,color:'#e74c3c'}}>
                    {deleting===p.id?'...':'🗑️'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
