import { useState, useEffect } from "react"
import { usePlayerStore } from "../stores/index.js"
import { ReactionBar } from "../components/ReactionBar.jsx"
import api from "../services/api.js"
// ── AJOUT ──
import AddToPlaylistModal from "../components/AddToPlaylistModal.jsx"

const GENRES=['Tout','💡 Mindset','💼 Économie','🚀 Entrepreneuriat','📚 Éducation','🕌 Religion','🌍 Culture','🏋️ Lifestyle','💻 Tech','⚕️ Santé']
const BGS=["linear-gradient(135deg,#1a0a2e,#4a1a7a)","linear-gradient(135deg,#002a1a,#007040)","linear-gradient(135deg,#0a1e2e,#1060a0)","linear-gradient(135deg,#2e1a00,#7a4000)","linear-gradient(135deg,#1a0020,#5a0060)","linear-gradient(135deg,#001a2e,#005080)"]
const fmtK=n=>n>=1000?(n/1000).toFixed(1)+"K":String(n||0)
const fmtDur=s=>{if(!s)return"--:--";const m=Math.floor(s/60);return m>=60?Math.floor(m/60)+"h"+String(m%60).padStart(2,"0"):m+"min"}

export default function Podcasts(){
  const {toggle,currentTrack,isPlaying}=usePlayerStore()
  const [genre,setGenre]=useState('Tout')
  const [tracks,setTracks]=useState([])
  const [loading,setLoading]=useState(true)
  // ── AJOUT ──
  const [playlistTrack,setPlaylistTrack]=useState(null)

  useEffect(()=>{
    api.tracks.list('?type=podcast&limit=20')
      .then(d=>setTracks(d.tracks || []))
      .catch(()=>{})
      .finally(()=>setLoading(false))
  },[])

  const filtered=genre==='Tout'?tracks:tracks.filter(t=>t.genre?.toLowerCase().includes(genre.replace(/^[^ ]+ /,'').toLowerCase()))

  return(
    <div style={{paddingBottom:40}}>
      <div className="page-title">🎙️ Podcasts</div>

      {/* GENRE CHIPS */}
      <div className="genre-chips">
        {GENRES.map(g=>(
          <div key={g} className={`genre-chip${genre===g?' active':''}`} onClick={()=>setGenre(g)}>{g}</div>
        ))}
      </div>

      {/* PODCASTS POPULAIRES */}
      <div className="section-hdr"><div className="section-title">🎙️ Podcasts populaires</div></div>
      {loading
        ?<div className="tracks-grid">{[...Array(4)].map((_,i)=><div key={i} style={{height:280,background:'var(--card)',borderRadius:'var(--radius)',border:'1px solid var(--border)',animation:'shimmer 1.5s infinite'}}/>)}</div>
        :filtered.length>0
          ?<div className="tracks-grid">
            {filtered.map((t,i)=>(
              <div key={t.id} className="track-card">
                <div onClick={()=>toggle(t)}>
                  <div className="track-cover">
                    <div className="track-cover-bg" style={{background:BGS[i%6]}}>{t.cover_url?<img src={t.cover_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:"🎙️"}</div>
                    <div className="type-badge type-podcast">{t.genre||'PODCAST'}</div>
                    <div className="play-overlay"><button className="play-btn-circle">{isPlaying&&currentTrack?.id===t.id?"⏸":"▶"}</button></div>
                  </div>
                  <div className="track-info">
                    <div className="track-title">{t.title}</div>
                    <div className="track-artist">{t.profiles?.display_name||'Podcaster'}</div>
                    <div className="track-meta">
                      <span>{fmtK(t.play_count)} 🎧</span>
                      <span>{fmtDur(t.duration_sec)}</span>
                    </div>
                  </div>
                </div>
                <div className="track-purchase-row" onClick={e=>e.stopPropagation()}>
                  {(!t.sale_price||t.access_type==='free')
                    ?<span className="free-chip">✓ Gratuit · Accès libre</span>
                    :<button className="buy-chip buy-chip-buy">🛒 {t.sale_price?.toLocaleString()} KMF</button>
                  }
                  {/* ── AJOUT : bouton playlist ── */}
                  <button
                    onClick={e=>{e.stopPropagation();setPlaylistTrack(t)}}
                    title="Ajouter à une playlist"
                    style={{marginLeft:'auto',padding:'4px 8px',borderRadius:50,
                      border:'1px solid var(--border)',background:'var(--card2)',
                      color:'var(--text2)',fontSize:13,cursor:'pointer',transition:'all .15s'}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--gold)';e.currentTarget.style.color='var(--gold)'}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text2)'}}>
                    ➕
                  </button>
                </div>
                <ReactionBar targetType="track" targetId={t.id} showComments={true}/>
              </div>
            ))}
          </div>
          :<div style={{textAlign:'center',padding:60,color:'var(--text3)'}}>
            <div style={{fontSize:48,marginBottom:12}}>🎙️</div>
            <div style={{fontFamily:'Syne,sans-serif',fontSize:16,fontWeight:700,marginBottom:6}}>Aucun podcast pour le moment</div>
            <div style={{fontSize:13}}>Les podcasts publiés par les créateurs apparaîtront ici.</div>
          </div>
      }

      {/* ── AJOUT : modal playlist ── */}
      <AddToPlaylistModal
        isOpen={!!playlistTrack}
        onClose={()=>setPlaylistTrack(null)}
        track={playlistTrack}
      />
    </div>
  )
}
