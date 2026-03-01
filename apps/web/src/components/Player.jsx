import { usePlayerStore } from '../stores/index.js'

export default function Player() {
  const { currentTrack, isPlaying, toggle, playNext, playPrev } = usePlayerStore()

  const track = currentTrack || { title: 'Aucun son', profiles: { display_name: 'Waiichia' } }
  const emoji = ['🎵','🌊','🔥','🎶','🥁','🎹'][Math.floor(Math.random()*6)]

  return (
    <div className="player-bar">
      {/* TRACK INFO */}
      <div className="player-track">
        <div className={`player-cover ${isPlaying ? 'playing' : ''}`}
          style={{background:'linear-gradient(135deg,var(--gold),var(--kente2))'}}>
          {currentTrack?.cover_url
            ? <img src={currentTrack.cover_url} alt="" />
            : <span>{emoji}</span>}
        </div>
        <div className="player-track-info">
          <div className="player-title">{track.title}</div>
          <div className="player-artist" style={{color:'var(--gold)',fontSize:11.5}}>
            {track.profiles?.display_name || 'Artiste'}
          </div>
        </div>
        <button style={{background:'none',border:'none',cursor:'pointer',fontSize:16,color:'var(--text3)'}}>♥</button>
      </div>

      {/* CONTROLS */}
      <div className="player-controls">
        <div className="player-btns">
          <button className="ctrl-btn">🔀</button>
          <button className="ctrl-btn" onClick={playPrev}>⏮</button>
          <button className="ctrl-btn ctrl-play" onClick={toggle}>
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button className="ctrl-btn" onClick={playNext}>⏭</button>
          <button className="ctrl-btn">🔁</button>
        </div>
        <div className="progress-row">
          <span className="progress-time">0:00</span>
          <div className="progress-bar">
            <div className="progress-fill" style={{width:'35%'}} />
          </div>
          <span className="progress-time" style={{textAlign:'right'}}>3:45</span>
        </div>
      </div>

      {/* EXTRAS */}
      <div className="player-extras">
        <button className="ctrl-btn" style={{fontSize:14}}>📋</button>
        <div className="vol-row">
          <span style={{fontSize:14,color:'var(--text3)'}}>🔊</span>
          <div className="vol-bar">
            <div className="vol-fill" style={{width:'70%'}} />
          </div>
        </div>
      </div>
    </div>
  )
}
