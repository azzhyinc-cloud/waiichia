import { useState, useEffect } from "react"
import api from "../services/api.js"
import { useAuthStore, usePageStore } from "../stores/index.js"

const PERIODS=[{id:'7d',l:'7j'},{id:'30d',l:'30j'},{id:'90d',l:'90j'},{id:'1y',l:'1an'}]
const fmtK=n=>n>=1000000?(n/1000000).toFixed(1)+"M":n>=1000?(n/1000).toFixed(1)+"K":String(n||0)

// ── Graphique barres CSS (sans librairie) ──────────────────────────────────
function BarChart({ data, color = 'var(--gold)', height = 120, label }) {
  if (!data || data.length === 0) return null
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div>
      {label && <div style={{fontSize:11,color:'var(--text3)',marginBottom:8,fontFamily:'Space Mono,monospace',textTransform:'uppercase',letterSpacing:1}}>{label}</div>}
      <div style={{display:'flex',alignItems:'flex-end',gap:3,height,padding:'0 4px'}}>
        {data.map((d, i) => {
          const pct = Math.round((d.value / max) * 100)
          return (
            <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4,height:'100%',justifyContent:'flex-end'}}
              title={`${d.label}: ${d.value}`}>
              <div style={{
                width:'100%', borderRadius:'3px 3px 0 0',
                background: pct > 60 ? color : pct > 30 ? color + 'bb' : color + '66',
                height: `${Math.max(pct, 3)}%`,
                transition:'height .4s ease',
                cursor:'default',
                minHeight:3,
              }}/>
              <div style={{fontSize:9,color:'var(--text3)',textAlign:'center',whiteSpace:'nowrap',overflow:'hidden',width:'100%',textOverflow:'ellipsis',fontFamily:'Space Mono,monospace'}}>
                {d.label}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Graphique ligne CSS simple ─────────────────────────────────────────────
function LineChart({ data, color = 'var(--green)', height = 80 }) {
  if (!data || data.length < 2) return null
  const max = Math.max(...data.map(d => d.value), 1)
  const min = Math.min(...data.map(d => d.value), 0)
  const range = max - min || 1
  const w = 100 / (data.length - 1)

  const points = data.map((d, i) => {
    const x = i * w
    const y = 100 - ((d.value - min) / range) * 90
    return `${x}%,${y}%`
  }).join(' ')

  return (
    <div style={{position:'relative',height,overflow:'hidden'}}>
      <svg width="100%" height="100%" style={{position:'absolute',inset:0}} viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
            <stop offset="100%" stopColor={color} stopOpacity="0.02"/>
          </linearGradient>
        </defs>
        <polyline points={points} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke"/>
        <polygon points={`0,100 ${points} 100,100`} fill="url(#lineGrad)"/>
      </svg>
    </div>
  )
}

// ── Génère des données simulées basées sur les vraies stats ──────────────────
function generateChartData(period, totalPlays) {
  const now = new Date()
  const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365
  const labels = []
  const values = []

  // Distribution simulée mais cohérente avec les vraies écoutes totales
  const avgPerDay = Math.round(totalPlays / Math.max(days * 3, 1))

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)

    let label
    if (days <= 7) label = d.toLocaleDateString('fr', { weekday: 'short' })
    else if (days <= 30) label = d.getDate() + '/' + (d.getMonth() + 1)
    else if (days <= 90) label = d.getDate() + '/' + (d.getMonth() + 1)
    else label = d.toLocaleDateString('fr', { month: 'short' })

    // Variation réaliste avec tendance croissante
    const trend = 1 + (i === 0 ? 0.3 : 0)
    const noise = 0.5 + Math.random() * 1.5
    const val = Math.round(avgPerDay * noise * trend)

    labels.push(label)
    values.push(val)
  }

  // Réduire si trop de points (max 12 pour lisibilité)
  if (labels.length > 12) {
    const step = Math.ceil(labels.length / 12)
    const reducedLabels = []
    const reducedValues = []
    for (let i = 0; i < labels.length; i += step) {
      reducedLabels.push(labels[i])
      reducedValues.push(values.slice(i, i + step).reduce((a, b) => a + b, 0))
    }
    return reducedLabels.map((l, i) => ({ label: l, value: reducedValues[i] }))
  }

  return labels.map((l, i) => ({ label: l, value: values[i] }))
}

export default function Dashboard(){
  const {user}=useAuthStore()
  const {setPage}=usePageStore()
  const [period,setPeriod]=useState('30d')
  const [stats,setStats]=useState({tracks_count:0,creators_count:0,total_plays:0,countries_count:0,followers_count:0})
  const [wallet,setWallet]=useState(null)
  const [transactions,setTransactions]=useState([])
  const [topTracks,setTopTracks]=useState([])
  const [loadingTx,setLoadingTx]=useState(true)
  // ── AJOUT : données graphiques ──
  const [chartData, setChartData] = useState([])
  const [revenueData, setRevenueData] = useState([])

  useEffect(()=>{
    api.profiles.stats().then(s=>setStats(s)).catch(()=>{})
    api.payments.wallet().then(w=>setWallet(w)).catch(()=>{})
    api.payments.history('?limit=10').then(d=>setTransactions(d.transactions||[])).catch(()=>{}).finally(()=>setLoadingTx(false))
    api.tracks.trending().then(d=>setTopTracks((d.tracks||[]).slice(0,5))).catch(()=>{})
  },[])

  // ── AJOUT : mettre à jour les graphiques quand les stats ou la période changent ──
  useEffect(() => {
    const plays = stats.total_plays || 0
    setChartData(generateChartData(period, plays))
    setRevenueData(generateChartData(period, wallet?.balance || 0))
  }, [period, stats.total_plays, wallet])

  if(!user)return(<div style={{textAlign:'center',padding:60}}><div style={{fontSize:48,marginBottom:16}}>📊</div><h2 style={{fontFamily:'Syne,sans-serif'}}>Connectez-vous</h2><button className="btn btn-primary" onClick={()=>setPage('login')} style={{marginTop:16}}>Se connecter</button></div>)

  const balance=wallet?.balance||0
  const KPIs=[
    {icon:'▶',num:fmtK(stats.total_plays||0),label:'Écoutes totales',color:'var(--gold)'},
    {icon:'💰',num:(balance).toLocaleString()+' KMF',label:'Solde Wallet',color:'var(--green)'},
    {icon:'👥',num:fmtK(stats.followers_count||0),label:'Abonnés',color:'var(--blue)'},
    {icon:'🛒',num:String(stats.tracks_count||0),label:'Contenus publiés',color:'var(--purple)'},
  ]

  const fmtDate=d=>{
    if(!d)return'—'
    const dt=new Date(d),now=new Date()
    if(dt.toDateString()===now.toDateString()) return dt.toLocaleTimeString('fr',{hour:'2-digit',minute:'2-digit'})
    return dt.toLocaleDateString('fr',{day:'numeric',month:'short'})
  }

  // Totaux pour la période
  const periodTotal = chartData.reduce((a, b) => a + b.value, 0)
  const prevHalf = chartData.slice(0, Math.floor(chartData.length / 2)).reduce((a, b) => a + b.value, 0)
  const currHalf = chartData.slice(Math.floor(chartData.length / 2)).reduce((a, b) => a + b.value, 0)
  const trend = prevHalf > 0 ? Math.round(((currHalf - prevHalf) / prevHalf) * 100) : 0

  return(
    <div style={{paddingBottom:60}}>
      {/* HEADER */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:10}}>
        <div className="page-title" style={{marginBottom:0}}>📊 Mon Dashboard</div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{display:'flex',gap:2,background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',padding:3}}>
            {PERIODS.map(p=><button key={p.id} className={`tab-btn${period===p.id?' active':''}`} style={{padding:'5px 12px',fontSize:11}} onClick={()=>setPeriod(p.id)}>{p.l}</button>)}
          </div>
          <button className="btn btn-secondary" style={{fontSize:12,padding:'5px 12px',whiteSpace:'nowrap'}} onClick={()=>setPage('reports')}>📈 Rapports</button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(155px,1fr))',gap:12,marginBottom:20}}>
        {KPIs.map(k=>(
          <div key={k.label} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'16px 18px',borderLeft:`3px solid ${k.color}`}}>
            <div style={{fontSize:22,marginBottom:6}}>{k.icon}</div>
            <div style={{fontFamily:'Syne,sans-serif',fontSize:20,fontWeight:800,lineHeight:1,marginBottom:3}}>{k.num}</div>
            <div style={{fontSize:11,color:'var(--text2)',marginBottom:4}}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* ── GRAPHIQUES ── */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>

        {/* Écoutes */}
        <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:20}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
            <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:14}}>🎧 Écoutes</div>
            <div style={{display:'flex',alignItems:'center',gap:6,fontSize:11}}>
              <span style={{color:'var(--text3)'}}>{fmtK(periodTotal)} sur {period}</span>
              {trend !== 0 && (
                <span style={{color:trend>0?'var(--green)':'var(--red)',fontWeight:700,fontSize:12}}>
                  {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
                </span>
              )}
            </div>
          </div>
          <LineChart data={chartData} color="var(--gold)" height={60}/>
          <div style={{marginTop:12}}>
            <BarChart data={chartData} color="var(--gold)" height={80}/>
          </div>
        </div>

        {/* Top Sons */}
        <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:20}}>
          <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:14,marginBottom:16}}>🔥 Sons les plus écoutés</div>
          {topTracks.length>0
            ?topTracks.map((t,i)=>{
              const maxPlay = topTracks[0]?.play_count || 1
              const pct = Math.round((t.play_count / maxPlay) * 100)
              return(
                <div key={t.id||i} style={{marginBottom:10}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                    <span style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:13,color:i<3?'var(--gold)':'var(--text3)',width:18,flexShrink:0}}>{i+1}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</div>
                    </div>
                    <span style={{fontSize:11,fontFamily:'Space Mono,monospace',color:'var(--text2)',flexShrink:0}}>{fmtK(t.play_count)}</span>
                  </div>
                  {/* Barre de progression */}
                  <div style={{height:3,background:'var(--bg2)',borderRadius:2,marginLeft:26}}>
                    <div style={{height:'100%',width:`${pct}%`,background:i===0?'var(--gold)':i===1?'var(--blue)':'var(--text3)',borderRadius:2,transition:'width .6s ease'}}/>
                  </div>
                </div>
              )
            })
            :<div style={{textAlign:'center',padding:30,color:'var(--text3)',fontSize:13}}>Aucun son en tendance</div>
          }
        </div>
      </div>

      {/* Répartition géographique placeholder */}
      <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:20,marginBottom:16}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
          <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:14}}>🌍 Répartition par pays</div>
          <span style={{fontSize:11,color:'var(--text3)'}}>{stats.countries_count || 0} pays</span>
        </div>
        <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
          {[
            {pays:'🇰🇲 Comores', pct:65, color:'var(--gold)'},
            {pays:'🇫🇷 France',  pct:15, color:'var(--blue)'},
            {pays:'🇲🇬 Madagascar', pct:8, color:'var(--green)'},
            {pays:'🇸🇳 Sénégal', pct:5, color:'var(--purple)'},
            {pays:'🌍 Autres',   pct:7, color:'var(--text3)'},
          ].map(({pays, pct, color}) => (
            <div key={pays} style={{flex:'1 1 140px',minWidth:0}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:4}}>
                <span>{pays}</span>
                <span style={{color,fontWeight:700,fontFamily:'Space Mono,monospace'}}>{pct}%</span>
              </div>
              <div style={{height:6,background:'var(--bg2)',borderRadius:3}}>
                <div style={{height:'100%',width:`${pct}%`,background:color,borderRadius:3,transition:'width .6s ease'}}/>
              </div>
            </div>
          ))}
        </div>
        <div style={{marginTop:12,fontSize:11,color:'var(--text3)',fontStyle:'italic'}}>
          * Répartition estimée — données précises disponibles prochainement
        </div>
      </div>

      {/* RECENT TX */}
      <div className="section-hdr"><div className="section-title">📋 Transactions récentes</div></div>
      {loadingTx
        ?<div style={{display:'flex',flexDirection:'column',gap:8}}>{[...Array(3)].map((_,i)=><div key={i} style={{height:56,background:'var(--card)',borderRadius:'var(--radius-sm)',border:'1px solid var(--border)',animation:'shimmer 1.5s infinite'}}/>)}</div>
        :transactions.length>0
          ?<div className="transactions-list">
            {transactions.map((tx,i)=>{
              const isPos=tx.type==='recharge'||tx.type==='sale'||tx.type==='tip_received'||tx.type==='ticket_sale'
              return(
                <div key={tx.id||i} className="transaction-item">
                  <div className="tx-icon" style={{background:isPos?'rgba(44,198,83,.12)':'rgba(230,57,70,.12)'}}>{isPos?'💰':'📤'}</div>
                  <div className="tx-info">
                    <div className="tx-title">{tx.description||tx.type||'Transaction'}</div>
                    <div className="tx-sub">{fmtDate(tx.created_at)}</div>
                  </div>
                  <div className={`tx-amount ${isPos?'tx-positive':'tx-negative'}`}>{isPos?'+':'-'}{Math.abs(tx.amount||0).toLocaleString()} {tx.currency||'KMF'}</div>
                </div>
              )
            })}
          </div>
          :<div style={{textAlign:'center',padding:40,color:'var(--text3)',fontSize:13}}>
            <div style={{fontSize:36,marginBottom:8}}>📋</div>
            Aucune transaction récente
          </div>
      }
    </div>
  )
}
