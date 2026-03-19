#!/bin/bash
# ═══════════════════════════════════════════════════════════
# WAIICHIA — CORRECTION GLOBALE DU DESIGN
# Coller tout ce script dans le terminal Codespace
# ═══════════════════════════════════════════════════════════

echo "🛑 Arrêt des serveurs..."
pkill -f "node.*index.js" 2>/dev/null
pkill -f "vite" 2>/dev/null
sleep 1

# ═══ 1. VÉRIFIER ET RENOMMER LE CSS ═══
cd /workspaces/waiichia/apps/web/src
if [ -f "prototype-styles.css" ] && [ ! -f "prototype-v7.css" ]; then
  mv prototype-styles.css prototype-v7.css
  echo "✅ CSS renommé → prototype-v7.css"
elif [ -f "prototype-v7.css" ]; then
  echo "✅ CSS déjà en place"
else
  echo "⚠️  Fichier CSS non trouvé ! Uploadez prototype-styles.css dans apps/web/src/"
fi

# ═══ 2. CORRIGER main.jsx (import CSS) ═══
cat > /workspaces/waiichia/apps/web/src/main.jsx << 'MAINEOF'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './prototype-v7.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
MAINEOF
echo "✅ main.jsx corrigé"

# ═══ 3. CORRIGER App.jsx (toutes les pages) ═══
cat > /workspaces/waiichia/apps/web/src/App.jsx << 'APPEOF'
import { useEffect } from 'react'
import { useThemeStore, useAuthStore, usePageStore } from './stores/index.js'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Profile from './pages/Profile.jsx'
import Shop from './pages/Shop.jsx'
import MyShop from './pages/MyShop.jsx'
import Upload from './pages/Upload.jsx'
import Trending from './pages/Trending.jsx'
import Feed from './pages/Feed.jsx'
import Music from './pages/Music.jsx'
import Creators from './pages/Creators.jsx'
import Podcasts from './pages/Podcasts.jsx'
import Albums from './pages/Albums.jsx'
import Radio from './pages/Radio.jsx'
import Events from './pages/Events.jsx'
import CreateEvent from './pages/CreateEvent.jsx'
import Wallet from './pages/Wallet.jsx'
import Dashboard from './pages/Dashboard.jsx'
import MyEvents from './pages/MyEvents.jsx'
import MyContent from './pages/MyContent.jsx'
import Settings from './pages/Settings.jsx'
import Regie from './pages/Regie.jsx'
import Admin from './pages/Admin.jsx'
import Messagerie from './pages/Messagerie.jsx'
import Emission from './pages/Emission.jsx'
import Karaoke from './pages/Karaoke.jsx'

const PAGES = {
  home:         <Home />,
  trending:     <Trending />,
  radio:        <Radio />,
  feed:         <Feed />,
  music:        <Music />,
  podcast:      <Podcasts />,
  emission:     <Emission />,
  albums:       <Albums />,
  events:       <Events />,
  create_event: <CreateEvent />,
  karaoke:      <Karaoke />,
  shop:         <Shop />,
  creators:     <Creators />,
  wallet:       <Wallet />,
  dashboard:    <Dashboard />,
  my_events:    <MyEvents />,
  my_content:   <MyContent />,
  settings:     <Settings />,
  regie:        <Regie />,
  shop_mine:    <MyShop />,
  upload:       <Upload />,
  admin:        <Admin />,
  messages:     <Messagerie />,
}

export default function App() {
  const { init: initTheme } = useThemeStore()
  const { loadMe, user } = useAuthStore()
  const { currentPage, profileUsername } = usePageStore()

  useEffect(() => { initTheme(); loadMe() }, [])

  if (currentPage === 'login')    return <Login />
  if (currentPage === 'register') return <Register />

  if (currentPage === 'profile') {
    const uname = profileUsername || user?.username
    return <Layout><Profile username={uname} /></Layout>
  }

  return <Layout>{PAGES[currentPage] || PAGES.home}</Layout>
}
APPEOF
echo "✅ App.jsx corrigé (toutes les pages liées)"

# ═══ 4. CORRIGER Sidebar.jsx (navigation complète) ═══
cat > /workspaces/waiichia/apps/web/src/components/Sidebar.jsx << 'SIDEEOF'
import { usePageStore, useAuthStore } from '../stores/index.js'

