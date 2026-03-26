import { useEffect, lazy, Suspense } from 'react'
import { useThemeStore, useAuthStore, usePageStore } from './stores/index.js'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'

const Login = lazy(() => import('./pages/Login.jsx'))
const Register = lazy(() => import('./pages/Register.jsx'))
const Profile = lazy(() => import('./pages/Profile.jsx'))
const Shop = lazy(() => import('./pages/Shop.jsx'))
const MyShop = lazy(() => import('./pages/MyShop.jsx'))
const Upload = lazy(() => import('./pages/Upload.jsx'))
const Trending = lazy(() => import('./pages/Trending.jsx'))
const Feed = lazy(() => import('./pages/Feed.jsx'))
const Music = lazy(() => import('./pages/Music.jsx'))
const Creators = lazy(() => import('./pages/Creators.jsx'))
const Podcasts = lazy(() => import('./pages/Podcasts.jsx'))
const Albums = lazy(() => import('./pages/Albums.jsx'))
const Radio = lazy(() => import('./pages/Radio.jsx'))
const Events = lazy(() => import('./pages/Events.jsx'))
const CreateEvent = lazy(() => import('./pages/CreateEvent.jsx'))
const Wallet = lazy(() => import('./pages/Wallet.jsx'))
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))
const MyEvents = lazy(() => import('./pages/MyEvents.jsx'))
const MyContent = lazy(() => import('./pages/MyContent.jsx'))
const Settings = lazy(() => import('./pages/Settings.jsx'))
const Regie = lazy(() => import('./pages/Regie.jsx'))
const Admin = lazy(() => import('./pages/Admin.jsx'))
const Messagerie = lazy(() => import('./pages/Messagerie.jsx'))
const Emission = lazy(() => import('./pages/Emission.jsx'))
const Karaoke = lazy(() => import('./pages/Karaoke.jsx'))

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

const Loading = () => <div style={{display:'flex',alignItems:'center',justifyContent:'center',padding:60,color:'var(--text3)'}}><div style={{textAlign:'center'}}><div style={{fontSize:32,marginBottom:8,animation:'pulse-glow 1.5s infinite'}}>🎵</div><div style={{fontSize:13}}>Chargement...</div></div></div>

export default function App() {
  const { init: initTheme } = useThemeStore()
  const { loadMe, user } = useAuthStore()
  const { currentPage, profileUsername } = usePageStore()
  useEffect(() => { initTheme(); loadMe() }, [])
  if (currentPage === 'login')    return <Suspense fallback={<Loading/>}><Login /></Suspense>
  if (currentPage === 'register') return <Suspense fallback={<Loading/>}><Register /></Suspense>
  if (currentPage === 'profile') {
    const uname = profileUsername || user?.username
    return <Layout><Suspense fallback={<Loading/>}><Profile username={uname} /></Suspense></Layout>
  }
  return <Layout><Suspense fallback={<Loading/>}>{PAGES[currentPage] || PAGES.home}</Suspense></Layout>
}
