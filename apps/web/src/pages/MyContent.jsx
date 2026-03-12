import { useState, useEffect } from "react"
import { useAuthStore, useDeviseStore, usePageStore, usePlayerStore } from "../stores/index.js"
import BuyModal from "../components/BuyModal.jsx"
import api from "../services/api.js"

const TABS=[{id:"sons",label:"🎵 Mes Sons"},{id:"albums",label:"💿 Albums"},{id:"playlists",label:"📋 Playlists"},{id:"diffusions",label:"📻 Diffusions"},{id:"regie",label:"📢 Régie Pub"}]
const STATUTS=["Tous les statuts","Publié","Brouillon","Archivé"]
const BGS=["linear-gradient(135deg,#1a6fcc,#4d9fff)","linear-gradient(135deg,#9b59f5,#6d3db5)","linear-gradient(135deg,#f5a623,#e63946)","linear-gradient(135deg,#2dc653,#0a9e4a)","linear-gradient(135deg,#ff6b35,#cc4411)","linear-gradient(135deg,#00b4d8,#0077b6)"]
const EMOJIS=["🌊","🌆","🏝️","🗺️","🌙","🎛️"]
const fmtK=n=>n>=1000000?(n/1000000).toFixed(1)+"M":n>=1000?(n/1000).toFixed(1)+"K":String(n||0)
const MOCK=Array.from({length:6},(_,i)=>({id:"s"+i,title:["Twarab ya Komori","Moroni Flow","Island Vibe","Masiwa Matatu","Komori Nights","Brouillon Remix"][i],artist:"Kolo Officiel",genre:["TWARAB","AFROBEATS","AFROBEATS","TWARAB","AFROTRAP","AMAPIANO"][i],play_count:[8420,6180,4930,3760,2100,0][i],sale_price:[2500,1500,0,2500,500,0][i],status:["Publié","Publié","Publié","Publié","Publié","Brouillon"][i],access_type:i%3===0?"paid":"free",cover_url:null,bg:BGS[i%6],emoji:EMOJIS[i]}))
const MOCK_ALBUMS=[{id:"a1",title:"Comorian Beats Vol.1",tracks_count:8,play_count:18400,status:"Publié",bg:BGS[2]},{id:"a2",title:"Masiwa EP",tracks_count:5,play_count:9200,status:"Publié",bg:BGS[1]},{id:"a3",title:"Nouveau Projet",tracks_count:0,play_count:0,status:"Brouillon",bg:"linear-gradient(135deg,#444,#222)"}]
const MOCK_REGIE=[{id:"r1",title:"Boost — Twarab ya Komori",budget:5000,spent:3200,reach:12400,status:"Active",end:"20 Mar"},{id:"r2",title:"Promo Album Comorian",budget:15000,spent:15000,reach:48000,status:"Terminée",end:"28 Fév"},{id:"r3",title:"Lancement Moroni Flow",budget:8000,spent:1200,reach:3800,status:"Active",end:"30 Mar"}]

function SBadge({s}){
  const m={Publié:{bg:"rgba(44,198,83,.15)",c:"#2dc653"},Brouillon:{bg:"rgba(245,166,35,.15)",c:"#f5a623"},Archivé:{bg:"rgba(140,140,140,.15)",c:"#888"},Active:{bg:"rgba(44,198,83,.15)",c:"#2dc653"},Terminée:{bg:"rgba(140,140,140,.15)",c:"#888"},"En direct":{bg:"rgba(230,57,70,.15)",c:"#e63946"},Publique:{bg:"rgba(44,198,83,.15)",c:"#2dc653"},Privée:{bg:"rgba(140,140,140,.15)",c:"#888"},Planifié:{bg:"rgba(77,159,255,.15)",c:"#4d9fff"}}
  const x=m[s]||{bg:"rgba(140,140,140,.1)",c:"#888"}
  return <span style={{padding:"3px 9px",borderRadius:50,fontSize:10,fontWeight:700,background:x.bg,color:x.c}}>{s}</span>
}

