import { useState, useEffect } from "react"
import { useAuthStore, usePlayerStore } from "../stores/index.js"
import { ReactionBar } from "../components/ReactionBar.jsx"
import ShareModal from "../components/ShareModal.jsx"
import AddToPlaylistModal from "../components/AddToPlaylistModal.jsx"
import PlaylistCreateModal from "../components/PlaylistCreateModal.jsx"
import api from "../services/api.js"

const TABS=['Sons','Albums','Playlists']
const GENRES=['Tout','🎵 Twarab','🥁 Sebene / Soukous','🌊 Afrobeats','🎶 Amapiano','🔥 Afrotrap','🌿 Coupé Décalé','🥁 Makossa','🌍 Afrohouse','🕌 Qasida','🎸 Reggae Afro','🏺 Traditionnel','🎤 Slam','🎹 RnB Africain']
const TAGS=['#moroni','#komori','#africanmusic','#twarab','#amapiano2026','#afrobeats','#newrelease','#exclusif','#prodAfrica','#liveset','#rap','#gospel','#ndombolo','#sebene']
const BGS=["linear-gradient(135deg,#0d2a3a,#1a5060)","linear-gradient(135deg,#1a0a2e,#3a1a6a)","linear-gradient(135deg,#002a10,#007040)","linear-gradient(135deg,#2e1a00,#7a4000)","linear-gradient(135deg,#1a0020,#5a0060)","linear-gradient(135deg,#001a2e,#005080)"]
const MOCK=Array.from({length:8},(_,i)=>({id:'m'+i,title:['Twarab ya Komori','Moroni by Night','Afrika Rising','Slam pour demain','Island Vibe','Komori Nights','Vibrate Africa','Zanzibar Flow'][i],profiles:{display_name:['Kolo Officiel','DJ Chami','Wally Afro','Poète Issa','East Mix','Nassim B.','Nadjib Pro','Studio KM'][i]},genre:['Twarab','Afrobeats','Afrobeats','Slam','Amapiano','Twarab','Afrobeats','Amapiano'][i],play_count:[24800,18200,12100,7200,9800,6100,15000,5400][i],access_type:i%3===0?'paid':'free',sale_price:i%3===0?2500:0,cover_url:null,type:'music'}))
const fmtK=n=>n>=1000?(n/1000).toFixed(1)+"K":String(n||0)

