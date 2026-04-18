import { useState } from "react"

// ── AJOUT : image drapeau via flagcdn.com (fonctionne sur Windows) ──
function FlagImg({ iso, size = 18 }) {
  if (!iso) return null
  const src = `https://flagcdn.com/w${size}/${iso.toLowerCase()}.png`
  return (
    <img src={src} alt={iso} width={size} height={Math.round(size * 0.67)}
      style={{borderRadius:2,objectFit:"cover",display:"inline-block",verticalAlign:"middle",flexShrink:0}}
      onError={e=>{e.target.style.display="none"}}
    />
  )
}

const PAYS = [
  {code:"KMF",iso:"km",country:"Comores",       label:"Franc Comorien",    tel:"+269"},
  {code:"MGA",iso:"mg",country:"Madagascar",     label:"Ariary Malgache",   tel:"+261"},
  {code:"TZS",iso:"tz",country:"Tanzanie",       label:"Shilling Tanzanien",tel:"+255"},
  {code:"RWF",iso:"rw",country:"Rwanda",         label:"Franc Rwandais",    tel:"+250"},
  {code:"XOF",iso:"ci",country:"Côte d'Ivoire",  label:"FCFA Ouest",        tel:"+225"},
  {code:"NGN",iso:"ng",country:"Nigeria",        label:"Naira",             tel:"+234"},
  {code:"CDF",iso:"cd",country:"RD Congo",       label:"Franc Congolais",   tel:"+243"},
  {code:"XAF",iso:"cg",country:"Congo Brazzaville",label:"FCFA Central",   tel:"+242"},
  {code:"XOF",iso:"sn",country:"Sénégal",        label:"FCFA Ouest",        tel:"+221"},
  {code:"GHS",iso:"gh",country:"Ghana",          label:"Cedi",              tel:"+233"},
  {code:"KES",iso:"ke",country:"Kenya",          label:"Shilling Kenyan",   tel:"+254"},
  {code:"ETB",iso:"et",country:"Éthiopie",       label:"Birr",              tel:"+251"},
  {code:"MAD",iso:"ma",country:"Maroc",          label:"Dirham",            tel:"+212"},
  {code:"DZD",iso:"dz",country:"Algérie",        label:"Dinar Algérien",    tel:"+213"},
  {code:"TND",iso:"tn",country:"Tunisie",        label:"Dinar Tunisien",    tel:"+216"},
  {code:"USD",iso:"us",country:"États-Unis",     label:"Dollar US",         tel:"+1"},
  {code:"EUR",iso:"eu",country:"Europe",         label:"Euro",              tel:""},
  {code:"GBP",iso:"gb",country:"Royaume-Uni",    label:"Livre Sterling",    tel:"+44"},
]

const LANGUES = [
  {code:"fr",iso:"fr",label:"Français"},
  {code:"sw",iso:"tz",label:"Swahili"},
  {code:"ar",iso:"sa",label:"العربية"},
  {code:"en",iso:"gb",label:"English"},
  {code:"pt",iso:"br",label:"Português"},
  {code:"yo",iso:"ng",label:"Yorùbà"},
]

// ── AJOUT : devise par défaut selon pays ISO ──
const ISO_TO_CURRENCY = {
  km:"KMF",mg:"MGA",tz:"TZS",rw:"RWF",ci:"XOF",ng:"NGN",
  cd:"CDF",cg:"XAF",sn:"XOF",gh:"GHS",ke:"KES",et:"ETB",
  ma:"MAD",dz:"DZD",tn:"TND",us:"USD",eu:"EUR",gb:"GBP",
  fr:"EUR",re:"EUR",mu:"MUR",
}

