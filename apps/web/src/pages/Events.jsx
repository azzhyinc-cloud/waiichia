import { useState, useEffect } from "react"
import { usePageStore } from "../stores/index.js"
import api from "../services/api.js"

const CATS=["Tous","Concert","Festival","Podcast Live","Business"]
const PAYS=["🌍 Tous pays","🇰🇲 Comores","🇲🇬 Madagascar","🇨🇮 Côte d'Ivoire","🇳🇬 Nigeria"]
const COLORS=["linear-gradient(135deg,#f5a623,#e63946)","linear-gradient(135deg,#2dc653,#1060a0)","linear-gradient(135deg,#9b59f5,#4d9fff)","linear-gradient(135deg,#ff6b35,#cc4411)","linear-gradient(135deg,#f5a623,#2dc653)","linear-gradient(135deg,#e63946,#9b0010)"]
const MONTHS=["JAN","FÉV","MAR","AVR","MAI","JUN","JUL","AOÛ","SEP","OCT","NOV","DÉC"]
const MOCK=Array.from({length:9},(_,i)=>({id:`e${i}`,title:["Waiichia Music Festival","Twarab Night Moroni","Podcast Business Comoros","Afrobeats Night Abidjan","Zanzibar Jazz Fest","Lagos Music Summit","Nairobi Sound Fest","Kolo Live Concert","Comoros Pride Show"][i],location:["Moroni, Comores","Mutsamudu, Anjouan","Fomboni, Mohéli","Abidjan, CI","Zanzibar, TZ","Lagos, NG","Nairobi, KE","Moroni, KM","Moroni, KM"][i],price:["2 500 KMF","1 500 KMF","Gratuit","5 000 XOF","25 USD","3 000 NGN","2 000 KES","1 000 KMF","Gratuit"][i],category:["festival","concert","podcast","concert","festival","business","festival","concert","festival"][i],country:["KM","KM","KM","CI","TZ","NG","KE","KM","KM"][i],day:String(i*3+1),month:MONTHS[(i+2)%12],emoji:["🎪","🎵","🎙️","🎤","🎺","💼","🥁","🎸","🌟"][i],boost:i%4===0,timeStart:i%2===0?`${14+i}:00`:null}))

export default function Events() {
  const { setPage } = usePageStore()
  const [cat,setCat]=useState("Tous")
  const [pays,setPays]=useState("")
  const [events,setEvents]=useState([])
  const [loading,setLoading]=useState(true)
  const [selected,setSelected]=useState(null)

  useEffect(()=>{
    api.events.list("?limit=20")
      .then(d=>setEvents(d.events?.length?d.events:MOCK))
      .catch(()=>setEvents(MOCK))
      .finally(()=>setLoading(false))
  },[])

  const filtered=events.filter(e=>{
    if(cat!=="Tous"&&e.category!==cat.toLowerCase().replace(" ","_"))return false
    return true
  })

  if(selected) return <EventDetail event={selected} onBack={()=>setSelected(null)} colors={COLORS}/>

  return(
    <div style={{paddingBottom:40}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10,marginBottom:20}}>
        <div style={{fontFamily:"Syne,sans-serif",fontSize:22,fontWeight:800}}>🎪 Événements</div>
        <button onClick={()=>setPage("create_event")} style={{padding:"9px 18px",borderRadius:50,border:"none",background:"linear-gradient(135deg,var(--gold),#e8920a)",color:"#000",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"Plus Jakarta Sans,sans-serif",boxShadow:"0 3px 12px rgba(245,166,35,.3)"}}>
          + Créer un événement
        </button>
      </div>
      {/* Filtres */}
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:22,alignItems:"center"}}>
        {CATS.map(c=><button key={c} onClick={()=>setCat(c)} style={{padding:"6px 14px",borderRadius:50,border:"1px solid",fontSize:12,fontWeight:600,cursor:"pointer",transition:"all .18s",fontFamily:"Plus Jakarta Sans,sans-serif",borderColor:cat===c?"var(--gold)":"var(--border)",background:cat===c?"var(--gold)":"var(--card)",color:cat===c?"#000":"var(--text2)"}}>{c}</button>)}
        <select value={pays} onChange={e=>setPays(e.target.value)} style={{padding:"7px 12px",borderRadius:"var(--radius-sm)",border:"1px solid var(--border)",background:"var(--card)",color:"var(--text)",fontSize:12,cursor:"pointer",outline:"none"}}>
          {PAYS.map(p=><option key={p} value={p.includes("Tous")?"":p}>{p}</option>)}
        </select>
      </div>
      {/* Grille */}
      {loading
        ?<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:16}}>{[...Array(6)].map((_,i)=><div key={i} style={{height:220,background:"var(--card)",borderRadius:"var(--radius)",border:"1px solid var(--border)",animation:"shimmer 1.5s infinite"}}/>)}</div>
        :<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:16}}>
          {filtered.map((e,i)=><EventCard key={e.id} event={e} color={COLORS[i%COLORS.length]} onClick={()=>setSelected(e)}/>)}
          {!filtered.length&&<div style={{color:"var(--text3)",fontSize:13,padding:"40px 0",gridColumn:"1/-1",textAlign:"center"}}>Aucun événement dans cette catégorie</div>}
        </div>
      }
    </div>
  )
}

