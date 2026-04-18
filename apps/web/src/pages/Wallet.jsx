import { useState, useEffect } from "react"
import { useAuthStore, usePageStore, useDeviseStore } from "../stores/index.js"
import api from "../services/api.js"
import { loadRates, convertAmount, FALLBACK_RATES } from "../services/currency.js"

const DEVISES=[{code:'KMF',flag:'🇰🇲',label:'Franc Comorien'},{code:'MGA',flag:'🇲🇬',label:'Ariary'},{code:'TZS',flag:'🇹🇿',label:'Shilling'},{code:'RWF',flag:'🇷🇼',label:'Franc Rwandais'},{code:'XOF',flag:'🇨🇮',label:'FCFA Ouest'},{code:'XAF',flag:'🇨🇬',label:'FCFA Central'},{code:'NGN',flag:'🇳🇬',label:'Naira'},{code:'USD',flag:'🇺🇸',label:'Dollar'},{code:'EUR',flag:'🇪🇺',label:'Euro'}]
const AMOUNTS=[2000,5000,10000,25000,50000,100000]
const PERIODS=[{v:'all',l:'Tout'},{v:'today',l:"Aujourd'hui"},{v:'week',l:'Semaine'},{v:'month',l:'Mois'}]
const fmtMoney=n=>Math.abs(n||0).toLocaleString()
const isMobile=()=>/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)||window.innerWidth<=600

// ── Helper partagé : charge les méthodes depuis l'API ──────────────────────
const METHOD_ICONS={mvola:'📲',cash:'💵',bank:'🏦',card:'💳',paypal:'💳',wave:'🌊',orange_money:'🟠',mpesa:'📱',stripe:'💳'}
const METHOD_SUBS={mvola:'USSD · Comores',cash:'Points de vente',bank:'IBAN / SWIFT',card:'Stripe',paypal:'PayPal',wave:'SN · CI',orange_money:'Mobile Money',mpesa:'Mobile Money',stripe:'Carte bancaire'}
const METHOD_PLACEHOLDER={mvola:'Numéro Mvola (ex: 3XX XX XX)',orange_money:'Numéro Orange Money',mpesa:'Numéro M-Pesa',wave:'Numéro Wave',bank:'IBAN complet',paypal:'Adresse email PayPal',cash:'Nom du déposant',stripe:'Email de confirmation'}

async function fetchPayMethods() {
  const API = import.meta.env.VITE_API_URL || ''
  const token = localStorage.getItem('waiichia_token')
  const headers = token ? { Authorization: 'Bearer ' + token } : {}
  try {
    // 1. Essai endpoint public (payments/methods)
    const r = await fetch(API + '/api/payments/methods', { headers })
    if (r.ok) {
      const d = await r.json()
      if (d.methods && d.methods.length > 0) {
        return d.methods.map(m => ({
          id: m.key, icon: METHOD_ICONS[m.key]||'💰', name: m.name||m.key,
          sub: METHOD_SUBS[m.key]||'', phone: m.phone||null,
          iban: m.iban||null, bank_name: m.bank_name||null, enabled: true,
        }))
      }
    }
    // 2. Fallback endpoint admin
    const r2 = await fetch(API + '/api/admin/payment-config', { headers })
    if (r2.ok) {
      const d2 = await r2.json()
      const cfg = d2.config || {}
      const methods = Object.entries(cfg)
        .filter(([,v]) => v && v.enabled)
        .map(([id,v]) => ({
          id, icon: METHOD_ICONS[id]||'💳', name: v.name||id,
          sub: METHOD_SUBS[id]||'', phone: v.phone||null,
          iban: v.iban||null, bank_name: v.bank_name||null, enabled: true,
        }))
      if (methods.length > 0) return methods
    }
  } catch (_) {}
  // 3. Fallback ultime
  return [
    {id:'mvola',icon:'📲',name:'Mvola',sub:'USSD · Comores',enabled:true},
    {id:'cash',icon:'💵',name:'Dépôt Cash',sub:'Points de vente',enabled:true},
  ]
}

