import { useState, useRef, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { useAuthStore } from "../stores/index.js"
import api from "../services/api.js"

/* ══ CONSTANTES EXACTES DU PROTOTYPE ══ */
const REACT_BTNS = [
  { key:"like", emoji:"❤️", cls:"active-like", bg:"rgba(230,57,70,.12)", border:"rgba(230,57,70,.35)", color:"var(--red)"    },
  { key:"fire", emoji:"🔥", cls:"active-fire", bg:"rgba(255,107,53,.12)", border:"rgba(255,107,53,.35)", color:"var(--orange)"},
  { key:"love", emoji:"🫶", cls:"active-love", bg:"rgba(245,166,35,.12)", border:"rgba(245,166,35,.35)", color:"var(--gold)"  },
  { key:"clap", emoji:"👏", cls:"active-clap", bg:"rgba(44,198,83,.12)",  border:"rgba(44,198,83,.35)",  color:"var(--green)" },
]

const SAMPLE_COMMENTS = [
  { ava:"WA", bg:"linear-gradient(135deg,#f5a623,#e63946)", name:"Wally Afro",    text:"🔥 Ce son est incroyable ! Le Twarab moderne c'est vraiment votre style.", time:"2h"  },
  { ava:"DC", bg:"linear-gradient(135deg,#9b59f5,#6c3483)", name:"DJ Chami",     text:"Production de qualité ! On voit que vous maîtrisez le genre. 👏",           time:"5h"  },
  { ava:"CA", bg:"linear-gradient(135deg,#2dc653,#00bfa5)", name:"Coach Amina",  text:"Mashallah ! Ça donne envie de danser 🌊",                                    time:"1j"  },
]

const FUN_PLACEHOLDERS = [
  "Votre avis sur ce son ?", "Laissez un commentaire 🎵", "Comment vous sentez ce son ?",
  "Réagissez ! 🔥", "Dites quelque chose de cool 😎",
]

const rndK = mul => ((Math.floor(Math.random()*9+1)*mul*100) + Math.floor(Math.random()*100)).toLocaleString()

/* ══ REACTION BAR — fidèle au prototype v7.2 ══ */
export function ReactionBar({ targetType, targetId, showComments = true, externalPanel, onPanelToggle }) {
  const { user } = useAuthStore()

  // Compteurs locaux (optimistic UI)
  const [counts,    setCounts]    = useState({ like: rndK(5), fire: rndK(3), love: rndK(2), clap: rndK(1) })
  const [active,    setActive]    = useState(null)         // clé de la réaction active
  const [panelOpen, setPanelOpen] = useState(false)
  const isPanelOpen = externalPanel !== undefined ? externalPanel : panelOpen
  const togglePanel = onPanelToggle !== undefined ? onPanelToggle : () => setPanelOpen(p=>!p)
  const [comments,  setComments]  = useState(SAMPLE_COMMENTS.slice(0, Math.floor(Math.random()*2)+1))
  const [newMsg,    setNewMsg]    = useState("")
  const [sending,   setSending]   = useState(false)
  const [reportOpen,setReportOpen]= useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const inputRef = useRef(null)

  /* Charger les vraies données si targetId disponible */
  useEffect(() => {
    if (!targetId) return
    api.social.reactions?.(targetType, targetId)
      .then(r => {
        if (!r?.reactions?.length) return
        const agg = { like:0, fire:0, love:0, clap:0 }
        r.reactions.forEach(rx => { if(agg[rx.emoji]!==undefined) agg[rx.emoji]++ })
        setCounts({ like:agg.like||rndK(5), fire:agg.fire||rndK(3), love:agg.love||rndK(2), clap:agg.clap||rndK(1) })
        if (user) {
          const mine = r.reactions.find(rx => rx.user_id === user.id)
          if (mine) setActive(mine.emoji)
        }
      }).catch(()=>{})
  }, [targetId])

  const handleReact = (key, e) => {
    e?.stopPropagation()
    const wasActive = active === key
    // Ripple effect
    if (!wasActive && e?.currentTarget) {
      const ripple = document.createElement('span')
      ripple.style.cssText = `position:absolute;width:20px;height:20px;background:rgba(245,166,35,.4);border-radius:50%;pointer-events:none;animation:ripple .5s ease-out forwards;left:50%;top:50%;transform:translate(-50%,-50%);`
      e.currentTarget.style.position = 'relative'
      e.currentTarget.appendChild(ripple)
      setTimeout(() => ripple.remove(), 500)
    }
    if (!wasActive) {
      // Incrémenter le nouveau + décrémenter l'ancien
      setCounts(prev => {
        const next = {...prev}
        if (active) {
          const n = parseInt(String(prev[active]).replace(/[^0-9]/g,''))||0
          next[active] = Math.max(0, n-1).toLocaleString()
        }
        const n2 = parseInt(String(prev[key]).replace(/[^0-9]/g,''))||0
        next[key] = (n2+1).toLocaleString()
        return next
      })
    }
    setActive(wasActive ? null : key)
    // API call (silencieux)
    if (user) api.social.react?.({ target_type: targetType, target_id: targetId, emoji: key }).catch(()=>{})
  }

  const handleSend = async (e) => {
    if (e?.key && e.key !== "Enter") return
    if (!newMsg.trim()) return
    setSending(true)
    const fakeComment = {
      ava: user?.username?.slice(0,2)?.toUpperCase()||"??",
      bg: "linear-gradient(135deg,var(--gold),var(--red))",
      name: user?.username || "Vous",
      text: newMsg.trim(),
      time: "maintenant"
    }
    setComments(prev => [fakeComment, ...prev])
    setNewMsg("")
    if (user) api.social.comment?.({ target_type: targetType, target_id: targetId, content: newMsg.trim() }).catch(()=>{})
    setSending(false)
    inputRef.current?.focus()
  }

  return (
    <>
      {/* ══ REACTION BAR (exactement comme le prototype) ══ */}
      <div style={{display:"flex",alignItems:"center",gap:6,padding:"10px 14px",borderTop:"1px solid var(--border)",flexWrap:"wrap"}}
        onClick={e=>e.stopPropagation()}>

        {REACT_BTNS.map(r => {
          const isActive = active === r.key
          return (
            <button key={r.key} onClick={e => handleReact(r.key, e)}
              style={{
                display:"flex",alignItems:"center",gap:5,
                padding:"6px 11px",borderRadius:50,
                border:`1px solid ${isActive ? r.border : "var(--border)"}`,
                background: isActive ? r.bg : "var(--card2)",
                color:      isActive ? r.color : "var(--text2)",
                fontSize:12,fontWeight:600,cursor:"pointer",transition:"all .18s",
                fontFamily:"Plus Jakarta Sans,sans-serif",position:"relative",overflow:"hidden",
              }}
              onMouseEnter={e => { if(!isActive){ e.currentTarget.style.borderColor="var(--gold)"; e.currentTarget.style.color="var(--gold)"; e.currentTarget.style.background="rgba(245,166,35,.08)" }}}
              onMouseLeave={e => { if(!isActive){ e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.color="var(--text2)"; e.currentTarget.style.background="var(--card2)" }}}>
              {r.emoji} <span style={{fontSize:11,fontFamily:"Space Mono,monospace"}}>{counts[r.key]}</span>
            </button>
          )
        })}

        {/* Bouton commentaires — ir-comment-btn exact prototype */
        {showComments && (
          <button onClick={e=>{e.stopPropagation();togglePanel()}}
            style={{
              display:"flex",alignItems:"center",gap:4,padding:"6px 11px",borderRadius:50,
              border:"1px solid",fontSize:12,cursor:"pointer",transition:"all .15s",fontWeight:600,
              fontFamily:"Plus Jakarta Sans,sans-serif",
              borderColor:isPanelOpen?"rgba(245,166,35,.35)":"var(--border)",
              background: isPanelOpen?"rgba(245,166,35,.1)":"var(--card2)",
              color:      isPanelOpen?"var(--gold)":"var(--text2)",
            }}>
            💬 <span style={{fontSize:10,fontFamily:"Space Mono,monospace"}}>{comments.length}</span>
          </button>
        )}

        {/* Partager */}
        <button onClick={e=>{e.stopPropagation();setShareOpen(true)}}
          style={{display:"flex",alignItems:"center",gap:4,padding:"6px 11px",borderRadius:50,border:"1px solid var(--border)",background:"var(--card2)",color:"var(--text2)",fontSize:12,cursor:"pointer",fontWeight:600,fontFamily:"Plus Jakarta Sans,sans-serif",transition:"all .15s"}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--gold)";e.currentTarget.style.color="var(--gold)"}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.color="var(--text2)"}}>
          📤
        </button>

        {/* Signaler */}
        <button onClick={e=>{e.stopPropagation();setReportOpen(true)}}
          style={{marginLeft:"auto",display:"flex",alignItems:"center",padding:"6px 9px",borderRadius:50,border:"1px solid var(--border)",background:"none",color:"var(--text3)",fontSize:12,cursor:"pointer",transition:"all .15s"}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--red)";e.currentTarget.style.color="var(--red)"}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.color="var(--text3)"}}>
          🚩
        </button>
      </div>

      {/* ══ FUN COMMENT PANEL — coulisse vers le bas ══ */}
      {showComments && isPanelOpen && (
        <div style={{borderTop:"1px solid var(--border)",background:"var(--bg2)",animation:"slideCommentIn .22s cubic-bezier(.4,0,.2,1)",overflow:"hidden"}}
          onClick={e=>e.stopPropagation()}>

          {/* Liste commentaires */}
          <div style={{maxHeight:260,overflowY:"auto"}}>
            {comments.map((c, i) => (
              <FunCommentItem key={i} comment={c} />
            ))}
          </div>
          {comments.length > 2 && (
            <div style={{textAlign:"center",padding:8,fontSize:12,color:"var(--text3)",cursor:"pointer",transition:"color .15s"}}
              onMouseEnter={e=>e.target.style.color="var(--gold)"}
              onMouseLeave={e=>e.target.style.color="var(--text3)"}>
              ↓ Voir plus de commentaires
            </div>
          )}

          {/* Zone de saisie */}
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",borderTop:"1px solid var(--border)"}}>
            {/* Avatar */}
            <div style={{width:30,height:30,borderRadius:"50%",background:"linear-gradient(135deg,var(--gold),#e63946)",color:"#000",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontFamily:"Syne,sans-serif"}}>
              {user?.username?.slice(0,2)?.toUpperCase()||"🎵"}
            </div>
            {/* Input wrap */}
            <div style={{flex:1,display:"flex",alignItems:"center",background:"var(--card)",border:"1.5px solid var(--border)",borderRadius:50,padding:"0 6px 0 14px",gap:4,transition:"border-color .2s"}}
              onFocusCapture={e=>e.currentTarget.style.borderColor="var(--gold)"}
              onBlurCapture={e=>e.currentTarget.style.borderColor="var(--border)"}>
              <input ref={inputRef} value={newMsg} onChange={e=>setNewMsg(e.target.value)} onKeyDown={handleSend}
                placeholder={FUN_PLACEHOLDERS[Math.floor(Math.random()*FUN_PLACEHOLDERS.length)]}
                maxLength={280}
                style={{flex:1,background:"none",border:"none",outline:"none",color:"var(--text)",fontFamily:"Plus Jakarta Sans,sans-serif",fontSize:13,padding:"9px 0"}}/>
              <span style={{fontSize:18,cursor:"pointer",padding:"4px 5px",borderRadius:8,transition:"all .15s",flexShrink:0,lineHeight:1}}
                onMouseEnter={e=>{e.target.style.transform="scale(1.2)";e.target.style.background="var(--card2)"}}
                onMouseLeave={e=>{e.target.style.transform="none";e.target.style.background="none"}}>
                😊
              </span>
            </div>
            {/* Bouton envoyer */}
            <button onClick={handleSend} disabled={!newMsg.trim()||sending}
              style={{width:30,height:30,borderRadius:"50%",background:"var(--gold)",border:"none",cursor:newMsg.trim()?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:"#000",flexShrink:0,transition:"all .18s",fontWeight:800,opacity:newMsg.trim()?1:.4}}
              onMouseEnter={e=>{if(newMsg.trim()){e.currentTarget.style.transform="scale(1.08)";e.currentTarget.style.boxShadow="0 3px 12px rgba(245,166,35,.4)"}}}
              onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none"}}>
              ➤
            </button>
          </div>
        </div>
      )}

      {/* ══ MODALS via Portal — évite le tremblement causé par transform de la card ══ */}
      {reportOpen && createPortal(<ReportModal targetType={targetType} targetId={targetId} onClose={()=>setReportOpen(false)} />, document.body)}
      {shareOpen  && createPortal(<ShareModal  targetType={targetType} targetId={targetId} onClose={()=>setShareOpen(false)}  />, document.body)}
    </>
  )
}

/* ── Fun Comment Item ── */
function FunCommentItem({ comment: c }) {
  const [liked, setLiked] = useState(false)
  return (
    <div style={{display:"flex",gap:9,padding:"9px 12px",transition:"background .15s",alignItems:"flex-start"}}
      onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.02)"}
      onMouseLeave={e=>e.currentTarget.style.background="none"}>
      <div style={{width:28,height:28,borderRadius:"50%",background:c.bg,fontSize:10,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:"#000",fontFamily:"Syne,sans-serif"}}>
        {c.ava}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
          <span style={{fontSize:12,fontWeight:700}}>{c.name}</span>
          <span style={{fontSize:10,color:"var(--text3)",fontFamily:"Space Mono,monospace"}}>{c.time}</span>
        </div>
        <div style={{fontSize:13,color:"var(--text2)",lineHeight:1.5,wordBreak:"break-word"}}>{c.text}</div>
        <div style={{display:"flex",gap:10,marginTop:4}}>
          <span onClick={()=>setLiked(l=>!l)}
            style={{fontSize:11,color:liked?"var(--red)":"var(--text3)",cursor:"pointer",display:"flex",alignItems:"center",gap:3,transition:"color .15s"}}>
            ❤️ J&apos;aime
          </span>
          <span style={{fontSize:11,color:"var(--text3)",cursor:"pointer",transition:"color .15s"}}
            onMouseEnter={e=>e.target.style.color="var(--gold)"}
            onMouseLeave={e=>e.target.style.color="var(--text3)"}>
            ↩ Répondre
          </span>
          <span style={{fontSize:11,color:"var(--text3)",cursor:"pointer",transition:"color .15s"}}
            onMouseEnter={e=>e.target.style.color="var(--red)"}
            onMouseLeave={e=>e.target.style.color="var(--text3)"}>
            🚩 Signaler
          </span>
        </div>
      </div>
    </div>
  )
}

/* ── Report Modal ── */
const REPORT_REASONS = [
  { key:"droits_auteur",          icon:"©️",  label:"Violation de droits d'auteur"   },
  { key:"contenu_inapproprie",    icon:"🚫",  label:"Contenu inapproprié / offensant" },
  { key:"spam",                   icon:"📢",  label:"Spam ou contenu trompeur"        },
  { key:"fausse_info",            icon:"❌",  label:"Fausse information"              },
  { key:"violence",               icon:"⚠️",  label:"Violence ou contenu dangereux"  },
  { key:"autre",                  icon:"🔍",  label:"Autre raison"                    },
]

export function ReportModal({ targetType, targetId, onClose }) {
  const { user } = useAuthStore()
  const [selected, setSelected] = useState(null)
  const [details,  setDetails]  = useState("")
  const [sending,  setSending]  = useState(false)
  const [sent,     setSent]     = useState(false)

  const submit = async () => {
    if (!selected) return
    setSending(true)
    try {
      if (user) await api.social.report?.({ target_type:targetType, target_id:targetId, reason:selected, details })
      setSent(true)
    } catch(e){} finally { setSending(false) }
  }

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",backdropFilter:"blur(10px)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:20,animation:"fadeIn .2s ease"}}
      onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div style={{background:"var(--bg2)",border:"1px solid var(--border)",borderRadius:22,padding:28,width:"100%",maxWidth:440,animation:"slideIn .3s ease",maxHeight:"90vh",overflowY:"auto"}}>
        {sent ? (
          <div style={{textAlign:"center",padding:"30px 0"}}>
            <div style={{fontSize:52,marginBottom:16}}>✅</div>
            <div style={{fontFamily:"Syne,sans-serif",fontSize:18,fontWeight:700,marginBottom:8}}>Signalement envoyé</div>
            <div style={{fontSize:13,color:"var(--text2)",marginBottom:24}}>Notre équipe va examiner ce contenu. Merci de nous aider à maintenir une communauté saine.</div>
            <button onClick={onClose} style={{padding:"10px 28px",background:"var(--gold)",color:"#000",border:"none",borderRadius:50,fontWeight:700,cursor:"pointer",fontSize:14}}>Fermer</button>
          </div>
        ) : (<>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:22}}>
            <div style={{fontFamily:"Syne,sans-serif",fontSize:20,fontWeight:700}}>🚩 Signaler ce contenu</div>
            <button onClick={onClose} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:8,padding:"7px 12px",cursor:"pointer",color:"var(--text)",fontSize:14}}>✕</button>
          </div>
          <div style={{fontSize:12,color:"var(--text2)",marginBottom:14}}>Sélectionnez la raison du signalement :</div>
          <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:16}}>
            {REPORT_REASONS.map(r => (
              <div key={r.key} onClick={()=>setSelected(r.key)}
                style={{display:"flex",alignItems:"center",gap:11,padding:"11px 14px",border:"1px solid",borderRadius:"var(--radius-sm)",cursor:"pointer",transition:"all .18s",fontSize:13,borderColor:selected===r.key?"var(--red)":"var(--border)",color:selected===r.key?"var(--red)":"var(--text)",background:selected===r.key?"rgba(230,57,70,.06)":"var(--card)"}}>
                <span style={{fontSize:18}}>{r.icon}</span>
                {r.label}
                {selected===r.key && <span style={{marginLeft:"auto"}}>✓</span>}
              </div>
            ))}
          </div>
          <textarea value={details} onChange={e=>setDetails(e.target.value)}
            placeholder="Détails supplémentaires (optionnel)..."
            style={{width:"100%",background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--radius-sm)",padding:"10px 14px",color:"var(--text)",fontFamily:"Plus Jakarta Sans,sans-serif",fontSize:13,outline:"none",resize:"vertical",minHeight:72,marginBottom:16,boxSizing:"border-box"}}
            onFocus={e=>e.target.style.borderColor="var(--red)"}
            onBlur={e=>e.target.style.borderColor="var(--border)"}/>
          <div style={{display:"flex",gap:10}}>
            <button onClick={onClose} style={{flex:1,padding:11,background:"var(--card2)",border:"1px solid var(--border)",borderRadius:"var(--radius-sm)",color:"var(--text2)",fontWeight:600,cursor:"pointer",fontSize:13,fontFamily:"Plus Jakarta Sans,sans-serif"}}>Annuler</button>
            <button onClick={submit} disabled={!selected||sending}
              style={{flex:2,padding:11,background:selected?"var(--red)":"var(--card2)",border:"none",borderRadius:"var(--radius-sm)",color:selected?"#fff":"var(--text3)",fontWeight:700,cursor:selected?"pointer":"default",fontSize:13,transition:"all .2s",fontFamily:"Plus Jakarta Sans,sans-serif"}}>
              {sending?"⏳ Envoi...":"🚩 Envoyer le signalement"}
            </button>
          </div>
        </>)}
      </div>
    </div>
  )
}

