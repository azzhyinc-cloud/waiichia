import { useState, useEffect } from "react"
import { useAuthStore, usePageStore, useDeviseStore } from "../stores/index.js"
import api from "../services/api.js"

const DEVISES=[{code:'KMF',flag:'🇰🇲',label:'Franc Comorien'},{code:'MGA',flag:'🇲🇬',label:'Ariary'},{code:'TZS',flag:'🇹🇿',label:'Shilling'},{code:'RWF',flag:'🇷🇼',label:'Franc Rwandais'},{code:'XOF',flag:'🇨🇮',label:'FCFA Ouest'},{code:'XAF',flag:'🇨🇩',label:'FCFA Central'},{code:'NGN',flag:'🇳🇬',label:'Naira'},{code:'USD',flag:'🇺🇸',label:'Dollar'},{code:'EUR',flag:'🇪🇺',label:'Euro'}]
const AMOUNTS=[2000,5000,10000,25000,50000,100000]
const PERIODS=['Aujourd\'hui','Semaine','Mois','Année']
const TX_TYPES=[{v:'',l:'Tous types'},{v:'income',l:'Recettes'},{v:'expense',l:'Dépenses'},{v:'transfer',l:'Transferts'},{v:'withdraw',l:'Retraits'}]
const MOCK_TX=[
  {id:'tx1',type:'income',title:'Vente — Twarab ya Komori',sub:'Achat par @wallyafro',amount:2500,currency:'KMF',time:'Aujourd\'hui 14:32'},
  {id:'tx2',type:'income',title:'Location — Moroni by Night',sub:'7 jours par @fatima_k',amount:800,currency:'KMF',time:'Aujourd\'hui 11:20'},
  {id:'tx3',type:'expense',title:'Achat — Afrika Rising',sub:'Wally Afro',amount:-2000,currency:'KMF',time:'Hier 18:45'},
  {id:'tx4',type:'income',title:'Tips — Radio Live',sub:'5 tips reçus',amount:4500,currency:'KMF',time:'Hier 20:10'},
  {id:'tx5',type:'transfer',title:'Transfert vers @djchami',sub:'Paiement featuring',amount:-5000,currency:'KMF',time:'12 Mar 09:30'},
  {id:'tx6',type:'withdraw',title:'Retrait — Mvola',sub:'Vers +269 321 XXXX',amount:-15000,currency:'KMF',time:'10 Mar 16:00'},
]
const fmtMoney=n=>Math.abs(n).toLocaleString()
const isMobile=()=>/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)||window.innerWidth<=600

