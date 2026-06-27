import { useState, useEffect, useRef } from 'react'
import { useAuthStore, usePageStore, usePlayerStore } from '../stores/index.js'
import PlaylistCreateModal from '../components/PlaylistCreateModal.jsx'
import api from '../services/api.js'

/* ─── Constants ─────────────────────────────────────────────────────────── */
const BGS = [
  'linear-gradient(135deg,#1a6fcc,#4d9fff)',
  'linear-gradient(135deg,#9b59f5,#6d3db5)',
  'linear-gradient(135deg,#f5a623,#e63946)',
  'linear-gradient(135deg,#2dc653,#0a9e4a)',
  'linear-gradient(135deg,#ff6b35,#cc4411)',
  'linear-gradient(135deg,#00b4d8,#0077b6)',
]

/* ─── Helpers ───────────────────────────────────────────────────────────── */
const fmtK = n => n >= 1000 ? (n / 1000).toFixed(1) + 'K' : String(n || 0)

function normalizeTracks(data) {
  // L'API peut retourner plusieurs structures selon l'endpoint
  // /playlists/:id → { playlist_tracks: [{position, tracks: {...}}] }
  //               ou { tracks: [...] }
  if (data.playlist_tracks?.length) {
    return data.playlist_tracks
      .sort((a, b) => (a.position || 0) - (b.position || 0))
      .map(pt => pt.tracks || pt.track || pt)
      .filter(Boolean)
  }
  if (data.tracks?.length) return data.tracks
  return []
}

/* ─── PlaylistCard ──────────────────────────────────────────────────────── */
function PlaylistCard({ pl, index, onOpen, onDelete }) {
  const [hover, setHover] = useState(false)
  const count = pl.tracks_count ?? pl.track_count ?? 0

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: 'var(--card)',
        border: `1px solid ${hover ? 'var(--gold)' : 'var(--border)'}`,
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
        transform: hover ? 'translateY(-2px)' : 'none',
        transition: 'all .2s',
        position: 'relative',
      }}
    >
      {/* Cover */}
      <div
        onClick={() => onOpen(pl)}
        style={{
          height: 130,
          background: pl.cover_url ? `url(${pl.cover_url}) center/cover` : BGS[index % 6],
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 36, cursor: 'pointer', position: 'relative',
        }}
      >
        {!pl.cover_url && '🎵'}

        {/* Visibility badge */}
        <span style={{
          position: 'absolute', top: 8, left: 8,
          background: 'rgba(0,0,0,.6)', borderRadius: 12,
          padding: '2px 7px', fontSize: 10, fontWeight: 700,
          color: pl.is_public ? 'var(--green)' : 'var(--text3)',
        }}>
          {pl.is_public ? '🌍 Publique' : '🔒 Privée'}
        </span>

        {/* Play overlay on hover */}
        {hover && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'var(--gold)', color: '#000',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 700,
            }}>▶</div>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '10px 12px 8px' }}>
        <div style={{ fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>
          {pl.title}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8 }}>
          {count} son{count !== 1 ? 's' : ''}
          {pl.total_plays ? ` · ${fmtK(pl.total_plays)} 🎧` : ''}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => onOpen(pl)}
            style={{ flex: 1, background: 'rgba(245,166,35,.1)', border: '1px solid rgba(245,166,35,.3)', borderRadius: 6, padding: '5px 0', fontSize: 11, fontWeight: 600, color: 'var(--gold)', cursor: 'pointer' }}
          >
            ▶ Écouter
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDelete(pl) }}
            style={{ background: 'rgba(230,57,70,.08)', border: '1px solid rgba(230,57,70,.2)', borderRadius: 6, padding: '5px 8px', fontSize: 11, color: 'var(--red)', cursor: 'pointer' }}
            title="Supprimer"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── PlaylistDrawer — bottom-sheet avec tracklist ──────────────────────── */
