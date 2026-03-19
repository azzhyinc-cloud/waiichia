import { useState, useEffect } from "react"
import { usePageStore } from "../stores/index.js"
import api from "../services/api.js"

const TYPES=['Tous','Concert','Festival','Podcast Live','Business']
const PAYS=[{v:'',l:'🌍 Tous pays'},{v:'KM',l:'🇰🇲 Comores'},{v:'MG',l:'🇲🇬 Madagascar'},{v:'CI',l:"🇨🇮 Côte d'Ivoire"},{v:'NG',l:'🇳🇬 Nigeria'},{v:'TZ',l:'🇹🇿 Tanzanie'},{v:'RW',l:'🇷🇼 Rwanda'}]
const BGS=["linear-gradient(135deg,#0d2a3a,#1a5060)","linear-gradient(135deg,#1a0a2e,#4a1a7a)","linear-gradient(135deg,#2e1a00,#7a4000)","linear-gradient(135deg,#0d1a3a,#1a3070)","linear-gradient(135deg,#002a10,#007040)","linear-gradient(135deg,#1a0020,#5a0060)"]
const MOCK=[
  {id:"ev1",title:"Nuit Twarab Moroni",event_date:"2026-03-22T20:00:00Z",location:"Moroni, Comores",country:"KM",category:"Concert",ticket_price:5000,currency:"KMF",is_free:false,is_boosted:true,capacity:500,tickets_sold:342},
  {id:"ev2",title:"Festival de la Musique KM",event_date:"2026-04-01T18:00:00Z",location:"Anjouan, Comores",country:"KM",category:"Festival",ticket_price:0,currency:"KMF",is_free:true,is_boosted:false,capacity:2000,tickets_sold:890},
  {id:"ev3",title:"Afrobeats Night Lagos",event_date:"2026-04-15T21:00:00Z",location:"Lagos, Nigeria",country:"NG",category:"Concert",ticket_price:5000,currency:"NGN",is_free:false,is_boosted:true,capacity:800,tickets_sold:654},
  {id:"ev4",title:"Waiichia Live — Moroni",event_date:"2026-06-14T19:00:00Z",location:"Stade Moroni, Comores",country:"KM",category:"Concert",ticket_price:10000,currency:"KMF",is_free:false,is_boosted:true,capacity:5000,tickets_sold:1200},
  {id:"ev5",title:"Podcast Summit Afrique",event_date:"2026-05-10T09:00:00Z",location:"Kigali, Rwanda",country:"RW",category:"Business",ticket_price:15000,currency:"RWF",is_free:false,is_boosted:false,capacity:300,tickets_sold:180},
  {id:"ev6",title:"Live Acoustique Fomboni",event_date:"2026-04-20T17:00:00Z",location:"Fomboni, Mohéli",country:"KM",category:"Concert",ticket_price:0,currency:"KMF",is_free:true,is_boosted:false,capacity:200,tickets_sold:95},
]
const FLAGS={KM:'🇰🇲',MG:'🇲🇬',NG:'🇳🇬',CI:'🇨🇮',TZ:'🇹🇿',RW:'🇷🇼',SN:'🇸🇳',CD:'🇨🇩',GH:'🇬🇭'}
const MONTHS=['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc']

export default function Events(){
  const {setPage}=usePageStore()
  const [type,setType]=useState('Tous')
  const [pays,setPays]=useState('')
  const [events,setEvents]=useState([])
  const [loading,setLoading]=useState(true)

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
            const d=new Date(ev.event_date)
            const day=d.getDate()
            const month=MONTHS[d.getMonth()]
            const isFree=ev.is_free||ev.ticket_price===0
            const price=isFree?'Gratuit':(ev.ticket_price?.toLocaleString()+' '+(ev.currency||'KMF'))
            const flag=FLAGS[ev.country]||'🌍'
            const pct=ev.capacity?Math.round((ev.tickets_sold||0)/ev.capacity*100):0

            return(
              <div key={ev.id} className="event-card">
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
                  {/* JAUGE + PRIX */}
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
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                      <span style={{fontFamily:'Space Mono,monospace',fontSize:12,fontWeight:700,color:isFree?'var(--green)':'var(--gold)'}}>{price}</span>
                      <button className="btn btn-sm" style={{padding:'5px 14px',fontSize:11,background:isFree?'var(--green)':'linear-gradient(135deg,var(--gold),#e8920a)',border:'none',borderRadius:50,cursor:'pointer',color:'#000',fontWeight:700,fontFamily:'Plus Jakarta Sans,sans-serif'}}>
                        {isFree?'✓ S\'inscrire':'🎫 Réserver'}
                      </button>
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
    </div>
  )
}
