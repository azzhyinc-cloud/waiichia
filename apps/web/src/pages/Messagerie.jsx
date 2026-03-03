import { useState, useEffect, useRef } from "react"
import { useAuthStore, usePageStore } from "../stores/index.js"
import api from "../services/api.js"

const timeAgo = (d) => {
  if (!d) return ""
  const diff = (Date.now() - new Date(d)) / 1000
  if (diff < 60) return "maintenant"
  if (diff < 3600) return Math.floor(diff/60) + "m"
  if (diff < 86400) return Math.floor(diff/3600) + "h"
  return Math.floor(diff/86400) + "j"
}

const Avatar = ({ profile, size = 40 }) => {
  const initials = (profile?.display_name || profile?.username || "?").slice(0,2).toUpperCase()
  const colors = ["linear-gradient(135deg,#f5a623,#e63946)","linear-gradient(135deg,#9b59f5,#6c3483)","linear-gradient(135deg,#4d9fff,#9b59f5)","linear-gradient(135deg,#2dc653,#00bfa5)","linear-gradient(135deg,#f5a623,#e8920a)"]
  const bg = colors[(profile?.username||"").length % colors.length]
  return (
    <div style={{width:size,height:size,borderRadius:"50%",background:profile?.avatar_url?"#000":bg,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:size*0.35,color:"#000",flexShrink:0,overflow:"hidden"}}>
      {profile?.avatar_url ? <img src={profile.avatar_url} style={{width:"100%",height:"100%",objectFit:"cover"}}/> : initials}
    </div>
  )
}

