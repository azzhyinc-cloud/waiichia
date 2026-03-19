import { useState } from "react"
import { useAuthStore, usePageStore } from "../stores/index.js"

const fmtK=n=>n>=1000000?(n/1000000).toFixed(1)+"M":n>=1000?(n/1000).toFixed(1)+"K":String(n||0)
const FORMATS=[{id:'audio',icon:'🎵',name:'Audio Ad',desc:'15–30s entre les sons'},{id:'banner',icon:'🖼️',name:'Banner',desc:'Bandeau visuel'},{id:'interstitial',icon:'📱',name:'Interstitiel',desc:'Plein écran mobile'},{id:'sponsored',icon:'🎙️',name:'Son Sponsorisé',desc:'Mis en avant dans le feed'},{id:'podcast',icon:'🎧',name:'Podcast Ad',desc:'Pré-roll ou mid-roll'},{id:'event',icon:'🎪',name:'Event Boost',desc:'Boost événement'}]
const MOCK_CAMPAIGNS=[
  {id:'cp1',name:'Lancement Album Ocean',format:'audio',status:'active',impressions:42000,clicks:1800,budget:50000,spent:32000,ctr:'4.3%'},
  {id:'cp2',name:'Promo Concert Moroni',format:'event',status:'active',impressions:28000,clicks:2400,budget:30000,spent:18000,ctr:'8.6%'},
  {id:'cp3',name:'Banner Huri Money',format:'banner',status:'paused',impressions:15000,clicks:420,budget:20000,spent:12000,ctr:'2.8%'},
  {id:'cp4',name:'Podcast Mindset',format:'podcast',status:'completed',impressions:68000,clicks:3200,budget:40000,spent:40000,ctr:'4.7%'},
]
const STATUS_STYLE={active:{bg:'rgba(44,198,83,.15)',c:'var(--green)',l:'🟢 Active'},paused:{bg:'rgba(245,166,35,.15)',c:'var(--gold)',l:'⏸ Pausée'},completed:{bg:'rgba(77,159,255,.15)',c:'var(--blue)',l:'✅ Terminée'},draft:{bg:'var(--bg2)',c:'var(--text3)',l:'📝 Brouillon'}}

