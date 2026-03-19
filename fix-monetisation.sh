#!/bin/bash
# ═══════════════════════════════════════════════════════════
# CORRECTIF MONÉTISATION — Tous les formulaires + vérification
# ═══════════════════════════════════════════════════════════

echo "🛑 Arrêt serveur frontend..."
pkill -f "vite" 2>/dev/null
sleep 1

echo "📝 Mise à jour Upload.jsx avec monétisation complète..."

# On patche directement les composants FormAlbum, FormPodcast, FormEmission, FormMedia
cd /workspaces/waiichia/apps/web/src/pages

python3 << 'PYEOF'
content = open('Upload.jsx').read()

# ═══════════════════════════════════════════════
# ÉTAPE 1 : Ajouter le composant MonetBlock réutilisable
# ═══════════════════════════════════════════════

# On insère un composant réutilisable juste avant "function FormSon"
monet_block = '''
/* ══ COMPOSANT RÉUTILISABLE : MONÉTISATION ══ */
function MonetBlock({isVerified, pricingMode, setPricingMode, form, set, showRental=true, showBoth=true, showPreview=true, previewSec=10, setPreviewSec=null}) {
  const PM = [['free','🎁','Gratuit']]
  if(showBoth) {
    PM.push(['buy','🛒','À la vente'])
    if(showRental) PM.push(['rent','⏳','Location'])
    PM.push(['both','🔀','Vente + Location'])
  } else {
    PM.push(['buy','🛒','À la vente'])
    if(showRental) PM.push(['rent','⏳','Location'])
  }
  const CURRENCIES = ['KMF','USD','EUR','XOF','NGN']

  if(!isVerified) return(
    <div className="upload-section-box" style={{borderColor:'rgba(245,166,35,.25)',background:'rgba(245,166,35,.04)'}}>
      <div className="upload-section-title">💰 Monétisation & Accès</div>
      <div style={{display:'flex',alignItems:'center',gap:12,padding:'14px 16px',background:'rgba(245,166,35,.06)',border:'1px solid rgba(245,166,35,.2)',borderRadius:'var(--radius-sm)'}}>
        <span style={{fontSize:24}}>🔒</span>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:'var(--gold)',marginBottom:3}}>Compte non vérifié</div>
          <div style={{fontSize:12,color:'var(--text2)',lineHeight:1.6}}>Seuls les utilisateurs vérifiés peuvent monétiser leur contenu. Votre publication sera en <strong>accès gratuit</strong>. Demandez la vérification dans Paramètres → Vérification.</div>
        </div>
      </div>
      <div style={{marginTop:12,display:'flex',alignItems:'center',gap:8}}>
        <div className="pricing-mode sel" style={{flex:'none',padding:'10px 20px'}}>
          <div className="pricing-mode-icon">🎁</div>
          <div className="pricing-mode-label">Gratuit</div>
        </div>
        <span style={{fontSize:12,color:'var(--text3)'}}>— Seule option disponible</span>
      </div>
    </div>
  )

  return(
    <div className="upload-section-box">
      <div className="upload-section-title">💰 Monétisation & Accès</div>
      <div className="pricing-modes">
        {PM.map(([id,icon,label])=>(<div key={id} className={`pricing-mode${pricingMode===id?' sel':''}`} onClick={()=>setPricingMode(id)}>
          <div className="pricing-mode-icon">{icon}</div>
          <div className="pricing-mode-label">{label}</div>
        </div>))}
      </div>

      {(pricingMode==='buy'||pricingMode==='both')&&(<div style={{marginBottom:14}}>
        <label className="label">Prix de vente (accès permanent)</label>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <input className="input-field" type="number" value={form.sale_price||''} onChange={e=>set('sale_price',e.target.value)} placeholder="Ex: 2500" style={{flex:1}}/>
          <select className="select-styled" value={form.sale_currency||'KMF'} onChange={e=>set('sale_currency',e.target.value)}>{CURRENCIES.map(c=><option key={c}>{c}</option>)}</select>
        </div>
      </div>)}

      {(pricingMode==='rent'||pricingMode==='both')&&(<div>
        <label className="label" style={{marginBottom:10}}>Tarifs de location</label>
        <div className="rental-grid">
          {[['rent_day','📅 Journalier','150'],['rent_week','📅 Hebdomadaire','600'],['rent_month','📅 Mensuel','1800']].map(([k,label,ph])=>(
            <div key={k} className="rental-period-input">
              <div className="rental-period-label">{label}</div>
              <div style={{display:'flex',gap:6}}>
                <input className="input-field" type="number" value={form[k]||''} onChange={e=>set(k,e.target.value)} placeholder={ph} style={{flex:1,fontSize:13}}/>
                <select className="select-styled" value={form.rent_currency||'KMF'} onChange={e=>set('rent_currency',e.target.value)} style={{fontSize:12}}><option>KMF</option><option>USD</option></select>
              </div>
            </div>
          ))}
        </div>
      </div>)}

      {showPreview&&pricingMode!=='free'&&setPreviewSec&&(
        <div style={{marginTop:16,padding:14,background:'rgba(245,166,35,.04)',border:'1px solid rgba(245,166,35,.15)',borderRadius:'var(--radius-sm)'}}>
          <div style={{fontSize:12,fontWeight:700,color:'var(--text2)',marginBottom:8}}>🎧 Extrait d'écoute gratuite</div>
          <div style={{display:'flex',alignItems:'center',gap:14,flexWrap:'wrap'}}>
            <input type="range" min="5" max="30" value={previewSec} onChange={e=>setPreviewSec(parseInt(e.target.value))} style={{width:120,accentColor:'var(--gold)'}}/>
            <span style={{fontFamily:'Space Mono,monospace',fontSize:14,fontWeight:700,color:'var(--gold)'}}>{previewSec}s</span>
            <div style={{fontSize:11,color:'var(--text3)'}}>Les auditeurs pourront écouter {previewSec}s gratuitement</div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ══ COMPOSANT : MONÉTISATION FLUX MÉDIA ══ */
function MonetFlux({isVerified, accessMode, setAccessMode, form, set, previewSec, setPreviewSec}) {
  if(!isVerified) return(
    <div className="upload-section-box" style={{borderColor:'rgba(245,166,35,.25)',background:'rgba(245,166,35,.04)'}}>
      <div className="upload-section-title">💰 Accès au flux</div>
      <div style={{display:'flex',alignItems:'center',gap:12,padding:'14px 16px',background:'rgba(245,166,35,.06)',border:'1px solid rgba(245,166,35,.2)',borderRadius:'var(--radius-sm)'}}>
        <span style={{fontSize:24}}>🔒</span>
        <div><div style={{fontSize:13,fontWeight:700,color:'var(--gold)',marginBottom:3}}>Compte non vérifié</div><div style={{fontSize:12,color:'var(--text2)'}}>Le flux sera en accès gratuit. Vérifiez votre compte pour monétiser.</div></div>
      </div>
    </div>
  )

  const MODES = [['free','🎁','Gratuit','Accès libre pour tous'],['subscribers','💎','Abonnés','Réservé aux abonnés'],['paid','💳','Accès payant','Paiement jour/semaine/mois/an']]
  const CURRENCIES = ['KMF','USD','EUR','XOF']

  return(<>
    <div className="upload-section-box">
      <div className="upload-section-title">💰 Accès au flux</div>
      <div className="pricing-modes">
        {MODES.map(([id,icon,label,desc])=>(<div key={id} className={`pricing-mode${accessMode===id?' sel':''}`} onClick={()=>setAccessMode(id)}>
          <div className="pricing-mode-icon">{icon}</div>
          <div className="pricing-mode-label">{label}</div>
          <div style={{fontSize:9,color:'var(--text3)',marginTop:2}}>{desc}</div>
        </div>))}
      </div>

      {accessMode==='paid'&&(<div style={{marginTop:14}}>
        <label className="label" style={{marginBottom:10}}>Tarifs d'accès au flux</label>
        <div className="rental-grid" style={{gridTemplateColumns:'1fr 1fr'}}>
          {[['flux_day','📅 Par jour','100'],['flux_week','📅 Par semaine','500'],['flux_month','📅 Par mois','1500'],['flux_year','📅 Par an','12000']].map(([k,label,ph])=>(
            <div key={k} className="rental-period-input">
              <div className="rental-period-label">{label}</div>
              <div style={{display:'flex',gap:6}}>
                <input className="input-field" type="number" value={form[k]||''} onChange={e=>set(k,e.target.value)} placeholder={ph} style={{flex:1,fontSize:13}}/>
                <select className="select-styled" value={form.flux_currency||'KMF'} onChange={e=>set('flux_currency',e.target.value)} style={{fontSize:12}}>{CURRENCIES.map(c=><option key={c}>{c}</option>)}</select>
              </div>
            </div>
          ))}
        </div>
      </div>)}

      {accessMode!=='free'&&(
        <div style={{marginTop:16,padding:14,background:'rgba(245,166,35,.04)',border:'1px solid rgba(245,166,35,.15)',borderRadius:'var(--radius-sm)'}}>
          <div style={{fontSize:12,fontWeight:700,color:'var(--text2)',marginBottom:8}}>🎧 Extrait d'écoute gratuite</div>
          <div style={{fontSize:12,color:'var(--text3)',marginBottom:10}}>Permettez aux auditeurs d'écouter un extrait avant de s'abonner ou payer.</div>
          <div style={{display:'flex',alignItems:'center',gap:14,flexWrap:'wrap'}}>
            <input type="range" min="10" max="120" value={previewSec} onChange={e=>setPreviewSec(parseInt(e.target.value))} style={{width:140,accentColor:'var(--gold)'}}/>
            <span style={{fontFamily:'Space Mono,monospace',fontSize:14,fontWeight:700,color:'var(--gold)'}}>{previewSec>=60?Math.floor(previewSec/60)+'min'+((previewSec%60>0)?(previewSec%60+'s'):''):previewSec+'s'}</span>
          </div>
        </div>
      )}
    </div>
  </>)
}

'''

