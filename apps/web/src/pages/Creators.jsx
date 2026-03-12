import { useState, useEffect } from "react"
import { usePageStore } from "../stores/index.js"
import api from "../services/api.js"

const TYPES=["Tous","Artiste","Media","Label","Influenceur","Entrepreneur","Pro"]
const PAYS=["🌍 Tous pays","🇰🇲 Comores","🇲🇬 Madagascar","🇳🇬 Nigeria","🇨🇮 Côte d'Ivoire","🇸🇳 Sénégal"]
const BGS=["linear-gradient(135deg,#f5a623,#e63946)","linear-gradient(135deg,#2dc653,#1060a0)","linear-gradient(135deg,#9b59f5,#4d9fff)","linear-gradient(135deg,#ff6b35,#cc4411)","linear-gradient(135deg,#f5a623,#2dc653)","linear-gradient(135deg,#e63946,#9b59f5)"]
const AVAS=["KO","DJ","FK","NP","WB","OS","KM","EM","MF","AS","WA","RC"]
const MOCK=Array.from({length:18},(_,i)=>({id:`c${i}`,display_name:["Kolo Officiel","DJ Comoros","Fatima K","Nadjib Pro","Waiichia Beats","Omar Said","Studio KM","East Mix","Moroni Flow","Afrika Sound","Wanzani Records","Comoros Creative"][i%12],username:["kolo","djcomoros","fatimak","nadjib","wbeats","omar","studiokm","eastmix","moroniflow","afrikasound","wanzani","comocreate"][i%12],profile_type:["artist","artist","artist","artist","label","media","artist","artist","artist","label","label","artist"][i%12],fans_count:Math.floor(Math.random()*50000+500),country:["KM","KM","KM","KM","MG","NG","KM","KM","KM","CI","SN","KM"][i%12],is_verified:i%3===0,avatar_url:null,tracks_count:Math.floor(Math.random()*80+5)}))
const fmtK=n=>n>=1000?(n/1000).toFixed(1)+"K":String(n||0)
const FLAGS={"KM":"🇰🇲","MG":"🇲🇬","NG":"🇳🇬","CI":"🇨🇮","SN":"🇸🇳","TZ":"🇹🇿","RW":"🇷🇼"}

export default function Creators() {
  const { setPage } = usePageStore()
  const [type,setType]=useState("Tous")
  const [pays,setPays]=useState("")
  const [creators,setCreators]=useState([])
  const [loading,setLoading]=useState(true)
  const [followed,setFollowed]=useState({})

  useEffect(()=>{
    api.profiles.list("?limit=50")
      .then(d=>setCreators(d.profiles?.length?d.profiles:MOCK))
      .catch(()=>setCreators(MOCK))
      .finally(()=>setLoading(false))
  },[])

  const filtered=creators.filter(c=>{
    if(type!=="Tous"&&c.profile_type!==type.toLowerCase())return false
    return true
  })

  return(
    <div style={{paddingBottom:40}}>
      <div style={{fontFamily:"Syne,sans-serif",fontSize:22,fontWeight:800,marginBottom:20}}>⭐ Créateurs Waiichia</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:24,alignItems:"center"}}>
        {TYPES.map(t=>(<button key={t} onClick={()=>setType(t)} style={{padding:"6px 14px",borderRadius:50,border:"1px solid",fontSize:12,fontWeight:600,cursor:"pointer",transition:"all .18s",fontFamily:"Plus Jakarta Sans,sans-serif",borderColor:type===t?"var(--gold)":"var(--border)",background:type===t?"var(--gold)":"var(--card)",color:type===t?"#000":"var(--text2)"}}>{t}</button>))}
        <select value={pays} onChange={e=>setPays(e.target.value)} style={{padding:"7px 12px",borderRadius:"var(--radius-sm)",border:"1px solid var(--border)",background:"var(--card)",color:"var(--text)",fontSize:12,cursor:"pointer",outline:"none"}}>
          {PAYS.map(p=><option key={p} value={p.includes("Tous")?"":p}>{p}</option>)}
        </select>
      </div>
      {loading?<Skel/>:(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:12}}>
          {filtered.map((c,i)=><CreatorCard key={c.id} creator={c} bg={BGS[i%BGS.length]} ava={AVAS[i%AVAS.length]} followed={!!followed[c.id]} onFollow={()=>setFollowed(p=>({...p,[c.id]:!p[c.id]}))} onProfile={()=>setPage("profile",{profileUsername:c.username})} fmtK={fmtK} flag={FLAGS[c.country]||"🌍"}/>)}
          {!filtered.length&&<div style={{color:"var(--text3)",fontSize:13,padding:"40px 0",gridColumn:"1/-1",textAlign:"center"}}>Aucun créateur dans cette catégorie</div>}
        </div>
      )}
    </div>
  )
}

function CreatorCard({creator:c,bg,ava,followed,onFollow,onProfile,fmtK,flag}){
  const[hov,setHov]=useState(false)
  const typeLabel={artist:"Artiste",label:"Label",media:"Media",influencer:"Influenceur",entrepreneur:"Entrepreneur",pro:"Pro"}[c.profile_type]||"Artiste"
  return(
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{background:"var(--card)",border:`1px solid ${hov?"rgba(245,166,35,.4)":"var(--border)"}`,borderRadius:"var(--radius)",padding:"18px 14px",textAlign:"center",transition:"all .25s",transform:hov?"translateY(-4px)":"none",boxShadow:hov?"0 12px 30px var(--shadow)":"none",cursor:"pointer"}}>
      <div style={{position:"relative",width:64,height:64,margin:"0 auto 10px"}} onClick={onProfile}>
        <div style={{width:64,height:64,borderRadius:"50%",background:bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:800,color:"#000",overflow:"hidden"}}>
          {c.avatar_url?<img src={c.avatar_url} alt={c.display_name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:ava}
        </div>
        {c.is_verified&&<div style={{position:"absolute",bottom:0,right:0,width:18,height:18,borderRadius:"50%",background:"var(--blue)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff",border:"2px solid var(--card)"}}>✓</div>}
      </div>
      <div style={{fontSize:10,color:"var(--text3)",fontFamily:"Space Mono,monospace",textTransform:"uppercase",letterSpacing:.5,marginBottom:4}}>{typeLabel}</div>
      <div style={{fontWeight:700,fontSize:13,marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} onClick={onProfile}>{c.display_name}</div>
      <div style={{fontSize:11.5,color:"var(--text2)",marginBottom:10}}>{fmtK(c.fans_count)} fans · {flag}</div>
      <button onClick={onFollow} style={{width:"100%",padding:"7px",borderRadius:50,fontSize:12,fontWeight:700,cursor:"pointer",transition:"all .2s",fontFamily:"Plus Jakarta Sans,sans-serif",border:followed?"none":"1px solid var(--border)",background:followed?"var(--gold)":"transparent",color:followed?"#000":"var(--text2)"}}>
        {followed?"✓ Suivi":"Suivre"}
      </button>
    </div>
  )
}
function Skel(){return(<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:12}}>{[...Array(12)].map((_,i)=><div key={i} style={{height:180,background:"var(--card)",borderRadius:"var(--radius)",border:"1px solid var(--border)",animation:"shimmer 1.5s infinite"}}/>)}</div>)}
