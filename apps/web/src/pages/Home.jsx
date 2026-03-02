import { useState, useEffect, useCallback } from 'react'
import { usePlayerStore, usePageStore, useAuthStore } from '../stores/index.js'
import api from '../services/api.js'

const GENRES = ['Twarab','Afrobeats','Sebene','Amapiano','Slam','Mindset','Business','Gospel / Religion']

function TrackCard({ track }) {
  const { toggle, currentTrack, isPlaying } = usePlayerStore()
  const { user } = useAuthStore()
  const isActive = currentTrack?.id === track.id
  const [reactions, setReactions] = useState({})
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')

  useEffect(() => {
    api.social.reactions('track', track.id).then(r => setReactions(r.reactions || {})).catch(()=>{})
  }, [track.id])

  const handleReact = async (emoji) => {
    if (!user) return
    try {
      await api.social.react({ target_type: 'track', target_id: track.id, emoji })
      const r = await api.social.reactions('track', track.id)
      setReactions(r.reactions || {})
    } catch(e) {}
  }

  const loadComments = async () => {
    const r = await api.social.comments('track', track.id)
    setComments(r.comments || [])
  }

  const toggleComments = () => {
    if (!showComments) loadComments()
    setShowComments(!showComments)
  }

  const sendComment = async () => {
    if (!commentText.trim() || !user) return
    await api.social.comment({ target_type: 'track', target_id: track.id, content: commentText })
    setCommentText('')
    loadComments()
  }
  const isPurchase = track.access_type === 'purchase'
  const isRental = track.access_type === 'rental'
  const isPaid = isPurchase || isRental

  return (
    <div className={`track-card ${isActive ? 'playing' : ''}`}>
      <div className="track-cover" onClick={() => toggle(track)}>
        <div className="track-cover-bg" style={{background:'linear-gradient(135deg,var(--card2),var(--card3))'}}>
          {track.cover_url
            ? <img src={track.cover_url} alt={track.title} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
            : <span style={{fontSize:44}}>🎵</span>
          }
        </div>
        {track.genre && <div className="type-badge type-music">{track.genre}</div>}
        <div className="play-overlay">
          {isActive && isPlaying
            ? <div className="wave-vis"><div className="wave-bar"/><div className="wave-bar"/><div className="wave-bar"/><div className="wave-bar"/><div className="wave-bar"/></div>
            : <button className="play-btn-circle">▶</button>
          }
        </div>
      </div>

      <div className="track-info">
        <div className="track-title">{track.title}</div>
        <div className="track-artist">{track.profiles?.display_name || 'Artiste'}</div>
        <div className="track-meta">
          <span>🎧 {(track.play_count||0).toLocaleString()}</span>
          {isPaid
            ? <span style={{color:'var(--gold)',fontWeight:700}}>{(track.sale_price||0).toLocaleString()} KMF</span>
            : <span style={{color:'var(--green)'}}>✓ Gratuit</span>
          }
        </div>
      </div>

      {isPaid && (
        <div className="track-purchase-row">
          {isPurchase && (
            <button className="buy-chip buy-chip-buy">
              🛒 <span className="price-tag">{(track.sale_price||0).toLocaleString()} KMF</span>
            </button>
          )}
          {isRental && (
            <button className="buy-chip buy-chip-rent">
              📅 <span className="price-tag">Louer</span>
            </button>
          )}
        </div>
      )}

      <div className="reaction-bar">
        {[['❤️',true],['🔥',true],['😂',true],['🎵',true]].map(([e]) => (
          <button key={e} className="react-btn" onClick={() => handleReact(e)}>
            {e} <span className="react-count">{reactions[e]||0}</span>
          </button>
        ))}
        <button className="react-btn" onClick={toggleComments}>
          💬 <span className="react-count">{comments.length}</span>
        </button>
        <button className="react-btn" style={{marginLeft:'auto'}} onClick={() => toggle(track)}>
          {isActive && isPlaying ? '⏸' : '▶'}
        </button>
      </div>
      {showComments && (
        <div style={{padding:'8px 12px',borderTop:'1px solid var(--border)',background:'var(--card2)'}}>
          {comments.map(c => (
            <div key={c.id} style={{fontSize:12,marginBottom:6,display:'flex',gap:8}}>
              <strong style={{color:'var(--gold)'}}>{c.profiles?.username}</strong>
              <span style={{color:'var(--text2)'}}>{c.content}</span>
            </div>
          ))}
          {comments.length === 0 && <div style={{fontSize:11,color:'var(--text3)',marginBottom:6}}>Aucun commentaire</div>}
          {user && (
            <div style={{display:'flex',gap:6,marginTop:6}}>
              <input value={commentText} onChange={e=>setCommentText(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&sendComment()}
                placeholder="Ajouter un commentaire..."
                style={{flex:1,background:'var(--bg)',border:'1px solid var(--border)',borderRadius:6,padding:'4px 8px',color:'var(--text)',fontSize:12}}/>
              <button onClick={sendComment}
                style={{background:'var(--primary)',border:'none',color:'#fff',borderRadius:6,padding:'4px 10px',cursor:'pointer',fontSize:12}}>
                Envoyer
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Home() {
  const { setPage } = usePageStore()
  const { setQueue } = usePlayerStore()
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(true)
  const [genre, setGenre] = useState('')

  useEffect(() => {
    api.tracks.list().then(res => {
      const t = res.tracks || []
      setTracks(t)
      setQueue(t)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const filtered = genre ? tracks.filter(t => t.genre === genre) : tracks

  return (
    <div>
      {/* HERO */}
      <div className="hero-banner">
        <div className="hero-kente-deco"/>
        <div className="hero-content">
          <div className="hero-badge">🌍 Lancé aux Comores — L audio social africain</div>
          <h1 className="hero-title">
            Stream. Connect.<br/><span>Vibrate Africa.</span>
          </h1>
          <p className="hero-sub">
            Musique, Podcasts, Émissions et Radio Live. Découvrez et supportez les talents africains — de Moroni à Lagos.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={() => setPage('music')}>🎵 Écouter</button>
            <button className="btn btn-secondary" onClick={() => setPage('upload')}>✏️ Créer</button>
            <button className="btn btn-outline" onClick={() => setPage('register')}>👤 S inscrire</button>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="stats-row">
        <div className="stat-card sc-gold">
          <div className="stat-icon">🎵</div>
          <div className="stat-num">{tracks.length || '48K'}</div>
          <div className="stat-label">Sons publiés</div>
        </div>
        <div className="stat-card sc-red">
          <div className="stat-icon">⭐</div>
          <div className="stat-num">3.2K</div>
          <div className="stat-label">Créateurs</div>
        </div>
        <div className="stat-card sc-green">
          <div className="stat-icon">👥</div>
          <div className="stat-num">120K</div>
          <div className="stat-label">Auditeurs</div>
        </div>
        <div className="stat-card sc-blue">
          <div className="stat-icon">🌍</div>
          <div className="stat-num">54</div>
          <div className="stat-label">Pays</div>
        </div>
      </div>

      {/* GENRE FILTER */}
      <div className="genre-chips">
        <button className={`genre-chip ${!genre ? 'active' : ''}`} onClick={() => setGenre('')}>Tout</button>
        {GENRES.map(g => (
          <button key={g} className={`genre-chip ${genre === g ? 'active' : ''}`} onClick={() => setGenre(g)}>{g}</button>
        ))}
      </div>

      {/* TRENDING */}
      <div className="section-hdr">
        <h2 className="section-title">🔥 Tendances</h2>
        <button className="see-all" onClick={() => setPage('trending')}>Voir tout →</button>
      </div>

      {loading ? (
        <div className="tracks-grid">
          {[...Array(6)].map((_,i) => (
            <div key={i} className="skeleton" style={{height:280}}/>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{textAlign:'center',padding:'60px 0',color:'var(--text3)'}}>
          <div style={{fontSize:48,marginBottom:12}}>🎵</div>
          <p>Aucun son disponible pour le moment</p>
          <button className="btn btn-primary" style={{marginTop:16}} onClick={() => setPage('upload')}>
            ⬆️ Publier un son
          </button>
        </div>
      ) : (
        <div className="tracks-grid">
          {filtered.map(t => <TrackCard key={t.id} track={t}/>)}
        </div>
      )}
    </div>
  )
}
