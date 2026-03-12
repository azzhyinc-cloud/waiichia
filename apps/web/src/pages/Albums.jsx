import { useState, useEffect } from "react"
import { usePlayerStore, useDeviseStore } from "../stores/index.js"
import api from "../services/api.js"

const CATS = ["Tous","Musique","Podcast","Compilation"]
const PAYS = ["🌍 Tous pays","🇰🇲 Comores","🇲🇬 Madagascar","🇳🇬 Nigeria"]
const MOCK = [
  {id:"a1",title:"Ocean de Komori",artist:"Kolo Officiel",emoji:"🌊",bg:"linear-gradient(135deg,#0d2a3a,#1a5060)",tracks_count:12,year:2026,country:"🇰🇲",type:"music",genre:"Twarab",desc:"L'album de la décennie par Kolo Officiel. 12 titres de pur Twarab des Comores mêlant tradition et sons modernes.",cover_url:null,
    tracklist:[{n:1,title:"Twarab ya Komori",feat:"ft. Wassila",dur:"4:02",free:true},{n:2,title:"Île aux Parfums",feat:"",dur:"3:45",free:false},{n:3,title:"Moroni Sunset",feat:"ft. DJ Chami",dur:"4:18",free:false},{n:4,title:"Maman ya Komori",feat:"",dur:"3:30",free:false},{n:5,title:"Danse sur l'Océan",feat:"ft. Wassila",dur:"4:55",free:false},{n:6,title:"Shikomori Flow",feat:"",dur:"3:12",free:false},{n:7,title:"Anjouan Vibes",feat:"ft. Beni Salim",dur:"4:44",free:false},{n:8,title:"Bahari ya Ndizi",feat:"",dur:"3:58",free:false},{n:9,title:"Nuit Comorienne",feat:"ft. Nassim B.",dur:"5:01",free:false},{n:10,title:"Retour aux Sources",feat:"",dur:"3:27",free:false},{n:11,title:"Vibrate Africa",feat:"ft. Wally Afro",dur:"4:10",free:false},{n:12,title:"Ocean (Reprise)",feat:"",dur:"2:55",free:false}]},
  {id:"a2",title:"Lagos Dreams",artist:"Wally Afro",emoji:"🌟",bg:"linear-gradient(135deg,#2e1a00,#7a4000)",tracks_count:16,year:2026,country:"🇳🇬",type:"music",genre:"Afrobeats",desc:"Seize pépites d'Afrobeats fusion qui retracent le voyage de Lagos au monde.",cover_url:null,
    tracklist:[{n:1,title:"Lagosian Night",feat:"",dur:"3:48",free:true},{n:2,title:"Afrodance Queen",feat:"ft. Tiwa K.",dur:"3:22",free:false},{n:3,title:"Hustle Mode",feat:"",dur:"3:55",free:false},{n:4,title:"Jollof Energy",feat:"ft. Bona D.",dur:"4:02",free:false},{n:5,title:"Street Anthem",feat:"",dur:"3:10",free:false},{n:6,title:"Mama Africa",feat:"ft. Femi A.",dur:"4:30",free:false}]},
  {id:"a3",title:"Moroni Nights",artist:"DJ Comoros",emoji:"🌙",bg:"linear-gradient(135deg,#1a0a2e,#4a1a6e)",tracks_count:10,year:2025,country:"🇰🇲",type:"music",genre:"Amapiano",desc:"10 titres Amapiano enregistrés entre Moroni et Johannesburg.",cover_url:null,
    tracklist:[{n:1,title:"Night Intro",feat:"",dur:"2:10",free:true},{n:2,title:"Comoros Piano",feat:"ft. Kolo",dur:"4:22",free:false},{n:3,title:"Island Groove",feat:"",dur:"3:50",free:false}]},
  {id:"a4",title:"Zanzibar Vibes",artist:"East Mix",emoji:"🏝️",bg:"linear-gradient(135deg,#0a2a1a,#1a6040)",tracks_count:8,year:2025,country:"🇹🇿",type:"music",genre:"Bongo Flava",desc:"Fusion de Bongo Flava et sons côtiers de Zanzibar.",cover_url:null,tracklist:[]},
  {id:"a5",title:"Afrika Rising Vol.2",artist:"Waiichia Beats",emoji:"🌍",bg:"linear-gradient(135deg,#1a0a00,#5a2a00)",tracks_count:14,year:2026,country:"🇰🇲",type:"compilation",genre:"Various",desc:"Compilation des meilleurs talents de la plateforme.",cover_url:null,tracklist:[]},
  {id:"a6",title:"Business Mindset KM",artist:"Coach Amina",emoji:"💼",bg:"linear-gradient(135deg,#0a1a2e,#1a3a5a)",tracks_count:6,year:2025,country:"🇰🇲",type:"podcast",genre:"Entrepreneuriat",desc:"6 épisodes pour transformer votre approche business.",cover_url:null,tracklist:[]},
]
const rndK=n=>n>=1000?(n/1000).toFixed(1)+"K":String(n)

