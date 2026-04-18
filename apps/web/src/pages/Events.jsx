import { useState, useEffect } from "react"
import { useAuthStore, usePageStore } from "../stores/index.js"
import ShareModal from "../components/ShareModal.jsx"
import api from "../services/api.js"

const TYPES=['Tous','Concert','Festival','Podcast Live','Business']
const PAYS=[{v:'',l:'🌍 Tous pays'},{v:'KM',l:'🇰🇲 Comores'},{v:'MG',l:'🇲🇬 Madagascar'},{v:'CI',l:"🇨🇮 Côte d'Ivoire"},{v:'NG',l:'🇳🇬 Nigeria'},{v:'TZ',l:'🇹🇿 Tanzanie'},{v:'RW',l:'🇷🇼 Rwanda'}]
const BGS=["linear-gradient(135deg,#0d2a3a,#1a5060)","linear-gradient(135deg,#1a0a2e,#4a1a7a)","linear-gradient(135deg,#2e1a00,#7a4000)","linear-gradient(135deg,#0d1a3a,#1a3070)","linear-gradient(135deg,#002a10,#007040)","linear-gradient(135deg,#1a0020,#5a0060)"]
const MOCK=[
  {id:"ev1",title:"Nuit Twarab Moroni",event_date:"2026-03-22T20:00:00Z",location:"Moroni, Comores",country:"KM",category:"Concert",ticket_price:5000,currency:"KMF",is_free:false,is_boosted:true,capacity:500,tickets_sold:342,description:"Une nuit magique de Twarab avec les meilleurs artistes des Comores. Ambiance garantie !"},
  {id:"ev2",title:"Festival de la Musique KM",event_date:"2026-04-01T18:00:00Z",location:"Anjouan, Comores",country:"KM",category:"Festival",ticket_price:0,currency:"KMF",is_free:true,is_boosted:false,capacity:2000,tickets_sold:890,description:"Le plus grand festival musical des Comores. Entrée libre pour tous !"},
  {id:"ev3",title:"Afrobeats Night Lagos",event_date:"2026-04-15T21:00:00Z",location:"Lagos, Nigeria",country:"NG",category:"Concert",ticket_price:5000,currency:"NGN",is_free:false,is_boosted:true,capacity:800,tickets_sold:654,description:"La plus grande soirée Afrobeats de Lagos avec des artistes internationaux."},
  {id:"ev4",title:"Waiichia Live — Moroni",event_date:"2026-06-14T19:00:00Z",location:"Stade Moroni, Comores",country:"KM",category:"Concert",ticket_price:10000,currency:"KMF",is_free:false,is_boosted:true,capacity:5000,tickets_sold:1200,description:"Le concert événement de l'année ! Tous les artistes Waiichia réunis sur une seule scène."},
  {id:"ev5",title:"Podcast Summit Afrique",event_date:"2026-05-10T09:00:00Z",location:"Kigali, Rwanda",country:"RW",category:"Business",ticket_price:15000,currency:"RWF",is_free:false,is_boosted:false,capacity:300,tickets_sold:180,description:"Conférence dédiée aux podcasters africains. Networking, workshops et masterclasses."},
  {id:"ev6",title:"Live Acoustique Fomboni",event_date:"2026-04-20T17:00:00Z",location:"Fomboni, Mohéli",country:"KM",category:"Concert",ticket_price:0,currency:"KMF",is_free:true,is_boosted:false,capacity:200,tickets_sold:95,description:"Session acoustique intime au bord de la mer à Fomboni."},
]
const FLAGS={KM:'🇰🇲',MG:'🇲🇬',NG:'🇳🇬',CI:'🇨🇮',TZ:'🇹🇿',RW:'🇷🇼',SN:'🇸🇳',CD:'🇨🇩',GH:'🇬🇭'}
const MONTHS=['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc']