const NAV = [
  { section: 'Découvrir', items: [
    { id:'home',     icon:'🏠', label:'Accueil' },
    { id:'trending', icon:'🔥', label:'Tendances', badge:'HOT', badgeColor:'gold' },
    { id:'radio',    icon:'📻', label:'Radio & Live', live:true },
    { id:'feed',     icon:'⚡', label:'Mon Activité', badge:'8', badgeColor:'red' },
  ]},
  { section: 'Contenu', items: [
    { id:'music',    icon:'🎵', label:'Musique' },
    { id:'podcast',  icon:'🎙️', label:'Podcasts' },
    { id:'emission', icon:'📺', label:'Émissions' },
    { id:'albums',   icon:'💿', label:'Albums' },
  ]},
  { section: 'Communauté', items: [
    { id:'events',   icon:'🎪', label:'Événements' },
    { id:'karaoke',  icon:'🎤', label:'Karaoké / Duet', badge:'NEW', badgeColor:'purple' },
    { id:'shop',     icon:'🛍️', label:'Boutique' },
    { id:'creators', icon:'⭐', label:'Créateurs' },
  ]},
  { section: 'Mon Espace', items: [
    { id:'profile',    icon:'👤', label:'Mon Profil' },
    { id:'upload',     icon:'⬆️', label:'Publier' },
    { id:'messages',   icon:'💬', label:'Messagerie', badge:'3', badgeColor:'blue' },
    { id:'wallet',     icon:'💰', label:'Mon Portefeuille' },
    { id:'my_content', icon:'📚', label:'Mon Contenu' },
    { id:'my_events',  icon:'🎟️', label:'Mes Événements' },
    { id:'shop_mine',  icon:'🏪', label:'Ma Boutique' },
    { id:'dashboard',  icon:'📊', label:'Compte Commercial' },
    { id:'settings',   icon:'⚙️', label:'Paramètres' },
    { id:'regie',      icon:'📢', label:'Régie Publicitaire', badge:'PRO', badgeColor:'gold' },
    { id:'admin',      icon:'🛡️', label:'Administration', adminOnly:true, badge:'ADMIN', badgeColor:'red' },
  ]},
]

function NavItem({ item, currentPage, setPage, user }) {
  if (item.adminOnly && (!user || (user.role !== 'superadmin' && user.role !== 'admin'))) return null
  return (
    <button
      className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
      onClick={() => setPage(item.id)}
    >
      <div className="nav-icon">{item.icon}</div>
      {item.label}
      {item.badge && <span className={`badge-nav badge-${item.badgeColor}`}>{item.badge}</span>}
      {item.live && <div className="live-dot" />}
    </button>
  )
}

