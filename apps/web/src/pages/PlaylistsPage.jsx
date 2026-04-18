import { useState, useEffect } from 'react'
import { useAuthStore, usePageStore, usePlayerStore } from '../stores/index.js'
import PlaylistCreateModal from '../components/PlaylistCreateModal.jsx'

const API_URL = import.meta.env.VITE_API_URL

function authFetch(path) {
  const token = localStorage.getItem('waiichia_token')
  return fetch(`${API_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
}

// ── Carte playlist ──────────────────────────────────────────────────────────
function PlaylistCard({ playlist, onClick }) {
  return (
    <div onClick={() => onClick(playlist)}
      style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',
        cursor:'pointer',overflow:'hidden',transition:'all .2s'}}
      onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--gold)';e.currentTarget.style.transform='translateY(-2px)'}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.transform='none'}}>
      <div style={{height:120,background:'linear-gradient(135deg,var(--card2),var(--bg2))',
        display:'flex',alignItems:'center',justifyContent:'center',fontSize:40,position:'relative'}}>
        {playlist.cover_url
          ? <img src={playlist.cover_url} alt={playlist.title} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
          : '🎵'}
        <div style={{position:'absolute',top:8,right:8,fontSize:12,
          background:'rgba(0,0,0,.6)',borderRadius:20,padding:'2px 7px'}}>
          {playlist.is_public ? '🌍' : '🔒'}
        </div>
      </div>
      <div style={{padding:'10px 12px'}}>
        <div style={{fontWeight:700,fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{playlist.title}</div>
        <div style={{fontSize:11,color:'var(--text3)',marginTop:3}}>{playlist.tracks_count || 0} son{playlist.tracks_count !== 1 ? 's' : ''}</div>
      </div>
    </div>
  )
}

// ── Modal détail playlist ────────────────────────────────────────────────────
function PlaylistDetail({ playlist, onClose }) {
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(true)
  // ── CORRECTION : utiliser usePlayerStore directement ──
  const { play, setQueue, toggle, currentTrack, isPlaying } = usePlayerStore()

  useEffect(() => {
    if (!playlist?.id) return
    authFetch(`/api/albums/playlists/${playlist.id}`)
      .then(r => r.json())
      .then(d => setTracks(d.tracks || d.playlist?.tracks || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [playlist])

  function playTrack(track, queue) {
    setQueue(queue)
    play(track)
    onClose()
  }

  function playAll() {
    if (tracks.length === 0) return
    setQueue(tracks)
    play(tracks[0])
    onClose()
  }

  return (
    <div onClick={onClose}
      style={{position:'fixed',inset:0,background:'rgba(0,0,0,.65)',zIndex:400,
        display:'flex',alignItems:'center',justifyContent:'center',
        padding:16,backdropFilter:'blur(4px)'}}>
      <div onClick={e=>e.stopPropagation()}
        style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius)',
          width:'100%',maxWidth:500,maxHeight:'80vh',display:'flex',flexDirection:'column',
          boxShadow:'0 24px 64px rgba(0,0,0,.5)',overflow:'hidden'}}>
        <div style={{padding:'18px 20px',borderBottom:'1px solid var(--border)',
          display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
          <div style={{fontFamily:'Syne,sans-serif',fontSize:17,fontWeight:800}}>🎵 {playlist.title}</div>
          <div onClick={onClose}
            style={{width:28,height:28,borderRadius:'50%',background:'var(--card)',
              border:'1px solid var(--border)',display:'flex',alignItems:'center',
              justifyContent:'center',cursor:'pointer',fontSize:13}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--red)'}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)'}}>✕</div>
        </div>
        <div style={{overflowY:'auto',flex:1,padding:'12px 16px'}}>
          {playlist.description && <p style={{fontSize:12,color:'var(--text2)',marginBottom:12}}>{playlist.description}</p>}
          {loading
            ? <div style={{textAlign:'center',padding:40,color:'var(--text3)'}}>⏳ Chargement…</div>
            : tracks.length === 0
              ? <div style={{textAlign:'center',padding:40,color:'var(--text3)',fontSize:13}}>Aucun son dans cette playlist.</div>
              : <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  {tracks.map((t, i) => {
                    const isCurrent = currentTrack?.id === t.id
                    return (
                      <div key={t.id}
                        onClick={() => playTrack(t, tracks)}
                        style={{display:'flex',alignItems:'center',gap:10,padding:'8px 10px',
                          borderRadius:'var(--radius-sm)',background: isCurrent ? 'rgba(245,166,35,.08)' : 'var(--card)',
                          cursor:'pointer',border:`1px solid ${isCurrent ? 'var(--gold)' : 'var(--border)'}`,transition:'all .15s'}}
                        onMouseEnter={e=>{ if(!isCurrent) e.currentTarget.style.borderColor='var(--gold)' }}
                        onMouseLeave={e=>{ if(!isCurrent) e.currentTarget.style.borderColor='var(--border)' }}>
                        <span style={{fontSize:11,color: isCurrent ? 'var(--gold)' : 'var(--text3)',
                          fontFamily:'Space Mono,monospace',width:18,flexShrink:0}}>
                          {isCurrent && isPlaying ? '▶' : i + 1}
                        </span>
                        {t.cover_url
                          ? <img src={t.cover_url} alt="" style={{width:36,height:36,borderRadius:6,objectFit:'cover',flexShrink:0}}/>
                          : <div style={{width:36,height:36,borderRadius:6,background:'var(--card2)',
                              display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>🎵</div>}
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:13,fontWeight:600,color: isCurrent ? 'var(--gold)' : 'var(--text)',
                            overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</div>
                          <div style={{fontSize:11,color:'var(--text3)'}}>{t.creator?.display_name || t.profiles?.display_name || '—'}</div>
                        </div>
                        <span style={{fontSize:16,color:'var(--gold)',flexShrink:0}}>
                          {isCurrent && isPlaying ? '⏸' : '▶'}
                        </span>
                      </div>
                    )
                  })}
                </div>
          }
        </div>
        {tracks.length > 0 && (
          <div style={{padding:'12px 16px',borderTop:'1px solid var(--border)',flexShrink:0}}>
            <button onClick={playAll}
              style={{width:'100%',padding:'10px',borderRadius:50,border:'none',
                background:'linear-gradient(135deg,var(--gold),#e8920a)',color:'#000',
                fontWeight:700,fontSize:13,cursor:'pointer',
                boxShadow:'0 3px 12px rgba(245,166,35,.3)',
                fontFamily:'Plus Jakarta Sans,sans-serif'}}>
              ▶ Tout écouter ({tracks.length} sons)
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Page principale ──────────────────────────────────────────────────────────
export default function PlaylistsPage() {
  const { user } = useAuthStore()
  const { setPage } = usePageStore()
  const [playlists, setPlaylists] = useState([])
  const [loading, setLoading]     = useState(true)
  const [createOpen, setCreate]   = useState(false)
  const [selected, setSelected]   = useState(null)

  function loadPlaylists() {
    setLoading(true)
    authFetch('/api/albums/playlists/public?mine=true')
      .then(r => r.json())
      .then(d => setPlaylists(d.playlists || d || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadPlaylists() }, [])

  if (!user) return (
    <div style={{textAlign:'center',padding:60}}>
      <div style={{fontSize:48,marginBottom:16}}>🎵</div>
      <h2 style={{fontFamily:'Syne,sans-serif',marginBottom:12}}>Connectez-vous</h2>
      <button className="btn btn-primary" onClick={() => setPage('login')}>Se connecter</button>
    </div>
  )

  return (
    <div style={{paddingBottom:60}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
        <div className="page-title">🎵 Mes Playlists</div>
        <button onClick={() => setCreate(true)}
          style={{padding:'9px 18px',borderRadius:50,border:'none',
            background:'linear-gradient(135deg,var(--gold),#e8920a)',color:'#000',
            fontSize:12,fontWeight:700,cursor:'pointer',
            boxShadow:'0 3px 12px rgba(245,166,35,.3)',
            fontFamily:'Plus Jakarta Sans,sans-serif'}}>
          + Nouvelle playlist
        </button>
      </div>

      {loading ? (
        <div style={{textAlign:'center',padding:60,color:'var(--text3)'}}>
          <div style={{fontSize:32,marginBottom:8}}>⏳</div>
          <div style={{fontSize:13}}>Chargement…</div>
        </div>
      ) : playlists.length === 0 ? (
        <div style={{textAlign:'center',padding:60,background:'var(--card)',
          borderRadius:'var(--radius)',border:'1px solid var(--border)'}}>
          <div style={{fontSize:48,marginBottom:12}}>🎵</div>
          <div style={{fontFamily:'Syne,sans-serif',fontSize:18,fontWeight:800,marginBottom:8}}>Aucune playlist</div>
          <div style={{fontSize:13,color:'var(--text2)',marginBottom:20}}>Créez votre première playlist pour organiser vos sons préférés.</div>
          <button onClick={() => setCreate(true)}
            style={{padding:'10px 24px',borderRadius:50,border:'none',
              background:'linear-gradient(135deg,var(--gold),#e8920a)',color:'#000',
              fontWeight:700,fontSize:13,cursor:'pointer',
              fontFamily:'Plus Jakarta Sans,sans-serif'}}>
            Créer ma première playlist
          </button>
        </div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:12}}>
          {playlists.map(pl => (
            <PlaylistCard key={pl.id} playlist={pl} onClick={setSelected} />
          ))}
        </div>
      )}

      <PlaylistCreateModal
        isOpen={createOpen}
        onClose={() => setCreate(false)}
        onCreated={pl => { setPlaylists(prev => [pl, ...prev]); setCreate(false) }}
      />

      {selected && (
        <PlaylistDetail
          playlist={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
