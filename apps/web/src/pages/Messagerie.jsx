import { useState, useEffect, useRef } from "react"
import { useAuthStore, usePageStore, usePlayerStore } from "../stores/index.js"
import api from "../services/api.js"

const COLORS=['linear-gradient(135deg,#f5a623,#e63946)','linear-gradient(135deg,#4d9fff,#9b59f5)','linear-gradient(135deg,#2dc653,#00bfa5)','linear-gradient(135deg,#9b59f5,#6c3483)','linear-gradient(135deg,#ff6b35,#cc4411)']
const EMOJIS=['😀','😂','🥰','😍','🤩','😎','🥳','😭','🔥','❤️','💯','👏','🙌','✨','🎵','🎶','🎤','🎧','🎸','🥁','🎹','🎺','💿','📻','🌊','🏝️','🇰🇲','🌍','💪','🤝','👋','✌️','🤙','💬','📩','🎪','🎉','🏆','⭐','💰','🛒','📢','🎯','💡','⚡']
const REACTIONS=['❤️','🔥','😂','👏','😍','💯']
const API_URL=import.meta.env.VITE_API_URL||''
const getToken=()=>localStorage.getItem('waiichia_token')

export default function Messagerie(){
  const {user}=useAuthStore()
  const {setPage}=usePageStore()
  const {play}=usePlayerStore()
  const [convs,setConvs]=useState([])
  const [activeConv,setActiveConv]=useState(null)
  const [messages,setMessages]=useState([])
  const [input,setInput]=useState('')
  const [loading,setLoading]=useState(true)
  const [uploading,setUploading]=useState(false)
  const [searchMode,setSearchMode]=useState(false)
  const [searchQ,setSearchQ]=useState('')
  const [searchResults,setSearchResults]=useState([])
  const [showEmoji,setShowEmoji]=useState(false)
  const [showTrackPicker,setShowTrackPicker]=useState(false)
  const [trackSearch,setTrackSearch]=useState('')
  const [trackResults,setTrackResults]=useState([])
  const [recording,setRecording]=useState(false)
  const [recordTime,setRecordTime]=useState(0)
  const [reactMsg,setReactMsg]=useState(null)

  const msgsEnd=useRef(null)
  const pollRef=useRef(null)
  const mediaRef=useRef(null)
  const chunksRef=useRef([])
  const timerRef=useRef(null)
  const imgRef=useRef(null)
  const activeConvRef=useRef(null)

  // Keep ref in sync
  useEffect(()=>{activeConvRef.current=activeConv},[activeConv])

  // Load conversations
  useEffect(()=>{
    if(!user)return
    loadConvs()
  },[user])

  const loadConvs=()=>{
    api.messages.conversations()
      .then(d=>{setConvs(d.conversations||[]);setLoading(false)})
      .catch(()=>setLoading(false))
  }

  const loadMessages=(convId)=>{
    if(!convId)return
    api.messages.messages(convId)
      .then(d=>setMessages(d.messages||[]))
      .catch(()=>setMessages([]))
  }

  // Load messages + poll
  useEffect(()=>{
    if(!activeConv?.id)return
    loadMessages(activeConv.id)
    if(pollRef.current)clearInterval(pollRef.current)
    pollRef.current=setInterval(()=>loadMessages(activeConvRef.current?.id),5000)
    return()=>{if(pollRef.current)clearInterval(pollRef.current)}
  },[activeConv])

  useEffect(()=>{msgsEnd.current?.scrollIntoView({behavior:'smooth'})},[messages])

  // Search users
  useEffect(()=>{
    if(!searchQ||searchQ.length<2){setSearchResults([]);return}
    const t=setTimeout(()=>{
      api.messages.searchUsers(searchQ).then(d=>setSearchResults(d.users||[])).catch(()=>{})
    },300)
    return()=>clearTimeout(t)
  },[searchQ])

  // Search tracks
  useEffect(()=>{
    if(!trackSearch||trackSearch.length<2){setTrackResults([]);return}
    const t=setTimeout(()=>{
      fetch(API_URL+'/api/tracks?search='+encodeURIComponent(trackSearch)+'&limit=8',{
        headers:{'Authorization':'Bearer '+getToken()}
      }).then(r=>r.json()).then(d=>setTrackResults(d.tracks||d.data||[])).catch(()=>setTrackResults([]))
    },300)
    return()=>clearTimeout(t)
  },[trackSearch])

  // === ACTIONS ===

  const startConv=async(otherId,otherName)=>{
    try{
      const d=await api.messages.createConv(otherId)
      const conv={...d.conversation,other:{id:otherId,display_name:otherName}}
      setActiveConv(conv)
      setSearchMode(false)
      setSearchQ('')
      loadConvs()
    }catch(e){alert('Erreur: '+e.message)}
  }

  const sendMessage=async(content,msgType='text')=>{
    const convId=activeConvRef.current?.id
    if(!convId||!content)return
    // Optimistic
    setMessages(p=>[...p,{id:'tmp_'+Date.now(),sender_id:user.id,content,message_type:msgType,created_at:new Date().toISOString()}])
    try{
      await fetch(API_URL+'/api/messages/conversations/'+convId+'/messages',{
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':'Bearer '+getToken()},
        body:JSON.stringify({content,message_type:msgType})
      })
      setTimeout(()=>loadMessages(convId),500)
      setTimeout(()=>loadConvs(),1000)
    }catch(e){console.error('Send error:',e)}
  }

  const sendText=()=>{
    if(!input.trim())return
    sendMessage(input,'text')
    setInput('')
  }

  const shareTrack=(track)=>{
    sendMessage('🎵 '+track.title+' — '+(track.profiles?.display_name||'Artiste'),'track')
    setShowTrackPicker(false)
    setTrackSearch('')
  }

  // Voice recording
  const startRecording=async()=>{
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:true})
      const mr=new MediaRecorder(stream)
      mediaRef.current=mr
      chunksRef.current=[]
      mr.ondataavailable=e=>chunksRef.current.push(e.data)
      mr.onstop=async()=>{
        stream.getTracks().forEach(t=>t.stop())
        const blob=new Blob(chunksRef.current,{type:'audio/webm'})
        setUploading(true)
        try{
          const form=new FormData()
          form.append('file',blob,'voice_'+Date.now()+'.webm')
          const res=await fetch(API_URL+'/api/upload/cover',{method:'POST',headers:{'Authorization':'Bearer '+getToken()},body:form})
          const data=await res.json()
          if(data.url){
            await sendMessage(data.url,'voice')
          }else{
            console.error('Voice upload failed:',data)
          }
        }catch(e){console.error('Voice error:',e)}
        setUploading(false)
      }
      mr.start()
      setRecording(true)
      setRecordTime(0)
      timerRef.current=setInterval(()=>setRecordTime(t=>t+1),1000)
    }catch(e){alert('Microphone non disponible')}
  }

  const stopRecording=()=>{
    if(mediaRef.current&&mediaRef.current.state==='recording'){
      mediaRef.current.stop()
    }
    setRecording(false)
    if(timerRef.current)clearInterval(timerRef.current)
  }

  const cancelRecording=()=>{
    if(mediaRef.current){
      if(mediaRef.current.state==='recording'){
        mediaRef.current.stream.getTracks().forEach(t=>t.stop())
      }
      mediaRef.current=null
    }
    chunksRef.current=[]
    setRecording(false)
    if(timerRef.current)clearInterval(timerRef.current)
  }

  // Send image
  const handleImage=async(file)=>{
    if(!file)return
    setUploading(true)
    try{
      const form=new FormData()
      form.append('file',file)
      const res=await fetch(API_URL+'/api/upload/cover',{method:'POST',headers:{'Authorization':'Bearer '+getToken()},body:form})
      const data=await res.json()
      if(data.url){
        await sendMessage(data.url,'image')
      }
    }catch(e){console.error(e)}
    setUploading(false)
  }

  // React to message
  const reactTo=(msgId,emoji)=>{
    setMessages(ms=>ms.map(m=>m.id===msgId?{...m,reaction:emoji}:m))
    setReactMsg(null)
  }

  // === GUARDS ===
  if(!user)return(
    <div style={{textAlign:'center',padding:60}}>
      <div style={{fontSize:48,marginBottom:16}}>🔒</div>
      <h2 style={{fontFamily:'Syne,sans-serif'}}>Connectez-vous</h2>
      <button className="btn btn-primary" onClick={()=>setPage('login')} style={{marginTop:16}}>Se connecter</button>
    </div>
  )

  // === HELPERS ===
  const getOther=(c)=>c.other||c.p2||c.p1||{}
  const fmtTime=(d)=>{
    if(!d)return''
    const dt=new Date(d)
    const now=new Date()
    if(dt.toDateString()===now.toDateString())return dt.toLocaleTimeString('fr',{hour:'2-digit',minute:'2-digit'})
    return dt.toLocaleDateString('fr',{day:'numeric',month:'short'})
  }
  const fmtRec=(s)=>Math.floor(s/60)+':'+String(s%60).padStart(2,'0')
  const cleanLast=(msg)=>{
    if(!msg)return 'Nouvelle conversation'
    if(msg.startsWith('http'))return '📷 Photo'
    if(msg.startsWith('🎵'))return msg
    return msg
  }

  // === RENDER BUBBLE ===
  const renderBubble=(m)=>{
    const isMe=m.sender_id===user.id
    const cls='msg-bubble '+(isMe?'msg-out':'msg-in')
    const timeEl=<div style={{fontSize:9,color:isMe?'rgba(0,0,0,.5)':'var(--text3)',marginTop:4,textAlign:'right'}}>{fmtTime(m.created_at)}</div>
    const reactionEl=m.reaction?<span style={{position:'absolute',bottom:-8,[isMe?'right':'left']:8,fontSize:14,background:'var(--card)',borderRadius:20,padding:'1px 4px',border:'1px solid var(--border)'}}>{m.reaction}</span>:null

    let content=null

    if(m.message_type==='voice'){
      content=<div style={{display:'flex',alignItems:'center',gap:8}}>
        <span style={{fontSize:18}}>🎤</span>
        <audio src={m.content} controls preload="metadata" style={{height:32,maxWidth:200,borderRadius:16}}/>
      </div>
    }else if(m.message_type==='image'){
      content=<img src={m.content} alt="" style={{maxWidth:220,maxHeight:220,borderRadius:12,objectFit:'cover',display:'block'}}/>
    }else if(m.message_type==='track'){
      content=<div style={{display:'flex',alignItems:'center',gap:10,padding:4,background:isMe?'rgba(0,0,0,.1)':'var(--card2)',borderRadius:10,cursor:'pointer'}}>
        <div style={{width:40,height:40,borderRadius:8,background:'linear-gradient(135deg,var(--gold),#e63946)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>🎵</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:12,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.content?.replace('🎵 ','')}</div>
          <div style={{fontSize:10,color:isMe?'rgba(0,0,0,.6)':'var(--text3)'}}>Appuyer pour ecouter</div>
        </div>
        <span style={{fontSize:18}}>▶</span>
      </div>
    }else{
      content=m.content
    }

    return(
      <div key={m.id} style={{position:'relative',marginBottom:m.reaction?12:0}}>
        <div className={cls} onDoubleClick={()=>setReactMsg(reactMsg===m.id?null:m.id)} style={m.message_type==='image'?{padding:4}:undefined}>
          {content}
          {timeEl}
        </div>
        {reactionEl}
        {reactMsg===m.id&&<div style={{position:'absolute',bottom:-4,left:'50%',transform:'translateX(-50%)',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:20,padding:'4px 6px',display:'flex',gap:2,zIndex:60,boxShadow:'0 4px 16px rgba(0,0,0,.3)'}}>
          {REACTIONS.map(r=><span key={r} onClick={e=>{e.stopPropagation();reactTo(m.id,r)}} style={{fontSize:18,cursor:'pointer',padding:'2px 4px',borderRadius:8,transition:'transform .1s'}} onMouseEnter={e=>e.currentTarget.style.transform='scale(1.3)'} onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}>{r}</span>)}
        </div>}
      </div>
    )
  }

  // === MAIN RENDER ===
  return(
    <div style={{paddingBottom:0}}>
      <div className="page-title">💬 Messagerie</div>
      <input type="file" ref={imgRef} accept="image/*" style={{display:'none'}} onChange={e=>{handleImage(e.target.files[0]);e.target.value=''}}/>

      <div className="messages-layout">
        {/* LEFT: CONVERSATIONS */}
        <div className="conv-list">
          <div className="conv-list-hdr">
            Conversations
            <button className="btn btn-xs btn-primary" onClick={()=>setSearchMode(!searchMode)}>+ Nouveau</button>
          </div>

          {searchMode&&<div style={{padding:'8px 12px',borderBottom:'1px solid var(--border)'}}>
            <input className="input-field" placeholder="Rechercher un utilisateur..." value={searchQ} onChange={e=>setSearchQ(e.target.value)} autoFocus style={{fontSize:13,padding:'8px 12px'}}/>
            {searchResults.map(u=><div key={u.id} onClick={()=>startConv(u.id,u.display_name)} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 8px',cursor:'pointer',borderBottom:'1px solid var(--border)'}} onMouseEnter={e=>e.currentTarget.style.background='var(--card2)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <div style={{width:36,height:36,borderRadius:'50%',background:COLORS[u.display_name?.charCodeAt(0)%5],display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:13,color:'#000',flexShrink:0}}>{u.avatar_url?<img src={u.avatar_url} style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}} alt=""/>:(u.display_name?.[0]||'?')}</div>
              <div><div style={{fontWeight:600,fontSize:13}}>{u.display_name}</div><div style={{fontSize:11,color:'var(--text3)'}}>@{u.username}</div></div>
            </div>)}
            {searchQ.length>=2&&!searchResults.length&&<div style={{padding:12,textAlign:'center',color:'var(--text3)',fontSize:12}}>Aucun utilisateur trouve</div>}
          </div>}

          {loading?<div style={{padding:20,textAlign:'center',color:'var(--text3)'}}>Chargement...</div>:
           convs.length?convs.map((c,i)=>{
            const other=getOther(c)
            return <div key={c.id} className={'conv-item'+(activeConv?.id===c.id?' active':'')} onClick={()=>setActiveConv(c)}>
              <div className="conv-ava" style={{background:COLORS[i%5],color:'#000'}}>{other.avatar_url?<img src={other.avatar_url} style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}} alt=""/>:(other.display_name?.[0]||'?')}</div>
              <div className="conv-info">
                <div className="conv-name">{other.display_name||'Utilisateur'}</div>
                <div className="conv-last">{cleanLast(c.last_message)}</div>
              </div>
              <div className="conv-meta">
                <div className="conv-time">{fmtTime(c.last_message_at)}</div>
                {c.unread>0&&<div className="unread-dot"/>}
              </div>
            </div>
          }):<div style={{padding:30,textAlign:'center',color:'var(--text3)'}}>
            <div style={{fontSize:36,marginBottom:10}}>💬</div>
            <div style={{fontSize:13}}>Aucune conversation</div>
            <button className="btn btn-sm btn-primary" onClick={()=>setSearchMode(true)} style={{marginTop:12}}>Demarrer une conversation</button>
          </div>}
        </div>

        {/* RIGHT: CHAT */}
        <div className="chat-area">
          {activeConv?<>
            {/* Header */}
            <div className="chat-hdr">
              <div style={{width:36,height:36,borderRadius:'50%',background:COLORS[0],display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:13,color:'#000',flexShrink:0}}>
                {getOther(activeConv).avatar_url?<img src={getOther(activeConv).avatar_url} style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}} alt=""/>:(getOther(activeConv).display_name?.[0]||'?')}
              </div>
              <div style={{flex:1}}>
                <div style={{fontWeight:600,fontSize:14}}>{getOther(activeConv).display_name||'Conversation'}</div>
                <div style={{fontSize:11,color:'var(--text3)'}}>@{getOther(activeConv).username||''}</div>
              </div>
            </div>

            {/* Messages */}
            <div className="chat-msgs" onClick={()=>{setReactMsg(null);setShowEmoji(false);setShowTrackPicker(false)}}>
              {messages.length?messages.map(m=>renderBubble(m)):
                <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text3)',fontSize:13}}>Envoyez votre premier message 👋</div>
              }
              <div ref={msgsEnd}/>
            </div>

            {/* Upload progress */}
            {uploading&&<div style={{height:3,background:'var(--border)',width:'100%'}}><div style={{height:'100%',background:'var(--gold)',width:'60%',animation:'shimmer 1.5s infinite',borderRadius:3}}/></div>}

            {/* Input bar */}
            <div className="chat-input-row" style={{position:'relative',flexWrap:'wrap',gap:6,alignItems:'center'}}>
              <div style={{display:'flex',gap:4,flexShrink:0}}>
                <RoundBtn onClick={()=>{setShowEmoji(!showEmoji);setShowTrackPicker(false)}} active={showEmoji}>😊</RoundBtn>
                <RoundBtn onClick={()=>{setShowTrackPicker(!showTrackPicker);setShowEmoji(false)}} active={showTrackPicker}>🎵</RoundBtn>
                <RoundBtn onClick={()=>imgRef.current?.click()}>📷</RoundBtn>
                {!recording&&<RoundBtn onClick={startRecording}>🎤</RoundBtn>}
              </div>

              {recording?
                <div style={{display:'flex',alignItems:'center',gap:8,flex:1}}>
                  <div style={{width:8,height:8,borderRadius:'50%',background:'var(--red)',animation:'live-pulse 1s infinite'}}/>
                  <span style={{fontSize:13,fontFamily:'Space Mono,monospace',color:'var(--red)'}}>{fmtRec(recordTime)}</span>
                  <button onClick={stopRecording} style={{padding:'6px 16px',borderRadius:20,border:'none',background:'var(--red)',color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer'}}>Envoyer</button>
                  <button onClick={cancelRecording} style={{padding:'6px 12px',borderRadius:20,border:'1px solid var(--border)',background:'var(--card)',color:'var(--text3)',fontSize:12,cursor:'pointer'}}>Annuler</button>
                </div>
              :
                <>
                  <input className="chat-input" placeholder="Ecrire un message..." value={input}
                    onChange={e=>setInput(e.target.value)}
                    onKeyDown={e=>{if(e.key==='Enter')sendText()}}
                    style={{flex:1,minWidth:100}}/>
                  <button className="btn btn-primary btn-xs" onClick={sendText} style={{flexShrink:0}}>Envoyer</button>
                </>
              }

              {/* Emoji picker */}
              {showEmoji&&<div style={{position:'absolute',bottom:52,left:0,background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:10,width:280,maxHeight:200,overflowY:'auto',zIndex:50,display:'flex',flexWrap:'wrap',gap:4,boxShadow:'0 8px 32px rgba(0,0,0,.3)'}}>
                {EMOJIS.map(e=><span key={e} onClick={()=>{setInput(p=>p+e);setShowEmoji(false)}} style={{fontSize:22,cursor:'pointer',padding:4,borderRadius:6}} onMouseEnter={ev=>ev.currentTarget.style.background='var(--card2)'} onMouseLeave={ev=>ev.currentTarget.style.background='transparent'}>{e}</span>)}
              </div>}

              {/* Track picker */}
              {showTrackPicker&&<div style={{position:'absolute',bottom:52,left:0,background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:12,width:300,maxHeight:280,overflowY:'auto',zIndex:50,boxShadow:'0 8px 32px rgba(0,0,0,.3)'}}>
                <div style={{fontWeight:700,fontSize:13,marginBottom:8}}>🎵 Partager un son Waiichia</div>
                <input className="input-field" placeholder="Rechercher un son..." value={trackSearch} onChange={e=>setTrackSearch(e.target.value)} style={{fontSize:13,padding:'8px 12px',marginBottom:8}}/>
                {trackResults.map(t=><div key={t.id} onClick={()=>shareTrack(t)} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 6px',cursor:'pointer',borderRadius:8}} onMouseEnter={e=>e.currentTarget.style.background='var(--card2)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <div style={{width:36,height:36,borderRadius:8,background:'linear-gradient(135deg,var(--gold),#e63946)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>🎵</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</div>
                    <div style={{fontSize:10,color:'var(--text3)'}}>{t.profiles?.display_name||'Artiste'}</div>
                  </div>
                </div>)}
                {trackSearch.length>=2&&!trackResults.length&&<div style={{padding:10,textAlign:'center',color:'var(--text3)',fontSize:12}}>Aucun son trouve</div>}
                {!trackSearch&&<div style={{padding:10,textAlign:'center',color:'var(--text3)',fontSize:12}}>Tapez le nom d un son</div>}
              </div>}
            </div>
          </>:<div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',color:'var(--text3)'}}>
            <div style={{fontSize:48,marginBottom:12}}>💬</div>
            <div style={{fontSize:14}}>Selectionnez une conversation</div>
          </div>}
        </div>
      </div>
    </div>
  )
}

function RoundBtn({children,onClick,active}){
  return <button onClick={onClick} style={{width:34,height:34,borderRadius:'50%',border:'1px solid '+(active?'var(--gold)':'var(--border)'),background:active?'rgba(245,166,35,.15)':'var(--card)',cursor:'pointer',fontSize:15,display:'flex',alignItems:'center',justifyContent:'center',color:active?'var(--gold)':'var(--text2)',transition:'all .15s',flexShrink:0}}>{children}</button>
}
