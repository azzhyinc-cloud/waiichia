import { useState, useEffect, useRef } from "react"
import { useAuthStore } from "../stores/index.js"
import api from "../services/api.js"
import { ReactionBar } from "../components/ReactionBar.jsx"

/* ══ DONNÉES MOCK FIDÈLES AU PROTOTYPE v7.2 ══ */
const rndK = mul => ((Math.floor(Math.random()*9+1)*mul*100)+Math.floor(Math.random()*100)).toLocaleString()
const fmt  = n => n ? (typeof n==='string'?n:n.toLocaleString()) : rndK(5)

const TRACKS = [
  {id:'t1',title:'Twarab ya Komori',artist:'Kolo Officiel ft. Wassila',emoji:'🌊',bg:'linear-gradient(135deg,#0d2a3a,#1a5060)',type:'music',genre:'Twarab',plays:'24.8K',duration:'4:02',access_type:'paid',sale_price:2500,rent_price:500},
  {id:'t2',title:'Moroni by Night',artist:'DJ Chami',emoji:'🌃',bg:'linear-gradient(135deg,#1a0a2e,#3a1a6a)',type:'music',genre:'Afrobeats',plays:'18.2K',duration:'3:48',access_type:'paid',sale_price:2000,rent_price:300},
  {id:'t3',title:'Business Africa Ep.14',artist:'AfriEntrepreneur',emoji:'💡',bg:'linear-gradient(135deg,#1a0a2e,#4a1a7a)',type:'podcast',genre:'Entrepreneuriat',plays:'9.4K',duration:'42:15',access_type:'free'},
  {id:'t4',title:'Slam pour demain',artist:'Poète Issa',emoji:'🔥',bg:'linear-gradient(135deg,#2e1200,#7a3400)',type:'music',genre:'Slam',plays:'7.2K',duration:'3:22',access_type:'paid',sale_price:1500,rent_price:200},
  {id:'t5',title:'Mindset Afrique',artist:'Coach Amina',emoji:'🧠',bg:'linear-gradient(135deg,#002a1a,#007040)',type:'podcast',genre:'Mindset',plays:'15K',duration:'35:00',access_type:'free'},
  {id:'t6',title:'Émission Jeunes Talents',artist:'Radio Komori FM',emoji:'📺',bg:'linear-gradient(135deg,#0a1e2e,#1060a0)',type:'emission',genre:'Culture',plays:'6.1K',duration:'45:00',access_type:'free'},
  {id:'t7',title:"Nuit d'Afrique",artist:'Wally Afro',emoji:'🌙',bg:'linear-gradient(135deg,#1a0a2e,#5a1a7a)',type:'music',genre:'Afrobeats',plays:'12.1K',duration:'3:55',access_type:'paid',sale_price:2000,rent_price:300},
  {id:'t8',title:'Moroni Groove',artist:'DJ Chami',emoji:'🎹',bg:'linear-gradient(135deg,#002a10,#007040)',type:'music',genre:'Amapiano',plays:'9.8K',duration:'4:30',access_type:'paid',sale_price:1800,rent_price:200},
]

const ALBUMS = [
  {id:'a1',title:'Ocean de Komori',artist:'Kolo Officiel',emoji:'🌊',bg:'linear-gradient(135deg,#0d2a3a,#1a5060)',tracks:12,year:2026,country:'🇰🇲',genre:'Twarab'},
  {id:'a2',title:'Lagos Dreams',artist:'Wally Afro',emoji:'🌟',bg:'linear-gradient(135deg,#2e1a00,#7a4000)',tracks:16,year:2026,country:'🇳🇬',genre:'Afrobeats'},
  {id:'a3',title:'Îles en fête',artist:'Various Artists',emoji:'🎉',bg:'linear-gradient(135deg,#1a0020,#5a0060)',tracks:20,year:2026,country:'🇰🇲',genre:'Compilation'},
  {id:'a4',title:'Sebene Forever',artist:'Masasi Band',emoji:'🥁',bg:'linear-gradient(135deg,#002a10,#007030)',tracks:14,year:2025,country:'🇨🇩',genre:'Sebene'},
  {id:'a5',title:'Startup Mindset',artist:'Business Afrika',emoji:'🚀',bg:'linear-gradient(135deg,#001a2e,#005080)',tracks:8,year:2026,country:'🇷🇼',genre:'Podcast'},
  {id:'a6',title:'Gospel Unangu',artist:'Choir Komori',emoji:'🕊️',bg:'linear-gradient(135deg,#1a1800,#504800)',tracks:10,year:2025,country:'🇰🇲',genre:'Gospel'},
]

