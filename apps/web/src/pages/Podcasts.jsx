import { useState, useEffect } from "react"
import { usePlayerStore } from "../stores/index.js"
import { ReactionBar } from "../components/ReactionBar.jsx"
import api from "../services/api.js"

const GENRES=['Tout','💡 Mindset','💼 Économie','🚀 Entrepreneuriat','📚 Éducation','🕌 Religion','🌍 Culture','🏋️ Lifestyle','💻 Tech','⚕️ Santé']
const BGS=["linear-gradient(135deg,#1a0a2e,#4a1a7a)","linear-gradient(135deg,#002a1a,#007040)","linear-gradient(135deg,#0a1e2e,#1060a0)","linear-gradient(135deg,#2e1a00,#7a4000)","linear-gradient(135deg,#1a0020,#5a0060)","linear-gradient(135deg,#001a2e,#005080)"]
const MOCK_TRACKS=[
  {id:"p1",title:"Business Africa Ep.14",profiles:{display_name:"AfriEntrepreneur"},genre:"Entrepreneuriat",play_count:9400,duration_sec:2535,access_type:"free",type:"podcast"},
  {id:"p2",title:"Mindset Afrique",profiles:{display_name:"Coach Amina"},genre:"Mindset",play_count:15000,duration_sec:2100,access_type:"free",type:"podcast"},
  {id:"p3",title:"L'Économie des Îles",profiles:{display_name:"Radio KM"},genre:"Économie",play_count:6200,duration_sec:1800,access_type:"free",type:"podcast"},
  {id:"p4",title:"Tech & Innovation Afrique",profiles:{display_name:"Digital Africa"},genre:"Tech",play_count:8100,duration_sec:2400,access_type:"paid",sale_price:500,type:"podcast"},
  {id:"p5",title:"Spiritualité & Bien-être",profiles:{display_name:"Imam Abdallah"},genre:"Religion",play_count:12300,duration_sec:1950,access_type:"free",type:"podcast"},
  {id:"p6",title:"Culture Komori",profiles:{display_name:"Moroni FM"},genre:"Culture",play_count:4800,duration_sec:2700,access_type:"free",type:"podcast"},
]
const MOCK_SERIES=[
  {id:"s1",title:"Business Afrika",artist:"AfriEntrepreneur",episodes:24,genre:"Entrepreneuriat",emoji:"💼",bg:"linear-gradient(135deg,#2e1a00,#7a4000)"},
  {id:"s2",title:"Mindset & Vie",artist:"Coach Amina",episodes:18,genre:"Mindset",emoji:"🧠",bg:"linear-gradient(135deg,#002a1a,#007040)"},
  {id:"s3",title:"Le Monde en Question",artist:"Radio KM",episodes:42,genre:"Culture",emoji:"🌍",bg:"linear-gradient(135deg,#0a1e2e,#1060a0)"},
  {id:"s4",title:"Startup Komori",artist:"Digital Africa",episodes:12,genre:"Tech",emoji:"🚀",bg:"linear-gradient(135deg,#1a0a2e,#4a1a7a)"},
]
const fmtK=n=>n>=1000?(n/1000).toFixed(1)+"K":String(n||0)
const fmtDur=s=>{if(!s)return"--:--";const m=Math.floor(s/60);return m>=60?Math.floor(m/60)+"h"+String(m%60).padStart(2,"0"):m+"min"}

export default function Podcasts(){
  const {toggle,currentTrack,isPlaying}=usePlayerStore()
  const [genre,setGenre]=useState('Tout')
  const [tracks,setTracks]=useState([])
  const [loading,setLoading]=useState(true)

  useEffect(()=>{
    api.tracks.list('?type=podcast&limit=20')
      .then(d=>setTracks(d.tracks?.length?d.tracks:MOCK_TRACKS))
      .catch(()=>setTracks(MOCK_TRACKS))
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
        :<div className="tracks-grid">
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
              <div className="track-purchase-row">
                {(!t.sale_price||t.access_type==='free')
                  ?<span className="free-chip">✓ Gratuit · Accès libre</span>
                  :<button className="buy-chip buy-chip-buy">🛒 {t.sale_price?.toLocaleString()} KMF</button>
                }
              </div>
              <ReactionBar targetType="track" targetId={t.id} showComments={true}/>
            </div>
          ))}
          {!filtered.length&&<div style={{gridColumn:'1/-1',textAlign:'center',padding:60,color:'var(--text3)'}}>Aucun podcast dans cette catégorie</div>}
        </div>
      }

      {/* SÉRIES / COLLECTIONS */}
      <div className="section-hdr"><div className="section-title">📦 Séries / Collections</div></div>
      <div className="tracks-grid">
        {MOCK_SERIES.map(s=>(
          <div key={s.id} className="album-card">
            <div className="album-cover">
              <div className="album-cover-bg" style={{background:s.bg}}>{s.emoji}</div>
              <div className="type-badge type-podcast">SÉRIE</div>
              <div className="play-overlay"><button className="play-btn-circle">▶</button></div>
            </div>
            <div className="album-info">
              <div className="album-title">{s.title}</div>
              <div className="album-meta">
                <span>{s.artist}</span>
                <span>{s.episodes} épisodes</span>
                <span>{s.genre}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
