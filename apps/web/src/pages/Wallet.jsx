import { useState, useEffect } from "react"
import { useAuthStore, useDeviseStore } from "../stores/index.js"
import api from "../services/api.js"

const DEVISES=[
  {code:"KMF",flag:"🇰🇲",label:"Franc Comorien"},
  {code:"MGA",flag:"🇲🇬",label:"Ariary Malgache"},
  {code:"TZS",flag:"🇹🇿",label:"Shilling Tanzanien"},
  {code:"RWF",flag:"🇷🇼",label:"Franc Rwandais"},
  {code:"XOF",flag:"🇨🇮",label:"FCFA Ouest"},
  {code:"XAF",flag:"🇨🇩",label:"FCFA Central"},
  {code:"NGN",flag:"🇳🇬",label:"Naira"},
  {code:"USD",flag:"🇺🇸",label:"Dollar US"},
  {code:"EUR",flag:"🇪🇺",label:"Euro"},
]
const PERIODS=["Aujourd'hui","Semaine","Mois","Année"]
const TX_TYPES=["Tous types","Recettes","Dépenses","Transferts","Retraits"]
const MOCK_TX=[
  {id:"t1",type:"credit",label:"Vente — Twarab ya Komori",amount:2500,date:"Auj. 09:14",icon:"💰"},
  {id:"t2",type:"credit",label:"Location — Moroni Flow × 3",amount:600,date:"Auj. 08:30",icon:"⏳"},
  {id:"t3",type:"debit",label:"Retrait Mobile Money",amount:-15000,date:"Hier 18:45",icon:"🏦"},
  {id:"t4",type:"credit",label:"Tips — Concert Live Stream",amount:3200,date:"Hier 16:20",icon:"🎁"},
  {id:"t5",type:"debit",label:"Achat — Afrika Rising",amount:-2500,date:"Lun. 14:10",icon:"🛒"},
  {id:"t6",type:"credit",label:"Vente — Island Vibe",amount:1500,date:"Lun. 11:30",icon:"💰"},
  {id:"t7",type:"credit",label:"Recharge Mobile Money",amount:10000,date:"Dim. 10:00",icon:"💳"},
  {id:"t8",type:"debit",label:"Transfert vers @djcomoros",amount:-5000,date:"Sam. 19:15",icon:"↔️"},
]
const isMobile=()=>/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
const inputStyle={width:"100%",padding:"10px 14px",borderRadius:"var(--radius-sm)",border:"1px solid var(--border)",background:"var(--card2)",color:"var(--text)",fontFamily:"Plus Jakarta Sans,sans-serif",fontSize:13,outline:"none",boxSizing:"border-box",transition:"border-color .2s"}
const btnGold={padding:"8px 18px",borderRadius:50,border:"none",background:"linear-gradient(135deg,var(--gold),#e8920a)",color:"#000",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"Plus Jakarta Sans,sans-serif",boxShadow:"0 3px 12px rgba(245,166,35,.3)"}
const btnGlass={padding:"8px 18px",borderRadius:50,border:"1px solid rgba(255,255,255,.2)",background:"transparent",color:"rgba(255,255,255,.8)",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"Plus Jakarta Sans,sans-serif"}