# Insérer avant "function FormSon"
content = content.replace(
    "function FormSon(",
    monet_block + "\nfunction FormSon("
)

# ═══════════════════════════════════════════════
# ÉTAPE 2 : Passer isVerified au composant principal
# ═══════════════════════════════════════════════

# Dans la fonction Upload principale, passer user.is_verified aux sous-formulaires
content = content.replace(
    "{activeTab==='son'&&<FormSon",
    "{activeTab==='son'&&<FormSon isVerified={!!user?.is_verified}"
)
content = content.replace(
    "{activeTab==='album'&&<FormAlbum",
    "{activeTab==='album'&&<FormAlbum isVerified={!!user?.is_verified}"
)
content = content.replace(
    "{activeTab==='podcast'&&<FormPodcast",
    "{activeTab==='podcast'&&<FormPodcast isVerified={!!user?.is_verified}"
)
content = content.replace(
    "{activeTab==='emission'&&<FormEmission",
    "{activeTab==='emission'&&<FormEmission isVerified={!!user?.is_verified}"
)
content = content.replace(
    "{activeTab==='media'&&<FormMedia",
    "{activeTab==='media'&&<FormMedia isVerified={!!user?.is_verified}"
)

# Ajouter />} si not already closed properly
for old, new in [("FormSon isVerified={!!user?.is_verified} uploadFile", "FormSon isVerified={!!user?.is_verified} uploadFile")]:
    pass  # already correct

