import BuyModal from "../components/BuyModal.jsx"
import { useState, useEffect } from "react"
import { usePlayerStore } from "../stores/index.js"
import { usePageStore, useDeviseStore } from "../stores/index.js"
import api from "../services/api.js"

const TABS=["Tous","Musique","Podcast","Émission","Événements"]
const BGS=["linear-gradient(135deg,#f5a623,#e63946)","linear-gradient(135deg,#2dc653,#0a9e4a)","linear-gradient(135deg,#4d9fff,#1a6fcc)","linear-gradient(135deg,#9b59f5,#6d3db5)","linear-gradient(135deg,#ff6b35,#cc4411)","linear-gradient(135deg,#f5a623,#cc7700)"]
const AVAS=["KO","DJ","FK","NP","WB","OS","KM","EM"]
const MOCK=Array.from({length:8},(_,i)=>({id:`f${i}`,title:["Twarab ya Komori","Moroni Flow","Afrika Rising","Pumzika Beat","Vibrate Afrika","Zanzibar Night","Kolo Sound","Comoros Pride"][i],profiles:{display_name:["Kolo Officiel","DJ Comoros","Fatima K","Nadjib Pro","Waiichia Beats","Omar Said","Studio KM","East Mix"][i],username:["kolo","djcomoros","fatimak","nadjib","wbeats","omar","studiokm","eastmix"][i]},genre:["Twarab","Afrobeats","Amapiano","Sebene","Gospel","RnB Afro","Afrotrap","Jazz Afro"][i],country:["KM","KM","MG","KM","NG","KM","CI","KM"][i],type:"music",cover_url:null,access_type:i%3===0?"premium":"free",sale_price:i%3===0?2500:0}))
const rnd=(a,b)=>Math.floor(Math.random()*(b-a)+a)
const fmtK=n=>n>=1000?(n/1000).toFixed(1)+"K":String(n)
const FLAGS={"KM":"🇰🇲","MG":"🇲🇬","NG":"🇳🇬","CI":"🇨🇮","SN":"🇸🇳","TZ":"🇹🇿"}

export default function Feed() {
  const { toggle, currentTrack, isPlaying } = usePlayerStore()
  const { setPage } = usePageStore()
  // devise depuis store
  const [buyModal,setBuyModal]=useState(null)
  const [tab,setTab]=useState("Tous")
  const [posts,setPosts]=useState([])
  const [loading,setLoading]=useState(true)
  const [reacts,setReacts]=useState({})

  useEffect(()=>{
    api.tracks.list("?limit=20")
      .then(d=>setPosts(d.tracks?.length?d.tracks:MOCK))
      .catch(()=>setPosts(MOCK))
      .finally(()=>setLoading(false))
  },[])

  const react=(id,r)=>setReacts(p=>({...p,[id]:{...p[id],[r]:((p[id]?.[r]||rnd(10,500))+1)}}))

  return(
    <div style={{paddingBottom:40}}>
      <div style={{fontFamily:"Syne,sans-serif",fontSize:22,fontWeight:800,marginBottom:18}}>📡 Fil d&apos;actualité</div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:22}}>
        {TABS.map(t=><button key={t} onClick={()=>setTab(t)} style={{padding:"7px 16px",borderRadius:50,border:"1px solid",fontSize:12,fontWeight:600,cursor:"pointer",transition:"all .18s",fontFamily:"Plus Jakarta Sans,sans-serif",borderColor:tab===t?"var(--gold)":"var(--border)",background:tab===t?"var(--gold)":"var(--card)",color:tab===t?"#000":"var(--text2)"}}>{t}</button>)}
      </div>
      {loading
        ?[...Array(3)].map((_,i)=><div key={i} style={{height:180,background:"var(--card)",borderRadius:"var(--radius)",border:"1px solid var(--border)",marginBottom:14,animation:"shimmer 1.5s infinite"}}/>)
        :posts.map((t,i)=><FeedPost key={t.id} post={t} idx={i} bg={BGS[i%BGS.length]} ava={AVAS[i%AVAS.length]} flag={FLAGS[t.profiles?.country||t.country]||"🌍"} isPlaying={isPlaying&&currentTrack?.id===t.id} onPlay={()=>toggle(t)} reacts={reacts[t.id]||{}} onReact={r=>react(t.id,r)} onProfile={()=>setPage("profile",{profileUsername:t.profiles?.username})} fmtK={fmtK} rnd={rnd}/>)
      }
    </div>
  )
}

