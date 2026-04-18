import { useState, useEffect } from "react"
import { usePlayerStore, usePageStore } from "../stores/index.js"
import api from "../services/api.js"
// ── AJOUT ──
import AddToPlaylistModal from "../components/AddToPlaylistModal.jsx"

const CATS=['Tout','🎭 Culture','🌱 Jeunesse','🗣️ Société','⚽ Sport','🎵 Musique','💼 Économie','🕌 Religion']
const BGS=["linear-gradient(135deg,#0a1e2e,#1060a0)","linear-gradient(135deg,#1a0a2e,#4a1a7a)","linear-gradient(135deg,#002a10,#007040)","linear-gradient(135deg,#2e1a00,#7a4000)","linear-gradient(135deg,#1a0020,#5a0060)","linear-gradient(135deg,#001a2e,#005080)"]
const fmtK=n=>n>=1000?(n/1000).toFixed(1)+"K":String(n||0)
const fmtDuration=s=>{if(!s)return'';const m=Math.floor(s/60);return m>=60?Math.floor(m/60)+'h'+String(m%60).padStart(2,'0'):m+'min'}

export default function Emission(){
  const {toggle,currentTrack,isPlaying}=usePlayerStore()
  const {setPage}=usePageStore()
  const [cat,setCat]=useState('Tout')
  const [emissions,setEmissions]=useState([])
  const [loading,setLoading]=useState(true)
  const [selected,setSelected]=useState(null)

  useEffect(()=>{
    api.emissions.list('?limit=30')
      .then(d=>setEmissions(d.emissions || []))
      .catch(()=>setEmissions([]))
      .finally(()=>setLoading(false))
  },[])

  const filtered=cat==='Tout'?emissions:emissions.filter(e=>e.category?.toLowerCase().includes(cat.replace(/^[^ ]+ /,'').toLowerCase()))
  const featured=filtered.filter(e=>e.featured)
  const all=filtered

  const goProfile=(username)=>{if(username)setPage('profile',{profileUsername:username})}

  return(
    <div style={{paddingBottom:40}}>
      <div className="page-title">📺 Émissions</div>

      {/* HERO BANNER */}
      <div style={{background:'linear-gradient(135deg,#0a1e2e 0%,#1060a0 60%,#0a2e1e 100%)',borderRadius:'var(--radius)',padding:24,marginBottom:20,position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',right:-10,top:-10,fontSize:100,opacity:.08}}>📺</div>
        <div style={{display:'inline-flex',alignItems:'center',gap:7,background:'rgba(77,159,255,.2)',border:'1px solid rgba(77,159,255,.4)',borderRadius:50,padding:'5px 14px',fontSize:10,fontFamily:'Space Mono,monospace',color:'var(--blue)',letterSpacing:'1.2px',marginBottom:12}}>📺 ÉMISSIONS AFRICAINES</div>
        <div style={{fontFamily:'Syne,sans-serif',fontSize:26,fontWeight:800,lineHeight:1.2,marginBottom:8}}>Programmes & Talk-shows<br/><span style={{background:'linear-gradient(135deg,var(--blue),var(--green))',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>de toute l'Afrique</span></div>
        <div style={{fontSize:13,color:'var(--text2)',maxWidth:420}}>Culture, jeunesse, société, sport — les émissions qui font l'Afrique d'aujourd'hui.</div>
      </div>

      {/* FILTRES */}
      <div className="genre-chips" style={{marginBottom:16}}>
        {CATS.map(c=>(
          <div key={c} className={`genre-chip${cat===c?' active':''}`} onClick={()=>setCat(c)}>{c}</div>
        ))}
      </div>

      {/* EN VEDETTE */}
      {featured.length>0&&<>
        <div className="section-hdr"><div className="section-title">⭐ En vedette</div></div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:14,marginBottom:24}}>
          {featured.map((e,i)=><EmissionCard key={e.id} em={e} bg={BGS[i%6]} onClick={()=>setSelected(e)} featured/>)}
        </div>
      </>}

      {/* TOUTES LES ÉMISSIONS */}
      <div className="section-hdr">
        <div className="section-title">📺 Toutes les émissions</div>
        <span style={{fontSize:12,color:'var(--text2)'}}>{all.length} émission{all.length>1?'s':''}</span>
      </div>
      {loading
        ?<div className="tracks-grid">{[...Array(4)].map((_,i)=><div key={i} style={{height:200,background:'var(--card)',borderRadius:'var(--radius)',border:'1px solid var(--border)',animation:'shimmer 1.5s infinite'}}/>)}</div>
        :all.length>0
          ?<div className="tracks-grid">
            {all.map((e,i)=><EmissionCard key={e.id} em={e} bg={BGS[i%6]} onClick={()=>setSelected(e)}/>)}
          </div>
          :<div style={{textAlign:'center',padding:60,color:'var(--text3)'}}>
            <div style={{fontSize:48,marginBottom:12}}>📺</div>
            <div style={{fontFamily:'Syne,sans-serif',fontSize:16,fontWeight:700,marginBottom:6}}>Aucune émission pour le moment</div>
            <div style={{fontSize:13}}>Les émissions publiées par les créateurs apparaîtront ici.</div>
          </div>
      }

      {/* MODAL EMISSION */}
      {selected&&<EmissionModal emission={selected} onClose={()=>setSelected(null)} goProfile={goProfile} toggle={toggle} currentTrack={currentTrack} isPlaying={isPlaying}/>}
    </div>
  )
}

function EmissionCard({em,bg,featured,onClick}){
  return(
    <div className="track-card" onClick={onClick} style={{cursor:'pointer',transition:'border-color .2s'}}
      onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(245,166,35,.3)'}
      onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
      <div className="track-cover">
        <div className="track-cover-bg" style={{background:bg}}>{em.cover_url?<img src={em.cover_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:"📺"}</div>
        <div className="type-badge type-emission">{em.category?.toUpperCase()||'ÉMISSION'}</div>
        {em.is_new&&<div style={{position:'absolute',top:8,left:8,padding:'3px 9px',borderRadius:20,fontSize:9,fontFamily:'Space Mono,monospace',fontWeight:700,background:'var(--green)',color:'#000'}}>NEW</div>}
        <div className="play-overlay"><button className="play-btn-circle">▶</button></div>
      </div>
      <div className="track-info">
        <div className="track-title">{em.title}</div>
        <div className="track-artist">{em.host||'Présentateur'} · {em.channel||'Chaîne'}</div>
        <div className="track-meta">
          <span>{em.episodes_count||0} épisodes</span>
          <span>🌍 {em.country||'KM'} · {em.language==='km'?'Shikomori':'Français'}</span>
        </div>
      </div>
    </div>
  )
}

function EmissionModal({emission:em,onClose,goProfile,toggle,currentTrack,isPlaying}){
  const [episodes,setEpisodes]=useState([])
  const [loadingEp,setLoadingEp]=useState(true)
  // ── AJOUT : état pour le modal playlist sur un épisode ──
  const [playlistEp,setPlaylistEp]=useState(null)
  const host=em?.profiles||{}

  useEffect(()=>{
    if(!em)return
    setLoadingEp(true)
    api.emissions.episodes(em.id)
      .then(d=>setEpisodes(d.episodes||[]))
      .catch(()=>{})
      .finally(()=>setLoadingEp(false))
  },[em?.id])

  if(!em)return null

  const playEpisode=(ep)=>{
    if(ep.mp3_url){
      toggle({id:ep.id,title:ep.title,audio_url_128:ep.mp3_url,cover_url:em.cover_url||null,profiles:host.display_name?host:{display_name:em.host||'Animateur'},type:'emission'})
    }
  }

  return(
    <>
      <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.7)',zIndex:9000,display:'flex',alignItems:'center',justifyContent:'center',padding:20,backdropFilter:'blur(4px)'}} onClick={onClose}>
        <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius)',maxWidth:520,width:'100%',maxHeight:'80vh',overflow:'auto',boxShadow:'0 20px 60px rgba(0,0,0,.5)'}} onClick={e=>e.stopPropagation()}>
          {em.cover_url&&<div style={{height:180,overflow:'hidden',borderRadius:'var(--radius) var(--radius) 0 0'}}><img src={em.cover_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/></div>}
          <div style={{padding:24}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
              <div>
                <div style={{fontSize:20,fontWeight:800,fontFamily:'Syne,sans-serif',marginBottom:4}}>📻 {em.title}</div>
                {em.channel&&<div style={{fontSize:12,color:'var(--text3)'}}>{em.channel}</div>}
              </div>
              <button onClick={onClose} style={{width:32,height:32,borderRadius:'50%',border:'1px solid var(--border)',background:'var(--card)',color:'var(--text3)',fontSize:14,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>✕</button>
            </div>

            <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:16,fontSize:11}}>
              {em.category&&<span style={{background:'var(--bg2)',padding:'3px 10px',borderRadius:99,border:'1px solid var(--border)',textTransform:'capitalize'}}>{em.category}</span>}
              {em.language&&<span style={{background:'var(--bg2)',padding:'3px 10px',borderRadius:99,border:'1px solid var(--border)'}}>{em.language==='fr'?'🇫🇷 Français':em.language==='km'?'🇰🇲 Shikomori':em.language}</span>}
            </div>

            {em.description&&<div style={{fontSize:13,color:'var(--text2)',lineHeight:1.6,marginBottom:16,padding:14,background:'var(--card)',borderRadius:'var(--radius-sm)',border:'1px solid var(--border)'}}>{em.description}</div>}

            {(host.username||em.host)&&<div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20,padding:10,background:'var(--card)',borderRadius:'var(--radius-sm)',border:'1px solid var(--border)',cursor:host.username?'pointer':'default'}} onClick={()=>{if(host.username){onClose();goProfile(host.username)}}}>
              <div style={{width:32,height:32,borderRadius:'50%',background:'linear-gradient(135deg,var(--gold),#e8920a)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#000',overflow:'hidden'}}>{host.avatar_url?<img src={host.avatar_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:(host.display_name||em.host||'?')[0]}</div>
              <div><div style={{fontSize:12,fontWeight:600}}>{host.display_name||em.host}</div><div style={{fontSize:10,color:'var(--text3)'}}>Animateur</div></div>
            </div>}

            <div style={{fontSize:14,fontWeight:700,marginBottom:10}}>🎧 Épisodes</div>
            {loadingEp
              ?<div style={{textAlign:'center',padding:20,color:'var(--text3)',fontSize:12}}>Chargement...</div>
              :episodes.length===0
                ?<div style={{textAlign:'center',padding:20,color:'var(--text3)',fontSize:12,background:'var(--card)',borderRadius:'var(--radius-sm)',border:'1px solid var(--border)'}}>Aucun épisode pour le moment</div>
                :<div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {episodes.map((ep,i)=>{
                    const playing=isPlaying&&currentTrack?.id===ep.id
                    const hasAudio=!!ep.mp3_url
                    return(
                      <div key={ep.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 12px',background:playing?'rgba(245,166,35,.08)':'var(--card)',borderRadius:'var(--radius-sm)',border:`1px solid ${playing?'var(--gold)':'var(--border)'}`,cursor:hasAudio?'pointer':'default',transition:'border-color .2s',opacity:hasAudio?1:.6}}
                        onMouseEnter={e=>{if(hasAudio)e.currentTarget.style.borderColor='rgba(245,166,35,.3)'}}
                        onMouseLeave={e=>{e.currentTarget.style.borderColor=playing?'var(--gold)':'var(--border)'}}
                        onClick={()=>playEpisode(ep)}>
                        <div style={{width:36,height:36,borderRadius:8,background:playing?'var(--gold)':BGS[i%6],flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,color:playing?'#000':'#fff',fontWeight:700}}>
                          {playing?'⏸':(ep.number||(i+1))}
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:13,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:playing?'var(--gold)':'var(--text)'}}>{ep.title}</div>
                          <div style={{fontSize:11,color:'var(--text3)',display:'flex',gap:8,marginTop:2}}>
                            {ep.duration>0&&<span>{fmtDuration(ep.duration)}</span>}
                            {ep.air_date&&<span>{new Date(ep.air_date).toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}</span>}
                            {ep.play_count>0&&<span>{fmtK(ep.play_count)} écoutes</span>}
                          </div>
                        </div>
                        <div style={{display:'flex',alignItems:'center',gap:6,flexShrink:0}}>
                          {/* ── AJOUT : bouton ➕ playlist sur chaque épisode ── */}
                          {hasAudio&&(
                            <button
                              onClick={e=>{e.stopPropagation();setPlaylistEp({
                                id:ep.id, title:ep.title,
                                audio_url_128:ep.mp3_url,
                                cover_url:em.cover_url||null,
                                type:'emission'
                              })}}
                              title="Ajouter à une playlist"
                              style={{padding:'3px 7px',borderRadius:50,border:'1px solid var(--border)',
                                background:'var(--card2)',color:'var(--text2)',fontSize:12,cursor:'pointer'}}
                              onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--gold)';e.currentTarget.style.color='var(--gold)'}}
                              onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text2)'}}>
                              ➕
                            </button>
                          )}
                          {hasAudio
                            ?<span style={{fontSize:16,color:playing?'var(--gold)':'var(--text2)'}}>{playing?'⏸':'▶'}</span>
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

      {/* ── AJOUT : modal playlist pour épisode ── */}
      <AddToPlaylistModal
        isOpen={!!playlistEp}
        onClose={()=>setPlaylistEp(null)}
        track={playlistEp}
      />
    </>
  )
}
