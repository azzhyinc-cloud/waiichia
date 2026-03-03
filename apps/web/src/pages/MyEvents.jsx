import { useState, useEffect } from 'react'
import { useAuthStore, usePageStore } from '../stores/index.js'

const API = import.meta.env.VITE_API_URL
const FLAGS = { KM:'🇰🇲', FR:'🇫🇷', NG:'🇳🇬', SN:'🇸🇳', MG:'🇲🇬' }
const GRADIENTS = [
  'linear-gradient(135deg,#0d4a6b,#1a8a9e)',
  'linear-gradient(135deg,#3d0a6b,#7c3aed)',
  'linear-gradient(135deg,#6b3a0a,#d97706)',
  'linear-gradient(135deg,#0a6b2a,#16a34a)',
  'linear-gradient(135deg,#6b0a0a,#dc2626)',
]
const formatDate = (d) => {
  const date = new Date(d)
  return {
    day: String(date.getDate()).padStart(2,'0'),
    month: date.toLocaleDateString('fr-FR',{month:'short'}).toUpperCase(),
    full: date.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'}) + ' · ' + date.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})
  }
}

export default function MyEvents() {
  const { user } = useAuthStore()
  const { setPage } = usePageStore()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const token = localStorage.getItem('waiichia_token')

  useEffect(() => { if (user) loadEvents() }, [user])

  const loadEvents = async () => {
    setLoading(true)
    try {
      const res = await fetch(API + '/api/events/?creator_id=' + user.id, {
        headers:{'Authorization':'Bearer '+token}
      })
      const data = await res.json()
      setEvents(data.events || [])
    } catch(e) {}
    setLoading(false)
  }

  const deleteEvent = async (id) => {
    if (!confirm('Supprimer cet événement ?')) return
    setDeleting(id)
    await fetch(API + '/api/events/' + id, {
      method:'DELETE', headers:{'Authorization':'Bearer '+token}
    })
    setEvents(e => e.filter(x => x.id !== id))
    setDeleting(null)
  }

  const toggleBoost = async (event) => {
    await fetch(API + '/api/events/' + event.id, {
      method:'PATCH',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},
      body: JSON.stringify({ is_boosted: !event.is_boosted })
    })
    setEvents(evs => evs.map(e => e.id===event.id ? {...e, is_boosted: !e.is_boosted} : e))
  }

  if (!user) return (
    <div style={{textAlign:'center',padding:80}}>
      <div style={{fontSize:56,marginBottom:16}}>🎟️</div>
      <h2>Mes Événements</h2>
      <button onClick={()=>setPage('login')} style={{marginTop:16,background:'var(--primary)',border:'none',color:'#fff',padding:'10px 24px',borderRadius:8,cursor:'pointer'}}>Se connecter</button>
    </div>
  )

  const totalTickets = events.reduce((a,e)=>a+(e.tickets_sold||0),0)
  const totalRevenue = events.reduce((a,e)=>a+(((e.tickets_sold||0))*(e.ticket_price||0)),0)
  const upcoming = events.filter(e=>new Date(e.event_date)>new Date()).length

  return (
    <div style={{padding:'24px 20px 100px'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24,flexWrap:'wrap',gap:12}}>
        <h1 style={{fontSize:24,fontWeight:900,margin:0}}>🎟️ Mes Événements</h1>
        <div style={{display:'flex',gap:8}}>
          <button onClick={()=>setPage('create_event')}
            style={{background:'linear-gradient(135deg,var(--gold),#d97706)',border:'none',color:'#000',borderRadius:8,padding:'9px 18px',cursor:'pointer',fontWeight:700,fontSize:14}}>
            + Créer un événement
          </button>
          <button onClick={()=>setPage('dashboard')}
            style={{background:'var(--card)',border:'1px solid var(--border)',color:'var(--text)',borderRadius:8,padding:'9px 18px',cursor:'pointer',fontSize:13}}>
            📊 Statistiques
          </button>
        </div>
      </div>

      {/* STATS RAPIDES */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:12,marginBottom:24}}>
        {[
          { icon:'🎪', val: events.length, label:'Total événements', color:'#4d9fff' },
          { icon:'📅', val: upcoming, label:'À venir', color:'#2cc653' },
          { icon:'🎫', val: totalTickets, label:'Billets vendus', color:'var(--gold)' },
          { icon:'💰', val: totalRevenue.toLocaleString()+' KMF', label:'Revenus billets', color:'#a855f7' },
        ].map((s,i) => (
          <div key={i} style={{background:'var(--card)',borderRadius:12,padding:16,border:'1px solid var(--border)'}}>
            <div style={{fontSize:24,marginBottom:6}}>{s.icon}</div>
            <div style={{fontSize:20,fontWeight:900,color:s.color}}>{s.val}</div>
            <div style={{fontSize:12,color:'var(--text2)',marginTop:4}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* LISTE EVENEMENTS */}
      {loading ? (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:16}}>
          {[...Array(4)].map((_,i)=><div key={i} className="skeleton" style={{height:220,borderRadius:14}}/>)}
        </div>
      ) : events.length === 0 ? (
        <div style={{textAlign:'center',padding:80,color:'var(--text3)'}}>
          <div style={{fontSize:56,marginBottom:16}}>🎪</div>
          <h3 style={{margin:'0 0 8px'}}>Aucun événement créé</h3>
          <p style={{marginBottom:24}}>Créez votre premier événement et vendez vos billets</p>
          <button onClick={()=>setPage('create_event')}
            style={{background:'var(--primary)',border:'none',color:'#fff',padding:'12px 28px',borderRadius:10,cursor:'pointer',fontWeight:700,fontSize:15}}>
            + Créer mon premier événement
          </button>
        </div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:16}}>
          {events.map((e,idx) => {
            const d = formatDate(e.event_date)
            const isPast = new Date(e.event_date) < new Date()
            const pct = e.capacity ? Math.round(((e.tickets_sold||0)/e.capacity)*100) : null
            return (
              <div key={e.id} style={{background:'var(--card)',borderRadius:14,border:'1px solid var(--border)',overflow:'hidden',opacity:isPast?0.7:1}}>
                {/* BANNER */}
                <div style={{position:'relative',height:130,background:e.cover_url?'#000':GRADIENTS[idx%GRADIENTS.length],overflow:'hidden'}}>
                  {e.cover_url && <img src={e.cover_url} style={{width:'100%',height:'100%',objectFit:'cover',opacity:0.8}}/>}
                  {/* DATE CHIP */}
                  <div style={{position:'absolute',top:10,left:10,background:'rgba(59,130,246,0.95)',backdropFilter:'blur(8px)',borderRadius:10,padding:'6px 10px',textAlign:'center',minWidth:46}}>
                    <div style={{fontSize:18,fontWeight:900,color:'#fff',lineHeight:1}}>{d.day}</div>
                    <div style={{fontSize:9,fontWeight:700,color:'rgba(255,255,255,0.85)',letterSpacing:1}}>{d.month}</div>
                  </div>
                  {/* BOOST CHIP */}
                  {e.is_boosted && (
                    <div style={{position:'absolute',top:10,right:10,background:'rgba(245,166,35,0.95)',borderRadius:6,padding:'3px 8px',fontSize:10,fontWeight:700,color:'#000'}}>⚡ BOOST</div>
                  )}
                  {isPast && (
                    <div style={{position:'absolute',top:10,right:10,background:'rgba(0,0,0,0.7)',borderRadius:6,padding:'3px 8px',fontSize:10,fontWeight:700,color:'#fff'}}>PASSÉ</div>
                  )}
                  {!e.cover_url && <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:48}}>🎪</div>}
                </div>

                {/* INFOS */}
                <div style={{padding:14}}>
                  <div style={{fontWeight:700,fontSize:15,marginBottom:6,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{e.title}</div>
                  <div style={{display:'flex',gap:12,fontSize:12,color:'var(--text2)',marginBottom:10}}>
                    <span>📍 {e.location}</span>
                    <span>{FLAGS[e.country]||'🌍'}</span>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                    <span style={{fontSize:13,fontWeight:700,color:e.is_free?'#2cc653':'var(--gold)'}}>
                      {e.is_free ? '✅ Gratuit' : (e.ticket_price||0).toLocaleString()+' KMF'}
                    </span>
                    <span style={{fontSize:12,color:'var(--text2)'}}>
                      🎫 {e.tickets_sold||0}{e.capacity?'/'+e.capacity:''} billets
                    </span>
                  </div>

                  {/* BARRE CAPACITE */}
                  {pct !== null && (
                    <div style={{marginBottom:12}}>
                      <div style={{background:'var(--border)',borderRadius:99,height:5,overflow:'hidden'}}>
                        <div style={{width:pct+'%',height:'100%',background:pct>80?'#e74c3c':pct>50?'var(--gold)':'#2cc653',borderRadius:99}}/>
                      </div>
                      <div style={{fontSize:11,color:'var(--text3)',marginTop:3}}>{pct}% des places vendues</div>
                    </div>
                  )}

                  {/* ACTIONS */}
                  <div style={{display:'flex',gap:6}}>
                    <button onClick={()=>setSelected(e)}
                      style={{flex:1,background:'var(--card2)',border:'1px solid var(--border)',color:'var(--text)',borderRadius:8,padding:'7px',cursor:'pointer',fontSize:12,fontWeight:600}}>
                      👁️ Voir
                    </button>
                    <button onClick={()=>toggleBoost(e)}
                      style={{flex:1,background:e.is_boosted?'rgba(245,166,35,0.15)':'var(--card2)',border:`1px solid ${e.is_boosted?'var(--gold)':'var(--border)'}`,color:e.is_boosted?'var(--gold)':'var(--text2)',borderRadius:8,padding:'7px',cursor:'pointer',fontSize:12,fontWeight:600}}>
                      ⚡ {e.is_boosted?'Booste':'Booster'}
                    </button>
                    <button onClick={()=>deleteEvent(e.id)} disabled={deleting===e.id}
                      style={{background:'rgba(230,57,70,0.1)',border:'1px solid rgba(230,57,70,0.3)',color:'#e74c3c',borderRadius:8,padding:'7px 10px',cursor:'pointer',fontSize:12}}>
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* MODAL DETAIL */}
      {selected && (
        <div onClick={()=>setSelected(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.9)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div onClick={e=>e.stopPropagation()} style={{background:'var(--card)',borderRadius:20,maxWidth:500,width:'100%',maxHeight:'90vh',overflowY:'auto',border:'1px solid var(--border)'}}>
            <div style={{height:180,background:selected.cover_url?'#000':GRADIENTS[0],position:'relative',overflow:'hidden',borderRadius:'20px 20px 0 0'}}>
              {selected.cover_url && <img src={selected.cover_url} style={{width:'100%',height:'100%',objectFit:'cover',opacity:0.8}}/>}
              <button onClick={()=>setSelected(null)} style={{position:'absolute',top:12,right:12,background:'rgba(0,0,0,0.6)',border:'none',color:'#fff',borderRadius:'50%',width:32,height:32,cursor:'pointer',fontSize:16}}>✕</button>
              <div style={{position:'absolute',bottom:0,left:0,right:0,padding:'12px 20px',background:'linear-gradient(transparent,rgba(0,0,0,0.8))'}}>
                <div style={{fontWeight:800,fontSize:18,color:'#fff'}}>{selected.title}</div>
              </div>
            </div>
            <div style={{padding:20}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
                {[
                  { label:'📅 DATE', val: formatDate(selected.event_date).full },
                  { label:'📍 LIEU', val: selected.location + ' ' + (FLAGS[selected.country]||'') },
                  { label:'🎫 BILLETS', val: (selected.tickets_sold||0) + (selected.capacity?' / '+selected.capacity:'') + ' vendus' },
                  { label:'💰 PRIX', val: selected.is_free ? 'Gratuit' : (selected.ticket_price||0).toLocaleString()+' '+(selected.currency||'KMF') },
                  { label:'💵 REVENUS', val: (((selected.tickets_sold||0)*(selected.ticket_price||0)).toLocaleString())+' KMF' },
                  { label:'⚡ BOOST', val: selected.is_boosted ? 'Actif' : 'Inactif' },
                ].map((item,i) => (
                  <div key={i} style={{background:'var(--card2)',borderRadius:8,padding:'10px 12px'}}>
                    <div style={{fontSize:10,color:'var(--text3)',fontWeight:700,letterSpacing:1,marginBottom:4}}>{item.label}</div>
                    <div style={{fontSize:13,fontWeight:600}}>{item.val}</div>
                  </div>
                ))}
              </div>
              {selected.description && (
                <div style={{marginBottom:16}}>
                  <div style={{fontSize:12,color:'var(--text3)',fontWeight:700,marginBottom:6}}>À PROPOS</div>
                  <p style={{fontSize:14,color:'var(--text2)',margin:0}}>{selected.description}</p>
                </div>
              )}
              <div style={{display:'flex',gap:8}}>
                <button onClick={()=>{ setSelected(null); setPage('events') }}
                  style={{flex:1,background:'var(--card2)',border:'1px solid var(--border)',color:'var(--text)',borderRadius:10,padding:12,cursor:'pointer',fontWeight:600,fontSize:14}}>
                  👁️ Voir publiquement
                </button>
                <button onClick={()=>toggleBoost(selected)}
                  style={{flex:1,background:selected.is_boosted?'rgba(245,166,35,0.2)':'linear-gradient(135deg,var(--gold),#d97706)',border:'none',color:selected.is_boosted?'var(--gold)':'#000',borderRadius:10,padding:12,cursor:'pointer',fontWeight:700,fontSize:14}}>
                  ⚡ {selected.is_boosted ? 'Desactiver boost' : 'Booster'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