function Modal({children,onClose}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.65)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={onClose}>
      <div style={{background:"var(--bg2)",border:"1px solid var(--border)",borderRadius:"var(--radius)",padding:28,width:"100%",maxWidth:420,maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}
function ModalTitle({children}){return <div style={{fontFamily:"Syne,sans-serif",fontSize:20,fontWeight:800,marginBottom:20}}>{children}</div>}
function Field({label,children}){return <div style={{marginBottom:14}}><div style={{fontSize:12,color:"var(--text2)",marginBottom:6,fontWeight:600}}>{label}</div>{children}</div>}
function ErrBox({msg}){return <div style={{color:"var(--red)",fontSize:12,padding:"8px 12px",background:"rgba(230,57,70,.08)",border:"1px solid rgba(230,57,70,.2)",borderRadius:8,marginTop:8}}>{msg}</div>}
function BtnClose({onClick}){return <button onClick={onClick} style={{width:"100%",padding:"10px",borderRadius:50,border:"1px solid var(--border)",background:"transparent",color:"var(--text2)",fontSize:13,cursor:"pointer",marginTop:12,fontFamily:"Plus Jakarta Sans,sans-serif"}}>Fermer</button>}
function SuccessScreen({title,sub,onClose}){
  return(
    <div style={{textAlign:"center",padding:"20px 0"}}>
      <div style={{fontSize:56,marginBottom:12}}>✅</div>
      <div style={{fontFamily:"Syne,sans-serif",fontSize:20,fontWeight:800,marginBottom:8,color:"var(--green)"}}>{title}</div>
      <div style={{fontSize:13,color:"var(--text2)",marginBottom:24}}>{sub}</div>
      <button onClick={onClose} style={{...btnGold,padding:"10px 28px"}}>Fermer</button>
    </div>
  )
}

function RechargeModal({onClose,dc,onSuccess}){
  const [step,setStep]=useState("method")
  const [method,setMethod]=useState(null)
  const [amount,setAmount]=useState("")
  const [phone,setPhone]=useState("")
  const [cardNum,setCardNum]=useState("")
  const [cardExp,setCardExp]=useState("")
  const [cardCvc,setCardCvc]=useState("")
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState("")
  const mob=isMobile()
  const AMOUNTS=[1000,2500,5000,10000,25000,50000]
  const METHODS=[
    ...(mob?[{id:"mvola",icon:"📱",label:"Mvola",sub:"Paiement mobile instantané",color:"#e63946",badge:"📱 MOBILE"}]:[]),
    {id:"huri",icon:"📲",label:"Huri Money",sub:"Mobile Money Comores",color:"#2dc653"},
    {id:"mpesa",icon:"📲",label:"M-Pesa",sub:"Mobile Money Afrique",color:"#4d9fff"},
    {id:"stripe",icon:"💳",label:"Carte Bancaire",sub:"Visa · Mastercard · Amex",color:"#9b59f5"},
    {id:"cash",icon:"🏦",label:"Dépôt Cash",sub:"Agence partenaire Comores",color:"var(--gold)"},
    {id:"wire",icon:"🏧",label:"Virement bancaire",sub:"Banque des Comores, BIC",color:"#4d9fff"},
  ]
  const submit=async()=>{
    if(!amount||parseFloat(amount)<100){setError("Montant minimum : 100 "+dc);return}
    if((method==="mvola"||method==="huri"||method==="mpesa")&&!phone){setError("Numéro requis");return}
    if(method==="stripe"&&(cardNum.length<16||!cardExp||!cardCvc)){setError("Informations carte incomplètes");return}
    setLoading(true);setError("")
    await new Promise(r=>setTimeout(r,1800))
    await api.payments.recharge?.({method,amount:parseFloat(amount),phone}).catch(()=>{})
    onSuccess(parseFloat(amount))
    setStep("success")
    setLoading(false)
  }
  if(step==="success") return(
    <Modal onClose={onClose}>
      <SuccessScreen title="Recharge réussie !" sub={`+${parseFloat(amount).toLocaleString()} ${dc} crédités`} onClose={onClose}/>
    </Modal>
  )
  return(
    <Modal onClose={onClose}>
      {step==="method"&&<>
        <ModalTitle>💳 Recharger le portefeuille</ModalTitle>
        {!mob&&<div style={{background:"rgba(245,166,35,.08)",border:"1px solid rgba(245,166,35,.2)",borderRadius:"var(--radius-sm)",padding:"10px 14px",marginBottom:16,display:"flex",alignItems:"center",gap:8}}>
          <span>📱</span>
          <div style={{fontSize:12,color:"var(--gold)"}}><strong>Mvola disponible sur mobile</strong> — Ouvrez ce site sur votre téléphone</div>
        </div>}
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:8}}>
          {METHODS.map(m=>(
            <div key={m.id} onClick={()=>{setMethod(m.id);setStep("form")}}
              style={{padding:"14px 16px",background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--radius-sm)",cursor:"pointer",transition:"all .2s",display:"flex",alignItems:"center",gap:12}}
              onMouseEnter={e=>e.currentTarget.style.borderColor=m.color}
              onMouseLeave={e=>e.currentTarget.style.borderColor="var(--border)"}>
              <div style={{width:40,height:40,borderRadius:10,background:m.color+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{m.icon}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:13,display:"flex",alignItems:"center",gap:8}}>
                  {m.label}
                  {m.badge&&<span style={{fontSize:9,padding:"2px 7px",borderRadius:20,background:m.color,color:"#fff",fontFamily:"Space Mono,monospace",fontWeight:700}}>{m.badge}</span>}
                </div>
                <div style={{fontSize:11,color:"var(--text3)",marginTop:2}}>{m.sub}</div>
              </div>
              <span style={{color:"var(--text3)",fontSize:18}}>›</span>
            </div>
          ))}
        </div>
        <BtnClose onClick={onClose}/>
      </>}
      {step==="form"&&<>
        <button onClick={()=>setStep("method")} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",color:"var(--gold)",cursor:"pointer",fontSize:13,fontWeight:600,marginBottom:16,fontFamily:"Plus Jakarta Sans,sans-serif",padding:0}}>← Retour</button>
        <ModalTitle>{METHODS.find(m=>m.id===method)?.icon} {METHODS.find(m=>m.id===method)?.label}</ModalTitle>
        <div style={{fontSize:12,color:"var(--text2)",marginBottom:8,fontWeight:600}}>Montant ({dc})</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:10}}>
          {AMOUNTS.map(a=>(
            <button key={a} onClick={()=>setAmount(String(a))}
              style={{padding:"8px 4px",borderRadius:"var(--radius-sm)",border:"1px solid",fontSize:12,fontWeight:600,cursor:"pointer",transition:"all .18s",fontFamily:"Plus Jakarta Sans,sans-serif",borderColor:amount===String(a)?"var(--gold)":"var(--border)",background:amount===String(a)?"var(--gold)":"var(--card)",color:amount===String(a)?"#000":"var(--text2)"}}>
              {a.toLocaleString()}
            </button>
          ))}
        </div>
        <input value={amount} onChange={e=>setAmount(e.target.value)} placeholder={"Autre montant en "+dc} style={{...inputStyle,marginBottom:14}} type="number" min="100"/>
        {(method==="mvola"||method==="huri"||method==="mpesa")&&<>
          <Field label={"Numéro "+(method==="mvola"?"Mvola":method==="huri"?"Huri Money":"M-Pesa")}>
            <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder={method==="mvola"?"+269 321 XXXX":"+269 XXX XXXX"} style={inputStyle} type="tel"/>
          </Field>
          <div style={{fontSize:11,color:"var(--text3)",padding:"8px 12px",background:"rgba(44,198,83,.08)",border:"1px solid rgba(44,198,83,.2)",borderRadius:"var(--radius-sm)",marginBottom:10}}>
            📲 Vous recevrez un SMS de confirmation à valider
          </div>
        </>}
        {method==="stripe"&&<>
          <Field label="Numéro de carte">
            <input value={cardNum} onChange={e=>setCardNum(e.target.value.replace(/\D/g,"").slice(0,16))} placeholder="1234 5678 9012 3456" style={inputStyle}/>
          </Field>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
            <Field label="Expiration"><input value={cardExp} onChange={e=>setCardExp(e.target.value)} placeholder="MM/AA" style={inputStyle}/></Field>
            <Field label="CVC"><input value={cardCvc} onChange={e=>setCardCvc(e.target.value.slice(0,4))} placeholder="123" style={inputStyle} type="password"/></Field>
          </div>
          <div style={{fontSize:11,color:"var(--text3)",marginBottom:10,display:"flex",alignItems:"center",gap:6}}>🔒 Paiement sécurisé via Stripe · TLS 256-bit</div>
        </>}
        {method==="cash"&&<div style={{marginBottom:14,background:"rgba(245,166,35,.08)",border:"1px solid rgba(245,166,35,.2)",borderRadius:"var(--radius-sm)",padding:"14px 16px",fontSize:12,color:"var(--text2)",lineHeight:1.8}}>
          <div style={{fontWeight:700,color:"var(--gold)",marginBottom:8}}>🏦 Points de dépôt partenaires</div>
          <div>📍 <strong>Moroni</strong> — Agence principale, Bd Saïd Mohamed Cheikh</div>
          <div>📍 <strong>Mutsamudu</strong> — Bureau Anjouanais, Centre ville</div>
          <div>📍 <strong>Fomboni</strong> — Point relais Mohéli</div>
          <div style={{marginTop:8,fontSize:11,color:"var(--text3)"}}>Présentez votre QR code Waiichia à l'agent</div>
        </div>}
        {method==="wire"&&<div style={{marginBottom:14,background:"rgba(77,159,255,.08)",border:"1px solid rgba(77,159,255,.2)",borderRadius:"var(--radius-sm)",padding:"14px 16px",fontSize:12,color:"var(--text2)",lineHeight:1.8}}>
          <div style={{fontWeight:700,color:"var(--blue)",marginBottom:8}}>🏧 Coordonnées bancaires</div>
          <div><strong>Banque :</strong> Banque des Comores (BDC)</div>
          <div><strong>IBAN :</strong> KM12 0001 0001 2345 6789</div>
          <div><strong>BIC :</strong> BDCOKM21</div>
          <div><strong>Bénéficiaire :</strong> Waiichia SARL</div>
          <div style={{marginTop:8,fontSize:11,color:"var(--text3)"}}>⏱ Délai : 1-3 jours ouvrés</div>
        </div>}
        {error&&<ErrBox msg={error}/>}
        {method!=="cash"&&method!=="wire"&&(
          <button onClick={submit} disabled={loading} style={{...btnGold,width:"100%",marginTop:4,padding:"12px",fontSize:13,opacity:loading?.7:1,cursor:loading?"not-allowed":"pointer"}}>
            {loading?"⏳ Traitement en cours...":"💳 Confirmer — "+parseFloat(amount||0).toLocaleString()+" "+dc}
          </button>
        )}
        <BtnClose onClick={onClose}/>
      </>}
    </Modal>
  )
}

