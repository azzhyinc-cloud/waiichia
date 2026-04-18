import { useState, useEffect } from "react"
import { usePageStore, useAuthStore } from "../stores/index.js"
import api from "../services/api.js"

const TABS = ["Tout","Social","Musique","Dons","Live"]
const TYPE_ICONS = {like:"❤️",comment:"💬",follow:"👥",tip:"🎁",play:"🎵",live:"🔴",mention:"@",purchase:"🛒",upload:"⬆️",system:"🔔",message:"✉️",ticket:"🎫",transfer:"💸",rent:"⏳"}
const TYPE_BG = {like:"var(--red)",comment:"var(--blue)",follow:"#2dc653",tip:"var(--gold)",play:"var(--gold)",live:"var(--red)",mention:"var(--blue)",purchase:"var(--green)",upload:"var(--purple)",system:"var(--text3)",message:"var(--blue)",ticket:"var(--purple)",transfer:"var(--green)",rent:"var(--gold)"}
const CAT_MAP = {"Tout":"all","Social":"social","Musique":"music","Dons":"tips","Live":"live"}

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000)
  if (s < 60) return s + 's'
  const m = Math.floor(s / 60); if (m < 60) return m + 'min'
  const h = Math.floor(m / 60); if (h < 24) return h + 'h'
  const d = Math.floor(h / 24); if (d < 30) return d + 'j'
  return Math.floor(d / 30) + 'mo'
}

function getCat(title) {
  if (!title) return 'social'
  const t = title.toLowerCase()
  if (t.includes('don') || t.includes('tip') || t.includes('pourboire') || t.includes('transfert')) return 'tips'
  if (t.includes('écoute') || t.includes('play') || t.includes('son') || t.includes('track') || t.includes('location') || t.includes('achat') || t.includes('acheté')) return 'music'
  if (t.includes('live') || t.includes('radio') || t.includes('direct')) return 'live'
  return 'social'
}

function getType(title) {
  if (!title) return 'system'
  const t = title.toLowerCase()
  if (t.includes('message')) return 'message'
  if (t.includes('aimé') || t.includes('like') || t.includes('réagi')) return 'like'
  if (t.includes('commenté') || t.includes('comment')) return 'comment'
  if (t.includes('suiv') || t.includes('follow') || t.includes('abonné')) return 'follow'
  if (t.includes('don') || t.includes('tip') || t.includes('pourboire')) return 'tip'
  if (t.includes('écoute') || t.includes('play')) return 'play'
  if (t.includes('live') || t.includes('direct')) return 'live'
  if (t.includes('mention')) return 'mention'
  if (t.includes('billet') || t.includes('ticket') || t.includes('réserv')) return 'ticket'
  if (t.includes('transfert') || t.includes('transféré')) return 'transfer'
  if (t.includes('location') || t.includes('loué')) return 'rent'
  if (t.includes('achat') || t.includes('acheté') || t.includes('vendu') || t.includes('produit')) return 'purchase'
  if (t.includes('publié') || t.includes('upload')) return 'upload'
  return 'system'
}

