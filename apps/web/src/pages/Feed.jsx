import { useState, useEffect, useCallback } from "react"
import { useAuthStore, usePageStore, usePlayerStore } from "../stores/index.js"
import { ReactionBar } from "../components/ReactionBar.jsx"
import api from "../services/api.js"

const TABS = [
  { key: 'activite', label: '⚡ Activité' },
  { key: 'emissions', label: '📻 Émissions' },
  { key: 'podcasts', label: '🎙️ Podcasts' },
  { key: 'produits', label: '🛍️ Produits' },
  { key: 'events', label: '🎫 Événements' },
  { key: 'duets', label: '🎤 Duets' },
]

const fmtK = n => n >= 1000 ? (n / 1000).toFixed(1) + 'K' : String(n || 0)
const BGS = [
  "linear-gradient(135deg,#f5a623,#e63946)",
  "linear-gradient(135deg,#4d9fff,#9b59f5)",
  "linear-gradient(135deg,#9b59f5,#6c3483)",
  "linear-gradient(135deg,#2dc653,#00bfa5)",
  "linear-gradient(135deg,#ff6b35,#f5a623)",
  "linear-gradient(135deg,#00b4d8,#0077b6)",
]

function timeAgo(date) {
  if (!date) return ''
  const s = Math.floor((Date.now() - new Date(date)) / 1000)
  if (s < 60) return s + 's'
  const m = Math.floor(s / 60); if (m < 60) return m + ' min'
  const h = Math.floor(m / 60); if (h < 24) return h + 'h'
  const d = Math.floor(h / 24); if (d < 30) return d + 'j'
  return Math.floor(d / 30) + ' mois'
}

function fmtDate(date) {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtTime(date) {
  if (!date) return ''
  return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function fmtDuration(sec) {
  if (!sec) return ''
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return m + ':' + String(s).padStart(2, '0')
}

/* ── Skeleton loader ── */
function Skeletons({ count = 4 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[...Array(count)].map((_, i) => (
        <div key={i} style={{ height: 120, background: 'var(--card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', animation: 'shimmer 1.5s infinite' }} />
      ))}
    </div>
  )
}

/* ── Empty state ── */
function EmptyState({ emoji, title, subtitle, action, actionLabel }) {
  return (
    <div style={{ textAlign: 'center', padding: 80, color: 'var(--text3)' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>{emoji}</div>
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 12, marginBottom: 16 }}>{subtitle}</div>
      {action && <button className="btn btn-primary" onClick={action}>{actionLabel}</button>}
    </div>
  )
}

/* ── Avatar helper ── */
function Avatar({ profile, idx, size = 42, onClick }) {
  const initials = (profile?.display_name || '??').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div onClick={onClick} style={{
      width: size, height: size, borderRadius: '50%', background: BGS[(idx || 0) % 6],
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.36, color: '#000', flexShrink: 0, cursor: onClick ? 'pointer' : 'default', overflow: 'hidden'
    }}>
      {profile?.avatar_url
        ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : initials}
    </div>
  )
}

/* ── Card wrapper ── */
function Card({ children, idx }) {
  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
      padding: 16, transition: 'border-color .2s'
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(245,166,35,.3)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
      {children}
    </div>
  )
}


/* ═══════════════════════════════════════════
   TAB: Mon Activité (existing feed logic)
   ═══════════════════════════════════════════ */