function EventCard({event:e,color,onClick}){
  const[hov,setHov]=useState(false)
  return(
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{background:"var(--card)",border:`1px solid ${hov?"rgba(77,159,255,.4)":"var(--border)"}`,borderRadius:"var(--radius)",overflow:"hidden",cursor:"pointer",transition:"all .25s",transform:hov?"translateY(-4px)":"none",boxShadow:hov?"0 14px 36px var(--shadow)":"none"}}>
      {/* Banner */}
      <div onClick={onClick} style={{height:130,background:color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:44,position:"relative"}}>
        {e.emoji}
        {/* Date chip */}
        <div style={{position:"absolute",top:10,left:10,background:"var(--blue)",borderRadius:8,padding:"7px 12px",textAlign:"center",minWidth:44}}>
          <div style={{fontSize:18,fontWeight:800,fontFamily:"Syne,sans-serif",color:"#fff",lineHeight:1}}>{e.day}</div>
          <div style={{fontSize:9,fontFamily:"Space Mono,monospace",color:"rgba(255,255,255,.8)",letterSpacing:1}}>{e.month}</div>
        </div>
        {e.boost&&<div style={{position:"absolute",top:10,right:10,background:"var(--gold)",borderRadius:50,padding:"3px 10px",fontSize:10,fontWeight:700,color:"#000",fontFamily:"Space Mono,monospace",letterSpacing:.5}}>⚡ BOOST</div>}
        <div style={{position:"absolute",bottom:8,left:10,background:"rgba(0,0,0,.55)",color:"#fff",fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:3,fontFamily:"Space Mono,monospace",letterSpacing:.5,textTransform:"uppercase"}}>
          {e.category}
        </div>
      </div>
      {/* Info */}
      <div style={{padding:"14px 16px"}}>
        <div onClick={onClick} style={{fontWeight:700,fontSize:14,marginBottom:8,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.title}</div>
        <div style={{display:"flex",flexDirection:"column",gap:4,fontSize:12,color:"var(--text2)",marginBottom:12}}>
          <span>📍 {e.location}</span>
          <span>🎫 {e.price}</span>
          {e.timeStart&&<span>🕐 {e.timeStart}</span>}
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={onClick} style={{flex:1,padding:"8px",borderRadius:50,border:"1px solid var(--border)",background:"transparent",color:"var(--text2)",fontSize:12,fontWeight:600,cursor:"pointer",transition:"all .18s",fontFamily:"Plus Jakarta Sans,sans-serif"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--blue)";e.currentTarget.style.color="var(--blue)"}} onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.color="var(--text2)"}}>
            🔍 Détails
          </button>
          <button style={{flex:1,padding:"8px",borderRadius:50,border:"none",background:"linear-gradient(135deg,var(--gold),#e8920a)",color:"#000",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"Plus Jakarta Sans,sans-serif"}}>
            🎫 Billets
          </button>
        </div>
      </div>
    </div>
  )
}

function EventDetail({event:e,onBack,colors}){
  return(
    <div style={{paddingBottom:40}}>
      <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:8,background:"none",border:"none",color:"var(--text2)",cursor:"pointer",fontSize:13,marginBottom:20,fontFamily:"Plus Jakarta Sans,sans-serif"}} onMouseEnter={ev=>ev.currentTarget.style.color="var(--gold)"} onMouseLeave={ev=>ev.currentTarget.style.color="var(--text2)"}>
        ← Retour aux événements
      </button>
      <div style={{height:200,background:colors[0],borderRadius:"var(--radius)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:72,marginBottom:24,position:"relative"}}>
        {e.emoji}
        {e.boost&&<div style={{position:"absolute",top:16,right:16,background:"var(--gold)",borderRadius:50,padding:"5px 14px",fontSize:12,fontWeight:700,color:"#000",fontFamily:"Space Mono,monospace"}}>⚡ BOOST</div>}
      </div>
      <div style={{fontFamily:"Syne,sans-serif",fontSize:28,fontWeight:800,marginBottom:8}}>{e.title}</div>
      <div style={{display:"flex",gap:16,flexWrap:"wrap",marginBottom:20}}>
        {[["📍",e.location],["🎫",e.price],["📅",`${e.day} ${e.month}`],e.timeStart&&["🕐",e.timeStart]].filter(Boolean).map(([icon,val])=>(
          <div key={val} style={{display:"flex",alignItems:"center",gap:6,fontSize:13,color:"var(--text2)"}}>
            <span>{icon}</span><span>{val}</span>
          </div>
        ))}
      </div>
      <button style={{padding:"12px 28px",borderRadius:50,border:"none",background:"linear-gradient(135deg,var(--gold),#e8920a)",color:"#000",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"Plus Jakarta Sans,sans-serif",boxShadow:"0 4px 16px rgba(245,166,35,.4)"}}>
        🎫 Acheter des billets — {e.price}
      </button>
    </div>
  )
}
