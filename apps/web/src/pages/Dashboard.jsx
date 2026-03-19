import { useState, useEffect } from "react"
import api from "../services/api.js"
import { useAuthStore, usePageStore } from "../stores/index.js"

const PERIODS=[{id:'7d',l:'7j'},{id:'30d',l:'30j'},{id:'90d',l:'90j'},{id:'1y',l:'1an'}]
const fmtK=n=>n>=1000000?(n/1000000).toFixed(1)+"M":n>=1000?(n/1000).toFixed(1)+"K":String(n||0)
const GEO=[{c:'🇰🇲 Comores',pct:42},{c:'🇲🇬 Madagascar',pct:18},{c:'🇨🇮 Côte d\'Ivoire',pct:12},{c:'🇳🇬 Nigeria',pct:10},{c:'🇫🇷 France',pct:8},{c:'🇸🇳 Sénégal',pct:6},{c:'🇹🇿 Tanzanie',pct:4}]
const TOP_TRACKS=[{t:'Twarab ya Komori',a:'Kolo Officiel',p:24800},{t:'Moroni by Night',a:'DJ Chami',p:18200},{t:'Afrika Rising',a:'Wally Afro',p:12100},{t:'Mindset Afrique',a:'Coach Amina',p:15000},{t:'Vibrate Africa',a:'Nadjib Pro',p:11200}]
const REV_SOURCES=[{l:'Ventes de sons',v:'42%',c:'var(--gold)'},{l:'Locations',v:'24%',c:'var(--blue)'},{l:'Tickets événements',v:'18%',c:'var(--green)'},{l:'Tips / Dons',v:'10%',c:'var(--purple)'},{l:'Publicité',v:'6%',c:'var(--red)'}]
const EXPENSES=[{l:'Commission Waiichia',v:'15%',c:'var(--red)'},{l:'Retraits',v:'35%',c:'var(--gold)'},{l:'Transferts',v:'28%',c:'var(--blue)'},{l:'Boost contenu',v:'12%',c:'var(--purple)'},{l:'Abonnements',v:'10%',c:'var(--green)'}]
const DAYS=['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']
const HOURS=Array.from({length:24},(_,i)=>i+'h')

