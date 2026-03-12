import { useState, useEffect, useRef } from "react"
import { useAuthStore } from "../stores/index.js"
import api from "../services/api.js"

const TABS = ["🎵 Tous","🌊 Twarab","🥁 Afrobeats","🎶 Amapiano","🎤 Duets","🏆 Challenges"]
const MOCK_TRACKS = [
  {id:"k1",title:"Mwana wa Afrika",artist:"Karimou Style",genre:"twarab",bpm:92,key:"Am",duration_sec:210,cover_url:null,plays:4200},
  {id:"k2",title:"Moroni Nights",artist:"DJ Comoros",genre:"afrobeats",bpm:118,key:"Cm",duration_sec:195,cover_url:null,plays:8100},
  {id:"k3",title:"Amani Islands",artist:"Waiichia Beats",genre:"amapiano",bpm:112,key:"Dm",duration_sec:228,cover_url:null,plays:3600},
  {id:"k4",title:"Pumzika Beat",artist:"Studio KM",genre:"twarab",bpm:86,key:"Gm",duration_sec:244,cover_url:null,plays:2900},
  {id:"k5",title:"Vibrate Africa",artist:"Nadjib Pro",genre:"afrobeats",bpm:124,key:"Fm",duration_sec:188,cover_url:null,plays:11200},
  {id:"k6",title:"Zanzibar Flow",artist:"East Mix",genre:"amapiano",bpm:108,key:"Bbm",duration_sec:215,cover_url:null,plays:5400},
]
const MOCK_DUETS = [
  {id:"d1",initiator:"@komori_star",track:"Mwana wa Afrika",views:1240,status:"open"},
  {id:"d2",initiator:"@moroni_flow",track:"Vibrate Africa",views:3200,status:"open"},
  {id:"d3",initiator:"@nadjib_pro",track:"Moroni Nights",views:890,status:"open"},
  {id:"d4",initiator:"@fatima_k",track:"Amani Islands",views:2100,status:"open"},
]
const fmt = s => `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`
const fmtK = n => n>=1000?(n/1000).toFixed(1)+"K":String(n)
const EMO = ["🎵","🎶","🎸","🥁","🎺","🎻","🎹","🎤"]
const emo = s => EMO[s?.charCodeAt(0)%8||0]