export default function Music(){
  const { user } = useAuthStore()
  const token = localStorage.getItem('waiichia_token')
  const {toggle,currentTrack,isPlaying,play,setQueue}=usePlayerStore()
  const [tab,setTab]=useState('Sons')
  const [genre,setGenre]=useState('Tout')
  const [activeTag,setActiveTag]=useState('#moroni')
  const [tracks,setTracks]=useState([])
  const [albums,setAlbums]=useState([])
  const [playlists,setPlaylists]=useState([])
  const [loading,setLoading]=useState(true)
  const [shareItem,setShareItem]=useState(null)
  const [shareType,setShareType]=useState('track')
  const [playlistTrack,setPlaylistTrack]=useState(null)
  const [showCreatePlaylist,setShowCreatePlaylist]=useState(false)

  useEffect(()=>{
    setLoading(true)
    if(tab==='Sons'){
      api.tracks.list('?type=music&limit=30')
        .then(d=>setTracks(d.tracks?.length?d.tracks:MOCK))
        .catch(()=>setTracks(MOCK))
        .finally(()=>setLoading(false))
    } else if(tab==='Albums'){
      api.get('/api/albums/')
        .then(d=>setAlbums(d.albums||d||[]))
        .catch(()=>setAlbums([]))
        .finally(()=>setLoading(false))
    } else if(tab==='Playlists'){
      api.get('/api/albums/playlists/public')
        .then(d=>setPlaylists(d.playlists||d||[]))
        .catch(()=>setPlaylists([]))
        .finally(()=>setLoading(false))
    }
  },[tab])

  const filtered=genre==='Tout'?tracks:tracks.filter(t=>t.genre?.toLowerCase().includes(genre.replace(/^[^ ]+ /,'').toLowerCase()))

  const playAlbum = async (album) => {
    try {
      const data = await api.get('/api/albums/' + album.id)
      const albumTracks = (data.album_tracks || [])
        .sort((a, b) => a.position - b.position)
        .map(at => at.tracks || at.track)
        .filter(Boolean)
      if (albumTracks.length > 0) { setQueue(albumTracks); play(albumTracks[0]) }
      else alert('Album vide')
    } catch (e) { alert('Erreur lecture album') }
  }

  const playPlaylist = async (pl) => {
    try {
      const data = await api.get('/api/albums/playlists/' + pl.id)
      const plTracks = (data.playlist_tracks || [])
        .sort((a, b) => a.position - b.position)
        .map(pt => pt.tracks || pt.track)
        .filter(Boolean)
      if (plTracks.length > 0) { setQueue(plTracks); play(plTracks[0]) }
      else alert('Playlist vide')
    } catch (e) { alert('Erreur lecture playlist') }
  }

  const openShare = (item, type) => { setShareItem(item); setShareType(type) }

  return(
    <div style={{paddingBottom:40}}>
      <div className="page-title">🎵 Musique</div>

      {/* Onglets */}
      <div className="tabs-bar">
        {TABS.map(t=><button key={t} className={`tab-btn${tab===t?' active':''}`} onClick={()=>setTab(t)}>{t}</button>)}
      </div>

      {/* ══════ ONGLET SONS ══════ */}
      {tab==='Sons' && <>
        <div style={{marginBottom:12}}>
          <div className="label" style={{marginBottom:8}}>Genres</div>
          <div className="genre-chips">
            {GENRES.map(g=><div key={g} className={`genre-chip${genre===g?' active':''}`} onClick={()=>setGenre(g)}>{g}</div>)}
          </div>
          <div className="label" style={{margin:'10px 0 6px'}}>Tags populaires</div>
          <div className="tags-wrap">
            {TAGS.map(t=><span key={t} className={`tag${activeTag===t?' active':''}`} onClick={()=>setActiveTag(t)}>{t}</span>)}
          </div>
        </div>

        {loading
          ?<div className="tracks-grid">{[...Array(6)].map((_,i)=><div key={i} style={{height:280,background:'var(--card)',borderRadius:'var(--radius)',border:'1px solid var(--border)',animation:'shimmer 1.5s infinite'}}/>)}</div>
          :<div className="tracks-grid">
            {filtered.map((t,i)=>(
              <div key={t.id} className="track-card">
                <div onClick={()=>toggle(t)}>
                  <div className="track-cover">
                    <div className="track-cover-bg" style={{background:BGS[i%6]}}>{t.cover_url?<img src={t.cover_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:"🎵"}</div>
                    <div className="type-badge type-music">{t.genre||'MUSIQUE'}</div>
                    <div className="play-overlay"><button className="play-btn-circle">{isPlaying&&currentTrack?.id===t.id?"⏸":"▶"}</button></div>
                  </div>
                  <div className="track-info">
                    <div className="track-title">{t.title}</div>
                    <div className="track-artist">{t.profiles?.display_name||'Artiste'}</div>
                    <div className="track-meta"><span>{fmtK(t.play_count||t.plays_count)} 🎧</span></div>
                  </div>
                </div>
                <div className="track-purchase-row">
                  {(!t.sale_price||t.access_type==='free')?<span className="free-chip">✓ Gratuit</span>
                    :<><button className="buy-chip buy-chip-buy">🛒 {t.sale_price?.toLocaleString()} KMF</button><button className="buy-chip buy-chip-rent">⏳ Louer</button></>}
                </div>
                {/* Boutons playlist + partage */}
                <div style={{display:'flex',gap:6,padding:'0 10px 8px'}}>
                  <button onClick={(e)=>{e.stopPropagation();setPlaylistTrack(t)}} style={{background:'none',border:'1px solid var(--border)',borderRadius:6,cursor:'pointer',fontSize:'0.75rem',padding:'3px 8px',color:'var(--text-secondary)'}}>➕ Playlist</button>
                  <button onClick={(e)=>{e.stopPropagation();openShare(t,'track')}} style={{background:'none',border:'1px solid var(--border)',borderRadius:6,cursor:'pointer',fontSize:'0.75rem',padding:'3px 8px',color:'var(--text-secondary)'}}>🔗 Partager</button>
                </div>
                <ReactionBar targetType="track" targetId={t.id} showComments={true}/>
              </div>
            ))}
          </div>
        }
      </>}

      {/* ══════ ONGLET ALBUMS ══════ */}
      {tab==='Albums' && (
        loading
          ?<div style={{textAlign:'center',padding:'3rem',color:'var(--text-secondary)'}}>Chargement...</div>
          :albums.length===0
            ?<div style={{textAlign:'center',padding:'3rem',color:'var(--text-secondary)'}}>Aucun album disponible</div>
            :<div className="tracks-grid">
              {albums.map((a,i)=>(
                <div key={a.id} className="track-card">
                  <div onClick={()=>playAlbum(a)}>
                    <div className="track-cover">
                      <div className="track-cover-bg" style={{background:a.cover_url?`url(${a.cover_url}) center/cover`:BGS[i%6]}}>{a.cover_url?null:"💿"}</div>
                      <div className="type-badge type-music">ALBUM</div>
                      <div className="play-overlay"><button className="play-btn-circle">▶</button></div>
                    </div>
                    <div className="track-info">
                      <div className="track-title">{a.title}</div>
                      <div className="track-artist">{a.profiles?.display_name||'Artiste'}</div>
                      <div className="track-meta"><span>{a.track_count||0} pistes</span></div>
                    </div>
                  </div>
                  <div style={{display:'flex',gap:6,padding:'6px 10px 8px'}}>
                    <button onClick={(e)=>{e.stopPropagation();openShare(a,'album')}} style={{background:'none',border:'1px solid var(--border)',borderRadius:6,cursor:'pointer',fontSize:'0.75rem',padding:'3px 8px',color:'var(--text-secondary)'}}>🔗 Partager</button>
                  </div>
                </div>
              ))}
            </div>
      )}

      {/* ══════ ONGLET PLAYLISTS ══════ */}
      {tab==='Playlists' && (
        <div>
          {/* Bouton créer playlist */}
          {token && (
            <div style={{marginBottom:'1rem'}}>
              <button
                onClick={()=>setShowCreatePlaylist(true)}
                className="tab-btn active"
                style={{fontSize:'0.85rem'}}
              >
                ➕ Créer une playlist
              </button>
            </div>
          )}

          {loading
            ?<div style={{textAlign:'center',padding:'3rem',color:'var(--text-secondary)'}}>Chargement...</div>
            :playlists.length===0
              ?<div style={{textAlign:'center',padding:'3rem',color:'var(--text-secondary)'}}>Aucune playlist publique</div>
              :<div className="tracks-grid">
                {playlists.map((pl,i)=>(
                  <div key={pl.id} className="track-card">
                    <div onClick={()=>playPlaylist(pl)}>
                      <div className="track-cover">
                        <div className="track-cover-bg" style={{background:pl.cover_url?`url(${pl.cover_url}) center/cover`:BGS[i%6]}}>{pl.cover_url?null:"🎶"}</div>
                        <div className="type-badge type-music">PLAYLIST</div>
                        <div className="play-overlay"><button className="play-btn-circle">▶</button></div>
                      </div>
                      <div className="track-info">
                        <div className="track-title">{pl.title}</div>
                        <div className="track-artist">{pl.profiles?.display_name||'Utilisateur'}</div>
                        <div className="track-meta"><span>{pl.track_count||0} sons</span></div>
                      </div>
                    </div>
                    <div style={{display:'flex',gap:6,padding:'6px 10px 8px'}}>
                      <button onClick={(e)=>{e.stopPropagation();openShare(pl,'playlist')}} style={{background:'none',border:'1px solid var(--border)',borderRadius:6,cursor:'pointer',fontSize:'0.75rem',padding:'3px 8px',color:'var(--text-secondary)'}}>🔗 Partager</button>
                    </div>
                  </div>
                ))}
              </div>
          }
        </div>
      )}

      {/* Modals */}
      <ShareModal isOpen={!!shareItem} onClose={()=>setShareItem(null)} item={shareItem} type={shareType} />
      <AddToPlaylistModal isOpen={!!playlistTrack} onClose={()=>setPlaylistTrack(null)} track={playlistTrack} />
      <PlaylistCreateModal isOpen={showCreatePlaylist} onClose={()=>{setShowCreatePlaylist(false);if(tab==='Playlists'){setLoading(true);api.get('/api/albums/playlists/public').then(d=>setPlaylists(d.playlists||d||[])).catch(()=>{}).finally(()=>setLoading(false))}}} />
    </div>
  )
}
