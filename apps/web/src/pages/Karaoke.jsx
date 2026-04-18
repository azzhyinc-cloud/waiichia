import { useState, useEffect, useRef } from "react"
import { useAuthStore, usePlayerStore, usePageStore } from "../stores/index.js"
import { ReactionBar } from "../components/ReactionBar.jsx"
import api from "../services/api.js"

const API_URL=import.meta.env.VITE_API_URL||''
const getToken=()=>localStorage.getItem('waiichia_token')
const BG_COLORS=["linear-gradient(135deg,#0d2a3a,#1a5060)","linear-gradient(135deg,#1a0a2e,#3a1a6a)","linear-gradient(135deg,#002a10,#007040)","linear-gradient(135deg,#2e1a00,#7a4000)","linear-gradient(135deg,#1a0020,#5a0060)","linear-gradient(135deg,#001a2e,#005080)"]
const EMOJIS=["🌊","🌃","🏝️","🥁","🔥","🌙","🎵","🎤","💿","🎸"]
const fmtK=n=>n>=1000?(n/1000).toFixed(1)+"K":String(n||0)
const SECTIONS=["🌍 Communauté","🎵 Chanter","🎤 Mes enregistrements"]
const GENRE_FILTERS=["Tout","Twarab","Afrobeats","Amapiano","Slam","Traditionnel","Gospel"]
const REC_FILTERS=[
  { key: 'tous', label: '📋 Tous' },
  { key: 'publies', label: '📢 Publiés' },
  { key: 'prives', label: '🔒 Non publiés' },
]

function timeAgo(date){
  if(!date)return''
  const s=Math.floor((Date.now()-new Date(date))/1000)
  if(s<60)return s+'s'
  const m=Math.floor(s/60);if(m<60)return m+' min'
  const h=Math.floor(m/60);if(h<24)return h+'h'
  const d=Math.floor(h/24);if(d<30)return d+'j'
  return Math.floor(d/30)+' mois'
}

