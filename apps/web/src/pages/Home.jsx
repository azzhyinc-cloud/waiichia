import { useState, useEffect } from "react"
import { useAuthStore, usePlayerStore, usePageStore } from "../stores/index.js"
import api from "../services/api.js"
import { ReactionBar } from "../components/ReactionBar.jsx"
import BuyModal from "../components/BuyModal.jsx"
import RentModal from "../components/RentModal.jsx"

const fmt=n=>n?(typeof n==='string'?n:n.toLocaleString()):'0'
const fmtStat=n=>{if(!n||n===0)return'0';if(n>=1000000)return(n/1000000).toFixed(1)+'M';if(n>=1000)return(n/1000).toFixed(1)+'K';return String(n)}
const fmtK=n=>n>=1000?(n/1000).toFixed(1)+'K':String(n||0)
const BGS=['linear-gradient(135deg,#0d2a3a,#1a5060)','linear-gradient(135deg,#1a0a2e,#3a1a6a)','linear-gradient(135deg,#002a10,#007040)','linear-gradient(135deg,#2e1a00,#7a4000)','linear-gradient(135deg,#1a0a2e,#4a1a7a)','linear-gradient(135deg,#001a2e,#005080)','linear-gradient(135deg,#0a1e2e,#1060a0)','linear-gradient(135deg,#1a0020,#5a0060)']
const EMOJIS=['🎵','🌊','🎶','🔥','💡','🎤','🌙','🎹']
const GENRES=['Tout','🎵 Twarab','🥁 Sebene','🌊 Afrobeats','🎶 Amapiano','🔥 Slam','🌿 Traditionnel','🕌 Gospel / Religion','💡 Mindset','💼 Business','📚 Éducation']

function fmtDuration(sec) {
  if (!sec) return ''
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return m + ':' + String(s).padStart(2, '0')
}

