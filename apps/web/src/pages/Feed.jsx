import { useState, useEffect } from "react"
import { useAuthStore, usePageStore } from "../stores/index.js"
import api from "../services/api.js"

const FILTERS=['Tous','Musique','Podcast','Événements']
const fmtK=n=>n>=1000?(n/1000).toFixed(1)+"K":String(n||0)
const EVENT_ICONS={upload:'🎵',album_release:'💿',event_created:'🎪',achievement:'🏆',follow:'👥',purchase:'🛒',live_start:'🔴'}

export default function Feed(){
  const {user}=useAuthStore()
  const {setPage}=usePageStore()
  const [filter,setFilter]=useState('Tous')
  const [posts,setPosts]=useState([])
  const [loading,setLoading]=useState(true)

  useEffect(()=>{
    api.social.feed()
      .then(d=>setPosts(d.feed || []))
      .catch(()=>{})
      .finally(()=>setLoading(false))
  },[])

  if(!user)return(<div style={{textAlign:'center',padding:60}}><div style={{fontSize:48,marginBottom:16}}>⚡</div><h2 style={{fontFamily:'Syne,sans-serif'}}>Connectez-vous pour voir votre activité</h2><button className="btn btn-primary" onClick={()=>setPage('login')} style={{marginTop:16}}>Se connecter</button></div>)

  return(
    <div style={{paddingBottom:40}}>
      <div className="page-title">⚡ Mon Activité</div>

      <div className="filter-bar">
        {FILTERS.map(f=><div key={f} className={`pill-tab${filter===f?' active':''}`} onClick={()=>setFilter(f)}>{f}</div>)}
      </div>

      {loading
        ?<div style={{display:'flex',flexDirection:'column',gap:12}}>{[...Array(4)].map((_,i)=><div key={i} style={{height:120,background:'var(--card)',borderRadius:'var(--radius)',border:'1px solid var(--border)',animation:'shimmer 1.5s infinite'}}/>)}</div>
        :<div style={{display:'flex',flexDirection:'column',gap:12}}>
          {posts.map(p=>(
            <div key={p.id} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:16,transition:'border-color .2s'}}
              onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(245,166,35,.3)'}
              onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
              {/* HEADER */}
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
                <div style={{width:42,height:42,borderRadius:'50%',background:p.bg,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:15,color:'#000',flexShrink:0}}>{p.ava||p.user?.[0]}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600}}><span style={{cursor:'pointer'}}>{p.user}</span> <span style={{color:'var(--text2)',fontWeight:400}}>{p.content}</span></div>
                  <div style={{fontSize:11,color:'var(--text3)',fontFamily:'Space Mono,monospace',marginTop:2}}>{p.time}</div>
                </div>
                <span style={{fontSize:20}}>{EVENT_ICONS[p.event_type]||'📌'}</span>
              </div>

              {/* RÉFÉRENCE */}
              {p.ref_title&&(
                <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',padding:'12px 14px',display:'flex',alignItems:'center',gap:12,cursor:'pointer',marginBottom:12}}>
                  <div style={{width:40,height:40,borderRadius:8,background:'linear-gradient(135deg,var(--gold),#e8920a)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>{EVENT_ICONS[p.event_type]||'🎵'}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.ref_title}</div>
                    <div style={{fontSize:11,color:'var(--text3)',textTransform:'uppercase',fontFamily:'Space Mono,monospace'}}>{p.ref_type}</div>
                  </div>
                  {p.ref_type==='track'&&<button className="btn btn-xs btn-primary">▶</button>}
                </div>
              )}

              {/* REACTIONS */}
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                {['❤️','🔥','👏','💬'].map(e=>(
                  <button key={e} style={{display:'flex',alignItems:'center',gap:4,padding:'5px 10px',borderRadius:20,border:'1px solid var(--border)',background:'var(--card2)',fontSize:12,cursor:'pointer',color:'var(--text2)',transition:'all .18s'}}
                    onMouseEnter={ev=>ev.currentTarget.style.borderColor='var(--gold)'} onMouseLeave={ev=>ev.currentTarget.style.borderColor='var(--border)'}>
                    {e}<span style={{fontSize:11,fontFamily:'Space Mono,monospace'}}>{e==='💬'?(p.comments||0):Math.floor(Math.random()*200+10)}</span>
                  </button>
                ))}
                <span style={{marginLeft:'auto',fontSize:11,color:'var(--text3)',fontFamily:'Space Mono,monospace'}}>{fmtK(p.reactions)} réactions</span>
              </div>
            </div>
          ))}
        </div>
      }
    </div>
  )
}
