import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/index.js'

export default function Register() {
  const [form, setForm] = useState({ email:'', password:'', username:'', display_name:'', country:'KM' })
  const { register, loading, error } = useAuthStore()
  const nav = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    try { await register(form); nav('/login') }
    catch {}
  }

  const inp = (key, placeholder, type='text') => (
    <input value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})}
      placeholder={placeholder} type={type} required
      style={{width:'100%',background:'#1a1a1a',border:'1px solid #333',borderRadius:8,padding:'12px 14px',color:'#fff',fontSize:14,marginBottom:12,boxSizing:'border-box'}}/>
  )

  return (
    <div style={{minHeight:'100vh',background:'#0a0a0a',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{background:'#111',padding:40,borderRadius:16,width:'100%',maxWidth:420,border:'1px solid #222'}}>
        <div style={{textAlign:'center',marginBottom:28}}>
          <div style={{fontSize:40}}>🎵</div>
          <h1 style={{color:'#e74c3c',margin:'8px 0 4px'}}>Créer un compte</h1>
          <p style={{color:'#888',fontSize:14}}>Rejoins la communauté Waiichia</p>
        </div>
        {error && <div style={{background:'#2d1a1a',border:'1px solid #e74c3c',borderRadius:8,padding:'10px 14px',marginBottom:16,color:'#ff6b6b',fontSize:13}}>{error}</div>}
        <form onSubmit={submit}>
          {inp('display_name', 'Nom complet')}
          {inp('username', 'Nom d utilisateur')}
          {inp('email', 'Email', 'email')}
          {inp('password', 'Mot de passe (8+ car.)', 'password')}
          <select value={form.country} onChange={e=>setForm({...form,country:e.target.value})}
            style={{width:'100%',background:'#1a1a1a',border:'1px solid #333',borderRadius:8,padding:'12px 14px',color:'#fff',fontSize:14,marginBottom:20,boxSizing:'border-box'}}>
            <option value="KM">🇰🇲 Comores</option>
            <option value="MG">🇲🇬 Madagascar</option>
            <option value="TZ">🇹🇿 Tanzanie</option>
            <option value="CI">🇨🇮 Côte d Ivoire</option>
            <option value="SN">🇸🇳 Sénégal</option>
            <option value="FR">🇫🇷 France</option>
            <option value="RE">🇷🇪 La Réunion</option>
          </select>
          <button type="submit" disabled={loading}
            style={{width:'100%',background:'#e74c3c',border:'none',color:'#fff',padding:'13px',borderRadius:8,fontSize:16,fontWeight:600,cursor:'pointer'}}>
            {loading ? 'Création...' : 'Créer mon compte'}
          </button>
        </form>
        <p style={{textAlign:'center',marginTop:20,color:'#888',fontSize:13}}>
          Déjà un compte ? <Link to="/login" style={{color:'#e74c3c'}}>Se connecter</Link>
        </p>
      </div>
    </div>
  )
}
