import { useState, useEffect } from "react"
import { useDeviseStore } from "../stores/index.js"
import api from "../services/api.js"

export default function BuyModal({ track, product, mode, onClose, onSuccess }) {
  const { devise } = useDeviseStore()
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState("")
  const [done, setDone] = useState(false)
  const [showDetail, setShowDetail] = useState(false)

  // ========== Determine item info ==========
  const isProduct = !!product
  const item = isProduct ? product : track
  const itemTitle = isProduct ? (product.name || "Produit") : (track?.title || "Titre")
  const itemEmoji = isProduct ? (product.emoji || "🛍️") : (mode === "buy" ? "🛒" : "⏳")

  // ========== Pricing ==========
  const basePrice = isProduct
    ? (product.price || 0)
    : mode === "buy"
      ? (track?.sale_price || 2500)
      : Math.round((track?.sale_price || 2500) * 0.08)

  const rentDays = 7

  // Commission & tax rates (what the SELLER pays — shown for transparency)
  const COMMISSION_RATE = 0.10  // 10% commission plateforme
  const TAX_RATE = 0.00         // 0% TVA Comores (ajuster si changement)

  const commissionAmount = Math.round(basePrice * COMMISSION_RATE)
  const taxAmount = Math.round(basePrice * TAX_RATE)
  const artistReceives = basePrice - commissionAmount - taxAmount

  // ========== Actions ==========
  const confirm = async () => {
    setLoading(true); setErr("")
    try {
      if (isProduct) {
        await api.payments.buyProduct
          ? await api.payments.buyProduct({ product_id: product.id, amount: basePrice })
          : await api.post("/payments/buy", { product_id: product.id, amount: basePrice })
      } else if (mode === "buy") {
        await api.payments.buyTrack({ track_id: track.id, amount: basePrice })
      } else {
        await api.payments.rentTrack({ track_id: track.id, days: rentDays, amount: basePrice })
      }
      setDone(true)
      setTimeout(() => { onSuccess?.(); onClose() }, 1800)
    } catch(e) {
      setErr(e.message || "Solde insuffisant ou erreur réseau")
    }
    setLoading(false)
  }

  // ========== Labels ==========
  const modeLabel = isProduct
    ? "Acheter ce produit"
    : mode === "buy" ? "Acheter ce titre" : "Louer ce titre"
  const doneLabel = isProduct
    ? "Achat confirmé !"
    : mode === "buy" ? "Achat confirmé !" : "Location activée !"
  const doneDesc = isProduct
    ? "Le produit a été ajouté à vos achats."
    : mode === "buy" ? "Vous pouvez écouter ce titre en illimité."
    : `Accès valable ${rentDays} jours.`
  const btnLabel = isProduct
    ? `Acheter — ${basePrice.toLocaleString()} ${devise.code}`
    : mode === "buy"
      ? `Acheter — ${basePrice.toLocaleString()} ${devise.code}`
      : `Louer — ${basePrice.toLocaleString()} ${devise.code}`

  // ========== Styles réutilisables ==========
  const s = {
    overlay: { position:"fixed", inset:0, background:"rgba(0,0,0,.65)", zIndex:500,
      display:"flex", alignItems:"center", justifyContent:"center", padding:16, backdropFilter:"blur(4px)" },
    card: { background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:"var(--radius)",
      padding:28, width:"100%", maxWidth:400, boxShadow:"0 24px 64px rgba(0,0,0,.5)", animation:"slideIn .2s ease" },
    row: { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0" },
    label: { fontSize:13, color:"var(--text2)" },
    value: { fontSize:13, fontWeight:600, color:"var(--text)" },
    divider: { borderTop:"1px solid var(--border)", margin:"8px 0" },
  }

  return (
    <div onClick={onClose} style={s.overlay}>
      <div onClick={e=>e.stopPropagation()} style={s.card}>

        {/* ===== CONFIRMATION ===== */}
        {done ? (
          <div style={{textAlign:"center",padding:"20px 0"}}>
            <div style={{fontSize:52,marginBottom:12}}>✅</div>
            <div style={{fontFamily:"Syne,sans-serif",fontSize:18,fontWeight:800,marginBottom:6}}>{doneLabel}</div>
            <div style={{fontSize:13,color:"var(--text2)"}}>{doneDesc}</div>
          </div>

        ) : (<>
          {/* ===== HEADER ===== */}
          <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:20}}>
            <div style={{width:56,height:56,borderRadius:10,
              background:"linear-gradient(135deg,var(--gold),#e8920a)",
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>
              {itemEmoji}
            </div>
            <div>
              <div style={{fontFamily:"Syne,sans-serif",fontSize:17,fontWeight:800}}>{modeLabel}</div>
              <div style={{fontSize:12,color:"var(--text2)",marginTop:3}}>{itemTitle}</div>
            </div>
          </div>

          {/* ===== PRIX PRINCIPAL ===== */}
          <div style={{background:"var(--card)",border:"1px solid var(--border)",
            borderRadius:"var(--radius-sm)",padding:16,marginBottom:12}}>

            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <span style={{fontSize:13,color:"var(--text2)"}}>
                {isProduct ? "Achat produit" : mode==="buy" ? "Achat définitif" : `Location ${rentDays} jours`}
              </span>
              <span style={{fontFamily:"Syne,sans-serif",fontSize:22,fontWeight:800,color:"var(--gold)"}}>
                {basePrice.toLocaleString()} {devise.code}
              </span>
            </div>

            {!isProduct && mode==="rent" && (
              <div style={{fontSize:11,color:"var(--text3)"}}>
                Accès illimité pendant {rentDays} jours · Renouvellement possible
              </div>
            )}
            {!isProduct && mode==="buy" && (
              <div style={{fontSize:11,color:"var(--text3)"}}>
                Accès illimité · Téléchargement · Pas de pub
              </div>
            )}
          </div>

          {/* ===== DÉTAIL COMMISSION / TAXES (toggle) ===== */}
          <div style={{marginBottom:12}}>
            <button
              onClick={() => setShowDetail(!showDetail)}
              style={{background:"none",border:"none",color:"var(--gold)",fontSize:12,
                cursor:"pointer",fontFamily:"Plus Jakarta Sans,sans-serif",fontWeight:600,
                display:"flex",alignItems:"center",gap:4,padding:"4px 0"}}
            >
              <span style={{transform:showDetail?"rotate(90deg)":"rotate(0)",transition:"transform .2s",display:"inline-block"}}>▸</span>
              Voir le détail de la répartition
            </button>

            {showDetail && (
              <div style={{background:"var(--card)",border:"1px solid var(--border)",
                borderRadius:"var(--radius-sm)",padding:14,marginTop:8,animation:"slideIn .15s ease"}}>

                <div style={s.row}>
                  <span style={s.label}>🎵 Revenu artiste/créateur</span>
                  <span style={{...s.value,color:"var(--green,#2cc653)"}}>
                    {artistReceives.toLocaleString()} {devise.code}
                  </span>
                </div>

                <div style={s.row}>
                  <span style={s.label}>🏷️ Commission Waiichia ({Math.round(COMMISSION_RATE*100)}%)</span>
                  <span style={s.value}>{commissionAmount.toLocaleString()} {devise.code}</span>
                </div>

                {TAX_RATE > 0 && (
                  <div style={s.row}>
                    <span style={s.label}>📋 TVA ({Math.round(TAX_RATE*100)}%)</span>
                    <span style={s.value}>{taxAmount.toLocaleString()} {devise.code}</span>
                  </div>
                )}

                <div style={s.divider}></div>

                <div style={s.row}>
                  <span style={{fontSize:13,fontWeight:700,color:"var(--text)"}}>Total débité</span>
                  <span style={{fontFamily:"Syne,sans-serif",fontSize:15,fontWeight:800,color:"var(--gold)"}}>
                    {basePrice.toLocaleString()} {devise.code}
                  </span>
                </div>

                <div style={{fontSize:10,color:"var(--text3)",marginTop:8,lineHeight:1.5}}>
                  💡 La commission permet à Waiichia de fonctionner et de rémunérer les artistes de manière transparente.
                </div>
              </div>
            )}
          </div>

          {/* ===== WALLET INFO ===== */}
          <div style={{background:"rgba(44,198,83,.06)",border:"1px solid rgba(44,198,83,.2)",
            borderRadius:"var(--radius-sm)",padding:12,marginBottom:16,display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:16}}>💰</span>
            <span style={{fontSize:12,color:"var(--text2)"}}>Débit depuis votre Wallet Waiichia</span>
          </div>

          {/* ===== ERREUR ===== */}
          {err && (
            <div style={{background:"rgba(230,57,70,.1)",border:"1px solid rgba(230,57,70,.3)",
              borderRadius:"var(--radius-sm)",padding:10,marginBottom:14,fontSize:12,color:"var(--red)"}}>
              ⚠️ {err}
            </div>
          )}

          {/* ===== BOUTONS ===== */}
          <div style={{display:"flex",gap:10}}>
            <button onClick={onClose} style={{flex:1,padding:"11px",borderRadius:50,
              border:"1px solid var(--border)",background:"transparent",color:"var(--text2)",
              fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"Plus Jakarta Sans,sans-serif"}}>
              Annuler
            </button>
            <button onClick={confirm} disabled={loading}
              style={{flex:2,padding:"11px",borderRadius:50,border:"none",
                background:loading?"var(--border)":"linear-gradient(135deg,var(--gold),#e8920a)",
                color:"#000",fontSize:13,fontWeight:700,
                cursor:loading?"not-allowed":"pointer",
                fontFamily:"Plus Jakarta Sans,sans-serif",
                boxShadow:"0 4px 16px rgba(245,166,35,.3)"}}>
              {loading ? "Traitement..." : btnLabel}
            </button>
          </div>
        </>)}
      </div>
    </div>
  )
}