export default function Wallet(){
  const {user}=useAuthStore()
  const {setPage}=usePageStore()
  const {devise}=useDeviseStore()
  const dc=devise?.code||'KMF'
  const [balance,setBalance]=useState(0)
  const [transactions,setTransactions]=useState([])
  const [loading,setLoading]=useState(true)
  const [activeDev,setActiveDev]=useState(dc)
  const [txFilter,setTxFilter]=useState('')
  const [txPeriod,setTxPeriod]=useState('Aujourd\'hui')
  const [showRecharge,setShowRecharge]=useState(false)
  const [showTransfer,setShowTransfer]=useState(false)

  useEffect(()=>{
    Promise.all([
      api.payments.walletBalance().catch(()=>({balance:0})),
      api.payments.history().catch(()=>({transactions:[]})),
    ]).then(([w,h])=>{
      if(w.balance)setBalance(w.balance)
      setTransactions(h.transactions?.length?h.transactions:MOCK_TX)
    }).finally(()=>setLoading(false))
  },[])

  if(!user)return(<div style={{textAlign:'center',padding:60}}><div style={{fontSize:48,marginBottom:16}}>💰</div><h2 style={{fontFamily:'Syne,sans-serif'}}>Connectez-vous</h2><button className="btn btn-primary" onClick={()=>setPage('login')} style={{marginTop:16}}>Se connecter</button></div>)

  return(
    <div style={{paddingBottom:60}}>
      <div className="page-title">💰 Mon Portefeuille</div>

      {/* WALLET CARD */}
      <div className="wallet-card">
        <div style={{position:'relative',zIndex:1}}>
          <div className="wallet-devise">Solde disponible · {activeDev}</div>
          <div className="wallet-balance">{fmtMoney(balance)} {activeDev}</div>
          <div style={{fontSize:12,color:'var(--text2)'}}>≈ {Math.round(balance/490)} USD · ≈ {Math.round(balance/530)} EUR</div>
          <div style={{marginTop:14,display:'flex',gap:10,flexWrap:'wrap'}}>
            <button className="btn btn-primary btn-sm" onClick={()=>setShowRecharge(true)}>💳 Recharger</button>
            <button className="btn btn-secondary btn-sm" onClick={()=>setShowTransfer(true)}>↔ Transférer</button>
            <button className="btn btn-outline btn-sm">📋 Réclamation</button>
          </div>
        </div>
      </div>

      {/* DEVISE */}
      <div className="card" style={{padding:16,marginBottom:18}}>
        <div className="label" style={{marginBottom:10}}>Ma devise principale</div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          {DEVISES.map(d=><div key={d.code} className={`pill-tab${activeDev===d.code?' active':''}`} onClick={()=>setActiveDev(d.code)}>{d.flag} {d.code}</div>)}
        </div>
      </div>

      {/* ACTIONS */}
      <div className="wallet-actions">
        {[{icon:'💳',label:'Recharger',action:()=>setShowRecharge(true)},{icon:'↔️',label:'Transférer',action:()=>setShowTransfer(true)},{icon:'🏦',label:'Retirer',action:()=>{}},{icon:'📋',label:'Réclamation',action:()=>{}}].map(a=>(
          <div key={a.label} className="wallet-action-btn" onClick={a.action}><div className="wallet-action-icon">{a.icon}</div><div className="wallet-action-label">{a.label}</div></div>
        ))}
      </div>

      {/* HISTORIQUE */}
      <div className="section-hdr"><div className="section-title">📊 Historique</div></div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16}}>
        {PERIODS.map(p=><div key={p} className={`pill-tab${txPeriod===p?' active':''}`} onClick={()=>setTxPeriod(p)}>{p}</div>)}
        <select className="select-styled" value={txFilter} onChange={e=>setTxFilter(e.target.value)}>{TX_TYPES.map(t=><option key={t.v} value={t.v}>{t.l}</option>)}</select>
      </div>
      <div className="transactions-list">
        {transactions.map(tx=>{
          const isPos=(tx.amount||0)>=0||tx.type==='income'
          const icons={income:'💰',expense:'🛒',transfer:'↔️',withdraw:'🏦'}
          const colors={income:'rgba(44,198,83,.12)',expense:'rgba(230,57,70,.12)',transfer:'rgba(77,159,255,.12)',withdraw:'rgba(155,89,245,.12)'}
          return(<div key={tx.id} className="transaction-item"><div className="tx-icon" style={{background:colors[tx.type]||'var(--card2)'}}>{icons[tx.type]||'📌'}</div><div className="tx-info"><div className="tx-title">{tx.title}</div><div className="tx-sub">{tx.sub} · {tx.time}</div></div><div className={`tx-amount ${isPos?'tx-positive':'tx-negative'}`}>{isPos?'+':''}{fmtMoney(tx.amount)} {tx.currency||dc}</div></div>)
        })}
      </div>

      {showRecharge&&<RechargeModal balance={balance} dc={activeDev} onClose={()=>setShowRecharge(false)} onSuccess={amt=>{setBalance(b=>b+amt);setShowRecharge(false)}}/>}
      {showTransfer&&<TransferModal balance={balance} dc={activeDev} onClose={()=>setShowTransfer(false)}/>}
    </div>
  )
}