const CREATORS = [
  {id:'c1',name:'Kolo Officiel',handle:'@kolo_komori',type:'Artiste',ava:'KO',bg:'linear-gradient(135deg,#f5a623,#e63946)',fans:'48.2K',verified:true,country:'🇰🇲'},
  {id:'c2',name:'Radio Komori FM',handle:'@komori_fm',type:'Média',ava:'RF',bg:'linear-gradient(135deg,#4d9fff,#9b59f5)',fans:'120K',verified:true,country:'🇰🇲'},
  {id:'c3',name:'DJ Chami',handle:'@djchami',type:'Artiste Pro',ava:'DC',bg:'linear-gradient(135deg,#9b59f5,#6c3483)',fans:'32K',verified:true,country:'🇰🇲'},
  {id:'c4',name:'Coach Amina',handle:'@amina_mindset',type:'Pro / Coach',ava:'CA',bg:'linear-gradient(135deg,#2dc653,#00bfa5)',fans:'18.4K',verified:false,country:'🇸🇳'},
  {id:'c5',name:'Afro Beats LBL',handle:'@afrobeats_lbl',type:'Label',ava:'AB',bg:'linear-gradient(135deg,#ff6b35,#f5a623)',fans:'512K',verified:true,country:'🇳🇬'},
  {id:'c6',name:'Wassila',handle:'@wassila_km',type:'Artiste',ava:'WA',bg:'linear-gradient(135deg,#e63946,#c1121f)',fans:'14K',verified:false,country:'🇰🇲'},
  {id:'c7',name:'Wally Afro',handle:'@wallyafro',type:'Artiste',ava:'WL',bg:'linear-gradient(135deg,#4d9fff,#9b59f5)',fans:'28.5K',verified:true,country:'🇨🇮'},
  {id:'c8',name:'Nassim B.',handle:'@nassimb_km',type:'Artiste',ava:'NB',bg:'linear-gradient(135deg,#0a1800,#2a5000)',fans:'9.2K',verified:false,country:'🇰🇲'},
]

const EVENTS = [
  {id:'ev1',title:'Nuit Twarab Moroni',date:'22',month:'Mar',emoji:'🌊',location:'Moroni, Comores',country:'🇰🇲',price:'5 000 KMF',bg:'linear-gradient(135deg,#0d2a3a,#1a5060)',cat:'Concert',boost:true},
  {id:'ev2',title:'Festival de la Musique KM',date:'01',month:'Avr',emoji:'🎪',location:'Anjouan, Comores',country:'🇰🇲',price:'Gratuit',bg:'linear-gradient(135deg,#1a0a2e,#4a1a7a)',cat:'Festival',boost:false},
  {id:'ev3',title:'Afrobeats Night Lagos',date:'15',month:'Avr',emoji:'🌟',location:'Lagos, Nigeria',country:'🇳🇬',price:'5 000 NGN',bg:'linear-gradient(135deg,#2e1a00,#7a4000)',cat:'Concert',boost:true},
  {id:'ev4',title:'Waiichia Live — Moroni',date:'14',month:'Juin',emoji:'🎵',location:'Stade Moroni, Comores',country:'🇰🇲',price:'10 000 KMF',bg:'linear-gradient(135deg,#0d1a3a,#1a3070)',cat:'Concert',boost:true},
]

const RADIOS = [
  {id:'r1',name:'Radio Komori FM',station:'Moroni · Twarab & Varié',emoji:'📻',bg:'linear-gradient(135deg,#0d2a3a,#1a5060)',listeners:'1 420',country:'🇰🇲'},
  {id:'r2',name:'Bambao FM',station:'Anjouan · Actualités',emoji:'🎙️',bg:'linear-gradient(135deg,#1a0a2e,#4a1a7a)',listeners:'842',country:'🇰🇲'},
  {id:'r3',name:'Pulse FM CI',station:'Abidjan · Afrobeats',emoji:'🎵',bg:'linear-gradient(135deg,#f5a623,#e63946)',listeners:'4 218',country:'🇨🇮'},
]

