import { usePageStore, useAuthStore, useDeviseStore } from '../stores/index.js'
import { useState, useEffect } from 'react'
import api from '../services/api.js'
import { loadRates, convertAmount, FALLBACK_RATES } from '../services/currency.js'

const TAGS = ['#twarab','#komori','#waiichia','#amapiano','#afrobeats','#moroni','#sebene']
const fmtK=n=>n>=1000000?(n/1000000).toFixed(1)+"M":n>=1000?(n/1000).toFixed(1)+"K":String(n||0)

export default function RightPanel() {
  const { setPage } = usePageStore()
  const { user } = useAuthStore()
  const { devise } = useDeviseStore()
  const dc = devise?.code || 'KMF'
  const [stats, setStats] = useState({ plays: 0, revenue: 0, fans: 0 })
  // ── AJOUT : taux de change pour conversion devise ──
  const [rates, setRates] = useState(FALLBACK_RATES)

  useEffect(() => {
    if (!user) return
    const loadStats = async () => {
      try {
        const walletRes = await api.payments.walletBalance().catch(() => null)
        setStats({
          plays: user.total_plays || 0,
          revenue: walletRes?.balance || 0,
          fans: user.fans_count || user.followers_count || 0,
        })
      } catch(e) {}
    }
    loadStats()
    // ── AJOUT : charger les taux à chaque changement de devise ──
    loadRates().then(r => { if (r && Object.keys(r).length > 0) setRates(r) }).catch(() => {})
  }, [user, dc])

  // ── AJOUT : montant converti si devise différente de KMF ──
  const displayBalance = dc === 'KMF'
    ? stats.revenue.toLocaleString() + ' KMF'
    : (() => {
        const converted = convertAmount(stats.revenue, 'KMF', dc, rates)
        return converted !== null
          ? converted.toLocaleString() + ' ' + dc
          : stats.revenue.toLocaleString() + ' KMF'
      })()

  return (
    <aside className="right-panel">

      {/* MON COMPTE – données réelles + devise dynamique */}
      {user && (
        <div className="account-card">
          <div className="rp-section-title">Mon Compte</div>
          <div style={{display:'flex',flexDirection:'column',gap:7,fontSize:12}}>
            <div style={{display:'flex',justifyContent:'space-between'}}>
              <span style={{color:'var(--text2)'}}>Écoutes totales</span>
              <span style={{color:'var(--green)',fontFamily:'Space Mono,monospace'}}>{fmtK(stats.plays)}</span>
            </div>
            <div style={{display:'flex',justifyContent:'space-between'}}>
              <span style={{color:'var(--text2)'}}>Solde wallet</span>
              {/* ── MODIFIÉ : affiche le montant converti ── */}
              <span style={{color:'var(--gold)',fontFamily:'Space Mono,monospace'}}>{displayBalance}</span>
            </div>
            <div style={{display:'flex',justifyContent:'space-between'}}>
              <span style={{color:'var(--text2)'}}>Fans</span>
              <span style={{color:'var(--blue)',fontFamily:'Space Mono,monospace'}}>{fmtK(stats.fans)}</span>
            </div>
          </div>
          <div style={{display:'flex',gap:6,marginTop:10}}>
            <button className="btn btn-secondary btn-sm" style={{flex:1}} onClick={()=>setPage('wallet')}>Wallet →</button>
            <button className="btn btn-secondary btn-sm" style={{flex:1}} onClick={()=>setPage('dashboard')}>Stats →</button>
          </div>
        </div>
      )}

      {/* LIENS RAPIDES */}
      <div>
        <div className="rp-section-title">Accès rapide</div>
        <div style={{display:'flex',flexDirection:'column',gap:6}}>
          {[
            {icon:'🎵',label:'Publier un son',page:'upload'},
            {icon:'🪩',label:'Ma Boutique',page:'shop_mine'},
            {icon:'🎪',label:'Créer un événement',page:'create_event'},
            {icon:'📢',label:'Régie publicitaire',page:'regie'},
          ].map(l=>(
            <div key={l.page} onClick={()=>setPage(l.page)}
              style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',background:'var(--card)',border:'1px solid var(--border)',borderRadius:8,cursor:'pointer',fontSize:12,transition:'all .15s'}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--gold)';e.currentTarget.style.transform='translateX(3px)'}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.transform='none'}}>
              <span style={{fontSize:16}}>{l.icon}</span>
              <span style={{color:'var(--text2)'}}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* TAGS TENDANCES */}
      <div>
        <div className="rp-section-title">Tendances Tags</div>
        <div className="tags-wrap">
          {TAGS.map(tag => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>
      </div>

      {/* FOOTER PANEL */}
      <div style={{fontSize:10,color:'var(--text3)',textAlign:'center',padding:'12px 0',lineHeight:1.6}}>
        <div>Waiichia v7.2 · Moroni, Comores</div>
        <div style={{marginTop:4}}>
          <span style={{cursor:'pointer',color:'var(--text3)'}} onClick={()=>setPage('feed')}>À propos</span>
          {' · '}
          <span style={{cursor:'pointer',color:'var(--text3)'}}>CGU</span>
          {' · '}
          <span style={{cursor:'pointer',color:'var(--text3)'}}>Contact</span>
        </div>
      </div>
    </aside>
  )
}
