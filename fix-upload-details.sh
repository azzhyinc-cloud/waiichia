#!/bin/bash
# ═══════════════════════════════════════════════════
# CORRECTIF UPLOAD — CSS manquant + champs manquants
# ═══════════════════════════════════════════════════

echo "🛑 Arrêt serveur frontend..."
pkill -f "vite" 2>/dev/null
sleep 1

# ═══════════════════════════════════════
# 1. AJOUTER TOUS LES CSS MANQUANTS
# ═══════════════════════════════════════
cat >> /workspaces/waiichia/apps/web/src/prototype-v7.css << 'CSSEOF'

/* ═══ PRICING MODES (Upload monétisation) ═══ */
.pricing-modes {
  display:flex;gap:8px;margin-bottom:14px;
}
.pricing-mode {
  flex:1;padding:10px 8px;border-radius:var(--radius-sm);
  border:2px solid var(--border);text-align:center;
  cursor:pointer;transition:all 0.18s;background:var(--card);
}
.pricing-mode:hover { border-color:rgba(245,166,35,.4); }
.pricing-mode.sel { border-color:var(--gold);background:rgba(245,166,35,.08); }
.pricing-mode-icon { font-size:20px;margin-bottom:3px; }
.pricing-mode-label { font-size:11.5px;font-weight:700; }

/* ═══ RENTAL GRID (tarifs location) ═══ */
.rental-grid {
  display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-top:12px;
}
.rental-period-input {
  display:flex;flex-direction:column;gap:5px;
  background:var(--bg2);border:1px solid var(--border);
  border-radius:var(--radius-sm);padding:12px;
}
.rental-period-label {
  font-size:11px;color:var(--text2);font-weight:600;
  text-transform:uppercase;letter-spacing:.8px;
}

/* ═══ TOGGLE SWITCH ═══ */
.toggle-switch {
  width:42px;height:22px;background:var(--green);
  border-radius:50px;position:relative;cursor:pointer;
  transition:background 0.2s;flex-shrink:0;
}
.toggle-switch::after {
  content:'';position:absolute;width:16px;height:16px;
  background:#fff;border-radius:50%;top:3px;left:23px;
  transition:left 0.2s;box-shadow:0 1px 3px rgba(0,0,0,.3);
}
.toggle-switch.off { background:var(--border2); }
.toggle-switch.off::after { left:3px; }

