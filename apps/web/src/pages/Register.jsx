import { useState } from 'react'
import { useAuthStore, usePageStore } from '../stores/index.js'

export default function Register() {
  const { register, loading } = useAuthStore()
  const { setPage } = usePageStore()
  const [form, setForm] = useState({ username:'', email:'', password:'', display_name:'' })
  const [error, setError] = useState('')

  const set = (k) => (e) => setForm(f => ({...f, [k]: e.target.value}))

  const handle = async (e) => {
    e.preventDefault()
    setError('')
    const res = await register(form.username, form.email, form.password, form.display_name)
    if (res.error) setError(res.error)
    else setPage('home')
  }

  return (
    <div style={{minHeight:'100vh',background:'var(--bg)',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{width:'100%',maxWidth:420,background:'var(--card)',border:'1px solid var(--border)',borderRadius:22,padding:36}}>
        <div style={{textAlign:'center',marginBottom:28}}>
          <div style={{fontFamily:"Syne,sans-serif",fontSize:32,fontWeight:800,background:'linear-gradient(135deg,#f5a623,#e63946)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',marginBottom:6}}>Waiichia</div>
          <div style={{fontSize:13,color:'var(--text2)'}}>Rejoins la plateforme africaine</div>
        </div>

        {error && (
          <div style={{background:'rgba(230,57,70,.12)',border:'1px solid rgba(230,57,70,.3)',borderRadius:10,padding:'10px 14px',fontSize:13,color:'#e63946',marginBottom:16}}>
            {error}
          </div>
        )}

        <form onSubmit={handle}>
          <div className="form-row">
            <div className="form-group">
              <label className="label">Nom affiché</label>
              <input className="input-field" value={form.display_name}
                onChange={set('display_name')} placeholder="Kolo Officiel" />
            </div>
            <div className="form-group">
              <label className="label">Nom utilisateur</label>
              <input className="input-field" value={form.username}
                onChange={set('username')} placeholder="kolo_km" required />
            </div>
          </div>
          <div className="form-group">
            <label className="label">Email</label>
            <input className="input-field" type="email" value={form.email}
              onChange={set('email')} placeholder="ton@email.com" required />
          </div>
          <div className="form-group">
            <label className="label">Mot de passe</label>
            <input className="input-field" type="password" value={form.password}
              onChange={set('password')} placeholder="••••••••" required minLength={6} />
          </div>
          <button type="submit" className="btn btn-primary" style={{width:'100%',padding:13,fontSize:14,marginTop:4}} disabled={loading}>
            {loading ? '⏳...' : '🌍 Créer mon compte'}
          </button>
        </form>

        <div style={{textAlign:'center',marginTop:20,fontSize:13,color:'var(--text2)'}}>
          Déjà un compte ?{' '}
          <span style={{color:'var(--gold)',cursor:'pointer',fontWeight:600}} onClick={() => setPage('login')}>
            Se connecter
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
