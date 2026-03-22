import { useState, useEffect, useRef, useCallback } from "react"
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
  const [hoverMsg,setHoverMsg]=useState(null)
  const [editMsg,setEditMsg]=useState(null)
  const [editText,setEditText]=useState('')
  const [menuMsg,setMenuMsg]=useState(null)
  const [selectMode,setSelectMode]=useState(false)
  const [replyTo,setReplyTo]=useState(null)
  const [selected,setSelected]=useState(new Set())

  const msgsEnd=useRef(null)
  const pollRef=useRef(null)
  const mediaRef=useRef(null)
  const chunksRef=useRef([])
  const timerRef=useRef(null)
  const imgRef=useRef(null)
  const activeConvRef=useRef(null)
  const chatMsgsRef=useRef(null)
  const prevMsgCount=useRef(0)
  const userScrolled=useRef(false)

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
    userScrolled.current=false
    prevMsgCount.current=0
    loadMessages(activeConv.id)
    if(pollRef.current)clearInterval(pollRef.current)
    pollRef.current=setInterval(()=>loadMessages(activeConvRef.current?.id),5000)
    return()=>{if(pollRef.current)clearInterval(pollRef.current)}
  },[activeConv])

  // Smart scroll: only auto-scroll when NEW messages arrive, not during poll
  useEffect(()=>{
    if(messages.length>prevMsgCount.current&&!userScrolled.current){
      msgsEnd.current?.scrollIntoView({behavior:'smooth'})
    }
    prevMsgCount.current=messages.length
  },[messages])

  // Detect user scrolling up
  const handleChatScroll=useCallback(()=>{
    const el=chatMsgsRef.current
    if(!el)return
    const atBottom=el.scrollHeight-el.scrollTop-el.clientHeight<80
    userScrolled.current=!atBottom
  },[])

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
      setActiveConv({...d.conversation,other:{id:otherId,display_name:otherName}})
      setSearchMode(false);setSearchQ('')
      loadConvs()
    }catch(e){alert('Erreur: '+e.message)}
  }

  const sendMessage=async(content,msgType='text',trackId=null)=>{
    const convId=activeConvRef.current?.id
    if(!convId||!content)return
    userScrolled.current=false
    setMessages(p=>[...p,{id:'tmp_'+Date.now(),sender_id:user.id,content,message_type:msgType,created_at:new Date().toISOString()}])
    try{
      await fetch(API_URL+'/api/messages/conversations/'+convId+'/messages',{
        method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+getToken()},
        body:JSON.stringify({content,message_type:msgType,track_id:trackId||undefined})
      })
      setTimeout(()=>loadMessages(convId),500)
      setTimeout(()=>loadConvs(),1000)
    }catch(e){console.error(e)}
  }

  const sendText=()=>{if(!input.trim())return;const msg=replyTo?'> '+replyTo.content?.slice(0,40)+'...\n'+input:input;sendMessage(msg,'text');setInput('');setReplyTo(null)}

  const shareTrack=(track)=>{
    sendMessage('🎵 '+track.title+' — '+(track.profiles?.display_name||'Artiste'),'track',track.id)
    setShowTrackPicker(false);setTrackSearch('')
  }

  // Voice
  const startRecording=async()=>{
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:true})
      const mr=new MediaRecorder(stream)
      mediaRef.current=mr;chunksRef.current=[]
      mr.ondataavailable=e=>chunksRef.current.push(e.data)
      mr.onstop=async()=>{
        stream.getTracks().forEach(t=>t.stop())
        const blob=new Blob(chunksRef.current,{type:'audio/webm'})
        setUploading(true)
        try{
          const form=new FormData();form.append('file',blob,'voice_'+Date.now()+'.webm')
          const res=await fetch(API_URL+'/api/upload/cover',{method:'POST',headers:{'Authorization':'Bearer '+getToken()},body:form})
          const data=await res.json()
          if(data.url)await sendMessage(data.url,'voice')
        }catch(e){console.error(e)}
        setUploading(false)
      }
      mr.start();setRecording(true);setRecordTime(0)
      timerRef.current=setInterval(()=>setRecordTime(t=>t+1),1000)
    }catch(e){alert('Microphone non disponible')}
  }
  const stopRecording=()=>{if(mediaRef.current?.state==='recording')mediaRef.current.stop();setRecording(false);if(timerRef.current)clearInterval(timerRef.current)}
  const cancelRecording=()=>{if(mediaRef.current){if(mediaRef.current.state==='recording')mediaRef.current.stream.getTracks().forEach(t=>t.stop());mediaRef.current=null};chunksRef.current=[];setRecording(false);if(timerRef.current)clearInterval(timerRef.current)}

  // Image
  const handleImage=async(file)=>{
    if(!file)return;setUploading(true)
    try{
      const form=new FormData();form.append('file',file)
      const res=await fetch(API_URL+'/api/upload/cover',{method:'POST',headers:{'Authorization':'Bearer '+getToken()},body:form})
      const data=await res.json()
      if(data.url)await sendMessage(data.url,'image')
    }catch(e){console.error(e)}
    setUploading(false)
  }

  // Reactions
  const reactTo=async(msgId,emoji)=>{
    setMessages(ms=>ms.map(m=>{
      if(m.id!==msgId)return m
      const r={...(m.reaction&&typeof m.reaction==='object'?m.reaction:{})}
      if(r[user.id]===emoji)delete r[user.id];else r[user.id]=emoji
      return{...m,reaction:Object.keys(r).length?r:null}
    }))
    setReactMsg(null)
    try{await fetch(API_URL+'/api/messages/react',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+getToken()},body:JSON.stringify({message_id:msgId,reaction:emoji,user_id:user.id})})}catch(e){}
  }

  // Edit message
  const startEdit=(m)=>{setEditMsg(m.id);setEditText(m.content);setMenuMsg(null)}
  const saveEdit=async()=>{
    if(!editText.trim()||!editMsg)return
    setMessages(ms=>ms.map(m=>m.id===editMsg?{...m,content:editText,edited:true}:m))
    try{await fetch(API_URL+'/api/messages/edit',{method:'PATCH',headers:{'Content-Type':'application/json','Authorization':'Bearer '+getToken()},body:JSON.stringify({message_id:editMsg,content:editText})})}catch(e){}
    setEditMsg(null);setEditText('')
  }
  const cancelEdit=()=>{setEditMsg(null);setEditText('')}

  // Delete messages
  const deleteMsg=async(msgId)=>{
    setMessages(ms=>ms.filter(m=>m.id!==msgId));setMenuMsg(null)
    try{await fetch(API_URL+'/api/messages/delete',{method:'DELETE',headers:{'Content-Type':'application/json','Authorization':'Bearer '+getToken()},body:JSON.stringify({message_id:msgId})})}catch(e){}
  }
  const deleteSelected=async()=>{
    const ids=[...selected]
    setMessages(ms=>ms.filter(m=>!selected.has(m.id)))
    setSelected(new Set());setSelectMode(false)
    for(const id of ids){try{await fetch(API_URL+'/api/messages/delete',{method:'DELETE',headers:{'Content-Type':'application/json','Authorization':'Bearer '+getToken()},body:JSON.stringify({message_id:id})})}catch(e){}}
  }
  const toggleSelect=(id)=>{setSelected(s=>{const n=new Set(s);if(n.has(id))n.delete(id);else n.add(id);return n})}

  // Guards
  if(!user)return(<div style={{textAlign:'center',padding:60}}><div style={{fontSize:48,marginBottom:16}}>🔒</div><h2 style={{fontFamily:'Syne,sans-serif'}}>Connectez-vous</h2><button className="btn btn-primary" onClick={()=>setPage('login')} style={{marginTop:16}}>Se connecter</button></div>)

  // Helpers
  const getOther=(c)=>c.other||c.p2||c.p1||{}
  const fmtTime=(d)=>{if(!d)return'';const dt=new Date(d),now=new Date();if(dt.toDateString()===now.toDateString())return dt.toLocaleTimeString('fr',{hour:'2-digit',minute:'2-digit'});return dt.toLocaleDateString('fr',{day:'numeric',month:'short'})}
  const fmtRec=(s)=>Math.floor(s/60)+':'+String(s%60).padStart(2,'0')
  const cleanLast=(msg)=>{if(!msg)return'Nouvelle conversation';if(msg.startsWith('http'))return'📷 Photo';return msg}

  // === RENDER BUBBLE ===
  const renderBubble=(m)=>{
    const isMe=m.sender_id===user.id
    const cls='msg-bubble '+(isMe?'msg-out':'msg-in')
    const timeEl=<div style={{fontSize:9,color:isMe?'rgba(0,0,0,.5)':'var(--text3)',marginTop:4,textAlign:'right'}}>{fmtTime(m.created_at)}{m.edited&&' (modifie)'}</div>
    const reactions=m.reaction&&typeof m.reaction==='object'?Object.values(m.reaction):m.reaction?[m.reaction]:[]
    const reactionEl=reactions.length?<div style={{position:'absolute',bottom:-10,[isMe?'right':'left']:8,display:'flex',gap:1,background:'var(--card)',borderRadius:20,padding:'1px 6px',border:'1px solid var(--border)',zIndex:2}}>{reactions.map((r,i)=><span key={i} style={{fontSize:13}}>{r}</span>)}</div>:null

    let content=null
    if(m.message_type==='voice'){
      content=<div style={{display:'flex',alignItems:'center',gap:8}}><span style={{fontSize:18}}>🎤</span><audio src={m.content} controls preload="metadata" style={{height:32,maxWidth:200,borderRadius:16}}/></div>
    }else if(m.message_type==='image'){
      content=<img src={m.content} alt="" style={{maxWidth:220,maxHeight:220,borderRadius:12,objectFit:'cover',display:'block'}}/>
    }else if(m.message_type==='track'){
      content=<div onClick={()=>{if(m.track_id){fetch(API_URL+'/api/tracks/'+m.track_id,{headers:{'Authorization':'Bearer '+getToken()}}).then(r=>r.json()).then(d=>{if(d.track||d){play(d.track||d)}}).catch(()=>{})}}} style={{display:'flex',alignItems:'center',gap:10,padding:4,background:isMe?'rgba(0,0,0,.1)':'var(--card2)',borderRadius:10,cursor:'pointer'}}>
        <div style={{width:40,height:40,borderRadius:8,background:'linear-gradient(135deg,var(--gold),#e63946)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>🎵</div>
        <div style={{flex:1,minWidth:0}}><div style={{fontSize:12,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.content?.replace('🎵 ','')}</div><div style={{fontSize:10,color:isMe?'rgba(0,0,0,.6)':'var(--text3)'}}>Appuyer pour ecouter</div></div>
        <span style={{fontSize:18}}>▶</span></div>
    }else{
      // If editing this message
      if(editMsg===m.id){
        content=<div style={{display:'flex',flexDirection:'column',gap:6}}>
          <input value={editText} onChange={e=>setEditText(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')saveEdit();if(e.key==='Escape')cancelEdit()}} autoFocus style={{background:'transparent',border:'1px solid rgba(255,255,255,.3)',borderRadius:8,padding:'6px 10px',color:'inherit',fontSize:13,outline:'none'}}/>
          <div style={{display:'flex',gap:4,justifyContent:'flex-end'}}>
            <button onClick={saveEdit} style={{padding:'3px 10px',borderRadius:12,border:'none',background:'var(--green)',color:'#000',fontSize:11,fontWeight:700,cursor:'pointer'}}>OK</button>
            <button onClick={cancelEdit} style={{padding:'3px 10px',borderRadius:12,border:'1px solid var(--border)',background:'transparent',color:'var(--text3)',fontSize:11,cursor:'pointer'}}>Annuler</button>
          </div>
        </div>
      }else{
        if(m.content?.startsWith('> ')){
        const parts=m.content.split('\n')
        const quote=parts[0].replace(/^> /,'').replace(/\.\.\. $/,'')
        const reply=parts.slice(1).join('\n').trim()
        content=<div>
          <div style={{borderLeft:'3px solid '+(isMe?'rgba(0,0,0,.3)':'var(--gold)'),paddingLeft:8,marginBottom:6,fontSize:11,color:isMe?'rgba(0,0,0,.5)':'var(--text3)',fontStyle:'italic'}}>{quote}</div>
          {reply||''}
        </div>
      }else{
        content=m.content
      }
      }
    }

    const isHovered=hoverMsg===m.id
    const showActions=isHovered&&editMsg!==m.id&&!selectMode

    return(
      <div key={m.id} style={{position:'relative',marginBottom:reactions.length?14:4,display:'flex',alignItems:'center',gap:4,flexDirection:isMe?'row-reverse':'row'}}
        onMouseEnter={()=>setHoverMsg(m.id)} onMouseLeave={()=>{setHoverMsg(null);if(menuMsg===m.id){}}}
        onTouchStart={()=>setHoverMsg(m.id)}>

        {/* Select checkbox */}
        {selectMode&&<input type="checkbox" checked={selected.has(m.id)} onChange={()=>toggleSelect(m.id)} style={{width:18,height:18,accentColor:'var(--gold)',flexShrink:0,cursor:'pointer'}}/>}

        {/* Message bubble */}
        <div className={cls} style={m.message_type==='image'?{padding:4}:undefined}>
          {content}
          {timeEl}
        </div>

        {/* Action buttons (visible on hover) */}
        {showActions&&<div style={{display:'flex',gap:2,flexShrink:0}}>
          <MiniBtn onClick={()=>setReactMsg(reactMsg===m.id?null:m.id)} title="Reagir">😊</MiniBtn>
          {isMe&&m.message_type==='text'&&<MiniBtn onClick={()=>startEdit(m)} title="Modifier">✏️</MiniBtn>}
          <MiniBtn onClick={()=>setMenuMsg(menuMsg===m.id?null:m.id)} title="Plus">⋯</MiniBtn>
        </div>}

        {/* Context menu */}
        {menuMsg===m.id&&<div style={{position:'absolute',top:'100%',[isMe?'right':'left']:0,background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:10,padding:4,zIndex:60,boxShadow:'0 4px 16px rgba(0,0,0,.3)',minWidth:140}}>
          <MenuItem icon="😊" label="Reagir" onClick={()=>{setReactMsg(m.id);setMenuMsg(null)}}/>
          {isMe&&m.message_type==='text'&&<MenuItem icon="✏️" label="Modifier" onClick={()=>startEdit(m)}/>}
          <MenuItem icon="📋" label="Copier" onClick={()=>{navigator.clipboard?.writeText(m.content);setMenuMsg(null)}}/>
          <MenuItem icon="↩️" label="Repondre" onClick={()=>{setReplyTo(m);setMenuMsg(null)}}/>
          <MenuItem icon="☑️" label="Selectionner" onClick={()=>{setSelectMode(true);setSelected(new Set([m.id]));setMenuMsg(null)}}/>
          {isMe&&<MenuItem icon="🗑️" label="Supprimer" red onClick={()=>deleteMsg(m.id)}/>}
        </div>}

        {/* Reaction picker */}
        {reactMsg===m.id&&<div style={{position:'absolute',bottom:'100%',left:'50%',transform:'translateX(-50%)',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:20,padding:'4px 6px',display:'flex',gap:2,zIndex:60,boxShadow:'0 4px 16px rgba(0,0,0,.3)',marginBottom:4}}>
          {REACTIONS.map(r=><span key={r} onClick={e=>{e.stopPropagation();reactTo(m.id,r)}} style={{fontSize:18,cursor:'pointer',padding:'2px 4px',borderRadius:8,transition:'transform .1s'}} onMouseEnter={e=>e.currentTarget.style.transform='scale(1.3)'} onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}>{r}</span>)}
        </div>}

        {/* Reactions display */}
        {reactionEl}
      </div>
    )
  }

  // === MAIN RENDER ===
  return(
    <div style={{paddingBottom:0}}>
      <div className="page-title">💬 Messagerie</div>
      <input type="file" ref={imgRef} accept="image/*" style={{display:'none'}} onChange={e=>{handleImage(e.target.files[0]);e.target.value=''}}/>

      <div className="messages-layout">
        {/* LEFT */}
        <div className="conv-list">
          <div className="conv-list-hdr">Conversations <button className="btn btn-xs btn-primary" onClick={()=>setSearchMode(!searchMode)}>+ Nouveau</button></div>
          {searchMode&&<div style={{padding:'8px 12px',borderBottom:'1px solid var(--border)'}}>
            <input className="input-field" placeholder="Rechercher un utilisateur..." value={searchQ} onChange={e=>setSearchQ(e.target.value)} autoFocus style={{fontSize:13,padding:'8px 12px'}}/>
            {searchResults.map(u=><div key={u.id} onClick={()=>startConv(u.id,u.display_name)} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 8px',cursor:'pointer',borderBottom:'1px solid var(--border)'}} onMouseEnter={e=>e.currentTarget.style.background='var(--card2)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <div style={{width:36,height:36,borderRadius:'50%',background:COLORS[u.display_name?.charCodeAt(0)%5],display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:13,color:'#000',flexShrink:0}}>{u.avatar_url?<img src={u.avatar_url} style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}} alt=""/>:(u.display_name?.[0]||'?')}</div>
              <div><div style={{fontWeight:600,fontSize:13}}>{u.display_name}</div><div style={{fontSize:11,color:'var(--text3)'}}>@{u.username}</div></div>
            </div>)}
            {searchQ.length>=2&&!searchResults.length&&<div style={{padding:12,textAlign:'center',color:'var(--text3)',fontSize:12}}>Aucun utilisateur trouve</div>}
          </div>}
          {loading?<div style={{padding:20,textAlign:'center',color:'var(--text3)'}}>Chargement...</div>:
           convs.length?convs.map((c,i)=>{const other=getOther(c);return<div key={c.id} className={'conv-item'+(activeConv?.id===c.id?' active':'')} onClick={()=>setActiveConv(c)}>
              <div className="conv-ava" style={{background:COLORS[i%5],color:'#000'}}>{other.avatar_url?<img src={other.avatar_url} style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}} alt=""/>:(other.display_name?.[0]||'?')}</div>
              <div className="conv-info"><div className="conv-name">{other.display_name||'Utilisateur'}</div><div className="conv-last">{cleanLast(c.last_message)}</div></div>
              <div className="conv-meta"><div className="conv-time">{fmtTime(c.last_message_at)}</div>{c.unread>0&&<div className="unread-dot"/>}</div>
            </div>}):<div style={{padding:30,textAlign:'center',color:'var(--text3)'}}><div style={{fontSize:36,marginBottom:10}}>💬</div><div style={{fontSize:13}}>Aucune conversation</div><button className="btn btn-sm btn-primary" onClick={()=>setSearchMode(true)} style={{marginTop:12}}>Demarrer une conversation</button></div>}
        </div>

        {/* RIGHT */}
        <div className="chat-area">
          {activeConv?<>
            <div className="chat-hdr">
              <div style={{width:36,height:36,borderRadius:'50%',background:COLORS[0],display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:13,color:'#000',flexShrink:0}}>{getOther(activeConv).avatar_url?<img src={getOther(activeConv).avatar_url} style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}} alt=""/>:(getOther(activeConv).display_name?.[0]||'?')}</div>
              <div style={{flex:1}}><div style={{fontWeight:600,fontSize:14}}>{getOther(activeConv).display_name||'Conversation'}</div><div style={{fontSize:11,color:'var(--text3)'}}>@{getOther(activeConv).username||''}</div></div>
              {selectMode&&<div style={{display:'flex',gap:6,alignItems:'center'}}>
                <span style={{fontSize:12,color:'var(--text2)'}}>{selected.size} selectionne(s)</span>
                <button onClick={deleteSelected} className="btn btn-xs" style={{background:'var(--red)',color:'#fff',border:'none'}}>🗑 Supprimer</button>
                <button onClick={()=>{setSelectMode(false);setSelected(new Set())}} className="btn btn-xs btn-outline">Annuler</button>
              </div>}
            </div>

            <div className="chat-msgs" ref={chatMsgsRef} onScroll={handleChatScroll} onClick={()=>{setReactMsg(null);setMenuMsg(null);setShowEmoji(false);setShowTrackPicker(false)}}>
              {messages.length?messages.map(m=>renderBubble(m)):
                <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text3)',fontSize:13}}>Envoyez votre premier message 👋</div>}
              <div ref={msgsEnd}/>
            </div>

            {replyTo&&<div style={{display:'flex',alignItems:'center',gap:10,padding:'8px 14px',background:'var(--card)',borderTop:'1px solid var(--border)',borderLeft:'3px solid var(--gold)'}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:10,color:'var(--gold)',fontWeight:700,marginBottom:2}}>Repondre a {replyTo.sender?.display_name||'message'}</div>
                <div style={{fontSize:12,color:'var(--text2)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{replyTo.content?.startsWith('http')?replyTo.message_type==='voice'?'🎤 Vocal':'📷 Photo':replyTo.content?.slice(0,60)}</div>
              </div>
              <button onClick={()=>setReplyTo(null)} style={{background:'none',border:'none',color:'var(--text3)',cursor:'pointer',fontSize:16,padding:4}}>✕</button>
            </div>}
            {uploading&&<div style={{height:3,background:'var(--border)',width:'100%'}}><div style={{height:'100%',background:'var(--gold)',width:'60%',animation:'shimmer 1.5s infinite',borderRadius:3}}/></div>}

            <div className="chat-input-row" style={{position:'relative',flexWrap:'wrap',gap:6,alignItems:'center'}}>
              <div style={{display:'flex',gap:4,flexShrink:0}}>
                <RoundBtn onClick={()=>{setShowEmoji(!showEmoji);setShowTrackPicker(false)}} active={showEmoji}>😊</RoundBtn>
                <RoundBtn onClick={()=>{setShowTrackPicker(!showTrackPicker);setShowEmoji(false)}} active={showTrackPicker}>🎵</RoundBtn>
                <RoundBtn onClick={()=>imgRef.current?.click()}>📷</RoundBtn>
                {!recording&&<RoundBtn onClick={startRecording}>🎤</RoundBtn>}
              </div>
              {recording?<div style={{display:'flex',alignItems:'center',gap:8,flex:1}}>
                <div style={{width:8,height:8,borderRadius:'50%',background:'var(--red)',animation:'live-pulse 1s infinite'}}/>
                <span style={{fontSize:13,fontFamily:'Space Mono,monospace',color:'var(--red)'}}>{fmtRec(recordTime)}</span>
                <button onClick={stopRecording} style={{padding:'6px 16px',borderRadius:20,border:'none',background:'var(--red)',color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer'}}>Envoyer</button>
                <button onClick={cancelRecording} style={{padding:'6px 12px',borderRadius:20,border:'1px solid var(--border)',background:'var(--card)',color:'var(--text3)',fontSize:12,cursor:'pointer'}}>Annuler</button>
              </div>:<>
                <input className="chat-input" placeholder="Ecrire un message..." value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')sendText()}} style={{flex:1,minWidth:100}}/>
                <button className="btn btn-primary btn-xs" onClick={sendText} style={{flexShrink:0}}>Envoyer</button>
              </>}

              {showEmoji&&<div style={{position:'absolute',bottom:52,left:0,background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:10,width:280,maxHeight:200,overflowY:'auto',zIndex:50,display:'flex',flexWrap:'wrap',gap:4,boxShadow:'0 8px 32px rgba(0,0,0,.3)'}}>
                {EMOJIS.map(e=><span key={e} onClick={()=>{setInput(p=>p+e);setShowEmoji(false)}} style={{fontSize:22,cursor:'pointer',padding:4,borderRadius:6}} onMouseEnter={ev=>ev.currentTarget.style.background='var(--card2)'} onMouseLeave={ev=>ev.currentTarget.style.background='transparent'}>{e}</span>)}
              </div>}

              {showTrackPicker&&<div style={{position:'absolute',bottom:52,left:0,background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:12,width:300,maxHeight:280,overflowY:'auto',zIndex:50,boxShadow:'0 8px 32px rgba(0,0,0,.3)'}}>
                <div style={{fontWeight:700,fontSize:13,marginBottom:8}}>🎵 Partager un son Waiichia</div>
                <input className="input-field" placeholder="Rechercher un son..." value={trackSearch} onChange={e=>setTrackSearch(e.target.value)} style={{fontSize:13,padding:'8px 12px',marginBottom:8}}/>
                {trackResults.map(t=><div key={t.id} onClick={()=>shareTrack(t)} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 6px',cursor:'pointer',borderRadius:8}} onMouseEnter={e=>e.currentTarget.style.background='var(--card2)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <div style={{width:36,height:36,borderRadius:8,background:'linear-gradient(135deg,var(--gold),#e63946)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>🎵</div>
                  <div style={{flex:1,minWidth:0}}><div style={{fontSize:12,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</div><div style={{fontSize:10,color:'var(--text3)'}}>{t.profiles?.display_name||'Artiste'}</div></div>
                </div>)}
                {trackSearch.length>=2&&!trackResults.length&&<div style={{padding:10,textAlign:'center',color:'var(--text3)',fontSize:12}}>Aucun son trouve</div>}
                {!trackSearch&&<div style={{padding:10,textAlign:'center',color:'var(--text3)',fontSize:12}}>Tapez le nom d un son</div>}
              </div>}
            </div>
          </>:<div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',color:'var(--text3)'}}><div style={{fontSize:48,marginBottom:12}}>💬</div><div style={{fontSize:14}}>Selectionnez une conversation</div></div>}
        </div>
      </div>
    </div>
  )
}

function RoundBtn({children,onClick,active}){
  return<button onClick={onClick} style={{width:34,height:34,borderRadius:'50%',border:'1px solid '+(active?'var(--gold)':'var(--border)'),background:active?'rgba(245,166,35,.15)':'var(--card)',cursor:'pointer',fontSize:15,display:'flex',alignItems:'center',justifyContent:'center',color:active?'var(--gold)':'var(--text2)',transition:'all .15s',flexShrink:0}}>{children}</button>
}

function MiniBtn({children,onClick,title}){
  return<button onClick={e=>{e.stopPropagation();onClick()}} title={title} style={{width:26,height:26,borderRadius:'50%',border:'1px solid var(--border)',background:'var(--card)',cursor:'pointer',fontSize:12,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text3)',transition:'all .15s',flexShrink:0,opacity:.85}} onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--gold)';e.currentTarget.style.color='var(--gold)';e.currentTarget.style.opacity='1'}} onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text3)';e.currentTarget.style.opacity='.85'}}>{children}</button>
}

function MenuItem({icon,label,onClick,red}){
  return<div onClick={e=>{e.stopPropagation();onClick()}} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',cursor:'pointer',borderRadius:8,fontSize:13,color:red?'var(--red)':'var(--text)',transition:'background .15s'}} onMouseEnter={e=>e.currentTarget.style.background='var(--card2)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}><span style={{fontSize:14}}>{icon}</span>{label}</div>
}
