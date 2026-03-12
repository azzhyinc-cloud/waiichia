import { useState } from "react"
import { useAuthStore, usePageStore } from "../stores/index.js"
import api from "../services/api.js"

export default function Login() {
  const { setPage }  = usePageStore()
  const { setUser }  = useAuthStore()
  const [mode, setMode]       = useState("login")
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState("")
  const [info, setInfo]       = useState("")
  const [form, setForm]       = useState({ email:"", password:"", username:"", display_name:"", country:"KM" })

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    setError(""); setInfo(""); setLoading(true)
    try {
      if (mode === "login") {
        const res = await api.auth.login({ email: form.email, password: form.password })
        localStorage.setItem("waiichia_token", res.token)
        setUser(res.user)
        setPage("home")
      } else {
        if (!form.username || !form.display_name || !form.email || !form.password)
          return setError("Tous les champs sont obligatoires")
        const reg = await api.auth.register({
          email: form.email, password: form.password,
          username: form.username, display_name: form.display_name, country: form.country
        })
        if (reg.needsConfirmation) {
          setInfo("✅ Compte créé ! Confirmez votre email puis connectez-vous.")
          setMode("login"); setForm(f => ({ ...f, password: "" }))
        } else if (reg.token) {
          localStorage.setItem("waiichia_token", reg.token)
          setUser(reg.user)
          setPage("home")
        }
      }
    } catch (e) {
      if (e.code === "EMAIL_NOT_CONFIRMED")
        setError("Email non confirmé. Vérifiez votre boîte mail.")
      else
        setError(e.message || "Erreur de connexion")
    } finally { setLoading(false) }
  }

  return (
    <div style={{
      position:"fixed",inset:0,background:"rgba(0,0,0,.82)",backdropFilter:"blur(14px)",
      zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20,
    }} onClick={e => { if(e.target===e.currentTarget) setPage("home") }}>

      <div style={{
        background:"var(--bg2)",border:"1px solid var(--border)",borderRadius:22,
        padding:32,width:"100%",maxWidth:420,
        maxHeight:"calc(100vh - 40px)",overflowY:"auto",
      }}>
        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <div>
            <div style={{fontFamily:"Syne,sans-serif",fontSize:22,fontWeight:800,marginBottom:4}}>
              {mode==="login" ? "🔑 Connexion" : "✨ Créer un compte"}
            </div>
            <div style={{fontSize:12,color:"var(--text3)",fontFamily:"Space Mono,monospace"}}>
              {mode==="login" ? "Heureux de vous revoir" : "🌍 Rejoindre Waiichia"}
            </div>
          </div>
          <button onClick={() => setPage("home")}
            style={{background:"var(--card)",border:"1px solid var(--border)",
              borderRadius:8,padding:"7px 12px",cursor:"pointer",color:"var(--text)",fontSize:14}}>
            ✕
          </button>
        </div>

        {/* Social buttons */}
        <SBtn bg="#1877f2" color="#fff" icon="📘" label="Facebook" onClick={()=>setError("Bientôt disponible")} />
        <SBtn bg="#fff" color="#000" icon="🔍" label="Google" border onClick={()=>setError("Bientôt disponible")} />
        <SBtn bg="linear-gradient(135deg,#00b894,#00a381)" color="#fff" icon="🌴" label="Continuer avec Wanzani" shine onClick={()=>setError("Bientôt disponible")} />

        <div style={{display:"flex",alignItems:"center",gap:12,margin:"16px 0"}}>
          <div style={{flex:1,height:1,background:"var(--border)"}}/>
          <span style={{fontSize:12,color:"var(--text3)"}}>ou</span>
          <div style={{flex:1,height:1,background:"var(--border)"}}/>
        </div>

        {/* Messages */}
        {error && <Alert color="var(--red)" bg="rgba(230,57,70,.1)" msg={"⚠️ " + error} />}
        {info  && <Alert color="var(--green)" bg="rgba(45,198,83,.1)" msg={info} />}

        {/* Champs register */}
        {mode === "register" && <>
          <Field label="Nom d'affichage">
            <Inp placeholder="Ton nom public" value={form.display_name} onChange={v=>upd("display_name",v)} />
          </Field>
          <Field label="Nom d'utilisateur">
            <div style={{position:"relative"}}>
              <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:"var(--text3)",fontSize:14}}>@</span>
              <Inp placeholder="username" value={form.username}
                onChange={v=>upd("username",v.toLowerCase().replace(/\s/g,""))}
                style={{paddingLeft:32}} />
            </div>
          </Field>
        </>}

        <Field label="Email">
          <Inp type="email" placeholder="ton@email.com" value={form.email} onChange={v=>upd("email",v)} />
        </Field>
        <Field label="Mot de passe">
          <Inp type="password" placeholder={mode==="login"?"••••••••":"6 caractères minimum"} value={form.password} onChange={v=>upd("password",v)} />
        </Field>

        {mode==="login" && (
          <div style={{textAlign:"right",marginTop:-10,marginBottom:18}}>
            <span style={{fontSize:12,color:"var(--gold)",cursor:"pointer"}}
              onClick={()=>setInfo("Email de réinitialisation envoyé !")}>
              Mot de passe oublié ?
            </span>
          </div>
        )}

        <button onClick={handleSubmit} disabled={loading} style={{
          width:"100%",padding:"13px",background:"linear-gradient(135deg,#f5a623,#e8920a)",
          color:"#000",border:"none",borderRadius:"var(--radius-sm)",
          fontFamily:"Plus Jakarta Sans,sans-serif",fontSize:15,fontWeight:700,
          cursor:loading?"not-allowed":"pointer",transition:"all .2s",
          boxShadow:"0 3px 12px rgba(245,166,35,.3)",marginBottom:16,opacity:loading?.7:1
        }}>
          {loading ? "⏳ Chargement..." : mode==="login" ? "🚀 Se connecter" : "🚀 Créer mon compte"}
        </button>

        <div style={{textAlign:"center",fontSize:13,color:"var(--text2)"}}>
          {mode==="login"
            ? <>Pas encore de compte ? <span style={{color:"var(--gold)",cursor:"pointer",fontWeight:600}} onClick={()=>{setMode("register");setError("");setInfo("")}}>Créer un compte →</span></>
            : <>Déjà un compte ? <span style={{color:"var(--gold)",cursor:"pointer",fontWeight:600}} onClick={()=>{setMode("login");setError("");setInfo("")}}>Se connecter →</span></>
          }
        </div>

        {mode==="register" && (
          <div style={{fontSize:11,color:"var(--text3)",textAlign:"center",marginTop:12,lineHeight:1.6}}>
            En vous inscrivant, vous acceptez les <span style={{color:"var(--gold)",cursor:"pointer"}}>CGU</span> de Waiichia.
          </div>
        )}
      </div>
    </div>
  )
}

