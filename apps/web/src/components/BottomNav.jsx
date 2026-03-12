import { usePageStore } from "../stores/index.js"
import { usePlayerStore } from "../stores/index.js"

const ITEMS = [
  { id:"home",     icon:"🏠", label:"Accueil"   },
  { id:"trending", icon:"🔥", label:"Tendances"  },
  { id:"upload",   icon:"⬆️",  label:"",  center:true },
  { id:"karaoke",  icon:"🎤", label:"Karaoké"   },
  { id:"profile",  icon:"👤", label:"Profil"    },
]

export default function BottomNav() {
  const { currentPage, setPage } = usePageStore()
  const { currentTrack }         = usePlayerStore()
  const bottom = currentTrack ? "var(--player-h,70px)" : "0px"

  return (
    <>
      <style>{`
        @media(max-width:768px){
          #waiichia-bottom-nav{display:flex!important}
          #waiichia-layout-main{padding-bottom:calc(56px + ${currentTrack?70:0}px)!important}
        }
      `}</style>
      <div id="waiichia-bottom-nav" style={{
        position:"fixed",bottom,left:0,right:0,height:56,
        background:"rgba(7,10,15,.97)",backdropFilter:"blur(20px)",
        borderTop:"1px solid var(--border)",zIndex:190,
        display:"none",alignItems:"center",justifyContent:"space-around",
      }}>
        {ITEMS.map(item => {
          const active = currentPage === item.id
          if (item.center) return (
            <button key={item.id} onClick={()=>setPage(item.id)}
              style={{width:44,height:44,borderRadius:"50%",border:"none",
                background:"linear-gradient(135deg,var(--gold),#e8920a)",
                color:"#000",fontSize:20,cursor:"pointer",
                boxShadow:"0 4px 16px rgba(245,166,35,.4)",
                display:"flex",alignItems:"center",justifyContent:"center",
                transform:"translateY(-8px)"}}>
              {item.icon}
            </button>
          )
          return (
            <button key={item.id} onClick={()=>setPage(item.id)}
              style={{display:"flex",flexDirection:"column",alignItems:"center",
                gap:3,flex:1,height:"100%",border:"none",background:"none",
                color:active?"var(--gold)":"var(--text3)",
                cursor:"pointer",padding:6,transition:"color .18s",position:"relative"}}>
              <span style={{fontSize:20,lineHeight:1}}>{item.icon}</span>
              <span style={{fontSize:9,fontFamily:"Space Mono,monospace",
                letterSpacing:".5px",textTransform:"uppercase"}}>{item.label}</span>
              {active&&<span style={{position:"absolute",bottom:0,left:"50%",
                transform:"translateX(-50%)",width:20,height:2,
                background:"var(--gold)",borderRadius:2}}/>}
            </button>
          )
        })}
      </div>
    </>
  )
}
