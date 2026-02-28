import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar.jsx'
import { usePlayerStore } from '../stores/index.js'
import api from '../services/api.js'

function TrackCard({ track }) {
  const { toggle, currentTrack, isPlaying } = usePlayerStore()
  const isActive = currentTrack?.id === track.id

  return (
    <div style={{background:'#111',borderRadius:12,overflow:'hidden',border:`1px solid ${isActive?'#e74c3c':'#222'}`,transition:'all 0.2s'}}>
      <div style={{position:'relative',aspectRatio:'1',background:'#1a1a1a'}}>
        <img src={track.cover_url||'https://placehold.co/300x300/1a1a1a/666?text=🎵'}
          style={{width:'100%',height:'100%',objectFit:'cover'}}/>
        <button onClick={()=>toggle(track)}
          style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.4)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:40,opacity:0,transition:'opacity 0.2s'}}
          onMouseEnter={e=>e.currentTarget.style.opacity=1}
          onMouseLeave={e=>e.currentTarget.style.opacity=0}>
          {isActive && isPlaying ? '⏸' : '▶'}
        </button>
      </div>
      <div style={{padding:'12px 14px'}}>
        <div style={{fontWeight:600,fontSize:14,marginBottom:4,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{track.title}</div>
        <div style={{fontSize:12,color:'#888'}}>{track.profiles?.display_name||'Artiste'}</div>
        <div style={{display:'flex',justifyContent:'space-between',marginTop:8,fontSize:11,color:'#666'}}>
          <span>🎧 {track.play_count?.toLocaleString()||0}</span>
          <span style={{color:track.access_type==='free'?'#2ecc71':'#e74c3c'}}>
            {track.access_type==='free'?'Gratuit':`${track.sale_price?.toLocaleString()} KMF`}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const [tracks, setTracks] = useState([])
  const [trending, setTrending] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [genre, setGenre] = useState('')

  useEffect(() => {
    Promise.all([
      api.tracks.trending(),
      api.tracks.list()
    ]).then(([t, a]) => {
      setTrending(t.tracks||[])
      setTracks(a.tracks||[])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const filtered = tracks.filter(t =>
    (!search || t.title.toLowerCase().includes(search.toLowerCase())) &&
    (!genre || t.genre === genre)
  )

  return (
    <div style={{paddingBottom:100}}>
      <Navbar />
      <div style={{maxWidth:1200,margin:'0 auto',padding:'24px 20px'}}>
        <div style={{background:'linear-gradient(135deg,#1a0a0a,#2d1111)',borderRadius:16,padding:'40px 32px',marginBottom:32,textAlign:'center'}}>
          <h1 style={{fontSize:40,fontWeight:900,margin:'0 0 8px'}}>
            🎵 <span style={{color:'#e74c3c'}}>WAIICHIA</span>
          </h1>
          <p style={{color:'#aaa',fontSize:16,margin:'0 0 24px'}}>La musique africaine, sans frontières</p>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="🔍 Rechercher un son, un artiste..."
            style={{width:'100%',maxWidth:500,background:'rgba(255,255,255,0.1)',border:'1px solid #444',borderRadius:24,padding:'12px 20px',color:'#fff',fontSize:15,boxSizing:'border-box'}}/>
        </div>

        {trending.length > 0 && (
          <section style={{marginBottom:40}}>
            <h2 style={{fontSize:20,fontWeight:700,marginBottom:16}}>🔥 Tendances</h2>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:16}}>
              {trending.slice(0,8).map(t => <TrackCard key={t.id} track={t}/>)}
            </div>
          </section>
        )}

        <section>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <h2 style={{fontSize:20,fontWeight:700,margin:0}}>🎶 Tous les sons</h2>
            <select value={genre} onChange={e=>setGenre(e.target.value)}
              style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:8,padding:'6px 12px',color:'#fff',fontSize:13}}>
              <option value="">Tous les genres</option>
              <option>Twarab</option><option>Bongo</option><option>Afrobeats</option>
              <option>Coupé-décalé</option><option>Bikutsi</option><option>Ndombolo</option>
            </select>
          </div>
          {loading ? (
            <div style={{textAlign:'center',padding:60,color:'#666'}}>Chargement...</div>
          ) : filtered.length === 0 ? (
            <div style={{textAlign:'center',padding:60,color:'#666'}}>
              <div style={{fontSize:48,marginBottom:16}}>🎵</div>
              <p>Aucun son disponible pour le moment</p>
            </div>
          ) : (
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:16}}>
              {filtered.map(t => <TrackCard key={t.id} track={t}/>)}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
