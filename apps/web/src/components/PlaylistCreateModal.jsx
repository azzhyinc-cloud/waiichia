import { useState } from 'react'

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

export default function PlaylistCreateModal({ isOpen, onClose, onCreated, initialTrackId = null }) {
  const [title, setTitle]      = useState('')
  const [description, setDesc] = useState('')
  const [isPublic, setPublic]  = useState(true)
  const [loading, setLoading]  = useState(false)
  const [error, setError]      = useState(null)

  async function handleCreate() {
    if (!title.trim()) return setError('Le titre est obligatoire')
    setLoading(true)
    setError(null)
    try {
      const r = await authFetch('/api/albums/playlists', {
        method: 'POST',
        body: JSON.stringify({
          title:       title.trim(),
          description: description.trim() || undefined,
          is_public:   isPublic,
        }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || data.message || 'Erreur création')
      const playlist = data.playlist || data
      if (initialTrackId && playlist?.id) {
        await authFetch(`/api/albums/playlists/${playlist.id}/tracks`, {
          method: 'POST',
          body: JSON.stringify({ track_id: initialTrackId, position: 1 }),
        }).catch(() => {})
      }
      onCreated?.(playlist)
      onClose?.()
      setTitle(''); setDesc(''); setPublic(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div onClick={onClose}
      style={{position:'fixed',inset:0,background:'rgba(0,0,0,.65)',zIndex:400,
        display:'flex',alignItems:'center',justifyContent:'center',
        padding:16,backdropFilter:'blur(4px)'}}>
      <div onClick={e=>e.stopPropagation()}
        style={{background:'var(--bg2)',border:'1px solid var(--border)',
          borderRadius:'var(--radius)',width:'100%',maxWidth:460,
          boxShadow:'0 24px 64px rgba(0,0,0,.5)',overflow:'hidden'}}>

        {/* Header */}
        <div style={{padding:'18px 20px',borderBottom:'1px solid var(--border)',
          display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{fontFamily:'Syne,sans-serif',fontSize:17,fontWeight:800,
            display:'flex',alignItems:'center',gap:8}}>
            🎵 Nouvelle playlist
          </div>
          <div onClick={onClose}
            style={{width:28,height:28,borderRadius:'50%',background:'var(--card)',
              border:'1px solid var(--border)',display:'flex',alignItems:'center',
              justifyContent:'center',cursor:'pointer',fontSize:13}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--red)';e.currentTarget.style.color='var(--red)'}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text)'}}>
            ✕
          </div>
        </div>

        {/* Body */}
        <div style={{padding:'20px'}}>
          {initialTrackId && (
            <div style={{background:'rgba(245,166,35,.08)',border:'1px solid rgba(245,166,35,.2)',
              borderRadius:'var(--radius-sm)',padding:'8px 12px',marginBottom:14,
              fontSize:12,color:'var(--gold)'}}>
              🎵 Le morceau sera ajouté automatiquement à la playlist.
            </div>
          )}

          {/* Titre */}
          <div style={{marginBottom:14}}>
            <label style={{display:'block',fontSize:12,fontWeight:700,
              color:'var(--text2)',marginBottom:6}}>
              Titre *
            </label>
            <input
              type="text"
              placeholder="Ex: Mes sons préférés, Road Trip…"
              value={title}
              onChange={e=>setTitle(e.target.value)}
              maxLength={80}
              autoFocus
              style={{width:'100%',background:'var(--card)',border:'1px solid var(--border)',
                borderRadius:'var(--radius-sm)',padding:'10px 14px',color:'var(--text)',
                fontSize:13,fontFamily:'Plus Jakarta Sans,sans-serif',outline:'none',
                boxSizing:'border-box',transition:'border-color .2s'}}
              onFocus={e=>e.target.style.borderColor='var(--gold)'}
              onBlur={e=>e.target.style.borderColor='var(--border)'}
            />
            <div style={{fontSize:10,color:'var(--text3)',marginTop:4,textAlign:'right'}}>
              {title.length}/80
            </div>
          </div>

          {/* Description */}
          <div style={{marginBottom:14}}>
            <label style={{display:'block',fontSize:12,fontWeight:700,
              color:'var(--text2)',marginBottom:6}}>
              Description (facultatif)
            </label>
            <textarea
              placeholder="Une description courte…"
              value={description}
              onChange={e=>setDesc(e.target.value)}
              maxLength={300}
              rows={3}
              style={{width:'100%',background:'var(--card)',border:'1px solid var(--border)',
                borderRadius:'var(--radius-sm)',padding:'10px 14px',color:'var(--text)',
                fontSize:13,fontFamily:'Plus Jakarta Sans,sans-serif',outline:'none',
                boxSizing:'border-box',resize:'vertical',transition:'border-color .2s'}}
              onFocus={e=>e.target.style.borderColor='var(--gold)'}
              onBlur={e=>e.target.style.borderColor='var(--border)'}
            />
          </div>

          {/* Visibilité */}
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16,
            padding:'10px 14px',background:'var(--card)',border:'1px solid var(--border)',
            borderRadius:'var(--radius-sm)',cursor:'pointer'}}
            onClick={()=>setPublic(v=>!v)}>
            <div style={{width:20,height:20,borderRadius:4,border:'2px solid',
              borderColor:isPublic?'var(--gold)':'var(--border)',
              background:isPublic?'var(--gold)':'transparent',
              display:'flex',alignItems:'center',justifyContent:'center',
              flexShrink:0,transition:'all .15s'}}>
              {isPublic && <span style={{fontSize:11,color:'#000',fontWeight:700}}>✓</span>}
            </div>
            <div>
              <div style={{fontSize:13,fontWeight:600}}>Playlist publique</div>
              <div style={{fontSize:11,color:'var(--text3)'}}>
                {isPublic ? '🌍 Visible par tout le monde' : '🔒 Visible uniquement par vous'}
              </div>
            </div>
          </div>

          {/* Erreur */}
          {error && (
            <div style={{background:'rgba(230,57,70,.1)',border:'1px solid rgba(230,57,70,.3)',
              borderRadius:'var(--radius-sm)',padding:'8px 12px',marginBottom:14,
              fontSize:12,color:'var(--red)'}}>
              ⚠️ {error}
            </div>
          )}

          {/* Boutons */}
          <div style={{display:'flex',gap:10}}>
            <button onClick={onClose} disabled={loading}
              style={{flex:1,padding:'10px',borderRadius:50,border:'1px solid var(--border)',
                background:'var(--card)',color:'var(--text2)',fontSize:13,fontWeight:600,
                cursor:'pointer',fontFamily:'Plus Jakarta Sans,sans-serif'}}>
              Annuler
            </button>
            <button onClick={handleCreate} disabled={loading || !title.trim()}
              style={{flex:2,padding:'10px',borderRadius:50,border:'none',
                background: loading || !title.trim()
                  ? 'var(--card)' : 'linear-gradient(135deg,var(--gold),#e8920a)',
                color: loading || !title.trim() ? 'var(--text3)' : '#000',
                fontSize:13,fontWeight:700,cursor: loading||!title.trim()?'not-allowed':'pointer',
                fontFamily:'Plus Jakarta Sans,sans-serif',
                boxShadow: loading||!title.trim()?'none':'0 3px 12px rgba(245,166,35,.3)',
                transition:'all .2s'}}>
              {loading ? '⏳ Création…' : '✅ Créer la playlist'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