/* ═══ UPLOAD STEPS BAR (Podcast/Émission) ═══ */
.upload-steps-bar {
  display:flex;align-items:center;margin-bottom:22px;
  background:var(--bg2);border:1px solid var(--border);
  border-radius:var(--radius);padding:6px;gap:2px;
}
.upload-step {
  display:flex;align-items:center;gap:6px;padding:8px 14px;
  border-radius:calc(var(--radius) - 4px);cursor:pointer;
  font-size:13px;color:var(--text2);font-weight:500;
  transition:all .2s;flex:1;justify-content:center;
}
.upload-step.active {
  background:var(--card);color:var(--text);font-weight:700;
  box-shadow:0 1px 4px rgba(0,0,0,.2);
}
.upload-step.done { color:var(--green); }
.upload-step-sep { width:1px;height:20px;background:var(--border);flex-shrink:0; }
.step-num {
  width:22px;height:22px;border-radius:50%;background:var(--border);
  display:flex;align-items:center;justify-content:center;
  font-size:11px;font-weight:700;flex-shrink:0;
}
.upload-step.active .step-num { background:var(--gold);color:#000; }
.upload-step.done .step-num { background:var(--green);color:#fff; }

/* ═══ ALBUM TRACK ROWS ═══ */
.album-track-row {
  display:flex;align-items:flex-start;gap:12px;
  padding:14px;background:var(--bg2);border:1px solid var(--border);
  border-radius:var(--radius-sm);margin-bottom:8px;
}
.track-row-num {
  width:26px;height:26px;border-radius:50%;background:var(--border);
  display:flex;align-items:center;justify-content:center;
  font-size:12px;font-weight:700;flex-shrink:0;margin-top:10px;
}
.track-row-body { flex:1;min-width:0; }
.track-row-remove {
  width:26px;height:26px;border-radius:50%;border:1px solid var(--border);
  background:none;color:var(--text3);cursor:pointer;font-size:12px;
  display:flex;align-items:center;justify-content:center;flex-shrink:0;
  margin-top:8px;transition:all .15s;
}
.track-row-remove:hover { background:rgba(230,57,70,.15);border-color:var(--red);color:var(--red); }

/* ═══ EPISODE BLOCKS (Podcast/Émission) ═══ */
.episode-block {
  background:var(--bg2);border:1px solid var(--border);
  border-radius:var(--radius);margin-bottom:12px;overflow:hidden;
}
.episode-block-header {
  display:flex;align-items:center;gap:10px;
  padding:12px 14px;background:var(--card);
  border-bottom:1px solid var(--border);
}
.episode-block-body { padding:14px; }
.episode-num-badge {
  background:rgba(77,159,255,.12);color:var(--blue);
  font-size:11px;font-weight:700;padding:3px 9px;border-radius:12px;
  font-family:'Space Mono',monospace;white-space:nowrap;flex-shrink:0;
}
.episode-remove-btn {
  margin-left:auto;width:26px;height:26px;border-radius:50%;
  border:1px solid var(--border);background:none;color:var(--text3);
  cursor:pointer;font-size:12px;transition:all .15s;flex-shrink:0;
}
.episode-remove-btn:hover { background:rgba(230,57,70,.15);border-color:var(--red);color:var(--red); }

/* ═══ DOC UPLOAD ROWS (Flux Média) ═══ */
.doc-upload-row {
  display:flex;align-items:center;justify-content:space-between;gap:12px;
  padding:12px 14px;background:var(--bg2);border:1px solid var(--border);
  border-radius:var(--radius-sm);
}
.doc-upload-label { display:flex;align-items:center;gap:10px;flex:1;min-width:0; }
.upload-mini-btn {
  padding:7px 12px;background:var(--card);border:1px solid var(--border);
  border-radius:var(--radius-sm);font-size:12px;color:var(--text);
  cursor:pointer;white-space:nowrap;transition:all .15s;
}
.upload-mini-btn:hover { border-color:var(--gold);color:var(--gold); }

/* ═══ FEATURING SEARCH ═══ */
.feat-search-wrap { position:relative; }
.feat-results {
  position:absolute;top:100%;left:0;right:0;
  background:var(--card2);border:1px solid var(--border2);
  border-radius:var(--radius-sm);z-index:50;
  max-height:180px;overflow-y:auto;
}
.feat-user {
  display:flex;align-items:center;gap:10px;
  padding:10px 14px;cursor:pointer;transition:background 0.15s;
}
.feat-user:hover { background:var(--card3); }
.feat-user-ava {
  width:32px;height:32px;border-radius:50%;
  display:flex;align-items:center;justify-content:center;
  font-size:13px;font-weight:700;
}
.feat-tags-wrap { display:flex;flex-wrap:wrap;gap:6px;margin-top:8px; }
.feat-tag {
  display:flex;align-items:center;gap:4px;padding:4px 10px;
  background:rgba(77,159,255,.12);border:1px solid rgba(77,159,255,.3);
  border-radius:20px;font-size:12px;color:var(--blue);
}
.feat-tag .rm { cursor:pointer;color:var(--text3); }

/* ═══ TAG INPUT (Upload) ═══ */
.tag-input-wrap {
  display:flex;gap:8px;align-items:center;flex-wrap:wrap;
  background:var(--card);border:1px solid var(--border);
  border-radius:var(--radius-sm);padding:8px 12px;min-height:44px;
}
.tag-pill {
  display:flex;align-items:center;gap:4px;
  padding:3px 10px;background:rgba(245,166,35,.15);
  border:1px solid rgba(245,166,35,.3);border-radius:20px;
  font-size:12px;color:var(--gold);
}
.tag-pill .remove { cursor:pointer;color:var(--text3);font-size:10px; }
.tag-pill .remove:hover { color:var(--red); }
.tag-input {
  border:none;background:transparent;color:var(--text);
  font-size:13px;font-family:'Plus Jakarta Sans',sans-serif;
  outline:none;flex:1;min-width:100px;
}

/* ═══ PRICING SECTION BOX ═══ */
.pricing-section {
  background:linear-gradient(135deg,rgba(77,159,255,.05),rgba(245,166,35,.04));
  border:1px solid rgba(77,159,255,.2);
  border-radius:var(--radius-sm);padding:18px;margin-bottom:18px;
}

/* ═══ RESPONSIVE UPLOAD ═══ */
@media(max-width:600px) {
  .pricing-modes { flex-direction:column; }
  .rental-grid { grid-template-columns:1fr; }
  .form-row { grid-template-columns:1fr !important; }
  .upload-steps-bar { flex-wrap:wrap; }
  .upload-step { font-size:12px;padding:6px 10px; }
  .doc-upload-row { flex-direction:column;align-items:flex-start; }
  .doc-upload-label { flex-direction:column;align-items:flex-start;gap:6px; }
}
CSSEOF
echo "✅ CSS ajouté : pricing-modes, rental-grid, toggle, steps-bar, episode-blocks, album-tracks, featuring, tags"

# ═══════════════════════════════════════
# 2. PATCHER Upload.jsx — Ajouter le Featuring dans le formulaire Son
# ═══════════════════════════════════════
cd /workspaces/waiichia/apps/web/src/pages

python3 << 'PYFIX'
content = open('Upload.jsx').read()

# Trouver la section Description dans FormSon et ajouter Featuring avant
old_desc = """    {/* DESCRIPTION */}
    <div className="form-group"><label className="label">Description / Paroles</label><textarea className="textarea-field" value={form.description} onChange={e=>set('description',e.target.value)} placeholder="Décrivez votre son, vos inspirations, les paroles..."/></div>"""

new_with_feat = """    {/* FEATURING */}
    <div className="form-group">
      <label className="label">🎤 Featuring / Coproduction</label>
      <div className="feat-search-wrap">
        <input className="input-field" placeholder="Rechercher un artiste sur Waiichia..." value={form.featuring||''} onChange={e=>set('featuring',e.target.value)}/>
      </div>
      {form.featuring&&<div className="feat-tags-wrap"><div className="feat-tag">{form.featuring} <span className="rm" onClick={()=>set('featuring','')}>✕</span></div></div>}
    </div>

    {/* DESCRIPTION */}
    <div className="form-group"><label className="label">Description / Paroles</label><textarea className="textarea-field" value={form.description} onChange={e=>set('description',e.target.value)} placeholder="Décrivez votre son, vos inspirations, les paroles..."/></div>"""

content = content.replace(old_desc, new_with_feat)

# Ajouter featuring dans le form state si manquant
if "featuring:''" not in content:
    content = content.replace(
        "sale_price:'',sale_currency:'KMF'",
        "sale_price:'',sale_currency:'KMF',featuring:''"
    )

# Corriger la rental grid dans FormSon pour utiliser les classes CSS prototype
old_rental = """        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
          {[['rent_day','📅 Journalier','150'],['rent_week','📅 Hebdomadaire','600'],['rent_month','📅 Mensuel','1800']].map(([k,label,ph])=>(
            <div key={k} style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',padding:12}}>
              <div style={{fontSize:11,fontWeight:700,color:'var(--text2)',marginBottom:8}}>{label}</div>
              <div style={{display:'flex',gap:6}}>
                <input className="input-field" type="number" value={form[k]} onChange={e=>set(k,e.target.value)} placeholder={ph} style={{flex:1,fontSize:13}}/>
                <select className="select-styled" value={form.rent_currency} onChange={e=>set('rent_currency',e.target.value)} style={{fontSize:12}}><option>KMF</option><option>USD</option></select>
              </div>
            </div>
          ))}
        </div>"""

new_rental = """        <div className="rental-grid">
          {[['rent_day','📅 Journalier','150'],['rent_week','📅 Hebdomadaire','600'],['rent_month','📅 Mensuel','1800']].map(([k,label,ph])=>(
            <div key={k} className="rental-period-input">
              <div className="rental-period-label">{label}</div>
              <div style={{display:'flex',gap:6}}>
                <input className="input-field" type="number" value={form[k]} onChange={e=>set(k,e.target.value)} placeholder={ph} style={{flex:1,fontSize:13}}/>
                <select className="select-styled" value={form.rent_currency} onChange={e=>set('rent_currency',e.target.value)} style={{fontSize:12}}><option>KMF</option><option>USD</option></select>
              </div>
            </div>
          ))}
        </div>"""

content = content.replace(old_rental, new_rental)

# Corriger les pricing modes dans FormSon pour utiliser les classes CSS prototype
old_pricing = """      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:14}}>
        {PM.map(([id,icon,label])=>(<div key={id} onClick={()=>setPricingMode(id)} style={{background:pricingMode===id?'rgba(245,166,35,.1)':'var(--card)',border:`2px solid ${pricingMode===id?'var(--gold)':'var(--border)'}`,borderRadius:'var(--radius-sm)',padding:'14px 8px',textAlign:'center',cursor:'pointer',transition:'all .18s'}}>
          <div style={{fontSize:22,marginBottom:6}}>{icon}</div>
          <div style={{fontSize:11,fontWeight:700,color:pricingMode===id?'var(--gold)':'var(--text2)'}}>{label}</div>
        </div>))}
      </div>"""

new_pricing = """      <div className="pricing-modes">
        {PM.map(([id,icon,label])=>(<div key={id} className={`pricing-mode${pricingMode===id?' sel':''}`} onClick={()=>setPricingMode(id)}>
          <div className="pricing-mode-icon">{icon}</div>
          <div className="pricing-mode-label">{label}</div>
        </div>))}
      </div>"""

content = content.replace(old_pricing, new_pricing)

# Corriger les pricing modes dans FormAlbum aussi
old_album_pricing = """      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
        {[['free','🎁','Gratuit'],['buy','🛒','À la vente'],['sub','💎','Abonnés only']].map(([id,icon,label])=>(<div key={id} onClick={()=>setPricingMode(id)} style={{background:pricingMode===id?'rgba(245,166,35,.1)':'var(--card)',border:`2px solid ${pricingMode===id?'var(--gold)':'var(--border)'}`,borderRadius:'var(--radius-sm)',padding:'14px 8px',textAlign:'center',cursor:'pointer',transition:'all .18s'}}>
          <div style={{fontSize:22,marginBottom:6}}>{icon}</div><div style={{fontSize:11,fontWeight:700,color:pricingMode===id?'var(--gold)':'var(--text2)'}}>{label}</div>
        </div>))}
      </div>"""

new_album_pricing = """      <div className="pricing-modes">
        {[['free','🎁','Gratuit'],['buy','🛒','À la vente'],['sub','💎','Abonnés only']].map(([id,icon,label])=>(<div key={id} className={`pricing-mode${pricingMode===id?' sel':''}`} onClick={()=>setPricingMode(id)}>
          <div className="pricing-mode-icon">{icon}</div>
          <div className="pricing-mode-label">{label}</div>
        </div>))}
      </div>"""

content = content.replace(old_album_pricing, new_album_pricing)

open('Upload.jsx', 'w').write(content)
print("OK")
PYFIX

echo "✅ Upload.jsx patché : Featuring ajouté, pricing-modes en CSS classes, rental-grid en CSS classes"

# ═══════════════════════════════════════
# 3. RELANCER
# ═══════════════════════════════════════
echo ""
echo "🚀 Relancement..."
cd /workspaces/waiichia
pnpm --filter web run dev

echo ""
echo "═══════════════════════════════════════════════════"
echo "  CORRECTIFS UPLOAD APPLIQUÉS !"
echo "  ✅ CSS : pricing-modes (cartes monétisation)"
echo "  ✅ CSS : rental-grid (tarifs location 3 colonnes)"
echo "  ✅ CSS : toggle-switch"
echo "  ✅ CSS : upload-steps-bar (barre d'étapes Podcast/Émission)"
echo "  ✅ CSS : episode-block (blocs épisodes)"
echo "  ✅ CSS : album-track-row (pistes album)"
echo "  ✅ CSS : doc-upload-row (documents Flux Média)"
echo "  ✅ CSS : feat-search / feat-tag (featuring)"
echo "  ✅ CSS : tag-input-wrap / tag-pill (tags)"
echo "  ✅ CSS : responsive mobile pour tous les formulaires"
echo "  ✅ JSX : Champ Featuring ajouté au formulaire Son"
echo "  ✅ JSX : Pricing modes utilisent les classes CSS prototype"
echo "  ✅ JSX : Rental grid utilise les classes CSS prototype"
echo "═══════════════════════════════════════════════════"
