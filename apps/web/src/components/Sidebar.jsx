import { usePageStore, useAuthStore } from '../stores/index.js'

const NAV = [
  { section: 'Découvrir', items: [
    { id:'home',     icon:'🏠', label:'Accueil' },
    { id:'trending', icon:'🔥', label:'Tendances', badge:'HOT', badgeColor:'gold' },
    { id:'radio',    icon:'📻', label:'Radio & Live', live:true },
    { id:'feed',     icon:'⚡', label:'Mon Activité', badge:'8', badgeColor:'red' },
  ]},
  { section: 'Contenu', items: [
    { id:'music',   icon:'🎵', label:'Musique' },
    { id:'podcast', icon:'🎙️', label:'Podcasts' },
    { id:'albums',  icon:'💿', label:'Albums' },
  ]},
  { section: 'Communauté', items: [
    { id:'events',   icon:'🎪', label:'Événements' },
    { id:'shop',     icon:'🛍️', label:'Boutique' },
    { id:'creators', icon:'⭐', label:'Créateurs' },
  ]},
  { section: 'Mon Espace', items: [
    { id:'profile',  icon:'👤', label:'Mon Profil' },
    { id:'upload',   icon:'⬆️', label:'Publier' },
    { id:'messages', icon:'💬', label:'Messagerie', badge:'3', badgeColor:'blue' },
    { id:'wallet',   icon:'💰', label:'Mon Portefeuille' },
    { id:'settings', icon:'⚙️', label:'Paramètres' },
  ]},
]

export default function Sidebar() {
  const { currentPage, setPage } = usePageStore()
  const { user } = useAuthStore()

  return (
    <aside className="sidebar">
      <div className="logo-wrap">
        <div className="logo" onClick={() => setPage('home')}>Waiichia</div>
        <div className="logo-country">🇰🇲 Comores · La plateforme africaine</div>
        <div className="kente-stripe" />
      </div>

      <nav style={{flex:1,paddingBottom:20}}>
        {NAV.map(({ section, items }) => (
          <div className="nav-section" key={section}>
            <div className="nav-label">{section}</div>
            {items.map(item => (
              <button
                key={item.id}
                className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
                onClick={() => setPage(item.id)}
              >
                <div className="nav-icon">{item.icon}</div>
                {item.label}
                {item.badge && (
                  <span className={`badge-nav badge-${item.badgeColor}`}>{item.badge}</span>
                )}
                {item.live && <div className="live-dot" />}
              </button>
            ))}
          </div>
        ))}
      </nav>

      {user && (
        <div style={{padding:'12px 16px',borderTop:'1px solid var(--border)',display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:36,height:36,borderRadius:'50%',background:'linear-gradient(135deg,var(--gold),var(--kente2))',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:13,color:'#000',flexShrink:0}}>
            {(user.display_name||user.username||'U')[0].toUpperCase()}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:600,fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user.display_name||user.username}</div>
            <div style={{fontSize:11,color:'var(--text3)'}}>@{user.username}</div>
          </div>
        </div>
      )}
    </aside>
  )
}
