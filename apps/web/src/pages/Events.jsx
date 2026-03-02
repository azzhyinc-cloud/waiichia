import { useState, useEffect } from 'react'
import { usePageStore, useAuthStore } from '../stores/index.js'
import api from '../services/api.js'

const API = import.meta.env.VITE_API_URL
const FLAGS = { KM:'🇰🇲', FR:'🇫🇷', NG:'🇳🇬', SN:'🇸🇳', CI:'🇨🇮', MA:'🇲🇦', TZ:'🇹🇿', MG:'🇲🇬' }
const TYPES = [['','Tous'],['concert','Concert'],['festival','Festival'],['soiree','Soiree'],['conference','Business'],['atelier','Atelier']]
const PAYS = [['','Tous pays'],['KM','Comores'],['FR','France'],['NG','Nigeria'],['SN','Senegal'],['MG','Madagascar']]
const GRADIENTS = [
  'linear-gradient(135deg,#0d4a6b,#1a8a9e)',
  'linear-gradient(135deg,#3d0a6b,#7c3aed)',
  'linear-gradient(135deg,#6b3a0a,#d97706)',
  'linear-gradient(135deg,#0a6b2a,#16a34a)',
  'linear-gradient(135deg,#6b0a0a,#dc2626)',
  'linear-gradient(135deg,#1a3a6b,#2563eb)',
]

const formatDate = (d) => {
  const date = new Date(d)
  return {
    day: String(date.getDate()).padStart(2,'0'),
    month: date.toLocaleDateString('fr-FR',{month:'short'}).toUpperCase(),
    full: date.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'}) + ' a ' + date.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})
  }
}

const formatTimeAgo = (d) => {
  const diff = Date.now() - new Date(d).getTime()
  const min = Math.floor(diff/60000)
  const h = Math.floor(diff/3600000)
  const day = Math.floor(diff/86400000)
  if (min < 60) return min + ' min'
  if (h < 24) return h + 'h'
  return day + 'j'
}

