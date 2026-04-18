import { useState, useEffect } from "react"
import { useAuthStore, usePageStore } from "../stores/index.js"
import api from "../services/api.js"
import { getFlag, getFlagName } from "../services/flags.js"

const API=import.meta.env.VITE_API_URL||''
const adminApi={
  get:async(path)=>{
    const r=await fetch(API+path,{headers:{'Authorization':'Bearer '+localStorage.getItem('waiichia_token')}})
    const d=await r.json()
    if(!r.ok) throw new Error(d.error||'Erreur '+r.status)
    return d
  },
  patch:async(path,body)=>{
    const r=await fetch(API+path,{method:'PATCH',headers:{'Content-Type':'application/json','Authorization':'Bearer '+localStorage.getItem('waiichia_token')},body:JSON.stringify(body)})
    const d=await r.json()
    if(!r.ok) throw new Error(d.error||'Erreur '+r.status)
    return d
  },
  put:async(path,body)=>{
    const r=await fetch(API+path,{method:'PUT',headers:{'Content-Type':'application/json','Authorization':'Bearer '+localStorage.getItem('waiichia_token')},body:JSON.stringify(body)})
    const d=await r.json()
    if(!r.ok) throw new Error(d.error||'Erreur '+r.status)
    return d
  },
  del:async(path)=>{
    const r=await fetch(API+path,{method:'DELETE',headers:{'Authorization':'Bearer '+localStorage.getItem('waiichia_token')}})
    const d=await r.json()
    if(!r.ok) throw new Error(d.error||'Erreur '+r.status)
    return d
  },
}
const fmtS=n=>{if(!n||n===0)return'0';if(n>=1000000)return(n/1000000).toFixed(1)+'M';if(n>=1000)return(n/1000).toFixed(1)+'K';return String(n)}
const NAV=[
  {g:'PRINCIPAL',items:[{id:'dashboard',icon:'📊',label:'Dashboard'}]},
  {g:'GESTION',items:[{id:'users',icon:'👥',label:'Utilisateurs'},{id:'content',icon:'🎵',label:'Contenu'},{id:'verifications',icon:'✅',label:'Vérifications'},{id:'deposits',icon:'💰',label:'Dépôts / Recharges'},{id:'profile_requests',icon:'🔄',label:'Demandes Profil'}]},
  {g:'REVENUS',items:[{id:'payment_config',icon:'💳',label:'Paiements'},{id:'finance',icon:'📊',label:'Finances'}]},
  {g:'SYSTÈME',items:[{id:'settings',icon:'⚙️',label:'Paramètres'},{id:'logs',icon:'📋',label:'Journaux'}]},
]