const GENRES = ['Tout','🎵 Twarab','🥁 Sebene','🌊 Afrobeats','🎶 Amapiano','🔥 Slam','🌿 Traditionnel','🕌 Gospel / Religion','💡 Mindset','💼 Business','📚 Éducation']

/* ══ TRACK CARD ══ */
function TrackCard({ track, onPlay }) {
  const [hov, setHov]         = useState(false)
  const [liked, setLiked]     = useState(false)
  const [panel, setPanel]     = useState(false)
  const isFree = track.access_type === 'free'
  const sP = track.sale_price ? track.sale_price.toLocaleString()+' KMF' : (Math.floor(Math.random()*8+1)*500).toLocaleString()+' KMF'
  const rP = track.rent_price ? track.rent_price.toLocaleString()+' KMF/j' : (Math.floor(Math.random()*3+1)*100).toLocaleString()+' KMF/j'
  const TYPE_BADGE = {music:'type-music',podcast:'type-podcast',emission:'type-emission',radio:'type-radio',album:'type-album',slam:'type-slam'}
  const TYPE_LABEL = {music:'MUSIQUE',podcast:'PODCAST',emission:'EMISSION',radio:'RADIO',album:'ALBUM'}
  return (
    <div className={`track-card${hov?' card-hover':''}`}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}>
      {/* COVER */}
      <div onClick={onPlay}>
        <div className="track-cover">
          <div className="track-cover-bg" style={{background:track.bg}}>{track.emoji}</div>
          <div className={`type-badge ${TYPE_BADGE[track.type]||'type-music'}`}>{track.genre||TYPE_LABEL[track.type]||'MUSIQUE'}</div>
          <div className="play-overlay"><button className="play-btn-circle">▶</button></div>
        </div>
        {/* INFO */}
        <div className="track-info">
          <div className="track-title">{track.title}</div>
          <div className="track-artist">{track.profiles?.display_name||track.artist||'Artiste'}</div>
          <div className="track-meta">
            <span>{fmt(track.play_count||track.plays)} 🎧</span>
            <div className="track-actions" onClick={e=>e.stopPropagation()}>
              <button className={`icon-btn${liked?' liked':''}`} onClick={()=>setLiked(l=>!l)} title="J'aime">♥</button>
              <button className="icon-btn" onClick={e=>{e.stopPropagation();setPanel(p=>!p)}} title="Commenter">💬</button>
              <button className="icon-btn" title="Partager">📤</button>
              <button className="icon-btn" title="Signaler">🚩</button>
            </div>
          </div>
        </div>
      </div>
      {/* PURCHASE ROW */}
      <div className="track-purchase-row" onClick={e=>e.stopPropagation()}>
        {isFree
          ? <span className="free-chip">✓ Gratuit · Accès libre</span>
          : <>
            <button className="buy-chip buy-chip-buy" onClick={()=>{}}>
              🛒 Acheter <span className="price-tag">{sP}</span>
            </button>
            <button className="buy-chip buy-chip-rent" onClick={()=>{}}>
              ⏳ Louer <span className="price-tag">dès {rP}</span>
            </button>
          </>
        }
      </div>
      {/* REACTION BAR */}
      <ReactionBar
        targetType="track"
        targetId={track.id}
        showComments={true}
        externalPanel={panel}
        onPanelToggle={()=>setPanel(p=>!p)}
      />
    </div>
  )
}

/* ══ ALBUM CARD ══ */
function AlbumCard({ album }) {
  const [hov, setHov] = useState(false)
  return (
    <div className="album-card" onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}>
      <div className="album-cover">
        <div className="album-cover-bg" style={{background:album.bg}}>{album.emoji}</div>
        <div className="type-badge type-album">ALBUM</div>
        <div className="play-overlay"><button className="play-btn-circle">▶</button></div>
      </div>
      <div className="album-info">
        <div className="album-title">{album.title}</div>
        <div className="album-meta">
          <span>{album.artist}</span>
          <span>{album.tracks} titres</span>
          <span>{album.country} {album.year}</span>
        </div>
      </div>
    </div>
  )
}