function SBtn({bg,color,icon,label,border,shine,onClick}) {
  const [hov,setHov]=useState(false)
  return (
    <button onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,width:"100%",
        padding:13,borderRadius:"var(--radius-sm)",border:border?"1px solid #ddd":"none",
        cursor:"pointer",fontFamily:"Plus Jakarta Sans,sans-serif",fontSize:14,fontWeight:600,
        transition:"all .2s",marginBottom:10,background:bg,color,position:"relative",overflow:"hidden",
        transform:hov?"translateY(-2px)":"none",boxShadow:hov?"0 6px 18px var(--shadow)":"none"}}>
      {shine && <div style={{position:"absolute",top:0,left:"-100%",width:"100%",height:"100%",
        background:"linear-gradient(90deg,transparent,rgba(255,255,255,.18),transparent)",
        animation:"shimmer 2.5s infinite"}}/>}
      <span style={{fontSize:18}}>{icon}</span> {label}
    </button>
  )
}

function Field({label,children}) {
  return (
    <div style={{marginBottom:18}}>
      <label style={{display:"block",fontSize:11.5,color:"var(--text2)",marginBottom:6,
        fontWeight:600,textTransform:"uppercase",letterSpacing:1,fontFamily:"Space Mono,monospace"}}>
        {label}
      </label>
      {children}
    </div>
  )
}

function Inp({type="text",placeholder,value,onChange,style={}}) {
  const [foc,setFoc]=useState(false)
  return (
    <input type={type} placeholder={placeholder} value={value}
      onChange={e=>onChange(e.target.value)}
      onFocus={()=>setFoc(true)} onBlur={()=>setFoc(false)}
      style={{width:"100%",background:"var(--card)",
        border:`1px solid ${foc?"var(--gold)":"var(--border)"}`,
        borderRadius:"var(--radius-sm)",padding:"11px 16px",color:"var(--text)",
        fontFamily:"Plus Jakarta Sans,sans-serif",fontSize:14,outline:"none",
        transition:"border-color .2s",
        boxShadow:foc?"0 0 0 3px rgba(245,166,35,.08)":"none",...style}}
    />
  )
}

function Alert({color,bg,msg}) {
  return (
    <div style={{background:bg,border:`1px solid ${color}44`,borderRadius:"var(--radius-sm)",
      padding:"10px 14px",fontSize:13,color,marginBottom:16}}>
      {msg}
    </div>
  )
}