export default function Karaoke() {
  const [tab,setTab]         = useState("🎵 Tous")
  const [tracks,setTracks]   = useState([])
  const [duets,setDuets]     = useState([])
  const [loading,setLoading] = useState(true)
  const [studio,setStudio]   = useState(null)
  const isHttps = window.location.protocol==="https:"

  useEffect(()=>{
    Promise.all([
      api.karaoke.tracks().catch(()=>({tracks:[]})),
      api.karaoke.duets().catch(()=>({duets:[]})),
    ]).then(([t,d])=>{
      setTracks(t.tracks?.length?t.tracks:MOCK_TRACKS)
      setDuets(d.duets?.length?d.duets:MOCK_DUETS)
    }).finally(()=>setLoading(false))
  },[])

  const filtered = tab==="🎵 Tous"?tracks
    :tracks.filter(t=>t.genre?.toLowerCase().includes(
      tab.replace(/[^a-z]/gi,"").toLowerCase().slice(0,6)))

  if(studio) return <Studio track={studio} onBack={()=>setStudio(null)} isHttps={isHttps}/>

  return(
    <div style={{paddingBottom:40}}>

      {!isHttps&&(
        <div style={{background:"rgba(245,166,35,.1)",border:"1px solid rgba(245,166,35,.35)",
          borderRadius:"var(--radius-sm)",padding:"12px 16px",marginBottom:16,
          display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:20}}>🔒</span>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:"var(--gold)",marginBottom:2}}>Enregistrement indisponible en HTTP</div>
            <div style={{fontSize:12,color:"var(--text2)"}}>Le micro requiert HTTPS. Disponible sur le site déployé.</div>
          </div>
        </div>
      )}

      {/* HERO */}
      <div style={{background:"linear-gradient(135deg,#0d0620 0%,#1a0a38 50%,#0d1a38 100%)",
        border:"1px solid rgba(155,89,245,.25)",borderRadius:"var(--radius)",
        padding:"36px 32px",marginBottom:28,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",right:-30,top:-30,width:300,height:300,
          background:"radial-gradient(circle,rgba(155,89,245,.18) 0%,transparent 70%)",pointerEvents:"none"}}/>
        <div style={{display:"inline-flex",alignItems:"center",gap:8,
          background:"rgba(155,89,245,.15)",border:"1px solid rgba(155,89,245,.4)",
          borderRadius:50,padding:"6px 16px",fontSize:10,fontFamily:"Space Mono,monospace",
          color:"#9b59f5",letterSpacing:"1.5px",marginBottom:16}}>
          🎤 NOUVEAU · Fonctionnalité exclusive Waiichia
        </div>
        <div style={{fontFamily:"Syne,sans-serif",fontSize:36,fontWeight:800,lineHeight:1.1,marginBottom:12}}>
          Chante. Duplique.<br/>
          <span style={{background:"linear-gradient(135deg,#9b59f5,#4d9fff)",
            WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>
            Deviens Viral.
          </span>
        </div>
        <div style={{color:"var(--text2)",fontSize:14,lineHeight:1.7,maxWidth:520,marginBottom:22}}>
          Enregistre ta voix sur les meilleurs instrumentaux africains.
          Crée des duos avec tes artistes favoris et partage ta version.
        </div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          <button onClick={()=>filtered[0]&&setStudio(filtered[0])}
            style={{padding:"10px 22px",borderRadius:50,border:"none",
              background:"linear-gradient(135deg,#9b59f5,#7d3cb5)",color:"#fff",
              fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"Plus Jakarta Sans,sans-serif"}}>
            🎤 Commencer à chanter
          </button>
          <button style={{padding:"10px 22px",borderRadius:50,border:"1px solid rgba(155,89,245,.4)",
            background:"transparent",color:"var(--text2)",fontWeight:600,fontSize:13,
            cursor:"pointer",fontFamily:"Plus Jakarta Sans,sans-serif"}}>
            🎵 Parcourir les duets
          </button>
        </div>
      </div>

      {/* STATS */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:28}}>
        {[{icon:"🎤",num:"12K",label:"Karaoké créés",color:"#9b59f5"},
          {icon:"🎵",num:"340",label:"Instrumentaux",color:"var(--gold)"},
          {icon:"🔥",num:"4.2K",label:"Duets actifs",color:"var(--red)"},
          {icon:"🏆",num:"89",label:"Challenges",color:"var(--green)"}
        ].map(s=>(
          <div key={s.label} style={{background:"var(--card)",border:"1px solid var(--border)",
            borderRadius:"var(--radius)",padding:"16px 18px",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:s.color}}/>
            <div style={{fontSize:22,marginBottom:8}}>{s.icon}</div>
            <div style={{fontFamily:"Syne,sans-serif",fontSize:22,fontWeight:800,lineHeight:1,marginBottom:3}}>{s.num}</div>
            <div style={{fontSize:11,color:"var(--text2)",textTransform:"uppercase",letterSpacing:1,
              fontFamily:"Space Mono,monospace"}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* FILTER TABS */}
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:22}}>
        {TABS.map(t=>(
          <button key={t} onClick={()=>setTab(t)}
            style={{padding:"6px 14px",borderRadius:50,border:"1px solid",fontSize:12,fontWeight:600,
              cursor:"pointer",transition:"all .18s",fontFamily:"Plus Jakarta Sans,sans-serif",
              borderColor:tab===t?"#9b59f5":"var(--border)",
              background:tab===t?"#9b59f5":"var(--card)",
              color:tab===t?"#fff":"var(--text2)"}}>
            {t}
          </button>
        ))}
      </div>

      {/* INSTRUMENTAUX */}
      <Hdr title="🎵 Instrumentaux populaires"/>
      {loading?<Skeleton/>:(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:14,marginBottom:32}}>
          {filtered.map(t=><KCard key={t.id} track={t} onSelect={setStudio}/>)}
          {!filtered.length&&<div style={{color:"var(--text3)",fontSize:13,padding:"40px 0",
            gridColumn:"1/-1",textAlign:"center"}}>Aucun instrumental dans ce genre</div>}
        </div>
      )}

      {/* DUETS */}
      <Hdr title="🔥 Top Duets cette semaine" right={
        <button style={{background:"none",border:"none",color:"var(--gold)",cursor:"pointer",
          fontSize:12,fontWeight:600}}>Voir tout →</button>}/>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {duets.map((d,i)=>(
          <div key={d.id} style={{background:"var(--card)",border:"1px solid var(--border)",
            borderRadius:"var(--radius-sm)",padding:"12px 16px",display:"flex",
            alignItems:"center",gap:14,cursor:"pointer",transition:"all .2s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(155,89,245,.4)"}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)"}}>
            <div style={{fontFamily:"Space Mono,monospace",fontSize:13,fontWeight:700,
              color:"#9b59f5",width:24,flexShrink:0}}>#{i+1}</div>
            <div style={{width:40,height:40,borderRadius:"50%",
              background:"linear-gradient(135deg,#9b59f5,#4d9fff)",
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>
              🎤
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:600,marginBottom:2}}>{d.initiator}</div>
              <div style={{fontSize:11,color:"var(--text2)"}}>🎵 {d.track}</div>
            </div>
            <div style={{fontSize:11,color:"var(--text3)",fontFamily:"Space Mono,monospace",flexShrink:0}}>
              {fmtK(d.views)} vues
            </div>
            <span style={{padding:"4px 10px",borderRadius:50,fontSize:10,fontWeight:700,
              background:"rgba(155,89,245,.15)",color:"#9b59f5",flexShrink:0}}>
              OUVERT
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function KCard({track:t,onSelect}){
  const[hov,setHov]=useState(false)
  return(
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{background:"var(--card)",border:`1px solid ${hov?"rgba(155,89,245,.5)":"var(--border)"}`,
        borderRadius:"var(--radius)",overflow:"hidden",transition:"all .25s",
        transform:hov?"translateY(-4px)":"none",boxShadow:hov?"0 14px 36px var(--shadow)":"none"}}>
      <div style={{height:120,background:"linear-gradient(135deg,rgba(155,89,245,.15),rgba(77,159,255,.1))",
        display:"flex",alignItems:"center",justifyContent:"center",fontSize:44,
        position:"relative",cursor:"pointer"}} onClick={()=>onSelect(t)}>
        {t.cover_url?<img src={t.cover_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt={t.title}/>:emo(t.title)}
        {hov&&<div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.5)",
          display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{width:44,height:44,borderRadius:"50%",background:"#9b59f5",
            display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:18}}>🎤</div>
        </div>}
        <span style={{position:"absolute",top:8,right:8,padding:"3px 8px",borderRadius:20,
          fontSize:9,fontFamily:"Space Mono,monospace",fontWeight:700,
          background:"rgba(155,89,245,.9)",color:"#fff"}}>{t.genre?.toUpperCase()||"BEAT"}</span>
      </div>
      <div style={{padding:"12px 14px"}}>
        <div style={{fontWeight:600,fontSize:13,marginBottom:3,overflow:"hidden",
          textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.title}</div>
        <div style={{fontSize:11.5,color:"var(--text2)",marginBottom:8}}>{t.artist}</div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
          fontSize:11,color:"var(--text3)",fontFamily:"Space Mono,monospace"}}>
          <span>♩ {t.bpm} BPM · {t.key}</span>
          <span>{fmt(t.duration_sec||180)}</span>
        </div>
        <div style={{marginTop:8,display:"flex",gap:6}}>
          <button onClick={()=>onSelect(t)}
            style={{flex:1,padding:"7px",borderRadius:50,border:"none",
              background:"linear-gradient(135deg,#9b59f5,#7d3cb5)",
              color:"#fff",fontWeight:700,fontSize:11.5,cursor:"pointer",
              fontFamily:"Plus Jakarta Sans,sans-serif"}}>
            🎤 Chanter
          </button>
          <button style={{padding:"7px 10px",borderRadius:50,border:"1px solid rgba(155,89,245,.4)",
            background:"transparent",color:"#9b59f5",fontWeight:700,fontSize:11.5,
            cursor:"pointer",fontFamily:"Plus Jakarta Sans,sans-serif"}}>
            🎵 Duet
          </button>
        </div>
      </div>
    </div>
  )
}