export default function Wallet(){
  const {user}=useAuthStore()
  const {setPage}=usePageStore()
  const {devise}=useDeviseStore()
  const dc=devise?.code||'KMF'
  const [balance,setBalance]=useState(0)
  const [transactions,setTransactions]=useState([])
  const [loading,setLoading]=useState(true)
  const [activeDev,setActiveDev]=useState(dc)
  const [txPeriod,setTxPeriod]=useState('all')
  const [showRecharge,setShowRecharge]=useState(false)
  const [showTransfer,setShowTransfer]=useState(false)
  const [showWithdraw,setShowWithdraw]=useState(false)
  const [rates,setRates]=useState(FALLBACK_RATES)

  useEffect(()=>{
    Promise.all([
      api.payments.walletBalance().catch(()=>({balance:0})),
      api.payments.history().catch(()=>({})),
      loadRates().catch(()=>FALLBACK_RATES),
    ]).then(([w,h,r])=>{
      if(w.balance!==undefined)setBalance(w.balance)
      setTransactions(h.transactions||[])
      if(r&&Object.keys(r).length>0)setRates(r)
    }).finally(()=>setLoading(false))
  },[])

  const convertedBalance=activeDev==='KMF'?balance:convertAmount(balance,'KMF',activeDev,rates)
  const usdBalance=convertAmount(balance,'KMF','USD',rates)
  const eurBalance=convertAmount(balance,'KMF','EUR',rates)

  const filteredTx=transactions.filter(tx=>{
    if(txPeriod==='all')return true
    const d=new Date(tx.created_at), now=new Date()
    if(txPeriod==='today')return d.toDateString()===now.toDateString()
    if(txPeriod==='week'){const w=new Date(now-7*86400000);return d>=w}
    if(txPeriod==='month')return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear()
    return true
  })

  if(!user)return(<div style={{textAlign:'center',padding:60}}><div style={{fontSize:48,marginBottom:16}}>💰</div><h2 style={{fontFamily:'Syne,sans-serif'}}>Connectez-vous</h2><button className="btn btn-primary" onClick={()=>setPage('login')} style={{marginTop:16}}>Se connecter</button></div>)

  return(
    <div style={{paddingBottom:60}}>
      <div className="page-title">💰 Mon Portefeuille</div>

      <div className="wallet-card">
        <div style={{position:'relative',zIndex:1}}>
          <div className="wallet-devise">Solde disponible · {activeDev}</div>
          <div className="wallet-balance">{activeDev==='KMF'?fmtMoney(balance)+' KMF':(convertedBalance!==null?fmtMoney(convertedBalance)+' '+activeDev:'—')}</div>
          <div style={{fontSize:12,color:'var(--text2)'}}>
            {activeDev!=='KMF'&&<span>{fmtMoney(balance)} KMF · </span>}
            ≈ {usdBalance!==null?fmtMoney(usdBalance):'—'} USD · ≈ {eurBalance!==null?fmtMoney(eurBalance):'—'} EUR
          </div>
          <div style={{marginTop:14,display:'flex',gap:10,flexWrap:'wrap'}}>
            <button className="btn btn-primary btn-sm" onClick={()=>setShowRecharge(true)}>💳 Recharger</button>
            <button className="btn btn-secondary btn-sm" onClick={()=>setShowTransfer(true)}>↔ Transférer</button>
            <button className="btn btn-secondary btn-sm" onClick={()=>setShowWithdraw(true)}>🏦 Retirer</button>
          </div>
        </div>
      </div>

      <div className="card" style={{padding:16,marginBottom:18}}>
        <div className="label" style={{marginBottom:10}}>Ma devise principale</div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          {DEVISES.map(d=>(
            <div key={d.code} className={`pill-tab${activeDev===d.code?' active':''}`} onClick={()=>setActiveDev(d.code)} style={{display:'flex',alignItems:'center',gap:4}}>
              <span style={{fontSize:14}}>{d.flag}</span> {d.code}
            </div>
          ))}
        </div>
        {activeDev!=='KMF'&&<div style={{marginTop:10,fontSize:12,color:'var(--text3)',fontFamily:'Space Mono,monospace'}}>
          1 KMF = {convertAmount(1,'KMF',activeDev,rates)||'—'} {activeDev}
        </div>}
      </div>

      <div className="wallet-actions">
        {[
          {icon:'💳',label:'Recharger',action:()=>setShowRecharge(true)},
          {icon:'↔️',label:'Transférer',action:()=>setShowTransfer(true)},
          {icon:'🏦',label:'Retirer',action:()=>setShowWithdraw(true)},
        ].map(a=>(
          <div key={a.label} className="wallet-action-btn" onClick={a.action}><div className="wallet-action-icon">{a.icon}</div><div className="wallet-action-label">{a.label}</div></div>
        ))}
        <div className="wallet-action-btn" style={{opacity:.6}}>
          <div className="wallet-action-icon">📋</div>
          <div className="wallet-action-label" style={{fontSize:10}}>Réclamation</div>
        </div>
      </div>

      <div className="section-hdr"><div className="section-title">📊 Historique</div></div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16}}>
        {PERIODS.map(p=><div key={p.v} className={`pill-tab${txPeriod===p.v?' active':''}`} onClick={()=>setTxPeriod(p.v)}>{p.l}</div>)}
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {filteredTx.length===0&&<div style={{textAlign:'center',padding:40,color:'var(--text3)',background:'var(--card)',borderRadius:'var(--radius)',border:'1px solid var(--border)'}}>
          <div style={{fontSize:32,marginBottom:8}}>📊</div>
          <div style={{fontSize:13}}>Aucune transaction{txPeriod!=='all'?' pour cette période':''}</div>
        </div>}
        {filteredTx.map(tx=>{
          const isIncome=tx.type==='recharge'||(tx.recipient_id&&tx.recipient_id===user?.id)
          const icons={recharge:'💳',purchase:'🛒',transfer:'↔️',withdrawal:'🏦',rental:'⏳',ticket:'🎫',tip:'☕'}
          const colors={recharge:'rgba(44,198,83,.12)',purchase:'rgba(230,57,70,.12)',transfer:'rgba(77,159,255,.12)',withdrawal:'rgba(155,89,245,.12)',rental:'rgba(245,166,35,.12)',ticket:'rgba(245,166,35,.12)',tip:'rgba(44,198,83,.12)'}
          const txAmount=tx.amount||0
          const convertedAmt=activeDev!=='KMF'?convertAmount(txAmount,'KMF',activeDev,rates):null
          return(
            <div key={tx.id} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',padding:'12px 14px',display:'flex',alignItems:'center',gap:12}}>
              <div style={{width:38,height:38,borderRadius:10,background:colors[tx.type]||'var(--card2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>{icons[tx.type]||'📌'}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{tx.description||tx.type}</div>
                <div style={{fontSize:11,color:'var(--text3)'}}>{new Date(tx.created_at).toLocaleDateString('fr-FR')} · {tx.status==='pending'?'⏳ En attente':'✅'}</div>
              </div>
              <div style={{textAlign:'right',flexShrink:0}}>
                <div style={{fontSize:13,fontWeight:700,fontFamily:'Space Mono,monospace',color:isIncome?'var(--green)':'var(--red)'}}>{isIncome?'+':'-'}{fmtMoney(txAmount)} {tx.currency||'KMF'}</div>
                {convertedAmt!==null&&<div style={{fontSize:10,color:'var(--text3)',fontFamily:'Space Mono,monospace'}}>≈ {fmtMoney(convertedAmt)} {activeDev}</div>}
              </div>
            </div>
          )
        })}
      </div>

      {showRecharge&&<RechargeModal balance={balance} rates={rates} onClose={()=>setShowRecharge(false)} onSuccess={amt=>{setBalance(b=>b+amt);setShowRecharge(false)}} user={user}/>}
      {showTransfer&&<TransferModal balance={balance} onClose={()=>setShowTransfer(false)} onSuccess={()=>{api.payments.walletBalance().then(w=>setBalance(w.balance||0)).catch(()=>{});setShowTransfer(false)}}/>}
      {showWithdraw&&<WithdrawModal balance={balance} onClose={()=>setShowWithdraw(false)} onSuccess={()=>{api.payments.walletBalance().then(w=>setBalance(w.balance||0)).catch(()=>{});setShowWithdraw(false)}}/>}
    </div>
  )
}

