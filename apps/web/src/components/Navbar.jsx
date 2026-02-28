import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/index.js'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const nav = useNavigate()

  const handleLogout = () => { logout(); nav('/login') }

  return (
    <nav style={{background:'#111',borderBottom:'1px solid #222',padding:'12px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:100}}>
      <Link to="/" style={{textDecoration:'none',display:'flex',alignItems:'center',gap:8}}>
        <span style={{fontSize:24}}>🎵</span>
        <span style={{fontWeight:800,fontSize:20,color:'#e74c3c',letterSpacing:1}}>WAIICHIA</span>
      </Link>
      <div style={{display:'flex',alignItems:'center',gap:16}}>
        {user ? (
          <>
            <Link to={`/profile/${user.username}`} style={{color:'#fff',textDecoration:'none',fontSize:14}}>
              {user.display_name}
            </Link>
            <span style={{color:'#888',fontSize:13}}>💰 {user.wallet_balance?.toLocaleString()||0} KMF</span>
            <button onClick={handleLogout} style={{background:'#333',border:'none',color:'#fff',padding:'6px 14px',borderRadius:20,cursor:'pointer',fontSize:13}}>
              Déconnexion
            </button>
          </>
        ) : (
          <>
            <Link to="/login" style={{color:'#fff',textDecoration:'none',fontSize:14}}>Connexion</Link>
            <Link to="/register" style={{background:'#e74c3c',color:'#fff',textDecoration:'none',padding:'6px 16px',borderRadius:20,fontSize:14}}>
              S'inscrire
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}
