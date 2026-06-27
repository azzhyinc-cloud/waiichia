import { useState, useEffect } from "react"
import { useAuthStore, usePlayerStore, usePageStore } from "../stores/index.js"
import { usePrice } from "../hooks/usePrice.js"
import api from "../services/api.js"

const BGS = ['linear-gradient(135deg,#1a1a2e,#16213e)','linear-gradient(135deg,#0f3460,#533483)','linear-gradient(135deg,#1b262c,#0f3460)','linear-gradient(135deg,#2d132c,#ee4540)','linear-gradient(135deg,#05386b,#379683)','linear-gradient(135deg,#2c003e,#8b0000)']
const AVATAR_GRADIENTS = ["linear-gradient(135deg,#f5a623,#e63946)","linear-gradient(135deg,#9b59f5,#6c3483)","linear-gradient(135deg,#2dc653,#00bfa5)","linear-gradient(135deg,#1e88e5,#6c3483)","linear-gradient(135deg,#ff6b35,#f5a623)","linear-gradient(135deg,#00bfa5,#1e88e5)"]

function gradientFor(seed) {
  if (!seed) return AVATAR_GRADIENTS[0]
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length]
}
function fmtK(n) {
  if (!n) return '0'
  if (n >= 1000000) return (n/1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n/1000).toFixed(1) + 'k'
  return String(n)
}
function fmtDate(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

// ── Skeleton loader ──
function Skeleton({ h = 180, r = 'var(--radius)' }) {
  return <div style={{height:h,borderRadius:r,background:'var(--card)',border:'1px solid var(--border)',animation:'shimmer 1.5s infinite'}} />
}

// ── Section header ──
function SectionHeader({ icon, title, subtitle, action, onAction }) {
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
      <div>
        <div style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:18,display:'flex',alignItems:'center',gap:8}}>
          <span>{icon}</span><span>{title}</span>
        </div>
        {subtitle && <div style={{fontSize:12,color:'var(--text3)',marginTop:2}}>{subtitle}</div>}
      </div>
      {action && <button onClick={onAction} style={{background:'none',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',padding:'5px 12px',fontSize:12,color:'var(--text2)',cursor:'pointer'}}>{action}</button>}
    </div>
  )
}

// ── Trending track card ──
function TrackCard({ track, rank, onPlay, isPlaying, isCurrent, format }) {
  const bg = BGS[rank % BGS.length]
  return (
    <div
      onClick={() => onPlay(track)}
      style={{background:'var(--card)',border:`1px solid ${isCurrent?'var(--gold)':'var(--border)'}`,borderRadius:'var(--radius)',overflow:'hidden',cursor:'pointer',transition:'transform .15s',position:'relative'}}
      onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'}
      onMouseLeave={e=>e.currentTarget.style.transform='none'}
    >
      {/* Cover */}
      <div style={{height:130,background:bg,display:'flex',alignItems:'center',justifyContent:'center',position:'relative'}}>
        {track.cover_url
          ? <img src={track.cover_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover',position:'absolute',inset:0}} />
          : <span style={{fontSize:40}}>🎵</span>
        }
        {/* Rank badge */}
        <div style={{position:'absolute',top:8,left:8,background:'rgba(0,0,0,.6)',borderRadius:6,padding:'2px 8px',fontSize:12,fontWeight:800,color:rank<3?'var(--gold)':'#fff',fontFamily:'Space Mono,monospace'}}>
          #{rank+1}
        </div>
        {/* Play indicator */}
        {isCurrent && (
          <div style={{position:'absolute',top:8,right:8,background:'var(--gold)',borderRadius:'50%',width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12}}>
            {isPlaying ? '▮▮' : '▶'}
          </div>
        )}
        {/* Access badge */}
        {track.access_type === 'paid' && (
          <div style={{position:'absolute',bottom:8,right:8,background:'var(--gold)',borderRadius:6,padding:'2px 6px',fontSize:10,fontWeight:700,color:'#000'}}>
            {format ? format(track.sale_price) : track.sale_price + ' KMF'}
          </div>
        )}
      </div>
      <div style={{padding:'10px 12px'}}>
        <div style={{fontWeight:700,fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:2}}>{track.title}</div>
        <div style={{fontSize:12,color:'var(--text2)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:6}}>{track.profiles?.display_name || 'Artiste'}</div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <span style={{fontSize:11,color:'var(--text3)',fontFamily:'Space Mono,monospace'}}>▶ {fmtK(track.play_count)}</span>
          {track.genre && <span style={{fontSize:10,background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:4,padding:'1px 6px',color:'var(--text2)'}}>{track.genre}</span>}
        </div>
      </div>
    </div>
  )
}

// ── Artist card ──
function ArtistCard({ profile, onView, followingIds, onFollow }) {
  const [following, setFollowing] = useState(followingIds?.includes(profile.id))
  const [loadingFollow, setLoadingFollow] = useState(false)

  const handleFollow = async (e) => {
    e.stopPropagation()
    setLoadingFollow(true)
    try {
      if (following) { await api.profiles.unfollow(profile.username); setFollowing(false) }
      else { await api.profiles.follow(profile.username); setFollowing(true) }
      onFollow && onFollow(profile.id, !following)
    } catch(e) {}
    finally { setLoadingFollow(false) }
  }

  return (
    <div
      onClick={() => onView(profile.username)}
      style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:16,cursor:'pointer',display:'flex',alignItems:'center',gap:12,transition:'border-color .2s'}}
      onMouseEnter={e=>e.currentTarget.style.borderColor='var(--gold)'}
      onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}
    >
      {/* Avatar */}
      <div style={{flexShrink:0}}>
        {profile.avatar_url
          ? <img src={profile.avatar_url} alt="" style={{width:48,height:48,borderRadius:'50%',objectFit:'cover'}} />
          : <div style={{width:48,height:48,borderRadius:'50%',background:gradientFor(profile.id||profile.username),display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:700,color:'#fff'}}>{(profile.display_name||profile.username||'?')[0].toUpperCase()}</div>
        }
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:'flex',alignItems:'center',gap:4,marginBottom:2}}>
          <span style={{fontWeight:700,fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{profile.display_name||profile.username}</span>
          {profile.is_verified && <span style={{fontSize:11,color:'var(--gold)',flexShrink:0}}>✓</span>}
        </div>
        <div style={{fontSize:11,color:'var(--text3)'}}>@{profile.username}</div>
        <div style={{fontSize:11,color:'var(--text2)',marginTop:2}}>
          {fmtK(profile.followers_count||0)} abonnés · {fmtK(profile.tracks_count||0)} sons
        </div>
      </div>
      <button
        onClick={handleFollow}
        disabled={loadingFollow}
        style={{flexShrink:0,padding:'5px 12px',background:following?'var(--bg2)':'var(--gold)',color:following?'var(--text2)':'#000',border:`1px solid ${following?'var(--border)':'var(--gold)'}`,borderRadius:'var(--radius-sm)',fontSize:12,fontWeight:700,cursor:'pointer',transition:'all .2s'}}
      >
        {loadingFollow ? '…' : following ? 'Suivi ✓' : '+ Suivre'}
      </button>
    </div>
  )
}

// ── Event card ──
function EventCard({ event, onView, format }) {
  const d = new Date(event.event_date)
  const isPast = d < new Date()
  return (
    <div
      onClick={() => onView('events')}
      style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',overflow:'hidden',cursor:'pointer',display:'flex',gap:0,transition:'border-color .2s'}}
      onMouseEnter={e=>e.currentTarget.style.borderColor='var(--gold)'}
      onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}
    >
      {/* Date bloc */}
      <div style={{width:56,background:isPast?'var(--bg2)':'var(--gold)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',flexShrink:0,padding:'12px 8px'}}>
        <div style={{fontSize:18,fontWeight:800,fontFamily:'Syne,sans-serif',color:isPast?'var(--text3)':'#000',lineHeight:1}}>{d.getDate()}</div>
        <div style={{fontSize:10,fontWeight:700,color:isPast?'var(--text3)':'#000',textTransform:'uppercase'}}>{d.toLocaleDateString('fr-FR',{month:'short'})}</div>
      </div>
      {/* Info */}
      <div style={{flex:1,padding:'12px 14px',minWidth:0}}>
        <div style={{fontWeight:700,fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:3}}>{event.title}</div>
        <div style={{fontSize:12,color:'var(--text2)',marginBottom:4}}>📍 {event.location||'À définir'}</div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          {event.ticket_price > 0
            ? <span style={{fontSize:11,fontWeight:700,color:'var(--gold)'}}>{format ? format(event.ticket_price) : event.ticket_price + ' KMF'}</span>
            : <span style={{fontSize:11,color:'var(--green)',fontWeight:700}}>Gratuit</span>
          }
          {isPast && <span style={{fontSize:10,color:'var(--text3)',background:'var(--bg2)',borderRadius:4,padding:'1px 6px'}}>Passé</span>}
        </div>
      </div>
      {/* Cover */}
      {event.cover_url && (
        <div style={{width:70,flexShrink:0}}>
          <img src={event.cover_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} />
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════
export default function Explore() {
  const { user } = useAuthStore()
  const { toggle, currentTrack, isPlaying, setQueue } = usePlayerStore()
  const { setPage } = usePageStore()
  const { format } = usePrice()

  const [trending, setTrending] = useState([])
  const [artists, setArtists] = useState([])
  const [events, setEvents] = useState([])
  const [followingIds, setFollowingIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('Tout')

  const GENRES = ['Tout', 'Twarab', 'Afrobeats', 'Amapiano', 'Slam', 'Gospel', 'Hip-Hop']

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.tracks.trending().catch(() => ({ tracks: [] })),
      api.profiles.list('?role=creator&limit=12').catch(() => ({ profiles: [] })),
      api.events.list('?limit=8&sort=date').catch(() => ({ events: [] })),
      user ? api.profiles.followingIds().catch(() => ({ ids: [] })) : Promise.resolve({ ids: [] }),
    ]).then(([t, p, e, f]) => {
      setTrending(t.tracks || [])
      setArtists(p.profiles || [])
      setEvents(e.events || [])
      setFollowingIds(f.ids || [])
    }).finally(() => setLoading(false))
  }, [user])

  const handlePlay = (track) => {
    if (currentTrack?.id === track.id) { toggle(); return }
    const filtered = filter === 'Tout' ? trending : trending.filter(t => t.genre === filter)
    const idx = filtered.findIndex(t => t.id === track.id)
    setQueue(filtered, idx >= 0 ? idx : 0)
  }

  const filteredTrending = filter === 'Tout' ? trending : trending.filter(t => t.genre?.toLowerCase().includes(filter.toLowerCase()))

  return (
    <div style={{paddingBottom:80}}>
      {/* ── HERO ── */}
      <div style={{background:'linear-gradient(135deg,rgba(212,161,10,.15),rgba(142,68,173,.15))',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'24px 20px',marginBottom:24,position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:-20,right:-20,fontSize:120,opacity:.05,pointerEvents:'none'}}>🔭</div>
        <div style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:22,marginBottom:6}}>
          🔭 Explorer
        </div>
        <div style={{fontSize:14,color:'var(--text2)',maxWidth:400}}>
          Découvrez les sons tendance, les artistes à suivre et les événements à venir sur Waiichia.
        </div>
      </div>

      {/* ── TRENDING TRACKS ── */}
      <div style={{marginBottom:32}}>
        <SectionHeader
          icon="🔥"
          title="Sons tendance"
          subtitle="Les plus écoutés en ce moment"
          action="Voir tout"
          onAction={() => setPage('music')}
        />
        {/* Filtre genre */}
        <div style={{display:'flex',gap:6,overflowX:'auto',paddingBottom:8,marginBottom:14,scrollbarWidth:'none'}}>
          {GENRES.map(g => (
            <button key={g} onClick={() => setFilter(g)} style={{flexShrink:0,padding:'4px 12px',borderRadius:20,border:`1px solid ${filter===g?'var(--gold)':'var(--border)'}`,background:filter===g?'var(--gold)':'var(--card)',color:filter===g?'#000':'var(--text2)',fontSize:12,fontWeight:filter===g?700:400,cursor:'pointer',transition:'all .2s'}}>
              {g}
            </button>
          ))}
        </div>
        {loading
          ? <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:12}}>{[...Array(6)].map((_,i)=><Skeleton key={i} h={200}/>)}</div>
          : filteredTrending.length === 0
            ? <div style={{textAlign:'center',padding:40,color:'var(--text3)'}}>Aucun son pour ce genre</div>
            : <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:12}}>
                {filteredTrending.slice(0,10).map((t,i) => (
                  <TrackCard key={t.id} track={t} rank={i} onPlay={handlePlay} isCurrent={currentTrack?.id===t.id} isPlaying={isPlaying} format={format} />
                ))}
              </div>
        }
      </div>

      {/* ── ARTISTES À DÉCOUVRIR ── */}
      <div style={{marginBottom:32}}>
        <SectionHeader
          icon="🎤"
          title="Artistes à découvrir"
          subtitle="Créateurs actifs sur la plateforme"
          action="Voir tout"
          onAction={() => setPage('creators')}
        />
        {loading
          ? <div style={{display:'flex',flexDirection:'column',gap:10}}>{[...Array(4)].map((_,i)=><Skeleton key={i} h={72}/>)}</div>
          : artists.length === 0
            ? <div style={{textAlign:'center',padding:40,color:'var(--text3)'}}>Aucun artiste trouvé</div>
            : <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {artists.slice(0,8).map(p => (
                  <ArtistCard
                    key={p.id}
                    profile={p}
                    followingIds={followingIds}
                    onView={(username) => setPage('profile', { profileUsername: username })}
                    onFollow={(id, isNowFollowing) => {
                      setFollowingIds(ids => isNowFollowing ? [...ids, id] : ids.filter(x => x !== id))
                    }}
                  />
                ))}
              </div>
        }
      </div>

      {/* ── ÉVÉNEMENTS ── */}
      <div style={{marginBottom:32}}>
        <SectionHeader
          icon="🎪"
          title="Événements"
          subtitle="À venir et récents"
          action="Voir tout"
          onAction={() => setPage('events')}
        />
        {loading
          ? <div style={{display:'flex',flexDirection:'column',gap:10}}>{[...Array(3)].map((_,i)=><Skeleton key={i} h={80}/>)}</div>
          : events.length === 0
            ? <div style={{textAlign:'center',padding:40,color:'var(--text3)'}}>Aucun événement</div>
            : <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {events.map(e => (
                  <EventCard key={e.id} event={e} onView={setPage} format={format} />
                ))}
              </div>
        }
      </div>

      {/* ── CTA upload ── */}
      {user && (
        <div style={{background:'linear-gradient(135deg,rgba(212,161,10,.1),rgba(44,198,83,.1))',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'20px',textAlign:'center'}}>
          <div style={{fontSize:32,marginBottom:8}}>🎵</div>
          <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:16,marginBottom:6}}>Partagez votre musique</div>
          <div style={{fontSize:13,color:'var(--text2)',marginBottom:14}}>Rejoignez les artistes sur Waiichia et touchez votre audience.</div>
          <button className="btn btn-primary" onClick={() => setPage('upload')}>+ Uploader un son</button>
        </div>
      )}
    </div>
  )
}
