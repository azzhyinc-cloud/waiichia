import { useState, useEffect } from "react"
import { useAuthStore, usePageStore, useDeviseStore } from "../stores/index.js"
import { usePlayerStore } from "../stores/index.js"
import api from "../services/api.js"

const TABS=["🎵 Sons","💿 Albums","📋 Playlists","📻 Diffusions","🛍️ Boutique","🎪 Événements","🛒 Mes achats","📥 Hors-ligne"]
const BGS=["linear-gradient(135deg,#f5a623,#e63946)","linear-gradient(135deg,#2dc653,#0a9e4a)","linear-gradient(135deg,#4d9fff,#1a6fcc)","linear-gradient(135deg,#9b59f5,#6d3db5)","linear-gradient(135deg,#ff6b35,#cc4411)","linear-gradient(135deg,#f5a623,#cc7700)"]
const fmtK=n=>n>=1000000?(n/1000000).toFixed(1)+"M":n>=1000?(n/1000).toFixed(1)+"K":String(n||0)

export default function Profile({ username }) {
  const { user } = useAuthStore()
  const { setPage } = usePageStore()
  const { devise } = useDeviseStore()
  const { toggle, currentTrack, isPlaying } = usePlayerStore()
  const [tab, setTab] = useState("🎵 Sons")
  const [profile, setProfile] = useState(null)
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(true)
  const [following, setFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)

  const isOwn = !username || username === user?.username

  useEffect(() => {
    const uname = username || user?.username
    if (!uname) { setLoading(false); return }
    Promise.all([
      api.profiles.get(uname).catch(() => null),
      api.profiles.tracks(uname).catch(() => ({ tracks: [] }))
    ]).then(([p, t]) => {
      setProfile(p?.profile || p || null)
      setTracks(t?.tracks || [])
    }).finally(() => setLoading(false))
  }, [username, user?.username])

  const handleFollow = async () => {
    if (!profile) return
    setFollowLoading(true)
    try {
      if (following) { await api.profiles.unfollow(profile.username); setFollowing(false) }
      else { await api.profiles.follow(profile.username); setFollowing(true) }
    } catch(e) { console.error(e) }
    setFollowLoading(false)
  }

  if (loading) return <ProfileSkel/>
  if (!profile && !user) return (
    <div style={{textAlign:"center",padding:60}}>
      <div style={{fontSize:48,marginBottom:12}}>🔒</div>
      <div style={{fontFamily:"Syne,sans-serif",fontSize:20,fontWeight:800,marginBottom:8}}>Connectez-vous</div>
      <button onClick={()=>setPage("login")} style={{padding:"10px 24px",borderRadius:50,border:"none",background:"linear-gradient(135deg,var(--gold),#e8920a)",color:"#000",fontWeight:700,cursor:"pointer",fontSize:13}}>Se connecter</button>
    </div>
  )

  const p = profile || user
  const initials = p?.display_name?.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase() || p?.username?.slice(0,2).toUpperCase() || "W"
  const stats = [
    { num: fmtK(p?.tracks_count||tracks.length||0), label: "Sons" },
    { num: fmtK(p?.albums_count||0), label: "Albums" },
    { num: fmtK(p?.followers_count||p?.fans_count||0), label: "Fans" },
    { num: fmtK(p?.total_plays||0), label: "Écoutes" },
    { num: fmtK(p?.total_earnings||0)+" "+devise.code, label: "Gains" },
  ]

  return (
    <div style={{paddingBottom:40}}>
      {/* COVER */}
      <div style={{width:"100%",height:220,borderRadius:"var(--radius)",
        background:p?.cover_url?`url(${p.cover_url}) center/cover`:"linear-gradient(135deg,#0d1620,#2a1040)",
        position:"relative",overflow:"hidden",marginBottom:-60}}>
        <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:64,opacity:.3}}>
          {!p?.cover_url&&"🌊"}
        </div>
        {isOwn&&<div style={{position:"absolute",top:12,right:12,display:"flex",gap:8}}>
          <button style={{padding:"6px 14px",borderRadius:50,border:"1px solid rgba(255,255,255,.3)",background:"rgba(0,0,0,.4)",color:"rgba(255,255,255,.85)",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"Plus Jakarta Sans,sans-serif",backdropFilter:"blur(8px)"}}>
            📷 Modifier couverture
          </button>
        </div>}
      </div>

      {/* AVATAR + META */}
      <div style={{display:"flex",alignItems:"flex-end",gap:18,padding:"0 4px",marginBottom:18,position:"relative",zIndex:1}}>
        <div style={{width:110,height:110,borderRadius:"50%",
          background:"linear-gradient(135deg,var(--gold),var(--red))",
          border:"4px solid var(--bg)",display:"flex",alignItems:"center",justifyContent:"center",
          fontSize:38,fontWeight:800,color:"#000",flexShrink:0,overflow:"hidden",position:"relative"}}>
          {p?.avatar_url?<img src={p.avatar_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:initials}
          {isOwn&&<div style={{position:"absolute",bottom:4,right:4,width:28,height:28,background:"var(--gold)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,cursor:"pointer",border:"2px solid var(--bg)"}}>📷</div>}
        </div>
        <div style={{flex:1,paddingTop:70}}>
          <div style={{fontFamily:"Syne,sans-serif",fontSize:24,fontWeight:800,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            {p?.display_name||p?.username||"Artiste"}
            {p?.is_verified&&<span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"4px 12px",borderRadius:20,fontSize:10,fontFamily:"Space Mono,monospace",fontWeight:700,textTransform:"uppercase",letterSpacing:1,background:"linear-gradient(135deg,rgba(245,166,35,.15),rgba(230,57,70,.1))",border:"1px solid rgba(245,166,35,.25)",color:"var(--gold)"}}>⭐ Artiste Vérifié</span>}
          </div>
          <div style={{fontSize:13,color:"var(--text2)",margin:"3px 0 10px"}}>
            @{p?.username||"utilisateur"} · {p?.country?"🌍 "+p.country:"🌍"}
          </div>
          {p?.bio&&<div style={{fontSize:13,color:"var(--text2)",marginBottom:10,lineHeight:1.5,maxWidth:480}}>{p.bio}</div>}
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {isOwn ? <>
              <button onClick={()=>setPage("upload")} style={btnGold}>+ Publier</button>
              <button onClick={()=>setPage("settings")} style={btnSec}>⚙️ Paramètres</button>
              <button onClick={()=>setPage("wallet")} style={btnOut}>💰 Portefeuille</button>
            </> : <>
              <button onClick={handleFollow} disabled={followLoading} style={following?btnSec:btnGold}>
                {followLoading?"...":following?"✓ Suivi":"+ Suivre"}
              </button>
              <button onClick={()=>setPage("messages")} style={btnSec}>💬 Message</button>
              <button style={btnOut}>🎁 Don</button>
            </>}
          </div>
        </div>
      </div>

      {/* STATS */}
      <div style={{display:"flex",gap:24,background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--radius)",padding:"16px 22px",marginBottom:22,flexWrap:"wrap"}}>
        {stats.map(s=>(
          <div key={s.label} style={{textAlign:"center"}}>
            <div style={{fontFamily:"Syne,sans-serif",fontSize:20,fontWeight:800}}>{s.num}</div>
            <div style={{fontSize:11,color:"var(--text2)",fontFamily:"Space Mono,monospace"}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div style={{display:"flex",gap:2,borderBottom:"1px solid var(--border)",marginBottom:22,overflowX:"auto",paddingBottom:1}}>
        {TABS.map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{padding:"9px 16px",border:"none",background:"none",cursor:"pointer",fontFamily:"Plus Jakarta Sans,sans-serif",fontSize:12.5,fontWeight:600,whiteSpace:"nowrap",color:tab===t?"var(--gold)":"var(--text2)",borderBottom:tab===t?"2px solid var(--gold)":"2px solid transparent",marginBottom:-1,transition:"color .18s"}}>
            {t}
          </button>
        ))}
      </div>

      {/* CONTENU TAB */}
      {tab==="🎵 Sons"&&(
        tracks.length>0
          ?<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(185px,1fr))",gap:14}}>
            {tracks.map((t,i)=><MiniTrackCard key={t.id} track={t} bg={BGS[i%BGS.length]} isPlaying={isPlaying&&currentTrack?.id===t.id} onPlay={()=>toggle(t)}/>)}
          </div>
          :<Empty icon="🎵" label="Aucun son publié" sub={isOwn?"Publiez votre premier son !":"Cet artiste n'a pas encore publié de son."}/>
      )}
      {tab==="💿 Albums"&&<Empty icon="💿" label="Aucun album" sub="Bientôt disponible"/>}
      {tab==="📋 Playlists"&&<Empty icon="📋" label="Aucune playlist" sub="Bientôt disponible"/>}
      {tab==="📻 Diffusions"&&<Empty icon="📻" label="Aucune diffusion" sub="Bientôt disponible"/>}
      {tab==="🛍️ Boutique"&&<Empty icon="🛍️" label="Boutique vide" sub={isOwn?"Ajoutez des produits dans Mon Shop":"Aucun produit disponible"}/>}
      {tab==="🎪 Événements"&&<Empty icon="🎪" label="Aucun événement" sub="Bientôt disponible"/>}
      {tab==="🛒 Mes achats"&&<Empty icon="🛒" label="Aucun achat" sub="Vos titres achetés apparaîtront ici"/>}
      {tab==="📥 Hors-ligne"&&<Empty icon="📥" label="Aucun contenu hors-ligne" sub="Téléchargez des sons pour les écouter sans connexion"/>}
    </div>
  )
}

function MiniTrackCard({track:t,bg,isPlaying,onPlay}){
  const[hov,setHov]=useState(false)
  return(
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{background:"var(--card)",border:`1px solid ${hov?"rgba(245,166,35,.4)":"var(--border)"}`,borderRadius:"var(--radius)",overflow:"hidden",transition:"all .22s",transform:hov?"translateY(-3px)":"none"}}>
      <div onClick={onPlay} style={{position:"relative",height:140,background:bg,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:36,overflow:"hidden"}}>
        {t.cover_url?<img src={t.cover_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:"🎵"}
        {hov&&<div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.45)",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{width:44,height:44,borderRadius:"50%",background:"var(--gold)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:"#000"}}>{isPlaying?"⏸":"▶"}</div>
        </div>}
        {isPlaying&&<div style={{position:"absolute",bottom:6,right:6,background:"var(--gold)",borderRadius:20,padding:"2px 7px",fontSize:9,color:"#000",fontWeight:700,fontFamily:"Space Mono,monospace"}}>▶ EN COURS</div>}
      </div>
      <div style={{padding:"10px 12px"}}>
        <div style={{fontWeight:600,fontSize:12.5,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.title}</div>
        <div style={{fontSize:11,color:"var(--text3)",fontFamily:"Space Mono,monospace",marginTop:2}}>{t.play_count?((t.play_count/1000).toFixed(1)+"K"):"0"} écoutes</div>
      </div>
    </div>
  )
}

function Empty({icon,label,sub}){
  return(
    <div style={{textAlign:"center",padding:"50px 20px",color:"var(--text3)"}}>
      <div style={{fontSize:40,marginBottom:10}}>{icon}</div>
      <div style={{fontSize:14,fontWeight:600,color:"var(--text2)",marginBottom:4}}>{label}</div>
      <div style={{fontSize:12}}>{sub}</div>
    </div>
  )
}

function ProfileSkel(){
  return(
    <div style={{paddingBottom:40}}>
      <div style={{height:220,background:"var(--card)",borderRadius:"var(--radius)",marginBottom:-60,animation:"shimmer 1.5s infinite"}}/>
      <div style={{display:"flex",gap:18,padding:"0 4px",marginBottom:18,zIndex:1,position:"relative"}}>
        <div style={{width:110,height:110,borderRadius:"50%",background:"var(--card2)",border:"4px solid var(--bg)",animation:"shimmer 1.5s infinite",flexShrink:0}}/>
        <div style={{flex:1,paddingTop:70}}>
          <div style={{height:24,width:200,background:"var(--card2)",borderRadius:6,marginBottom:8,animation:"shimmer 1.5s infinite"}}/>
          <div style={{height:14,width:150,background:"var(--card2)",borderRadius:6,animation:"shimmer 1.5s infinite"}}/>
        </div>
      </div>
    </div>
  )
}

const btnGold={padding:"8px 18px",borderRadius:50,border:"none",background:"linear-gradient(135deg,var(--gold),#e8920a)",color:"#000",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"Plus Jakarta Sans,sans-serif",boxShadow:"0 3px 12px rgba(245,166,35,.3)"}
const btnSec={padding:"8px 18px",borderRadius:50,border:"1px solid var(--border)",background:"var(--card2)",color:"var(--text)",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"Plus Jakarta Sans,sans-serif"}
const btnOut={padding:"8px 18px",borderRadius:50,border:"1px solid var(--border)",background:"transparent",color:"var(--text2)",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"Plus Jakarta Sans,sans-serif"}
