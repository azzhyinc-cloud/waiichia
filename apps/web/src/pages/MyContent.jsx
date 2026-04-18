import { useState, useEffect } from "react"
import { useAuthStore, useDeviseStore, usePageStore, usePlayerStore } from "../stores/index.js"
import BuyModal from "../components/BuyModal.jsx"
import AddToPlaylistModal from "../components/AddToPlaylistModal.jsx"
import api from "../services/api.js"

const TABS = [
  {id:"sons",      label:"🎵 Sons"},
  {id:"podcasts",  label:"🎙️ Podcasts"},
  {id:"albums",    label:"💿 Albums"},
  {id:"playlists", label:"📋 Playlists"},
  {id:"emissions", label:"📺 Émissions"},
  {id:"regie",     label:"📢 Régie Pub"},
]
const STATUTS = ["Tous les statuts","Publié","Brouillon","Archivé"]
const BGS = ["linear-gradient(135deg,#1a6fcc,#4d9fff)","linear-gradient(135deg,#9b59f5,#6d3db5)","linear-gradient(135deg,#f5a623,#e63946)","linear-gradient(135deg,#2dc653,#0a9e4a)","linear-gradient(135deg,#ff6b35,#cc4411)","linear-gradient(135deg,#00b4d8,#0077b6)"]
const EMOJIS = ["🌊","🌆","🏝️","🗺️","🌙","🎛️"]
const fmtK = n=>n>=1000000?(n/1000000).toFixed(1)+"M":n>=1000?(n/1000).toFixed(1)+"K":String(n||0)
const fmtDur = s=>{if(!s)return'';const m=Math.floor(s/60);return m>=60?Math.floor(m/60)+'h'+String(m%60).padStart(2,'0'):m+'min'}

