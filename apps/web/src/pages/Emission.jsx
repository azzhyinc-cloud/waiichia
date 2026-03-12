import { useState, useEffect } from "react"
import api from "../services/api.js"

const CATS=["Tout","🎭 Culture","🌱 Jeunesse","🗣️ Société","⚽ Sport","🎵 Musique","💼 Économie","🕌 Religion"]
const MOCK=[
  {id:"e1",title:"Waiichia Talk",host:"DJ Comoros",category:"culture",episodes_count:24,description:"Le talk-show musical des Comores",is_featured:true},
  {id:"e2",title:"Africa Rising",host:"Fatima Ousseni",category:"societe",episodes_count:18,description:"Les voix de la jeunesse africaine",is_featured:true},
  {id:"e3",title:"Sport Afrika",host:"Omar Said",category:"sport",episodes_count:52,description:"L'actualité sportive africaine",is_featured:false},
  {id:"e4",title:"Business Comores",host:"Nassuf Ahmed",category:"economie",episodes_count:31,description:"Entrepreneuriat et finance",is_featured:false},
  {id:"e5",title:"Nguzo za Dini",host:"Sheikh Abdillah",category:"religion",episodes_count:88,description:"Enseignements islamiques",is_featured:false},
  {id:"e6",title:"Jeunesse en Action",host:"Mariama Combo",category:"jeunesse",episodes_count:15,description:"Initiatives jeunes des îles",is_featured:true},
]
const COLS={culture:"#9b59f5",societe:"#4d9fff",sport:"#2dc653",economie:"#f5a623",religion:"#e63946",jeunesse:"#ff6b35",musique:"#f5a623"}
const EMO=["📺","🎙️","📡","🎬","🌍","⭐","🎭","💼"]
const emo=s=>EMO[s?.charCodeAt(0)%8||0]

export default function Emission(){
  const[cat,setCat]=useState("Tout")
  const[emissions,setEmissions]=useState([])
  const[loading,setLoading]=useState(true)
  const[selected,setSelected]=useState(null)

  useEffect(()=>{
    api.emissions.list("?limit=20")
      .then(d=>setEmissions(d.emissions?.length?d.emissions:MOCK))
      .catch(()=>setEmissions(MOCK))
      .finally(()=>setLoading(false))
  },[])

  const catKey=c=>c.replace(/[^a-zéè]/gi,"").toLowerCase().slice(0,8)
  const filtered=cat==="Tout"?emissions:emissions.filter(e=>e.category===catKey(cat))
  const featured=filtered.filter(e=>e.is_featured)

  if(selected) return <EpView emission={selected} onBack={()=>setSelected(null)}/>

  return(
    <div style={{paddingBottom:40}}>

      {/* HERO */}
      <div style={{background:"linear-gradient(135deg,#0a1e2e 0%,#1060a0 60%,#0a2e1e 100%)",
        borderRadius:"var(--radius)",padding:28,marginBottom:22,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",right:-10,top:-10,fontSize:100,opacity:.08,pointerEvents:"none"}}>📺</div>
        <div style={{display:"inline-flex",alignItems:"center",gap:7,background:"rgba(77,159,255,.2)",
          border:"1px solid rgba(77,159,255,.4)",borderRadius:50,padding:"5px 14px",fontSize:10,
          fontFamily:"Space Mono,monospace",color:"var(--blue)",letterSpacing:"1.2px",marginBottom:12}}>
          📺 ÉMISSIONS AFRICAINES
        </div>
        <div style={{fontFamily:"Syne,sans-serif",fontSize:26,fontWeight:800,lineHeight:1.2,marginBottom:8}}>
          Programmes & Talk-shows<br/>
          <span style={{background:"linear-gradient(135deg,var(--blue),var(--green))",
            WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>
            de toute l&apos;Afrique
          </span>
        </div>
        <div style={{fontSize:13,color:"var(--text2)",maxWidth:420}}>
          Culture, jeunesse, société, sport — les émissions qui font l&apos;Afrique d&apos;aujourd&apos;hui.
        </div>
      </div>

      {/* FILTRES */}
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:22}}>
        {CATS.map(c=>(
          <button key={c} onClick={()=>setCat(c)}
            style={{padding:"6px 14px",borderRadius:50,border:"1px solid",fontSize:12,fontWeight:600,
              cursor:"pointer",transition:"all .18s",fontFamily:"Plus Jakarta Sans,sans-serif",
              borderColor:cat===c?"var(--blue)":"var(--border)",
              background:cat===c?"var(--blue)":"var(--card)",
              color:cat===c?"#fff":"var(--text2)"}}>
            {c}
          </button>
        ))}
      </div>

      {/* EN VEDETTE */}
      {featured.length>0&&<>
        <Hdr title="⭐ En vedette"/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:14,marginBottom:28}}>
          {featured.map(e=><Card key={e.id} emission={e} onSelect={setSelected} featured/>)}
        </div>
      </>}

      {/* TOUTES */}
      <Hdr title="📺 Toutes les émissions"
        right={<span style={{fontSize:12,color:"var(--text2)"}}>{filtered.length} émission{filtered.length>1?"s":""}</span>}/>
      {loading?<Skel/>:(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:14}}>
          {filtered.map(e=><Card key={e.id} emission={e} onSelect={setSelected}/>)}
          {!filtered.length&&<div style={{color:"var(--text3)",fontSize:13,padding:"40px 0",
            gridColumn:"1/-1",textAlign:"center"}}>Aucune émission dans cette catégorie</div>}
        </div>
      )}
    </div>
  )
}

