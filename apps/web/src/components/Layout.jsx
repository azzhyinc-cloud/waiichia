import Sidebar from './Sidebar.jsx'
import TopNav from './TopNav.jsx'
import RightPanel from './RightPanel.jsx'
import Player from './Player.jsx'

export default function Layout({ children }) {
  return (
    <>
      <Sidebar />
      <div className="app-layout">
        <TopNav />
        <div className="page-content">{children}</div>
      </div>
      <RightPanel />
      <Player />
    </>
  )
}
