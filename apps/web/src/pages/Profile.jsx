import { useState, useEffect, useRef } from 'react'
import { useAuthStore, usePageStore } from '../stores/index.js'
import api from '../services/api.js'

const API = import.meta.env.VITE_API_URL
const formatK = (n) => { if(!n)return'0'; if(n>=1000000)return(n/1000000).toFixed(1)+'M'; if(n>=1000)return(n/1000).toFixed(1)+'K'; return String(n) }
const FLAGS = { KM:'🇰🇲', FR:'🇫🇷', NG:'🇳🇬', SN:'🇸🇳', MG:'🇲🇬', CI:'🇨🇮', TZ:'🇹🇿' }
const GRADIENTS = ['linear-gradient(135deg,#0d1620,#2a1040)','linear-gradient(135deg,#0a1a0e,#1a3a20)','linear-gradient(135deg,#1a0a0e,#3a1020)','linear-gradient(135deg,#0a1020,#1a2a40)']

export default function Profile() {
  const { user } = useAuthStore()
  const { setPage } = usePageStore()
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState(null)
  const [tracks, setTracks] = useState([])
  const [tab, setTab] = useState('Sons')
  const [loading, setLoading] = useState(true)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const coverRef = useRef()
  const avatarRef = useRef()
  const token = localStorage.getItem('waiichia_token')

  useEffect(() => { if(user) loadProfile() }, [user])

  const loadProfile = async () => {
    setLoading(true)
    try {
      const [profileRes, statsRes, tracksRes] = await Promise.all([
        fetch(API+'/api/profiles/'+user.username).then(r=>r.json()),
        fetch(API+'/api/profiles/'+user.username+'/stats').then(r=>r.json()),
        api.tracks.myTracks(),
      ])
      setProfile(profileRes.profile || profileRes)
      setStats(statsRes)
      setTracks(tracksRes.tracks || [])
    } catch(e) {}
    setLoading(false)
  }

  const uploadFile = async (file, type) => {
    const formData = new FormData()
    formData.append('file', file)
    const endpoint = type === 'cover' ? '/api/upload/image' : '/api/upload/image'
    const res = await fetch(API+endpoint, { method:'POST', headers:{'Authorization':'Bearer '+token}, body:formData })
    const data = await res.json()
    return data.url
  }

  const handleCoverChange = async (e) => {
    const file = e.target.files[0]; if(!file) return
    setUploadingCover(true)
    try {
      const url = await uploadFile(file, 'cover')
      await fetch(API+'/api/profiles/me', { method:'PATCH', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body:JSON.stringify({cover_url:url}) })
      setProfile(p=>({...p, cover_url:url}))
    } catch(e) {}
    setUploadingCover(false)
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]; if(!file) return
    setUploadingAvatar(true)
    try {
      const url = await uploadFile(file, 'avatar')
      await fetch(API+'/api/profiles/me', { method:'PATCH', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body:JSON.stringify({avatar_url:url}) })
      setProfile(p=>({...p, avatar_url:url}))
    } catch(e) {}
    setUploadingAvatar(false)
  }

  const TABS = ['🎵 Sons','💿 Albums','📋 Playlists','📻 Diffusions','🛍️ Boutique','🎪 Evenements']

  if(!user) return (
    <div style={{textAlign:'center',padding:80}}>
      <div style={{fontSize:56,marginBottom:16}}>👤</div>
      <h2>Mon Profil</h2>
      <button onClick={()=>setPage('login')} style={{marginTop:16,background:'var(--primary)',border:'none',color:'#fff',padding:'10px 24px',borderRadius:8,cursor:'pointer'}}>Se connecter</button>
    </div>
  )

  const p = profile || user
  const initials = (p?.display_name||p?.username||'U').slice(0,2).toUpperCase()
  const walletBalance = stats?.wallet_balance || p?.wallet_balance || 0

  return (
    <div style={{paddingBottom:100}}>
      {/* ── COVER ── */}
      <div style={{width:'100%',height:220,borderRadius:16,background:p?.cover_url?'#000':GRADIENTS[0],position:'relative',overflow:'hidden',marginBottom:-60}}>
        {p?.cover_url
          ? <img src={p.cover_url} style={{width:'100%',height:'100%',objectFit:'cover',opacity:0.85}}/>
          : <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:80,opacity:0.15}}>🌊</div>
        }
        <div style={{position:'absolute',top:12,right:12,display:'flex',gap:8}}>
          <button onClick={()=>coverRef.current.click()}
            style={{background:'rgba(0,0,0,0.6)',backdropFilter:'blur(8px)',border:'1px solid rgba(255,255,255,0.2)',color:'#fff',borderRadius:8,padding:'7px 14px',cursor:'pointer',fontSize:13,fontWeight:600}}>
            {uploadingCover ? '⏳ ...' : '📷 Modifier couverture'}
          </button>
        </div>
        <input ref={coverRef} type="file" accept="image/*" onChange={handleCoverChange} style={{display:'none'}}/>
      </div>

      {/* ── INFO ROW ── */}
      <div style={{display:'flex',alignItems:'flex-end',gap:18,padding:'0 20px',marginBottom:18,position:'relative',zIndex:1}}>
        {/* AVATAR */}
        <div style={{position:'relative',flexShrink:0}} onClick={()=>avatarRef.current.click()}>
          <div style={{width:110,height:110,borderRadius:'50%',background:'linear-gradient(135deg,var(--gold),#e8920a)',border:'4px solid var(--bg)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:36,fontWeight:800,color:'#000',overflow:'hidden',cursor:'pointer'}}>
            {p?.avatar_url ? <img src={p.avatar_url} style={{width:'100%',height:'100%',objectFit:'cover'}}/> : initials}
            {uploadingAvatar && <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',borderRadius:'50%',fontSize:20}}>⏳</div>}
          </div>
          <div style={{position:'absolute',bottom:4,right:4,width:28,height:28,background:'var(--gold)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,cursor:'pointer',border:'2px solid var(--bg)'}}>📷</div>
        </div>
        <input ref={avatarRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{display:'none'}}/>

        {/* META */}
        <div style={{flex:1,paddingTop:70}}>
          <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap',marginBottom:3}}>
            <span style={{fontFamily:'var(--font-title)',fontSize:24,fontWeight:800}}>{p?.display_name||p?.username}</span>
            {p?.is_verified && (
              <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'4px 12px',borderRadius:20,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:'uppercase',background:'linear-gradient(135deg,rgba(245,166,35,.15),rgba(230,57,70,.1))',border:'1px solid rgba(245,166,35,.25)',color:'var(--gold)'}}>
                ⭐ Artiste Verifie
              </span>
            )}
          </div>
          <div style={{fontSize:13,color:'var(--text2)',marginBottom:10}}>
            @{p?.username} · {FLAGS[p?.country]||'🌍'} {p?.city||''}{p?.city&&p?.country?', ':''}
            {p?.country==='KM'?'Comores':p?.country==='FR'?'France':p?.country==='MG'?'Madagascar':p?.country||''}
          </div>
          {p?.bio && <div style={{fontSize:13,color:'var(--text2)',marginBottom:10,maxWidth:500}}>{p.bio}</div>}
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            <button onClick={()=>setPage('upload')}
              style={{background:'var(--primary)',border:'none',color:'#fff',borderRadius:8,padding:'8px 16px',cursor:'pointer',fontWeight:700,fontSize:13}}>
              + Publier
            </button>
            <button onClick={()=>setPage('settings')}
              style={{background:'var(--card)',border:'1px solid var(--border)',color:'var(--text)',borderRadius:8,padding:'8px 16px',cursor:'pointer',fontSize:13,fontWeight:600}}>
              ⚙️ Parametres
            </button>
            <button onClick={()=>setPage('wallet')}
              style={{background:'var(--card)',border:'1px solid var(--border)',color:'var(--gold)',borderRadius:8,padding:'8px 16px',cursor:'pointer',fontSize:13,fontWeight:700}}>
              💰 {walletBalance.toLocaleString()} KMF
            </button>
          </div>
        </div>
      </div>

      {/* ── STATS BAR ── */}
      <div style={{display:'flex',gap:0,background:'var(--card)',border:'1px solid var(--border)',borderRadius:12,padding:'16px 22px',marginBottom:22,marginLeft:20,marginRight:20,overflowX:'auto'}}>
        {[
          { num: formatK(stats?.tracks_count||p?.tracks_count||tracks.length), label:'Sons' },
          { num: formatK(stats?.albums_count||0), label:'Albums' },
          { num: formatK(stats?.followers_count||p?.followers_count||0), label:'Fans' },
          { num: formatK(stats?.total_plays||p?.total_plays||0), label:'Ecoutes' },
          { num: formatK(walletBalance), label:'KMF gagnes' },
        ].map((s,i) => (
          <div key={i} style={{textAlign:'center',flex:1,minWidth:70,borderRight:i<4?'1px solid var(--border)':'none',padding:'0 12px'}}>
            <div style={{fontFamily:'var(--font-title)',fontSize:20,fontWeight:800}}>{s.num}</div>
            <div style={{fontSize:11,color:'var(--text2)',fontFamily:'monospace',textTransform:'uppercase',letterSpacing:0.5,marginTop:2}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── TABS ── */}
      <div style={{display:'flex',gap:4,padding:'0 20px',marginBottom:20,overflowX:'auto'}}>
        {TABS.map(t => {
          const key = t.split(' ').slice(1).join(' ')
          return (
            <button key={t} onClick={()=>setTab(key)}
              style={{padding:'8px 16px',borderRadius:8,border:'1px solid var(--border)',cursor:'pointer',fontSize:13,fontWeight:700,whiteSpace:'nowrap',flexShrink:0,
                background:tab===key?'var(--primary)':'var(--card)',color:tab===key?'#fff':'var(--text2)'}}>
              {t}
            </button>
          )
        })}
      </div>

      {/* ── CONTENU TABS ── */}
      <div style={{padding:'0 20px'}}>
        {tab==='Sons' && (
          loading ? (
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:12}}>
              {[...Array(6)].map((_,i)=><div key={i} className="skeleton" style={{height:200,borderRadius:12}}/>)}
            </div>
          ) : tracks.length===0 ? (
            <div style={{textAlign:'center',padding:60,color:'var(--text3)'}}>
              <div style={{fontSize:48,marginBottom:12}}>🎵</div>
              <p>Aucun son publie</p>
              <button onClick={()=>setPage('upload')} style={{marginTop:12,background:'var(--primary)',border:'none',color:'#fff',padding:'10px 24px',borderRadius:8,cursor:'pointer',fontWeight:600}}>Publier mon premier son</button>
            </div>
          ) : (
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:12}}>
              {tracks.filter(t=>t.content_type==='music'||!t.content_type).map(t=>(
                <div key={t.id} style={{background:'var(--card)',borderRadius:12,border:'1px solid var(--border)',overflow:'hidden',cursor:'pointer'}}>
                  <div style={{height:160,background:t.cover_url?'#000':'var(--card2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:40,position:'relative'}}>
                    {t.cover_url ? <img src={t.cover_url} style={{width:'100%',height:'100%',objectFit:'cover'}}/> : '🎵'}
                    {t.genre && <span style={{position:'absolute',top:8,right:8,background:'rgba(0,0,0,0.7)',borderRadius:6,padding:'2px 8px',fontSize:9,fontWeight:700,color:'#fff',letterSpacing:1}}>{t.genre.toUpperCase()}</span>}
                  </div>
                  <div style={{padding:10}}>
                    <div style={{fontWeight:700,fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:3}}>{t.title}</div>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'var(--text3)'}}>
                      <span>{formatK(t.play_count||0)} 🎧</span>
                      <span style={{color:t.access_type==='free'?'#2cc653':'var(--gold)',fontWeight:700}}>{t.access_type==='free'?'Gratuit':(t.sale_price||0).toLocaleString()+' KMF'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {tab==='Albums' && (
          <div style={{textAlign:'center',padding:60,color:'var(--text3)'}}>
            <div style={{fontSize:48,marginBottom:12}}>💿</div>
            <p>Aucun album publie</p>
            <button onClick={()=>setPage('upload')} style={{marginTop:12,background:'var(--primary)',border:'none',color:'#fff',padding:'10px 24px',borderRadius:8,cursor:'pointer',fontWeight:600}}>Creer un album</button>
          </div>
        )}

        {tab==='Playlists' && (
          <div style={{textAlign:'center',padding:60,color:'var(--text3)'}}>
            <div style={{fontSize:48,marginBottom:12}}>📋</div>
            <p>Aucune playlist creee</p>
          </div>
        )}

        {tab==='Diffusions' && (
          <div style={{textAlign:'center',padding:60,color:'var(--text3)'}}>
            <div style={{fontSize:48,marginBottom:12}}>📻</div>
            <p>Aucune diffusion</p>
          </div>
        )}

        {tab==='Boutique' && (
          <div style={{textAlign:'center',padding:60,color:'var(--text3)'}}>
            <div style={{fontSize:48,marginBottom:12}}>🛍️</div>
            <p>Boutique vide</p>
          </div>
        )}

        {tab==='Evenements' && (
          <div>
            <button onClick={()=>setPage('my_events')}
              style={{marginBottom:16,background:'var(--primary)',border:'none',color:'#fff',borderRadius:8,padding:'8px 16px',cursor:'pointer',fontWeight:600,fontSize:13}}>
              Voir tous mes evenements →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
