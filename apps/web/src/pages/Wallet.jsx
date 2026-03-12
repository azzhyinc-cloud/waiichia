import { useState, useEffect } from "react"
import { useAuthStore, useDeviseStore } from "../stores/index.js"
import api from "../services/api.js"

const DEVISES=[{code:"KMF",flag:"🇰🇲",label:"Franc Comorien"},{code:"MGA",flag:"🇲🇬",label:"Ariary Malgache"},{code:"TZS",flag:"🇹🇿",label:"Shilling Tanzanien"},{code:"RWF",flag:"🇷🇼",label:"Franc Rwandais"},{code:"XOF",flag:"🇨🇮",label:"FCFA Ouest"},{code:"XAF",flag:"🇨🇩",label:"FCFA Central"},{code:"NGN",flag:"🇳🇬",label:"Naira"},{code:"USD",flag:"🇺🇸",label:"Dollar US"},{code:"EUR",flag:"🇪🇺",label:"Euro"}]
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

export default function Wallet() {
  const { user } = useAuthStore()
  const { devise: deviseObj, setDevise } = useDeviseStore()
  const dc = deviseObj?.code || 'KMF'
  const [period, setPeriod] = useState("Mois")
  const [txType, setTxType] = useState("Tous types")
  const [balance,setBalance] = useState(null)
  const [loading,setLoading] = useState(true)
  const [showRecharge,setShowRecharge] = useState(false)

  useEffect(()=>{
    api.get("/api/payments/wallet")
      .then(d=>setBalance(d.wallet?.balance ?? d.balance ?? 74850))
      .catch(()=>setBalance(74850))
      .finally(()=>setLoading(false))
  },[])

  const filtered=MOCK_TX.filter(t=>txType==="Tous types"||
    (txType==="Recettes"&&t.type==="credit")||
    (txType==="Dépenses"&&t.type==="debit")||
    (txType==="Transferts"&&t.label.includes("Transfert"))||
    (txType==="Retraits"&&t.label.includes("Retrait"))
  )

  const stats=[
    {label:"Revenus ce mois",value:"12 400 KMF",icon:"📈",color:"var(--green)"},
    {label:"Dépenses ce mois",value:"7 500 KMF",icon:"📉",color:"var(--red)"},
    {label:"Titres vendus",value:"18",icon:"🎵",color:"var(--gold)"},
    {label:"Tips reçus",value:"3 200 KMF",icon:"🎁",color:"var(--blue)"},
  ]

  return(
    <div style={{paddingBottom:40}}>
      <div style={{fontFamily:"Syne,sans-serif",fontSize:22,fontWeight:800,marginBottom:22}}>💰 Mon Portefeuille</div>

      {/* CARTE SOLDE */}
      <div style={{background:"linear-gradient(135deg,#0a1a0e,#1a3a20)",border:"1px solid rgba(44,198,83,.25)",borderRadius:"var(--radius)",padding:28,position:"relative",overflow:"hidden",marginBottom:22}}>
        <div style={{position:"absolute",right:-40,top:-40,width:200,height:200,background:"radial-gradient(circle,rgba(44,198,83,.15),transparent 70%)",pointerEvents:"none"}}/>
        <div style={{position:"relative",zIndex:1}}>
          <div style={{fontSize:13,color:"rgba(255,255,255,.6)",fontFamily:"Space Mono,monospace",marginBottom:8}}>
            Solde disponible · {dc} ({DEVISES.find(d=>d.code===dc)?.label})
          </div>
          <div style={{fontFamily:"Syne,sans-serif",fontSize:38,fontWeight:800,color:"#2dc653",margin:"8px 0"}}>
            {loading?"...":balance?.toLocaleString()} {dc}
          </div>
          <div style={{fontSize:12,color:"rgba(255,255,255,.5)",marginBottom:16}}>
            ≈ {Math.floor((balance||74850)/490)} USD · ≈ {Math.floor((balance||74850)/540)} EUR
          </div>
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            <button onClick={()=>setShowRecharge(true)} style={{padding:"8px 18px",borderRadius:50,border:"none",background:"linear-gradient(135deg,var(--gold),#e8920a)",color:"#000",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"Plus Jakarta Sans,sans-serif"}}>💳 Recharger</button>
            <button style={{padding:"8px 18px",borderRadius:50,border:"1px solid rgba(255,255,255,.2)",background:"transparent",color:"rgba(255,255,255,.8)",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"Plus Jakarta Sans,sans-serif"}}>↔ Transférer</button>
            <button style={{padding:"8px 18px",borderRadius:50,border:"1px solid rgba(255,255,255,.2)",background:"transparent",color:"rgba(255,255,255,.8)",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"Plus Jakarta Sans,sans-serif"}}>📋 Réclamation</button>
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
        {[["💳","Recharger",()=>setShowRecharge(true)],["↔️","Transférer",()=>{}],["🏦","Retirer",()=>{}],["📋","Réclamation",()=>{}]].map(([icon,label,fn])=>(
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
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}>
        <div style={{fontFamily:"Syne,sans-serif",fontSize:18,fontWeight:700}}>📊 Historique des transactions</div>
      </div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16,alignItems:"center"}}>
        {PERIODS.map(p=><button key={p} onClick={()=>setPeriod(p)} style={{padding:"5px 14px",borderRadius:50,border:"1px solid",fontSize:12,fontWeight:600,cursor:"pointer",transition:"all .18s",fontFamily:"Plus Jakarta Sans,sans-serif",borderColor:period===p?"var(--gold)":"var(--border)",background:period===p?"var(--gold)":"var(--card)",color:period===p?"#000":"var(--text2)"}}>{p}</button>)}
        <select value={txType} onChange={e=>setTxType(e.target.value)} style={{padding:"7px 12px",borderRadius:"var(--radius-sm)",border:"1px solid var(--border)",background:"var(--card)",color:"var(--text)",fontSize:12,cursor:"pointer",outline:"none"}}>
          {TX_TYPES.map(t=><option key={t}>{t}</option>)}
        </select>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {filtered.map(tx=>(
          <div key={tx.id} style={{display:"flex",alignItems:"center",gap:12,padding:"13px 16px",background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--radius-sm)",transition:"border-color .2s"}} onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(245,166,35,.2)"} onMouseLeave={e=>e.currentTarget.style.borderColor="var(--border)"}>
            <div style={{width:36,height:36,borderRadius:"50%",background:tx.type==="credit"?"rgba(44,198,83,.15)":"rgba(230,57,70,.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{tx.icon}</div>
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

      {/* MODAL RECHARGE */}
      {showRecharge&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={()=>setShowRecharge(false)}>
          <div style={{background:"var(--bg2)",border:"1px solid var(--border)",borderRadius:"var(--radius)",padding:28,width:"100%",maxWidth:400}} onClick={e=>e.stopPropagation()}>
            <div style={{fontFamily:"Syne,sans-serif",fontSize:20,fontWeight:800,marginBottom:20}}>💳 Recharger le wallet</div>
            {[["📱 Mobile Money","Huri Money, M-Pesa, Mvola"],["💳 Carte Bancaire","Visa, Mastercard"],["🏦 Virement bancaire","Banque des Comores, BIC"]].map(([m,d])=>(
              <div key={m} style={{padding:"14px 16px",background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--radius-sm)",marginBottom:10,cursor:"pointer",transition:"border-color .2s"}} onMouseEnter={e=>e.currentTarget.style.borderColor="var(--gold)"} onMouseLeave={e=>e.currentTarget.style.borderColor="var(--border)"}>
                <div style={{fontWeight:600,fontSize:13}}>{m}</div>
                <div style={{fontSize:11,color:"var(--text3)",marginTop:2}}>{d}</div>
              </div>
            ))}
            <button onClick={()=>setShowRecharge(false)} style={{width:"100%",padding:"10px",borderRadius:50,border:"1px solid var(--border)",background:"transparent",color:"var(--text2)",fontSize:13,cursor:"pointer",marginTop:8,fontFamily:"Plus Jakarta Sans,sans-serif"}}>Fermer</button>
          </div>
        </div>
      )}
    </div>
  )
}
