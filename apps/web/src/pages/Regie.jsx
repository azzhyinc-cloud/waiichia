import { useState, useEffect } from 'react'
import { useAuthStore, usePageStore } from '../stores/index.js'
import api from '../services/api.js'

const FORMATS = [
  { icon:'🎵', name:'Audio Ad', desc:'15-30s entre les sons' },
  { icon:'🖼️', name:'Banner', desc:'Bandeau visuel' },
  { icon:'📱', name:'Interstitiel', desc:'Plein ecran mobile' },
  { icon:'🎙️', name:'Podcast Sponsoring', desc:'Mention dans un podcast' },
  { icon:'⭐', name:'Contenu Sponsorise', desc:'Post promu dans le fil' },
  { icon:'📡', name:'Sponsoring Radio', desc:'Association emission live' },
]
const PAYS_CIBLES = [
  ['KM','🇰🇲 Comores'],['MG','🇲🇬 Madagascar'],['TZ','🇹🇿 Tanzanie'],['RW','🇷🇼 Rwanda'],
  ['CI','🇨🇮 Cote d Ivoire'],['NG','🇳🇬 Nigeria'],['CD','🇨🇩 RD Congo'],['SN','🇸🇳 Senegal'],
  ['GH','🇬🇭 Ghana'],['CM','🇨🇲 Cameroun'],['ALL','🌍 Toute l Afrique'],
]
const GENRES = ['Twarab','Afrobeats','Podcast','Slam','Gospel','Business','Education','Mindset','Amapiano','Rap']
const PLACEMENTS = ['🏠 Accueil','🔥 Tendances','📻 Radio Live','🎵 Lecteur audio','📡 Fil activite','💿 Albums','🛍️ Boutique','🎙️ Podcasts']
const OBJECTIFS = [
  { icon:'👁️', name:'Notoriete', desc:'Impressions max' },
  { icon:'🖱️', name:'Trafic', desc:'Clics max' },
  { icon:'🛒', name:'Conversion', desc:'Achats / Inscriptions' },
]

const STATUS_COLORS = { active:'#2cc653', paused:'#f5a623', draft:'#888', ended:'#4d9fff' }
const STATUS_LABELS = { active:'ACTIF', paused:'PAUSE', draft:'BROUILLON', ended:'TERMINE' }
const inp = {background:'var(--card)',border:'1px solid var(--border)',borderRadius:8,padding:'10px 14px',color:'var(--text)',width:'100%',fontSize:14,boxSizing:'border-box'}
const lbl = {display:'block',fontSize:11,fontWeight:700,letterSpacing:1,color:'var(--text3)',marginBottom:6}

function BarChart({ data, color }) {
  const max = Math.max(...data, 1)
  return (
    <div style={{display:'flex',alignItems:'flex-end',gap:4,height:80,marginTop:12}}>
      {data.map((v,i) => (
        <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3,height:'100%',justifyContent:'flex-end'}}>
          <div style={{width:'100%',background:color,borderRadius:'3px 3px 0 0',height:Math.max((v/max)*70,3)+'px',opacity:0.6+((i/data.length)*0.4)}}/>
          <div style={{fontSize:9,color:'var(--text3)'}}>{'LMMJVSD'[i%7]}</div>
        </div>
      ))}
    </div>
  )
}
function ProgressBar({ label, pct, color }) {
  return (
    <div style={{marginBottom:10}}>
      <div style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:4}}>
        <span style={{color:'var(--text2)'}}>{label}</span>
        <span style={{color,fontWeight:700,fontFamily:'monospace'}}>{pct}%</span>
      </div>
      <div style={{background:'var(--border)',borderRadius:99,height:7,overflow:'hidden'}}>
        <div style={{width:pct+'%',height:'100%',background:color,borderRadius:99}}/>
      </div>
    </div>
  )
}