# ═══════════════════════════════════════════════
# ÉTAPE 3 : Modifier FormSon pour utiliser MonetBlock
# ═══════════════════════════════════════════════

# Ajouter isVerified au destructuring de FormSon
content = content.replace(
    "function FormSon({uploadFile,",
    "function FormSon({isVerified,uploadFile,"
)

# Remplacer l'ancien bloc monétisation Son par MonetBlock
old_son_monet = """    {/* MONÉTISATION */}
    <div className="upload-section-box">
      <div className="upload-section-title">💰 Monétisation & Accès</div>
      <div className="pricing-modes">
        {PM.map(([id,icon,label])=>(<div key={id} className={`pricing-mode${pricingMode===id?' sel':''}`} onClick={()=>setPricingMode(id)}>
          <div className="pricing-mode-icon">{icon}</div>
          <div className="pricing-mode-label">{label}</div>
        </div>))}
      </div>

      {/* Prix de vente */}
      {(pricingMode==='buy'||pricingMode==='both')&&(<div style={{marginBottom:14}}>
        <label className="label">Prix de vente (accès permanent)</label>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <input className="input-field" type="number" value={form.sale_price} onChange={e=>set('sale_price',e.target.value)} placeholder="Ex: 2500" style={{flex:1}}/>
          <select className="select-styled" value={form.sale_currency} onChange={e=>set('sale_currency',e.target.value)}>{CURRENCIES.map(c=><option key={c}>{c}</option>)}</select>
        </div>
      </div>)}

      {/* Tarifs de location */}
      {(pricingMode==='rent'||pricingMode==='both')&&(<div>
        <label className="label" style={{marginBottom:10}}>Tarifs de location</label>
        <div className="rental-grid">
          {[['rent_day','📅 Journalier','150'],['rent_week','📅 Hebdomadaire','600'],['rent_month','📅 Mensuel','1800']].map(([k,label,ph])=>(
            <div key={k} className="rental-period-input">
              <div className="rental-period-label">{label}</div>
              <div style={{display:'flex',gap:6}}>
                <input className="input-field" type="number" value={form[k]} onChange={e=>set(k,e.target.value)} placeholder={ph} style={{flex:1,fontSize:13}}/>
                <select className="select-styled" value={form.rent_currency} onChange={e=>set('rent_currency',e.target.value)} style={{fontSize:12}}><option>KMF</option><option>USD</option></select>
              </div>
            </div>
          ))}
        </div>
      </div>)}
    </div>"""

