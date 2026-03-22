import { useState, useEffect, useRef } from "react"
import { useAuthStore } from "../stores/index.js"
import api from "../services/api.js"

const API_URL=import.meta.env.VITE_API_URL||''
const getToken=()=>localStorage.getItem('waiichia_token')
const TABS=["🎵 Tous","🌊 Twarab","🥁 Afrobeats","🎶 Amapiano","🎤 Mes enregistrements"]
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
        plays:t.play_count||0,audio_url:t.audio_url_320||t.audio_url_128||t.audio_hls_url,cover_url:t.cover_url,
        allow_karaoke:t.is_karaoke!==false
      }))
      setTracks([...karaokeT,...platformT].filter(t=>t.audio_url||t.audio_url_320||t.audio_url_128))
      if(user){
        const mr=await fetch(API_URL+'/api/karaoke/recordings/my',{headers:{'Authorization':'Bearer '+getToken()}}).then(r=>r.json()).catch(()=>({recordings:[]}))
        setMyRecordings(mr.recordings||[])
      }
    }catch(e){}
    setLoading(false)
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
          <button className="btn btn-primary" onClick={()=>filtered[0]&&setStudio(filtered[0])}>🎤 Commencer</button>
        </div>
      </div>

      <div className="tabs-bar" style={{marginBottom:20}}>
        {TABS.map(t=><button key={t} className={"tab-btn"+(tab===t?" active":"")} onClick={()=>setTab(t)}>{t}</button>)}
      </div>

      {tab.includes("Mes enregistrements")&&(
        <div>
          <div className="section-hdr"><div className="section-title">🎤 Mes enregistrements</div></div>
          {myRecordings.length?<div className="karaoke-grid">
            {myRecordings.map((r,i)=>(
              <div key={r.id} className="karaoke-card">
                <div className="karaoke-cover" style={{background:BG_COLORS[i%6]}}><span style={{fontSize:40}}>🎤</span></div>
                <div className="karaoke-info">
                  <div className="karaoke-name">{r.tracks?.title||'Enregistrement'}</div>
                  <div className="karaoke-meta"><span>🕐 {r.duration?Math.floor(r.duration)+'s':'--'}</span><span>📅 {new Date(r.created_at).toLocaleDateString('fr')}</span></div>
                  <audio src={r.audio_url} controls style={{width:'100%',height:32,borderRadius:16,marginTop:8}}/>
                </div>
              </div>
            ))}
          </div>:<div style={{textAlign:'center',padding:40,color:'var(--text3)'}}><div style={{fontSize:48,marginBottom:12}}>🎤</div>Aucun enregistrement</div>}
        </div>
      )}

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

      {studio&&<StudioModal track={studio} user={user} onClose={()=>setStudio(null)} onSaved={()=>{loadData();setStudio(null)}}/>}
    </div>
  )
}

