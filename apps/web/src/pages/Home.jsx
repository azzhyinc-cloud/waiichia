import { useState, useEffect } from "react"
import { useAuthStore, usePlayerStore, usePageStore } from "../stores/index.js"
import api from "../services/api.js"
import { ReactionBar } from "../components/ReactionBar.jsx"
import BuyModal from "../components/BuyModal.jsx"
import RentModal from "../components/RentModal.jsx"

const fmt=n=>n?(typeof n==='string'?n:n.toLocaleString()):'0'
const fmtStat=n=>{if(!n||n===0)return'0';if(n>=1000000)return(n/1000000).toFixed(1)+'M';if(n>=1000)return(n/1000).toFixed(1)+'K';return String(n)}
const BGS=['linear-gradient(135deg,#0d2a3a,#1a5060)','linear-gradient(135deg,#1a0a2e,#3a1a6a)','linear-gradient(135deg,#002a10,#007040)','linear-gradient(135deg,#2e1a00,#7a4000)','linear-gradient(135deg,#1a0a2e,#4a1a7a)','linear-gradient(135deg,#001a2e,#005080)','linear-gradient(135deg,#0a1e2e,#1060a0)','linear-gradient(135deg,#1a0020,#5a0060)']
const EMOJIS=['🎵','🌊','🎶','🔥','💡','🎤','🌙','🎹']
const ALBUMS=[
  {id:'a1',title:'Ocean de Komori',artist:'Kolo Officiel',emoji:'🌊',bg:BGS[0],tracks:12,year:2026,country:'🇰🇲'},
  {id:'a2',title:'Lagos Dreams',artist:'Wally Afro',emoji:'🌟',bg:BGS[3],tracks:16,year:2026,country:'🇳🇬'},
  {id:'a3',title:'Îles en fête',artist:'Various Artists',emoji:'🎉',bg:BGS[7],tracks:20,year:2026,country:'🇰🇲'},
  {id:'a4',title:'Sebene Forever',artist:'Masasi Band',emoji:'🥁',bg:BGS[2],tracks:14,year:2025,country:'🇨🇩'},
]
const CREATORS=[
  {id:'c1',name:'Kolo Officiel',handle:'kolo_komori',type:'Artiste',ava:'KO',bg:'linear-gradient(135deg,#f5a623,#e63946)',fans:'48.2K',verified:true,country:'🇰🇲'},
  {id:'c2',name:'Radio Komori FM',handle:'komori_fm',type:'Média',ava:'RF',bg:'linear-gradient(135deg,#4d9fff,#9b59f5)',fans:'120K',verified:true,country:'🇰🇲'},
  {id:'c3',name:'DJ Chami',handle:'djchami',type:'Artiste Pro',ava:'DC',bg:'linear-gradient(135deg,#9b59f5,#6c3483)',fans:'32K',verified:true,country:'🇰🇲'},
  {id:'c4',name:'Coach Amina',handle:'amina_mindset',type:'Pro / Coach',ava:'CA',bg:'linear-gradient(135deg,#2dc653,#00bfa5)',fans:'18.4K',verified:false,country:'🇸🇳'},
  {id:'c5',name:'Afro Beats LBL',handle:'afrobeats_lbl',type:'Label',ava:'AB',bg:'linear-gradient(135deg,#ff6b35,#f5a623)',fans:'512K',verified:true,country:'🇳🇬'},
  {id:'c6',name:'Wassila',handle:'wassila_km',type:'Artiste',ava:'WA',bg:'linear-gradient(135deg,#e63946,#c1121f)',fans:'14K',verified:false,country:'🇰🇲'},
]
const EVENTS=[
  {id:'ev1',title:'Nuit Twarab Moroni',date:'22',month:'Mar',emoji:'🌊',location:'Moroni, Comores',country:'🇰🇲',price:'5 000 KMF',bg:BGS[0],cat:'Concert',boost:true},
  {id:'ev2',title:'Festival de la Musique KM',date:'01',month:'Avr',emoji:'🎪',location:'Anjouan, Comores',country:'🇰🇲',price:'Gratuit',bg:BGS[4],cat:'Festival',boost:false},
  {id:'ev3',title:'Afrobeats Night Lagos',date:'15',month:'Avr',emoji:'🌟',location:'Lagos, Nigeria',country:'🇳🇬',price:'5 000 NGN',bg:BGS[3],cat:'Concert',boost:true},
  {id:'ev4',title:'Waiichia Live — Moroni',date:'14',month:'Juin',emoji:'🎵',location:'Stade Moroni',country:'🇰🇲',price:'10 000 KMF',bg:BGS[6],cat:'Concert',boost:true},
]
const RADIOS=[
  {id:'r1',name:'Radio Komori FM',station:'Moroni · Twarab & Varié',emoji:'📻',bg:BGS[0],listeners:'1 420',country:'🇰🇲'},
  {id:'r2',name:'Bambao FM',station:'Anjouan · Actualités',emoji:'🎙️',bg:BGS[4],listeners:'842',country:'🇰🇲'},
  {id:'r3',name:'Pulse FM CI',station:'Abidjan · Afrobeats',emoji:'🎵',bg:'linear-gradient(135deg,#f5a623,#e63946)',listeners:'4 218',country:'🇨🇮'},
]
const GENRES=['Tout','🎵 Twarab','🥁 Sebene','🌊 Afrobeats','🎶 Amapiano','🔥 Slam','🌿 Traditionnel','🕌 Gospel / Religion','💡 Mindset','💼 Business','📚 Éducation']

