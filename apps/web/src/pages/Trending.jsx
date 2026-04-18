import { useState, useEffect } from "react"
import { usePlayerStore, usePageStore, useAuthStore, useDeviseStore } from "../stores/index.js"
import BuyModal from "../components/BuyModal.jsx"
import { getFlag } from "../services/flags.js"
import api from "../services/api.js"

const TABS=['🎵 Sons','💿 Albums','🛍️ Produits','🎪 Événements']
const PAYS=['🌍 Tous les pays','🇰🇲 Comores','🇲🇬 Madagascar','🇹🇿 Tanzanie','🇷🇼 Rwanda','🇨🇮 Côte d\'Ivoire','🇳🇬 Nigeria','🇨🇩 RD Congo']
const BGS=["linear-gradient(135deg,#f5a623,#e63946)","linear-gradient(135deg,#2dc653,#0a9e4a)","linear-gradient(135deg,#4d9fff,#1a6fcc)","linear-gradient(135deg,#9b59f5,#6d3db5)","linear-gradient(135deg,#ff6b35,#cc4411)","linear-gradient(135deg,#f5a623,#cc7700)"]
const fmtK=n=>n>=1000?(n/1000).toFixed(1)+"K":String(n||0)

export default function Trending(){
  const {toggle,currentTrack,isPlaying}=usePlayerStore()
  const {setPage}=usePageStore()
  const {user}=useAuthStore()
  const {devise}=useDeviseStore()
  const dc=devise?.code||'KMF'

  const [tab,setTab]=useState('🎵 Sons')
  const [pays,setPays]=useState('')
  const [buyTrack,setBuyTrack]=useState(null)

  return(
    <div style={{paddingBottom:40}}>
      <div className="page-title">🔥 Classement & Tendances</div>

      {/* TABS */}
      <div className="tabs-bar" style={{marginBottom:16}}>
        {TABS.map(t=><button key={t} className={`tab-btn${tab===t?' active':''}`} onClick={()=>setTab(t)}>{t}</button>)}
      </div>

      {/* Filtre pays global */}
      <div className="filter-bar" style={{marginBottom:16}}>
        <select className="select-styled" value={pays} onChange={e=>setPays(e.target.value)}>
          {PAYS.map(o=><option key={o} value={o.includes('Tous')?'':o}>{o}</option>)}
        </select>
      </div>

      {buyTrack&&<BuyModal track={buyTrack} mode="buy" onClose={()=>setBuyTrack(null)} onSuccess={()=>setBuyTrack(null)}/>}

      {tab==='🎵 Sons'&&<TabSons toggle={toggle} currentTrack={currentTrack} isPlaying={isPlaying} user={user} setPage={setPage} dc={dc} onBuy={setBuyTrack}/>}
      {tab==='💿 Albums'&&<TabAlbums setPage={setPage}/>}
      {tab==='🛍️ Produits'&&<TabProduits setPage={setPage} dc={dc}/>}
      {tab==='🎪 Événements'&&<TabEvents setPage={setPage} dc={dc}/>}
    </div>
  )
}

/* ═══════════════════════════════════════
   TAB: Sons (avec protection payant)
   ═══════════════════════════════════════ */
