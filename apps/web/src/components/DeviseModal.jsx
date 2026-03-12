import { useState } from "react"

const PAYS = [
  {code:"KMF",flag:"🇰🇲",country:"Comores",label:"Franc Comorien",tel:"+269",iso:"KM"},
  {code:"MGA",flag:"🇲🇬",country:"Madagascar",label:"Ariary Malgache",tel:"+261",iso:"MG"},
  {code:"TZS",flag:"🇹🇿",country:"Tanzanie",label:"Shilling Tanzanien",tel:"+255",iso:"TZ"},
  {code:"RWF",flag:"🇷🇼",country:"Rwanda",label:"Franc Rwandais",tel:"+250",iso:"RW"},
  {code:"XOF",flag:"🇨🇮",country:"Côte d'Ivoire",label:"FCFA Ouest",tel:"+225",iso:"CI"},
  {code:"NGN",flag:"🇳🇬",country:"Nigeria",label:"Naira",tel:"+234",iso:"NG"},
  {code:"CDF",flag:"🇨🇩",country:"RD Congo",label:"Franc Congolais",tel:"+243",iso:"CD"},
  {code:"XAF",flag:"🇨🇬",country:"Congo Brazzaville",label:"FCFA Central",tel:"+242",iso:"CG"},
  {code:"XOF",flag:"🇸🇳",country:"Sénégal",label:"FCFA Ouest",tel:"+221",iso:"SN"},
  {code:"GHS",flag:"🇬🇭",country:"Ghana",label:"Cedi",tel:"+233",iso:"GH"},
  {code:"KES",flag:"🇰🇪",country:"Kenya",label:"Shilling Kenyan",tel:"+254",iso:"KE"},
  {code:"ETB",flag:"🇪🇹",country:"Éthiopie",label:"Birr",tel:"+251",iso:"ET"},
  {code:"MAD",flag:"🇲🇦",country:"Maroc",label:"Dirham",tel:"+212",iso:"MA"},
  {code:"DZD",flag:"🇩🇿",country:"Algérie",label:"Dinar Algérien",tel:"+213",iso:"DZ"},
  {code:"TND",flag:"🇹🇳",country:"Tunisie",label:"Dinar Tunisien",tel:"+216",iso:"TN"},
  {code:"USD",flag:"🇺🇸",country:"États-Unis",label:"Dollar US",tel:"+1",iso:"US"},
  {code:"EUR",flag:"🇪🇺",country:"Europe",label:"Euro",tel:"",iso:"EU"},
  {code:"GBP",flag:"🇬🇧",country:"Royaume-Uni",label:"Livre Sterling",tel:"+44",iso:"GB"},
]

const LANGUES = [
  {code:"fr",flag:"🇫🇷",label:"Français"},
  {code:"sw",flag:"🇹🇿",label:"Swahili"},
  {code:"ar",flag:"🇸🇦",label:"العربية"},
  {code:"en",flag:"🇬🇧",label:"English"},
  {code:"pt",flag:"🇧🇷",label:"Português"},
  {code:"yo",flag:"🇳🇬",label:"Yorùbà"},
]

export default function DeviseModal({ open, onClose, current, onChange }) {
  const [search, setSearch] = useState("")
  const [langue, setLangue] = useState("fr")

  if (!open) return null

  const filtered = PAYS.filter(p =>
    p.country.toLowerCase().includes(search.toLowerCase()) ||
    p.code.toLowerCase().includes(search.toLowerCase())
  )
  const currentPays = PAYS.find(p => p.code === current) || PAYS[0]

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
              <span style={{fontSize:24}}>{currentPays.flag}</span>
              <div>
                <div style={{fontWeight:700,fontSize:14}}>{currentPays.country}</div>
                <div style={{fontSize:11,color:"var(--text3)",fontFamily:"Space Mono,monospace"}}>
                  {currentPays.code} · {currentPays.label} · {currentPays.tel}
                </div>
              </div>
            </div>
            <div style={{fontSize:11,color:"var(--text3)",textAlign:"right"}}>
              Langue affichée<br/>
              <span style={{color:"var(--gold)",fontWeight:600}}>
                {LANGUES.find(l=>l.code===langue)?.flag} {LANGUES.find(l=>l.code===langue)?.label}
              </span>
            </div>
          </div>
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
                  <span>{l.flag}</span> {l.label}
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

            {/* Grille pays */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
              {filtered.map(p=>(
                <div key={p.iso+p.code} onClick={()=>{onChange(p);onClose()}}
                  style={{display:"flex",alignItems:"center",gap:8,padding:"10px 10px",
                    borderRadius:"var(--radius-sm)",cursor:"pointer",transition:"all .15s",
                    border:`1px solid ${current===p.code&&p.iso===currentPays.iso?"var(--gold)":"var(--border)"}`,
                    background:current===p.code&&p.iso===currentPays.iso?"rgba(245,166,35,.08)":"var(--card)"}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor="var(--gold)"}
                  onMouseLeave={e=>e.currentTarget.style.borderColor=current===p.code&&p.iso===currentPays.iso?"var(--gold)":"var(--border)"}>
                  <span style={{fontSize:18,flexShrink:0}}>{p.flag}</span>
                  <div style={{minWidth:0}}>
                    <div style={{fontWeight:600,fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.country}</div>
                    <div style={{fontSize:10,color:"var(--text3)",fontFamily:"Space Mono,monospace"}}>
                      {p.code} {p.tel}
                    </div>
                  </div>
                  {current===p.code&&p.iso===currentPays.iso&&
                    <span style={{color:"var(--gold)",fontSize:12,marginLeft:"auto",flexShrink:0}}>✓</span>}
                </div>
              ))}
              {!filtered.length&&<div style={{gridColumn:"1/-1",textAlign:"center",color:"var(--text3)",padding:20,fontSize:13}}>Aucun pays trouvé</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