export default function Home() {
  const {user}=useAuthStore()
  const {toggle}=usePlayerStore()
  const {setPage}=usePageStore()
  const [tracks,setTracks]=useState([])
  const [genre,setGenre]=useState('Tout')
  const [loading,setLoading]=useState(true)
  const [stats,setStats]=useState({tracks_count:0,creators_count:0,total_plays:0,countries_count:0})
  const [toast,setToast]=useState('')
  const [buyTrack,setBuyTrack]=useState(null)
  const [rentTrack,setRentTrack]=useState(null)
  const showToast=msg=>{setToast(msg);setTimeout(()=>setToast(''),3000)}
  const goProfile=username=>setPage('profile',{profileUsername:username})
  const doFollow=async(username,name)=>{if(!user){setPage('login');return};try{await api.profiles.follow(username);showToast('✅ Vous suivez '+name)}catch(e){showToast('Connectez-vous pour suivre')}}
  const openBuy=t=>{if(!user){setPage('login');return};setBuyTrack(t)}
  const openRent=t=>{if(!user){setPage('login');return};setRentTrack(t)}

  useEffect(()=>{
    Promise.all([
      api.profiles.stats().catch(()=>({tracks_count:0,creators_count:0,total_plays:0,countries_count:0})),
      api.tracks.list('?limit=8').catch(()=>({tracks:[]})),
    ]).then(([s,t])=>{
      setStats(s)
      if(t?.tracks?.length){setTracks(t.tracks.map((tr,i)=>({...tr,bg:BGS[i%8],emoji:EMOJIS[i%8]})))}
    }).finally(()=>setLoading(false))
  },[])

  const displayTracks=genre==='Tout'?tracks.slice(0,4):tracks.filter(t=>t.genre?.includes(genre.replace(/^[^ ]+ /,''))).slice(0,4)

  return(
    <div style={{padding:'0 0 80px'}}>
      {toast&&<div style={{position:'fixed',top:20,left:'50%',transform:'translateX(-50%)',background:'var(--gold)',color:'#000',padding:'10px 24px',borderRadius:'var(--radius-sm)',fontWeight:700,fontSize:13,zIndex:9999,boxShadow:'0 4px 20px rgba(0,0,0,.3)'}}>{toast}</div>}

      {/* MODALES ACHAT / LOCATION */}
      {buyTrack&&<BuyModal track={buyTrack} mode="buy" onClose={()=>setBuyTrack(null)} onSuccess={()=>{showToast('✅ Achat confirmé !');setBuyTrack(null)}}/>}
      {rentTrack&&<RentModal track={rentTrack} onClose={()=>setRentTrack(null)} onSuccess={()=>{showToast('✅ Location activée !');setRentTrack(null)}}/>}

      {/* HERO */}
      <div className="hero-banner">
        <div className="hero-kente-deco"/><div className="hero-kente-deco2"/>
        <div className="hero-content">
          <div className="hero-badge">🌍 Lancé aux Comores · L&apos;audio social africain</div>
          <div className="hero-title">Stream. Connect.<br/><span>Vibrate Africa.</span></div>
          <div className="hero-sub">Musique, Podcasts, Émissions et Radio Live. Découvrez et supportez les talents africains — de Moroni à Lagos.</div>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={()=>{if(tracks[0])toggle(tracks[0])}}>🎧 Écouter</button>
            <button className="btn btn-secondary" onClick={()=>setPage('upload')}>🎙️ Créer</button>
            {!user&&<>
              <button className="btn btn-outline" onClick={()=>setPage('login')}>🔑 Connexion</button>
              <button className="btn btn-outline" style={{borderColor:'var(--gold)',color:'var(--gold)'}} onClick={()=>setPage('register')}>✨ Créer un compte</button>
            </>}
          </div>
        </div>
      </div>

      {/* STATS RÉELLES */}
      <div className="stats-row">
        <div className="stat-card sc-gold"><div className="stat-icon">🎵</div><div className="stat-num">{fmtStat(stats.tracks_count)}</div><div className="stat-label">Sons publiés</div></div>
        <div className="stat-card sc-red"><div className="stat-icon">🎨</div><div className="stat-num">{fmtStat(stats.creators_count)}</div><div className="stat-label">Créateurs</div></div>
        <div className="stat-card sc-green"><div className="stat-icon">👥</div><div className="stat-num">{fmtStat(stats.total_plays)}</div><div className="stat-label">Écoutes</div></div>
        <div className="stat-card sc-blue"><div className="stat-icon">🌍</div><div className="stat-num">{stats.countries_count||0}</div><div className="stat-label">Pays</div></div>
      </div>

      {/* GENRES */}
      <div className="genre-chips">{GENRES.map(g=><div key={g} className={`genre-chip${genre===g?' active':''}`} onClick={()=>setGenre(g)}>{g}</div>)}</div>

      {/* TENDANCES — Vrais tracks depuis Supabase */}
      <div className="section-hdr"><div className="section-title">🔥 Tendances</div><span className="see-all" onClick={()=>setPage('trending')}>Voir tout →</span></div>
      <div className="tracks-grid" style={{gridTemplateColumns:'repeat(2,1fr)'}}>
        {displayTracks.map(t=><TrackCard key={t.id} track={t} onPlay={()=>toggle(t)} onBuy={()=>openBuy(t)} onRent={()=>openRent(t)}/>)}
        {!displayTracks.length&&!loading&&<div style={{gridColumn:'1/-1',textAlign:'center',padding:40,color:'var(--text3)'}}>Aucun son dans ce genre</div>}
      </div>

      {/* RADIO LIVE — Clic = lecture directe dans le Player */}
      <div className="live-section">
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:4}}>
          <div className="live-pulse-badge">🔴 LIVE</div>
          <div className="section-title" style={{fontSize:17}}>Radios &amp; Émissions Live</div>
          <span className="see-all" style={{marginLeft:'auto'}} onClick={()=>setPage('radio')}>Voir tout →</span>
        </div>
        <div className="live-streams-grid">
          {RADIOS.map(r=><LiveCard key={r.id} radio={r} onListen={()=>{
            toggle({id:'radio_'+r.id,title:r.name,artist:r.station,type:'radio',bg:r.bg,emoji:r.emoji,is_live:true})
            showToast('📻 '+r.name+' — En direct')
          }}/>)}
        </div>
      </div>

      {/* ALBUMS */}
      <div className="section-hdr"><div className="section-title">💿 Albums récents</div><span className="see-all" onClick={()=>setPage('albums')}>Voir tout →</span></div>
      <div className="tracks-grid" style={{gridTemplateColumns:'repeat(2,1fr)'}}>
        {ALBUMS.slice(0,4).map(a=><AlbumCard key={a.id} album={a} onClick={()=>setPage('albums')}/>)}
      </div>

      {/* CRÉATEURS — Clic = profil du créateur */}
      <div className="section-hdr"><div className="section-title">⭐ Créateurs en Vue</div><span className="see-all" onClick={()=>setPage('creators')}>Voir tout →</span></div>
      <div className="creator-scroll">
        {CREATORS.map(c=><CreatorCard key={c.id} c={c} onProfile={()=>goProfile(c.handle)} onFollow={()=>doFollow(c.handle,c.name)}/>)}
      </div>

      {/* ÉVÉNEMENTS */}
      <div className="section-hdr"><div className="section-title">🎪 Événements</div><span className="see-all" onClick={()=>setPage('events')}>Voir tout →</span></div>
      <div className="events-grid">
        {EVENTS.map(ev=><EventCard key={ev.id} ev={ev} onClick={()=>setPage('events')} onBook={()=>{if(!user){setPage('login');return};showToast(ev.price==='Gratuit'?'✅ Inscrit à '+ev.title:'🎫 Réservation — Connectez votre Wallet')}}/>)}
      </div>
    </div>
  )
}