new_son_monet = """    {/* MONÉTISATION */}
    <MonetBlock isVerified={isVerified} pricingMode={pricingMode} setPricingMode={setPricingMode} form={form} set={set} showPreview={true} previewSec={previewSec} setPreviewSec={setPreviewSec}/>"""

content = content.replace(old_son_monet, new_son_monet)

# ═══════════════════════════════════════════════
# ÉTAPE 4 : Modifier FormAlbum pour ajouter monétisation complète
# ═══════════════════════════════════════════════

# Ajouter isVerified et state
content = content.replace(
    "function FormAlbum(){",
    "function FormAlbum({isVerified}){"
)
content = content.replace(
    "function FormAlbum(){\n  const [coverPreview,setCoverPreview]=useState('')\n  const [pricingMode,setPricingMode]=useState('free')",
    "function FormAlbum({isVerified}){\n  const [coverPreview,setCoverPreview]=useState('')\n  const [pricingMode,setPricingMode]=useState('free')\n  const [form,setForm]=useState({sale_price:'',sale_currency:'KMF',rent_day:'',rent_week:'',rent_month:'',rent_currency:'KMF'})\n  const set=(k,v)=>setForm(f=>({...f,[k]:v}))\n  const [previewSec,setPreviewSec]=useState(15)"
)

