import { useState, useEffect } from 'react'
import PlaylistCreateModal from './PlaylistCreateModal.jsx'

const API_URL = import.meta.env.VITE_API_URL

function authFetch(path, opts = {}) {
  const token = localStorage.getItem('waiichia_token')
  return fetch(`${API_URL}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  })
}

// Appelez ce composant ainsi :
// <AddToPlaylistModal isOpen={open} onClose={()=>setOpen(false)} track={track} />
export default function AddToPlaylistModal({ isOpen, onClose, track }) {
  const [playlists, setPlaylists]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [adding, setAdding]         = useState(null)   // id playlist en cours
  const [done, setDone]             = useState([])     // ids playlists déjà ajoutées
  const [createOpen, setCreate]     = useState(false)
  const [msg, setMsg]               = useState(null)

  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    setDone([])
    setMsg(null)
    authFetch('/api/albums/playlists/public?mine=true')
      .then(r => r.json())
      .then(d => setPlaylists(d.playlists || []))
      .catch(() => setPlaylists([]))
      .finally(() => setLoading(false))
  }, [isOpen])

  async function addToPlaylist(playlist) {
    setAdding(playlist.id)
    setMsg(null)
    try {
      const r = await authFetch(`/api/albums/playlists/${playlist.id}/tracks`, {
        method: 'POST',
        body: JSON.stringify({ track_id: track.id }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Erreur')
      setDone(prev => [...prev, playlist.id]); setPlaylists(prev => prev.map(p => p.id===playlist.id ? {...p, tracks_count:(p.tracks_count||0)+1} : p))
      setMsg({ type: 'success', text: `✅ Ajouté à "${playlist.title}"` })
    } catch (err) {
      setMsg({ type: 'error', text: '⚠️ ' + err.message })
    } finally {
      setAdding(null)
    }
  }

  function handleCreated(pl) {
    setPlaylists(prev => [pl, ...prev])
    // Ajouter automatiquement le son à la nouvelle playlist
    authFetch(`/api/albums/playlists/${pl.id}/tracks`, {
      method: 'POST',
      body: JSON.stringify({ track_id: track.id }),
    }).then(() => {
      setDone(prev => [...prev, pl.id])
      setMsg({ type: 'success', text: `✅ Playlist créée et son ajouté !` })
    }).catch(() => {})
  }

  if (!isOpen) return null

  return (
    <>
      <div onClick={onClose}
        style={{position:'fixed',inset:0,background:'rgba(0,0,0,.65)',zIndex:400,
          display:'flex',alignItems:'center',justifyContent:'center',
          padding:16,backdropFilter:'blur(4px)'}}>
        <div onClick={e=>e.stopPropagation()}
          style={{background:'var(--bg2)',border:'1px solid var(--border)',
            borderRadius:'var(--radius)',width:'100%',maxWidth:420,
            maxHeight:'70vh',display:'flex',flexDirection:'column',
            boxShadow:'0 24px 64px rgba(0,0,0,.5)',overflow:'hidden'}}>

          {/* Header */}
          <div style={{padding:'16px 20px',borderBottom:'1px solid var(--border)',
            display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
            <div>
              <div style={{fontFamily:'Syne,sans-serif',fontSize:16,fontWeight:800}}>
                ➕ Ajouter à une playlist
              </div>
              {track && (
                <div style={{fontSize:11,color:'var(--text3)',marginTop:2,
                  overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:280}}>
                  🎵 {track.title}
                </div>
              )}
            </div>
            <div onClick={onClose}
              style={{width:28,height:28,borderRadius:'50%',background:'var(--card)',
                border:'1px solid var(--border)',display:'flex',alignItems:'center',
                justifyContent:'center',cursor:'pointer',fontSize:13,flexShrink:0}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--red)'}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)'}}>
              ✕
            </div>
          </div>

          {/* Message */}
          {msg && (
            <div style={{padding:'8px 16px',flexShrink:0,
              background:msg.type==='success'?'rgba(44,198,83,.08)':'rgba(230,57,70,.08)',
              borderBottom:'1px solid var(--border)',fontSize:12,
              color:msg.type==='success'?'var(--green)':'var(--red)'}}>
              {msg.text}
            </div>
          )}

          {/* Liste playlists */}
          <div style={{overflowY:'auto',flex:1,padding:'8px 12px'}}>
            {loading ? (
              <div style={{textAlign:'center',padding:30,color:'var(--text3)',fontSize:13}}>
                ⏳ Chargement…
              </div>
            ) : playlists.length === 0 ? (
              <div style={{textAlign:'center',padding:30,color:'var(--text3)',fontSize:13}}>
                Aucune playlist. Créez-en une !
              </div>
            ) : (
              playlists.map(pl => {
                const isDone    = done.includes(pl.id)
                const isAdding  = adding === pl.id
                return (
                  <div key={pl.id}
                    onClick={() => !isDone && !isAdding && addToPlaylist(pl)}
                    style={{display:'flex',alignItems:'center',gap:10,padding:'10px 10px',
                      borderRadius:'var(--radius-sm)',marginBottom:4,
                      border:'1px solid var(--border)',
                      background:isDone?'rgba(44,198,83,.06)':'var(--card)',
                      cursor:isDone?'default':'pointer',transition:'all .15s'}}
                    onMouseEnter={e=>{ if(!isDone) e.currentTarget.style.borderColor='var(--gold)' }}
                    onMouseLeave={e=>{ if(!isDone) e.currentTarget.style.borderColor='var(--border)' }}>
                    {/* Cover */}
                    <div style={{width:38,height:38,borderRadius:6,flexShrink:0,overflow:'hidden',
                      background:'var(--card2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>
                      {pl.cover_url
                        ? <img src={pl.cover_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                        : '🎵'}
                    </div>
                    {/* Info */}
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:600,overflow:'hidden',
                        textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{pl.title}</div>
                      <div style={{fontSize:11,color:'var(--text3)'}}>
                        {pl.tracks_count || 0} son{pl.tracks_count!==1?'s':''} · {pl.is_public?'🌍':'🔒'}
                      </div>
                    </div>
                    {/* Statut */}
                    <div style={{flexShrink:0,fontSize:13}}>
                      {isAdding ? '⏳' : isDone ? <span style={{color:'var(--green)',fontWeight:700}}>✓</span> : '+'}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer — créer nouvelle playlist */}
          <div style={{padding:'12px 16px',borderTop:'1px solid var(--border)',flexShrink:0}}>
            <button onClick={()=>setCreate(true)}
              style={{width:'100%',padding:'9px',borderRadius:50,border:'1px dashed var(--gold)',
                background:'rgba(245,166,35,.06)',color:'var(--gold)',fontSize:12,fontWeight:700,
                cursor:'pointer',fontFamily:'Plus Jakarta Sans,sans-serif'}}>
              + Créer une nouvelle playlist
            </button>
          </div>
        </div>
      </div>

      {/* Modal création playlist imbriqué */}
      <PlaylistCreateModal
        isOpen={createOpen}
        onClose={() => setCreate(false)}
        onCreated={handleCreated}
        initialTrackId={track?.id}
      />
    </>
  )
}
