import { useState, useEffect } from "react"
import { useAuthStore, usePageStore, useDeviseStore, usePlayerStore } from "../stores/index.js"
import BuyModal from "../components/BuyModal.jsx"
import api from "../services/api.js"

const TABS=["🎵 Sons","💿 Albums","📋 Playlists","📻 Diffusions","🛍️ Boutique","🎪 Événements"]
const BGS=["linear-gradient(135deg,#1a6fcc,#4d9fff)","linear-gradient(135deg,#9b59f5,#6d3db5)","linear-gradient(135deg,#f5a623,#e63946)","linear-gradient(135deg,#2dc653,#0a9e4a)","linear-gradient(135deg,#ff6b35,#cc4411)","linear-gradient(135deg,#00b4d8,#0077b6)"]
const EMOJIS=["🌊","🌆","🏝️","🗺️","🌙","🎛️"]
const FLAGS={KM:"🇰🇲",MG:"🇲🇬",NG:"🇳🇬",CI:"🇨🇮",SN:"🇸🇳",TZ:"🇹🇿",FR:"🇫🇷",RE:"🇷🇪"}
const fmtK=n=>n>=1000000?(n/1000000).toFixed(1)+"M":n>=1000?(n/1000).toFixed(1)+"K":String(n||0)
const MOCK_TRACKS=Array.from({length:6},(_,i)=>({id:"t"+i,title:["Twarab ya Komori","Moroni Flow","Island Vibe","Masiwa Matatu","Komori Nights","Afrika Rising"][i],artist:"Kolo Officiel",genre:["TWARAB","AFROBEATS","AFROBEATS","TWARAB","AFROTRAP","AMAPIANO"][i],play_count:[8420,6180,4930,3760,2100,980][i],sale_price:[2500,1500,0,2500,500,0][i],access_type:i%3===0?"paid":"free",cover_url:null,bg:BGS[i%6],emoji:EMOJIS[i]}))

function SBadge({s}){
  const m={Publié:{bg:"rgba(44,198,83,.15)",c:"#2dc653"},Brouillon:{bg:"rgba(245,166,35,.15)",c:"#f5a623"}}
  const x=m[s]||{bg:"rgba(140,140,140,.1)",c:"#888"}
  return <span style={{padding:"3px 9px",borderRadius:50,fontSize:10,fontWeight:700,background:x.bg,color:x.c}}>{s}</span>
}