export default function Messagerie() {
  const { user } = useAuthStore()
  const { setPage } = usePageStore()
  const [convs, setConvs] = useState([])
  const [activeConv, setActiveConv] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQ, setSearchQ] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [showTracks, setShowTracks] = useState(false)
  const [myTracks, setMyTracks] = useState([])
  const [polling, setPolling] = useState(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (user) { loadConvs(); loadMyTracks() }
    return () => { if (polling) clearInterval(polling) }
  }, [user])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (activeConv) {
      const interval = setInterval(() => loadMessages(activeConv.id, false), 3000)
      setPolling(interval)
      return () => clearInterval(interval)
    }
  }, [activeConv?.id])

  const loadConvs = async () => {
    setLoading(true)
    try {
      const data = await api.messages.conversations()
      setConvs(data.conversations || [])
    } catch(e) {}
    setLoading(false)
  }

  const loadMessages = async (convId, scroll = true) => {
    try {
      const data = await api.messages.getMessages(convId)
      setMessages(data.messages || [])
      if (scroll) setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
      // Mettre a jour unread dans la liste
      setConvs(cs => cs.map(c => c.id === convId ? {...c, unread: 0} : c))
    } catch(e) {}
  }

  const loadMyTracks = async () => {
    try {
      const data = await api.tracks.myTracks()
      setMyTracks(data.tracks || [])
    } catch(e) {}
  }

  const selectConv = (conv) => {
    if (polling) clearInterval(polling)
    setActiveConv(conv)
    loadMessages(conv.id)
    setShowSearch(false)
  }

  const sendMessage = async (e) => {
    e?.preventDefault()
    if (!input.trim() || !activeConv || sending) return
    setSending(true)
    const txt = input.trim()
    setInput("")
    try {
      const res = await api.messages.send(activeConv.id, { content: txt, message_type: "text" })
      setMessages(ms => [...ms, res.message])
      setConvs(cs => cs.map(c => c.id === activeConv.id ? {...c, last_message: txt, last_message_at: new Date().toISOString()} : c))
    } catch(e) {}
    setSending(false)
    inputRef.current?.focus()
  }

  const sendTrack = async (track) => {
    if (!activeConv) return
    setShowTracks(false)
    try {
      const res = await api.messages.send(activeConv.id, { content: "🎵 " + track.title, message_type: "track", track_id: track.id })
      setMessages(ms => [...ms, res.message])
      setConvs(cs => cs.map(c => c.id === activeConv.id ? {...c, last_message: "🎵 Son partage"} : c))
    } catch(e) {}
  }

  const searchUsers = async (q) => {
    setSearchQ(q)
    if (q.length < 2) { setSearchResults([]); return }
    setSearching(true)
    try {
      const data = await api.messages.searchUsers(q)
      setSearchResults(data.users || [])
    } catch(e) {}
    setSearching(false)
  }

  const startConv = async (otherUser) => {
    try {
      const res = await api.messages.startConv(otherUser.id)
      const conv = { ...res.conversation, other: otherUser, unread: 0, last_message: "" }
      setConvs(cs => {
        const exists = cs.find(c => c.id === conv.id)
        if (exists) { selectConv(exists); return cs }
        const updated = [conv, ...cs]
        selectConv(conv)
        return updated
      })
      setShowSearch(false)
      setSearchQ("")
      setSearchResults([])
    } catch(e) {}
  }

  const totalUnread = convs.reduce((a, c) => a + (c.unread || 0), 0)

  if (!user) return (
    <div style={{textAlign:"center",padding:80}}>
      <div style={{fontSize:56,marginBottom:16}}>💬</div>
      <h2>Messagerie</h2>
      <button onClick={()=>setPage("login")} style={{marginTop:16,background:"var(--primary)",border:"none",color:"#fff",padding:"10px 24px",borderRadius:8,cursor:"pointer"}}>Se connecter</button>
    </div>
  )

  return (
    <div style={{padding:"24px 20px 100px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
        <h1 style={{fontSize:24,fontWeight:900,margin:0}}>
          💬 Messagerie
          {totalUnread > 0 && <span style={{marginLeft:10,background:"var(--gold)",color:"#000",borderRadius:99,padding:"2px 10px",fontSize:13,fontWeight:800}}>{totalUnread}</span>}
        </h1>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"280px 1fr",background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,overflow:"hidden",height:"calc(100vh - 220px)",minHeight:500}}>

        {/* ── LISTE CONVERSATIONS ── */}
        <div style={{borderRight:"1px solid var(--border)",display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{padding:"14px 16px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
            <span style={{fontWeight:800,fontSize:15}}>Conversations</span>
            <button onClick={()=>setShowSearch(!showSearch)}
              style={{background:"var(--primary)",border:"none",color:"#fff",borderRadius:7,padding:"4px 10px",cursor:"pointer",fontSize:12,fontWeight:700}}>
              + Nouveau
            </button>
          </div>

          {/* RECHERCHE UTILISATEUR */}
          {showSearch && (
            <div style={{padding:"10px 12px",borderBottom:"1px solid var(--border)",background:"var(--card2)"}}>
              <input autoFocus value={searchQ} onChange={e=>searchUsers(e.target.value)}
                placeholder="Rechercher un artiste..."
                style={{width:"100%",background:"var(--card)",border:"1px solid var(--border)",borderRadius:8,padding:"8px 12px",color:"var(--text)",fontSize:13,boxSizing:"border-box",outline:"none"}}/>
              {searching && <div style={{fontSize:12,color:"var(--text3)",padding:"6px 4px"}}>🔍 Recherche...</div>}
              {searchResults.map(u=>(
                <div key={u.id} onClick={()=>startConv(u)}
                  style={{display:"flex",alignItems:"center",gap:10,padding:"8px 4px",cursor:"pointer",borderRadius:8}}
                  onMouseEnter={e=>e.currentTarget.style.background="var(--card)"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <Avatar profile={u} size={32}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.display_name||u.username}</div>
                    <div style={{fontSize:11,color:"var(--text3)"}}>@{u.username} · {u.profile_type||"artiste"}</div>
                  </div>
                </div>
              ))}
              {searchQ.length>=2 && searchResults.length===0 && !searching && (
                <div style={{fontSize:12,color:"var(--text3)",padding:"6px 4px"}}>Aucun utilisateur trouve</div>
              )}
            </div>
          )}

          {/* LISTE */}
          <div style={{overflowY:"auto",flex:1}}>
            {loading ? (
              <div style={{padding:20,textAlign:"center",color:"var(--text3)",fontSize:13}}>⏳ Chargement...</div>
            ) : convs.length === 0 ? (
              <div style={{padding:24,textAlign:"center",color:"var(--text3)"}}>
                <div style={{fontSize:36,marginBottom:8}}>💬</div>
                <p style={{fontSize:13}}>Aucune conversation</p>
                <button onClick={()=>setShowSearch(true)} style={{fontSize:12,background:"var(--primary)",border:"none",color:"#fff",borderRadius:7,padding:"6px 14px",cursor:"pointer"}}>Demarrer une conv</button>
              </div>
            ) : convs.map(c=>(
              <div key={c.id} onClick={()=>selectConv(c)}
                style={{display:"flex",alignItems:"center",gap:11,padding:"12px 16px",borderBottom:"1px solid var(--border)",cursor:"pointer",transition:"background 0.15s",
                  background:activeConv?.id===c.id?"var(--card2)":"transparent",
                  borderLeft:activeConv?.id===c.id?"3px solid var(--gold)":"3px solid transparent"}}
                onMouseEnter={e=>{if(activeConv?.id!==c.id)e.currentTarget.style.background="var(--card2)"}}
                onMouseLeave={e=>{if(activeConv?.id!==c.id)e.currentTarget.style.background="transparent"}}>
                <Avatar profile={c.other} size={40}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    {c.other?.display_name||c.other?.username||"Utilisateur"}
                    {c.other?.is_verified && " ✓"}
                  </div>
                  <div style={{fontSize:11,color:"var(--text2)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.last_message||"Nouvelle conversation"}</div>
                </div>
                <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4,flexShrink:0}}>
                  <div style={{fontSize:10,color:"var(--text3)",fontFamily:"monospace"}}>{timeAgo(c.last_message_at)}</div>
                  {c.unread > 0 && <div style={{width:8,height:8,background:"var(--gold)",borderRadius:"50%"}}/>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── ZONE CHAT ── */}
        {!activeConv ? (
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:"var(--text3)",gap:12}}>
            <div style={{fontSize:56}}>💬</div>
            <div style={{fontWeight:700,fontSize:16}}>Selectionnez une conversation</div>
            <div style={{fontSize:13}}>ou commencez-en une nouvelle</div>
            <button onClick={()=>setShowSearch(true)} style={{background:"var(--primary)",border:"none",color:"#fff",borderRadius:8,padding:"10px 24px",cursor:"pointer",fontWeight:700,marginTop:8}}>+ Nouvelle conversation</button>
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",overflow:"hidden"}}>
            {/* HEADER */}
            <div style={{padding:"14px 18px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
              <Avatar profile={activeConv.other} size={40}/>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:14}}>{activeConv.other?.display_name||activeConv.other?.username}</div>
                <div style={{fontSize:11,color:"#2cc653"}}>● En ligne</div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>setShowTracks(!showTracks)}
                  style={{background:"var(--card2)",border:"1px solid var(--border)",color:"var(--text2)",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:12,fontWeight:600}}>
                  🎵 Partager son
                </button>
              </div>
            </div>

            {/* PANEL PARTAGE SON */}
            {showTracks && (
              <div style={{padding:"12px 18px",borderBottom:"1px solid var(--border)",background:"var(--card2)",maxHeight:180,overflowY:"auto",flexShrink:0}}>
                <div style={{fontSize:12,fontWeight:700,color:"var(--text3)",marginBottom:8,letterSpacing:1}}>VOS SONS</div>
                {myTracks.length===0 ? (
                  <div style={{fontSize:12,color:"var(--text3)"}}>Aucun son publie</div>
                ) : myTracks.map(t=>(
                  <div key={t.id} onClick={()=>sendTrack(t)}
                    style={{display:"flex",alignItems:"center",gap:10,padding:"6px 8px",borderRadius:8,cursor:"pointer",marginBottom:4}}
                    onMouseEnter={e=>e.currentTarget.style.background="var(--card)"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <div style={{width:36,height:36,borderRadius:8,background:"var(--card)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0,overflow:"hidden"}}>
                      {t.cover_url ? <img src={t.cover_url} style={{width:"100%",height:"100%",objectFit:"cover"}}/> : "🎵"}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.title}</div>
                      <div style={{fontSize:11,color:"var(--text3)"}}>{t.genre||"Musique"}</div>
                    </div>
                    <span style={{fontSize:11,color:"var(--gold)",fontWeight:700}}>Envoyer →</span>
                  </div>
                ))}
              </div>
            )}

            {/* MESSAGES */}
            <div style={{flex:1,overflowY:"auto",padding:18,display:"flex",flexDirection:"column",gap:12}}>
              {messages.length===0 && (
                <div style={{textAlign:"center",color:"var(--text3)",padding:40}}>
                  <div style={{fontSize:40,marginBottom:8}}>👋</div>
                  <p style={{fontSize:13}}>Commencez la conversation !</p>
                </div>
              )}
              {messages.map((m,i)=>{
                const isMe = m.sender_id === user.id
                const isTrack = m.message_type === "track"
                return (
                  <div key={m.id||i} style={{display:"flex",flexDirection:"column",alignItems:isMe?"flex-end":"flex-start",gap:3}}>
                    {isTrack && m.track ? (
                      <div style={{maxWidth:"68%",background:isMe?"linear-gradient(135deg,var(--gold),#e8920a)":"var(--card2)",borderRadius:isMe?"16px 16px 4px 16px":"4px 16px 16px 16px",padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}>
                        <div style={{width:44,height:44,borderRadius:8,background:"var(--card)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0,overflow:"hidden"}}>
                          {m.track.cover_url ? <img src={m.track.cover_url} style={{width:"100%",height:"100%",objectFit:"cover"}}/> : "🎵"}
                        </div>
                        <div>
                          <div style={{fontSize:13,fontWeight:700,color:isMe?"#000":"var(--text)"}}>{m.track.title}</div>
                          <div style={{fontSize:11,color:isMe?"rgba(0,0,0,0.6)":"var(--text3)"}}>Son partage</div>
                        </div>
                      </div>
                    ) : (
                      <div style={{maxWidth:"68%",background:isMe?"linear-gradient(135deg,var(--gold),#e8920a)":"var(--card2)",borderRadius:isMe?"16px 16px 4px 16px":"4px 16px 16px 16px",padding:"10px 14px",fontSize:13,lineHeight:1.5,color:isMe?"#000":"var(--text)"}}>
                        {m.content}
                      </div>
                    )}
                    <div style={{fontSize:10,color:"var(--text3)",fontFamily:"monospace",paddingLeft:4,paddingRight:4}}>
                      {timeAgo(m.created_at)}{isMe && (m.is_read ? " · Lu" : " · Envoye")}
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef}/>
            </div>

            {/* INPUT */}
            <div style={{padding:"14px 18px",borderTop:"1px solid var(--border)",display:"flex",gap:10,alignItems:"center",flexShrink:0}}>
              <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&sendMessage(e)}
                placeholder="Ecrire un message..."
                style={{flex:1,background:"var(--card2)",border:"1px solid var(--border)",borderRadius:50,padding:"10px 18px",color:"var(--text)",fontSize:13,outline:"none"}}/>
              <button onClick={sendMessage} disabled={!input.trim()||sending}
                style={{background:!input.trim()||sending?"var(--border)":"var(--primary)",border:"none",color:"#fff",borderRadius:8,padding:"10px 18px",cursor:!input.trim()||sending?"not-allowed":"pointer",fontWeight:700,fontSize:13,flexShrink:0}}>
                {sending?"...":"Envoyer"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
