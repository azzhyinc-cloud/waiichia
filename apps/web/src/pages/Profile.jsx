import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import { useAuthStore } from '../stores/index.js'
import { usePlayerStore } from '../stores/index.js'
import api from '../services/api.js'

export default function Profile() {
  const { username } = useParams()
  const { user } = useAuthStore()
  const { toggle, currentTrack, isPlaying } = usePlayerStore()
  const [profile, setProfile] = useState(null)
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(true)
  const [following, setFollowing] = useState(false)

  useEffect(() => {
    Promise.all([
      api.profiles.get(username),
      api.profiles.tracks(username)
    ]).then(([p, t]) => {
      setProfile(p.profile)
      setTracks(t.tracks||[])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [username])

  const handleFollow = async () => {
    try {
      if (following) { await api.profiles.unfollow(username); setFollowing(false) }
      else { await api.profiles.follow(username); setFollowing(true) }
    } catch(e) { alert(e.message) }
  }

  if (loading) return <div style={{minHeight:'100vh',background:'#0a0a0a',display:'flex',alignItems:'center',justifyContent:'center',color:'#666'}}>Chargement...</div>
  if (!profile) return <div style={{minHeight:'100vh',background:'#0a0a0a',display:'flex',alignItems:'center',justifyContent:'center',color:'#666'}}>Profil introuvable</div>

  return (
    <div style={{paddingBottom:100}}>
      <Navbar />
      <div style={{maxWidth:900,margin:'0 auto',padding:'24px 20px'}}>
        <div style={{background:'#111',borderRadius:16,overflow:'hidden',marginBottom:24,border:'1px solid #222'}}>
          <div style={{height:180,background:'linear-gradient(135deg,#1a0505,#2d1111)',backgroundImage:profile.cover_url?`url(${profile.cover_url})`:'',backgroundSize:'cover'}}/>
          <div style={{padding:'0 24px 24px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginTop:-40}}>
              <div style={{width:80,height:80,borderRadius:'50%',background:'#333',border:'3px solid #111',overflow:'hidden',fontSize:32,display:'flex',alignItems:'center',justifyContent:'center'}}>
                {profile.avatar_url ? <img src={profile.avatar_url} style={{width:'100%',height:'100%',objectFit:'cover'}}/> : '🎵'}
              </div>
              {user && user.username !== username && (
                <button onClick={handleFollow}
                  style={{background:following?'#333':'#e74c3c',border:'none',color:'#fff',padding:'8px 20px',borderRadius:20,cursor:'pointer',fontWeight:600}}>
                  {following ? 'Ne plus suivre' : 'Suivre'}
                </button>
              )}
            </div>
            <h1 style={{margin:'12px 0 4px',fontSize:24}}>{profile.display_name}</h1>
            <p style={{color:'#888',margin:'0 0 8px',fontSize:14}}>@{profile.username}</p>
            {profile.bio && <p style={{color:'#aaa',fontSize:14,margin:'8px 0'}}>{profile.bio}</p>}
            <div style={{display:'flex',gap:24,marginTop:16,fontSize:13,color:'#888'}}>
              <span><strong style={{color:'#fff'}}>{profile.tracks_count}</strong> sons</span>
              <span><strong style={{color:'#fff'}}>{profile.followers_count}</strong> abonnés</span>
              <span><strong style={{color:'#fff'}}>{profile.following_count}</strong> abonnements</span>
              <span><strong style={{color:'#fff'}}>{profile.total_plays?.toLocaleString()||0}</strong> écoutes</span>
            </div>
          </div>
        </div>

        <h2 style={{fontSize:18,fontWeight:700,marginBottom:16}}>Sons publiés</h2>
        {tracks.length === 0 ? (
          <div style={{textAlign:'center',padding:48,color:'#666'}}>Aucun son publié</div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:16}}>
            {tracks.map(t => (
              <div key={t.id} style={{background:'#111',borderRadius:10,overflow:'hidden',border:`1px solid ${currentTrack?.id===t.id?'#e74c3c':'#222'}`,cursor:'pointer'}} onClick={()=>toggle(t)}>
                <div style={{aspectRatio:'1',background:'#1a1a1a',display:'flex',alignItems:'center',justifyContent:'center',fontSize:32}}>
                  {t.cover_url?<img src={t.cover_url} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:'🎵'}
                </div>
                <div style={{padding:'10px 12px'}}>
                  <div style={{fontWeight:600,fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</div>
                  <div style={{fontSize:11,color:'#888',marginTop:4}}>🎧 {t.play_count?.toLocaleString()||0}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
