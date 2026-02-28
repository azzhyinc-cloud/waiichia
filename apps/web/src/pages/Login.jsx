import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/index.js'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const { login, loading, error } = useAuthStore()
  const nav = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    try { await login(form.email, form.password); nav('/') }
    catch {}
  }

  return (
    <div style={{minHeight:'100vh',background:'#0a0a0a',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:'#111',padding:40,borderRadius:16,width:'100%',maxWidth:400,border:'1px solid #222'}}>
        <div style={{textAlign:'center',marginBottom:32}}>
          <div style={{fontSize:40}}>🎵</div>
          <h1 style={{color:'#e74c3c',margin:'8px 0 4px',fontSize:28}}>WAIICHIA</h1>
          <p style={{color:'#888',fontSize:14}}>Connexion à votre compte</p>
        </div>
        {error && <div style={{background:'#2d1a1a',border:'1px solid #e74c3c',borderRadius:8,padding:'10px 14px',marginBottom:16,color:'#ff6b6b',fontSize:13}}>{error}</div>}
        <form onSubmit={submit}>
          <input value={form.email} onChange={e=>setForm({...form,email:e.target.value})}
            placeholder="Email" type="email" required
            style={{width:'100%',background:'#1a1a1a',border:'1px solid #333',borderRadius:8,padding:'12px 14px',color:'#fff',fontSize:14,marginBottom:12,boxSizing:'border-box'}}/>
          <input value={form.password} onChange={e=>setForm({...form,password:e.target.value})}
            placeholder="Mot de passe" type="password" required
            style={{width:'100%',background:'#1a1a1a',border:'1px solid #333',borderRadius:8,padding:'12px 14px',color:'#fff',fontSize:14,marginBottom:20,boxSizing:'border-box'}}/>
          <button type="submit" disabled={loading}
            style={{width:'100%',background:'#e74c3c',border:'none',color:'#fff',padding:'13px',borderRadius:8,fontSize:16,fontWeight:600,cursor:'pointer'}}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
        <p style={{textAlign:'center',marginTop:20,color:'#888',fontSize:13}}>
          Pas encore de compte ? <Link to="/register" style={{color:'#e74c3c'}}>S'inscrire</Link>
        </p>
      </div>
    </div>
  )
}
