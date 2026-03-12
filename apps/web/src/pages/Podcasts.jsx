import { useState, useEffect } from "react"
import { usePlayerStore } from "../stores/index.js"
import api from "../services/api.js"

const GENRES=["Tout","💡 Mindset","💼 Économie","🚀 Entrepreneuriat","📚 Éducation","🕌 Religion","🌍 Culture","🏋️ Lifestyle","💻 Tech","⚕️ Santé"]
const BGS=["linear-gradient(135deg,#1a0a2e,#4a1a6e)","linear-gradient(135deg,#0a2a1a,#1a6040)","linear-gradient(135deg,#2e1a00,#7a4000)","linear-gradient(135deg,#0a1a2e,#1a3a5a)","linear-gradient(135deg,#2a0a0a,#6a1a1a)","linear-gradient(135deg,#0a2a2a,#1a5a5a)"]
const MOCK_EPISODES=[
  {id:"p1",title:"Comment lancer son business aux Comores en 2026",host:"Coach Amina",duration:"42:18",genre:"entrepreneuriat",plays:12400,cover_url:null,bg:BGS[0],episode:1,serie:"Business Mindset KM"},
  {id:"p2",title:"L'économie bleue : opportunités pour les îles africaines",host:"Dr. Moussa Karibu",duration:"38:45",genre:"économie",plays:8900,cover_url:null,bg:BGS[1],episode:3,serie:"Afrika Économie"},
  {id:"p3",title:"Mindset des entrepreneurs qui réussissent",host:"Coach Amina",duration:"55:20",genre:"mindset",plays:21000,cover_url:null,bg:BGS[0],episode:2,serie:"Business Mindset KM"},
  {id:"p4",title:"Islam et modernité : trouver l'équilibre",host:"Cheikh Omar Said",duration:"1:12:05",genre:"religion",plays:34500,cover_url:null,bg:BGS[3],episode:5,serie:"Lumières de l'Islam"},
  {id:"p5",title:"Tech africaine : les startups qui changent tout",host:"Nassim Dev",duration:"44:30",genre:"tech",plays:7800,cover_url:null,bg:BGS[5],episode:1,serie:"Tech Afrika"},
  {id:"p6",title:"La culture Shikomori expliquée aux jeunes",host:"Fatima K.",duration:"36:15",genre:"culture",plays:15200,cover_url:null,bg:BGS[2],episode:7,serie:"Racines Comoriennes"},
  {id:"p7",title:"Santé mentale : briser le tabou en Afrique",host:"Dr. Aisha Youssouf",duration:"48:00",genre:"santé",plays:19800,cover_url:null,bg:BGS[4],episode:2,serie:"Santé & Vie"},
  {id:"p8",title:"Investir en Afrique : guide pratique 2026",host:"Dr. Moussa Karibu",duration:"51:22",genre:"économie",plays:11300,cover_url:null,bg:BGS[1],episode:4,serie:"Afrika Économie"},
]
const MOCK_SERIES=[
  {id:"s1",title:"Business Mindset KM",host:"Coach Amina",episodes:6,bg:BGS[0],genre:"entrepreneuriat",desc:"Série complète pour entrepreneurs comoriens",cover_url:null},
  {id:"s2",title:"Afrika Économie",host:"Dr. Moussa Karibu",episodes:8,bg:BGS[1],genre:"économie",desc:"Décryptage de l'économie africaine",cover_url:null},
  {id:"s3",title:"Lumières de l'Islam",host:"Cheikh Omar Said",episodes:12,bg:BGS[3],genre:"religion",desc:"Conférences islamiques en shikomori et français",cover_url:null},
  {id:"s4",title:"Racines Comoriennes",host:"Fatima K.",episodes:10,bg:BGS[2],genre:"culture",desc:"Histoire et culture des Comores",cover_url:null},
  {id:"s5",title:"Tech Afrika",host:"Nassim Dev",episodes:5,bg:BGS[5],genre:"tech",desc:"Innovation et tech sur le continent",cover_url:null},
  {id:"s6",title:"Santé & Vie",host:"Dr. Aisha Youssouf",episodes:7,bg:BGS[4],genre:"santé",desc:"Santé mentale et physique en contexte africain",cover_url:null},
]
const fmtK=n=>n>=1000?(n/1000).toFixed(1)+"K":String(n)

