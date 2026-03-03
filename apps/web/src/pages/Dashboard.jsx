import { useState, useEffect } from 'react'
import { useAuthStore, usePageStore } from '../stores/index.js'
import api from '../services/api.js'

const API = import.meta.env.VITE_API_URL
const formatK = (n) => {
  if (!n) return '0'
  if (n >= 1000000) return (n/1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n/1000).toFixed(1) + 'K'
  return String(n)
}
const formatDate = (d) => new Date(d).toLocaleDateString('fr-FR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})

export default function Dashboard() {
  const { user } = useAuthStore()
  const { setPage } = usePageStore()
  const [tab, setTab] = useState('overview')
  const [period, setPeriod] = useState('month')
  const [stats, setStats] = useState(null)
  const [tracks, setTracks] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [topTracks, setTopTracks] = useState([])
  const [txByDay, setTxByDay] = useState([])

  useEffect(() => {
    if (!user) return
    loadAll()
  }, [user])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [profileStats, myTracks, tx, wallet] = await Promise.all([
        fetch(API + '/api/profiles/' + user.username + '/stats').then(r=>r.json()),
        api.tracks.myTracks(),
        api.payments.history(),
        api.payments.wallet(),
      ])
      const txList = tx.transactions || []
      const recettes = txList.filter(t=>t.status==='completed'&&t.recipient_id===user.id).reduce((a,t)=>a+(t.net_amount||0),0)
      const depenses = txList.filter(t=>t.status==='completed'&&t.user_id===user.id&&t.type!=='recharge').reduce((a,t)=>a+(t.amount||0),0)
      setStats({
        plays: profileStats.total_plays || 0,
        followers: profileStats.followers_count || 0,
        following: profileStats.following_count || 0,
        tracks_count: (myTracks.tracks||[]).length,
        recettes,
        depenses,
        benefice: recettes - depenses,
        transactions: txList.length,
        balance: wallet.balance || 0,
      })
      setTracks(myTracks.tracks || [])
      setTransactions(txList)

      // Top 5 sons par ecoutes
      const sorted = [...(myTracks.tracks||[])].sort((a,b)=>(b.play_count||0)-(a.play_count||0)).slice(0,5)
      setTopTracks(sorted)

      // Transactions par jour (7 derniers jours)
      const days = [...Array(7)].map((_,i) => {
        const d = new Date(); d.setDate(d.getDate() - (6-i))
        const key = d.toLocaleDateString('fr-FR',{weekday:'short'})
        const dayTx = txList.filter(t => {
          const td = new Date(t.created_at)
          return td.getDate()===d.getDate() && td.getMonth()===d.getMonth()
        })
        const revenus = dayTx.filter(t=>t.recipient_id===user.id&&t.status==='completed').reduce((a,t)=>a+(t.net_amount||0),0)
        const depenses = dayTx.filter(t=>t.user_id===user.id&&t.type!=='recharge'&&t.status==='completed').reduce((a,t)=>a+(t.amount||0),0)
        return { key, revenus, depenses, count: dayTx.length }
      })
      setTxByDay(days)
    } catch(e) {}
    setLoading(false)
  }

  const deleteTrack = async (id) => {
    if (!confirm('Supprimer ce son ?')) return
    const token = localStorage.getItem('waiichia_token')
    await fetch(API + '/api/tracks/' + id, { method:'DELETE', headers:{'Authorization':'Bearer '+token} })
    setTracks(t => t.filter(x => x.id !== id))
  }

  if (!user) return (
    <div style={{textAlign:'center',padding:80}}>
      <div style={{fontSize:56,marginBottom:16}}>📊</div>
      <h2>Dashboard Créateur</h2>
      <button onClick={()=>setPage('login')} style={{marginTop:16,background:'var(--primary)',border:'none',color:'#fff',padding:'10px 24px',borderRadius:8,cursor:'pointer'}}>Se connecter</button>
    </div>
  )

  const TABS = [['overview','📊 Vue globale'],['content','🎵 Mon Contenu'],['finances','💰 Finances'],['analytics','📈 Analytiques']]

  const statCards = stats ? [
    { icon:'💰', num: stats.recettes.toLocaleString(), label:'Recettes KMF', color:'#2cc653', bg:'rgba(44,198,83,0.1)' },
    { icon:'💸', num: stats.depenses.toLocaleString(), label:'Depenses KMF', color:'#e74c3c', bg:'rgba(230,57,70,0.1)' },
    { icon:'📈', num: (stats.recettes-stats.depenses).toLocaleString(), label:'Benefice Net', color:'#f5a623', bg:'rgba(245,166,35,0.1)' },
    { icon:'🎧', num: formatK(stats.plays), label:'Total Ecoutes', color:'#4d9fff', bg:'rgba(77,159,255,0.1)' },
    { icon:'👥', num: formatK(stats.followers), label:'Abonnes', color:'#a855f7', bg:'rgba(168,85,247,0.1)' },
  ] : []

  const revenueSources = [
    { label:'Ventes de sons', pct: 45, color:'#2cc653' },
    { label:'Locations', pct: 25, color:'#4d9fff' },
    { label:'Billets evenements', pct: 20, color:'#f5a623' },
    { label:'Publicite', pct: 10, color:'#a855f7' },
  ]

  return (
    <div style={{padding:'24px 20px 100px'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24,flexWrap:'wrap',gap:12}}>
        <div>
          <h1 style={{fontSize:24,fontWeight:900,margin:'0 0 4px'}}>📊 Compte Commercial</h1>
          <p style={{color:'var(--text2)',fontSize:13,margin:0}}>Bienvenue, {user.display_name || user.username}</p>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={()=>setPage('upload')} style={{background:'var(--primary)',border:'none',color:'#fff',borderRadius:8,padding:'8px 16px',cursor:'pointer',fontWeight:600,fontSize:13}}>+ Publier</button>
          <button onClick={()=>setPage('wallet')} style={{background:'var(--card)',border:'1px solid var(--border)',color:'var(--text)',borderRadius:8,padding:'8px 16px',cursor:'pointer',fontSize:13}}>💰 {stats ? stats.balance.toLocaleString() + ' KMF' : '...'}</button>
        </div>
      </div>

      {/* ONGLETS */}
      <div style={{display:'flex',gap:4,marginBottom:24,background:'var(--card)',borderRadius:12,padding:4,border:'1px solid var(--border)',flexWrap:'wrap'}}>
        {TABS.map(([v,l]) => (
          <button key={v} onClick={()=>setTab(v)}
            style={{flex:1,padding:'8px 12px',borderRadius:8,border:'none',cursor:'pointer',fontSize:13,fontWeight:600,minWidth:100,
              background:tab===v?'var(--primary)':'transparent',color:tab===v?'#fff':'var(--text2)'}}>
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:12}}>
          {[...Array(5)].map((_,i)=><div key={i} className="skeleton" style={{height:100,borderRadius:12}}/>)}
        </div>
      ) : (
        <>
          {/* ── VUE GLOBALE ── */}
          {tab === 'overview' && (
            <div>
              {/* STAT CARDS */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:12,marginBottom:24}}>
                {statCards.map((s,i) => (
                  <div key={i} style={{background:s.bg,border:`1px solid ${s.color}30`,borderRadius:12,padding:16}}>
                    <div style={{fontSize:28,marginBottom:8}}>{s.icon}</div>
                    <div style={{fontSize:22,fontWeight:900,color:s.color,fontFamily:'monospace'}}>{s.num}</div>
                    <div style={{fontSize:12,color:'var(--text2)',marginTop:4}}>{s.label}</div>
                  </div>
                ))}
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:24}}>
                {/* RECETTES PAR SOURCE */}
                <div style={{background:'var(--card)',borderRadius:12,padding:20,border:'1px solid var(--border)'}}>
                  <div style={{fontWeight:700,fontSize:15,marginBottom:16}}>💚 Recettes par source</div>
                  {revenueSources.map((r,i) => (
                    <div key={i} style={{marginBottom:12}}>
                      <div style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:4}}>
                        <span style={{color:'var(--text2)'}}>{r.label}</span>
                        <span style={{color:r.color,fontWeight:700,fontFamily:'monospace'}}>{r.pct}%</span>
                      </div>
                      <div style={{background:'var(--border)',borderRadius:99,height:6}}>
                        <div style={{width:r.pct+'%',height:'100%',background:r.color,borderRadius:99}}/>
                      </div>
                    </div>
                  ))}
                </div>
                {/* TOPS SONS */}
                <div style={{background:'var(--card)',borderRadius:12,padding:20,border:'1px solid var(--border)'}}>
                  <div style={{fontWeight:700,fontSize:15,marginBottom:16}}>🔥 Mes sons les plus ecoutés</div>
                  {tracks.slice(0,5).map((t,i) => (
                    <div key={t.id} style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
                      <div style={{width:24,textAlign:'center',fontSize:14,fontWeight:800,color:i<3?'var(--gold)':'var(--text3)'}}>{i+1}</div>
                      <div style={{width:36,height:36,borderRadius:6,background:'var(--card2)',overflow:'hidden',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>
                        {t.cover_url ? <img src={t.cover_url} style={{width:'100%',height:'100%',objectFit:'cover'}}/> : '🎵'}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</div>
                        <div style={{fontSize:11,color:'var(--text3)'}}>{t.genre}</div>
                      </div>
                      <div style={{fontSize:12,color:'#4d9fff',fontWeight:700,fontFamily:'monospace'}}>{formatK(t.play_count)} 🎧</div>
                    </div>
                  ))}
                  {tracks.length === 0 && <div style={{color:'var(--text3)',fontSize:13,textAlign:'center',padding:20}}>Aucun son publié</div>}
                </div>
              </div>

              {/* DERNIERES TRANSACTIONS */}
              <div style={{background:'var(--card)',borderRadius:12,padding:20,border:'1px solid var(--border)'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                  <div style={{fontWeight:700,fontSize:15}}>📋 Dernières transactions</div>
                  <button onClick={()=>setTab('finances')} style={{background:'none',border:'none',color:'var(--primary)',cursor:'pointer',fontSize:13,fontWeight:600}}>Voir tout →</button>
                </div>
                {transactions.slice(0,5).map(tx => (
                  <div key={tx.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:'1px solid var(--border)'}}>
                    <div style={{fontSize:20}}>{tx.type==='recharge'?'💰':tx.type==='purchase'?'🎵':'📀'}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{tx.description}</div>
                      <div style={{fontSize:11,color:'var(--text2)'}}>{formatDate(tx.created_at)}</div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontWeight:700,fontSize:14,color:tx.recipient_id===user.id?'#2cc653':'#e74c3c'}}>
                        {tx.recipient_id===user.id?'+':'-'}{(tx.amount||0).toLocaleString()} KMF
                      </div>
                      <div style={{fontSize:11,color:tx.status==='completed'?'#2cc653':tx.status==='pending'?'#f5a623':'#e74c3c'}}>{tx.status}</div>
                    </div>
                  </div>
                ))}
                {transactions.length === 0 && <div style={{color:'var(--text3)',textAlign:'center',padding:20}}>Aucune transaction</div>}
              </div>
            </div>
          )}

          {/* ── MON CONTENU ── */}
          {tab === 'content' && (
            <div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                <div style={{fontWeight:700,fontSize:15}}>{tracks.length} sons publiés</div>
                <button onClick={()=>setPage('upload')} style={{background:'var(--primary)',border:'none',color:'#fff',borderRadius:8,padding:'8px 16px',cursor:'pointer',fontWeight:600,fontSize:13}}>+ Ajouter</button>
              </div>
              {tracks.length === 0 ? (
                <div style={{textAlign:'center',padding:60,color:'var(--text3)'}}>
                  <div style={{fontSize:48,marginBottom:12}}>🎵</div>
                  <p>Aucun son publié</p>
                  <button onClick={()=>setPage('upload')} style={{marginTop:12,background:'var(--primary)',border:'none',color:'#fff',padding:'10px 24px',borderRadius:8,cursor:'pointer'}}>Publier mon premier son</button>
                </div>
              ) : tracks.map(t => (
                <div key={t.id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',background:'var(--card)',borderRadius:10,border:'1px solid var(--border)',marginBottom:8}}>
                  <div style={{width:48,height:48,borderRadius:8,background:'var(--card2)',overflow:'hidden',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>
                    {t.cover_url ? <img src={t.cover_url} style={{width:'100%',height:'100%',objectFit:'cover'}}/> : '🎵'}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:600,fontSize:14,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</div>
                    <div style={{fontSize:12,color:'var(--text2)',marginTop:2}}>
                      {t.genre} · {t.content_type} ·
                      <span style={{color: t.access_type==='free'?'#2cc653':'var(--gold)',marginLeft:4,fontWeight:600}}>
                        {t.access_type==='free'?'Gratuit':(t.sale_price||0).toLocaleString()+' KMF'}
                      </span>
                    </div>
                  </div>
                  <div style={{textAlign:'right',flexShrink:0}}>
                    <div style={{fontSize:13,color:'#4d9fff',fontWeight:700,fontFamily:'monospace'}}>{formatK(t.play_count)} 🎧</div>
                    <div style={{display:'flex',gap:6,marginTop:6}}>
                      <button style={{background:'var(--card2)',border:'1px solid var(--border)',borderRadius:6,padding:'4px 8px',cursor:'pointer',fontSize:11,color:'var(--text2)'}}>✏️</button>
                      <button onClick={()=>deleteTrack(t.id)} style={{background:'rgba(230,57,70,0.1)',border:'1px solid rgba(230,57,70,0.3)',borderRadius:6,padding:'4px 8px',cursor:'pointer',fontSize:11,color:'#e74c3c'}}>🗑️</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── FINANCES ── */}
          {tab === 'finances' && (
            <div>
              {/* FILTRES PERIODE */}
              <div style={{display:'flex',gap:8,marginBottom:20,flexWrap:'wrap',alignItems:'center'}}>
                {[['today',"Aujourd'hui"],['week','Semaine'],['month','Mois'],['year','Annee']].map(([v,l]) => (
                  <button key={v} onClick={()=>setPeriod(v)}
                    style={{padding:'7px 18px',borderRadius:99,border:'1px solid var(--border)',cursor:'pointer',fontSize:13,fontWeight:600,
                      background:period===v?'var(--gold)':'transparent',color:period===v?'#000':'var(--text2)'}}>
                    {l}
                  </button>
                ))}
                <button style={{marginLeft:'auto',background:'var(--card)',border:'1px solid var(--border)',color:'var(--text2)',borderRadius:8,padding:'7px 14px',cursor:'pointer',fontSize:13}}>
                  📥 Exporter CSV
                </button>
              </div>

              {/* TOTAUX */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:20}}>
                <div style={{background:'rgba(44,198,83,0.1)',border:'1px solid rgba(44,198,83,0.3)',borderRadius:12,padding:16,textAlign:'center'}}>
                  <div style={{fontSize:11,color:'var(--text3)',fontWeight:700,letterSpacing:1,marginBottom:8}}>RECETTES</div>
                  <div style={{fontSize:22,fontWeight:900,color:'#2cc653'}}>{(stats?.recettes||0).toLocaleString()}</div>
                  <div style={{fontSize:12,color:'var(--text3)'}}>KMF</div>
                </div>
                <div style={{background:'rgba(230,57,70,0.1)',border:'1px solid rgba(230,57,70,0.3)',borderRadius:12,padding:16,textAlign:'center'}}>
                  <div style={{fontSize:11,color:'var(--text3)',fontWeight:700,letterSpacing:1,marginBottom:8}}>DEPENSES</div>
                  <div style={{fontSize:22,fontWeight:900,color:'#e74c3c'}}>{(stats?.depenses||0).toLocaleString()}</div>
                  <div style={{fontSize:12,color:'var(--text3)'}}>KMF</div>
                </div>
                <div style={{background:'rgba(245,166,35,0.1)',border:'1px solid rgba(245,166,35,0.3)',borderRadius:12,padding:16,textAlign:'center'}}>
                  <div style={{fontSize:11,color:'var(--text3)',fontWeight:700,letterSpacing:1,marginBottom:8}}>BENEFICE NET</div>
                  <div style={{fontSize:22,fontWeight:900,color:'var(--gold)'}}>{((stats?.recettes||0)-(stats?.depenses||0)).toLocaleString()}</div>
                  <div style={{fontSize:12,color:'var(--text3)'}}>KMF</div>
                </div>
              </div>

              {/* LISTE TRANSACTIONS */}
              {transactions.length === 0 ? (
                <div style={{textAlign:'center',padding:60,color:'var(--text3)'}}>
                  <div style={{fontSize:48,marginBottom:12}}>📋</div>
                  <p>Aucune transaction</p>
                </div>
              ) : transactions.map(tx => (
                <div key={tx.id} style={{display:'flex',alignItems:'center',gap:12,padding:'14px 16px',background:'var(--card)',borderRadius:10,border:'1px solid var(--border)',marginBottom:8}}>
                  <div style={{width:44,height:44,borderRadius:10,background:'var(--card2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>
                    {tx.type==='recharge'?'💰':tx.type==='purchase'?'🎵':tx.type==='rental'?'📀':'🎫'}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:600,fontSize:14,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{tx.description}</div>
                    <div style={{fontSize:12,color:'var(--text2)',marginTop:2}}>{formatDate(tx.created_at)} · {tx.gateway}</div>
                  </div>
                  <div style={{textAlign:'right',flexShrink:0}}>
                    <div style={{fontWeight:800,fontSize:15,color:tx.recipient_id===user.id?'#2cc653':'#e74c3c'}}>
                      {tx.recipient_id===user.id?'+':'-'}{(tx.amount||0).toLocaleString()} KMF
                    </div>
                    <div style={{fontSize:11,fontWeight:700,marginTop:2,color:tx.status==='completed'?'#2cc653':tx.status==='pending'?'#f5a623':'#e74c3c'}}>{tx.status}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── ANALYTIQUES ── */}
          {tab === 'analytics' && (
            <div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:12,marginBottom:24}}>
                {[
                  { icon:'🎧', label:'Total Ecoutes', val: formatK(stats?.plays||0), color:'#4d9fff' },
                  { icon:'👥', label:'Abonnes', val: formatK(stats?.followers||0), color:'#a855f7' },
                  { icon:'🎵', label:'Sons publies', val: stats?.tracks_count||0, color:'#2cc653' },
                  { icon:'🔄', label:'Transactions', val: stats?.transactions||0, color:'#f5a623' },
                ].map((s,i) => (
                  <div key={i} style={{background:'var(--card)',borderRadius:12,padding:20,border:'1px solid var(--border)'}}>
                    <div style={{fontSize:32,marginBottom:8}}>{s.icon}</div>
                    <div style={{fontSize:28,fontWeight:900,color:s.color,fontFamily:'monospace'}}>{s.val}</div>
                    <div style={{fontSize:13,color:'var(--text2)',marginTop:4}}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* GRAPHIQUE REVENUS 7 JOURS */}
              <div style={{background:'var(--card)',borderRadius:12,padding:20,border:'1px solid var(--border)',marginBottom:16}}>
                <div style={{fontWeight:700,fontSize:15,marginBottom:4}}>📈 Revenus — 7 derniers jours</div>
                <div style={{fontSize:12,color:'var(--text3)',marginBottom:16}}>Recettes nettes en KMF</div>
                {txByDay.length > 0 ? (() => {
                  const maxVal = Math.max(...txByDay.map(d=>d.revenus), 1)
                  return (
                    <div style={{display:'flex',alignItems:'flex-end',gap:8,height:120}}>
                      {txByDay.map((d,i) => (
                        <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4,height:'100%',justifyContent:'flex-end'}}>
                          <div style={{fontSize:10,color:'#2cc653',fontWeight:700,fontFamily:'monospace'}}>{d.revenus>0?d.revenus.toLocaleString():''}</div>
                          <div style={{
                            width:'100%',
                            height: Math.max((d.revenus/maxVal)*90, d.revenus>0?8:3)+'px',
                            background: d.revenus>0?'linear-gradient(180deg,#2cc653,#16a34a)':'var(--border)',
                            borderRadius:'4px 4px 0 0',
                            transition:'height 0.3s'
                          }}/>
                          <div style={{fontSize:10,color:'var(--text3)',whiteSpace:'nowrap'}}>{d.key}</div>
                        </div>
                      ))}
                    </div>
                  )
                })() : <div style={{textAlign:'center',color:'var(--text3)',padding:30}}>Aucune donnee disponible</div>}
              </div>

              {/* GRAPHIQUE TOP SONS */}
              <div style={{background:'var(--card)',borderRadius:12,padding:20,border:'1px solid var(--border)',marginBottom:16}}>
                <div style={{fontWeight:700,fontSize:15,marginBottom:16}}>🎧 Top sons par ecoutes</div>
                {topTracks.length > 0 ? (() => {
                  const maxPlays = Math.max(...topTracks.map(t=>t.play_count||0), 1)
                  return topTracks.map((t,i) => (
                    <div key={t.id} style={{marginBottom:12}}>
                      <div style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:4,alignItems:'center'}}>
                        <div style={{display:'flex',alignItems:'center',gap:8,flex:1,minWidth:0}}>
                          <span style={{fontSize:14,fontWeight:900,color:i<3?'var(--gold)':'var(--text3)',width:16}}>{i+1}</span>
                          <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</span>
                        </div>
                        <span style={{color:'#4d9fff',fontWeight:700,fontFamily:'monospace',flexShrink:0,marginLeft:8}}>{formatK(t.play_count||0)} 🎧</span>
                      </div>
                      <div style={{background:'var(--border)',borderRadius:99,height:8,overflow:'hidden'}}>
                        <div style={{
                          width:((t.play_count||0)/maxPlays*100)+'%',
                          height:'100%',
                          background:`linear-gradient(90deg,${i===0?'#f5a623':i===1?'#4d9fff':i===2?'#2cc653':'#a855f7'},transparent)`,
                          borderRadius:99,
                          transition:'width 0.5s'
                        }}/>
                      </div>
                    </div>
                  ))
                })() : (
                  <div style={{textAlign:'center',color:'var(--text3)',padding:30}}>
                    <div style={{fontSize:36,marginBottom:8}}>🎵</div>
                    Publie des sons pour voir tes stats
                  </div>
                )}
              </div>

              {/* ACTIVITE TRANSACTIONS */}
              <div style={{background:'var(--card)',borderRadius:12,padding:20,border:'1px solid var(--border)'}}>
                <div style={{fontWeight:700,fontSize:15,marginBottom:16}}>🔄 Activite transactions — 7 jours</div>
                <div style={{display:'flex',alignItems:'flex-end',gap:8,height:80}}>
                  {txByDay.map((d,i) => (
                    <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4,height:'100%',justifyContent:'flex-end'}}>
                      <div style={{fontSize:10,color:'var(--text3)',fontWeight:700}}>{d.count>0?d.count:''}</div>
                      <div style={{
                        width:'100%',
                        height:Math.max((d.count/Math.max(...txByDay.map(x=>x.count),1))*60, d.count>0?8:3)+'px',
                        background:d.count>0?'linear-gradient(180deg,#4d9fff,#2563eb)':'var(--border)',
                        borderRadius:'4px 4px 0 0'
                      }}/>
                      <div style={{fontSize:10,color:'var(--text3)'}}>{d.key}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
