import { useState, useEffect, useRef, useCallback } from "react"
import { useAuthStore, usePageStore, useDeviseStore } from "../stores/index.js"
import api from "../services/api.js"
import { loadRates, convertAmount, FALLBACK_RATES } from "../services/currency.js"

/* ─── Constants ─────────────────────────────────────────────────────────── */
const DEVISES = [
  { code: 'KMF', flag: '🇰🇲', label: 'Franc Comorien' },
  { code: 'MGA', flag: '🇲🇬', label: 'Ariary' },
  { code: 'TZS', flag: '🇹🇿', label: 'Shilling' },
  { code: 'RWF', flag: '🇷🇼', label: 'Franc Rwandais' },
  { code: 'XOF', flag: '🇨🇮', label: 'FCFA Ouest' },
  { code: 'XAF', flag: '🇨🇬', label: 'FCFA Central' },
  { code: 'NGN', flag: '🇳🇬', label: 'Naira' },
  { code: 'USD', flag: '🇺🇸', label: 'Dollar' },
  { code: 'EUR', flag: '🇪🇺', label: 'Euro' },
]
const AMOUNTS = [2000, 5000, 10000, 25000, 50000, 100000]
const PERIODS = [
  { v: 'all',   l: 'Tout' },
  { v: 'today', l: "Auj." },
  { v: 'week',  l: 'Semaine' },
  { v: 'month', l: 'Mois' },
]
const TX_META = {
  recharge:    { icon: '💳', label: 'Recharge',    color: 'rgba(44,198,83,.13)',    dir: 'in'  },
  purchase:    { icon: '🛒', label: 'Achat',        color: 'rgba(230,57,70,.13)',    dir: 'out' },
  rental:      { icon: '⏳', label: 'Location',     color: 'rgba(245,166,35,.13)',   dir: 'out' },
  ticket:      { icon: '🎫', label: 'Billet',       color: 'rgba(245,166,35,.13)',   dir: 'out' },
  tip:         { icon: '☕', label: 'Tip',           color: 'rgba(44,198,83,.13)',    dir: 'in'  },
  transfer:    { icon: '↔️', label: 'Transfert',    color: 'rgba(77,159,255,.13)',   dir: null  },
  withdrawal:  { icon: '🏦', label: 'Retrait',      color: 'rgba(155,89,245,.13)',   dir: 'out' },
}
const METHOD_ICONS = { mvola: '📲', cash: '💵', bank: '🏦', card: '💳', paypal: '💳', wave: '🌊', orange_money: '🟠', mpesa: '📱', stripe: '💳' }
const METHOD_SUBS  = { mvola: 'USSD · Comores', cash: 'Points de vente', bank: 'IBAN / SWIFT', wave: 'SN · CI', orange_money: 'Mobile Money', mpesa: 'Mobile Money', stripe: 'Carte' }
const METHOD_PH    = { mvola: 'Numéro Mvola (ex: 3XX XX XX)', orange_money: 'Numéro Orange Money', mpesa: 'Numéro M-Pesa', wave: 'Numéro Wave', bank: 'IBAN complet', paypal: 'Adresse email PayPal', stripe: 'Email de confirmation' }

/* ─── Helpers ───────────────────────────────────────────────────────────── */
const fmt    = n => Math.abs(n || 0).toLocaleString('fr-FR')
const isMob  = () => /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || window.innerWidth <= 600

async function fetchPayMethods() {
  const API   = import.meta.env.VITE_API_URL || ''
  const token = localStorage.getItem('waiichia_token')
  const h     = token ? { Authorization: 'Bearer ' + token } : {}
  try {
    const r = await fetch(API + '/api/payments/methods', { headers: h })
    if (r.ok) {
      const d = await r.json()
      if (d.methods?.length > 0)
        return d.methods.map(m => ({ id: m.key, icon: METHOD_ICONS[m.key] || '💰', name: m.name || m.key, sub: METHOD_SUBS[m.key] || '', phone: m.phone || null, iban: m.iban || null, bank_name: m.bank_name || null, enabled: true }))
    }
    const r2 = await fetch(API + '/api/admin/payment-config', { headers: h })
    if (r2.ok) {
      const d2 = await r2.json()
      const cfg = d2.config || {}
      const methods = Object.entries(cfg).filter(([, v]) => v?.enabled).map(([id, v]) => ({ id, icon: METHOD_ICONS[id] || '💳', name: v.name || id, sub: METHOD_SUBS[id] || '', phone: v.phone || null, iban: v.iban || null, bank_name: v.bank_name || null, enabled: true }))
      if (methods.length > 0) return methods
    }
  } catch (_) {}
  return [
    { id: 'mvola', icon: '📲', name: 'Mvola',      sub: 'USSD · Comores', enabled: true },
    { id: 'cash',  icon: '💵', name: 'Dépôt Cash', sub: 'Points de vente', enabled: true },
  ]
}

/* ─── Shared sub-components ─────────────────────────────────────────────── */
function Toast({ msg }) {
  if (!msg) return null
  return (
    <div style={{ background: 'var(--gold)', color: '#000', padding: '8px 14px', borderRadius: 'var(--radius-sm)', fontSize: 12, fontWeight: 700, marginBottom: 12, textAlign: 'center', animation: 'fadeIn .2s' }}>
      {msg}
    </div>
  )
}

