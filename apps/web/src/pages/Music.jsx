import { useState, useEffect } from 'react'
import { usePlayerStore, usePageStore } from '../stores/index.js'
import api from '../services/api.js'

const formatK = (n) => {
  if (!n) return '0'
  if (n >= 1000000) return (n/1000000).toFixed(1).replace('.0','') + 'M'
  if (n >= 1000) return (n/1000).toFixed(1).replace('.0','') + 'K'
  return n.toString()
}

const GENRES = ['Twarab','Afrobeats','Sebene','Amapiano','Slam','Mindset','Business','Gospel / Religion','Hip-Hop','RnB','Jazz','Classique']
const ACCESS = [['all','Tout'],['free','Gratuit'],['purchase','Achat'],['rental','Location']]
const SORTS = [['recent','Plus recents'],['popular','Plus ecoutes'],['az','A-Z']]

export default function Music() {
  const { toggle, currentTrack, isPlaying, setQueue } = usePlayerStore()
  const { setPage } = usePageStore()
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(true)
  const [genre, setGenre] = useState('')
  const [access, setAccess] = useState('all')
  const [sort, setSort] = useState('popular')
  const [search, setSearch] = useState('')
  const [page, setPageNum] = useState(1)

  useEffect(() => {
    setLoading(true)
    const q = new URLSearchParams()
    q.set('content_type', 'music')
    q.set('limit', '30')
    if (genre) q.set('genre', genre)
    if (access !== 'all') q.set('type', access)
    if (search) q.set('search', search)
    api.tracks.list('?' + q.toString()).then(res => {
      let t = res.tracks || []
      if (sort === 'popular') t = [...t].sort((a,b) => (b.play_count||0)-(a.play_count||0))
      if (sort === 'az') t = [...t].sort((a,b) => a.title.localeCompare(b.title))
      setTracks(t)
      setQueue(t)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [genre, access, sort, search])

  return (
    <div style={{padding:'24px 20px 100px'}}>
      <div style={{marginBottom:20}}>
        <h1 style={{fontSize:24,fontWeight:800,margin:'0 0 4px'}}>Musique</h1>
        <p style={{color:'var(--text2)',fontSize:14,margin:0}}>{tracks.length} sons disponibles</p>
      </div>

      {/* SEARCH */}
      <div style={{position:'relative',marginBottom:16}}>
        <span style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--text3)'}}>🔍</span>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Rechercher un son ou artiste..."
          style={{width:'100%',background:'var(--card)',border:'1px solid var(--border)',borderRadius:10,padding:'10px 12px 10px 36px',color:'var(--text)',fontSize:14,boxSizing:'border-box'}}/>
      </div>

      {/* FILTRES */}
      <div style={{display:'flex',gap:8,marginBottom:12,overflowX:'auto',paddingBottom:4}}>
        {GENRES.map(g => (
          <button key={g} onClick={() => setGenre(genre===g?'':g)}
            style={{padding:'5px 14px',borderRadius:99,border:'1px solid var(--border)',cursor:'pointer',fontSize:12,whiteSpace:'nowrap',flexShrink:0,
              background:genre===g?'var(--primary)':'transparent',
              color:genre===g?'#fff':'var(--text2)',fontWeight:genre===g?700:400}}>
            {g}
          </button>
        ))}
      </div>

      <div style={{display:'flex',gap:8,marginBottom:20,flexWrap:'wrap'}}>
        {ACCESS.map(([v,l]) => (
          <button key={v} onClick={() => setAccess(v)}
            style={{padding:'5px 14px',borderRadius:99,border:'1px solid var(--border)',cursor:'pointer',fontSize:12,
              background:access===v?'var(--gold)':'transparent',
              color:access===v?'#000':'var(--text2)',fontWeight:access===v?700:400}}>
            {l}
          </button>
        ))}
        <div style={{marginLeft:'auto',display:'flex',gap:8}}>
          {SORTS.map(([v,l]) => (
            <button key={v} onClick={() => setSort(v)}
              style={{padding:'5px 14px',borderRadius:99,border:'1px solid var(--border)',cursor:'pointer',fontSize:12,
                background:sort===v?'var(--card2)':'transparent',color:'var(--text2)'}}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* LISTE */}
      {loading ? (
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {[...Array(8)].map((_,i) => <div key={i} className="skeleton" style={{height:72,borderRadius:10}}/>)}
        </div>
      ) : tracks.length === 0 ? (
        <div style={{textAlign:'center',padding:60,color:'var(--text3)'}}>
          <div style={{fontSize:48,marginBottom:12}}>🎵</div>
          <p>Aucun son trouve</p>
          <button onClick={()=>setPage('upload')} style={{marginTop:16,background:'var(--primary)',border:'none',color:'#fff',padding:'10px 24px',borderRadius:8,cursor:'pointer',fontWeight:600}}>
            Publier un son
          </button>
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          {tracks.map((t, idx) => {
            const isActive = currentTrack?.id === t.id
            return (
              <div key={t.id} onClick={() => toggle(t)}
                style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',borderRadius:10,cursor:'pointer',
                  background:isActive?'var(--card2)':'var(--card)',
                  border:`1px solid ${isActive?'var(--primary)':'var(--border)'}`,transition:'all 0.2s'}}>
                <div style={{width:28,textAlign:'center',fontSize:13,color:'var(--text3)',fontWeight:600}}>{idx+1}</div>
                <div style={{width:48,height:48,borderRadius:8,background:'var(--card2)',overflow:'hidden',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22}}>
                  {t.cover_url ? <img src={t.cover_url} style={{width:'100%',height:'100%',objectFit:'cover'}}/> : ''}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:14,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</div>
                  <div style={{fontSize:12,color:'var(--text2)'}}>{t.profiles?.display_name||'Artiste'} · {t.genre}</div>
                </div>
                <div style={{textAlign:'right',flexShrink:0}}>
                  <div style={{fontSize:12,color:'var(--text3)'}}>{formatK(t.play_count)}</div>
                  {t.access_type !== 'free'
                    ? <div style={{fontSize:12,color:'var(--gold)',fontWeight:700}}>{(t.sale_price||0).toLocaleString()} KMF</div>
                    : <div style={{fontSize:11,color:'var(--green)'}}>Gratuit</div>
                  }
                </div>
                <div style={{fontSize:20,color:isActive&&isPlaying?'var(--primary)':'var(--text3)',width:24,textAlign:'center'}}>
                  {isActive && isPlaying ? '⏸' : '▶'}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