export default function Events() {
  const { setPage } = usePageStore()
  const { user } = useAuthStore()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [country, setCountry] = useState('')
  const [type, setType] = useState('')
  const [selected, setSelected] = useState(null)
  const [reacts, setReacts] = useState({})
  const [showComments, setShowComments] = useState(null)
  const [comments, setComments] = useState({})
  const [commentText, setCommentText] = useState('')
  const [registered, setRegistered] = useState({})
  const [payModal, setPayModal] = useState(null)
  const [phone, setPhone] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [paying, setPaying] = useState(false)
  const [payStatus, setPayStatus] = useState(null)

  useEffect(() => {
    setLoading(true)
    fetch(API + '/api/events/')
      .then(r => r.json())
      .then(d => { setEvents(d.events || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [country])

  const react = (eventId, key) => {
    setReacts(prev => {
      const cur = prev[eventId] || {}
      const active = cur._active === key ? null : key
      const count = {...cur, [key]: (cur[key]||0) + (active ? 1 : -1), _active: active}
      return {...prev, [eventId]: count}
    })
  }

  const loadComments = async (id) => {
    try {
      const r = await api.social.comments('event', id)
      setComments(prev => ({...prev, [id]: r.comments||[]}))
    } catch(e) { setComments(prev => ({...prev, [id]: []})) }
  }

  const toggleComments = (id) => {
    if (showComments === id) { setShowComments(null); return }
    setShowComments(id)
    loadComments(id)
  }

  const sendComment = async (eventId) => {
    if (!commentText.trim() || !user) return
    try {
      await api.social.comment({ target_type:'event', target_id:eventId, content:commentText })
      setCommentText('')
      loadComments(eventId)
    } catch(e) {}
  }

  const handleRegister = (e) => {
    if (!user) return setPage('login')
    setRegistered(prev => ({...prev, [e.id]: true}))
  }

  const handleBuyTicket = (e) => {
    if (!user) return setPage('login')
    setPayModal(e)
    setPayStatus(null)
    setPhone('')
    setQuantity(1)
  }

  const confirmPayment = async () => {
    if (!phone || phone.length < 8) return alert('Entrez un numero de telephone valide')
    setPaying(true)
    try {
      const token = localStorage.getItem('waiichia_token')
      const res = await fetch(import.meta.env.VITE_API_URL + '/api/payments/ticket', {
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},
        body: JSON.stringify({ event_id: payModal.id, quantity, phone, gateway:'huri_money' })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPayStatus({ type:'pending', message: data.message, tx_id: data.transaction_id, ticket_code: data.ticket_code, amount: data.amount })
      // Simulation confirmation automatique apres 3 secondes
      setTimeout(async () => {
        const r2 = await fetch(import.meta.env.VITE_API_URL + '/api/payments/ticket/confirm/' + data.transaction_id, {
          method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ success: true })
        })
        const d2 = await r2.json()
        setPayStatus(prev => ({...prev, type:'confirmed', message: 'Billet confirme !'}))
        setRegistered(prev => ({...prev, [payModal.id]: true}))
      }, 3000)
    } catch(e) {
      setPayStatus({ type:'error', message: e.message })
    }
    setPaying(false)
  }

  const filtered = type ? events.filter(e => e.event_type === type) : events

  return (
    <div style={{padding:'24px 20px 100px'}}>

      {/* ── MODAL PAIEMENT ── */}
      {payModal && (
        <div onClick={()=>!paying&&setPayModal(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.9)',zIndex:1100,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div onClick={e=>e.stopPropagation()} style={{background:'var(--card)',borderRadius:20,maxWidth:420,width:'100%',padding:28,border:'1px solid var(--border)'}}>
            {payStatus?.type === 'confirmed' ? (
              <div style={{textAlign:'center',padding:20}}>
                <div style={{fontSize:64,marginBottom:16}}>🎫</div>
                <h2 style={{margin:'0 0 8px',color:'#2cc653'}}>Billet confirme !</h2>
                <p style={{color:'var(--text2)',marginBottom:20}}>{payModal.title}</p>
                <div style={{background:'var(--card2)',borderRadius:12,padding:16,marginBottom:20}}>
                  <div style={{fontSize:12,color:'var(--text3)',marginBottom:4}}>CODE BILLET</div>
                  <div style={{fontSize:24,fontWeight:900,letterSpacing:4,color:'var(--gold)'}}>{payStatus.ticket_code}</div>
                </div>
                <button onClick={()=>setPayModal(null)} style={{width:'100%',background:'var(--primary)',border:'none',color:'#fff',borderRadius:10,padding:14,cursor:'pointer',fontWeight:700,fontSize:15}}>
                  Fermer
                </button>
              </div>
            ) : payStatus?.type === 'pending' ? (
              <div style={{textAlign:'center',padding:20}}>
                <div style={{fontSize:48,marginBottom:16}}>📱</div>
                <h3 style={{margin:'0 0 12px'}}>Confirmation en cours...</h3>
                <p style={{color:'var(--text2)',fontSize:14,marginBottom:16}}>{payStatus.message}</p>
                <div style={{background:'var(--card2)',borderRadius:8,padding:12,fontSize:13,color:'var(--text3)'}}>
                  Verification automatique dans quelques secondes...
                </div>
              </div>
            ) : (
              <>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
                  <h2 style={{margin:0,fontSize:18,fontWeight:800}}>Acheter un billet</h2>
                  <button onClick={()=>setPayModal(null)} style={{background:'none',border:'none',color:'var(--text2)',cursor:'pointer',fontSize:20}}>✕</button>
                </div>
                <div style={{background:'var(--card2)',borderRadius:10,padding:14,marginBottom:20}}>
                  <div style={{fontWeight:700,fontSize:15,marginBottom:4}}>{payModal.title}</div>
                  <div style={{fontSize:13,color:'var(--text2)'}}>📍 {payModal.location}</div>
                  <div style={{fontSize:13,color:'var(--text2)'}}>📅 {new Date(payModal.event_date).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}</div>
                </div>
                {payStatus?.type === 'error' && (
                  <div style={{background:'#2d0000',border:'1px solid #e74c3c',borderRadius:8,padding:'10px 14px',marginBottom:16,color:'#e74c3c',fontSize:13}}>{payStatus.message}</div>
                )}
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:12,color:'var(--text2)',fontWeight:600,marginBottom:6}}>QUANTITE DE BILLETS</div>
                  <div style={{display:'flex',gap:8,alignItems:'center'}}>
                    <button onClick={()=>setQuantity(q=>Math.max(1,q-1))} style={{width:36,height:36,borderRadius:8,border:'1px solid var(--border)',background:'var(--card2)',color:'var(--text)',cursor:'pointer',fontSize:18}}>-</button>
                    <div style={{flex:1,textAlign:'center',fontSize:18,fontWeight:700}}>{quantity}</div>
                    <button onClick={()=>setQuantity(q=>q+1)} style={{width:36,height:36,borderRadius:8,border:'1px solid var(--border)',background:'var(--card2)',color:'var(--text)',cursor:'pointer',fontSize:18}}>+</button>
                  </div>
                </div>
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:12,color:'var(--text2)',fontWeight:600,marginBottom:6}}>NUMERO DE TELEPHONE *</div>
                  <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="ex: 3370000 ou +2693370000"
                    style={{width:'100%',background:'var(--bg)',border:'1px solid var(--border)',borderRadius:8,padding:'10px 14px',color:'var(--text)',fontSize:14,boxSizing:'border-box'}}/>
                  <div style={{fontSize:11,color:'var(--text3)',marginTop:4}}>Huri Money, Telecom Comores, Orange Money</div>
                </div>
                <div style={{background:'var(--card2)',borderRadius:8,padding:12,marginBottom:20,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:14,color:'var(--text2)'}}>Total ({quantity} billet{quantity>1?'s':''})</span>
                  <span style={{fontSize:18,fontWeight:800,color:'var(--gold)'}}>{((payModal.ticket_price||0)*quantity).toLocaleString()} {payModal.currency||'KMF'}</span>
                </div>
                <button onClick={confirmPayment} disabled={paying}
                  style={{width:'100%',background:paying?'var(--border)':'linear-gradient(135deg,#4d9fff,#3a7fd5)',border:'none',color:'#fff',borderRadius:10,padding:14,cursor:paying?'not-allowed':'pointer',fontWeight:700,fontSize:15}}>
                  {paying ? 'Traitement...' : 'Confirmer le paiement'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL DETAIL ── */}
      {selected && (
        <div onClick={()=>setSelected(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.88)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:16,overflowY:'auto'}}>
          <div onClick={e=>e.stopPropagation()} style={{background:'var(--card)',borderRadius:20,maxWidth:560,width:'100%',overflow:'hidden',border:'1px solid var(--border)',maxHeight:'90vh',overflowY:'auto'}}>
            {/* BANNER */}
            <div style={{height:220,position:'relative',background:GRADIENTS[0],display:'flex',alignItems:'center',justifyContent:'center',fontSize:72,flexShrink:0}}>
              {selected.cover_url
                ? <img src={selected.cover_url} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                : '🎪'}
              <div style={{position:'absolute',inset:0,background:'linear-gradient(to bottom,transparent 40%,rgba(0,0,0,0.7))'}}/>
              {/* DATE CHIP */}
              <div style={{position:'absolute',top:14,left:14,background:'#4d9fff',borderRadius:10,padding:'8px 14px',textAlign:'center'}}>
                <div style={{fontSize:22,fontWeight:800,lineHeight:1}}>{formatDate(selected.event_date).day}</div>
                <div style={{fontSize:9,textTransform:'uppercase',letterSpacing:1,opacity:0.9}}>{formatDate(selected.event_date).month}</div>
              </div>
              {/* CLOSE */}
              <button onClick={()=>setSelected(null)} style={{position:'absolute',top:14,right:14,background:'rgba(0,0,0,0.5)',border:'none',color:'#fff',borderRadius:'50%',width:36,height:36,cursor:'pointer',fontSize:18,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
              {/* TITRE SUR BANNER */}
              <div style={{position:'absolute',bottom:14,left:14,right:14}}>
                <h2 style={{margin:0,fontSize:22,fontWeight:900,color:'#fff',textShadow:'0 2px 8px rgba(0,0,0,0.6)'}}>{selected.title}</h2>
              </div>
            </div>

            {/* BODY */}
            <div style={{padding:24}}>
              {/* META */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:20}}>
                <div style={{background:'var(--card2)',borderRadius:10,padding:12}}>
                  <div style={{fontSize:10,color:'var(--text3)',fontWeight:700,letterSpacing:1,marginBottom:6}}>📅 DATE ET HEURE</div>
                  <div style={{fontSize:14,fontWeight:700,marginBottom:2}}>{new Date(selected.event_date).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})}</div>
                  <div style={{fontSize:13,color:'var(--text2)'}}>{new Date(selected.event_date).getFullYear()} · {new Date(selected.event_date).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</div>
                </div>
                <div style={{background:'var(--card2)',borderRadius:10,padding:12}}>
                  <div style={{fontSize:10,color:'var(--text3)',fontWeight:700,letterSpacing:1,marginBottom:4}}>LIEU</div>
                  <div style={{fontSize:13,fontWeight:600}}>{selected.location} {FLAGS[selected.country]||''}</div>
                </div>
                {selected.profiles && (
                  <div style={{background:'var(--card2)',borderRadius:10,padding:12}}>
                    <div style={{fontSize:10,color:'var(--text3)',fontWeight:700,letterSpacing:1,marginBottom:4}}>ORGANISATEUR</div>
                    <div style={{fontSize:13,fontWeight:600}}>{selected.profiles.display_name}</div>
                  </div>
                )}
                <div style={{background:'var(--card2)',borderRadius:10,padding:12}}>
                  <div style={{fontSize:10,color:'var(--text3)',fontWeight:700,letterSpacing:1,marginBottom:4}}>PRIX</div>
                  <div style={{fontSize:16,fontWeight:800,color:selected.is_free?'#2cc653':'var(--gold)'}}>
                    {selected.is_free ? 'Gratuit' : (selected.ticket_price||0).toLocaleString() + ' ' + (selected.currency||'KMF')}
                  </div>
                </div>
              </div>

              {/* DESCRIPTION */}
              {selected.description && (
                <div style={{marginBottom:20}}>
                  <div style={{fontSize:12,color:'var(--text3)',fontWeight:700,letterSpacing:1,marginBottom:8}}>A PROPOS</div>
                  <p style={{fontSize:14,color:'var(--text2)',lineHeight:1.6,margin:0}}>{selected.description}</p>
                </div>
              )}

              {/* CAPACITE */}
              {selected.capacity && (
                <div style={{marginBottom:20}}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'var(--text2)',marginBottom:6}}>
                    <span>Places reservees</span>
                    <span style={{fontWeight:700}}>{selected.tickets_sold||0}/{selected.capacity}</span>
                  </div>
                  <div style={{background:'var(--border)',borderRadius:99,height:6,overflow:'hidden'}}>
                    <div style={{height:'100%',background:'var(--primary)',borderRadius:99,width:((selected.tickets_sold||0)/selected.capacity*100)+'%'}}/>
                  </div>
                </div>
              )}

              {/* BOUTONS ACTION */}
              {registered[selected.id] ? (
                <div style={{background:'rgba(44,198,83,0.1)',border:'1px solid #2cc653',borderRadius:10,padding:'14px',textAlign:'center',marginBottom:16}}>
                  <div style={{fontSize:20,marginBottom:4}}>✅</div>
                  <div style={{fontWeight:700,color:'#2cc653'}}>Inscription confirmee !</div>
                  <div style={{fontSize:12,color:'var(--text2)',marginTop:4}}>Vous recevrez une confirmation bientot</div>
                </div>
              ) : (
                <div style={{display:'flex',gap:10,marginBottom:16}}>
                  {selected.is_free ? (
                    <button onClick={()=>handleRegister(selected)}
                      style={{flex:1,background:'linear-gradient(135deg,#2cc653,#16a34a)',border:'none',color:'#fff',borderRadius:10,padding:'14px',cursor:'pointer',fontWeight:700,fontSize:15}}>
                      ✅ S inscrire gratuitement
                    </button>
                  ) : (
                    <button onClick={()=>{ setSelected(null); handleBuyTicket(selected) }}
                      style={{flex:1,background:'linear-gradient(135deg,#4d9fff,#3a7fd5)',border:'none',color:'#fff',borderRadius:10,padding:'14px',cursor:'pointer',fontWeight:700,fontSize:15}}>
                      🎫 Proceder au paiement — {(selected.ticket_price||0).toLocaleString()} {selected.currency||'KMF'}
                    </button>
                  )}
                </div>
              )}

              {/* PARTAGER */}
              <button onClick={()=>navigator.share&&navigator.share({title:selected.title,url:window.location.href})}
                style={{width:'100%',background:'transparent',border:'1px solid var(--border)',color:'var(--text2)',borderRadius:10,padding:'10px',cursor:'pointer',fontWeight:600,fontSize:13}}>
                📤 Partager cet evenement
              </button>
            </div>

            {/* COMMENTAIRES */}
            <div style={{borderTop:'1px solid var(--border)',padding:24}}>
              <div style={{fontWeight:700,fontSize:15,marginBottom:14}}>💬 Commentaires</div>
              <div style={{display:'flex',flexDirection:'column',gap:10,maxHeight:200,overflowY:'auto',marginBottom:12}}>
                {(comments[selected.id]||[]).length === 0 && (
                  <div style={{fontSize:13,color:'var(--text3)',textAlign:'center',padding:'16px 0'}}>Soyez le premier a commenter</div>
                )}
                {(comments[selected.id]||[]).map(cm => (
                  <div key={cm.id} style={{display:'flex',gap:10,alignItems:'flex-start'}}>
                    <div style={{width:30,height:30,borderRadius:'50%',background:'var(--primary)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,flexShrink:0}}>
                      {(cm.profiles?.username||'?')[0].toUpperCase()}
                    </div>
                    <div style={{flex:1,background:'var(--card2)',borderRadius:10,padding:'8px 12px'}}>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                        <span style={{fontSize:12,fontWeight:700,color:'var(--gold)'}}>{cm.profiles?.username}</span>
                        <span style={{fontSize:11,color:'var(--text3)'}}>{formatTimeAgo(cm.created_at)}</span>
                      </div>
                      <div style={{fontSize:13,color:'var(--text)'}}>{cm.content}</div>
                    </div>
                  </div>
                ))}
              </div>
              {user ? (
                <div style={{display:'flex',gap:8}}>
                  <input value={commentText} onChange={e=>setCommentText(e.target.value)}
                    onKeyDown={e=>e.key==='Enter'&&sendComment(selected.id)}
                    placeholder="Ecrire un commentaire..."
                    style={{flex:1,background:'var(--bg)',border:'1px solid var(--border)',borderRadius:8,padding:'9px 12px',color:'var(--text)',fontSize:13}}/>
                  <button onClick={()=>sendComment(selected.id)}
                    style={{background:'var(--primary)',border:'none',color:'#fff',borderRadius:8,padding:'9px 16px',cursor:'pointer',fontWeight:600,fontSize:13}}>
                    Envoyer
                  </button>
                </div>
              ) : (
                <div style={{textAlign:'center',padding:10,fontSize:13,color:'var(--text3)'}}>
                  <button onClick={()=>setPage('login')} style={{color:'var(--primary)',background:'none',border:'none',cursor:'pointer',fontWeight:600}}>Connectez-vous</button> pour commenter
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div style={{fontSize:22,fontWeight:800,marginBottom:20}}>🎪 Evenements</div>

      {/* FILTRES */}
      <div style={{display:'flex',gap:8,marginBottom:20,flexWrap:'wrap',alignItems:'center'}}>
        {TYPES.map(([v,l]) => (
          <button key={v} onClick={() => setType(v)}
            style={{padding:'7px 18px',borderRadius:99,border:'1px solid var(--border)',cursor:'pointer',fontSize:13,fontWeight:600,
              background:type===v?'var(--gold)':'transparent',
              color:type===v?'#000':'var(--text2)'}}>
            {l}
          </button>
        ))}
        <select value={country} onChange={e=>setCountry(e.target.value)}
          style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:99,padding:'7px 14px',color:'var(--text)',fontSize:13,cursor:'pointer'}}>
          {PAYS.map(([v,l])=><option key={v} value={v}>{l}</option>)}
        </select>
        {user && (
          <button onClick={()=>setPage('create_event')}
            style={{marginLeft:'auto',background:'var(--primary)',border:'none',color:'#fff',borderRadius:99,padding:'7px 18px',cursor:'pointer',fontWeight:700,fontSize:13}}>
            + Creer
          </button>
        )}
      </div>

      {loading ? (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:14}}>
          {[...Array(4)].map((_,i) => <div key={i} className="skeleton" style={{height:280,borderRadius:12}}/>)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{textAlign:'center',padding:60,color:'var(--text3)'}}>
          <div style={{fontSize:48,marginBottom:12}}>🎪</div>
          <h3>Aucun evenement a venir</h3>
        </div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:14}}>
          {filtered.map((e, idx) => {
            const d = formatDate(e.event_date)
            const r = reacts[e.id] || {}
            const isRegistered = registered[e.id]
            return (
              <div key={e.id} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:12,overflow:'hidden',cursor:'pointer',transition:'all 0.25s'}}
                onMouseEnter={el=>{ el.currentTarget.style.transform='translateY(-4px)'; el.currentTarget.style.borderColor='rgba(77,159,255,.4)'; el.currentTarget.style.boxShadow='0 14px 36px rgba(0,0,0,0.3)' }}
                onMouseLeave={el=>{ el.currentTarget.style.transform=''; el.currentTarget.style.borderColor='var(--border)'; el.currentTarget.style.boxShadow='' }}>
                {/* BANNER */}
                <div onClick={()=>{ setSelected(e); loadComments(e.id) }} style={{height:130,display:'flex',alignItems:'center',justifyContent:'center',fontSize:44,position:'relative',background:e.cover_url?'var(--card2)':GRADIENTS[idx%GRADIENTS.length]}}>
                  {e.cover_url ? <img src={e.cover_url} style={{width:'100%',height:'100%',objectFit:'cover'}}/> : '🎪'}
                  <div style={{position:'absolute',top:10,left:10,background:'#4d9fff',borderRadius:8,padding:'7px 12px',textAlign:'center'}}>
                    <div style={{fontSize:18,fontWeight:800,lineHeight:1}}>{d.day}</div>
                    <div style={{fontSize:9,textTransform:'uppercase',letterSpacing:1,opacity:0.85}}>{d.month}</div>
                  </div>
                  {e.is_boosted && (
                    <div style={{position:'absolute',top:10,right:10,background:'var(--gold)',color:'#000',fontSize:9,fontWeight:700,padding:'4px 8px',borderRadius:20,letterSpacing:1}}>
                      ⚡ BOOST
                    </div>
                  )}
                </div>
                {/* INFO */}
                <div onClick={()=>{ setSelected(e); loadComments(e.id) }} style={{padding:14}}>
                  <div style={{fontSize:15,fontWeight:700,marginBottom:7}}>{e.title}</div>
                  <div style={{display:'flex',gap:12,fontSize:12,color:'var(--text2)',marginBottom:12,flexWrap:'wrap'}}>
                    <span>📍 {e.location}</span>
                    <span>{e.is_free ? <span style={{color:'#2cc653',fontWeight:700}}>Gratuit</span> : <span style={{color:'var(--gold)',fontWeight:700}}>{(e.ticket_price||0).toLocaleString()} KMF</span>}</span>
                  </div>
                  <button onClick={ev=>{ ev.stopPropagation(); if(isRegistered) return; if(e.is_free) handleRegister(e); else { setSelected(e); loadComments(e.id) } }}
                    style={{width:'100%',padding:10,borderRadius:8,border:isRegistered?'1px solid #2cc653':'none',color:isRegistered?'#2cc653':'#fff',fontWeight:600,fontSize:13,cursor:isRegistered?'default':'pointer',
                      background:isRegistered?'rgba(44,198,83,0.1)':'linear-gradient(135deg,#4d9fff,#3a7fd5)'}}>
                    {isRegistered ? '✅ Inscrit' : (e.is_free ? "S inscrire" : '🎫 Acheter billets')}
                  </button>
                </div>
                {/* REACTIONS */}
                <div style={{display:'flex',gap:5,flexWrap:'wrap',padding:'8px 12px',borderTop:'1px solid var(--border)'}}>
                  {[['❤️','like'],['🔥','fire'],['🫶','love'],['👏','clap']].map(([em,key]) => (
                    <button key={key} onClick={()=>react(e.id,key)}
                      style={{display:'flex',alignItems:'center',gap:3,padding:'4px 9px',borderRadius:20,
                        border:`1px solid ${r._active===key?'var(--gold)':'var(--border)'}`,
                        background:r._active===key?'rgba(245,166,35,0.1)':'var(--card2)',
                        fontSize:12,cursor:'pointer',color:r._active===key?'var(--gold)':'var(--text2)',fontWeight:600,transition:'all 0.15s'}}>
                      {em} <span style={{fontSize:10,fontFamily:'monospace'}}>{r[key]||0}</span>
                    </button>
                  ))}
                  <button onClick={()=>{ setSelected(e); loadComments(e.id) }}
                    style={{display:'flex',alignItems:'center',gap:3,padding:'4px 9px',borderRadius:20,border:'1px solid var(--border)',background:'var(--card2)',fontSize:12,cursor:'pointer',color:'var(--text2)',fontWeight:600}}>
                    💬 <span style={{fontSize:10,fontFamily:'monospace'}}>{(comments[e.id]||[]).length}</span>
                  </button>
                  <button onClick={()=>navigator.share&&navigator.share({title:e.title,url:window.location.href})}
                    style={{marginLeft:'auto',padding:'4px 9px',borderRadius:20,border:'1px solid var(--border)',background:'var(--card2)',fontSize:12,cursor:'pointer',color:'var(--text2)'}}>
                    📤
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