export default function Regie(){
  const {user}=useAuthStore()
  const {setPage}=usePageStore()
  const [tab,setTab]=useState('overview')
  const [createStep,setCreateStep]=useState(1)
  const [selFormat,setSelFormat]=useState('audio')
  const [campFilter,setCampFilter]=useState('Toutes')

  if(!user)return(<div style={{textAlign:'center',padding:60}}><div style={{fontSize:48,marginBottom:16}}>📢</div><h2 style={{fontFamily:'Syne,sans-serif'}}>Connectez-vous</h2><button className="btn btn-primary" onClick={()=>setPage('login')} style={{marginTop:16}}>Se connecter</button></div>)

  const TABS=[{id:'overview',icon:'📊',l:'Vue d\'ensemble'},{id:'campaigns',icon:'📋',l:'Mes Campagnes'},{id:'create',icon:'➕',l:'Créer Campagne'},{id:'analytics',icon:'📈',l:'Analytics'},{id:'billing',icon:'💳',l:'Facturation'}]

  return(
    <div style={{paddingBottom:60}}>
      <div className="page-title">📢 Régie Publicitaire Waiichia</div>

      {/* TABS */}
      <div className="tabs-bar" style={{marginBottom:24}}>
        {TABS.map(t=><button key={t.id} className={`tab-btn${tab===t.id?' active':''}`} onClick={()=>setTab(t.id)}>{t.icon} {t.l}</button>)}
      </div>

      {/* OVERVIEW */}
      {tab==='overview'&&<div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(155px,1fr))',gap:12,marginBottom:20}}>
          {[{icon:'👁️',num:'153K',l:'Impressions',d:'▲ +12%',c:'var(--gold)'},{icon:'🖱️',num:'6.4K',l:'Clics',d:'▲ +8%',c:'var(--blue)'},{icon:'💰',num:'142K KMF',l:'Dépensé',d:'70% du budget',c:'var(--red)'},{icon:'📊',num:'4.2%',l:'CTR moyen',d:'▲ +0.3%',c:'var(--green)'}].map(k=>(
            <div key={k.l} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'16px 18px',borderLeft:`3px solid ${k.c}`}}>
              <div style={{fontSize:22,marginBottom:6}}>{k.icon}</div>
              <div style={{fontFamily:'Syne,sans-serif',fontSize:20,fontWeight:800}}>{k.num}</div>
              <div style={{fontSize:11,color:'var(--text2)',marginBottom:4}}>{k.l}</div>
              <div style={{fontSize:10,fontFamily:'Space Mono,monospace',color:'var(--green)'}}>{k.d}</div>
            </div>
          ))}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
          {[{title:'📊 Impressions — 30 jours',data:[65,72,58,80,92,75,88,95,70,82,90,78,85,92,68,74,89,96,72,80,88,76,84,91,79,86,94,72,80,88]},{title:'🖱️ Clics — 30 jours',data:[12,18,14,22,28,19,24,32,16,20,26,18,22,28,14,18,24,30,16,20,26,18,22,28,20,24,30,16,22,26]}].map(ch=>(
            <div key={ch.title} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:20}}>
              <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:15,marginBottom:16}}>{ch.title}</div>
              <div style={{display:'flex',alignItems:'flex-end',gap:2,height:100}}>
                {ch.data.map((v,i)=><div key={i} style={{flex:1,background:'var(--gold)',borderRadius:'2px 2px 0 0',height:v+'%',opacity:0.4+v/150,transition:'height .3s'}}/>)}
              </div>
            </div>
          ))}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:20}}>
            <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:15,marginBottom:16}}>🌍 Audience par pays</div>
            {[{c:'🇰🇲 Comores',pct:48},{c:'🇲🇬 Madagascar',pct:22},{c:'🇫🇷 France',pct:14},{c:'🇳🇬 Nigeria',pct:10},{c:'Autres',pct:6}].map(g=>(
              <div key={g.c} style={{display:'flex',alignItems:'center',gap:8,marginBottom:8,fontSize:12}}>
                <span style={{width:90,color:'var(--text2)',flexShrink:0}}>{g.c}</span>
                <div style={{flex:1,height:6,background:'var(--border2)',borderRadius:4,overflow:'hidden'}}><div style={{height:'100%',width:g.pct+'%',background:'var(--gold)',borderRadius:4}}/></div>
                <span style={{width:30,textAlign:'right',fontFamily:'Space Mono,monospace',fontSize:11}}>{g.pct}%</span>
              </div>
            ))}
          </div>
          <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:20}}>
            <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:15,marginBottom:16}}>🎵 Performance par format</div>
            {[{f:'Audio Ad',imp:'89K',ctr:'4.8%'},{f:'Banner',imp:'42K',ctr:'2.1%'},{f:'Son Sponsorisé',imp:'15K',ctr:'6.2%'},{f:'Event Boost',imp:'7K',ctr:'12.4%'}].map(p=>(
              <div key={p.f} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--border)',fontSize:12}}>
                <span>{p.f}</span><span style={{color:'var(--text2)'}}>{p.imp} imp</span><span style={{fontFamily:'Space Mono,monospace',color:'var(--gold)',fontWeight:700}}>{p.ctr}</span>
              </div>
            ))}
          </div>
        </div>
      </div>}

      {/* CAMPAIGNS */}
      {tab==='campaigns'&&<div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18,flexWrap:'wrap',gap:10}}>
          <div className="filter-bar" style={{margin:0}}>
            {['Toutes','🟢 Actives','⏸ Pausées','✅ Terminées','📝 Brouillons'].map(f=><div key={f} className={`pill-tab${campFilter===f?' active':''}`} onClick={()=>setCampFilter(f)}>{f}</div>)}
          </div>
          <button className="btn btn-primary btn-sm" onClick={()=>setTab('create')}>+ Nouvelle campagne</button>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {MOCK_CAMPAIGNS.map(cp=>{
            const st=STATUS_STYLE[cp.status]||STATUS_STYLE.draft
            const pct=cp.budget?Math.round(cp.spent/cp.budget*100):0
            return(
              <div key={cp.id} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:18}}>
                <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:12}}>
                  <div style={{fontSize:28}}>{FORMATS.find(f=>f.id===cp.format)?.icon||'📢'}</div>
                  <div style={{flex:1}}><div style={{fontWeight:700,fontSize:14,marginBottom:2}}>{cp.name}</div><div style={{fontSize:11,color:'var(--text2)'}}>{FORMATS.find(f=>f.id===cp.format)?.name}</div></div>
                  <span style={{padding:'4px 10px',borderRadius:20,fontSize:10,fontWeight:700,background:st.bg,color:st.c,fontFamily:'Space Mono,monospace'}}>{st.l}</span>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:12}}>
                  {[{l:'Impressions',v:fmtK(cp.impressions)},{l:'Clics',v:fmtK(cp.clicks)},{l:'CTR',v:cp.ctr},{l:'Budget',v:fmtK(cp.budget)+' KMF'}].map(s=>(
                    <div key={s.l}><div style={{fontSize:11,color:'var(--text3)',marginBottom:2}}>{s.l}</div><div style={{fontFamily:'Space Mono,monospace',fontWeight:700,fontSize:13}}>{s.v}</div></div>
                  ))}
                </div>
                <div style={{display:'flex',alignItems:'center',gap:8,fontSize:11}}>
                  <span style={{color:'var(--text3)'}}>Budget utilisé</span>
                  <div style={{flex:1,height:4,background:'var(--border2)',borderRadius:4,overflow:'hidden'}}><div style={{height:'100%',width:pct+'%',background:pct>80?'var(--red)':'var(--gold)',borderRadius:4}}/></div>
                  <span style={{fontFamily:'Space Mono,monospace',color:'var(--text2)'}}>{pct}%</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>}

      {/* CREATE CAMPAIGN */}
      {tab==='create'&&<div style={{maxWidth:680}}>
        <div className="upload-steps-bar" style={{marginBottom:24}}>
          {[{n:1,l:'Format'},{n:2,l:'Contenu'},{n:3,l:'Ciblage'},{n:4,l:'Budget'},{n:5,l:'Confirmer'}].map((s,i)=>(
            <div key={s.n} style={{display:'contents'}}>{i>0&&<div className="upload-step-sep"/>}<div className={`upload-step${createStep===s.n?' active':''}${createStep>s.n?' done':''}`} onClick={()=>setCreateStep(s.n)}><span className="step-num">{createStep>s.n?'✓':s.n}</span><span>{s.l}</span></div></div>
          ))}
        </div>

        {createStep===1&&<div>
          <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:18,marginBottom:6}}>Choisir le format publicitaire</div>
          <div style={{fontSize:13,color:'var(--text2)',marginBottom:18}}>Comment votre pub sera présentée aux utilisateurs.</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:20}}>
            {FORMATS.map(f=>(
              <div key={f.id} onClick={()=>setSelFormat(f.id)} style={{background:selFormat===f.id?'rgba(245,166,35,.08)':'var(--card)',border:`2px solid ${selFormat===f.id?'var(--gold)':'var(--border)'}`,borderRadius:'var(--radius-sm)',padding:16,textAlign:'center',cursor:'pointer',transition:'all .18s'}}>
                <div style={{fontSize:28,marginBottom:6}}>{f.icon}</div>
                <div style={{fontWeight:700,fontSize:13,marginBottom:3}}>{f.name}</div>
                <div style={{fontSize:11,color:'var(--text2)'}}>{f.desc}</div>
              </div>
            ))}
          </div>
          <div style={{display:'flex',justifyContent:'flex-end'}}><button className="btn btn-primary" onClick={()=>setCreateStep(2)}>Suivant → Contenu</button></div>
        </div>}

        {createStep===2&&<div>
          <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:18,marginBottom:18}}>Contenu de la campagne</div>
          <div className="form-group"><label className="label">Nom de la campagne *</label><input className="input-field" placeholder="Ex: Promo Album Ocean..."/></div>
          <div className="form-group"><label className="label">Titre affiché</label><input className="input-field" placeholder="Titre court et accrocheur"/></div>
          <div className="form-group"><label className="label">Description</label><textarea className="textarea-field" placeholder="Message publicitaire..."/></div>
          <div className="form-group"><label className="label">URL de destination *</label><input className="input-field" placeholder="https://waiichia.com/track/..."/></div>
          {selFormat==='audio'&&<div className="form-group"><label className="label">🎵 Fichier audio (15-30s)</label><div className="upload-drop-zone" style={{padding:18}}><div style={{fontSize:20}}>🎵</div><div style={{fontSize:13,fontWeight:600,marginTop:6}}>Glissez votre spot audio ici</div></div></div>}
          {(selFormat==='banner'||selFormat==='interstitial')&&<div className="form-group"><label className="label">🖼️ Image publicitaire</label><div className="upload-drop-zone" style={{padding:18}}><div style={{fontSize:20}}>🖼️</div><div style={{fontSize:13,fontWeight:600,marginTop:6}}>{selFormat==='banner'?'Banner 728×90 ou 320×50':'Image 1080×1920'}</div></div></div>}
          <div style={{display:'flex',justifyContent:'space-between',marginTop:18}}><button className="btn btn-outline" onClick={()=>setCreateStep(1)}>← Retour</button><button className="btn btn-primary" onClick={()=>setCreateStep(3)}>Suivant → Ciblage</button></div>
        </div>}

        {createStep===3&&<div>
          <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:18,marginBottom:18}}>Ciblage</div>
          <div className="form-group"><label className="label">🌍 Pays cibles</label><div style={{display:'flex',gap:6,flexWrap:'wrap'}}>{['🇰🇲 Comores','🇲🇬 Madagascar','🇨🇮 Côte d\'Ivoire','🇳🇬 Nigeria','🇸🇳 Sénégal','🇹🇿 Tanzanie','🇫🇷 France','🌍 Monde entier'].map(c=><div key={c} className="genre-chip">{c}</div>)}</div></div>
          <div className="form-row"><div className="form-group"><label className="label">Âge minimum</label><input className="input-field" type="number" defaultValue="13" min="13"/></div><div className="form-group"><label className="label">Âge maximum</label><input className="input-field" type="number" defaultValue="65" max="99"/></div></div>
          <div className="form-group"><label className="label">🎵 Genres ciblés</label><div style={{display:'flex',gap:6,flexWrap:'wrap'}}>{['Twarab','Afrobeats','Amapiano','Gospel','Slam','Podcast','Tous'].map(g=><div key={g} className="genre-chip">{g}</div>)}</div></div>
          <div style={{display:'flex',justifyContent:'space-between',marginTop:18}}><button className="btn btn-outline" onClick={()=>setCreateStep(2)}>← Retour</button><button className="btn btn-primary" onClick={()=>setCreateStep(4)}>Suivant → Budget</button></div>
        </div>}

        {createStep===4&&<div>
          <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:18,marginBottom:18}}>Budget & Planification</div>
          <div className="form-row"><div className="form-group"><label className="label">Type de budget</label><select className="select-styled" style={{width:'100%'}}><option>Budget quotidien</option><option>Budget total</option></select></div><div className="form-group"><label className="label">Montant (KMF)</label><input className="input-field" type="number" placeholder="10000"/></div></div>
          <div className="form-row"><div className="form-group"><label className="label">Date de début</label><input className="input-field" type="date"/></div><div className="form-group"><label className="label">Date de fin</label><input className="input-field" type="date"/></div></div>
          <div style={{background:'rgba(245,166,35,.06)',border:'1px solid rgba(245,166,35,.2)',borderRadius:'var(--radius-sm)',padding:14,marginTop:12}}>
            <div style={{fontSize:12,color:'var(--text2)'}}>💡 Estimation : <strong>~15 000 impressions</strong> et <strong>~650 clics</strong> pour ce budget</div>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',marginTop:18}}><button className="btn btn-outline" onClick={()=>setCreateStep(3)}>← Retour</button><button className="btn btn-primary" onClick={()=>setCreateStep(5)}>Suivant → Confirmer</button></div>
        </div>}

        {createStep===5&&<div>
          <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:18,marginBottom:18}}>Résumé de la campagne</div>
          <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:20,marginBottom:20}}>
            {[['Format',FORMATS.find(f=>f.id===selFormat)?.name],['Ciblage','🇰🇲 Comores · 13-65 ans'],['Budget','10 000 KMF / jour'],['Durée estimée','7 jours'],['Impressions estimées','~15 000'],['Coût total estimé','~70 000 KMF']].map(([k,v])=>(
              <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid var(--border)',fontSize:13}}>
                <span style={{color:'var(--text2)'}}>{k}</span>
                <span style={{fontWeight:600}}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{display:'flex',gap:10}}><button className="btn btn-outline" onClick={()=>setCreateStep(4)}>← Retour</button><button className="btn btn-secondary">💾 Brouillon</button><button className="btn btn-primary" style={{flex:1}}>🚀 Lancer la campagne</button></div>
        </div>}
      </div>}

      {/* ANALYTICS */}
      {tab==='analytics'&&<div style={{textAlign:'center',padding:60,color:'var(--text3)'}}><div style={{fontSize:48,marginBottom:12}}>📈</div><div style={{fontSize:15}}>Analytics détaillées — Bientôt disponible</div><div style={{fontSize:12,marginTop:8}}>Les données détaillées seront visibles ici quand vos campagnes seront actives.</div></div>}

      {/* BILLING */}
      {tab==='billing'&&<div style={{textAlign:'center',padding:60,color:'var(--text3)'}}><div style={{fontSize:48,marginBottom:12}}>💳</div><div style={{fontSize:15}}>Facturation — Bientôt disponible</div><div style={{fontSize:12,marginTop:8}}>Historique des paiements et factures de vos campagnes.</div></div>}
    </div>
  )
}