export default function Albums() {
  const { toggle, currentTrack, isPlaying } = usePlayerStore()
  const [cat,setCat]=useState("Tous")
  const [albums,setAlbums]=useState([])
  const [loading,setLoading]=useState(true)
  const [selected,setSelected]=useState(null)

  useEffect(()=>{
    api.get("/api/albums?limit=20")
      .then(d=>setAlbums(d.albums?.length?d.albums:MOCK))
      .catch(()=>setAlbums(MOCK))
      .finally(()=>setLoading(false))
  },[])

  const filtered=albums.filter(a=>cat==="Tous"||a.type===cat.toLowerCase())

  if(selected) return <AlbumDetail album={selected} onBack={()=>setSelected(null)} toggle={toggle} currentTrack={currentTrack} isPlaying={isPlaying} rndK={rndK}/>

  return(
    <div style={{paddingBottom:40}}>
      <div style={{fontFamily:"Syne,sans-serif",fontSize:22,fontWeight:800,marginBottom:18}}>💿 Albums</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:22,alignItems:"center"}}>
        {CATS.map(c=><button key={c} onClick={()=>setCat(c)} style={{padding:"6px 14px",borderRadius:50,border:"1px solid",fontSize:12,fontWeight:600,cursor:"pointer",transition:"all .18s",fontFamily:"Plus Jakarta Sans,sans-serif",borderColor:cat===c?"var(--gold)":"var(--border)",background:cat===c?"var(--gold)":"var(--card)",color:cat===c?"#000":"var(--text2)"}}>{c}</button>)}
      </div>
      {loading
        ?<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:14}}>{[...Array(6)].map((_,i)=><div key={i} style={{background:"var(--card)",borderRadius:"var(--radius)",border:"1px solid var(--border)",overflow:"hidden"}}><div style={{aspectRatio:"1",background:"var(--card2)",animation:"shimmer 1.5s infinite"}}/><div style={{padding:12}}><div style={{height:13,background:"var(--card3)",borderRadius:6,marginBottom:8,width:"75%"}}/><div style={{height:11,background:"var(--card2)",borderRadius:6,width:"50%"}}/></div></div>)}</div>
        :<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:14}}>
          {filtered.map(a=><AlbumCard key={a.id} album={a} onClick={()=>setSelected(a)} rndK={rndK}/>)}
          {!filtered.length&&<div style={{color:"var(--text3)",fontSize:13,padding:"40px 0",gridColumn:"1/-1",textAlign:"center"}}>Aucun album dans cette catégorie</div>}
        </div>
      }
    </div>
  )
}

function AlbumCard({album:a,onClick,rndK}){
  const[hov,setHov]=useState(false)
  const typeColors={music:"var(--green)",podcast:"var(--blue)",compilation:"var(--gold)"}
  return(
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{background:"var(--card)",border:`1px solid ${hov?"rgba(44,198,83,.4)":"var(--border)"}`,borderRadius:"var(--radius)",overflow:"hidden",cursor:"pointer",transition:"all .25s",transform:hov?"translateY(-5px)":"none",boxShadow:hov?"0 16px 40px var(--shadow)":"none"}}>
      <div onClick={onClick} style={{position:"relative",aspectRatio:"1",background:a.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:52,overflow:"hidden"}}>
        {a.cover_url?<img src={a.cover_url} alt={a.title} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:a.emoji}
        <div style={{position:"absolute",top:8,left:8,background:"rgba(0,0,0,.6)",color:typeColors[a.type]||"var(--gold)",fontSize:9,fontFamily:"Space Mono,monospace",fontWeight:700,padding:"3px 8px",borderRadius:4,letterSpacing:.5,textTransform:"uppercase"}}>{a.type==="podcast"?"PODCAST":a.type==="compilation"?"COMPIL":"ALBUM"}</div>
        {hov&&<div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.4)",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{width:52,height:52,borderRadius:"50%",background:"var(--gold)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,color:"#000",boxShadow:"0 4px 16px rgba(245,166,35,.5)"}}>▶</div>
        </div>}
      </div>
      <div style={{padding:"12px 14px"}}>
        <div style={{fontWeight:700,fontSize:13.5,marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} onClick={onClick}>{a.title}</div>
        <div style={{fontSize:12,color:"var(--text2)",marginBottom:6}}>{a.artist} · {a.country}</div>
        <div style={{fontSize:11,color:"var(--text3)",fontFamily:"Space Mono,monospace",marginBottom:10}}>{a.tracks_count} titres · {a.year}</div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {[["❤️",rndK(Math.floor(Math.random()*8000+500))],["🔥",rndK(Math.floor(Math.random()*3000+100))],["💬",rndK(Math.floor(Math.random()*500+20))]].map(([e,v])=>(
            <button key={e} style={{display:"flex",alignItems:"center",gap:3,padding:"3px 8px",borderRadius:20,border:"1px solid var(--border)",background:"var(--card2)",fontSize:11,cursor:"pointer",color:"var(--text2)",fontFamily:"Plus Jakarta Sans,sans-serif"}} onMouseEnter={ev=>ev.currentTarget.style.borderColor="var(--gold)"} onMouseLeave={ev=>ev.currentTarget.style.borderColor="var(--border)"}>{e}<span>{v}</span></button>
          ))}
        </div>
      </div>
    </div>
  )
}

