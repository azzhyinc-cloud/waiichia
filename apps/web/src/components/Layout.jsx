import { useState } from 'react'
import Sidebar   from './Sidebar.jsx'
import TopNav    from './TopNav.jsx'
import RightPanel from './RightPanel.jsx'
import Player    from './Player.jsx'
import BottomNav from './BottomNav.jsx'

export default function Layout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      {/* Overlay sombre quand menu ouvert sur mobile */}
      {menuOpen && <div className="mobile-overlay" onClick={() => setMenuOpen(false)} />}

      {/* Sidebar — glisse depuis la gauche sur mobile */}
      <div className={`sidebar-mobile-wrap ${menuOpen ? 'open' : ''}`}>
        <Sidebar onClose={() => setMenuOpen(false)} />
      </div>

      <div className="app-layout">
        <TopNav onMenuToggle={() => setMenuOpen(o => !o)} />
        <div id="waiichia-layout-main" className="page-content">
          {children}
        </div>
      </div>
      <RightPanel />
      <Player />
      <BottomNav />
    </>
  )
}
