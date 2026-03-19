import { useState, useEffect } from "react"
import { useAuthStore, usePageStore, useDeviseStore, usePlayerStore } from "../stores/index.js"
import { ReactionBar } from "../components/ReactionBar.jsx"
import BuyModal from "../components/BuyModal.jsx"
import api from "../services/api.js"

const TABS=["🎵 Sons","💿 Albums","📋 Playlists","📻 Diffusions","🛍️ Boutique","🎪 Événements","🛒 Mes achats","📥 Hors-ligne"]
const BGS=["linear-gradient(135deg,#1a6fcc,#4d9fff)","linear-gradient(135deg,#9b59f5,#6d3db5)","linear-gradient(135deg,#f5a623,#e63946)","linear-gradient(135deg,#2dc653,#0a9e4a)","linear-gradient(135deg,#ff6b35,#cc4411)","linear-gradient(135deg,#00b4d8,#0077b6)"]
const FLAGS={KM:"🇰🇲",MG:"🇲🇬",NG:"🇳🇬",CI:"🇨🇮",SN:"🇸🇳",TZ:"🇹🇿",FR:"🇫🇷"}
const fmtK=n=>n>=1000000?(n/1000000).toFixed(1)+"M":n>=1000?(n/1000).toFixed(1)+"K":String(n||0)
const MOCK_TRACKS=Array.from({length:6},(_,i)=>({id:"t"+i,title:["Twarab ya Komori","Moroni Flow","Island Vibe","Masiwa Matatu","Komori Nights","Afrika Rising"][i],profiles:{display_name:"Kolo Officiel"},genre:["TWARAB","AFROBEATS","AFROBEATS","TWARAB","AFROTRAP","AMAPIANO"][i],play_count:[8420,6180,4930,3760,2100,980][i],sale_price:[2500,1500,0,2500,500,0][i],access_type:i%3===0?"paid":"free",cover_url:null}))