function FeedPost({post:t,idx,bg,ava,flag,isPlaying,onPlay,reacts,onReact,onProfile,fmtK,rnd}){
  const WF=32
  const isPremium=t.access_type==="premium"||t.access_type==="paid"
  const rights=idx%2===0?{label:"© ALL",color:"var(--red)"}:{label:"CC BY",color:"var(--blue)"}
  return(
    <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--radius)",padding:18,marginBottom:14,transition:"border-color .2s"}} onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(245,166,35,.2)"} onMouseLeave={e=>e.currentTarget.style.borderColor="var(--border)"}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",gap:11,marginBottom:14}}>
        <div onClick={onProfile} style={{width:38,height:38,borderRadius:"50%",background:bg,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,color:"#000",flexShrink:0,cursor:"pointer",fontSize:13,overflow:"hidden"}}>
          {t.profiles?.avatar_url?<img src={t.profiles.avatar_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:ava}
        </div>
        <div style={{flex:1}}>
          <div style={{fontWeight:600,fontSize:14,display:"flex",alignItems:"center",gap:6}}>
            <span onClick={onProfile} style={{cursor:"pointer"}} onMouseEnter={e=>e.target.style.color="var(--gold)"} onMouseLeave={e=>e.target.style.color="var(--text)"}>{t.profiles?.display_name||"Artiste"}</span>
            <span style={{fontSize:9,padding:"2px 7px",borderRadius:20,fontFamily:"Space Mono,monospace",fontWeight:700,letterSpacing:.5,border:`1px solid ${rights.color}`,color:rights.color,background:`${rights.color}18`}}>{rights.label}</span>
          </div>
          <div style={{fontSize:11.5,color:"var(--text2)",marginTop:1}}>{t.genre||"Artiste"} · {flag}</div>
        </div>
        <div style={{fontSize:11,color:"var(--text3)",fontFamily:"Space Mono,monospace",flexShrink:0}}>{idx+1}h</div>
      </div>
      {/* Player */}
      <div style={{background:"var(--bg2)",border:"1px solid var(--border)",borderRadius:"var(--radius-sm)",padding:12,marginBottom:12,display:"flex",alignItems:"center",gap:10}}>
        <button onClick={onPlay} style={{width:34,height:34,background:"var(--gold)",borderRadius:"50%",border:"none",display:"flex",alignItems:"center",justifyContent:"center",color:"#000",fontSize:13,cursor:"pointer",transition:"all .2s",flexShrink:0}} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
          {isPlaying?"⏸":"▶"}
        </button>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:600,fontSize:12.5,marginBottom:5,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.title}</div>
          <div style={{display:"flex",alignItems:"center",gap:1,height:32,cursor:"pointer"}} onClick={onPlay}>
            {Array.from({length:WF},(_,i)=>{
              const h=Math.floor(Math.random()*70+30)
              const played=i<Math.floor(WF*0.3)
              return<div key={i} style={{flex:1,height:`${h}%`,background:played||isPlaying?"var(--gold)":"var(--border)",borderRadius:2,transition:"background .18s"}}/>
            })}
          </div>
        </div>
        <span style={{fontFamily:"Space Mono,monospace",fontSize:10.5,color:"var(--text2)",flexShrink:0}}>3:{String(idx%60).padStart(2,"0")}</span>
      </div>
      {/* Achat */}
      {isPremium&&<div style={{display:"flex",gap:8,marginBottom:12}}>
        <button style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:50,border:"none",background:"linear-gradient(135deg,var(--gold),#e8920a)",color:"#000",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"Plus Jakarta Sans,sans-serif"}}>
          🛒 Acheter <span style={{background:"rgba(0,0,0,.15)",borderRadius:20,padding:"1px 7px",fontSize:11}}>{t.sale_price||2500} KMF</span>
        </button>
        <button style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:50,border:"1px solid var(--border)",background:"transparent",color:"var(--text2)",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"Plus Jakarta Sans,sans-serif"}} onMouseEnter={e=>e.currentTarget.style.borderColor="var(--gold)"} onMouseLeave={e=>e.currentTarget.style.borderColor="var(--border)"}>
          ⏳ Louer <span style={{fontSize:11,color:"var(--text3)"}}>dès 200 KMF/j</span>
        </button>
      </div>}
      {/* Réactions */}
      <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
        {[["❤️","like"],["🔥","fire"],["🫶","love"],["👏","clap"]].map(([emoji,key])=>(
          <button key={key} onClick={()=>onReact(key)} style={{display:"flex",alignItems:"center",gap:4,padding:"6px 12px",borderRadius:50,border:"1px solid var(--border)",background:"var(--card2)",fontSize:12,cursor:"pointer",color:"var(--text2)",fontFamily:"Plus Jakarta Sans,sans-serif",transition:"all .15s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--gold)";e.currentTarget.style.color="var(--text)"}} onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.color="var(--text2)"}}>
            {emoji}<span>{reacts[key]||fmtK(rnd(10,5000))}</span>
          </button>
        ))}
        <button style={{display:"flex",alignItems:"center",gap:4,padding:"6px 12px",borderRadius:50,border:"1px solid var(--border)",background:"var(--card2)",fontSize:12,cursor:"pointer",color:"var(--text2)",fontFamily:"Plus Jakarta Sans,sans-serif",marginLeft:"auto"}} onMouseEnter={e=>e.currentTarget.style.borderColor="var(--gold)"} onMouseLeave={e=>e.currentTarget.style.borderColor="var(--border)"}>
          💬 {fmtK(rnd(5,200))}
        </button>
        <button style={{display:"flex",alignItems:"center",gap:4,padding:"6px 12px",borderRadius:50,border:"1px solid var(--border)",background:"var(--card2)",fontSize:12,cursor:"pointer",color:"var(--text2)",fontFamily:"Plus Jakarta Sans,sans-serif"}} onMouseEnter={e=>e.currentTarget.style.borderColor="var(--gold)"} onMouseLeave={e=>e.currentTarget.style.borderColor="var(--border)"}>
          📤 Partager
        </button>
      </div>
    </div>
  )
}