/* ══ COMPOSANTS ══ */
function TrackCard({track,onPlay,onBuy,onRent}){
  const [hov,setHov]=useState(false)
  const isFree=track.access_type==='free'
  const hasRent=track.rent_price_day||track.rent_price_week||track.rent_price_month||track.rent_price
  const sP=track.sale_price?track.sale_price.toLocaleString()+' KMF':'—'
  return(
    <div className={`track-card${hov?' card-hover':''}`} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}>
      <div onClick={onPlay} style={{cursor:'pointer'}}>
        <div className="track-cover">
          <div className="track-cover-bg" style={{background:track.bg}}>{track.cover_url?<img src={track.cover_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:(track.emoji||'🎵')}</div>
          <div className={`type-badge ${track.type==='podcast'?'type-podcast':track.type==='emission'?'type-emission':'type-music'}`}>{track.genre||'MUSIQUE'}</div>
          <div className="play-overlay"><button className="play-btn-circle">▶</button></div>
        </div>
        <div className="track-info">
          <div className="track-title">{track.title}</div>
          <div className="track-artist">{track.profiles?.display_name||track.artist||'Artiste'}</div>
          <div className="track-meta"><span>{fmt(track.play_count||track.plays)} 🎧</span></div>
        </div>
      </div>
      <div className="track-purchase-row" onClick={e=>e.stopPropagation()}>
        {isFree
          ?<span className="free-chip">✓ Gratuit · Accès libre</span>
          :<>
            {track.sale_price>0&&<button className="buy-chip buy-chip-buy" onClick={onBuy}>🛒 Acheter <span className="price-tag">{sP}</span></button>}
            {(hasRent||track.sale_price>0)&&<button className="buy-chip buy-chip-rent" onClick={onRent}>⏳ Louer</button>}
          </>
        }
      </div>
      <ReactionBar targetType="track" targetId={track.id} showComments={true}/>
    </div>
  )
}
function AlbumCard({album,onClick}){return(<div className="album-card" onClick={onClick} style={{cursor:'pointer'}}><div className="album-cover"><div className="album-cover-bg" style={{background:album.bg}}>{album.emoji}</div><div className="type-badge type-album">ALBUM</div><div className="play-overlay"><button className="play-btn-circle">▶</button></div></div><div className="album-info"><div className="album-title">{album.title}</div><div className="album-meta"><span>{album.artist}</span><span>{album.tracks} titres</span><span>{album.country} {album.year}</span></div></div></div>)}
function CreatorCard({c,onProfile,onFollow}){return(<div className="creator-card" onClick={onProfile} style={{cursor:'pointer'}}><div className="creator-ava" style={{background:c.bg}}>{c.ava}</div><div className="creator-name">{c.name} {c.verified&&<span style={{color:'var(--gold)',fontSize:12}}>✓</span>}</div><div className="creator-type">{c.type} {c.country}</div><div className="creator-fans">{c.fans} fans</div><button className="follow-btn" style={{marginTop:10}} onClick={e=>{e.stopPropagation();onFollow()}}>+ Suivre</button></div>)}
function LiveCard({radio,onListen}){return(<div className="live-card" style={{cursor:'pointer'}} onClick={onListen}><div style={{display:'flex',alignItems:'center',gap:12}}><div style={{width:48,height:48,borderRadius:12,background:radio.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>{radio.emoji}</div><div style={{flex:1,minWidth:0}}><div style={{fontWeight:700,fontSize:13.5,marginBottom:2}}>{radio.name}</div><div style={{fontSize:11.5,color:'var(--text2)'}}>{radio.station}</div></div><div style={{textAlign:'right',flexShrink:0}}><div style={{fontSize:10,fontFamily:"Space Mono,monospace",color:'var(--red)',fontWeight:700}}>🔴 LIVE</div><div style={{fontSize:10,color:'var(--text3)',fontFamily:"Space Mono,monospace"}}>{radio.listeners} 👥</div></div></div><button className="btn btn-sm" style={{marginTop:12,width:'100%',padding:'7px',fontSize:12,background:'rgba(230,57,70,.12)',border:'1px solid rgba(230,57,70,.25)',borderRadius:'var(--radius-sm)',cursor:'pointer',color:'var(--red)',fontWeight:700,fontFamily:"Plus Jakarta Sans,sans-serif"}}>🎧 Écouter en direct</button></div>)}
function EventCard({ev,onBook,onClick}){const isFree=ev.price==='Gratuit';return(<div className="event-card" style={{cursor:'pointer'}} onClick={onClick}><div className="event-date-box" style={{background:ev.bg}}><span className="event-day">{ev.date}</span><span className="event-month">{ev.month}</span></div><div className="event-info"><div className="event-title">{ev.emoji} {ev.title} {ev.boost&&<span style={{fontSize:9,background:'var(--gold)',color:'#000',borderRadius:20,padding:'2px 7px',fontFamily:"Space Mono,monospace",fontWeight:700,marginLeft:4}}>BOOST</span>}</div><div className="event-meta"><span>📍 {ev.location} {ev.country}</span><span className="event-cat">{ev.cat}</span></div><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:8}}><span style={{fontFamily:"Space Mono,monospace",fontSize:12,fontWeight:700,color:isFree?'var(--green)':'var(--gold)'}}>{ev.price}</span><button className="btn btn-sm" onClick={e=>{e.stopPropagation();onBook()}} style={{padding:'5px 14px',fontSize:11,background:isFree?'var(--green)':'linear-gradient(135deg,var(--gold),#e8920a)',border:'none',borderRadius:50,cursor:'pointer',color:'#000',fontWeight:700,fontFamily:"Plus Jakarta Sans,sans-serif"}}>{isFree?"✓ S'inscrire":'🎫 Réserver'}</button></div></div></div>)}