export default function Events(){
  const {user}=useAuthStore()
  const token=localStorage.getItem('waiichia_token')
  const {setPage}=usePageStore()
  const [type,setType]=useState('Tous')
  const [pays,setPays]=useState('')
  const [events,setEvents]=useState([])
  const [loading,setLoading]=useState(true)
  const [shareItem,setShareItem]=useState(null)
  const [selected,setSelected]=useState(null)
  const [registering,setRegistering]=useState(null)

  useEffect(()=>{
    api.events.list('?limit=30')
      .then(d=>setEvents(d.events?.length?d.events:MOCK))
      .catch(()=>setEvents(MOCK))
      .finally(()=>setLoading(false))
  },[])

  const filtered=events.filter(e=>{
    if(type!=='Tous'&&!e.category?.toLowerCase().includes(type.toLowerCase()))return false
    if(pays&&e.country!==pays)return false
    return true
  })

  const formatDate=(d)=>{
    if(!d)return''
    const date=new Date(d)
    return date.toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'})
  }

  const registerEvent=async(ev)=>{
    if(!token)return alert('Connectez-vous pour réserver')
    setRegistering(ev.id)
    try{
      await api.post('/api/events/tickets',{event_id:ev.id})
      alert('Réservation confirmée !')
    }catch(e){
      alert(e.message||'Erreur de réservation')
    }
    setRegistering(null)
  }

  return(
    <div style={{paddingBottom:40}}>
      <div className="page-title">🎪 Événements</div>

      {/* FILTRES */}
      <div className="filter-bar">
        {TYPES.map(t=>(
          <div key={t} className={`pill-tab${type===t?' active':''}`} onClick={()=>setType(t)}>{t}</div>
        ))}
        <select className="select-styled" value={pays} onChange={e=>setPays(e.target.value)}>
          {PAYS.map(p=><option key={p.v} value={p.v}>{p.l}</option>)}
        </select>
      </div>

      {/* EVENTS GRID */}
      {loading
        ?<div className="events-grid">{[...Array(4)].map((_,i)=><div key={i} style={{height:120,background:'var(--card)',borderRadius:'var(--radius)',border:'1px solid var(--border)',animation:'shimmer 1.5s infinite'}}/>)}</div>
        :<div className="events-grid">
          {filtered.map((ev,i)=>{
            const d=new Date(ev.event_date||ev.start_date)
            const day=d.getDate()
            const month=MONTHS[d.getMonth()]
            const isFree=ev.is_free||ev.ticket_price===0
            const price=isFree?'Gratuit':(ev.ticket_price?.toLocaleString()+' '+(ev.currency||'KMF'))
            const flag=FLAGS[ev.country]||'🌍'
            const pct=ev.capacity?Math.round((ev.tickets_sold||0)/ev.capacity*100):0

            return(
              <div key={ev.id} className="event-card" onClick={()=>setSelected(ev)} style={{cursor:'pointer'}}>
                <div className="event-date-box" style={{background:BGS[i%6]}}>
                  <span className="event-day">{day}</span>
                  <span className="event-month">{month}</span>
                </div>
                <div className="event-info">
                  <div className="event-title">
                    {ev.title}
                    {ev.is_boosted&&<span style={{fontSize:9,background:'var(--gold)',color:'#000',borderRadius:20,padding:'2px 7px',fontFamily:'Space Mono,monospace',fontWeight:700,marginLeft:6}}>BOOST</span>}
                  </div>
                  <div className="event-meta">
                    <span>📍 {ev.location} {flag}</span>
                    <span className="event-cat">{ev.category}</span>
                  </div>
                  <div style={{marginTop:8}}>
                    {ev.capacity&&<div style={{marginBottom:6}}>
                      <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'var(--text3)',marginBottom:3}}>
                        <span>{ev.tickets_sold||0} / {ev.capacity} places</span>
                        <span>{pct}%</span>
                      </div>
                      <div style={{height:3,background:'var(--border)',borderRadius:3,overflow:'hidden'}}>
                        <div style={{height:'100%',width:pct+'%',background:pct>80?'var(--red)':'var(--gold)',borderRadius:3,transition:'width .5s'}}/>
                      </div>
                    </div>}
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:6}}>
                      <span style={{fontFamily:'Space Mono,monospace',fontSize:12,fontWeight:700,color:isFree?'var(--green)':'var(--gold)'}}>{price}</span>
                      <div style={{display:'flex',gap:4,alignItems:'center'}}>
                        <button onClick={(e)=>{e.stopPropagation();setShareItem(ev)}} style={{background:'none',border:'1px solid var(--border)',borderRadius:6,cursor:'pointer',fontSize:'0.7rem',padding:'4px 8px',color:'var(--text-secondary)'}}>🔗</button>
                        <button className="btn btn-sm" onClick={(e)=>{e.stopPropagation();setSelected(ev)}} style={{padding:'5px 14px',fontSize:11,background:isFree?'var(--green)':'linear-gradient(135deg,var(--gold),#e8920a)',border:'none',borderRadius:50,cursor:'pointer',color:'#000',fontWeight:700,fontFamily:'Plus Jakarta Sans,sans-serif'}}>
                          Détails
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
          {!filtered.length&&<div style={{gridColumn:'1/-1',textAlign:'center',padding:60,color:'var(--text3)'}}>Aucun événement avec ces filtres</div>}
        </div>
      }

      {/* BOUTON CRÉER */}
      <div style={{textAlign:'center',marginTop:32}}>
        <button className="btn btn-primary" onClick={()=>setPage('create_event')}>🎪 Créer un événement</button>
      </div>

      {/* ══════ MODAL DÉTAIL ══════ */}
      {selected&&(
        <div onClick={()=>setSelected(null)} style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.7)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem'}}>
          <div onClick={e=>e.stopPropagation()} style={{background:'var(--card)',borderRadius:16,width:'100%',maxWidth:500,maxHeight:'85vh',overflow:'auto',border:'1px solid var(--border)'}}>
            {/* Cover */}
            <div style={{
              height:180,
              background:selected.cover_url?`url(${selected.cover_url}) center/cover`:BGS[0],
              borderRadius:'16px 16px 0 0',position:'relative',
              display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'3rem'
            }}>
              {!selected.cover_url&&'🎪'}
              <button onClick={()=>setSelected(null)} style={{position:'absolute',top:12,right:12,background:'rgba(0,0,0,0.5)',color:'#fff',border:'none',borderRadius:'50%',width:32,height:32,cursor:'pointer',fontSize:'1rem'}}>✕</button>
              {selected.is_boosted&&<span style={{position:'absolute',top:12,left:12,fontSize:10,background:'var(--gold)',color:'#000',borderRadius:20,padding:'3px 10px',fontWeight:700}}>⚡ BOOST</span>}
            </div>

            <div style={{padding:'1.2rem'}}>
              <h2 style={{fontSize:'1.2rem',fontWeight:700,color:'var(--text)',marginBottom:8,fontFamily:'Syne,sans-serif'}}>{selected.title}</h2>

              <div style={{display:'flex',flexDirection:'column',gap:'0.4rem',marginBottom:'1rem',fontSize:'0.85rem',color:'var(--text-secondary)'}}>
                <div>📅 {formatDate(selected.event_date||selected.start_date)}</div>
                <div>📍 {selected.location} {FLAGS[selected.country]||'🌍'}</div>
                <div>🏷️ {selected.category||'Événement'}</div>
                <div>💰 {selected.is_free||selected.ticket_price===0?'Gratuit':((selected.ticket_price?.toLocaleString())+' '+(selected.currency||'KMF'))}</div>
                {selected.capacity&&<div>🎫 {selected.tickets_sold||0} / {selected.capacity} places ({Math.round((selected.tickets_sold||0)/selected.capacity*100)}% rempli)</div>}
              </div>

              {/* Jauge */}
              {selected.capacity&&(()=>{
                const pct=Math.round((selected.tickets_sold||0)/selected.capacity*100)
                return <div style={{marginBottom:'1rem'}}>
                  <div style={{height:6,background:'var(--border)',borderRadius:6,overflow:'hidden'}}>
                    <div style={{height:'100%',width:pct+'%',background:pct>80?'var(--red)':'var(--gold)',borderRadius:6,transition:'width .5s'}}/>
                  </div>
                </div>
              })()}

              {/* Description */}
              {selected.description&&(
                <div style={{fontSize:'0.9rem',color:'var(--text)',lineHeight:1.6,marginBottom:'1rem',whiteSpace:'pre-wrap',padding:'0.8rem',background:'var(--bg)',borderRadius:8,border:'1px solid var(--border)'}}>
                  {selected.description}
                </div>
              )}

              {/* Organisateur */}
              {selected.profiles&&(
                <div onClick={()=>{setSelected(null);setPage('profile',{profileUsername:selected.profiles.username})}} style={{display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'1rem',cursor:'pointer',padding:'0.5rem',background:'var(--bg)',borderRadius:8,border:'1px solid var(--border)'}}>
                  <div style={{width:36,height:36,borderRadius:'50%',background:selected.profiles.avatar_url?`url(${selected.profiles.avatar_url}) center/cover`:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:'0.9rem'}}>
                    {!selected.profiles.avatar_url&&(selected.profiles.display_name||'?')[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{fontWeight:600,fontSize:'0.85rem',color:'var(--text)'}}>{selected.profiles.display_name||selected.profiles.username}</div>
                    <div style={{fontSize:'0.7rem',color:'var(--text-secondary)'}}>Organisateur</div>
                  </div>
                </div>
              )}

              {/* Boutons */}
              <div style={{display:'flex',gap:'0.5rem'}}>
                <button
                  onClick={()=>registerEvent(selected)}
                  disabled={registering===selected.id}
                  style={{
                    flex:1,padding:'0.7rem',border:'none',borderRadius:8,cursor:'pointer',fontWeight:700,fontSize:'0.9rem',
                    background:selected.is_free||selected.ticket_price===0?'var(--green)':'linear-gradient(135deg,var(--gold),#e8920a)',
                    color:'#000',opacity:registering===selected.id?0.6:1
                  }}
                >
                  {registering===selected.id?'Réservation...':(selected.is_free||selected.ticket_price===0?'✓ S\'inscrire':'🎫 Réserver')}
                </button>
                <button onClick={()=>setShareItem(selected)} style={{padding:'0.7rem 1rem',background:'var(--bg)',border:'1px solid var(--border)',borderRadius:8,cursor:'pointer',fontSize:'1rem'}}>🔗</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ShareModal */}
      <ShareModal isOpen={!!shareItem} onClose={()=>setShareItem(null)} item={shareItem} type="event" />
    </div>
  )
}
