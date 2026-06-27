import { useState, useEffect, useRef } from "react"
import { useAuthStore, usePageStore } from "../stores/index.js"

const API_URL = import.meta.env.VITE_API_URL || ''
const getToken = () => localStorage.getItem('waiichia_token')

const fmtK = n => n >= 1000000 ? (n/1000000).toFixed(1)+'M' : n >= 1000 ? (n/1000).toFixed(1)+'K' : String(n||0)
const fmtAmt = n => new Intl.NumberFormat('fr-FR').format(Math.round(n||0)) + ' KMF'

const TX_META = {
  deposit:     { label: 'Dépôt',         dir: 'in',  icon: '💰', color: '#2cc653' },
  track_buy:   { label: 'Vente track',   dir: 'in',  icon: '🎵', color: '#2cc653' },
  purchase:    { label: 'Achat produit', dir: 'out', icon: '🛍️', color: '#e64646' },
  ticket:      { label: 'Billet event',  dir: 'out', icon: '🎟️', color: '#e64646' },
  withdrawal:  { label: 'Retrait',       dir: 'out', icon: '🏦', color: '#e64646' },
  transfer:    { label: 'Transfert',     dir: null,  icon: '↔️', color: '#f5a623' },
  tip:         { label: 'Tip radio',     dir: 'in',  icon: '🎙️', color: '#2cc653' },
  subscription:{ label: 'Abonnement',   dir: 'out', icon: '⭐', color: '#e64646' },
}

const PERIODS = [
  { id: 'month',   label: 'Ce mois' },
  { id: 'quarter', label: 'Ce trimestre' },
  { id: 'year',    label: 'Cette année' },
  { id: 'custom',  label: 'Personnalisé' },
]

function getPeriodDates(period, customFrom, customTo) {
  const now = new Date()
  let from, to
  if (period === 'month') {
    from = new Date(now.getFullYear(), now.getMonth(), 1)
    to   = new Date(now.getFullYear(), now.getMonth()+1, 0, 23, 59, 59)
  } else if (period === 'quarter') {
    const q = Math.floor(now.getMonth()/3)
    from = new Date(now.getFullYear(), q*3, 1)
    to   = new Date(now.getFullYear(), q*3+3, 0, 23, 59, 59)
  } else if (period === 'year') {
    from = new Date(now.getFullYear(), 0, 1)
    to   = new Date(now.getFullYear(), 11, 31, 23, 59, 59)
  } else {
    from = customFrom ? new Date(customFrom) : new Date(now.getFullYear(), now.getMonth(), 1)
    to   = customTo   ? new Date(customTo+'T23:59:59') : new Date()
  }
  return { from, to }
}

function fmtDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric' })
}

