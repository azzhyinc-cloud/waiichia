import { useThemeStore, useAuthStore, usePageStore } from "../stores/index.js"
import { useState, useEffect } from "react"

export default function TopNav() {
  const { theme, toggle: toggleTheme } = useThemeStore()
  const { user } = useAuthStore()
  const { setPage } = usePageStore()
  const [online, setOnline] = useState(navigator.onLine)
  const [search, setSearch] = useState("")
  const [notifs, setNotifs] = useState(3)

  useEffect(() => {
    const on  = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener("online",  on)
    window.addEventListener("offline", off)
    return () => { window.removeEventListener("online",on); window.removeEventListener("offline",off) }
  }, [])

  const initials = user?.display_name
    ? user.display_name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()
    : user?.username?.slice(0,2).toUpperCase() || "W"

  return (
    <div style={{
      position:"sticky",top:0,
      height:"var(--topnav-h,65px)",
      background: theme==="dark" ? "rgba(7,10,15,0.88)" : "rgba(240,242,248,0.92)",
      backdropFilter:"blur(28px)",
      borderBottom:"1px solid var(--border)",
      display:"flex",alignItems:"center",
      padding:"0 24px",gap:16,
      zIndex:90,transition:"background var(--transition)",
      boxShadow: theme==="dark" ? "0 1px 0 rgba(245,166,35,.04),0 4px 24px rgba(0,0,0,.3)" : "none"
    }}>

      {/* Hamburger mobile */}
      <div onClick={()=>{}} style={{display:"none",flexDirection:"column",gap:5,cursor:"pointer",padding:8,flexShrink:0}} id="hamburger">
        <span style={{width:22,height:2,background:"var(--text)",borderRadius:2,display:"block"}}/>
        <span style={{width:22,height:2,background:"var(--text)",borderRadius:2,display:"block"}}/>
        <span style={{width:22,height:2,background:"var(--text)",borderRadius:2,display:"block"}}/>
        <style>{`@media(max-width:768px){#hamburger{display:flex!important}}`}</style>
      </div>

      {/* Barre de recherche */}
      <div style={{flex:1,maxWidth:460,position:"relative"}}>
        <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",
          color:"var(--text3)",fontSize:15,pointerEvents:"none"}}>🔍</span>
        <input
          value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Rechercher sons, artistes, podcasts, albums..."
          style={{width:"100%",background:"var(--card)",border:"1px solid var(--border)",
            borderRadius:50,padding:"10px 18px 10px 42px",color:"var(--text)",
            fontSize:13.5,fontFamily:"Plus Jakarta Sans,sans-serif",outline:"none",
            boxSizing:"border-box",transition:"all .2s"}}
          onFocus={e=>{e.target.style.borderColor="var(--gold)";e.target.style.boxShadow="0 0 0 3px rgba(245,166,35,.1)"}}
          onBlur={e=>{e.target.style.borderColor="var(--border)";e.target.style.boxShadow="none"}}
        />
      </div>

      {/* Droite */}
      <div style={{display:"flex",alignItems:"center",gap:10,marginLeft:"auto",flexShrink:0}}>

        {/* Theme toggle */}
        <Btn onClick={toggleTheme} title="Mode jour/nuit">
          {theme==="dark" ? "🌙" : "☀️"}
        </Btn>

        {/* Badge réseau */}
        <div style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:11,
          fontFamily:"Space Mono,monospace",padding:"3px 9px",borderRadius:20,
          background:online?"rgba(44,198,83,.12)":"rgba(230,57,70,.15)",
          border:`1px solid ${online?"var(--green)":"var(--red)"}`,
          color:online?"var(--green)":"var(--red)"}}>
          <div style={{width:6,height:6,borderRadius:"50%",
            background:online?"var(--green)":"var(--red)",
            animation:online?"live-pulse 2s infinite":"none"}}/>
          {online?"EN LIGNE":"HORS LIGNE"}
        </div>

        {/* Pays / devise */}
        <div style={{display:"flex",alignItems:"center",gap:6,padding:"7px 12px",
          background:"var(--card)",border:"1px solid var(--border)",borderRadius:50,
          cursor:"pointer",fontSize:12,fontFamily:"Plus Jakarta Sans,sans-serif",
          transition:"border-color .2s",color:"var(--text2)"}}
          onMouseEnter={e=>e.currentTarget.style.borderColor="var(--gold)"}
          onMouseLeave={e=>e.currentTarget.style.borderColor="var(--border)"}>
          <span>🇰🇲</span>
          <span style={{fontFamily:"Space Mono,monospace",fontSize:11}}>KM · KMF</span>
        </div>

        {/* Notifications */}
        <Btn onClick={()=>{}} title="Notifications" style={{position:"relative"}}>
          🔔
          {notifs > 0 && <div style={{position:"absolute",top:-2,right:-2,
            width:9,height:9,background:"var(--red)",borderRadius:"50%",
            border:"2px solid var(--bg2)"}}/>}
        </Btn>

        {/* Avatar */}
        <div onClick={()=>setPage("profile")} style={{cursor:"pointer"}}>
          <div style={{width:36,height:36,borderRadius:"50%",overflow:"hidden",
            background:"linear-gradient(135deg,var(--gold),#e8920a)",
            display:"flex",alignItems:"center",justifyContent:"center",
            fontWeight:700,fontSize:13,color:"#000",
            border:"2px solid transparent",transition:"border-color .2s"}}
            onMouseEnter={e=>e.currentTarget.style.borderColor="var(--gold)"}
            onMouseLeave={e=>e.currentTarget.style.borderColor="transparent"}>
            {user?.avatar_url
              ? <img src={user.avatar_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
              : initials}
          </div>
        </div>

        {/* Bouton publier */}
        <button onClick={()=>setPage("upload")}
          style={{padding:"8px 16px",borderRadius:50,border:"none",
            background:"linear-gradient(135deg,var(--gold),#e8920a)",
            color:"#000",fontSize:12,fontWeight:700,cursor:"pointer",
            fontFamily:"Plus Jakarta Sans,sans-serif",whiteSpace:"nowrap",
            boxShadow:"0 3px 12px rgba(245,166,35,.3)",transition:"all .2s"}}
          onMouseEnter={e=>e.currentTarget.style.boxShadow="0 5px 18px rgba(245,166,35,.5)"}
          onMouseLeave={e=>e.currentTarget.style.boxShadow="0 3px 12px rgba(245,166,35,.3)"}>
          + Publier
        </button>
      </div>
    </div>
  )
}

function Btn({children,onClick,title,style={}}){
  return(
    <div onClick={onClick} title={title}
      style={{width:38,height:38,borderRadius:"50%",background:"var(--card)",
        border:"1px solid var(--border)",display:"flex",alignItems:"center",
        justifyContent:"center",cursor:"pointer",fontSize:16,
        transition:"all .2s",position:"relative",...style}}
      onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--gold)"}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)"}}>
      {children}
    </div>
  )
}
