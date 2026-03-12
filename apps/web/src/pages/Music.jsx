import { useState, useEffect } from "react"
import { usePlayerStore } from "../stores/index.js"
import api from "../services/api.js"

const TABS=["Sons","Albums","Playlists"]
const GENRES=["Tout","🎵 Twarab","🥁 Sebene / Soukous","🌊 Afrobeats","🎶 Amapiano","🔥 Afrotrap","🎤 RnB Afro","🌍 Gospel","🕌 Chants Islamiques","🎺 Jazz Afro","🌿 Reggae Africain","🎧 Électro Afro"]
const BGS=["linear-gradient(135deg,#f5a623,#e63946)","linear-gradient(135deg,#2dc653,#0a9e4a)","linear-gradient(135deg,#4d9fff,#1a6fcc)","linear-gradient(135deg,#9b59f5,#6d3db5)","linear-gradient(135deg,#ff6b35,#cc4411)","linear-gradient(135deg,#f5a623,#cc7700)","linear-gradient(135deg,#e63946,#9b0010)"]
const MOCK=Array.from({length:21},(_,i)=>({id:`m${i}`,title:["Twarab ya Komori","Moroni Flow","Afrika Rising","Pumzika Beat","Vibrate Afrika","Zanzibar Night","Kolo Sound","Comoros Pride","Island Vibe","Nguvu ya Africa","Furaha"][i%11],profiles:{display_name:["Kolo Officiel","DJ Comoros","Fatima K","Nadjib Pro","Waiichia Beats","Omar Said","Studio KM","East Mix","Moroni Flow","Afrika Sound","Wanzani"][i%11]},play_count:Math.floor(Math.random()*30000+500),type:"music",genre:["twarab","afrobeats","amapiano","sebene","gospel"][i%5],access_type:i%3===0?"premium":"free",sale_price:i%3===0?(i+1)*500:0,cover_url:null}))

export default function Music() {
  const { toggle, currentTrack, isPlaying } = usePlayerStore()
  const [tab,setTab]=useState("Sons")
  const [genre,setGenre]=useState("Tout")
  const [tracks,setTracks]=useState([])
  const [loading,setLoading]=useState(true)

  useEffect(()=>{
    api.tracks.list("?limit=50")
      .then(d=>setTracks(d.tracks?.length?d.tracks:MOCK))
      .catch(()=>setTracks(MOCK))
      .finally(()=>setLoading(false))
  },[])

  const filtered=tracks.filter(t=>genre==="Tout"||t.genre?.toLowerCase().includes(genre.replace(/[^a-z]/gi,"").toLowerCase().slice(0,5)))

  return(
    <div style={{paddingBottom:40}}>
      <div style={{fontFamily:"Syne,sans-serif",fontSize:22,fontWeight:800,marginBottom:16}}>🎵 Musique</div>
      <div style={{display:"flex",gap:4,marginBottom:18,borderBottom:"1px solid var(--border)"}}>
        {TABS.map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{padding:"9px 18px",border:"none",background:"none",cursor:"pointer",fontFamily:"Plus Jakarta Sans,sans-serif",fontSize:13,fontWeight:600,color:tab===t?"var(--gold)":"var(--text2)",transition:"color .18s",borderBottom:tab===t?"2px solid var(--gold)":"2px solid transparent",marginBottom:-1}}>
            {t}
          </button>
        ))}
      </div>
      <div style={{marginBottom:16}}>
        <div style={{fontSize:11,color:"var(--text3)",marginBottom:8,fontFamily:"Space Mono,monospace",textTransform:"uppercase",letterSpacing:1}}>Genres</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {GENRES.map(g=>(
            <button key={g} onClick={()=>setGenre(g)} style={{padding:"5px 12px",borderRadius:50,border:"1px solid",fontSize:11.5,fontWeight:600,cursor:"pointer",transition:"all .15s",fontFamily:"Plus Jakarta Sans,sans-serif",borderColor:genre===g?"var(--gold)":"var(--border)",background:genre===g?"var(--gold)":"var(--card)",color:genre===g?"#000":"var(--text2)"}}>
              {g}
            </button>
          ))}
        </div>
      </div>
      {tab==="Sons"&&(loading?<Skel/>:
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:14}}>
          {filtered.map((t,i)=><TrackCard key={t.id} track={t} bg={BGS[i%BGS.length]} isPlaying={isPlaying&&currentTrack?.id===t.id} onPlay={()=>toggle(t)}/>)}
          {!filtered.length&&<div style={{color:"var(--text3)",fontSize:13,padding:"40px 0",gridColumn:"1/-1",textAlign:"center"}}>Aucun son dans ce genre</div>}
        </div>
      )}
      {tab==="Albums"&&<div style={{color:"var(--text3)",textAlign:"center",padding:60,fontSize:14}}>💿 Voir la section Albums</div>}
      {tab==="Playlists"&&<div style={{color:"var(--text3)",textAlign:"center",padding:60,fontSize:14}}>📋 Playlists bientôt disponibles</div>}
    </div>
  )
}