export default function NotifPanel({ open, onClose }) {
  const { setPage } = usePageStore()
  const { user } = useAuthStore()
  const [tab, setTab] = useState("Tout")
  const [notifs, setNotifs] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && user) loadNotifs()
  }, [open, user])

  const loadNotifs = async () => {
    setLoading(true)
    try {
      const data = await api.social.notifications()
      const mapped = (data.notifications || []).map(n => ({
        id: n.id,
        type: getType(n.title),
        cat: getCat(n.title),
        name: n.from?.display_name || n.from?.username || 'Waiichia',
        username: n.from?.username || null,
        ava: (n.from?.display_name || n.from?.username || 'W')[0].toUpperCase(),
        avatar_url: n.from?.avatar_url,
        bg: 'linear-gradient(135deg,var(--gold),var(--kente2))',
        text: n.body || n.title,
        title: n.title || '',
        time: timeAgo(n.created_at),
        unread: !n.is_read,
        data: n.data || {}
      }))
      setNotifs(mapped)
    } catch(e) { console.error('Notif error:', e.message) }
    setLoading(false)
  }

  const markAllRead = async () => {
    try {
      await api.social.markRead?.() || await fetch((import.meta.env.VITE_API_URL||'')+'/api/social/notifications/read',{method:'PATCH',headers:{'Authorization':'Bearer '+localStorage.getItem('waiichia_token')}})
      setNotifs(ns => ns.map(n => ({...n, unread: false})))
    } catch(e) {}
  }

  // ===== Navigation intelligente par type de notification =====
  const handleNotifClick = (n) => {
    onClose()
    switch(n.type) {
      case 'follow':
        // Aller au profil de celui qui nous a suivi
        if (n.username) setPage('profile', { profileUsername: n.username })
        else setPage('feed')
        break
      case 'message':
        // Aller à la messagerie
        setPage('messagerie')
        break
      case 'comment':
      case 'like':
      case 'mention':
        // Aller au contenu concerné ou au feed
        if (n.data?.target_type === 'track' && n.data?.target_id) setPage('music')
        else if (n.data?.target_type === 'event') setPage('events')
        else if (n.data?.target_type === 'product') setPage('shop')
        else setPage('feed')
        break
      case 'purchase':
      case 'rent':
        // Achat/location — aller au wallet pour voir la transaction
        setPage('wallet')
        break
      case 'tip':
      case 'transfer':
        // Don/transfert — aller au wallet
        setPage('wallet')
        break
      case 'ticket':
        // Billet événement — aller aux événements
        setPage('events')
        break
      case 'play':
      case 'upload':
        // Écoute/publication — aller à la musique
        setPage('music')
        break
      case 'live':
        // Live/radio
        setPage('radio')
        break
      default:
        // Système ou inconnu — aller au feed
        setPage('feed')
    }
  }

  const filtered = tab === "Tout" ? notifs : notifs.filter(n => n.cat === CAT_MAP[tab])
  const unreadCount = notifs.filter(n => n.unread).length

  if (!open) return null

  return <>
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:199,background:"transparent"}}/>
    <div style={{position:"fixed",top:"var(--topnav-h,65px)",right:0,width:380,height:"calc(100vh - var(--topnav-h,65px) - var(--player-h,70px))",background:"var(--bg2)",borderLeft:"1px solid var(--border)",zIndex:200,display:"flex",flexDirection:"column",boxShadow:"-8px 0 32px rgba(0,0,0,.3)",overflow:"hidden"}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 18px",borderBottom:"1px solid var(--border)",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:18}}>🔔</span>
          <span style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:16}}>Notifications</span>
          {unreadCount > 0 && <span style={{background:"var(--red)",color:"#fff",borderRadius:20,padding:"2px 8px",fontSize:10,fontWeight:700}}>{unreadCount}</span>}
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {unreadCount > 0 && <button onClick={markAllRead} style={{background:"none",border:"none",color:"var(--gold)",fontSize:11,fontWeight:700,cursor:"pointer"}}>Tout lire</button>}
          <button onClick={onClose} style={{width:28,height:28,borderRadius:"50%",border:"1px solid var(--border)",background:"var(--card)",color:"var(--text3)",fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:4,padding:"10px 16px",borderBottom:"1px solid var(--border)",flexShrink:0,overflowX:"auto"}}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{padding:"6px 14px",borderRadius:20,border:"1px solid "+(tab===t?"var(--gold)":"var(--border)"),background:tab===t?"rgba(245,166,35,.12)":"transparent",color:tab===t?"var(--gold)":"var(--text3)",fontSize:11,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>{t}</button>
        ))}
      </div>

      {/* List */}
      <div style={{flex:1,overflowY:"auto",padding:"8px 0"}}>
        {loading ? (
          <div style={{textAlign:"center",padding:40,color:"var(--text3)",fontSize:13}}>Chargement...</div>
        ) : filtered.length === 0 ? (
          <div style={{textAlign:"center",padding:40}}>
            <div style={{fontSize:32,marginBottom:8}}>🔔</div>
            <div style={{fontSize:13,fontWeight:600,marginBottom:4}}>Aucune notification</div>
            <div style={{fontSize:12,color:"var(--text3)"}}>Vous êtes à jour !</div>
          </div>
        ) : filtered.map((n, i) => (
          <div key={n.id || i}
            onClick={() => handleNotifClick(n)}
            style={{display:"flex",gap:12,padding:"12px 18px",cursor:"pointer",transition:"background .15s",borderLeft:n.unread?"3px solid var(--gold)":"3px solid transparent",background:n.unread?"rgba(245,166,35,.04)":"transparent"}}
            onMouseEnter={e=>e.currentTarget.style.background="var(--card)"}
            onMouseLeave={e=>e.currentTarget.style.background=n.unread?"rgba(245,166,35,.04)":"transparent"}>
            {/* Avatar */}
            <div style={{width:40,height:40,borderRadius:"50%",background:n.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"#fff",flexShrink:0,overflow:"hidden"}}>
              {n.avatar_url ? <img src={n.avatar_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/> : n.ava}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,lineHeight:1.5}}>
                <span style={{fontWeight:700}}>{n.name}</span>
                <span style={{color:"var(--text2)"}}> {n.text}</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8,marginTop:4}}>
                <span style={{fontSize:10,color:"var(--text3)"}}>{n.time}</span>
                <span style={{fontSize:12}}>{TYPE_ICONS[n.type] || '🔔'}</span>
                <span style={{fontSize:10,color:"var(--text3)",fontStyle:"italic"}}>{
                  n.type==='follow'?'Voir le profil →':
                  n.type==='message'?'Ouvrir la conversation →':
                  n.type==='purchase'||n.type==='rent'?'Voir le wallet →':
                  n.type==='tip'||n.type==='transfer'?'Voir le wallet →':
                  n.type==='ticket'?'Voir les événements →':
                  n.type==='comment'||n.type==='like'?'Voir le contenu →':
                  ''
                }</span>
              </div>
            </div>
            {n.unread && <div style={{width:8,height:8,borderRadius:"50%",background:"var(--gold)",flexShrink:0,marginTop:4}}/>}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{padding:"12px 16px",borderTop:"1px solid var(--border)",flexShrink:0}}>
        <button onClick={() => {setPage('feed');onClose()}} style={{width:"100%",padding:"10px",borderRadius:8,border:"1px solid var(--border)",background:"var(--card)",color:"var(--text2)",fontSize:12,fontWeight:600,cursor:"pointer"}}>Voir toute l'activité →</button>
      </div>
    </div>
  </>
}