const API_URL = import.meta.env.VITE_API_URL
function authFetch(path) {
  const token = localStorage.getItem('waiichia_token')
  return fetch(`${API_URL}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
}

function SBadge({s}){
  const m={Publié:{bg:"rgba(44,198,83,.15)",c:"#2dc653"},Brouillon:{bg:"rgba(245,166,35,.15)",c:"#f5a623"},Archivé:{bg:"rgba(140,140,140,.15)",c:"#888"}}
  const x=m[s]||{bg:"rgba(140,140,140,.1)",c:"#888"}
  return <span style={{padding:"3px 9px",borderRadius:50,fontSize:10,fontWeight:700,background:x.bg,color:x.c}}>{s}</span>
}

// ── Carte son/podcast avec bouton ➕ playlist ───────────────────────────────
function TrackCard({t, isPlaying, onPlay, onBuy, onPlaylist, dc, idx}) {
  const [hov, setHov] = useState(false)
  const isPaid = t.access_type==="paid" && t.sale_price>0
  return(
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{background:"var(--card)",border:`1px solid ${hov?"rgba(245,166,35,.4)":"var(--border)"}`,borderRadius:"var(--radius)",overflow:"hidden",cursor:"pointer",transition:"all .25s",transform:hov?"translateY(-5px)":"none",boxShadow:hov?"0 16px 40px rgba(0,0,0,.4)":"none"}}>
      <div style={{width:"100%",aspectRatio:"1",position:"relative",overflow:"hidden"}} onClick={onPlay}>
        <div style={{width:"100%",height:"100%",background:BGS[idx%6],display:"flex",alignItems:"center",justifyContent:"center",fontSize:44}}>
          {t.cover_url?<img src={t.cover_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:EMOJIS[idx%6]||"🎵"}
        </div>
        <div style={{position:"absolute",top:10,right:10,padding:"3px 8px",borderRadius:6,fontSize:9,fontWeight:800,background:"rgba(0,0,0,.6)",backdropFilter:"blur(8px)",color:"#fff",letterSpacing:.8}}>{t.genre||"MUSIC"}</div>
        <div style={{position:"absolute",top:10,left:10}}><SBadge s={t.is_published===false?"Brouillon":"Publié"}/></div>
        <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.35)",display:"flex",alignItems:"center",justifyContent:"center",opacity:hov||isPlaying?1:0,transition:"opacity .2s"}}>
          <button style={{width:52,height:52,borderRadius:"50%",background:"var(--gold)",border:"none",cursor:"pointer",fontSize:20,boxShadow:"0 4px 16px rgba(245,166,35,.5)"}}>{isPlaying?"⏸":"▶"}</button>
        </div>
      </div>
      <div style={{padding:"10px 14px 6px"}}>
        <div style={{fontWeight:700,fontSize:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:3}}>{t.title}</div>
        <div style={{fontSize:12,color:"var(--text2)",marginBottom:8}}>{t.profiles?.display_name||"Moi"}</div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:6}}>
          <span style={{fontSize:12,color:"var(--text3)"}}>{fmtK(t.play_count)} 🎧</span>
          <div style={{display:'flex',gap:4,alignItems:'center'}}>
            {isPaid
              ?<button onClick={e=>{e.stopPropagation();onBuy(t)}} style={{padding:"3px 8px",borderRadius:50,border:"none",background:"linear-gradient(135deg,var(--gold),#e8920a)",color:"#000",fontSize:11,fontWeight:700,cursor:"pointer"}}>{t.sale_price?.toLocaleString()} {dc}</button>
              :<span style={{fontSize:11,color:"#2dc653",fontWeight:600}}>🆓</span>}
            {/* ── Bouton ajouter à une playlist ── */}
            <button onClick={e=>{e.stopPropagation();onPlaylist(t)}}
              title="Ajouter à une playlist"
              style={{padding:"3px 8px",borderRadius:50,border:"1px solid var(--border)",background:"var(--card2)",color:"var(--text2)",fontSize:12,cursor:"pointer",transition:"all .15s"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--gold)';e.currentTarget.style.color='var(--gold)'}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text2)'}}>
              ➕
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyTab({icon,title,desc,action,onAction}){
  return(
    <div style={{textAlign:"center",padding:60,color:"var(--text3)"}}>
      <div style={{fontSize:48,marginBottom:12}}>{icon}</div>
      <div style={{fontFamily:"Syne,sans-serif",fontSize:16,fontWeight:700,marginBottom:6,color:"var(--text)"}}>{title}</div>
      <div style={{fontSize:13,marginBottom:16}}>{desc}</div>
      {action&&<button onClick={onAction} style={{padding:"9px 24px",borderRadius:50,border:"none",background:"var(--gold)",color:"#000",fontSize:13,fontWeight:700,cursor:"pointer"}}>{action}</button>}
    </div>
  )
}

// ── Modal Playlist inline ────────────────────────────────────────────────────
function PlaylistDetailModal({playlist, onClose}) {
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(true)
  const {play, setQueue, currentTrack, isPlaying} = usePlayerStore()

  useEffect(() => {
    if (!playlist?.id) return
    authFetch(`/api/albums/playlists/${playlist.id}`)
      .then(r=>r.json())
      .then(d=>setTracks(d.tracks||d.playlist?.tracks||[]))
      .catch(()=>{})
      .finally(()=>setLoading(false))
  }, [playlist])

  function playAll() {
    if (!tracks.length) return
    setQueue(tracks); play(tracks[0]); onClose()
  }

  return(
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.65)',zIndex:400,display:'flex',alignItems:'center',justifyContent:'center',padding:16,backdropFilter:'blur(4px)'}}>
      <div onClick={e=>e.stopPropagation()} style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius)',width:'100%',maxWidth:500,maxHeight:'80vh',display:'flex',flexDirection:'column',boxShadow:'0 24px 64px rgba(0,0,0,.5)',overflow:'hidden'}}>
        <div style={{padding:'18px 20px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
          <div style={{fontFamily:'Syne,sans-serif',fontSize:17,fontWeight:800}}>🎵 {playlist.title}</div>
          <div onClick={onClose} style={{width:28,height:28,borderRadius:'50%',background:'var(--card)',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:13}}>✕</div>
        </div>
        <div style={{overflowY:'auto',flex:1,padding:'12px 16px'}}>
          {playlist.description && <p style={{fontSize:12,color:'var(--text2)',marginBottom:12}}>{playlist.description}</p>}
          {loading
            ? <div style={{textAlign:'center',padding:30,color:'var(--text3)'}}>⏳ Chargement…</div>
            : tracks.length===0
              ? <div style={{textAlign:'center',padding:30,color:'var(--text3)',fontSize:13}}>Aucun son dans cette playlist.</div>
              : <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  {tracks.map((t,i)=>{
                    const isCur = currentTrack?.id===t.id
                    return(
                      <div key={t.id} onClick={()=>{setQueue(tracks);play(t);onClose()}}
                        style={{display:'flex',alignItems:'center',gap:10,padding:'8px 10px',borderRadius:'var(--radius-sm)',background:isCur?'rgba(245,166,35,.08)':'var(--card)',cursor:'pointer',border:`1px solid ${isCur?'var(--gold)':'var(--border)'}`,transition:'all .15s'}}
                        onMouseEnter={e=>{if(!isCur)e.currentTarget.style.borderColor='var(--gold)'}}
                        onMouseLeave={e=>{if(!isCur)e.currentTarget.style.borderColor='var(--border)'}}>
                        <span style={{fontSize:11,color:isCur?'var(--gold)':'var(--text3)',fontFamily:'Space Mono,monospace',width:18,flexShrink:0}}>{isCur&&isPlaying?'▶':i+1}</span>
                        {t.cover_url?<img src={t.cover_url} alt="" style={{width:36,height:36,borderRadius:6,objectFit:'cover',flexShrink:0}}/>:<div style={{width:36,height:36,borderRadius:6,background:'var(--card2)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>🎵</div>}
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:13,fontWeight:600,color:isCur?'var(--gold)':'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</div>
                          <div style={{fontSize:11,color:'var(--text3)'}}>{t.creator?.display_name||t.profiles?.display_name||'—'}</div>
                        </div>
                        <span style={{fontSize:14,color:'var(--gold)',flexShrink:0}}>{isCur&&isPlaying?'⏸':'▶'}</span>
                      </div>
                    )
                  })}
                </div>
          }
        </div>
        {tracks.length>0&&(
          <div style={{padding:'12px 16px',borderTop:'1px solid var(--border)',flexShrink:0}}>
            <button onClick={playAll} style={{width:'100%',padding:'10px',borderRadius:50,border:'none',background:'linear-gradient(135deg,var(--gold),#e8920a)',color:'#000',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'Plus Jakarta Sans,sans-serif'}}>
              ▶ Tout écouter ({tracks.length} sons)
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Modal Émission inline ────────────────────────────────────────────────────
function EmissionDetailModal({emission:em, onClose}) {
  const [episodes, setEpisodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [playlistEp, setPlaylistEp] = useState(null)
  const {toggle, currentTrack, isPlaying} = usePlayerStore()
  const {setPage} = usePageStore()
  const host = em?.profiles || {}

  useEffect(() => {
    if (!em?.id) return
    api.emissions.episodes(em.id)
      .then(d=>setEpisodes(d.episodes||[]))
      .catch(()=>{})
      .finally(()=>setLoading(false))
  }, [em?.id])

  function playEp(ep) {
    if (!ep.mp3_url) return
    toggle({id:ep.id,title:ep.title,audio_url_128:ep.mp3_url,cover_url:em.cover_url||null,profiles:host.display_name?host:{display_name:em.host||'Animateur'},type:'emission'})
  }

  return(
    <>
      <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.7)',zIndex:400,display:'flex',alignItems:'center',justifyContent:'center',padding:20,backdropFilter:'blur(4px)'}}>
        <div onClick={e=>e.stopPropagation()} style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius)',maxWidth:520,width:'100%',maxHeight:'82vh',overflow:'auto',boxShadow:'0 20px 60px rgba(0,0,0,.5)'}}>
          {em.cover_url&&<div style={{height:160,overflow:'hidden',borderRadius:'var(--radius) var(--radius) 0 0'}}><img src={em.cover_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/></div>}
          <div style={{padding:20}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
              <div>
                <div style={{fontSize:18,fontWeight:800,fontFamily:'Syne,sans-serif',marginBottom:4}}>📺 {em.title}</div>
                {em.channel&&<div style={{fontSize:12,color:'var(--text3)'}}>{em.channel}</div>}
              </div>
              <button onClick={onClose} style={{width:30,height:30,borderRadius:'50%',border:'1px solid var(--border)',background:'var(--card)',color:'var(--text3)',fontSize:14,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>✕</button>
            </div>
            {em.description&&<div style={{fontSize:13,color:'var(--text2)',lineHeight:1.6,marginBottom:14,padding:12,background:'var(--card)',borderRadius:'var(--radius-sm)',border:'1px solid var(--border)'}}>{em.description}</div>}
            {(host.username||em.host)&&(
              <div onClick={()=>{if(host.username){onClose();setPage('profile',{profileUsername:host.username})}}}
                style={{display:'flex',alignItems:'center',gap:10,marginBottom:16,padding:10,background:'var(--card)',borderRadius:'var(--radius-sm)',border:'1px solid var(--border)',cursor:host.username?'pointer':'default'}}>
                <div style={{width:30,height:30,borderRadius:'50%',background:'linear-gradient(135deg,var(--gold),#e8920a)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#000',overflow:'hidden'}}>
                  {host.avatar_url?<img src={host.avatar_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:(host.display_name||em.host||'?')[0]}
                </div>
                <div><div style={{fontSize:12,fontWeight:600}}>{host.display_name||em.host}</div><div style={{fontSize:10,color:'var(--text3)'}}>Animateur</div></div>
              </div>
            )}
            <div style={{fontSize:14,fontWeight:700,marginBottom:10}}>🎧 Épisodes</div>
            {loading
              ?<div style={{textAlign:'center',padding:20,color:'var(--text3)',fontSize:12}}>Chargement...</div>
              :episodes.length===0
                ?<div style={{textAlign:'center',padding:20,color:'var(--text3)',fontSize:12,background:'var(--card)',borderRadius:'var(--radius-sm)',border:'1px solid var(--border)'}}>Aucun épisode pour le moment</div>
                :<div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {episodes.map((ep,i)=>{
                    const playing=isPlaying&&currentTrack?.id===ep.id
                    const hasAudio=!!ep.mp3_url
                    return(
                      <div key={ep.id}
                        style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',background:playing?'rgba(245,166,35,.08)':'var(--card)',borderRadius:'var(--radius-sm)',border:`1px solid ${playing?'var(--gold)':'var(--border)'}`,cursor:hasAudio?'pointer':'default',opacity:hasAudio?1:.6,transition:'border-color .2s'}}
                        onMouseEnter={e=>{if(hasAudio)e.currentTarget.style.borderColor='rgba(245,166,35,.3)'}}
                        onMouseLeave={e=>{e.currentTarget.style.borderColor=playing?'var(--gold)':'var(--border)'}}
                        onClick={()=>playEp(ep)}>
                        <div style={{width:34,height:34,borderRadius:8,background:playing?'var(--gold)':BGS[i%6],flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,color:playing?'#000':'#fff',fontWeight:700}}>
                          {playing?'⏸':(ep.number||(i+1))}
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:13,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:playing?'var(--gold)':'var(--text)'}}>{ep.title}</div>
                          <div style={{fontSize:11,color:'var(--text3)',marginTop:2}}>
                            {ep.duration>0&&<span>{fmtDur(ep.duration)} · </span>}
                            {ep.air_date&&<span>{new Date(ep.air_date).toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}</span>}
                          </div>
                        </div>
                        <div style={{display:'flex',alignItems:'center',gap:6,flexShrink:0}}>
                          {hasAudio&&(
                            <button onClick={e=>{e.stopPropagation();setPlaylistEp({id:ep.id,title:ep.title,audio_url_128:ep.mp3_url,cover_url:em.cover_url||null,type:'emission'})}}
                              title="Ajouter à une playlist"
                              style={{padding:'3px 7px',borderRadius:50,border:'1px solid var(--border)',background:'var(--card2)',color:'var(--text2)',fontSize:11,cursor:'pointer'}}
                              onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--gold)';e.currentTarget.style.color='var(--gold)'}}
                              onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text2)'}}>➕</button>
                          )}
                          {hasAudio
                            ?<span style={{fontSize:15,color:playing?'var(--gold)':'var(--text2)'}}>{playing?'⏸':'▶'}</span>
                            :<span style={{fontSize:10,color:'var(--text3)',fontFamily:'Space Mono,monospace'}}>Bientôt</span>
                          }
                        </div>
                      </div>
                    )
                  })}
                </div>
            }
          </div>
        </div>
      </div>
      <AddToPlaylistModal isOpen={!!playlistEp} onClose={()=>setPlaylistEp(null)} track={playlistEp}/>
    </>
  )
}

// ── Onglet Playlists avec modal inline ──────────────────────────────────────
function TabPlaylists() {
  const [playlists, setPlaylists] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    authFetch('/api/albums/playlists/public?mine=true')
      .then(r=>r.json())
      .then(d=>setPlaylists(d.playlists||[]))
      .catch(()=>{})
      .finally(()=>setLoading(false))
  }, [])

  if (loading) return <div style={{textAlign:'center',padding:40,color:'var(--text3)'}}>⏳ Chargement…</div>

  if (playlists.length===0) return (
    <EmptyTab icon="📋" title="Aucune playlist" desc="Créez des playlists pour organiser vos sons favoris."/>
  )

  return(
    <>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:16}}>
        {playlists.map((pl,i)=>(
          <div key={pl.id} onClick={()=>setSelected(pl)}
            style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',overflow:'hidden',cursor:'pointer',transition:'all .2s'}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--gold)';e.currentTarget.style.transform='translateY(-3px)'}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.transform='none'}}>
            <div style={{height:110,background:BGS[i%6],display:'flex',alignItems:'center',justifyContent:'center',fontSize:34,position:'relative',overflow:'hidden'}}>
              {pl.cover_url?<img src={pl.cover_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:'🎵'}
              <div style={{position:'absolute',top:6,right:6,fontSize:10,background:'rgba(0,0,0,.6)',borderRadius:20,padding:'2px 6px'}}>{pl.is_public?'🌍':'🔒'}</div>
            </div>
            <div style={{padding:'10px 12px'}}>
              <div style={{fontWeight:700,fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{pl.title}</div>
              <div style={{fontSize:11,color:'var(--text3)',marginTop:3}}>{pl.tracks_count||0} son{pl.tracks_count!==1?'s':''}</div>
            </div>
          </div>
        ))}
      </div>
      {selected&&<PlaylistDetailModal playlist={selected} onClose={()=>setSelected(null)}/>}
    </>
  )
}

// ── Onglet Émissions avec modal inline ──────────────────────────────────────
function TabEmissions({user}) {
  const [emissions, setEmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    if (!user) return
    api.emissions.list(`?user_id=${user.id}&limit=20`)
      .then(d=>setEmissions(d.emissions||[]))
      .catch(()=>{})
      .finally(()=>setLoading(false))
  }, [user])

  if (loading) return <div style={{textAlign:'center',padding:40,color:'var(--text3)'}}>⏳ Chargement…</div>
  if (emissions.length===0) return <EmptyTab icon="📺" title="Aucune émission" desc="Vos émissions publiées apparaîtront ici."/>

  return(
    <>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:16}}>
        {emissions.map((em,i)=>(
          <div key={em.id} onClick={()=>setSelected(em)}
            style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',overflow:'hidden',cursor:'pointer',transition:'all .2s'}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(77,159,255,.4)';e.currentTarget.style.transform='translateY(-3px)'}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.transform='none'}}>
            <div style={{height:120,background:BGS[i%6],display:'flex',alignItems:'center',justifyContent:'center',fontSize:36,position:'relative',overflow:'hidden'}}>
              {em.cover_url?<img src={em.cover_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:'📺'}
              <div style={{position:'absolute',top:8,left:8,padding:'2px 7px',borderRadius:4,fontSize:9,fontWeight:800,background:'rgba(0,0,0,.6)',color:'#4d9fff',fontFamily:'Space Mono,monospace'}}>
                {em.category?.toUpperCase()||'ÉMISSION'}
              </div>
            </div>
            <div style={{padding:'10px 12px'}}>
              <div style={{fontWeight:700,fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:3}}>{em.title}</div>
              <div style={{fontSize:11,color:'var(--text3)'}}>{em.host||'—'}</div>
              <div style={{marginTop:4}}><SBadge s={em.status==='published'?'Publié':'Brouillon'}/></div>
            </div>
          </div>
        ))}
      </div>
      {selected&&<EmissionDetailModal emission={selected} onClose={()=>setSelected(null)}/>}
    </>
  )
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function MyContent(){
  const {user}=useAuthStore()
  const {devise}=useDeviseStore()
  const {setPage}=usePageStore()
  const {toggle,currentTrack,isPlaying}=usePlayerStore()
  const dc=devise?.code||"KMF"
  const [tab,setTab]=useState("sons")
  const [statut,setStatut]=useState("Tous les statuts")
  const [sons,setSons]=useState([])
  const [loading,setLoading]=useState(true)
  const [buyModal,setBuyModal]=useState(null)
  const [playlistModal,setPlaylistModal]=useState(null)

  useEffect(()=>{
    if(!user)return
    api.tracks.myTracks()
      .then(d=>setSons(d.tracks||[]))
      .catch(()=>setSons([]))
      .finally(()=>setLoading(false))
  },[user])

  if(!user)return(<div style={{textAlign:"center",padding:80}}><div style={{fontSize:48,marginBottom:12}}>🔒</div><div style={{fontFamily:"Syne,sans-serif",fontSize:18,fontWeight:800,marginBottom:8}}>Connectez-vous</div><button onClick={()=>setPage("login")} style={{padding:"9px 24px",borderRadius:50,border:"none",background:"var(--gold)",color:"#000",fontWeight:700,cursor:"pointer"}}>Se connecter</button></div>)

  const mySons     = sons.filter(s=>s.type==='music'||!s.type)
  const myPodcasts = sons.filter(s=>s.type==='podcast')

  const applyStatut=(list)=>list.filter(s=>{
    if(statut==="Tous les statuts")return true
    if(statut==="Publié")return s.is_published!==false
    if(statut==="Brouillon")return s.is_published===false
    return true
  })

  return(
    <div style={{paddingBottom:40}}>
      {buyModal&&<BuyModal track={buyModal} mode="buy" onClose={()=>setBuyModal(null)}/>}
      <AddToPlaylistModal isOpen={!!playlistModal} onClose={()=>setPlaylistModal(null)} track={playlistModal}/>

      <div style={{fontFamily:"Syne,sans-serif",fontSize:22,fontWeight:800,marginBottom:20}}>📚 Mon Contenu</div>

      {/* TABS */}
      <div style={{display:"flex",gap:2,borderBottom:"1px solid var(--border)",marginBottom:20,overflowX:"auto"}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{padding:"9px 14px",border:"none",background:"none",cursor:"pointer",fontSize:12,fontWeight:600,
              whiteSpace:"nowrap",color:tab===t.id?"var(--gold)":"var(--text2)",
              borderBottom:tab===t.id?"2px solid var(--gold)":"2px solid transparent",marginBottom:-1}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ACTIONS */}
      {(tab==='sons'||tab==='podcasts'||tab==='albums')&&(
        <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginBottom:20}}>
          <button onClick={()=>setPage("upload")} style={{padding:"8px 20px",borderRadius:50,border:"none",background:"linear-gradient(135deg,var(--gold),#e8920a)",color:"#000",fontSize:13,fontWeight:700,cursor:"pointer"}}>+ Ajouter</button>
          <select value={statut} onChange={e=>setStatut(e.target.value)} style={{padding:"7px 14px",borderRadius:50,border:"1px solid var(--border)",background:"var(--card)",color:"var(--text)",fontSize:12,cursor:"pointer",outline:"none"}}>
            {STATUTS.map(s=><option key={s}>{s}</option>)}
          </select>
        </div>
      )}

      {/* SONS */}
      {tab==="sons"&&(loading
        ?<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:16}}>{[...Array(6)].map((_,i)=><div key={i} style={{height:280,background:"var(--card)",borderRadius:"var(--radius)",border:"1px solid var(--border)",animation:"shimmer 1.5s infinite"}}/>)}</div>
        :applyStatut(mySons).length===0
          ?<EmptyTab icon="🎵" title="Aucun son" desc="Publiez votre premier son pour le voir apparaître ici." action="Publier mon premier son" onAction={()=>setPage("upload")}/>
          :<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:16}}>
            {applyStatut(mySons).map((t,i)=><TrackCard key={t.id} t={t} idx={i} dc={dc} isPlaying={isPlaying&&currentTrack?.id===t.id} onPlay={()=>toggle(t)} onBuy={()=>setBuyModal(t)} onPlaylist={()=>setPlaylistModal(t)}/>)}
          </div>)}

      {/* PODCASTS */}
      {tab==="podcasts"&&(loading
        ?<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:16}}>{[...Array(4)].map((_,i)=><div key={i} style={{height:280,background:"var(--card)",borderRadius:"var(--radius)",border:"1px solid var(--border)",animation:"shimmer 1.5s infinite"}}/>)}</div>
        :applyStatut(myPodcasts).length===0
          ?<EmptyTab icon="🎙️" title="Aucun podcast" desc="Publiez votre premier podcast." action="Publier un podcast" onAction={()=>setPage("upload")}/>
          :<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:16}}>
            {applyStatut(myPodcasts).map((t,i)=><TrackCard key={t.id} t={t} idx={i} dc={dc} isPlaying={isPlaying&&currentTrack?.id===t.id} onPlay={()=>toggle(t)} onBuy={()=>setBuyModal(t)} onPlaylist={()=>setPlaylistModal(t)}/>)}
          </div>)}

      {/* ALBUMS */}
      {tab==="albums"&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:16}}>
        <div onClick={()=>setPage("upload")} style={{background:"var(--card)",border:"2px dashed var(--border)",borderRadius:"var(--radius)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:200,cursor:"pointer",gap:10}} onMouseEnter={e=>e.currentTarget.style.borderColor="var(--gold)"} onMouseLeave={e=>e.currentTarget.style.borderColor="var(--border)"}><div style={{fontSize:36,opacity:.5}}>+</div><div style={{fontSize:13,color:"var(--text3)"}}>Nouvel album</div></div>
      </div>}

      {/* PLAYLISTS — modal inline */}
      {tab==="playlists"&&<TabPlaylists/>}

      {/* ÉMISSIONS — modal inline */}
      {tab==="emissions"&&<TabEmissions user={user}/>}

      {/* RÉGIE */}
      {tab==="regie"&&<div>
        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:20}}><button onClick={()=>setPage("regie")} style={{padding:"9px 22px",borderRadius:50,border:"none",background:"linear-gradient(135deg,var(--gold),#e8920a)",color:"#000",fontSize:13,fontWeight:700,cursor:"pointer"}}>📢 Nouvelle campagne</button></div>
        <EmptyTab icon="📢" title="Aucune campagne" desc="Créez une campagne publicitaire pour promouvoir vos sons." action="Créer une campagne" onAction={()=>setPage("regie")}/>
      </div>}
    </div>
  )
}
