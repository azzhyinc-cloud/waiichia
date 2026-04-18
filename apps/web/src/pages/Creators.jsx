import { useState, useEffect } from "react"
import { usePageStore, useAuthStore } from "../stores/index.js"
import api from "../services/api.js"

const TYPES=['Tous','Artiste','Media','Label','Influenceur','Entrepreneur','Pro']
const PAYS=[{v:'',l:'🌍 Tous pays'},{v:'KM',l:'🇰🇲 Comores'},{v:'MG',l:'🇲🇬 Madagascar'},{v:'NG',l:'🇳🇬 Nigeria'},{v:'CI',l:"🇨🇮 Côte d'Ivoire"},{v:'SN',l:'🇸🇳 Sénégal'},{v:'TZ',l:'🇹🇿 Tanzanie'}]
const FLAGS={KM:'🇰🇲',MG:'🇲🇬',NG:'🇳🇬',CI:'🇨🇮',SN:'🇸🇳',TZ:'🇹🇿',RW:'🇷🇼',CD:'🇨🇩',GH:'🇬🇭',FR:'🇫🇷'}
const fmtK=n=>n>=1000000?(n/1000000).toFixed(1)+"M":n>=1000?(n/1000).toFixed(1)+"K":String(n||0)
const TYPE_LABELS={artist:'ARTISTE',media:'MÉDIA',label:'LABEL',influencer:'INFLUENCEUR',entrepreneur:'ENTREPRENEUR',pro:'PRO',listener:'AUDITEUR'}
const BGS=["linear-gradient(135deg,#f5a623,#e63946)","linear-gradient(135deg,#4d9fff,#9b59f5)","linear-gradient(135deg,#9b59f5,#6c3483)","linear-gradient(135deg,#2dc653,#00bfa5)","linear-gradient(135deg,#ff6b35,#f5a623)","linear-gradient(135deg,#e63946,#c1121f)"]

export default function Creators(){
  const {setPage}=usePageStore()
  const {user}=useAuthStore()
  const [type,setType]=useState('Tous')
  const [pays,setPays]=useState('')
  const [creators,setCreators]=useState([])
  const [loading,setLoading]=useState(true)
  const [followedIds,setFollowedIds]=useState(new Set())
  const [followLoading,setFollowLoading]=useState(new Set())

  useEffect(()=>{
    const promises = [
      api.profiles.list('?limit=50').catch(()=>({profiles:[]})),
    ]
    if (user) promises.push(api.profiles.followingIds().catch(()=>({ids:[]})))
    else promises.push(Promise.resolve({ids:[]}))

    Promise.all(promises).then(([d, foll])=>{
      setCreators(d.profiles||[])
      if(foll?.ids?.length) setFollowedIds(new Set(foll.ids))
    }).catch(()=>setCreators([]))
    .finally(()=>setLoading(false))
  },[])

  const handleFollow=async(e,creator)=>{
    e.stopPropagation()
    if(!user){setPage('login');return}
    if(followLoading.has(creator.id))return

    setFollowLoading(prev=>{const s=new Set(prev);s.add(creator.id);return s})
    try{
      if(followedIds.has(creator.id)){
        await api.profiles.unfollow(creator.username)
        setFollowedIds(prev=>{const s=new Set(prev);s.delete(creator.id);return s})
        setCreators(prev=>prev.map(c=>c.id===creator.id?{...c,followers_count:Math.max(0,(c.followers_count||1)-1)}:c))
      }else{
        await api.profiles.follow(creator.username)
        setFollowedIds(prev=>{const s=new Set(prev);s.add(creator.id);return s})
        setCreators(prev=>prev.map(c=>c.id===creator.id?{...c,followers_count:(c.followers_count||0)+1}:c))
      }
    }catch(e){
      console.error('Follow error:',e)
    }
    setFollowLoading(prev=>{const s=new Set(prev);s.delete(creator.id);return s})
  }

  const filtered=creators.filter(c=>{
    if(user && c.id === user.id) return false
    if(type!=='Tous'&&!c.profile_type?.toLowerCase().includes(type.toLowerCase().slice(0,4)))return false
    if(pays&&c.country!==pays)return false
    return true
  })

  return(
    <div style={{paddingBottom:40}}>
      <div className="page-title">⭐ Créateurs Waiichia</div>

      <div className="filter-bar">
        {TYPES.map(t=><div key={t} className={`pill-tab${type===t?' active':''}`} onClick={()=>setType(t)}>{t}</div>)}
        <select className="select-styled" value={pays} onChange={e=>setPays(e.target.value)}>
          {PAYS.map(p=><option key={p.v} value={p.v}>{p.l}</option>)}
        </select>
      </div>

      {loading
        ?<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:12}}>{[...Array(8)].map((_,i)=><div key={i} style={{height:220,background:'var(--card)',borderRadius:'var(--radius)',border:'1px solid var(--border)',animation:'shimmer 1.5s infinite'}}/>)}</div>
        :<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:12}}>
          {filtered.map((c,idx)=>{
            const initials=(c.display_name||'??').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()
            const flag=FLAGS[c.country]||'🌍'
            const isFollowed=followedIds.has(c.id)
            const isLoading=followLoading.has(c.id)
            return(
              <div key={c.id} className="creator-card" onClick={()=>setPage('profile',{profileUsername:c.username})}>
                <div style={{position:'relative',display:'inline-block',margin:'0 auto 10px'}}>
                  <div className="creator-ava" style={{background:c.bg||BGS[idx%6],color:'#000',border:'2px solid var(--border)'}}>
                    {c.avatar_url?<img src={c.avatar_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:initials}
                  </div>
                  {c.is_verified&&<div style={{position:'absolute',bottom:-2,right:-2,width:18,height:18,background:'var(--gold)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,border:'2px solid var(--card)'}}>✓</div>}
                </div>
                <div style={{fontSize:9,letterSpacing:2,textTransform:'uppercase',fontFamily:'Space Mono,monospace',color:'var(--gold)',marginBottom:4}}>{TYPE_LABELS[c.profile_type]||'CRÉATEUR'}</div>
                <div className="creator-name">{c.display_name} {flag}</div>
                <div className="creator-fans">{fmtK(c.followers_count)} fans</div>
                <button className={isFollowed?"follow-btn follow-btn-following":"follow-btn"}
                  onClick={(e)=>handleFollow(e,c)} disabled={isLoading}
                  style={isFollowed?{background:'var(--card)',border:'1px solid var(--gold)',color:'var(--gold)'}:{}}>
                  {isLoading?"...":(isFollowed?"✓ Suivi":"+ Suivre")}
                </button>
              </div>
            )
          })}
          {!filtered.length&&<div style={{gridColumn:'1/-1',textAlign:'center',padding:60,color:'var(--text3)'}}>Aucun créateur avec ces filtres</div>}
        </div>
      }
    </div>
  )
}
