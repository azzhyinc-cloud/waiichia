import { useState, useEffect, useRef } from "react"
import { useAuthStore, usePageStore, useDeviseStore, usePlayerStore } from "../stores/index.js"
import { ReactionBar } from "../components/ReactionBar.jsx"
import BuyModal from "../components/BuyModal.jsx"
import ShareModal from "../components/ShareModal.jsx"
import AddToPlaylistModal from "../components/AddToPlaylistModal.jsx"
import TipModal from "../components/TipModal.jsx"
import api from "../services/api.js"

/* ─── Constants ─────────────────────────────────────────────────────────── */
const BGS = [
  "linear-gradient(135deg,#1a6fcc,#4d9fff)",
  "linear-gradient(135deg,#9b59f5,#6d3db5)",
  "linear-gradient(135deg,#f5a623,#e63946)",
  "linear-gradient(135deg,#2dc653,#0a9e4a)",
  "linear-gradient(135deg,#ff6b35,#cc4411)",
  "linear-gradient(135deg,#00b4d8,#0077b6)",
]
const CAT_BG = {
  merch:    "linear-gradient(135deg,#0d2a3a,#1a5060)",
  digital:  "linear-gradient(135deg,#1a0020,#5a0060)",
  coaching: "linear-gradient(135deg,#002a10,#007040)",
  beats:    "linear-gradient(135deg,#1a1000,#5a3800)",
  autre:    "linear-gradient(135deg,#1a1a2e,#16213e)",
}
const FLAGS = { KM:"🇰🇲", MG:"🇲🇬", NG:"🇳🇬", CI:"🇨🇮", SN:"🇸🇳", TZ:"🇹🇿", FR:"🇫🇷" }

const TABS_OWN   = ["🎵 Sons","💿 Albums","📋 Playlists","📻 Diffusions","🛍️ Boutique","🎪 Événements","🛒 Mes achats","📥 Hors-ligne"]
const TABS_OTHER = ["🎵 Sons","💿 Albums","📋 Playlists","📻 Diffusions","🛍️ Boutique","🎪 Événements"]

const MOCK_TRACKS = Array.from({ length: 6 }, (_, i) => ({
  id: "t" + i,
  title: ["Twarab ya Komori","Moroni Flow","Island Vibe","Masiwa Matatu","Komori Nights","Afrika Rising"][i],
  profiles: { display_name: "Kolo Officiel" },
  genre: ["TWARAB","AFROBEATS","AFROBEATS","TWARAB","AFROTRAP","AMAPIANO"][i],
  play_count: [8420, 6180, 4930, 3760, 2100, 980][i],
  sale_price: [2500, 1500, 0, 2500, 500, 0][i],
  access_type: i % 3 === 0 ? "paid" : "free",
  cover_url: null,
}))

