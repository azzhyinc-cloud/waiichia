const fs = require('fs')
let c = fs.readFileSync('PlayerBar.jsx','utf8')

// Replace mobile controls section with enhanced version
const oldMobile = `<div className="player-mobile" style={{display:"none",alignItems:"center",gap:8,marginLeft:"auto"}}>
          <Ctrl onClick={playPrev}>⏮</Ctrl>
          <button onClick={isPlaying?pause:resume}
            style={{width:38,height:38,borderRadius:"50%",background:"var(--gold)",border:"none",
              cursor:"pointer",fontSize:14,color:"#000",
              display:"flex",alignItems:"center",justifyContent:"center"}}>
            {isPlaying?"⏸":"▶"}
          </button>
          <Ctrl onClick={playNext}>⏭</Ctrl>
        </div>`

const newMobile = `<div className="player-mobile" style={{display:"none",alignItems:"center",gap:6,flex:1}}>
          <div style={{flex:1,display:"flex",flexDirection:"column",gap:4,minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",gap:8,justifyContent:"center"}}>
              <Ctrl onClick={playPrev}>⏮</Ctrl>
              <button onClick={isPlaying?pause:resume}
                style={{width:36,height:36,borderRadius:"50%",background:"var(--gold)",border:"none",
                  cursor:"pointer",fontSize:13,color:"#000",
                  display:"flex",alignItems:"center",justifyContent:"center"}}>
                {isPlaying?"⏸":"▶"}
              </button>
              <Ctrl onClick={playNext}>⏭</Ctrl>
              <Ctrl onClick={()=>setShowQ(!showQ)}>☰</Ctrl>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:6,width:"100%"}}>
              <span style={{fontSize:9,fontFamily:"Space Mono,monospace",color:"var(--text3)"}}>{fmt(progress)}</span>
              <div onClick={handleProgress} ref={progRef}
                style={{flex:1,height:3,background:"var(--border2)",borderRadius:3,cursor:"pointer"}}>
                <div style={{height:"100%",width:pct+"%",background:"var(--gold)",borderRadius:3,pointerEvents:"none"}}/>
              </div>
              <span style={{fontSize:9,fontFamily:"Space Mono,monospace",color:"var(--text3)"}}>{fmt(duration)}</span>
            </div>
          </div>
        </div>`

c = c.replace(oldMobile, newMobile)
fs.writeFileSync('PlayerBar.jsx', c)
console.log('OK - PlayerBar mobile enhanced')