/* ══ CREATOR CARD ══ */
function CreatorCard({ c }) {
  return (
    <div className="creator-card">
      <div className="creator-ava" style={{background:c.bg}}>{c.ava}</div>
      <div className="creator-name">{c.name} {c.verified&&<span style={{color:'var(--gold)',fontSize:12}}>✓</span>}</div>
      <div className="creator-type">{c.type} {c.country}</div>
      <div className="creator-fans">{c.fans} fans</div>
      <button className="btn btn-sm" style={{marginTop:10,width:'100%',padding:'6px',fontSize:11,background:'var(--card2)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',cursor:'pointer',color:'var(--text)',fontFamily:"Plus Jakarta Sans,sans-serif",transition:'all .18s'}}
        onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--gold)';e.currentTarget.style.color='var(--gold)'}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text)'}}>
        + Suivre
      </button>
    </div>
  )
}

/* ══ LIVE CARD ══ */
function LiveCard({ radio }) {
  return (
    <div className="live-card" onClick={()=>{}}>
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        <div style={{width:48,height:48,borderRadius:12,background:radio.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>{radio.emoji}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:700,fontSize:13.5,marginBottom:2}}>{radio.name}</div>
          <div style={{fontSize:11.5,color:'var(--text2)'}}>{radio.station}</div>
        </div>
        <div style={{textAlign:'right',flexShrink:0}}>
          <div style={{fontSize:10,fontFamily:"Space Mono,monospace",color:'var(--red)',fontWeight:700}}>🔴 LIVE</div>
          <div style={{fontSize:10,color:'var(--text3)',fontFamily:"Space Mono,monospace"}}>{radio.listeners} 👥</div>
        </div>
      </div>
      <button className="btn btn-sm" style={{marginTop:12,width:'100%',padding:'7px',fontSize:12,background:'rgba(230,57,70,.12)',border:'1px solid rgba(230,57,70,.25)',borderRadius:'var(--radius-sm)',cursor:'pointer',color:'var(--red)',fontWeight:700,fontFamily:"Plus Jakarta Sans,sans-serif",transition:'all .18s'}}
        onMouseEnter={e=>{e.currentTarget.style.background='var(--red)';e.currentTarget.style.color='#fff'}}
        onMouseLeave={e=>{e.currentTarget.style.background='rgba(230,57,70,.12)';e.currentTarget.style.color='var(--red)'}}>
        🎧 Écouter en direct
      </button>
    </div>
  )
}

