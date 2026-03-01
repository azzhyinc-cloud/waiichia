import { useThemeStore, useAuthStore, usePageStore } from '../stores/index.js'

export default function TopNav() {
  const { theme, toggle: toggleTheme } = useThemeStore()
  const { user, logout } = useAuthStore()
  const { setPage } = usePageStore()

  return (
    <div className="topnav">
      <div className="search-bar">
        <span className="search-icon">🔍</span>
        <input placeholder="Rechercher sons, artistes, podcasts, albums..." />
      </div>

      <div className="topnav-right">
        <div className="theme-toggle" onClick={toggleTheme}>
          {theme === 'dark' ? '🌙' : '☀️'}
        </div>

        <div className="country-pill">
          <span>🇰🇲</span>
          <span>KM · KMF</span>
        </div>

        <div className="notif-btn">
          🔔
          <div className="notif-dot" />
        </div>

        {user ? (
          <>
            <div className="avatar-btn" onClick={() => setPage('profile')}>
              {(user.display_name||user.username||'U')[0].toUpperCase()}
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setPage('upload')}>+ Publier</button>
          </>
        ) : (
          <>
            <button className="btn btn-secondary btn-sm" onClick={() => setPage('login')}>Connexion</button>
            <button className="btn btn-primary btn-sm" onClick={() => setPage('register')}>S'inscrire</button>
          </>
        )}
      </div>
    </div>
  )
}