export default function Podcasts() {
  const { toggle, currentTrack, isPlaying } = usePlayerStore()
  const [genre,setGenre]=useState("Tout")
  const [episodes,setEpisodes]=useState([])
  const [series,setSeries]=useState([])
  const [loading,setLoading]=useState(true)

  useEffect(()=>{
    api.tracks.list("?type=podcast&limit=20")
      .then(d=>{
        if(d.tracks?.length){setEpisodes(d.tracks)}
        else{setEpisodes(MOCK_EPISODES);setSeries(MOCK_SERIES)}
      })
      .catch(()=>{setEpisodes(MOCK_EPISODES);setSeries(MOCK_SERIES)})
      .finally(()=>setLoading(false))
  },[])

  const filtEpisodes=episodes.filter(e=>genre==="Tout"||e.genre?.toLowerCase().includes(genre.replace(/[^a-zA-ZÀ-ÿ]/g,"").toLowerCase().slice(0,6)))

  return(
    <div style={{paddingBottom:40}}>
      <div style={{fontFamily:"Syne,sans-serif",fontSize:22,fontWeight:800,marginBottom:18}}>🎙️ Podcasts</div>

      {/* Genres */}
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:24}}>
        {GENRES.map(g=><button key={g} onClick={()=>setGenre(g)} style={{padding:"5px 12px",borderRadius:50,border:"1px solid",fontSize:11.5,fontWeight:600,cursor:"pointer",transition:"all .15s",fontFamily:"Plus Jakarta Sans,sans-serif",borderColor:genre===g?"var(--gold)":"var(--border)",background:genre===g?"var(--gold)":"var(--card)",color:genre===g?"#000":"var(--text2)"}}>{g}</button>)}
      </div>

      {/* Episodes populaires */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <div style={{fontFamily:"Syne,sans-serif",fontSize:18,fontWeight:700,display:"flex",alignItems:"center",gap:8}}>
          <span style={{width:3,height:18,background:"linear-gradient(180deg,var(--gold),#e8920a)",borderRadius:3,display:"inline-block"}}/>
          🎙️ Épisodes populaires
        </div>
      </div>
      {loading
        ?<Skel/>
        :<div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:32}}>
          {filtEpisodes.map((ep,i)=><EpisodeRow key={ep.id} ep={ep} idx={i} isPlaying={isPlaying&&currentTrack?.id===ep.id} onPlay={()=>toggle({...ep,title:ep.title,artist:ep.host,profiles:{display_name:ep.host}})} fmtK={fmtK}/>)}
          {!filtEpisodes.length&&<div style={{color:"var(--text3)",fontSize:13,padding:"40px 0",textAlign:"center"}}>Aucun épisode dans cette catégorie</div>}
        </div>
      }

      {/* Séries */}
      {series.length>0&&<>
        <div style={{fontFamily:"Syne,sans-serif",fontSize:18,fontWeight:700,display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
          <span style={{width:3,height:18,background:"linear-gradient(180deg,var(--blue),#4d9fff)",borderRadius:3,display:"inline-block"}}/>
          📦 Séries / Collections
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:14}}>
          {series.map((s,i)=><SerieCard key={s.id} serie={s}/>)}
        </div>
      </>}
    </div>
  )
}