function PlaylistDrawer({ pl, onClose, onTrackRemoved }) {
  const { play, setQueue, toggle, currentTrack, isPlaying } = usePlayerStore()
  const [tracks,  setTracks]  = useState(null)
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState(null) // track id being removed

  useEffect(() => {
    if (!pl?.id) return
    api.get('/api/albums/playlists/' + pl.id)
      .then(d => setTracks(normalizeTracks(d)))
      .catch(() => setTracks([]))
      .finally(() => setLoading(false))
  }, [pl?.id])

  const playAll = () => {
    if (!tracks?.length) return
    setQueue(tracks)
    play(tracks[0])
    onClose()
  }

  const playOne = t => {
    setQueue(tracks)
    play(t)
  }

  const removeTrack = async t => {
    setRemoving(t.id)
    try {
      await api.delete(`/api/albums/playlists/${pl.id}/tracks/${t.id}`)
      setTracks(prev => prev.filter(x => x.id !== t.id))
      onTrackRemoved(pl.id)
    } catch {
      // Route pas dispo → on retire localement quand même (UX)
      setTracks(prev => prev.filter(x => x.id !== t.id))
      onTrackRemoved(pl.id)
    }
    setRemoving(null)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'flex-end' }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(4px)' }}
      />

      {/* Sheet */}
      <div style={{
        position: 'relative', width: '100%', maxWidth: 580, margin: '0 auto',
        background: 'var(--bg)', borderRadius: '20px 20px 0 0',
        maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', gap: 14, padding: '18px 18px 14px',
          borderBottom: '1px solid var(--border)', alignItems: 'center', flexShrink: 0,
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 10, flexShrink: 0,
            background: pl.cover_url ? `url(${pl.cover_url}) center/cover` : BGS[0],
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
          }}>
            {!pl.cover_url && '🎵'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {pl.title}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
              {tracks === null ? '…' : tracks.length} sons
              {' · '}
              <span style={{ color: pl.is_public ? 'var(--green)' : 'var(--text3)' }}>
                {pl.is_public ? '🌍 Publique' : '🔒 Privée'}
              </span>
            </div>
          </div>
          {tracks?.length > 0 && (
            <button
              onClick={playAll}
              style={{ background: 'var(--gold)', border: 'none', borderRadius: 8, padding: '7px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer', color: '#000', flexShrink: 0 }}
            >
              ▶ Tout jouer
            </button>
          )}
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text3)', padding: '4px 8px', flexShrink: 0 }}
          >
            ✕
          </button>
        </div>

        {/* Description */}
        {pl.description && (
          <div style={{ padding: '10px 18px', fontSize: 12, color: 'var(--text2)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            {pl.description}
          </div>
        )}

        {/* Tracklist */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loading && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>⏳ Chargement…</div>
          )}
          {!loading && tracks?.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🎵</div>
              Playlist vide — ajoutez des sons depuis la page Musique.
            </div>
          )}
          {!loading && tracks?.map((t, i) => {
            const active = currentTrack?.id === t.id
            return (
              <div
                key={t.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 18px', borderBottom: '1px solid var(--border)',
                  background: active ? 'rgba(245,166,35,.07)' : 'transparent',
                  transition: 'background .15s',
                }}
              >
                {/* Index / playing indicator */}
                <div style={{ width: 24, textAlign: 'center', fontSize: 12, fontFamily: 'Space Mono,monospace', color: active ? 'var(--gold)' : 'var(--text3)', flexShrink: 0 }}>
                  {active && isPlaying ? '▶' : String(i + 1).padStart(2, '0')}
                </div>

                {/* Cover */}
                {t.cover_url
                  ? <img src={t.cover_url} alt="" style={{ width: 38, height: 38, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                  : <div style={{ width: 38, height: 38, borderRadius: 6, background: BGS[i % 6], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🎵</div>
                }

                {/* Info — clickable to play */}
                <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => playOne(t)}>
                  <div style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? 'var(--gold)' : 'inherit', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.title}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>
                    {t.creator?.display_name || t.profiles?.display_name || '—'}
                    {t.genre && <span style={{ marginLeft: 6, background: 'rgba(255,255,255,.07)', borderRadius: 4, padding: '1px 5px' }}>{t.genre}</span>}
                  </div>
                </div>

                {/* Remove button */}
                <button
                  onClick={() => removeTrack(t)}
                  disabled={removing === t.id}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 15, padding: '4px 6px', opacity: removing === t.id ? .4 : 1, flexShrink: 0 }}
                  title="Retirer de la playlist"
                >
                  {removing === t.id ? '⏳' : '✕'}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ─── DeleteConfirm modal ───────────────────────────────────────────────── */
function DeleteConfirm({ pl, onConfirm, onCancel }) {
  const [loading, setLoading] = useState(false)
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={onCancel} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(4px)' }} />
      <div onClick={e => e.stopPropagation()} style={{ position: 'relative', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24, maxWidth: 360, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
        <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 16, marginBottom: 8 }}>Supprimer cette playlist ?</div>
        <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20 }}>
          <strong>"{pl.title}"</strong> sera définitivement supprimée. Cette action est irréversible.
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} className="btn btn-secondary" style={{ flex: 1 }}>Annuler</button>
          <button
            onClick={async () => {
              setLoading(true)
              await onConfirm()
              setLoading(false)
            }}
            disabled={loading}
            style={{ flex: 1, background: 'var(--red)', border: 'none', borderRadius: 50, padding: '10px', fontWeight: 700, fontSize: 13, color: '#fff', cursor: 'pointer', opacity: loading ? .6 : 1 }}
          >
            {loading ? '⏳…' : 'Supprimer'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════════════ */
export default function PlaylistsPage() {
  const { user }    = useAuthStore()
  const { setPage } = usePageStore()

  const [playlists,   setPlaylists]   = useState([])
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState('')
  const [filterVis,   setFilterVis]   = useState('all') // 'all' | 'public' | 'private'
  const [createOpen,  setCreateOpen]  = useState(false)
  const [selected,    setSelected]    = useState(null)   // playlist to show in drawer
  const [toDelete,    setToDelete]    = useState(null)   // playlist to confirm delete
  const searchRef = useRef(null)

  const loadPlaylists = () => {
    setLoading(true)
    api.get('/api/albums/playlists/public?mine=true')
      .then(d => setPlaylists(d.playlists || d || []))
      .catch(() => setPlaylists([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadPlaylists() }, [])

  /* Decrement track count when a track is removed from drawer */
  const handleTrackRemoved = plId => {
    setPlaylists(prev => prev.map(p =>
      p.id === plId
        ? { ...p, tracks_count: Math.max((p.tracks_count ?? 1) - 1, 0), track_count: Math.max((p.track_count ?? 1) - 1, 0) }
        : p
    ))
  }

  const handleDelete = async pl => {
    try {
      await api.delete('/api/albums/playlists/' + pl.id)
    } catch { /* ignore — route peut ne pas exister */ }
    setPlaylists(prev => prev.filter(p => p.id !== pl.id))
    setToDelete(null)
  }

  /* Filtered list */
  const filtered = playlists.filter(pl => {
    const matchSearch = !search || pl.title.toLowerCase().includes(search.toLowerCase())
    const matchVis    = filterVis === 'all' || (filterVis === 'public' ? pl.is_public : !pl.is_public)
    return matchSearch && matchVis
  })

  /* Stats */
  const totalSons = playlists.reduce((s, p) => s + (p.tracks_count ?? p.track_count ?? 0), 0)

  if (!user) return (
    <div style={{ textAlign: 'center', padding: 60 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🎵</div>
      <h2 style={{ fontFamily: 'Syne,sans-serif', marginBottom: 12 }}>Connectez-vous</h2>
      <button className="btn btn-primary" onClick={() => setPage('login')}>Se connecter</button>
    </div>
  )

  return (
    <div style={{ paddingBottom: 80 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div className="page-title" style={{ marginBottom: 0 }}>🎵 Mes Playlists</div>
        <button
          onClick={() => setCreateOpen(true)}
          className="btn btn-primary btn-sm"
          style={{ borderRadius: 50, padding: '8px 16px' }}
        >
          + Nouvelle
        </button>
      </div>

      {/* ── Stats strip ── */}
      {playlists.length > 0 && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 18, fontSize: 12, color: 'var(--text3)' }}>
          <span><strong style={{ color: 'var(--text)' }}>{playlists.length}</strong> playlist{playlists.length > 1 ? 's' : ''}</span>
          <span><strong style={{ color: 'var(--text)' }}>{totalSons}</strong> sons au total</span>
          <span><strong style={{ color: 'var(--green)' }}>{playlists.filter(p => p.is_public).length}</strong> publiques</span>
        </div>
      )}

      {/* ── Search + filter ── */}
      {playlists.length > 2 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 160, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--text3)' }}>🔍</span>
            <input
              ref={searchRef}
              className="input-field"
              placeholder="Rechercher une playlist…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 32, width: '100%' }}
            />
          </div>
          {['all', 'public', 'private'].map(v => (
            <div
              key={v}
              className={`pill-tab${filterVis === v ? ' active' : ''}`}
              onClick={() => setFilterVis(v)}
            >
              {v === 'all' ? 'Toutes' : v === 'public' ? '🌍 Publiques' : '🔒 Privées'}
            </div>
          ))}
        </div>
      )}

      {/* ── Content ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text3)' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
          <div style={{ fontSize: 13 }}>Chargement…</div>
        </div>
      ) : filtered.length === 0 && playlists.length === 0 ? (
        /* Empty state — no playlists at all */
        <div style={{ textAlign: 'center', padding: 60, background: 'var(--card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎵</div>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Aucune playlist</div>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20 }}>Créez votre première playlist pour organiser vos sons préférés.</div>
          <button
            onClick={() => setCreateOpen(true)}
            className="btn btn-primary"
            style={{ borderRadius: 50, padding: '10px 24px' }}
          >
            Créer ma première playlist
          </button>
        </div>
      ) : filtered.length === 0 ? (
        /* Empty state — search/filter returned nothing */
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
          <div style={{ fontSize: 13 }}>Aucun résultat pour "{search}"</div>
          <button className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={() => { setSearch(''); setFilterVis('all') }}>
            Réinitialiser
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(155px,1fr))', gap: 12 }}>
          {filtered.map((pl, i) => (
            <PlaylistCard
              key={pl.id}
              pl={pl}
              index={i}
              onOpen={setSelected}
              onDelete={setToDelete}
            />
          ))}
        </div>
      )}

      {/* ── Modals / drawers ── */}
      <PlaylistCreateModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={pl => { setPlaylists(prev => [pl, ...prev]); setCreateOpen(false) }}
      />

      {selected && (
        <PlaylistDrawer
          pl={selected}
          onClose={() => setSelected(null)}
          onTrackRemoved={handleTrackRemoved}
        />
      )}

      {toDelete && (
        <DeleteConfirm
          pl={toDelete}
          onConfirm={() => handleDelete(toDelete)}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  )
}