/* ══ RECHARGE ══ */
function RechargeModal({balance,rates,onClose,onSuccess,user}){
  const [amount,setAmount]=useState(10000)
  const [custom,setCustom]=useState('')
  const [method,setMethod]=useState(null)
  const [step,setStep]=useState('choose')
  const [toast,setToast]=useState('')
  const [payMethods,setPayMethods]=useState([])
  const [loadingMethods,setLoadingMethods]=useState(true)
  const total=custom?parseInt(custom)||0:amount
  const mobile=isMobile()
  const showToast=m=>{setToast(m);setTimeout(()=>setToast(''),3000)}

  useEffect(()=>{
    fetchPayMethods().then(m=>setPayMethods(m)).finally(()=>setLoadingMethods(false))
  },[])

  const selectedMethod=payMethods.find(m=>m.id===method)
  const mvolaRef='WAI'+(user?.id||'').replace(/-/g,'').slice(0,12).toUpperCase()
  const mvolaUSSD='*444*1*2*4102122*'+total+'*'+mvolaRef+'#'
  const mvolaUSSDforQR='*444*1*2*4102122*'+total+'*'+mvolaRef+'%23'
  const qrUrl='https://api.qrserver.com/v1/create-qr-code/?size=200x200&data='+encodeURIComponent('tel:'+mvolaUSSDforQR)
  const cashCode='WA'+Math.random().toString(36).substr(2,6).toUpperCase()
  const bankRef='WAI-'+String(Date.now()).slice(-8)

  const confirmRecharge=async()=>{
    try{
      await api.payments.recharge({amount:total,gateway:method,phone:''})
      setStep('pending')
    }catch(e){showToast('⚠️ '+e.message)}
  }

  return(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:520}}>
        <div className="modal-hdr"><div className="modal-title">💳 Recharger</div><button className="modal-close" onClick={onClose}>✕</button></div>
        {toast&&<div style={{background:'var(--gold)',color:'#000',padding:'8px 16px',borderRadius:'var(--radius-sm)',fontSize:12,fontWeight:700,marginBottom:12,textAlign:'center'}}>{toast}</div>}

        {step==='pending'&&<div style={{textAlign:'center',padding:'30px 0'}}>
          <div style={{fontSize:52,marginBottom:12}}>⏳</div>
          <div style={{fontFamily:'Syne,sans-serif',fontSize:18,fontWeight:800,marginBottom:8}}>Recharge en attente</div>
          <div style={{fontSize:13,color:'var(--text2)',lineHeight:1.7,maxWidth:360,margin:'0 auto'}}>
            Votre paiement sera vérifié par notre équipe. Solde crédité dès confirmation.
          </div>
          <div style={{marginTop:16,padding:12,background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',fontFamily:'Space Mono,monospace',fontSize:14,fontWeight:700,color:'var(--gold)'}}>
            Réf : {method==='mvola'?mvolaRef:method==='cash'?cashCode:bankRef}
          </div>
          <button className="btn btn-primary" style={{marginTop:20}} onClick={onClose}>Compris ✓</button>
        </div>}

        {step==='choose'&&<>
          <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',padding:12,marginBottom:14,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div><div style={{fontSize:11,color:'var(--text3)'}}>Solde actuel</div><div style={{fontSize:16,fontWeight:700}}>{fmtMoney(balance)} KMF</div></div>
            <span style={{fontSize:24}}>💰</span>
          </div>

          <div style={{fontSize:12,fontWeight:700,color:'var(--text2)',marginBottom:8}}>Montant (KMF)</div>
          <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:10}}>
            {AMOUNTS.map(a=><button key={a} onClick={()=>{setAmount(a);setCustom('')}} className={`pill-tab${!custom&&amount===a?' active':''}`}>{a.toLocaleString()}</button>)}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}>
            <input className="input-field" type="number" placeholder="Montant libre" value={custom} onChange={e=>setCustom(e.target.value)} style={{flex:1}}/>
            <span style={{fontSize:12,fontWeight:700,color:'var(--text2)',fontFamily:'Space Mono,monospace'}}>KMF</span>
          </div>

          <div style={{fontSize:12,fontWeight:700,color:'var(--text2)',marginBottom:8}}>Mode de paiement</div>
          {loadingMethods
            ? <div style={{textAlign:'center',padding:20,color:'var(--text3)'}}>⏳ Chargement des modes de paiement…</div>
            : payMethods.length===0
              ? <div style={{textAlign:'center',padding:20,color:'var(--text3)',fontSize:13}}>⚠️ Aucun mode de paiement actif. Contactez l'administrateur.</div>
              : <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8,marginBottom:14}}>
                  {payMethods.map(m=>(
                    <div key={m.id} onClick={()=>m.enabled&&setMethod(m.id)} style={{padding:14,borderRadius:'var(--radius-sm)',border:'1px solid '+(method===m.id?'var(--gold)':'var(--border)'),background:method===m.id?'rgba(245,166,35,.08)':'var(--card)',cursor:m.enabled?'pointer':'not-allowed',opacity:m.enabled?1:.5,textAlign:'center',transition:'all .2s'}}>
                      <div style={{fontSize:24,marginBottom:4}}>{m.icon}</div>
                      <div style={{fontSize:12,fontWeight:700}}>{m.name}</div>
                      <div style={{fontSize:10,color:'var(--text3)'}}>{m.sub}</div>
                    </div>
                  ))}
                </div>
          }

          {method==='mvola'&&<div style={{background:'var(--card)',border:'1px solid rgba(155,89,245,.2)',borderRadius:'var(--radius-sm)',padding:16,marginBottom:14}}>
            <div style={{fontWeight:700,fontSize:14,marginBottom:12}}>📲 Paiement Mvola</div>
            {mobile?<>
              <div style={{fontSize:12,color:'var(--text2)',marginBottom:12,lineHeight:1.6}}>Cliquez sur le bouton, votre téléphone composera le code USSD. Entrez votre PIN Mvola pour valider.</div>
              <a href={`tel:${encodeURIComponent(mvolaUSSD)}`} style={{display:'block',width:'100%',padding:14,background:'linear-gradient(135deg,#9b59f5,#7d3cb5)',color:'#fff',borderRadius:'var(--radius-sm)',textAlign:'center',fontWeight:700,fontSize:15,textDecoration:'none',boxShadow:'0 4px 16px rgba(155,89,245,.4)'}}>
                📞 Composer — {total.toLocaleString()} KMF
              </a>
            </>:<>
              <div style={{fontSize:12,color:'var(--text2)',marginBottom:12,lineHeight:1.6}}>Scannez ce QR code avec votre téléphone :</div>
              <div style={{textAlign:'center',marginBottom:14}}>
                <img src={qrUrl} alt="QR Mvola" style={{width:200,height:200,borderRadius:12,border:'4px solid var(--border)'}}/>
              </div>
              <div style={{textAlign:'center',marginBottom:10}}>
                <button className="btn btn-secondary btn-sm" style={{fontSize:12}} onClick={()=>{navigator.clipboard?.writeText(mvolaUSSD);showToast('📋 Code USSD copié !')}}>📋 Copier le code USSD</button>
              </div>
              <div style={{fontSize:11,color:'var(--text3)',textAlign:'center'}}>⚠️ Compatible téléphone Comores Telecom uniquement</div>
            </>}
            <div style={{marginTop:10,fontSize:11,color:'var(--text3)'}}>Réf : <strong>{mvolaRef}</strong> ({mvolaRef.length} chars)</div>
          </div>}

          {method==='cash'&&<div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',padding:16,marginBottom:14}}>
            <div style={{fontWeight:700,fontSize:14,marginBottom:12}}>💵 Dépôt en espèces</div>
            <div style={{fontSize:12,color:'var(--text2)',marginBottom:12}}>Communiquez ce code au point de vente :</div>
            <div style={{background:'var(--bg)',border:'2px dashed var(--gold)',borderRadius:'var(--radius-sm)',padding:16,textAlign:'center',marginBottom:12}}>
              <div style={{fontFamily:'Space Mono,monospace',fontSize:22,fontWeight:700,color:'var(--gold)',letterSpacing:3}}>{cashCode}</div>
              <button className="btn btn-outline btn-sm" style={{marginTop:8}} onClick={()=>{navigator.clipboard?.writeText(cashCode);showToast('📋 Copié !')}}>📋 Copier</button>
            </div>
            <div style={{fontSize:11,color:'var(--text3)'}}>📍 Points de dépôt : Moroni, Mitsamihouli, Mutsamudu, Fomboni</div>
          </div>}

          {method==='bank'&&<div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',padding:16,marginBottom:14}}>
            <div style={{fontWeight:700,fontSize:14,marginBottom:12}}>🏦 Virement bancaire</div>
            {selectedMethod?.iban
              ? [['Banque',selectedMethod.bank_name||'Banque'],['IBAN',selectedMethod.iban],['Bénéficiaire','WAIICHIA']].map(([k,v])=>(
                  <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid var(--border)',fontSize:12}}><span style={{color:'var(--text3)'}}>{k}</span><span style={{fontFamily:'Space Mono,monospace'}}>{v}</span></div>
                ))
              : [['Banque','BIC Comores'],['IBAN','KM46 0000 1000 5001 0014 0602 68'],['BIC/SWIFT','BCICOMKM'],['Bénéficiaire','WAIICHIA SAS']].map(([k,v])=>(
                  <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid var(--border)',fontSize:12}}><span style={{color:'var(--text3)'}}>{k}</span><span style={{fontFamily:'Space Mono,monospace'}}>{v}</span></div>
                ))
            }
            <div style={{marginTop:12,background:'var(--bg)',border:'2px dashed var(--gold)',borderRadius:'var(--radius-sm)',padding:10,textAlign:'center'}}>
              <div style={{fontSize:10,color:'var(--text3)'}}>Référence obligatoire</div>
              <div style={{fontFamily:'Space Mono,monospace',fontSize:16,fontWeight:700,color:'var(--gold)',marginTop:4}}>{bankRef}</div>
            </div>
          </div>}

          {method&&<>
            <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',padding:14,marginBottom:14}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:6}}><span style={{color:'var(--text2)'}}>Montant</span><span style={{fontWeight:700}}>{total.toLocaleString()} KMF</span></div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:14,fontWeight:700,paddingTop:8,borderTop:'1px solid var(--border)'}}><span>Nouveau solde</span><span style={{color:'var(--green)'}}>{(balance+total).toLocaleString()} KMF</span></div>
            </div>
            <button className="btn btn-primary" style={{width:'100%',padding:14,fontSize:14}} onClick={confirmRecharge} disabled={!total}>
              ✅ Confirmer la recharge
            </button>
          </>}
        </>}
      </div>
    </div>
  )
}