export default function Home() {
  const {user}=useAuthStore()
  const {toggle,currentTrack,isPlaying}=usePlayerStore()
  const {setPage}=usePageStore()
  const [tracks,setTracks]=useState([])
  const [genre,setGenre]=useState('Tout')
  const [loading,setLoading]=useState(true)
  const [stats,setStats]=useState({tracks_count:0,creators_count:0,total_plays:0,countries_count:0})
  const [toast,setToast]=useState('')
  const [creators,setCreators]=useState([])
  const [events,setEvents]=useState([])
  const [radios,setRadios]=useState([])
  const [products,setProducts]=useState([])
  const [duets,setDuets]=useState([])
  const [emissions,setEmissions]=useState([])
  const [podcasts,setPodcasts]=useState([])
  const [followedIds,setFollowedIds]=useState(new Set())
  const [followLoading,setFollowLoading]=useState(new Set())
  const [buyTrack,setBuyTrack]=useState(null)
  const [rentTrack,setRentTrack]=useState(null)
  const [selectedEvent,setSelectedEvent]=useState(null)
  const [selectedProduct,setSelectedProduct]=useState(null)
  const [selectedEmission,setSelectedEmission]=useState(null)
  const [bookingLoading,setBookingLoading]=useState(false)
  const [buyingProduct,setBuyingProduct]=useState(false)
  const showToast=msg=>{setToast(msg);setTimeout(()=>setToast(''),3000)}
  const goProfile=username=>setPage('profile',{profileUsername:username})

  const doFollow=async(e,creator)=>{
    if(e)e.stopPropagation()
    if(!user){setPage('login');return}
    if(followLoading.has(creator.id))return
    setFollowLoading(prev=>{const s=new Set(prev);s.add(creator.id);return s})
    try{
      if(followedIds.has(creator.id)){
        await api.profiles.unfollow(creator.handle)
        setFollowedIds(prev=>{const s=new Set(prev);s.delete(creator.id);return s})
        showToast('Vous ne suivez plus '+creator.name)
      }else{
        await api.profiles.follow(creator.handle)
        setFollowedIds(prev=>{const s=new Set(prev);s.add(creator.id);return s})
        showToast('✅ Vous suivez '+creator.name)
      }
    }catch(err){showToast(err.message||'Erreur')}
    setFollowLoading(prev=>{const s=new Set(prev);s.delete(creator.id);return s})
  }

  const openBuy=t=>{if(!user){setPage('login');return};setBuyTrack(t)}
  const openRent=t=>{if(!user){setPage('login');return};setRentTrack(t)}

  const bookEvent=async(ev)=>{
    if(!user){setPage('login');return}
    setBookingLoading(true)
    try{
      const API=import.meta.env.VITE_API_URL||''
      const token=localStorage.getItem('waiichia_token')
      const res=await fetch(API+'/api/payments/ticket',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({event_id:ev.id,quantity:1})})
      const json=await res.json()
      if(res.ok){showToast(ev.is_free?'✅ Inscrit à '+ev.title:'🎫 Billet réservé !');setSelectedEvent(null)}
      else showToast(json.error||'Erreur')
    }catch(err){showToast(err.message||'Erreur')}
    setBookingLoading(false)
  }

  const buyProduct=async(prod)=>{
    if(!user){setPage('login');return}
    setBuyingProduct(true)
    try{
      await api.products.buy(prod.id)
      showToast('✅ '+prod.name+' acheté !')
      setSelectedProduct(null)
    }catch(err){showToast(err.message||'Erreur')}
    setBuyingProduct(false)
  }

  useEffect(()=>{
    const API=import.meta.env.VITE_API_URL||''
    const promises = [
      api.profiles.stats().catch(()=>({tracks_count:0,creators_count:0,total_plays:0,countries_count:0})),
      api.tracks.list('?limit=8').catch(()=>({})),
      api.profiles.list('?limit=6').catch(()=>({})),
      fetch(API+'/api/events/?limit=4').then(r=>r.json()).catch(()=>({})),
      fetch(API+'/api/radio/').then(r=>r.json()).catch(()=>({})),
      fetch(API+'/api/products?limit=4').then(r=>r.json()).catch(()=>({})),
      fetch(API+'/api/karaoke/recordings/public').then(r=>r.json()).catch(()=>({})),
      api.emissions.list('?limit=4').catch(()=>({})),
      api.tracks.list('?type=podcast&limit=4').catch(()=>({})),
    ]
    if (user) promises.push(api.profiles.followingIds().catch(()=>({ids:[]})))
    else promises.push(Promise.resolve({ids:[]}))

    Promise.all(promises).then(([s,t,p,ev,rd,prod,duo,emis,pod,foll])=>{
      setStats(s)
      if(foll?.ids?.length) setFollowedIds(new Set(foll.ids))
      if(t?.tracks?.length){setTracks(t.tracks.map((tr,i)=>({...tr,bg:BGS[i%8],emoji:EMOJIS[i%8]})))}
      if(p?.profiles?.length){
        const mapped=p.profiles
          .filter(c=>!user||c.id!==user.id)
          .slice(0,6)
          .map((c,i)=>({id:c.id,name:c.display_name,handle:c.username,type:c.profile_type,ava:c.display_name?.[0]||'?',avatar_url:c.avatar_url,bg:BGS[i%8],fans:fmtStat(c.fans_count||c.followers_count||0),verified:c.is_verified,country:c.country==='KM'?'🇰🇲':c.country==='FR'?'🇫🇷':'🌍'}))
        setCreators(mapped)
      }
      if(ev?.events?.length){setEvents(ev.events.slice(0,4).map((e,i)=>{const d=new Date(e.event_date||e.created_at);return{id:e.id,title:e.title,description:e.description,date:String(d.getDate()).padStart(2,'0'),month:['Jan','Fev','Mar','Avr','Mai','Juin','Juil','Aou','Sep','Oct','Nov','Dec'][d.getMonth()],full_date:d.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'}),time:d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}),emoji:'🎪',location:e.location||'Comores',country:'🇰🇲',price:e.ticket_price?e.ticket_price.toLocaleString()+' '+(e.currency||'KMF'):'Gratuit',ticket_price:e.ticket_price||0,is_free:e.is_free||!e.ticket_price,bg:BGS[i%8],cat:e.category||'Event',boost:e.is_boosted,cover_url:e.cover_url,capacity:e.capacity,tickets_sold:e.tickets_sold||0,creator:e.profiles}}))}
      if(rd?.stations?.length){setRadios(rd.stations.slice(0,3).map((r,i)=>({id:r.id,name:r.name,station:r.description||'Radio Live',emoji:'📻',bg:BGS[i%8],listeners:r.listeners||'0',country:'🇰🇲'})))}
      if(prod?.products?.length){setProducts(prod.products.slice(0,4))}
      if(duo?.recordings?.length){setDuets(duo.recordings.slice(0,4))}
      if(emis?.emissions?.length){setEmissions(emis.emissions.slice(0,4))}
      if(pod?.tracks?.length){setPodcasts(pod.tracks.slice(0,4))}
    }).finally(()=>setLoading(false))
  },[])

  const displayTracks=genre==='Tout'?tracks.slice(0,6):tracks.filter(t=>t.genre?.includes(genre.replace(/^[^ ]+ /,''))).slice(0,6)

  return(
    <div style={{padding:'0 0 80px'}}>
      {toast&&<div style={{position:'fixed',top:20,left:'50%',transform:'translateX(-50%)',background:'var(--gold)',color:'#000',padding:'10px 24px',borderRadius:'var(--radius-sm)',fontWeight:700,fontSize:13,zIndex:9999,boxShadow:'0 4px 20px rgba(0,0,0,.3)'}}>{toast}</div>}

      {buyTrack&&<BuyModal track={buyTrack} mode="buy" onClose={()=>setBuyTrack(null)} onSuccess={()=>{showToast('✅ Achat confirmé !');setBuyTrack(null)}}/>}
      {rentTrack&&<RentModal track={rentTrack} onClose={()=>setRentTrack(null)} onSuccess={()=>{showToast('✅ Location activée !');setRentTrack(null)}}/>}

      {/* MODAL DÉTAIL ÉVÉNEMENT */}
      {selectedEvent&&<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.7)',zIndex:9000,display:'flex',alignItems:'center',justifyContent:'center',padding:20}} onClick={()=>setSelectedEvent(null)}>
        <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius)',maxWidth:500,width:'100%',maxHeight:'80vh',overflow:'auto',boxShadow:'0 20px 60px rgba(0,0,0,.5)'}} onClick={e=>e.stopPropagation()}>
          {selectedEvent.cover_url&&<div style={{height:180,overflow:'hidden',borderRadius:'var(--radius) var(--radius) 0 0'}}><img src={selectedEvent.cover_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/></div>}
          <div style={{padding:24}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
              <div>
                <div style={{fontSize:20,fontWeight:800,fontFamily:'Syne,sans-serif',marginBottom:4}}>{selectedEvent.emoji} {selectedEvent.title}</div>
                {selectedEvent.boost&&<span style={{fontSize:9,background:'var(--gold)',color:'#000',borderRadius:20,padding:'2px 7px',fontFamily:'Space Mono,monospace',fontWeight:700}}>BOOST</span>}
              </div>
              <button onClick={()=>setSelectedEvent(null)} style={{width:32,height:32,borderRadius:'50%',border:'1px solid var(--border)',background:'var(--card)',color:'var(--text3)',fontSize:14,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>✕</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:20}}>
              <div style={{display:'flex',alignItems:'center',gap:8,fontSize:13,color:'var(--text2)'}}><span>📅</span> {selectedEvent.full_date} à {selectedEvent.time}</div>
              <div style={{display:'flex',alignItems:'center',gap:8,fontSize:13,color:'var(--text2)'}}><span>📍</span> {selectedEvent.location} {selectedEvent.country}</div>
              {selectedEvent.capacity&&<div style={{display:'flex',alignItems:'center',gap:8,fontSize:13,color:'var(--text2)'}}><span>👥</span> {selectedEvent.tickets_sold}/{selectedEvent.capacity} places</div>}
              <div style={{display:'flex',alignItems:'center',gap:8,fontSize:15,fontWeight:700,color:selectedEvent.is_free?'var(--green)':'var(--gold)',fontFamily:'Space Mono,monospace'}}><span>🎫</span> {selectedEvent.is_free?'Gratuit':selectedEvent.price}</div>
            </div>
            {selectedEvent.description&&<div style={{fontSize:13,color:'var(--text2)',lineHeight:1.6,marginBottom:20,padding:14,background:'var(--card)',borderRadius:'var(--radius-sm)',border:'1px solid var(--border)'}}>{selectedEvent.description}</div>}
            {selectedEvent.creator&&<div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20,padding:10,background:'var(--card)',borderRadius:'var(--radius-sm)',border:'1px solid var(--border)',cursor:'pointer'}} onClick={()=>{setSelectedEvent(null);goProfile(selectedEvent.creator.username)}}>
              <div style={{width:32,height:32,borderRadius:'50%',background:'linear-gradient(135deg,var(--gold),#e8920a)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#000',overflow:'hidden'}}>{selectedEvent.creator.avatar_url?<img src={selectedEvent.creator.avatar_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:(selectedEvent.creator.display_name||'?')[0]}</div>
              <div><div style={{fontSize:12,fontWeight:600}}>{selectedEvent.creator.display_name}</div><div style={{fontSize:10,color:'var(--text3)'}}>Organisateur</div></div>
            </div>}
            <button onClick={()=>bookEvent(selectedEvent)} disabled={bookingLoading} style={{width:'100%',padding:'12px',borderRadius:50,border:'none',background:selectedEvent.is_free?'var(--green)':'linear-gradient(135deg,var(--gold),#e8920a)',color:'#000',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'Plus Jakarta Sans,sans-serif'}}>{bookingLoading?'⏳ En cours...':(selectedEvent.is_free?"✓ S'inscrire gratuitement":'🎫 Réserver — '+selectedEvent.price)}</button>
          </div>
        </div>
      </div>}

      {/* MODAL DÉTAIL PRODUIT */}
      {selectedProduct&&<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.7)',zIndex:9000,display:'flex',alignItems:'center',justifyContent:'center',padding:20}} onClick={()=>setSelectedProduct(null)}>
        <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius)',maxWidth:440,width:'100%',maxHeight:'80vh',overflow:'auto',boxShadow:'0 20px 60px rgba(0,0,0,.5)'}} onClick={e=>e.stopPropagation()}>
          <div style={{height:200,background:selectedProduct.background||BGS[0],display:'flex',alignItems:'center',justifyContent:'center',fontSize:60,overflow:'hidden',borderRadius:'var(--radius) var(--radius) 0 0'}}>
            {selectedProduct.cover_url?<img src={selectedProduct.cover_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:(selectedProduct.emoji||'🛍️')}
          </div>
          <div style={{padding:24}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
              <div>
                <div style={{fontSize:18,fontWeight:800,fontFamily:'Syne,sans-serif',marginBottom:4}}>{selectedProduct.name}</div>
                <div style={{fontSize:12,color:'var(--text3)'}}>par {selectedProduct.profiles?.display_name||'Vendeur'}</div>
              </div>
              <button onClick={()=>setSelectedProduct(null)} style={{width:32,height:32,borderRadius:'50%',border:'1px solid var(--border)',background:'var(--card)',color:'var(--text3)',fontSize:14,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>✕</button>
            </div>
            {selectedProduct.description&&<div style={{fontSize:13,color:'var(--text2)',lineHeight:1.6,marginBottom:16,padding:14,background:'var(--card)',borderRadius:'var(--radius-sm)',border:'1px solid var(--border)'}}>{selectedProduct.description}</div>}
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8,fontSize:11,color:'var(--text3)'}}>
              <span>📦 {selectedProduct.category||'Digital'}</span>
              {selectedProduct.sold_count>0&&<span>· {selectedProduct.sold_count} vendus</span>}
            </div>
            <div style={{fontSize:22,fontWeight:800,color:'var(--gold)',fontFamily:'Space Mono,monospace',marginBottom:20}}>{selectedProduct.price?.toLocaleString()} {selectedProduct.currency||'KMF'}</div>
            <button onClick={()=>buyProduct(selectedProduct)} disabled={buyingProduct} style={{width:'100%',padding:'12px',borderRadius:50,border:'none',background:'linear-gradient(135deg,var(--gold),#e8920a)',color:'#000',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'Plus Jakarta Sans,sans-serif'}}>{buyingProduct?'⏳ En cours...':'🛒 Acheter maintenant'}</button>
          </div>
        </div>
      </div>}

      {/* MODAL DÉTAIL ÉMISSION + ÉPISODES */}
      {selectedEmission&&<EmissionModal emission={selectedEmission} onClose={()=>setSelectedEmission(null)} goProfile={goProfile} toggle={toggle}/>}

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

      {/* STATS */}
      <div className="stats-row">
        <div className="stat-card sc-gold"><div className="stat-icon">🎵</div><div className="stat-num">{fmtStat(stats.tracks_count)}</div><div className="stat-label">Sons publiés</div></div>
        <div className="stat-card sc-red"><div className="stat-icon">🎨</div><div className="stat-num">{fmtStat(stats.creators_count)}</div><div className="stat-label">Créateurs</div></div>
        <div className="stat-card sc-green"><div className="stat-icon">👥</div><div className="stat-num">{fmtStat(stats.total_plays)}</div><div className="stat-label">Écoutes</div></div>
        <div className="stat-card sc-blue"><div className="stat-icon">🌍</div><div className="stat-num">{stats.countries_count||0}</div><div className="stat-label">Pays</div></div>
      </div>

      {/* GENRES */}
      <div className="genre-chips">{GENRES.map(g=><div key={g} className={`genre-chip${genre===g?' active':''}`} onClick={()=>setGenre(g)}>{g}</div>)}</div>

      {/* TENDANCES */}
      <div className="section-hdr"><div className="section-title">🔥 Tendances</div><span className="see-all" onClick={()=>setPage('trending')}>Voir tout →</span></div>
      <div className="tracks-grid">
        {displayTracks.map(t=><TrackCard key={t.id} track={t} onPlay={()=>toggle(t)} onBuy={()=>openBuy(t)} onRent={()=>openRent(t)} isPlaying={isPlaying&&currentTrack?.id===t.id} goProfile={goProfile}/>)}
        {!displayTracks.length&&!loading&&<div style={{gridColumn:'1/-1',textAlign:'center',padding:40,color:'var(--text3)'}}>Aucun son dans ce genre</div>}
      </div>

      {/* RADIO LIVE */}
      <div className="live-section">
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:4}}>
          <div className="live-pulse-badge">🔴 LIVE</div>
          <div className="section-title" style={{fontSize:17}}>Radios &amp; Émissions Live</div>
          <span className="see-all" style={{marginLeft:'auto'}} onClick={()=>setPage('radio')}>Voir tout →</span>
        </div>
        <div className="live-streams-grid">
          {radios.length?radios.map(r=><LiveCard key={r.id} radio={r} onListen={()=>{
            toggle({id:'radio_'+r.id,title:r.name,artist:r.station,type:'radio',bg:r.bg,emoji:r.emoji,is_live:true})
            showToast('📻 '+r.name+' — En direct')
          }}/>):<div style={{textAlign:'center',padding:20,color:'var(--text3)',fontSize:13}}>Aucune radio en direct</div>}
        </div>
      </div>

      {/* ══ ÉMISSIONS ══ */}
      {emissions.length>0&&<>
        <div className="section-hdr"><div className="section-title">📻 Émissions</div><span className="see-all" onClick={()=>setPage('feed')}>Voir tout →</span></div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:12}}>
          {emissions.map((em,i)=>{
            const host=em.profiles||{}
            return(
              <div key={em.id} className="track-card" style={{cursor:'pointer',transition:'border-color .2s'}}
                onClick={()=>setSelectedEmission(em)}
                onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(245,166,35,.3)'}
                onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
                <div style={{display:'flex',gap:12,padding:14}}>
                  <div style={{width:64,height:64,borderRadius:12,background:BGS[i%8],flexShrink:0,overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28}}>
                    {em.cover_url?<img src={em.cover_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:'📻'}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:700,marginBottom:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{em.title}</div>
                    <div style={{fontSize:11,color:'var(--text2)',marginBottom:4}}>
                      {em.channel&&<span>{em.channel} · </span>}
                      <span onClick={e=>{e.stopPropagation();goProfile(host.username)}} style={{cursor:'pointer'}}>{host.display_name||em.host||'Animateur'}</span>
                    </div>
                    <div style={{display:'flex',gap:6,fontSize:10,color:'var(--text3)'}}>
                      {em.category&&<span style={{background:'var(--bg2)',padding:'2px 7px',borderRadius:99,border:'1px solid var(--border)',textTransform:'capitalize'}}>{em.category}</span>}
                      {em.featured&&<span style={{background:'rgba(245,166,35,.15)',padding:'2px 7px',borderRadius:99,color:'var(--gold)'}}>⭐ Vedette</span>}
                      {em.is_new&&<span style={{background:'rgba(45,198,83,.15)',padding:'2px 7px',borderRadius:99,color:'#2dc653'}}>🆕</span>}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </>}

      {/* ══ PODCASTS ══ */}
      {podcasts.length>0&&<>
        <div className="section-hdr" style={{marginTop:24}}><div className="section-title">🎙️ Podcasts</div><span className="see-all" onClick={()=>setPage('feed')}>Voir tout →</span></div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:12}}>
          {podcasts.map((t,i)=>{
            const artist=t.profiles||{}
            const isPlayingThis=isPlaying&&currentTrack?.id===t.id
            return(
              <div key={t.id} className="track-card" style={{cursor:'pointer',transition:'border-color .2s'}}
                onClick={()=>toggle(t)}
                onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(245,166,35,.3)'}
                onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
                <div style={{display:'flex',gap:12,padding:14,alignItems:'center'}}>
                  <div style={{width:56,height:56,borderRadius:12,background:BGS[i%8],flexShrink:0,overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,position:'relative'}}>
                    {t.cover_url?<img src={t.cover_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:'🎙️'}
                    <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.35)',display:'flex',alignItems:'center',justifyContent:'center',opacity:isPlayingThis?1:0,transition:'opacity .2s'}}>
                      <span style={{fontSize:20,color:'#fff'}}>{isPlayingThis?'⏸':'▶'}</span>
                    </div>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:700,marginBottom:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</div>
                    <div style={{fontSize:11,color:'var(--text2)',marginBottom:3}}>
                      <span onClick={e=>{e.stopPropagation();goProfile(artist.username)}} style={{cursor:'pointer'}}>{artist.display_name||'Créateur'}</span>
                      {artist.is_verified&&<span style={{marginLeft:4,fontSize:10}}>⭐</span>}
                    </div>
                    <div style={{display:'flex',gap:8,fontSize:10,color:'var(--text3)'}}>
                      {t.genre&&<span>{t.genre}</span>}
                      {t.duration_sec>0&&<><span>·</span><span>{fmtDuration(t.duration_sec)}</span></>}
                      <span>·</span><span>{fmtK(t.play_count)} 🎧</span>
                    </div>
                  </div>
                  <button style={{width:36,height:36,borderRadius:'50%',border:'none',background:isPlayingThis?'var(--gold)':'linear-gradient(135deg,var(--gold),#e8920a)',color:'#000',fontSize:14,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,flexShrink:0}} onClick={e=>{e.stopPropagation();toggle(t)}}>{isPlayingThis?'⏸':'▶'}</button>
                </div>
              </div>
            )
          })}
        </div>
      </>}

      {/* CRÉATEURS */}
      <div className="section-hdr"><div className="section-title">⭐ Créateurs en Vue</div><span className="see-all" onClick={()=>setPage('creators')}>Voir tout →</span></div>
      <div className="creator-scroll">
        {creators.map(c=><CreatorCard key={c.id} c={c} onProfile={()=>goProfile(c.handle)} onFollow={(e)=>doFollow(e,c)} isFollowed={followedIds.has(c.id)} isLoading={followLoading.has(c.id)}/>)}
      </div>

      {/* ÉVÉNEMENTS */}
      <div className="section-hdr"><div className="section-title">🎪 Événements</div><span className="see-all" onClick={()=>setPage('events')}>Voir tout →</span></div>
      <div className="events-grid">
        {events.map(ev=><EventCard key={ev.id} ev={ev} onClick={()=>setSelectedEvent(ev)} onBook={(e)=>{e.stopPropagation();bookEvent(ev)}}/>)}
        {!events.length&&!loading&&<div style={{textAlign:'center',padding:40,color:'var(--text3)'}}>Aucun événement à venir</div>}
      </div>

      {/* BOUTIQUE */}
      {products.length>0&&<>
        <div className="section-hdr"><div className="section-title">🛍️ Boutique</div><span className="see-all" onClick={()=>setPage('shop')}>Voir tout →</span></div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:12}}>
          {products.map((p,i)=>(
            <div key={p.id} className="track-card" style={{cursor:'pointer',transition:'border-color .2s'}} onClick={()=>setSelectedProduct(p)}
              onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(245,166,35,.3)'}
              onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
              <div style={{height:120,background:p.background||BGS[i%8],borderRadius:'var(--radius-sm) var(--radius-sm) 0 0',display:'flex',alignItems:'center',justifyContent:'center',fontSize:40,overflow:'hidden'}}>
                {p.cover_url?<img src={p.cover_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:(p.emoji||'🛍️')}
              </div>
              <div style={{padding:'10px 12px'}}>
                <div style={{fontSize:13,fontWeight:700,marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.name}</div>
                <div style={{fontSize:11,color:'var(--text3)',marginBottom:6}}>{p.profiles?.display_name||'Vendeur'}</div>
                <div style={{fontSize:12,fontWeight:700,color:'var(--gold)',fontFamily:'Space Mono,monospace'}}>{p.price?.toLocaleString()} {p.currency||'KMF'}</div>
              </div>
            </div>
          ))}
        </div>
      </>}

      {/* DUETS KARAOKÉ */}
      <div className="section-hdr" style={{marginTop:24}}><div className="section-title">🎤 Duets récents</div><span className="see-all" onClick={()=>setPage('karaoke')}>Voir tout →</span></div>
      {duets.length>0
        ?<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:12}}>
          {duets.map((d,i)=>{
            const duetTrack={id:d.id,title:d.title||d.tracks?.title||'Duet 🎤',audio_url_128:d.audio_url,cover_url:d.tracks?.cover_url||null,profiles:{display_name:d.profiles?.display_name||'Artiste',username:d.profiles?.username}}
            const isPlayingThis=isPlaying&&currentTrack?.id===d.id
            return(
            <div key={d.id} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',overflow:'hidden',transition:'border-color .2s'}}
              onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(245,166,35,.3)'}
              onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
              <div style={{display:'flex',alignItems:'center',gap:12,padding:14,cursor:'pointer'}} onClick={()=>{if(d.audio_url)toggle(duetTrack);else setPage('karaoke')}}>
                <div style={{width:48,height:48,borderRadius:12,background:BGS[i%8],display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0,position:'relative',overflow:'hidden'}}>
                  {d.tracks?.cover_url?<img src={d.tracks.cover_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:'🎤'}
                  {d.audio_url&&<div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.4)',display:'flex',alignItems:'center',justifyContent:'center',opacity:0,transition:'opacity .2s'}}
                    onMouseEnter={e=>e.currentTarget.style.opacity='1'}
                    onMouseLeave={e=>e.currentTarget.style.opacity='0'}>
                    <span style={{fontSize:18,color:'#fff'}}>{isPlayingThis?'⏸':'▶'}</span>
                  </div>}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.title||d.tracks?.title||'Duet'}</div>
                  <div style={{fontSize:11,color:'var(--text3)',marginTop:2,cursor:'pointer'}} onClick={e=>{e.stopPropagation();if(d.profiles?.username)goProfile(d.profiles.username)}}>par {d.profiles?.display_name||'Artiste'}</div>
                </div>
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2,flexShrink:0}}>
                  {d.audio_url
                    ?<button style={{width:36,height:36,borderRadius:'50%',border:'none',background:isPlayingThis?'var(--gold)':'linear-gradient(135deg,var(--gold),#e8920a)',color:'#000',fontSize:14,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700}} onClick={e=>{e.stopPropagation();toggle(duetTrack)}}>{isPlayingThis?'⏸':'▶'}</button>
                    :<span style={{fontSize:10,color:'var(--text3)',fontFamily:'Space Mono,monospace'}}>Pas d'audio</span>
                  }
                </div>
              </div>
              <div style={{padding:'0 14px 12px'}}>
                <ReactionBar targetType="recording" targetId={d.id} showComments={true}/>
              </div>
            </div>
          )})}
        </div>
        :<div style={{textAlign:'center',padding:40,color:'var(--text3)',background:'var(--card)',borderRadius:'var(--radius)',border:'1px solid var(--border)'}}>
          <div style={{fontSize:36,marginBottom:8}}>🎤</div>
          <div style={{fontSize:13,fontWeight:600,marginBottom:4}}>Aucun duet pour le moment</div>
          <div style={{fontSize:11,marginBottom:12}}>Soyez le premier à enregistrer un duet !</div>
          <button className="btn btn-primary btn-sm" onClick={()=>setPage('karaoke')}>Ouvrir Duet Studio</button>
        </div>
      }
    </div>
  )
}

