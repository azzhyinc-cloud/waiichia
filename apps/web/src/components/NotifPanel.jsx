import { useState } from "react"
import { usePageStore } from "../stores/index.js"

const TABS = ["Tout","Social","Musique","Dons 🎁","Live"]
const TYPE_ICONS = {like:"❤️",comment:"💬",follow:"👥",tip:"🎁",play:"🎵",live:"🔴",mention:"@"}
const TYPE_BG = {like:"var(--red)",comment:"var(--blue)",follow:"#2dc653",tip:"var(--gold)",play:"var(--gold)",live:"var(--red)",mention:"var(--blue)"}

const NOTIFS = [
  {type:"like",ava:"WA",bg:"linear-gradient(135deg,#f5a623,#e63946)",name:"Wally Afro",text:"a aimé votre son Twarab ya Komori",time:"2min",unread:true,cat:"social"},
  {type:"tip",ava:"DJ",bg:"linear-gradient(135deg,#9b59f5,#6c3483)",name:"DJ Chami",text:"vous a envoyé un don de 2 500 KMF 🎁 pendant le live",time:"8min",unread:true,cat:"tips",action:"Voir"},
  {type:"follow",ava:"CA",bg:"linear-gradient(135deg,#2dc653,#00bfa5)",name:"Coach Amina",text:"a commencé à vous suivre",time:"15min",unread:true,cat:"social",action:"Suivre en retour"},
  {type:"live",ava:"📻",bg:"linear-gradient(135deg,#e63946,#c0392b)",name:"Radio Komori FM",text:"est maintenant en direct 🔴 — Twarab Night",time:"22min",unread:true,cat:"live",action:"Écouter"},
  {type:"comment",ava:"BS",bg:"linear-gradient(135deg,#4d9fff,#2980b9)",name:"Beni Salim",text:'a commenté votre album Ocean de Komori : "Mashallah ! 🔥"',time:"1h",unread:true,cat:"social"},
  {type:"play",ava:"🎵",bg:"linear-gradient(135deg,#f5a623,#ff6b35)",name:"Jamal B.",text:"a ajouté Nuit Twarab à sa playlist",time:"2h",unread:false,cat:"music"},
  {type:"tip",ava:"FA",bg:"linear-gradient(135deg,#2dc653,#00b894)",name:"Fatima A.",text:'vous a envoyé 500 KMF — "Merci pour la musique ❤️"',time:"3h",unread:false,cat:"tips"},
  {type:"mention",ava:"KL",bg:"linear-gradient(135deg,#ff6b35,#e63946)",name:"Karo Lys",text:"vous a mentionné dans un commentaire sur Beat Pack Vol.3",time:"5h",unread:false,cat:"social"},
  {type:"like",ava:"MS",bg:"linear-gradient(135deg,#9b59f5,#8e44ad)",name:"Moussa S.",text:"et 47 autres personnes ont aimé Afrobeats Night",time:"6h",unread:false,cat:"social"},
  {type:"play",ava:"🎧",bg:"linear-gradient(135deg,#4d9fff,#2c3e50)",name:"Stats Waiichia",text:"votre son Twarab ya Komori a atteint 10 000 écoutes 🎉",time:"1j",unread:false,cat:"music"},
  {type:"follow",ava:"NB",bg:"linear-gradient(135deg,#f5a623,#e67e22)",name:"Nassim B.",text:"a commencé à vous suivre depuis Madagascar 🇲🇬",time:"1j",unread:false,cat:"social",action:"Suivre en retour"},
  {type:"tip",ava:"RO",bg:"linear-gradient(135deg,#2dc653,#27ae60)",name:"Rashid O.",text:"a fait un don de 10 000 KMF pendant votre stream live",time:"2j",unread:false,cat:"tips"},
]

