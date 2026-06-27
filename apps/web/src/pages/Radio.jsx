import { useState, useEffect } from "react"
import { usePlayerStore } from "../stores/index.js"
import api from "../services/api.js"

const PAYS=["Tous les pays","🇰🇲 Comores","🇲🇬 Madagascar","🇹🇿 Tanzanie","🇷🇼 Rwanda","🇨🇮 Côte d'Ivoire","🇳🇬 Nigeria","🇨🇩 RD Congo","🇨🇬 Congo Brazzaville","🇸🇳 Sénégal","🇬🇭 Ghana"]
const TYPES=["Tout","📻 Radio","🎪 Événement Live","📺 Émission","🎙️ Podcast Live"]
const LANGS=["Toutes","Shikomori","Français","Swahili","Anglais","Kinyarwanda","Malagasy","Yoruba"]
const BGS=["linear-gradient(135deg,#f5a623,#e63946)","linear-gradient(135deg,#2dc653,#1060a0)","linear-gradient(135deg,#9b59f5,#4d9fff)","linear-gradient(135deg,#ff6b35,#cc4411)","linear-gradient(135deg,#f5a623,#2dc653)"]
const fmtK=n=>n>=1000?(n/1000).toFixed(1)+"K":String(n||0)
const FLAGS={"KM":"🇰🇲","MG":"🇲🇬","NG":"🇳🇬","CI":"🇨🇮","SN":"🇸🇳","TZ":"🇹🇿","RW":"🇷🇼","CD":"🇨🇩","CG":"🇨🇬","GH":"🇬🇭"}

export default function Radio() {
  const { play, currentTrack, isPlaying, pause, resume } = usePlayerStore()
  const [pays,setPays]=useState("")
  const [type,setType]=useState("Tout")
  const [lang,setLang]=useState("")
  const [stations,setStations]=useState([])
  const [loading,setLoading]=useState(true)

  useEffect(()=>{
    api.radio.list("?limit=30")
      .then(d=>setStations(d.stations || []))
      .catch(()=>setStations([]))
      .finally(()=>setLoading(false))
  },[])

  const filtered=stations.filter(s=>{
    if(pays&&!s.country?.includes(pays.slice(-2)))return false
    if(type!=="Tout"&&!s.category?.toLowerCase().includes(type.replace(/[^a-z]/gi,"").toLowerCase().slice(0,5)))return false
    if(lang&&lang!=="Toutes"&&!s.language?.includes(lang))return false
    return true
  })
  const live=filtered.filter(s=>s.is_live!==false)
  const offline=filtered.filter(s=>s.is_live===false)

  const handlePlay=s=>{
    if(currentTrack?.title===s.name){isPlaying?pause():resume()}
    else play({id:s.id,title:s.name,artist:s.name,profiles:{display_name:s.name},audio_url_128:s.stream_url||""})
  }

  return(
    <div style={{paddingBottom:40}}>
      <div style={{fontFamily:"Syne,sans-serif",fontSize:22,fontWeight:800,marginBottom:20}}>📻 Radio & Émissions Live</div>
      <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:24,background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--radius)",padding:16}}>
        {[{label:"🌍 Pays",val:pays,set:setPays,opts:PAYS},{label:"📡 Type",val:type,set:setType,opts:TYPES},{label:"🗣️ Langue",val:lang,set:setLang,opts:LANGS}].map(f=>(
          <div key={f.label} style={{display:"flex",flexDirection:"column",gap:6}}>
            <label style={{fontSize:11,color:"var(--text3)",fontFamily:"Space Mono,monospace",textTransform:"uppercase",letterSpacing:1}}>{f.label}</label>
            <select value={f.val} onChange={e=>f.set(e.target.value)} style={{padding:"7px 12px",borderRadius:"var(--radius-sm)",border:"1px solid var(--border)",background:"var(--bg2)",color:"var(--text)",fontSize:12,cursor:"pointer",outline:"none"}}>
              {f.opts.map(o=><option key={o} value={o.includes("Tous")||o.includes("Tout")||o.includes("Toutes")?"":o}>{o}</option>)}
            </select>
          </div>
        ))}
      </div>

      {loading
        ?<Skel/>
        :filtered.length>0
          ?<>
            {live.length>0&&<><Hdr title="🔴 En Direct" right={<div style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:"var(--text2)"}}><div style={{width:7,height:7,borderRadius:"50%",background:"var(--red)",animation:"live-pulse 1.4s infinite"}}/>Diffusion en cours</div>}/>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:14,marginBottom:28}}>
                {live.map((s,i)=><StationCard key={s.id} station={s} bg={BGS[i%BGS.length]} flag={FLAGS[s.country]||"🌍"} isCurrent={currentTrack?.title===s.name} isPlaying={isPlaying&&currentTrack?.title===s.name} onPlay={()=>handlePlay(s)} fmtK={fmtK}/>)}
              </div>
            </>}
            {offline.length>0&&<><Hdr title="📡 Prochainement en direct"/>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:14}}>
                {offline.map((s,i)=><StationCard key={s.id} station={s} bg={BGS[i%BGS.length]} flag={FLAGS[s.country]||"🌍"} offline fmtK={fmtK}/>)}
              </div>
            </>}
          </>
          :<div style={{textAlign:"center",padding:60,color:"var(--text3)"}}>
            <div style={{fontSize:48,marginBottom:12}}>📻</div>
            <div style={{fontFamily:"Syne,sans-serif",fontSize:16,fontWeight:700,marginBottom:6}}>Aucune station disponible</div>
            <div style={{fontSize:13}}>Les radios et flux live apparaîtront ici dès qu'ils seront ajoutés.</div>
          </div>
      }
    </div>
  )
}

