import { useThemeStore, useAuthStore, usePageStore } from "../stores/index.js"
import { useState, useEffect, useRef } from "react"
import NotifPanel from "./NotifPanel.jsx"
import DeviseModal from "./DeviseModal.jsx"
import api from "../services/api.js"

const SEARCH_MOCK = [
  {type:"track",title:"Twarab ya Komori",sub:"Kolo Officiel",icon:"🎵"},
  {type:"track",title:"Moroni Flow",sub:"DJ Comoros",icon:"🎵"},
  {type:"artist",title:"Fatima K",sub:"Artiste · 12K fans",icon:"👤"},
  {type:"track",title:"Afrika Rising",sub:"Waiichia Beats",icon:"🎵"},
  {type:"artist",title:"Nadjib Pro",sub:"Producteur · Comores",icon:"👤"},
  {type:"event",title:"Waiichia Music Festival",sub:"Moroni · 2 500 KMF",icon:"🎪"},
  {type:"track",title:"Pumzika Beat",sub:"Omar Said",icon:"🎵"},
  {type:"artist",title:"Studio KM",sub:"Label · Comores",icon:"🏷️"},
]

export default function TopNav() {
  const { theme, toggle: toggleTheme } = useThemeStore()
  const { user } = useAuthStore()
  const { setPage } = usePageStore()
  const [online, setOnline]       = useState(navigator.onLine)
  const [search, setSearch]       = useState("")
  const [results, setResults]     = useState([])
  const [showRes, setShowRes]     = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [deviseOpen, setDeviseOpen] = useState(false)
  const [devise, setDevise]       = useState({code:"KMF",flag:"🇰🇲",country:"Comores"})
  const [notifCount]              = useState(5)
  const searchRef                 = useRef(null)

  useEffect(()=>{
    const on=()=>setOnline(true), off=()=>setOnline(false)
    window.addEventListener("online",on); window.addEventListener("offline",off)
    return()=>{window.removeEventListener("online",on);window.removeEventListener("offline",off)}
  },[])

  useEffect(()=>{
    if(!search.trim()){setResults([]);setShowRes(false);return}
    const q=search.toLowerCase()
    const filtered=SEARCH_MOCK.filter(r=>r.title.toLowerCase().includes(q)||r.sub.toLowerCase().includes(q))
    setResults(filtered); setShowRes(true)
  },[search])

  useEffect(()=>{
    const h=(e)=>{if(searchRef.current&&!searchRef.current.contains(e.target))setShowRes(false)}
    document.addEventListener("mousedown",h)
    return()=>document.removeEventListener("mousedown",h)
  },[])

  const initials=user?.display_name
    ?user.display_name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()
    :user?.username?.slice(0,2).toUpperCase()||"W"

  return (
    <>
      <div style={{position:"sticky",top:0,height:"var(--topnav-h,65px)",background:theme==="dark"?"rgba(7,10,15,0.88)":"rgba(240,242,248,0.92)",backdropFilter:"blur(28px)",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",padding:"0 24px",gap:16,zIndex:150,transition:"background var(--transition)",boxShadow:theme==="dark"?"0 1px 0 rgba(245,166,35,.04),0 4px 24px rgba(0,0,0,.3)":"none"}}>

        {/* Hamburger mobile */}
        <div style={{display:"none",flexDirection:"column",gap:5,cursor:"pointer",padding:8,flexShrink:0}} id="hamburger">
          <span style={{width:22,height:2,background:"var(--text)",borderRadius:2,display:"block"}}/>
          <span style={{width:22,height:2,background:"var(--text)",borderRadius:2,display:"block"}}/>
          <span style={{width:22,height:2,background:"var(--text)",borderRadius:2,display:"block"}}/>
          <style>{`@media(max-width:768px){#hamburger{display:flex!important}}`}</style>
        </div>

        {/* Search */}
        <div ref={searchRef} style={{flex:1,maxWidth:460,position:"relative"}}>
          <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:"var(--text3)",fontSize:15,pointerEvents:"none"}}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Rechercher sons, artistes, podcasts, albums..."
            style={{width:"100%",background:"var(--card)",border:"1px solid var(--border)",borderRadius:50,padding:"10px 18px 10px 42px",color:"var(--text)",fontSize:13.5,fontFamily:"Plus Jakarta Sans,sans-serif",outline:"none",boxSizing:"border-box",transition:"all .2s"}}
            onFocus={e=>{e.target.style.borderColor="var(--gold)";e.target.style.boxShadow="0 0 0 3px rgba(245,166,35,.1)";search&&setShowRes(true)}}
            onBlur={e=>{e.target.style.borderColor="var(--border)";e.target.style.boxShadow="none"}}
          />
          {showRes&&results.length>0&&(
            <div style={{position:"absolute",top:"calc(100% + 8px)",left:0,right:0,background:"var(--bg2)",border:"1px solid var(--border)",borderRadius:"var(--radius)",boxShadow:"0 8px 32px rgba(0,0,0,.3)",zIndex:300,overflow:"hidden"}}>
              {results.map((r,i)=>(
                <div key={i} onClick={()=>{setSearch("");setShowRes(false)}}
                  style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",cursor:"pointer",borderBottom:i<results.length-1?"1px solid var(--border2)":"none",transition:"background .15s"}}
                  onMouseEnter={e=>e.currentTarget.style.background="var(--card)"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <div style={{width:32,height:32,borderRadius:r.type==="artist"?"50%":8,background:"linear-gradient(135deg,var(--gold),#e8920a)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>{r.icon}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.title}</div>
                    <div style={{fontSize:11,color:"var(--text3)"}}>{r.sub}</div>
                  </div>
                  <div style={{fontSize:10,color:"var(--text3)",fontFamily:"Space Mono,monospace",textTransform:"uppercase",flexShrink:0}}>{r.type}</div>
                </div>
              ))}
              <div style={{padding:"8px 14px",borderTop:"1px solid var(--border)",fontSize:11,color:"var(--text3)",textAlign:"center",cursor:"pointer"}} onClick={()=>setShowRes(false)}>
                Appuyez sur Entrée pour "{search}"
              </div>
            </div>
          )}
        </div>

        {/* Droite */}
        <div style={{display:"flex",alignItems:"center",gap:10,marginLeft:"auto",flexShrink:0}}>
          <Btn onClick={toggleTheme}>{theme==="dark"?"🌙":"☀️"}</Btn>

          <div style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:11,fontFamily:"Space Mono,monospace",padding:"3px 9px",borderRadius:20,background:online?"rgba(44,198,83,.12)":"rgba(230,57,70,.15)",border:`1px solid ${online?"var(--green)":"var(--red)"}`,color:online?"var(--green)":"var(--red)"}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:online?"var(--green)":"var(--red)",animation:online?"live-pulse 2s infinite":"none"}}/>
            {online?"EN LIGNE":"HORS LIGNE"}
          </div>

          {/* Devise — ouvre modal */}
          <div onClick={()=>setDeviseOpen(true)}
            style={{display:"flex",alignItems:"center",gap:6,padding:"7px 12px",background:"var(--card)",border:"1px solid var(--border)",borderRadius:50,cursor:"pointer",fontSize:12,fontFamily:"Plus Jakarta Sans,sans-serif",transition:"all .2s",color:"var(--text2)"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--gold)";e.currentTarget.style.color="var(--text)"}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.color="var(--text2)"}}>
            <span>{devise.flag}</span>
            <span style={{fontFamily:"Space Mono,monospace",fontSize:11}}>{devise.country.slice(0,2).toUpperCase()} · {devise.code}</span>
          </div>

          {/* Cloche notifs */}
          <div onClick={()=>setNotifOpen(!notifOpen)}
            style={{width:38,height:38,borderRadius:"50%",background:notifOpen?"var(--gold)":"var(--card)",border:`1px solid ${notifOpen?"var(--gold)":"var(--border)"}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:16,transition:"all .2s",position:"relative"}}
            onMouseEnter={e=>{if(!notifOpen)e.currentTarget.style.borderColor="var(--gold)"}}
            onMouseLeave={e=>{if(!notifOpen)e.currentTarget.style.borderColor="var(--border)"}}>
            <span style={{filter:notifOpen?"invert(1) brightness(0)":"none"}}>🔔</span>
            {notifCount>0&&!notifOpen&&<div style={{position:"absolute",top:-2,right:-2,width:9,height:9,background:"var(--red)",borderRadius:"50%",border:"2px solid var(--bg2)"}}/>}
          </div>

          {/* Avatar */}
          <div onClick={()=>setPage("profile")} style={{cursor:"pointer"}}>
            <div style={{width:36,height:36,borderRadius:"50%",overflow:"hidden",background:"linear-gradient(135deg,var(--gold),#e8920a)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:13,color:"#000",border:"2px solid transparent",transition:"border-color .2s"}}
              onMouseEnter={e=>e.currentTarget.style.borderColor="var(--gold)"}
              onMouseLeave={e=>e.currentTarget.style.borderColor="transparent"}>
              {user?.avatar_url?<img src={user.avatar_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:initials}
            </div>
          </div>

          <button onClick={()=>setPage("upload")}
            style={{padding:"8px 16px",borderRadius:50,border:"none",background:"linear-gradient(135deg,var(--gold),#e8920a)",color:"#000",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"Plus Jakarta Sans,sans-serif",whiteSpace:"nowrap",boxShadow:"0 3px 12px rgba(245,166,35,.3)",transition:"all .2s"}}
            onMouseEnter={e=>e.currentTarget.style.boxShadow="0 5px 18px rgba(245,166,35,.5)"}
            onMouseLeave={e=>e.currentTarget.style.boxShadow="0 3px 12px rgba(245,166,35,.3)"}>
            + Publier
          </button>
        </div>
      </div>

      <NotifPanel open={notifOpen} onClose={()=>setNotifOpen(false)}/>
      <DeviseModal open={deviseOpen} onClose={()=>setDeviseOpen(false)} current={devise.code} onChange={(d)=>{setDevise(d)}}/>
    </>
  )
}

function Btn({children,onClick}){
  return(
    <div onClick={onClick} style={{width:38,height:38,borderRadius:"50%",background:"var(--card)",border:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:16,transition:"all .2s"}}
      onMouseEnter={e=>e.currentTarget.style.borderColor="var(--gold)"}
      onMouseLeave={e=>e.currentTarget.style.borderColor="var(--border)"}>
      {children}
    </div>
  )
}