export default function NotifPanel({ open, onClose }) {
  const { setPage } = usePageStore()
  const [tab, setTab] = useState("Tout")
  const [read, setRead] = useState({})

  const catMap = {"Tout":"all","Social":"social","Musique":"music","Dons 🎁":"tips","Live":"live"}
  const filtered = tab==="Tout" ? NOTIFS : NOTIFS.filter(n=>n.cat===catMap[tab])
  const unreadCount = NOTIFS.filter(n=>n.unread&&!read[n.name+n.time]).length

  const markAll = () => {
    const r = {}
    NOTIFS.forEach(n=>{ r[n.name+n.time]=true })
    setRead(r)
  }

  if (!open) return null

  return (
    <>
      {/* Overlay */}
      <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:199,background:"transparent"}}/>

      {/* Panel */}
      <div style={{
        position:"fixed",
        top:"var(--topnav-h,65px)",right:0,
        width:380,
        height:"calc(100vh - var(--topnav-h,65px) - var(--player-h,70px))",
        background:"var(--bg2)",
        borderLeft:"1px solid var(--border)",
        zIndex:200,
        display:"flex",flexDirection:"column",
        boxShadow:"-8px 0 32px rgba(0,0,0,.3)",
        animation:"slideInRight .25s cubic-bezier(0.4,0,0.2,1)",
        overflow:"hidden",
      }}>
        <style>{`
          @keyframes slideInRight{from{transform:translateX(100%)}to{transform:translateX(0)}}
          @media(max-width:480px){#notif-panel-inner{width:100vw!important;right:0!important}}
        `}</style>

        {/* Header */}
        <div style={{padding:"18px 18px 12px",borderBottom:"1px solid var(--border)",flexShrink:0}}>
          <div style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:17,
            display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
            <span>🔔 Notifications {unreadCount>0&&<span style={{fontSize:11,background:"var(--red)",color:"#fff",borderRadius:10,padding:"0 6px",marginLeft:6,fontFamily:"Space Mono,monospace"}}>{unreadCount}</span>}</span>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span onClick={markAll} style={{fontSize:11,color:"var(--gold)",fontFamily:"Space Mono,monospace",cursor:"pointer"}}>Tout lire</span>
              <div onClick={onClose} style={{width:28,height:28,borderRadius:"50%",background:"var(--card)",border:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:12,transition:"all .18s"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--red)";e.currentTarget.style.color="var(--red)"}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.color="var(--text)"}}>✕</div>
            </div>
          </div>
          {/* Tabs */}
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {TABS.map(t=>(
              <button key={t} onClick={()=>setTab(t)}
                style={{padding:"4px 12px",borderRadius:20,fontSize:11.5,fontWeight:600,cursor:"pointer",
                  border:"1px solid",transition:"all .18s",fontFamily:"Plus Jakarta Sans,sans-serif",
                  borderColor:tab===t?"var(--gold)":"var(--border)",
                  background:tab===t?"var(--gold)":"var(--card2)",
                  color:tab===t?"#000":"var(--text2)"}}>
                {t}
                {t==="Tout"&&unreadCount>0&&<span style={{fontSize:9,background:"var(--red)",color:"#fff",borderRadius:10,padding:"0 4px",marginLeft:3}}>{unreadCount}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Liste */}
        <div style={{flex:1,overflowY:"auto",padding:"8px 10px"}}>
          {filtered.length===0
            ? <div style={{textAlign:"center",padding:"40px 20px",color:"var(--text3)"}}>
                <div style={{fontSize:32,marginBottom:8}}>🔔</div>
                <div style={{fontSize:13,fontWeight:600,marginBottom:4}}>Aucune notification</div>
                <div style={{fontSize:12}}>Vous êtes à jour !</div>
              </div>
            : filtered.map((n,i)=>{
                const isRead = read[n.name+n.time]
                const unread = n.unread && !isRead
                return(
                  <div key={i}
                    onClick={()=>setRead(p=>({...p,[n.name+n.time]:true}))}
                    style={{display:"flex",gap:10,padding:"10px 8px",borderRadius:"var(--radius-sm)",
                      cursor:"pointer",transition:"all .15s",marginBottom:3,
                      border:`1px solid ${unread?"rgba(245,166,35,.08)":"transparent"}`,
                      background:unread?"rgba(245,166,35,.04)":"transparent",
                      position:"relative"}}
                    onMouseEnter={e=>{e.currentTarget.style.background="var(--card)";e.currentTarget.style.borderColor="var(--border)"}}
                    onMouseLeave={e=>{e.currentTarget.style.background=unread?"rgba(245,166,35,.04)":"transparent";e.currentTarget.style.borderColor=unread?"rgba(245,166,35,.08)":"transparent"}}>

                    {unread&&<div style={{position:"absolute",left:2,top:"50%",transform:"translateY(-50%)",width:6,height:6,background:"var(--gold)",borderRadius:"50%"}}/>}

                    {/* Avatar */}
                    <div style={{width:38,height:38,borderRadius:"50%",background:n.bg,flexShrink:0,
                      display:"flex",alignItems:"center",justifyContent:"center",
                      fontSize:n.ava.length>2?18:14,fontWeight:700,color:"#000",
                      position:"relative",marginLeft:unread?8:0}}>
                      {n.ava}
                      <div style={{position:"absolute",bottom:-2,right:-2,width:18,height:18,borderRadius:"50%",
                        background:TYPE_BG[n.type]||"var(--gold)",border:"2px solid var(--bg2)",
                        display:"flex",alignItems:"center",justifyContent:"center",fontSize:9}}>
                        {TYPE_ICONS[n.type]||"🔔"}
                      </div>
                    </div>

                    {/* Contenu */}
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12.5,lineHeight:1.4,color:"var(--text)"}}>
                        <strong>{n.name}</strong> {n.text}
                      </div>
                      <div style={{fontSize:11,color:"var(--text3)",fontFamily:"Space Mono,monospace",marginTop:3}}>{n.time}</div>
                      {n.action&&<button style={{marginTop:5,padding:"4px 10px",borderRadius:50,border:"1px solid var(--border)",background:"transparent",color:"var(--text2)",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"Plus Jakarta Sans,sans-serif",transition:"all .15s"}}
                        onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--gold)";e.currentTarget.style.color="var(--gold)"}}
                        onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.color="var(--text2)"}}>
                        {n.action}
                      </button>}
                    </div>
                  </div>
                )
              })
          }
        </div>

        {/* Footer */}
        <div style={{padding:"12px 14px",borderTop:"1px solid var(--border)",flexShrink:0}}>
          <button onClick={()=>{setPage("feed");onClose()}}
            style={{width:"100%",padding:"10px",borderRadius:50,border:"1px solid var(--border)",
              background:"transparent",color:"var(--text2)",fontSize:12,fontWeight:600,
              cursor:"pointer",fontFamily:"Plus Jakarta Sans,sans-serif",transition:"all .2s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--gold)";e.currentTarget.style.color="var(--gold)"}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.color="var(--text2)"}}>
            Voir toute l'activité →
          </button>
        </div>
      </div>
    </>
  )
}
