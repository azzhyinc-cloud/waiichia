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
      {/* Desktop sidebar - visible > 768px */}
      <div className="sidebar-desktop">
        <Sidebar />
      </div>

      {/* Mobile sidebar drawer */}
      <div className={`sidebar-drawer ${menuOpen ? 'open' : ''}`}>
        <Sidebar onClose={() => setMenuOpen(false)} />
      </div>
      {menuOpen && <div className="drawer-overlay" onClick={() => setMenuOpen(false)} />}

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
