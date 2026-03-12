import { usePlayerStore } from "../stores/index.js"
import { usePageStore } from "../stores/index.js"
import { useState, useRef } from "react"

const fmt = s => {
  if (!s || isNaN(s)) return "0:00"
  const m = Math.floor(s/60), sec = Math.floor(s%60)
  return `${m}:${String(sec).padStart(2,"0")}`
}

export default function PlayerBar() {
  const { currentTrack, isPlaying, progress, duration, volume,
          pause, resume, seek, setVolume, playNext, playPrev, queue } = usePlayerStore()
  const { setPage } = usePageStore()
  const [shuffle, setShuffle] = useState(false)
  const [repeat,  setRepeat]  = useState(false)
  const [liked,   setLiked]   = useState(false)
  const [muted,   setMuted]   = useState(false)
  const [showQ,   setShowQ]   = useState(false)
  const prevVol = useRef(volume)
  const progRef = useRef(null)
  const volRef  = useRef(null)

  const pct = duration > 0 ? (progress / duration) * 100 : 0

  const handleProgress = e => {
    if (!progRef.current || !duration) return
    const rect = progRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    seek(x * duration)
  }

  const handleVolume = e => {
    if (!volRef.current) return
    const rect = volRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    setVolume(x); setMuted(x === 0)
  }

  const toggleMute = () => {
    if (muted) { setVolume(prevVol.current || 0.8); setMuted(false) }
    else { prevVol.current = volume; setVolume(0); setMuted(true) }
  }

  const volIcon = muted || volume === 0 ? "🔇" : volume < 0.4 ? "🔉" : "🔊"

  if (!currentTrack) return null

  return (
    <>
      {showQ && (
        <div style={{position:"fixed",bottom:"var(--player-h,70px)",right:16,
          width:300,maxHeight:400,background:"var(--bg2)",border:"1px solid var(--border)",
          borderRadius:"var(--radius)",overflow:"hidden",zIndex:250,
          boxShadow:"0 -8px 32px var(--shadow)"}}>
          <div style={{padding:"12px 16px",borderBottom:"1px solid var(--border)",
            display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <span style={{fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:14}}>
              ☰ File d&apos;attente ({queue.length})
            </span>
            <button onClick={()=>setShowQ(false)} style={{background:"none",border:"none",
              cursor:"pointer",color:"var(--text2)",fontSize:16}}>✕</button>
          </div>
          <div style={{overflowY:"auto",maxHeight:340}}>
            {queue.length === 0
              ? <div style={{padding:24,textAlign:"center",color:"var(--text3)",fontSize:13}}>File vide</div>
              : queue.map((t,i) => (
                <div key={t.id} style={{padding:"10px 16px",display:"flex",alignItems:"center",gap:10,
                  borderBottom:"1px solid var(--border2)",cursor:"pointer",
                  background:currentTrack?.id===t.id?"var(--card)":"transparent",transition:"background .15s"}}
                  onMouseEnter={e=>e.currentTarget.style.background="var(--card)"}
                  onMouseLeave={e=>e.currentTarget.style.background=currentTrack?.id===t.id?"var(--card)":"transparent"}>
                  <span style={{fontFamily:"Space Mono,monospace",fontSize:11,color:"var(--text3)",width:18}}>{i+1}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",
                      whiteSpace:"nowrap",color:currentTrack?.id===t.id?"var(--gold)":"var(--text)"}}>{t.title}</div>
                    <div style={{fontSize:11,color:"var(--text3)"}}>{t.profiles?.display_name||"Artiste"}</div>
                  </div>
                  {currentTrack?.id===t.id && <span style={{fontSize:10,color:"var(--gold)",flexShrink:0}}>▶</span>}
                </div>
              ))
            }
          </div>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <div style={{
        position:"fixed",bottom:0,left:0,right:0,
        height:"var(--player-h,70px)",
        background:"rgba(7,10,15,.97)",
        backdropFilter:"blur(30px)",
        borderTop:"1px solid var(--border)",
        zIndex:200,display:"flex",alignItems:"center",
        padding:"0 16px",gap:14,userSelect:"none",
      }}>
        {/* Progress line top */}
        <div onClick={handleProgress}
          style={{position:"absolute",top:0,left:0,right:0,height:3,
            background:"var(--border2)",cursor:"pointer",zIndex:1}}>
          <div style={{height:"100%",width:`${pct}%`,
            background:"linear-gradient(90deg,var(--gold),#e8920a)",
            transition:"width .25s linear",pointerEvents:"none"}}/>
        </div>

        {/* LEFT */}
        <div style={{display:"flex",alignItems:"center",gap:11,width:240,flexShrink:0,minWidth:0}}>
          <div style={{width:46,height:46,borderRadius:9,flexShrink:0,overflow:"hidden",
            background:"linear-gradient(135deg,var(--gold),var(--red))",
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,
            boxShadow:"0 4px 14px rgba(0,0,0,.4)",
            animation:isPlaying?"spin 8s linear infinite":"none"}}>
            {currentTrack.cover_url
              ? <img src={currentTrack.cover_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
              : "🎵"}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:600,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
              {currentTrack.title}
            </div>
            <div style={{fontSize:11,color:"var(--text2)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginTop:1}}>
              {currentTrack.profiles?.display_name || currentTrack.artist || "Artiste"}
            </div>
          </div>
          <button onClick={()=>setLiked(!liked)}
            style={{background:"none",border:"none",cursor:"pointer",fontSize:17,flexShrink:0,
              color:liked?"var(--red)":"var(--text3)",transition:"all .15s"}}>
            {liked?"❤️":"♡"}
          </button>
        </div>

        {/* CENTER desktop */}
        <div className="player-desktop" style={{flex:1,display:"flex",flexDirection:"column",
          alignItems:"center",gap:6,maxWidth:560,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <Ctrl active={shuffle} onClick={()=>setShuffle(!shuffle)}>⇄</Ctrl>
            <Ctrl onClick={playPrev}>⏮</Ctrl>
            <button onClick={isPlaying?pause:resume}
              style={{width:38,height:38,borderRadius:"50%",background:"var(--gold)",border:"none",
                cursor:"pointer",fontSize:14,color:"#000",boxShadow:"0 3px 14px rgba(245,166,35,.35)",
                display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s"}}
              onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.08)"}}
              onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)"}}>
              {isPlaying?"⏸":"▶"}
            </button>
            <Ctrl onClick={playNext}>⏭</Ctrl>
            <Ctrl active={repeat} onClick={()=>setRepeat(!repeat)}>↻</Ctrl>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8,width:"100%"}}>
            <span style={{fontSize:10,fontFamily:"Space Mono,monospace",color:"var(--text3)",width:32,flexShrink:0}}>
              {fmt(progress)}
            </span>
            <div ref={progRef} onClick={handleProgress}
              style={{flex:1,height:4,background:"var(--border2)",borderRadius:4,
                cursor:"pointer",position:"relative",transition:"height .15s"}}
              onMouseEnter={e=>e.currentTarget.style.height="6px"}
              onMouseLeave={e=>e.currentTarget.style.height="4px"}>
              <div style={{height:"100%",width:`${pct}%`,
                background:"linear-gradient(90deg,var(--gold),#e8920a)",
                borderRadius:4,pointerEvents:"none"}}/>
            </div>
            <span style={{fontSize:10,fontFamily:"Space Mono,monospace",color:"var(--text3)",
              width:32,flexShrink:0,textAlign:"right"}}>
              {fmt(duration)}
            </span>
          </div>
        </div>

        {/* RIGHT desktop */}
        <div className="player-desktop" style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
          <button onClick={()=>setShowQ(!showQ)}
            style={{background:"none",border:"none",cursor:"pointer",
              color:showQ?"var(--gold)":"var(--text2)",fontSize:16,transition:"color .15s"}}>
            ☰
          </button>
          <button onClick={toggleMute}
            style={{background:"none",border:"none",cursor:"pointer",
              color:"var(--text2)",fontSize:15,transition:"color .15s"}}
            onMouseEnter={e=>e.target.style.color="var(--text)"}
            onMouseLeave={e=>e.target.style.color="var(--text2)"}>
            {volIcon}
          </button>
          <div ref={volRef} onClick={handleVolume}
            style={{width:70,height:4,background:"var(--border2)",borderRadius:4,
              cursor:"pointer",position:"relative",flexShrink:0,transition:"height .15s"}}
            onMouseEnter={e=>e.currentTarget.style.height="6px"}
            onMouseLeave={e=>e.currentTarget.style.height="4px"}>
            <div style={{height:"100%",width:`${(muted?0:volume)*100}%`,
              background:"var(--gold)",borderRadius:4,pointerEvents:"none",transition:"width .1s"}}/>
          </div>
        </div>

        {/* MOBILE controls */}
        <div className="player-mobile" style={{display:"none",alignItems:"center",gap:8,marginLeft:"auto"}}>
          <Ctrl onClick={playPrev}>⏮</Ctrl>
          <button onClick={isPlaying?pause:resume}
            style={{width:38,height:38,borderRadius:"50%",background:"var(--gold)",border:"none",
              cursor:"pointer",fontSize:14,color:"#000",
              display:"flex",alignItems:"center",justifyContent:"center"}}>
            {isPlaying?"⏸":"▶"}
          </button>
          <Ctrl onClick={playNext}>⏭</Ctrl>
        </div>

        <style>{`
          @media(max-width:640px){
            .player-desktop{display:none!important}
            .player-mobile{display:flex!important}
          }
        `}</style>
      </div>
    </>
  )
}

function Ctrl({children,onClick,active}){
  return(
    <button onClick={onClick}
      style={{background:"none",border:"none",cursor:"pointer",fontSize:16,padding:4,
        borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",
        color:active?"var(--gold)":"var(--text2)",transition:"color .15s,transform .1s"}}
      onMouseEnter={e=>{e.currentTarget.style.color="var(--text)";e.currentTarget.style.transform="scale(1.1)"}}
      onMouseLeave={e=>{e.currentTarget.style.color=active?"var(--gold)":"var(--text2)";e.currentTarget.style.transform="scale(1)"}}>
      {children}
    </button>
  )
}