function Card({emission:e,onSelect,featured}){
  const[hov,setHov]=useState(false)
  const color=COLS[e.category]||"var(--blue)"
  return(
    <div onClick={()=>onSelect(e)}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{background:"var(--card)",border:`1px solid ${hov?"rgba(77,159,255,.4)":"var(--border)"}`,
        borderRadius:"var(--radius)",overflow:"hidden",cursor:"pointer",transition:"all .25s",
        transform:hov?"translateY(-5px)":"none",boxShadow:hov?"0 16px 40px var(--shadow)":"none"}}>
      <div style={{height:featured?160:120,background:`linear-gradient(135deg,${color}22,${color}44)`,
        display:"flex",alignItems:"center",justifyContent:"center",fontSize:48,position:"relative"}}>
        {e.cover_url?<img src={e.cover_url} alt={e.title} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:emo(e.title)}
        <span style={{position:"absolute",top:8,right:8,padding:"3px 9px",borderRadius:20,
          fontSize:9,fontFamily:"Space Mono,monospace",fontWeight:700,textTransform:"uppercase",
          background:color,color:"#fff"}}>{e.category||"Émission"}</span>
        {featured&&<span style={{position:"absolute",top:8,left:8,padding:"3px 8px",borderRadius:20,
          fontSize:9,fontFamily:"Space Mono,monospace",fontWeight:700,
          background:"var(--gold)",color:"#000"}}>⭐ VEDETTE</span>}
      </div>
      <div style={{padding:"12px 14px"}}>
        <div style={{fontFamily:"Syne,sans-serif",fontSize:14,fontWeight:700,marginBottom:4,
          overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.title}</div>
        <div style={{fontSize:11.5,color:"var(--text2)",marginBottom:6}}>🎙️ {e.host||"Waiichia"}</div>
        <div style={{fontSize:11,color:"var(--text3)",marginBottom:10,overflow:"hidden",
          textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.description}</div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontSize:11,color:"var(--text3)",fontFamily:"Space Mono,monospace"}}>
            {e.episodes_count||0} épisodes
          </span>
          <button style={{padding:"5px 12px",borderRadius:50,border:`1px solid ${color}`,
            background:hov?color:"transparent",color:hov?"#fff":color,fontSize:11,fontWeight:700,
            cursor:"pointer",transition:"all .18s",fontFamily:"Plus Jakarta Sans,sans-serif"}}>
            ▶ Écouter
          </button>
        </div>
      </div>
    </div>
  )
}