/* ══ COMPOSANT: Emission Modal ══ */
function EmissionModal({emission:em,onClose,goProfile,toggle}){
  const [episodes,setEpisodes]=useState([])
  const [loadingEp,setLoadingEp]=useState(true)
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

  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.7)',zIndex:9000,display:'flex',alignItems:'center',justifyContent:'center',padding:20}} onClick={onClose}>
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
            {em.language&&<span style={{background:'var(--bg2)',padding:'3px 10px',borderRadius:99,border:'1px solid var(--border)'}}>{em.language==='fr'?'🇫🇷 Français':em.language}</span>}
            {em.format&&<span style={{background:'var(--bg2)',padding:'3px 10px',borderRadius:99,border:'1px solid var(--border)'}}>{em.format==='audio'?'🔊 Audio':'📡 RSS'}</span>}
          </div>
          {em.description&&<div style={{fontSize:13,color:'var(--text2)',lineHeight:1.6,marginBottom:16,padding:14,background:'var(--card)',borderRadius:'var(--radius-sm)',border:'1px solid var(--border)'}}>{em.description}</div>}
          {host.username&&<div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20,padding:10,background:'var(--card)',borderRadius:'var(--radius-sm)',border:'1px solid var(--border)',cursor:'pointer'}} onClick={()=>{onClose();goProfile(host.username)}}>
            <div style={{width:32,height:32,borderRadius:'50%',background:'linear-gradient(135deg,var(--gold),#e8920a)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#000',overflow:'hidden'}}>{host.avatar_url?<img src={host.avatar_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:(host.display_name||'?')[0]}</div>
            <div><div style={{fontSize:12,fontWeight:600}}>{host.display_name||em.host}</div><div style={{fontSize:10,color:'var(--text3)'}}>Animateur</div></div>
          </div>}
          <div style={{fontSize:14,fontWeight:700,marginBottom:10}}>🎧 Épisodes</div>
          {loadingEp
            ?<div style={{textAlign:'center',padding:20,color:'var(--text3)',fontSize:12}}>Chargement...</div>
            :episodes.length===0
              ?<div style={{textAlign:'center',padding:20,color:'var(--text3)',fontSize:12,background:'var(--card)',borderRadius:'var(--radius-sm)',border:'1px solid var(--border)'}}>Aucun épisode pour le moment</div>
              :<div style={{display:'flex',flexDirection:'column',gap:8}}>
                {episodes.map((ep,i)=>(
                  <div key={ep.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 12px',background:'var(--card)',borderRadius:'var(--radius-sm)',border:'1px solid var(--border)',cursor:ep.mp3_url?'pointer':'default',transition:'border-color .2s'}}
                    onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(245,166,35,.3)'}
                    onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}
                    onClick={()=>{if(ep.mp3_url)toggle({id:ep.id,title:ep.title,audio_url_128:ep.mp3_url,cover_url:em.cover_url||null,profiles:host,type:'emission'})}}>
                    <div style={{width:36,height:36,borderRadius:8,background:BGS[i%8],flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,color:'#fff',fontWeight:700}}>{ep.number||(i+1)}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ep.title}</div>
                      <div style={{fontSize:11,color:'var(--text3)',display:'flex',gap:8,marginTop:2}}>
                        {ep.duration>0&&<span>{fmtDuration(ep.duration)}</span>}
                        {ep.air_date&&<span>{new Date(ep.air_date).toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}</span>}
                        {ep.play_count>0&&<span>{fmtK(ep.play_count)} écoutes</span>}
                      </div>
                    </div>
                    {ep.mp3_url&&<span style={{fontSize:16,flexShrink:0}}>▶</span>}
                  </div>
                ))}
              </div>
          }
        </div>
      </div>
    </div>
  )
}

