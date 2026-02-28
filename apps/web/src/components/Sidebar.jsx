import { usePageStore, useAuthStore } from '../stores/index.js'

const NAV = [
  { section: 'DÉCOUVRIR' },
  { id: 'home',     icon: '🏠', label: 'Accueil' },
  { id: 'trending', icon: '🔥', label: 'Tendances' },
  { id: 'radio',    icon: '📻', label: 'Radio Live' },
  { id: 'music',    icon: '🎵', label: 'Musique' },
  { id: 'albums',   icon: '💿', label: 'Albums' },
  { id: 'podcast',  icon: '🎙️', label: 'Podcasts' },
  { id: 'feed',     icon: '📱', label: 'Fil social' },
  { section: 'CRÉER' },
  { id: 'upload',   icon: '⬆️', label: 'Publier', auth: true },
  { id: 'mycontent',icon: '🎼', label: 'Mes sons', auth: true },
  { id: 'myevents', icon: '📅', label: 'Mes événements', auth: true },
  { id: 'myshop',   icon: '🛍️', label: 'Ma boutique', auth: true },
  { section: 'EXPLORER' },
  { id: 'events',   icon: '🎪', label: 'Événements' },
  { id: 'shop',     icon: '🛒', label: 'Boutique' },
  { id: 'creators', icon: '⭐', label: 'Créateurs' },
  { section: 'MON COMPTE' },
  { id: 'wallet',   icon: '💰', label: 'Wallet', auth: true },
  { id: 'messages', icon: '💬', label: 'Messages', auth: true },
  { id: 'regie',    icon: '📊', label: 'Régie pub', auth: true },
  { id: 'settings', icon: '⚙️', label: 'Paramètres' },
  { id: 'admin',    icon: '🛡️', label: 'Admin', auth: true },
]

export default function Sidebar() {
  const { currentPage, setPage } = usePageStore()
  const { user } = useAuthStore()

  return (
    <div className="sidebar">
      <div style={{padding:'8px 14px 20px'}}>
        <div className="logo">
          <span>WAIICHIA</span>
          <span>Stream. Connect. Vibrate Africa.</span>
        </div>
      </div>

      {NAV.map((item, i) => {
        if (item.section) return (
          <div key={i} className="nav-section-title">{item.section}</div>
        )
        if (item.auth && !user) return null
        return (
          <button key={item.id}
            className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
            onClick={() => setPage(item.id)}>
            <span className="icon">{item.icon}</span>
            {item.label}
          </button>
        )
      })}

      {user && (
        <div style={{marginTop:'auto',paddingTop:16,borderTop:'1px solid var(--border)'}}>
          <button className="nav-item" onClick={() => setPage('profile')}>
            <div style={{width:28,height:28,borderRadius:'50%',background:'var(--card2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14}}>
              {user.avatar_url ? <img src={user.avatar_url} style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}}/> : '👤'}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user.display_name}</div>
              <div style={{fontSize:11,color:'var(--text3)'}}>@{user.username}</div>
            </div>
          </button>
        </div>
      )}
    </div>
  )
}
