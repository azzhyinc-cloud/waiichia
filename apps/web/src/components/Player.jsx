import { usePlayerStore } from '../stores/index.js'

export default function Player() {
  const { currentTrack, isPlaying, progress, duration, volume, pause, resume, seek, setVolume, playNext, playPrev } = usePlayerStore()
  if (!currentTrack) return null
  const pct = duration ? (progress / duration) * 100 : 0
  const fmt = s => `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`

  return (
    <div style={{position:'fixed',bottom:0,left:0,right:0,background:'#111',borderTop:'1px solid #333',padding:'12px 20px',zIndex:1000}}>
      <div style={{maxWidth:1200,margin:'0 auto',display:'flex',alignItems:'center',gap:16}}>
        <img src={currentTrack.cover_url||'https://placehold.co/48x48/222/666?text=🎵'} style={{width:48,height:48,borderRadius:8,objectFit:'cover'}}/>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:600,fontSize:14,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{currentTrack.title}</div>
          <div style={{fontSize:12,color:'#888'}}>{currentTrack.profiles?.display_name||'Artiste'}</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <button onClick={playPrev} style={{background:'none',border:'none',color:'#fff',fontSize:20,cursor:'pointer'}}>⏮</button>
          <button onClick={isPlaying?pause:resume} style={{background:'#e74c3c',border:'none',color:'#fff',borderRadius:'50%',width:40,height:40,fontSize:18,cursor:'pointer'}}>
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button onClick={playNext} style={{background:'none',border:'none',color:'#fff',fontSize:20,cursor:'pointer'}}>⏭</button>
        </div>
        <div style={{flex:2,display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontSize:11,color:'#888',minWidth:35}}>{fmt(progress)}</span>
          <input type="range" min={0} max={duration||100} value={progress} onChange={e=>seek(Number(e.target.value))}
            style={{flex:1,accentColor:'#e74c3c'}}/>
          <span style={{fontSize:11,color:'#888',minWidth:35}}>{fmt(duration)}</span>
        </div>
        <input type="range" min={0} max={1} step={0.01} value={volume} onChange={e=>setVolume(Number(e.target.value))}
          style={{width:80,accentColor:'#e74c3c'}}/>
      </div>
    </div>
  )
}