function TransferModal({onClose,dc,balance,onSuccess}){
  const [username,setUsername]=useState("")
  const [amount,setAmount]=useState("")
  const [note,setNote]=useState("")
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState("")
  const [success,setSuccess]=useState(false)
  const submit=async()=>{
    if(!username){setError("Nom d'utilisateur requis");return}
    if(!amount||parseFloat(amount)<100){setError("Montant minimum : 100 "+dc);return}
    if(parseFloat(amount)>(balance||0)){setError("Solde insuffisant");return}
    setLoading(true);setError("")
    await new Promise(r=>setTimeout(r,1500))
    await api.payments.transfer?.({to:username,amount:parseFloat(amount),note}).catch(()=>{})
    onSuccess(-parseFloat(amount))
    setSuccess(true);setLoading(false)
  }
  if(success) return <Modal onClose={onClose}><SuccessScreen title="Transfert envoyé !" sub={parseFloat(amount).toLocaleString()+" "+dc+" envoyés à @"+username} onClose={onClose}/></Modal>
  return(
    <Modal onClose={onClose}>
      <ModalTitle>↔️ Transférer des fonds</ModalTitle>
      <Field label="Destinataire (@username)">
        <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="@nom_utilisateur" style={inputStyle}/>
      </Field>
      <Field label={"Montant ("+dc+")"}>
        <input value={amount} onChange={e=>setAmount(e.target.value)} placeholder="Montant" style={inputStyle} type="number" min="100"/>
        <div style={{fontSize:11,color:"var(--text3)",marginTop:4}}>Disponible : {(balance||0).toLocaleString()} {dc}</div>
      </Field>
      <Field label="Note (optionnel)">
        <input value={note} onChange={e=>setNote(e.target.value)} placeholder="Raison du transfert..." style={inputStyle}/>
      </Field>
      {error&&<ErrBox msg={error}/>}
      <button onClick={submit} disabled={loading} style={{...btnGold,width:"100%",marginTop:16,padding:"12px",fontSize:13,opacity:loading?.7:1}}>
        {loading?"⏳ Envoi en cours...":"↔ Envoyer"}
      </button>
      <BtnClose onClick={onClose}/>
    </Modal>
  )
}