export default function Admin(){
  const {user}=useAuthStore()
  const {setPage}=usePageStore()
  const [tab,setTab]=useState('dashboard')
  const [stats,setStats]=useState({})
  const [users,setUsers]=useState([])
  const [content,setContent]=useState([])
  const [verifs,setVerifs]=useState([])
  const [deposits,setDeposits]=useState([])
  const [profileReqs,setProfileReqs]=useState([])
  const [payConfig,setPayConfig]=useState({})
  const [socialConfig,setSocialConfig]=useState({
    facebook:{enabled:false,client_id:'',client_secret:'',redirect_url:''},
    google:{enabled:false,client_id:'',client_secret:'',redirect_url:''},
    wanzani:{enabled:false,api_key:'',api_secret:'',redirect_url:'',base_url:''},
    x:{enabled:false,client_id:'',client_secret:'',redirect_url:''}
  })
  const [savingSocial,setSavingSocial]=useState(false)
  const [loading,setLoading]=useState(false)
  const [toast,setToast]=useState('')
  const [search,setSearch]=useState('')

  const showToast=m=>{setToast(m);setTimeout(()=>setToast(''),3000)}

  useEffect(()=>{
    setLoading(true)
    if(tab==='dashboard') adminApi.get('/api/admin/stats').then(s=>setStats(s)).catch(()=>{api.profiles.stats().then(s=>setStats(s)).catch(()=>{})})
    if(tab==='users') adminApi.get('/api/admin/users?limit=50').then(d=>setUsers(d.users||[])).catch(()=>{})
    if(tab==='content') adminApi.get('/api/admin/content?limit=50').then(d=>setContent(d.content||[])).catch(()=>{})
    if(tab==='verifications') adminApi.get('/api/admin/verifications').then(d=>setVerifs(d.verifications||[])).catch(()=>{})
    if(tab==='deposits') adminApi.get('/api/admin/deposits').then(d=>setDeposits(d.deposits||[])).catch(()=>{})
    if(tab==='profile_requests') adminApi.get('/api/admin/profile-requests').then(d=>setProfileReqs(d.requests||[])).catch(()=>{})
    if(tab==='payment_config') adminApi.get('/api/admin/payment-config').then(d=>setPayConfig(d.config||{})).catch(()=>{})
    if(tab==='settings') adminApi.get('/api/auth/social-config/full').then(d=>{if(d?.config)setSocialConfig(d.config)}).catch(()=>{})
    setLoading(false)
  },[tab])

  const userAction=async(id,action)=>{
    const r=await adminApi.patch('/api/admin/users/'+id+'/status',{action})
    showToast(r.message||'✅ Fait')
    setUsers(u=>u.map(x=>x.id===id?{...x,...(action==='suspend'?{is_active:false}:action==='activate'?{is_active:true}:action==='verify'?{is_verified:true}:action==='unverify'?{is_verified:false}:{})}:x))
  }
  const contentAction=async(id,action)=>{
    const r=await adminApi.patch('/api/admin/content/'+id+'/status',{action})
    showToast(r.message||'✅ Fait')
    if(action==='delete')setContent(c=>c.filter(x=>x.id!==id))
    else setContent(c=>c.map(x=>x.id===id?{...x,is_active:action==='activate',is_published:action==='activate'}:x))
  }
  const verifAction=async(id,action)=>{
    const r=await adminApi.patch('/api/admin/verifications/'+id,{action})
    showToast(r.message||'✅ Fait')
    setVerifs(v=>v.filter(x=>x.id!==id))
  }
  const depositAction=async(id,action)=>{
    const r=await adminApi.patch('/api/admin/deposits/'+id,{action})
    showToast(r.message||'✅ Fait')
    setDeposits(d=>d.filter(x=>x.id!==id))
  }
  const changeRole=async(id,newType)=>{
    const r=await adminApi.patch('/api/admin/users/'+id+'/role',{profile_type:newType})
    showToast(r.user?'Profil changé en '+newType:'Erreur')
    setUsers(u=>u.map(x=>x.id===id?{...x,profile_type:newType}:x))
  }
  const profileReqAction=async(id,action,newType)=>{
    const r=await adminApi.patch('/api/admin/profile-requests/'+id,{action,new_profile_type:newType})
    showToast(r.user?'Profil mis à jour':'Erreur')
    setProfileReqs(p=>p.filter(x=>x.id!==id))
  }
  const savePayConfig=async()=>{
    try{
      await adminApi.put('/api/admin/payment-config',{config:payConfig})
      // Relire pour vérifier la persistance
      const fresh=await adminApi.get('/api/admin/payment-config')
      if(fresh?.config) setPayConfig(fresh.config)
      showToast('✅ Configuration paiements sauvegardée')
    }catch(e){showToast('❌ Erreur paiements: '+e.message)}
  }
  const saveSocialConfig=async()=>{
    setSavingSocial(true)
    try{
      const res=await adminApi.patch('/api/auth/social-config',socialConfig)
      // Relire pour vérifier la persistance
      const fresh=await adminApi.get('/api/auth/social-config/full')
      if(fresh?.config) setSocialConfig(fresh.config)
      showToast('✅ Configuration sociale sauvegardée')
    }catch(e){showToast('❌ Erreur sociale: '+e.message)}
    setSavingSocial(false)
  }

  if(!user)return(<div style={{textAlign:'center',padding:60}}><div style={{fontSize:48,marginBottom:16}}>🛡️</div><h2 style={{fontFamily:'Syne,sans-serif'}}>Connectez-vous en admin</h2><button className="btn btn-primary" onClick={()=>setPage('login')} style={{marginTop:16}}>Se connecter</button></div>)

  return(
    <div style={{display:'grid',gridTemplateColumns:'220px 1fr',minHeight:'calc(100vh - 80px)',margin:'-20px -20px 0'}}>
      {toast&&<div style={{position:'fixed',top:20,left:'50%',transform:'translateX(-50%)',background:'var(--gold)',color:'#000',padding:'10px 24px',borderRadius:'var(--radius-sm)',fontWeight:700,fontSize:13,zIndex:9999}}>{toast}</div>}

      {/* SIDEBAR */}
      <aside style={{background:'var(--card)',borderRight:'1px solid var(--border)',display:'flex',flexDirection:'column'}}>
        <div style={{padding:'20px 18px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:12}}>
          <div style={{width:36,height:36,borderRadius:10,background:'linear-gradient(135deg,var(--gold),#e63946)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>🛡️</div>
          <div><div style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:14}}>Waiichia Admin</div><div style={{fontSize:10,color:'var(--text3)'}}>Panneau de contrôle</div></div>
        </div>
        <nav style={{flex:1,padding:'10px 0'}}>
          {NAV.map(g=><div key={g.g}>
            <div style={{padding:'12px 18px 4px',fontSize:9,letterSpacing:2,textTransform:'uppercase',color:'var(--text3)',fontFamily:'Space Mono,monospace'}}>{g.g}</div>
            {g.items.map(it=><div key={it.id} onClick={()=>setTab(it.id)} style={{padding:'9px 18px',display:'flex',alignItems:'center',gap:10,cursor:'pointer',fontSize:13,color:tab===it.id?'var(--text)':'var(--text2)',background:tab===it.id?'var(--bg2)':'transparent',fontWeight:tab===it.id?600:400,borderLeft:tab===it.id?'2px solid var(--gold)':'2px solid transparent'}}><span>{it.icon}</span>{it.label}</div>)}
          </div>)}
        </nav>
        <div style={{padding:'12px 18px',borderTop:'1px solid var(--border)',display:'flex',alignItems:'center',gap:8,fontSize:11,color:'var(--green)'}}><div style={{width:6,height:6,borderRadius:'50%',background:'var(--green)'}}/>En ligne</div>
      </aside>

      {/* CONTENU */}
      <div style={{padding:24,overflowY:'auto'}}>

        {/* ═══ DASHBOARD ═══ */}
        {tab==='dashboard'&&<div>
          <h2 style={{fontFamily:'Syne,sans-serif',fontSize:20,marginBottom:20}}>📊 Dashboard — Données réelles</h2>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:12,marginBottom:24}}>
            {[
              {icon:'👥',num:fmtS(stats.users_count||stats.creators_count),label:'Utilisateurs',color:'var(--green)'},
              {icon:'🎵',num:fmtS(stats.tracks_count),label:'Contenus',color:'var(--gold)'},
              {icon:'▶',num:fmtS(stats.total_plays),label:'Écoutes',color:'var(--blue)'},
              {icon:'🚩',num:fmtS(stats.reports_count),label:'Signalements',color:'var(--red)'},
              {icon:'📻',num:fmtS(stats.radios_count),label:'Radios',color:'var(--purple)'},
              {icon:'💰',num:fmtS(stats.total_revenue),label:'Revenus (KMF)',color:'var(--gold)'},
            ].map(k=><div key={k.label} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'16px 18px',borderLeft:'3px solid '+k.color}}>
              <div style={{fontSize:22,marginBottom:6}}>{k.icon}</div>
              <div style={{fontFamily:'Syne,sans-serif',fontSize:20,fontWeight:800}}>{k.num}</div>
              <div style={{fontSize:11,color:'var(--text2)'}}>{k.label}</div>
            </div>)}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
            <button className="btn btn-primary" onClick={()=>setTab('users')}>👥 Gérer les utilisateurs</button>
            <button className="btn btn-secondary" onClick={()=>setTab('verifications')}>✅ Vérifications en attente</button>
            <button className="btn btn-outline" onClick={()=>setTab('deposits')}>💰 Dépôts à valider</button>
          </div>
        </div>}

        {/* ═══ UTILISATEURS ═══ */}
        {tab==='users'&&<div>
          <h2 style={{fontFamily:'Syne,sans-serif',fontSize:20,marginBottom:16}}>👥 Utilisateurs ({users.length})</h2>
          <input className="input-field" placeholder="🔍 Rechercher..." value={search} onChange={e=>setSearch(e.target.value)} style={{marginBottom:16,maxWidth:400}}/>
          <div style={{overflowX:'auto',background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead><tr>{['Utilisateur','Profil','Pays','Inscription','Vérifié','Statut','Actions'].map(h=><th key={h} style={{textAlign:'left',padding:'10px 12px',borderBottom:'2px solid var(--border)',fontSize:11,color:'var(--text3)',fontFamily:'Space Mono,monospace'}}>{h}</th>)}</tr></thead>
              <tbody>
                {users.filter(u=>!search||u.display_name?.toLowerCase().includes(search.toLowerCase())||u.email?.toLowerCase().includes(search.toLowerCase())).map(u=>(
                  <tr key={u.id} style={{borderBottom:'1px solid var(--border)'}}>
                    <td style={{padding:'10px 12px'}}><div style={{display:'flex',alignItems:'center',gap:8}}><div style={{width:28,height:28,borderRadius:'50%',background:'linear-gradient(135deg,var(--gold),#e63946)',fontSize:10,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center'}}>{(u.display_name||'?')[0]}</div><div><div style={{fontWeight:600}}>{u.display_name||'Sans nom'}</div><div style={{fontSize:10,color:'var(--text3)'}}>{u.email}</div></div></div></td>
                    <td style={{padding:'10px 12px'}}><span style={{padding:'2px 8px',borderRadius:12,fontSize:10,background:'var(--bg2)',fontFamily:'Space Mono,monospace'}}>{u.profile_type||'listener'}</span></td>
                    <td style={{padding:'10px 12px'}}>{u.country?getFlagName(u.country):'—'}</td>
                    <td style={{padding:'10px 12px',fontSize:11,color:'var(--text3)'}}>{u.created_at?new Date(u.created_at).toLocaleDateString('fr'):'—'}</td>
                    <td style={{padding:'10px 12px'}}>{u.is_verified?<span style={{color:'var(--green)'}}>✅</span>:<span style={{color:'var(--text3)'}}>❌</span>}</td>
                    <td style={{padding:'10px 12px'}}>{u.is_active===false?<span style={{color:'var(--red)',fontSize:10,fontWeight:700}}>SUSPENDU</span>:<span style={{color:'var(--green)',fontSize:10,fontWeight:700}}>ACTIF</span>}</td>
                    <td style={{padding:'10px 12px'}}><div style={{display:'flex',gap:4}}>
                      {!u.is_verified&&<Btn onClick={()=>userAction(u.id,'verify')} title="Vérifier">✅</Btn>}
                      {u.is_verified&&<Btn onClick={()=>userAction(u.id,'unverify')} title="Retirer vérification">❌</Btn>}
                      {u.is_active!==false&&<Btn red onClick={()=>userAction(u.id,'suspend')} title="Suspendre">🔒</Btn>}
                      <select style={{padding:'2px 4px',borderRadius:4,border:'1px solid var(--border)',background:'var(--card)',color:'var(--text)',fontSize:10,cursor:'pointer'}} value={u.profile_type||'listener'} onChange={e=>changeRole(u.id,e.target.value)}><option value="listener">listener</option><option value="artist">artist</option><option value="media">media</option><option value="label">label</option><option value="pro">pro</option></select>
                      {u.is_active===false&&<Btn onClick={()=>userAction(u.id,'activate')} title="Réactiver">🔓</Btn>}
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!users.length&&<div style={{textAlign:'center',padding:40,color:'var(--text3)'}}>Aucun utilisateur trouvé</div>}
        </div>}

        {/* ═══ CONTENU ═══ */}
        {tab==='content'&&<div>
          <h2 style={{fontFamily:'Syne,sans-serif',fontSize:20,marginBottom:16}}>🎵 Contenu ({content.length})</h2>
          <div style={{overflowX:'auto',background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead><tr>{['Titre','Artiste','Type','Genre','Écoutes','Prix','Statut','Actions'].map(h=><th key={h} style={{textAlign:'left',padding:'10px 12px',borderBottom:'2px solid var(--border)',fontSize:11,color:'var(--text3)',fontFamily:'Space Mono,monospace'}}>{h}</th>)}</tr></thead>
              <tbody>
                {content.map(c=>(
                  <tr key={c.id} style={{borderBottom:'1px solid var(--border)'}}>
                    <td style={{padding:'10px 12px',fontWeight:600}}>{c.title}</td>
                    <td style={{padding:'10px 12px',color:'var(--text2)'}}>{c.profiles?.display_name||'—'}</td>
                    <td style={{padding:'10px 12px'}}><span style={{padding:'2px 8px',borderRadius:12,fontSize:10,background:c.type==='music'?'rgba(245,166,35,.15)':'rgba(77,159,255,.15)',color:c.type==='music'?'var(--gold)':'var(--blue)',fontFamily:'Space Mono,monospace'}}>{c.type}</span></td>
                    <td style={{padding:'10px 12px',color:'var(--text3)'}}>{c.genre||'—'}</td>
                    <td style={{padding:'10px 12px',fontFamily:'Space Mono,monospace'}}>{fmtS(c.play_count)}</td>
                    <td style={{padding:'10px 12px',fontFamily:'Space Mono,monospace',color:'var(--gold)'}}>{c.sale_price?c.sale_price+' KMF':'Gratuit'}</td>
                    <td style={{padding:'10px 12px'}}>{c.is_active&&c.is_published?<span style={{color:'var(--green)',fontSize:10,fontWeight:700}}>PUBLIÉ</span>:<span style={{color:'var(--red)',fontSize:10,fontWeight:700}}>SUSPENDU</span>}</td>
                    <td style={{padding:'10px 12px'}}><div style={{display:'flex',gap:4}}>
                      {c.is_active?<Btn red onClick={()=>contentAction(c.id,'suspend')}>⏸</Btn>:<Btn onClick={()=>contentAction(c.id,'activate')}>▶</Btn>}
                      <Btn red onClick={()=>{if(confirm('Supprimer "'+c.title+'" ?'))contentAction(c.id,'delete')}}>🗑</Btn>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!content.length&&<div style={{textAlign:'center',padding:40,color:'var(--text3)'}}>Aucun contenu</div>}
        </div>}

        {/* ═══ VÉRIFICATIONS ═══ */}
        {tab==='verifications'&&<div>
          <h2 style={{fontFamily:'Syne,sans-serif',fontSize:20,marginBottom:16}}>✅ Demandes de vérification ({verifs.length})</h2>
          {verifs.length?verifs.map(v=>(
            <div key={v.id} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:18,marginBottom:12,display:'flex',alignItems:'center',gap:16}}>
              <div style={{width:48,height:48,borderRadius:'50%',background:'linear-gradient(135deg,var(--gold),#e63946)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:18}}>{(v.display_name||'?')[0]}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:14}}>{v.display_name} <span style={{fontSize:11,color:'var(--text3)'}}>@{v.username}</span></div>
                <div style={{fontSize:12,color:'var(--text2)'}}>Profil demandé : {v.requested_profile_type||v.profile_type||'artiste'} · Pays : {v.country?getFlagName(v.country):'—'}</div>
                <div style={{fontSize:11,color:'var(--text3)'}}>Email : {v.email} · Inscrit le {v.created_at?new Date(v.created_at).toLocaleDateString('fr'):''}</div>
              </div>
              <div style={{display:'flex',gap:8}}>
                <button className="btn btn-primary btn-sm" onClick={()=>verifAction(v.id,'approve')}>✅ Approuver</button>
                <button className="btn btn-outline btn-sm" style={{color:'var(--red)',borderColor:'var(--red)'}} onClick={()=>verifAction(v.id,'reject')}>❌ Rejeter</button>
              </div>
            </div>
          )):<div style={{textAlign:'center',padding:40,color:'var(--text3)'}}><div style={{fontSize:48,marginBottom:12}}>✅</div>Aucune demande en attente</div>}
        </div>}

        {/* ═══ DÉPÔTS / RECHARGES ═══ */}
        {tab==='deposits'&&<div>
          <h2 style={{fontFamily:'Syne,sans-serif',fontSize:20,marginBottom:16}}>💰 Dépôts à valider ({deposits.length})</h2>
          {deposits.length?deposits.map(d=>(
            <div key={d.id} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:18,marginBottom:12,display:'flex',alignItems:'center',gap:16}}>
              <div style={{width:48,height:48,borderRadius:10,background:'rgba(44,198,83,.12)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24}}>💰</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:14}}>{d.amount?.toLocaleString()} {d.currency||'KMF'}</div>
                <div style={{fontSize:12,color:'var(--text2)'}}>Par : {d.profiles?.display_name||'Utilisateur'} · Méthode : {d.method||'cash'}</div>
                <div style={{fontSize:11,color:'var(--text3)'}}>Référence : {d.reference||'—'} · {d.created_at?new Date(d.created_at).toLocaleDateString('fr'):''}</div>
              </div>
              <div style={{display:'flex',gap:8}}>
                <button className="btn btn-primary btn-sm" onClick={()=>depositAction(d.id,'approve')}>✅ Valider</button>
                <button className="btn btn-outline btn-sm" style={{color:'var(--red)',borderColor:'var(--red)'}} onClick={()=>depositAction(d.id,'reject')}>❌ Rejeter</button>
              </div>
            </div>
          )):<div style={{textAlign:'center',padding:40,color:'var(--text3)'}}><div style={{fontSize:48,marginBottom:12}}>✅</div>Aucun dépôt en attente</div>}
        </div>}

        {/* ═══ DEMANDES DE PROFIL ═══ */}
        {tab==='profile_requests'&&<div>
          <h2 style={{fontFamily:'Syne,sans-serif',fontSize:20,marginBottom:16}}>🔄 Demandes de changement de profil ({profileReqs.length})</h2>
          {profileReqs.length?profileReqs.map(r=>(
            <div key={r.id} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:18,marginBottom:12,display:'flex',alignItems:'center',gap:16}}>
              <div style={{width:48,height:48,borderRadius:'50%',background:'linear-gradient(135deg,var(--gold),#e63946)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:18}}>{(r.display_name||'?')[0]}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:14}}>{r.display_name} <span style={{fontSize:11,color:'var(--text3)'}}>@{r.username}</span></div>
                <div style={{fontSize:12,color:'var(--text2)'}}>Profil actuel : <strong>{r.profile_type}</strong> → Demandé : <strong style={{color:'var(--gold)'}}>{r.requested_profile_type}</strong></div>
                {r.profile_request_reason&&<div style={{fontSize:11,color:'var(--text3)',marginTop:4}}>Raison : {r.profile_request_reason}</div>}
              </div>
              <div style={{display:'flex',gap:8}}>
                <button className="btn btn-primary btn-sm" onClick={()=>profileReqAction(r.id,'approve',r.requested_profile_type)}>✅ Approuver</button>
                <button className="btn btn-outline btn-sm" style={{color:'var(--red)',borderColor:'var(--red)'}} onClick={()=>profileReqAction(r.id,'reject')}>❌ Rejeter</button>
              </div>
            </div>
          )):<div style={{textAlign:'center',padding:40,color:'var(--text3)'}}><div style={{fontSize:48,marginBottom:12}}>✅</div>Aucune demande en attente</div>}
        </div>}

        {/* ═══ CONFIG PAIEMENT ═══ */}
        {tab==='payment_config'&&<div>
          <h2 style={{fontFamily:'Syne,sans-serif',fontSize:20,marginBottom:6}}>💳 Méthodes de paiement</h2>
          <div style={{fontSize:12,color:'var(--text3)',marginBottom:16}}>Activez les modes de paiement et configurez les informations API. Les mêmes modes seront disponibles pour la recharge et le retrait.</div>
          <div style={{display:'flex',flexDirection:'column',gap:14,marginBottom:20}}>
            {[
              {id:'mvola',icon:'📲',name:'Mvola (USSD)',desc:'Comores Telecom',fields:['phone']},
              {id:'cash',icon:'💵',name:'Dépôt Cash',desc:'Points de vente',fields:[]},
              {id:'bank',icon:'🏦',name:'Virement bancaire',desc:'IBAN / SWIFT',fields:['bank_name','iban','swift']},
              {id:'card',icon:'💳',name:'Carte bancaire',desc:'Stripe',fields:['stripe_key']},
              {id:'paypal',icon:'🅿️',name:'PayPal',desc:'PayPal',fields:['client_id','client_secret']},
              {id:'wave',icon:'🌊',name:'Wave',desc:'SN, CI',fields:['api_key']},
              {id:'orange_money',icon:'🟠',name:'Orange Money',desc:'Mobile Money',fields:['phone']},
              {id:'mpesa',icon:'📱',name:'M-Pesa',desc:'Mobile Money',fields:['phone']},
            ].map(m=>{
              const cfg=payConfig[m.id]||{}
              const enabled=!!cfg.enabled
              return(
                <div key={m.id} style={{background:'var(--card)',border:`1px solid ${enabled?'rgba(44,198,83,.3)':'var(--border)'}`,borderRadius:'var(--radius)',overflow:'hidden'}}>
                  <div style={{padding:'14px 18px',display:'flex',alignItems:'center',gap:14}}>
                    <span style={{fontSize:28}}>{m.icon}</span>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,fontSize:13}}>{m.name}</div>
                      <div style={{fontSize:11,color:'var(--text3)'}}>{m.desc}</div>
                    </div>
                    <span style={{padding:'3px 10px',borderRadius:20,fontSize:10,fontWeight:700,fontFamily:'Space Mono,monospace',background:enabled?'rgba(44,198,83,.15)':'rgba(230,57,70,.1)',color:enabled?'var(--green)':'var(--red)'}}>{enabled?'ACTIF':'INACTIF'}</span>
                    <button onClick={()=>setPayConfig(c=>({...c,[m.id]:{...c[m.id],enabled:!enabled}}))} style={{
                      width:44,height:24,borderRadius:12,border:'none',cursor:'pointer',position:'relative',transition:'background .2s',
                      background:enabled?'var(--green)':'var(--border)'
                    }}>
                      <div style={{width:20,height:20,borderRadius:'50%',background:'#fff',position:'absolute',top:2,left:enabled?22:2,transition:'left .2s',boxShadow:'0 1px 3px rgba(0,0,0,.3)'}}/>
                    </button>
                  </div>
                  {m.fields.length>0&&<div style={{padding:'0 18px 14px',display:'flex',flexWrap:'wrap',gap:8}}>
                    {m.fields.map(field=>(
                      <div key={field} style={{flex:field==='iban'?'1 1 100%':'1 1 45%',minWidth:140}}>
                        <label style={{display:'block',fontSize:10,fontWeight:700,letterSpacing:1,color:'var(--text3)',marginBottom:4,textTransform:'uppercase'}}>{field.replace(/_/g,' ')}</label>
                        <input
                          type={field.includes('secret')?'password':'text'}
                          value={cfg[field]||''}
                          onChange={e=>setPayConfig(c=>({...c,[m.id]:{...c[m.id],[field]:e.target.value}}))}
                          placeholder={field==='phone'?'ex: 3234567':field==='iban'?'KM46 ...':field==='swift'?'BDCMKMKC':'...'}
                          style={{width:'100%',padding:'8px 12px',borderRadius:6,border:'1px solid var(--border)',background:'var(--bg2)',color:'var(--text)',fontSize:12,boxSizing:'border-box',fontFamily:'Space Mono,monospace'}}
                        />
                      </div>
                    ))}
                  </div>}
                </div>
              )
            })}
          </div>
          <button className="btn btn-primary" onClick={savePayConfig}>💾 Sauvegarder la configuration paiements</button>
        </div>}

        {/* ═══ FINANCES ═══ */}
        {tab==='finance'&&<div>
          <h2 style={{fontFamily:'Syne,sans-serif',fontSize:20,marginBottom:16}}>📊 Finances</h2>
          <div style={{textAlign:'center',padding:40,color:'var(--text3)'}}><div style={{fontSize:48,marginBottom:12}}>📊</div>Les statistiques financières détaillées seront disponibles avec plus de transactions.</div>
        </div>}

        {/* ═══ PARAMÈTRES ═══ */}
        {tab==='settings'&&<div>
          <h2 style={{fontFamily:'Syne,sans-serif',fontSize:20,marginBottom:20}}>⚙️ Paramètres système</h2>

          {/* ── Connexion sociale ── */}
          <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:20,marginBottom:20}}>
            <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:15,marginBottom:4}}>🔑 Connexion sociale</div>
            <div style={{fontSize:12,color:'var(--text3)',marginBottom:16}}>Configurez les clés API et activez chaque fournisseur. Les boutons activés apparaissent sur la page de connexion.</div>
            <div style={{display:'flex',flexDirection:'column',gap:14,marginBottom:16}}>
              {[
                {id:'facebook',icon:'📘',name:'Facebook',fields:['client_id','client_secret','redirect_url']},
                {id:'google',icon:'🔍',name:'Google',fields:['client_id','client_secret','redirect_url']},
                {id:'wanzani',icon:'🌴',name:'Wanzani',fields:['api_key','api_secret','redirect_url','base_url']},
                {id:'x',icon:'𝕏',name:'X (Twitter)',fields:['client_id','client_secret','redirect_url']},
              ].map(btn=>{
                const cfg=socialConfig[btn.id]||{}
                const enabled=!!cfg.enabled
                return(
                  <div key={btn.id} style={{background:'var(--bg2)',borderRadius:10,border:`1px solid ${enabled?'rgba(44,198,83,.3)':'var(--border)'}`,overflow:'hidden'}}>
                    <div style={{display:'flex',alignItems:'center',gap:14,padding:'12px 16px'}}>
                      <span style={{fontSize:24}}>{btn.icon}</span>
                      <div style={{flex:1}}><div style={{fontWeight:700,fontSize:13}}>{btn.name}</div></div>
                      <span style={{padding:'3px 10px',borderRadius:20,fontSize:10,fontWeight:700,fontFamily:'Space Mono,monospace',background:enabled?'rgba(44,198,83,.15)':'rgba(230,57,70,.1)',color:enabled?'var(--green)':'var(--red)'}}>{enabled?'ACTIVÉ':'DÉSACTIVÉ'}</span>
                      <button onClick={()=>setSocialConfig(c=>({...c,[btn.id]:{...(c[btn.id]||{}),enabled:!enabled}}))} style={{width:44,height:24,borderRadius:12,border:'none',cursor:'pointer',position:'relative',transition:'background .2s',background:enabled?'var(--green)':'var(--border)'}}>
                        <div style={{width:20,height:20,borderRadius:'50%',background:'#fff',position:'absolute',top:2,left:enabled?22:2,transition:'left .2s',boxShadow:'0 1px 3px rgba(0,0,0,.3)'}}/>
                      </button>
                    </div>
                    <div style={{padding:'0 16px 14px',display:'flex',flexDirection:'column',gap:6}}>
                      {btn.fields.map(f=>(
                        <div key={f}><label style={{display:'block',fontSize:10,fontWeight:700,letterSpacing:1,color:'var(--text3)',marginBottom:3,textTransform:'uppercase'}}>{f.replace(/_/g,' ')}</label>
                        <input type={f.includes('secret')?'password':'text'} value={cfg[f]||''} onChange={e=>setSocialConfig(c=>({...c,[btn.id]:{...(c[btn.id]||{}),[f]:e.target.value}}))} placeholder={f.includes('url')?'https://...':f.includes('id')?'Votre '+f:'••••••••'} style={{width:'100%',padding:'7px 10px',borderRadius:6,border:'1px solid var(--border)',background:'var(--card)',color:'var(--text)',fontSize:11,boxSizing:'border-box',fontFamily:'Space Mono,monospace'}}/></div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
            <button onClick={saveSocialConfig} disabled={savingSocial} style={{padding:'10px 24px',borderRadius:8,border:'none',background:'linear-gradient(135deg,var(--gold),#e8920a)',color:'#000',fontSize:13,fontWeight:700,cursor:savingSocial?'not-allowed':'pointer',opacity:savingSocial?.6:1}}>
              {savingSocial?'⏳ Sauvegarde...':'💾 Sauvegarder la configuration sociale'}
            </button>
          </div>

          {/* ── Infos système ── */}
          <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:20}}>
            <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:15,marginBottom:12}}>📋 Informations système</div>
            {[['Plateforme','Waiichia'],['Version','v7.2'],['Supabase','Connecté ✅'],['Profil par défaut','listener (utilisateur normal)'],['Commission ventes','15%'],['Commission locations','20%'],['Commission retraits','2.5%'],['Commission transferts','1%']].map(([k,v])=>(
              <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'12px 0',borderBottom:'1px solid var(--border)',fontSize:13}}>
                <span style={{color:'var(--text2)'}}>{k}</span><span style={{fontFamily:'Space Mono,monospace'}}>{v}</span>
              </div>
            ))}
          </div>
        </div>}

        {/* ═══ JOURNAUX ═══ */}
        {tab==='logs'&&<div>
          <h2 style={{fontFamily:'Syne,sans-serif',fontSize:20,marginBottom:16}}>📋 Journaux</h2>
          <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:16,fontFamily:'Space Mono,monospace',fontSize:11,lineHeight:2,color:'var(--text2)',maxHeight:500,overflowY:'auto'}}>
            <div>Consultez les logs du serveur avec :</div>
            <div style={{color:'var(--gold)',marginTop:8}}>pm2 logs waiichia-api</div>
          </div>
        </div>}
      </div>
    </div>
  )
}

function Btn({children,onClick,red,title}){
  return <button onClick={onClick} title={title} style={{padding:'4px 8px',borderRadius:'var(--radius-sm)',border:'1px solid var(--border)',background:red?'rgba(230,57,70,.1)':'var(--card2)',cursor:'pointer',fontSize:11,color:red?'var(--red)':'var(--text2)'}}>{children}</button>
}
