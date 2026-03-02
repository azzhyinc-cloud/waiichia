import { useState, useEffect } from 'react'
import { usePlayerStore, usePageStore } from '../stores/index.js'
import api from '../services/api.js'

const formatK = (n) => {
  if (!n) return '0'
  if (n >= 1000000) return (n/1000000).toFixed(1).replace('.0','') + 'M'
  if (n >= 1000) return (n/1000).toFixed(1).replace('.0','') + 'K'
  return n.toString()
}

const CATEGORIES = ['Tous','Business','Mindset','Slam','Religion','Education','Politique','Culture','Tech','Sante']

export default function Podcasts() {
  const { toggle, currentTrack, isPlaying, setQueue } = usePlayerStore()
  const { setPage } = usePageStore()
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('Tous')
  const [search, setSearch] = useState('')

  useEffect(() => {
    setLoading(true)
    const q = new URLSearchParams()
    q.set('type', 'podcast')
    q.set('limit', '40')
    if (category !== 'Tous') q.set('genre', category)
    if (search) q.set('search', search)
    api.tracks.list('?' + q.toString()).then(res => {
      const t = res.tracks || []
      setTracks(t)
      setQueue(t)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [category, search])

  const formatDuration = (sec) => {
    if (!sec) return ''
    const m = Math.floor(sec / 60)
    const h = Math.floor(m / 60)
    if (h > 0) return h + 'h' + (m%60 > 0 ? (m%60) + 'min' : '')
    return m + ' min'
  }

  return (
    <div style={{padding:'24px 20px 100px'}}>
      <div style={{marginBottom:20}}>
        <h1 style={{fontSize:24,fontWeight:800,margin:'0 0 4px'}}>Podcasts</h1>
        <p style={{color:'var(--text2)',fontSize:14,margin:0}}>{tracks.length} episodes disponibles</p>
      </div>

      {/* SEARCH */}
      <div style={{position:'relative',marginBottom:16}}>
        <span style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--text3)'}}>🔍</span>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Rechercher un podcast..."
          style={{width:'100%',background:'var(--card)',border:'1px solid var(--border)',borderRadius:10,padding:'10px 12px 10px 36px',color:'var(--text)',fontSize:14,boxSizing:'border-box'}}/>
      </div>

      {/* CATEGORIES */}
      <div style={{display:'flex',gap:8,marginBottom:24,overflowX:'auto',paddingBottom:4}}>
        {CATEGORIES.map(g => (
          <button key={g} onClick={() => setCategory(g)}
            style={{padding:'6px 16px',borderRadius:99,border:'1px solid var(--border)',cursor:'pointer',fontSize:12,whiteSpace:'nowrap',flexShrink:0,fontWeight:600,
              background:category===g?'var(--primary)':'transparent',
              color:category===g?'#fff':'var(--text2)'}}>
            {g}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {[...Array(6)].map((_,i) => <div key={i} className="skeleton" style={{height:100,borderRadius:12}}/>)}
        </div>
      ) : tracks.length === 0 ? (
        <div style={{textAlign:'center',padding:60,color:'var(--text3)'}}>
          <div style={{fontSize:48,marginBottom:12}}>🎙️</div>
          <h3 style={{marginBottom:8}}>Aucun podcast disponible</h3>
          <p style={{fontSize:14,marginBottom:24}}>Soyez le premier a publier un podcast</p>
          <button onClick={()=>setPage('upload')} style={{background:'var(--primary)',border:'none',color:'#fff',padding:'10px 24px',borderRadius:8,cursor:'pointer',fontWeight:600}}>
            Publier un podcast
          </button>
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {tracks.map(t => {
            const isActive = currentTrack?.id === t.id
            return (
              <div key={t.id}
                style={{background:'var(--card)',borderRadius:12,border:`1px solid ${isActive?'var(--primary)':'var(--border)'}`,overflow:'hidden',display:'flex',gap:0}}>
                {/* COVER */}
                <div style={{width:100,minWidth:100,background:'var(--card2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:32,position:'relative'}}>
                  {t.cover_url
                    ? <img src={t.cover_url} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                    : '🎙️'
                  }
                  {isActive && isPlaying && (
                    <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                      <div className="wave-vis"><div className="wave-bar"/><div className="wave-bar"/><div className="wave-bar"/></div>
                    </div>
                  )}
                </div>
                {/* INFO */}
                <div style={{flex:1,padding:'14px 16px',minWidth:0}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:4}}>
                    <div style={{fontWeight:700,fontSize:15,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1}}>{t.title}</div>
                    {t.genre && <span style={{fontSize:11,padding:'2px 8px',borderRadius:99,background:'var(--card2)',color:'var(--text2)',marginLeft:8,whiteSpace:'nowrap'}}>{t.genre}</span>}
                  </div>
                  <div style={{fontSize:12,color:'var(--text2)',marginBottom:8}}>{t.profiles?.display_name||'Auteur inconnu'}</div>
                  <div style={{display:'flex',alignItems:'center',gap:12}}>
                    <button onClick={() => toggle(t)}
                      style={{display:'flex',alignItems:'center',gap:6,background:isActive&&isPlaying?'var(--primary)':'var(--card2)',border:'none',color:isActive&&isPlaying?'#fff':'var(--text)',borderRadius:6,padding:'6px 14px',cursor:'pointer',fontSize:13,fontWeight:600}}>
                      {isActive && isPlaying ? '⏸ En cours' : '▶ Ecouter'}
                    </button>
                    {t.duration_sec > 0 && <span style={{fontSize:12,color:'var(--text3)'}}>{formatDuration(t.duration_sec)}</span>}
                    <span style={{fontSize:12,color:'var(--text3)',marginLeft:'auto'}}>{formatK(t.play_count)} ecoutes</span>
                    {t.access_type !== 'free' && (
                      <span style={{fontSize:12,color:'var(--gold)',fontWeight:700}}>{(t.sale_price||0).toLocaleString()} KMF</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
