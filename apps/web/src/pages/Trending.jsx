import { useState, useEffect } from 'react'
import { usePlayerStore, usePageStore } from '../stores/index.js'
import api from '../services/api.js'

const formatK = (n) => {
  if (!n) return '0'
  if (n >= 1000000) return (n/1000000).toFixed(1).replace('.0','') + 'M'
  if (n >= 1000) return (n/1000).toFixed(1).replace('.0','') + 'K'
  return n.toString()
}

const PERIODS = [['week','Cette semaine'],['month','Ce mois'],['all','Tout temps']]
const GENRES = ['Tous','Twarab','Afrobeats','Sebene','Amapiano','Slam','Mindset','Business','Gospel / Religion']

export default function Trending() {
  const { toggle, currentTrack, isPlaying } = usePlayerStore()
  const { setPage } = usePageStore()
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(true)
  const [genre, setGenre] = useState('Tous')
  const [period, setPeriod] = useState('all')

  useEffect(() => {
    setLoading(true)
    api.tracks.trending().then(res => {
      setTracks(res.tracks || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [period])

  const filtered = genre === 'Tous' ? tracks : tracks.filter(t => t.genre === genre)

  return (
    <div style={{maxWidth:900,margin:'0 auto',padding:'24px 20px 100px'}}>
      <div style={{marginBottom:24}}>
        <h1 style={{fontSize:26,fontWeight:800,margin:'0 0 4px'}}>Classement et Tendances</h1>
        <p style={{color:'var(--text2)',fontSize:14,margin:0}}>Les sons les plus ecoutes sur Waiichia</p>
      </div>

      {/* PERIODE */}
      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
        {PERIODS.map(([v,l]) => (
          <button key={v} onClick={() => setPeriod(v)}
            style={{padding:'7px 16px',borderRadius:99,border:'none',cursor:'pointer',fontWeight:600,fontSize:13,
              background:period===v ? 'var(--primary)' : 'var(--card)',
              color:period===v ? '#fff' : 'var(--text2)'}}>
            {l}
          </button>
        ))}
      </div>

      {/* GENRES */}
      <div style={{display:'flex',gap:8,marginBottom:24,overflowX:'auto',paddingBottom:4}}>
        {GENRES.map(g => (
          <button key={g} onClick={() => setGenre(g)}
            style={{padding:'5px 14px',borderRadius:99,border:'1px solid var(--border)',cursor:'pointer',fontSize:12,whiteSpace:'nowrap',
              background:genre===g ? 'var(--gold)' : 'transparent',
              color:genre===g ? '#000' : 'var(--text2)',fontWeight:genre===g?700:400}}>
            {g}
          </button>
        ))}
      </div>

      {/* TOP 3 */}
      {!loading && filtered.length >= 3 && (
        <div style={{display:'grid',gridTemplateColumns:'1fr 1.2fr 1fr',gap:12,marginBottom:32,alignItems:'flex-end'}}>
          {[filtered[1], filtered[0], filtered[2]].map((t, i) => {
            const rank = i === 1 ? 1 : i === 0 ? 2 : 3
            const isActive = currentTrack?.id === t.id
            const heights = [160, 200, 140]
            const colors = ['#c0c0c0','#f5a623','#cd7f32']
            return (
              <div key={t.id} onClick={() => toggle(t)}
                style={{background:'var(--card)',borderRadius:12,padding:16,border:`2px solid ${isActive?'var(--primary)':colors[i]}`,cursor:'pointer',textAlign:'center',height:heights[i],display:'flex',flexDirection:'column',justifyContent:'flex-end',position:'relative',overflow:'hidden'}}>
                {t.cover_url && <img src={t.cover_url} style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',objectFit:'cover',opacity:0.3}}/>}
                <div style={{position:'relative',zIndex:1}}>
                  <div style={{fontSize:28,fontWeight:900,color:colors[i]}}>#{rank}</div>
                  <div style={{fontWeight:700,fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</div>
                  <div style={{fontSize:11,color:'var(--text2)'}}>{t.profiles?.display_name}</div>
                  <div style={{fontSize:12,color:colors[i],fontWeight:700,marginTop:4}}>
                    {isActive && isPlaying ? '⏸ En cours' : formatK(t.play_count) + ' ecoutes'}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* LISTE COMPLETE */}
      {loading ? (
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {[...Array(8)].map((_,i) => <div key={i} className="skeleton" style={{height:64,borderRadius:10}}/>)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{textAlign:'center',padding:60,color:'var(--text3)'}}>
          <div style={{fontSize:48,marginBottom:12}}>🎵</div>
          <p>Aucun son pour ce genre</p>
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          {filtered.map((t, idx) => {
            const isActive = currentTrack?.id === t.id
            const medalColors = ['#f5a623','#c0c0c0','#cd7f32']
            return (
              <div key={t.id} onClick={() => toggle(t)}
                style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',borderRadius:10,cursor:'pointer',
                  background:isActive ? 'var(--card2)' : 'var(--card)',
                  border:`1px solid ${isActive ? 'var(--primary)' : 'var(--border)'}`,
                  transition:'all 0.2s'}}>
                <div style={{width:32,textAlign:'center',fontWeight:800,fontSize:14,
                  color:idx < 3 ? medalColors[idx] : 'var(--text3)'}}>
                  {idx < 3 ? ['1','2','3'][idx] : idx+1}
                </div>
                <div style={{width:44,height:44,borderRadius:8,background:'var(--card2)',overflow:'hidden',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>
                  {t.cover_url ? <img src={t.cover_url} style={{width:'100%',height:'100%',objectFit:'cover'}}/> : ''}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:14,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</div>
                  <div style={{fontSize:12,color:'var(--text2)'}}>{t.profiles?.display_name||'Artiste'} · {t.genre}</div>
                </div>
                <div style={{textAlign:'right',flexShrink:0}}>
                  <div style={{fontSize:13,fontWeight:700,color:'var(--gold)'}}>{formatK(t.play_count)}</div>
                  <div style={{fontSize:11,color:'var(--text3)'}}>ecoutes</div>
                </div>
                <div style={{fontSize:20,width:28,textAlign:'center',color:isActive&&isPlaying?'var(--primary)':'var(--text3)'}}>
                  {isActive && isPlaying ? '⏸' : '▶'}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
