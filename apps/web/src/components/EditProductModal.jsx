import { useState, useEffect } from "react"
import api from "../services/api.js"

const CATS = [
  ['merch','👕','Merch'],
  ['digital','💿','Digital'],
  ['coaching','🎓','Coaching'],
  ['beats','🎵','Beats/Instru'],
  ['autre','📦','Autre']
]

export default function EditProductModal({ product, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [uploadingImg, setUploadingImg] = useState(false)
  const [err, setErr] = useState("")
  const [done, setDone] = useState(false)
  const [tagInput, setTagInput] = useState("")

  const [form, setForm] = useState({
    name: product?.name || "",
    description: product?.description || "",
    category: product?.category || "digital",
    price: product?.price || 0,
    emoji: product?.emoji || "🛍️",
    cover_url: product?.cover_url || "",
    stock: product?.stock ?? -1,
    is_active: product?.is_active !== false,
    tags: Array.isArray(product?.tags) ? product.tags : []
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // ========== Upload image ==========
  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 3 * 1024 * 1024) { setErr("Image trop lourde (max 3MB)"); return }
    setUploadingImg(true); setErr("")
    try {
      const formData = new FormData()
      formData.append("file", file)
      const token = localStorage.getItem("waiichia_token")
      const API = import.meta.env.VITE_API_URL
      const res = await fetch(API + "/api/upload/cover", {
        method: "POST",
        headers: { "Authorization": "Bearer " + token },
        body: formData
      })
      const data = await res.json()
      if (data.url) set("cover_url", data.url)
      else setErr(data.error || "Erreur upload")
    } catch (e) { setErr("Erreur upload: " + e.message) }
    setUploadingImg(false)
  }

  // ========== Tags ==========
  const addTag = () => {
    const t = tagInput.trim()
    if (!t) return
    if (form.tags.includes(t)) { setTagInput(""); return }
    if (form.tags.length >= 10) { setErr("Max 10 tags"); return }
    set("tags", [...form.tags, t])
    setTagInput("")
  }
  const removeTag = (t) => set("tags", form.tags.filter(x => x !== t))

  // ========== Save ==========
  const save = async () => {
    if (!form.name.trim()) { setErr("Le nom est requis"); return }
    if (!form.price || parseInt(form.price) <= 0) { setErr("Prix invalide"); return }
    setLoading(true); setErr("")
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description,
        category: form.category,
        price: parseInt(form.price),
        emoji: form.emoji,
        cover_url: form.cover_url || null,
        stock: parseInt(form.stock),
        is_active: !!form.is_active,
        tags: form.tags
      }
      const res = await api.products.update(product.id, payload)
      setDone(true)
      setTimeout(() => { onSuccess?.(res.product); onClose() }, 1200)
    } catch (e) {
      setErr(e.message || "Erreur lors de la modification")
    }
    setLoading(false)
  }

  // ========== Styles réutilisables (calqués sur BuyModal) ==========
  const s = {
    overlay: { position:"fixed", inset:0, background:"rgba(0,0,0,.65)", zIndex:500,
      display:"flex", alignItems:"center", justifyContent:"center", padding:16, backdropFilter:"blur(4px)" },
    card: { background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:"var(--radius)",
      padding:24, width:"100%", maxWidth:480, maxHeight:"92vh", overflowY:"auto",
      boxShadow:"0 24px 64px rgba(0,0,0,.5)", animation:"slideIn .2s ease" },
    lbl: { display:"block", fontSize:11, fontWeight:700, letterSpacing:1,
      color:"var(--text3)", marginBottom:6, textTransform:"uppercase" },
    inp: { background:"var(--card)", border:"1px solid var(--border)", borderRadius:8,
      padding:"10px 14px", color:"var(--text)", width:"100%", fontSize:14,
      boxSizing:"border-box", fontFamily:"inherit" },
    row: { marginBottom:14 },
  }

  return (
    <div onClick={onClose} style={s.overlay}>
      <div onClick={e=>e.stopPropagation()} style={s.card}>

        {/* ===== CONFIRMATION ===== */}
        {done ? (
          <div style={{textAlign:"center", padding:"20px 0"}}>
            <div style={{fontSize:52, marginBottom:12}}>✅</div>
            <div style={{fontFamily:"Syne,sans-serif", fontSize:18, fontWeight:800, marginBottom:6}}>
              Produit mis à jour !
            </div>
            <div style={{fontSize:13, color:"var(--text2)"}}>
              Les modifications ont été enregistrées.
            </div>
          </div>
        ) : (<>
          {/* ===== HEADER ===== */}
          <div style={{display:"flex", alignItems:"center", gap:14, marginBottom:20}}>
            <div style={{width:56, height:56, borderRadius:10,
              background:"linear-gradient(135deg,var(--gold),#e8920a)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:24, flexShrink:0}}>
              ✏️
            </div>
            <div style={{flex:1, minWidth:0}}>
              <div style={{fontFamily:"Syne,sans-serif", fontSize:17, fontWeight:800}}>
                Modifier le produit
              </div>
              <div style={{fontSize:12, color:"var(--text2)", marginTop:3,
                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>
                {product?.name}
              </div>
            </div>
          </div>

          {/* ===== IMAGE ===== */}
          <div style={s.row}>
            <label style={s.lbl}>Image du produit</label>
            <label style={{display:"block", cursor:"pointer"}}>
              <input type="file" accept="image/jpeg,image/png,image/webp"
                onChange={handleImageUpload} style={{display:"none"}}/>
              {form.cover_url ? (
                <div style={{position:"relative", width:"100%", height:160,
                  borderRadius:10, overflow:"hidden", border:"2px solid var(--gold)"}}>
                  <img src={form.cover_url} alt=""
                    style={{width:"100%", height:"100%", objectFit:"cover"}}/>
                  <div style={{position:"absolute", bottom:8, right:8,
                    background:"rgba(0,0,0,.7)", color:"#fff", padding:"4px 10px",
                    borderRadius:6, fontSize:11, fontWeight:600}}>
                    📷 Changer
                  </div>
                </div>
              ) : (
                <div style={{border:"2px dashed var(--border)", borderRadius:10,
                  padding:24, textAlign:"center", background:"var(--card2)"}}>
                  {uploadingImg ? (
                    <div style={{fontSize:13, color:"var(--text2)"}}>⏳ Upload...</div>
                  ) : (
                    <>
                      <div style={{fontSize:32, marginBottom:4}}>🖼️</div>
                      <div style={{fontSize:13, fontWeight:600}}>Ajouter une image</div>
                      <div style={{fontSize:11, color:"var(--text3)", marginTop:2}}>
                        JPG/PNG/WebP · max 3MB
                      </div>
                    </>
                  )}
                </div>
              )}
            </label>
            {form.cover_url && !uploadingImg && (
              <button type="button" onClick={() => set("cover_url", "")}
                style={{marginTop:6, background:"rgba(230,57,70,0.1)",
                  border:"1px solid rgba(230,57,70,0.3)", color:"var(--red)",
                  borderRadius:7, padding:"5px 12px", cursor:"pointer",
                  fontSize:12, fontWeight:600}}>
                🗑️ Retirer l'image
              </button>
            )}
          </div>

          {/* ===== NOM + CATEGORIE ===== */}
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14}}>
            <div>
              <label style={s.lbl}>Nom *</label>
              <input style={s.inp} value={form.name}
                onChange={e => set("name", e.target.value)}
                placeholder="Nom du produit"/>
            </div>
            <div>
              <label style={s.lbl}>Catégorie</label>
              <select style={s.inp} value={form.category}
                onChange={e => set("category", e.target.value)}>
                {CATS.map(([v,icon,l]) => (
                  <option key={v} value={v}>{icon} {l}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ===== DESCRIPTION ===== */}
          <div style={s.row}>
            <label style={s.lbl}>Description</label>
            <textarea style={{...s.inp, height:70, resize:"vertical"}}
              value={form.description}
              onChange={e => set("description", e.target.value)}
              placeholder="Décrivez votre produit..."/>
          </div>

          {/* ===== PRIX + EMOJI + STOCK ===== */}
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:14}}>
            <div>
              <label style={s.lbl}>Prix *</label>
              <input type="number" style={s.inp} value={form.price}
                onChange={e => set("price", e.target.value)}
                placeholder="5000"/>
            </div>
            <div>
              <label style={s.lbl}>Emoji</label>
              <input style={s.inp} value={form.emoji}
                onChange={e => set("emoji", e.target.value)}
                placeholder="🛍️" maxLength={4}/>
            </div>
            <div>
              <label style={s.lbl}>Stock</label>
              <input type="number" style={s.inp} value={form.stock}
                onChange={e => set("stock", e.target.value)}
                placeholder="-1"/>
            </div>
          </div>
          <div style={{fontSize:11, color:"var(--text3)", marginTop:-8, marginBottom:14}}>
            Stock à <b>-1</b> = illimité · Devise : <b>{product?.currency || "KMF"}</b> (non modifiable)
          </div>

          {/* ===== TAGS ===== */}
          <div style={s.row}>
            <label style={s.lbl}>Tags ({form.tags.length}/10)</label>
            <div style={{display:"flex", gap:8}}>
              <input style={s.inp} value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag() } }}
                placeholder="Ajouter un tag et Entrée"/>
              <button type="button" onClick={addTag}
                style={{background:"var(--card)", border:"1px solid var(--border)",
                  color:"var(--text)", borderRadius:8, padding:"0 16px",
                  cursor:"pointer", fontWeight:600, fontSize:13}}>
                +
              </button>
            </div>
            {form.tags.length > 0 && (
              <div style={{display:"flex", flexWrap:"wrap", gap:6, marginTop:10}}>
                {form.tags.map(t => (
                  <span key={t} style={{display:"inline-flex", alignItems:"center",
                    gap:6, background:"var(--card)", border:"1px solid var(--border)",
                    borderRadius:99, padding:"4px 10px", fontSize:12, color:"var(--text)"}}>
                    #{t}
                    <button type="button" onClick={() => removeTag(t)}
                      style={{background:"none", border:"none", color:"var(--text3)",
                        cursor:"pointer", padding:0, fontSize:14, lineHeight:1}}>
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ===== STATUT ACTIF ===== */}
          <div style={{background:"var(--card)", border:"1px solid var(--border)",
            borderRadius:"var(--radius-sm)", padding:14, marginBottom:16,
            display:"flex", alignItems:"center", justifyContent:"space-between", gap:12}}>
            <div style={{flex:1, minWidth:0}}>
              <div style={{fontSize:13, fontWeight:700, color:"var(--text)", marginBottom:3}}>
                {form.is_active ? "✅ Produit actif" : "⏸ Produit en pause"}
              </div>
              <div style={{fontSize:11, color:"var(--text3)"}}>
                {form.is_active
                  ? "Visible dans la boutique publique"
                  : "Masqué de la boutique publique"}
              </div>
            </div>
            <button type="button" onClick={() => set("is_active", !form.is_active)}
              style={{position:"relative", width:48, height:26, borderRadius:99,
                border:"none", cursor:"pointer",
                background: form.is_active ? "var(--green,#2cc653)" : "var(--border)",
                transition:"background .2s", flexShrink:0}}>
              <span style={{position:"absolute", top:3, left: form.is_active ? 25 : 3,
                width:20, height:20, borderRadius:"50%", background:"#fff",
                transition:"left .2s", boxShadow:"0 2px 4px rgba(0,0,0,.2)"}}/>
            </button>
          </div>

          {/* ===== ERREUR ===== */}
          {err && (
            <div style={{background:"rgba(230,57,70,.1)",
              border:"1px solid rgba(230,57,70,.3)",
              borderRadius:"var(--radius-sm)", padding:10, marginBottom:14,
              fontSize:12, color:"var(--red)"}}>
              ⚠️ {err}
            </div>
          )}

          {/* ===== BOUTONS ===== */}
          <div style={{display:"flex", gap:10}}>
            <button onClick={onClose} disabled={loading}
              style={{flex:1, padding:"11px", borderRadius:50,
                border:"1px solid var(--border)", background:"transparent",
                color:"var(--text2)", fontSize:13, fontWeight:600,
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily:"Plus Jakarta Sans,sans-serif"}}>
              Annuler
            </button>
            <button onClick={save} disabled={loading || uploadingImg}
              style={{flex:2, padding:"11px", borderRadius:50, border:"none",
                background: (loading || uploadingImg) ? "var(--border)"
                  : "linear-gradient(135deg,var(--gold),#e8920a)",
                color:"#000", fontSize:13, fontWeight:700,
                cursor: (loading || uploadingImg) ? "not-allowed" : "pointer",
                fontFamily:"Plus Jakarta Sans,sans-serif",
                boxShadow:"0 4px 16px rgba(245,166,35,.3)"}}>
              {loading ? "Enregistrement..." : "💾 Enregistrer"}
            </button>
          </div>
        </>)}
      </div>
    </div>
  )
}
