import { useState, useEffect, useRef } from "react"
import { useAuthStore } from "../stores/index.js"
import api from "../services/api.js"

const API_URL=import.meta.env.VITE_API_URL||''
const getToken=()=>localStorage.getItem('waiichia_token')
const TABS=["🎵 Tous","🌊 Twarab","🥁 Afrobeats","🎶 Amapiano","🎤 Mes enregistrements","🌍 Duets publics"]
const BG_COLORS=["linear-gradient(135deg,#0d2a3a,#1a5060)","linear-gradient(135deg,#1a0a2e,#3a1a6a)","linear-gradient(135deg,#002a10,#007040)","linear-gradient(135deg,#2e1a00,#7a4000)","linear-gradient(135deg,#1a0020,#5a0060)","linear-gradient(135deg,#001a2e,#005080)"]
const EMOJIS=["🌊","🌃","🏝️","🥁","🔥","🌙","🎵","🎤","💿","🎸"]
const fmtK=n=>n>=1000?(n/1000).toFixed(1)+"K":String(n||0)

export default function Karaoke(){
  const {user}=useAuthStore()
  const [tab,setTab]=useState("🎵 Tous")
  const [tracks,setTracks]=useState([])
  const [myRecordings,setMyRecordings]=useState([])
  const [loading,setLoading]=useState(true)
  const [studio,setStudio]=useState(null)
  const [editingId,setEditingId]=useState(null)
  const [publicDuets,setPublicDuets]=useState([])
  const [editTitle,setEditTitle]=useState('')
  const [confirmDelete,setConfirmDelete]=useState(null)

  useEffect(()=>{loadData()},[])

  const loadData=async()=>{
    try{
      const kt=await api.karaoke.tracks().catch(()=>({tracks:[]}))
      const pt=await fetch(API_URL+'/api/tracks?limit=50',{headers:{'Authorization':'Bearer '+getToken()}}).then(r=>r.json()).catch(()=>({tracks:[]}))
      const karaokeT=kt.tracks||[]
      const platformT=(pt.tracks||pt.data||[]).map((t,i)=>({
        id:t.id,title:t.title,artist:t.profiles?.display_name||'Artiste',
        genre:t.genre||'Afrobeats',bpm:t.bpm||110,
        diff:['Facile','Moyen','Difficile'][i%3],
        emoji:EMOJIS[i%EMOJIS.length],bg:BG_COLORS[i%BG_COLORS.length],
        plays:t.play_count||0,
        audio_url:t.audio_url_320||t.audio_url_128||t.audio_hls_url,
        cover_url:t.cover_url,
        allow_karaoke:t.is_karaoke!==false
      }))
      setTracks([...karaokeT,...platformT].filter(t=>t.audio_url))
      // Load public duets
      const pd=await fetch(API_URL+'/api/karaoke/recordings/public',{headers:{'Authorization':'Bearer '+getToken()}}).then(r=>r.json()).catch(()=>({recordings:[]}))
      setPublicDuets(pd.recordings||[])
      if(user){
        const mr=await fetch(API_URL+'/api/karaoke/recordings/my',{headers:{'Authorization':'Bearer '+getToken()}}).then(r=>r.json()).catch(()=>({recordings:[]}))
        setMyRecordings(mr.recordings||[])
      }
    }catch(e){}
    setLoading(false)
  }

  const renameRecording=async(id)=>{
    if(!editTitle.trim())return
    try{
      await fetch(API_URL+'/api/karaoke/recordings/'+id,{
        method:'PATCH',headers:{'Content-Type':'application/json','Authorization':'Bearer '+getToken()},
        body:JSON.stringify({title:editTitle})
      })
      setMyRecordings(recs=>recs.map(r=>r.id===id?{...r,title:editTitle}:r))
    }catch(e){}
    setEditingId(null);setEditTitle('')
  }

  const deleteRecording=async(id)=>{
    try{
      await fetch(API_URL+'/api/karaoke/recordings/'+id,{
        method:'DELETE',headers:{'Authorization':'Bearer '+getToken()}
      })
      setMyRecordings(recs=>recs.filter(r=>r.id!==id))
    }catch(e){}
    setConfirmDelete(null)
  }

  const filtered=tab==="🎵 Tous"?tracks
    :tab.includes("Mes enregistrements")?[]
    :tracks.filter(t=>t.genre?.toLowerCase().includes(tab.replace(/[^a-z]/gi,"").toLowerCase().slice(0,5)))

  return(
    <div style={{paddingBottom:40}}>
      <div className="karaoke-hero">
        <div className="karaoke-badge">🎤 DUET STUDIO · Chante avec tes artistes preferes</div>
        <div className="karaoke-title">Chante. Mixe.<br/><span>Partage.</span></div>
        <div style={{color:"var(--text2)",fontSize:14,lineHeight:1.7,maxWidth:500,marginBottom:20,position:"relative",zIndex:1}}>
          Choisis un son, l'instrumental se lance, chante par-dessus et partage ton enregistrement !
        </div>
        <div style={{display:"flex",gap:10,position:"relative",zIndex:1,flexWrap:"wrap"}}>
          <button className="btn btn-primary" onClick={()=>setStudio({picking:true})}>🎤 Commencer</button>
        </div>
      </div>

      <div className="tabs-bar" style={{marginBottom:20}}>
        {TABS.map(t=><button key={t} className={"tab-btn"+(tab===t?" active":"")} onClick={()=>setTab(t)}>{t}</button>)}
      </div>

      {/* MES ENREGISTREMENTS */}
      {tab.includes("Mes enregistrements")&&(
        <div>
          <div className="section-hdr"><div className="section-title">🎤 Mes enregistrements ({myRecordings.length})</div></div>
          {myRecordings.length?<div style={{display:'flex',flexDirection:'column',gap:12}}>
            {myRecordings.map((r,i)=>(
              <div key={r.id} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:16,display:'flex',alignItems:'center',gap:14}}>
                {/* Cover */}
                <div style={{width:56,height:56,borderRadius:12,background:BG_COLORS[i%6],display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,flexShrink:0,overflow:'hidden'}}>
                  🎤
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
                    <div>
                      <div style={{fontWeight:700,fontSize:14,marginBottom:2}}>{r.title||'Duet_'+(r.tracks?.title||'Son')+'_'+(user?.username||'moi')}</div>
                      <div style={{fontSize:12,color:'var(--text3)'}}>
                        🎵 {r.tracks?.title||'Son original'} · 🕐 {r.duration?Math.floor(r.duration)+'s':'--'} · 📅 {new Date(r.created_at).toLocaleDateString('fr')}
                        <button onClick={async(e)=>{e.stopPropagation();const newStatus=r.status==='public'?'private':'public';try{await fetch(API_URL+'/api/karaoke/recordings/'+r.id,{method:'PATCH',headers:{'Content-Type':'application/json','Authorization':'Bearer '+getToken()},body:JSON.stringify({status:newStatus})});setMyRecordings(recs=>recs.map(x=>x.id===r.id?{...x,status:newStatus}:x))}catch(e){}}} style={{marginLeft:8,padding:'2px 10px',borderRadius:10,fontSize:10,fontWeight:700,border:'1px solid '+(r.status==='public'?'var(--green)':'var(--border)'),background:r.status==='public'?'rgba(44,198,83,.12)':'rgba(255,255,255,.05)',color:r.status==='public'?'var(--green)':'var(--text3)',cursor:'pointer'}}>{r.status==='public'?'📢 Public':'🔒 Prive'}</button>
                      </div>
                    </div>
                  )}
                  {/* Audio player */}
                  <audio src={r.audio_url} controls style={{width:'100%',height:32,borderRadius:16,marginTop:8}}/>
                </div>

                {/* Actions */}
                {editingId!==r.id&&(
                  <div style={{display:'flex',flexDirection:'column',gap:4,flexShrink:0}}>
                    <button onClick={()=>{setEditingId(r.id);setEditTitle(r.title||'Duet_'+(r.tracks?.title||'Son')+'_'+(user?.username||'moi'))}} title="Renommer" style={{width:32,height:32,borderRadius:8,border:'1px solid var(--border)',background:'var(--card)',cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text2)'}}>✏️</button>
                    {confirmDelete===r.id?(
                      <div style={{display:'flex',gap:4}}>
                        <button onClick={()=>deleteRecording(r.id)} style={{padding:'4px 8px',borderRadius:6,border:'none',background:'var(--red)',color:'#fff',fontSize:10,fontWeight:700,cursor:'pointer'}}>Oui</button>
                        <button onClick={()=>setConfirmDelete(null)} style={{padding:'4px 8px',borderRadius:6,border:'1px solid var(--border)',background:'var(--card)',color:'var(--text3)',fontSize:10,cursor:'pointer'}}>Non</button>
                      </div>
                    ):(
                      <button onClick={()=>setConfirmDelete(r.id)} title="Supprimer" style={{width:32,height:32,borderRadius:8,border:'1px solid var(--border)',background:'var(--card)',cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text3)'}}>🗑️</button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>:<div style={{textAlign:'center',padding:40,color:'var(--text3)'}}><div style={{fontSize:48,marginBottom:12}}>🎤</div>Aucun enregistrement. Choisissez un son et commencez !</div>}
        </div>
      )}

      {/* TRACKS GRID */}
      {!tab.includes("Mes enregistrements")&&(
        <div>
          <div className="section-hdr"><div className="section-title">🎵 Sons disponibles ({filtered.length})</div></div>
          {loading?<div style={{textAlign:'center',padding:40,color:'var(--text3)'}}>Chargement...</div>:
          filtered.length?<div className="karaoke-grid">
            {filtered.map((t,i)=>(
              <div key={t.id||i} className="karaoke-card" onClick={()=>setStudio(t)}>
                <div className="karaoke-cover" style={{background:t.bg||BG_COLORS[i%6]}}>
                  {t.cover_url?<img src={t.cover_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover',opacity:.7}}/>:<span style={{fontSize:40}}>{t.emoji||'🎵'}</span>}
                  <div className="karaoke-cover-badge">{t.diff||"Moyen"}</div>
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
          </div>:<div style={{textAlign:'center',padding:40,color:'var(--text3)'}}>Aucun son dans cette categorie</div>}
        </div>
      )}

      {/* PUBLIC DUETS */}
      {tab.includes("Duets publics")&&(
        <div>
          <div className="section-hdr"><div className="section-title">🌍 Duets de la communaute ({publicDuets.length})</div></div>
          {publicDuets.length?<div style={{display:'flex',flexDirection:'column',gap:12}}>
            {publicDuets.map((r,i)=>(
              <div key={r.id} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:16,display:'flex',alignItems:'center',gap:14}}>
                <div style={{width:48,height:48,borderRadius:'50%',background:BG_COLORS[i%6],display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0,color:'#fff'}}>
                  {r.profiles?.avatar_url?<img src={r.profiles.avatar_url} style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}} alt=""/>:(r.profiles?.display_name?.[0]||'🎤')}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:14}}>{r.title||'Duet'}</div>
                  <div style={{fontSize:12,color:'var(--text3)'}}>
                    par {r.profiles?.display_name||'Artiste'} · 🎵 {r.tracks?.title||'Son'} · {r.duration?Math.floor(r.duration)+'s':''}
                  </div>
                  <audio src={r.audio_url} controls style={{width:'100%',height:32,borderRadius:16,marginTop:6}}/>
                </div>
              </div>
            ))}
          </div>:<div style={{textAlign:'center',padding:40,color:'var(--text3)'}}><div style={{fontSize:48,marginBottom:12}}>🌍</div>Aucun duet public pour le moment</div>}
        </div>
      )}

      {studio&&<StudioModal track={studio} allTracks={tracks} user={user} onClose={()=>setStudio(null)} onSaved={()=>{loadData();setStudio(null)}}/>}
    </div>
  )
}

// ═══════════════════════════════════════
// STUDIO MODAL
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
    // Start instrumental immediately during countdown
    const audioUrl=track.instrumental_url||track.audio_url||track.audio_url_320||track.audio_url_128
    if(audioUrl){
      instrRef.current=new Audio(audioUrl)
      instrRef.current.volume=muteOriginalVoice?instrVol/200:instrVol/100
      instrRef.current.play().catch(e=>console.log('Play error:',e))
      instrRef.current.pause()
      instrRef.current.currentTime=0
    }
    setPhase('countdown');setCountdown(3)
    let c=3
    const ci=setInterval(()=>{
      c--;setCountdown(c)
      if(c<=0){clearInterval(ci);startRecording()}
    },1000)
  }

  const startRecording=async()=>{
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true,sampleRate:44100}})

      // Play instrumental (preloaded during countdown)
      if(instrRef.current){
        instrRef.current.currentTime=0
        instrRef.current.volume=muteOriginalVoice?instrVol/200:instrVol/100
        instrRef.current.play().then(()=>console.log('Instrumental playing')).catch(e=>console.log('Play failed:',e))
        instrRef.current.onended=()=>{stopRecording()}
      }else{
        const audioUrl=track.instrumental_url||track.audio_url||track.audio_url_320||track.audio_url_128
        if(audioUrl){
          instrRef.current=new Audio(audioUrl)
          instrRef.current.volume=muteOriginalVoice?instrVol/200:instrVol/100
          instrRef.current.play().catch(e=>console.log('Play failed:',e))
          instrRef.current.onended=()=>{stopRecording()}
        }
      }

      // Record voice
      const mr=new MediaRecorder(stream,{mimeType:MediaRecorder.isTypeSupported('audio/webm;codecs=opus')?'audio/webm;codecs=opus':'audio/webm',audioBitsPerSecond:128000})
      mediaRef.current=mr
      chunksRef.current=[]
      mr.ondataavailable=e=>chunksRef.current.push(e.data)
      mr.onstop=()=>{
        stream.getTracks().forEach(t=>t.stop())
        const blob=new Blob(chunksRef.current,{type:'audio/webm'})
        setVoiceBlob(blob)
        setVoiceUrl(URL.createObjectURL(blob))
        setPhase('review')
      }
      mr.start()
      setPhase('recording');setTime(0)
      timerRef.current=setInterval(()=>setTime(t=>t+1),1000)

      // Visualize
      try{
        const ctx=new AudioContext()
        audioCtxRef.current=ctx
        const src=ctx.createMediaStreamSource(stream)
        const analyser=ctx.createAnalyser()
        analyser.fftSize=64
        src.connect(analyser)
        analyserRef.current=analyser
        visualize()
      }catch(e){}
    }catch(e){alert('Microphone non disponible');setPhase('ready')}
  }

  const visualize=()=>{
    if(!analyserRef.current)return
    const data=new Uint8Array(analyserRef.current.frequencyBinCount)
    const draw=()=>{
      if(!analyserRef.current)return
      analyserRef.current.getByteFrequencyData(data)
      setWaveData(Array.from({length:40},(_,i)=>Math.max(3,data[Math.floor(i*data.length/40)]/3)))
      animRef.current=requestAnimationFrame(draw)
    }
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

  // Review playback: both tracks
  const playReview=()=>{
    if(isPlaying){
      instrRef.current?.pause()
      voiceAudioRef.current?.pause()
      setIsPlaying(false)
      return
    }
    const audioUrl=track.instrumental_url||track.audio_url||track.audio_url_320||track.audio_url_128
    if(audioUrl){
      instrRef.current=new Audio(audioUrl)
      instrRef.current.volume=muteOriginalVoice?instrVol/200:instrVol/100
      instrRef.current.play().catch(()=>{})
      instrRef.current.onended=()=>setIsPlaying(false)
    }
    if(voiceUrl){
      voiceAudioRef.current=new Audio(voiceUrl)
      voiceAudioRef.current.volume=voiceVol/100
      voiceAudioRef.current.play().catch(()=>{})
    }
    setIsPlaying(true)
  }

  useEffect(()=>{
    if(instrRef.current)instrRef.current.volume=muteOriginalVoice?instrVol/200:instrVol/100
  },[instrVol,muteOriginalVoice])
  useEffect(()=>{
    if(voiceAudioRef.current)voiceAudioRef.current.volume=voiceVol/100
  },[voiceVol])

  const mixAndSave=async(publish=false)=>{
    if(!voiceBlob)return
    setSaving(true);setMixing(true)
    try{
      // 1. Upload voice first
      const form=new FormData()
      form.append('file',voiceBlob,'duet_voice_'+Date.now()+'.webm')
      const upRes=await fetch(API_URL+'/api/upload/cover',{method:'POST',headers:{'Authorization':'Bearer '+getToken()},body:form})
      const upData=await upRes.json()
      if(!upData.url){setSaving(false);setMixing(false);alert('Erreur upload');return}
      
      // 2. Mix on server with FFmpeg
      const trackUrl=track.instrumental_url||track.audio_url||track.audio_url_320||track.audio_url_128
      const mixRes=await fetch(API_URL+'/api/karaoke/mix',{
        method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+getToken()},
        body:JSON.stringify({voice_url:upData.url,track_url:trackUrl,voice_vol:voiceVol,instr_vol:instrVol,mute_voice:muteOriginalVoice})
      })
      const mixData=await mixRes.json()
      setMixing(false)
      
      if(mixData.mix_url){
        setMixUrl(mixData.mix_url)
        // 3. Save the mixed recording
        await fetch(API_URL+'/api/karaoke/recordings',{
          method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+getToken()},
          body:JSON.stringify({track_id:track.id,audio_url:mixData.mix_url,duration:time,status:publish?'public':'private',title:duetTitle})
        })
        alert(publish?'Duet mixe et publie !':'Duet mixe et sauvegarde !')
        onSaved()
      }else{
        console.error('Mix error:',mixData);alert('Erreur mixage: '+(mixData.error||'inconnue')+'\nLa voix seule sera sauvegardee');await fetch(API_URL+'/api/karaoke/recordings',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+getToken()},body:JSON.stringify({track_id:track.id,audio_url:upData.url,duration:time,status:publish?'public':'private',title:duetTitle})});onSaved()
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

        {/* Track picker or info */}
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
                    <div style={{fontSize:11,color:'var(--text3)'}}>{t.artist} · {fmtK(t.plays)} plays</div>
                  </div>
                </div>
              ))}
              {filteredTracks.length===0&&<div style={{padding:20,textAlign:'center',color:'var(--text3)',fontSize:12}}>Aucun son trouve</div>}
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
            {phase==='recording'?'🔴 REC':phase==='review'?'✅ TERMINE':phase==='countdown'?'⏳':'🎵 PRET'}
          </div>
          {phase==='ready'&&<button onClick={()=>setShowPicker(true)} style={{padding:'4px 10px',borderRadius:8,border:'1px solid var(--border)',background:'var(--card)',color:'var(--text3)',fontSize:11,cursor:'pointer'}}>Changer</button>}
        </div>
        )}

        {track&&<>{/* MIXING CONTROLS */}
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
          {phase==='ready'&&<div style={{marginTop:10,fontSize:11,color:'var(--text3)',background:'rgba(245,166,35,.08)',padding:'8px 12px',borderRadius:8}}>🎧 Utilisez des ecouteurs pour que le micro ne capte pas l'instrumental !</div>}
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
          {phase==='ready'&&(
            <button onClick={startSession} style={{width:72,height:72,borderRadius:'50%',border:'none',background:'var(--red)',color:'#fff',fontSize:28,cursor:'pointer',boxShadow:'0 4px 24px rgba(230,57,70,.4)',display:'flex',alignItems:'center',justifyContent:'center',transition:'transform .15s'}} onMouseEnter={e=>e.currentTarget.style.transform='scale(1.1)'} onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}>
              🎤
            </button>
          )}
          {phase==='countdown'&&(
            <div style={{width:72,height:72,borderRadius:'50%',background:'var(--card)',border:'3px solid var(--gold)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:32,fontWeight:800,color:'var(--gold)',animation:'pulse-glow 1s infinite'}}>
              {countdown}
            </div>
          )}
          {phase==='recording'&&(
            <button onClick={stopRecording} style={{width:72,height:72,borderRadius:'50%',border:'none',background:'var(--red)',color:'#fff',fontSize:24,cursor:'pointer',boxShadow:'0 4px 24px rgba(230,57,70,.4)',display:'flex',alignItems:'center',justifyContent:'center',animation:'pulse-glow 1.2s infinite'}}>
              ⏹
            </button>
          )}
          {phase==='review'&&(
            <>
              <button onClick={reset} title="Recommencer" style={{width:48,height:48,borderRadius:'50%',border:'1px solid var(--border)',background:'var(--card)',color:'var(--text2)',fontSize:20,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>🔄</button>
              <button onClick={playReview} style={{width:64,height:64,borderRadius:'50%',border:isPlaying?'2px solid var(--border)':'none',background:isPlaying?'var(--card)':'var(--gold)',color:isPlaying?'var(--text)':'#000',fontSize:22,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:isPlaying?'none':'0 4px 20px rgba(245,166,35,.3)'}}>
                {isPlaying?'⏸':'▶'}
              </button>
            </>
          )}
        </div>

        {/* Review: Title + Save/Publish */}
        {phase==='review'&&(
          <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',padding:16}}>
            <div style={{fontSize:12,fontWeight:700,color:'var(--text2)',marginBottom:10}}>🎵 Votre Duet</div>

            {/* Title */}
            <div style={{marginBottom:12}}>
              <label style={{fontSize:11,color:'var(--text3)',display:'block',marginBottom:4}}>Nom du Duet</label>
              <input value={duetTitle} onChange={e=>setDuetTitle(e.target.value)} style={{width:'100%',padding:'8px 12px',borderRadius:8,border:'1px solid var(--border)',background:'var(--bg2)',color:'var(--text)',fontSize:13,outline:'none',boxSizing:'border-box'}} placeholder="Ex: Duet_Moina_monpseudo"/>
            </div>

            {/* Listen hint */}
            <div style={{textAlign:'center',fontSize:12,color:'var(--text3)',marginBottom:12}}>
              Appuyez ▶ pour ecouter le mix. Ajustez les volumes 🎚️ ci-dessus.
            </div>

            {/* Save buttons */}
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

        {/* Instructions */}
        {phase==='ready'&&(
          <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',padding:14}}>
            <div style={{fontSize:13,fontWeight:700,marginBottom:8}}>🎤 Comment ca marche</div>
            <div style={{fontSize:12,color:'var(--text2)',lineHeight:2}}>
              1. Reglez le volume du son original et de votre voix<br/>
              2. Mettez vos ecouteurs 🎧<br/>
              3. Appuyez sur 🎤 — compte a rebours 3...2...1<br/>
              4. Le son joue, chantez par-dessus !<br/>
              5. Appuyez ⏹ pour arreter<br/>
              6. Ecoutez le mix ▶ → Nommez → Publiez 📢
            </div>
          </div>
        )}
        </>}
      </div>
    </div>
  )
}