# Remplacer l'ancien bloc monétisation Album
old_album_monet_start = """    {/* MONÉTISATION */}
    <div className="upload-section-box">
      <div className="upload-section-title">💰 Accès & Prix de l'album</div>
      <div className="pricing-modes">
        {[['free','🎁','Gratuit'],['buy','🛒','À la vente'],['sub','💎','Abonnés only']].map(([id,icon,label])=>(<div key={id} className={`pricing-mode${pricingMode===id?' sel':''}`} onClick={()=>setPricingMode(id)}>
          <div className="pricing-mode-icon">{icon}</div>
          <div className="pricing-mode-label">{label}</div>
        </div>))}
      </div>
      {pricingMode==='buy'&&(<div style={{marginTop:14}}>
        <label className="label">Prix de l'album complet</label>
        <div style={{display:'flex',gap:8}}><input className="input-field" type="number" placeholder="Ex: 5000" style={{flex:1}}/><select className="select-styled">{CURRENCIES.map(c=><option key={c}>{c}</option>)}</select></div>
      </div>)}
    </div>"""

new_album_monet = """    {/* MONÉTISATION */}
    <MonetBlock isVerified={isVerified} pricingMode={pricingMode} setPricingMode={setPricingMode} form={form} set={set} showRental={true} showBoth={true} showPreview={true} previewSec={previewSec} setPreviewSec={setPreviewSec}/>"""

content = content.replace(old_album_monet_start, new_album_monet)

# ═══════════════════════════════════════════════
# ÉTAPE 5 : Modifier FormPodcast pour ajouter monétisation (PAS de flux)
# ═══════════════════════════════════════════════

content = content.replace(
    "function FormPodcast(){",
    "function FormPodcast({isVerified}){"
)
content = content.replace(
    "function FormPodcast({isVerified}){\n  const [step,setStep]=useState(1)",
    "function FormPodcast({isVerified}){\n  const [step,setStep]=useState(1)\n  const [pricingMode,setPricingMode]=useState('free')\n  const [formP,setFormP]=useState({sale_price:'',sale_currency:'KMF',rent_day:'',rent_week:'',rent_month:'',rent_currency:'KMF'})\n  const setP=(k,v)=>setFormP(f=>({...f,[k]:v}))\n  const [previewSec,setPreviewSec]=useState(15)"
)

# Remplacer la monétisation podcast (step 3)
old_pod_monet = """      <div className="upload-section-box"><div className="upload-section-title">💰 Monétisation du podcast</div>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>{['💰 Revenus publicitaires (automatique)','💎 Contenu premium pour abonnés','🎁 Tips / Soutiens des auditeurs'].map((t,i)=>(<label key={t} style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer'}}><input type="checkbox" defaultChecked={i===0} style={{accentColor:'var(--gold)'}}/><div style={{fontSize:13}}>{t}</div></label>))}</div>
      </div>"""

new_pod_monet = """      <MonetBlock isVerified={isVerified} pricingMode={pricingMode} setPricingMode={setPricingMode} form={formP} set={setP} showRental={true} showBoth={true} showPreview={true} previewSec={previewSec} setPreviewSec={setPreviewSec}/>
      <div className="upload-section-box"><div className="upload-section-title">📡 Revenus complémentaires</div>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>{['💰 Revenus publicitaires (automatique)','🎁 Tips / Soutiens des auditeurs'].map((t,i)=>(<label key={t} style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer'}}><input type="checkbox" defaultChecked={i===0} style={{accentColor:'var(--gold)'}}/><div style={{fontSize:13}}>{t}</div></label>))}</div>
      </div>"""

content = content.replace(old_pod_monet, new_pod_monet)

# ═══════════════════════════════════════════════
# ÉTAPE 6 : Modifier FormEmission pour ajouter monétisation
# ═══════════════════════════════════════════════

content = content.replace(
    "function FormEmission(){",
    "function FormEmission({isVerified}){"
)
content = content.replace(
    "function FormEmission({isVerified}){\n  const [step,setStep]=useState(1)",
    "function FormEmission({isVerified}){\n  const [step,setStep]=useState(1)\n  const [pricingMode,setPricingMode]=useState('free')\n  const [formE,setFormE]=useState({sale_price:'',sale_currency:'KMF',rent_day:'',rent_week:'',rent_month:'',rent_currency:'KMF'})\n  const setE=(k,v)=>setFormE(f=>({...f,[k]:v}))\n  const [previewSec,setPreviewSec]=useState(20)"
)