function TabSons({toggle,currentTrack,isPlaying,user,setPage,dc,onBuy}){
  const [tracks,setTracks]=useState([])
  const [loading,setLoading]=useState(true)

  useEffect(()=>{
    api.tracks.trending()
      .then(d=>setTracks(d.tracks||[]))
      .catch(()=>setTracks([]))
      .finally(()=>setLoading(false))
  },[])

  const handlePlay=(t)=>{
    const isPaid=t.access_type==='paid'||t.access_type==='rent'||(t.sale_price&&t.sale_price>0&&t.access_type!=='free')
    if(isPaid){
      if(!user){setPage('login');return}
      onBuy(t)
    } else {
      toggle(t)
    }
  }

  if(loading) return <div style={{display:'flex',flexDirection:'column',gap:8}}>{[...Array(8)].map((_,i)=><div key={i} style={{height:68,background:'var(--card)',borderRadius:'var(--radius-sm)',border:'1px solid var(--border)',animation:'shimmer 1.5s infinite'}}/>)}</div>

  if(!tracks.length) return <Empty icon="🎵" title="Aucun son en tendance" desc="Les sons les plus écoutés apparaîtront ici."/>

  return(
    <div style={{display:'flex',flexDirection:'column',gap:8}}>
      {tracks.map((t,i)=>{
        const rank=i+1
        const playing=isPlaying&&currentTrack?.id===t.id
        const isPaid=t.access_type==='paid'||t.access_type==='rent'||(t.sale_price&&t.sale_price>0&&t.access_type!=='free')
        return(
          <div key={t.id} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',overflow:'hidden',transition:'all .2s'}}>
            <div style={{display:'flex',alignItems:'center',gap:12,padding:'11px 14px',cursor:'pointer'}} onClick={()=>handlePlay(t)}>
              <div style={{fontFamily:'Syne,sans-serif',fontSize:18,fontWeight:800,color:rank<=3?'var(--gold)':'var(--text3)',width:26,textAlign:'center',flexShrink:0}}>{rank}</div>
              <div style={{width:44,height:44,borderRadius:8,background:BGS[i%6],flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,overflow:'hidden',position:'relative'}}>
                {t.cover_url?<img src={t.cover_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:"🎵"}
                {isPaid&&<div style={{position:'absolute',bottom:0,left:0,right:0,background:'rgba(0,0,0,.7)',fontSize:7,textAlign:'center',padding:'1px 0',color:'var(--gold)',fontWeight:700}}>PAYANT</div>}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600,fontSize:13.5,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</div>
                <div style={{fontSize:11.5,color:'var(--text2)',marginTop:1}}>{t.profiles?.display_name||'Artiste'} {getFlag(t.country)}</div>
              </div>
              <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',flexShrink:0,gap:2}}>
                <div style={{fontSize:12,color:'var(--text2)',fontFamily:'Space Mono,monospace'}}>{fmtK(t.play_count)} 🎧</div>
                {isPaid
                  ?<div style={{fontSize:10,color:'var(--gold)',fontWeight:700}}>{(t.sale_price||0).toLocaleString()} {dc}</div>
                  :<div style={{fontSize:10,color:'var(--green)',fontWeight:600}}>Gratuit</div>
                }
              </div>
              <div style={{width:34,height:34,borderRadius:'50%',background:playing?'var(--gold)':isPaid?'rgba(245,166,35,.15)':'var(--card2)',border:`1px solid ${isPaid?'var(--gold)':'var(--border)'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,color:playing?'#000':isPaid?'var(--gold)':'var(--text2)',flexShrink:0}}>
                {playing?"⏸":isPaid?"🛒":"▶"}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ═══════════════════════════════════════
   TAB: Albums
   ═══════════════════════════════════════ */
function TabAlbums({setPage}){
  const [albums,setAlbums]=useState([])
  const [loading,setLoading]=useState(true)

  useEffect(()=>{
    api.get('/api/albums?limit=20')
      .then(d=>setAlbums(d.albums||[]))
      .catch(()=>setAlbums([]))
      .finally(()=>setLoading(false))
  },[])

  if(loading) return <Skel count={6} h={240}/>
  if(!albums.length) return <Empty icon="💿" title="Aucun album en tendance" desc="Les albums populaires apparaîtront ici."/>

  return(
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:14}}>
      {albums.map((a,i)=>{
        const creator=a.profiles||{}
        return(
          <div key={a.id} onClick={()=>setPage('music')} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',overflow:'hidden',cursor:'pointer',transition:'all .25s'}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(245,166,35,.4)';e.currentTarget.style.transform='translateY(-4px)'}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.transform='none'}}>
            <div style={{aspectRatio:'1',background:a.cover_url?'none':BGS[i%6],display:'flex',alignItems:'center',justifyContent:'center',fontSize:48,overflow:'hidden',position:'relative'}}>
              {a.cover_url?<img src={a.cover_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:'💿'}
              <div style={{position:'absolute',top:8,left:8,background:'rgba(0,0,0,.6)',color:'var(--green)',fontSize:9,fontFamily:'Space Mono,monospace',fontWeight:700,padding:'3px 8px',borderRadius:4,letterSpacing:.5,textTransform:'uppercase'}}>
                {a.album_type==='ep'?'EP':a.album_type==='single'?'SINGLE':'ALBUM'}
              </div>
              <div style={{position:'absolute',top:8,right:8,background:'rgba(0,0,0,.6)',color:'var(--gold)',fontSize:10,fontWeight:700,padding:'3px 8px',borderRadius:4}}>#{i+1}</div>
            </div>
            <div style={{padding:'12px 14px'}}>
              <div style={{fontWeight:700,fontSize:13.5,marginBottom:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.title}</div>
              <div style={{fontSize:12,color:'var(--text2)',marginBottom:4}}>{creator.display_name||'Artiste'} {getFlag(a.country)}</div>
              <div style={{fontSize:11,color:'var(--text3)',fontFamily:'Space Mono,monospace'}}>{a.genre||'Musique'} · {a.release_year||new Date(a.created_at).getFullYear()}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ═══════════════════════════════════════
   TAB: Produits
   ═══════════════════════════════════════ */
function TabProduits({setPage,dc}){
  const [products,setProducts]=useState([])
  const [loading,setLoading]=useState(true)

  useEffect(()=>{
    api.products.list('?limit=20')
      .then(d=>setProducts((d.products||[]).sort((a,b)=>(b.sold_count||0)-(a.sold_count||0))))
      .catch(()=>setProducts([]))
      .finally(()=>setLoading(false))
  },[])

  if(loading) return <Skel count={6} h={240}/>
  if(!products.length) return <Empty icon="🛍️" title="Aucun produit en tendance" desc="Les produits populaires apparaîtront ici."/>

  return(
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:14}}>
      {products.map((p,i)=>(
        <div key={p.id} onClick={()=>setPage('shop')} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',overflow:'hidden',cursor:'pointer',transition:'all .25s'}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(245,166,35,.4)';e.currentTarget.style.transform='translateY(-4px)'}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.transform='none'}}>
          <div style={{height:130,background:p.cover_url?'#000':(p.background||BGS[i%6]),display:'flex',alignItems:'center',justifyContent:'center',fontSize:40,position:'relative',overflow:'hidden'}}>
            {p.cover_url?<img src={p.cover_url} style={{width:'100%',height:'100%',objectFit:'cover'}} alt=""/>:(p.emoji||'🛍️')}
            <div style={{position:'absolute',top:8,right:8,background:'rgba(0,0,0,.6)',color:'var(--gold)',fontSize:10,fontWeight:700,padding:'3px 8px',borderRadius:4}}>#{i+1}</div>
          </div>
          <div style={{padding:'12px 14px'}}>
            <div style={{fontWeight:700,fontSize:13,marginBottom:4,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.name}</div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontSize:14,fontWeight:800,color:'var(--gold)',fontFamily:'Space Mono,monospace'}}>{(p.price||0).toLocaleString()} {dc}</span>
              <span style={{fontSize:11,color:'var(--text3)'}}>{p.sold_count||0} vendus</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════
   TAB: Événements
   ═══════════════════════════════════════ */
function TabEvents({setPage,dc}){
  const [events,setEvents]=useState([])
  const [loading,setLoading]=useState(true)

  useEffect(()=>{
    api.events.list('?limit=20')
      .then(d=>setEvents(d.events||[]))
      .catch(()=>setEvents([]))
      .finally(()=>setLoading(false))
  },[])

  if(loading) return <Skel count={4} h={90}/>
  if(!events.length) return <Empty icon="🎪" title="Aucun événement en tendance" desc="Les événements populaires apparaîtront ici."/>

  return(
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      {events.map((e,i)=>{
        const d=new Date(e.event_date)
        const day=String(d.getDate()).padStart(2,'0')
        const month=['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc'][d.getMonth()]
        return(
          <div key={e.id} onClick={()=>setPage('events')} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',overflow:'hidden',cursor:'pointer',display:'flex',gap:16,padding:16,transition:'all .2s'}}
            onMouseEnter={ev=>{ev.currentTarget.style.borderColor='rgba(245,166,35,.4)';ev.currentTarget.style.transform='translateX(4px)'}}
            onMouseLeave={ev=>{ev.currentTarget.style.borderColor='var(--border)';ev.currentTarget.style.transform='none'}}>
            <div style={{width:56,height:56,borderRadius:12,background:BGS[i%6],display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <div style={{fontSize:18,fontWeight:800,lineHeight:1}}>{day}</div>
              <div style={{fontSize:10,textTransform:'uppercase',fontFamily:'Space Mono,monospace',opacity:.8}}>{month}</div>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:700,fontSize:14,marginBottom:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{e.title}</div>
              <div style={{fontSize:12,color:'var(--text2)',marginBottom:4}}>📍 {e.location||'En ligne'} {getFlag(e.country)}</div>
              <div style={{display:'flex',gap:12,fontSize:11,color:'var(--text3)'}}>
                <span>{e.is_free||!e.ticket_price?'🆓 Gratuit':'🎫 '+(e.ticket_price||0).toLocaleString()+' '+dc}</span>
                {e.capacity&&<span>👥 {e.tickets_sold||0}/{e.capacity}</span>}
              </div>
            </div>
            <div style={{fontFamily:'Syne,sans-serif',fontSize:20,fontWeight:800,color:i<3?'var(--gold)':'var(--text3)',flexShrink:0,alignSelf:'center'}}>#{i+1}</div>
          </div>
        )
      })}
    </div>
  )
}

/* ═══════════════════════════════════════
   Composants utilitaires
   ═══════════════════════════════════════ */
function Empty({icon,title,desc}){
  return(
    <div style={{textAlign:'center',padding:60,color:'var(--text3)'}}>
      <div style={{fontSize:48,marginBottom:12}}>{icon}</div>
      <div style={{fontFamily:'Syne,sans-serif',fontSize:16,fontWeight:700,marginBottom:6,color:'var(--text)'}}>{title}</div>
      <div style={{fontSize:13}}>{desc}</div>
    </div>
  )
}

function Skel({count=6,h=200}){
  return(
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:14}}>
      {[...Array(count)].map((_,i)=><div key={i} style={{height:h,background:'var(--card)',borderRadius:'var(--radius)',border:'1px solid var(--border)',animation:'shimmer 1.5s infinite'}}/>)}
    </div>
  )
}
