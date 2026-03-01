import { useState } from 'react'
import { useAuthStore, usePageStore } from '../stores/index.js'
import api from '../services/api.js'

const GENRES = ['Twarab','Afrobeats','Sebene','Amapiano','Slam','Mindset','Business','Gospel / Religion','Hip-Hop','RnB','Jazz','Classique','Autre']
const TYPES = [['music','Musique'],['podcast','Podcast'],['audiobook','Livre audio'],['radio','Radio']]
const ACCESS = [['free','Gratuit'],['purchase','Achat'],['rental','Location']]

export default function Upload() {
  const { user } = useAuthStore()
  const { setPage } = usePageStore()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [audioFile, setAudioFile] = useState(null)
  const [coverFile, setCoverFile] = useState(null)
  const [audioUrl, setAudioUrl] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [coverPreview, setCoverPreview] = useState('')
  const [form, setForm] = useState({
    title: '', genre: 'Twarab', content_type: 'music',
    access_type: 'free', description: '', country: user?.country || 'KM',
    language: 'fr', sale_price: '', preview_end_sec: 30
  })
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [progress, setProgress] = useState(0)

  if (!user) return (
    <div style={{textAlign:'center',padding:60}}>
      <div style={{fontSize:48,marginBottom:16}}>🔒</div>
      <h2>Connectez-vous pour publier</h2>
      <button onClick={()=>setPage('login')} style={{marginTop:16,background:'var(--primary)',border:'none',color:'#fff',padding:'10px 24px',borderRadius:8,cursor:'pointer'}}>Se connecter</button>
    </div>
  )

  const set = (k,v) => setForm(f => ({...f, [k]:v}))

  const uploadAudio = async (file) => {
    setLoading(true); setMsg('Preparation...'); setProgress(0)
    const token = localStorage.getItem('waiichia_token')
    return new Promise((resolve, reject) => {
      const fd = new FormData(); fd.append('file', file)
      const xhr = new XMLHttpRequest()
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100)
          setProgress(pct)
          setMsg('Upload audio ' + pct + '%...')
        }
      }
      xhr.onload = () => {
        const data = JSON.parse(xhr.responseText)
        setLoading(false); setProgress(100)
        if (xhr.status >= 400) reject(new Error(data.error))
        else resolve(data.url)
      }
      xhr.onerror = () => reject(new Error('Erreur reseau'))
      xhr.open('POST', import.meta.env.VITE_API_URL + '/api/upload/audio')
      xhr.setRequestHeader('Authorization', 'Bearer ' + token)
      xhr.send(fd)
    })
  }

  const uploadCover = async (file) => {
    const fd = new FormData(); fd.append('file', file)
    const token = localStorage.getItem('waiichia_token')
    const res = await fetch(import.meta.env.VITE_API_URL + '/api/upload/cover', {
      method:'POST', headers:{Authorization:'Bearer '+token}, body: fd
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    return data.url
  }

  const handleSubmit = async () => {
    if (!form.title) return setError('Le titre est requis')
    if (!audioFile && !audioUrl) return setError('Un fichier audio est requis')
    setLoading(true); setError(''); setMsg('')
    try {
      let finalAudioUrl = audioUrl
      let finalCoverUrl = coverUrl
      if (audioFile) finalAudioUrl = await uploadAudio(audioFile)
      if (coverFile) { setMsg('Upload cover...'); finalCoverUrl = await uploadCover(coverFile) }
      setMsg('Creation du son...')
      const payload = {
        ...form,
        audio_url_128: finalAudioUrl,
        cover_url: finalCoverUrl || null,
        sale_price: form.access_type !== 'free' ? parseInt(form.sale_price) || 0 : null,
        preview_end_sec: parseInt(form.preview_end_sec) || 30,
        is_published: true
      }
      await api.tracks.create(payload)
      setMsg('Son publie avec succes!')
      setTimeout(() => setPage('profile'), 2000)
    } catch(e) {
      setError(e.message)
    }
    setLoading(false)
  }

  const onAudioChange = (e) => {
    const f = e.target.files[0]
    if (f) { setAudioFile(f); setAudioUrl('') }
  }

  const onCoverChange = (e) => {
    const f = e.target.files[0]
    if (f) {
      setCoverFile(f)
      setCoverPreview(URL.createObjectURL(f))
    }
  }

  const inp = {background:'var(--card)',border:'1px solid var(--border)',borderRadius:8,padding:'10px 14px',color:'var(--text)',width:'100%',fontSize:14,boxSizing:'border-box'}
  const lbl = {display:'block',marginBottom:6,fontSize:13,color:'var(--text2)',fontWeight:600}

  return (
    <div style={{maxWidth:640,margin:'0 auto',padding:'24px 20px 100px'}}>
      <h1 style={{fontSize:24,fontWeight:800,marginBottom:4}}>Publier un son</h1>
      <p style={{color:'var(--text2)',fontSize:14,marginBottom:24}}>Partage ta musique avec le monde</p>

      {error && <div style={{background:'#2d0000',border:'1px solid #e74c3c',borderRadius:8,padding:'10px 14px',marginBottom:16,color:'#e74c3c',fontSize:13}}>{error}</div>}
      {msg && <div style={{background:'#002d00',border:'1px solid #2dc653',borderRadius:8,padding:'10px 14px',marginBottom:16,color:'#2dc653',fontSize:13}}>{msg}</div>}

      <div style={{background:'var(--card)',borderRadius:12,padding:24,marginBottom:16,border:'1px solid var(--border)'}}>
        <h3 style={{margin:'0 0 16px',fontSize:16}}>1. Infos principales</h3>
        <div style={{marginBottom:14}}>
          <label style={lbl}>Titre *</label>
          <input style={inp} value={form.title} onChange={e=>set('title',e.target.value)} placeholder="Nom de ton son"/>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
          <div>
            <label style={lbl}>Genre</label>
            <select style={inp} value={form.genre} onChange={e=>set('genre',e.target.value)}>
              {GENRES.map(g=><option key={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Type</label>
            <select style={inp} value={form.content_type} onChange={e=>set('content_type',e.target.value)}>
              {TYPES.map(([v,l])=><option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        </div>
        <div style={{marginBottom:14}}>
          <label style={lbl}>Description</label>
          <textarea style={{...inp,height:80,resize:'vertical'}} value={form.description} onChange={e=>set('description',e.target.value)} placeholder="Decris ton son..."/>
        </div>
      </div>

      <div style={{background:'var(--card)',borderRadius:12,padding:24,marginBottom:16,border:'1px solid var(--border)'}}>
        <h3 style={{margin:'0 0 16px',fontSize:16}}>2. Fichier audio *</h3>
        <label style={{display:'block',border:'2px dashed var(--border)',borderRadius:8,padding:24,textAlign:'center',cursor:'pointer',color:'var(--text2)'}}>
          <input type="file" accept="audio/*" style={{display:'none'}} onChange={onAudioChange}/>
          {audioFile ? (
            <div><div style={{fontSize:32,marginBottom:8}}>✅</div><strong>{audioFile.name}</strong><br/><span style={{fontSize:12}}>({(audioFile.size/1024/1024).toFixed(1)} MB)</span></div>
          ) : (
            <div><div style={{fontSize:32,marginBottom:8}}>🎵</div><strong>Clique pour choisir un fichier</strong><br/><span style={{fontSize:12}}>MP3, WAV, FLAC, AAC (max 200MB)</span></div>
          )}
        </label>
      </div>

      <div style={{background:'var(--card)',borderRadius:12,padding:24,marginBottom:16,border:'1px solid var(--border)'}}>
        <h3 style={{margin:'0 0 16px',fontSize:16}}>3. Cover (optionnel)</h3>
        <label style={{display:'block',border:'2px dashed var(--border)',borderRadius:8,padding:24,textAlign:'center',cursor:'pointer',color:'var(--text2)'}}>
          <input type="file" accept="image/*" style={{display:'none'}} onChange={onCoverChange}/>
          {coverPreview ? (
            <img src={coverPreview} style={{width:120,height:120,objectFit:'cover',borderRadius:8}}/>
          ) : (
            <div><div style={{fontSize:32,marginBottom:8}}>🖼️</div><strong>Ajouter une image</strong><br/><span style={{fontSize:12}}>JPG, PNG, WEBP</span></div>
          )}
        </label>
      </div>

      <div style={{background:'var(--card)',borderRadius:12,padding:24,marginBottom:24,border:'1px solid var(--border)'}}>
        <h3 style={{margin:'0 0 16px',fontSize:16}}>4. Monetisation</h3>
        <div style={{display:'flex',gap:8,marginBottom:16}}>
          {ACCESS.map(([v,l])=>(
            <button key={v} onClick={()=>set('access_type',v)}
              style={{flex:1,padding:'10px',borderRadius:8,border:'2px solid',borderColor:form.access_type===v?'var(--primary)':'var(--border)',background:form.access_type===v?'var(--primary)':'var(--card)',color:'var(--text)',cursor:'pointer',fontSize:13,fontWeight:600}}>
              {l}
            </button>
          ))}
        </div>
        {form.access_type !== 'free' && (
          <div>
            <label style={lbl}>Prix (KMF)</label>
            <input style={inp} type="number" value={form.sale_price} onChange={e=>set('sale_price',e.target.value)} placeholder="ex: 1500"/>
          </div>
        )}
        <div style={{marginTop:14}}>
          <label style={lbl}>Preview gratuit jusqu'a (secondes)</label>
          <input style={inp} type="number" value={form.preview_end_sec} onChange={e=>set('preview_end_sec',e.target.value)} placeholder="30"/>
        </div>
      </div>

      <button onClick={handleSubmit} disabled={loading}
        style={{width:'100%',padding:'14px',background:loading?'var(--border)':'var(--primary)',border:'none',borderRadius:10,color:'#fff',fontSize:16,fontWeight:700,cursor:loading?'not-allowed':'pointer'}}>
        {loading ? 'Publication en cours...' : 'Publier maintenant'}
      </button>
      {loading && progress > 0 && (
        <div style={{marginTop:16}}>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'var(--text2)',marginBottom:6}}>
            <span>Upload en cours...</span>
            <span style={{fontWeight:700,color:'var(--primary)'}}>{progress}%</span>
          </div>
          <div style={{background:'var(--border)',borderRadius:99,height:8,overflow:'hidden'}}>
            <div style={{height:'100%',background:'linear-gradient(90deg,var(--primary),var(--gold))',borderRadius:99,width:progress+'%',transition:'width 0.3s ease'}}/>
          </div>
          <div style={{fontSize:11,color:'var(--text3)',marginTop:4,textAlign:'center'}}>
            {progress < 100 ? 'Ne fermez pas cette page...' : 'Traitement en cours...'}
          </div>
        </div>
      )}
    </div>
  )
}
