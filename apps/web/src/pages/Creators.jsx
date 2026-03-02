import { useState, useEffect } from 'react'
import { usePageStore, useAuthStore } from '../stores/index.js'
import api from '../services/api.js'

const formatK = (n) => {
  if (!n) return '0'
  if (n >= 1000000) return (n/1000000).toFixed(1).replace('.0','') + 'M'
  if (n >= 1000) return (n/1000).toFixed(1).replace('.0','') + 'K'
  return n.toString()
}

const TYPES = [['all','Tous'],['artist','Artiste'],['media','Media'],['label','Label'],['influencer','Influenceur'],['entrepreneur','Entrepreneur'],['pro','Pro']]

const GRADIENTS = [
  'linear-gradient(135deg,#f5a623,#e74c3c)',
  'linear-gradient(135deg,#6c63ff,#3b82f6)',
  'linear-gradient(135deg,#a855f7,#6c63ff)',
  'linear-gradient(135deg,#10b981,#3b82f6)',
  'linear-gradient(135deg,#f97316,#ef4444)',
  'linear-gradient(135deg,#e11d48,#f97316)',
  'linear-gradient(135deg,#0ea5e9,#6c63ff)',
  'linear-gradient(135deg,#f59e0b,#10b981)',
]

const TYPE_LABELS = {
  artist: 'ARTISTE', media: 'MEDIA', label: 'LABEL',
  influencer: 'INFLUENCEUR', entrepreneur: 'ENTREPRENEUR', pro: 'PRO', listener: 'MEMBRE'
}

const FLAGS = { KM: '🇰🇲', FR: '🇫🇷', NG: '🇳🇬', SN: '🇸🇳', CI: '🇨🇮', CM: '🇨🇲', MA: '🇲🇦', TZ: '🇹🇿' }

export default function Creators() {
  const { setPage } = usePageStore()
  const { user } = useAuthStore()
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [type, setType] = useState('all')
  const [search, setSearch] = useState('')
  const [following, setFollowing] = useState({})

  useEffect(() => {
    setLoading(true)
    const q = new URLSearchParams()
    q.set('limit', '50')
    if (type !== 'all') q.set('type', type)
    if (search) q.set('search', search)
    fetch(import.meta.env.VITE_API_URL + '/api/profiles/?' + q.toString())
      .then(r => r.json())
      .then(d => { setProfiles(d.profiles || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [type, search])

  const handleFollow = async (e, username, idx) => {
    e.stopPropagation()
    if (!user) return setPage('login')
    try {
      if (following[username]) {
        await api.profiles.unfollow(username)
        setFollowing(f => ({...f, [username]: false}))
      } else {
        await api.profiles.follow(username)
        setFollowing(f => ({...f, [username]: true}))
      }
    } catch(err) {}
  }

  const initials = (p) => {
    const name = p.display_name || p.username || 'XX'
    return name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)
  }

  return (
    <div style={{padding:'24px 20px 100px'}}>
      <h1 style={{fontSize:28,fontWeight:900,margin:'0 0 20px'}}>Createurs Waiichia</h1>

      {/* FILTRES TYPE */}
      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
        {TYPES.map(([v,l]) => (
          <button key={v} onClick={() => setType(v)}
            style={{padding:'7px 18px',borderRadius:99,border:'1px solid var(--border)',cursor:'pointer',fontSize:13,fontWeight:600,
              background:type===v?'var(--gold)':'var(--card)',
              color:type===v?'#000':'var(--text2)'}}>
            {l}
          </button>
        ))}
      </div>

      {/* SEARCH + PAYS */}
      <div style={{display:'flex',gap:10,marginBottom:24}}>
        <div style={{position:'relative',flex:1}}>
          <span style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--text3)'}}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Rechercher un createur..."
            style={{width:'100%',background:'var(--card)',border:'1px solid var(--border)',borderRadius:10,padding:'10px 12px 10px 36px',color:'var(--text)',fontSize:14,boxSizing:'border-box'}}/>
        </div>
      </div>

      {/* GRILLE */}
      {loading ? (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:16}}>
          {[...Array(8)].map((_,i) => <div key={i} className="skeleton" style={{height:260,borderRadius:16}}/>)}
        </div>
      ) : profiles.length === 0 ? (
        <div style={{textAlign:'center',padding:60,color:'var(--text3)'}}>
          <div style={{fontSize:48,marginBottom:12}}>👤</div>
          <p>Aucun createur trouve</p>
        </div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:16}}>
          {profiles.map((p, idx) => (
            <div key={p.id} onClick={() => setPage('profile', {profileUsername: p.username})}
              style={{background:'var(--card)',borderRadius:16,border:'1px solid var(--border)',padding:'24px 16px 16px',cursor:'pointer',textAlign:'center',transition:'transform 0.2s, border-color 0.2s'}}>
              
              {/* AVATAR */}
              <div style={{width:96,height:96,borderRadius:'50%',margin:'0 auto 12px',background:p.avatar_url?'var(--card2)':GRADIENTS[idx%GRADIENTS.length],display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,fontWeight:800,color:'#fff',overflow:'hidden',position:'relative'}}>
                {p.avatar_url
                  ? <img src={p.avatar_url} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                  : initials(p)
                }
                {p.is_verified && (
                  <div style={{position:'absolute',bottom:4,right:4,width:20,height:20,borderRadius:'50%',background:'var(--primary)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10}}>✓</div>
                )}
              </div>

              {/* TYPE */}
              <div style={{fontSize:10,fontWeight:700,letterSpacing:2,color:'var(--text3)',marginBottom:6,textTransform:'uppercase'}}>
                {TYPE_LABELS[p.profile_type] || 'MEMBRE'}
              </div>

              {/* NOM */}
              <div style={{fontWeight:800,fontSize:16,marginBottom:6,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                {p.display_name || p.username}
              </div>

              {/* FANS + PAYS */}
              <div style={{fontSize:13,color:'var(--text2)',marginBottom:16}}>
                <strong style={{color:'var(--text)'}}>{formatK(p.followers_count||0)}</strong> fans
                {p.country && <span style={{marginLeft:6}}>{FLAGS[p.country] || '🌍'}</span>}
              </div>

              {/* BOUTON SUIVRE */}
              <button onClick={(e) => handleFollow(e, p.username, idx)}
                style={{width:'100%',padding:'9px',borderRadius:8,border:`2px solid ${following[p.username]?'var(--border)':'var(--gold)'}`,
                  background:following[p.username]?'transparent':'transparent',
                  color:following[p.username]?'var(--text2)':'var(--gold)',
                  cursor:'pointer',fontWeight:700,fontSize:14,transition:'all 0.2s'}}>
                {following[p.username] ? 'Abonne' : 'Suivre'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