/* ─── Helpers ───────────────────────────────────────────────────────────── */
const fmtK    = n => n >= 1e6 ? (n/1e6).toFixed(1)+"M" : n >= 1000 ? (n/1000).toFixed(1)+"K" : String(n||0)
const fmtDate = d => { try { return new Date(d).toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric"}) } catch { return "" } }
const plCount = pl => pl.track_count ?? pl.tracks_count ?? 0

/* ─── Shared micro-components ───────────────────────────────────────────── */
function EmptyState({ icon, title, subtitle, action }) {
  return (
    <div style={{ textAlign:"center", padding:"60px 20px", color:"var(--text3)" }}>
      <div style={{ fontSize:44, marginBottom:12 }}>{icon}</div>
      <div style={{ fontSize:15, fontWeight:600, marginBottom:6, color:"var(--text2)" }}>{title}</div>
      {subtitle && <div style={{ fontSize:12, marginBottom:18, maxWidth:280, margin:"0 auto 18px" }}>{subtitle}</div>}
      {action}
    </div>
  )
}

function TabLoading() {
  return (
    <div style={{ textAlign:"center", padding:50, color:"var(--text3)", fontSize:13 }}>
      <div style={{ fontSize:28, marginBottom:10, animation:"spin 1s linear infinite", display:"inline-block" }}>⏳</div>
      <div>Chargement…</div>
    </div>
  )
}

/* Card action buttons — unified style */
function CardActions({ children }) {
  return (
    <div style={{ display:"flex", gap:6, padding:"4px 10px 10px", flexWrap:"wrap" }}>
      {children}
    </div>
  )
}
function CardBtn({ onClick, icon, label, variant = "default" }) {
  const styles = {
    default:  { background:"none", border:"1px solid var(--border)", color:"var(--text2)" },
    danger:   { background:"rgba(230,57,70,.08)", border:"1px solid rgba(230,57,70,.25)", color:"var(--red)" },
    primary:  { background:"rgba(245,166,35,.10)", border:"1px solid rgba(245,166,35,.35)", color:"var(--gold)" },
  }
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick(e) }}
      style={{ ...styles[variant], borderRadius:6, cursor:"pointer", fontSize:"0.75rem", padding:"3px 9px", fontWeight:500, transition:"opacity .15s" }}
    >
      {icon} {label}
    </button>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   ALBUM DETAIL DRAWER — tracklist inline
═══════════════════════════════════════════════════════════════════════════ */
function AlbumDrawer({ album, profileName, onClose, onPlay }) {
  const { currentTrack, isPlaying, toggle } = usePlayerStore()
  const [tracks, setTracks] = useState(null)

  useEffect(() => {
    api.get("/api/albums/" + album.id)
      .then(d => {
        const t = (d.album_tracks || d.tracks || [])
          .map(x => x.tracks || x.track || x)
          .filter(Boolean)
        setTracks(t)
      })
      .catch(() => setTracks([]))
  }, [album.id])

  return (
    <div style={{ position:"fixed", inset:0, zIndex:1000, display:"flex", alignItems:"flex-end" }}>
      {/* backdrop */}
      <div onClick={onClose} style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.65)", backdropFilter:"blur(4px)" }} />
      <div style={{ position:"relative", width:"100%", maxWidth:620, margin:"0 auto", background:"var(--bg)", borderRadius:"20px 20px 0 0", maxHeight:"80vh", display:"flex", flexDirection:"column", overflow:"hidden" }}>
        {/* Header */}
        <div style={{ display:"flex", gap:14, padding:"18px 18px 14px", borderBottom:"1px solid var(--border)", alignItems:"center" }}>
          <div style={{ width:56, height:56, borderRadius:10, background:album.cover_url ? `url(${album.cover_url}) center/cover` : BGS[0], flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>
            {!album.cover_url && "💿"}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontFamily:"Syne,sans-serif", fontWeight:800, fontSize:16, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{album.title}</div>
            <div style={{ fontSize:12, color:"var(--text3)", marginTop:2 }}>{profileName} · {album.track_count||0} sons{album.release_year ? " · " + album.release_year : ""}</div>
          </div>
          <button onClick={() => onPlay(album)} style={{ background:"var(--gold)", border:"none", borderRadius:8, padding:"7px 14px", fontWeight:700, fontSize:13, cursor:"pointer", color:"#000" }}>▶ Jouer</button>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:"var(--text3)", padding:"4px 8px" }}>✕</button>
        </div>

        {/* Tracklist */}
        <div style={{ overflowY:"auto", flex:1 }}>
          {tracks === null && <div style={{ padding:30, textAlign:"center", color:"var(--text3)" }}>⏳ Chargement…</div>}
          {tracks !== null && tracks.length === 0 && <div style={{ padding:30, textAlign:"center", color:"var(--text3)" }}>Album vide</div>}
          {tracks?.map((t, i) => {
            const active = currentTrack?.id === t.id
            return (
              <div key={t.id} onClick={() => toggle(t)}
                style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 18px", borderBottom:"1px solid var(--border)", cursor:"pointer", background: active ? "rgba(245,166,35,.07)" : "transparent", transition:"background .15s" }}>
                <div style={{ width:28, textAlign:"center", fontSize:13, fontFamily:"Space Mono,monospace", color: active ? "var(--gold)" : "var(--text3)", flexShrink:0 }}>
                  {active && isPlaying ? "▶" : String(i + 1).padStart(2, "0")}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight: active ? 700 : 500, color: active ? "var(--gold)" : "inherit", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.title}</div>
                  {t.genre && <div style={{ fontSize:10, color:"var(--text3)", marginTop:2 }}>{t.genre}</div>}
                </div>
                <div style={{ fontSize:11, color:"var(--text3)", fontFamily:"Space Mono,monospace", flexShrink:0 }}>
                  {t.play_count ? fmtK(t.play_count) + " 🎧" : ""}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   EVENT CARD — with future/past status
═══════════════════════════════════════════════════════════════════════════ */
function EventCard({ ev, dc, isOwn, onClick, onBuy }) {
  const d       = ev.event_date ? new Date(ev.event_date) : null
  const isPast  = d ? d < new Date() : false
  const day     = d ? d.getDate() : "—"
  const month   = d ? d.toLocaleDateString("fr-FR", { month:"short" }).toUpperCase() : ""

  return (
    <div onClick={onClick}
      style={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:"var(--radius)", padding:"14px 16px", display:"flex", gap:14, alignItems:"flex-start", cursor:"pointer", opacity: isPast ? .65 : 1, position:"relative" }}>
      {/* Date block */}
      <div style={{ textAlign:"center", minWidth:44, flexShrink:0 }}>
        <div style={{ fontFamily:"Syne,sans-serif", fontSize:22, fontWeight:800, lineHeight:1, color: isPast ? "var(--text3)" : "var(--gold)" }}>{day}</div>
        <div style={{ fontSize:10, fontWeight:700, color:"var(--text3)", letterSpacing:.5 }}>{month}</div>
      </div>

      {/* Info */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:700, fontSize:14, marginBottom:4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{ev.title}</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:8, fontSize:11, color:"var(--text3)" }}>
          {ev.venue && <span>📍 {ev.venue}{ev.city ? ", " + ev.city : ""}</span>}
          {ev.category && <span style={{ background:"rgba(255,255,255,.07)", borderRadius:4, padding:"1px 6px" }}>{ev.category}</span>}
        </div>
      </div>

      {/* Price / status */}
      <div style={{ flexShrink:0, textAlign:"right" }}>
        {isPast
          ? <span style={{ fontSize:10, background:"rgba(255,255,255,.07)", borderRadius:4, padding:"2px 7px", color:"var(--text3)" }}>Passé</span>
          : ev.is_free
            ? <span style={{ fontSize:11, color:"var(--green)", fontWeight:700 }}>Gratuit</span>
            : ev.ticket_price
              ? <span style={{ fontSize:12, fontWeight:700, color:"var(--gold)", fontFamily:"Space Mono,monospace" }}>{ev.ticket_price.toLocaleString()} {ev.currency||dc}</span>
              : null
        }
        {!isPast && !isOwn && (
          <div style={{ marginTop:6 }}>
            <button onClick={e => { e.stopPropagation(); onBuy(ev) }}
              className="btn btn-primary btn-sm" style={{ fontSize:11, padding:"4px 10px" }}>
              🎫 Billet
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PROFILE PAGE
═══════════════════════════════════════════════════════════════════════════ */
export default function Profile() {
  const { user }                                    = useAuthStore()
  const { setPage, profileUsername, bumpWalletRefresh } = usePageStore()
  const { devise }                                  = useDeviseStore()
  const { toggle, currentTrack, isPlaying, play, setQueue } = usePlayerStore()
  const dc     = devise?.code || "KMF"
  const isOwn  = !profileUsername || profileUsername === user?.username
  const TABS   = isOwn ? TABS_OWN : TABS_OTHER

  /* ── State ── */
  const [profile,       setProfile]       = useState(null)
  const [tracks,        setTracks]        = useState([])
  const [playlists,     setPlaylists]     = useState([])
  const [albums,        setAlbums]        = useState([])
  const [emissions,     setEmissions]     = useState([])
  const [products,      setProducts]      = useState([])
  const [events,        setEvents]        = useState([])
  const [purchases,     setPurchases]     = useState({ tickets:[], rentals:[], history:[] })
  const [offlineTracks, setOfflineTracks] = useState([])
  const [loading,       setLoading]       = useState(true)
  const [tabLoading,    setTabLoading]    = useState(false)
  const [tab,           setTab]           = useState("🎵 Sons")
  const [followed,      setFollowed]      = useState(false)
  const [upPhoto,       setUpPhoto]       = useState("")

  /* Tab data loaded flags — avoid double-fetching */
  const loaded = useRef({})

  /* Modals */
  const [buyModal,      setBuyModal]      = useState(null)
  const [buyProduct,    setBuyProduct]    = useState(null)
  const [buyEvent,      setBuyEvent]      = useState(null)
  const [shareItem,     setShareItem]     = useState(null)
  const [shareType,     setShareType]     = useState("profile")
  const [playlistTrack, setPlaylistTrack] = useState(null)
  const [tipOpen,       setTipOpen]       = useState(false)
  const [albumDrawer,   setAlbumDrawer]   = useState(null)  // album object | null

  /* Tab scroll ref */
  const tabsRef = useRef(null)

  /* ── Initial load ── */
  useEffect(() => {
    loaded.current = {}
    const who = profileUsername || user?.username
    if (!who) { setLoading(false); return }
    Promise.all([
      api.profiles.get(who).catch(e => {
        if (e.message?.includes("suspendu")) return { suspended:true }
        return null
      }),
      api.profiles.tracks ? api.profiles.tracks(who).catch(() => ({ tracks:[] })) : Promise.resolve({ tracks:[] }),
    ]).then(([p, t]) => {
      if (p?.suspended) { setProfile({ suspended:true }); return }
      if (p) setProfile(p.profile || p)
      if (p && !p.suspended && !isOwn) {
        api.profiles.isFollowing(who).then(r => setFollowed(!!r.following)).catch(() => {})
      }
      setTracks(t?.tracks?.length ? t.tracks : (isOwn ? MOCK_TRACKS : []))
    }).finally(() => setLoading(false))
  }, [profileUsername, user])

  /* ── Lazy tab loading ── */
  useEffect(() => {
    if (!profile?.id) return
    const pid = profile.id

    if (tab === "📋 Playlists" && !loaded.current.playlists) {
      loaded.current.playlists = true
      setTabLoading(true)
      api.get("/api/albums/playlists/public?user_id=" + pid)
        .then(d => setPlaylists(d.playlists || d || []))
        .catch(() => setPlaylists([]))
        .finally(() => setTabLoading(false))
    }

    if (tab === "💿 Albums" && !loaded.current.albums) {
      loaded.current.albums = true
      setTabLoading(true)
      api.get("/api/albums/?creator_id=" + pid)
        .then(d => setAlbums(d.albums || d || []))
        .catch(() => setAlbums([]))
        .finally(() => setTabLoading(false))
    }

    if (tab === "📻 Diffusions" && !loaded.current.emissions) {
      loaded.current.emissions = true
      setTabLoading(true)
      api.emissions.list()
        .then(d => {
          const all = d.emissions || d || []
          setEmissions(all.filter(e => e.user_id === pid))
        })
        .catch(() => setEmissions([]))
        .finally(() => setTabLoading(false))
    }

    if (tab === "🛍️ Boutique" && !loaded.current.products) {
      loaded.current.products = true
      setTabLoading(true)
      api.products.list("?seller_id=" + pid)
        .then(d => setProducts(d.products || d || []))
        .catch(() => setProducts([]))
        .finally(() => setTabLoading(false))
    }

    if (tab === "🎪 Événements" && !loaded.current.events) {
      loaded.current.events = true
      setTabLoading(true)
      api.events.list()
        .then(d => {
          const all = d.events || d || []
          setEvents(all.filter(e => e.creator_id === pid))
        })
        .catch(() => setEvents([]))
        .finally(() => setTabLoading(false))
    }

    if (tab === "🛒 Mes achats" && isOwn && !loaded.current.purchases) {
      loaded.current.purchases = true
      setTabLoading(true)
      Promise.allSettled([
        api.payments.tickets(),
        api.payments.rentals(),
        api.payments.history("?type=purchase"),
      ]).then(([tk, rt, hs]) => {
        setPurchases({
          tickets: tk.status === "fulfilled" ? (tk.value.tickets || []) : [],
          rentals: rt.status === "fulfilled" ? (rt.value.rentals || []) : [],
          history: hs.status === "fulfilled" ? (hs.value.history || hs.value.transactions || []) : [],
        })
      }).finally(() => setTabLoading(false))
    }

    if (tab === "📥 Hors-ligne" && isOwn) {
      try {
        const raw = localStorage.getItem("waiichia_offline_tracks")
        setOfflineTracks(raw ? JSON.parse(raw) : [])
      } catch { setOfflineTracks([]) }
    }
  }, [tab, profile, isOwn])

  /* ── Helpers ── */
  const playPlaylist = async pl => {
    try {
      const data = await api.get("/api/albums/playlists/" + pl.id)
      const t    = (data.playlist_tracks || []).sort((a,b) => a.position - b.position).map(pt => pt.tracks || pt.track).filter(Boolean)
      if (t.length) { setQueue(t); play(t[0]) } else alert("Playlist vide")
    } catch { alert("Erreur lecture playlist") }
  }

  const playAlbum = async al => {
    try {
      const data = await api.get("/api/albums/" + al.id)
      const t    = (data.album_tracks || data.tracks || []).map(x => x.tracks || x.track || x).filter(Boolean)
      if (t.length) { setQueue(t); play(t[0]) } else alert("Album vide")
    } catch { alert("Erreur lecture album") }
  }

  const goToEmission    = em => { try { sessionStorage.setItem("focus_emission_id", em.id) } catch {} setPage("emission") }
  const goToEvent       = ev => { try { sessionStorage.setItem("focus_event_id", ev.id) } catch {} setPage(isOwn ? "my_events" : "events") }
  const goToProductEdit = pr => { try { sessionStorage.setItem("focus_product_id", pr.id) } catch {} setPage("shop_mine") }
  const goToUploadTab   = t  => { try { sessionStorage.setItem("upload_tab", t) } catch {} setPage("upload") }
  const openShare       = (item, type) => { setShareItem(item); setShareType(type) }
  const removeOffline   = id => {
    const next = offlineTracks.filter(t => t.id !== id)
    setOfflineTracks(next)
    localStorage.setItem("waiichia_offline_tracks", JSON.stringify(next))
  }

  /* ── Photo upload ── */
  const doPhotoUpload = async (e, kind) => {
    const file = e.target.files[0]; e.target.value = ""
    if (!file) return
    if (file.size > 8*1024*1024) { alert("Image trop lourde — max 8 MB"); return }
    setUpPhoto(kind)
    try {
      const fd  = new FormData(); fd.append("file", file)
      const tok = localStorage.getItem("waiichia_token")
      const res = await fetch((import.meta.env.VITE_API_URL||"") + "/api/upload/cover", { method:"POST", headers:{ Authorization:"Bearer "+tok }, body:fd })
      const data = await res.json()
      if (!data?.url) throw new Error(data?.error || "Upload échoué")
      const field = kind === "avatar" ? "avatar_url" : "cover_url"
      await api.profiles.update({ [field]:data.url })
      setProfile(prev => ({ ...(prev||{}), [field]:data.url }))
    } catch (err) { alert("Erreur upload: " + err.message) }
    setUpPhoto("")
  }

  /* ── Guards ── */
  const p = profile || user
  if (p?.suspended) return (
    <div style={{ textAlign:"center", padding:80 }}>
      <div style={{ fontSize:48, marginBottom:12 }}>🚫</div>
      <div style={{ fontFamily:"Syne,sans-serif", fontSize:18, fontWeight:800, marginBottom:8 }}>Compte suspendu</div>
      <div style={{ color:"var(--text3)", fontSize:14, marginBottom:16 }}>Ce compte a été suspendu. Si vous pensez que c'est une erreur, contactez le support.</div>
      <button className="btn btn-primary" onClick={() => setPage("home")}>Retour à l'accueil</button>
    </div>
  )
  if (!p && !loading) return (
    <div style={{ textAlign:"center", padding:80 }}>
      <div style={{ fontSize:48, marginBottom:12 }}>👤</div>
      <div style={{ fontFamily:"Syne,sans-serif", fontSize:18, fontWeight:800, marginBottom:8 }}>Connectez-vous</div>
      <button className="btn btn-primary" onClick={() => setPage("login")}>Se connecter</button>
    </div>
  )
  if (loading) return <div style={{ textAlign:"center", padding:80, color:"var(--text3)" }}>Chargement...</div>

  const initials = (p?.display_name || "??").split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase()
  const flag     = FLAGS[p?.country || "KM"] || "🌍"

  /* Events split: upcoming / past */
  const now          = new Date()
  const upcomingEvts = events.filter(e => !e.event_date || new Date(e.event_date) >= now)
  const pastEvts     = events.filter(e => e.event_date && new Date(e.event_date) < now)

  return (
    <div style={{ paddingBottom:60 }}>
      {/* ── Modals ── */}
      {buyModal    && <BuyModal track={buyModal}   mode="buy" onClose={() => setBuyModal(null)} />}
      {buyProduct  && <BuyModal product={buyProduct}          onClose={() => setBuyProduct(null)} />}
      {tipOpen     && <TipModal recipient={p} onClose={() => setTipOpen(false)} onSuccess={bumpWalletRefresh} />}
      <ShareModal       isOpen={!!shareItem}    onClose={() => setShareItem(null)}    item={shareItem}    type={shareType} />
      <AddToPlaylistModal isOpen={!!playlistTrack} onClose={() => setPlaylistTrack(null)} track={playlistTrack} />
      {albumDrawer && <AlbumDrawer album={albumDrawer} profileName={p?.display_name||"Artiste"} onClose={() => setAlbumDrawer(null)} onPlay={al => { setAlbumDrawer(null); playAlbum(al) }} />}

      {/* ── COVER ── */}
      <div className="profile-cover">
        <div className="profile-cover-img">
          {p?.cover_url ? <img src={p.cover_url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/> : "🌊"}
        </div>
        {isOwn && (
          <div className="profile-cover-actions">
            <button onClick={() => !upPhoto && document.getElementById("wzCoverInput").click()} className="btn btn-sm btn-secondary" style={{ opacity:.85 }}>
              {upPhoto === "cover" ? "⏳ Envoi…" : "📷 Modifier couverture"}
            </button>
            <input type="file" id="wzCoverInput" accept="image/*" style={{ display:"none" }} onChange={e => doPhotoUpload(e,"cover")} />
          </div>
        )}
      </div>

      {/* ── AVATAR + META ── */}
      <div className="profile-info-row">
        <div className="profile-avatar-lg">
          {p?.avatar_url
            ? <img src={p.avatar_url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
            : initials
          }
          {isOwn && (
            <>
              <div className="profile-ava-edit" style={{ cursor:"pointer" }} onClick={() => !upPhoto && document.getElementById("wzAvatarInput").click()}>
                {upPhoto === "avatar" ? "⏳" : "📷"}
              </div>
              <input type="file" id="wzAvatarInput" accept="image/*" style={{ display:"none" }} onChange={e => doPhotoUpload(e,"avatar")} />
            </>
          )}
        </div>

        <div className="profile-meta">
          <div className="profile-name">
            {p?.display_name || "Artiste"}
            {p?.is_verified && <div className="profile-type-badge">⭐ Artiste Vérifié</div>}
          </div>
          <div className="profile-handle">@{p?.username} · {flag} {p?.country === "KM" ? "Moroni, Comores" : p?.country || "Comores"}</div>
          {p?.bio && <div style={{ fontSize:13, color:"var(--text2)", marginBottom:6, lineHeight:1.6, maxWidth:500 }}>{p.bio}</div>}

          <div className="profile-actions">
            {isOwn ? <>
              <button className="btn btn-primary btn-sm"   onClick={() => setPage("upload")}>+ Publier</button>
              <button className="btn btn-secondary btn-sm" onClick={() => setPage("settings")}>⚙️ Paramètres</button>
              <button className="btn btn-outline btn-sm"   onClick={() => setPage("wallet")}>💰 Portefeuille</button>
            </> : <>
              <button
                className={`btn btn-sm ${followed ? "btn-secondary" : "btn-primary"}`}
                onClick={async () => {
                  try {
                    followed ? await api.profiles.unfollow(p.username) : await api.profiles.follow(p.username)
                    setFollowed(!followed)
                  } catch {}
                }}
              >
                {followed ? "✓ Suivi" : "+ Suivre"}
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => setPage("messages", { msgTarget:{ id:p.id, name:p.display_name||p.username } })}>💬 Message</button>
              <button className="btn btn-outline btn-sm"   onClick={() => setTipOpen(true)}>🎁 Tip</button>
            </>}
            <button className="btn btn-outline btn-sm" onClick={() => openShare(p,"profile")}>🔗 Partager</button>
          </div>
        </div>
      </div>

      {/* ── STATS BAR ── */}
      <div className="profile-stats">
        {[
          { v: fmtK(p?.tracks_count  || tracks.length), l:"Sons" },
          { v: fmtK(p?.albums_count  || 0),             l:"Albums" },
          { v: fmtK(p?.fans_count    || p?.followers_count || 0), l:"Fans" },
          { v: fmtK(p?.total_plays   || 0),             l:"Écoutes" },
          { v: fmtK(p?.total_earned  || 0),             l:"KMF gagnés" },
        ].map((s, i) => (
          <div key={i} className="pstat">
            <div className="pstat-num">{s.v}</div>
            <div className="pstat-label">{s.l}</div>
          </div>
        ))}
      </div>

      {/* ── TABS BAR — horizontally scrollable ── */}
      <div ref={tabsRef} className="tabs-bar" style={{ overflowX:"auto", scrollbarWidth:"none", WebkitOverflowScrolling:"touch", whiteSpace:"nowrap", paddingBottom:2 }}>
        {TABS.map(t => (
          <button key={t} className={`tab-btn${tab === t ? " active" : ""}`}
            onClick={() => {
              setTab(t)
              // Scroll active tab into view on mobile
              const el = tabsRef.current?.querySelector(`.tab-btn.active`)
              el?.scrollIntoView({ behavior:"smooth", block:"nearest", inline:"center" })
            }}
          >{t}</button>
        ))}
      </div>

      {tabLoading && <TabLoading />}

      {/* ════════════════════════════════════════════════
          ONGLET : SONS
      ════════════════════════════════════════════════ */}
      {!tabLoading && tab === "🎵 Sons" && (
        tracks.length === 0
          ? <EmptyState icon="🎵" title="Aucun son publié"
              action={isOwn && <button className="btn btn-primary" onClick={() => goToUploadTab("son")}>Publier mon premier son</button>}
            />
          : <div className="tracks-grid">
              {tracks.map((t, i) => (
                <div key={t.id} className="track-card">
                  <div onClick={() => toggle(t)}>
                    <div className="track-cover">
                      <div className="track-cover-bg" style={{ background: t.cover_url ? `url(${t.cover_url}) center/cover` : BGS[i%6] }}>
                        {!t.cover_url && "🎵"}
                      </div>
                      <div className="type-badge type-music">{t.genre || "MUSIQUE"}</div>
                      <div className="play-overlay">
                        <button className="play-btn-circle">{isPlaying && currentTrack?.id === t.id ? "⏸" : "▶"}</button>
                      </div>
                    </div>
                    <div className="track-info">
                      <div className="track-title">{t.title}</div>
                      <div className="track-artist">{t.profiles?.display_name || p?.display_name || "Artiste"}</div>
                      <div className="track-meta">
                        <span>{fmtK(t.play_count || t.plays_count)} 🎧</span>
                        <span>{t.access_type === "free" || !t.sale_price ? "🆓 Gratuit" : t.sale_price?.toLocaleString() + " " + dc}</span>
                      </div>
                    </div>
                  </div>
                  <div className="track-purchase-row">
                    {(!t.sale_price || t.access_type === "free")
                      ? <span className="free-chip">✓ Gratuit · Accès libre</span>
                      : <button className="buy-chip buy-chip-buy" onClick={() => setBuyModal(t)}>🛒 Acheter <span className="price-tag">{t.sale_price?.toLocaleString()} {dc}</span></button>
                    }
                  </div>
                  <CardActions>
                    <CardBtn onClick={() => setPlaylistTrack(t)} icon="➕" label="Playlist" />
                    <CardBtn onClick={() => openShare(t,"track")} icon="🔗" label="Partager" />
                  </CardActions>
                  <ReactionBar targetType="track" targetId={t.id} showComments={true} />
                </div>
              ))}
            </div>
      )}

      {/* ════════════════════════════════════════════════
          ONGLET : ALBUMS
      ════════════════════════════════════════════════ */}
      {!tabLoading && tab === "💿 Albums" && (
        albums.length === 0
          ? <EmptyState icon="💿" title="Aucun album publié"
              subtitle={isOwn ? "Regroupez vos sons en albums depuis la page Publier" : "Cet artiste n'a pas encore publié d'album"}
              action={isOwn && <button className="btn btn-primary" onClick={() => goToUploadTab("album")}>Créer un album</button>}
            />
          : <div className="tracks-grid">
              {albums.map((al, i) => (
                <div key={al.id} className="track-card">
                  {/* Cover — click ouvre la tracklist */}
                  <div onClick={() => setAlbumDrawer(al)}>
                    <div className="track-cover">
                      <div className="track-cover-bg" style={{ background: al.cover_url ? `url(${al.cover_url}) center/cover` : BGS[i%6] }}>
                        {!al.cover_url && "💿"}
                      </div>
                      <div className="type-badge type-music">ALBUM</div>
                      <div className="play-overlay">
                        <button className="play-btn-circle" onClick={e => { e.stopPropagation(); playAlbum(al) }}>▶</button>
                      </div>
                    </div>
                    <div className="track-info">
                      <div className="track-title">{al.title}</div>
                      <div className="track-artist">{p?.display_name || "Artiste"}</div>
                      <div className="track-meta">
                        <span>{al.track_count || 0} sons</span>
                        {al.release_year && <span>{al.release_year}</span>}
                        {al.genre && <span>{al.genre}</span>}
                      </div>
                    </div>
                  </div>
                  <CardActions>
                    <CardBtn onClick={() => setAlbumDrawer(al)} icon="📋" label="Tracklist" variant="primary" />
                    <CardBtn onClick={() => openShare(al,"album")} icon="🔗" label="Partager" />
                  </CardActions>
                </div>
              ))}
            </div>
      )}

      {/* ════════════════════════════════════════════════
          ONGLET : PLAYLISTS
      ════════════════════════════════════════════════ */}
      {!tabLoading && tab === "📋 Playlists" && (
        playlists.length === 0
          ? <EmptyState icon="📋" title="Aucune playlist publique" />
          : <div className="tracks-grid">
              {playlists.map((pl, i) => (
                <div key={pl.id} className="track-card">
                  <div onClick={() => playPlaylist(pl)}>
                    <div className="track-cover">
                      <div className="track-cover-bg" style={{ background: pl.cover_url ? `url(${pl.cover_url}) center/cover` : BGS[i%6] }}>
                        {!pl.cover_url && "🎶"}
                      </div>
                      <div className="type-badge type-music">PLAYLIST</div>
                      <div className="play-overlay"><button className="play-btn-circle">▶</button></div>
                    </div>
                    <div className="track-info">
                      <div className="track-title">{pl.title}</div>
                      <div className="track-artist">{pl.profiles?.display_name || p?.display_name || "Utilisateur"}</div>
                      <div className="track-meta"><span>{plCount(pl)} sons</span></div>
                    </div>
                  </div>
                  <CardActions>
                    <CardBtn onClick={() => openShare(pl,"playlist")} icon="🔗" label="Partager" />
                  </CardActions>
                </div>
              ))}
            </div>
      )}

      {/* ════════════════════════════════════════════════
          ONGLET : DIFFUSIONS
      ════════════════════════════════════════════════ */}
      {!tabLoading && tab === "📻 Diffusions" && (
        emissions.length === 0
          ? <EmptyState icon="📻" title="Aucune émission"
              subtitle={isOwn ? "Créez vos propres émissions depuis la page Publier" : "Cet artiste n'anime aucune émission"}
              action={isOwn && <button className="btn btn-primary" onClick={() => goToUploadTab("emission")}>Créer une émission</button>}
            />
          : <div className="tracks-grid">
              {emissions.map((em, i) => (
                <div key={em.id} className="track-card" style={{ cursor:"pointer" }} onClick={() => goToEmission(em)}>
                  <div className="track-cover">
                    <div className="track-cover-bg" style={{ background: em.cover_url ? `url(${em.cover_url}) center/cover` : BGS[i%6] }}>
                      {!em.cover_url && "📻"}
                    </div>
                    <div className="type-badge type-music">{(em.category || "ÉMISSION").toUpperCase()}</div>
                    <div className="play-overlay"><button className="play-btn-circle">▶</button></div>
                  </div>
                  <div className="track-info">
                    <div className="track-title">{em.title}</div>
                    <div className="track-artist">{em.host || p?.display_name || "Animateur"}</div>
                    <div className="track-meta">
                      {em.channel && <span>📡 {em.channel}</span>}
                      {em.episodes_count !== undefined && <span>{em.episodes_count} épisodes</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
      )}

      {/* ════════════════════════════════════════════════
          ONGLET : BOUTIQUE
      ════════════════════════════════════════════════ */}
      {!tabLoading && tab === "🛍️ Boutique" && (
        products.length === 0
          ? <EmptyState icon="🛍️" title="Aucun produit en vente"
              subtitle={isOwn ? "Créez votre premier produit (beats, merch, coaching…)" : "Cet artiste ne vend rien pour l'instant"}
              action={isOwn && <button className="btn btn-primary" onClick={() => setPage("shop_mine")}>Ouvrir ma boutique</button>}
            />
          : <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:14, padding:"0 12px" }}>
              {products.map(pr => (
                <div key={pr.id} style={{ background:"var(--card)", borderRadius:12, border:"1px solid var(--border)", overflow:"hidden" }}>
                  <div style={{ height:130, background: pr.cover_url ? "#000" : (pr.background || CAT_BG[pr.category] || "var(--card2)"), display:"flex", alignItems:"center", justifyContent:"center", fontSize:40, position:"relative" }}>
                    {pr.cover_url
                      ? <img src={pr.cover_url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", opacity:.9 }}/>
                      : (pr.emoji || "🛍️")
                    }
                    {pr.category && (
                      <span style={{ position:"absolute", top:8, left:8, background:"rgba(0,0,0,.6)", borderRadius:6, padding:"2px 8px", fontSize:10, fontWeight:700, color:"#fff", textTransform:"uppercase", letterSpacing:.5 }}>
                        {pr.category}
                      </span>
                    )}
                  </div>
                  <div style={{ padding:"12px 14px" }}>
                    <div style={{ fontWeight:700, fontSize:13, marginBottom:3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{pr.name}</div>
                    <div style={{ fontSize:15, fontWeight:800, color:"var(--gold)", fontFamily:"monospace", marginBottom:6 }}>{(pr.price||0).toLocaleString()} {pr.currency||"KMF"}</div>
                    <div style={{ fontSize:11, color:"var(--text3)", marginBottom:10 }}>🛒 {pr.sold_count||0} vendus{pr.stock > 0 ? ` · ${pr.stock} en stock` : ""}</div>
                    {isOwn
                      ? <button onClick={() => goToProductEdit(pr)} className="btn btn-secondary btn-sm" style={{ width:"100%" }}>✏️ Modifier</button>
                      : <button onClick={() => setBuyProduct(pr)}   className="btn btn-primary btn-sm"   style={{ width:"100%" }}>🛒 Acheter</button>
                    }
                  </div>
                </div>
              ))}
            </div>
      )}

      {/* ════════════════════════════════════════════════
          ONGLET : ÉVÉNEMENTS — upcoming / past split
      ════════════════════════════════════════════════ */}
      {!tabLoading && tab === "🎪 Événements" && (
        events.length === 0
          ? <EmptyState icon="🎪" title="Aucun événement"
              subtitle={isOwn ? "Créez votre premier événement (concert, soirée, rencontre…)" : "Cet artiste n'organise aucun événement"}
              action={isOwn && <button className="btn btn-primary" onClick={() => setPage("create_event")}>Créer un événement</button>}
            />
          : <div style={{ padding:"0 12px", display:"flex", flexDirection:"column", gap:24 }}>

              {/* À venir */}
              {upcomingEvts.length > 0 && (
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:"var(--text3)", letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>
                    À venir · {upcomingEvts.length}
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {upcomingEvts.map(ev => (
                      <EventCard key={ev.id} ev={ev} dc={dc} isOwn={isOwn}
                        onClick={() => goToEvent(ev)}
                        onBuy={ev => { try { sessionStorage.setItem("focus_event_id", ev.id) } catch {} setPage("events") }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Passés */}
              {pastEvts.length > 0 && (
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:"var(--text3)", letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>
                    Passés · {pastEvts.length}
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {pastEvts.map(ev => (
                      <EventCard key={ev.id} ev={ev} dc={dc} isOwn={isOwn}
                        onClick={() => goToEvent(ev)}
                        onBuy={() => {}}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
      )}

      {/* ════════════════════════════════════════════════
          ONGLET : MES ACHATS (own only)
      ════════════════════════════════════════════════ */}
      {!tabLoading && tab === "🛒 Mes achats" && isOwn && (
        purchases.tickets.length === 0 && purchases.rentals.length === 0 && purchases.history.length === 0
          ? <EmptyState icon="🛒" title="Aucun achat" subtitle="Vos billets, locations et achats apparaîtront ici" />
          : <div style={{ padding:"0 12px", display:"flex", flexDirection:"column", gap:24 }}>

              {purchases.tickets.length > 0 && (
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:"var(--text3)", letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>
                    🎫 Billets · {purchases.tickets.length}
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:10 }}>
                    {purchases.tickets.map(t => (
                      <div key={t.id} style={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:"var(--radius)", padding:14 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"start", gap:10, marginBottom:8 }}>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontWeight:700, fontSize:14, marginBottom:3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.events?.title || "Événement"}</div>
                            <div style={{ fontSize:12, color:"var(--text3)" }}>{fmtDate(t.events?.event_date || t.created_at)}</div>
                          </div>
                          <span style={{ background: t.status === "confirmed" ? "rgba(44,198,83,.15)" : "rgba(245,166,35,.15)", color: t.status === "confirmed" ? "var(--green)" : "var(--gold)", padding:"3px 8px", borderRadius:6, fontSize:10, fontWeight:700, whiteSpace:"nowrap" }}>
                            {t.status === "confirmed" ? "✓ Confirmé" : t.status || "En attente"}
                          </span>
                        </div>
                        <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"var(--text2)" }}>
                          <span>{t.quantity||1} billet{(t.quantity||1) > 1 ? "s" : ""}</span>
                          {t.amount_paid !== undefined && <span style={{ fontWeight:700, color:"var(--gold)" }}>{t.amount_paid === 0 ? "Gratuit" : t.amount_paid.toLocaleString() + " KMF"}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {purchases.rentals.length > 0 && (
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:"var(--text3)", letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>
                    ⏳ Locations · {purchases.rentals.length}
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:10 }}>
                    {purchases.rentals.map(r => {
                      const end     = r.end_date || r.expires_at
                      const expired = end ? new Date(end) < new Date() : false
                      return (
                        <div key={r.id} style={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:"var(--radius)", padding:14, opacity: expired ? .6 : 1 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"start", gap:10, marginBottom:8 }}>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontWeight:700, fontSize:14, marginBottom:3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.tracks?.title || "Son"}</div>
                              <div style={{ fontSize:12, color:"var(--text3)" }}>{expired ? "Expirée le " : "Jusqu'au "}{fmtDate(end)}</div>
                            </div>
                            <span style={{ background: expired ? "rgba(230,57,70,.15)" : "rgba(44,198,83,.15)", color: expired ? "var(--red)" : "var(--green)", padding:"3px 8px", borderRadius:6, fontSize:10, fontWeight:700, whiteSpace:"nowrap" }}>
                              {expired ? "Expirée" : "Active"}
                            </span>
                          </div>
                          {r.amount_paid !== undefined && (
                            <div style={{ fontSize:12, color:"var(--text2)" }}>Payé : <b style={{ color:"var(--gold)" }}>{r.amount_paid.toLocaleString()} KMF</b></div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {purchases.history.length > 0 && (
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:"var(--text3)", letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>
                    💳 Historique · {purchases.history.length}
                  </div>
                  <div style={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:"var(--radius)", overflow:"hidden" }}>
                    {purchases.history.map((h, i) => (
                      <div key={h.id||i} style={{ padding:"12px 14px", borderBottom: i < purchases.history.length-1 ? "1px solid var(--border)" : "none", display:"flex", justifyContent:"space-between", alignItems:"center", gap:10 }}>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:13, fontWeight:600, marginBottom:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{h.description || h.type || "Transaction"}</div>
                          <div style={{ fontSize:11, color:"var(--text3)" }}>{fmtDate(h.created_at)}</div>
                        </div>
                        <div style={{ fontSize:13, fontWeight:800, color:"var(--gold)", whiteSpace:"nowrap" }}>
                          −{(h.amount||0).toLocaleString()} {h.currency||"KMF"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
      )}

      {/* ════════════════════════════════════════════════
          ONGLET : HORS-LIGNE (own only)
      ════════════════════════════════════════════════ */}
      {!tabLoading && tab === "📥 Hors-ligne" && isOwn && (
        offlineTracks.length === 0
          ? <EmptyState icon="📥" title="Aucun son hors-ligne" subtitle="Les sons téléchargés pour écoute hors-ligne apparaîtront ici" />
          : <div className="tracks-grid">
              {offlineTracks.map((t, i) => (
                <div key={t.id} className="track-card">
                  <div onClick={() => toggle(t)}>
                    <div className="track-cover">
                      <div className="track-cover-bg" style={{ background: t.cover_url ? `url(${t.cover_url}) center/cover` : BGS[i%6] }}>
                        {!t.cover_url && "🎵"}
                      </div>
                      <div className="type-badge type-music">📥 HORS-LIGNE</div>
                      <div className="play-overlay">
                        <button className="play-btn-circle">{isPlaying && currentTrack?.id === t.id ? "⏸" : "▶"}</button>
                      </div>
                    </div>
                    <div className="track-info">
                      <div className="track-title">{t.title}</div>
                      <div className="track-artist">{t.profiles?.display_name || t.artist || "Artiste"}</div>
                      <div className="track-meta"><span>💾 Enregistré localement</span></div>
                    </div>
                  </div>
                  <CardActions>
                    <CardBtn onClick={() => removeOffline(t.id)} icon="🗑️" label="Retirer" variant="danger" />
                  </CardActions>
                </div>
              ))}
            </div>
      )}
    </div>
  )
}