export default function DeviseModal({ open, onClose, current, onChange, userIso }) {
  const [search, setSearch] = useState("")
  const [langue, setLangue] = useState("fr")

  if (!open) return null

  const filtered = PAYS.filter(p =>
    p.country.toLowerCase().includes(search.toLowerCase()) ||
    p.code.toLowerCase().includes(search.toLowerCase())
  )
  const currentPays = PAYS.find(p => p.code === current) || PAYS[0]

  // ── AJOUT : bouton reset vers devise du pays ──
  const userIsoLow = (userIso || "km").toLowerCase()
  const defaultCode = ISO_TO_CURRENCY[userIsoLow] || "KMF"
  const defaultPays = PAYS.find(p => p.code === defaultCode && p.iso === userIsoLow)
    || PAYS.find(p => p.code === defaultCode)
    || PAYS[0]
  const isOnDefault = current === defaultCode

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.65)",zIndex:400,
      display:"flex",alignItems:"center",justifyContent:"center",padding:16,backdropFilter:"blur(4px)"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"var(--bg2)",border:"1px solid var(--border)",
        borderRadius:"var(--radius)",width:"100%",maxWidth:520,maxHeight:"85vh",
        boxShadow:"0 24px 64px rgba(0,0,0,.5)",display:"flex",flexDirection:"column",overflow:"hidden"}}>

        {/* Header */}
        <div style={{padding:"18px 20px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <div style={{fontFamily:"Syne,sans-serif",fontSize:18,fontWeight:800,display:"flex",alignItems:"center",gap:8}}>
            🌍 Pays &amp; Langue
          </div>
          <div onClick={onClose} style={{width:28,height:28,borderRadius:"50%",background:"var(--card)",
            border:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"center",
            cursor:"pointer",fontSize:13,transition:"all .15s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--red)";e.currentTarget.style.color="var(--red)"}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.color="var(--text)"}}>
            ✕
          </div>
        </div>

        {/* Pays actuel */}
        <div style={{padding:"12px 20px",borderBottom:"1px solid var(--border)",
          background:"rgba(245,166,35,.04)",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              {/* MODIFIÉ : image au lieu d'emoji */}
              <FlagImg iso={currentPays.iso} size={28} />
              <div>
                <div style={{fontWeight:700,fontSize:14}}>{currentPays.country}</div>
                <div style={{fontSize:11,color:"var(--text3)",fontFamily:"Space Mono,monospace"}}>
                  {currentPays.code} · {currentPays.label} · {currentPays.tel}
                </div>
              </div>
            </div>
            <div style={{fontSize:11,color:"var(--text3)",textAlign:"right"}}>
              Langue affichée<br/>
              <span style={{color:"var(--gold)",fontWeight:600,display:"flex",alignItems:"center",gap:4,justifyContent:"flex-end"}}>
                <FlagImg iso={LANGUES.find(l=>l.code===langue)?.iso} size={14}/>
                {LANGUES.find(l=>l.code===langue)?.label}
              </span>
            </div>
          </div>

          {/* ── AJOUT : bouton reset devise pays ── */}
          {!isOnDefault && defaultPays && (
            <button onClick={()=>{ onChange(defaultPays); onClose() }}
              style={{marginTop:10,width:"100%",padding:"7px 14px",borderRadius:50,
                background:"rgba(245,166,35,.12)",border:"1px solid var(--gold)",
                color:"var(--gold)",fontSize:12,fontWeight:700,cursor:"pointer",
                fontFamily:"Plus Jakarta Sans,sans-serif",display:"flex",alignItems:"center",
                justifyContent:"center",gap:6}}>
              🔄 Revenir à ma devise (<FlagImg iso={defaultPays.iso} size={14}/> {defaultCode})
            </button>
          )}
        </div>

        <div style={{overflowY:"auto",flex:1,padding:"16px 20px"}}>

          {/* Langue interface */}
          <div style={{marginBottom:18}}>
            <div style={{fontSize:11,color:"var(--text3)",fontFamily:"Space Mono,monospace",
              textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>
              Langue de l&apos;interface
            </div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {LANGUES.map(l=>(
                <button key={l.code} onClick={()=>setLangue(l.code)}
                  style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:50,
                    border:"1px solid",fontSize:12,fontWeight:600,cursor:"pointer",transition:"all .15s",
                    fontFamily:"Plus Jakarta Sans,sans-serif",
                    borderColor:langue===l.code?"var(--gold)":"var(--border)",
                    background:langue===l.code?"var(--gold)":"var(--card)",
                    color:langue===l.code?"#000":"var(--text2)"}}>
                  {/* MODIFIÉ : image au lieu d'emoji */}
                  <FlagImg iso={l.iso} size={14}/> {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Recherche pays */}
          <div style={{marginBottom:12}}>
            <div style={{fontSize:11,color:"var(--text3)",fontFamily:"Space Mono,monospace",
              textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>
              Choisir un pays
            </div>
            <div style={{position:"relative",marginBottom:14}}>
              <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",
                color:"var(--text3)",fontSize:14,pointerEvents:"none"}}>🔍</span>
              <input value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="Rechercher un pays..."
                style={{width:"100%",background:"var(--card)",border:"1px solid var(--border)",
                  borderRadius:50,padding:"9px 16px 9px 36px",color:"var(--text)",fontSize:13,
                  fontFamily:"Plus Jakarta Sans,sans-serif",outline:"none",boxSizing:"border-box",transition:"all .2s"}}
                onFocus={e=>{e.target.style.borderColor="var(--gold)";e.target.style.boxShadow="0 0 0 3px rgba(245,166,35,.1)"}}
                onBlur={e=>{e.target.style.borderColor="var(--border)";e.target.style.boxShadow="none"}}
              />
            </div>

            {/* Grille pays — MODIFIÉ : FlagImg au lieu d'emoji */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
              {filtered.map(p=>{
                const isActive = current===p.code && currentPays.iso===p.iso
                return(
                  <div key={p.iso+p.code} onClick={()=>{onChange(p);onClose()}}
                    style={{display:"flex",alignItems:"center",gap:8,padding:"10px 10px",
                      borderRadius:"var(--radius-sm)",cursor:"pointer",transition:"all .15s",
                      border:`1px solid ${isActive?"var(--gold)":"var(--border)"}`,
                      background:isActive?"rgba(245,166,35,.08)":"var(--card)"}}
                    onMouseEnter={e=>e.currentTarget.style.borderColor="var(--gold)"}
                    onMouseLeave={e=>e.currentTarget.style.borderColor=isActive?"var(--gold)":"var(--border)"}>
                    <FlagImg iso={p.iso} size={20}/>
                    <div style={{minWidth:0}}>
                      <div style={{fontWeight:600,fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.country}</div>
                      <div style={{fontSize:10,color:"var(--text3)",fontFamily:"Space Mono,monospace"}}>
                        {p.code} {p.tel}
                      </div>
                    </div>
                    {isActive && <span style={{color:"var(--gold)",fontSize:12,marginLeft:"auto",flexShrink:0}}>✓</span>}
                  </div>
                )
              })}
              {!filtered.length&&<div style={{gridColumn:"1/-1",textAlign:"center",color:"var(--text3)",padding:20,fontSize:13}}>Aucun pays trouvé</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
