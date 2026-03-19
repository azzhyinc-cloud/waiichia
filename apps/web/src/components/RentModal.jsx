import { useState, useEffect } from "react"
import { useDeviseStore } from "../stores/index.js"
import api from "../services/api.js"

const PERIODS = [
  { id: 'day', label: '📅 1 Jour', desc: '24h d\'accès', field: 'rent_price_day', days: 1 },
  { id: 'week', label: '📅 1 Semaine', desc: '7 jours d\'accès', field: 'rent_price_week', days: 7 },
  { id: 'month', label: '📅 1 Mois', desc: '30 jours d\'accès', field: 'rent_price_month', days: 30, best: true },
  { id: 'year', label: '📅 1 An', desc: '365 jours d\'accès', field: 'rent_price_year', days: 365 },
]

export default function RentModal({ track, onClose, onSuccess }) {
  const { devise } = useDeviseStore()
  const dc = devise?.code || 'KMF'
  const [period, setPeriod] = useState('day')
  const [autoRenew, setAutoRenew] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [done, setDone] = useState(false)
  const [balance, setBalance] = useState(0)

  useEffect(() => {
    api.payments.walletBalance().then(w => setBalance(w.balance || 0)).catch(() => {})
  }, [])

  const sel = PERIODS.find(p => p.id === period)
  const price = track[sel.field] || track.rent_price_day || track.rent_price || Math.round((track.sale_price || 2500) * 0.08)
  const insufficient = price > balance

  const confirm = async () => {
    if (insufficient) return setErr('Solde insuffisant — Rechargez votre portefeuille')
    setLoading(true); setErr('')
    try {
      await api.payments.rentTrack({ track_id: track.id, days: sel.days, amount: price, period: period, auto_renew: autoRenew })
      setDone(true)
      setTimeout(() => { onSuccess?.(); onClose() }, 2000)
    } catch (e) {
      setErr(e.message || 'Erreur de paiement')
    }
    setLoading(false)
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backdropFilter: 'blur(4px)' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 28, width: '100%', maxWidth: 460, boxShadow: '0 24px 64px rgba(0,0,0,.5)', animation: 'slideIn .2s ease' }}>

        {done ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>✅</div>
            <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Location activée !</div>
            <div style={{ fontSize: 13, color: 'var(--text2)' }}>Accès valable {sel.days} jour{sel.days > 1 ? 's' : ''}.{autoRenew ? ' Renouvellement automatique activé.' : ''}</div>
          </div>
        ) : (<>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <div style={{ width: 56, height: 56, borderRadius: 10, background: 'linear-gradient(135deg,var(--blue),#1a6fcc)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>⏳</div>
            <div>
              <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 17, fontWeight: 800 }}>Louer ce son</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 3 }}>{track.title}</div>
            </div>
          </div>

          {/* Périodes */}
          <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.8px' }}>Choisir une période</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, marginBottom: 16 }}>
            {PERIODS.map(p => {
              const pPrice = track[p.field] || track.rent_price_day || track.rent_price || Math.round((track.sale_price || 2500) * 0.08 * (p.days === 1 ? 1 : p.days === 7 ? 4 : p.days === 30 ? 12 : 100))
              return (
                <div key={p.id} onClick={() => setPeriod(p.id)}
                  style={{ background: period === p.id ? 'rgba(77,159,255,.1)' : 'var(--card)', border: `2px solid ${period === p.id ? 'var(--blue)' : 'var(--border)'}`, borderRadius: 'var(--radius-sm)', padding: '14px 12px', cursor: 'pointer', transition: 'all .18s', position: 'relative' }}>
                  {p.best && <div style={{ position: 'absolute', top: -8, right: 8, fontSize: 9, background: 'var(--green)', color: '#000', padding: '2px 8px', borderRadius: 20, fontFamily: 'Space Mono,monospace', fontWeight: 700 }}>POPULAIRE</div>}
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{p.label}</div>
                  <div style={{ fontFamily: 'Space Mono,monospace', fontSize: 16, fontWeight: 800, color: period === p.id ? 'var(--blue)' : 'var(--gold)', marginBottom: 2 }}>{pPrice.toLocaleString()} {dc}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{p.desc}</div>
                </div>
              )
            })}
          </div>

          {/* Auto-renew */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', marginBottom: 16 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>🔄 Renouvellement automatique</div>
              <div style={{ fontSize: 11.5, color: 'var(--text2)', marginTop: 2 }}>Débité automatiquement sur votre portefeuille</div>
            </div>
            <div className={`toggle-switch${autoRenew ? '' : ' off'}`} onClick={() => setAutoRenew(a => !a)} />
          </div>

          {/* Wallet debit */}
          <div style={{ background: 'linear-gradient(135deg,rgba(44,198,83,.08),rgba(44,198,83,.03))', border: '1px solid rgba(44,198,83,.2)', borderRadius: 'var(--radius-sm)', padding: '14px 16px', marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>💰</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>Portefeuille Waiichia</div>
                  <div style={{ fontSize: 10.5, color: 'var(--text3)' }}>Paiement instantané · Sécurisé</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>Solde disponible</div>
                <div style={{ fontFamily: 'Space Mono,monospace', fontWeight: 800, color: 'var(--green)', fontSize: 14 }}>{balance.toLocaleString()} {dc}</div>
              </div>
            </div>
            <div style={{ height: 1, background: 'var(--border)', marginBottom: 8 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text2)' }}>
              <span>Après paiement :</span>
              <span style={{ fontFamily: 'Space Mono,monospace', color: insufficient ? 'var(--red)' : 'var(--text)' }}>{(balance - price).toLocaleString()} {dc}</span>
            </div>
          </div>

          {/* Alerte solde insuffisant */}
          {insufficient && <div style={{ background: 'rgba(230,57,70,.1)', border: '1px solid rgba(230,57,70,.3)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 12, fontSize: 12.5, color: 'var(--red)' }}>
            ⚠️ Solde insuffisant — <span style={{ textDecoration: 'underline', cursor: 'pointer' }} onClick={() => { onClose(); /* TODO: open recharge */ }}>Recharger le portefeuille →</span>
          </div>}

          {err && <div style={{ background: 'rgba(230,57,70,.1)', border: '1px solid rgba(230,57,70,.3)', borderRadius: 'var(--radius-sm)', padding: 10, marginBottom: 12, fontSize: 12, color: 'var(--red)' }}>⚠️ {err}</div>}

          <button onClick={confirm} disabled={loading || insufficient}
            style={{ width: '100%', padding: 13, borderRadius: 50, border: 'none', background: loading || insufficient ? 'var(--border)' : 'linear-gradient(135deg,var(--blue),#1a6fcc)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading || insufficient ? 'not-allowed' : 'pointer', fontFamily: 'Plus Jakarta Sans,sans-serif', boxShadow: insufficient ? 'none' : '0 4px 16px rgba(77,159,255,.3)' }}>
            {loading ? 'Traitement...' : `⏳ Louer — ${price.toLocaleString()} ${dc}`}
          </button>
        </>)}
      </div>
    </div>
  )
}