function TabActivite({ user, setPage, toggle, currentTrack, isPlaying }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    api.social.feed()
      .then(d => setPosts(d.feed || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  if (loading) return <Skeletons />
  if (!posts.length) return (
    <EmptyState emoji="⚡" title="Aucune activité" subtitle="Suivez des artistes pour voir leur contenu ici"
      action={() => setPage('creators')} actionLabel="Découvrir des créateurs" />
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {posts.map((track, idx) => {
        const artist = track.profiles || {}
        return (
          <Card key={track.id} idx={idx}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <Avatar profile={artist} idx={idx} onClick={() => setPage('profile', { profileUsername: artist.username })} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>
                  <span style={{ cursor: 'pointer' }} onClick={() => setPage('profile', { profileUsername: artist.username })}>{artist.display_name || 'Artiste'}</span>
                  <span style={{ color: 'var(--text2)', fontWeight: 400 }}> a publié un son</span>
                  {artist.is_verified && <span style={{ marginLeft: 4, fontSize: 11 }}>⭐</span>}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'Space Mono,monospace', marginTop: 2 }}>{timeAgo(track.published_at || track.created_at)}</div>
              </div>
              <span style={{ fontSize: 20 }}>🎵</span>
            </div>

            {/* Track card */}
            <div onClick={() => toggle(track)} style={{
              background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
              padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', marginBottom: 12, transition: 'background .15s'
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--card2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--bg2)'}>
              <div style={{
                width: 48, height: 48, borderRadius: 8, background: BGS[idx % 6],
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0, overflow: 'hidden'
              }}>
                {track.cover_url ? <img src={track.cover_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🎵'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', display: 'flex', gap: 8, marginTop: 2 }}>
                  <span>{track.genre || 'Musique'}</span>
                  <span>·</span>
                  <span>{fmtK(track.play_count)} écoutes</span>
                  {track.access_type !== 'free' && track.sale_price > 0 && <><span>·</span><span style={{ color: 'var(--gold)' }}>{track.sale_price?.toLocaleString()} KMF</span></>}
                </div>
              </div>
              <button className="btn btn-xs btn-primary" style={{ flexShrink: 0 }} onClick={(e) => { e.stopPropagation(); toggle(track) }}>
                {isPlaying && currentTrack?.id === track.id ? '⏸' : '▶'}
              </button>
            </div>

            <ReactionBar targetType="track" targetId={track.id} showComments={true} />
          </Card>
        )
      })}
    </div>
  )
}


/* ═══════════════════════════════════════════
   TAB: Émissions
   ═══════════════════════════════════════════ */
const EMISSION_CATEGORIES = ['Toutes', 'musique', 'culture', 'societe', 'sport', 'economie', 'religion', 'jeunesse', 'tech', 'actualites']

function TabEmissions({ setPage }) {
  const [emissions, setEmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('Toutes')

  useEffect(() => {
    setLoading(true)
    const q = category !== 'Toutes' ? '?category=' + category : ''
    api.emissions.list(q)
      .then(d => setEmissions(d.emissions || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [category])

  if (loading) return <Skeletons />

  return (
    <div>
      {/* Category filter */}
      <div className="filter-bar" style={{ marginBottom: 16 }}>
        {EMISSION_CATEGORIES.map(c => (
          <div key={c} className={`pill-tab${category === c ? ' active' : ''}`}
            onClick={() => setCategory(c)} style={{ textTransform: 'capitalize' }}>
            {c === 'Toutes' ? '📻 Toutes' : c}
          </div>
        ))}
      </div>

      {!emissions.length
        ? <EmptyState emoji="📻" title="Aucune émission" subtitle="Les émissions publiées apparaîtront ici" />
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {emissions.map((em, idx) => {
              const host = em.profiles || {}
              return (
                <Card key={em.id} idx={idx}>
                  <div style={{ display: 'flex', gap: 14 }}>
                    {/* Cover */}
                    <div style={{
                      width: 80, height: 80, borderRadius: 12, background: BGS[idx % 6], flexShrink: 0, overflow: 'hidden',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32
                    }}>
                      {em.cover_url ? <img src={em.cover_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '📻'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {em.title}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>
                        {em.channel && <span>{em.channel} · </span>}
                        <span style={{ cursor: 'pointer' }} onClick={() => setPage('profile', { profileUsername: host.username })}>
                          {host.display_name || em.host || 'Animateur'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: 11, color: 'var(--text3)' }}>
                        {em.category && <span style={{
                          background: 'var(--bg2)', padding: '2px 8px', borderRadius: 99, border: '1px solid var(--border)', textTransform: 'capitalize'
                        }}>{em.category}</span>}
                        {em.language && <span style={{
                          background: 'var(--bg2)', padding: '2px 8px', borderRadius: 99, border: '1px solid var(--border)'
                        }}>{em.language === 'fr' ? '🇫🇷 FR' : em.language}</span>}
                        {em.featured && <span style={{
                          background: 'rgba(245,166,35,.15)', padding: '2px 8px', borderRadius: 99, color: 'var(--gold)'
                        }}>⭐ En vedette</span>}
                        {em.is_new && <span style={{
                          background: 'rgba(45,198,83,.15)', padding: '2px 8px', borderRadius: 99, color: '#2dc653'
                        }}>🆕 Nouveau</span>}
                      </div>
                      {em.description && (
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {em.description}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <ReactionBar targetType="emission" targetId={em.id} showComments={true} />
                  </div>
                </Card>
              )
            })}
          </div>
      }
    </div>
  )
}


/* ═══════════════════════════════════════════
   TAB: Podcasts
   ═══════════════════════════════════════════ */
function TabPodcasts({ toggle, currentTrack, isPlaying, setPage }) {
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.tracks.list('?type=podcast&limit=30')
      .then(d => setTracks(d.tracks || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Skeletons />
  if (!tracks.length) return <EmptyState emoji="🎙️" title="Aucun podcast" subtitle="Les podcasts publiés apparaîtront ici" />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {tracks.map((track, idx) => {
        const artist = track.profiles || {}
        const playing = isPlaying && currentTrack?.id === track.id
        return (
          <Card key={track.id} idx={idx}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              {/* Cover */}
              <div onClick={() => toggle(track)} style={{
                width: 64, height: 64, borderRadius: 12, background: BGS[idx % 6], flexShrink: 0,
                overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, cursor: 'pointer', position: 'relative'
              }}>
                {track.cover_url
                  ? <img src={track.cover_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : '🎙️'}
                <div style={{
                  position: 'absolute', inset: 0, background: 'rgba(0,0,0,.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: playing ? 1 : 0, transition: 'opacity .2s'
                }}>
                  <span style={{ fontSize: 22, color: '#fff' }}>{playing ? '⏸' : '▶'}</span>
                </div>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }}
                  onClick={() => toggle(track)}>
                  {track.title}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>
                  <span style={{ cursor: 'pointer' }} onClick={() => setPage('profile', { profileUsername: artist.username })}>
                    {artist.display_name || 'Créateur'}
                  </span>
                  {artist.is_verified && <span style={{ marginLeft: 4, fontSize: 10 }}>⭐</span>}
                </div>
                <div style={{ display: 'flex', gap: 10, fontSize: 11, color: 'var(--text3)' }}>
                  {track.genre && <span>{track.genre}</span>}
                  {track.duration_sec > 0 && <><span>·</span><span>{fmtDuration(track.duration_sec)}</span></>}
                  <span>·</span><span>{fmtK(track.play_count)} écoutes</span>
                </div>
              </div>

              <button className="btn btn-xs btn-primary" style={{ flexShrink: 0 }}
                onClick={() => toggle(track)}>
                {playing ? '⏸' : '▶'}
              </button>
            </div>
            <div style={{ marginTop: 10 }}>
              <ReactionBar targetType="track" targetId={track.id} showComments={true} />
            </div>
          </Card>
        )
      })}
    </div>
  )
}


/* ═══════════════════════════════════════════
   TAB: Produits
   ═══════════════════════════════════════════ */
function TabProduits({ setPage }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.products.list()
      .then(d => setProducts(d.products || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Skeletons />
  if (!products.length) return <EmptyState emoji="🛍️" title="Aucun produit" subtitle="Les produits en vente apparaîtront ici"
    action={() => setPage('shop')} actionLabel="Voir la boutique" />

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
      {products.map((p, idx) => {
        const seller = p.profiles || {}
        return (
          <div key={p.id} style={{
            background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
            overflow: 'hidden', transition: 'border-color .2s, transform .2s', cursor: 'pointer'
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(245,166,35,.3)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none' }}
            onClick={() => setPage('shop')}>

            {/* Cover */}
            <div style={{
              height: 140, background: p.background || BGS[idx % 6],
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, position: 'relative'
            }}>
              {p.cover_url
                ? <img src={p.cover_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span>{p.emoji || '🛍️'}</span>}
              {/* Price badge */}
              <div style={{
                position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(8px)',
                padding: '4px 10px', borderRadius: 99, fontSize: 12, fontWeight: 700, color: 'var(--gold)'
              }}>
                {p.price?.toLocaleString()} {p.currency || 'KMF'}
              </div>
            </div>

            <div style={{ padding: '12px 14px' }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.emoji && <span style={{ marginRight: 4 }}>{p.emoji}</span>}{p.name}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Avatar profile={seller} idx={idx} size={18} />
                <span>{seller.display_name || 'Vendeur'}</span>
                {seller.is_verified && <span style={{ fontSize: 10 }}>⭐</span>}
              </div>
              <div style={{ display: 'flex', gap: 8, fontSize: 11, color: 'var(--text3)' }}>
                {p.category && <span style={{
                  background: 'var(--bg2)', padding: '2px 8px', borderRadius: 99, border: '1px solid var(--border)', textTransform: 'capitalize'
                }}>{p.category}</span>}
                {p.sold_count > 0 && <span>{p.sold_count} vendu{p.sold_count > 1 ? 's' : ''}</span>}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}


/* ═══════════════════════════════════════════
   TAB: Événements
   ═══════════════════════════════════════════ */
function TabEvents({ setPage }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.events.list()
      .then(d => setEvents(d.events || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Skeletons />
  if (!events.length) return <EmptyState emoji="🎫" title="Aucun événement à venir" subtitle="Les prochains événements apparaîtront ici"
    action={() => setPage('events')} actionLabel="Voir les événements" />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {events.map((ev, idx) => {
        const creator = ev.profiles || {}
        const d = new Date(ev.event_date)
        const dayNum = d.getDate()
        const monthStr = d.toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase()
        return (
          <Card key={ev.id} idx={idx}>
            <div style={{ display: 'flex', gap: 14 }}>
              {/* Date badge */}
              <div style={{
                width: 60, height: 68, borderRadius: 12, background: BGS[idx % 6], flexShrink: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff'
              }}>
                <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1 }}>{dayNum}</div>
                <div style={{ fontSize: 10, fontWeight: 700, marginTop: 2, textTransform: 'uppercase' }}>{monthStr}</div>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {ev.title}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>
                  <span style={{ cursor: 'pointer' }} onClick={() => setPage('profile', { profileUsername: creator.username })}>
                    {creator.display_name || 'Organisateur'}
                  </span>
                  {creator.is_verified && <span style={{ marginLeft: 4, fontSize: 10 }}>⭐</span>}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 11, color: 'var(--text3)' }}>
                  <span>🕐 {fmtTime(ev.event_date)}</span>
                  {ev.location && <span>📍 {ev.location}</span>}
                  {ev.is_free
                    ? <span style={{ color: '#2dc653', fontWeight: 600 }}>Gratuit</span>
                    : <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{ev.ticket_price?.toLocaleString()} {ev.currency || 'KMF'}</span>}
                  {ev.capacity && <span>👥 {ev.tickets_sold || 0}/{ev.capacity}</span>}
                </div>
                {ev.description && (
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ev.description}
                  </div>
                )}
              </div>

              {/* Cover */}
              {ev.cover_url && (
                <div style={{ width: 68, height: 68, borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
                  <img src={ev.cover_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
            </div>
            <div style={{ marginTop: 10 }}>
              <ReactionBar targetType="event" targetId={ev.id} showComments={true} />
            </div>
          </Card>
        )
      })}
    </div>
  )
}


/* ═══════════════════════════════════════════
   TAB: Duets
   ═══════════════════════════════════════════ */
function TabDuets({ setPage, toggle }) {
  const [duets, setDuets] = useState([])
  const [recordings, setRecordings] = useState([])
  const [loading, setLoading] = useState(true)
  const [subTab, setSubTab] = useState('open') // 'open' | 'community'

  useEffect(() => {
    Promise.all([
      api.karaoke.duets().catch(() => ({ duets: [] })),
      api.karaoke.publicRecordings().catch(() => ({ recordings: [] })),
    ]).then(([dRes, rRes]) => {
      setDuets(dRes.duets || [])
      setRecordings(rRes.recordings || [])
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <Skeletons />

  const showDuets = subTab === 'open'
  const items = showDuets ? duets : recordings

  return (
    <div>
      {/* Sub-tabs */}
      <div className="filter-bar" style={{ marginBottom: 16 }}>
        <div className={`pill-tab${subTab === 'open' ? ' active' : ''}`} onClick={() => setSubTab('open')}>
          🎤 Duets ouverts ({duets.length})
        </div>
        <div className={`pill-tab${subTab === 'community' ? ' active' : ''}`} onClick={() => setSubTab('community')}>
          🌍 Communauté ({recordings.length})
        </div>
      </div>

      {!items.length
        ? <EmptyState
            emoji={showDuets ? '🎤' : '🌍'}
            title={showDuets ? 'Aucun duet ouvert' : 'Aucun enregistrement public'}
            subtitle={showDuets ? 'Lancez un duet depuis le Duet Studio !' : 'Les enregistrements publics apparaîtront ici'}
            action={() => setPage('karaoke')} actionLabel="Aller au Duet Studio" />
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {showDuets
              ? duets.map((d, idx) => {
                  const initiator = d.profiles || {}
                  const track = d.karaoke_tracks || {}
                  return (
                    <Card key={d.id} idx={idx}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Avatar profile={initiator} idx={idx} size={44}
                          onClick={() => setPage('profile', { profileUsername: initiator.username })} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700 }}>
                            <span style={{ cursor: 'pointer' }}
                              onClick={() => setPage('profile', { profileUsername: initiator.username })}>
                              {initiator.display_name || 'Artiste'}
                            </span>
                            <span style={{ color: 'var(--text2)', fontWeight: 400 }}> invite à chanter</span>
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                            🎵 {track.title || 'Piste'} — {track.artist || ''}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'Space Mono,monospace', marginTop: 2 }}>
                            {timeAgo(d.created_at)}
                          </div>
                        </div>
                        <button className="btn btn-xs btn-primary" onClick={() => setPage('karaoke')}>
                          Rejoindre
                        </button>
                      </div>
                    </Card>
                  )
                })
              : recordings.map((rec, idx) => {
                  const profile = rec.profiles || {}
                  const track = rec.tracks || {}
                  return (
                    <Card key={rec.id} idx={idx}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Avatar profile={profile} idx={idx} size={44}
                          onClick={() => setPage('profile', { profileUsername: profile.username })} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700 }}>
                            <span style={{ cursor: 'pointer' }}
                              onClick={() => setPage('profile', { profileUsername: profile.username })}>
                              {profile.display_name || 'Artiste'}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                            🎵 {rec.title || track.title || 'Enregistrement'}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'Space Mono,monospace', marginTop: 2 }}>
                            {rec.duration ? fmtDuration(rec.duration) + ' · ' : ''}{timeAgo(rec.created_at)}
                          </div>
                        </div>
                        {rec.audio_url && (
                          <button className="btn btn-xs btn-primary" onClick={() => {
                            toggle({
                              id: rec.id,
                              title: rec.title || track.title || 'Enregistrement',
                              audio_url_128: rec.audio_url,
                              cover_url: track.cover_url || null,
                              profiles: profile
                            })
                          }}>▶</button>
                        )}
                      </div>
                    </Card>
                  )
                })
            }
          </div>
      }
    </div>
  )
}


/* ═══════════════════════════════════════════
   MAIN FEED COMPONENT
   ═══════════════════════════════════════════ */
export default function Feed() {
  const { user } = useAuthStore()
  const { setPage } = usePageStore()
  const { toggle, currentTrack, isPlaying } = usePlayerStore()
  const [activeTab, setActiveTab] = useState('activite')

  // Mon Activité requires auth, others don't
  if (activeTab === 'activite' && !user) {
    return (
      <div style={{ paddingBottom: 40 }}>
        <div className="page-title">⚡ Feed</div>
        {/* Tab bar */}
        <div className="filter-bar" style={{ marginBottom: 20 }}>
          {TABS.map(t => (
            <div key={t.key} className={`pill-tab${activeTab === t.key ? ' active' : ''}`}
              onClick={() => setActiveTab(t.key)} style={{ whiteSpace: 'nowrap' }}>
              {t.label}
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚡</div>
          <h2 style={{ fontFamily: 'Syne,sans-serif' }}>Connectez-vous pour voir votre activité</h2>
          <button className="btn btn-primary" onClick={() => setPage('login')} style={{ marginTop: 16 }}>Se connecter</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ paddingBottom: 40 }}>
      <div className="page-title">⚡ Feed</div>

      {/* Tab bar — horizontally scrollable */}
      <div className="filter-bar" style={{ marginBottom: 20 }}>
        {TABS.map(t => (
          <div key={t.key} className={`pill-tab${activeTab === t.key ? ' active' : ''}`}
            onClick={() => setActiveTab(t.key)} style={{ whiteSpace: 'nowrap' }}>
            {t.label}
          </div>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'activite' && <TabActivite user={user} setPage={setPage} toggle={toggle} currentTrack={currentTrack} isPlaying={isPlaying} />}
      {activeTab === 'emissions' && <TabEmissions setPage={setPage} />}
      {activeTab === 'podcasts' && <TabPodcasts toggle={toggle} currentTrack={currentTrack} isPlaying={isPlaying} setPage={setPage} />}
      {activeTab === 'produits' && <TabProduits setPage={setPage} />}
      {activeTab === 'events' && <TabEvents setPage={setPage} />}
      {activeTab === 'duets' && <TabDuets setPage={setPage} toggle={toggle} />}
    </div>
  )
}