function AlbumDetail({album:a,onBack,toggle,currentTrack,isPlaying,rndK}){
  return(
    <div style={{paddingBottom:40}}>
      <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:8,background:"none",border:"none",color:"var(--text2)",cursor:"pointer",fontSize:13,marginBottom:20,fontFamily:"Plus Jakarta Sans,sans-serif"}} onMouseEnter={e=>e.currentTarget.style.color="var(--gold)"} onMouseLeave={e=>e.currentTarget.style.color="var(--text2)"}>
        ← Retour aux albums
      </button>
      {/* Hero */}
      <div style={{display:"flex",gap:24,marginBottom:28,flexWrap:"wrap"}}>
        <div style={{width:160,height:160,borderRadius:"var(--radius)",background:a.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:64,flexShrink:0,boxShadow:"0 12px 40px rgba(0,0,0,.4)"}}>{a.cover_url?<img src={a.cover_url} alt={a.title} style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:"var(--radius)"}}/>:a.emoji}</div>
        <div style={{flex:1,minWidth:200}}>
          <div style={{fontSize:10,color:"var(--green)",fontFamily:"Space Mono,monospace",textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>ALBUM · {a.genre}</div>
          <div style={{fontFamily:"Syne,sans-serif",fontSize:28,fontWeight:800,marginBottom:6}}>{a.title}</div>
          <div style={{fontSize:14,color:"var(--text2)",marginBottom:4}}>{a.artist} · {a.country}</div>
          <div style={{fontSize:12,color:"var(--text3)",fontFamily:"Space Mono,monospace",marginBottom:12}}>{a.tracks_count} titres · {a.year}</div>
          <div style={{fontSize:13,color:"var(--text2)",marginBottom:16,lineHeight:1.5}}>{a.desc}</div>
          <button style={{padding:"10px 24px",borderRadius:50,border:"none",background:"linear-gradient(135deg,var(--gold),#e8920a)",color:"#000",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"Plus Jakarta Sans,sans-serif",boxShadow:"0 4px 16px rgba(245,166,35,.4)"}}>▶ Écouter l&apos;album</button>
        </div>
      </div>
      {/* Tracklist */}
      {a.tracklist?.length>0&&(
        <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--radius)",overflow:"hidden"}}>
          <div style={{padding:"14px 18px",borderBottom:"1px solid var(--border)",fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:14}}>📋 Liste des titres</div>
          {a.tracklist.map((t,i)=>{
            const isCurrent=currentTrack?.title===t.title
            return(
              <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 18px",borderBottom:i<a.tracklist.length-1?"1px solid var(--border2)":"none",transition:"background .15s",cursor:"pointer"}}
                onMouseEnter={e=>e.currentTarget.style.background="var(--card2)"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                onClick={()=>toggle({id:`${a.id}_${i}`,title:t.title,artist:a.artist,profiles:{display_name:a.artist}})}>
                <div style={{width:24,textAlign:"center",flexShrink:0,fontFamily:"Space Mono,monospace",fontSize:11,color:isCurrent?"var(--gold)":"var(--text3)"}}>
                  {isCurrent&&isPlaying?"▶":t.n}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600,color:isCurrent?"var(--gold)":"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    {t.title} <span style={{fontSize:11,color:"var(--text3)",fontWeight:400}}>{t.feat}</span>
                  </div>
                </div>
                {t.free&&<div style={{fontSize:9,color:"var(--green)",fontFamily:"Space Mono,monospace",background:"rgba(44,198,83,.12)",border:"1px solid rgba(44,198,83,.3)",borderRadius:20,padding:"2px 7px",flexShrink:0}}>GRATUIT</div>}
                {!t.free&&<div style={{fontSize:9,color:"var(--text3)",fontFamily:"Space Mono,monospace",background:"rgba(0,0,0,.2)",border:"1px solid var(--border)",borderRadius:20,padding:"2px 7px",flexShrink:0}}>🔒</div>}
                <div style={{fontSize:11,color:"var(--text3)",fontFamily:"Space Mono,monospace",flexShrink:0,width:32,textAlign:"right"}}>{t.dur}</div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
