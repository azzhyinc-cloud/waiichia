import { usePlayerStore } from "../stores/index.js"
import { usePageStore } from "../stores/index.js"
import { useState, useRef, useEffect } from "react"

const fmt = s => {
  if (!s || isNaN(s)) return "0:00"
  const m = Math.floor(s/60), sec = Math.floor(s%60)
  return `${m}:${String(sec).padStart(2,"0")}`
}

export default function PlayerBar() {
  const { currentTrack, isPlaying, progress, duration, volume,
          pause, resume, seek, setVolume, playNext, playPrev, queue } = usePlayerStore()
  const { setPage } = usePageStore()
  const [shuffle,   setShuffle]   = useState(false)
  const [repeat,    setRepeat]    = useState(false)
  const [liked,     setLiked]     = useState(false)
  const [muted,     setMuted]     = useState(false)
  const [product,   setProduct]   = useState(null)
  const [showQ,     setShowQ]     = useState(false)
  const [expanded,  setExpanded]  = useState(false)
  const prevVol = useRef(volume)
  const progRef = useRef(null)
  const volRef  = useRef(null)

  const checkProduct = async (trackId) => {
    if (!trackId) { setProduct(null); return }
    try {
      const res = await fetch((import.meta.env.VITE_API_URL||'')+'/api/products?content_id='+trackId)
      const data = await res.json()
      const p = (data.products||[]).find(p => p.content_id === trackId)
      setProduct(p || null)
    } catch(e) { setProduct(null) }
  }

  useEffect(()=>{if(currentTrack?.id)checkProduct(currentTrack.id);else setProduct(null)},[currentTrack?.id])

  const pct = duration > 0 ? (progress / duration) * 100 : 0

  const handleProgress = e => {
    e.preventDefault(); e.stopPropagation()
    const bar = e.currentTarget
    const rect = bar.getBoundingClientRect()
    let clientX
    if (e.type==='touchend'||e.type==='touchstart') {
      const touch = e.changedTouches?.[0]||e.touches?.[0]
      if (!touch) return
      clientX = touch.clientX
    } else { clientX = e.clientX }
    if (!duration||!rect.width) return
    const x = Math.max(0,Math.min(1,(clientX-rect.left)/rect.width))
    seek(x*duration)
  }

  const handleVolume = e => {
    if (!volRef.current) return
    const rect = volRef.current.getBoundingClientRect()
    const x = Math.max(0,Math.min(1,(e.clientX-rect.left)/rect.width))
    setVolume(x); setMuted(x===0)
  }

  const toggleMute = () => {
    if (muted) { setVolume(prevVol.current||0.8); setMuted(false) }
    else { prevVol.current=volume; setVolume(0); setMuted(true) }
  }

  const volIcon = muted||volume===0?"🔇":volume<0.4?"🔉":"🔊"

  if (!currentTrack) return null

  return (
    <>
      {/* ── EXPANDED MOBILE ── */}
      {expanded && (
        <div style={{position:"fixed",inset:0,zIndex:300,
          background:"rgba(7,10,15,.98)",backdropFilter:"blur(40px)",
          display:"flex",flexDirection:"column",alignItems:"center",
          padding:"0 24px 32px",overflowY:"auto"}}>

          {/* Header expanded */}
          <div style={{width:"100%",display:"flex",alignItems:"center",
            justifyContent:"space-between",padding:"16px 0 8px"}}>
            <button onClick={()=>setExpanded(false)}
              style={{background:"none",border:"none",cursor:"pointer",
                color:"var(--text2)",fontSize:22}}>⌄</button>
            <span style={{fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:13,
              color:"var(--text3)",letterSpacing:1}}>EN LECTURE</span>
            <button onClick={()=>setShowQ(!showQ)}
              style={{background:"none",border:"none",cursor:"pointer",
                color:showQ?"var(--gold)":"var(--text2)",fontSize:18}}>☰</button>
          </div>

          {/* Queue overlay dans expanded */}
          {showQ && (
            <div style={{width:"100%",background:"var(--bg2)",border:"1px solid var(--border)",
              borderRadius:"var(--radius)",marginBottom:16,overflow:"hidden"}}>
              <div style={{padding:"10px 14px",borderBottom:"1px solid var(--border)",
                fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:13}}>
                ☰ File d'attente ({queue.length})
              </div>
              <div style={{maxHeight:220,overflowY:"auto"}}>
                {queue.length===0
                  ? <div style={{padding:16,textAlign:"center",color:"var(--text3)",fontSize:12}}>File vide</div>
                  : queue.map((t,i)=>(
                    <div key={t.id} style={{padding:"9px 14px",display:"flex",alignItems:"center",gap:10,
                      borderBottom:"1px solid var(--border2)",
                      background:currentTrack?.id===t.id?"var(--card)":"transparent"}}>
                      <span style={{fontFamily:"Space Mono,monospace",fontSize:10,color:"var(--text3)",width:16}}>{i+1}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:12,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",
                          whiteSpace:"nowrap",color:currentTrack?.id===t.id?"var(--gold)":"var(--text)"}}>{t.title}</div>
                        <div style={{fontSize:11,color:"var(--text3)"}}>{t.profiles?.display_name||"Artiste"}</div>
                      </div>
                      {currentTrack?.id===t.id&&<span style={{fontSize:10,color:"var(--gold)"}}>▶</span>}
                    </div>
                  ))
                }
              </div>
            </div>
          )}

          {/* Pochette grande */}
          {!showQ && (
            <div style={{width:"100%",maxWidth:300,aspectRatio:"1",borderRadius:20,overflow:"hidden",
              background:"linear-gradient(135deg,var(--gold),var(--red))",
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:80,
              boxShadow:"0 24px 64px rgba(0,0,0,.6)",margin:"12px 0 24px",flexShrink:0,
              animation:isPlaying?"spin 12s linear infinite":"none"}}>
              {currentTrack.cover_url
                ? <img src={currentTrack.cover_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover",animation:"none"}}/>
                : "🎵"}
            </div>
          )}

          {/* Titre + artiste */}
          <div style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
            <div style={{minWidth:0}}>
              <div style={{fontSize:20,fontWeight:800,fontFamily:"Syne,sans-serif",
                overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                {currentTrack.title}
              </div>
              <div style={{fontSize:14,color:"var(--text2)",marginTop:3}}>
                {currentTrack.profiles?.display_name||currentTrack.artist||"Artiste"}
              </div>
            </div>
            <button onClick={()=>setLiked(!liked)}
              style={{background:"none",border:"none",cursor:"pointer",fontSize:24,flexShrink:0,
                color:liked?"var(--red)":"var(--text3)"}}>
              {liked?"❤️":"♡"}
            </button>
          </div>

          {/* Progress */}
          <div style={{width:"100%",marginBottom:8}}>
            <div onClick={handleProgress} onTouchEnd={handleProgress}
              style={{width:"100%",height:5,background:"var(--border2)",borderRadius:3,cursor:"pointer"}}>
              <div style={{height:"100%",width:`${pct}%`,
                background:"linear-gradient(90deg,var(--gold),#e8920a)",
                borderRadius:3,pointerEvents:"none"}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:5}}>
              <span style={{fontSize:11,fontFamily:"Space Mono,monospace",color:"var(--text3)"}}>{fmt(progress)}</span>
              <span style={{fontSize:11,fontFamily:"Space Mono,monospace",color:"var(--text3)"}}>{fmt(duration)}</span>
            </div>
          </div>

          {/* Contrôles */}
          <div style={{display:"flex",alignItems:"center",gap:20,marginTop:8}}>
            <Ctrl active={shuffle} onClick={()=>setShuffle(!shuffle)}>⇄</Ctrl>
            <Ctrl onClick={playPrev}>⏮</Ctrl>
            <button onClick={isPlaying?pause:resume}
              style={{width:56,height:56,borderRadius:"50%",background:"var(--gold)",border:"none",
                cursor:"pointer",fontSize:20,color:"#000",
                boxShadow:"0 4px 20px rgba(245,166,35,.4)",
                display:"flex",alignItems:"center",justifyContent:"center"}}>
              {isPlaying?"⏸":"▶"}
            </button>
            <Ctrl onClick={playNext}>⏭</Ctrl>
            <Ctrl active={repeat} onClick={()=>setRepeat(!repeat)}>↻</Ctrl>
          </div>

          {/* Volume */}
          <div style={{display:"flex",alignItems:"center",gap:10,width:"100%",marginTop:24}}>
            <button onClick={toggleMute}
              style={{background:"none",border:"none",cursor:"pointer",color:"var(--text2)",fontSize:16}}>
              {volIcon}
            </button>
            <div ref={volRef} onClick={handleVolume}
              style={{flex:1,height:4,background:"var(--border2)",borderRadius:2,cursor:"pointer"}}>
              <div style={{height:"100%",width:`${(muted?0:volume)*100}%`,
                background:"var(--gold)",borderRadius:2,pointerEvents:"none"}}/>
            </div>
          </div>

          {/* Badge produit */}
          {product && (
            <button onClick={()=>{setPage('shop');setExpanded(false)}}
              style={{marginTop:20,padding:"10px 20px",borderRadius:50,border:"none",
                background:"linear-gradient(135deg,var(--gold),#e8920a)",color:"#000",
                fontWeight:700,fontSize:13,cursor:"pointer"}}>
              🛒 Acheter — {product.price?.toLocaleString()} {product.currency||'KMF'}
            </button>
          )}
        </div>
      )}

      {/* ── QUEUE DESKTOP ── */}
      {showQ && !expanded && (
        <div style={{position:"fixed",bottom:"var(--player-h,70px)",right:16,
          width:300,maxHeight:400,background:"var(--bg2)",border:"1px solid var(--border)",
          borderRadius:"var(--radius)",overflow:"hidden",zIndex:250,
          boxShadow:"0 -8px 32px var(--shadow)"}}>
          <div style={{padding:"12px 16px",borderBottom:"1px solid var(--border)",
            display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <span style={{fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:14}}>
              ☰ File d'attente ({queue.length})
            </span>
            <button onClick={()=>setShowQ(false)} style={{background:"none",border:"none",
              cursor:"pointer",color:"var(--text2)",fontSize:16}}>✕</button>
          </div>
          <div style={{overflowY:"auto",maxHeight:340}}>
            {queue.length===0
              ? <div style={{padding:24,textAlign:"center",color:"var(--text3)",fontSize:13}}>File vide</div>
              : queue.map((t,i)=>(
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
                  {currentTrack?.id===t.id&&<span style={{fontSize:10,color:"var(--gold)",flexShrink:0}}>▶</span>}
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
        <div onClick={handleProgress} onTouchEnd={handleProgress}
          className="progress-top-bar" style={{position:"absolute",top:0,left:0,right:0,height:3,
            background:"var(--border2)",cursor:"pointer",zIndex:1}}>
          <div style={{height:"100%",width:`${pct}%`,
            background:"linear-gradient(90deg,var(--gold),#e8920a)",
            transition:"width .25s linear",pointerEvents:"none"}}/>
        </div>

        {/* LEFT — cliquable sur mobile pour expanded */}
        <div onClick={()=>setExpanded(true)}
          style={{display:"flex",alignItems:"center",gap:11,width:180,flexShrink:0,minWidth:0,
            cursor:"pointer"}}>
          <div style={{width:46,height:46,borderRadius:9,flexShrink:0,overflow:"hidden",
            background:"linear-gradient(135deg,var(--gold),var(--red))",
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,
            boxShadow:"0 4px 14px rgba(0,0,0,.4)",
            animation:isPlaying?"spin 8s linear infinite":"none",position:"relative"}}>
            {product&&<div onClick={e=>{e.stopPropagation();setPage('shop')}} style={{position:'absolute',top:-8,right:-8,background:'linear-gradient(135deg,var(--gold),#e8920a)',color:'#000',borderRadius:20,padding:'3px 8px',fontSize:10,fontWeight:800,cursor:'pointer',boxShadow:'0 2px 8px rgba(245,166,35,.4)',zIndex:5,display:'flex',alignItems:'center',gap:3,whiteSpace:'nowrap'}}>🛒 {product.price?.toLocaleString()} {product.currency||'KMF'}</div>}
            {currentTrack.cover_url
              ? <img src={currentTrack.cover_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
              : "🎵"}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:600,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
              {currentTrack.title}
            </div>
            <div style={{fontSize:11,color:"var(--text2)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginTop:1}}>
              {currentTrack.profiles?.display_name||currentTrack.artist||"Artiste"}
            </div>
          </div>
          <button onClick={e=>{e.stopPropagation();setLiked(!liked)}}
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
            <div ref={progRef} onClick={handleProgress} onTouchEnd={handleProgress}
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
        <div className="player-mobile" style={{display:"none",alignItems:"center",gap:6,flex:1}}>
          <Ctrl onClick={playPrev}>⏮</Ctrl>
          <button onClick={isPlaying?pause:resume}
            style={{width:38,height:38,borderRadius:"50%",background:"var(--gold)",border:"none",
              cursor:"pointer",fontSize:14,color:"#000",
              display:"flex",alignItems:"center",justifyContent:"center"}}>
            {isPlaying?"⏸":"▶"}
          </button>
          <Ctrl onClick={playNext}>⏭</Ctrl>
          <Ctrl onClick={()=>setShowQ(!showQ)}>☰</Ctrl>
        </div>
        <div className="player-mobile-progress" style={{display:"none",position:"fixed",bottom:72,left:0,right:0,height:16,padding:"0 8px",zIndex:201,alignItems:"center",gap:4}}>
          <span style={{fontSize:8,fontFamily:"Space Mono,monospace",color:"var(--text3)"}}>{fmt(progress)}</span>
          <div onClick={handleProgress} onTouchEnd={handleProgress} style={{flex:1,height:3,background:"var(--border2)",borderRadius:3,cursor:"pointer"}}><div style={{height:"100%",width:pct+"%",background:"var(--gold)",borderRadius:3,pointerEvents:"none"}}/></div>
          <span style={{fontSize:8,fontFamily:"Space Mono,monospace",color:"var(--text3)"}}>{fmt(duration)}</span>
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
