import { useState, useEffect } from 'react'
import { usePlayerStore, usePageStore, useAuthStore } from '../stores/index.js'
import api from '../services/api.js'

const formatK = (n) => {
  if (!n) return '0'
  if (n >= 1000000) return (n/1000000).toFixed(1).replace('.0','') + 'M'
  if (n >= 1000) return (n/1000).toFixed(1).replace('.0','') + 'K'
  return n.toString()
}

const FLAGS = { KM:'🇰🇲', FR:'🇫🇷', NG:'🇳🇬', SN:'🇸🇳', CI:'🇨🇮', MA:'🇲🇦', TZ:'🇹🇿', MG:'🇲🇬', RW:'🇷🇼', CD:'🇨🇩' }
const PAYS = [['','Tous les pays'],['KM','Comores'],['FR','France'],['NG','Nigeria'],['SN','Senegal'],['MG','Madagascar'],['RW','Rwanda']]
const TYPES = [['','Tout'],['radio_live','Radio'],['emission','Emission']]
const LANGUES = [['','Toutes'],['fr','Francais'],['ar','Arabe'],['sw','Swahili'],['km','Comorien'],['en','Anglais']]
const CATS = [['','Toutes'],['Twarab & Varie','Twarab'],['Actualites','Actualites'],['Business','Business'],['Musique','Musique'],['Religion','Religion'],['Sport','Sport']]