function WithdrawModal({onClose,dc,balance,onSuccess}){
  const [method,setMethod]=useState("mobile")
  const [amount,setAmount]=useState("")
  const [phone,setPhone]=useState("")
  const [iban,setIban]=useState("")
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState("")
  const [success,setSuccess]=useState(false)
  const submit=async()=>{
    if(!amount||parseFloat(amount)<500){setError("Retrait minimum : 500 "+dc);return}
    if(parseFloat(amount)>(balance||0)){setError("Solde insuffisant");return}
    if(method==="mobile"&&!phone){setError("Numéro requis");return}
    setLoading(true);setError("")
    await new Promise(r=>setTimeout(r,1800))
    onSuccess(-parseFloat(amount))
    setSuccess(true);setLoading(false)
  }
  if(success) return <Modal onClose={onClose}><SuccessScreen title="Retrait en cours !" sub={parseFloat(amount).toLocaleString()+" "+dc+" virés sous 24-72h"} onClose={onClose}/></Modal>
  return(
    <Modal onClose={onClose}>
      <ModalTitle>🏦 Retirer des fonds</ModalTitle>
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        {[{id:"mobile",label:"📱 Mobile Money"},{id:"bank",label:"🏧 Virement"}].map(m=>(
          <button key={m.id} onClick={()=>setMethod(m.id)} style={{flex:1,padding:"8px",borderRadius:"var(--radius-sm)",border:"1px solid",fontSize:12,fontWeight:600,cursor:"pointer",borderColor:method===m.id?"var(--gold)":"var(--border)",background:method===m.id?"rgba(245,166,35,.1)":"transparent",color:method===m.id?"var(--gold)":"var(--text2)"}}>
            {m.label}
          </button>
        ))}
      </div>
      <Field label={"Montant ("+dc+") — Min. 500"}>
        <input value={amount} onChange={e=>setAmount(e.target.value)} placeholder="Montant à retirer" style={inputStyle} type="number" min="500"/>
        <div style={{fontSize:11,color:"var(--text3)",marginTop:4}}>Disponible : {(balance||0).toLocaleString()} {dc}</div>
      </Field>
      {method==="mobile"&&<Field label="Numéro Mobile Money">
        <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+269 321 XXXX" style={inputStyle} type="tel"/>
      </Field>}
      {method==="bank"&&<Field label="IBAN">
        <input value={iban} onChange={e=>setIban(e.target.value)} placeholder="KM12 0001 XXXX XXXX" style={inputStyle}/>
        <div style={{fontSize:11,color:"var(--text3)",marginTop:4}}>Délai : 2-5 jours ouvrés</div>
      </Field>}
      {error&&<ErrBox msg={error}/>}
      <button onClick={submit} disabled={loading} style={{...btnGold,width:"100%",marginTop:16,padding:"12px",fontSize:13,opacity:loading?.7:1}}>
        {loading?"⏳ Traitement...":"🏦 Confirmer le retrait"}
      </button>
      <BtnClose onClick={onClose}/>
    </Modal>
  )
}

