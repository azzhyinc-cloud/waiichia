import { useState } from "react"

const DEVISES = [
  {code:"KMF",flag:"🇰🇲",country:"Comores",label:"Franc Comorien"},
  {code:"MGA",flag:"🇲🇬",country:"Madagascar",label:"Ariary Malgache"},
  {code:"TZS",flag:"🇹🇿",country:"Tanzanie",label:"Shilling Tanzanien"},
  {code:"RWF",flag:"🇷🇼",country:"Rwanda",label:"Franc Rwandais"},
  {code:"XOF",flag:"🇨🇮",country:"Côte d'Ivoire",label:"FCFA Ouest"},
  {code:"XAF",flag:"🇨🇩",country:"RD Congo",label:"FCFA Central"},
  {code:"NGN",flag:"🇳🇬",country:"Nigeria",label:"Naira"},
  {code:"USD",flag:"🇺🇸",country:"États-Unis",label:"Dollar US"},
  {code:"EUR",flag:"🇪🇺",country:"Europe",label:"Euro"},
]

export default function DeviseModal({ open, onClose, current, onChange }) {
  if (!open) return null
  return (
    <>
      <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
        <div onClick={e=>e.stopPropagation()} style={{background:"var(--bg2)",border:"1px solid var(--border)",borderRadius:"var(--radius)",padding:24,width:"100%",maxWidth:360,boxShadow:"0 16px 48px rgba(0,0,0,.4)"}}>
          <div style={{fontFamily:"Syne,sans-serif",fontSize:18,fontWeight:800,marginBottom:6}}>🌍 Pays &amp; Devise</div>
          <div style={{fontSize:12,color:"var(--text3)",marginBottom:18}}>Choisissez votre devise principale</div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {DEVISES.map(d=>(
              <div key={d.code} onClick={()=>{onChange(d);onClose()}}
                style={{display:"flex",alignItems:"center",gap:12,padding:"11px 14px",borderRadius:"var(--radius-sm)",cursor:"pointer",transition:"all .15s",border:`1px solid ${current===d.code?"var(--gold)":"var(--border)"}`,background:current===d.code?"rgba(245,166,35,.06)":"var(--card)"}}
                onMouseEnter={e=>e.currentTarget.style.borderColor="var(--gold)"}
                onMouseLeave={e=>e.currentTarget.style.borderColor=current===d.code?"var(--gold)":"var(--border)"}>
                <span style={{fontSize:22}}>{d.flag}</span>
                <div style={{flex:1}}>
                  <div style={{fontWeight:600,fontSize:13}}>{d.country}</div>
                  <div style={{fontSize:11,color:"var(--text3)",fontFamily:"Space Mono,monospace"}}>{d.code} · {d.label}</div>
                </div>
                {current===d.code&&<span style={{color:"var(--gold)",fontSize:16}}>✓</span>}
              </div>
            ))}
          </div>
          <button onClick={onClose} style={{width:"100%",marginTop:14,padding:"10px",borderRadius:50,border:"1px solid var(--border)",background:"transparent",color:"var(--text2)",fontSize:12,cursor:"pointer",fontFamily:"Plus Jakarta Sans,sans-serif"}}>Fermer</button>
        </div>
      </div>
    </>
  )
}
