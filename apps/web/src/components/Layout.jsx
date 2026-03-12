import Sidebar   from './Sidebar.jsx'
import TopNav    from './TopNav.jsx'
import RightPanel from './RightPanel.jsx'
import Player    from './Player.jsx'
import BottomNav from './BottomNav.jsx'

export default function Layout({ children }) {
  return (
    <>
      <Sidebar />
      <div className="app-layout">
        <TopNav />
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