function TrackCard({track:t,bg,isPlaying,onPlay}){
  const[hov,setHov]=useState(false)
  const isPremium=t.access_type==="premium"||t.access_type==="paid"
  return(
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{background:"var(--card)",border:`1px solid ${hov?"rgba(245,166,35,.4)":"var(--border)"}`,borderRadius:"var(--radius)",overflow:"hidden",transition:"all .25s",transform:hov?"translateY(-4px)":"none",boxShadow:hov?"0 12px 32px var(--shadow)":"none"}}>
      <div style={{position:"relative",height:160,background:bg,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:40,overflow:"hidden"}} onClick={onPlay}>
        {t.cover_url?<img src={t.cover_url} alt={t.title} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:"🎵"}
        {hov&&<div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.45)",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{width:48,height:48,borderRadius:"50%",background:"var(--gold)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:"#000"}}>{isPlaying?"⏸":"▶"}</div>
        </div>}
        {isPlaying&&!hov&&<div style={{position:"absolute",bottom:8,right:8,background:"var(--gold)",borderRadius:20,padding:"3px 8px",fontSize:10,color:"#000",fontWeight:700,fontFamily:"Space Mono,monospace"}}>▶ EN COURS</div>}
        {isPremium&&<div style={{position:"absolute",top:8,right:8,background:"rgba(0,0,0,.7)",borderRadius:20,padding:"3px 8px",fontSize:10,color:"var(--gold)",fontFamily:"Space Mono,monospace"}}>🔒 PREMIUM</div>}
      </div>
      <div style={{padding:"12px 14px"}}>
        <div style={{fontWeight:600,fontSize:13,marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.title}</div>
        <div style={{fontSize:11.5,color:"var(--text2)",marginBottom:8}}>{t.profiles?.display_name||"Artiste"}</div>
        {isPremium
          ?<div style={{display:"flex",gap:6}}>
            <button style={{flex:1,padding:"6px",borderRadius:50,border:"none",background:"linear-gradient(135deg,var(--gold),#e8920a)",color:"#000",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"Plus Jakarta Sans,sans-serif"}}>🛒 {t.sale_price?`${t.sale_price} KMF`:"Acheter"}</button>
            <button style={{padding:"6px 10px",borderRadius:50,border:"1px solid var(--border)",background:"transparent",color:"var(--text2)",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"Plus Jakarta Sans,sans-serif"}}>⏳ Louer</button>
          </div>
          :<button onClick={onPlay} style={{width:"100%",padding:"6px",borderRadius:50,border:"1px solid var(--border)",background:"transparent",color:"var(--text2)",fontSize:11,fontWeight:600,cursor:"pointer",transition:"all .18s",fontFamily:"Plus Jakarta Sans,sans-serif"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--gold)";e.currentTarget.style.color="var(--gold)"}} onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.color="var(--text2)"}}>
            {isPlaying?"⏸ En cours":"▶ Écouter gratuitement"}
          </button>
        }
      </div>
    </div>
  )
}
function Skel(){return(<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:14}}>{[...Array(12)].map((_,i)=><div key={i} style={{background:"var(--card)",borderRadius:"var(--radius)",border:"1px solid var(--border)",overflow:"hidden"}}><div style={{height:160,background:"var(--card2)",animation:"shimmer 1.5s infinite"}}/><div style={{padding:12}}><div style={{height:13,background:"var(--card3)",borderRadius:6,marginBottom:8,width:"75%"}}/><div style={{height:11,background:"var(--card2)",borderRadius:6,width:"50%"}}/></div></div>)}</div>)}