export default function Radio() {
  const { toggle, currentTrack, isPlaying } = usePlayerStore()
  const { setPage } = usePageStore()
  const { user } = useAuthStore()
  const [stations, setStations] = useState([])
  const [loading, setLoading] = useState(true)
  const [pays, setPays] = useState('')
  const [type, setType] = useState('')
  const [langue, setLangue] = useState('')
  const [cat, setCat] = useState('')
  const [search, setSearch] = useState('')
  const [reactions, setReactions] = useState({})
  const [comments, setComments] = useState({})
  const [showComments, setShowComments] = useState(null)
  const [commentText, setCommentText] = useState('')

  useEffect(() => {
    setLoading(true)
    const q = new URLSearchParams()
    if (type) q.set('type', type)
    q.set('limit', '40')
    if (pays) q.set('country', pays)
    if (langue) q.set('language', langue)
    if (search) q.set('search', search)
    if (!type) {
      // Charger radio_live ET emission
      Promise.all([
        api.tracks.list('?' + new URLSearchParams({...Object.fromEntries(q), type:'radio_live'}).toString()),
        api.tracks.list('?' + new URLSearchParams({...Object.fromEntries(q), type:'emission'}).toString()),
      ]).then(([r1, r2]) => {
        setStations([...(r1.tracks||[]), ...(r2.tracks||[])])
        setLoading(false)
      }).catch(() => setLoading(false))
    } else {
      api.tracks.list('?' + q.toString()).then(res => {
        setStations(res.tracks || [])
        setLoading(false)
      }).catch(() => setLoading(false))
    }
  }, [pays, type, langue, search])

  const handleReact = async (stationId, emoji) => {
    try {
      await api.social.react({ target_type:'track', target_id:stationId, emoji })
      const r = await api.social.reactions('track', stationId)
      setReactions(prev => ({...prev, [stationId]: r.reactions||{}}))
    } catch(e) {}
  }

  const loadComments = async (id) => {
    const r = await api.social.comments('track', id)
    setComments(prev => ({...prev, [id]: r.comments||[]}))
  }

  const toggleComments = async (id) => {
    if (showComments === id) { setShowComments(null); return }
    setShowComments(id)
    await loadComments(id)
  }

  const sendComment = async (stationId) => {
    if (!commentText.trim() || !user) return
    await api.social.comment({ target_type:'track', target_id:stationId, content:commentText })
    setCommentText('')
    loadComments(stationId)
  }

  const sel = {background:'var(--card)',border:'1px solid var(--border)',borderRadius:8,padding:'8px 12px',color:'var(--text)',fontSize:13,cursor:'pointer',flex:1}

  return (
    <div style={{padding:'24px 20px 100px'}}>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:24}}>
        <div style={{fontSize:32}}>📻</div>
        <div>
          <h1 style={{fontSize:24,fontWeight:900,margin:0}}>Radio et Emissions Live</h1>
          <p style={{color:'var(--text2)',fontSize:13,margin:0}}>Ecoutez en direct depuis toute l Afrique</p>
        </div>
      </div>

      {/* FILTRES */}
      <div style={{background:'var(--card)',borderRadius:12,padding:16,marginBottom:20,border:'1px solid var(--border)'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:10}}>
          <div>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:1,color:'var(--text3)',marginBottom:6}}>🌍 PAYS</div>
            <select style={sel} value={pays} onChange={e=>setPays(e.target.value)}>
              {PAYS.map(([v,l])=><option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:1,color:'var(--text3)',marginBottom:6}}>📡 TYPE</div>
            <select style={sel} value={type} onChange={e=>setType(e.target.value)}>
              {TYPES.map(([v,l])=><option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:1,color:'var(--text3)',marginBottom:6}}>💬 LANGUE</div>
            <select style={sel} value={langue} onChange={e=>setLangue(e.target.value)}>
              {LANGUES.map(([v,l])=><option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <div>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:1,color:'var(--text3)',marginBottom:6}}>🎵 CATEGORIE</div>
            <select style={sel} value={cat} onChange={e=>setCat(e.target.value)}>
              {CATS.map(([v,l])=><option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:1,color:'var(--text3)',marginBottom:6}}>🔍 RECHERCHE</div>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Nom de la radio..."
              style={{...sel,width:'100%',boxSizing:'border-box'}}/>
          </div>
        </div>
      </div>

      {/* BADGE LIVE */}
      {!loading && stations.length > 0 && (
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20}}>
          <div style={{display:'flex',alignItems:'center',gap:6,background:'#e74c3c',borderRadius:99,padding:'5px 14px'}}>
            <div style={{width:8,height:8,borderRadius:'50%',background:'#fff',animation:'pulse 1s infinite'}}/>
            <span style={{color:'#fff',fontWeight:700,fontSize:13}}>LIVE</span>
          </div>
          <span style={{color:'var(--text2)',fontSize:13}}>{stations.length} diffusions actives</span>
        </div>
      )}

      {/* GRILLE STATIONS */}
      {loading ? (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:16}}>
          {[...Array(6)].map((_,i) => <div key={i} className="skeleton" style={{height:180,borderRadius:12}}/>)}
        </div>
      ) : stations.length === 0 ? (
        <div style={{textAlign:'center',padding:60,color:'var(--text3)'}}>
          <div style={{fontSize:48,marginBottom:12}}>📻</div>
          <h3 style={{marginBottom:8}}>Aucune radio disponible</h3>
          <p style={{fontSize:14,marginBottom:24}}>Soyez le premier a diffuser une radio live</p>
          <button onClick={()=>setPage('upload')} style={{background:'var(--primary)',border:'none',color:'#fff',padding:'10px 24px',borderRadius:8,cursor:'pointer',fontWeight:600}}>
            Creer une radio
          </button>
        </div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:16}}>
          {stations.map(s => {
            const isActive = currentTrack?.id === s.id
            const rxns = reactions[s.id] || {}
            return (
              <div key={s.id} style={{background:'var(--card)',borderRadius:14,border:`1px solid ${isActive?'var(--primary)':'var(--border)'}`,overflow:'hidden'}}>
                <div style={{display:'flex',gap:12,padding:16,alignItems:'flex-start'}}>
                  {/* LOGO */}
                  <div style={{width:64,height:64,borderRadius:10,background:'var(--card2)',overflow:'hidden',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:28}}>
                    {s.cover_url ? <img src={s.cover_url} style={{width:'100%',height:'100%',objectFit:'cover'}}/> : '📻'}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:800,fontSize:16,marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.title}</div>
                    <div style={{fontSize:12,color:'var(--text2)',marginBottom:6}}>
                      {s.profiles?.display_name} · {s.genre}
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:8,fontSize:12,color:'var(--text3)'}}>
                      <span>🎧 {formatK(s.play_count)} auditeurs</span>
                      {s.country && <span>{FLAGS[s.country]||'🌍'}</span>}
                      {s.language && <span style={{padding:'1px 6px',borderRadius:4,background:'var(--card2)',fontSize:11}}>{s.language}</span>}
                    </div>
                  </div>
                  {/* BOUTON LIVE */}
                  <button onClick={()=>toggle(s)}
                    style={{background:isActive&&isPlaying?'#e74c3c':'var(--gold)',border:'none',color:isActive&&isPlaying?'#fff':'#000',borderRadius:8,padding:'8px 14px',cursor:'pointer',fontWeight:800,fontSize:13,flexShrink:0,display:'flex',alignItems:'center',gap:6}}>
                    {isActive && isPlaying ? '⏸' : '▶'} {isActive&&isPlaying?'En cours':'Live'}
                  </button>
                </div>
                {/* REACTIONS */}
                <div style={{borderTop:'1px solid var(--border)',padding:'10px 16px',display:'flex',gap:12,alignItems:'center'}}>
                  {['❤️','🔥','😮'].map(e => (
                    <button key={e} onClick={()=>handleReact(s.id,e)}
                      style={{background:'none',border:'none',cursor:'pointer',fontSize:13,color:'var(--text2)',display:'flex',alignItems:'center',gap:4,padding:'4px 6px',borderRadius:6}}>
                      {e} <span>{formatK(rxns[e]||0)}</span>
                    </button>
                  ))}
                  <button onClick={()=>toggleComments(s.id)}
                    style={{background:'none',border:'none',cursor:'pointer',fontSize:13,color:showComments===s.id?'var(--primary)':'var(--text2)',display:'flex',alignItems:'center',gap:4,padding:'4px 6px',borderRadius:6}}>
                    💬 {(comments[s.id]||[]).length||0}
                  </button>
                  <button onClick={()=>navigator.share&&navigator.share({title:s.title,url:window.location.href})}
                    style={{marginLeft:'auto',background:'none',border:'none',cursor:'pointer',fontSize:12,color:'var(--text2)',display:'flex',alignItems:'center',gap:4}}>
                    📤 Partager
                  </button>
                </div>
                {showComments===s.id && (
                  <div style={{padding:'12px 16px',borderTop:'1px solid var(--border)',background:'var(--card2)'}}>
                    {(comments[s.id]||[]).map(cm => (
                      <div key={cm.id} style={{fontSize:12,marginBottom:8,display:'flex',gap:8}}>
                        <strong style={{color:'var(--gold)'}}>{cm.profiles?.username}</strong>
                        <span style={{color:'var(--text2)'}}>{cm.content}</span>
                      </div>
                    ))}
                    {(comments[s.id]||[]).length===0 && <div style={{fontSize:11,color:'var(--text3)',marginBottom:8}}>Aucun commentaire</div>}
                    {user && (
                      <div style={{display:'flex',gap:6,marginTop:6}}>
                        <input value={commentText} onChange={e=>setCommentText(e.target.value)}
                          onKeyDown={e=>e.key==='Enter'&&sendComment(s.id)}
                          placeholder="Ajouter un commentaire..."
                          style={{flex:1,background:'var(--bg)',border:'1px solid var(--border)',borderRadius:6,padding:'6px 10px',color:'var(--text)',fontSize:12}}/>
                        <button onClick={()=>sendComment(s.id)}
                          style={{background:'var(--primary)',border:'none',color:'#fff',borderRadius:6,padding:'6px 12px',cursor:'pointer',fontSize:12}}>
                          Envoyer
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