/* ══ EVENT CARD ══ */
function EventCard({ ev }) {
  const isFree = ev.price === 'Gratuit'
  return (
    <div className="event-card">
      <div className="event-date-box" style={{background:ev.bg}}>
        <span className="event-day">{ev.date}</span>
        <span className="event-month">{ev.month}</span>
      </div>
      <div className="event-info">
        <div className="event-title">{ev.emoji} {ev.title} {ev.boost&&<span style={{fontSize:9,background:'var(--gold)',color:'#000',borderRadius:20,padding:'2px 7px',fontFamily:"Space Mono,monospace",fontWeight:700,marginLeft:4}}>BOOST</span>}</div>
        <div className="event-meta">
          <span>📍 {ev.location} {ev.country}</span>
          <span className="event-cat">{ev.cat}</span>
        </div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:8}}>
          <span style={{fontFamily:"Space Mono,monospace",fontSize:12,fontWeight:700,color:isFree?'var(--green)':'var(--gold)'}}>{ev.price}</span>
          <button className="btn btn-sm" style={{padding:'5px 14px',fontSize:11,background:isFree?'var(--green)':'linear-gradient(135deg,var(--gold),#e8920a)',border:'none',borderRadius:50,cursor:'pointer',color:isFree?'#000':'#000',fontWeight:700,fontFamily:"Plus Jakarta Sans,sans-serif"}}>
            {isFree?'✓ S\'inscrire':'🎫 Réserver'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ══ HOME PAGE ══ */
export default function Home({ onPlay }) {
  const { user } = useAuthStore()
  const [tracks,   setTracks]   = useState(TRACKS)
  const [albums,   setAlbums]   = useState(ALBUMS)
  const [genre,    setGenre]    = useState('Tout')
  const [loading,  setLoading]  = useState(true)

  // Charger les vraies données API en overlay sur les mock
  useEffect(() => {
    setLoading(false)
    api.tracks?.list?.({ limit:8 }).then(r => {
      if (r?.tracks?.length) setTracks(r.tracks.slice(0,8).map((t,i) => ({...TRACKS[i]||TRACKS[0], ...t})))
    }).catch(()=>{})
  }, [])

  const displayTracks = genre === 'Tout'
    ? tracks.slice(0,4)
    : tracks.filter(t => t.genre?.includes(genre.replace(/^[^ ]+ /,''))).slice(0,4)

  return (
    <div style={{padding:'0 0 80px'}}>

      {/* ══ HERO BANNER ══ */}
      <div className="hero-banner">
        <div className="hero-kente-deco"/>
        <div className="hero-kente-deco2"/>
        <div className="hero-content">
          <div className="hero-badge">🌍 Lancé aux Comores · L&apos;audio social africain</div>
          <div className="hero-title">Stream. Connect.<br/><span>Vibrate Africa.</span></div>
          <div className="hero-sub">Musique, Podcasts, Émissions et Radio Live. Découvrez et supportez les talents africains — de Moroni à Lagos.</div>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={()=>onPlay&&onPlay(TRACKS[0])}>🎧 Écouter</button>
            <button className="btn btn-secondary">🎙️ Créer</button>
            {!user && <>
              <button className="btn btn-outline">🔑 Connexion</button>
              <button className="btn btn-outline" style={{borderColor:'var(--gold)',color:'var(--gold)'}}>✨ Créer un compte</button>
            </>}
          </div>
        </div>
      </div>

      {/* ══ STATS ROW ══ */}
      <div className="stats-row">
        <div className="stat-card sc-gold"><div className="stat-icon">🎵</div><div className="stat-num">48K</div><div className="stat-label">Sons publiés</div></div>
        <div className="stat-card sc-red"><div className="stat-icon">🎨</div><div className="stat-num">3.2K</div><div className="stat-label">Créateurs</div></div>
        <div className="stat-card sc-green"><div className="stat-icon">👥</div><div className="stat-num">120K</div><div className="stat-label">Auditeurs</div></div>
        <div className="stat-card sc-blue"><div className="stat-icon">🌍</div><div className="stat-num">54</div><div className="stat-label">Pays</div></div>
      </div>

      {/* ══ GENRE CHIPS ══ */}
      <div className="genre-chips">
        {GENRES.map(g => (
          <div key={g} className={`genre-chip${genre===g?' active':''}`} onClick={()=>setGenre(g)}>{g}</div>
        ))}
      </div>

      {/* ══ TRENDING TRACKS ══ */}
      <div className="section-hdr">
        <div className="section-title">🔥 Tendances</div>
        <span className="see-all">Voir tout →</span>
      </div>
      <div className="tracks-grid" style={{gridTemplateColumns:'repeat(2,1fr)'}}>
        {displayTracks.map(t => (
          <TrackCard key={t.id||t.title} track={t} onPlay={()=>onPlay&&onPlay(t)} />
        ))}
      </div>

      {/* ══ LIVE RADIO ══ */}
      <div className="live-section">
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:4}}>
          <div className="live-pulse-badge">🔴 LIVE</div>
          <div className="section-title" style={{fontSize:17}}>Radios &amp; Émissions Live</div>
          <span className="see-all" style={{marginLeft:'auto'}}>Voir tout →</span>
        </div>
        <div className="live-streams-grid">
          {RADIOS.map(r => <LiveCard key={r.id} radio={r} />)}
        </div>
      </div>

      {/* ══ ALBUMS RÉCENTS ══ */}
      <div className="section-hdr">
        <div className="section-title">💿 Albums récents</div>
        <span className="see-all">Voir tout →</span>
      </div>
      <div className="tracks-grid" style={{gridTemplateColumns:'repeat(2,1fr)'}}>
        {albums.slice(0,4).map(a => <AlbumCard key={a.id} album={a} />)}
      </div>

      {/* ══ CRÉATEURS EN VUE ══ */}
      <div className="section-hdr">
        <div className="section-title">⭐ Créateurs en Vue</div>
        <span className="see-all">Voir tout →</span>
      </div>
      <div className="creator-scroll">
        {CREATORS.map(c => <CreatorCard key={c.id} c={c} />)}
      </div>

      {/* ══ ÉVÉNEMENTS ══ */}
      <div className="section-hdr">
        <div className="section-title">🎪 Événements</div>
        <span className="see-all">Voir tout →</span>
      </div>
      <div className="events-grid">
        {EVENTS.map(ev => <EventCard key={ev.id} ev={ev} />)}
      </div>

    </div>
  )
}
