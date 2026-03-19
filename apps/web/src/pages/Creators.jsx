import { useState, useEffect } from "react"
import { usePageStore } from "../stores/index.js"
import api from "../services/api.js"

const TYPES=['Tous','Artiste','Media','Label','Influenceur','Entrepreneur','Pro']
const PAYS=[{v:'',l:'🌍 Tous pays'},{v:'KM',l:'🇰🇲 Comores'},{v:'MG',l:'🇲🇬 Madagascar'},{v:'NG',l:'🇳🇬 Nigeria'},{v:'CI',l:"🇨🇮 Côte d'Ivoire"},{v:'SN',l:'🇸🇳 Sénégal'},{v:'TZ',l:'🇹🇿 Tanzanie'}]
const FLAGS={KM:'🇰🇲',MG:'🇲🇬',NG:'🇳🇬',CI:'🇨🇮',SN:'🇸🇳',TZ:'🇹🇿',RW:'🇷🇼',CD:'🇨🇩',GH:'🇬🇭',FR:'🇫🇷'}
const MOCK=[
  {id:'c1',display_name:'Kolo Officiel',username:'kolo_komori',profile_type:'artist',country:'KM',is_verified:true,followers_count:48200,total_plays:1400000,avatar_url:null,bg:'linear-gradient(135deg,#f5a623,#e63946)'},
  {id:'c2',display_name:'Radio Komori FM',username:'komori_fm',profile_type:'media',country:'KM',is_verified:true,followers_count:120000,total_plays:5200000,avatar_url:null,bg:'linear-gradient(135deg,#4d9fff,#9b59f5)'},
  {id:'c3',display_name:'DJ Chami',username:'djchami',profile_type:'artist',country:'KM',is_verified:true,followers_count:32000,total_plays:890000,avatar_url:null,bg:'linear-gradient(135deg,#9b59f5,#6c3483)'},
  {id:'c4',display_name:'Coach Amina',username:'amina_mindset',profile_type:'entrepreneur',country:'SN',is_verified:false,followers_count:18400,total_plays:320000,avatar_url:null,bg:'linear-gradient(135deg,#2dc653,#00bfa5)'},
  {id:'c5',display_name:'Afro Beats LBL',username:'afrobeats_lbl',profile_type:'label',country:'NG',is_verified:true,followers_count:512000,total_plays:28000000,avatar_url:null,bg:'linear-gradient(135deg,#ff6b35,#f5a623)'},
  {id:'c6',display_name:'Wassila',username:'wassila_km',profile_type:'artist',country:'KM',is_verified:false,followers_count:14000,total_plays:210000,avatar_url:null,bg:'linear-gradient(135deg,#e63946,#c1121f)'},
  {id:'c7',display_name:'Wally Afro',username:'wallyafro',profile_type:'artist',country:'CI',is_verified:true,followers_count:28500,total_plays:760000,avatar_url:null,bg:'linear-gradient(135deg,#4d9fff,#9b59f5)'},
  {id:'c8',display_name:'Nassim B.',username:'nassimb_km',profile_type:'artist',country:'KM',is_verified:false,followers_count:9200,total_plays:150000,avatar_url:null,bg:'linear-gradient(135deg,#0a1800,#2a5000)'},
  {id:'c9',display_name:'Moroni FM',username:'moroni_fm',profile_type:'media',country:'KM',is_verified:true,followers_count:85000,total_plays:3100000,avatar_url:null,bg:'linear-gradient(135deg,#001a2e,#005080)'},
  {id:'c10',display_name:'Nadjib Pro',username:'nadjib_pro',profile_type:'artist',country:'KM',is_verified:true,followers_count:22000,total_plays:480000,avatar_url:null,bg:'linear-gradient(135deg,#2e1a00,#7a4000)'},
]
const fmtK=n=>n>=1000000?(n/1000000).toFixed(1)+"M":n>=1000?(n/1000).toFixed(1)+"K":String(n||0)
const TYPE_LABELS={artist:'ARTISTE',media:'MÉDIA',label:'LABEL',influencer:'INFLUENCEUR',entrepreneur:'ENTREPRENEUR',pro:'PRO',listener:'AUDITEUR'}

export default function Creators(){
  const {setPage}=usePageStore()
  const [type,setType]=useState('Tous')
  const [pays,setPays]=useState('')
  const [creators,setCreators]=useState([])
  const [loading,setLoading]=useState(true)

  useEffect(()=>{
    api.profiles.list('?limit=30')
      .then(d=>setCreators(d.profiles?.length?d.profiles:MOCK))
      .catch(()=>setCreators(MOCK))
      .finally(()=>setLoading(false))
  },[])

  const filtered=creators.filter(c=>{
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
          {filtered.map(c=>{
            const initials=(c.display_name||'??').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()
            const flag=FLAGS[c.country]||'🌍'
            return(
              <div key={c.id} className="creator-card" onClick={()=>setPage('profile',{profileUsername:c.username})}>
                <div style={{position:'relative',display:'inline-block',margin:'0 auto 10px'}}>
                  <div className="creator-ava" style={{background:c.bg||'linear-gradient(135deg,var(--gold),var(--kente2))',color:'#000',border:'2px solid var(--border)'}}>
                    {c.avatar_url?<img src={c.avatar_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:initials}
                  </div>
                  {c.is_verified&&<div style={{position:'absolute',bottom:-2,right:-2,width:18,height:18,background:'var(--gold)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,border:'2px solid var(--card)'}}>✓</div>}
                </div>
                <div style={{fontSize:9,letterSpacing:2,textTransform:'uppercase',fontFamily:'Space Mono,monospace',color:'var(--gold)',marginBottom:4}}>{TYPE_LABELS[c.profile_type]||'CRÉATEUR'}</div>
                <div className="creator-name">{c.display_name} {flag}</div>
                <div className="creator-fans">{fmtK(c.followers_count)} fans</div>
                <button className="follow-btn">+ Suivre</button>
              </div>
            )
          })}
          {!filtered.length&&<div style={{gridColumn:'1/-1',textAlign:'center',padding:60,color:'var(--text3)'}}>Aucun créateur avec ces filtres</div>}
        </div>
      }
    </div>
  )
}