export default function Sidebar() {
  const { currentPage, setPage } = usePageStore()
  const { user } = useAuthStore()
  return (
    <aside className="sidebar" id="waiichia-sidebar">
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
              <NavItem key={item.id} item={item} currentPage={currentPage} setPage={setPage} user={user} />
            ))}
          </div>
        ))}
      </nav>
      {user && (
        <div style={{padding:'12px 16px',borderTop:'1px solid var(--border)',display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:36,height:36,borderRadius:'50%',background:'linear-gradient(135deg,var(--gold),var(--kente2))',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:13,color:'#000',flexShrink:0,overflow:'hidden'}}>
            {user.avatar_url
              ? <img src={user.avatar_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
              : (user.display_name||user.username||'U')[0].toUpperCase()
            }
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
SIDEEOF
echo "✅ Sidebar.jsx corrigé (Émissions + Boutique + Communauté)"

# ═══ 5. CORRIGER Home.jsx — liens "Voir tout" + bug API + boutons login ═══
cd /workspaces/waiichia/apps/web/src/pages

# Ajouter import usePageStore
sed -i 's|import { useAuthStore }|import { useAuthStore, usePageStore }|' Home.jsx

# Ajouter le hook setPage dans le composant Home
sed -i 's|const { user } = useAuthStore()|const { user } = useAuthStore()\n  const { setPage } = usePageStore()|' Home.jsx

# Corriger le bug API
sed -i "s|api.tracks?.list?.({ limit:8 })|api.tracks.list('?limit=8')|" Home.jsx

# Corriger les "Voir tout" — Tendances
sed -i '/<div className="section-title">🔥 Tendances<\/div>/{n;s|<span className="see-all">Voir tout →</span>|<span className="see-all" onClick={()=>setPage("trending")}>Voir tout →</span>|}' Home.jsx

# Corriger les "Voir tout" — Radio Live
sed -i 's|<span className="see-all" style={{marginLeft:'\''auto'\''}}>Voir tout →</span>|<span className="see-all" style={{marginLeft:"auto"}} onClick={()=>setPage("radio")}>Voir tout →</span>|' Home.jsx

# Corriger les "Voir tout" — Albums
sed -i '/<div className="section-title">💿 Albums récents<\/div>/{n;s|<span className="see-all">Voir tout →</span>|<span className="see-all" onClick={()=>setPage("albums")}>Voir tout →</span>|}' Home.jsx

# Corriger les "Voir tout" — Créateurs
sed -i '/<div className="section-title">⭐ Créateurs en Vue<\/div>/{n;s|<span className="see-all">Voir tout →</span>|<span className="see-all" onClick={()=>setPage("creators")}>Voir tout →</span>|}' Home.jsx

# Corriger les "Voir tout" — Événements
sed -i '/<div className="section-title">🎪 Événements<\/div>/{n;s|<span className="see-all">Voir tout →</span>|<span className="see-all" onClick={()=>setPage("events")}>Voir tout →</span>|}' Home.jsx

# Corriger boutons Connexion / Créer un compte
sed -i "s|<button className=\"btn btn-outline\">🔑 Connexion</button>|<button className=\"btn btn-outline\" onClick={()=>setPage('login')}>🔑 Connexion</button>|" Home.jsx
sed -i "s|<button className=\"btn btn-outline\" style={{borderColor:'var(--gold)',color:'var(--gold)'}}>✨ Créer un compte</button>|<button className=\"btn btn-outline\" style={{borderColor:'var(--gold)',color:'var(--gold)'}} onClick={()=>setPage('register')}>✨ Créer un compte</button>|" Home.jsx

# Corriger bouton Créer
sed -i "s|<button className=\"btn btn-secondary\">🎙️ Créer</button>|<button className=\"btn btn-secondary\" onClick={()=>setPage('upload')}>🎙️ Créer</button>|" Home.jsx

echo "✅ Home.jsx corrigé (liens Voir tout + boutons + API)"

# ═══ 6. CORRIGER RightPanel.jsx (stats compte + style) ═══
cat > /workspaces/waiichia/apps/web/src/components/RightPanel.jsx << 'RPEOF'
import { usePageStore, useAuthStore } from '../stores/index.js'

const TAGS = ['#twarab','#komori','#waiichia','#amapiano','#afrobeats','#moroni','#sebene']

export default function RightPanel() {
  const { setPage } = usePageStore()
  const { user } = useAuthStore()
  return (
    <aside className="right-panel">
      {/* PUB 1 */}
      <div className="ad-card">
        <div className="ad-label">Sponsorisé · 🇰🇲 Comores</div>
        <div className="ad-body" style={{background:'linear-gradient(135deg,#0a1800,#1a3a00)',height:110}}>
          <span style={{fontSize:28}}>🏦</span>
          <div style={{fontWeight:700,fontSize:13}}>Huri Money</div>
          <div style={{fontSize:11,color:'var(--text2)'}}>Paiements simples aux Comores</div>
          <button className="ad-cta" style={{background:'var(--gold)',color:'#000'}}>#126#</button>
        </div>
      </div>

      {/* MON COMPTE */}
      <div className="account-card">
        <div className="rp-section-title">Mon Compte</div>
        <div style={{display:'flex',flexDirection:'column',gap:7,fontSize:12}}>
          <div style={{display:'flex',justifyContent:'space-between'}}>
            <span style={{color:'var(--text2)'}}>Écoutes ce mois</span>
            <span style={{color:'var(--green)',fontFamily:'Space Mono,monospace'}}>+8.4K</span>
          </div>
          <div style={{display:'flex',justifyContent:'space-between'}}>
            <span style={{color:'var(--text2)'}}>Revenus</span>
            <span style={{color:'var(--gold)',fontFamily:'Space Mono,monospace'}}>74 850 KMF</span>
          </div>
          <div style={{display:'flex',justifyContent:'space-between'}}>
            <span style={{color:'var(--text2)'}}>Nouveaux fans</span>
            <span style={{color:'var(--blue)',fontFamily:'Space Mono,monospace'}}>+124</span>
          </div>
        </div>
        <button className="btn btn-secondary btn-sm" style={{width:'100%',marginTop:10}} onClick={()=>setPage('dashboard')}>Dashboard →</button>
      </div>

      {/* PUB 2 */}
      <div className="ad-card">
        <div className="ad-label">Promotion · Artiste</div>
        <div className="ad-body" style={{background:'linear-gradient(135deg,#1a0a00,#3d2000)',height:110}}>
          <span style={{fontSize:28}}>🎙️</span>
          <div style={{fontWeight:700,fontSize:13}}>Studio Waiichia</div>
          <div style={{fontSize:11,color:'var(--text2)'}}>Enregistrez à Moroni</div>
          <button className="ad-cta" style={{background:'var(--red)',color:'#fff'}}>Réserver</button>
        </div>
      </div>

      {/* TAGS TENDANCES */}
      <div>
        <div className="rp-section-title">Tendances Tags</div>
        <div className="tags-wrap">
          {TAGS.map(tag => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>
      </div>
    </aside>
  )
}
RPEOF
echo "✅ RightPanel.jsx corrigé (stats + 2 pubs + tags)"

# ═══ 7. AJOUTER badge-purple dans index.css ═══
if ! grep -q "badge-purple" /workspaces/waiichia/apps/web/src/index.css; then
  echo '.badge-purple{background:var(--purple);color:#fff;}' >> /workspaces/waiichia/apps/web/src/index.css
  echo ".type-emission{background:rgba(77,159,255,.9);color:#fff;}" >> /workspaces/waiichia/apps/web/src/index.css
  echo "✅ badge-purple + type-emission ajoutés au CSS"
fi

# ═══ 8. RELANCER ═══
echo ""
echo "🚀 Relancement des serveurs..."
cd /workspaces/waiichia
pnpm --filter api run dev &
sleep 3
pnpm --filter web run dev