export default function Dashboard(){
  const {user}=useAuthStore()
  const {setPage}=usePageStore()
  const [period,setPeriod]=useState('30d')
  const [stats,setStats]=useState({tracks_count:0,creators_count:0,total_plays:0,countries_count:0})
  useEffect(()=>{api.profiles.stats().then(s=>setStats(s)).catch(()=>{})},[])
  const [txFilter,setTxFilter]=useState('Aujourd\'hui')

  if(!user)return(<div style={{textAlign:'center',padding:60}}><div style={{fontSize:48,marginBottom:16}}>📊</div><h2 style={{fontFamily:'Syne,sans-serif'}}>Connectez-vous</h2><button className="btn btn-primary" onClick={()=>setPage('login')} style={{marginTop:16}}>Se connecter</button></div>)

  const KPIs=[
    {icon:'▶',num:stats.total_plays>=1000000?(stats.total_plays/1000000).toFixed(1)+'M':stats.total_plays>=1000?(stats.total_plays/1000).toFixed(1)+'K':String(stats.total_plays||0),label:'Écoutes',delta:'▲ +14%',up:true,color:'var(--gold)'},
    {icon:'💰',num:'148K KMF',label:'Revenus',delta:'▲ +22%',up:true,color:'var(--green)'},
    {icon:'👥',num:stats.creators_count>=1000?(stats.creators_count/1000).toFixed(1)+'K':String(stats.creators_count||0),label:'Créateurs',delta:'▲ +8.4%',up:true,color:'var(--blue)'},
    {icon:'🛒',num:String(stats.tracks_count||0),label:'Contenus',delta:'▲ +18%',up:true,color:'var(--purple)'},
    {icon:'🎫',num:'1.2K',label:'Tickets vendus',delta:'▲ +32%',up:true,color:'var(--red)'},
    {icon:'📢',num:'89K',label:'Impressions pub',delta:'▲ +5%',up:true,color:'var(--gold)'},
  ]

  return(
    <div style={{paddingBottom:60}}>
      {/* HEADER */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:10}}>
        <div className="page-title" style={{marginBottom:0}}>📊 Analytics Temps Réel</div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{display:'flex',alignItems:'center',gap:6,fontSize:11,color:'var(--green)'}}>
            <div style={{width:6,height:6,borderRadius:'50%',background:'var(--green)',animation:'live-pulse 2s infinite'}}/>Données en direct
          </div>
          <div style={{display:'flex',gap:2,background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',padding:3}}>
            {PERIODS.map(p=><button key={p.id} className={`tab-btn${period===p.id?' active':''}`} style={{padding:'5px 12px',fontSize:11}} onClick={()=>setPeriod(p.id)}>{p.l}</button>)}
          </div>
          <button className="btn btn-secondary btn-sm">📥 Exporter</button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(155px,1fr))',gap:12,marginBottom:20}}>
        {KPIs.map(k=>(
          <div key={k.label} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'16px 18px',borderLeft:`3px solid ${k.color}`}}>
            <div style={{fontSize:22,marginBottom:6}}>{k.icon}</div>
            <div style={{fontFamily:'Syne,sans-serif',fontSize:20,fontWeight:800,lineHeight:1,marginBottom:3}}>{k.num}</div>
            <div style={{fontSize:11,color:'var(--text2)',marginBottom:4}}>{k.label}</div>
            <div style={{fontSize:10,fontFamily:'Space Mono,monospace',color:k.up?'var(--green)':'var(--red)'}}>{k.delta}</div>
          </div>
        ))}
      </div>

      {/* MAIN CHART */}
      <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:20,marginBottom:16}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:15}}>📈 Écoutes & Revenus — 30 derniers jours</div>
          <div style={{display:'flex',gap:14,fontSize:11,color:'var(--text2)'}}>
            <span style={{display:'flex',alignItems:'center',gap:5}}><span style={{width:10,height:3,background:'var(--gold)',borderRadius:2,display:'inline-block'}}/>Écoutes</span>
            <span style={{display:'flex',alignItems:'center',gap:5}}><span style={{width:10,height:3,background:'var(--green)',borderRadius:2,display:'inline-block'}}/>Revenus</span>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'flex-end',gap:3,height:160}}>
          {Array.from({length:30},(_,i)=>{const h=20+Math.random()*80;return(
            <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
              <div style={{width:'100%',height:h+'%',background:`linear-gradient(180deg,var(--gold),rgba(245,166,35,.3))`,borderRadius:'2px 2px 0 0',minHeight:4}}/>
            </div>
          )})}
        </div>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:9.5,color:'var(--text3)',fontFamily:'Space Mono,monospace',marginTop:6}}>
          {['1','5','10','15','20','25','30'].map(d=><span key={d}>{d}</span>)}
        </div>
      </div>

      {/* 2 COL: Geo + Top tracks */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
        <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:20}}>
          <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:15,marginBottom:16}}>🌍 Audience par pays</div>
          {GEO.map(g=>(
            <div key={g.c} style={{display:'flex',alignItems:'center',gap:8,marginBottom:10,fontSize:12}}>
              <span style={{width:100,flexShrink:0,color:'var(--text2)'}}>{g.c}</span>
              <div style={{flex:1,height:6,background:'var(--border2)',borderRadius:4,overflow:'hidden'}}><div style={{height:'100%',width:g.pct+'%',background:'var(--gold)',borderRadius:4}}/></div>
              <span style={{width:30,textAlign:'right',fontFamily:'Space Mono,monospace',color:'var(--text2)',fontSize:11}}>{g.pct}%</span>
            </div>
          ))}
        </div>
        <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:20}}>
          <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:15,marginBottom:16}}>🔥 Top sons cette période</div>
          {TOP_TRACKS.map((t,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:i<TOP_TRACKS.length-1?'1px solid var(--border)':'none'}}>
              <span style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:14,color:i<3?'var(--gold)':'var(--text3)',width:20}}>{i+1}</span>
              <div style={{flex:1,minWidth:0}}><div style={{fontSize:12,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.t}</div><div style={{fontSize:11,color:'var(--text3)'}}>{t.a}</div></div>
              <span style={{fontSize:11,fontFamily:'Space Mono,monospace',color:'var(--text2)'}}>{fmtK(t.p)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* HEATMAP */}
      <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:20,marginBottom:16}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:16}}>
          <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:15}}>🕐 Heatmap — Écoutes par heure</div>
          <div style={{fontSize:11,color:'var(--text2)'}}>Heure locale de vos auditeurs</div>
        </div>
        <div style={{overflowX:'auto'}}>
          <div style={{display:'grid',gridTemplateColumns:`40px repeat(${HOURS.length},1fr)`,gap:2,fontSize:10}}>
            <div/>
            {HOURS.map(h=><div key={h} style={{textAlign:'center',color:'var(--text3)',fontFamily:'Space Mono,monospace',fontSize:8}}>{h}</div>)}
            {DAYS.map(d=><>
              <div key={d} style={{color:'var(--text3)',fontSize:10,display:'flex',alignItems:'center'}}>{d}</div>
              {HOURS.map((_,h)=>{const v=Math.random();return<div key={d+h} style={{width:'100%',aspectRatio:'1',borderRadius:2,background:`rgba(245,166,35,${v<.2?0.05:v<.4?0.2:v<.6?0.4:v<.8?0.65:0.9})`}}/>})}
            </>)}
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:6,marginTop:8,fontSize:10,color:'var(--text3)'}}>
          <span>Moins</span>
          {[0.05,0.2,0.4,0.65,0.9].map(v=><div key={v} style={{width:12,height:12,borderRadius:2,background:`rgba(245,166,35,${v})`}}/>)}
          <span>Plus</span>
        </div>
      </div>

      {/* REVENUE + EXPENSES */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
        <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:20}}>
          <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:15,marginBottom:16,display:'flex',alignItems:'center',gap:8}}>💚 Sources de revenus</div>
          {REV_SOURCES.map(r=>(
            <div key={r.l} style={{display:'flex',alignItems:'center',gap:8,marginBottom:10,fontSize:12}}>
              <div style={{width:8,height:8,borderRadius:'50%',background:r.c,flexShrink:0}}/>
              <span style={{flex:1,color:'var(--text2)'}}>{r.l}</span>
              <span style={{fontFamily:'Space Mono,monospace',fontWeight:700}}>{r.v}</span>
            </div>
          ))}
        </div>
        <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:20}}>
          <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:15,marginBottom:16,display:'flex',alignItems:'center',gap:8}}>🔴 Dépenses par catégorie</div>
          {EXPENSES.map(r=>(
            <div key={r.l} style={{display:'flex',alignItems:'center',gap:8,marginBottom:10,fontSize:12}}>
              <div style={{width:8,height:8,borderRadius:'50%',background:r.c,flexShrink:0}}/>
              <span style={{flex:1,color:'var(--text2)'}}>{r.l}</span>
              <span style={{fontFamily:'Space Mono,monospace',fontWeight:700}}>{r.v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* RECENT TX */}
      <div className="section-hdr"><div className="section-title">📋 Transactions récentes</div></div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16}}>
        {['Aujourd\'hui','Semaine','Mois'].map(p=><div key={p} className={`pill-tab${txFilter===p?' active':''}`} onClick={()=>setTxFilter(p)}>{p}</div>)}
        <select className="select-styled"><option>Tout</option><option>Streaming</option><option>Billets</option><option>Boutique</option><option>Pub</option></select>
      </div>
      <div className="transactions-list">
        {[{t:'Vente — Twarab ya Komori',s:'@wallyafro',a:'+2 500 KMF',pos:true,time:'14:32'},{t:'Location — Moroni by Night',s:'@fatima_k · 7j',a:'+800 KMF',pos:true,time:'11:20'},{t:'Ticket — Nuit Twarab',s:'3 billets vendus',a:'+15 000 KMF',pos:true,time:'Hier'},{t:'Commission Waiichia',s:'15% sur ventes',a:'-2 295 KMF',pos:false,time:'Hier'}].map((tx,i)=>(
          <div key={i} className="transaction-item">
            <div className="tx-icon" style={{background:tx.pos?'rgba(44,198,83,.12)':'rgba(230,57,70,.12)'}}>{tx.pos?'💰':'📤'}</div>
            <div className="tx-info"><div className="tx-title">{tx.t}</div><div className="tx-sub">{tx.s} · {tx.time}</div></div>
            <div className={`tx-amount ${tx.pos?'tx-positive':'tx-negative'}`}>{tx.a}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
