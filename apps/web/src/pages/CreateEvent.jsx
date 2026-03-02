import { useState } from 'react'
import { usePageStore, useAuthStore } from '../stores/index.js'

const API = import.meta.env.VITE_API_URL
const TYPES = [['concert','🎤 Concert'],['festival','🎪 Festival'],['soiree','🌙 Soiree'],['conference','💼 Conference Business'],['atelier','🎓 Atelier / Workshop']]
const PAYS = [['KM','Comores'],['FR','France'],['NG','Nigeria'],['SN','Senegal'],['CI','Cote Ivoire'],['MG','Madagascar']]

export default function CreateEvent() {
  const { setPage } = usePageStore()
  const { user } = useAuthStore()
  const [form, setForm] = useState({ title:'', description:'', type:'concert', location:'', country:'KM', event_date:'', event_time:'20:00', ticket_price:'', is_free:true, capacity:'', ticket_url:'' })
  const [loading, setLoading] = useState(false)
  const [coverFile, setCoverFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState('')
  const [error, setError] = useState('')
  const set = (k,v) => setForm(f => ({...f, [k]:v}))
  const token = localStorage.getItem('waiichia_token')
  const inp = {background:'var(--card)',border:'1px solid var(--border)',borderRadius:8,padding:'10px 14px',color:'var(--text)',width:'100%',fontSize:14,boxSizing:'border-box'}
  const lbl = {display:'block',marginBottom:6,fontSize:13,color:'var(--text2)',fontWeight:600}

  if (!user) return (
    <div style={{textAlign:'center',padding:60}}>
      <div style={{fontSize:48,marginBottom:16}}>🔒</div>
      <h2>Connectez-vous pour creer un evenement</h2>
      <button onClick={()=>setPage('login')} style={{marginTop:16,background:'var(--primary)',border:'none',color:'#fff',padding:'10px 24px',borderRadius:8,cursor:'pointer'}}>Se connecter</button>
    </div>
  )

  const handleSubmit = async () => {
    if (!form.title) return setError('Le titre est requis')
    if (!form.event_date) return setError('La date est requise')
    if (!form.location) return setError('Le lieu est requis')
    if (!form.is_free && !form.ticket_price) return setError('Indiquez le prix du billet')
    setLoading(true); setError('')
    try {
      let cover_url = null
      if (coverFile) {
        const fd = new FormData(); fd.append('file', coverFile)
        const r = await fetch(API + '/api/upload/cover', { method:'POST', headers:{'Authorization':'Bearer '+token}, body:fd })
        const d = await r.json()
        cover_url = d.url || null
      }
      const event_date = form.event_date + 'T' + form.event_time + ':00'
      const res = await fetch(API + '/api/events/', {
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          event_type: form.type,
          location: form.location,
          country: form.country,
          event_date,
          ticket_price: form.is_free ? 0 : parseInt(form.ticket_price)||0,
          is_free: form.is_free,
          capacity: form.capacity ? parseInt(form.capacity) : null,
          ticket_url: form.ticket_url || null,
          cover_url,
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPage('events')
    } catch(e) { setError(e.message) }
    setLoading(false)
  }

  return (
    <div style={{maxWidth:600,margin:'0 auto',padding:'24px 20px 100px'}}>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:24}}>
        <button onClick={()=>setPage('events')} style={{background:'var(--card)',border:'1px solid var(--border)',color:'var(--text)',borderRadius:8,padding:'7px 14px',cursor:'pointer',fontSize:13}}>← Retour</button>
        <h1 style={{fontSize:22,fontWeight:800,margin:0}}>Creer un evenement</h1>
      </div>

      {error && <div style={{background:'#2d0000',border:'1px solid #e74c3c',borderRadius:8,padding:'10px 14px',marginBottom:16,color:'#e74c3c',fontSize:13}}>{error}</div>}

      {/* TYPE */}
      <div style={{background:'var(--card)',borderRadius:12,padding:20,marginBottom:16,border:'1px solid var(--border)'}}>
        <h3 style={{margin:'0 0 14px',fontSize:15}}>Type d evenement</h3>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {TYPES.map(([v,l]) => (
            <div key={v} onClick={()=>set('type',v)}
              style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',borderRadius:8,cursor:'pointer',
                background:form.type===v?'rgba(245,166,35,0.1)':'var(--card2)',
                border:`1px solid ${form.type===v?'var(--gold)':'var(--border)'}`}}>
              <div style={{fontSize:16}}>{l.split(' ')[0]}</div>
              <div style={{fontWeight:600,fontSize:14}}>{l.slice(3)}</div>
              {form.type===v && <div style={{marginLeft:'auto',color:'var(--gold)'}}>✓</div>}
            </div>
          ))}
        </div>
      </div>

      {/* INFOS */}
      <div style={{background:'var(--card)',borderRadius:12,padding:20,marginBottom:16,border:'1px solid var(--border)'}}>
        <h3 style={{margin:'0 0 14px',fontSize:15}}>Informations</h3>
        <div style={{marginBottom:12}}>
          <label style={lbl}>Titre *</label>
          <input style={inp} value={form.title} onChange={e=>set('title',e.target.value)} placeholder="ex: Concert Kolo Officiel — Moroni"/>
        </div>
        <div style={{marginBottom:12}}>
          <label style={lbl}>Description</label>
          <textarea style={{...inp,height:80,resize:'vertical'}} value={form.description} onChange={e=>set('description',e.target.value)} placeholder="Decrivez votre evenement..."/>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
          <div>
            <label style={lbl}>Date *</label>
            <input style={inp} type="date" value={form.event_date} onChange={e=>set('event_date',e.target.value)}/>
          </div>
          <div>
            <label style={lbl}>Heure *</label>
            <input style={inp} type="time" value={form.event_time} onChange={e=>set('event_time',e.target.value)}/>
          </div>
        </div>
        <div style={{marginBottom:12}}>
          <label style={lbl}>Lieu *</label>
          <input style={inp} value={form.location} onChange={e=>set('location',e.target.value)} placeholder="ex: Palais du Peuple, Moroni"/>
        </div>
        <div>
          <label style={lbl}>Pays</label>
          <select style={inp} value={form.country} onChange={e=>set('country',e.target.value)}>
            {PAYS.map(([v,l])=><option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>

      {/* IMAGE */}
      <div style={{background:'var(--card)',borderRadius:12,padding:20,marginBottom:16,border:'1px solid var(--border)'}}>
        <h3 style={{margin:'0 0 6px',fontSize:15}}>Image de l evenement</h3>
        <p style={{fontSize:12,color:'var(--text3)',margin:'0 0 14px'}}>Recommande : 1200x630px (ratio 16/9) · JPG ou PNG · max 5MB</p>
        <label style={{display:'block',border:'2px dashed var(--border)',borderRadius:10,padding:coverPreview?0:24,textAlign:'center',cursor:'pointer',overflow:'hidden'}}>
          <input type="file" accept="image/*" style={{display:'none'}} onChange={e=>{const f=e.target.files[0];if(f){setCoverFile(f);setCoverPreview(URL.createObjectURL(f))}}}/>
          {coverPreview ? (
            <div style={{position:'relative'}}>
              <img src={coverPreview} style={{width:'100%',maxHeight:200,objectFit:'cover',display:'block'}}/>
              <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.4)',display:'flex',alignItems:'center',justifyContent:'center',opacity:0,transition:'opacity 0.2s'}}
                onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=0}>
                <span style={{color:'#fff',fontWeight:600}}>Changer l image</span>
              </div>
            </div>
          ) : (
            <div>
              <div style={{fontSize:36,marginBottom:8}}>🖼️</div>
              <strong style={{fontSize:14}}>Ajouter une image</strong>
              <div style={{fontSize:12,color:'var(--text3)',marginTop:4}}>Cliquez pour choisir</div>
            </div>
          )}
        </label>
      </div>

      {/* BILLETS */}
      <div style={{background:'var(--card)',borderRadius:12,padding:20,marginBottom:16,border:'1px solid var(--border)'}}>
        <h3 style={{margin:'0 0 14px',fontSize:15}}>Billets et acces</h3>
        <div style={{display:'flex',gap:8,marginBottom:14}}>
          <button onClick={()=>set('is_free',true)}
            style={{flex:1,padding:'10px',borderRadius:8,border:`2px solid ${form.is_free?'#2cc653':'var(--border)'}`,background:form.is_free?'rgba(44,198,83,0.1)':'var(--card)',color:form.is_free?'#2cc653':'var(--text2)',cursor:'pointer',fontWeight:700,fontSize:13}}>
            ✅ Gratuit
          </button>
          <button onClick={()=>set('is_free',false)}
            style={{flex:1,padding:'10px',borderRadius:8,border:`2px solid ${!form.is_free?'var(--gold)':'var(--border)'}`,background:!form.is_free?'rgba(245,166,35,0.1)':'var(--card)',color:!form.is_free?'var(--gold)':'var(--text2)',cursor:'pointer',fontWeight:700,fontSize:13}}>
            🎫 Payant
          </button>
        </div>
        {!form.is_free && (
          <>
            <div style={{marginBottom:12}}>
              <label style={lbl}>Prix du billet (KMF) *</label>
              <input style={inp} type="number" value={form.ticket_price} onChange={e=>set('ticket_price',e.target.value)} placeholder="ex: 2000"/>
            </div>
            <div style={{marginBottom:12}}>
              <label style={lbl}>Lien billetterie externe (optionnel)</label>
              <input style={inp} value={form.ticket_url} onChange={e=>set('ticket_url',e.target.value)} placeholder="https://..."/>
            </div>
          </>
        )}
        <div>
          <label style={lbl}>Capacite max (optionnel)</label>
          <input style={inp} type="number" value={form.capacity} onChange={e=>set('capacity',e.target.value)} placeholder="ex: 500"/>
        </div>
      </div>

      <button onClick={handleSubmit} disabled={loading}
        style={{width:'100%',padding:'14px',background:loading?'var(--border)':'var(--primary)',border:'none',borderRadius:10,color:'#fff',fontSize:16,fontWeight:700,cursor:loading?'not-allowed':'pointer'}}>
        {loading ? 'Creation en cours...' : '🎪 Publier l evenement'}
      </button>
    </div>
  )
}