function StudioModal({track,user,onClose,onSaved}){
  const [phase,setPhase]=useState('ready')
  const [time,setTime]=useState(0)
  const [countdown,setCountdown]=useState(3)
  const [voiceBlob,setVoiceBlob]=useState(null)
  const [voiceUrl,setVoiceUrl]=useState(null)
  const [saving,setSaving]=useState(false)
  const [instrVol,setInstrVol]=useState(70)
  const [voiceVol,setVoiceVol]=useState(100)
  const [muteOriginal,setMuteOriginal]=useState(false)
  const [waveData,setWaveData]=useState(new Array(40).fill(5))
  const [isPlaying,setIsPlaying]=useState(false)

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
  }

  const startSession=()=>{
    setPhase('countdown');setCountdown(3)
    let c=3
    const ci=setInterval(()=>{
      c--; setCountdown(c)
      if(c<=0){clearInterval(ci);startRecording()}
    },1000)
  }

  const startRecording=async()=>{
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true,sampleRate:44100}})

      // Play instrumental
      const audioUrl=track.instrumental_url||track.audio_url||track.audio_url_320||track.audio_url_128||track.audio_url_320||track.audio_url_128
      if(audioUrl){
        instrRef.current=new Audio(audioUrl)
        instrRef.current.volume=muteOriginal?0:instrVol/100
        instrRef.current.play().catch(()=>{})
        instrRef.current.onended=()=>{stopRecording()}
      }

      // Record voice only
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

      // Visualize voice
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

  const reset=()=>{stopAll();setPhase('ready');setTime(0);setVoiceBlob(null);setVoiceUrl(null);setWaveData(new Array(40).fill(5));setIsPlaying(false)}

  // Review: play both tracks simultaneously
  const playReview=()=>{
    if(isPlaying){
      instrRef.current?.pause()
      voiceAudioRef.current?.pause()
      setIsPlaying(false)
      return
    }
    const audioUrl=track.instrumental_url||track.audio_url
    if(audioUrl){
      instrRef.current=new Audio(audioUrl)
      instrRef.current.volume=muteOriginal?0:instrVol/100
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

  // Update volumes in real-time
  useEffect(()=>{
    if(instrRef.current)instrRef.current.volume=muteOriginal?0:instrVol/100
  },[instrVol,muteOriginal])
  useEffect(()=>{
    if(voiceAudioRef.current)voiceAudioRef.current.volume=voiceVol/100
  },[voiceVol])

  const saveRecording=async(publish=false)=>{
    if(!voiceBlob)return
    setSaving(true)
    try{
      const form=new FormData()
      form.append('file',voiceBlob,'karaoke_'+Date.now()+'.webm')
      const res=await fetch(API_URL+'/api/upload/cover',{method:'POST',headers:{'Authorization':'Bearer '+getToken()},body:form})
      const data=await res.json()
      if(data.url){
        await fetch(API_URL+'/api/karaoke/recordings',{
          method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+getToken()},
          body:JSON.stringify({track_id:track.id,audio_url:data.url,duration:time,status:publish?'public':'private'})
        })
        alert(publish?'Enregistrement publie !':'Enregistrement sauvegarde !')
        onSaved()
      }
    }catch(e){alert('Erreur: '+e.message)}
    setSaving(false)
  }

  const fmtTime=s=>Math.floor(s/60)+':'+String(s%60).padStart(2,'0')

  return(
    <div className="modal-overlay" onClick={()=>{stopAll();onClose()}}>
      <div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:600}}>
        <div className="modal-hdr">
          <div className="modal-title">🎤 Duet Studio</div>
          <button className="modal-close" onClick={()=>{stopAll();onClose()}}>✕</button>
        </div>

        {/* Track info */}
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
        </div>

        {/* Volume controls - visible during recording and review */}
        {(phase==='recording'||phase==='review'||phase==='ready')&&(
          <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',padding:14,marginBottom:16}}>
            <div style={{fontSize:12,fontWeight:700,marginBottom:10,color:'var(--text2)'}}>🎚️ Mixage</div>
            <div style={{display:'flex',gap:16}}>
              <div style={{flex:1}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                  <span style={{fontSize:11,color:'var(--text3)'}}>🎵 Instrumental</span>
                  <span style={{fontSize:11,fontFamily:'Space Mono,monospace',color:'var(--gold)'}}>{instrVol}%</span>
                </div>
                <input type="range" min="0" max="100" value={instrVol} onChange={e=>setInstrVol(parseInt(e.target.value))} style={{width:'100%',accentColor:'var(--gold)'}}/>
                <label style={{display:'flex',alignItems:'center',gap:6,marginTop:6,cursor:'pointer',fontSize:11,color:'var(--text3)'}}>
                  <input type="checkbox" checked={muteOriginal} onChange={e=>setMuteOriginal(e.target.checked)} style={{accentColor:'var(--red)'}}/>
                  🔇 Couper la voix originale
                </label>
              </div>
              <div style={{flex:1}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                  <span style={{fontSize:11,color:'var(--text3)'}}>🎤 Ma voix</span>
                  <span style={{fontSize:11,fontFamily:'Space Mono,monospace',color:'var(--purple)'}}>{voiceVol}%</span>
                </div>
                <input type="range" min="0" max="100" value={voiceVol} onChange={e=>setVoiceVol(parseInt(e.target.value))} style={{width:'100%',accentColor:'var(--purple)'}}/>
              </div>
            </div>
          </div>
        )}

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
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:16,marginBottom:20}}>
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
              <button onClick={playReview} style={{width:64,height:64,borderRadius:'50%',border:'none',background:isPlaying?'var(--card)':'var(--gold)',color:isPlaying?'var(--text)':'#000',fontSize:22,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:isPlaying?'none':'0 4px 20px rgba(245,166,35,.3)',border:isPlaying?'2px solid var(--border)':'none'}}>
                {isPlaying?'⏸':'▶'}
              </button>
              <button onClick={()=>saveRecording(false)} disabled={saving} style={{padding:'10px 20px',borderRadius:50,border:'1px solid var(--border)',background:'var(--card)',color:'var(--text)',fontSize:13,fontWeight:700,cursor:'pointer'}}>
                {saving?'⏳':'💾 Garder'}
              </button>
              <button onClick={()=>saveRecording(true)} disabled={saving} style={{padding:'10px 20px',borderRadius:50,border:'none',background:'linear-gradient(135deg,var(--gold),#e8920a)',color:'#000',fontSize:13,fontWeight:700,cursor:'pointer',boxShadow:'0 4px 16px rgba(245,166,35,.3)'}}>
                {saving?'⏳':'📢 Publier'}
              </button>
            </>
          )}
        </div>

        {/* Review info */}
        {phase==='review'&&(
          <div style={{textAlign:'center',fontSize:12,color:'var(--text3)',marginBottom:12}}>
            Appuyez ▶ pour ecouter le mix (instrumental + voix). Ajustez les volumes ci-dessus.
          </div>
        )}

        {/* Instructions */}
        {phase==='ready'&&(
          <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',padding:14}}>
            <div style={{fontSize:13,fontWeight:700,marginBottom:8}}>🎤 Comment ca marche</div>
            <div style={{fontSize:12,color:'var(--text2)',lineHeight:2}}>
              1. 🎧 Utilisez des ecouteurs pour un meilleur resultat !<br/>
              2. Cochez "Couper la voix originale" pour chanter seul(e)<br/>
              3. Appuyez sur 🎤 — compte a rebours 3...2...1<br/>
              4. L'instrumental joue, chantez par-dessus !<br/>
              5. Appuyez ⏹ pour arreter<br/>
              6. Ecoutez le mix ▶ puis Publiez 📢
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
