import { useEffect } from 'react'
import { useThemeStore, useAuthStore, usePageStore } from './stores/index.js'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Profile from './pages/Profile.jsx'
import Upload from './pages/Upload.jsx'

const Placeholder = ({ title, icon }) => (
  <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'60vh',gap:16,color:'var(--text2)'}}>
    <div style={{fontSize:64}}>{icon}</div>
    <h2 style={{fontFamily:'Syne,sans-serif',fontSize:24,color:'var(--text)'}}>{title}</h2>
    <p style={{fontSize:14}}>Cette section est en cours de developpement</p>
  </div>
)

const PAGES = {
  home:     <Home />,
  trending: <Placeholder title='Tendances' icon='X' />,
  radio:    <Placeholder title='Radio et Live' icon='X' />,
  feed:     <Placeholder title='Fil social' icon='X' />,
  music:    <Placeholder title='Musique' icon='X' />,
  podcast:  <Placeholder title='Podcasts' icon='X' />,
  albums:   <Placeholder title='Albums' icon='X' />,
  events:   <Placeholder title='Evenements' icon='X' />,
  shop:     <Placeholder title='Boutique' icon='X' />,
  creators: <Placeholder title='Createurs' icon='X' />,
  upload:   <Upload />,
  messages: <Placeholder title='Messagerie' icon='X' />,
  wallet:   <Placeholder title='Portefeuille' icon='X' />,
  settings: <Placeholder title='Parametres' icon='X' />,
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
    if (!uname) return <Layout><Placeholder title='Connectez-vous' icon='X' /></Layout>
    return <Layout><Profile username={uname} /></Layout>
  }

  return <Layout>{PAGES[currentPage] || PAGES.home}</Layout>
}