function TrackCard({t,isPlaying,onPlay,onBuy,dc}){
  const [hov,setHov]=useState(false)
  const isPaid=t.access_type==="paid"&&t.sale_price>0
  return(
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{background:"var(--card)",border:`1px solid ${hov?"rgba(245,166,35,.4)":"var(--border)"}`,borderRadius:"var(--radius)",overflow:"hidden",cursor:"pointer",transition:"all .25s",transform:hov?"translateY(-5px)":"none",boxShadow:hov?"0 16px 40px rgba(0,0,0,.4)":"none"}}>
      <div style={{width:"100%",aspectRatio:"1",position:"relative",overflow:"hidden"}} onClick={onPlay}>
        <div style={{width:"100%",height:"100%",background:t.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:44}}>
          {t.cover_url?<img src={t.cover_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:t.emoji||"🎵"}
        </div>
        <div style={{position:"absolute",top:10,right:10,padding:"3px 8px",borderRadius:6,fontSize:9,fontWeight:800,background:"rgba(0,0,0,.6)",backdropFilter:"blur(8px)",color:"#fff",letterSpacing:.8}}>{t.genre||"MUSIC"}</div>
        <div style={{position:"absolute",top:10,left:10}}><SBadge s={t.status||"Publié"}/></div>
        <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.35)",display:"flex",alignItems:"center",justifyContent:"center",opacity:hov||isPlaying?1:0,transition:"opacity .2s"}}>
          <button style={{width:52,height:52,borderRadius:"50%",background:"var(--gold)",border:"none",cursor:"pointer",fontSize:20,boxShadow:"0 4px 16px rgba(245,166,35,.5)"}}>{isPlaying?"⏸":"▶"}</button>
        </div>
      </div>
      <div style={{padding:"12px 14px"}}>
        <div style={{fontWeight:700,fontSize:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:3}}>{t.title}</div>
        <div style={{fontSize:12,color:"var(--text2)",marginBottom:10}}>{t.artist||"Moi"}</div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontSize:12,color:"var(--text3)"}}>{fmtK(t.play_count)} 🎧</span>
          {isPaid
            ?<button onClick={e=>{e.stopPropagation();onBuy(t)}} style={{padding:"4px 10px",borderRadius:50,border:"none",background:"linear-gradient(135deg,var(--gold),#e8920a)",color:"#000",fontSize:11,fontWeight:700,cursor:"pointer"}}>{t.sale_price?.toLocaleString()} {dc}</button>
            :<span style={{fontSize:11,color:"#2dc653",fontWeight:600}}>🆓 Gratuit</span>}
        </div>
      </div>
      <div style={{display:"flex",gap:4,padding:"8px 12px",borderTop:"1px solid var(--border)"}}>
        {[["♥","like"],["💬","comm"],["📤","share"],["🚩","rep"]].map(([ic,k])=>(
          <button key={k} style={{flex:1,padding:"5px 0",borderRadius:8,border:"1px solid var(--border)",background:"var(--card2)",fontSize:13,cursor:"pointer",color:"var(--text2)"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--gold)";e.currentTarget.style.color="var(--gold)"}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.color="var(--text2)"}}>
            {ic}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function MyContent(){
  const {user}=useAuthStore()
  const {devise}=useDeviseStore()
  const {setPage}=usePageStore()
  const {toggle,currentTrack,isPlaying}=usePlayerStore()
  const dc=devise?.code||"KMF"
  const [tab,setTab]=useState("sons")
  const [statut,setStatut]=useState("Tous les statuts")
  const [sons,setSons]=useState([])
  const [loading,setLoading]=useState(true)
  const [buyModal,setBuyModal]=useState(null)

  useEffect(()=>{
    if(!user)return
    api.tracks.myTracks().then(d=>setSons(d.tracks?.length?d.tracks:MOCK)).catch(()=>setSons(MOCK)).finally(()=>setLoading(false))
  },[user])

  if(!user)return(<div style={{textAlign:"center",padding:80}}><div style={{fontSize:48,marginBottom:12}}>🔒</div><div style={{fontFamily:"Syne,sans-serif",fontSize:18,fontWeight:800,marginBottom:8}}>Connectez-vous</div><button onClick={()=>setPage("login")} style={{padding:"9px 24px",borderRadius:50,border:"none",background:"var(--gold)",color:"#000",fontWeight:700,cursor:"pointer"}}>Se connecter</button></div>)

  const filtered=sons.filter(s=>statut==="Tous les statuts"||s.status===statut)

  return(
    <div style={{paddingBottom:40}}>
      {buyModal&&<BuyModal track={buyModal} onClose={()=>setBuyModal(null)}/>}
      <div style={{fontFamily:"Syne,sans-serif",fontSize:22,fontWeight:800,marginBottom:20}}>📚 Mon Contenu</div>
      <div style={{display:"flex",gap:2,borderBottom:"1px solid var(--border)",marginBottom:20,overflowX:"auto"}}>
        {TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"9px 18px",border:"none",background:"none",cursor:"pointer",fontSize:13,fontWeight:600,whiteSpace:"nowrap",color:tab===t.id?"var(--gold)":"var(--text2)",borderBottom:tab===t.id?"2px solid var(--gold)":"2px solid transparent",marginBottom:-1}}>{t.label}</button>)}
      </div>
      <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginBottom:20}}>
        <button onClick={()=>setPage("upload")} style={{padding:"8px 20px",borderRadius:50,border:"none",background:"linear-gradient(135deg,var(--gold),#e8920a)",color:"#000",fontSize:13,fontWeight:700,cursor:"pointer"}}>+ Ajouter</button>
        <select value={statut} onChange={e=>setStatut(e.target.value)} style={{padding:"7px 14px",borderRadius:50,border:"1px solid var(--border)",background:"var(--card)",color:"var(--text)",fontSize:12,cursor:"pointer",outline:"none"}}>
          {STATUTS.map(s=><option key={s}>{s}</option>)}
        </select>
      </div>

      {tab==="sons"&&(loading
        ?<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:16}}>{[...Array(6)].map((_,i)=><div key={i} style={{height:280,background:"var(--card)",borderRadius:"var(--radius)",border:"1px solid var(--border)"}}/>)}</div>
        :filtered.length===0
          ?<div style={{textAlign:"center",padding:80,color:"var(--text3)"}}><div style={{fontSize:48,marginBottom:12}}>🎵</div><div style={{marginBottom:16}}>Aucun son</div><button onClick={()=>setPage("upload")} style={{padding:"9px 24px",borderRadius:50,border:"none",background:"var(--gold)",color:"#000",fontSize:13,fontWeight:700,cursor:"pointer"}}>Publier mon premier son</button></div>
          :<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:16}}>
              {filtered.map(t=><TrackCard key={t.id} t={t} dc={dc} isPlaying={isPlaying&&currentTrack?.id===t.id} onPlay={()=>toggle(t)} onBuy={()=>setBuyModal(t)}/>)}
            </div>)}

      {tab==="albums"&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:16}}>
        {MOCK_ALBUMS.map(a=><div key={a.id} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--radius)",overflow:"hidden",cursor:"pointer",transition:"all .25s"}} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.borderColor="rgba(245,166,35,.4)"}} onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.borderColor="var(--border)"}}><div style={{height:140,background:a.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:52}}>💿</div><div style={{padding:14}}><div style={{fontWeight:700,fontSize:14,marginBottom:4}}>{a.title}</div><div style={{fontSize:12,color:"var(--text3)",marginBottom:10}}>{a.tracks_count} titres · {fmtK(a.play_count)} écoutes</div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><SBadge s={a.status}/><span style={{fontSize:11,color:"#2dc653"}}>📊 Stats</span></div></div></div>)}
        <div onClick={()=>setPage("upload")} style={{background:"var(--card)",border:"2px dashed var(--border)",borderRadius:"var(--radius)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:200,cursor:"pointer",gap:10}} onMouseEnter={e=>e.currentTarget.style.borderColor="var(--gold)"} onMouseLeave={e=>e.currentTarget.style.borderColor="var(--border)"}><div style={{fontSize:36,opacity:.5}}>+</div><div style={{fontSize:13,color:"var(--text3)"}}>Nouvel album</div></div>
      </div>}

      {tab==="playlists"&&<div style={{display:"flex",flexDirection:"column",gap:10}}>
        {[{title:"Best of Twarab 2025",tracks:24,followers:1240,status:"Publique",bg:BGS[0]},{title:"Instrumentaux KM",tracks:12,followers:340,status:"Publique",bg:BGS[1]},{title:"Répétitions Studio",tracks:8,followers:0,status:"Privée",bg:BGS[4]}].map((p,i)=><div key={i} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--radius)",padding:16,display:"flex",alignItems:"center",gap:14,cursor:"pointer",transition:"all .2s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(245,166,35,.4)";e.currentTarget.style.transform="translateX(4px)"}} onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.transform="none"}}><div style={{width:56,height:56,borderRadius:12,background:p.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>📋</div><div style={{flex:1}}><div style={{fontWeight:700,fontSize:14}}>{p.title}</div><div style={{fontSize:12,color:"var(--text3)",marginTop:3}}>{p.tracks} titres · {p.followers.toLocaleString()} abonnés</div></div><SBadge s={p.status}/></div>)}
      </div>}

      {tab==="diffusions"&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:16}}>
        {[{title:"Komori FM Live",type:"📻 Radio",status:"En direct",bg:"linear-gradient(135deg,#e63946,#9b0010)"},{title:"Session Karaoké #12",type:"🎤 Karaoké",status:"Terminée",bg:BGS[1]},{title:"Concert Moroni 2026",type:"🎸 Live",status:"Planifié",bg:BGS[2]}].map((d,i)=><div key={i} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--radius)",overflow:"hidden",cursor:"pointer",transition:"all .25s"}} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.borderColor="rgba(245,166,35,.4)"}} onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.borderColor="var(--border)"}}><div style={{height:110,background:d.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:40}}>{d.type.split(" ")[0]}</div><div style={{padding:14}}><div style={{fontWeight:700,fontSize:14,marginBottom:4}}>{d.title}</div><div style={{fontSize:12,color:"var(--text3)",marginBottom:10}}>{d.type}</div><SBadge s={d.status}/></div></div>)}
      </div>}

      {tab==="regie"&&<div>
        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:20}}><button onClick={()=>setPage("regie")} style={{padding:"9px 22px",borderRadius:50,border:"none",background:"linear-gradient(135deg,var(--gold),#e8920a)",color:"#000",fontSize:13,fontWeight:700,cursor:"pointer"}}>📢 Nouvelle campagne</button></div>
        {MOCK_REGIE.map(r=><div key={r.id} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--radius)",padding:20,marginBottom:14,transition:"border-color .2s"}} onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(245,166,35,.3)"} onMouseLeave={e=>e.currentTarget.style.borderColor="var(--border)"}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}><div><div style={{fontWeight:700,fontSize:15}}>{r.title}</div><div style={{fontSize:12,color:"var(--text3)",marginTop:3}}>Fin le {r.end} · {r.reach.toLocaleString()} personnes touchées</div></div><SBadge s={r.status}/></div><div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"var(--text2)",marginBottom:6}}><span>Budget utilisé</span><span style={{fontFamily:"Space Mono,monospace",fontWeight:600}}>{r.spent.toLocaleString()} / {r.budget.toLocaleString()} KMF</span></div><div style={{height:8,background:"var(--card2)",borderRadius:4,overflow:"hidden"}}><div style={{width:Math.min(100,r.spent/r.budget*100)+"%",height:"100%",background:r.spent>=r.budget?"#e63946":"linear-gradient(90deg,var(--gold),#e8920a)",borderRadius:4}}/></div></div>)}
      </div>}
    </div>
  )
}