export default function Wallet(){
  const {user}=useAuthStore()
  const {devise:deviseObj,setDevise}=useDeviseStore()
  const dc=deviseObj?.code||"KMF"
  const [period,setPeriod]=useState("Mois")
  const [txType,setTxType]=useState("Tous types")
  const [balance,setBalance]=useState(null)
  const [loading,setLoading]=useState(true)
  const [modal,setModal]=useState(null)

  useEffect(()=>{
    api.get("/api/payments/wallet")
      .then(d=>setBalance(d.wallet?.balance??d.balance??74850))
      .catch(()=>setBalance(74850))
      .finally(()=>setLoading(false))
  },[])

  const handleBalanceChange=(delta)=>setBalance(b=>(b||0)+delta)

  const filtered=MOCK_TX.filter(t=>
    txType==="Tous types"||
    (txType==="Recettes"&&t.type==="credit")||
    (txType==="Dépenses"&&t.type==="debit")||
    (txType==="Transferts"&&t.label.includes("Transfert"))||
    (txType==="Retraits"&&t.label.includes("Retrait"))
  )

  const stats=[
    {label:"Revenus ce mois",value:"12 400 "+dc,icon:"📈",color:"var(--green)"},
    {label:"Dépenses ce mois",value:"7 500 "+dc,icon:"📉",color:"var(--red)"},
    {label:"Titres vendus",value:"18",icon:"🎵",color:"var(--gold)"},
    {label:"Tips reçus",value:"3 200 "+dc,icon:"🎁",color:"var(--blue)"},
  ]

  return(
    <div style={{paddingBottom:40}}>
      <div style={{fontFamily:"Syne,sans-serif",fontSize:22,fontWeight:800,marginBottom:22}}>💰 Mon Portefeuille</div>

      {/* SOLDE */}
      <div style={{background:"linear-gradient(135deg,#0a1a0e,#1a3a20)",border:"1px solid rgba(44,198,83,.25)",borderRadius:"var(--radius)",padding:28,position:"relative",overflow:"hidden",marginBottom:22}}>
        <div style={{position:"absolute",right:-40,top:-40,width:200,height:200,background:"radial-gradient(circle,rgba(44,198,83,.15),transparent 70%)",pointerEvents:"none"}}/>
        <div style={{position:"relative",zIndex:1}}>
          <div style={{fontSize:13,color:"rgba(255,255,255,.6)",fontFamily:"Space Mono,monospace",marginBottom:8}}>
            Solde disponible · {dc} ({DEVISES.find(d=>d.code===dc)?.label})
          </div>
          <div style={{fontFamily:"Syne,sans-serif",fontSize:38,fontWeight:800,color:"#2dc653",margin:"8px 0"}}>
            {loading?"...":(balance||0).toLocaleString()} {dc}
          </div>
          <div style={{fontSize:12,color:"rgba(255,255,255,.5)",marginBottom:18}}>
            ≈ {Math.floor((balance||74850)/490)} USD · ≈ {Math.floor((balance||74850)/540)} EUR
          </div>
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            <button onClick={()=>setModal("recharge")} style={btnGold}>💳 Recharger</button>
            <button onClick={()=>setModal("transfer")} style={btnGlass}>↔ Transférer</button>
            <button onClick={()=>setModal("withdraw")} style={btnGlass}>🏦 Retirer</button>
            <button style={btnGlass}>📋 Réclamation</button>
          </div>
        </div>
      </div>

      {/* DEVISE */}
      <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--radius)",padding:16,marginBottom:18}}>
        <div style={{fontSize:11,color:"var(--text3)",fontFamily:"Space Mono,monospace",textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Ma devise principale</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {DEVISES.map(d=>(
            <button key={d.code} onClick={()=>setDevise(d)}
              style={{padding:"6px 14px",borderRadius:50,border:"1px solid",fontSize:12,fontWeight:600,cursor:"pointer",transition:"all .18s",fontFamily:"Plus Jakarta Sans,sans-serif",borderColor:dc===d.code?"var(--gold)":"var(--border)",background:dc===d.code?"var(--gold)":"var(--card)",color:dc===d.code?"#000":"var(--text2)"}}>
              {d.flag} {d.code}
            </button>
          ))}
        </div>
      </div>

      {/* ACTIONS */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,marginBottom:22}}>
        {[{icon:"💳",label:"Recharger",fn:()=>setModal("recharge")},{icon:"↔️",label:"Transférer",fn:()=>setModal("transfer")},{icon:"🏦",label:"Retirer",fn:()=>setModal("withdraw")},{icon:"📋",label:"Réclamation",fn:()=>{}}].map(({icon,label,fn})=>(
          <div key={label} onClick={fn} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--radius-sm)",padding:16,textAlign:"center",cursor:"pointer",transition:"all .2s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--green)";e.currentTarget.style.transform="translateY(-2px)"}} onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.transform="none"}}>
            <div style={{fontSize:24,marginBottom:6}}>{icon}</div>
            <div style={{fontSize:12,fontWeight:600,color:"var(--text2)"}}>{label}</div>
          </div>
        ))}
      </div>

      {/* STATS */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12,marginBottom:24}}>
        {stats.map(s=>(
          <div key={s.label} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--radius-sm)",padding:"14px 16px"}}>
            <div style={{fontSize:20,marginBottom:6}}>{s.icon}</div>
            <div style={{fontFamily:"Syne,sans-serif",fontSize:18,fontWeight:700,color:s.color,marginBottom:3}}>{s.value}</div>
            <div style={{fontSize:11,color:"var(--text3)",fontFamily:"Space Mono,monospace"}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* TRANSACTIONS */}
      <div style={{fontFamily:"Syne,sans-serif",fontSize:18,fontWeight:700,marginBottom:14}}>📊 Historique des transactions</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16,alignItems:"center"}}>
        {PERIODS.map(p=>(
          <button key={p} onClick={()=>setPeriod(p)} style={{padding:"5px 14px",borderRadius:50,border:"1px solid",fontSize:12,fontWeight:600,cursor:"pointer",transition:"all .18s",fontFamily:"Plus Jakarta Sans,sans-serif",borderColor:period===p?"var(--gold)":"var(--border)",background:period===p?"var(--gold)":"var(--card)",color:period===p?"#000":"var(--text2)"}}>
            {p}
          </button>
        ))}
        <select value={txType} onChange={e=>setTxType(e.target.value)} style={{padding:"7px 12px",borderRadius:"var(--radius-sm)",border:"1px solid var(--border)",background:"var(--card)",color:"var(--text)",fontSize:12,cursor:"pointer",outline:"none"}}>
          {TX_TYPES.map(t=><option key={t}>{t}</option>)}
        </select>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {filtered.map(tx=>(
          <div key={tx.id} style={{display:"flex",alignItems:"center",gap:12,padding:"13px 16px",background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--radius-sm)",transition:"border-color .2s"}} onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(245,166,35,.2)"} onMouseLeave={e=>e.currentTarget.style.borderColor="var(--border)"}>
            <div style={{width:36,height:36,borderRadius:"50%",flexShrink:0,background:tx.type==="credit"?"rgba(44,198,83,.15)":"rgba(230,57,70,.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>{tx.icon}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:600,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{tx.label}</div>
              <div style={{fontSize:11,color:"var(--text3)",fontFamily:"Space Mono,monospace",marginTop:2}}>{tx.date}</div>
            </div>
            <div style={{fontFamily:"Syne,sans-serif",fontSize:15,fontWeight:700,flexShrink:0,color:tx.type==="credit"?"var(--green)":"var(--red)"}}>
              {tx.type==="credit"?"+":""}{tx.amount.toLocaleString()} {dc}
            </div>
          </div>
        ))}
      </div>

      {modal==="recharge"&&<RechargeModal onClose={()=>setModal(null)} dc={dc} onSuccess={delta=>handleBalanceChange(delta)}/>}
      {modal==="transfer"&&<TransferModal onClose={()=>setModal(null)} dc={dc} balance={balance} onSuccess={delta=>handleBalanceChange(delta)}/>}
      {modal==="withdraw"&&<WithdrawModal onClose={()=>setModal(null)} dc={dc} balance={balance} onSuccess={delta=>handleBalanceChange(delta)}/>}
    </div>
  )
}
