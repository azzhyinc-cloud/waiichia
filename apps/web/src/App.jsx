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
const PlaylistsPage = lazy(() => import('./pages/PlaylistsPage.jsx'))
const Reports = lazy(() => import('./pages/Reports.jsx'))
const Explore = lazy(() => import('./pages/Explore.jsx'))

const PAGES = {
  home:         <Home />,
  trending:     <Trending />,
  radio:        <Radio />,
  feed:         <Feed />,
  explore:      <Explore />,
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
  playlists:    <PlaylistsPage />,
  reports:      <Reports />,
}

class ChunkErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, errorMsg: '' } }
  static getDerivedStateFromError(error) { return { hasError: true, errorMsg: error?.message || 'Erreur inconnue' } }
  componentDidCatch(error) {
    if (error?.message?.includes('dynamically imported module') || error?.message?.includes('Loading chunk') || error?.message?.includes('Failed to fetch')) {
      const key = 'waiichia_chunk_reload'
      const last = parseInt(sessionStorage.getItem(key) || '0')
      if (Date.now() - last > 30000) {
        sessionStorage.setItem(key, Date.now())
        window.location.reload()
      }
    }
    console.error('[ErrorBoundary]', error)
  }
  render() {
    if (this.state.hasError) return (
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'var(--bg)',padding:20}}>
        <div style={{textAlign:'center',maxWidth:400}}>
          <div style={{fontSize:32,marginBottom:12}}>⚠️</div>
          <div style={{fontSize:15,fontWeight:700,marginBottom:8}}>Une erreur est survenue</div>
          <div style={{fontSize:11,color:'var(--text3)',marginBottom:20,wordBreak:'break-all',background:'var(--card)',padding:12,borderRadius:8,border:'1px solid var(--border)'}}>{this.state.errorMsg}</div>
          <div style={{display:'flex',gap:10,justifyContent:'center'}}>
            <button onClick={()=>this.setState({hasError:false,errorMsg:''})} style={{padding:'8px 20px',borderRadius:8,border:'1px solid var(--border)',background:'var(--card)',color:'var(--text)',fontWeight:600,cursor:'pointer'}}>← Retour</button>
            <button onClick={()=>window.location.reload()} style={{padding:'8px 20px',borderRadius:8,border:'1px solid var(--gold)',background:'var(--gold)',color:'#000',fontWeight:700,cursor:'pointer'}}>Actualiser</button>
          </div>
        </div>
      </div>
    )
    return this.props.children
  }
}

const Loading = () => <div style={{display:'flex',alignItems:'center',justifyContent:'center',padding:60,color:'var(--text3)'}}><div style={{textAlign:'center'}}><div style={{fontSize:32,marginBottom:8,animation:'pulse-glow 1.5s infinite'}}>🎵</div><div style={{fontSize:13}}>Chargement...</div></div></div>

const VALID_PAGES = new Set(['home','trending','radio','feed','music','podcast','emission','albums','events','create_event','karaoke','shop','creators','wallet','dashboard','my_events','my_content','settings','regie','shop_mine','upload','admin','messages','playlists','reports','explore','profile'])

function navigateFromUrlParams(url, setPage) {
  try {
    const queryString = url.includes('?') ? url.split('?')[1] : ''
    const params = new URLSearchParams(queryString)
    const pageParam = params.get('page')
    if (pageParam && VALID_PAGES.has(pageParam)) {
      if (pageParam === 'profile' && params.get('u')) {
        setPage('profile', { profileUsername: params.get('u') })
      } else {
        setPage(pageParam)
      }
      if (params.get('recording')) {
        try { sessionStorage.setItem('focus_recording_id', params.get('recording')) } catch(e){}
      }
      return
    }
    if (params.get('u'))             setPage('profile', { profileUsername: params.get('u') })
    else if (params.get('play'))     setPage('music')
    else if (params.get('album'))    setPage('albums')
    else if (params.get('event'))    setPage('events')
    else if (params.get('playlist')) setPage('playlists')
    else if (url.includes('/messages')) setPage('messages')
    else if (url.includes('/wallet'))   setPage('wallet')
    else if (url.includes('/karaoke'))  setPage('karaoke')
    else if (url.includes('/reports'))  setPage('reports')
    else                                setPage('feed')
  } catch (e) {
    console.error('[push-click] Erreur parsing URL:', e)
  }
}

export default function App() {
  const { init: initTheme } = useThemeStore()
  const { loadMe, user } = useAuthStore()
  const { currentPage, profileUsername, setPage } = usePageStore()
  useEffect(() => { initTheme(); loadMe() }, [])
  useEffect(() => { const params = new URLSearchParams(window.location.search); if (params.get("u")) setTimeout(() => setPage("profile", { profileUsername: params.get("u") }), 100); else if (params.get("play")) setTimeout(() => setPage("music"), 100); else if (params.get("album")) setTimeout(() => setPage("albums"), 100); else if (params.get("event")) setTimeout(() => setPage("events"), 100); else if (params.get("playlist")) setTimeout(() => setPage("playlists"), 100); else if (params.get("page")) { setTimeout(() => { navigateFromUrlParams(window.location.search, setPage) }, 100) } }, [])

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    const handler = (event) => {
      if (event.data?.type === 'PUSH_NOTIFICATION_CLICK') {
        const url = event.data.url || '/'
        console.log('[App] 👆 Clic push reçu, URL:', url)
        navigateFromUrlParams(url, setPage)
      }
    }
    navigator.serviceWorker.addEventListener('message', handler)
    return () => navigator.serviceWorker.removeEventListener('message', handler)
  }, [setPage])

  if (currentPage === 'login')    return <ChunkErrorBoundary><Suspense fallback={<Loading/>}><Login /></Suspense></ChunkErrorBoundary>
  if (currentPage === 'register') return <ChunkErrorBoundary><Suspense fallback={<Loading/>}><Register /></Suspense></ChunkErrorBoundary>
  if (currentPage === 'profile') {
    const uname = profileUsername || user?.username
    return <Layout><ChunkErrorBoundary><Suspense fallback={<Loading/>}><Profile username={uname} /></Suspense></ChunkErrorBoundary></Layout>
  }
  return <Layout><ChunkErrorBoundary><Suspense fallback={<Loading/>}>{PAGES[currentPage] || PAGES.home}</Suspense></ChunkErrorBoundary></Layout>
}