/* ══ TRANSFERT ══ */
function TransferModal({balance,onClose,onSuccess}){
  const [dest,setDest]=useState('')
  const [amount,setAmount]=useState('')
  const [msg,setMsg]=useState('')
  const [loading,setLoading]=useState(false)
  const [done,setDone]=useState(false)
  const [err,setErr]=useState('')
  const amt=parseInt(amount)||0

  const doTransfer=async()=>{
    if(!dest)return setErr('Destinataire requis')
    if(!amt||amt<100)return setErr('Montant minimum 100 KMF')
    if(amt>balance)return setErr('Solde insuffisant')
    setLoading(true);setErr('')
    try{
      await api.payments.transfer({to_username:dest.replace('@',''),amount:amt,message:msg})
      setDone(true)
    }catch(e){setErr(e.message||'Erreur')}
    setLoading(false)
  }

  if(done)return(
    <div className="modal-overlay" onClick={()=>{onSuccess();onClose()}}><div className="modal" style={{maxWidth:420,textAlign:'center',padding:30}} onClick={e=>e.stopPropagation()}>
      <div style={{fontSize:52,marginBottom:12}}>✅</div>
      <div style={{fontFamily:'Syne,sans-serif',fontSize:18,fontWeight:800,marginBottom:6}}>Transfert envoyé !</div>
      <div style={{fontSize:13,color:'var(--text2)'}}>{amt.toLocaleString()} KMF envoyés à @{dest.replace('@','')}</div>
      <button className="btn btn-primary" style={{marginTop:20}} onClick={()=>{onSuccess();onClose()}}>Fermer</button>
    </div></div>
  )

  return(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{maxWidth:420}} onClick={e=>e.stopPropagation()}>
        <div className="modal-hdr"><div className="modal-title">↔️ Transfert</div><button className="modal-close" onClick={onClose}>✕</button></div>
        {err&&<div style={{background:'rgba(230,57,70,.1)',border:'1px solid rgba(230,57,70,.3)',borderRadius:'var(--radius-sm)',padding:10,marginBottom:12,fontSize:12,color:'var(--red)'}}>⚠️ {err}</div>}
        <div className="form-group"><label className="label">Destinataire (@username)</label><input className="input-field" value={dest} onChange={e=>setDest(e.target.value)} placeholder="@username"/></div>
        <div className="form-group"><label className="label">Montant (KMF)</label><input className="input-field" type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="Min: 100 KMF"/></div>
        <div className="form-group"><label className="label">Message (optionnel)</label><input className="input-field" value={msg} onChange={e=>setMsg(e.target.value)} placeholder="Ex: Paiement featuring..."/></div>
        <div style={{background:amt>balance?'rgba(230,57,70,.06)':'rgba(44,198,83,.06)',border:`1px solid ${amt>balance?'rgba(230,57,70,.2)':'rgba(44,198,83,.2)'}`,borderRadius:'var(--radius-sm)',padding:12,marginBottom:16,display:'flex',justifyContent:'space-between',fontSize:13}}>
          <span style={{color:'var(--text2)'}}>Après transfert</span>
          <span style={{fontWeight:700,color:amt>balance?'var(--red)':'var(--green)'}}>{(balance-amt).toLocaleString()} KMF</span>
        </div>
        <div style={{display:'flex',gap:10}}>
          <button className="btn btn-secondary" onClick={onClose} style={{flex:1}}>Annuler</button>
          <button className="btn btn-primary" style={{flex:2}} onClick={doTransfer} disabled={loading||amt>balance}>{loading?'⏳...':'↔ Transférer'+(amt?' '+amt.toLocaleString()+' KMF':'')}</button>
        </div>
        <div style={{textAlign:'center',fontSize:10,color:'var(--text3)',marginTop:8}}>Commission : 1% · Minimum : 100 KMF</div>
      </div>
    </div>
  )
}