/* ══════════════════════════════════════════════════
   MODALE RECHARGE — Système de paiement complet
   Mvola USSD / Dépôt Cash / Virement / Carte
══════════════════════════════════════════════════ */
function RechargeModal({balance,dc,onClose,onSuccess}){
  const [amount,setAmount]=useState(10000)
  const [custom,setCustom]=useState('')
  const [method,setMethod]=useState(null)
  const [step,setStep]=useState('choose')
  const [toast,setToast]=useState('')
  const total=custom?parseInt(custom)||0:amount
  const mobile=isMobile()
  const showToast=m=>{setToast(m);setTimeout(()=>setToast(''),3000)}

  // Code USSD Mvola dynamique
  const mvolaUSSD=`*444*1*2*4102122*${total}*Recharge Waiichia#`
  const mvolaRef='WAI-'+Date.now().toString(36).toUpperCase()

  // Code dépôt cash unique
  const cashCode='WA-2026-CASH-'+Math.random().toString(36).substr(2,6).toUpperCase()

  // Référence virement
  const bankRef='WAI-2026-'+String(Date.now()).slice(-8)

  // Méthodes activées (à terme : configurable par admin)
  const METHODS=[
    {id:'mvola',icon:'📲',name:'Mvola',sub:'USSD · Comores',enabled:true,mobileOnly:true},
    {id:'cash',icon:'💵',name:'Dépôt Cash',sub:'Points de vente',enabled:true,mobileOnly:false},
    {id:'bank',icon:'🏦',name:'Virement bancaire',sub:'IBAN / SWIFT',enabled:true,mobileOnly:false},
    {id:'card',icon:'💳',name:'Carte / PayPal',sub:'Visa/MC/PayPal',enabled:true,mobileOnly:false},
  ].filter(m=>m.enabled&&(!m.mobileOnly||mobile))

  const confirmRecharge=async()=>{
    try{
      await api.payments.recharge({amount:total,method:method,reference:method==='mvola'?mvolaRef:method==='cash'?cashCode:bankRef})
      if(method==='mvola'||method==='cash'||method==='bank'){
        setStep('pending')
      } else {
        onSuccess(total)
        showToast('✅ Recharge confirmée !')
      }
    }catch(e){
      showToast('⚠️ '+e.message)
    }
  }

  return(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal pay-modal" onClick={e=>e.stopPropagation()} style={{maxWidth:520}}>
        <div className="modal-hdr"><div className="modal-title">💳 Recharger le Portefeuille</div><button className="modal-close" onClick={onClose}>✕</button></div>

        {toast&&<div style={{background:'var(--gold)',color:'#000',padding:'8px 16px',borderRadius:'var(--radius-sm)',fontSize:12,fontWeight:700,marginBottom:12,textAlign:'center'}}>{toast}</div>}

        {/* STEP : PENDING (en attente de validation) */}
        {step==='pending'&&<div style={{textAlign:'center',padding:'30px 0'}}>
          <div style={{fontSize:52,marginBottom:12}}>⏳</div>
          <div style={{fontFamily:'Syne,sans-serif',fontSize:18,fontWeight:800,marginBottom:8}}>Recharge en attente</div>
          <div style={{fontSize:13,color:'var(--text2)',lineHeight:1.7,maxWidth:360,margin:'0 auto'}}>
            {method==='mvola'&&'Votre paiement Mvola sera vérifié par notre équipe. Votre solde sera crédité dès confirmation (sous 5 minutes).'}
            {method==='cash'&&'Présentez votre code de dépôt au point de vente. Votre solde sera crédité après validation par le concessionnaire (sous 2h).'}
            {method==='bank'&&'Effectuez le virement avec la référence indiquée. Traitement sous 1 à 3 jours ouvrables.'}
          </div>
          <div style={{marginTop:16,padding:12,background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',fontFamily:'Space Mono,monospace',fontSize:14,fontWeight:700,color:'var(--gold)'}}>
            Référence : {method==='mvola'?mvolaRef:method==='cash'?cashCode:bankRef}
          </div>
          <button className="btn btn-primary" style={{marginTop:20}} onClick={onClose}>Compris ✓</button>
        </div>}

        {/* STEP : CHOOSE (choix montant + méthode) */}
        {step==='choose'&&<>
          {/* Solde actuel */}
          <div className="pay-balance-bar"><div><div className="pay-balance-label">Solde actuel</div><div className="pay-balance-val">{balance.toLocaleString()} {dc}</div></div><div style={{fontSize:28}}>💰</div></div>

          {/* Montant */}
          <div className="pay-section-label">Montant à recharger</div>
          <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:10}}>
            {AMOUNTS.map(a=><button key={a} onClick={()=>{setAmount(a);setCustom('')}} className={`pill-tab${!custom&&amount===a?' active':''}`}>{a.toLocaleString()}</button>)}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}>
            <input className="input-field" type="number" placeholder="Montant libre" value={custom} onChange={e=>setCustom(e.target.value)} style={{flex:1}}/>
            <span style={{fontSize:12,fontWeight:700,color:'var(--text2)',fontFamily:'Space Mono,monospace'}}>{dc}</span>
          </div>

          {/* Méthodes de paiement */}
          <div className="pay-section-label">Mode de paiement</div>
          <div className="pay-methods-grid">
            {METHODS.map(m=>(
              <div key={m.id} className={`pay-method-card${method===m.id?' sel':''}`} onClick={()=>setMethod(m.id)}>
                {m.mobileOnly&&<div style={{position:'absolute',top:4,right:4,fontSize:8,background:'rgba(44,198,83,.15)',color:'var(--green)',padding:'1px 5px',borderRadius:8,fontFamily:'Space Mono,monospace'}}>📱</div>}
                <div className="pay-method-icon">{m.icon}</div>
                <div className="pay-method-name">{m.name}</div>
                <div className="pay-method-sub">{m.sub}</div>
              </div>
            ))}
          </div>

          {/* ── PANEL MVOLA ── */}
          {method==='mvola'&&<div style={{background:'var(--card)',border:'1px solid rgba(155,89,245,.2)',borderRadius:'var(--radius-sm)',padding:16,marginBottom:14}}>
            <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:14,marginBottom:14}}>📲 Paiement Mvola</div>
            {mobile?<>
              {/* SUR MOBILE : Ouvre le clavier téléphone */}
              <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:14}}>
                {['Cliquez sur le bouton ci-dessous','Votre téléphone composera le code USSD automatiquement','Entrez votre code PIN Mvola pour valider','Votre solde sera crédité après vérification'].map((t,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'flex-start',gap:10,fontSize:12,color:'var(--text2)'}}><span style={{width:20,height:20,borderRadius:'50%',background:'rgba(155,89,245,.2)',color:'var(--purple)',fontSize:10,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{i+1}</span>{t}</div>
                ))}
              </div>
              <a href={`tel:${encodeURIComponent(mvolaUSSD)}`} style={{display:'block',width:'100%',padding:14,background:'linear-gradient(135deg,#9b59f5,#7d3cb5)',color:'#fff',borderRadius:'var(--radius-sm)',textAlign:'center',fontWeight:700,fontSize:15,textDecoration:'none',boxShadow:'0 4px 16px rgba(155,89,245,.4)'}}>
                📞 Composer le code USSD — {total.toLocaleString()} {dc}
              </a>
              <div style={{marginTop:10,fontSize:10,color:'var(--text3)',textAlign:'center'}}>Numéro marchand Waiichia : +269 4102122</div>
            </>:<>
              {/* SUR DESKTOP : Affiche les instructions */}
              <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:14}}>
                {['Composez le code USSD ci-dessous sur votre téléphone Comores Telecom','Entrez votre code PIN Mvola quand demandé','Confirmez la transaction — solde crédité après vérification'].map((t,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'flex-start',gap:10,fontSize:12,color:'var(--text2)'}}><span style={{width:20,height:20,borderRadius:'50%',background:'rgba(155,89,245,.2)',color:'var(--purple)',fontSize:10,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{i+1}</span>{t}</div>
                ))}
              </div>
              <div style={{background:'var(--bg)',border:'1px solid var(--border2)',borderRadius:'var(--radius-sm)',padding:14,textAlign:'center',marginBottom:12}}>
                <div style={{fontSize:10,color:'var(--text3)',fontFamily:'Space Mono,monospace',marginBottom:6}}>CODE USSD À COMPOSER SUR VOTRE TÉLÉPHONE</div>
                <div style={{fontFamily:'Space Mono,monospace',fontSize:20,fontWeight:700,color:'var(--purple)',letterSpacing:2}}>{mvolaUSSD}</div>
                <button className="btn btn-outline btn-sm" style={{marginTop:10}} onClick={()=>{navigator.clipboard?.writeText(mvolaUSSD);showToast('📋 Code copié !')}}>📋 Copier le code</button>
              </div>
              <div style={{fontSize:11,color:'var(--text3)',textAlign:'center'}}>⚠️ Le paiement Mvola ne fonctionne que depuis un téléphone Comores Telecom</div>
            </>}
            <div style={{marginTop:12,fontSize:11,color:'var(--text3)'}}>Réf. transaction : <strong>{mvolaRef}</strong></div>
          </div>}

          {/* ── PANEL DÉPÔT CASH ── */}
          {method==='cash'&&<div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',padding:16,marginBottom:14}}>
            <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:14,marginBottom:12}}>💵 Dépôt en espèces</div>
            <div style={{fontSize:12,color:'var(--text2)',marginBottom:14,lineHeight:1.6}}>Déposez votre argent dans l'un de nos points agréés et communiquez le code ci-dessous. Le concessionnaire validera le dépôt et votre solde sera crédité.</div>
            <div style={{background:'var(--bg)',border:'2px dashed var(--gold)',borderRadius:'var(--radius-sm)',padding:16,textAlign:'center',marginBottom:14}}>
              <div style={{fontSize:10,color:'var(--text3)'}}>Votre code de dépôt unique</div>
              <div style={{fontFamily:'Space Mono,monospace',fontSize:22,fontWeight:700,color:'var(--gold)',marginTop:6,letterSpacing:3}}>{cashCode}</div>
              <button className="btn btn-outline btn-sm" style={{marginTop:10}} onClick={()=>{navigator.clipboard?.writeText(cashCode);showToast('📋 Code copié !')}}>📋 Copier le code</button>
            </div>
            <div style={{fontSize:12,fontWeight:700,marginBottom:8}}>📍 Points de dépôt — Comores</div>
            {['📍 Moroni Centre · Marché Volo Volo · Lun–Sam 8h–18h','📍 Mitsamihouli · Boutique Waiichia · Lun–Sam 9h–17h','📍 Mutsamudu · Anjouan Store · Lun–Ven 9h–17h','📍 Fomboni · Mohéli Center · Lun–Sam 8h–17h'].map(p=><div key={p} style={{fontSize:11.5,color:'var(--text2)',padding:'5px 0',borderBottom:'1px solid var(--border)'}}>{p}</div>)}
            <div style={{marginTop:12,background:'rgba(245,166,35,.06)',border:'1px solid rgba(245,166,35,.2)',borderRadius:'var(--radius-sm)',padding:10,fontSize:11,color:'var(--text2)'}}>
              ⏳ Crédit sous 2h max après dépôt et validation par le concessionnaire.<br/>
              💰 Le concessionnaire reçoit une commission automatique à la fin du mois.
            </div>
          </div>}

          {/* ── PANEL VIREMENT ── */}
          {method==='bank'&&<div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',padding:16,marginBottom:14}}>
            <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:14,marginBottom:14}}>🏦 Virement bancaire</div>
            {[['Banque','BIC — Banque pour le Commerce et l\'Industrie des Comores'],['IBAN','KM46 0000 1000 5001 0014 0602 68'],['BIC/SWIFT','BCICOMKM'],['Bénéficiaire','WAIICHIA SAS']].map(([k,v])=>(
              <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--border)',fontSize:12}}>
                <span style={{color:'var(--text3)',fontWeight:600}}>{k}</span>
                <span style={{fontFamily:'Space Mono,monospace',color:'var(--text)'}}>{v}</span>
              </div>
            ))}
            <div style={{marginTop:14,background:'var(--bg)',border:'2px dashed var(--gold)',borderRadius:'var(--radius-sm)',padding:12,textAlign:'center'}}>
              <div style={{fontSize:10,color:'var(--text3)'}}>Référence obligatoire à indiquer</div>
              <div style={{fontFamily:'Space Mono,monospace',fontSize:16,fontWeight:700,color:'var(--gold)',marginTop:4}}>{bankRef}</div>
              <button className="btn btn-outline btn-sm" style={{marginTop:8}} onClick={()=>{navigator.clipboard?.writeText(bankRef);showToast('📋 Référence copiée !')}}>📋 Copier</button>
            </div>
            <div style={{marginTop:12,fontSize:11,color:'var(--text3)'}}>⏳ Délai de traitement : 1 à 3 jours ouvrables. Solde crédité dès réception.</div>
          </div>}

          {/* ── PANEL CARTE / PAYPAL ── */}
          {method==='card'&&<div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',padding:16,marginBottom:14}}>
            <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:14,marginBottom:14}}>💳 Carte bancaire / PayPal</div>
            <div style={{background:'rgba(245,166,35,.06)',border:'1px solid rgba(245,166,35,.2)',borderRadius:'var(--radius-sm)',padding:14,textAlign:'center',marginBottom:14}}>
              <div style={{fontSize:24,marginBottom:8}}>🔧</div>
              <div style={{fontSize:13,fontWeight:700,color:'var(--gold)',marginBottom:4}}>Bientôt disponible</div>
              <div style={{fontSize:12,color:'var(--text2)',lineHeight:1.6}}>Le paiement par carte bancaire (Stripe) et PayPal sera activé très prochainement. En attendant, utilisez Mvola, le dépôt cash ou le virement bancaire.</div>
            </div>
            <div style={{display:'flex',gap:12,justifyContent:'center',opacity:.4}}>
              <span style={{fontFamily:'Space Mono,monospace',fontWeight:700,fontSize:12}}>VISA</span>
              <span style={{fontFamily:'Space Mono,monospace',fontWeight:700,fontSize:12}}>MASTERCARD</span>
              <span style={{fontFamily:'Space Mono,monospace',fontWeight:700,fontSize:12}}>PAYPAL</span>
            </div>
          </div>}

          {/* Résumé */}
          {method&&<div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',padding:14,marginBottom:14}}>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:8}}><span style={{color:'var(--text2)'}}>Montant</span><span style={{fontWeight:700}}>{total.toLocaleString()} {dc}</span></div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:8}}><span style={{color:'var(--text2)'}}>Mode</span><span style={{fontWeight:700}}>{METHODS.find(m=>m.id===method)?.icon} {METHODS.find(m=>m.id===method)?.name}</span></div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:14,fontWeight:700,paddingTop:8,borderTop:'1px solid var(--border)'}}><span>Nouveau solde estimé</span><span style={{color:'var(--green)'}}>{(balance+total).toLocaleString()} {dc}</span></div>
          </div>}

          {method&&method!=='card'&&<button className="btn btn-primary" style={{width:'100%',padding:14,fontSize:14}} onClick={confirmRecharge} disabled={!total}>
            {method==='mvola'?(mobile?'📞 J\'ai composé le code USSD':'📲 J\'ai effectué le paiement Mvola')
            :method==='cash'?'💵 J\'ai noté mon code de dépôt'
            :method==='bank'?'🏦 J\'ai effectué le virement'
            :'✅ Valider'}
          </button>}

          <div style={{textAlign:'center',fontSize:11,color:'var(--text3)',marginTop:10}}>🔒 Données chiffrées · Validées par modérateur/admin</div>
        </>}
      </div>
    </div>
  )
}