function Studio({track,onBack,isHttps}){
  const[recording,setRecording]=useState(false)
  const[recorded,setRecorded]=useState(false)
  const[timer,setTimer]=useState(0)
  const ref=useRef(null)
  const start=()=>{if(!isHttps)return;setRecording(true);setTimer(0);ref.current=setInterval(()=>setTimer(t=>t+1),1000)}
  const stop=()=>{setRecording(false);setRecorded(true);clearInterval(ref.current)}
  useEffect(()=>()=>clearInterval(ref.current),[])
  return(
    <div style={{paddingBottom:40}}>
      <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:8,background:"none",
        border:"none",color:"#9b59f5",cursor:"pointer",fontSize:13,fontWeight:600,marginBottom:20,
        fontFamily:"Plus Jakarta Sans,sans-serif"}}>← Retour</button>
      <div style={{background:"linear-gradient(135deg,#0d0620,#1a0a38)",
        border:"1px solid rgba(155,89,245,.3)",borderRadius:"var(--radius)",
        padding:32,textAlign:"center",maxWidth:500,margin:"0 auto"}}>
        <div style={{fontFamily:"Syne,sans-serif",fontSize:20,fontWeight:800,marginBottom:6}}>🎙️ Studio Waiichia</div>
        <div style={{fontSize:13,color:"var(--text2)",marginBottom:24}}>{track.title} · {track.artist}</div>
        <div style={{display:"flex",alignItems:"flex-end",justifyContent:"center",gap:3,height:50,marginBottom:28}}>
          {[40,70,55,85,60,90,45,75,50,80,65,35,90,55,70].map((h,i)=>(
            <div key={i} style={{width:4,background:"#9b59f5",borderRadius:2,
              height:`${recording?Math.floor(Math.random()*80+20):h}%`,
              opacity:recording?1:.4,transition:"height .3s"}}/>
          ))}
        </div>
        {!isHttps&&<div style={{background:"rgba(245,166,35,.1)",border:"1px solid rgba(245,166,35,.3)",
          borderRadius:"var(--radius-sm)",padding:"10px 14px",fontSize:12,color:"var(--gold)",marginBottom:16}}>
          🔒 Micro indisponible en HTTP — accessible sur le site déployé
        </div>}
        {recorded&&<div style={{background:"rgba(45,198,83,.1)",border:"1px solid rgba(45,198,83,.3)",
          borderRadius:"var(--radius-sm)",padding:"10px 14px",fontSize:13,color:"var(--green)",marginBottom:16}}>
          Enregistrement terminé ({fmt(timer)}) — prêt à partager !
        </div>}
        <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
          {!recording&&!recorded&&<button onClick={start} disabled={!isHttps}
            style={{padding:"12px 28px",borderRadius:50,border:"none",
              background:isHttps?"linear-gradient(135deg,#9b59f5,#7d3cb5)":"var(--card2)",
              color:isHttps?"#fff":"var(--text3)",fontWeight:700,fontSize:14,
              cursor:isHttps?"pointer":"not-allowed",fontFamily:"Plus Jakarta Sans,sans-serif"}}>
            🎤 Démarrer l&apos;enregistrement
          </button>}
          {recording&&<button onClick={stop}
            style={{padding:"12px 28px",borderRadius:50,border:"none",background:"var(--red)",
              color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer",
              fontFamily:"Plus Jakarta Sans,sans-serif"}}>
            ⏹ Arrêter ({fmt(timer)})
          </button>}
          {recorded&&<>
            <button style={{padding:"12px 24px",borderRadius:50,border:"none",
              background:"linear-gradient(135deg,var(--gold),#e8920a)",color:"#000",
              fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"Plus Jakarta Sans,sans-serif"}}>
              🚀 Publier
            </button>
            <button onClick={()=>{setRecorded(false);setTimer(0)}}
              style={{padding:"12px 24px",borderRadius:50,border:"1px solid var(--border)",
                background:"transparent",color:"var(--text2)",fontWeight:600,fontSize:13,
                cursor:"pointer",fontFamily:"Plus Jakarta Sans,sans-serif"}}>
              🔄 Recommencer
            </button>
          </>}
        </div>
      </div>
    </div>
  )
}

function Hdr({title,right}){return(
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
    <div style={{fontFamily:"Syne,sans-serif",fontSize:18,fontWeight:700,display:"flex",alignItems:"center",gap:8}}>
      <span style={{width:3,height:18,background:"linear-gradient(180deg,#9b59f5,#4d9fff)",
        borderRadius:3,display:"inline-block"}}/>
      {title}
    </div>
    {right}
  </div>
)}

function Skeleton(){return(
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:14,marginBottom:32}}>
    {[...Array(6)].map((_,i)=>(
      <div key={i} style={{background:"var(--card)",borderRadius:"var(--radius)",border:"1px solid var(--border)",overflow:"hidden"}}>
        <div style={{height:120,background:"var(--card2)",animation:"shimmer 1.5s infinite"}}/>
        <div style={{padding:12}}>
          <div style={{height:12,background:"var(--card3)",borderRadius:6,marginBottom:8,width:"75%"}}/>
          <div style={{height:10,background:"var(--card2)",borderRadius:6,width:"50%"}}/>
        </div>
      </div>
    ))}
  </div>
)}