/* ══ RETRAIT — méthodes dynamiques depuis l'API (identiques à la recharge) ══ */
function WithdrawModal({balance,onClose,onSuccess}){
  const [withdrawMethods,setWithdrawMethods]=useState([])
  const [loadingMethods,setLoadingMethods]=useState(true)
  const [method,setMethod]=useState(null)
  const [amount,setAmount]=useState('')
  const [destination,setDestination]=useState('')
  const [loading,setLoading]=useState(false)
  const [done,setDone]=useState(false)
  const [err,setErr]=useState('')
  const amt=parseInt(amount)||0
  const fee=Math.floor(amt*0.025)
  const net=amt-fee
  const selectedMethod=withdrawMethods.find(m=>m.id===method)

  useEffect(()=>{
    fetchPayMethods()
      .then(m=>setWithdrawMethods(m.filter(m=>m.id!=='cash'))) // cash = dépôt uniquement
      .finally(()=>setLoadingMethods(false))
  },[])

  const doWithdraw=async()=>{
    if(!method)return setErr('Choisissez un mode de retrait')
    if(!amt||amt<500)return setErr('Montant minimum 500 KMF')
    if(amt>balance)return setErr('Solde insuffisant')
    if(!destination)return setErr('Destination requise')
    setLoading(true);setErr('')
    try{
      await api.payments.withdraw({amount:amt,method,destination,notes:''})
      setDone(true)
    }catch(e){setErr(e.message||'Erreur')}
    setLoading(false)
  }

  if(done)return(
    <div className="modal-overlay" onClick={()=>{onSuccess();onClose()}}><div className="modal" style={{maxWidth:420,textAlign:'center',padding:30}} onClick={e=>e.stopPropagation()}>
      <div style={{fontSize:52,marginBottom:12}}>✅</div>
      <div style={{fontFamily:'Syne,sans-serif',fontSize:18,fontWeight:800,marginBottom:6}}>Demande de retrait envoyée</div>
      <div style={{fontSize:13,color:'var(--text2)',lineHeight:1.6}}>
        {net.toLocaleString()} KMF seront envoyés via {selectedMethod?.name||method}.<br/>
        Traitement sous 24-48h par notre équipe.
      </div>
      <button className="btn btn-primary" style={{marginTop:20}} onClick={()=>{onSuccess();onClose()}}>Compris ✓</button>
    </div></div>
  )

  return(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{maxWidth:480}} onClick={e=>e.stopPropagation()}>
        <div className="modal-hdr"><div className="modal-title">🏦 Retirer des fonds</div><button className="modal-close" onClick={onClose}>✕</button></div>
        {err&&<div style={{background:'rgba(230,57,70,.1)',border:'1px solid rgba(230,57,70,.3)',borderRadius:'var(--radius-sm)',padding:10,marginBottom:12,fontSize:12,color:'var(--red)'}}>⚠️ {err}</div>}

        <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',padding:12,marginBottom:14,display:'flex',justifyContent:'space-between'}}>
          <div><div style={{fontSize:11,color:'var(--text3)'}}>Solde disponible</div><div style={{fontSize:16,fontWeight:700}}>{fmtMoney(balance)} KMF</div></div>
          <span style={{fontSize:24}}>💰</span>
        </div>

        <div style={{fontSize:12,fontWeight:700,color:'var(--text2)',marginBottom:8}}>Mode de retrait</div>
        {loadingMethods
          ? <div style={{textAlign:'center',padding:20,color:'var(--text3)'}}>⏳ Chargement des modes de retrait…</div>
          : withdrawMethods.length===0
            ? <div style={{textAlign:'center',padding:20,color:'var(--text3)',fontSize:13}}>⚠️ Aucun mode de retrait actif. Contactez l'administrateur.</div>
            : <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6,marginBottom:14}}>
                {withdrawMethods.map(m=>(
                  <div key={m.id} onClick={()=>setMethod(m.id)} style={{padding:10,borderRadius:'var(--radius-sm)',border:'1px solid '+(method===m.id?'var(--gold)':'var(--border)'),background:method===m.id?'rgba(245,166,35,.08)':'var(--card)',cursor:'pointer',textAlign:'center',transition:'all .2s'}}>
                    <div style={{fontSize:20,marginBottom:2}}>{m.icon}</div>
                    <div style={{fontSize:10,fontWeight:700}}>{m.name}</div>
                  </div>
                ))}
              </div>
        }

        <div className="form-group"><label className="label">Montant (KMF) — minimum 500</label><input className="input-field" type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="Ex: 10000"/></div>
        {method&&<div className="form-group">
          <label className="label">Destination ({selectedMethod?.name||method})</label>
          <input className="input-field" value={destination} onChange={e=>setDestination(e.target.value)} placeholder={METHOD_PLACEHOLDER[method]||'Numéro ou adresse'}/>
        </div>}

        {amt>=500&&<div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',padding:14,marginBottom:14}}>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:6}}><span style={{color:'var(--text2)'}}>Montant</span><span>{amt.toLocaleString()} KMF</span></div>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:6}}><span style={{color:'var(--text2)'}}>Commission (2.5%)</span><span style={{color:'var(--red)'}}>{fee.toLocaleString()} KMF</span></div>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:14,fontWeight:700,paddingTop:8,borderTop:'1px solid var(--border)'}}><span>Vous recevrez</span><span style={{color:'var(--green)'}}>{net.toLocaleString()} KMF</span></div>
        </div>}

        <div style={{display:'flex',gap:10}}>
          <button className="btn btn-secondary" onClick={onClose} style={{flex:1}}>Annuler</button>
          <button className="btn btn-primary" style={{flex:2}} onClick={doWithdraw} disabled={loading||amt>balance||!method}>{loading?'⏳...':'🏦 Demander le retrait'}</button>
        </div>
        <div style={{textAlign:'center',fontSize:10,color:'var(--text3)',marginTop:8}}>Traitement sous 24-48h · Commission 2.5%</div>
      </div>
    </div>
  )
}