/* ══ MODALE TRANSFERT ══ */
function TransferModal({balance,dc,onClose}){
  const [dest,setDest]=useState('')
  const [amount,setAmount]=useState('')
  const [msg,setMsg]=useState('')
  const [loading,setLoading]=useState(false)
  const [done,setDone]=useState(false)
  const [err,setErr]=useState('')
  const amt=parseInt(amount)||0

  const doTransfer=async()=>{
    if(!dest)return setErr('Destinataire requis')
    if(!amt||amt<=0)return setErr('Montant invalide')
    if(amt>balance)return setErr('Solde insuffisant')
    setLoading(true);setErr('')
    try{
      await api.payments.transfer({to:dest,amount:amt,message:msg})
      setDone(true)
    }catch(e){setErr(e.message||'Erreur')}
    setLoading(false)
  }

  if(done)return(
    <div className="modal-overlay" onClick={onClose}><div className="modal" style={{maxWidth:420,textAlign:'center',padding:30}} onClick={e=>e.stopPropagation()}>
      <div style={{fontSize:52,marginBottom:12}}>✅</div>
      <div style={{fontFamily:'Syne,sans-serif',fontSize:18,fontWeight:800,marginBottom:6}}>Transfert envoyé !</div>
      <div style={{fontSize:13,color:'var(--text2)'}}>{amt.toLocaleString()} {dc} envoyés à {dest}</div>
      <button className="btn btn-primary" style={{marginTop:20}} onClick={onClose}>Fermer</button>
    </div></div>
  )

  return(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{maxWidth:420}} onClick={e=>e.stopPropagation()}>
        <div className="modal-hdr"><div className="modal-title">↔️ Transfert de fonds</div><button className="modal-close" onClick={onClose}>✕</button></div>
        {err&&<div style={{background:'rgba(230,57,70,.1)',border:'1px solid rgba(230,57,70,.3)',borderRadius:'var(--radius-sm)',padding:10,marginBottom:12,fontSize:12,color:'var(--red)'}}>⚠️ {err}</div>}
        <div className="form-group"><label className="label">Destinataire (utilisateur Waiichia)</label><input className="input-field" value={dest} onChange={e=>setDest(e.target.value)} placeholder="@username ou numéro de téléphone"/></div>
        <div className="form-group"><label className="label">Montant ({dc})</label><input className="input-field" type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="Ex: 5000"/></div>
        <div className="form-group"><label className="label">Message (optionnel)</label><input className="input-field" value={msg} onChange={e=>setMsg(e.target.value)} placeholder="Ex: Paiement featuring..."/></div>
        <div style={{background:amt>balance?'rgba(230,57,70,.06)':'rgba(44,198,83,.06)',border:`1px solid ${amt>balance?'rgba(230,57,70,.2)':'rgba(44,198,83,.2)'}`,borderRadius:'var(--radius-sm)',padding:12,marginBottom:16,display:'flex',justifyContent:'space-between',fontSize:13}}>
          <span style={{color:'var(--text2)'}}>Solde après transfert</span>
          <span style={{fontFamily:'Syne,sans-serif',fontWeight:700,color:amt>balance?'var(--red)':'var(--green)'}}>{(balance-amt).toLocaleString()} {dc}</span>
        </div>
        {amt>balance&&<div style={{fontSize:12,color:'var(--red)',marginBottom:12}}>⚠️ Solde insuffisant — Rechargez votre portefeuille</div>}
        <div style={{display:'flex',gap:10}}>
          <button className="btn btn-secondary" onClick={onClose} style={{flex:1}}>Annuler</button>
          <button className="btn btn-primary" style={{flex:2}} onClick={doTransfer} disabled={loading||amt>balance}>{loading?'Envoi...':'↔ Transférer '+(amt?amt.toLocaleString()+' '+dc:'')}</button>
        </div>
      </div>
    </div>
  )
}
