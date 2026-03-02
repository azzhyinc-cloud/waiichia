import { useState, useEffect } from 'react'
import { usePlayerStore, usePageStore, useAuthStore } from '../stores/index.js'
import api from '../services/api.js'

const formatK = (n) => {
  if (!n) return '0'
  if (n >= 1000000) return (n/1000000).toFixed(1).replace('.0','') + 'M'
  if (n >= 1000) return (n/1000).toFixed(1).replace('.0','') + 'K'
  return n.toString()
}

const formatDate = (d) => {
  const diff = Date.now() - new Date(d).getTime()
  const min = Math.floor(diff/60000)
  const h = Math.floor(diff/3600000)
  const day = Math.floor(diff/86400000)
  if (min < 60) return min + ' min'
  if (h < 24) return h + 'h'
  return day + 'j'
}

export default function Feed() {
  const { toggle, currentTrack, isPlaying } = usePlayerStore()
  const { user } = useAuthStore()
  const { setPage } = usePageStore()
  const [feed, setFeed] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    api.social.feed().then(res => {
      setFeed(res.feed || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [user])

  if (!user) return (
    <div style={{textAlign:'center',padding:80}}>
      <div style={{fontSize:56,marginBottom:16}}>⚡</div>
      <h2 style={{marginBottom:8}}>Mon Activite</h2>
      <p style={{color:'var(--text2)',marginBottom:24}}>Connectez-vous pour voir les sons des artistes que vous suivez</p>
      <div style={{display:'flex',gap:12,justifyContent:'center'}}>
        <button onClick={()=>setPage('login')} style={{background:'var(--primary)',border:'none',color:'#fff',padding:'10px 24px',borderRadius:8,cursor:'pointer',fontWeight:600}}>Se connecter</button>
        <button onClick={()=>setPage('register')} style={{background:'var(--card)',border:'1px solid var(--border)',color:'var(--text)',padding:'10px 24px',borderRadius:8,cursor:'pointer',fontWeight:600}}>S inscrire</button>
      </div>
    </div>
  )

  return (
    <div style={{maxWidth:700,margin:'0 auto',padding:'24px 20px 100px'}}>
      <div style={{marginBottom:24}}>
        <h1 style={{fontSize:24,fontWeight:800,margin:'0 0 4px'}}>⚡ Mon Activite</h1>
        <p style={{color:'var(--text2)',fontSize:14,margin:0}}>Sons des artistes que vous suivez</p>
      </div>

      {loading ? (
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {[...Array(5)].map((_,i) => <div key={i} className="skeleton" style={{height:80,borderRadius:12}}/>)}
        </div>
      ) : feed.length === 0 ? (
        <div style={{textAlign:'center',padding:60,color:'var(--text3)'}}>
          <div style={{fontSize:48,marginBottom:16}}>🎵</div>
          <h3 style={{marginBottom:8}}>Votre fil est vide</h3>
          <p style={{fontSize:14,marginBottom:24}}>Suivez des artistes pour voir leurs nouveautes ici</p>
          <button onClick={()=>setPage('creators')} style={{background:'var(--primary)',border:'none',color:'#fff',padding:'10px 24px',borderRadius:8,cursor:'pointer',fontWeight:600}}>
            Decouvrir des artistes
          </button>
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {feed.map(t => {
            const isActive = currentTrack?.id === t.id
            return (
              <div key={t.id} style={{background:'var(--card)',borderRadius:12,border:`1px solid ${isActive?'var(--primary)':'var(--border)'}`,overflow:'hidden'}}>
                <div style={{display:'flex',gap:12,padding:16,alignItems:'center'}}>
                  <div style={{width:56,height:56,borderRadius:10,background:'var(--card2)',overflow:'hidden',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24}}>
                    {t.cover_url ? <img src={t.cover_url} style={{width:'100%',height:'100%',objectFit:'cover'}}/> : ''}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:2}}>
                      <div style={{width:24,height:24,borderRadius:'50%',background:'var(--primary)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,flexShrink:0}}>
                        {(t.profiles?.display_name||'A')[0]}
                      </div>
                      <span style={{fontSize:13,fontWeight:600,color:'var(--text2)'}}>{t.profiles?.display_name}</span>
                      <span style={{fontSize:11,color:'var(--text3)'}}>a publie</span>
                      <span style={{fontSize:11,color:'var(--text3)',marginLeft:'auto'}}>{formatDate(t.published_at||t.created_at)}</span>
                    </div>
                    <div style={{fontWeight:700,fontSize:15,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</div>
                    <div style={{fontSize:12,color:'var(--text2)',marginTop:2}}>{t.genre} · {formatK(t.play_count)} ecoutes</div>
                  </div>
                  <button onClick={() => toggle(t)}
                    style={{width:44,height:44,borderRadius:'50%',background:isActive&&isPlaying?'var(--primary)':'var(--card2)',border:'none',cursor:'pointer',fontSize:18,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    {isActive && isPlaying ? '⏸' : '▶'}
                  </button>
                </div>
                {t.access_type !== 'free' && (
                  <div style={{padding:'8px 16px',borderTop:'1px solid var(--border)',background:'var(--card2)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span style={{fontSize:12,color:'var(--text2)'}}>Contenu payant</span>
                    <span style={{fontSize:13,fontWeight:700,color:'var(--gold)'}}>{(t.sale_price||0).toLocaleString()} KMF</span>
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
