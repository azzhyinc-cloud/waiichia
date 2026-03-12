import { useState, useEffect } from "react"
import { useAuthStore, useDeviseStore, usePageStore, usePlayerStore } from "../stores/index.js"
import api from "../services/api.js"

const TABS=[{id:"sons",icon:"🎵",label:"Mes Sons"},{id:"albums",icon:"💿",label:"Albums"},{id:"playlists",icon:"📋",label:"Playlists"},{id:"diffusions",icon:"📻",label:"Diffusions"},{id:"regie",icon:"📢",label:"Régie Pub"}]
const STATUTS=["Tous les statuts","Publié","Brouillon","Archivé"]
const fmtK=n=>n>=1000000?(n/1000000).toFixed(1)+"M":n>=1000?(n/1000).toFixed(1)+"K":String(n||0)
const MOCK_SONS=Array.from({length:6},(_,i)=>({id:"s"+i,title:["Twarab ya Komori","Moroni Flow","Island Vibe","Masiwa Matatu","Komori Nights","Brouillon Remix"][i],genre:["Twarab","Afrobeats","Afrobeats","Twarab","Afrotrap","Amapiano"][i],play_count:[8420,6180,4930,3760,2100,0][i],sale_price:[2500,1500,0,2500,500,0][i],status:["Publié","Publié","Publié","Publié","Publié","Brouillon"][i],created_at:"2026-01-12",cover_url:null,access_type:i%3===0?"paid":"free"}))
const MOCK_ALBUMS=[{id:"a1",title:"Comorian Beats Vol.1",tracks_count:8,play_count:18400,status:"Publié"},{id:"a2",title:"Masiwa EP",tracks_count:5,play_count:9200,status:"Publié"},{id:"a3",title:"Nouveau Projet",tracks_count:0,play_count:0,status:"Brouillon"}]
const MOCK_REGIE=[{id:"r1",title:"Boost — Twarab ya Komori",budget:5000,spent:3200,reach:12400,status:"Active",end:"20 Mar"},{id:"r2",title:"Promo Album Comorian",budget:15000,spent:15000,reach:48000,status:"Terminée",end:"28 Fév"},{id:"r3",title:"Lancement Moroni Flow",budget:8000,spent:1200,reach:3800,status:"Active",end:"30 Mar"}]

