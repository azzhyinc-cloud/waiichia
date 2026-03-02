import { useState } from 'react'
import { useAuthStore, usePageStore } from '../stores/index.js'

const API = import.meta.env.VITE_API_URL

const MUSIC_GENRES = ['Twarab','Afrobeats','Sebene','Amapiano','Hip-Hop','RnB','Jazz','Gospel','Classique','Autre']
const PODCAST_CATS = ['Business','Mindset','Education','Culture','Politique','Religion','Tech','Sante','Sport','Autre']
const COUNTRIES = [['KM','Comores'],['FR','France'],['NG','Nigeria'],['SN','Senegal'],['CI','Cote Ivoire'],['MA','Maroc'],['TZ','Tanzanie']]
const ACCESS = [['free','Gratuit'],['purchase','Achat'],['rental','Location']]

const TYPES = [
  { id:'music',    icon:'🎵', label:'Musique',          desc:'Single, morceau, remix' },
  { id:'album',    icon:'💿', label:'Album',             desc:'Collection de morceaux' },
  { id:'podcast',  icon:'🎙️', label:'Podcast / Emission', desc:'Episode, interview, debat' },
  { id:'radio_live', icon:'📻', label:'Radio Live',      desc:'Stream audio en direct' },
]

export default function Upload() {
  const { user } = useAuthStore()
  const { setPage } = usePageStore()
  const [type, setType] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [audioFile, setAudioFile] = useState(null)
  const [coverFile, setCoverFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState('')
  const [tracks, setTracks] = useState([{ title:'', file:null, duration:'' }])

  const addTrack = () => setTracks(t => [...t, { title:'', file:null, duration:'' }])
  const removeTrack = (i) => setTracks(t => t.filter((_,idx)=>idx!==i))
  const updateTrack = (i, key, val) => setTracks(t => t.map((tr,idx)=>idx===i?{...tr,[key]:val}:tr))
  const [form, setForm] = useState({
    title:'', genre:'', category:'', description:'', country:'KM', language:'fr',
    access_type:'free', sale_price:'', preview_end_sec:30,
    episode_num:'', series_name:'', stream_url:'', featuring:''
  })

  const set = (k,v) => setForm(f => ({...f, [k]:v}))

  const token = localStorage.getItem('waiichia_token')
  const headers = { Authorization: 'Bearer ' + token }

  const uploadFile = async (file, endpoint) => {
    return new Promise((resolve, reject) => {
      const fd = new FormData(); fd.append('file', file)
      const xhr = new XMLHttpRequest()
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round(e.loaded/e.total*100))
          setMsg('Upload ' + Math.round(e.loaded/e.total*100) + '%...')
        }
      }
      xhr.onload = () => {
        const d = JSON.parse(xhr.responseText)
        if (xhr.status >= 400) reject(new Error(d.error))
        else resolve(d.url)
      }
      xhr.onerror = () => reject(new Error('Erreur reseau'))
      xhr.open('POST', API + endpoint)
      xhr.setRequestHeader('Authorization', 'Bearer ' + token)
      xhr.send(fd)
    })
  }

  const handleSubmit = async () => {
    if (!form.title) return setError('Le titre est requis')
    if (type !== 'radio_live' && !audioFile) return setError('Un fichier audio est requis')
    if (type === 'radio_live' && !form.stream_url) return setError("L URL du stream est requise")
    setLoading(true); setError(''); setMsg(''); setProgress(0)
    try {
      let audio_url = form.stream_url || ''
      let cover_url = ''
      if (audioFile) audio_url = await uploadFile(audioFile, '/api/upload/audio')
      // Upload pistes supplementaires album/podcast
      if ((type==='album'||type==='podcast') && tracks.some(t=>t.file)) {
        setMsg('Upload des pistes...')
        for (let i=0; i<tracks.length; i++) {
          const tr = tracks[i]
          if (!tr.file) continue
          const trUrl = await uploadFile(tr.file, '/api/upload/audio')
          // Creer une track separee pour chaque piste
          await fetch(API + '/api/tracks/', {
            method:'POST',
            headers: {'Content-Type':'application/json', Authorization:'Bearer '+token},
            body: JSON.stringify({
              title: tr.title || (type==='album'?'Piste '+(i+1):'Episode '+(i+1)),
              content_type: type,
              genre: payload.genre,
              country: payload.country,
              audio_url_128: trUrl,
              cover_url: cover_url||null,
              access_type: payload.access_type,
              sale_price: payload.sale_price,
              is_published: true,
            })
          })
        }
      }
      if (coverFile) { setMsg('Upload cover...'); cover_url = await uploadFile(coverFile, '/api/upload/cover') }
      setMsg('Publication...')
      const payload = {
        title: form.title,
        description: form.description,
        content_type: type,
        genre: form.genre || form.category,
        country: form.country,
        language: form.language,
        access_type: form.access_type,
        sale_price: form.access_type !== 'free' ? parseInt(form.sale_price)||0 : null,
        preview_end_sec: parseInt(form.preview_end_sec)||30,
        audio_url_128: audio_url,
        cover_url: cover_url || null,
        is_published: true,
      }
      const res = await fetch(API + '/api/tracks/', {
        method:'POST',
        headers: {'Content-Type':'application/json', ...headers},
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMsg('Publie avec succes !')
      setTimeout(() => setPage('profile'), 2000)
    } catch(e) { setError(e.message) }
    setLoading(false)
  }

  const inp = {background:'var(--card)',border:'1px solid var(--border)',borderRadius:8,padding:'10px 14px',color:'var(--text)',width:'100%',fontSize:14,boxSizing:'border-box'}
  const lbl = {display:'block',marginBottom:6,fontSize:13,color:'var(--text2)',fontWeight:600}

  if (!user) return (
    <div style={{textAlign:'center',padding:60}}>
      <div style={{fontSize:48,marginBottom:16}}>🔒</div>
      <h2>Connectez-vous pour publier</h2>
      <button onClick={()=>setPage('login')} style={{marginTop:16,background:'var(--primary)',border:'none',color:'#fff',padding:'10px 24px',borderRadius:8,cursor:'pointer'}}>Se connecter</button>
    </div>
  )

  return (
    <div style={{maxWidth:640,margin:'0 auto',padding:'24px 20px 100px'}}>
      <h1 style={{fontSize:24,fontWeight:800,marginBottom:4}}>Publier du contenu</h1>
      <p style={{color:'var(--text2)',fontSize:14,marginBottom:24}}>Partage ta creation avec le monde</p>

      {/* STEP 1 - CHOIX DU TYPE */}
      {!type ? (
        <div>
          <h2 style={{fontSize:16,fontWeight:700,marginBottom:16}}>Quel type de contenu veux-tu publier ?</h2>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            {TYPES.map(t => (
              <div key={t.id} onClick={() => setType(t.id)}
                style={{background:'var(--card)',borderRadius:14,padding:24,cursor:'pointer',border:'2px solid var(--border)',textAlign:'center',transition:'all 0.2s'}}>
                <div style={{fontSize:40,marginBottom:10}}>{t.icon}</div>
                <div style={{fontWeight:800,fontSize:16,marginBottom:4}}>{t.label}</div>
                <div style={{fontSize:12,color:'var(--text2)'}}>{t.desc}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          {/* HEADER TYPE */}
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:24,padding:'12px 16px',background:'var(--card)',borderRadius:10,border:'1px solid var(--border)'}}>
            <span style={{fontSize:24}}>{TYPES.find(t=>t.id===type)?.icon}</span>
            <div style={{flex:1}}>
              <div style={{fontWeight:700}}>{TYPES.find(t=>t.id===type)?.label}</div>
              <div style={{fontSize:12,color:'var(--text2)'}}>{TYPES.find(t=>t.id===type)?.desc}</div>
            </div>
            <button onClick={()=>{setType('');setError('');setMsg('')}}
              style={{background:'var(--card2)',border:'none',color:'var(--text2)',borderRadius:6,padding:'4px 10px',cursor:'pointer',fontSize:12}}>
              Changer
            </button>
          </div>

          {error && <div style={{background:'#2d0000',border:'1px solid #e74c3c',borderRadius:8,padding:'10px 14px',marginBottom:16,color:'#e74c3c',fontSize:13}}>{error}</div>}
          {msg && <div style={{background:'#002d00',border:'1px solid #2dc653',borderRadius:8,padding:'10px 14px',marginBottom:16,color:'#2dc653',fontSize:13}}>{msg}</div>}

          {/* INFOS COMMUNES */}
          <div style={{background:'var(--card)',borderRadius:12,padding:24,marginBottom:16,border:'1px solid var(--border)'}}>
            <h3 style={{margin:'0 0 16px',fontSize:15}}>
              {type==='music' && 'Infos du morceau'}
              {type==='album' && "Infos de l album"}
              {type==='podcast' && "Infos de l episode"}
              {type==='radio_live' && 'Infos de la radio'}
            </h3>

            <div style={{marginBottom:14}}>
              <label style={lbl}>
                {type==='music'&&'Titre du morceau *'}
                {type==='album'&&"Titre de l album *"}
                {type==='podcast'&&"Titre de l episode *"}
                {type==='radio_live'&&'Nom de la radio *'}
              </label>
              <input style={inp} value={form.title} onChange={e=>set('title',e.target.value)}
                placeholder={type==='music'?'ex: Twarab ya Moroni':type==='album'?"ex: Album Komori 2026":type==='podcast'?"ex: Episode 12 - Business en Afrique":'ex: Radio Komori FM'}/>
            </div>

            {/* GENRE selon type */}
            {(type==='music'||type==='album') && (
              <div style={{marginBottom:14}}>
                <label style={lbl}>Genre musical</label>
                <select style={inp} value={form.genre} onChange={e=>set('genre',e.target.value)}>
                  <option value="">Choisir un genre</option>
                  {MUSIC_GENRES.map(g=><option key={g}>{g}</option>)}
                </select>
              </div>
            )}

            {(type==='podcast') && (
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
                <div>
                  <label style={lbl}>Categorie</label>
                  <select style={inp} value={form.category} onChange={e=>set('category',e.target.value)}>
                    <option value="">Choisir</option>
                    {PODCAST_CATS.map(g=><option key={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Numero episode</label>
                  <input style={inp} type="number" value={form.episode_num} onChange={e=>set('episode_num',e.target.value)} placeholder="ex: 12"/>
                </div>
              </div>
            )}

            {type==='podcast' && (
              <div style={{marginBottom:14}}>
                <label style={lbl}>Nom de la serie / emission</label>
                <input style={inp} value={form.series_name} onChange={e=>set('series_name',e.target.value)} placeholder="ex: Business Africa Podcast"/>
              </div>
            )}

            <div style={{marginBottom:14}}>
              <label style={lbl}>Description</label>
              <textarea style={{...inp,height:type==='podcast'?100:70,resize:'vertical'}}
                value={form.description} onChange={e=>set('description',e.target.value)}
                placeholder={type==='podcast'?"Decris le sujet de cet episode...":'Decris ton contenu...'}/>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <div>
                <label style={lbl}>Pays</label>
                <select style={inp} value={form.country} onChange={e=>set('country',e.target.value)}>
                  {COUNTRIES.map(([v,l])=><option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Langue</label>
                <select style={inp} value={form.language} onChange={e=>set('language',e.target.value)}>
                  <option value="fr">Francais</option>
                  <option value="ar">Arabe</option>
                  <option value="sw">Swahili</option>
                  <option value="en">Anglais</option>
                  <option value="km">Comorien</option>
                </select>
              </div>
            </div>
          </div>

          {/* FICHIER AUDIO */}
          {type !== 'radio_live' ? (
            <div style={{background:'var(--card)',borderRadius:12,padding:24,marginBottom:16,border:'1px solid var(--border)'}}>
              <h3 style={{margin:'0 0 16px',fontSize:15}}>
                {type==='album' ? 'Fichier audio principal *' : 'Fichier audio *'}
              </h3>
              <label style={{display:'block',border:'2px dashed var(--border)',borderRadius:8,padding:24,textAlign:'center',cursor:'pointer',color:'var(--text2)'}}>
                <input type="file" accept="audio/*" style={{display:'none'}} onChange={e=>{const f=e.target.files[0];if(f)setAudioFile(f)}}/>
                {audioFile ? (
                  <div><div style={{fontSize:32,marginBottom:8}}>✅</div><strong>{audioFile.name}</strong><br/><span style={{fontSize:12}}>({(audioFile.size/1024/1024).toFixed(1)} MB)</span></div>
                ) : (
                  <div>
                    <div style={{fontSize:32,marginBottom:8}}>{type==='podcast'?'🎙️':'🎵'}</div>
                    <strong>Clique pour choisir un fichier</strong><br/>
                    <span style={{fontSize:12}}>MP3, WAV, FLAC, AAC (max 200MB)</span>
                  </div>
                )}
              </label>
            </div>
          ) : (
            <div style={{background:'var(--card)',borderRadius:12,padding:24,marginBottom:16,border:'1px solid var(--border)'}}>
              <h3 style={{margin:'0 0 16px',fontSize:15}}>URL du Stream *</h3>
              <input style={inp} value={form.stream_url} onChange={e=>set('stream_url',e.target.value)} placeholder="ex: https://stream.radiokomori.com/live"/>
              <p style={{fontSize:12,color:'var(--text2)',marginTop:8}}>URL HLS, Icecast, ou SHOUTcast de votre flux audio en direct</p>
            </div>
          )}

          {/* TRACKLIST - Album et Podcast */}
          {(type==='album'||type==='podcast') && (
            <div style={{background:'var(--card)',borderRadius:12,padding:24,marginBottom:16,border:'1px solid var(--border)'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                <h3 style={{margin:0,fontSize:15}}>
                  {type==='album' ? 'Pistes de l album' : 'Episodes / Parties'}
                </h3>
                <button onClick={addTrack}
                  style={{background:'var(--primary)',border:'none',color:'#fff',borderRadius:6,padding:'6px 14px',cursor:'pointer',fontSize:13,fontWeight:600}}>
                  + Ajouter
                </button>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {tracks.map((tr,i) => (
                  <div key={i} style={{background:'var(--card2)',borderRadius:10,padding:14,border:'1px solid var(--border)'}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                      <div style={{width:28,height:28,borderRadius:'50%',background:'var(--primary)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800,flexShrink:0}}>
                        {i+1}
                      </div>
                      <input
                        value={tr.title}
                        onChange={e=>updateTrack(i,'title',e.target.value)}
                        placeholder={type==='album'?'Titre de la piste...':'Titre de l episode...'}
                        style={{flex:1,background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'7px 10px',color:'var(--text)',fontSize:13}}/>
                      {tracks.length > 1 && (
                        <button onClick={()=>removeTrack(i)}
                          style={{background:'#2d0000',border:'1px solid #e74c3c',color:'#e74c3c',borderRadius:6,padding:'4px 10px',cursor:'pointer',fontSize:12,flexShrink:0}}>
                          ✕
                        </button>
                      )}
                    </div>
                    <label style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer',padding:'8px 10px',background:'var(--card)',borderRadius:6,border:'1px dashed var(--border)'}}>
                      <input type="file" accept="audio/*" style={{display:'none'}}
                        onChange={e=>{const f=e.target.files[0];if(f)updateTrack(i,'file',f)}}/>
                      <span style={{fontSize:16}}>{tr.file?'✅':'🎵'}</span>
                      <span style={{fontSize:12,color:tr.file?'var(--text)':'var(--text3)'}}>
                        {tr.file ? tr.file.name : 'Choisir un fichier audio...'}
                      </span>
                      {tr.file && <span style={{fontSize:11,color:'var(--text3)',marginLeft:'auto'}}>({(tr.file.size/1024/1024).toFixed(1)}MB)</span>}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* COVER */}
          <div style={{background:'var(--card)',borderRadius:12,padding:24,marginBottom:16,border:'1px solid var(--border)'}}>
            <h3 style={{margin:'0 0 16px',fontSize:15}}>
              {type==='album'?"Pochette de l album":type==='podcast'?'Visuel du podcast':'Image de couverture'}
              <span style={{fontSize:12,color:'var(--text3)',fontWeight:400,marginLeft:8}}>(optionnel)</span>
            </h3>
            <label style={{display:'block',border:'2px dashed var(--border)',borderRadius:8,padding:24,textAlign:'center',cursor:'pointer',color:'var(--text2)'}}>
              <input type="file" accept="image/*" style={{display:'none'}} onChange={e=>{const f=e.target.files[0];if(f){setCoverFile(f);setCoverPreview(URL.createObjectURL(f))}}}/>
              {coverPreview ? (
                <img src={coverPreview} style={{width:120,height:120,objectFit:'cover',borderRadius:8}}/>
              ) : (
                <div><div style={{fontSize:32,marginBottom:8}}>🖼️</div><strong>Ajouter une image</strong><br/><span style={{fontSize:12}}>JPG, PNG, WEBP - carre recommande</span></div>
              )}
            </label>
          </div>

          {/* MONETISATION - pas pour radio_live */}
          {type !== 'radio_live' && (
            <div style={{background:'var(--card)',borderRadius:12,padding:24,marginBottom:24,border:'1px solid var(--border)'}}>
              <h3 style={{margin:'0 0 16px',fontSize:15}}>Monetisation</h3>
              <div style={{display:'flex',gap:8,marginBottom:16}}>
                {ACCESS.map(([v,l])=>(
                  <button key={v} onClick={()=>set('access_type',v)}
                    style={{flex:1,padding:'10px',borderRadius:8,border:'2px solid',borderColor:form.access_type===v?'var(--primary)':'var(--border)',background:form.access_type===v?'var(--primary)':'var(--card)',color:'var(--text)',cursor:'pointer',fontSize:13,fontWeight:600}}>
                    {l}
                  </button>
                ))}
              </div>
              {form.access_type !== 'free' && (
                <div style={{marginBottom:14}}>
                  <label style={lbl}>Prix (KMF)</label>
                  <input style={inp} type="number" value={form.sale_price} onChange={e=>set('sale_price',e.target.value)} placeholder="ex: 1500"/>
                </div>
              )}
              <div>
                <label style={lbl}>Preview gratuit jusqu a (secondes)</label>
                <input style={inp} type="number" value={form.preview_end_sec} onChange={e=>set('preview_end_sec',e.target.value)} placeholder="30"/>
              </div>
            </div>
          )}

          {/* BOUTON PUBLIER */}
          <button onClick={handleSubmit} disabled={loading}
            style={{width:'100%',padding:'14px',background:loading?'var(--border)':'var(--primary)',border:'none',borderRadius:10,color:'#fff',fontSize:16,fontWeight:700,cursor:loading?'not-allowed':'pointer'}}>
            {loading ? 'Publication en cours...' : 'Publier ' + (TYPES.find(t=>t.id===type)?.label||'')}
          </button>

          {loading && progress > 0 && (
            <div style={{marginTop:16}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'var(--text2)',marginBottom:6}}>
                <span>{msg}</span>
                <span style={{fontWeight:700,color:'var(--primary)'}}>{progress}%</span>
              </div>
              <div style={{background:'var(--border)',borderRadius:99,height:8,overflow:'hidden'}}>
                <div style={{height:'100%',background:'linear-gradient(90deg,var(--primary),var(--gold))',borderRadius:99,width:progress+'%',transition:'width 0.3s'}}/>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
