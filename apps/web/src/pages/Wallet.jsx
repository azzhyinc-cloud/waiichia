import { useState, useEffect } from 'react'
import { useAuthStore, usePageStore } from '../stores/index.js'
import api from '../services/api.js'

const formatK = (n) => {
  if (!n) return '0'
  if (n >= 1000000) return (n/1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n/1000).toFixed(1) + 'K'
  return n.toString()
}

const formatDate = (d) => new Date(d).toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})

const RECHARGE_AMOUNTS = [1000, 2000, 5000, 10000, 25000, 50000]
const GATEWAYS = [
  { id:'huri_money', label:'Huri Money', icon:'💳', desc:'Paiement mobile Comores' },
  { id:'telecom', label:'Telecom Comores', icon:'📱', desc:'M-Pesa Comores' },
  { id:'orange', label:'Orange Money', icon:'🟠', desc:'Orange Money' },
]

const TX_ICONS = { purchase:'🎵', rental:'📀', recharge:'💰', withdrawal:'🏦', ticket:'🎫', refund:'↩️' }
const TX_COLORS = { completed:'#2cc653', pending:'#f5a623', failed:'#e74c3c', cancelled:'#888' }

export default function Wallet() {
  const { user } = useAuthStore()
  const { setPage } = usePageStore()
  const [tab, setTab] = useState('overview')
  const [wallet, setWallet] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [tickets, setTickets] = useState([])
  const [rentals, setRentals] = useState([])
  const [loading, setLoading] = useState(true)
  const [rechargeAmount, setRechargeAmount] = useState(5000)
  const [customAmount, setCustomAmount] = useState('')
  const [phone, setPhone] = useState('')
  const [gateway, setGateway] = useState('huri_money')
  const [recharging, setRecharging] = useState(false)
  const [rechargeStatus, setRechargeStatus] = useState(null)

  useEffect(() => {
    if (!user) return
    loadAll()
  }, [user])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [w, tx, tk, rl] = await Promise.all([
        api.payments.wallet(),
        api.payments.history(),
        api.payments.tickets ? api.payments.tickets() : Promise.resolve({ tickets: [] }),
        api.payments.rentals(),
      ])
      setWallet(w)
      setTransactions(tx.transactions || [])
      setTickets(tk.tickets || [])
      setRentals(rl.rentals || [])
    } catch(e) {}
    setLoading(false)
  }

  const handleRecharge = async () => {
    const amount = customAmount ? parseInt(customAmount) : rechargeAmount
    if (!amount || amount < 100) return alert('Montant minimum : 100 KMF')
    if (!phone || phone.length < 7) return alert('Entrez votre numero de telephone')
    setRecharging(true)
    setRechargeStatus(null)
    try {
      const token = localStorage.getItem('waiichia_token')
      const res = await fetch(import.meta.env.VITE_API_URL + '/api/payments/recharge', {
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},
        body: JSON.stringify({ amount, phone, gateway })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setRechargeStatus({ type:'success', message: data.message || 'Recharge initiee ! Confirmez sur votre telephone.' })
      setTimeout(() => { loadAll(); setRechargeStatus(null) }, 5000)
    } catch(e) {
      setRechargeStatus({ type:'error', message: e.message })
    }
    setRecharging(false)
  }

  if (!user) return (
    <div style={{textAlign:'center',padding:80}}>
      <div style={{fontSize:56,marginBottom:16}}>💰</div>
      <h2>Mon Portefeuille</h2>
      <p style={{color:'var(--text2)',marginBottom:24}}>Connectez-vous pour acceder a votre portefeuille</p>
      <button onClick={()=>setPage('login')} style={{background:'var(--primary)',border:'none',color:'#fff',padding:'10px 24px',borderRadius:8,cursor:'pointer',fontWeight:600}}>Se connecter</button>
    </div>
  )

  const TABS = [['overview','Apercu'],['history','Historique'],['tickets','Mes Billets'],['rentals','Locations'],['recharge','Recharger']]

  return (
    <div style={{maxWidth:800,margin:'0 auto',padding:'24px 20px 100px'}}>
      <h1 style={{fontSize:24,fontWeight:900,margin:'0 0 24px'}}>💰 Mon Portefeuille</h1>

      {/* SOLDE PRINCIPAL */}
      {wallet && (
        <div style={{background:'linear-gradient(135deg,var(--primary),#2563eb)',borderRadius:20,padding:28,marginBottom:24,position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:-20,right:-20,width:150,height:150,borderRadius:'50%',background:'rgba(255,255,255,0.05)'}}/>
          <div style={{position:'absolute',bottom:-40,left:60,width:200,height:200,borderRadius:'50%',background:'rgba(255,255,255,0.03)'}}/>
          <div style={{position:'relative',zIndex:1}}>
            <div style={{fontSize:12,fontWeight:700,letterSpacing:2,opacity:0.8,marginBottom:8}}>SOLDE DISPONIBLE</div>
            <div style={{fontSize:42,fontWeight:900,marginBottom:4}}>{(wallet.balance||0).toLocaleString()} <span style={{fontSize:20,opacity:0.8}}>KMF</span></div>
            {wallet.ad_credit > 0 && <div style={{fontSize:13,opacity:0.8}}>+ {wallet.ad_credit.toLocaleString()} KMF credit pub</div>}
            <div style={{display:'flex',gap:12,marginTop:20}}>
              <button onClick={()=>setTab('recharge')}
                style={{background:'rgba(255,255,255,0.2)',border:'1px solid rgba(255,255,255,0.3)',color:'#fff',borderRadius:8,padding:'8px 20px',cursor:'pointer',fontWeight:700,fontSize:14,backdropFilter:'blur(10px)'}}>
                + Recharger
              </button>
              <button onClick={()=>setTab('history')}
                style={{background:'transparent',border:'1px solid rgba(255,255,255,0.3)',color:'#fff',borderRadius:8,padding:'8px 20px',cursor:'pointer',fontWeight:600,fontSize:14}}>
                Historique
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ONGLETS */}
      <div style={{display:'flex',gap:4,marginBottom:24,background:'var(--card)',borderRadius:12,padding:4,border:'1px solid var(--border)'}}>
        {TABS.map(([v,l]) => (
          <button key={v} onClick={()=>setTab(v)}
            style={{flex:1,padding:'8px 4px',borderRadius:8,border:'none',cursor:'pointer',fontSize:12,fontWeight:600,transition:'all 0.2s',
              background:tab===v?'var(--primary)':'transparent',
              color:tab===v?'#fff':'var(--text2)'}}>
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {[...Array(4)].map((_,i)=><div key={i} className="skeleton" style={{height:64,borderRadius:10}}/>)}
        </div>
      ) : (
        <>
          {/* APERCU */}
          {tab === 'overview' && (
            <div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:20}}>
                <div style={{background:'var(--card)',borderRadius:12,padding:16,border:'1px solid var(--border)'}}>
                  <div style={{fontSize:11,color:'var(--text3)',fontWeight:700,letterSpacing:1,marginBottom:8}}>ACHATS</div>
                  <div style={{fontSize:22,fontWeight:800}}>{transactions.filter(t=>t.type==='purchase'&&t.status==='completed').length}</div>
                  <div style={{fontSize:12,color:'var(--text2)'}}>sons achetes</div>
                </div>
                <div style={{background:'var(--card)',borderRadius:12,padding:16,border:'1px solid var(--border)'}}>
                  <div style={{fontSize:11,color:'var(--text3)',fontWeight:700,letterSpacing:1,marginBottom:8}}>DEPENSES</div>
                  <div style={{fontSize:22,fontWeight:800}}>{transactions.filter(t=>t.status==='completed').reduce((a,t)=>a+(t.amount||0),0).toLocaleString()}</div>
                  <div style={{fontSize:12,color:'var(--text2)'}}>KMF total</div>
                </div>
                <div style={{background:'var(--card)',borderRadius:12,padding:16,border:'1px solid var(--border)'}}>
                  <div style={{fontSize:11,color:'var(--text3)',fontWeight:700,letterSpacing:1,marginBottom:8}}>BILLETS</div>
                  <div style={{fontSize:22,fontWeight:800}}>{tickets.filter(t=>t.status==='confirmed').length}</div>
                  <div style={{fontSize:12,color:'var(--text2)'}}>evenements</div>
                </div>
                <div style={{background:'var(--card)',borderRadius:12,padding:16,border:'1px solid var(--border)'}}>
                  <div style={{fontSize:11,color:'var(--text3)',fontWeight:700,letterSpacing:1,marginBottom:8}}>LOCATIONS</div>
                  <div style={{fontSize:22,fontWeight:800}}>{rentals.length}</div>
                  <div style={{fontSize:12,color:'var(--text2)'}}>actives</div>
                </div>
              </div>
              <h3 style={{fontSize:15,fontWeight:700,marginBottom:12}}>Dernieres transactions</h3>
              {transactions.slice(0,5).map(tx => (
                <div key={tx.id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',background:'var(--card)',borderRadius:10,border:'1px solid var(--border)',marginBottom:8}}>
                  <div style={{width:40,height:40,borderRadius:10,background:'var(--card2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>
                    {TX_ICONS[tx.type]||'💳'}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:600,fontSize:14,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{tx.description}</div>
                    <div style={{fontSize:12,color:'var(--text2)'}}>{formatDate(tx.created_at)}</div>
                  </div>
                  <div style={{textAlign:'right',flexShrink:0}}>
                    <div style={{fontWeight:700,fontSize:15,color:tx.type==='recharge'?'#2cc653':'#e74c3c'}}>
                      {tx.type==='recharge'?'+':'-'}{(tx.amount||0).toLocaleString()} KMF
                    </div>
                    <div style={{fontSize:11,color:TX_COLORS[tx.status]||'var(--text3)',fontWeight:600}}>{tx.status}</div>
                  </div>
                </div>
              ))}
              {transactions.length === 0 && <div style={{textAlign:'center',padding:40,color:'var(--text3)'}}>Aucune transaction</div>}
            </div>
          )}

          {/* HISTORIQUE */}
          {tab === 'history' && (
            <div>
              {transactions.length === 0 ? (
                <div style={{textAlign:'center',padding:60,color:'var(--text3)'}}>
                  <div style={{fontSize:48,marginBottom:12}}>📋</div>
                  <p>Aucune transaction</p>
                </div>
              ) : transactions.map(tx => (
                <div key={tx.id} style={{display:'flex',alignItems:'center',gap:12,padding:'14px 16px',background:'var(--card)',borderRadius:10,border:'1px solid var(--border)',marginBottom:8}}>
                  <div style={{width:44,height:44,borderRadius:10,background:'var(--card2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>
                    {TX_ICONS[tx.type]||'💳'}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:600,fontSize:14,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{tx.description}</div>
                    <div style={{fontSize:12,color:'var(--text2)',marginTop:2}}>{formatDate(tx.created_at)} · {tx.gateway}</div>
                  </div>
                  <div style={{textAlign:'right',flexShrink:0}}>
                    <div style={{fontWeight:800,fontSize:16,color:tx.type==='recharge'?'#2cc653':'#e74c3c'}}>
                      {tx.type==='recharge'?'+':'-'}{(tx.amount||0).toLocaleString()} KMF
                    </div>
                    <div style={{fontSize:11,fontWeight:700,color:TX_COLORS[tx.status]||'var(--text3)',marginTop:2}}>{tx.status}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* MES BILLETS */}
          {tab === 'tickets' && (
            <div>
              {tickets.length === 0 ? (
                <div style={{textAlign:'center',padding:60,color:'var(--text3)'}}>
                  <div style={{fontSize:48,marginBottom:12}}>🎫</div>
                  <p>Aucun billet</p>
                  <button onClick={()=>setPage('events')} style={{marginTop:12,background:'var(--primary)',border:'none',color:'#fff',padding:'10px 24px',borderRadius:8,cursor:'pointer',fontWeight:600}}>Voir les evenements</button>
                </div>
              ) : tickets.map(t => (
                <div key={t.id} style={{background:'var(--card)',borderRadius:12,border:'1px solid var(--border)',overflow:'hidden',marginBottom:12}}>
                  <div style={{display:'flex',gap:12,padding:16,alignItems:'center'}}>
                    <div style={{width:52,height:52,borderRadius:10,background:'linear-gradient(135deg,#4d9fff,#3a7fd5)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,flexShrink:0}}>🎫</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:700,fontSize:15,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.events?.title}</div>
                      <div style={{fontSize:12,color:'var(--text2)',marginTop:2}}>📍 {t.events?.location}</div>
                      <div style={{fontSize:12,color:'var(--text2)'}}>📅 {t.events?.event_date ? new Date(t.events.event_date).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'}) : ''}</div>
                    </div>
                    <div style={{textAlign:'right',flexShrink:0}}>
                      <div style={{fontSize:11,fontWeight:700,color:t.status==='confirmed'?'#2cc653':'var(--text3)',marginBottom:4}}>{t.status}</div>
                      <div style={{fontSize:(t.quantity||1)>1?'11px':'13px',color:'var(--text2)'}}>{t.quantity||1} billet{(t.quantity||1)>1?'s':''}</div>
                    </div>
                  </div>
                  {t.status === 'confirmed' && (
                    <div style={{borderTop:'1px solid var(--border)',padding:'10px 16px',background:'var(--card2)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <span style={{fontSize:12,color:'var(--text3)'}}>CODE BILLET</span>
                      <span style={{fontFamily:'monospace',fontSize:16,fontWeight:900,letterSpacing:3,color:'var(--gold)'}}>{t.ticket_code}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* LOCATIONS */}
          {tab === 'rentals' && (
            <div>
              {rentals.length === 0 ? (
                <div style={{textAlign:'center',padding:60,color:'var(--text3)'}}>
                  <div style={{fontSize:48,marginBottom:12}}>📀</div>
                  <p>Aucune location active</p>
                  <button onClick={()=>setPage('music')} style={{marginTop:12,background:'var(--primary)',border:'none',color:'#fff',padding:'10px 24px',borderRadius:8,cursor:'pointer',fontWeight:600}}>Parcourir la musique</button>
                </div>
              ) : rentals.map(r => {
                const expires = new Date(r.expires_at)
                const daysLeft = Math.ceil((expires - Date.now()) / 86400000)
                return (
                  <div key={r.id} style={{display:'flex',gap:12,padding:'14px 16px',background:'var(--card)',borderRadius:10,border:'1px solid var(--border)',marginBottom:8,alignItems:'center'}}>
                    <div style={{width:48,height:48,borderRadius:8,background:'var(--card2)',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>
                      {r.tracks?.cover_url ? <img src={r.tracks.cover_url} style={{width:'100%',height:'100%',objectFit:'cover'}}/> : '🎵'}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:600,fontSize:14,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.tracks?.title}</div>
                      <div style={{fontSize:12,color:'var(--text2)'}}>{r.tracks?.profiles?.display_name}</div>
                      <div style={{fontSize:11,color:daysLeft<=3?'#e74c3c':'var(--text3)',marginTop:2}}>Expire dans {daysLeft} jour{daysLeft>1?'s':''}</div>
                    </div>
                    <div style={{textAlign:'right',flexShrink:0}}>
                      <div style={{fontSize:12,color:'var(--gold)',fontWeight:700}}>{(r.price_paid||0).toLocaleString()} KMF</div>
                      <div style={{fontSize:11,color:'var(--text3)'}}>{r.period}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* RECHARGER */}
          {tab === 'recharge' && (
            <div style={{maxWidth:480,margin:'0 auto'}}>
              {rechargeStatus && (
                <div style={{background:rechargeStatus.type==='success'?'rgba(44,198,83,0.1)':'rgba(230,57,70,0.1)',border:`1px solid ${rechargeStatus.type==='success'?'#2cc653':'#e74c3c'}`,borderRadius:10,padding:'12px 16px',marginBottom:20,color:rechargeStatus.type==='success'?'#2cc653':'#e74c3c',fontSize:14}}>
                  {rechargeStatus.type==='success'?'✅':'❌'} {rechargeStatus.message}
                </div>
              )}

              <div style={{background:'var(--card)',borderRadius:12,padding:20,marginBottom:16,border:'1px solid var(--border)'}}>
                <h3 style={{margin:'0 0 14px',fontSize:15}}>Montant a recharger</h3>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:12}}>
                  {RECHARGE_AMOUNTS.map(a => (
                    <button key={a} onClick={()=>{setRechargeAmount(a);setCustomAmount('')}}
                      style={{padding:'10px',borderRadius:8,border:`2px solid ${rechargeAmount===a&&!customAmount?'var(--primary)':'var(--border)'}`,background:rechargeAmount===a&&!customAmount?'rgba(99,102,241,0.1)':'var(--card2)',color:'var(--text)',cursor:'pointer',fontWeight:700,fontSize:13}}>
                      {a.toLocaleString()}
                    </button>
                  ))}
                </div>
                <input value={customAmount} onChange={e=>{setCustomAmount(e.target.value);setRechargeAmount(0)}}
                  placeholder="Ou entrez un montant personnalise (KMF)"
                  style={{width:'100%',background:'var(--bg)',border:'1px solid var(--border)',borderRadius:8,padding:'10px 14px',color:'var(--text)',fontSize:14,boxSizing:'border-box'}}/>
              </div>

              <div style={{background:'var(--card)',borderRadius:12,padding:20,marginBottom:16,border:'1px solid var(--border)'}}>
                <h3 style={{margin:'0 0 14px',fontSize:15}}>Moyen de paiement</h3>
                <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:14}}>
                  {GATEWAYS.map(g => (
                    <div key={g.id} onClick={()=>setGateway(g.id)}
                      style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',borderRadius:8,cursor:'pointer',
                        background:gateway===g.id?'rgba(99,102,241,0.1)':'var(--card2)',
                        border:`2px solid ${gateway===g.id?'var(--primary)':'var(--border)'}`}}>
                      <span style={{fontSize:22}}>{g.icon}</span>
                      <div>
                        <div style={{fontWeight:700,fontSize:14}}>{g.label}</div>
                        <div style={{fontSize:12,color:'var(--text2)'}}>{g.desc}</div>
                      </div>
                      {gateway===g.id && <div style={{marginLeft:'auto',color:'var(--primary)',fontSize:18}}>✓</div>}
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{fontSize:12,color:'var(--text2)',fontWeight:600,marginBottom:6}}>NUMERO DE TELEPHONE *</div>
                  <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="ex: 3370000 ou +2693370000"
                    style={{width:'100%',background:'var(--bg)',border:'1px solid var(--border)',borderRadius:8,padding:'10px 14px',color:'var(--text)',fontSize:14,boxSizing:'border-box'}}/>
                </div>
              </div>

              <div style={{background:'var(--card2)',borderRadius:10,padding:14,marginBottom:20,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{color:'var(--text2)',fontSize:14}}>Montant a recharger</span>
                <span style={{fontSize:20,fontWeight:900,color:'var(--gold)'}}>{(customAmount||rechargeAmount||0).toLocaleString()} KMF</span>
              </div>

              <button onClick={handleRecharge} disabled={recharging}
                style={{width:'100%',padding:14,background:recharging?'var(--border)':'linear-gradient(135deg,var(--primary),#2563eb)',border:'none',borderRadius:10,color:'#fff',fontSize:16,fontWeight:700,cursor:recharging?'not-allowed':'pointer'}}>
                {recharging ? 'Traitement en cours...' : 'Recharger mon portefeuille'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