# Remplacer la monétisation émission (step 3)
old_em_monet = """      <div className="upload-section-box"><div className="upload-section-title">💰 Monétisation</div>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>{['💰 Revenus publicitaires (automatique)','💎 Certains épisodes en accès premium','🛍️ Boutique associée à l\\'émission'].map((t,i)=>(<label key={t} style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer'}}><input type="checkbox" defaultChecked={i===0} style={{accentColor:'var(--gold)'}}/><div style={{fontSize:13}}>{t}</div></label>))}</div>
      </div>"""

new_em_monet = """      <MonetBlock isVerified={isVerified} pricingMode={pricingMode} setPricingMode={setPricingMode} form={formE} set={setE} showRental={true} showBoth={true} showPreview={true} previewSec={previewSec} setPreviewSec={setPreviewSec}/>
      <div className="upload-section-box"><div className="upload-section-title">📡 Revenus complémentaires</div>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>{['💰 Revenus publicitaires (automatique)','🛍️ Boutique associée à l\\'émission'].map((t,i)=>(<label key={t} style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer'}}><input type="checkbox" defaultChecked={i===0} style={{accentColor:'var(--gold)'}}/><div style={{fontSize:13}}>{t}</div></label>))}</div>
      </div>"""

content = content.replace(old_em_monet, new_em_monet)

# ═══════════════════════════════════════════════
# ÉTAPE 7 : Modifier FormMedia pour monétisation flux
# ═══════════════════════════════════════════════

content = content.replace(
    "function FormMedia(){",
    "function FormMedia({isVerified}){"
)
content = content.replace(
    "function FormMedia({isVerified}){\n  const [coverPreview,setCoverPreview]=useState('')",
    "function FormMedia({isVerified}){\n  const [coverPreview,setCoverPreview]=useState('')\n  const [accessMode,setAccessMode]=useState('free')\n  const [formM,setFormM]=useState({flux_day:'',flux_week:'',flux_month:'',flux_year:'',flux_currency:'KMF'})\n  const setM=(k,v)=>setFormM(f=>({...f,[k]:v}))\n  const [previewSec,setPreviewSec]=useState(30)"
)

# Ajouter MonetFlux avant la section Documents dans FormMedia
# Find the DOCUMENTS section and insert MonetFlux before it
old_docs = """    {/* DOCUMENTS */}"""
new_docs = """    {/* ACCÈS & MONÉTISATION FLUX */}
    <MonetFlux isVerified={isVerified} accessMode={accessMode} setAccessMode={setAccessMode} form={formM} set={setM} previewSec={previewSec} setPreviewSec={setPreviewSec}/>

    {/* DOCUMENTS */}"""

content = content.replace(old_docs, new_docs)

open('Upload.jsx', 'w').write(content)
print("OK - Upload.jsx patched successfully")
PYEOF

echo "✅ Upload.jsx mis à jour"

# ═══════════════════════════════════════
# RELANCER
# ═══════════════════════════════════════
echo ""
echo "🚀 Relancement..."
cd /workspaces/waiichia
pnpm --filter web run dev

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  MONÉTISATION MISE À JOUR !"
echo ""
echo "  ✅ Son      : Gratuit / Vente / Location / Vente+Location + extrait"
echo "  ✅ Album    : Gratuit / Vente / Location / Vente+Location + extrait"
echo "  ✅ Podcast  : Gratuit / Vente / Location (PAS de flux) + extrait"
echo "  ✅ Émission : Gratuit / Vente / Location / Vente+Location + extrait"
echo "  ✅ Flux     : Gratuit / Abonnés / Payant (jour/semaine/mois/an) + extrait"
echo ""
echo "  🔒 RÈGLE ÉCONOMIQUE :"
echo "  → Utilisateurs NON vérifiés : publication gratuite uniquement"
echo "  → Utilisateurs VÉRIFIÉS : accès à toutes les options de monétisation"
echo "  → Message clair affiché si non vérifié"
echo "═══════════════════════════════════════════════════════════"