function TrackCard({t,isPlaying,onPlay,onBuy,dc}){
  const [hov,setHov]=useState(false)
  const isPaid=t.access_type==="paid"&&t.sale_price>0
  return(
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{background:"var(--card)",border:`1px solid ${hov?"rgba(245,166,35,.4)":"var(--border)"}`,borderRadius:"var(--radius)",overflow:"hidden",cursor:"pointer",transition:"all .25s",transform:hov?"translateY(-5px)":"none",boxShadow:hov?"0 16px 40px rgba(0,0,0,.4)":"none"}}>
      <div style={{width:"100%",aspectRatio:"1",position:"relative",overflow:"hidden"}} onClick={onPlay}>
        <div style={{width:"100%",height:"100%",background:t.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:44}}>
          {t.cover_url?<img src={t.cover_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:t.emoji||"🎵"}
        </div>
        <div style={{position:"absolute",top:10,right:10,padding:"3px 8px",borderRadius:6,fontSize:9,fontWeight:800,background:"rgba(0,0,0,.6)",backdropFilter:"blur(8px)",color:"#fff",letterSpacing:.8}}>{t.genre||"MUSIC"}</div>
        <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.35)",display:"flex",alignItems:"center",justifyContent:"center",opacity:hov||isPlaying?1:0,transition:"opacity .2s"}}>
          <button style={{width:52,height:52,borderRadius:"50%",background:"var(--gold)",border:"none",cursor:"pointer",fontSize:20,boxShadow:"0 4px 16px rgba(245,166,35,.5)"}}>{isPlaying?"⏸":"▶"}</button>
        </div>
      </div>
      <div style={{padding:"12px 14px"}}>
        <div style={{fontWeight:700,fontSize:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:3}}>{t.title}</div>
        <div style={{fontSize:12,color:"var(--text2)",marginBottom:10}}>{t.artist}</div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontSize:12,color:"var(--text3)"}}>{fmtK(t.play_count)} 🎧</span>
          {isPaid
            ?<button onClick={e=>{e.stopPropagation();onBuy(t)}} style={{padding:"4px 10px",borderRadius:50,border:"none",background:"linear-gradient(135deg,var(--gold),#e8920a)",color:"#000",fontSize:11,fontWeight:700,cursor:"pointer"}}>{t.sale_price?.toLocaleString()} {dc}</button>
            :<span style={{fontSize:11,color:"#2dc653",fontWeight:600}}>🆓 Gratuit</span>}
        </div>
      </div>
      <div style={{display:"flex",gap:4,padding:"8px 12px",borderTop:"1px solid var(--border)"}}>
        {[["♥","like"],["💬","comm"],["📤","share"],["🚩","rep"]].map(([ic,k])=>(
          <button key={k} style={{flex:1,padding:"5px 0",borderRadius:8,border:"1px solid var(--border)",background:"var(--card2)",fontSize:13,cursor:"pointer",color:"var(--text2)"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--gold)";e.currentTarget.style.color="var(--gold)"}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.color="var(--text2)"}}>
            {ic}
          </button>
        ))}
      </div>
    </div>
  )
}

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
  const [editMode,setEditMode]=useState(false)
  const [editForm,setEditForm]=useState({display_name:"",bio:"",website:""})
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
      <div style={{fontFamily:"Syne,sans-serif",fontSize:18,fontWeight:800,marginBottom:8}}>Connectez-vous pour voir votre profil</div>
      <button onClick={()=>setPage("login")} style={{padding:"9px 22px",borderRadius:50,border:"none",background:"var(--gold)",color:"#000",fontWeight:700,cursor:"pointer"}}>Se connecter</button>
    </div>
  )
  if(loading)return <div style={{textAlign:"center",padding:80,color:"var(--text3)"}}>Chargement...</div>

  const initials=(p?.display_name||"??").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()
  const flag=FLAGS[p?.country||"KM"]||"🌍"

  const saveEdit=async()=>{
    try{
      await api.profiles.update(editForm)
      setProfile(pr=>({...pr,...editForm}))
      setEditMode(false)
    }catch(e){alert(e.message)}
  }

  return(
    <div style={{paddingBottom:60}}>
      {buyModal&&<BuyModal track={buyModal} onClose={()=>setBuyModal(null)}/>}

      {/* COVER */}
      <div style={{height:200,background:p?.cover_url?`url(${p.cover_url}) center/cover`:"linear-gradient(135deg,#1a0533,#0a1628,#001a0a)",borderRadius:"var(--radius)",marginBottom:-60,position:"relative",border:"1px solid var(--border)",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,transparent 40%,rgba(0,0,0,.7))"}}/>
        {p?.is_verified&&<div style={{position:"absolute",top:16,left:16,padding:"4px 12px",borderRadius:50,background:"rgba(245,166,35,.2)",backdropFilter:"blur(8px)",border:"1px solid rgba(245,166,35,.4)",color:"var(--gold)",fontSize:12,fontWeight:700}}>⭐ Artiste Vérifié</div>}
        {isOwn&&<button style={{position:"absolute",top:12,right:12,padding:"6px 14px",borderRadius:8,border:"1px solid rgba(255,255,255,.3)",background:"rgba(0,0,0,.4)",backdropFilter:"blur(8px)",color:"#fff",fontSize:11,cursor:"pointer"}}>📷 Modifier couverture</button>}
      </div>

      {/* AVATAR + INFO */}
      <div style={{display:"flex",flexWrap:"wrap",gap:16,alignItems:"flex-end",marginBottom:20,padding:"0 4px"}}>
        <div style={{position:"relative",zIndex:2}}>
          <div style={{width:100,height:100,borderRadius:"50%",background:p?.avatar_url?"transparent":"linear-gradient(135deg,var(--gold),#e8920a)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Syne,sans-serif",fontSize:30,fontWeight:800,color:"#000",border:"4px solid var(--bg2)",overflow:"hidden",flexShrink:0}}>
            {p?.avatar_url?<img src={p.avatar_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:initials}
          </div>
          {isOwn&&<div style={{position:"absolute",bottom:2,right:2,width:28,height:28,borderRadius:"50%",background:"var(--gold)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,cursor:"pointer",border:"2px solid var(--bg2)"}}>📷</div>}
        </div>
        <div style={{flex:1,minWidth:200,paddingTop:60}}>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:4}}>
            <div style={{fontFamily:"Syne,sans-serif",fontSize:24,fontWeight:800}}>{p?.display_name||"Artiste"}</div>
          </div>
          <div style={{fontSize:13,color:"var(--text3)",marginBottom:10}}>@{p?.username} · {flag} {p?.country||"KM"}</div>
          {p?.bio&&<div style={{fontSize:13,color:"var(--text2)",marginBottom:12,lineHeight:1.6,maxWidth:500}}>{p.bio}</div>}
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {isOwn?<>
              <button onClick={()=>{setEditMode(!editMode);setEditForm({display_name:p?.display_name||"",bio:p?.bio||"",website:p?.website||""})}} style={{padding:"8px 18px",borderRadius:50,border:"none",background:"linear-gradient(135deg,var(--gold),#e8920a)",color:"#000",fontSize:13,fontWeight:700,cursor:"pointer"}}>✏️ Modifier profil</button>
              <button onClick={()=>setPage("upload")} style={{padding:"8px 16px",borderRadius:50,border:"1px solid var(--border)",background:"var(--card)",color:"var(--text2)",fontSize:13,fontWeight:600,cursor:"pointer"}}>+ Publier</button>
              <button onClick={()=>setPage("dashboard")} style={{padding:"8px 16px",borderRadius:50,border:"1px solid var(--border)",background:"var(--card)",color:"var(--text2)",fontSize:13,fontWeight:600,cursor:"pointer"}}>📊 Stats</button>
            </>:<>
              <button onClick={async()=>{try{followed?await api.profiles.unfollow(p.username):await api.profiles.follow(p.username);setFollowed(!followed)}catch(e){alert(e.message)}}}
                style={{padding:"8px 22px",borderRadius:50,border:followed?"1px solid var(--border)":"none",background:followed?"var(--card2)":"linear-gradient(135deg,var(--gold),#e8920a)",color:followed?"var(--text)":"#000",fontSize:13,fontWeight:700,cursor:"pointer"}}>
                {followed?"✓ Suivi":"+ Suivre"}
              </button>
              <button style={{padding:"8px 16px",borderRadius:50,border:"1px solid var(--border)",background:"var(--card)",color:"var(--text2)",fontSize:13,cursor:"pointer"}}>💬 Message</button>
              <button style={{padding:"8px 16px",borderRadius:50,border:"1px solid var(--border)",background:"var(--card)",color:"var(--text2)",fontSize:13,cursor:"pointer"}}>🎁 Tip</button>
            </>}
          </div>
        </div>
      </div>

      {/* EDIT FORM */}
      {editMode&&isOwn&&(
        <div style={{background:"var(--card)",border:"1px solid var(--gold)",borderRadius:"var(--radius)",padding:20,marginBottom:20}}>
          <div style={{fontWeight:700,fontSize:14,marginBottom:16}}>✏️ Modifier mon profil</div>
          {[["Nom d'affichage","display_name"],["Bio","bio"],["Site web","website"]].map(([lb,k])=>(
            <div key={k} style={{marginBottom:14}}>
              <label style={{display:"block",fontSize:11,color:"var(--text3)",marginBottom:5,fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>{lb}</label>
              <input value={editForm[k]} onChange={e=>setEditForm(f=>({...f,[k]:e.target.value}))}
                style={{width:"100%",background:"var(--card2)",border:"1px solid var(--border)",borderRadius:8,padding:"9px 14px",color:"var(--text)",fontSize:13,outline:"none",boxSizing:"border-box"}}/>
            </div>
          ))}
          <div style={{display:"flex",gap:8}}>
            <button onClick={saveEdit} style={{padding:"8px 22px",borderRadius:50,border:"none",background:"var(--gold)",color:"#000",fontSize:13,fontWeight:700,cursor:"pointer"}}>✅ Enregistrer</button>
            <button onClick={()=>setEditMode(false)} style={{padding:"8px 22px",borderRadius:50,border:"1px solid var(--border)",background:"transparent",color:"var(--text2)",fontSize:13,cursor:"pointer"}}>Annuler</button>
          </div>
        </div>
      )}

      {/* STATS BAR */}
      <div style={{display:"flex",background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--radius)",overflow:"hidden",marginBottom:24,flexWrap:"wrap"}}>
        {[{v:fmtK(p?.tracks_count||0),l:"Sons"},{v:fmtK(p?.fans_count||p?.followers_count||0),l:"Fans"},{v:fmtK(p?.followers_count||0),l:"Abonnés"},{v:fmtK(p?.total_plays||0),l:"Écoutes"}].map((s,i,arr)=>(
          <div key={i} style={{flex:"1 0 80px",textAlign:"center",padding:"16px 12px",borderRight:i<arr.length-1?"1px solid var(--border)":"none"}}>
            <div style={{fontFamily:"Space Mono,monospace",fontWeight:800,fontSize:20,color:"var(--gold)"}}>{s.v}</div>
            <div style={{fontSize:11,color:"var(--text3)",marginTop:3}}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div style={{display:"flex",gap:2,borderBottom:"1px solid var(--border)",marginBottom:20,overflowX:"auto"}}>
        {TABS.map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{padding:"9px 16px",border:"none",background:"none",cursor:"pointer",fontSize:12,fontWeight:600,whiteSpace:"nowrap",color:tab===t?"var(--gold)":"var(--text2)",borderBottom:tab===t?"2px solid var(--gold)":"2px solid transparent",marginBottom:-1}}>
            {t}
          </button>
        ))}
      </div>

      {/* CONTENU ONGLET SONS */}
      {tab==="🎵 Sons"&&(
        tracks.length===0
          ?<div style={{textAlign:"center",padding:80,color:"var(--text3)"}}>
              <div style={{fontSize:48,marginBottom:12}}>🎵</div>
              <div style={{marginBottom:16}}>Aucun son publié</div>
              {isOwn&&<button onClick={()=>setPage("upload")} style={{padding:"9px 24px",borderRadius:50,border:"none",background:"var(--gold)",color:"#000",fontSize:13,fontWeight:700,cursor:"pointer"}}>Publier mon premier son</button>}
            </div>
          :<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:16}}>
              {tracks.map(t=>(
                <TrackCard key={t.id} t={t} dc={dc}
                  isPlaying={isPlaying&&currentTrack?.id===t.id}
                  onPlay={()=>toggle(t)}
                  onBuy={()=>setBuyModal(t)}/>
              ))}
            </div>
      )}

      {tab!=="🎵 Sons"&&(
        <div style={{textAlign:"center",padding:80,color:"var(--text3)"}}>
          <div style={{fontSize:48,marginBottom:12}}>🚧</div>
          <div style={{fontSize:15}}>Section bientôt disponible</div>
        </div>
      )}
    </div>
  )
}
