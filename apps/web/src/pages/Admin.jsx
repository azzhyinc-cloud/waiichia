import { useState, useEffect } from 'react'
import { useAuthStore, usePageStore } from '../stores/index.js'

const API = import.meta.env.VITE_API_URL

function StatBox({ label, value, color }) {
  return (
    <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:12,padding:'20px 24px',flex:1,minWidth:140}}>
      <div style={{fontSize:28,fontWeight:800,color:color||'var(--text)'}}>{value}</div>
      <div style={{fontSize:13,color:'var(--text2)',marginTop:4}}>{label}</div>
    </div>
  )
}

export default function Admin() {
  const { user } = useAuthStore()
  const { setPage } = usePageStore()
  const [tab, setTab] = useState('dashboard')
  const [profiles, setProfiles] = useState([])
  const [tracks, setTracks] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const token = localStorage.getItem('waiichia_token')

  const headers = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }

  useEffect(() => {
    if (!user || user.role !== 'superadmin') return
    Promise.all([
      fetch(API + '/api/profiles/?limit=100').then(r=>r.json()),
      fetch(API + '/api/tracks/?limit=100').then(r=>r.json()),
    ]).then(([p, t]) => {
      setProfiles(p.profiles || [])
      setTracks(t.tracks || [])
      setStats({
        totalProfiles: p.profiles?.length || 0,
        totalTracks: t.tracks?.length || 0,
        totalPlays: t.tracks?.reduce((a,t)=>a+(t.play_count||0),0) || 0,
        artists: p.profiles?.filter(p=>p.profile_type==='artist').length || 0,
      })
      setLoading(false)
    })
  }, [user])

  const updateRole = async (username, role) => {
    await fetch(API + '/api/profiles/me', { method: 'PATCH', headers, body: JSON.stringify({ role }) })
    setProfiles(ps => ps.map(p => p.username === username ? {...p, role} : p))
  }

  const deleteTrack = async (id) => {
    if (!confirm('Supprimer ce son ?')) return
    await fetch(API + '/api/tracks/' + id, { method: 'DELETE', headers })
    setTracks(ts => ts.filter(t => t.id !== id))
  }

  if (!user) return <div style={{textAlign:'center',padding:60}}><h2>Non connecte</h2></div>
  if (user.role !== 'superadmin') return (
    <div style={{textAlign:'center',padding:60}}>
      <div style={{fontSize:48,marginBottom:16}}>🔒</div>
      <h2>Acces refuse</h2>
      <p style={{color:'var(--text2)'}}>Cette page est reservee aux administrateurs</p>
    </div>
  )

  const tabs = [
    {id:'dashboard', label:'Dashboard'},
    {id:'users', label:'Utilisateurs'},
    {id:'tracks', label:'Sons'},
    {id:'ads', label:'Publicites'},
  ]

  const tabStyle = (id) => ({
    padding:'8px 18px', borderRadius:8, border:'none', cursor:'pointer', fontWeight:600, fontSize:13,
    background: tab===id ? 'var(--primary)' : 'var(--card)',
    color: tab===id ? '#fff' : 'var(--text2)',
  })

  return (
    <div style={{maxWidth:1000,margin:'0 auto',padding:'24px 20px 100px'}}>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:24}}>
        <div style={{fontSize:32}}>⚙️</div>
        <div>
          <h1 style={{margin:0,fontSize:22,fontWeight:800}}>Dashboard Admin</h1>
          <p style={{margin:0,fontSize:13,color:'var(--text2)'}}>Waiichia SuperAdmin Panel</p>
        </div>
      </div>

      <div style={{display:'flex',gap:8,marginBottom:24,flexWrap:'wrap'}}>
        {tabs.map(t => <button key={t.id} style={tabStyle(t.id)} onClick={()=>setTab(t.id)}>{t.label}</button>)}
      </div>

      {tab === 'dashboard' && (
        <div>
          <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:24}}>
            <StatBox label="Profils total" value={stats.totalProfiles} color="var(--gold)"/>
            <StatBox label="Artistes" value={stats.artists} color="var(--primary)"/>
            <StatBox label="Sons publies" value={stats.totalTracks} color="var(--green)"/>
            <StatBox label="Ecoutes totales" value={(stats.totalPlays||0) > 1000 ? ((stats.totalPlays/1000).toFixed(1)+'K') : stats.totalPlays} color="var(--blue)"/>
          </div>
          <div style={{background:'var(--card)',borderRadius:12,padding:20,border:'1px solid var(--border)'}}>
            <h3 style={{margin:'0 0 16px'}}>Sons recents</h3>
            {tracks.slice(0,5).map(t => (
              <div key={t.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid var(--border)'}}>
                <div>
                  <div style={{fontWeight:600,fontSize:14}}>{t.title}</div>
                  <div style={{fontSize:12,color:'var(--text2)'}}>{t.genre} · {t.play_count} ecoutes</div>
                </div>
                <div style={{fontSize:12,color:t.access_type==='free'?'var(--green)':'var(--gold)',fontWeight:600}}>
                  {t.access_type === 'free' ? 'Gratuit' : (t.sale_price||0).toLocaleString() + ' KMF'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div style={{background:'var(--card)',borderRadius:12,border:'1px solid var(--border)',overflow:'hidden'}}>
          <div style={{padding:'16px 20px',borderBottom:'1px solid var(--border)',fontWeight:700}}>
            Utilisateurs ({profiles.length})
          </div>
          {profiles.map(p => (
            <div key={p.id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 20px',borderBottom:'1px solid var(--border)'}}>
              <div style={{width:36,height:36,borderRadius:'50%',background:'var(--card2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>
                {p.avatar_url ? <img src={p.avatar_url} style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%'}}/> : '👤'}
              </div>
              <div style={{flex:1}}>
                <div style={{fontWeight:600,fontSize:14}}>{p.display_name}</div>
                <div style={{fontSize:12,color:'var(--text2)'}}>@{p.username} · {p.profile_type}</div>
              </div>
              <div style={{fontSize:11,padding:'3px 10px',borderRadius:99,background:p.role==='superadmin'?'var(--primary)':'var(--card2)',color:p.role==='superadmin'?'#fff':'var(--text2)',fontWeight:600}}>
                {p.role || 'user'}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'tracks' && (
        <div style={{background:'var(--card)',borderRadius:12,border:'1px solid var(--border)',overflow:'hidden'}}>
          <div style={{padding:'16px 20px',borderBottom:'1px solid var(--border)',fontWeight:700}}>
            Sons ({tracks.length})
          </div>
          {tracks.map(t => (
            <div key={t.id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 20px',borderBottom:'1px solid var(--border)'}}>
              <div style={{width:40,height:40,borderRadius:6,background:'var(--card2)',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center'}}>
                {t.cover_url ? <img src={t.cover_url} style={{width:'100%',height:'100%',objectFit:'cover'}}/> : '🎵'}
              </div>
              <div style={{flex:1}}>
                <div style={{fontWeight:600,fontSize:14}}>{t.title}</div>
                <div style={{fontSize:12,color:'var(--text2)'}}>{t.genre} · {t.play_count} ecoutes · {t.access_type}</div>
              </div>
              <button onClick={()=>deleteTrack(t.id)}
                style={{background:'#2d0000',border:'1px solid #e74c3c',color:'#e74c3c',borderRadius:6,padding:'4px 12px',cursor:'pointer',fontSize:12}}>
                Supprimer
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'ads' && (
        <div style={{background:'var(--card)',borderRadius:12,padding:24,border:'1px solid var(--border)',textAlign:'center'}}>
          <div style={{fontSize:48,marginBottom:16}}>📢</div>
          <h3>Regie Publicitaire</h3>
          <p style={{color:'var(--text2)'}}>Gestion des campagnes publicitaires — En cours de developpement</p>
        </div>
      )}
    </div>
  )
}
