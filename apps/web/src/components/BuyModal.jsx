import { useState } from "react"
import { useDeviseStore } from "../stores/index.js"
import api from "../services/api.js"

export default function BuyModal({ track, mode, onClose, onSuccess }) {
  const { devise } = useDeviseStore()
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState("")
  const [done, setDone] = useState(false)

  const price = mode === "buy"
    ? (track.sale_price || 2500)
    : Math.round((track.sale_price || 2500) * 0.08)
  const rentDays = 7

  const confirm = async () => {
    setLoading(true); setErr("")
    try {
      if (mode === "buy") {
        await api.payments.buyTrack({ track_id: track.id, amount: price })
      } else {
        await api.payments.rentTrack({ track_id: track.id, days: rentDays, amount: price })
      }
      setDone(true)
      setTimeout(() => { onSuccess?.(); onClose() }, 1800)
    } catch(e) {
      setErr(e.message || "Solde insuffisant ou erreur réseau")
    }
    setLoading(false)
  }

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.65)",zIndex:500,
      display:"flex",alignItems:"center",justifyContent:"center",padding:16,backdropFilter:"blur(4px)"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"var(--bg2)",border:"1px solid var(--border)",
        borderRadius:"var(--radius)",padding:28,width:"100%",maxWidth:380,
        boxShadow:"0 24px 64px rgba(0,0,0,.5)",animation:"slideIn .2s ease"}}>

        {done ? (
          <div style={{textAlign:"center",padding:"20px 0"}}>
            <div style={{fontSize:52,marginBottom:12}}>✅</div>
            <div style={{fontFamily:"Syne,sans-serif",fontSize:18,fontWeight:800,marginBottom:6}}>
              {mode==="buy"?"Achat confirmé !":"Location activée !"}
            </div>
            <div style={{fontSize:13,color:"var(--text2)"}}>
              {mode==="buy"?"Vous pouvez écouter ce titre en illimité.":
              `Accès valable ${rentDays} jours.`}
            </div>
          </div>
        ) : (<>
          <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:20}}>
            <div style={{width:56,height:56,borderRadius:10,background:"linear-gradient(135deg,var(--gold),#e8920a)",
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>
              {mode==="buy"?"🛒":"⏳"}
            </div>
            <div>
              <div style={{fontFamily:"Syne,sans-serif",fontSize:17,fontWeight:800}}>
                {mode==="buy"?"Acheter ce titre":"Louer ce titre"}
              </div>
              <div style={{fontSize:12,color:"var(--text2)",marginTop:3}}>{track.title}</div>
            </div>
          </div>

          {/* Prix */}
          <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--radius-sm)",
            padding:16,marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <span style={{fontSize:13,color:"var(--text2)"}}>
                {mode==="buy"?"Achat définitif":`Location ${rentDays} jours`}
              </span>
              <span style={{fontFamily:"Syne,sans-serif",fontSize:20,fontWeight:800,color:"var(--gold)"}}>
                {price.toLocaleString()} {devise.code}
              </span>
            </div>
            {mode==="rent"&&<div style={{fontSize:11,color:"var(--text3)"}}>
              Accès illimité pendant {rentDays} jours · Renouvellement possible
            </div>}
            {mode==="buy"&&<div style={{fontSize:11,color:"var(--text3)"}}>
              Accès illimité · Téléchargement · Pas de pub
            </div>}
          </div>

          {/* Paiement */}
          <div style={{background:"rgba(44,198,83,.06)",border:"1px solid rgba(44,198,83,.2)",
            borderRadius:"var(--radius-sm)",padding:12,marginBottom:16,display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:16}}>💰</span>
            <span style={{fontSize:12,color:"var(--text2)"}}>Débit depuis votre Wallet Waiichia</span>
          </div>

          {err&&<div style={{background:"rgba(230,57,70,.1)",border:"1px solid rgba(230,57,70,.3)",
            borderRadius:"var(--radius-sm)",padding:10,marginBottom:14,fontSize:12,color:"var(--red)"}}>
            ⚠️ {err}
          </div>}

          <div style={{display:"flex",gap:10}}>
            <button onClick={onClose} style={{flex:1,padding:"11px",borderRadius:50,border:"1px solid var(--border)",
              background:"transparent",color:"var(--text2)",fontSize:13,fontWeight:600,cursor:"pointer",
              fontFamily:"Plus Jakarta Sans,sans-serif"}}>
              Annuler
            </button>
            <button onClick={confirm} disabled={loading}
              style={{flex:2,padding:"11px",borderRadius:50,border:"none",
                background:loading?"var(--border)":"linear-gradient(135deg,var(--gold),#e8920a)",
                color:"#000",fontSize:13,fontWeight:700,cursor:loading?"not-allowed":"pointer",
                fontFamily:"Plus Jakarta Sans,sans-serif",boxShadow:"0 4px 16px rgba(245,166,35,.3)"}}>
              {loading?"Traitement...":mode==="buy"?`Acheter — ${price.toLocaleString()} ${devise.code}`:`Louer — ${price.toLocaleString()} ${devise.code}`}
            </button>
          </div>
        </>)}
      </div>
    </div>
  )
}
