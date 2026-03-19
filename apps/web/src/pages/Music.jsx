import { useState, useEffect } from "react"
import { usePlayerStore } from "../stores/index.js"
import { ReactionBar } from "../components/ReactionBar.jsx"
import api from "../services/api.js"

const TABS=['Sons','Albums','Playlists']
const GENRES=['Tout','🎵 Twarab','🥁 Sebene / Soukous','🌊 Afrobeats','🎶 Amapiano','🔥 Afrotrap','🌿 Coupé Décalé','🥁 Makossa','🌍 Afrohouse','🕌 Qasida','🎸 Reggae Afro','🏺 Traditionnel','🎤 Slam','🎹 RnB Africain']
const TAGS=['#moroni','#komori','#africanmusic','#twarab','#amapiano2026','#afrobeats','#newrelease','#exclusif','#prodAfrica','#liveset','#rap','#gospel','#ndombolo','#sebene']
const BGS=["linear-gradient(135deg,#0d2a3a,#1a5060)","linear-gradient(135deg,#1a0a2e,#3a1a6a)","linear-gradient(135deg,#002a10,#007040)","linear-gradient(135deg,#2e1a00,#7a4000)","linear-gradient(135deg,#1a0020,#5a0060)","linear-gradient(135deg,#001a2e,#005080)"]
const MOCK=Array.from({length:8},(_,i)=>({id:'m'+i,title:['Twarab ya Komori','Moroni by Night','Afrika Rising','Slam pour demain','Island Vibe','Komori Nights','Vibrate Africa','Zanzibar Flow'][i],profiles:{display_name:['Kolo Officiel','DJ Chami','Wally Afro','Poète Issa','East Mix','Nassim B.','Nadjib Pro','Studio KM'][i]},genre:['Twarab','Afrobeats','Afrobeats','Slam','Amapiano','Twarab','Afrobeats','Amapiano'][i],play_count:[24800,18200,12100,7200,9800,6100,15000,5400][i],access_type:i%3===0?'paid':'free',sale_price:i%3===0?2500:0,cover_url:null,type:'music'}))
const fmtK=n=>n>=1000?(n/1000).toFixed(1)+"K":String(n||0)

export default function Music(){
  const {toggle,currentTrack,isPlaying}=usePlayerStore()
  const [tab,setTab]=useState('Sons')
  const [genre,setGenre]=useState('Tout')
  const [activeTag,setActiveTag]=useState('#moroni')
  const [tracks,setTracks]=useState([])
  const [loading,setLoading]=useState(true)

  useEffect(()=>{
    api.tracks.list('?type=music&limit=20')
      .then(d=>setTracks(d.tracks?.length?d.tracks:MOCK))
      .catch(()=>setTracks(MOCK))
      .finally(()=>setLoading(false))
  },[])

  const filtered=genre==='Tout'?tracks:tracks.filter(t=>t.genre?.toLowerCase().includes(genre.replace(/^[^ ]+ /,'').toLowerCase()))

  return(
    <div style={{paddingBottom:40}}>
      <div className="page-title">🎵 Musique</div>

      <div className="tabs-bar">
        {TABS.map(t=><button key={t} className={`tab-btn${tab===t?' active':''}`} onClick={()=>setTab(t)}>{t}</button>)}
      </div>

      <div style={{marginBottom:12}}>
        <div className="label" style={{marginBottom:8}}>Genres</div>
        <div className="genre-chips">
          {GENRES.map(g=><div key={g} className={`genre-chip${genre===g?' active':''}`} onClick={()=>setGenre(g)}>{g}</div>)}
        </div>
        <div className="label" style={{margin:'10px 0 6px'}}>Tags populaires</div>
        <div className="tags-wrap">
          {TAGS.map(t=><span key={t} className={`tag${activeTag===t?' active':''}`} onClick={()=>setActiveTag(t)}>{t}</span>)}
        </div>
      </div>

      {loading
        ?<div className="tracks-grid">{[...Array(6)].map((_,i)=><div key={i} style={{height:280,background:'var(--card)',borderRadius:'var(--radius)',border:'1px solid var(--border)',animation:'shimmer 1.5s infinite'}}/>)}</div>
        :<div className="tracks-grid">
          {filtered.map((t,i)=>(
            <div key={t.id} className="track-card">
              <div onClick={()=>toggle(t)}>
                <div className="track-cover">
                  <div className="track-cover-bg" style={{background:BGS[i%6]}}>{t.cover_url?<img src={t.cover_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:"🎵"}</div>
                  <div className="type-badge type-music">{t.genre||'MUSIQUE'}</div>
                  <div className="play-overlay"><button className="play-btn-circle">{isPlaying&&currentTrack?.id===t.id?"⏸":"▶"}</button></div>
                </div>
                <div className="track-info">
                  <div className="track-title">{t.title}</div>
                  <div className="track-artist">{t.profiles?.display_name||'Artiste'}</div>
                  <div className="track-meta"><span>{fmtK(t.play_count)} 🎧</span></div>
                </div>
              </div>
              <div className="track-purchase-row">
                {(!t.sale_price||t.access_type==='free')?<span className="free-chip">✓ Gratuit</span>
                  :<><button className="buy-chip buy-chip-buy">🛒 {t.sale_price?.toLocaleString()} KMF</button><button className="buy-chip buy-chip-rent">⏳ Louer</button></>}
              </div>
              <ReactionBar targetType="track" targetId={t.id} showComments={true}/>
            </div>
          ))}
        </div>
      }
    </div>
  )
}
