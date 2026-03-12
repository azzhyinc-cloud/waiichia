import { useState, useEffect } from "react"
import { usePlayerStore, useDeviseStore } from "../stores/index.js"
import api from "../services/api.js"

const TYPES=["Tout","Musique","Podcast","Émission"]
const PAYS=["🌍 Tous les pays","🇰🇲 Comores","🇲🇬 Madagascar","🇹🇿 Tanzanie","🇷🇼 Rwanda","🇨🇮 Côte d'Ivoire","🇳🇬 Nigeria","🇨🇩 RD Congo"]
const PERIODES=["📅 Toutes périodes","📅 Aujourd'hui","📅 Cette semaine","📅 Ce mois","📅 Cette année"]
const BGS=["linear-gradient(135deg,#f5a623,#e63946)","linear-gradient(135deg,#2dc653,#0a9e4a)","linear-gradient(135deg,#4d9fff,#1a6fcc)","linear-gradient(135deg,#9b59f5,#6d3db5)","linear-gradient(135deg,#ff6b35,#cc4411)","linear-gradient(135deg,#f5a623,#cc7700)"]
const MOCK=Array.from({length:20},(_,i)=>({id:`mock_${i}`,title:["Twarab ya Komori","Moroni Flow","Afrika Rising","Pumzika Beat","Vibrate Afrika","Zanzibar Night","Kolo Sound","Comoros Pride","Island Vibe","Nguvu ya Africa"][i%10],profiles:{display_name:["Kolo Officiel","DJ Comoros","Fatima K","Nadjib Pro","Waiichia Beats","Omar Said","Studio KM","East Mix","Moroni Flow","Afrika Sound"][i%10]},play_count:Math.floor(Math.random()*50000+1000),type:"music",cover_url:null,genre:["twarab","afrobeats","amapiano","sebene"][i%4]}))
const fmtK=n=>n>=1000?(n/1000).toFixed(1)+"K":String(n||0)

export default function Trending() {
  const { toggle, currentTrack, isPlaying } = usePlayerStore()
  const [type,setType]=useState("Tout")
  const [pays,setPays]=useState("")
  const [period,setPeriod]=useState("")
  const [tracks,setTracks]=useState([])
  const [loading,setLoading]=useState(true)
  const [reacts,setReacts]=useState({})

  useEffect(()=>{
    api.tracks.trending()
      .then(d=>setTracks(d.tracks?.length?d.tracks:MOCK))
      .catch(()=>setTracks(MOCK))
      .finally(()=>setLoading(false))
  },[])

  const filtered=tracks.filter(t=>type==="Tout"||t.type?.toLowerCase().includes(type.toLowerCase().slice(0,4)))
  const react=(id,r)=>setReacts(p=>({...p,[id]:{...p[id],[r]:((p[id]?.[r]||Math.floor(Math.random()*400+20))+1)}}))

  return(
    <div style={{paddingBottom:40}}>
      <div style={{fontFamily:"Syne,sans-serif",fontSize:22,fontWeight:800,marginBottom:20}}>🔥 Classement &amp; Tendances</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20,alignItems:"center"}}>
        {TYPES.map(t=>(
          <button key={t} onClick={()=>setType(t)} style={{padding:"6px 14px",borderRadius:50,border:"1px solid",fontSize:12,fontWeight:600,cursor:"pointer",transition:"all .18s",fontFamily:"Plus Jakarta Sans,sans-serif",borderColor:type===t?"var(--gold)":"var(--border)",background:type===t?"var(--gold)":"var(--card)",color:type===t?"#000":"var(--text2)"}}>
            {t}
          </button>
        ))}
        <Sel value={pays} onChange={setPays} options={PAYS}/>
        <Sel value={period} onChange={setPeriod} options={PERIODES}/>
      </div>
      {loading
        ?<div style={{display:"flex",flexDirection:"column",gap:8}}>{[...Array(10)].map((_,i)=><div key={i} style={{height:68,background:"var(--card)",borderRadius:"var(--radius-sm)",border:"1px solid var(--border)",animation:"shimmer 1.5s infinite"}}/>)}</div>
        :<div style={{display:"flex",flexDirection:"column",gap:8}}>
          {filtered.map((t,i)=><TrendItem key={t.id} track={t} rank={i+1} bg={BGS[i%BGS.length]} isPlaying={isPlaying&&currentTrack?.id===t.id} onPlay={()=>toggle(t)} reacts={reacts[t.id]||{}} onReact={r=>react(t.id,r)} fmtK={fmtK}/>)}
          {!filtered.length&&<div style={{textAlign:"center",color:"var(--text3)",padding:40}}>Aucun résultat</div>}
        </div>
      }
    </div>
  )
}

function TrendItem({track:t,rank,bg,isPlaying,onPlay,reacts,onReact,fmtK}){
  const[hov,setHov]=useState(false)
  return(
    <div style={{background:"var(--card)",border:`1px solid ${hov?"rgba(245,166,35,.3)":"var(--border)"}`,borderRadius:"var(--radius-sm)",overflow:"hidden",transition:"all .2s",transform:hov?"translateX(4px)":"none"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,padding:"11px 14px",cursor:"pointer"}} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} onClick={onPlay}>
        <div style={{fontFamily:"Syne,sans-serif",fontSize:18,fontWeight:800,color:rank<=3?"var(--gold)":"var(--text3)",width:26,textAlign:"center",flexShrink:0}}>{rank}</div>
        <div style={{width:44,height:44,borderRadius:8,background:bg,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,overflow:"hidden"}}>
          {t.cover_url?<img src={t.cover_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:"🎵"}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:600,fontSize:13.5,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.title}</div>
          <div style={{fontSize:11.5,color:"var(--text2)",marginTop:1}}>{t.profiles?.display_name||"Artiste"}</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",flexShrink:0,gap:2}}>
          <div style={{fontSize:12,color:"var(--text2)",fontFamily:"Space Mono,monospace"}}>{fmtK(t.play_count)} 🎧</div>
          <div style={{fontSize:11,color:"var(--green)",fontWeight:600}}>▲ +{Math.floor(rank*1.3+2)}%</div>
        </div>
        <div style={{width:34,height:34,borderRadius:"50%",background:isPlaying?"var(--gold)":"var(--card2)",border:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:isPlaying?"#000":"var(--text2)",flexShrink:0,transition:"all .2s"}}>
          {isPlaying?"⏸":"▶"}
        </div>
      </div>
      <div style={{display:"flex",gap:5,flexWrap:"wrap",padding:"8px 12px",borderTop:"1px solid var(--border)"}}>
        {[["❤️","like"],["🔥","fire"],["🫶","love"],["👏","clap"]].map(([emoji,key])=>(
          <button key={key} onClick={()=>onReact(key)} style={{display:"flex",alignItems:"center",gap:3,padding:"4px 9px",borderRadius:20,border:"1px solid var(--border)",background:"var(--card2)",fontSize:12,cursor:"pointer",color:"var(--text2)",fontFamily:"Plus Jakarta Sans,sans-serif"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--gold)"}} onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)"}}>
            {emoji}<span>{reacts[key]||Math.floor(Math.random()*500+10)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function Sel({value,onChange,options}){
  return(<select value={value} onChange={e=>onChange(e.target.value)} style={{padding:"7px 12px",borderRadius:"var(--radius-sm)",border:"1px solid var(--border)",background:"var(--card)",color:"var(--text)",fontSize:12,cursor:"pointer",outline:"none"}}>
    {options.map(o=><option key={o} value={o.includes("Tous")||o.includes("Toutes")?"":o}>{o}</option>)}
  </select>)
}