export default function Reports() {
  const { user } = useAuthStore()
  const { setPage } = usePageStore()
  const [period, setPeriod] = useState('month')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [toast, setToast] = useState('')

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  useEffect(() => { if (user) loadTransactions() }, [user])

  const loadTransactions = async () => {
    setLoading(true)
    try {
      const res = await fetch(API_URL + '/api/payments/history?limit=500', {
        headers: { 'Authorization': 'Bearer ' + getToken() }
      })
      const data = await res.json()
      setTransactions(data.transactions || [])
    } catch(e) {}
    setLoading(false)
  }

  // Filtrer par période
  const { from, to } = getPeriodDates(period, customFrom, customTo)
  const filtered = transactions.filter(tx => {
    const d = new Date(tx.created_at)
    return d >= from && d <= to
  })

  // Calculs
  const income = filtered.filter(tx => {
    const m = TX_META[tx.type]
    return m?.dir === 'in' || (tx.type === 'transfer' && tx.recipient_id === user?.id)
  })
  const outcome = filtered.filter(tx => {
    const m = TX_META[tx.type]
    return m?.dir === 'out' || (tx.type === 'transfer' && tx.recipient_id !== user?.id)
  })

  const totalIn  = income.reduce((s, t) => s + (t.amount || 0), 0)
  const totalOut = outcome.reduce((s, t) => s + (t.amount || 0), 0)
  const net      = totalIn - totalOut

  // Regrouper par type
  const byType = {}
  for (const tx of filtered) {
    const key = tx.type || 'other'
    if (!byType[key]) byType[key] = { count: 0, total: 0 }
    byType[key].count++
    byType[key].total += tx.amount || 0
  }

  // Regrouper par mois (pour le graphique)
  const byMonth = {}
  for (const tx of filtered) {
    const d = new Date(tx.created_at)
    const key = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0')
    if (!byMonth[key]) byMonth[key] = { in: 0, out: 0 }
    const m = TX_META[tx.type]
    const isIn = m?.dir === 'in' || (tx.type === 'transfer' && tx.recipient_id === user?.id)
    if (isIn) byMonth[key].in += tx.amount || 0
    else byMonth[key].out += tx.amount || 0
  }
  const monthKeys = Object.keys(byMonth).sort()
  const maxBar = Math.max(...monthKeys.map(k => Math.max(byMonth[k].in, byMonth[k].out)), 1)

  // Export PDF
  const exportPDF = async () => {
    setGenerating(true)
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const W = 210, margin = 18

      // ── Header ──
      doc.setFillColor(245, 166, 35)
      doc.rect(0, 0, W, 28, 'F')
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text('WAIICHIA', margin, 12)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text('Rapport financier', margin, 20)
      doc.setTextColor(80, 80, 80)
      doc.text('Généré le ' + fmtDate(new Date()), W - margin, 20, { align: 'right' })

      // ── Infos utilisateur ──
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(30, 30, 30)
      doc.text('Compte : ' + (user?.display_name || user?.username || ''), margin, 38)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100, 100, 100)
      doc.text('Période : ' + fmtDate(from) + ' → ' + fmtDate(to), margin, 45)

      // ── KPIs ──
      let y = 56
      const kpis = [
        { label: 'Revenus',   value: fmtAmt(totalIn),  color: [44, 198, 83] },
        { label: 'Dépenses',  value: fmtAmt(totalOut), color: [230, 70, 70] },
        { label: 'Net',       value: fmtAmt(net),      color: net >= 0 ? [44, 198, 83] : [230, 70, 70] },
        { label: 'Opérations',value: String(filtered.length), color: [100, 100, 200] },
      ]
      const kW = (W - margin*2 - 9) / 4
      kpis.forEach((k, i) => {
        const x = margin + i * (kW + 3)
        doc.setFillColor(...k.color)
        doc.roundedRect(x, y, kW, 18, 2, 2, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(7)
        doc.setFont('helvetica', 'normal')
        doc.text(k.label, x + kW/2, y + 6, { align: 'center' })
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.text(k.value, x + kW/2, y + 13, { align: 'center' })
      })

      // ── Détail par type ──
      y += 26
      doc.setTextColor(30, 30, 30)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('Détail par type de transaction', margin, y)
      y += 6

      doc.setFillColor(245, 166, 35)
      doc.rect(margin, y, W - margin*2, 7, 'F')
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.text('Type', margin + 2, y + 5)
      doc.text('Opérations', margin + 70, y + 5)
      doc.text('Montant total', margin + 110, y + 5)
      doc.text('Direction', margin + 155, y + 5)
      y += 7

      let row = 0
      for (const [type, data] of Object.entries(byType)) {
        const meta = TX_META[type] || { label: type, dir: null }
        if (row % 2 === 0) {
          doc.setFillColor(248, 248, 248)
          doc.rect(margin, y, W - margin*2, 7, 'F')
        }
        doc.setTextColor(50, 50, 50)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.text(meta.label || type, margin + 2, y + 5)
        doc.text(String(data.count), margin + 75, y + 5)
        doc.text(fmtAmt(data.total), margin + 110, y + 5)
        const dir = meta.dir === 'in' ? '↑ Entrant' : meta.dir === 'out' ? '↓ Sortant' : '↔ Transfert'
        doc.setTextColor(meta.dir === 'in' ? 44 : meta.dir === 'out' ? 200 : 100, meta.dir === 'in' ? 198 : 70, meta.dir === 'in' ? 83 : meta.dir === 'out' ? 70 : 200)
        doc.text(dir, margin + 155, y + 5)
        y += 7
        row++
        if (y > 260) { doc.addPage(); y = 20 }
      }

      // ── Liste transactions ──
      y += 6
      doc.setTextColor(30, 30, 30)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('Transactions', margin, y)
      y += 6

      doc.setFillColor(245, 166, 35)
      doc.rect(margin, y, W - margin*2, 7, 'F')
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(7)
      doc.setFont('helvetica', 'bold')
      doc.text('Date', margin + 2, y + 5)
      doc.text('Description', margin + 28, y + 5)
      doc.text('Type', margin + 110, y + 5)
      doc.text('Montant', margin + 145, y + 5)
      y += 7

      row = 0
      for (const tx of filtered.slice(0, 80)) {
        if (row % 2 === 0) {
          doc.setFillColor(248, 248, 248)
          doc.rect(margin, y, W - margin*2, 6, 'F')
        }
        const meta = TX_META[tx.type] || { label: tx.type, dir: null }
        const isIn = meta.dir === 'in' || (tx.type === 'transfer' && tx.recipient_id === user?.id)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7)
        doc.setTextColor(80, 80, 80)
        doc.text(fmtDate(tx.created_at), margin + 2, y + 4)
        const desc = (tx.description || meta.label || tx.type || '').substring(0, 50)
        doc.setTextColor(30, 30, 30)
        doc.text(desc, margin + 28, y + 4)
        doc.setTextColor(80, 80, 80)
        doc.text(meta.label || tx.type, margin + 110, y + 4)
        doc.setTextColor(isIn ? 44 : 200, isIn ? 150 : 70, isIn ? 83 : 70)
        doc.setFont('helvetica', 'bold')
        doc.text((isIn ? '+' : '-') + fmtAmt(tx.amount), margin + 145, y + 4)
        y += 6
        row++
        if (y > 270) { doc.addPage(); y = 20 }
      }
      if (filtered.length > 80) {
        doc.setTextColor(150, 150, 150)
        doc.setFont('helvetica', 'italic')
        doc.setFontSize(7)
        doc.text(`... et ${filtered.length - 80} autres transactions`, margin, y + 4)
      }

      // ── Footer ──
      const pages = doc.internal.getNumberOfPages()
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i)
        doc.setFillColor(245, 166, 35)
        doc.rect(0, 287, W, 10, 'F')
        doc.setTextColor(0, 0, 0)
        doc.setFontSize(7)
        doc.setFont('helvetica', 'normal')
        doc.text('Waiichia — Rapport confidentiel', margin, 293)
        doc.text('Page ' + i + '/' + pages, W - margin, 293, { align: 'right' })
      }

      const label = PERIODS.find(p => p.id === period)?.label || period
      doc.save(`waiichia_rapport_${label.replace(/\s+/g,'_')}_${new Date().toISOString().slice(0,10)}.pdf`)
      showToast('✅ Rapport PDF téléchargé')
    } catch(e) {
      showToast('❌ Erreur génération PDF')
      console.error(e)
    }
    setGenerating(false)
  }

  if (!user) return (
    <div style={{textAlign:'center',padding:80}}>
      <div style={{fontSize:48,marginBottom:12}}>🔒</div>
      <div style={{fontSize:15,fontWeight:600,marginBottom:16}}>Connectez-vous pour accéder aux rapports</div>
      <button className="btn btn-primary" onClick={() => setPage('login')}>Se connecter</button>
    </div>
  )

  return (
    <div style={{paddingBottom:40}}>
      {toast && <div style={{position:'fixed',top:20,left:'50%',transform:'translateX(-50%)',background:'var(--gold)',color:'#000',padding:'10px 24px',borderRadius:'var(--radius-sm)',fontWeight:700,fontSize:13,zIndex:9999,boxShadow:'0 4px 20px rgba(0,0,0,.3)'}}>{toast}</div>}

      {/* Header */}
      <div style={{background:'linear-gradient(135deg,var(--card),var(--bg2))',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'24px 20px',marginBottom:20}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:'var(--gold)',letterSpacing:2,textTransform:'uppercase',marginBottom:6}}>📊 RAPPORTS FINANCIERS</div>
            <div style={{fontSize:22,fontWeight:800,fontFamily:'Syne,sans-serif'}}>Mes revenus & dépenses</div>
            <div style={{fontSize:13,color:'var(--text3)',marginTop:4}}>{user?.display_name || user?.username}</div>
          </div>
          <button onClick={exportPDF} disabled={generating || loading || filtered.length === 0}
            style={{padding:'12px 24px',borderRadius:50,border:'none',background:'linear-gradient(135deg,var(--gold),#e8920a)',color:'#000',fontWeight:700,fontSize:13,cursor:'pointer',opacity:(generating||loading||filtered.length===0)?.6:1,boxShadow:'0 4px 16px rgba(245,166,35,.3)'}}>
            {generating ? '⏳ Génération...' : '📄 Exporter PDF'}
          </button>
        </div>
      </div>

      {/* Sélecteur période */}
      <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:16}}>
        {PERIODS.map(p => (
          <button key={p.id} onClick={() => setPeriod(p.id)}
            style={{padding:'7px 16px',borderRadius:20,fontSize:12,fontWeight:600,cursor:'pointer',border:'1px solid '+(period===p.id?'var(--gold)':'var(--border)'),background:period===p.id?'rgba(245,166,35,.12)':'transparent',color:period===p.id?'var(--gold)':'var(--text3)'}}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Dates custom */}
      {period === 'custom' && (
        <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:16,flexWrap:'wrap'}}>
          <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
            style={{padding:'8px 12px',borderRadius:8,border:'1px solid var(--border)',background:'var(--card)',color:'var(--text)',fontSize:13,outline:'none'}}/>
          <span style={{color:'var(--text3)',fontSize:13}}>→</span>
          <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
            style={{padding:'8px 12px',borderRadius:8,border:'1px solid var(--border)',background:'var(--card)',color:'var(--text)',fontSize:13,outline:'none'}}/>
        </div>
      )}

      {/* Période affichée */}
      <div style={{fontSize:11,color:'var(--text3)',marginBottom:16,fontFamily:'Space Mono,monospace'}}>
        {fmtDate(from)} → {fmtDate(to)} · {filtered.length} opération{filtered.length>1?'s':''}
      </div>

      {loading ? (
        <div style={{textAlign:'center',padding:60,color:'var(--text3)'}}>
          <div style={{fontSize:32,marginBottom:8,animation:'pulse-glow 1.5s infinite'}}>📊</div>
          <div>Chargement des données...</div>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:12,marginBottom:20}}>
            {[
              { label:'Revenus',    value:fmtAmt(totalIn),         icon:'💰', color:'var(--green)',  sub: income.length + ' opération'+(income.length>1?'s':'') },
              { label:'Dépenses',   value:fmtAmt(totalOut),        icon:'💸', color:'var(--red)',    sub: outcome.length + ' opération'+(outcome.length>1?'s':'') },
              { label:'Solde net',  value:fmtAmt(net),             icon: net>=0?'📈':'📉', color:net>=0?'var(--green)':'var(--red)', sub: net>=0?'Positif':'Négatif' },
              { label:'Opérations', value:String(filtered.length), icon:'📋', color:'var(--gold)',   sub: 'transactions' },
            ].map((k,i) => (
              <div key={i} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'16px 14px'}}>
                <div style={{fontSize:11,color:'var(--text3)',marginBottom:6}}>{k.icon} {k.label}</div>
                <div style={{fontSize:18,fontWeight:800,color:k.color,fontFamily:'Space Mono,monospace',marginBottom:3}}>{k.value}</div>
                <div style={{fontSize:11,color:'var(--text3)'}}>{k.sub}</div>
              </div>
            ))}
          </div>

          {/* Graphique barres par mois */}
          {monthKeys.length > 1 && (
            <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:16,marginBottom:20}}>
              <div style={{fontSize:12,fontWeight:700,marginBottom:14,color:'var(--text2)'}}>📈 Évolution mensuelle</div>
              <div style={{display:'flex',alignItems:'flex-end',gap:8,height:100}}>
                {monthKeys.map(k => {
                  const inPct  = Math.round((byMonth[k].in  / maxBar) * 100)
                  const outPct = Math.round((byMonth[k].out / maxBar) * 100)
                  return (
                    <div key={k} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:2,height:'100%',justifyContent:'flex-end'}}>
                      <div style={{width:'100%',display:'flex',gap:2,alignItems:'flex-end',height:80}}>
                        <div style={{flex:1,borderRadius:'3px 3px 0 0',background:'var(--green)',height:Math.max(inPct,2)+'%',minHeight:2,transition:'height .4s'}} title={'Revenus: '+fmtAmt(byMonth[k].in)}/>
                        <div style={{flex:1,borderRadius:'3px 3px 0 0',background:'var(--red)',height:Math.max(outPct,2)+'%',minHeight:2,transition:'height .4s'}} title={'Dépenses: '+fmtAmt(byMonth[k].out)}/>
                      </div>
                      <div style={{fontSize:9,color:'var(--text3)',fontFamily:'Space Mono,monospace',textAlign:'center'}}>{k.slice(5)}</div>
                    </div>
                  )
                })}
              </div>
              <div style={{display:'flex',gap:16,marginTop:8,fontSize:11,color:'var(--text3)'}}>
                <span><span style={{display:'inline-block',width:10,height:10,borderRadius:2,background:'var(--green)',marginRight:4}}/>Revenus</span>
                <span><span style={{display:'inline-block',width:10,height:10,borderRadius:2,background:'var(--red)',marginRight:4}}/>Dépenses</span>
              </div>
            </div>
          )}

          {/* Détail par type */}
          <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:16,marginBottom:20}}>
            <div style={{fontSize:12,fontWeight:700,marginBottom:12,color:'var(--text2)'}}>📂 Détail par type</div>
            {Object.keys(byType).length === 0
              ? <div style={{textAlign:'center',padding:20,color:'var(--text3)',fontSize:13}}>Aucune transaction sur cette période</div>
              : <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {Object.entries(byType).sort((a,b) => b[1].total - a[1].total).map(([type, data]) => {
                    const meta = TX_META[type] || { label: type, icon: '📌', dir: null, color: 'var(--text3)' }
                    const pct = Math.round((data.total / Math.max(totalIn, totalOut, 1)) * 100)
                    return (
                      <div key={type} style={{display:'flex',alignItems:'center',gap:10}}>
                        <div style={{width:28,height:28,borderRadius:8,background:'var(--bg2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0}}>{meta.icon}</div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                            <span style={{fontSize:12,fontWeight:600}}>{meta.label}</span>
                            <span style={{fontSize:12,fontFamily:'Space Mono,monospace',color:meta.dir==='in'?'var(--green)':meta.dir==='out'?'var(--red)':'var(--gold)'}}>{fmtAmt(data.total)}</span>
                          </div>
                          <div style={{height:4,background:'var(--bg2)',borderRadius:2,overflow:'hidden'}}>
                            <div style={{height:'100%',width:pct+'%',background:meta.dir==='in'?'var(--green)':meta.dir==='out'?'var(--red)':'var(--gold)',borderRadius:2,transition:'width .4s'}}/>
                          </div>
                          <div style={{fontSize:10,color:'var(--text3)',marginTop:2}}>{data.count} opération{data.count>1?'s':''}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
            }
          </div>

          {/* Liste transactions */}
          <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:16}}>
            <div style={{fontSize:12,fontWeight:700,marginBottom:12,color:'var(--text2)'}}>📋 Transactions ({filtered.length})</div>
            {filtered.length === 0
              ? <div style={{textAlign:'center',padding:20,color:'var(--text3)',fontSize:13}}>Aucune transaction sur cette période</div>
              : <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  {filtered.slice(0,50).map((tx, i) => {
                    const meta = TX_META[tx.type] || { label: tx.type, icon: '📌', dir: null }
                    const isIn = meta.dir === 'in' || (tx.type === 'transfer' && tx.recipient_id === user?.id)
                    return (
                      <div key={tx.id||i} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 10px',background:'var(--bg2)',borderRadius:'var(--radius-sm)'}}>
                        <div style={{width:32,height:32,borderRadius:8,background:'var(--card)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0}}>{meta.icon}</div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:12,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{tx.description || meta.label}</div>
                          <div style={{fontSize:10,color:'var(--text3)'}}>{fmtDate(tx.created_at)} · {meta.label}</div>
                        </div>
                        <div style={{fontSize:13,fontWeight:700,fontFamily:'Space Mono,monospace',color:isIn?'var(--green)':'var(--red)',flexShrink:0}}>
                          {isIn?'+':'-'}{fmtAmt(tx.amount)}
                        </div>
                      </div>
                    )
                  })}
                  {filtered.length > 50 && (
                    <div style={{textAlign:'center',fontSize:11,color:'var(--text3)',padding:8}}>
                      ... et {filtered.length - 50} autres transactions (incluses dans le PDF)
                    </div>
                  )}
                </div>
            }
          </div>
        </>
      )}
    </div>
  )
}
