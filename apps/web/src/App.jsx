import React, { useEffect, lazy, Suspense } from 'react'
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
// ── AJOUT : page Playlists ──
const PlaylistsPage = lazy(() => import('./pages/PlaylistsPage.jsx'))

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
  // ── AJOUT : route playlists ──
  playlists:    <PlaylistsPage />,
}

class ChunkErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false } }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch(error) {
    if (error?.message?.includes('dynamically imported module') || error?.message?.includes('Loading chunk') || error?.message?.includes('Failed to fetch')) {
      window.location.reload()
    }
  }
  render() {
    if (this.state.hasError) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'var(--bg)'}}><div style={{textAlign:'center',color:'var(--text3)'}}><div style={{fontSize:32,marginBottom:12}}>🔄</div><div style={{fontSize:14,marginBottom:12}}>Mise à jour en cours...</div><button onClick={()=>window.location.reload()} style={{padding:'8px 20px',borderRadius:8,border:'1px solid var(--gold)',background:'var(--gold)',color:'#000',fontWeight:700,cursor:'pointer'}}>Actualiser</button></div></div>
    return this.props.children
  }
}

const Loading = () => <div style={{display:'flex',alignItems:'center',justifyContent:'center',padding:60,color:'var(--text3)'}}><div style={{textAlign:'center'}}><div style={{fontSize:32,marginBottom:8,animation:'pulse-glow 1.5s infinite'}}>🎵</div><div style={{fontSize:13}}>Chargement...</div></div></div>

export default function App() {
  const { init: initTheme } = useThemeStore()
  const { loadMe, user } = useAuthStore()
  const { currentPage, profileUsername, setPage } = usePageStore()
  useEffect(() => { initTheme(); loadMe() }, [])
  useEffect(() => { const params = new URLSearchParams(window.location.search); if (params.get("u")) setTimeout(() => setPage("profile", { profileUsername: params.get("u") }), 100); else if (params.get("play")) setTimeout(() => setPage("music"), 100); else if (params.get("album")) setTimeout(() => setPage("albums"), 100); else if (params.get("event")) setTimeout(() => setPage("events"), 100); else if (params.get("playlist")) setTimeout(() => setPage("playlists"), 100) }, [])
  if (currentPage === 'login')    return <ChunkErrorBoundary><Suspense fallback={<Loading/>}><Login /></Suspense></ChunkErrorBoundary>
  if (currentPage === 'register') return <ChunkErrorBoundary><Suspense fallback={<Loading/>}><Register /></Suspense></ChunkErrorBoundary>
  if (currentPage === 'profile') {
    const uname = profileUsername || user?.username
    return <Layout><ChunkErrorBoundary><Suspense fallback={<Loading/>}><Profile username={uname} /></Suspense></ChunkErrorBoundary></Layout>
  }
  return <Layout><ChunkErrorBoundary><Suspense fallback={<Loading/>}>{PAGES[currentPage] || PAGES.home}</Suspense></ChunkErrorBoundary></Layout>
}