/* ── Share Modal ── */
export function ShareModal({ targetType, targetId, onClose }) {
  const [copied, setCopied] = useState(false)
  const url = `${window.location.origin}?${targetType}=${targetId}`
  const platforms = [
    { name:"WhatsApp", icon:"💬", color:"#25d366", href:`https://wa.me/?text=${encodeURIComponent(url)}` },
    { name:"Facebook", icon:"📘", color:"#1877f2", href:`https://facebook.com/sharer?u=${encodeURIComponent(url)}` },
    { name:"Twitter",  icon:"🐦", color:"#1da1f2", href:`https://twitter.com/share?url=${encodeURIComponent(url)}` },
    { name:"Telegram", icon:"✈️", color:"#0088cc", href:`https://t.me/share/url?url=${encodeURIComponent(url)}` },
  ]
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",backdropFilter:"blur(10px)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:20,animation:"fadeIn .2s ease"}}
      onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div style={{background:"var(--bg2)",border:"1px solid var(--border)",borderRadius:22,padding:28,width:"100%",maxWidth:400,animation:"slideIn .3s ease"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:22}}>
          <div style={{fontFamily:"Syne,sans-serif",fontSize:20,fontWeight:700}}>📤 Partager</div>
          <button onClick={onClose} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:8,padding:"7px 12px",cursor:"pointer",color:"var(--text)",fontSize:14}}>✕</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
          {platforms.map(p => (
            <a key={p.name} href={p.href} target="_blank" rel="noreferrer"
              style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5,padding:"12px 8px",background:"var(--card2)",border:"1px solid var(--border)",borderRadius:"var(--radius-sm)",textDecoration:"none",color:"var(--text)",fontSize:11,transition:"all .18s",cursor:"pointer"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=p.color;e.currentTarget.style.color=p.color}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.color="var(--text)"}}>
              <span style={{fontSize:22}}>{p.icon}</span>{p.name}
            </a>
          ))}
        </div>
        <div style={{display:"flex",gap:8}}>
          <input readOnly value={url} style={{flex:1,background:"var(--bg2)",border:"1px solid var(--border)",borderRadius:"var(--radius-sm)",padding:"9px 14px",color:"var(--text2)",fontSize:11,fontFamily:"Space Mono,monospace",outline:"none"}}/>
          <button onClick={()=>{navigator.clipboard.writeText(url);setCopied(true);setTimeout(()=>setCopied(false),2000)}}
            style={{padding:"9px 16px",background:copied?"var(--green)":"var(--gold)",border:"none",borderRadius:"var(--radius-sm)",color:"#000",fontWeight:700,cursor:"pointer",fontSize:12,transition:"all .2s",flexShrink:0,fontFamily:"Plus Jakarta Sans,sans-serif"}}>
            {copied?"✓ Copié":"Copier"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ReactionBar
