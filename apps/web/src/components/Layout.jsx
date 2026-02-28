import { useEffect } from 'react'
import { useThemeStore, useAuthStore, usePageStore } from '../stores/index.js'
import Player from './Player.jsx'
import Sidebar from './Sidebar.jsx'
import TopNav from './TopNav.jsx'

export default function Layout({ children }) {
  const { init } = useThemeStore()
  const { loadMe } = useAuthStore()

  useEffect(() => {
    init()
    loadMe()
  }, [])

  return (
    <div className="app-layout">
      <TopNav />
      <Sidebar />
      <main className="main-content">{children}</main>
      <aside className="right-panel" id="right-panel" />
      <Player />
    </div>
  )
}
