import { useThemeStore, useAuthStore, usePageStore } from '../stores/index.js'

export default function TopNav() {
  const { theme, toggle } = useThemeStore()
  const { user, logout } = useAuthStore()
  const { setPage } = usePageStore()

  return (
    <div className="topnav">
      <div className="search-bar">
        <span className="search-icon">🔍</span>
        <input placeholder="Rechercher sons, artistes, albums..." />
      </div>

      <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:12}}>
        <button onClick={toggle} className="btn btn-ghost btn-sm" style={{fontSize:18,padding:'6px 10px'}}>
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {user ? (
          <>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage('wallet')}>
              💰 {user.wallet_balance?.toLocaleString() || 0} KMF
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage('messages')}>
              💬
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage('settings')}>
              ⚙️
            </button>
            <button className="btn btn-outline btn-sm" onClick={logout}>
              Déconnexion
            </button>
          </>
        ) : (
          <>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage('login')}>
              Connexion
            </button>
            <button className="btn btn-gold btn-sm" onClick={() => setPage('register')}>
              S'inscrire
            </button>
          </>
        )}
      </div>
    </div>
  )
}
