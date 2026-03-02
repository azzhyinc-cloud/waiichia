import { useState, useEffect } from 'react'
import { usePageStore } from '../stores/index.js'
import api from '../services/api.js'

const formatK = (n) => {
  if (!n) return '0'
  if (n >= 1000000) return (n/1000000).toFixed(1).replace('.0','') + 'M'
  if (n >= 1000) return (n/1000).toFixed(1).replace('.0','') + 'K'
  return n.toString()
}

const TYPES = [['all','Tous'],['artist','Artistes'],['label','Labels'],['media','Medias'],['influencer','Influenceurs'],['entrepreneur','Entrepreneurs']]

export default function Creators() {
  const { setPage } = usePageStore()
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [type, setType] = useState('all')
  const [search, setSearch] = useState('')

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

  return (
    <div style={{padding:'24px 20px 100px'}}>
      <div style={{marginBottom:20}}>
        <h1 style={{fontSize:24,fontWeight:800,margin:'0 0 4px'}}>Createurs Waiichia</h1>
        <p style={{color:'var(--text2)',fontSize:14,margin:0}}>{profiles.length} createurs sur la plateforme</p>
      </div>

      {/* SEARCH */}
      <div style={{position:'relative',marginBottom:16}}>
        <span style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--text3)'}}>🔍</span>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Rechercher un createur..."
          style={{width:'100%',background:'var(--card)',border:'1px solid var(--border)',borderRadius:10,padding:'10px 12px 10px 36px',color:'var(--text)',fontSize:14,boxSizing:'border-box'}}/>
      </div>

      {/* TYPES */}
      <div style={{display:'flex',gap:8,marginBottom:24,overflowX:'auto',paddingBottom:4}}>
        {TYPES.map(([v,l]) => (
          <button key={v} onClick={() => setType(v)}
            style={{padding:'6px 16px',borderRadius:99,border:'none',cursor:'pointer',fontSize:13,whiteSpace:'nowrap',flexShrink:0,fontWeight:600,
              background:type===v?'var(--primary)':'var(--card)',
              color:type===v?'#fff':'var(--text2)'}}>
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:16}}>
          {[...Array(8)].map((_,i) => <div key={i} className="skeleton" style={{height:200,borderRadius:12}}/>)}
        </div>
      ) : profiles.length === 0 ? (
        <div style={{textAlign:'center',padding:60,color:'var(--text3)'}}>
          <div style={{fontSize:48,marginBottom:12}}>👤</div>
          <p>Aucun createur trouve</p>
        </div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:16}}>
          {profiles.map(p => (
            <div key={p.id} onClick={() => setPage('profile', {profileUsername: p.username})}
              style={{background:'var(--card)',borderRadius:12,border:'1px solid var(--border)',overflow:'hidden',cursor:'pointer',transition:'transform 0.2s'}}>
              {/* COVER */}
              <div style={{height:80,background:'linear-gradient(135deg,var(--primary),var(--gold))',position:'relative'}}>
                {p.cover_url && <img src={p.cover_url} style={{width:'100%',height:'100%',objectFit:'cover'}}/>}
              </div>
              {/* AVATAR */}
              <div style={{padding:'0 16px 16px',marginTop:-24}}>
                <div style={{width:48,height:48,borderRadius:'50%',background:'var(--card2)',border:'3px solid var(--card)',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,marginBottom:8}}>
                  {p.avatar_url ? <img src={p.avatar_url} style={{width:'100%',height:'100%',objectFit:'cover'}}/> : (p.display_name||'A')[0]}
                </div>
                <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:2}}>
                  <div style={{fontWeight:700,fontSize:15,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.display_name||p.username}</div>
                  {p.is_verified && <span style={{color:'var(--primary)',fontSize:14}}>✓</span>}
                </div>
                <div style={{fontSize:12,color:'var(--text2)',marginBottom:10}}>@{p.username}</div>
                <div style={{display:'flex',gap:16,fontSize:12,color:'var(--text3)'}}>
                  <span><strong style={{color:'var(--text)'}}>{formatK(p.followers_count||0)}</strong> abonnes</span>
                  <span><strong style={{color:'var(--text)'}}>{p.tracks_count||0}</strong> sons</span>
                </div>
                <div style={{marginTop:10,padding:'4px 10px',borderRadius:99,background:'var(--card2)',fontSize:11,color:'var(--text2)',display:'inline-block'}}>
                  {p.profile_type === 'artist' ? 'Artiste' : p.profile_type === 'label' ? 'Label' : p.profile_type === 'media' ? 'Media' : p.profile_type === 'influencer' ? 'Influenceur' : p.profile_type === 'entrepreneur' ? 'Entrepreneur' : 'Createur'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
