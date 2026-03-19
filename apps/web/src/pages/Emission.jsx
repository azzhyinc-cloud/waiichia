import { useState, useEffect } from "react"
import { usePlayerStore } from "../stores/index.js"
import api from "../services/api.js"

const CATS=['Tout','🎭 Culture','🌱 Jeunesse','🗣️ Société','⚽ Sport','🎵 Musique','💼 Économie','🕌 Religion']
const BGS=["linear-gradient(135deg,#0a1e2e,#1060a0)","linear-gradient(135deg,#1a0a2e,#4a1a7a)","linear-gradient(135deg,#002a10,#007040)","linear-gradient(135deg,#2e1a00,#7a4000)","linear-gradient(135deg,#1a0020,#5a0060)","linear-gradient(135deg,#001a2e,#005080)"]
const MOCK=[
  {id:"e1",title:"Le Talk Africain",host:"Karim Said",channel:"Radio Komori FM",category:"culture",language:"fr",country:"KM",featured:true,is_new:true,episodes_count:42,cover_url:null},
  {id:"e2",title:"Afrobeats Inside",host:"DJ Comoros",channel:"Waiichia FM",category:"musique",language:"fr",country:"KM",featured:true,is_new:false,episodes_count:28,cover_url:null},
  {id:"e3",title:"Jeunes Talents KM",host:"Fatima K.",channel:"ORTC",category:"jeunesse",language:"km",country:"KM",featured:true,is_new:true,episodes_count:15,cover_url:null},
  {id:"e4",title:"Débat Société",host:"Ali Mchangama",channel:"Radio Komori FM",category:"societe",language:"fr",country:"KM",featured:false,is_new:false,episodes_count:64,cover_url:null},
  {id:"e5",title:"Sport Komori",host:"Nadjib Pro",channel:"ORTC",category:"sport",language:"fr",country:"KM",featured:false,is_new:false,episodes_count:38,cover_url:null},
  {id:"e6",title:"Éco des Îles",host:"Amina Coach",channel:"Waiichia FM",category:"economie",language:"fr",country:"KM",featured:false,is_new:true,episodes_count:12,cover_url:null},
]
const fmtK=n=>n>=1000?(n/1000).toFixed(1)+"K":String(n||0)

export default function Emission(){
  const [cat,setCat]=useState('Tout')
  const [emissions,setEmissions]=useState([])
  const [loading,setLoading]=useState(true)

  useEffect(()=>{
    api.emissions.list('?limit=30')
      .then(d=>setEmissions(d.emissions?.length?d.emissions:MOCK))
      .catch(()=>setEmissions(MOCK))
      .finally(()=>setLoading(false))
  },[])

  const filtered=cat==='Tout'?emissions:emissions.filter(e=>e.category?.toLowerCase().includes(cat.replace(/^[^ ]+ /,'').toLowerCase()))
  const featured=filtered.filter(e=>e.featured)
  const all=filtered

  return(
    <div style={{paddingBottom:40}}>
      <div className="page-title">📺 Émissions</div>

      {/* HERO BANNER */}
      <div style={{background:'linear-gradient(135deg,#0a1e2e 0%,#1060a0 60%,#0a2e1e 100%)',borderRadius:'var(--radius)',padding:24,marginBottom:20,position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',right:-10,top:-10,fontSize:100,opacity:.08}}>📺</div>
        <div style={{display:'inline-flex',alignItems:'center',gap:7,background:'rgba(77,159,255,.2)',border:'1px solid rgba(77,159,255,.4)',borderRadius:50,padding:'5px 14px',fontSize:10,fontFamily:'Space Mono,monospace',color:'var(--blue)',letterSpacing:'1.2px',marginBottom:12}}>📺 ÉMISSIONS AFRICAINES</div>
        <div style={{fontFamily:'Syne,sans-serif',fontSize:26,fontWeight:800,lineHeight:1.2,marginBottom:8}}>Programmes & Talk-shows<br/><span style={{background:'linear-gradient(135deg,var(--blue),var(--green))',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>de toute l'Afrique</span></div>
        <div style={{fontSize:13,color:'var(--text2)',maxWidth:420}}>Culture, jeunesse, société, sport — les émissions qui font l'Afrique d'aujourd'hui.</div>
      </div>

      {/* FILTRES */}
      <div className="genre-chips" style={{marginBottom:16}}>
        {CATS.map(c=>(
          <div key={c} className={`genre-chip${cat===c?' active':''}`} onClick={()=>setCat(c)}>{c}</div>
        ))}
      </div>

      {/* EN VEDETTE */}
      {featured.length>0&&<>
        <div className="section-hdr">
          <div className="section-title">⭐ En vedette</div>
          <div style={{display:'flex',alignItems:'center',gap:6,fontSize:11,color:'var(--green)'}}>
            <div style={{width:6,height:6,borderRadius:'50%',background:'var(--green)',animation:'live-pulse 2s infinite'}}/>
            Nouvelles cette semaine
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:14,marginBottom:24}}>
          {featured.map((e,i)=><EmissionCard key={e.id} em={e} bg={BGS[i%6]} featured/>)}
        </div>
      </>}

      {/* TOUTES LES ÉMISSIONS */}
      <div className="section-hdr">
        <div className="section-title">📺 Toutes les émissions</div>
        <span style={{fontSize:12,color:'var(--text2)'}}>{all.length} émission{all.length>1?'s':''}</span>
      </div>
      {loading
        ?<div className="tracks-grid">{[...Array(4)].map((_,i)=><div key={i} style={{height:200,background:'var(--card)',borderRadius:'var(--radius)',border:'1px solid var(--border)',animation:'shimmer 1.5s infinite'}}/>)}</div>
        :<div className="tracks-grid">
          {all.map((e,i)=><EmissionCard key={e.id} em={e} bg={BGS[i%6]}/>)}
          {!all.length&&<div style={{gridColumn:'1/-1',textAlign:'center',padding:60,color:'var(--text3)'}}>Aucune émission dans cette catégorie</div>}
        </div>
      }
    </div>
  )
}

function EmissionCard({em,bg,featured}){
  const [hov,setHov]=useState(false)
  return(
    <div className="track-card" onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}>
      <div className="track-cover">
        <div className="track-cover-bg" style={{background:bg}}>{em.cover_url?<img src={em.cover_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:"📺"}</div>
        <div className="type-badge type-emission">{em.category?.toUpperCase()||'ÉMISSION'}</div>
        {em.is_new&&<div style={{position:'absolute',top:8,left:8,padding:'3px 9px',borderRadius:20,fontSize:9,fontFamily:'Space Mono,monospace',fontWeight:700,background:'var(--green)',color:'#000'}}>NEW</div>}
        <div className="play-overlay"><button className="play-btn-circle">▶</button></div>
      </div>
      <div className="track-info">
        <div className="track-title">{em.title}</div>
        <div className="track-artist">{em.host||'Présentateur'} · {em.channel||'Chaîne'}</div>
        <div className="track-meta">
          <span>{em.episodes_count||0} épisodes</span>
          <span>🌍 {em.country||'KM'} · {em.language==='km'?'Shikomori':'Français'}</span>
        </div>
      </div>
    </div>
  )
}