function EpView({emission:e,onBack}){
  const[eps,setEps]=useState([])
  const[loading,setLoading]=useState(true)
  const color=COLS[e.category]||"var(--blue)"
  const fmt=s=>`${Math.floor(s/60)}min`

  useEffect(()=>{
    api.emissions.episodes(e.id)
      .then(d=>setEps(d.episodes||[]))
      .catch(()=>setEps([
        {id:"ep1",number:1,title:"Épisode 1 — Introduction",duration_sec:1800},
        {id:"ep2",number:2,title:"Épisode 2 — L'Afrique en mouvement",duration_sec:2400},
        {id:"ep3",number:3,title:"Épisode 3 — Interviews exclusives",duration_sec:2100},
      ]))
      .finally(()=>setLoading(false))
  },[e.id])

  return(
    <div style={{paddingBottom:40}}>
      <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:8,background:"none",
        border:"none",color:"var(--gold)",cursor:"pointer",fontSize:13,fontWeight:600,marginBottom:20,
        fontFamily:"Plus Jakarta Sans,sans-serif"}}>← Retour aux émissions</button>
      <div style={{background:`linear-gradient(135deg,${color}22,${color}11)`,
        border:`1px solid ${color}44`,borderRadius:"var(--radius)",padding:24,marginBottom:24,
        display:"flex",gap:20,alignItems:"center"}}>
        <div style={{width:80,height:80,borderRadius:14,background:`linear-gradient(135deg,${color},${color}88)`,
          display:"flex",alignItems:"center",justifyContent:"center",fontSize:36,flexShrink:0}}>
          {emo(e.title)}
        </div>
        <div>
          <div style={{fontFamily:"Syne,sans-serif",fontSize:22,fontWeight:800,marginBottom:4}}>{e.title}</div>
          <div style={{fontSize:13,color:"var(--text2)",marginBottom:4}}>🎙️ {e.host}</div>
          <div style={{fontSize:12,color:"var(--text3)"}}>{e.description}</div>
        </div>
      </div>
      <Hdr title={`📋 Épisodes (${eps.length})`}/>
      {loading?<Skel/>:(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {eps.map(ep=>(
            <div key={ep.id} style={{background:"var(--card)",border:"1px solid var(--border)",
              borderRadius:"var(--radius-sm)",padding:"14px 18px",display:"flex",
              alignItems:"center",gap:14,cursor:"pointer",transition:"all .2s"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=color}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)"}}>
              <div style={{width:36,height:36,borderRadius:8,background:`${color}22`,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:16,fontWeight:800,color,flexShrink:0}}>{ep.number||"▶"}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ep.title}</div>
              </div>
              {ep.duration_sec&&<span style={{fontSize:11,color:"var(--text3)",
                fontFamily:"Space Mono,monospace",flexShrink:0}}>{fmt(ep.duration_sec)}</span>}
              <button style={{padding:"6px 14px",borderRadius:50,border:`1px solid ${color}`,
                background:"transparent",color,fontSize:11,fontWeight:700,cursor:"pointer",flexShrink:0,
                fontFamily:"Plus Jakarta Sans,sans-serif"}}
                onMouseEnter={e=>{e.currentTarget.style.background=color;e.currentTarget.style.color="#fff"}}
                onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=color}}>
                ▶ Jouer
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Hdr({title,right}){return(
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
    <div style={{fontFamily:"Syne,sans-serif",fontSize:18,fontWeight:700,display:"flex",alignItems:"center",gap:8}}>
      <span style={{width:3,height:18,background:"linear-gradient(180deg,var(--blue),var(--green))",borderRadius:3,display:"inline-block"}}/>
      {title}
    </div>
    {right}
  </div>
)}

function Skel(){return(
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:14}}>
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
