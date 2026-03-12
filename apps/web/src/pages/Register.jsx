import { useState } from "react"
import { useAuthStore, usePageStore } from "../stores/index.js"
import api from "../services/api.js"

const COUNTRIES=[{code:"KM",flag:"🇰🇲",name:"Comores"},{code:"MG",flag:"🇲🇬",name:"Madagascar"},{code:"TZ",flag:"🇹🇿",name:"Tanzanie"},{code:"CI",flag:"🇨🇮",name:"Côte d'Ivoire"},{code:"NG",flag:"🇳🇬",name:"Nigeria"},{code:"SN",flag:"🇸🇳",name:"Sénégal"},{code:"FR",flag:"🇫🇷",name:"France"}]

export default function Register(){
  const {setPage}=usePageStore()
  const [step,setStep]=useState(1)
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState("")
  const [info,setInfo]=useState("")
  const [form,setForm]=useState({display_name:"",username:"",email:"",password:"",country:"KM",profile_type:"artist"})
  const upd=(k,v)=>setForm(f=>({...f,[k]:v}))

  const handleRegister=async()=>{
    setError("");setLoading(true)
    try{
      const res=await api.auth.register(form)
      if(res.needsConfirmation){setInfo("✅ Compte créé ! Confirmez votre email.");setTimeout(()=>setPage("login"),3000)}
      else if(res.token){localStorage.setItem("waiichia_token",res.token);setPage("home")}
    }catch(e){setError(e.message||"Erreur")}
    finally{setLoading(false)}
  }

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",backdropFilter:"blur(16px)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
      onClick={e=>{if(e.target===e.currentTarget)setPage("home")}}>
      <div style={{background:"var(--bg2)",border:"1px solid var(--border)",borderRadius:22,padding:32,width:"100%",maxWidth:440,maxHeight:"calc(100vh - 40px)",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <div>
            <div style={{fontFamily:"Syne,sans-serif",fontSize:22,fontWeight:800}}>✨ Créer mon compte</div>
            <div style={{fontSize:12,color:"var(--text3)",marginTop:4}}>🌍 Rejoindre Waiichia</div>
          </div>
          <button onClick={()=>setPage("home")} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:8,padding:"7px 12px",cursor:"pointer",color:"var(--text)"}}>✕</button>
        </div>
        <div style={{display:"flex",gap:6,marginBottom:24}}>
          {[1,2].map(s=><div key={s} style={{flex:1,height:4,borderRadius:2,background:step>=s?"var(--gold)":"var(--card2)"}}/>)}
        </div>
        {error&&<div style={{background:"rgba(230,57,70,.1)",border:"1px solid rgba(230,57,70,.3)",borderRadius:10,padding:"10px 14px",fontSize:13,color:"#e63946",marginBottom:16}}>⚠️ {error}</div>}
        {info&&<div style={{background:"rgba(44,198,83,.1)",border:"1px solid rgba(44,198,83,.3)",borderRadius:10,padding:"10px 14px",fontSize:13,color:"#2dc653",marginBottom:16}}>{info}</div>}
        {step===1&&<>
          <Field label="Nom d'affichage"><Inp placeholder="Ton nom public" value={form.display_name} onChange={v=>upd("display_name",v)}/></Field>
          <Field label="Nom d'utilisateur">
            <div style={{position:"relative"}}>
              <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:"var(--text3)"}}>@</span>
              <Inp placeholder="kolo_officiel" value={form.username} onChange={v=>upd("username",v.toLowerCase().replace(/[^a-z0-9_]/g,""))} style={{paddingLeft:32}}/>
            </div>
          </Field>
          <Field label="Pays">
            <select value={form.country} onChange={e=>upd("country",e.target.value)}
              style={{width:"100%",background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--radius-sm)",padding:"11px 16px",color:"var(--text)",fontSize:14,cursor:"pointer",outline:"none"}}>
              {COUNTRIES.map(c=><option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
            </select>
          </Field>
          <Field label="Je suis">
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {[["artist","🎤 Artiste"],["label","🏢 Label"],["media","📺 Média"],["pro","💼 Pro"]].map(([v,l])=>(
                <button key={v} onClick={()=>upd("profile_type",v)} style={{padding:"10px",borderRadius:10,border:"2px solid "+(form.profile_type===v?"var(--gold)":"var(--border)"),background:form.profile_type===v?"rgba(245,166,35,.1)":"var(--card)",color:form.profile_type===v?"var(--gold)":"var(--text2)",cursor:"pointer",fontSize:13,fontWeight:600}}>{l}</button>
              ))}
            </div>
          </Field>
          <button onClick={()=>{if(!form.display_name||!form.username)return setError("Nom et username requis");setError("");setStep(2)}}
            style={{width:"100%",padding:13,background:"linear-gradient(135deg,#f5a623,#e8920a)",color:"#000",border:"none",borderRadius:"var(--radius-sm)",fontSize:15,fontWeight:700,cursor:"pointer",marginBottom:16}}>
            Étape suivante →
          </button>
        </>}
        {step===2&&<>
          <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,padding:14,marginBottom:20,display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:40,height:40,borderRadius:"50%",background:"var(--gold)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800}}>{(form.display_name||"??").slice(0,2).toUpperCase()}</div>
            <div><div style={{fontWeight:700}}>{form.display_name}</div><div style={{fontSize:12,color:"var(--text3)"}}>@{form.username}</div></div>
          </div>
          <Field label="Email"><Inp type="email" placeholder="ton@email.com" value={form.email} onChange={v=>upd("email",v)}/></Field>
          <Field label="Mot de passe"><Inp type="password" placeholder="6 caractères minimum" value={form.password} onChange={v=>upd("password",v)}/></Field>
          <div style={{display:"flex",gap:10,marginBottom:16}}>
            <button onClick={()=>{setStep(1);setError("")}} style={{padding:"10px 18px",borderRadius:"var(--radius-sm)",border:"1px solid var(--border)",background:"var(--card)",color:"var(--text2)",cursor:"pointer",fontWeight:600}}>← Retour</button>
            <button onClick={handleRegister} disabled={loading} style={{flex:1,padding:13,background:"linear-gradient(135deg,#f5a623,#e8920a)",color:"#000",border:"none",borderRadius:"var(--radius-sm)",fontSize:15,fontWeight:700,cursor:"pointer",opacity:loading?.7:1}}>
              {loading?"⏳ Création...":"🚀 Créer mon compte"}
            </button>
          </div>
        </>}
        <div style={{textAlign:"center",fontSize:13,color:"var(--text2)"}}>
          Déjà un compte ? <span style={{color:"var(--gold)",cursor:"pointer",fontWeight:600}} onClick={()=>setPage("login")}>Se connecter →</span>
        </div>
      </div>
    </div>
  )
}
function Field({label,children}){return(<div style={{marginBottom:18}}><label style={{display:"block",fontSize:11.5,color:"var(--text2)",marginBottom:6,fontWeight:600,textTransform:"uppercase",letterSpacing:1}}>{label}</label>{children}</div>)}
function Inp({type="text",placeholder,value,onChange,style={}}){
  const [foc,setFoc]=useState(false)
  return(<input type={type} placeholder={placeholder} value={value} onChange={e=>onChange(e.target.value)} onFocus={()=>setFoc(true)} onBlur={()=>setFoc(false)}
    style={{width:"100%",background:"var(--card)",border:"1px solid "+(foc?"var(--gold)":"var(--border)"),borderRadius:"var(--radius-sm)",padding:"11px 16px",color:"var(--text)",fontSize:14,outline:"none",boxSizing:"border-box",...style}}/>)
}