/* ══ COMPOSANTS EXISTANTS ══ */
function TrackCard({track,onPlay,onBuy,onRent,isPlaying,goProfile}){
  const [hov,setHov]=useState(false)
  const isFree=track.access_type==='free'
  const hasRent=track.rent_price_day||track.rent_price_week||track.rent_price_month
  const sP=track.sale_price?track.sale_price.toLocaleString()+' KMF':'—'
  return(
    <div className={`track-card${hov?' card-hover':''}`} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}>
      <div onClick={onPlay} style={{cursor:'pointer'}}>
        <div className="track-cover">
          <div className="track-cover-bg" style={{background:track.bg}}>{track.cover_url?<img src={track.cover_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:(track.emoji||'🎵')}</div>
          <div className={`type-badge ${track.type==='podcast'?'type-podcast':track.type==='emission'?'type-emission':'type-music'}`}>{track.genre||'MUSIQUE'}</div>
          <div className="play-overlay"><button className="play-btn-circle">{isPlaying?'⏸':'▶'}</button></div>
        </div>
        <div className="track-info">
          <div className="track-title">{track.title}</div>
          <div className="track-artist" onClick={e=>{e.stopPropagation();if(track.profiles?.username)goProfile(track.profiles.username)}} style={{cursor:'pointer'}}>{track.profiles?.display_name||'Artiste'}</div>
          <div className="track-meta"><span>{fmt(track.play_count)} 🎧</span></div>
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

function CreatorCard({c,onProfile,onFollow,isFollowed,isLoading}){
  return(
    <div className="creator-card" onClick={onProfile} style={{cursor:'pointer'}}>
      <div className="creator-ava" style={{background:c.bg,overflow:'hidden'}}>
        {c.avatar_url?<img src={c.avatar_url} style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}} alt=''/>:c.ava}
      </div>
      <div className="creator-name">{c.name} {c.verified&&<span style={{color:'var(--gold)',fontSize:12}}>✓</span>}</div>
      <div className="creator-type">{c.type} {c.country}</div>
      <div className="creator-fans">{c.fans} fans</div>
      <button className="follow-btn" style={isFollowed?{marginTop:10,background:'var(--card)',border:'1px solid var(--gold)',color:'var(--gold)'}:{marginTop:10}}
        onClick={onFollow} disabled={isLoading}>
        {isLoading?'...':(isFollowed?'✓ Suivi':'+ Suivre')}
      </button>
    </div>
  )
}

