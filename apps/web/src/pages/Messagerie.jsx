import { useState, useEffect, useRef } from "react"
import { useAuthStore, usePageStore } from "../stores/index.js"
import api from "../services/api.js"

const MOCK_CONVS=[
  {id:"c1",name:"Wally Afro",handle:"@wallyafro",ava:"WA",bg:"linear-gradient(135deg,#f5a623,#e63946)",last:"Écoute mon nouveau son 🎵","time":"14:32",unread:true,online:true},
  {id:"c2",name:"Kolo Officiel",handle:"@kolo_komori",ava:"KO",bg:"linear-gradient(135deg,#4d9fff,#9b59f5)",last:"Merci pour le featuring !","time":"Hier",unread:false,online:false},
  {id:"c3",name:"Coach Amina",handle:"@amina_mindset",ava:"CA",bg:"linear-gradient(135deg,#2dc653,#00bfa5)",last:"Le podcast sort vendredi","time":"Lun",unread:true,online:true},
  {id:"c4",name:"DJ Chami",handle:"@djchami",ava:"DC",bg:"linear-gradient(135deg,#9b59f5,#6c3483)",last:"On fait un live ce soir ?","time":"Dim",unread:false,online:false},
  {id:"c5",name:"Nassim B.",handle:"@nassimb_km",ava:"NB",bg:"linear-gradient(135deg,#ff6b35,#cc4411)",last:"Bien reçu, je t'envoie le mix","time":"12 Mar",unread:false,online:false},
]
const MOCK_MSGS=[
  {id:"m1",from:"other",text:"Salut ! T'as écouté le nouveau son ?",time:"14:20"},
  {id:"m2",from:"me",text:"Oui c'est feu 🔥 J'adore le refrain",time:"14:22"},
  {id:"m3",from:"other",text:"Merci ! On pourrait faire un featuring ensemble ?",time:"14:25"},
  {id:"m4",from:"me",text:"Carrément ! Envoie-moi l'instru et je pose mon couplet cette semaine",time:"14:28"},
  {id:"m5",from:"other",text:"Top ! Je t'envoie ça ce soir. Tu veux quel BPM ?",time:"14:30"},
  {id:"m6",from:"me",text:"Entre 110 et 120 BPM ça serait parfait pour du Twarab moderne 🌊",time:"14:32"},
]

export default function Messagerie(){
  const {user}=useAuthStore()
  const {setPage}=usePageStore()
  const [convs,setConvs]=useState([])
  const [activeConv,setActiveConv]=useState(null)
  const [messages,setMessages]=useState([])
  const [input,setInput]=useState('')
  const [loading,setLoading]=useState(true)
  const msgsEnd=useRef(null)

  useEffect(()=>{
    api.messages.conversations()
      .then(d=>setConvs(d.conversations?.length?d.conversations:MOCK_CONVS))
      .catch(()=>setConvs(MOCK_CONVS))
      .finally(()=>{setLoading(false);setActiveConv(MOCK_CONVS[0])})
  },[])

  useEffect(()=>{
    if(!activeConv)return
    api.messages.messages(activeConv.id)
      .then(d=>setMessages(d.messages?.length?d.messages:MOCK_MSGS))
      .catch(()=>setMessages(MOCK_MSGS))
  },[activeConv])

  useEffect(()=>{msgsEnd.current?.scrollIntoView({behavior:'smooth'})},[messages])

  const sendMsg=()=>{
    if(!input.trim())return
    setMessages(p=>[...p,{id:'new_'+Date.now(),from:'me',text:input,time:new Date().toLocaleTimeString('fr',{hour:'2-digit',minute:'2-digit'})}])
    if(activeConv?.id&&!activeConv.id.startsWith('c'))
      api.messages.send({conversation_id:activeConv.id,content:input}).catch(()=>{})
    setInput('')
  }

  if(!user)return(<div style={{textAlign:'center',padding:60}}><div style={{fontSize:48,marginBottom:16}}>🔒</div><h2 style={{fontFamily:'Syne,sans-serif'}}>Connectez-vous</h2><button className="btn btn-primary" onClick={()=>setPage('login')} style={{marginTop:16}}>Se connecter</button></div>)

  const conv=activeConv||MOCK_CONVS[0]

  return(
    <div style={{paddingBottom:40}}>
      <div className="page-title">💬 Messagerie</div>
      <div className="messages-layout">
        {/* CONVERSATIONS LIST */}
        <div className="conv-list">
          <div className="conv-list-hdr">Conversations <button className="btn btn-xs btn-primary">+ Nouveau</button></div>
          {(convs.length?convs:MOCK_CONVS).map(c=>(
            <div key={c.id} className={`conv-item${activeConv?.id===c.id?' active':''}`} onClick={()=>setActiveConv(c)}>
              <div className="conv-ava" style={{background:c.bg,color:'#000'}}>{c.ava||c.name?.[0]}</div>
              <div className="conv-info">
                <div className="conv-name">{c.name}{c.online&&<span style={{color:'var(--green)',fontSize:9,marginLeft:6}}>●</span>}</div>
                <div className="conv-last">{c.last||c.last_message||'...'}</div>
              </div>
              <div className="conv-meta">
                <div className="conv-time">{c.time||''}</div>
                {c.unread&&<div className="unread-dot"/>}
              </div>
            </div>
          ))}
        </div>

        {/* CHAT AREA */}
        <div className="chat-area">
          <div className="chat-hdr">
            <div className="conv-ava" style={{background:conv.bg,color:'#000',width:36,height:36,fontSize:14}}>{conv.ava||'?'}</div>
            <div>
              <div style={{fontWeight:600,fontSize:14}}>{conv.name||'Conversation'}</div>
              <div style={{fontSize:11,color:conv.online?'var(--green)':'var(--text3)'}}>{conv.online?'● En ligne':'Hors ligne'}</div>
            </div>
            <div style={{marginLeft:'auto',display:'flex',gap:8}}>
              <button className="btn btn-xs btn-secondary">🎵 Partager son</button>
              <button className="btn btn-xs btn-outline">☎️</button>
            </div>
          </div>

          <div className="chat-msgs">
            {messages.map(m=>(
              <div key={m.id} className={`msg-bubble ${m.from==='me'||m.sender_id===user?.id?'msg-out':'msg-in'}`}>
                {m.text||m.content}
                <div style={{fontSize:9,color:m.from==='me'?'rgba(0,0,0,.5)':'var(--text3)',marginTop:4,textAlign:'right'}}>{m.time||''}</div>
              </div>
            ))}
            <div ref={msgsEnd}/>
          </div>

          <div className="chat-input-row">
            <button className="btn btn-xs btn-secondary" title="Envoyer un son">🎵</button>
            <input className="chat-input" placeholder="Écrire un message..." value={input}
              onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>{if(e.key==='Enter')sendMsg()}}/>
            <button className="btn btn-primary btn-xs" onClick={sendMsg}>Envoyer</button>
          </div>
        </div>
      </div>
    </div>
  )
}