export default function Regie() {
  const { user } = useAuthStore()
  const { setPage } = usePageStore()
  const [tab, setTab] = useState('overview')
  const [campaigns, setCampaigns] = useState([])
  const [statsData, setStatsData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [step, setStep] = useState(1)
  const [selFormat, setSelFormat] = useState(0)
  const [selObjectif, setSelObjectif] = useState(0)
  const [selPays, setSelPays] = useState(['KM'])
  const [selGenres, setSelGenres] = useState(['Twarab','Afrobeats'])
  const [selPlacements, setSelPlacements] = useState(['🏠 Accueil','🔥 Tendances'])
  const [form, setForm] = useState({ name:'', titre:'', desc:'', url:'', age:'18-24 ans', genre:'Tous', budget:'', devise:'KMF', dateDebut:'', dateFin:'', typeBudget:'Budget journalier' })
  const [launched, setLaunched] = useState(false)
  const set = (k,v) => setForm(f=>({...f,[k]:v}))
  const toggle = (arr, setArr, val) => setArr(a => a.includes(val) ? a.filter(x=>x!==val) : [...a,val])

  useEffect(() => { if(user) loadData() }, [user])
  const loadData = async () => {
    setLoading(true)
    try {
      const [camp, stats] = await Promise.all([api.campaigns.list(), api.campaigns.stats()])
      setCampaigns(camp.campaigns || [])
      setStatsData(stats.stats || null)
    } catch(e) {}
    setLoading(false)
  }
  const TABS = [['overview','📊 Vue ensemble'],['campaigns','📋 Mes Campagnes'],['create','➕ Creer'],['analytics','📈 Analytics'],['billing','💳 Facturation']]
  const filteredCampaigns = filterStatus ? campaigns.filter(c=>c.status===filterStatus) : campaigns
  const impData = [42,55,38,72,65,80,58,90,75,68,85,92,78,70,88,95,82,76,90,85,70,78,88,92,80,75,85,90,82,78]
  const clickData = [8,12,7,15,14,18,11,20,16,14,19,22,17,15,20,24,19,17,21,20,16,18,20,22,19,17,20,22,19,18]
  const launchCampaign = async () => {
    try {
      const res = await api.campaigns.create({
        name: form.name || 'Nouvelle campagne',
        format: FORMATS[selFormat].name,
        titre: form.titre,
        description: form.desc,
        url_destination: form.url,
        objectif: ['notoriete','trafic','conversion'][selObjectif],
        budget: parseInt(form.budget) || 5000,
        budget_type: form.typeBudget,
        devise: form.devise,
        pays: selPays,
        genres: selGenres,
        placements: selPlacements,
        age_range: form.age,
        genre_cible: form.genre,
        date_debut: form.dateDebut,
        date_fin: form.dateFin,
      })
      setCampaigns(c => [res.campaign, ...c])
      setLaunched(true)
      setTimeout(()=>{ setLaunched(false); setTab('campaigns'); setStep(1) }, 2500)
    } catch(e) { alert('Erreur: ' + e.message) }
  }
  if(!user) return <div style={{textAlign:'center',padding:80}}><div style={{fontSize:56}}>📢</div><button onClick={()=>setPage('login')} style={{marginTop:16,background:'var(--primary)',border:'none',color:'#fff',padding:'10px 24px',borderRadius:8,cursor:'pointer'}}>Se connecter</button></div>
  return (
    <div style={{padding:'24px 20px 100px'}}>
      <h1 style={{fontSize:24,fontWeight:900,margin:'0 0 20px'}}>📢 Regie Publicitaire Waiichia</h1>
      <div style={{display:'flex',gap:3,background:'var(--card)',borderRadius:10,padding:4,border:'1px solid var(--border)',marginBottom:24,flexWrap:'wrap'}}>
        {TABS.map(([v,l])=>(
          <button key={v} onClick={()=>{setTab(v);if(v==='create')setStep(1)}}
            style={{flex:1,padding:'8px 10px',borderRadius:7,border:'none',cursor:'pointer',fontSize:13,fontWeight:700,minWidth:80,
              background:tab===v?'linear-gradient(135deg,var(--gold),#e8920a)':'transparent',color:tab===v?'#000':'var(--text2)'}}>
            {l}
          </button>
        ))}
      </div>

      {tab==='overview' && (
        <div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:12,marginBottom:24}}>
            {[{icon:'👁️',val:statsData?(statsData.total_impressions/1000).toFixed(0)+'K':'0',label:'IMPRESSIONS TOTALES',change:'',up:true,color:'#f5a623'},{icon:'🖱️',val:statsData?(statsData.total_clicks/1000).toFixed(1)+'K':'0',label:'CLICS TOTAUX',change:'',up:true,color:'#4d9fff'},{icon:'📊',val:statsData?statsData.ctr+'%':'0%',label:'CTR MOYEN',change:'',up:true,color:'#2cc653'},{icon:'💸',val:statsData?(statsData.total_spent/1000).toFixed(1)+'K':'0',label:'DEPENSES (KMF)',change:'',up:false,color:'#e74c3c'}].map((k,i)=>(
              <div key={i} style={{background:'var(--card)',borderRadius:12,padding:18,border:'1px solid var(--border)'}}>
                <div style={{fontSize:28,marginBottom:8}}>{k.icon}</div>
                <div style={{fontSize:26,fontWeight:900,color:k.color,fontFamily:'monospace'}}>{k.val}</div>
                <div style={{fontSize:11,fontWeight:700,letterSpacing:1,color:'var(--text3)',margin:'4px 0'}}>{k.label}</div>
                <div style={{fontSize:12,fontWeight:700,color:k.up?'#2cc653':'#e74c3c'}}>{k.up?'▲':'▼'} {k.change}</div>
              </div>
            ))}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
            <div style={{background:'var(--card)',borderRadius:12,padding:20,border:'1px solid var(--border)'}}>
              <div style={{fontWeight:700,fontSize:14}}>📊 Impressions — 30 derniers jours</div>
              <BarChart data={impData} color='#f5a623'/>
            </div>
            <div style={{background:'var(--card)',borderRadius:12,padding:20,border:'1px solid var(--border)'}}>
              <div style={{fontWeight:700,fontSize:14}}>🖱️ Clics — 30 derniers jours</div>
              <BarChart data={clickData} color='#4d9fff'/>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <div style={{background:'var(--card)',borderRadius:12,padding:20,border:'1px solid var(--border)'}}>
              <div style={{fontWeight:700,fontSize:14,marginBottom:16}}>🌍 Audience par pays</div>
              {[['🇰🇲 Comores',42,'#f5a623'],['🇲🇬 Madagascar',21,'#4d9fff'],['🇨🇮 Cote d Ivoire',18,'#2cc653'],['🇷🇼 Rwanda',11,'#a855f7'],['Autres',8,'#888']].map(([p,v,c],i)=><ProgressBar key={i} label={p} pct={v} color={c}/>)}
            </div>
            <div style={{background:'var(--card)',borderRadius:12,padding:20,border:'1px solid var(--border)'}}>
              <div style={{fontWeight:700,fontSize:14,marginBottom:16}}>🎵 Performance par format</div>
              {[['🎵 Audio Ad',38,'#f5a623'],['🖼️ Banner',26,'#4d9fff'],['⭐ Sponsorise',20,'#2cc653'],['🎙️ Podcast',16,'#a855f7']].map(([p,v,c],i)=><ProgressBar key={i} label={p} pct={v} color={c}/>)}
            </div>
          </div>
        </div>
      )}

      {tab==='campaigns' && (
        <div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16,flexWrap:'wrap',gap:10}}>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              {[['','Toutes'],['active','🟢 Actives'],['paused','⏸ Pausees'],['ended','✅ Terminees'],['draft','📝 Brouillons']].map(([v,l])=>(
                <button key={v} onClick={()=>setFilterStatus(v)} style={{padding:'6px 14px',borderRadius:99,border:'1px solid var(--border)',cursor:'pointer',fontSize:13,fontWeight:600,background:filterStatus===v?'var(--primary)':'transparent',color:filterStatus===v?'#fff':'var(--text2)'}}>{l}</button>
              ))}
            </div>
            <button onClick={()=>{setTab('create');setStep(1)}} style={{background:'linear-gradient(135deg,var(--gold),#e8920a)',border:'none',color:'#000',borderRadius:8,padding:'8px 16px',cursor:'pointer',fontWeight:700,fontSize:13}}>+ Nouvelle campagne</button>
          </div>
          {filteredCampaigns.map(c=>(
            <div key={c.id} style={{background:'var(--card)',borderRadius:12,padding:20,border:'1px solid var(--border)',marginBottom:12}}>
              <div style={{display:'flex',alignItems:'flex-start',gap:14,marginBottom:14}}>
                <div style={{width:52,height:52,borderRadius:10,background:'rgba(245,166,35,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,flexShrink:0}}>
                  {FORMATS.find(f=>f.name===c.format)?.icon||'📢'}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:15,marginBottom:4}}>{c.name}</div>
                  <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
                    <span style={{fontSize:12,color:'var(--text2)'}}>{c.format}</span>
                    <span style={{fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:6,background:`${STATUS_COLORS[c.status]}20`,color:STATUS_COLORS[c.status]}}>{STATUS_LABELS[c.status]}</span>
                  </div>
                </div>
                <button onClick={async()=>{ await api.campaigns.delete(c.id); setCampaigns(cs=>cs.filter(x=>x.id!==c.id)) }} style={{background:'rgba(230,57,70,0.1)',border:'1px solid rgba(230,57,70,0.3)',borderRadius:6,padding:'5px 10px',cursor:'pointer',fontSize:12,color:'#e74c3c',flexShrink:0}}>🗑️</button>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(90px,1fr))',gap:8,marginBottom:12}}>
                {[{label:'Impressions',val:(c.impressions/1000).toFixed(0)+'K'},{label:'Clics',val:c.clicks.toLocaleString()},{label:'CTR',val:c.ctr.toFixed(2)+'%'},{label:'Depenses',val:(c.spent/1000).toFixed(1)+'K KMF'},{label:'Budget',val:(c.budget/1000).toFixed(0)+'K KMF'}].map((s,i)=>(
                  <div key={i} style={{background:'var(--card2)',borderRadius:8,padding:'8px 10px',textAlign:'center'}}>
                    <div style={{fontSize:14,fontWeight:800,fontFamily:'monospace'}}>{s.val}</div>
                    <div style={{fontSize:10,color:'var(--text3)',fontWeight:700}}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{background:'var(--border)',borderRadius:99,height:6,overflow:'hidden'}}>
                <div style={{width:(c.budget>0?Math.min((c.spent/c.budget)*100,100):0)+'%',height:'100%',background:'linear-gradient(90deg,var(--gold),#e8920a)',borderRadius:99}}/>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==='create' && (
        <div style={{maxWidth:680}}>
          {launched && (
            <div style={{background:'rgba(44,198,83,0.1)',border:'1px solid #2cc653',borderRadius:12,padding:20,marginBottom:20,textAlign:'center'}}>
              <div style={{fontSize:40,marginBottom:8}}>🚀</div>
              <div style={{fontWeight:800,fontSize:18,color:'#2cc653'}}>Campagne lancee !</div>
              <div style={{fontSize:14,color:'var(--text2)',marginTop:4}}>Votre campagne sera examinee dans les 2h suivant le lancement.</div>
            </div>
          )}
          <div style={{display:'flex',gap:0,marginBottom:24,background:'var(--card)',borderRadius:10,padding:4,border:'1px solid var(--border)'}}>
            {['Format','Contenu','Ciblage','Budget','Confirmer'].map((s,i)=>(
              <button key={i} onClick={()=>setStep(i+1)} style={{flex:1,padding:'7px 6px',borderRadius:7,border:'none',cursor:'pointer',fontSize:12,fontWeight:700,background:step===i+1?'var(--primary)':step>i+1?'rgba(44,198,83,0.15)':'transparent',color:step===i+1?'#fff':step>i+1?'#2cc653':'var(--text3)'}}>
                {step>i+1?'✓ ':''}{i+1}·{s}
              </button>
            ))}
          </div>
          {step===1 && (
            <div>
              <h3 style={{margin:'0 0 6px',fontWeight:800}}>Choisir le format publicitaire</h3>
              <p style={{color:'var(--text2)',fontSize:13,margin:'0 0 18px'}}>Selectionnez comment votre publicite sera presentee aux utilisateurs Waiichia.</p>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:20}}>
                {FORMATS.map((f,i)=>(
                  <div key={i} onClick={()=>setSelFormat(i)} style={{background:selFormat===i?'rgba(245,166,35,0.15)':'var(--card)',border:`2px solid ${selFormat===i?'var(--gold)':'var(--border)'}`,borderRadius:12,padding:16,textAlign:'center',cursor:'pointer'}}>
                    <div style={{fontSize:28,marginBottom:6}}>{f.icon}</div>
                    <div style={{fontWeight:700,fontSize:13,marginBottom:3}}>{f.name}</div>
                    <div style={{fontSize:11,color:'var(--text3)'}}>{f.desc}</div>
                  </div>
                ))}
              </div>
              <button onClick={()=>setStep(2)} style={{background:'var(--primary)',border:'none',color:'#fff',borderRadius:8,padding:'10px 24px',cursor:'pointer',fontWeight:700}}>Suivant →</button>
            </div>
          )}
          {step===2 && (
            <div>
              <h3 style={{margin:'0 0 16px',fontWeight:800}}>Contenu de la publicite</h3>
              <div style={{marginBottom:14}}><label style={lbl}>NOM DE LA CAMPAGNE *</label><input style={inp} value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Ex: Lancement Album Twarab 2026"/></div>
              <div style={{marginBottom:14}}><label style={lbl}>TITRE DE L ANNONCE</label><input style={inp} value={form.titre} onChange={e=>set('titre',e.target.value)} placeholder="Accrochez votre audience..."/></div>
              <div style={{marginBottom:14}}><label style={lbl}>DESCRIPTION</label><textarea style={{...inp,height:70,resize:'vertical'}} value={form.desc} onChange={e=>set('desc',e.target.value)} placeholder="Message principal..."/></div>
              <div style={{marginBottom:20}}><label style={lbl}>URL DE DESTINATION *</label><input style={inp} value={form.url} onChange={e=>set('url',e.target.value)} placeholder="https://waiichia.com/votre-profil"/></div>
              <div style={{display:'flex',gap:10}}>
                <button onClick={()=>setStep(1)} style={{background:'var(--card)',border:'1px solid var(--border)',color:'var(--text)',borderRadius:8,padding:'10px 20px',cursor:'pointer',fontWeight:600}}>← Retour</button>
                <button onClick={()=>setStep(3)} style={{background:'var(--primary)',border:'none',color:'#fff',borderRadius:8,padding:'10px 24px',cursor:'pointer',fontWeight:700}}>Suivant →</button>
              </div>
            </div>
          )}
          {step===3 && (
            <div>
              <h3 style={{margin:'0 0 16px',fontWeight:800}}>Ciblage de l audience</h3>
              <div style={{marginBottom:16}}><label style={lbl}>🌍 PAYS CIBLES</label><div style={{display:'flex',flexWrap:'wrap',gap:6}}>{PAYS_CIBLES.map(([v,l])=><span key={v} onClick={()=>toggle(selPays,setSelPays,v)} style={{padding:'5px 12px',borderRadius:99,cursor:'pointer',fontSize:13,fontWeight:600,border:'1px solid var(--border)',background:selPays.includes(v)?'rgba(245,166,35,0.2)':'transparent',borderColor:selPays.includes(v)?'var(--gold)':'var(--border)',color:selPays.includes(v)?'var(--gold)':'var(--text2)'}}>{l}</span>)}</div></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:16}}>
                <div><label style={lbl}>TRANCHE D AGE</label><select style={inp} value={form.age} onChange={e=>set('age',e.target.value)}>{['Tous ages','13-17 ans','18-24 ans','25-34 ans','35-44 ans','45+ ans'].map(a=><option key={a}>{a}</option>)}</select></div>
                <div><label style={lbl}>GENRE</label><select style={inp} value={form.genre} onChange={e=>set('genre',e.target.value)}>{['Tous','Hommes','Femmes'].map(g=><option key={g}>{g}</option>)}</select></div>
              </div>
              <div style={{marginBottom:16}}><label style={lbl}>🎵 GENRES MUSICAUX</label><div style={{display:'flex',flexWrap:'wrap',gap:6}}>{GENRES.map(g=><span key={g} onClick={()=>toggle(selGenres,setSelGenres,g)} style={{padding:'5px 12px',borderRadius:99,cursor:'pointer',fontSize:13,fontWeight:600,border:'1px solid',background:selGenres.includes(g)?'rgba(77,159,255,0.2)':'transparent',borderColor:selGenres.includes(g)?'#4d9fff':'var(--border)',color:selGenres.includes(g)?'#4d9fff':'var(--text2)'}}>{g}</span>)}</div></div>
              <div style={{marginBottom:20}}><label style={lbl}>📍 EMPLACEMENTS</label><div style={{display:'flex',flexWrap:'wrap',gap:6}}>{PLACEMENTS.map(p=><span key={p} onClick={()=>toggle(selPlacements,setSelPlacements,p)} style={{padding:'5px 12px',borderRadius:99,cursor:'pointer',fontSize:13,fontWeight:600,border:'1px solid',background:selPlacements.includes(p)?'rgba(168,85,247,0.2)':'transparent',borderColor:selPlacements.includes(p)?'#a855f7':'var(--border)',color:selPlacements.includes(p)?'#a855f7':'var(--text2)'}}>{p}</span>)}</div></div>
              <div style={{display:'flex',gap:10}}>
                <button onClick={()=>setStep(2)} style={{background:'var(--card)',border:'1px solid var(--border)',color:'var(--text)',borderRadius:8,padding:'10px 20px',cursor:'pointer',fontWeight:600}}>← Retour</button>
                <button onClick={()=>setStep(4)} style={{background:'var(--primary)',border:'none',color:'#fff',borderRadius:8,padding:'10px 24px',cursor:'pointer',fontWeight:700}}>Suivant →</button>
              </div>
            </div>
          )}
          {step===4 && (
            <div>
              <h3 style={{margin:'0 0 16px',fontWeight:800}}>Budget & Planification</h3>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
                <div><label style={lbl}>TYPE DE BUDGET</label><select style={inp} value={form.typeBudget} onChange={e=>set('typeBudget',e.target.value)}><option>Budget journalier</option><option>Budget total</option></select></div>
                <div><label style={lbl}>MONTANT *</label><div style={{display:'flex',gap:8}}><input type="number" style={{...inp,flex:1}} value={form.budget} onChange={e=>set('budget',e.target.value)} placeholder="Ex: 5000"/><select style={{...inp,width:'auto'}} value={form.devise} onChange={e=>set('devise',e.target.value)}>{['KMF','USD','EUR','XOF'].map(d=><option key={d}>{d}</option>)}</select></div></div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:16}}>
                <div><label style={lbl}>DATE DE DEBUT</label><input type="date" style={inp} value={form.dateDebut} onChange={e=>set('dateDebut',e.target.value)}/></div>
                <div><label style={lbl}>DATE DE FIN</label><input type="date" style={inp} value={form.dateFin} onChange={e=>set('dateFin',e.target.value)}/></div>
              </div>
              <div style={{marginBottom:16}}>
                <label style={lbl}>OBJECTIF DE LA CAMPAGNE</label>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
                  {OBJECTIFS.map((o,i)=><div key={i} onClick={()=>setSelObjectif(i)} style={{background:selObjectif===i?'rgba(245,166,35,0.15)':'var(--card)',border:`2px solid ${selObjectif===i?'var(--gold)':'var(--border)'}`,borderRadius:10,padding:14,textAlign:'center',cursor:'pointer'}}><div style={{fontSize:24,marginBottom:4}}>{o.icon}</div><div style={{fontWeight:700,fontSize:13}}>{o.name}</div><div style={{fontSize:11,color:'var(--text3)'}}>{o.desc}</div></div>)}
                </div>
              </div>
              {form.budget && <div style={{background:'rgba(245,166,35,0.07)',border:'1px solid rgba(245,166,35,0.2)',borderRadius:10,padding:14,marginBottom:16}}><div style={{fontWeight:700,fontSize:13,marginBottom:6}}>📊 Estimation de portee</div><div style={{display:'flex',gap:20,fontSize:13,color:'var(--text2)',flexWrap:'wrap'}}><span>👥 Audience : <strong style={{color:'var(--text)'}}>28K–45K</strong></span><span>👁️ Impressions/jour : <strong style={{color:'var(--text)'}}>8K–14K</strong></span><span>🖱️ CTR estim : <strong style={{color:'var(--text)'}}>2.1%</strong></span></div></div>}
              <div style={{display:'flex',gap:10}}>
                <button onClick={()=>setStep(3)} style={{background:'var(--card)',border:'1px solid var(--border)',color:'var(--text)',borderRadius:8,padding:'10px 20px',cursor:'pointer',fontWeight:600}}>← Retour</button>
                <button onClick={()=>setStep(5)} style={{background:'var(--primary)',border:'none',color:'#fff',borderRadius:8,padding:'10px 24px',cursor:'pointer',fontWeight:700}}>Suivant →</button>
              </div>
            </div>
          )}
          {step===5 && (
            <div>
              <h3 style={{margin:'0 0 16px',fontWeight:800}}>Recapitulatif & Lancement</h3>
              <div style={{background:'var(--card)',borderRadius:12,padding:20,border:'1px solid var(--border)',marginBottom:16}}>
                <div style={{fontWeight:700,fontSize:15,marginBottom:12}}>{FORMATS[selFormat].icon} {FORMATS[selFormat].name} — {form.name||'Campagne sans nom'}</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,fontSize:13}}>
                  <div><span style={{color:'var(--text2)'}}>Pays : </span>{selPays.join(', ')}</div>
                  <div><span style={{color:'var(--text2)'}}>Audience : </span>{form.age}</div>
                  <div><span style={{color:'var(--text2)'}}>Genres : </span>{selGenres.slice(0,3).join(', ')}</div>
                  <div><span style={{color:'var(--text2)'}}>Budget : </span><strong style={{color:'var(--gold)'}}>{form.budget||'0'} {form.devise}/{form.typeBudget==='Budget journalier'?'jour':'total'}</strong></div>
                  <div><span style={{color:'var(--text2)'}}>Debut : </span>{form.dateDebut||'Non defini'}</div>
                  <div><span style={{color:'var(--text2)'}}>Fin : </span>{form.dateFin||'Non defini'}</div>
                </div>
              </div>
              <div style={{background:'rgba(44,198,83,0.07)',border:'1px solid rgba(44,198,83,0.2)',borderRadius:10,padding:14,marginBottom:18,fontSize:13,lineHeight:1.7}}>
                ✅ Votre campagne sera examinee dans les <strong>2h</strong> suivant le lancement.<br/>
                📊 Les analytics seront disponibles 24h apres le demarrage.
              </div>
              <div style={{display:'flex',gap:10}}>
                <button onClick={()=>setStep(4)} style={{background:'var(--card)',border:'1px solid var(--border)',color:'var(--text)',borderRadius:8,padding:'10px 20px',cursor:'pointer',fontWeight:600}}>← Modifier</button>
                <button onClick={launchCampaign} style={{flex:1,background:'linear-gradient(135deg,var(--gold),#e8920a)',border:'none',color:'#000',borderRadius:8,padding:'12px',cursor:'pointer',fontWeight:800,fontSize:15}}>🚀 Lancer la Campagne</button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab==='analytics' && (
        <div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:12,marginBottom:24}}>
            {[{icon:'👁️',val:'2.4M',label:'IMPRESSIONS',color:'#f5a623'},{icon:'🖱️',val:'48.2K',label:'CLICS',color:'#4d9fff'},{icon:'📊',val:'2.01%',label:'CTR MOYEN',color:'#2cc653'},{icon:'💸',val:'245K',label:'DEPENSES KMF',color:'#e74c3c'}].map((k,i)=>(
              <div key={i} style={{background:'var(--card)',borderRadius:12,padding:16,border:'1px solid var(--border)'}}>
                <div style={{fontSize:24,marginBottom:6}}>{k.icon}</div>
                <div style={{fontSize:22,fontWeight:900,color:k.color,fontFamily:'monospace'}}>{k.val}</div>
                <div style={{fontSize:11,fontWeight:700,color:'var(--text3)',letterSpacing:1,marginTop:4}}>{k.label}</div>
              </div>
            ))}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
            <div style={{background:'var(--card)',borderRadius:12,padding:20,border:'1px solid var(--border)'}}><div style={{fontWeight:700,fontSize:14}}>📊 Impressions vs Clics</div><BarChart data={impData.slice(0,14)} color='#f5a623'/></div>
            <div style={{background:'var(--card)',borderRadius:12,padding:20,border:'1px solid var(--border)'}}><div style={{fontWeight:700,fontSize:14}}>💸 Depenses quotidiennes (KMF)</div><BarChart data={[1200,980,1450,1100,1680,1320,1540,1890,1420,1650,1320,1780,1540,1320]} color='#e74c3c'/></div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <div style={{background:'var(--card)',borderRadius:12,padding:20,border:'1px solid var(--border)'}}><div style={{fontWeight:700,fontSize:14,marginBottom:16}}>🌍 Repartition par pays</div>{[['🇰🇲 Comores',42,'#f5a623'],['🇲🇬 Madagascar',21,'#4d9fff'],['🇨🇮 Cote d Ivoire',18,'#2cc653'],['🇷🇼 Rwanda',11,'#a855f7'],['Autres',8,'#888']].map(([p,v,c],i)=><ProgressBar key={i} label={p} pct={v} color={c}/>)}</div>
            <div style={{background:'var(--card)',borderRadius:12,padding:20,border:'1px solid var(--border)'}}><div style={{fontWeight:700,fontSize:14,marginBottom:16}}>🎵 Repartition par genre</div>{[['Twarab',35,'#f5a623'],['Afrobeats',28,'#4d9fff'],['Podcast',20,'#2cc653'],['Autres',17,'#a855f7']].map(([p,v,c],i)=><ProgressBar key={i} label={p} pct={v} color={c}/>)}</div>
          </div>
        </div>
      )}

      {tab==='billing' && (
        <div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:24}}>
            <div style={{background:'linear-gradient(135deg,#0a1a2e,#1a3a5e)',borderRadius:16,padding:24,border:'1px solid rgba(77,159,255,0.3)'}}>
              <div style={{fontSize:12,color:'rgba(255,255,255,0.6)',fontWeight:700,letterSpacing:1,marginBottom:8}}>CREDIT PUBLICITAIRE DISPONIBLE</div>
              <div style={{fontSize:32,fontWeight:900,color:'#fff',fontFamily:'monospace'}}>245 000 KMF</div>
              <div style={{fontSize:12,color:'rgba(255,255,255,0.5)',marginBottom:16}}>≈ 500 USD · ≈ 460 EUR</div>
              <div style={{display:'flex',gap:8}}>
                <button onClick={()=>setPage('wallet')} style={{background:'var(--primary)',border:'none',color:'#fff',borderRadius:8,padding:'8px 16px',cursor:'pointer',fontWeight:700,fontSize:13}}>💳 Recharger</button>
                <button style={{background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.2)',color:'#fff',borderRadius:8,padding:'8px 16px',cursor:'pointer',fontSize:13}}>📋 Historique</button>
              </div>
            </div>
            <div style={{background:'var(--card)',borderRadius:16,padding:24,border:'1px solid var(--border)'}}>
              <div style={{fontWeight:700,fontSize:15,marginBottom:12}}>📊 Depenses ce mois</div>
              <div style={{fontSize:32,fontWeight:900,color:'#e74c3c',fontFamily:'monospace'}}>87 500 KMF</div>
              <div style={{fontSize:12,color:'var(--text2)',marginBottom:16}}>Sur {campaigns.filter(c=>c.status==='active').length} campagnes actives</div>
              <div style={{background:'var(--border)',borderRadius:99,height:8,overflow:'hidden'}}><div style={{width:'36%',height:'100%',background:'var(--gold)',borderRadius:99}}/></div>
            </div>
          </div>
          <div style={{fontWeight:700,fontSize:15,marginBottom:12}}>💳 Historique de facturation</div>
          {[{date:'03 Mar 2026',campagne:'Lancement Album Twarab',montant:2150,statut:'debite'},{date:'01 Mar 2026',campagne:'Festival Komori Spring',montant:890,statut:'debite'},{date:'28 Fev 2026',campagne:'Recharge credit pub',montant:50000,statut:'credit'}].map((f,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'14px 16px',background:'var(--card)',borderRadius:10,border:'1px solid var(--border)',marginBottom:8}}>
              <div style={{width:40,height:40,borderRadius:10,background:f.statut==='credit'?'rgba(44,198,83,0.15)':'rgba(230,57,70,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>{f.statut==='credit'?'💰':'💸'}</div>
              <div style={{flex:1}}><div style={{fontWeight:600,fontSize:14}}>{f.campagne}</div><div style={{fontSize:12,color:'var(--text2)'}}>{f.date}</div></div>
              <div style={{fontWeight:800,fontSize:15,color:f.statut==='credit'?'#2cc653':'#e74c3c'}}>{f.statut==='credit'?'+':'-'}{f.montant.toLocaleString()} KMF</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
