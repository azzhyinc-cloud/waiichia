import './index.css'
import Layout from './components/Layout.jsx'
import { usePageStore, useAuthStore } from './stores/index.js'

// Pages
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Profile from './pages/Profile.jsx'

// Pages placeholder
const Page = ({ title, icon }) => (
  <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'60vh',gap:16,color:'var(--text2)'}}>
    <div style={{fontSize:64}}>{icon}</div>
    <h2 style={{fontFamily:'Syne,sans-serif',fontSize:24,color:'var(--text)'}}>{title}</h2>
    <p style={{fontSize:14}}>Cette section est en cours de développement</p>
  </div>
)

const PAGES = {
  home:      <Home />,
  login:     <Login />,
  register:  <Register />,
  profile:   <Profile />,
  trending:  <Page title="Tendances" icon="🔥" />,
  radio:     <Page title="Radio Live" icon="📻" />,
  music:     <Page title="Musique" icon="🎵" />,
  albums:    <Page title="Albums" icon="💿" />,
  podcast:   <Page title="Podcasts" icon="🎙️" />,
  feed:      <Page title="Fil Social" icon="📱" />,
  upload:    <Page title="Publier un son" icon="⬆️" />,
  mycontent: <Page title="Mes sons" icon="🎼" />,
  myevents:  <Page title="Mes événements" icon="📅" />,
  myshop:    <Page title="Ma boutique" icon="🛍️" />,
  events:    <Page title="Événements" icon="🎪" />,
  shop:      <Page title="Boutique" icon="🛒" />,
  creators:  <Page title="Créateurs" icon="⭐" />,
  wallet:    <Page title="Wallet" icon="💰" />,
  messages:  <Page title="Messages" icon="💬" />,
  regie:     <Page title="Régie Publicitaire" icon="📊" />,
  settings:  <Page title="Paramètres" icon="⚙️" />,
  admin:     <Page title="Admin" icon="🛡️" />,
}

export default function App() {
  const { currentPage } = usePageStore()
  const { user } = useAuthStore()

  // Pages sans layout
  if (currentPage === 'login') return <Login />
  if (currentPage === 'register') return <Register />

  return (
    <Layout>
      {PAGES[currentPage] || <Home />}
    </Layout>
  )
}