export default function Karaoke(){
  const {user}=useAuthStore()
  const {toggle,currentTrack,isPlaying}=usePlayerStore()
  const {setPage}=usePageStore()
  const [section,setSection]=useState("🌍 Communauté")
  const [genreFilter,setGenreFilter]=useState("Tout")
  const [recFilter,setRecFilter]=useState("tous")
  const [tracks,setTracks]=useState([])
  const [myRecordings,setMyRecordings]=useState([])
  const [publicDuets,setPublicDuets]=useState([])
  const [loading,setLoading]=useState(true)
  const [studio,setStudio]=useState(null)
  const [editingId,setEditingId]=useState(null)
  const [editTitle,setEditTitle]=useState('')
  const [confirmDelete,setConfirmDelete]=useState(null)
  const [toast,setToast]=useState('')
  const showToast=msg=>{setToast(msg);setTimeout(()=>setToast(''),3000)}

  useEffect(()=>{loadData()},[])

  const loadData=async()=>{
    try{
      const kt=await api.karaoke.tracks().catch(()=>({}))
      const pt=await fetch(API_URL+'/api/tracks?limit=50',{headers:{'Authorization':'Bearer '+getToken()}}).then(r=>r.json()).catch(()=>({}))
      const karaokeT=kt.tracks||[]
      const platformT=(pt.tracks||[]).map((t,i)=>({
        id:t.id,title:t.title,artist:t.profiles?.display_name||'Artiste',
        genre:t.genre||'Afrobeats',
        emoji:EMOJIS[i%EMOJIS.length],bg:BG_COLORS[i%BG_COLORS.length],
        plays:t.play_count||0,
        audio_url:t.audio_url_320||t.audio_url_128,
        cover_url:t.cover_url
      }))
      setTracks([...karaokeT,...platformT].filter(t=>t.audio_url))
      const pd=await fetch(API_URL+'/api/karaoke/recordings/public',{headers:{'Authorization':'Bearer '+getToken()}}).then(r=>r.json()).catch(()=>({}))
      setPublicDuets(pd.recordings||[])
      if(user){
        const mr=await fetch(API_URL+'/api/karaoke/recordings/my',{headers:{'Authorization':'Bearer '+getToken()}}).then(r=>r.json()).catch(()=>({}))
        setMyRecordings(mr.recordings||[])
      }
    }catch(e){}
    setLoading(false)
  }

  const renameRecording=async(id)=>{
    if(!editTitle.trim())return
    try{
      await fetch(API_URL+'/api/karaoke/recordings/'+id,{method:'PATCH',headers:{'Content-Type':'application/json','Authorization':'Bearer '+getToken()},body:JSON.stringify({title:editTitle})})
      setMyRecordings(recs=>recs.map(r=>r.id===id?{...r,title:editTitle}:r))
      showToast('✅ Renommé')
    }catch(e){}
    setEditingId(null);setEditTitle('')
  }

  const deleteRecording=async(id)=>{
    try{
      await fetch(API_URL+'/api/karaoke/recordings/'+id,{method:'DELETE',headers:{'Authorization':'Bearer '+getToken()}})
      setMyRecordings(recs=>recs.filter(r=>r.id!==id))
      showToast('Enregistrement supprimé')
    }catch(e){}
    setConfirmDelete(null)
  }

  const toggleVisibility=async(rec)=>{
    const newStatus=rec.status==='public'?'private':'public'
    try{
      await fetch(API_URL+'/api/karaoke/recordings/'+rec.id,{method:'PATCH',headers:{'Content-Type':'application/json','Authorization':'Bearer '+getToken()},body:JSON.stringify({status:newStatus})})
      setMyRecordings(recs=>recs.map(r=>r.id===rec.id?{...r,status:newStatus}:r))
      showToast(newStatus==='public'?'📢 Duet rendu public':'🔒 Duet rendu privé')
    }catch(e){}
  }

  const playDuet=(d)=>{
    if(!d.audio_url)return
    toggle({id:d.id,title:d.title||'Duet 🎤',audio_url_128:d.audio_url,cover_url:d.tracks?.cover_url||null,profiles:{display_name:d.profiles?.display_name||'Artiste',username:d.profiles?.username}})
  }

  const filteredTracks=genreFilter==='Tout'?tracks:tracks.filter(t=>t.genre?.toLowerCase().includes(genreFilter.toLowerCase().slice(0,5)))

  // Filtered recordings based on recFilter
  const publicCount = myRecordings.filter(r => r.status === 'public').length
  const privateCount = myRecordings.filter(r => r.status !== 'public').length
  const filteredRecordings = recFilter === 'tous' ? myRecordings
    : recFilter === 'publies' ? myRecordings.filter(r => r.status === 'public')
    : myRecordings.filter(r => r.status !== 'public')

  return(
    <div style={{paddingBottom:40}}>
      {toast&&<div style={{position:'fixed',top:20,left:'50%',transform:'translateX(-50%)',background:'var(--gold)',color:'#000',padding:'10px 24px',borderRadius:'var(--radius-sm)',fontWeight:700,fontSize:13,zIndex:9999,boxShadow:'0 4px 20px rgba(0,0,0,.3)'}}>{toast}</div>}

      {/* HERO */}
      <div className="karaoke-hero">
        <div className="karaoke-badge">🎤 DUET STUDIO · Chante avec tes artistes préférés</div>
        <div className="karaoke-title">Chante. Mixe.<br/><span>Partage.</span></div>
        <div style={{color:"var(--text2)",fontSize:14,lineHeight:1.7,maxWidth:500,marginBottom:20,position:"relative",zIndex:1}}>
          Choisis un son, chante par-dessus et partage ton enregistrement avec la communauté !
        </div>
        <div style={{display:"flex",gap:10,position:"relative",zIndex:1,flexWrap:"wrap"}}>
          <button className="btn btn-primary" onClick={()=>setStudio({picking:true})}>🎤 Enregistrer un Duet</button>
          {myRecordings.length>0&&<button className="btn btn-secondary" onClick={()=>setSection("🎤 Mes enregistrements")}>📂 Mes Duets ({myRecordings.length})</button>}
        </div>
      </div>

      {/* SECTIONS */}
      <div className="tabs-bar" style={{marginBottom:20}}>
        {SECTIONS.map(s=><button key={s} className={"tab-btn"+(section===s?" active":"")} onClick={()=>setSection(s)}>{s}</button>)}
      </div>

      {/* ═══════════════════════════════════ */}
      {/* SECTION 1: COMMUNAUTÉ             */}
      {/* ═══════════════════════════════════ */}
      {section==="🌍 Communauté"&&(
        <div>
          <div className="section-hdr"><div className="section-title">🌍 Duets de la communauté</div><span style={{fontSize:12,color:'var(--text3)',fontFamily:'Space Mono,monospace'}}>{publicDuets.length} duets</span></div>

          {loading?<div style={{display:'flex',flexDirection:'column',gap:12}}>{[...Array(3)].map((_,i)=><div key={i} style={{height:100,background:'var(--card)',borderRadius:'var(--radius)',border:'1px solid var(--border)',animation:'shimmer 1.5s infinite'}}/>)}</div>
          :publicDuets.length>0
            ?<div style={{display:'flex',flexDirection:'column',gap:12}}>
              {publicDuets.map((d,i)=>{
                const isPlayingThis=isPlaying&&currentTrack?.id===d.id
                return(
                <div key={d.id} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',overflow:'hidden',transition:'border-color .2s'}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(245,166,35,.3)'}
                  onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>

                  {/* Header */}
                  <div style={{display:'flex',alignItems:'center',gap:12,padding:16}}>
                    {/* Avatar */}
                    <div onClick={()=>{if(d.profiles?.username)setPage('profile',{profileUsername:d.profiles.username})}}
                      style={{width:44,height:44,borderRadius:'50%',background:BG_COLORS[i%6],display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:700,color:'#fff',flexShrink:0,overflow:'hidden',cursor:'pointer'}}>
                      {d.profiles?.avatar_url?<img src={d.profiles.avatar_url} style={{width:'100%',height:'100%',objectFit:'cover'}} alt=""/>:(d.profiles?.display_name?.[0]||'🎤')}
                    </div>

                    {/* Info */}
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:14,fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.title||'Duet 🎤'}</div>
                      <div style={{fontSize:12,color:'var(--text3)',marginTop:2}}>
                        <span style={{cursor:'pointer'}} onClick={()=>{if(d.profiles?.username)setPage('profile',{profileUsername:d.profiles.username})}}>{d.profiles?.display_name||'Artiste'}</span>
                        {d.tracks?.title&&<span> · 🎵 {d.tracks.title}</span>}
                        <span> · {timeAgo(d.created_at)}</span>
                      </div>
                    </div>

                    {/* Play button — fixed: no duplicate border */}
                    {d.audio_url&&<button onClick={()=>playDuet(d)} style={{width:44,height:44,borderRadius:'50%',background:isPlayingThis?'var(--card)':'linear-gradient(135deg,var(--gold),#e8920a)',color:isPlayingThis?'var(--text)':'#000',fontSize:18,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,boxShadow:isPlayingThis?'none':'0 3px 12px rgba(245,166,35,.3)',border:isPlayingThis?'2px solid var(--border)':'none'}}>
                      {isPlayingThis?'⏸':'▶'}
                    </button>}
                  </div>

                  {/* Track original reference */}
                  {d.tracks&&(
                    <div style={{margin:'0 16px 12px',padding:'8px 12px',background:'var(--bg2)',borderRadius:'var(--radius-sm)',display:'flex',alignItems:'center',gap:8,fontSize:11,color:'var(--text3)'}}>
                      <div style={{width:28,height:28,borderRadius:6,background:BG_COLORS[i%6],display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,flexShrink:0,overflow:'hidden'}}>
                        {d.tracks.cover_url?<img src={d.tracks.cover_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:'🎵'}
                      </div>
                      <span>Son original : <strong style={{color:'var(--text2)'}}>{d.tracks.title}</strong></span>
                      {d.duration&&<span style={{marginLeft:'auto',fontFamily:'Space Mono,monospace'}}>{Math.floor(d.duration/60)}:{String(Math.floor(d.duration%60)).padStart(2,'0')}</span>}
                    </div>
                  )}

                  {/* Reactions */}
                  <div style={{padding:'0 16px 14px'}}>
                    <ReactionBar targetType="recording" targetId={d.id} showComments={true}/>
                  </div>
                </div>
              )})}
            </div>
            :<div style={{textAlign:'center',padding:60,color:'var(--text3)',background:'var(--card)',borderRadius:'var(--radius)',border:'1px solid var(--border)'}}>
              <div style={{fontSize:48,marginBottom:12}}>🌍</div>
              <div style={{fontSize:15,fontWeight:600,marginBottom:8}}>Aucun duet public</div>
              <div style={{fontSize:12,marginBottom:16}}>Soyez le premier à publier un duet !</div>
              <button className="btn btn-primary" onClick={()=>setStudio({picking:true})}>🎤 Enregistrer un Duet</button>
            </div>
          }
        </div>
      )}

      {/* ═══════════════════════════════════ */}
      {/* SECTION 2: CHANTER                */}
      {/* ═══════════════════════════════════ */}
      {section==="🎵 Chanter"&&(
        <div>
          <div className="section-hdr"><div className="section-title">🎵 Choisir un son</div><span style={{fontSize:12,color:'var(--text3)',fontFamily:'Space Mono,monospace'}}>{filteredTracks.length} sons</span></div>

          {/* Genre filter */}
          <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:16}}>
            {GENRE_FILTERS.map(g=>(
              <button key={g} onClick={()=>setGenreFilter(g)} style={{padding:'6px 14px',borderRadius:20,border:'1px solid '+(genreFilter===g?'var(--gold)':'var(--border)'),background:genreFilter===g?'rgba(245,166,35,.12)':'transparent',color:genreFilter===g?'var(--gold)':'var(--text3)',fontSize:11,fontWeight:600,cursor:'pointer'}}>{g}</button>
            ))}
          </div>

          {loading?<div style={{textAlign:'center',padding:40,color:'var(--text3)'}}>Chargement...</div>
          :filteredTracks.length>0
            ?<div className="karaoke-grid">
              {filteredTracks.map((t,i)=>(
                <div key={t.id||i} className="karaoke-card" onClick={()=>setStudio(t)}>
                  <div className="karaoke-cover" style={{background:t.bg||BG_COLORS[i%6]}}>
                    {t.cover_url?<img src={t.cover_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover',opacity:.7}}/>:<span style={{fontSize:40}}>{t.emoji||'🎵'}</span>}
                  </div>
                  <div className="karaoke-info">
                    <div className="karaoke-name">{t.title}</div>
                    <div className="karaoke-meta"><span>{t.artist}</span><span>🎧 {fmtK(t.plays)}</span></div>
                    <div className="karaoke-actions">
                      <button className="karaoke-duet-btn" onClick={e=>{e.stopPropagation();setStudio(t)}}>🎤 Chanter</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            :<div style={{textAlign:'center',padding:40,color:'var(--text3)'}}>Aucun son dans cette catégorie</div>
          }
        </div>
      )}

      {/* ═══════════════════════════════════ */}
      {/* SECTION 3: MES ENREGISTREMENTS    */}
      {/* ═══════════════════════════════════ */}
      {section==="🎤 Mes enregistrements"&&(
        <div>
          {!user
            ?<div style={{textAlign:'center',padding:60}}>
              <div style={{fontSize:48,marginBottom:12}}>🔒</div>
              <div style={{fontSize:15,fontWeight:600,marginBottom:8}}>Connectez-vous</div>
              <button className="btn btn-primary" onClick={()=>setPage('login')}>Se connecter</button>
            </div>
            :<>
              <div className="section-hdr">
                <div className="section-title">🎤 Mes enregistrements</div>
                <span style={{fontSize:12,color:'var(--text3)',fontFamily:'Space Mono,monospace'}}>
                  {myRecordings.length} duet{myRecordings.length>1?'s':''} · {publicCount} public{publicCount>1?'s':''} · {privateCount} privé{privateCount>1?'s':''}
                </span>
              </div>

              {/* ── Filtres publiés / non publiés ── */}
              <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16}}>
                {REC_FILTERS.map(f=>{
                  const count = f.key==='tous'?myRecordings.length:f.key==='publies'?publicCount:privateCount
                  return(
                    <button key={f.key} onClick={()=>setRecFilter(f.key)} style={{
                      padding:'7px 16px',borderRadius:20,fontSize:12,fontWeight:600,cursor:'pointer',
                      transition:'all .18s',fontFamily:'Plus Jakarta Sans,sans-serif',
                      border:'1px solid '+(recFilter===f.key?'var(--gold)':'var(--border)'),
                      background:recFilter===f.key?'rgba(245,166,35,.12)':'transparent',
                      color:recFilter===f.key?'var(--gold)':'var(--text3)'
                    }}>
                      {f.label} ({count})
                    </button>
                  )
                })}
              </div>

              {filteredRecordings.length>0
                ?<div style={{display:'flex',flexDirection:'column',gap:12}}>
                  {filteredRecordings.map((r,i)=>{
                    const isPlayingThis=isPlaying&&currentTrack?.id===r.id
                    return(
                    <div key={r.id} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',overflow:'hidden',transition:'border-color .2s'}}
                      onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(245,166,35,.3)'}
                      onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>

                      <div style={{display:'flex',alignItems:'center',gap:14,padding:16}}>
                        {/* Cover */}
                        <div style={{width:56,height:56,borderRadius:12,background:BG_COLORS[i%6],display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,flexShrink:0,overflow:'hidden',position:'relative',cursor:r.audio_url?'pointer':'default'}} onClick={()=>{if(r.audio_url)playDuet(r)}}>
                          {r.tracks?.cover_url?<img src={r.tracks.cover_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover',opacity:.7}}/>:'🎤'}
                          {r.audio_url&&<div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.3)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                            <span style={{fontSize:20,color:'#fff'}}>{isPlayingThis?'⏸':'▶'}</span>
                          </div>}
                        </div>

                        {/* Info */}
                        <div style={{flex:1,minWidth:0}}>
                          {editingId===r.id?(
                            <div style={{display:'flex',gap:6,alignItems:'center'}}>
                              <input value={editTitle} onChange={e=>setEditTitle(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')renameRecording(r.id);if(e.key==='Escape'){setEditingId(null);setEditTitle('')}}} autoFocus style={{flex:1,padding:'6px 10px',borderRadius:8,border:'1px solid var(--gold)',background:'var(--bg2)',color:'var(--text)',fontSize:13,outline:'none'}}/>
                              <button onClick={()=>renameRecording(r.id)} style={{padding:'5px 12px',borderRadius:8,border:'none',background:'var(--gold)',color:'#000',fontSize:12,fontWeight:700,cursor:'pointer'}}>OK</button>
                              <button onClick={()=>{setEditingId(null);setEditTitle('')}} style={{padding:'5px 10px',borderRadius:8,border:'1px solid var(--border)',background:'var(--card)',color:'var(--text3)',fontSize:12,cursor:'pointer'}}>✕</button>
                            </div>
                          ):(
                            <>
                              <div style={{fontWeight:700,fontSize:14,marginBottom:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.title||'Duet — '+(r.tracks?.title||'Son')}</div>
                              <div style={{fontSize:12,color:'var(--text3)',display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
                                {r.tracks?.title&&<span>🎵 {r.tracks.title}</span>}
                                {r.duration&&<span>· ⏱ {Math.floor(r.duration)}s</span>}
                                <span>· 📅 {timeAgo(r.created_at)}</span>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Status badge */}
                        <button onClick={()=>toggleVisibility(r)} style={{padding:'4px 12px',borderRadius:12,fontSize:10,fontWeight:700,border:'1px solid '+(r.status==='public'?'var(--green)':'var(--border)'),background:r.status==='public'?'rgba(44,198,83,.12)':'rgba(255,255,255,.05)',color:r.status==='public'?'var(--green)':'var(--text3)',cursor:'pointer',flexShrink:0,transition:'all .2s'}}>
                          {r.status==='public'?'📢 Public':'🔒 Privé'}
                        </button>
                      </div>

                      {/* Actions bar */}
                      {editingId!==r.id&&(
                        <div style={{display:'flex',alignItems:'center',gap:8,padding:'0 16px 14px',borderTop:'1px solid var(--border)',marginTop:0,paddingTop:12}}>
                          {r.audio_url&&<button onClick={()=>playDuet(r)} style={{display:'flex',alignItems:'center',gap:4,padding:'6px 14px',borderRadius:20,border:isPlayingThis?'1px solid var(--gold)':'1px solid var(--border)',background:isPlayingThis?'rgba(245,166,35,.12)':'var(--card)',color:isPlayingThis?'var(--gold)':'var(--text2)',fontSize:11,fontWeight:600,cursor:'pointer'}}>
                            {isPlayingThis?'⏸ En cours':'▶ Écouter'}
                          </button>}
                          <button onClick={()=>{setEditingId(r.id);setEditTitle(r.title||'Duet — '+(r.tracks?.title||'Son'))}} style={{display:'flex',alignItems:'center',gap:4,padding:'6px 12px',borderRadius:20,border:'1px solid var(--border)',background:'var(--card)',color:'var(--text3)',fontSize:11,cursor:'pointer'}}>
                            ✏️ Renommer
                          </button>
                          {confirmDelete===r.id?(
                            <div style={{display:'flex',gap:4,marginLeft:'auto'}}>
                              <button onClick={()=>deleteRecording(r.id)} style={{padding:'6px 12px',borderRadius:20,border:'none',background:'var(--red)',color:'#fff',fontSize:11,fontWeight:700,cursor:'pointer'}}>Confirmer</button>
                              <button onClick={()=>setConfirmDelete(null)} style={{padding:'6px 12px',borderRadius:20,border:'1px solid var(--border)',background:'var(--card)',color:'var(--text3)',fontSize:11,cursor:'pointer'}}>Annuler</button>
                            </div>
                          ):(
                            <button onClick={()=>setConfirmDelete(r.id)} style={{display:'flex',alignItems:'center',gap:4,padding:'6px 12px',borderRadius:20,border:'1px solid var(--border)',background:'var(--card)',color:'var(--text3)',fontSize:11,cursor:'pointer',marginLeft:'auto'}}>
                              🗑️ Supprimer
                            </button>
                          )}
                        </div>
                      )}

                      {/* ReactionBar for public recordings */}
                      {r.status==='public'&&(
                        <div style={{padding:'0 16px 14px'}}>
                          <ReactionBar targetType="recording" targetId={r.id} showComments={true}/>
                        </div>
                      )}
                    </div>
                  )})}
                </div>
                :<div style={{textAlign:'center',padding:60,color:'var(--text3)',background:'var(--card)',borderRadius:'var(--radius)',border:'1px solid var(--border)'}}>
                  <div style={{fontSize:48,marginBottom:12}}>{recFilter==='publies'?'📢':recFilter==='prives'?'🔒':'🎤'}</div>
                  <div style={{fontSize:15,fontWeight:600,marginBottom:8}}>
                    {recFilter==='publies'?'Aucun duet publié':recFilter==='prives'?'Aucun duet privé':'Aucun enregistrement'}
                  </div>
                  <div style={{fontSize:12,marginBottom:16}}>
                    {recFilter==='publies'?'Publiez vos duets pour les partager avec la communauté !':recFilter==='prives'?'Tous vos duets sont déjà publics 🎉':'Choisissez un son et commencez à chanter !'}
                  </div>
                  {recFilter==='tous'&&<button className="btn btn-primary" onClick={()=>{setSection("🎵 Chanter")}}>🎵 Choisir un son</button>}
                  {recFilter!=='tous'&&<button className="btn btn-secondary" onClick={()=>setRecFilter('tous')}>📋 Voir tous les duets</button>}
                </div>
              }
            </>
          }
        </div>
      )}

      {studio&&<StudioModal track={studio} allTracks={tracks} user={user} onClose={()=>setStudio(null)} onSaved={()=>{loadData();setStudio(null);showToast('✅ Duet sauvegardé !')}}/>}
    </div>
  )
}

// ═══════════════════════════════════════
// STUDIO MODAL (inchangé)
// ═══════════════════════════════════════
function StudioModal({track:initialTrack,allTracks=[],user,onClose,onSaved}){
  const [track,setTrack]=useState(initialTrack?.picking?null:initialTrack)
  const [trackSearch,setTrackSearch]=useState('')
  const [showPicker,setShowPicker]=useState(initialTrack?.picking||false)
  const [phase,setPhase]=useState('ready')
  const [time,setTime]=useState(0)
  const [countdown,setCountdown]=useState(3)
  const [voiceBlob,setVoiceBlob]=useState(null)
  const [voiceUrl,setVoiceUrl]=useState(null)
  const [saving,setSaving]=useState(false)
  const [mixing,setMixing]=useState(false)
  const [mixUrl,setMixUrl]=useState(null)
  const [instrVol,setInstrVol]=useState(70)
  const [voiceVol,setVoiceVol]=useState(100)
  const [muteOriginalVoice,setMuteOriginalVoice]=useState(false)
  const [waveData,setWaveData]=useState(new Array(40).fill(5))
  const [isPlaying,setIsPlaying]=useState(false)
  const filteredTracks=allTracks.filter(t=>{if(!trackSearch)return true;const q=trackSearch.toLowerCase();return t.title?.toLowerCase().includes(q)||t.artist?.toLowerCase().includes(q)})
  const [duetTitle,setDuetTitle]=useState(track?'Duet_'+track.title?.replace(/[^a-zA-Z0-9]/g,'_')+'_'+(user?.username||'moi'):'')

  const timerRef=useRef(null)
  const mediaRef=useRef(null)
  const chunksRef=useRef([])
  const instrRef=useRef(null)
  const voiceAudioRef=useRef(null)
  const analyserRef=useRef(null)
  const audioCtxRef=useRef(null)
  const animRef=useRef(null)

  useEffect(()=>{return()=>stopAll()},[])

  const stopAll=()=>{
    if(timerRef.current)clearInterval(timerRef.current)
    if(animRef.current)cancelAnimationFrame(animRef.current)
    if(mediaRef.current&&mediaRef.current.state==='recording')mediaRef.current.stream.getTracks().forEach(t=>t.stop())
    if(instrRef.current){instrRef.current.pause();instrRef.current.currentTime=0}
    if(voiceAudioRef.current){voiceAudioRef.current.pause();voiceAudioRef.current.currentTime=0}
    if(audioCtxRef.current)audioCtxRef.current.close().catch(()=>{})
    setIsPlaying(false)
  }

  const startSession=()=>{
    const audioUrl=track.instrumental_url||track.audio_url||track.audio_url_320||track.audio_url_128
    if(audioUrl){
      instrRef.current=new Audio(audioUrl)
      instrRef.current.volume=muteOriginalVoice?instrVol/200:instrVol/100
      instrRef.current.play().catch(()=>{})
      instrRef.current.pause()
      instrRef.current.currentTime=0
    }
    setPhase('countdown');setCountdown(3)
    let c=3
    const ci=setInterval(()=>{c--;setCountdown(c);if(c<=0){clearInterval(ci);startRecording()}},1000)
  }

  const startRecording=async()=>{
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true,sampleRate:44100}})
      if(instrRef.current){
        instrRef.current.currentTime=0
        instrRef.current.volume=muteOriginalVoice?instrVol/200:instrVol/100
        instrRef.current.play().catch(()=>{})
        instrRef.current.onended=()=>{stopRecording()}
      }else{
        const audioUrl=track.instrumental_url||track.audio_url||track.audio_url_320||track.audio_url_128
        if(audioUrl){instrRef.current=new Audio(audioUrl);instrRef.current.volume=muteOriginalVoice?instrVol/200:instrVol/100;instrRef.current.play().catch(()=>{});instrRef.current.onended=()=>{stopRecording()}}
      }
      const mr=new MediaRecorder(stream,{mimeType:MediaRecorder.isTypeSupported('audio/webm;codecs=opus')?'audio/webm;codecs=opus':'audio/webm',audioBitsPerSecond:128000})
      mediaRef.current=mr;chunksRef.current=[]
      mr.ondataavailable=e=>chunksRef.current.push(e.data)
      mr.onstop=()=>{stream.getTracks().forEach(t=>t.stop());const blob=new Blob(chunksRef.current,{type:'audio/webm'});setVoiceBlob(blob);setVoiceUrl(URL.createObjectURL(blob));setPhase('review')}
      mr.start();setPhase('recording');setTime(0)
      timerRef.current=setInterval(()=>setTime(t=>t+1),1000)
      try{const ctx=new AudioContext();audioCtxRef.current=ctx;const src=ctx.createMediaStreamSource(stream);const analyser=ctx.createAnalyser();analyser.fftSize=64;src.connect(analyser);analyserRef.current=analyser;visualize()}catch(e){}
    }catch(e){alert('Microphone non disponible');setPhase('ready')}
  }

  const visualize=()=>{
    if(!analyserRef.current)return
    const data=new Uint8Array(analyserRef.current.frequencyBinCount)
    const draw=()=>{if(!analyserRef.current)return;analyserRef.current.getByteFrequencyData(data);setWaveData(Array.from({length:40},(_,i)=>Math.max(3,data[Math.floor(i*data.length/40)]/3)));animRef.current=requestAnimationFrame(draw)}
    draw()
  }

  const stopRecording=()=>{
    if(timerRef.current)clearInterval(timerRef.current)
    if(animRef.current)cancelAnimationFrame(animRef.current)
    if(instrRef.current){instrRef.current.pause();instrRef.current.currentTime=0}
    if(mediaRef.current&&mediaRef.current.state==='recording')mediaRef.current.stop()
    if(audioCtxRef.current){audioCtxRef.current.close().catch(()=>{});audioCtxRef.current=null}
  }

  const reset=()=>{stopAll();setPhase('ready');setTime(0);setVoiceBlob(null);setVoiceUrl(null);setWaveData(new Array(40).fill(5))}

  const playReview=()=>{
    if(isPlaying){instrRef.current?.pause();voiceAudioRef.current?.pause();setIsPlaying(false);return}
    const audioUrl=track.instrumental_url||track.audio_url||track.audio_url_320||track.audio_url_128
    if(audioUrl){instrRef.current=new Audio(audioUrl);instrRef.current.volume=muteOriginalVoice?instrVol/200:instrVol/100;instrRef.current.play().catch(()=>{});instrRef.current.onended=()=>setIsPlaying(false)}
    if(voiceUrl){voiceAudioRef.current=new Audio(voiceUrl);voiceAudioRef.current.volume=voiceVol/100;voiceAudioRef.current.play().catch(()=>{})}
    setIsPlaying(true)
  }

  useEffect(()=>{if(instrRef.current)instrRef.current.volume=muteOriginalVoice?instrVol/200:instrVol/100},[instrVol,muteOriginalVoice])
  useEffect(()=>{if(voiceAudioRef.current)voiceAudioRef.current.volume=voiceVol/100},[voiceVol])

  const mixAndSave=async(publish=false)=>{
    if(!voiceBlob)return
    setSaving(true);setMixing(true)
    try{
      const form=new FormData();form.append('file',voiceBlob,'duet_voice_'+Date.now()+'.webm')
      const upRes=await fetch(API_URL+'/api/upload/cover',{method:'POST',headers:{'Authorization':'Bearer '+getToken()},body:form})
      const upData=await upRes.json()
      if(!upData.url){setSaving(false);setMixing(false);alert('Erreur upload');return}
      const trackUrl=track.instrumental_url||track.audio_url||track.audio_url_320||track.audio_url_128
      const mixRes=await fetch(API_URL+'/api/karaoke/mix',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+getToken()},body:JSON.stringify({voice_url:upData.url,track_url:trackUrl,voice_vol:voiceVol,instr_vol:instrVol,mute_voice:muteOriginalVoice})})
      const mixData=await mixRes.json()
      setMixing(false)
      if(mixData.mix_url){
        setMixUrl(mixData.mix_url)
        await fetch(API_URL+'/api/karaoke/recordings',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+getToken()},body:JSON.stringify({track_id:track.id,audio_url:mixData.mix_url,duration:time,status:publish?'public':'private',title:duetTitle})})
        onSaved()
      }else{
        await fetch(API_URL+'/api/karaoke/recordings',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+getToken()},body:JSON.stringify({track_id:track.id,audio_url:upData.url,duration:time,status:publish?'public':'private',title:duetTitle})})
        onSaved()
      }
    }catch(e){alert('Erreur: '+e.message)}
    setSaving(false);setMixing(false)
  }

  const fmtTime=s=>Math.floor(s/60)+':'+String(s%60).padStart(2,'0')

  return(
    <div className="modal-overlay" onClick={()=>{stopAll();onClose()}}>
      <div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:600}}>
        <div className="modal-hdr">
          <div className="modal-title">🎤 Duet Studio</div>
          <button className="modal-close" onClick={()=>{stopAll();onClose()}}>✕</button>
        </div>

        {(!track||showPicker)?(
          <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',padding:16,marginBottom:16}}>
            <div style={{fontSize:13,fontWeight:700,marginBottom:10}}>🎵 Choisir un son</div>
            <input value={trackSearch} onChange={e=>setTrackSearch(e.target.value)} placeholder="Rechercher un son..." className="input-field" style={{fontSize:13,padding:'10px 14px',marginBottom:10}}/>
            <div style={{maxHeight:250,overflowY:'auto',display:'flex',flexDirection:'column',gap:4}}>
              {filteredTracks.slice(0,20).map((t,i)=>(
                <div key={t.id||i} onClick={()=>{setTrack(t);setShowPicker(false);setDuetTitle('Duet_'+t.title?.replace(/[^a-zA-Z0-9]/g,'_')+'_'+(user?.username||'moi'))}} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',cursor:'pointer',borderRadius:10,transition:'background .15s',border:'1px solid transparent'}} onMouseEnter={e=>{e.currentTarget.style.background='var(--bg2)';e.currentTarget.style.borderColor='var(--gold)'}} onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.borderColor='transparent'}}>
                  <div style={{width:42,height:42,borderRadius:10,background:t.bg||BG_COLORS[i%6],display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0,overflow:'hidden'}}>
                    {t.cover_url?<img src={t.cover_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:(t.emoji||'🎵')}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:700,fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</div>
                    <div style={{fontSize:11,color:'var(--text3)'}}>{t.artist} · {fmtK(t.plays)} écoutes</div>
                  </div>
                </div>
              ))}
              {filteredTracks.length===0&&<div style={{padding:20,textAlign:'center',color:'var(--text3)',fontSize:12}}>Aucun son trouvé</div>}
            </div>
          </div>
        ):(
        <div style={{display:"flex",alignItems:"center",gap:12,background:"var(--card)",borderRadius:"var(--radius-sm)",padding:12,marginBottom:16}}>
          <div style={{width:52,height:52,borderRadius:10,background:track.bg||"var(--purple)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,overflow:'hidden'}}>
            {track.cover_url?<img src={track.cover_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:(track.emoji||"🎵")}
          </div>
          <div style={{flex:1}}>
            <div style={{fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:15}}>{track.title}</div>
            <div style={{fontSize:12,color:"var(--text2)"}}>{track.artist}</div>
          </div>
          <div style={{fontFamily:"Space Mono,monospace",fontSize:11,padding:'4px 10px',borderRadius:20,background:phase==='recording'?'rgba(230,57,70,.2)':phase==='review'?'rgba(44,198,83,.2)':'var(--bg2)',color:phase==='recording'?'var(--red)':phase==='review'?'var(--green)':'var(--text3)'}}>
            {phase==='recording'?'🔴 REC':phase==='review'?'✅ TERMINÉ':phase==='countdown'?'⏳':'🎵 PRÊT'}
          </div>
          {phase==='ready'&&<button onClick={()=>setShowPicker(true)} style={{padding:'4px 10px',borderRadius:8,border:'1px solid var(--border)',background:'var(--card)',color:'var(--text3)',fontSize:11,cursor:'pointer'}}>Changer</button>}
        </div>
        )}

        {track&&<>
        {/* Mixing controls */}
        <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',padding:14,marginBottom:16}}>
          <div style={{fontSize:12,fontWeight:700,marginBottom:10,color:'var(--text2)'}}>🎚️ Mixage audio</div>
          <div style={{display:'flex',gap:16}}>
            <div style={{flex:1}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                <span style={{fontSize:11,color:'var(--text3)'}}>🎵 Son original</span>
                <span style={{fontSize:11,fontFamily:'Space Mono,monospace',color:'var(--gold)'}}>{instrVol}%</span>
              </div>
              <input type="range" min="0" max="100" value={instrVol} onChange={e=>setInstrVol(parseInt(e.target.value))} style={{width:'100%',accentColor:'var(--gold)'}}/>
              <label style={{display:'flex',alignItems:'center',gap:6,marginTop:6,cursor:'pointer',fontSize:11,color:'var(--text3)'}}>
                <input type="checkbox" checked={muteOriginalVoice} onChange={e=>setMuteOriginalVoice(e.target.checked)} style={{accentColor:'var(--gold)'}}/>
                Diminuer la voix de l'artiste (50%)
              </label>
            </div>
            <div style={{width:1,background:'var(--border)'}}/>
            <div style={{flex:1}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                <span style={{fontSize:11,color:'var(--text3)'}}>🎤 Ma voix</span>
                <span style={{fontSize:11,fontFamily:'Space Mono,monospace',color:'var(--purple)'}}>{voiceVol}%</span>
              </div>
              <input type="range" min="0" max="100" value={voiceVol} onChange={e=>setVoiceVol(parseInt(e.target.value))} style={{width:'100%',accentColor:'var(--purple)'}}/>
            </div>
          </div>
          {phase==='ready'&&<div style={{marginTop:10,fontSize:11,color:'var(--text3)',background:'rgba(245,166,35,.08)',padding:'8px 12px',borderRadius:8}}>🎧 Utilisez des écouteurs pour que le micro ne capte pas l'instrumental !</div>}
        </div>

        {/* Waveform */}
        <div style={{height:70,background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',display:'flex',alignItems:'center',padding:'0 8px',gap:2,overflow:'hidden',marginBottom:16}}>
          {waveData.map((h,i)=>(
            <div key={i} style={{flex:1,minWidth:3,maxWidth:6,height:h+'%',background:phase==='recording'?'var(--red)':phase==='review'?'var(--gold)':'var(--purple)',borderRadius:2,transition:'height .08s',opacity:phase==='ready'?0.2:0.8}}/>
          ))}
        </div>

        {/* Timer */}
        <div style={{fontFamily:'Space Mono,monospace',fontSize:40,fontWeight:700,textAlign:'center',color:phase==='recording'?'var(--red)':phase==='countdown'?'var(--gold)':'var(--text)',marginBottom:20,letterSpacing:4}}>
          {phase==='countdown'?countdown:fmtTime(time)}
        </div>

        {/* Controls */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:16,marginBottom:20,flexWrap:'wrap'}}>
          {phase==='ready'&&<button onClick={startSession} style={{width:72,height:72,borderRadius:'50%',border:'none',background:'var(--red)',color:'#fff',fontSize:28,cursor:'pointer',boxShadow:'0 4px 24px rgba(230,57,70,.4)',display:'flex',alignItems:'center',justifyContent:'center',transition:'transform .15s'}} onMouseEnter={e=>e.currentTarget.style.transform='scale(1.1)'} onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}>🎤</button>}
          {phase==='countdown'&&<div style={{width:72,height:72,borderRadius:'50%',background:'var(--card)',border:'3px solid var(--gold)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:32,fontWeight:800,color:'var(--gold)',animation:'pulse-glow 1s infinite'}}>{countdown}</div>}
          {phase==='recording'&&<button onClick={stopRecording} style={{width:72,height:72,borderRadius:'50%',border:'none',background:'var(--red)',color:'#fff',fontSize:24,cursor:'pointer',boxShadow:'0 4px 24px rgba(230,57,70,.4)',display:'flex',alignItems:'center',justifyContent:'center',animation:'pulse-glow 1.2s infinite'}}>⏹</button>}
          {phase==='review'&&<>
            <button onClick={reset} title="Recommencer" style={{width:48,height:48,borderRadius:'50%',border:'1px solid var(--border)',background:'var(--card)',color:'var(--text2)',fontSize:20,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>🔄</button>
            <button onClick={playReview} style={{width:64,height:64,borderRadius:'50%',border:isPlaying?'2px solid var(--border)':'none',background:isPlaying?'var(--card)':'var(--gold)',color:isPlaying?'var(--text)':'#000',fontSize:22,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:isPlaying?'none':'0 4px 20px rgba(245,166,35,.3)'}}>{isPlaying?'⏸':'▶'}</button>
          </>}
        </div>

        {/* Review save */}
        {phase==='review'&&(
          <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',padding:16}}>
            <div style={{fontSize:12,fontWeight:700,color:'var(--text2)',marginBottom:10}}>🎵 Votre Duet</div>
            <div style={{marginBottom:12}}>
              <label style={{fontSize:11,color:'var(--text3)',display:'block',marginBottom:4}}>Nom du Duet</label>
              <input value={duetTitle} onChange={e=>setDuetTitle(e.target.value)} style={{width:'100%',padding:'8px 12px',borderRadius:8,border:'1px solid var(--border)',background:'var(--bg2)',color:'var(--text)',fontSize:13,outline:'none',boxSizing:'border-box'}} placeholder="Ex: Duet_Moina_monpseudo"/>
            </div>
            <div style={{textAlign:'center',fontSize:12,color:'var(--text3)',marginBottom:12}}>Appuyez ▶ pour écouter le mix. Ajustez les volumes 🎚️ ci-dessus.</div>
            <div style={{display:'flex',gap:10,justifyContent:'center'}}>
              <button onClick={()=>mixAndSave(false)} disabled={saving} style={{padding:'10px 24px',borderRadius:50,border:'1px solid var(--border)',background:'var(--card)',color:'var(--text)',fontSize:13,fontWeight:700,cursor:'pointer',opacity:saving?.5:1}}>
                {mixing?'🔄 Mixage...':saving?'⏳ ...':'💾 Sauvegarder'}
              </button>
              <button onClick={()=>mixAndSave(true)} disabled={saving} style={{padding:'10px 24px',borderRadius:50,border:'none',background:'linear-gradient(135deg,var(--gold),#e8920a)',color:'#000',fontSize:13,fontWeight:700,cursor:'pointer',boxShadow:'0 4px 16px rgba(245,166,35,.3)',opacity:saving?.5:1}}>
                {mixing?'🔄 Mixage...':saving?'⏳ ...':'📢 Publier'}
              </button>
            </div>
          </div>
        )}

        {phase==='ready'&&(
          <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',padding:14}}>
            <div style={{fontSize:13,fontWeight:700,marginBottom:8}}>🎤 Comment ça marche</div>
            <div style={{fontSize:12,color:'var(--text2)',lineHeight:2}}>
              1. Réglez le volume du son original et de votre voix<br/>
              2. Mettez vos écouteurs 🎧<br/>
              3. Appuyez sur 🎤 — compte à rebours 3...2...1<br/>
              4. Le son joue, chantez par-dessus !<br/>
              5. Appuyez ⏹ pour arrêter<br/>
              6. Écoutez le mix ▶ → Nommez → Publiez 📢
            </div>
          </div>
        )}
        </>}
      </div>
    </div>
  )
}
