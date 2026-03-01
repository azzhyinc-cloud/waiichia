import { useState } from 'react'
import { useAuthStore, usePageStore } from '../stores/index.js'

export default function Login() {
  const { login, loading } = useAuthStore()
  const { setPage } = usePageStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handle = async (e) => {
    e.preventDefault()
    setError('')
    const res = await login(email, password)
    if (res.error) setError(res.error)
    else setPage('home')
  }

  return (
    <div style={{minHeight:'100vh',background:'var(--bg)',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{width:'100%',maxWidth:400,background:'var(--card)',border:'1px solid var(--border)',borderRadius:22,padding:36}}>
        <div style={{textAlign:'center',marginBottom:28}}>
          <div style={{fontFamily:"Syne,sans-serif",fontSize:32,fontWeight:800,background:'linear-gradient(135deg,#f5a623,#e63946)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',marginBottom:6}}>Waiichia</div>
          <div style={{fontSize:13,color:'var(--text2)'}}>Connecte-toi pour continuer</div>
        </div>

        {error && (
          <div style={{background:'rgba(230,57,70,.12)',border:'1px solid rgba(230,57,70,.3)',borderRadius:10,padding:'10px 14px',fontSize:13,color:'#e63946',marginBottom:16}}>
            {error}
          </div>
        )}

        <form onSubmit={handle}>
          <div className="form-group">
            <label className="label">Email</label>
            <input className="input-field" type="email" value={email}
              onChange={e=>setEmail(e.target.value)} placeholder="ton@email.com" required />
          </div>
          <div className="form-group">
            <label className="label">Mot de passe</label>
            <input className="input-field" type="password" value={password}
              onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <button type="submit" className="btn btn-primary" style={{width:'100%',padding:13,fontSize:14,marginTop:4}} disabled={loading}>
            {loading ? '⏳ Connexion...' : '🚀 Se connecter'}
          </button>
        </form>

        <div style={{textAlign:'center',marginTop:20,fontSize:13,color:'var(--text2)'}}>
          Pas encore de compte ?{' '}
          <span style={{color:'var(--gold)',cursor:'pointer',fontWeight:600}} onClick={() => setPage('register')}>
            S'inscrire
          </span>
        </div>
        <div style={{textAlign:'center',marginTop:10}}>
          <span style={{color:'var(--text3)',fontSize:12,cursor:'pointer'}} onClick={() => setPage('home')}>
            ← Retour à l'accueil
          </span>
        </div>
      </div>
    </div>
  )
}
