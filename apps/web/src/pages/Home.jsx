import { useState, useEffect } from 'react'
import { useAuthStore, usePageStore, usePlayerStore } from '../stores/index.js'
import api from '../services/api.js'

const fmt = (n) => {
  if (n >= 1000000) return (n/1000000).toFixed(1).replace('.0','') + 'M'
  if (n >= 1000) return (n/1000).toFixed(1).replace('.0','') + 'K'
  return n || 0
}

const GENRES = ['Tout','Twarab','Afrobeats','Sebene','Amapiano','Slam','Mindset','Business','Gospel / Religion']

function TrackCard({ track, onBuy }) {
  const { toggle, currentTrack, isPlaying } = usePlayerStore()
  const { user } = useAuthStore()
  const isActive = currentTrack?.id === track.id
  const [reactions, setReactions] = useState({})
  const [comments, setComments] = useState([])
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')

  const isPurchase = track.access_type === 'purchase'
  const isRental = track.access_type === 'rental'
  const isPaid = isPurchase || isRental

  const handleReact = async (emoji) => {
    if (!user) return
    await api.social.react({ target_type: 'track', target_id: track.id, emoji })
    setReactions(r => ({ ...r, [emoji]: (r[emoji] || 0) + 1 }))
  }

  const loadComments = async () => {
    const data = await api.social.comments('track', track.id)
    setComments(data?.comments || [])
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
          <span>🎧 {fmt(track.play_count)}</span>
          {isPaid
            ? <span style={{color:'var(--gold)',fontWeight:700}}>{(track.sale_price||0).toLocaleString()} KMF</span>
            : <span style={{color:'var(--green)'}}>✓ Gratuit</span>
          }
        </div>
      </div>

      {isPaid && (
        <div className="track-purchase-row">
          {isPurchase && (
            <button className="buy-chip buy-chip-buy" onClick={e=>{e.stopPropagation();onBuy&&onBuy(track)}}>
              🛒 <span className="price-tag">{(track.sale_price||0).toLocaleString()} KMF</span>
            </button>
          )}
          {isRental && (
            <button className="buy-chip buy-chip-rent" onClick={e=>{e.stopPropagation();onBuy&&onBuy(track)}}>
              📅 Louer dès {(track.rental_price_day||0).toLocaleString()} KMF
            </button>
          )}
        </div>
      )}

      <div className="reaction-bar">
        {['❤️','🔥','😂','🎵'].map(e => (
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
        <div className="comments-section">
          {comments.map(c => (
            <div key={c.id} className="comment-item">
              <span className="comment-author">{c.profiles?.display_name}</span>
              <span className="comment-text">{c.content}</span>
            </div>
          ))}
          {user && (
            <div className="comment-input-row">
              <input value={commentText} onChange={e=>setCommentText(e.target.value)}
                placeholder="Commenter..." className="comment-input"
                onKeyDown={e=>e.key==='Enter'&&sendComment()}/>
              <button onClick={sendComment} className="comment-send">→</button>
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
  const { user } = useAuthStore()
  const [tracks, setTracks] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [genre, setGenre] = useState('Tout')

  // États paiement
  const [payModal, setPayModal] = useState(null)
  const [walletBalance, setWalletBalance] = useState(null)
  const [paying, setPaying] = useState(false)
  const [payResult, setPayResult] = useState(null)
  const [payOption, setPayOption] = useState('purchase')
  const [rentalPeriod, setRentalPeriod] = useState('day')

  const loadWallet = async () => {
    try {
      const data = await api.payments.walletBalance()
      setWalletBalance(data.balance || 0)
    } catch(e) {}
  }

  const openBuyModal = (track) => {
    if (!user) { setPage('login'); return }
    setPayModal(track)
    setPayResult(null)
    setPayOption(track.access_type === 'rental' ? 'rental' : 'purchase')
    setRentalPeriod('day')
    loadWallet()
  }

  const handlePayTrack = async () => {
    if (!payModal || paying) return
    setPaying(true)
    setPayResult(null)
    try {
      const res = await api.payments.buyTrack({
        track_id: payModal.id,
        type: payOption,
        period: payOption === 'rental' ? rentalPeriod : undefined
      })
      setWalletBalance(res.new_balance)
      setPayResult({ ok: true, message: res.message, new_balance: res.new_balance })
      setTimeout(() => { setPayModal(null); setPayResult(null) }, 2500)
    } catch(e) {
      setPayResult({ ok: false, message: e.message || 'Solde insuffisant ou erreur' })
    }
    setPaying(false)
  }

  const loadTracks = async () => {
    setLoading(true)
    try {
      const data = await api.tracks.list('?limit=30')
      setTracks(data?.tracks || [])
    } catch(e) {}
    setLoading(false)
  }

  const loadStats = async () => {
    try {
      const data = await api.profiles.stats()
      setStats(data)
    } catch(e) {}
  }

  useEffect(() => {
    loadTracks()
    loadStats()
  }, [])

  const filtered = genre === 'Tout' ? tracks : tracks.filter(t => t.genre === genre)

  const rentalPrice = payModal ? (
    rentalPeriod === 'day' ? payModal.rental_price_day :
    rentalPeriod === 'week' ? payModal.rental_price_week :
    payModal.rental_price_month
  ) : 0

  return (
    <div className="home-page" style={{padding:'24px 20px 120px'}}>

      {/* HERO */}
      <div className="hero-banner" style={{borderRadius:20,padding:'40px 36px',marginBottom:32,background:'linear-gradient(135deg,#0d0d0d 0%,#1a0a00 50%,#0d1a00 100%)',border:'1px solid var(--border)',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at 70% 50%,rgba(245,166,35,0.08),transparent 60%)'}}/>
        <div style={{position:'relative'}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:8,background:'rgba(245,166,35,0.1)',border:'1px solid rgba(245,166,35,0.3)',borderRadius:20,padding:'4px 14px',marginBottom:16,fontSize:12,fontWeight:700,color:'var(--gold)'}}>
            🌍 Lancé aux Comores — L audio social africain
          </div>
          <h1 style={{fontSize:'clamp(32px,5vw,52px)',fontWeight:900,lineHeight:1.1,margin:'0 0 16px'}}>
            Stream. Connect.<br/><span style={{color:'var(--gold)'}}>Vibrate Africa.</span>
          </h1>
          <p style={{fontSize:15,color:'var(--text2)',margin:'0 0 24px',maxWidth:500}}>
            Musique, Podcasts, Émissions et Radio Live. Découvrez et supportez les talents africains — de Moroni à Lagos.
          </p>
          <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
            <button onClick={()=>tracks[0]&&setQueue(tracks)} className="btn btn-primary" style={{fontSize:15}}>🎵 Écouter</button>
            <button onClick={()=>setPage('upload')} className="btn btn-secondary" style={{fontSize:15}}>✏️ Créer</button>
            {!user && <button onClick={()=>setPage('register')} className="btn btn-secondary" style={{fontSize:15}}>👤 S inscrire</button>}
          </div>
        </div>
      </div>

      {/* STATS */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:32}}>
        {[
          ['🎵', fmt(stats?.tracks_count || tracks.length), 'Sons publiés'],
          ['⭐', fmt(stats?.creators_count || 0), 'Createurs'],
          ['👥', fmt(stats?.total_plays || 0), 'Ecoutes totales'],
          ['🌍', fmt(stats?.countries_count || 1), 'Pays'],
        ].map(([icon,val,label]) => (
          <div key={label} style={{background:'var(--card)',borderRadius:14,padding:'16px 12px',textAlign:'center',border:'1px solid var(--border)'}}>
            <div style={{fontSize:22}}>{icon}</div>
            <div style={{fontSize:22,fontWeight:900,color:'var(--gold)'}}>{val}</div>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:1,color:'var(--text3)'}}>{label}</div>
          </div>
        ))}
      </div>

      {/* FILTRES GENRES */}
      <div style={{display:'flex',gap:8,overflowX:'auto',paddingBottom:8,marginBottom:24,scrollbarWidth:'none'}}>
        {GENRES.map(g => (
          <button key={g} onClick={()=>setGenre(g)}
            style={{flexShrink:0,padding:'6px 16px',borderRadius:20,border:`1px solid ${genre===g?'var(--gold)':'var(--border)'}`,background:genre===g?'rgba(245,166,35,0.15)':'transparent',color:genre===g?'var(--gold)':'var(--text2)',cursor:'pointer',fontSize:13,fontWeight:600,whiteSpace:'nowrap'}}>
            {g}
          </button>
        ))}
      </div>

      {/* TRENDING */}
      <div className="section-hdr">
        <h2 className="section-title">🔥 Tendances</h2>
        <button className="see-all" onClick={() => setPage('trending')}>Voir tout →</button>
      </div>
      {loading ? (
        <div className="tracks-grid">
          {[...Array(6)].map((_,i) => <div key={i} className="skeleton" style={{height:280}}/>)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{textAlign:'center',padding:'60px 0',color:'var(--text3)'}}>
          <div style={{fontSize:48,marginBottom:12}}>🎵</div>
          <p>Aucun son disponible pour le moment</p>
          <button className="btn btn-primary" style={{marginTop:16}} onClick={() => setPage('upload')}>⬆️ Publier un son</button>
        </div>
      ) : (
        <div className="tracks-grid">
          {filtered.map(t => <TrackCard key={t.id} track={t} onBuy={openBuyModal}/>)}
        </div>
      )}

      {/* MODAL PAIEMENT TRACK */}
      {payModal && (
        <div onClick={()=>{setPayModal(null);setPayResult(null)}}
          style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.88)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div onClick={e=>e.stopPropagation()}
            style={{background:'var(--card)',borderRadius:20,maxWidth:420,width:'100%',border:'1px solid var(--border)',overflow:'hidden'}}>

            {/* Cover */}
            <div style={{height:140,background:payModal.cover_url?'#000':'linear-gradient(135deg,#1a0020,#5a0060)',display:'flex',alignItems:'center',justifyContent:'center',position:'relative'}}>
              {payModal.cover_url
                ? <img src={payModal.cover_url} style={{width:'100%',height:'100%',objectFit:'cover',opacity:0.7}}/>
                : <span style={{fontSize:48}}>🎵</span>
              }
              <button onClick={()=>setPayModal(null)}
                style={{position:'absolute',top:12,right:12,background:'rgba(0,0,0,0.6)',border:'none',color:'#fff',borderRadius:'50%',width:32,height:32,cursor:'pointer',fontSize:16}}>✕</button>
            </div>

            <div style={{padding:24}}>
              <div style={{fontWeight:800,fontSize:18,marginBottom:2}}>{payModal.title}</div>
              <div style={{fontSize:13,color:'var(--text2)',marginBottom:16}}>{payModal.profiles?.display_name||'Artiste'}</div>

              {/* Solde */}
              <div style={{background:'var(--card2)',borderRadius:12,padding:'12px 16px',marginBottom:16,display:'flex',justifyContent:'space-between',alignItems:'center',border:'1px solid var(--border)'}}>
                <div>
                  <div style={{fontSize:10,fontWeight:700,color:'var(--text3)',letterSpacing:1}}>VOTRE SOLDE WALLET</div>
                  <div style={{fontSize:22,fontWeight:900,color:'#2cc653',fontFamily:'monospace'}}>
                    {walletBalance !== null ? (walletBalance||0).toLocaleString()+' KMF' : '...'}
                  </div>
                </div>
                <button onClick={()=>{setPayModal(null);setPage('wallet')}}
                  style={{background:'transparent',border:'1px solid var(--border)',color:'var(--text2)',borderRadius:8,padding:'6px 12px',cursor:'pointer',fontSize:12,fontWeight:600}}>
                  💰 Recharger
                </button>
              </div>

              {/* Options */}
              <div style={{display:'flex',gap:8,marginBottom:16}}>
                {(payModal.sale_price > 0) && (
                  <button onClick={()=>setPayOption('purchase')}
                    style={{flex:1,padding:10,borderRadius:10,border:`2px solid ${payOption==='purchase'?'var(--gold)':'var(--border)'}`,cursor:'pointer',background:payOption==='purchase'?'rgba(245,166,35,0.1)':'transparent',color:'var(--text)',fontWeight:700,fontSize:13,textAlign:'center'}}>
                    🛒 Acheter<br/><span style={{fontSize:12,color:'var(--gold)'}}>{(payModal.sale_price||0).toLocaleString()} KMF</span>
                  </button>
                )}
                {(payModal.rental_price_day > 0) && (
                  <button onClick={()=>setPayOption('rental')}
                    style={{flex:1,padding:10,borderRadius:10,border:`2px solid ${payOption==='rental'?'var(--gold)':'var(--border)'}`,cursor:'pointer',background:payOption==='rental'?'rgba(245,166,35,0.1)':'transparent',color:'var(--text)',fontWeight:700,fontSize:13,textAlign:'center'}}>
                    ⏳ Louer<br/><span style={{fontSize:12,color:'var(--gold)'}}>dès {(payModal.rental_price_day||0).toLocaleString()} KMF</span>
                  </button>
                )}
              </div>

              {/* Périodes location */}
              {payOption === 'rental' && (
                <div style={{display:'flex',gap:6,marginBottom:16}}>
                  {[['day','24h',payModal.rental_price_day],['week','7 jours',payModal.rental_price_week],['month','30 jours',payModal.rental_price_month]].filter(([,,p])=>p>0).map(([val,label,price])=>(
                    <button key={val} onClick={()=>setRentalPeriod(val)}
                      style={{flex:1,padding:'8px 4px',borderRadius:8,border:`2px solid ${rentalPeriod===val?'var(--gold)':'var(--border)'}`,cursor:'pointer',background:rentalPeriod===val?'rgba(245,166,35,0.1)':'transparent',color:'var(--text)',fontWeight:600,fontSize:11,textAlign:'center'}}>
                      {label}<br/><span style={{color:'var(--gold)',fontWeight:800}}>{(price||0).toLocaleString()} KMF</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Résultat */}
              {payResult && (
                <div style={{marginBottom:14,padding:'10px 14px',borderRadius:10,background:payResult.ok?'rgba(44,198,83,0.1)':'rgba(230,57,70,0.1)',border:`1px solid ${payResult.ok?'#2cc653':'#e74c3c'}`,fontSize:13,fontWeight:600,color:payResult.ok?'#2cc653':'#e74c3c'}}>
                  {payResult.ok ? '✅ ' : '❌ '}{payResult.message}
                  {!payResult.ok && (
                    <button onClick={()=>{setPayModal(null);setPage('wallet')}}
                      style={{marginTop:8,display:'block',background:'var(--primary)',border:'none',color:'#fff',borderRadius:6,padding:'5px 14px',cursor:'pointer',fontSize:12}}>
                      💰 Recharger mon wallet →
                    </button>
                  )}
                </div>
              )}

              {/* Bouton confirmer */}
              <button onClick={handlePayTrack} disabled={paying||payResult?.ok}
                style={{width:'100%',background:paying||payResult?.ok?'var(--border)':'linear-gradient(135deg,var(--gold),#e8920a)',border:'none',color:paying||payResult?.ok?'var(--text3)':'#000',borderRadius:10,padding:14,cursor:paying||payResult?.ok?'not-allowed':'pointer',fontWeight:800,fontSize:15}}>
                {paying ? '⏳ Traitement...'
                  : payResult?.ok ? '✅ Acces accorde !'
                  : payOption === 'purchase' ? '🛒 Confirmer — '+(payModal.sale_price||0).toLocaleString()+' KMF'
                  : '⏳ Louer — '+(rentalPrice||0).toLocaleString()+' KMF'}
              </button>
              <div style={{textAlign:'center',fontSize:11,color:'var(--text3)',marginTop:10}}>
                🔒 Paiement securise via votre portefeuille Waiichia
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