function StationCard({station:s,bg,flag,isCurrent,isPlaying,onPlay,offline,fmtK}){
  const[hov,setHov]=useState(false)
  return(
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{background:"var(--card)",border:`1px solid ${isCurrent?"var(--gold)":hov?"rgba(245,166,35,.3)":"var(--border)"}`,borderRadius:"var(--radius)",overflow:"hidden",transition:"all .25s",boxShadow:isCurrent?"0 0 0 2px rgba(245,166,35,.2)":"none"}}>
      <div style={{display:"flex",alignItems:"center",gap:14,padding:16}}>
        <div style={{width:56,height:56,borderRadius:12,background:bg,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,boxShadow:"0 4px 14px rgba(0,0,0,.3)",position:"relative",overflow:"hidden"}}>
          {s.logo_url?<img src={s.logo_url} alt={s.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:"📻"}
          {s.is_live&&!offline&&<div style={{position:"absolute",bottom:0,left:0,right:0,background:"var(--red)",fontSize:8,fontFamily:"Space Mono,monospace",fontWeight:700,textAlign:"center",padding:"2px 0",color:"#fff",letterSpacing:1}}>LIVE</div>}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:600,fontSize:13.5,marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.name}</div>
          <div style={{fontSize:11.5,color:"var(--text2)",marginBottom:4}}>{s.description||s.genre||'Radio'}</div>
          <div style={{fontSize:11,color:"var(--text3)",fontFamily:"Space Mono,monospace"}}>🎧 {fmtK(s.listeners||0)} · {flag} · {s.language?.split("/")[0]||'—'}</div>
        </div>
        {!offline&&<button onClick={onPlay} style={{padding:"8px 16px",borderRadius:50,border:"none",flexShrink:0,background:isPlaying?"var(--red)":isCurrent?"var(--gold)":"linear-gradient(135deg,var(--gold),#e8920a)",color:"#000",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"Plus Jakarta Sans,sans-serif",transition:"all .2s"}}>
          {isPlaying?"⏸ Pause":"▶ Live"}
        </button>}
        {offline&&<span style={{fontSize:11,color:"var(--text3)",fontFamily:"Space Mono,monospace",flexShrink:0}}>⏰ Bientôt</span>}
      </div>
    </div>
  )
}
function Hdr({title,right}){return(<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}><div style={{fontFamily:"Syne,sans-serif",fontSize:18,fontWeight:700,display:"flex",alignItems:"center",gap:8}}><span style={{width:3,height:18,background:"linear-gradient(180deg,var(--red),var(--gold))",borderRadius:3,display:"inline-block"}}/>{title}</div>{right}</div>)}
function Skel(){return(<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:14,marginBottom:28}}>{[...Array(4)].map((_,i)=><div key={i} style={{height:100,background:"var(--card)",borderRadius:"var(--radius)",border:"1px solid var(--border)",animation:"shimmer 1.5s infinite"}}/>)}</div>)}