function SBadge({s}){
  const m={Publié:{bg:"rgba(44,198,83,.12)",c:"#2dc653"},Brouillon:{bg:"rgba(245,166,35,.12)",c:"var(--gold)"},Archivé:{bg:"rgba(100,100,100,.1)",c:"var(--text3)"},Active:{bg:"rgba(44,198,83,.12)",c:"#2dc653"},Terminée:{bg:"rgba(100,100,100,.1)",c:"var(--text3)"},"En direct":{bg:"rgba(230,57,70,.12)",c:"#e63946"},Publique:{bg:"rgba(44,198,83,.12)",c:"#2dc653"},Privée:{bg:"rgba(100,100,100,.1)",c:"var(--text3)"},Planifié:{bg:"rgba(77,159,255,.1)",c:"#4d9fff"}}
  const x=m[s]||{bg:"var(--card2)",c:"var(--text3)"}
  return <span style={{padding:"2px 8px",borderRadius:50,fontSize:10,fontWeight:700,background:x.bg,color:x.c}}>{s}</span>
}
function Menu({onDelete}){
  const [o,setO]=useState(false)
  return(
    <div style={{position:"relative"}}>
      <button onClick={e=>{e.stopPropagation();setO(!o)}} style={{padding:"4px 10px",borderRadius:6,border:"1px solid var(--border)",background:"transparent",color:"var(--text2)",cursor:"pointer"}}>···</button>
      {o&&<div style={{position:"absolute",right:0,top:"110%",background:"var(--card)",border:"1px solid var(--border)",borderRadius:10,minWidth:130,boxShadow:"0 8px 24px rgba(0,0,0,.3)",zIndex:100}}>
        {[["✏️","Modifier"],["📊","Stats"],["🗑️","Supprimer",true]].map(([ic,lb,danger])=>(
          <button key={lb} onClick={()=>{if(danger)onDelete?.();setO(false)}} style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"9px 14px",border:"none",background:"transparent",color:danger?"#e63946":"var(--text)",fontSize:12,cursor:"pointer",textAlign:"left"}}
            onMouseEnter={e=>e.currentTarget.style.background="var(--card2)"}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            {ic} {lb}
          </button>
        ))}
      </div>}
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

  useEffect(()=>{
    if(!user)return
    api.tracks.myTracks().then(d=>setSons(d.tracks?.length?d.tracks:MOCK_SONS)).catch(()=>setSons(MOCK_SONS)).finally(()=>setLoading(false))
  },[user])

  if(!user)return(
    <div style={{textAlign:"center",padding:60}}>
      <div style={{fontSize:48,marginBottom:12}}>🔒</div>
      <div style={{fontFamily:"Syne,sans-serif",fontSize:18,fontWeight:800}}>Connectez-vous</div>
      <button onClick={()=>setPage("login")} style={{marginTop:16,padding:"9px 22px",borderRadius:50,border:"none",background:"var(--gold)",color:"#000",fontWeight:700,cursor:"pointer"}}>Se connecter</button>
    </div>
  )

  const filtered=sons.filter(s=>statut==="Tous les statuts"||s.status===statut)

  return(
    <div style={{paddingBottom:40}}>
      <div style={{fontFamily:"Syne,sans-serif",fontSize:22,fontWeight:800,marginBottom:20}}>📚 Mon Contenu</div>

      <div style={{display:"flex",gap:2,borderBottom:"1px solid var(--border)",marginBottom:20,overflowX:"auto"}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"9px 18px",border:"none",background:"none",cursor:"pointer",fontSize:13,fontWeight:600,whiteSpace:"nowrap",color:tab===t.id?"var(--gold)":"var(--text2)",borderBottom:tab===t.id?"2px solid var(--gold)":"2px solid transparent",marginBottom:-1}}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,gap:8}}>
        <button onClick={()=>setPage("upload")} style={{padding:"8px 20px",borderRadius:50,border:"none",background:"linear-gradient(135deg,var(--gold),#e8920a)",color:"#000",fontSize:13,fontWeight:700,cursor:"pointer"}}>+ Ajouter</button>
        <select value={statut} onChange={e=>setStatut(e.target.value)} style={{padding:"7px 14px",borderRadius:50,border:"1px solid var(--border)",background:"var(--card)",color:"var(--text)",fontSize:12,cursor:"pointer",outline:"none"}}>
          {STATUTS.map(s=><option key={s}>{s}</option>)}
        </select>
      </div>

      {tab==="sons"&&(
        loading
          ?<div>{[...Array(4)].map((_,i)=><div key={i} style={{height:60,background:"var(--card)",borderRadius:10,border:"1px solid var(--border)",marginBottom:8}}/>)}</div>
          :filtered.length===0
            ?<div style={{textAlign:"center",padding:60,color:"var(--text3)"}}>
                <div style={{fontSize:40,marginBottom:12}}>🎵</div>
                <div style={{marginBottom:12}}>Aucun son trouvé</div>
                <button onClick={()=>setPage("upload")} style={{padding:"8px 20px",borderRadius:50,border:"none",background:"var(--gold)",color:"#000",fontSize:12,fontWeight:700,cursor:"pointer"}}>Publier mon premier son</button>
              </div>
            :<div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--radius)",overflow:"hidden"}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 80px 70px 100px 80px 40px",gap:10,padding:"10px 16px",borderBottom:"1px solid var(--border)",fontSize:11,fontWeight:700,color:"var(--text3)",textTransform:"uppercase"}}>
                  <span>Titre</span><span>Genre</span><span>Écoutes</span><span>Revenus</span><span>Statut</span><span/>
                </div>
                {filtered.map((s,i)=>(
                  <div key={s.id} style={{display:"grid",gridTemplateColumns:"1fr 80px 70px 100px 80px 40px",gap:10,padding:"12px 16px",alignItems:"center",borderBottom:i<filtered.length-1?"1px solid var(--border)":"none"}}
                    onMouseEnter={e=>e.currentTarget.style.background="var(--card2)"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <div style={{display:"flex",alignItems:"center",gap:10,minWidth:0}}>
                      <div onClick={()=>toggle(s)} style={{width:36,height:36,borderRadius:8,background:"var(--card2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0,cursor:"pointer",border:"1px solid var(--border)"}}>
                        {isPlaying&&currentTrack?.id===s.id?"⏸":"🎵"}
                      </div>
                      <div style={{minWidth:0}}>
                        <div style={{fontWeight:600,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.title}</div>
                        <div style={{fontSize:11,color:"var(--text3)"}}>{new Date(s.created_at).toLocaleDateString("fr-FR",{day:"numeric",month:"short"})}</div>
                      </div>
                    </div>
                    <div style={{fontSize:12,color:"var(--text2)"}}>{s.genre||"—"}</div>
                    <div style={{fontFamily:"Space Mono,monospace",fontSize:12,color:"var(--gold)"}}>{fmtK(s.play_count)}</div>
                    <div style={{fontFamily:"Space Mono,monospace",fontSize:11,color:"#2dc653"}}>{s.sale_price>0?"+"+s.sale_price.toLocaleString()+" "+dc:"—"}</div>
                    <SBadge s={s.status||"Publié"}/>
                    <Menu onDelete={()=>setSons(sons.filter(x=>x.id!==s.id))}/>
                  </div>
                ))}
              </div>
      )}

      {tab==="albums"&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:14}}>
          {MOCK_ALBUMS.map(a=>(
            <div key={a.id} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--radius)",overflow:"hidden",cursor:"pointer",transition:"transform .18s"}}
              onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
              onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
              <div style={{height:120,background:"var(--card2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:48}}>💿</div>
              <div style={{padding:14}}>
                <div style={{fontWeight:700,fontSize:13,marginBottom:4}}>{a.title}</div>
                <div style={{fontSize:11,color:"var(--text3)",marginBottom:8}}>{a.tracks_count} titres</div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <SBadge s={a.status}/>
                  <span style={{fontSize:11,color:"#2dc653"}}>{fmtK(a.play_count)} 🎧</span>
                </div>
              </div>
            </div>
          ))}
          <div onClick={()=>setPage("upload")} style={{background:"var(--card)",border:"2px dashed var(--border)",borderRadius:"var(--radius)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:180,cursor:"pointer",gap:8}}
            onMouseEnter={e=>e.currentTarget.style.borderColor="var(--gold)"}
            onMouseLeave={e=>e.currentTarget.style.borderColor="var(--border)"}>
            <div style={{fontSize:32}}>+</div>
            <div style={{fontSize:12,color:"var(--text3)"}}>Nouvel album</div>
          </div>
        </div>
      )}

      {tab==="playlists"&&(
        <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--radius)",overflow:"hidden"}}>
          {[{title:"Best of Twarab 2025",tracks:24,followers:1240,status:"Publique"},{title:"Instrumentaux KM",tracks:12,followers:340,status:"Publique"},{title:"Répétitions Studio",tracks:8,followers:0,status:"Privée"}].map((p,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",borderBottom:i<2?"1px solid var(--border)":"none"}}
              onMouseEnter={e=>e.currentTarget.style.background="var(--card2)"}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <div style={{width:44,height:44,borderRadius:10,background:"var(--card2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>📋</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:600,fontSize:13}}>{p.title}</div>
                <div style={{fontSize:11,color:"var(--text3)",marginTop:2}}>{p.tracks} titres · {p.followers} abonnés</div>
              </div>
              <SBadge s={p.status}/>
            </div>
          ))}
        </div>
      )}

      {tab==="diffusions"&&(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {[{title:"Komori FM Live",type:"Radio",status:"En direct",cover:"📻"},{title:"Session Karaoké #12",type:"Karaoké",status:"Terminée",cover:"🎤"},{title:"Concert Moroni 2026",type:"Live",status:"Planifié",cover:"🎸"}].map((d,i)=>(
            <div key={i} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--radius)",padding:16,display:"flex",alignItems:"center",gap:14}}>
              <div style={{width:48,height:48,borderRadius:12,background:"var(--card2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>{d.cover}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:14}}>{d.title}</div>
                <div style={{fontSize:12,color:"var(--text3)",marginTop:2}}>{d.type}</div>
              </div>
              <SBadge s={d.status}/>
            </div>
          ))}
        </div>
      )}

      {tab==="regie"&&(
        <div>
          <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}>
            <button onClick={()=>setPage("regie")} style={{padding:"7px 18px",borderRadius:50,border:"none",background:"linear-gradient(135deg,var(--gold),#e8920a)",color:"#000",fontSize:12,fontWeight:700,cursor:"pointer"}}>+ Nouvelle campagne</button>
          </div>
          {MOCK_REGIE.map(r=>(
            <div key={r.id} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--radius)",padding:18,marginBottom:12}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                <div>
                  <div style={{fontWeight:700,fontSize:14}}>{r.title}</div>
                  <div style={{fontSize:11,color:"var(--text3)",marginTop:2}}>Fin le {r.end} · {r.reach.toLocaleString()} portée</div>
                </div>
                <SBadge s={r.status}/>
              </div>
              <div style={{fontSize:11,color:"var(--text3)",marginBottom:4,display:"flex",justifyContent:"space-between"}}>
                <span>Budget utilisé</span>
                <span>{r.spent.toLocaleString()} / {r.budget.toLocaleString()} {dc}</span>
              </div>
              <div style={{height:6,background:"var(--card2)",borderRadius:3,overflow:"hidden"}}>
                <div style={{width:Math.min(100,r.spent/r.budget*100)+"%",height:"100%",background:r.spent>=r.budget?"#e63946":"linear-gradient(90deg,var(--gold),#e8920a)",borderRadius:3}}/>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
