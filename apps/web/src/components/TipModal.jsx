import { useState } from "react"
import { useDeviseStore } from "../stores/index.js"
import api from "../services/api.js"

// TipModal — envoie un pourboire (transfert wallet) a un createur.
// Reutilise la route existante POST /api/payments/transfer
//   body attendu : { to_username, amount, message }  (min 100 KMF, frais 1%)
// Calque sur le style de BuyModal (overlay floute, carte var(--bg2), Syne, --gold).
export default function TipModal({ recipient, onClose, onSuccess }) {
  const { devise } = useDeviseStore()
  const [amount, setAmount] = useState(1000)
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState("")
  const [done, setDone] = useState(false)

  const name = recipient?.display_name || recipient?.username || "ce créateur"
  const initials = (name[0] || "?").toUpperCase()
  const QUICK = [500, 1000, 5000]
  const amt = parseInt(amount) || 0
  const fee = Math.floor(amt * 0.01)
  const net = amt - fee
  const valid = amt >= 100

  const send = async () => {
    setErr("")
    if (!recipient?.username) { setErr("Destinataire invalide"); return }
    if (!valid) { setErr("Montant minimum : 100 " + devise.code); return }
    setLoading(true)
    try {
      await api.payments.transfer({ to_username: recipient.username, amount: amt, message: message || undefined })
      setDone(true)
      setTimeout(() => { onSuccess?.(); onClose() }, 1800)
    } catch(e) {
      setErr(e.message || "Solde insuffisant ou erreur réseau")
    }
    setLoading(false)
  }

  const s = {
    overlay: { position:"fixed", inset:0, background:"rgba(0,0,0,.65)", zIndex:500,
      display:"flex", alignItems:"center", justifyContent:"center", padding:16, backdropFilter:"blur(4px)" },
    card: { background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:"var(--radius)",
      padding:28, width:"100%", maxWidth:400, boxShadow:"0 24px 64px rgba(0,0,0,.5)", animation:"slideIn .2s ease" },
    input: { width:"100%", background:"var(--card)", border:"1px solid var(--border)",
      borderRadius:"var(--radius-sm)", padding:"10px 12px", color:"var(--text)", fontSize:14, boxSizing:"border-box" },
  }

  return (
    <div onClick={onClose} style={s.overlay}>
      <div onClick={e=>e.stopPropagation()} style={s.card}>

        {done ? (
          <div style={{textAlign:"center",padding:"20px 0"}}>
            <div style={{fontSize:52,marginBottom:12}}>🎁</div>
            <div style={{fontFamily:"Syne,sans-serif",fontSize:18,fontWeight:800,marginBottom:6}}>Tip envoyé !</div>
            <div style={{fontSize:13,color:"var(--text2)"}}>{net.toLocaleString()} {devise.code} envoyés à {name}.</div>
          </div>
        ) : (<>
          {/* HEADER */}
          <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:20}}>
            <div style={{width:56,height:56,borderRadius:10,overflow:"hidden",
              background:"linear-gradient(135deg,var(--gold),#e8920a)",
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,fontWeight:800,color:"#000",flexShrink:0}}>
              {recipient?.avatar_url
                ? <img src={recipient.avatar_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                : initials}
            </div>
            <div>
              <div style={{fontFamily:"Syne,sans-serif",fontSize:17,fontWeight:800}}>Envoyer un tip</div>
              <div style={{fontSize:12,color:"var(--text2)",marginTop:3}}>à {name}</div>
            </div>
          </div>

          {/* MONTANTS RAPIDES */}
          <div style={{display:"flex",gap:8,marginBottom:12}}>
            {QUICK.map(q => (
              <button key={q} onClick={()=>setAmount(q)}
                style={{flex:1,padding:"10px 0",borderRadius:"var(--radius-sm)",cursor:"pointer",
                  fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:14,
                  border:"1px solid "+(amt===q?"var(--gold)":"var(--border)"),
                  background:amt===q?"var(--gold)":"var(--card)",
                  color:amt===q?"#000":"var(--text)"}}>
                {q.toLocaleString()}
              </button>
            ))}
          </div>

          {/* MONTANT LIBRE */}
          <div style={{marginBottom:12}}>
            <div style={{fontSize:12,color:"var(--text2)",marginBottom:6}}>Montant ({devise.code})</div>
            <input type="number" min="100" value={amount}
              onChange={e=>setAmount(e.target.value)}
              placeholder="Autre montant…" style={s.input}/>
          </div>

          {/* MESSAGE OPTIONNEL */}
          <div style={{marginBottom:12}}>
            <div style={{fontSize:12,color:"var(--text2)",marginBottom:6}}>Message (optionnel)</div>
            <input type="text" maxLength="120" value={message}
              onChange={e=>setMessage(e.target.value)}
              placeholder="Un petit mot…" style={s.input}/>
          </div>

          {/* RECAP FRAIS */}
          <div style={{background:"var(--card)",border:"1px solid var(--border)",
            borderRadius:"var(--radius-sm)",padding:12,marginBottom:14,fontSize:12,color:"var(--text2)"}}>
            <div style={{display:"flex",justifyContent:"space-between",padding:"3px 0"}}>
              <span>Frais (1%)</span><span>{fee.toLocaleString()} {devise.code}</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",padding:"3px 0",color:"var(--text)",fontWeight:600}}>
              <span>{name} reçoit</span><span>{(net>0?net:0).toLocaleString()} {devise.code}</span>
            </div>
          </div>

          {err && <div style={{color:"#ff6b6b",fontSize:12,marginBottom:10,textAlign:"center"}}>{err}</div>}

          {/* ACTIONS */}
          <button className="btn btn-primary" onClick={send} disabled={loading||!valid}
            style={{width:"100%",opacity:(loading||!valid)?0.6:1}}>
            {loading ? "Envoi…" : `🎁 Envoyer — ${amt.toLocaleString()} ${devise.code}`}
          </button>
          <button onClick={onClose} style={{width:"100%",marginTop:8,background:"none",
            border:"none",color:"var(--text2)",fontSize:13,cursor:"pointer",padding:"8px 0"}}>
            Annuler
          </button>
        </>)}
      </div>
    </div>
  )
}
