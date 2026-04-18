import { useState, useEffect } from "react"
import { usePlayerStore, usePageStore } from "../stores/index.js"
import { ReactionBar } from "../components/ReactionBar.jsx"
import api from "../services/api.js"

const TYPES = ['Tous', 'Album', 'EP', 'Single']
const BGS = [
  "linear-gradient(135deg,#0d2a3a,#1a5060)", "linear-gradient(135deg,#1a0a2e,#3a1a6a)",
  "linear-gradient(135deg,#002a10,#007040)", "linear-gradient(135deg,#2e1a00,#7a4000)",
  "linear-gradient(135deg,#1a0020,#5a0060)", "linear-gradient(135deg,#001a2e,#005080)",
]

function fmtDuration(sec) {
  if (!sec) return '--:--'
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return m + ':' + String(s).padStart(2, '0')
}

export default function Albums() {
  const { toggle, currentTrack, isPlaying } = usePlayerStore()
  const { setPage } = usePageStore()
  const [typeFilter, setTypeFilter] = useState('Tous')
  const [albums, setAlbums] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [albumTracks, setAlbumTracks] = useState([])
  const [loadingDetail, setLoadingDetail] = useState(false)

  useEffect(() => {
    api.get('/api/albums?limit=30')
      .then(d => setAlbums(d.albums || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = typeFilter === 'Tous'
    ? albums
    : albums.filter(a => (a.album_type || 'album').toLowerCase() === typeFilter.toLowerCase())

  const openAlbum = async (album) => {
    setSelected(album)
    setLoadingDetail(true)
    try {
      const d = await api.get('/api/albums/' + album.id)
      if (d.album?.tracks) setAlbumTracks(d.album.tracks)
      else setAlbumTracks([])
    } catch { setAlbumTracks([]) }
    setLoadingDetail(false)
  }

  // ── Album detail view ──
  if (selected) {
    const a = selected
    const creator = a.profiles || {}
    return (
      <div style={{ paddingBottom: 40 }}>
        <button onClick={() => { setSelected(null); setAlbumTracks([]) }} style={{
          display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none',
          color: 'var(--text2)', cursor: 'pointer', fontSize: 13, marginBottom: 20,
          fontFamily: 'Plus Jakarta Sans,sans-serif'
        }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text2)'}>
          ← Retour aux albums
        </button>

        {/* Hero */}
        <div style={{ display: 'flex', gap: 24, marginBottom: 28, flexWrap: 'wrap' }}>
          <div style={{
            width: 160, height: 160, borderRadius: 'var(--radius)',
            background: a.cover_url ? 'none' : BGS[0],
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64,
            flexShrink: 0, boxShadow: '0 12px 40px rgba(0,0,0,.4)', overflow: 'hidden'
          }}>
            {a.cover_url
              ? <img src={a.cover_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius)' }} />
              : '💿'}
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{
              fontSize: 10, color: 'var(--green)', fontFamily: 'Space Mono,monospace',
              textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6
            }}>
              {(a.album_type || 'ALBUM').toUpperCase()} · {a.genre || 'Musique'}
            </div>
            <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
              {a.title}
            </div>
            <div style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 4, cursor: 'pointer' }}
              onClick={() => { if (creator.username) setPage('profile', { profileUsername: creator.username }) }}>
              {creator.display_name || 'Artiste'} {creator.is_verified && <span style={{ fontSize: 12 }}>⭐</span>}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'Space Mono,monospace', marginBottom: 12 }}>
              {albumTracks.length || '?'} titres · {a.release_year || new Date(a.created_at).getFullYear()}
            </div>
            {a.description && (
              <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16, lineHeight: 1.5 }}>
                {a.description}
              </div>
            )}
            {/* Tags */}
            {a.tags?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                {a.tags.map(tag => (
                  <span key={tag} style={{
                    fontSize: 10, color: 'var(--text3)', background: 'var(--bg2)',
                    padding: '3px 8px', borderRadius: 99, border: '1px solid var(--border)'
                  }}>#{tag.replace('#', '')}</span>
                ))}
              </div>
            )}
            {albumTracks.length > 0 && (
              <button onClick={() => toggle({
                ...albumTracks[0], profiles: creator, cover_url: albumTracks[0].cover_url || a.cover_url
              })} style={{
                padding: '10px 24px', borderRadius: 50, border: 'none',
                background: 'linear-gradient(135deg,var(--gold),#e8920a)', color: '#000',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                fontFamily: 'Plus Jakarta Sans,sans-serif',
                boxShadow: '0 4px 16px rgba(245,166,35,.4)'
              }}>▶ Écouter l'album</button>
            )}
          </div>
        </div>

        {/* Tracklist */}
        <div style={{
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', overflow: 'hidden'
        }}>
          <div style={{
            padding: '14px 18px', borderBottom: '1px solid var(--border)',
            fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 14
          }}>📋 Liste des titres</div>

          {loadingDetail
            ? <div style={{ padding: 30, textAlign: 'center', color: 'var(--text3)', fontSize: 12 }}>
                Chargement...
              </div>
            : albumTracks.length === 0
              ? <div style={{ padding: 30, textAlign: 'center', color: 'var(--text3)', fontSize: 12 }}>
                  Aucun titre dans cet album
                </div>
              : albumTracks.map((t, i) => {
                  const isCurrent = currentTrack?.id === t.id
                  return (
                    <div key={t.id || i} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '11px 18px',
                      borderBottom: i < albumTracks.length - 1 ? '1px solid var(--border2)' : 'none',
                      transition: 'background .15s', cursor: t.audio_url_128 ? 'pointer' : 'default'
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--card2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      onClick={() => {
                        if (t.audio_url_128) toggle({ ...t, profiles: creator, cover_url: t.cover_url || a.cover_url })
                      }}>
                      <div style={{
                        width: 24, textAlign: 'center', flexShrink: 0,
                        fontFamily: 'Space Mono,monospace', fontSize: 11,
                        color: isCurrent ? 'var(--gold)' : 'var(--text3)'
                      }}>
                        {isCurrent && isPlaying ? '▶' : (t.position || i + 1)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 13, fontWeight: 600,
                          color: isCurrent ? 'var(--gold)' : 'var(--text)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                        }}>{t.title}</div>
                      </div>
                      {t.access_type === 'free'
                        ? <div style={{
                            fontSize: 9, color: 'var(--green)', fontFamily: 'Space Mono,monospace',
                            background: 'rgba(44,198,83,.12)', border: '1px solid rgba(44,198,83,.3)',
                            borderRadius: 20, padding: '2px 7px', flexShrink: 0
                          }}>GRATUIT</div>
                        : t.sale_price > 0
                          ? <div style={{
                              fontSize: 9, color: 'var(--gold)', fontFamily: 'Space Mono,monospace',
                              background: 'rgba(245,166,35,.12)', border: '1px solid rgba(245,166,35,.3)',
                              borderRadius: 20, padding: '2px 7px', flexShrink: 0
                            }}>{t.sale_price?.toLocaleString()} KMF</div>
                          : <div style={{
                              fontSize: 9, color: 'var(--text3)', fontFamily: 'Space Mono,monospace',
                              background: 'rgba(0,0,0,.2)', border: '1px solid var(--border)',
                              borderRadius: 20, padding: '2px 7px', flexShrink: 0
                            }}>🔒</div>}
                      <div style={{
                        fontSize: 11, color: 'var(--text3)', fontFamily: 'Space Mono,monospace',
                        flexShrink: 0, width: 40, textAlign: 'right'
                      }}>{fmtDuration(t.duration_sec)}</div>
                    </div>
                  )
                })
          }
        </div>

        {/* Reactions */}
        <div style={{ marginTop: 16 }}>
          <ReactionBar targetType="album" targetId={selected.id} showComments={true} />
        </div>
      </div>
    )
  }

  // ── Album grid ──
  return (
    <div style={{ paddingBottom: 40 }}>
      <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 22, fontWeight: 800, marginBottom: 18 }}>
        💿 Albums
      </div>

      {/* Type filter */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 22 }}>
        {TYPES.map(t => (
          <button key={t} onClick={() => setTypeFilter(t)} style={{
            padding: '6px 14px', borderRadius: 50, border: '1px solid',
            fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .18s',
            fontFamily: 'Plus Jakarta Sans,sans-serif',
            borderColor: typeFilter === t ? 'var(--gold)' : 'var(--border)',
            background: typeFilter === t ? 'var(--gold)' : 'var(--card)',
            color: typeFilter === t ? '#000' : 'var(--text2)'
          }}>{t}</button>
        ))}
      </div>

      {loading
        ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14 }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ background: 'var(--card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                <div style={{ aspectRatio: '1', background: 'var(--card2)', animation: 'shimmer 1.5s infinite' }} />
                <div style={{ padding: 12 }}>
                  <div style={{ height: 13, background: 'var(--card3)', borderRadius: 6, marginBottom: 8, width: '75%' }} />
                  <div style={{ height: 11, background: 'var(--card2)', borderRadius: 6, width: '50%' }} />
                </div>
              </div>
            ))}
          </div>
        : filtered.length === 0
          ? <div style={{ textAlign: 'center', padding: 60, color: 'var(--text3)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>💿</div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>
                {typeFilter === 'Tous' ? 'Aucun album publié' : 'Aucun ' + typeFilter.toLowerCase() + ' publié'}
              </div>
              <div style={{ fontSize: 12 }}>Les albums publiés par les artistes apparaîtront ici</div>
            </div>
          : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14 }}>
              {filtered.map((a, i) => {
                const creator = a.profiles || {}
                const albumType = (a.album_type || 'album').toUpperCase()
                return (
                  <div key={a.id} style={{
                    background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                    overflow: 'hidden', cursor: 'pointer', transition: 'all .25s'
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(44,198,83,.4)'; e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 16px 40px var(--shadow)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
                    onClick={() => openAlbum(a)}>

                    <div style={{
                      position: 'relative', aspectRatio: '1', background: a.cover_url ? 'none' : BGS[i % 6],
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 52, overflow: 'hidden'
                    }}>
                      {a.cover_url
                        ? <img src={a.cover_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : '💿'}
                      <div style={{
                        position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,.6)',
                        color: albumType === 'EP' ? 'var(--blue)' : albumType === 'SINGLE' ? 'var(--gold)' : 'var(--green)',
                        fontSize: 9, fontFamily: 'Space Mono,monospace', fontWeight: 700,
                        padding: '3px 8px', borderRadius: 4, letterSpacing: .5
                      }}>{albumType}</div>
                    </div>

                    <div style={{ padding: '12px 14px' }}>
                      <div style={{
                        fontWeight: 700, fontSize: 13.5, marginBottom: 3,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                      }}>{a.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>
                        {creator.display_name || 'Artiste'} {creator.is_verified && <span style={{ fontSize: 10 }}>⭐</span>}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'Space Mono,monospace', marginBottom: 8 }}>
                        {a.genre || 'Musique'} · {a.release_year || new Date(a.created_at).getFullYear()}
                      </div>
                      <ReactionBar targetType="album" targetId={a.id} showComments={false} />
                    </div>
                  </div>
                )
              })}
            </div>
      }
    </div>
  )
}