function ErrBanner({ msg }) {
  if (!msg) return null
  return (
    <div style={{ background: 'rgba(230,57,70,.1)', border: '1px solid rgba(230,57,70,.3)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', marginBottom: 12, fontSize: 12, color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 8 }}>
      <span>⚠️</span> {msg}
    </div>
  )
}

function BalanceBadge({ balance }) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 2 }}>Solde disponible</div>
        <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'Space Mono,monospace' }}>{fmt(balance)} KMF</div>
      </div>
      <span style={{ fontSize: 22 }}>💰</span>
    </div>
  )
}

function SummaryRow({ label, value, color, border }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, padding: '6px 0', ...(border ? { borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 4 } : {}) }}>
      <span style={{ color: 'var(--text2)' }}>{label}</span>
      <span style={{ fontWeight: border ? 700 : 500, fontFamily: 'Space Mono,monospace', color: color || 'inherit' }}>{value}</span>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN WALLET PAGE
═══════════════════════════════════════════════════════════════════════════ */
export default function Wallet() {
  const { user }    = useAuthStore()
  const { setPage } = usePageStore()
  const { devise }  = useDeviseStore()
  const dc          = devise?.code || 'KMF'

  const [balance,      setBalance]      = useState(0)
  const [transactions, setTransactions] = useState([])
  const [loading,      setLoading]      = useState(true)
  const [activeDev,    setActiveDev]    = useState(dc)
  const [txPeriod,     setTxPeriod]     = useState('all')
  const [rates,        setRates]        = useState(FALLBACK_RATES)

  const [modal, setModal] = useState(null) // 'recharge' | 'transfer' | 'withdraw' | null

  const refreshBalance = useCallback(() => {
    api.payments.walletBalance().then(w => { if (w.balance !== undefined) setBalance(w.balance) }).catch(() => {})
  }, [])

  const refreshAll = useCallback(() => {
    Promise.all([
      api.payments.walletBalance().catch(() => ({ balance: 0 })),
      api.payments.history().catch(() => ({})),
      loadRates().catch(() => FALLBACK_RATES),
    ]).then(([w, h, r]) => {
      if (w.balance !== undefined) setBalance(w.balance)
      setTransactions(h.transactions || [])
      if (r && Object.keys(r).length > 0) setRates(r)
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => { refreshAll() }, [refreshAll])

  /* ── Derived ── */
  const convertedBalance = activeDev === 'KMF' ? balance : convertAmount(balance, 'KMF', activeDev, rates)
  const usdBalance       = convertAmount(balance, 'KMF', 'USD', rates)
  const eurBalance       = convertAmount(balance, 'KMF', 'EUR', rates)

  const filteredTx = transactions.filter(tx => {
    if (txPeriod === 'all') return true
    const d = new Date(tx.created_at), now = new Date()
    if (txPeriod === 'today') return d.toDateString() === now.toDateString()
    if (txPeriod === 'week')  return d >= new Date(now - 7 * 86400000)
    if (txPeriod === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    return true
  })

  const txIncome  = transactions.filter(tx => { const m = TX_META[tx.type]; return m?.dir === 'in' || (tx.type === 'transfer' && tx.recipient_id === user?.id) }).reduce((s, t) => s + (t.amount || 0), 0)
  const txOutcome = transactions.filter(tx => { const m = TX_META[tx.type]; return m?.dir === 'out' || (tx.type === 'transfer' && tx.recipient_id !== user?.id) }).reduce((s, t) => s + (t.amount || 0), 0)

  if (!user) return (
    <div style={{ textAlign: 'center', padding: 60 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>💰</div>
      <h2 style={{ fontFamily: 'Syne,sans-serif' }}>Connectez-vous pour accéder à votre wallet</h2>
      <button className="btn btn-primary" onClick={() => setPage('login')} style={{ marginTop: 16 }}>Se connecter</button>
    </div>
  )

  return (
    <div style={{ paddingBottom: 60 }}>
      <div className="page-title">💰 Mon Portefeuille</div>

      {/* ── Hero card ── */}
      <div className="wallet-card">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="wallet-devise">Solde disponible · {activeDev}</div>
          {loading
            ? <div style={{ height: 44, display: 'flex', alignItems: 'center' }}><span style={{ color: 'var(--text3)', fontSize: 14 }}>Chargement…</span></div>
            : <div className="wallet-balance">
                {activeDev === 'KMF'
                  ? fmt(balance) + ' KMF'
                  : (convertedBalance !== null ? fmt(convertedBalance) + ' ' + activeDev : '—')}
              </div>
          }
          <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 16 }}>
            {activeDev !== 'KMF' && <span>{fmt(balance)} KMF · </span>}
            ≈ {usdBalance !== null ? fmt(usdBalance) : '—'} USD · ≈ {eurBalance !== null ? fmt(eurBalance) : '—'} EUR
          </div>

          {/* ── KPI strip ── */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
            {[
              { label: 'Entrants', val: fmt(txIncome) + ' KMF', color: 'var(--green)' },
              { label: 'Sortants', val: fmt(txOutcome) + ' KMF', color: 'var(--red)' },
            ].map(k => (
              <div key={k.label} style={{ flex: 1, background: 'rgba(0,0,0,.18)', borderRadius: 'var(--radius-sm)', padding: '8px 10px' }}>
                <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 2 }}>{k.label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'Space Mono,monospace', color: k.color }}>{k.val}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-primary  btn-sm" onClick={() => setModal('recharge')}>💳 Recharger</button>
            <button className="btn btn-secondary btn-sm" onClick={() => setModal('transfer')}>↔ Transférer</button>
            <button className="btn btn-secondary btn-sm" onClick={() => setModal('withdraw')}>🏦 Retirer</button>
          </div>
        </div>
      </div>

      {/* ── Devise selector ── */}
      <div className="card" style={{ padding: 16, marginBottom: 18 }}>
        <div className="label" style={{ marginBottom: 10 }}>Afficher en</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {DEVISES.map(d => (
            <div key={d.code} className={`pill-tab${activeDev === d.code ? ' active' : ''}`} onClick={() => setActiveDev(d.code)} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 14 }}>{d.flag}</span> {d.code}
            </div>
          ))}
        </div>
        {activeDev !== 'KMF' && (
          <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text3)', fontFamily: 'Space Mono,monospace' }}>
            1 KMF = {convertAmount(1, 'KMF', activeDev, rates) || '—'} {activeDev}
          </div>
        )}
      </div>

      {/* ── Actions rapides ── */}
      <div className="wallet-actions">
        {[
          { icon: '💳', label: 'Recharger',  action: () => setModal('recharge') },
          { icon: '↔️', label: 'Transférer', action: () => setModal('transfer') },
          { icon: '🏦', label: 'Retirer',    action: () => setModal('withdraw') },
        ].map(a => (
          <div key={a.label} className="wallet-action-btn" onClick={a.action}>
            <div className="wallet-action-icon">{a.icon}</div>
            <div className="wallet-action-label">{a.label}</div>
          </div>
        ))}
        <div className="wallet-action-btn" style={{ opacity: .5 }}>
          <div className="wallet-action-icon">📋</div>
          <div className="wallet-action-label" style={{ fontSize: 10 }}>Réclamation</div>
        </div>
      </div>

      {/* ── Historique ── */}
      <div className="section-hdr"><div className="section-title">📊 Historique</div></div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        {PERIODS.map(p => (
          <div key={p.v} className={`pill-tab${txPeriod === p.v ? ' active' : ''}`} onClick={() => setTxPeriod(p.v)}>{p.l}</div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filteredTx.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)', background: 'var(--card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
            <div style={{ fontSize: 13 }}>Aucune transaction{txPeriod !== 'all' ? ' sur cette période' : ''}</div>
          </div>
        )}
        {filteredTx.map(tx => <TxRow key={tx.id} tx={tx} user={user} activeDev={activeDev} rates={rates} />)}
      </div>

      {/* ── Modales ── */}
      {modal === 'recharge'  && <RechargeModal  balance={balance} rates={rates} user={user} onClose={() => setModal(null)} onSuccess={amt  => { setBalance(b => b + amt); setModal(null); refreshAll() }} />}
      {modal === 'transfer'  && <TransferModal  balance={balance}               user={user} onClose={() => setModal(null)} onSuccess={()  => { refreshBalance(); setModal(null); refreshAll() }} />}
      {modal === 'withdraw'  && <WithdrawModal  balance={balance}               user={user} onClose={() => setModal(null)} onSuccess={()  => { refreshBalance(); setModal(null) }} />}
    </div>
  )
}

/* ─── Invoice generator ─────────────────────────────────────────────────── */
async function generateInvoice(tx, user) {
  const { jsPDF } = await import("jspdf")
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const gold = [245, 166, 35]
  const dark = [18, 18, 18]
  const grey = [120, 120, 120]
  const W = 210

  // Header band
  doc.setFillColor(...gold)
  doc.rect(0, 0, W, 28, 'F')
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('WAIICHIA', 14, 12)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('waiichia.com', 14, 18)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('FACTURE', W - 14, 12, { align: 'right' })
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('N° ' + (tx.id || '').slice(0, 8).toUpperCase(), W - 14, 18, { align: 'right' })

  // Info block
  doc.setTextColor(...dark)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Acheteur', 14, 40)
  doc.setFont('helvetica', 'normal')
  doc.text(user?.display_name || user?.username || 'Client', 14, 46)
  doc.text(user?.email || '', 14, 51)

  doc.setFont('helvetica', 'bold')
  doc.text('Date', W - 60, 40)
  doc.setFont('helvetica', 'normal')
  doc.text(new Date(tx.created_at).toLocaleDateString('fr-FR'), W - 60, 46)
  doc.text('Statut : ' + (tx.status === 'completed' ? 'Payee' : tx.status || ''), W - 60, 51)

  // Divider
  doc.setDrawColor(...gold)
  doc.setLineWidth(0.5)
  doc.line(14, 58, W - 14, 58)

  // Table header
  doc.setFillColor(245, 245, 245)
  doc.rect(14, 61, W - 28, 8, 'F')
  doc.setTextColor(...grey)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('DESCRIPTION', 18, 66.5)
  doc.text('TYPE', 120, 66.5)
  doc.text('MONTANT', W - 18, 66.5, { align: 'right' })

  // Table row
  doc.setTextColor(...dark)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  const desc = tx.description || tx.type || 'Transaction'
  doc.text(desc.slice(0, 55), 18, 78)
  doc.text(tx.type || '', 120, 78)
  doc.setFont('helvetica', 'bold')
  doc.text((tx.amount || 0).toLocaleString() + ' ' + (tx.currency || 'KMF'), W - 18, 78, { align: 'right' })

  // Total band
  doc.setFillColor(...gold)
  doc.rect(14, 88, W - 28, 12, 'F')
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('TOTAL', 18, 96)
  doc.text((tx.amount || 0).toLocaleString() + ' ' + (tx.currency || 'KMF'), W - 18, 96, { align: 'right' })

  // Footer
  doc.setTextColor(...grey)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('Waiichia — Plateforme musicale africaine — contact@waiichia.com', W / 2, 280, { align: 'center' })
  doc.text('Ce document est une facture electronique generee automatiquement.', W / 2, 285, { align: 'center' })

  doc.save('facture-waiichia-' + (tx.id || '').slice(0, 8) + '.pdf')
}

/* ─── Transaction row ───────────────────────────────────────────────────── */
function TxRow({ tx, user, activeDev, rates }) {
  const meta = TX_META[tx.type] || { icon: '📌', label: tx.type, color: 'var(--card2)', dir: null }

  /* Direction réelle pour les transferts */
  let isIncome
  if (tx.type === 'transfer') {
    isIncome = tx.recipient_id === user?.id
  } else {
    isIncome = meta.dir === 'in'
  }

  const amt          = tx.amount || 0
  const convertedAmt = activeDev !== 'KMF' ? convertAmount(amt, 'KMF', activeDev, rates) : null
  const isPending    = tx.status === 'pending'

  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
      {/* Icon */}
      <div style={{ width: 40, height: 40, borderRadius: 10, background: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
        {meta.icon}
      </div>

      {/* Description */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {tx.description || meta.label}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
          {new Date(tx.created_at).toLocaleDateString('fr-FR')}
          {isPending
            ? <span style={{ background: 'rgba(245,166,35,.15)', color: 'var(--gold)', borderRadius: 4, padding: '1px 5px', fontSize: 10, fontWeight: 700 }}>En attente</span>
            : <span style={{ background: 'rgba(44,198,83,.12)', color: 'var(--green)', borderRadius: 4, padding: '1px 5px', fontSize: 10, fontWeight: 700 }}>✓</span>
          }
        </div>
      </div>

      {/* Amount */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'Space Mono,monospace', color: isIncome ? 'var(--green)' : 'var(--red)' }}>
          {isIncome ? '+' : '−'}{fmt(amt)} {tx.currency || 'KMF'}
        </div>
        {convertedAmt !== null && (
          <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'Space Mono,monospace' }}>
            ≈ {fmt(convertedAmt)} {activeDev}
          </div>
        )}
      </div>
      {/* Facture */}
      {(tx.type === 'purchase' || tx.type === 'track_buy' || tx.type === 'ticket') && (
        <button onClick={() => generateInvoice(tx, user).catch(e => alert("Erreur PDF: " + e.message))} title="Telecharger la facture"
          style={{ flexShrink:0, background:'none', border:'1px solid var(--border)', borderRadius:6, padding:'4px 8px', cursor:'pointer', fontSize:14, color:'var(--text2)' }}>
          📄
        </button>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   RECHARGE MODAL
═══════════════════════════════════════════════════════════════════════════ */
function RechargeModal({ balance, rates, user, onClose, onSuccess }) {
  const [amount,        setAmount]        = useState(10000)
  const [custom,        setCustom]        = useState('')
  const [method,        setMethod]        = useState(null)
  const [step,          setStep]          = useState('choose') // 'choose' | 'pending'
  const [toast,         setToast]         = useState('')
  const [payMethods,    setPayMethods]    = useState([])
  const [loadingMethods,setLoadingMethods]= useState(true)

  const total  = custom ? parseInt(custom) || 0 : amount
  const mobile = isMob()

  const showToast = m => { setToast(m); setTimeout(() => setToast(''), 3000) }

  useEffect(() => {
    fetchPayMethods().then(m => setPayMethods(m)).finally(() => setLoadingMethods(false))
  }, [])

  const selectedMethod  = payMethods.find(m => m.id === method)
  const mvolaRef        = String(parseInt((user?.id || '000000').replace(/-/g, '').slice(0, 8), 16) % 900000 + 100000)
  const mvolaUSSD       = `*444*1*2*4102122*${total}*${mvolaRef}#`
  const mvolaUSSDforQR  = `*444*1*2*4102122*${total}*${mvolaRef}%23`
  const qrUrl           = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent('tel:' + mvolaUSSDforQR)
  const cashCode        = 'WA' + Math.random().toString(36).substr(2, 6).toUpperCase()
  const bankRef         = 'WAI-' + String(Date.now()).slice(-8)

  const [phone, setPhone] = useState('')
  const confirmRecharge = async () => {
    try {
      await api.payments.recharge({ amount: total, gateway: method, phone })
      setStep('pending')
    } catch (e) { showToast('⚠️ ' + e.message) }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="modal-hdr">
          <div className="modal-title">💳 Recharger</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <Toast msg={toast} />

        {step === 'pending' && (
          <div style={{ textAlign: 'center', padding: '30px 0' }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>⏳</div>
            <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Recharge en attente</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7, maxWidth: 360, margin: '0 auto' }}>
              Votre paiement sera vérifié par notre équipe. Le solde sera crédité dès confirmation.
            </div>
            <div style={{ marginTop: 16, padding: 12, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontFamily: 'Space Mono,monospace', fontSize: 14, fontWeight: 700, color: 'var(--gold)' }}>
              Réf : {method === 'mvola' ? mvolaRef : method === 'cash' ? cashCode : bankRef}
            </div>
            <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={onClose}>Compris ✓</button>
          </div>
        )}

        {step === 'choose' && (
          <>
            <BalanceBadge balance={balance} />

            {/* Montant */}
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginBottom: 8 }}>Montant (KMF)</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
              {AMOUNTS.map(a => (
                <button key={a} onClick={() => { setAmount(a); setCustom('') }} className={`pill-tab${!custom && amount === a ? ' active' : ''}`}>
                  {a.toLocaleString()}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <input className="input-field" type="number" placeholder="Montant libre" value={custom} onChange={e => setCustom(e.target.value)} style={{ flex: 1 }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', fontFamily: 'Space Mono,monospace' }}>KMF</span>
            </div>

            {/* Méthode */}
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginBottom: 8 }}>Mode de paiement</div>
            {loadingMethods
              ? <div style={{ textAlign: 'center', padding: 20, color: 'var(--text3)' }}>⏳ Chargement…</div>
              : payMethods.length === 0
                ? <div style={{ textAlign: 'center', padding: 20, color: 'var(--text3)', fontSize: 13 }}>⚠️ Aucun mode actif. Contactez l'administrateur.</div>
                : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, marginBottom: 14 }}>
                    {payMethods.map(m => (
                      <div key={m.id} onClick={() => m.enabled && setMethod(m.id)}
                        style={{ padding: 14, borderRadius: 'var(--radius-sm)', border: `1px solid ${method === m.id ? 'var(--gold)' : 'var(--border)'}`, background: method === m.id ? 'rgba(245,166,35,.08)' : 'var(--card)', cursor: m.enabled ? 'pointer' : 'not-allowed', opacity: m.enabled ? 1 : .5, textAlign: 'center', transition: 'all .2s' }}>
                        <div style={{ fontSize: 24, marginBottom: 4 }}>{m.icon}</div>
                        <div style={{ fontSize: 12, fontWeight: 700 }}>{m.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--text3)' }}>{m.sub}</div>
                      </div>
                    ))}
                  </div>
            }

            {/* Téléphone Mvola */}
            {method === 'mvola' && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginBottom: 6 }}>📱 Votre numéro Mvola</div>
                <input className="input-field" type="tel" placeholder="ex: 3XX XX XX" value={phone} onChange={e => setPhone(e.target.value)} style={{ width: '100%' }} />
              </div>
            )}
            {/* Instructions Mvola */}
            {method === 'mvola' && (
              <div style={{ background: 'var(--card)', border: '1px solid rgba(155,89,245,.2)', borderRadius: 'var(--radius-sm)', padding: 16, marginBottom: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>📲 Paiement Mvola</div>
                {mobile
                  ? <>
                      <a href={`tel:${encodeURIComponent(mvolaUSSD)}`} style={{ display: 'block', width: '100%', padding: 14, background: 'linear-gradient(135deg,#9b59f5,#7d3cb5)', color: '#fff', borderRadius: 'var(--radius-sm)', textAlign: 'center', fontWeight: 700, fontSize: 15, textDecoration: 'none', boxShadow: '0 4px 16px rgba(155,89,245,.4)', marginBottom: 12 }}>
                        📞 Composer — {total.toLocaleString()} KMF
                      </a>
                      <div style={{ background: 'rgba(155,89,245,.12)', border: '2px solid rgba(155,89,245,.4)', borderRadius: 'var(--radius-sm)', padding: 12, textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>⚠️ Quand Mvola demande la description, tapez :</div>
                        <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: 6, color: 'var(--primary)', fontFamily: 'monospace', marginBottom: 8 }}>{mvolaRef}</div>
                        <button className="btn btn-secondary btn-sm" style={{ fontSize: 12 }} onClick={() => { navigator.clipboard?.writeText(mvolaRef); showToast('📋 Code copié !') }}>📋 Copier le code</button>
                      </div>
                    </>
                  : <>
                      <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 12, lineHeight: 1.6 }}>Scannez ce QR avec votre téléphone :</div>
                      <div style={{ textAlign: 'center', marginBottom: 14 }}>
                        <img src={qrUrl} alt="QR Mvola" style={{ width: 200, height: 200, borderRadius: 12, border: '4px solid var(--border)' }} />
                      </div>
                      <div style={{ textAlign: 'center', marginBottom: 10 }}>
                        <button className="btn btn-secondary btn-sm" style={{ fontSize: 12 }} onClick={() => { navigator.clipboard?.writeText(mvolaUSSD); showToast('📋 Code USSD copié !') }}>📋 Copier le code USSD</button>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center', marginBottom: 12 }}>⚠️ Compatible Comores Telecom uniquement</div>
                      <div style={{ background: 'rgba(155,89,245,.12)', border: '2px solid rgba(155,89,245,.4)', borderRadius: 'var(--radius-sm)', padding: 12, textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>⚠️ Quand Mvola demande la description, tapez :</div>
                        <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: 6, color: 'var(--primary)', fontFamily: 'monospace', marginBottom: 8 }}>{mvolaRef}</div>
                        <button className="btn btn-secondary btn-sm" style={{ fontSize: 12 }} onClick={() => { navigator.clipboard?.writeText(mvolaRef); showToast('📋 Code copié !') }}>📋 Copier le code</button>
                      </div>
                    </>
                }

              </div>
            )}

            {/* Instructions Cash */}
            {method === 'cash' && (
              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 16, marginBottom: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>💵 Dépôt en espèces</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 12 }}>Communiquez ce code au point de vente :</div>
                <div style={{ background: 'var(--bg)', border: '2px dashed var(--gold)', borderRadius: 'var(--radius-sm)', padding: 16, textAlign: 'center', marginBottom: 12 }}>
                  <div style={{ fontFamily: 'Space Mono,monospace', fontSize: 22, fontWeight: 700, color: 'var(--gold)', letterSpacing: 3 }}>{cashCode}</div>
                  <button className="btn btn-outline btn-sm" style={{ marginTop: 8 }} onClick={() => { navigator.clipboard?.writeText(cashCode); showToast('📋 Copié !') }}>📋 Copier</button>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>📍 Points de dépôt : Moroni, Mitsamihouli, Mutsamudu, Fomboni</div>
              </div>
            )}

            {/* Instructions Bank */}
            {method === 'bank' && (
              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 16, marginBottom: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>🏦 Virement bancaire</div>
                {[
                  ['Banque',        selectedMethod?.bank_name || 'BIC Comores'],
                  ['IBAN',          selectedMethod?.iban      || 'KM46 0000 1000 5001 0014 0602 68'],
                  ['BIC/SWIFT',     'BCICOMKM'],
                  ['Bénéficiaire',  'WAIICHIA SAS'],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                    <span style={{ color: 'var(--text3)' }}>{k}</span>
                    <span style={{ fontFamily: 'Space Mono,monospace' }}>{v}</span>
                  </div>
                ))}
                <div style={{ marginTop: 12, background: 'var(--bg)', border: '2px dashed var(--gold)', borderRadius: 'var(--radius-sm)', padding: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--text3)' }}>Référence obligatoire</div>
                  <div style={{ fontFamily: 'Space Mono,monospace', fontSize: 16, fontWeight: 700, color: 'var(--gold)', marginTop: 4 }}>{bankRef}</div>
                </div>
              </div>
            )}

            {/* Récap + CTA */}
            {method && (
              <>
                <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 14, marginBottom: 14 }}>
                  <SummaryRow label="Montant" value={`${total.toLocaleString()} KMF`} />
                  <SummaryRow label="Nouveau solde" value={`${(balance + total).toLocaleString()} KMF`} color="var(--green)" border />
                </div>
                <button className="btn btn-primary" style={{ width: '100%', padding: 14, fontSize: 14 }} onClick={confirmRecharge} disabled={!total}>
                  ✅ Confirmer la recharge
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   TRANSFER MODAL — avec étape de confirmation + recherche username
═══════════════════════════════════════════════════════════════════════════ */
function TransferModal({ balance, user, onClose, onSuccess }) {
  const [dest,        setDest]        = useState('')
  const [amount,      setAmount]      = useState('')
  const [msg,         setMsg]         = useState('')
  const [step,        setStep]        = useState('form')      // 'form' | 'confirm' | 'done'
  const [loading,     setLoading]     = useState(false)
  const [err,         setErr]         = useState('')
  const [searching,   setSearching]   = useState(false)
  const [destFound,   setDestFound]   = useState(null)        // null | false | { username, avatar_url }
  const debRef = useRef(null)

  const amt      = parseInt(amount) || 0
  const fee      = Math.max(Math.floor(amt * 0.01), amt > 0 ? 10 : 0) // 1%, min 10 KMF
  const net      = amt                  // destinataire reçoit amt, fee déduit du solde expéditeur
  const totalOut = amt + fee
  const after    = balance - totalOut

  /* Debounce recherche username */
  useEffect(() => {
    const raw = dest.replace('@', '').trim()
    if (!raw || raw.length < 2) { setDestFound(null); return }
    clearTimeout(debRef.current)
    setSearching(true)
    debRef.current = setTimeout(async () => {
      try {
        const r = await api.get('/api/profiles/search?q=' + encodeURIComponent(raw) + '&limit=1')
        const profiles = r.profiles || r.results || []
        const match = profiles.find(p => p.username?.toLowerCase() === raw.toLowerCase())
        setDestFound(match || false)
      } catch (_) { setDestFound(null) }
      setSearching(false)
    }, 400)
    return () => clearTimeout(debRef.current)
  }, [dest])

  const goConfirm = () => {
    const raw = dest.replace('@', '').trim()
    if (!raw)             return setErr('Destinataire requis')
    if (destFound === false) return setErr('Utilisateur introuvable')
    if (!amt || amt < 100) return setErr('Montant minimum 100 KMF')
    if (totalOut > balance) return setErr('Solde insuffisant (frais inclus)')
    if (raw === user?.username) return setErr('Vous ne pouvez pas vous transférer à vous-même')
    setErr('')
    setStep('confirm')
  }

  const doTransfer = async () => {
    setLoading(true); setErr('')
    try {
      await api.payments.transfer({ to_username: dest.replace('@', '').trim(), amount: amt, message: msg })
      setStep('done')
    } catch (e) { setErr(e.message || 'Erreur lors du transfert'); setStep('form') }
    setLoading(false)
  }

  if (step === 'done') return (
    <div className="modal-overlay" onClick={() => { onSuccess(); onClose() }}>
      <div className="modal" style={{ maxWidth: 420, textAlign: 'center', padding: 30 }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 52, marginBottom: 12 }}>✅</div>
        <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Transfert envoyé !</div>
        <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
          {fmt(amt)} KMF envoyés à <strong>@{dest.replace('@', '')}</strong>
          {msg && <><br /><em style={{ color: 'var(--text3)' }}>"{msg}"</em></>}
        </div>
        <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => { onSuccess(); onClose() }}>Fermer</button>
      </div>
    </div>
  )

  if (step === 'confirm') return (
    <div className="modal-overlay" onClick={() => setStep('form')}>
      <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <button className="btn btn-ghost btn-sm" onClick={() => setStep('form')} style={{ marginRight: 8 }}>← Retour</button>
          <div className="modal-title">Confirmer le transfert</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <ErrBanner msg={err} />

        {/* Récap visuel */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(77,159,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
              {destFound?.avatar_url ? <img src={destFound.avatar_url} style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover' }} alt="" /> : '👤'}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>@{dest.replace('@', '')}</div>
              {destFound?.display_name && <div style={{ fontSize: 12, color: 'var(--text3)' }}>{destFound.display_name}</div>}
            </div>
          </div>
          <SummaryRow label="Montant envoyé"  value={`${fmt(amt)} KMF`} />
          <SummaryRow label="Commission (1%)" value={`${fmt(fee)} KMF`} color="var(--red)" />
          {msg && <SummaryRow label="Message" value={`"${msg}"`} />}
          <SummaryRow label="Solde après" value={`${fmt(after)} KMF`} color={after < 0 ? 'var(--red)' : 'var(--green)'} border />
        </div>

        <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 14, textAlign: 'center' }}>
          ⚠️ Cette opération est irréversible. Vérifiez bien le destinataire.
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => setStep('form')} style={{ flex: 1 }}>Modifier</button>
          <button className="btn btn-primary"   onClick={doTransfer} disabled={loading} style={{ flex: 2 }}>
            {loading ? '⏳ Envoi…' : `↔ Confirmer — ${fmt(amt)} KMF`}
          </button>
        </div>
      </div>
    </div>
  )

  /* step === 'form' */
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title">↔️ Transférer</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <ErrBanner msg={err} />
        <BalanceBadge balance={balance} />

        {/* Destinataire */}
        <div className="form-group">
          <label className="label">Destinataire (@username)</label>
          <div style={{ position: 'relative' }}>
            <input className="input-field" value={dest} onChange={e => { setDest(e.target.value); setErr('') }} placeholder="@username" />
            {searching && <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--text3)' }}>🔍</span>}
            {!searching && destFound && <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14 }}>✅</span>}
            {!searching && destFound === false && dest.replace('@', '').length >= 2 && (
              <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14 }}>❌</span>
            )}
          </div>
          {destFound && (
            <div style={{ marginTop: 6, fontSize: 12, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 6 }}>
              {destFound.avatar_url && <img src={destFound.avatar_url} style={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'cover' }} alt="" />}
              {destFound.display_name || '@' + destFound.username} trouvé ✓
            </div>
          )}
          {destFound === false && dest.replace('@', '').length >= 2 && (
            <div style={{ marginTop: 6, fontSize: 12, color: 'var(--red)' }}>Utilisateur introuvable</div>
          )}
        </div>

        {/* Montant */}
        <div className="form-group">
          <label className="label">Montant (KMF)</label>
          <input className="input-field" type="number" value={amount} onChange={e => { setAmount(e.target.value); setErr('') }} placeholder="Minimum 100 KMF" />
        </div>

        {/* Message */}
        <div className="form-group">
          <label className="label">Message <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(optionnel)</span></label>
          <input className="input-field" value={msg} onChange={e => setMsg(e.target.value)} placeholder="Ex : Featuring, collaboration…" />
        </div>

        {/* Résumé */}
        {amt >= 100 && (
          <div style={{ background: after < 0 ? 'rgba(230,57,70,.06)' : 'rgba(44,198,83,.06)', border: `1px solid ${after < 0 ? 'rgba(230,57,70,.2)' : 'rgba(44,198,83,.2)'}`, borderRadius: 'var(--radius-sm)', padding: 12, marginBottom: 16 }}>
            <SummaryRow label="Montant"      value={`${fmt(amt)} KMF`} />
            <SummaryRow label="Commission"   value={`${fmt(fee)} KMF`} color="var(--red)" />
            <SummaryRow label="Solde après"  value={`${fmt(after)} KMF`} color={after < 0 ? 'var(--red)' : 'var(--green)'} border />
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>Annuler</button>
          <button className="btn btn-primary" style={{ flex: 2 }} onClick={goConfirm} disabled={totalOut > balance || amt < 100}>
            Continuer →
          </button>
        </div>
        <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--text3)', marginTop: 8 }}>Commission 1% · Minimum 100 KMF</div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   WITHDRAW MODAL
═══════════════════════════════════════════════════════════════════════════ */
function WithdrawModal({ balance, onClose, onSuccess }) {
  const [withdrawMethods,  setWithdrawMethods]  = useState([])
  const [loadingMethods,   setLoadingMethods]   = useState(true)
  const [method,           setMethod]           = useState(null)
  const [amount,           setAmount]           = useState('')
  const [destination,      setDestination]      = useState('')
  const [step,             setStep]             = useState('form') // 'form' | 'confirm' | 'done'
  const [loading,          setLoading]          = useState(false)
  const [err,              setErr]              = useState('')

  const amt            = parseInt(amount) || 0
  const fee            = Math.floor(amt * 0.025)
  const net            = amt - fee
  const selectedMethod = withdrawMethods.find(m => m.id === method)

  useEffect(() => {
    fetchPayMethods()
      .then(m => setWithdrawMethods(m.filter(x => x.id !== 'cash')))
      .finally(() => setLoadingMethods(false))
  }, [])

  /* Reset destination quand on change de méthode */
  useEffect(() => { setDestination('') }, [method])

  const goConfirm = () => {
    if (!method)                return setErr('Choisissez un mode de retrait')
    if (!amt || amt < 500)      return setErr('Montant minimum 500 KMF')
    if (amt > balance)          return setErr('Solde insuffisant')
    if (!destination.trim())    return setErr('La destination est requise')
    setErr(''); setStep('confirm')
  }

  const doWithdraw = async () => {
    setLoading(true); setErr('')
    try {
      await api.payments.withdraw({ amount: amt, method, destination, notes: '' })
      setStep('done')
    } catch (e) { setErr(e.message || 'Erreur'); setStep('form') }
    setLoading(false)
  }

  if (step === 'done') return (
    <div className="modal-overlay" onClick={() => { onSuccess(); onClose() }}>
      <div className="modal" style={{ maxWidth: 420, textAlign: 'center', padding: 30 }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 52, marginBottom: 12 }}>✅</div>
        <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Demande de retrait envoyée</div>
        <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
          <strong>{fmt(net)} KMF</strong> seront envoyés via {selectedMethod?.name || method}.<br />
          Destination : <strong>{destination}</strong><br />
          <span style={{ color: 'var(--text3)' }}>Traitement sous 24–48h par notre équipe.</span>
        </div>
        <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => { onSuccess(); onClose() }}>Compris ✓</button>
      </div>
    </div>
  )

  if (step === 'confirm') return (
    <div className="modal-overlay" onClick={() => setStep('form')}>
      <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <button className="btn btn-ghost btn-sm" onClick={() => setStep('form')} style={{ marginRight: 8 }}>← Retour</button>
          <div className="modal-title">Confirmer le retrait</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <ErrBanner msg={err} />

        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 16, marginBottom: 16 }}>
          <SummaryRow label="Méthode"             value={`${selectedMethod?.icon || ''} ${selectedMethod?.name || method}`} />
          <SummaryRow label="Destination"          value={destination} />
          <SummaryRow label="Montant demandé"      value={`${fmt(amt)} KMF`} />
          <SummaryRow label="Commission (2.5%)"    value={`${fmt(fee)} KMF`} color="var(--red)" />
          <SummaryRow label="Vous recevrez"        value={`${fmt(net)} KMF`} color="var(--green)" border />
        </div>

        <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 14, textAlign: 'center' }}>
          ⚠️ Vérifiez bien vos coordonnées. Traitement sous 24–48h.
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => setStep('form')} style={{ flex: 1 }}>Modifier</button>
          <button className="btn btn-primary"   onClick={doWithdraw} disabled={loading} style={{ flex: 2 }}>
            {loading ? '⏳ Envoi…' : '🏦 Confirmer le retrait'}
          </button>
        </div>
      </div>
    </div>
  )

  /* step === 'form' */
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title">🏦 Retirer des fonds</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <ErrBanner msg={err} />
        <BalanceBadge balance={balance} />

        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginBottom: 8 }}>Mode de retrait</div>
        {loadingMethods
          ? <div style={{ textAlign: 'center', padding: 20, color: 'var(--text3)' }}>⏳ Chargement…</div>
          : withdrawMethods.length === 0
            ? <div style={{ textAlign: 'center', padding: 20, color: 'var(--text3)', fontSize: 13 }}>⚠️ Aucun mode actif. Contactez l'administrateur.</div>
            : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginBottom: 14 }}>
                {withdrawMethods.map(m => (
                  <div key={m.id} onClick={() => setMethod(m.id)}
                    style={{ padding: 10, borderRadius: 'var(--radius-sm)', border: `1px solid ${method === m.id ? 'var(--gold)' : 'var(--border)'}`, background: method === m.id ? 'rgba(245,166,35,.08)' : 'var(--card)', cursor: 'pointer', textAlign: 'center', transition: 'all .2s' }}>
                    <div style={{ fontSize: 20, marginBottom: 2 }}>{m.icon}</div>
                    <div style={{ fontSize: 10, fontWeight: 700 }}>{m.name}</div>
                  </div>
                ))}
              </div>
        }

        <div className="form-group">
          <label className="label">Montant (KMF) — minimum 500</label>
          <input className="input-field" type="number" value={amount} onChange={e => { setAmount(e.target.value); setErr('') }} placeholder="Ex: 10 000" />
        </div>

        {method && (
          <div className="form-group">
            <label className="label">Destination — {selectedMethod?.name || method}</label>
            <input className="input-field" value={destination} onChange={e => { setDestination(e.target.value); setErr('') }} placeholder={METHOD_PH[method] || 'Numéro ou adresse'} />
          </div>
        )}

        {amt >= 500 && (
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 14, marginBottom: 14 }}>
            <SummaryRow label="Montant"           value={`${fmt(amt)} KMF`} />
            <SummaryRow label="Commission (2.5%)" value={`${fmt(fee)} KMF`} color="var(--red)" />
            <SummaryRow label="Vous recevrez"     value={`${fmt(net)} KMF`} color="var(--green)" border />
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>Annuler</button>
          <button className="btn btn-primary" style={{ flex: 2 }} onClick={goConfirm} disabled={amt > balance || !method}>
            Continuer →
          </button>
        </div>
        <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--text3)', marginTop: 8 }}>Traitement sous 24–48h · Commission 2.5%</div>
      </div>
    </div>
  )
}