export default function Profile(){
  const {user}=useAuthStore()
  const {setPage,profileUsername}=usePageStore()
  const {devise}=useDeviseStore()
  const {toggle,currentTrack,isPlaying}=usePlayerStore()
  const dc=devise?.code||"KMF"
  const isOwn=!profileUsername||profileUsername===user?.username

  const [profile,setProfile]=useState(null)
  const [tracks,setTracks]=useState([])
  const [loading,setLoading]=useState(true)
  const [tab,setTab]=useState("🎵 Sons")
  const [followed,setFollowed]=useState(false)
  const [buyModal,setBuyModal]=useState(null)

  useEffect(()=>{
    const who=profileUsername||(user?.username)
    if(!who){setLoading(false);return}
    Promise.all([
      api.profiles.get(who).catch(()=>null),
      api.profiles.tracks?api.profiles.tracks(who).catch(()=>({tracks:[]})):Promise.resolve({tracks:[]}),
    ]).then(([p,t])=>{
      if(p)setProfile(p.profile||p)
      setTracks(t?.tracks?.length?t.tracks:(isOwn?MOCK_TRACKS:[]))
    }).finally(()=>setLoading(false))
  },[profileUsername,user])

  const p=profile||user
  if(!p&&!loading)return(
    <div style={{textAlign:"center",padding:80}}>
      <div style={{fontSize:48,marginBottom:12}}>👤</div>
      <div style={{fontFamily:"Syne,sans-serif",fontSize:18,fontWeight:800,marginBottom:8}}>Connectez-vous</div>
      <button className="btn btn-primary" onClick={()=>setPage("login")}>Se connecter</button>
    </div>
  )
  if(loading)return <div style={{textAlign:"center",padding:80,color:"var(--text3)"}}>Chargement...</div>

  const initials=(p?.display_name||"??").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()
  const flag=FLAGS[p?.country||"KM"]||"🌍"

  return(
    <div style={{paddingBottom:60}}>
      {buyModal&&<BuyModal track={buyModal} mode="buy" onClose={()=>setBuyModal(null)}/>}

      {/* COVER */}
      <div className="profile-cover">
        <div className="profile-cover-img">{p?.cover_url?<img src={p.cover_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:"🌊"}</div>
        {isOwn&&<div className="profile-cover-actions">
          <button className="btn btn-sm btn-secondary" style={{opacity:.85}}>📷 Modifier couverture</button>
        </div>}
      </div>

      {/* AVATAR + INFO */}
      <div className="profile-info-row">
        <div className="profile-avatar-lg">
          {p?.avatar_url?<img src={p.avatar_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:initials}
          {isOwn&&<div className="profile-ava-edit">📷</div>}
        </div>
        <div className="profile-meta">
          <div className="profile-name">
            {p?.display_name||"Artiste"}
            {p?.is_verified&&<div className="profile-type-badge">⭐ Artiste Vérifié</div>}
          </div>
          <div className="profile-handle">@{p?.username} · {flag} {p?.country==="KM"?"Moroni, Comores":p?.country||"Comores"}</div>
          {p?.bio&&<div style={{fontSize:13,color:"var(--text2)",marginBottom:4,lineHeight:1.6,maxWidth:500}}>{p.bio}</div>}
          <div className="profile-actions">
            {isOwn?<>
              <button className="btn btn-primary btn-sm" onClick={()=>setPage("upload")}>+ Publier</button>
              <button className="btn btn-secondary btn-sm" onClick={()=>setPage("settings")}>⚙️ Paramètres</button>
              <button className="btn btn-outline btn-sm" onClick={()=>setPage("wallet")}>💰 Portefeuille</button>
            </>:<>
              <button className={`btn btn-sm ${followed?"btn-secondary":"btn-primary"}`}
                onClick={async()=>{try{followed?await api.profiles.unfollow(p.username):await api.profiles.follow(p.username);setFollowed(!followed)}catch(e){}}}>
                {followed?"✓ Suivi":"+ Suivre"}
              </button>
              <button className="btn btn-secondary btn-sm">💬 Message</button>
              <button className="btn btn-outline btn-sm">🎁 Tip</button>
            </>}
          </div>
        </div>
      </div>

      {/* STATS BAR */}
      <div className="profile-stats">
        {[
          {v:fmtK(p?.tracks_count||tracks.length),l:"Sons"},
          {v:"12",l:"Albums"},
          {v:fmtK(p?.fans_count||p?.followers_count||0),l:"Fans"},
          {v:fmtK(p?.total_plays||0),l:"Écoutes"},
          {v:fmtK(892000),l:"KMF gagnés"},
        ].map((s,i)=>(
          <div key={i} className="pstat">
            <div className="pstat-num">{s.v}</div>
            <div className="pstat-label">{s.l}</div>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div className="tabs-bar">
        {TABS.map(t=>(
          <button key={t} className={`tab-btn${tab===t?" active":""}`} onClick={()=>setTab(t)}>{t}</button>
        ))}
      </div>

      {/* CONTENU */}
      {tab==="🎵 Sons"&&(
        tracks.length===0
          ?<div style={{textAlign:"center",padding:80,color:"var(--text3)"}}>
            <div style={{fontSize:48,marginBottom:12}}>🎵</div>
            <div style={{marginBottom:16}}>Aucun son publié</div>
            {isOwn&&<button className="btn btn-primary" onClick={()=>setPage("upload")}>Publier mon premier son</button>}
          </div>
          :<div className="tracks-grid">
            {tracks.map((t,i)=>(
              <div key={t.id} className="track-card">
                <div onClick={()=>toggle(t)}>
                  <div className="track-cover">
                    <div className="track-cover-bg" style={{background:BGS[i%6]}}>{t.cover_url?<img src={t.cover_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:"🎵"}</div>
                    <div className={`type-badge type-music`}>{t.genre||"MUSIQUE"}</div>
                    <div className="play-overlay"><button className="play-btn-circle">{isPlaying&&currentTrack?.id===t.id?"⏸":"▶"}</button></div>
                  </div>
                  <div className="track-info">
                    <div className="track-title">{t.title}</div>
                    <div className="track-artist">{t.profiles?.display_name||p?.display_name||"Artiste"}</div>
                    <div className="track-meta">
                      <span>{fmtK(t.play_count)} 🎧</span>
                      <span>{t.access_type==="free"||!t.sale_price?"🆓 Gratuit":(t.sale_price?.toLocaleString()+" "+dc)}</span>
                    </div>
                  </div>
                </div>
                <div className="track-purchase-row">
                  {(!t.sale_price||t.access_type==="free")
                    ?<span className="free-chip">✓ Gratuit · Accès libre</span>
                    :<button className="buy-chip buy-chip-buy" onClick={()=>setBuyModal(t)}>🛒 Acheter <span className="price-tag">{t.sale_price?.toLocaleString()} {dc}</span></button>
                  }
                </div>
                <ReactionBar targetType="track" targetId={t.id} showComments={true}/>
              </div>
            ))}
          </div>
      )}

      {tab!=="🎵 Sons"&&(
        <div style={{textAlign:"center",padding:80,color:"var(--text3)"}}>
          <div style={{fontSize:48,marginBottom:12}}>📋</div>
          <div style={{fontSize:15,marginBottom:8}}>{tab.replace(/^[^ ]+ /,"")} — Bientôt disponible</div>
          <div style={{fontSize:12}}>Cette section est en cours de développement</div>
        </div>
      )}
    </div>
  )
}
