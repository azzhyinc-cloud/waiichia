import { useState, useEffect } from "react"
import { useAuthStore, usePageStore } from "../stores/index.js"
import api from "../services/api.js"

const fmtK=n=>n>=1000000?(n/1000000).toFixed(1)+"M":n>=1000?(n/1000).toFixed(1)+"K":String(n||0)
const FORMATS=[{id:'audio',icon:'🎵',name:'Audio Ad',desc:'15–30s entre les sons'},{id:'banner',icon:'🖼️',name:'Banner',desc:'Bandeau visuel'},{id:'interstitial',icon:'📱',name:'Interstitiel',desc:'Plein écran mobile'},{id:'sponsored',icon:'🎙️',name:'Son Sponsorisé',desc:'Mis en avant dans le feed'},{id:'podcast',icon:'🎧',name:'Podcast Ad',desc:'Pré-roll ou mid-roll'},{id:'event',icon:'🎪',name:'Event Boost',desc:'Boost événement'}]
const STATUS_STYLE={active:{bg:'rgba(44,198,83,.15)',c:'var(--green)',l:'🟢 Active'},paused:{bg:'rgba(245,166,35,.15)',c:'var(--gold)',l:'⏸ Pausée'},completed:{bg:'rgba(77,159,255,.15)',c:'var(--blue)',l:'✅ Terminée'},draft:{bg:'var(--bg2)',c:'var(--text3)',l:'📝 Brouillon'}}

