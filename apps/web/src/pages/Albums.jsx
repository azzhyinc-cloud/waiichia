import { useState, useEffect } from 'react'
import { usePlayerStore, usePageStore } from '../stores/index.js'
import api from '../services/api.js'

const formatK = (n) => {
  if (!n) return '0'
  if (n >= 1000000) return (n/1000000).toFixed(1).replace('.0','') + 'M'
  if (n >= 1000) return (n/1000).toFixed(1).replace('.0','') + 'K'
  return n.toString()
}

const GENRES = ['Tous','Twarab','Afrobeats','Sebene','Amapiano','Hip-Hop','RnB','Gospel','Classique']

export default function Albums() {
  const { toggle, currentTrack, isPlaying, setQueue } = usePlayerStore()
  const { setPage } = usePageStore()
  const [albums, setAlbums] = useState([])
  const [loading, setLoading] = useState(true)
  const [genre, setGenre] = useState('Tous')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [albumTracks, setAlbumTracks] = useState([])
  const [loadingTracks, setLoadingTracks] = useState(false)

  useEffect(() => {
    setLoading(true)
    const q = new URLSearchParams()
    q.set('type', 'album')
    q.set('limit', '40')
    if (genre !== 'Tous') q.set('genre', genre)
    if (search) q.set('search', search)
    api.tracks.list('?' + q.toString()).then(res => {
      setAlbums(res.tracks || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [genre, search])

  const openAlbum = async (album) => {
    setSelected(album)
    setLoadingTracks(true)
    // Charger les pistes du meme artiste avec le meme genre
    const res = await api.tracks.list('?type=album&creator_id=' + album.creator_id + '&limit=20')
    setAlbumTracks(res.tracks || [])
    setQueue(res.tracks || [])
    setLoadingTracks(false)
  }

  if (selected) return (
    <div style={{padding:'24px 20px 100px'}}>
      <button onClick={()=>setSelected(null)}
        style={{background:'var(--card)',border:'1px solid var(--border)',color:'var(--text)',borderRadius:8,padding:'7px 14px',cursor:'pointer',fontSize:13,marginBottom:20,display:'flex',alignItems:'center',gap:6}}>
        ← Retour aux albums
      </button>

      <div style={{display:'flex',gap:24,marginBottom:32,flexWrap:'wrap'}}>
        <div style={{width:180,height:180,borderRadius:16,background:'var(--card2)',overflow:'hidden',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:48}}>
          {selected.cover_url ? <img src={selected.cover_url} style={{width:'100%',height:'100%',objectFit:'cover'}}/> : '💿'}
        </div>
        <div style={{flex:1,minWidth:200}}>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:2,color:'var(--text3)',marginBottom:6,textTransform:'uppercase'}}>Album</div>
          <h1 style={{fontSize:26,fontWeight:900,margin:'0 0 6px'}}>{selected.title}</h1>
          <div style={{color:'var(--text2)',fontSize:14,marginBottom:12}}>{selected.profiles?.display_name}</div>
          {selected.genre && <div style={{display:'inline-block',padding:'4px 12px',borderRadius:99,background:'var(--card)',border:'1px solid var(--border)',fontSize:12,color:'var(--text2)',marginBottom:16}}>{selected.genre}</div>}
          <div style={{display:'flex',gap:12,alignItems:'center'}}>
            <button onClick={()=>toggle(selected)}
              style={{background:'var(--primary)',border:'none',color:'#fff',borderRadius:99,padding:'10px 24px',cursor:'pointer',fontWeight:700,fontSize:14}}>
              {currentTrack?.id===selected.id && isPlaying ? '⏸ Pause' : '▶ Ecouter'}
            </button>
            <span style={{fontSize:13,color:'var(--text3)'}}>{albumTracks.length} pistes · {formatK(albumTracks.reduce((a,t)=>a+(t.play_count||0),0))} ecoutes</span>
          </div>
        </div>
      </div>

      <h3 style={{fontSize:16,fontWeight:700,marginBottom:12}}>Pistes</h3>
      {loadingTracks ? (
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {[...Array(5)].map((_,i) => <div key={i} className="skeleton" style={{height:56,borderRadius:8}}/>)}
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          {albumTracks.map((t,idx) => {
            const isActive = currentTrack?.id === t.id
            return (
              <div key={t.id} onClick={()=>toggle(t)}
                style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',borderRadius:8,cursor:'pointer',
                  background:isActive?'var(--card2)':'transparent',
                  border:`1px solid ${isActive?'var(--primary)':'transparent'}`}}>
                <div style={{width:24,textAlign:'center',color:isActive?'var(--primary)':'var(--text3)',fontSize:13,fontWeight:600}}>
                  {isActive && isPlaying ? '♫' : idx+1}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:14,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:isActive?'var(--primary)':'var(--text)'}}>{t.title}</div>
                  <div style={{fontSize:12,color:'var(--text2)'}}>{t.profiles?.display_name}</div>
                </div>
                <div style={{fontSize:12,color:'var(--text3)'}}>{formatK(t.play_count)}</div>
                {t.access_type!=='free' && <div style={{fontSize:12,color:'var(--gold)',fontWeight:700}}>{(t.sale_price||0).toLocaleString()} KMF</div>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  return (
    <div style={{padding:'24px 20px 100px'}}>
      <div style={{marginBottom:20}}>
        <h1 style={{fontSize:24,fontWeight:800,margin:'0 0 4px'}}>Albums</h1>
        <p style={{color:'var(--text2)',fontSize:14,margin:0}}>{albums.length} albums disponibles</p>
      </div>

      <div style={{position:'relative',marginBottom:16}}>
        <span style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--text3)'}}>🔍</span>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Rechercher un album..."
          style={{width:'100%',background:'var(--card)',border:'1px solid var(--border)',borderRadius:10,padding:'10px 12px 10px 36px',color:'var(--text)',fontSize:14,boxSizing:'border-box'}}/>
      </div>

      <div style={{display:'flex',gap:8,marginBottom:24,overflowX:'auto',paddingBottom:4}}>
        {GENRES.map(g => (
          <button key={g} onClick={() => setGenre(g)}
            style={{padding:'6px 16px',borderRadius:99,border:'1px solid var(--border)',cursor:'pointer',fontSize:12,whiteSpace:'nowrap',flexShrink:0,fontWeight:600,
              background:genre===g?'var(--primary)':'transparent',
              color:genre===g?'#fff':'var(--text2)'}}>
            {g}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:16}}>
          {[...Array(8)].map((_,i) => <div key={i} className="skeleton" style={{height:220,borderRadius:12}}/>)}
        </div>
      ) : albums.length === 0 ? (
        <div style={{textAlign:'center',padding:60,color:'var(--text3)'}}>
          <div style={{fontSize:48,marginBottom:12}}>💿</div>
          <h3 style={{marginBottom:8}}>Aucun album disponible</h3>
          <button onClick={()=>setPage('upload')} style={{marginTop:8,background:'var(--primary)',border:'none',color:'#fff',padding:'10px 24px',borderRadius:8,cursor:'pointer',fontWeight:600}}>
            Publier un album
          </button>
        </div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:16}}>
          {albums.map(a => (
            <div key={a.id} onClick={()=>openAlbum(a)}
              style={{background:'var(--card)',borderRadius:12,overflow:'hidden',border:'1px solid var(--border)',cursor:'pointer'}}>
              <div style={{aspectRatio:'1',background:'var(--card2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:40,position:'relative',overflow:'hidden'}}>
                {a.cover_url ? <img src={a.cover_url} style={{width:'100%',height:'100%',objectFit:'cover'}}/> : '💿'}
                <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0)',display:'flex',alignItems:'center',justifyContent:'center',opacity:0,transition:'all 0.2s'}}
                  onMouseEnter={e=>{e.currentTarget.style.opacity=1;e.currentTarget.style.background='rgba(0,0,0,0.5)'}}
                  onMouseLeave={e=>{e.currentTarget.style.opacity=0;e.currentTarget.style.background='rgba(0,0,0,0)'}}>
                  <div style={{width:44,height:44,borderRadius:'50%',background:'var(--primary)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>▶</div>
                </div>
              </div>
              <div style={{padding:'12px'}}>
                <div style={{fontWeight:700,fontSize:14,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:2}}>{a.title}</div>
                <div style={{fontSize:12,color:'var(--text2)',marginBottom:6}}>{a.profiles?.display_name||'Artiste'}</div>
                <div style={{fontSize:11,color:'var(--text3)'}}>{formatK(a.play_count)} ecoutes</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
