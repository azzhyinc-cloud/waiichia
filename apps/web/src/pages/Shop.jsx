import { useState, useEffect } from 'react'
import { useAuthStore, usePageStore } from '../stores/index.js'
import api from '../services/api.js'

const CATS = [['','Tout'],['merch','👕 Merch'],['digital','💿 Digital'],['coaching','🎓 Coaching'],['beats','🎵 Beats/Instru'],['autre','📦 Autre']]
const SORTS = [['created_at','Nouveautes'],['price_asc','Prix croissant'],['price_desc','Prix decroissant']]
const FLAGS = { KM:'🇰🇲', FR:'🇫🇷', NG:'🇳🇬', SN:'🇸🇳', MG:'🇲🇬' }
const formatK = (n) => { if(!n)return'0'; if(n>=1000)return(n/1000).toFixed(1)+'K'; return String(n) }

export default function Shop() {
  const { user } = useAuthStore()
  const { setPage } = usePageStore()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [cat, setCat] = useState('')
  const [sort, setSort] = useState('created_at')
  const [selected, setSelected] = useState(null)
  const [buying, setBuying] = useState(false)
  const [buyMsg, setBuyMsg] = useState(null)

  useEffect(() => { loadProducts() }, [cat, sort])

  const loadProducts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (cat) params.append('category', cat)
      if (sort) params.append('sort', sort)
      const data = await api.products.list('?' + params.toString())
      setProducts(data.products || [])
    } catch(e) {}
    setLoading(false)
  }

  const handleBuy = async (product) => {
    if (!user) { setPage('login'); return }
    setBuying(true)
    setBuyMsg(null)
    try {
      const res = await api.products.buy(product.id)
      setBuyMsg({ ok: true, text: res.message + ' · Solde: ' + (res.new_balance||0).toLocaleString() + ' KMF' })
      setProducts(ps => ps.map(p => p.id===product.id ? {...p, sold_count:(p.sold_count||0)+1} : p))
    } catch(e) {
      const msg = e.message?.includes('insuffisant') ? 'Solde insuffisant — Rechargez votre portefeuille' : (e.message || 'Erreur achat')
      setBuyMsg({ ok: false, text: msg })
    }
    setBuying(false)
  }

  const CAT_BG = { merch:'linear-gradient(135deg,#0d2a3a,#1a5060)', digital:'linear-gradient(135deg,#1a0020,#5a0060)', coaching:'linear-gradient(135deg,#002a10,#007040)', beats:'linear-gradient(135deg,#1a1000,#5a3800)', autre:'linear-gradient(135deg,#1a1a2e,#16213e)' }
  const CAT_EMOJI = { merch:'👕', digital:'💿', coaching:'🎓', beats:'🎵', autre:'📦' }

  return (
    <div style={{padding:'24px 20px 100px'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:12}}>
        <h1 style={{fontSize:24,fontWeight:900,margin:0}}>🛍️ Boutique Waiichia</h1>
        {user && <button onClick={()=>setPage('shop_mine')} style={{background:'var(--card)',border:'1px solid var(--border)',color:'var(--text)',borderRadius:8,padding:'8px 16px',cursor:'pointer',fontSize:13,fontWeight:600}}>🏪 Ma Boutique</button>}
      </div>

      {/* FILTRES */}
      <div style={{display:'flex',gap:8,marginBottom:20,flexWrap:'wrap',alignItems:'center'}}>
        <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
          {CATS.map(([v,l])=>(
            <button key={v} onClick={()=>setCat(v)}
              style={{padding:'6px 14px',borderRadius:99,border:'1px solid var(--border)',cursor:'pointer',fontSize:13,fontWeight:600,
                background:cat===v?'var(--primary)':'transparent',color:cat===v?'#fff':'var(--text2)'}}>
              {l}
            </button>
          ))}
        </div>
        <select onChange={e=>setSort(e.target.value)} value={sort}
          style={{marginLeft:'auto',background:'var(--card)',border:'1px solid var(--border)',borderRadius:8,padding:'7px 12px',color:'var(--text)',fontSize:13,cursor:'pointer'}}>
          {SORTS.map(([v,l])=><option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {/* GRILLE PRODUITS */}
      {loading ? (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(190px,1fr))',gap:14}}>
          {[...Array(6)].map((_,i)=><div key={i} className="skeleton" style={{height:260,borderRadius:12}}/>)}
        </div>
      ) : products.length===0 ? (
        <div style={{textAlign:'center',padding:80,color:'var(--text3)'}}>
          <div style={{fontSize:56,marginBottom:12}}>🛍️</div>
          <h3>Aucun produit disponible</h3>
          <p>Soyez le premier a vendre dans la boutique Waiichia !</p>
          {user && <button onClick={()=>setPage('shop_mine')} style={{marginTop:16,background:'var(--primary)',border:'none',color:'#fff',padding:'10px 24px',borderRadius:8,cursor:'pointer',fontWeight:700}}>Ouvrir ma boutique</button>}
        </div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(190px,1fr))',gap:14}}>
          {products.map(p=>(
            <div key={p.id} onClick={()=>setSelected(p)}
              style={{background:'var(--card)',borderRadius:12,border:'1px solid var(--border)',overflow:'hidden',cursor:'pointer',transition:'all 0.2s'}}
              onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-4px)';e.currentTarget.style.borderColor='rgba(44,198,83,0.4)'}}
              onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.borderColor='var(--border)'}}>
              <div style={{height:150,background:p.cover_url?'#000':(p.background||CAT_BG[p.category]||'var(--card2)'),display:'flex',alignItems:'center',justifyContent:'center',fontSize:48,position:'relative'}}>
                {p.cover_url ? <img src={p.cover_url} style={{width:'100%',height:'100%',objectFit:'cover',opacity:0.85}}/> : (p.emoji||CAT_EMOJI[p.category]||'🛍️')}
                <span style={{position:'absolute',top:8,right:8,background:'rgba(0,0,0,0.7)',borderRadius:6,padding:'2px 8px',fontSize:9,fontWeight:700,color:'#fff',letterSpacing:1}}>
                  {p.category?.toUpperCase()}
                </span>
              </div>
              <div style={{padding:'12px 14px'}}>
                <div style={{fontWeight:700,fontSize:13,marginBottom:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.name}</div>
                <div style={{fontSize:11,color:'var(--text2)',marginBottom:4}}>
                  {p.profiles ? `👤 ${p.profiles.display_name||p.profiles.username}` : ''}
                  {p.profiles?.is_verified ? ' ✓' : ''}
                </div>
                {p.tracks && (
                  <div style={{fontSize:11,color:'var(--gold)',marginBottom:8,display:'flex',alignItems:'center',gap:4,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                    🎵 {p.tracks.title}
                  </div>
                )}
                <div style={{fontSize:15,fontWeight:800,color:'#2cc653',fontFamily:'monospace',marginBottom:8}}>{(p.price||0).toLocaleString()} {p.currency||'KMF'}</div>
                <button onClick={e=>{e.stopPropagation();handleBuy(p)}} disabled={buying}
                  style={{width:'100%',background:'var(--primary)',border:'none',color:'#fff',borderRadius:8,padding:'8px',cursor:buying?'not-allowed':'pointer',fontWeight:700,fontSize:13}}>
                  🛒 Acheter
                </button>
              </div>
              <div style={{padding:'8px 14px',borderTop:'1px solid var(--border)',display:'flex',gap:8,fontSize:12,color:'var(--text3)'}}>
                <span>🛒 {p.sold_count||0} vendus</span>
                {p.stock>0 && <span style={{marginLeft:'auto',color:'var(--gold)'}}>📦 {p.stock} restants</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL BUY MESSAGE */}
      {buyMsg && (
        <div style={{position:'fixed',bottom:100,left:'50%',transform:'translateX(-50%)',background:buyMsg.ok?'rgba(44,198,83,0.95)':'rgba(230,57,70,0.95)',color:'#fff',padding:'12px 24px',borderRadius:12,fontSize:14,fontWeight:700,zIndex:1000,maxWidth:400,textAlign:'center'}}>
          {buyMsg.ok?'✅ ':'❌ '}{buyMsg.text}
          <button onClick={()=>setBuyMsg(null)} style={{marginLeft:12,background:'rgba(255,255,255,0.2)',border:'none',color:'#fff',borderRadius:6,padding:'2px 8px',cursor:'pointer'}}>✕</button>
          {!buyMsg.ok && buyMsg.text.includes('insuffisant') && (
            <div style={{marginTop:8}}><button onClick={()=>{setBuyMsg(null);setPage('wallet')}} style={{background:'rgba(255,255,255,0.2)',border:'none',color:'#fff',borderRadius:8,padding:'6px 14px',cursor:'pointer',fontWeight:700}}>💰 Recharger →</button></div>
          )}
        </div>
      )}

      {/* MODAL DETAIL PRODUIT */}
      {selected && (
        <div onClick={()=>{setSelected(null);setBuyMsg(null)}} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.9)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div onClick={e=>e.stopPropagation()} style={{background:'var(--card)',borderRadius:20,maxWidth:460,width:'100%',border:'1px solid var(--border)',overflow:'hidden'}}>
            <div style={{height:200,background:selected.cover_url?'#000':(selected.background||'var(--card2)'),display:'flex',alignItems:'center',justifyContent:'center',fontSize:72,position:'relative'}}>
              {selected.cover_url ? <img src={selected.cover_url} style={{width:'100%',height:'100%',objectFit:'cover',opacity:0.85}}/> : (selected.emoji||'🛍️')}
              <button onClick={()=>setSelected(null)} style={{position:'absolute',top:12,right:12,background:'rgba(0,0,0,0.6)',border:'none',color:'#fff',borderRadius:'50%',width:32,height:32,cursor:'pointer',fontSize:16}}>✕</button>
            </div>
            <div style={{padding:24}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
                <div>
                  <div style={{fontWeight:800,fontSize:18,marginBottom:4}}>{selected.name}</div>
                  <div style={{fontSize:12,color:'var(--text2)'}}>
                    {selected.profiles ? `👤 ${selected.profiles.display_name||selected.profiles.username}` : ''}
                    {selected.profiles?.is_verified ? ' ✓' : ''}
                  </div>
                </div>
                <div style={{fontSize:22,fontWeight:900,color:'#2cc653',fontFamily:'monospace'}}>{(selected.price||0).toLocaleString()} {selected.currency||'KMF'}</div>
              </div>
              {selected.description && <p style={{fontSize:14,color:'var(--text2)',marginBottom:16,lineHeight:1.6}}>{selected.description}</p>}
              <div style={{display:'flex',gap:12,fontSize:12,color:'var(--text3)',marginBottom:20}}>
                <span>🏷️ {selected.category}</span>
                <span>🛒 {selected.sold_count||0} vendus</span>
                {selected.stock>0 && <span style={{color:'var(--gold)'}}>📦 {selected.stock} en stock</span>}
              </div>
              {buyMsg && (
                <div style={{background:buyMsg.ok?'rgba(44,198,83,0.1)':'rgba(230,57,70,0.1)',border:`1px solid ${buyMsg.ok?'#2cc653':'#e74c3c'}`,borderRadius:10,padding:'10px 14px',marginBottom:16,fontSize:13,fontWeight:600,color:buyMsg.ok?'#2cc653':'#e74c3c'}}>
                  {buyMsg.ok?'✅ ':'❌ '}{buyMsg.text}
                </div>
              )}
              <button onClick={()=>handleBuy(selected)} disabled={buying}
                style={{width:'100%',background:'linear-gradient(135deg,#2cc653,#16a34a)',border:'none',color:'#fff',borderRadius:10,padding:'14px',cursor:buying?'not-allowed':'pointer',fontWeight:800,fontSize:16}}>
                {buying ? '⏳ Traitement...' : `🛒 Acheter — ${(selected.price||0).toLocaleString()} ${selected.currency||'KMF'}`}
              </button>
              {!buyMsg?.ok && <button onClick={()=>setPage('wallet')} style={{width:'100%',marginTop:8,background:'transparent',border:'1px solid var(--border)',color:'var(--text2)',borderRadius:10,padding:'10px',cursor:'pointer',fontSize:13}}>💰 Voir mon portefeuille</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
