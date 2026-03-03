import { useState, useEffect } from 'react'
import { useAuthStore, usePageStore } from '../stores/index.js'
import api from '../services/api.js'

const API = import.meta.env.VITE_API_URL
const formatK = (n) => { if(!n)return'0'; if(n>=1000000)return(n/1000000).toFixed(1)+'M'; if(n>=1000)return(n/1000).toFixed(1)+'K'; return String(n) }

export default function MyContent() {
  const { user } = useAuthStore()
  const { setPage } = usePageStore()
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [deleting, setDeleting] = useState(null)
  const token = localStorage.getItem('waiichia_token')

  useEffect(() => { if(user) loadTracks() }, [user])

  const loadTracks = async () => {
    setLoading(true)
    try {
      const data = await api.tracks.myTracks()
      setTracks(data.tracks || [])
    } catch(e) {}
    setLoading(false)
  }

  const deleteTrack = async (id) => {
    if(!confirm('Supprimer ce son ?')) return
    setDeleting(id)
    await fetch(API+'/api/tracks/'+id, { method:'DELETE', headers:{'Authorization':'Bearer '+token} })
    setTracks(t => t.filter(x => x.id !== id))
    setDeleting(null)
  }

  const TYPES = [['','Tout'],['music','Musique'],['album','Album'],['podcast','Podcast'],['radio_live','Radio'],['emission','Emission']]

  const filtered = filter ? tracks.filter(t=>t.content_type===filter) : tracks

  if(!user) return (
    <div style={{textAlign:'center',padding:80}}>
      <div style={{fontSize:56,marginBottom:16}}>🎵</div>
      <h2>Mon Contenu</h2>
      <button onClick={()=>setPage('login')} style={{marginTop:16,background:'var(--primary)',border:'none',color:'#fff',padding:'10px 24px',borderRadius:8,cursor:'pointer'}}>Se connecter</button>
    </div>
  )

  return (
    <div style={{padding:'24px 20px 100px'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24,flexWrap:'wrap',gap:12}}>
        <h1 style={{fontSize:24,fontWeight:900,margin:0}}>🎵 Mon Contenu</h1>
        <button onClick={()=>setPage('upload')}
          style={{background:'var(--primary)',border:'none',color:'#fff',borderRadius:8,padding:'9px 18px',cursor:'pointer',fontWeight:700,fontSize:14}}>
          + Publier
        </button>
      </div>

      {/* STATS */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:12,marginBottom:24}}>
        {[
          { icon:'🎵', val: tracks.filter(t=>t.content_type==='music').length, label:'Sons' },
          { icon:'💿', val: tracks.filter(t=>t.content_type==='album').length, label:'Albums' },
          { icon:'🎙️', val: tracks.filter(t=>t.content_type==='podcast').length, label:'Podcasts' },
          { icon:'📻', val: tracks.filter(t=>t.content_type==='radio_live'||t.content_type==='emission').length, label:'Radio/Emissions' },
        ].map((s,i) => (
          <div key={i} style={{background:'var(--card)',borderRadius:12,padding:14,border:'1px solid var(--border)',textAlign:'center'}}>
            <div style={{fontSize:24,marginBottom:4}}>{s.icon}</div>
            <div style={{fontSize:20,fontWeight:900}}>{s.val}</div>
            <div style={{fontSize:12,color:'var(--text2)'}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* FILTRES */}
      <div style={{display:'flex',gap:6,marginBottom:20,flexWrap:'wrap'}}>
        {TYPES.map(([v,l]) => (
          <button key={v} onClick={()=>setFilter(v)}
            style={{padding:'6px 14px',borderRadius:99,border:'1px solid var(--border)',cursor:'pointer',fontSize:13,fontWeight:600,
              background:filter===v?'var(--primary)':'transparent',color:filter===v?'#fff':'var(--text2)'}}>
            {l}
          </button>
        ))}
      </div>

      {/* LISTE */}
      {loading ? (
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {[...Array(5)].map((_,i)=><div key={i} className="skeleton" style={{height:72,borderRadius:10}}/>)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{textAlign:'center',padding:60,color:'var(--text3)'}}>
          <div style={{fontSize:48,marginBottom:12}}>🎵</div>
          <p>Aucun contenu publié</p>
          <button onClick={()=>setPage('upload')} style={{marginTop:12,background:'var(--primary)',border:'none',color:'#fff',padding:'10px 24px',borderRadius:8,cursor:'pointer',fontWeight:600}}>
            Publier mon premier contenu
          </button>
        </div>
      ) : filtered.map(t => (
        <div key={t.id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',background:'var(--card)',borderRadius:10,border:'1px solid var(--border)',marginBottom:8}}>
          <div style={{width:52,height:52,borderRadius:8,background:'var(--card2)',overflow:'hidden',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22}}>
            {t.cover_url ? <img src={t.cover_url} style={{width:'100%',height:'100%',objectFit:'cover'}}/> : '🎵'}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:700,fontSize:14,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</div>
            <div style={{fontSize:12,color:'var(--text2)',marginTop:2,display:'flex',gap:8,flexWrap:'wrap'}}>
              <span style={{background:'var(--card2)',padding:'1px 6px',borderRadius:4}}>{t.content_type}</span>
              <span>{t.genre}</span>
              <span style={{color:t.access_type==='free'?'#2cc653':'var(--gold)',fontWeight:600}}>
                {t.access_type==='free'?'Gratuit':(t.sale_price||0).toLocaleString()+' KMF'}
              </span>
            </div>
          </div>
          <div style={{textAlign:'right',flexShrink:0}}>
            <div style={{fontSize:13,color:'#4d9fff',fontWeight:700,fontFamily:'monospace',marginBottom:6}}>{formatK(t.play_count||0)} 🎧</div>
            <div style={{display:'flex',gap:6}}>
              <button style={{background:'var(--card2)',border:'1px solid var(--border)',borderRadius:6,padding:'4px 10px',cursor:'pointer',fontSize:12,color:'var(--text2)'}}>✏️ Edit</button>
              <button onClick={()=>deleteTrack(t.id)} disabled={deleting===t.id}
                style={{background:'rgba(230,57,70,0.1)',border:'1px solid rgba(230,57,70,0.3)',borderRadius:6,padding:'4px 10px',cursor:'pointer',fontSize:12,color:'#e74c3c'}}>
                {deleting===t.id?'...':'🗑️'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