function LiveCard({radio,onListen}){return(<div className="live-card" style={{cursor:'pointer'}} onClick={onListen}><div style={{display:'flex',alignItems:'center',gap:12}}><div style={{width:48,height:48,borderRadius:12,background:radio.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>{radio.emoji}</div><div style={{flex:1,minWidth:0}}><div style={{fontWeight:700,fontSize:13.5,marginBottom:2}}>{radio.name}</div><div style={{fontSize:11.5,color:'var(--text2)'}}>{radio.station}</div></div><div style={{textAlign:'right',flexShrink:0}}><div style={{fontSize:10,fontFamily:"Space Mono,monospace",color:'var(--red)',fontWeight:700}}>🔴 LIVE</div><div style={{fontSize:10,color:'var(--text3)',fontFamily:"Space Mono,monospace"}}>{radio.listeners} 👥</div></div></div><button className="btn btn-sm" style={{marginTop:12,width:'100%',padding:'7px',fontSize:12,background:'rgba(230,57,70,.12)',border:'1px solid rgba(230,57,70,.25)',borderRadius:'var(--radius-sm)',cursor:'pointer',color:'var(--red)',fontWeight:700,fontFamily:"Plus Jakarta Sans,sans-serif"}}>🎧 Écouter en direct</button></div>)}

function EventCard({ev,onBook,onClick}){
  const isFree=ev.is_free||ev.price==='Gratuit'
  return(
    <div className="event-card" style={{cursor:'pointer'}} onClick={onClick}>
      <div className="event-date-box" style={{background:ev.bg}}>
        <span className="event-day">{ev.date}</span>
        <span className="event-month">{ev.month}</span>
      </div>
      <div className="event-info">
        <div className="event-title">{ev.emoji} {ev.title} {ev.boost&&<span style={{fontSize:9,background:'var(--gold)',color:'#000',borderRadius:20,padding:'2px 7px',fontFamily:"Space Mono,monospace",fontWeight:700,marginLeft:4}}>BOOST</span>}</div>
        <div className="event-meta"><span>📍 {ev.location} {ev.country}</span><span className="event-cat">{ev.cat}</span></div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:8}}>
          <span style={{fontFamily:"Space Mono,monospace",fontSize:12,fontWeight:700,color:isFree?'var(--green)':'var(--gold)'}}>{isFree?'Gratuit':ev.price}</span>
          <button className="btn btn-sm" onClick={onBook} style={{padding:'5px 14px',fontSize:11,background:isFree?'var(--green)':'linear-gradient(135deg,var(--gold),#e8920a)',border:'none',borderRadius:50,cursor:'pointer',color:'#000',fontWeight:700,fontFamily:"Plus Jakarta Sans,sans-serif"}}>{isFree?"✓ S'inscrire":'🎫 Réserver'}</button>
        </div>
      </div>
    </div>
  )
}