export default function Regie(){
  const {user}=useAuthStore()
  const {setPage}=usePageStore()
  const [tab,setTab]=useState('overview')
  const [createStep,setCreateStep]=useState(1)
  const [selFormat,setSelFormat]=useState('audio')
  const [campFilter,setCampFilter]=useState('Toutes')
  const [campaigns,setCampaigns]=useState([])
  const [loading,setLoading]=useState(true)

  useEffect(()=>{
    if(!user)return
    api.campaigns.list()
      .then(d=>setCampaigns(d.campaigns||d||[]))
      .catch(()=>setCampaigns([]))
      .finally(()=>setLoading(false))
  },[user])

  if(!user)return(<div style={{textAlign:'center',padding:60}}><div style={{fontSize:48,marginBottom:16}}>📢</div><h2 style={{fontFamily:'Syne,sans-serif'}}>Connectez-vous</h2><button className="btn btn-primary" onClick={()=>setPage('login')} style={{marginTop:16}}>Se connecter</button></div>)

  const TABS=[{id:'overview',icon:'📊',l:'Vue d\'ensemble'},{id:'campaigns',icon:'📋',l:'Mes Campagnes'},{id:'create',icon:'➕',l:'Créer Campagne'},{id:'analytics',icon:'📈',l:'Analytics'},{id:'billing',icon:'💳',l:'Facturation'}]

  // Compute real stats from campaigns
  const totalImpressions=campaigns.reduce((a,c)=>a+(c.impressions||0),0)
  const totalClicks=campaigns.reduce((a,c)=>a+(c.clicks||0),0)
  const totalSpent=campaigns.reduce((a,c)=>a+(c.budget_spent||0),0)
  const avgCTR=totalImpressions>0?((totalClicks/totalImpressions)*100).toFixed(1)+'%':'—'

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
          {[
            {icon:'👁️',num:fmtK(totalImpressions),l:'Impressions',c:'var(--gold)'},
            {icon:'🖱️',num:fmtK(totalClicks),l:'Clics',c:'var(--blue)'},
            {icon:'💰',num:fmtK(totalSpent)+' KMF',l:'Dépensé',c:'var(--red)'},
            {icon:'📊',num:avgCTR,l:'CTR moyen',c:'var(--green)'}
          ].map(k=>(
            <div key={k.l} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'16px 18px',borderLeft:`3px solid ${k.c}`}}>
              <div style={{fontSize:22,marginBottom:6}}>{k.icon}</div>
              <div style={{fontFamily:'Syne,sans-serif',fontSize:20,fontWeight:800}}>{k.num}</div>
              <div style={{fontSize:11,color:'var(--text2)',marginBottom:4}}>{k.l}</div>
            </div>
          ))}
        </div>

        {campaigns.length>0
          ?<div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:20}}>
            <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:15,marginBottom:16}}>📋 Campagnes récentes</div>
            {campaigns.slice(0,5).map(cp=>{
              const st=STATUS_STYLE[cp.status]||STATUS_STYLE.draft
              return(
                <div key={cp.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:'1px solid var(--border)',fontSize:12}}>
                  <span style={{fontSize:20}}>{FORMATS.find(f=>f.id===cp.format)?.icon||'📢'}</span>
                  <div style={{flex:1}}><div style={{fontWeight:600}}>{cp.name}</div></div>
                  <span style={{color:'var(--text2)',fontFamily:'Space Mono,monospace'}}>{fmtK(cp.impressions||0)} imp</span>
                  <span style={{padding:'3px 8px',borderRadius:20,fontSize:10,fontWeight:700,background:st.bg,color:st.c}}>{st.l}</span>
                </div>
              )
            })}
          </div>
          :<div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:40,textAlign:'center'}}>
            <div style={{fontSize:48,marginBottom:12}}>📢</div>
            <div style={{fontFamily:'Syne,sans-serif',fontSize:16,fontWeight:700,marginBottom:6}}>Aucune campagne</div>
            <div style={{fontSize:13,color:'var(--text3)',marginBottom:16}}>Créez votre première campagne publicitaire pour promouvoir vos sons sur Waiichia.</div>
            <button className="btn btn-primary" onClick={()=>setTab('create')}>+ Créer une campagne</button>
          </div>
        }
      </div>}

      {/* CAMPAIGNS */}
      {tab==='campaigns'&&<div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18,flexWrap:'wrap',gap:10}}>
          <div className="filter-bar" style={{margin:0}}>
            {['Toutes','🟢 Actives','⏸ Pausées','✅ Terminées','📝 Brouillons'].map(f=><div key={f} className={`pill-tab${campFilter===f?' active':''}`} onClick={()=>setCampFilter(f)}>{f}</div>)}
          </div>
          <button className="btn btn-primary btn-sm" onClick={()=>setTab('create')}>+ Nouvelle campagne</button>
        </div>
        {loading
          ?<div style={{display:'flex',flexDirection:'column',gap:12}}>{[...Array(3)].map((_,i)=><div key={i} style={{height:100,background:'var(--card)',borderRadius:'var(--radius)',border:'1px solid var(--border)',animation:'shimmer 1.5s infinite'}}/>)}</div>
          :campaigns.length>0
            ?<div style={{display:'flex',flexDirection:'column',gap:12}}>
              {campaigns.map(cp=>{
                const st=STATUS_STYLE[cp.status]||STATUS_STYLE.draft
                const pct=cp.budget_amount?Math.round((cp.budget_spent||0)/cp.budget_amount*100):0
                return(
                  <div key={cp.id} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:18}}>
                    <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:12}}>
                      <div style={{fontSize:28}}>{FORMATS.find(f=>f.id===cp.format)?.icon||'📢'}</div>
                      <div style={{flex:1}}><div style={{fontWeight:700,fontSize:14,marginBottom:2}}>{cp.name}</div><div style={{fontSize:11,color:'var(--text2)'}}>{FORMATS.find(f=>f.id===cp.format)?.name||cp.format}</div></div>
                      <span style={{padding:'4px 10px',borderRadius:20,fontSize:10,fontWeight:700,background:st.bg,color:st.c,fontFamily:'Space Mono,monospace'}}>{st.l}</span>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:12}}>
                      {[{l:'Impressions',v:fmtK(cp.impressions||0)},{l:'Clics',v:fmtK(cp.clicks||0)},{l:'CTR',v:cp.impressions>0?((cp.clicks/cp.impressions)*100).toFixed(1)+'%':'—'},{l:'Budget',v:fmtK(cp.budget_amount||0)+' KMF'}].map(s=>(
                        <div key={s.l}><div style={{fontSize:11,color:'var(--text3)',marginBottom:2}}>{s.l}</div><div style={{fontFamily:'Space Mono,monospace',fontWeight:700,fontSize:13}}>{s.v}</div></div>
                      ))}
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:8,fontSize:11}}>
                      <span style={{color:'var(--text3)'}}>Budget utilisé</span>
                      <div style={{flex:1,height:4,background:'var(--border2)',borderRadius:4,overflow:'hidden'}}><div style={{height:'100%',width:Math.min(pct,100)+'%',background:pct>80?'var(--red)':'var(--gold)',borderRadius:4}}/></div>
                      <span style={{fontFamily:'Space Mono,monospace',color:'var(--text2)'}}>{pct}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
            :<div style={{textAlign:'center',padding:60,color:'var(--text3)'}}>
              <div style={{fontSize:48,marginBottom:12}}>📋</div>
              <div style={{fontFamily:'Syne,sans-serif',fontSize:16,fontWeight:700,marginBottom:6,color:'var(--text)'}}>Aucune campagne</div>
              <div style={{fontSize:13}}>Vos campagnes publicitaires apparaîtront ici.</div>
            </div>
        }
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
          <div style={{display:'flex',justifyContent:'space-between',marginTop:18}}><button className="btn btn-outline" onClick={()=>setCreateStep(3)}>← Retour</button><button className="btn btn-primary" onClick={()=>setCreateStep(5)}>Suivant → Confirmer</button></div>
        </div>}

        {createStep===5&&<div>
          <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:18,marginBottom:18}}>Résumé de la campagne</div>
          <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:20,marginBottom:20}}>
            {[['Format',FORMATS.find(f=>f.id===selFormat)?.name]].map(([k,v])=>(
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
      {tab==='analytics'&&<div>
        <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:18,marginBottom:20}}>📈 Analytics des campagnes</div>
        {campaigns.length===0
          ?<div style={{textAlign:'center',padding:60,color:'var(--text3)'}}><div style={{fontSize:48,marginBottom:12}}>📈</div><div style={{fontSize:15}}>Aucune donnée analytics</div><div style={{fontSize:12,marginTop:8}}>Créez et lancez une campagne pour voir les statistiques ici.</div></div>
          :<>
            {/* Global stats */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:12,marginBottom:24}}>
              {[
                {icon:'📊',num:campaigns.length,l:'Campagnes',c:'var(--gold)'},
                {icon:'👁️',num:fmtK(totalImpressions),l:'Impressions totales',c:'var(--blue)'},
                {icon:'🖱️',num:fmtK(totalClicks),l:'Clics totaux',c:'var(--green)'},
                {icon:'📊',num:avgCTR,l:'CTR moyen',c:'var(--purple)'},
                {icon:'💰',num:fmtK(totalSpent)+' KMF',l:'Total dépensé',c:'var(--red)'},
                {icon:'📢',num:campaigns.filter(c=>c.status==='active').length,l:'Actives',c:'var(--green)'},
              ].map(k=>(
                <div key={k.l} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'14px 16px',borderLeft:`3px solid ${k.c}`}}>
                  <div style={{fontSize:18,marginBottom:4}}>{k.icon}</div>
                  <div style={{fontFamily:'Syne,sans-serif',fontSize:18,fontWeight:800}}>{k.num}</div>
                  <div style={{fontSize:11,color:'var(--text2)'}}>{k.l}</div>
                </div>
              ))}
            </div>

            {/* Per-campaign performance */}
            <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:15,marginBottom:12}}>📋 Performance par campagne</div>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {campaigns.map(cp=>{
                const ctr=cp.impressions>0?((cp.clicks||0)/cp.impressions*100).toFixed(1)+'%':'—'
                const pct=cp.budget_amount?Math.round((cp.budget_spent||0)/cp.budget_amount*100):0
                return(
                  <div key={cp.id} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:18}}>
                    <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:14}}>
                      <span style={{fontSize:24}}>{FORMATS.find(f=>f.id===cp.format)?.icon||'📢'}</span>
                      <div style={{flex:1}}><div style={{fontWeight:700,fontSize:14}}>{cp.name}</div><div style={{fontSize:11,color:'var(--text2)'}}>{cp.format} · {cp.status}</div></div>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,fontSize:12}}>
                      {[
                        {l:'Impressions',v:fmtK(cp.impressions||0)},
                        {l:'Clics',v:fmtK(cp.clicks||0)},
                        {l:'CTR',v:ctr},
                        {l:'Dépensé',v:fmtK(cp.budget_spent||0)+' KMF'},
                        {l:'Budget',v:fmtK(cp.budget_amount||0)+' KMF'}
                      ].map(s=>(
                        <div key={s.l}><div style={{color:'var(--text3)',fontSize:10,marginBottom:2}}>{s.l}</div><div style={{fontFamily:'Space Mono,monospace',fontWeight:700}}>{s.v}</div></div>
                      ))}
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:8,fontSize:11,marginTop:10}}>
                      <span style={{color:'var(--text3)'}}>Budget</span>
                      <div style={{flex:1,height:4,background:'var(--border2)',borderRadius:4,overflow:'hidden'}}><div style={{height:'100%',width:Math.min(pct,100)+'%',background:pct>80?'var(--red)':'var(--gold)',borderRadius:4}}/></div>
                      <span style={{fontFamily:'Space Mono,monospace',color:'var(--text2)'}}>{pct}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        }
      </div>}

      {/* BILLING */}
      {tab==='billing'&&<div>
        <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:18,marginBottom:20}}>💳 Facturation</div>
        {campaigns.length===0
          ?<div style={{textAlign:'center',padding:60,color:'var(--text3)'}}><div style={{fontSize:48,marginBottom:12}}>💳</div><div style={{fontSize:15}}>Aucune facturation</div><div style={{fontSize:12,marginTop:8}}>L'historique de vos dépenses publicitaires apparaîtra ici.</div></div>
          :<>
            {/* Billing summary */}
            <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:20,marginBottom:20}}>
              <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:15,marginBottom:16}}>📊 Résumé de facturation</div>
              {[
                ['Total des campagnes',campaigns.length],
                ['Budget total alloué',campaigns.reduce((a,c)=>a+(c.budget_amount||0),0).toLocaleString()+' KMF'],
                ['Total dépensé',totalSpent.toLocaleString()+' KMF'],
                ['Budget restant',(campaigns.reduce((a,c)=>a+(c.budget_amount||0),0)-totalSpent).toLocaleString()+' KMF'],
                ['Campagnes actives',campaigns.filter(c=>c.status==='active').length],
                ['Campagnes terminées',campaigns.filter(c=>c.status==='completed').length],
              ].map(([k,v])=>(
                <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid var(--border)',fontSize:13}}>
                  <span style={{color:'var(--text2)'}}>{k}</span>
                  <span style={{fontFamily:'Space Mono,monospace',fontWeight:700}}>{v}</span>
                </div>
              ))}
            </div>

            {/* Per-campaign billing */}
            <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:15,marginBottom:12}}>📋 Détail par campagne</div>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {campaigns.map(cp=>{
                const st=STATUS_STYLE[cp.status]||STATUS_STYLE.draft
                return(
                  <div key={cp.id} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:16,display:'flex',alignItems:'center',gap:14}}>
                    <span style={{fontSize:24}}>{FORMATS.find(f=>f.id===cp.format)?.icon||'📢'}</span>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,fontSize:13}}>{cp.name}</div>
                      <div style={{fontSize:11,color:'var(--text3)',marginTop:2}}>
                        {cp.starts_at?new Date(cp.starts_at).toLocaleDateString('fr'):'—'} → {cp.ends_at?new Date(cp.ends_at).toLocaleDateString('fr'):'En cours'}
                      </div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontFamily:'Space Mono,monospace',fontWeight:700,fontSize:13}}>{(cp.budget_spent||0).toLocaleString()} KMF</div>
                      <div style={{fontSize:10,color:'var(--text3)'}}>sur {(cp.budget_amount||0).toLocaleString()} KMF</div>
                    </div>
                    <span style={{padding:'3px 8px',borderRadius:20,fontSize:10,fontWeight:700,background:st.bg,color:st.c}}>{st.l}</span>
                  </div>
                )
              })}
            </div>
          </>
        }
      </div>}
    </div>
  )
}