function EpisodeRow({ep,idx,isPlaying,onPlay,fmtK}){
  const[hov,setHov]=useState(false)
  return(
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",
        background:"var(--card)",border:`1px solid ${hov?"rgba(245,166,35,.3)":"var(--border)"}`,
        borderRadius:"var(--radius)",transition:"all .2s",cursor:"pointer"}}
      onClick={onPlay}>
      {/* Cover */}
      <div style={{width:56,height:56,borderRadius:10,background:ep.bg,flexShrink:0,overflow:"hidden",
        display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,
        boxShadow:"0 4px 14px rgba(0,0,0,.3)",position:"relative"}}>
        {ep.cover_url?<img src={ep.cover_url} alt={ep.title} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:"🎙️"}
        {isPlaying&&<div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.5)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:"var(--gold)"}}>⏸</div>}
      </div>
      {/* Info */}
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontWeight:600,fontSize:13.5,marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:isPlaying?"var(--gold)":"var(--text)"}}>{ep.title}</div>
        <div style={{fontSize:11.5,color:"var(--text2)",marginBottom:4}}>{ep.host}</div>
        {ep.serie&&<div style={{fontSize:10,color:"var(--text3)",fontFamily:"Space Mono,monospace"}}>{ep.serie} · Ép. {ep.episode}</div>}
      </div>
      {/* Stats */}
      <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4,flexShrink:0}}>
        <div style={{fontSize:11,color:"var(--text2)",fontFamily:"Space Mono,monospace"}}>{ep.duration}</div>
        <div style={{fontSize:11,color:"var(--text3)"}}>{fmtK(ep.plays)} 🎧</div>
      </div>
      {/* Play btn */}
      <div style={{width:38,height:38,borderRadius:"50%",background:isPlaying?"var(--gold)":"var(--card2)",
        border:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"center",
        fontSize:13,color:isPlaying?"#000":"var(--text2)",flexShrink:0,transition:"all .2s"}}>
        {isPlaying?"⏸":"▶"}
      </div>
    </div>
  )
}

function SerieCard({serie:s}){
  const[hov,setHov]=useState(false)
  return(
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{background:"var(--card)",border:`1px solid ${hov?"rgba(77,159,255,.4)":"var(--border)"}`,borderRadius:"var(--radius)",overflow:"hidden",transition:"all .25s",transform:hov?"translateY(-4px)":"none",boxShadow:hov?"0 12px 30px var(--shadow)":"none",cursor:"pointer"}}>
      <div style={{height:120,background:s.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:40,position:"relative"}}>
        {s.cover_url?<img src={s.cover_url} alt={s.title} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:"📦"}
        <div style={{position:"absolute",top:8,right:8,background:"rgba(0,0,0,.6)",color:"var(--blue)",fontSize:9,fontFamily:"Space Mono,monospace",fontWeight:700,padding:"3px 8px",borderRadius:4,letterSpacing:.5}}>SÉRIE</div>
      </div>
      <div style={{padding:"12px 14px"}}>
        <div style={{fontWeight:700,fontSize:13,marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.title}</div>
        <div style={{fontSize:11.5,color:"var(--text2)",marginBottom:4}}>{s.host}</div>
        <div style={{fontSize:11,color:"var(--text3)",fontFamily:"Space Mono,monospace",marginBottom:10}}>{s.episodes} épisodes</div>
        <button style={{width:"100%",padding:"7px",borderRadius:50,border:"1px solid var(--border)",background:"transparent",color:"var(--text2)",fontSize:11,fontWeight:600,cursor:"pointer",transition:"all .18s",fontFamily:"Plus Jakarta Sans,sans-serif"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--blue)";e.currentTarget.style.color="var(--blue)"}} onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.color="var(--text2)"}}>
          ▶ Voir la série
        </button>
      </div>
    </div>
  )
}

function Skel(){return(
  <div style={{display:"flex",flexDirection:"column",gap:10}}>
    {[...Array(5)].map((_,i)=><div key={i} style={{height:84,background:"var(--card)",borderRadius:"var(--radius)",border:"1px solid var(--border)",animation:"shimmer 1.5s infinite"}}/>)}
  </div>
)}
