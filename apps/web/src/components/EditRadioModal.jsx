import { useState } from 'react'
import api from "../services/api.js"

export default function EditRadioModal({ station, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: station?.name || '',
    description: station?.description || '',
    stream_url: station?.stream_url || '',
    logo_url: station?.logo_url || '',
    country: station?.country || 'KM',
    language: station?.language || 'fr',
    genre: station?.genre || ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async () => {
    setError('')
    if (!form.name.trim()) { setError('Le nom est obligatoire'); return }
    if (!form.stream_url.trim()) { setError("L'URL du flux est obligatoire"); return }
    setSaving(true)
    try {
      const r = await api.radio.update(station.id, form)
      if (r && r.station) {
        if (onSaved) onSaved(r.station)
        onClose()
      } else {
        setError((r && r.error) || 'Erreur inconnue')
      }
    } catch (e) {
      setError(e.message || 'Erreur reseau')
    } finally {
      setSaving(false)
    }
  }

  if (!station) return null

  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div onClick={e => e.stopPropagation()} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:24,maxWidth:560,width:'100%',maxHeight:'90vh',overflow:'auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <h2 style={{fontFamily:'Syne,sans-serif',fontSize:22,margin:0}}>✏️ Modifier la radio</h2>
          <button onClick={onClose} style={{background:'none',border:'none',color:'var(--text2)',fontSize:28,cursor:'pointer',lineHeight:1}}>×</button>
        </div>

        <div className="form-group" style={{marginBottom:12}}>
          <label className="label">Nom *</label>
          <input className="input-field" value={form.name} onChange={set('name')} />
        </div>

        <div className="form-group" style={{marginBottom:12}}>
          <label className="label">Description</label>
          <textarea className="textarea-field" rows={3} value={form.description} onChange={set('description')} />
        </div>

        <div className="form-group" style={{marginBottom:12}}>
          <label className="label">URL du flux audio *</label>
          <input className="input-field" value={form.stream_url} onChange={set('stream_url')} placeholder="https://..." />
          <div style={{fontSize:12,color:'var(--text2)',marginTop:4}}>💡 Préférez une URL en https:// quand c'est possible.</div>
        </div>

        <div className="form-group" style={{marginBottom:12}}>
          <label className="label">URL du logo</label>
          <input className="input-field" value={form.logo_url} onChange={set('logo_url')} placeholder="https://..." />
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
          <div className="form-group">
            <label className="label">Pays</label>
            <input className="input-field" value={form.country} onChange={set('country')} maxLength={2} />
          </div>
          <div className="form-group">
            <label className="label">Langue</label>
            <input className="input-field" value={form.language} onChange={set('language')} maxLength={5} />
          </div>
        </div>

        <div className="form-group" style={{marginBottom:20}}>
          <label className="label">Genre</label>
          <input className="input-field" value={form.genre} onChange={set('genre')} placeholder="Pop, Variete, Religieux..." />
        </div>

        {error && (
          <div style={{background:'rgba(239,68,68,0.1)',border:'1px solid var(--red)',color:'var(--red)',padding:10,borderRadius:'var(--radius-sm)',marginBottom:12,fontSize:13}}>
            ⚠️ {error}
          </div>
        )}

        <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
          <button className="btn btn-outline" onClick={onClose} disabled={saving}>Annuler</button>
          <button className="btn btn-primary" onClick={submit} disabled={saving}>
            {saving ? '⏳ Enregistrement...' : '💾 Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}
