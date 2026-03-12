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
import Karaoke  from './pages/Karaoke.jsx'

const Placeholder = ({ title, icon }) => (
  <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
    height:'60vh',gap:16,color:'var(--text2)'}}>
    <div style={{fontSize:64}}>{icon}</div>
    <h2 style={{fontFamily:'Syne,sans-serif',fontSize:24,color:'var(--text)'}}>{title}</h2>
    <p style={{fontSize:14}}>Cette section arrive bientot</p>
  </div>
)

const PAGES = {
  home:         <Home />,
  trending:     <Trending />,
  radio:        <Radio />,
  feed:         <Feed />,
  music:        <Music />,
  podcast:      <Podcasts />,
  albums:       <Albums />,
  events:       <Events />,
  create_event: <CreateEvent />,
  wallet:       <Wallet />,
  dashboard:    <Dashboard />,
  my_events:    <MyEvents />,
  my_content:   <MyContent />,
  settings:     <Settings />,
  regie:        <Regie />,
  shop:         <Shop />,
  shop_mine:    <MyShop />,
  creators:     <Creators />,
  upload:       <Upload />,
  admin:        <Admin />,
  messages:     <Messagerie />,
  karaoke:      <Karaoke />,
  emission:     <Emission />,
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
