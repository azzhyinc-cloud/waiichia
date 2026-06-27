import { useState, useEffect } from "react"
import { useAuthStore, usePageStore } from "../stores/index.js"
import api from "../services/api.js"
import { getFlag, getFlagName } from "../services/flags.js"
import EditRadioModal from "../components/EditRadioModal.jsx"

const API=import.meta.env.VITE_API_URL||''
const getToken=()=>localStorage.getItem('waiichia_token')
const adminApi={
  get:async(path)=>{
    const r=await fetch(API+path,{headers:{'Authorization':'Bearer '+getToken()}})
    const d=await r.json()
    if(!r.ok) throw new Error(d.error||'Erreur '+r.status)
    return d
  },
  patch:async(path,body)=>{
    const r=await fetch(API+path,{method:'PATCH',headers:{'Content-Type':'application/json','Authorization':'Bearer '+getToken()},body:JSON.stringify(body)})
    const d=await r.json()
    if(!r.ok) throw new Error(d.error||'Erreur '+r.status)
    return d
  },
  put:async(path,body)=>{
    const r=await fetch(API+path,{method:'PUT',headers:{'Content-Type':'application/json','Authorization':'Bearer '+getToken()},body:JSON.stringify(body)})
    const d=await r.json()
    if(!r.ok) throw new Error(d.error||'Erreur '+r.status)
    return d
  },
  del:async(path)=>{
    const r=await fetch(API+path,{method:'DELETE',headers:{'Authorization':'Bearer '+getToken()}})
    const d=await r.json()
    if(!r.ok) throw new Error(d.error||'Erreur '+r.status)
    return d
  },
}
const fmtS=n=>{if(!n||n===0)return'0';if(n>=1000000)return(n/1000000).toFixed(1)+'M';if(n>=1000)return(n/1000).toFixed(1)+'K';return String(n)}
const fmtAmt=n=>new Intl.NumberFormat('fr-FR').format(Math.round(n||0))+' KMF'
const fmtDate=d=>d?new Date(d).toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric'}):''

const TX_META={
  deposit:     {label:'Dépôt',        dir:'in',  icon:'💰'},
  track_buy:   {label:'Vente track',  dir:'in',  icon:'🎵'},
  purchase:    {label:'Achat produit',dir:'out', icon:'🛍️'},
  ticket:      {label:'Billet event', dir:'out', icon:'🎟️'},
  withdrawal:  {label:'Retrait',      dir:'out', icon:'🏦'},
  transfer:    {label:'Transfert',    dir:null,  icon:'↔️'},
  tip:         {label:'Tip radio',    dir:'in',  icon:'🎙️'},
  subscription:{label:'Abonnement',  dir:'out', icon:'⭐'},
}

const NAV=[
  {g:'PRINCIPAL',items:[{id:'dashboard',icon:'📊',label:'Dashboard'}]},
  {g:'GESTION',items:[{id:'users',icon:'👥',label:'Utilisateurs'},{id:'content',icon:'🎵',label:'Contenu'},{id:'verifications',icon:'✅',label:'Vérifications'},{id:'radios',icon:'📻',label:'Radios à valider'},{id:'radios_active',icon:'📡',label:'Radios actives'},{id:'deposits',icon:'💰',label:'Dépôts / Recharges'},{id:'withdrawals',icon:'🏧',label:'Retraits en attente'},{id:'profile_requests',icon:'🔄',label:'Demandes Profil'},{id:'reports',icon:'🚩',label:'Signalements'}]},
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
  const [withdrawals,setWithdrawals]=useState([])
  const [radioPending,setRadioPending]=useState([])
  const [radioActive,setRadioActive]=useState([])
  const [reports,setReports]=useState([])
  const [reportFilter,setReportFilter]=useState('all')
  const [editRadio,setEditRadio]=useState(null)
  const [profileReqs,setProfileReqs]=useState([])
  const [payConfig,setPayConfig]=useState({})
  const [socialConfig,setSocialConfig]=useState({
    facebook:{enabled:false,client_id:'',client_secret:'',redirect_url:''},
    google:{enabled:false,client_id:'',client_secret:'',redirect_url:''},
    wanzani:{enabled:false,api_key:'',api_secret:'',redirect_url:'',base_url:''},
    x:{enabled:false,client_id:'',client_secret:'',redirect_url:''}
  })
  const [savingSocial,setSavingSocial]=useState(false)
  const [financeData,setFinanceData]=useState({transactions:[],stats:{}})
  const [financePeriod,setFinancePeriod]=useState('30d')
  const [loading,setLoading]=useState(false)
  const [toast,setToast]=useState('')
  const [search,setSearch]=useState('')

  const showToast=m=>{setToast(m);setTimeout(()=>setToast(''),3000)}

  const resolveReport=async(id,status,also_remove)=>{
    try{
      await adminApi.patch('/api/admin/reports/'+id,{status,also_remove:!!also_remove})
      setReports(rs=>rs.filter(r=>r.id!==id))
      showToast(also_remove?'Signalement traité + contenu retiré':'Signalement '+status)
    }catch(e){showToast('Erreur : '+(e.message||'action échouée'))}
  }

  useEffect(()=>{
    setLoading(true)
    if(tab==='dashboard') adminApi.get('/api/admin/stats').then(s=>setStats(s)).catch(()=>{api.profiles.stats().then(s=>setStats(s)).catch(()=>{})})
    if(tab==='users') adminApi.get('/api/admin/users?limit=50').then(d=>setUsers(d.users||[])).catch(()=>{})
    if(tab==='content') adminApi.get('/api/admin/content?limit=50').then(d=>setContent(d.content||[])).catch(()=>{})
    if(tab==='verifications') adminApi.get('/api/admin/verifications').then(d=>setVerifs(d.verifications||[])).catch(()=>{})
    if(tab==='deposits') adminApi.get('/api/admin/deposits').then(d=>setDeposits(d.deposits||[])).catch(()=>{})
    if(tab==='withdrawals') adminApi.get('/api/admin/withdrawals').then(d=>setWithdrawals(d.withdrawals||[])).catch(()=>{})
    if(tab==='radios') adminApi.get('/api/admin/radio-pending').then(d=>setRadioPending(d.stations||[])).catch(()=>{})
    if(tab==='radios_active') api.radio.list('?limit=100').then(d=>setRadioActive(d.stations||[])).catch(()=>{})
    if(tab==='reports') adminApi.get('/api/admin/reports').then(d=>setReports(d.reports||[])).catch(()=>{})
    if(tab==='profile_requests') adminApi.get('/api/admin/profile-requests').then(d=>setProfileReqs(d.requests||[])).catch(()=>{})
    if(tab==='payment_config') adminApi.get('/api/admin/payment-config').then(d=>setPayConfig(d.config||{})).catch(()=>{})
    if(tab==='settings') adminApi.get('/api/auth/social-config/full').then(d=>{if(d?.providers)setSocialConfig(d.providers)}).catch(()=>{})
    if(tab==='finance') loadFinance(financePeriod)
    setLoading(false)
  },[tab])

  const loadFinance=async(period)=>{
    try{
      const days=period==='7d'?7:period==='30d'?30:period==='90d'?90:365
      const from=new Date(Date.now()-days*86400000).toISOString()
      const d=await adminApi.get('/api/payments/history?limit=500&from='+from).catch(()=>({transactions:[]}))
      const txs=d.transactions||[]
      // Calculs
      const totalIn=txs.filter(t=>TX_META[t.type]?.dir==='in').reduce((s,t)=>s+(t.amount||0),0)
      const totalOut=txs.filter(t=>TX_META[t.type]?.dir==='out').reduce((s,t)=>s+(t.amount||0),0)
      const deposits=txs.filter(t=>t.type==='deposit').reduce((s,t)=>s+(t.amount||0),0)
      const sales=txs.filter(t=>t.type==='track_buy').reduce((s,t)=>s+(t.amount||0),0)
      const tickets=txs.filter(t=>t.type==='ticket').reduce((s,t)=>s+(t.amount||0),0)
      const withdrawals=txs.filter(t=>t.type==='withdrawal').reduce((s,t)=>s+(t.amount||0),0)
      // Commission estimée (15% sur ventes, 2.5% retraits)
      const commission=sales*0.15+withdrawals*0.025
      // Par type
      const byType={}
      for(const tx of txs){
        const k=tx.type||'other'
        if(!byType[k])byType[k]={count:0,total:0}
        byType[k].count++;byType[k].total+=tx.amount||0
      }
      // Par jour (7 derniers jours pour le graphique)
      const byDay={}
      for(const tx of txs){
        const d=new Date(tx.created_at).toISOString().slice(0,10)
        if(!byDay[d])byDay[d]={in:0,out:0}
        if(TX_META[tx.type]?.dir==='in')byDay[d].in+=tx.amount||0
        else byDay[d].out+=tx.amount||0
      }
      setFinanceData({transactions:txs.slice(0,100),stats:{totalIn,totalOut,deposits,sales,tickets,withdrawals,commission,byType,byDay,count:txs.length}})
    }catch(e){}
  }

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
  const radioAction=async(id,action)=>{
    const r=await adminApi.patch('/api/admin/radio/'+id,{action})
    if(r&&r.error){showToast('❌ '+r.error);return}
    setRadioPending(prev=>prev.filter(s=>s.id!==id))
    showToast(action==='approve'?'✅ Station approuvée':'❌ Station rejetée')
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
      const fresh=await adminApi.get('/api/admin/payment-config')
      if(fresh?.config) setPayConfig(fresh.config)
      showToast('✅ Configuration paiements sauvegardée')
    }catch(e){showToast('❌ Erreur paiements: '+e.message)}
  }
  const saveSocialConfig=async()=>{
    setSavingSocial(true)
    try{
      await adminApi.patch('/api/auth/social-config',{providers:socialConfig})
      const fresh=await adminApi.get('/api/auth/social-config/full')
      if(fresh?.providers) setSocialConfig(fresh.providers)
      showToast('✅ Configuration sociale sauvegardée')
    }catch(e){showToast('❌ Erreur sociale: '+e.message)}
    setSavingSocial(false)
  }

  // Filtres signalements
  const filteredReports=reports.filter(r=>{
    if(reportFilter==='all') return true
    if(reportFilter==='critical') return r.severity==='critical'||r.severity==='high'
    return r.target_type===reportFilter
  })

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
          <h2 style={{fontFamily:'Syne,sans-serif',fontSize:20,marginBottom:20}}>📊 Dashboard</h2>
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
                    <td style={{padding:'10px 12px',fontSize:11,color:'var(--text3)'}}>{u.created_at?new Date(u.created_at).toLocaleDateString('fr'):''}</td>
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
                <div style={{fontSize:12,color:'var(--text2)'}}>Profil : {v.requested_profile_type||v.profile_type||'artiste'} · {v.country?getFlagName(v.country):'—'}</div>
                <div style={{fontSize:11,color:'var(--text3)'}}>{v.email} · {fmtDate(v.created_at)}</div>
              </div>
              <div style={{display:'flex',gap:8}}>
                <button className="btn btn-primary btn-sm" onClick={()=>verifAction(v.id,'approve')}>✅ Approuver</button>
                <button className="btn btn-outline btn-sm" style={{color:'var(--red)',borderColor:'var(--red)'}} onClick={()=>verifAction(v.id,'reject')}>❌ Rejeter</button>
              </div>
            </div>
          )):<div style={{textAlign:'center',padding:40,color:'var(--text3)'}}><div style={{fontSize:48,marginBottom:12}}>✅</div>Aucune demande en attente</div>}
        </div>}

        {/* ═══ RADIOS À VALIDER ═══ */}
        {tab==='radios'&&<div>
          <h2 style={{fontFamily:'Syne,sans-serif',fontSize:20,marginBottom:16}}>📻 Radios soumises ({radioPending.length})</h2>
          {radioPending.length?radioPending.map(s=>(
            <div key={s.id} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:18,marginBottom:12,display:'flex',alignItems:'center',gap:16}}>
              <div style={{width:60,height:60,borderRadius:8,background:'var(--card2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,overflow:'hidden',flexShrink:0}}>
                {s.logo_url?<img src={s.logo_url} alt={s.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:'📻'}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,fontSize:15,marginBottom:3}}>{s.name}</div>
                <div style={{fontSize:12,color:'var(--text2)',marginBottom:4,maxHeight:36,overflow:'hidden'}}>{s.description||'(pas de description)'}</div>
                <div style={{fontSize:11,color:'var(--text3)',marginBottom:3}}>Pays : {s.country||'—'} · Genre : {s.genre||'—'} · Par : {s.profiles?.display_name||'?'}</div>
                <a href={s.stream_url} target="_blank" rel="noopener noreferrer" style={{fontSize:11,color:'var(--gold)',textDecoration:'underline',wordBreak:'break-all'}}>🔗 {s.stream_url}</a>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:8,flexShrink:0}}>
                <button className="btn btn-primary btn-sm" onClick={()=>radioAction(s.id,'approve')}>✅ Approuver</button>
                <button className="btn btn-outline btn-sm" style={{color:'var(--red)',borderColor:'var(--red)'}} onClick={()=>{if(confirm('Supprimer « '+s.name+' » ?'))radioAction(s.id,'reject')}}>❌ Rejeter</button>
              </div>
            </div>
          )):<div style={{textAlign:'center',padding:40,color:'var(--text3)'}}><div style={{fontSize:48,marginBottom:12}}>📻</div>Aucune station en attente</div>}
        </div>}

        {/* ═══ SIGNALEMENTS ═══ */}
        {tab==='reports'&&<div>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:10}}>
            <h2 style={{fontFamily:'Syne,sans-serif',fontSize:20,margin:0}}>🚩 Signalements ({filteredReports.length}/{reports.length})</h2>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              {[
                {key:'all',label:'Tous'},
                {key:'critical',label:'🔴 Critiques'},
                {key:'track',label:'🎵 Tracks'},
                {key:'profile',label:'👤 Profils'},
                {key:'recording',label:'🎤 Duets'},
                {key:'event',label:'🎫 Events'},
              ].map(f=>(
                <button key={f.key} onClick={()=>setReportFilter(f.key)}
                  style={{padding:'5px 12px',borderRadius:20,fontSize:11,fontWeight:600,cursor:'pointer',border:'1px solid '+(reportFilter===f.key?'var(--gold)':'var(--border)'),background:reportFilter===f.key?'rgba(245,166,35,.12)':'transparent',color:reportFilter===f.key?'var(--gold)':'var(--text3)'}}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          {filteredReports.length?filteredReports.map(r=>(
            <div key={r.id} style={{background:'var(--card)',border:'1px solid '+(r.severity==='critical'?'rgba(230,57,70,.4)':r.severity==='high'?'rgba(230,120,0,.3)':'var(--border)'),borderRadius:'var(--radius)',padding:18,marginBottom:12,display:'flex',alignItems:'center',gap:16}}>
              <div style={{width:52,height:52,borderRadius:10,background:r.severity==='critical'?'rgba(230,57,70,.12)':r.severity==='high'?'rgba(230,120,0,.12)':'var(--card2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,flexShrink:0}}>
                {r.severity==='critical'?'🔴':r.severity==='high'?'🟠':r.severity==='low'?'🟡':'🚩'}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                  <div style={{fontWeight:700,fontSize:14}}>{r.reason||'(raison non précisée)'}</div>
                  <span style={{padding:'2px 8px',borderRadius:10,fontSize:9,fontWeight:700,fontFamily:'Space Mono,monospace',background:r.severity==='critical'?'rgba(230,57,70,.15)':r.severity==='high'?'rgba(230,120,0,.15)':'var(--bg2)',color:r.severity==='critical'?'var(--red)':r.severity==='high'?'#e67800':'var(--text3)'}}>{(r.severity||'medium').toUpperCase()}</span>
                  <span style={{padding:'2px 8px',borderRadius:10,fontSize:9,fontWeight:700,background:'var(--bg2)',color:'var(--text3)'}}>{r.target_type||'?'}</span>
                </div>
                <div style={{fontSize:12,color:'var(--text2)',marginBottom:4,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.details||'(pas de détail)'}</div>
                <div style={{fontSize:11,color:'var(--text3)'}}>
                  Signalé par : <strong>{r.reporter?.display_name||r.reporter?.username||'?'}</strong> · {fmtDate(r.created_at)}
                </div>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:6,flexShrink:0}}>
                <button className="btn btn-primary btn-sm" onClick={()=>resolveReport(r.id,'resolved',false)}>✅ Résoudre</button>
                <button className="btn btn-outline btn-sm" onClick={()=>resolveReport(r.id,'dismissed',false)}>🚫 Rejeter</button>
                <button className="btn btn-outline btn-sm" style={{color:'var(--red)',borderColor:'var(--red)'}} onClick={()=>{if(confirm('Retirer ce contenu ET résoudre ?'))resolveReport(r.id,'resolved',true)}}>🗑️ + Retirer</button>
              </div>
            </div>
          )):<div style={{textAlign:'center',padding:40,color:'var(--text3)'}}><div style={{fontSize:48,marginBottom:12}}>🚩</div>Aucun signalement{reportFilter!=='all'?' dans cette catégorie':' en attente'}</div>}
        </div>}

        {/* ═══ RADIOS ACTIVES ═══ */}
        {tab==='radios_active'&&<div>
          <h2 style={{fontFamily:'Syne,sans-serif',fontSize:20,marginBottom:16}}>📡 Radios actives ({radioActive.length})</h2>
          {radioActive.length?radioActive.map(s=>(
            <div key={s.id} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:18,marginBottom:12,display:'flex',alignItems:'center',gap:16}}>
              <div style={{width:60,height:60,borderRadius:8,background:'var(--card2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,overflow:'hidden',flexShrink:0}}>
                {s.logo_url?<img src={s.logo_url} alt={s.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:'📻'}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,fontSize:15,marginBottom:3}}>{s.name}</div>
                <div style={{fontSize:12,color:'var(--text2)',marginBottom:4}}>{s.description||'(pas de description)'}</div>
                <div style={{fontSize:11,color:'var(--text3)',marginBottom:3}}>Pays : {s.country||'—'} · Genre : {s.genre||'—'} · Par : {s.profiles?.display_name||'?'}</div>
                <a href={s.stream_url} target="_blank" rel="noopener noreferrer" style={{fontSize:11,color:'var(--gold)',textDecoration:'underline',wordBreak:'break-all'}}>🔗 {s.stream_url}</a>
              </div>
              <div style={{flexShrink:0}}>
                <button className="btn btn-primary btn-sm" onClick={()=>setEditRadio(s)}>✏️ Modifier</button>
              </div>
            </div>
          )):<div style={{textAlign:'center',padding:40,color:'var(--text3)'}}><div style={{fontSize:48,marginBottom:12}}>📡</div>Aucune radio active</div>}
          {editRadio&&<EditRadioModal station={editRadio} onClose={()=>setEditRadio(null)} onSaved={(u)=>setRadioActive(p=>p.map(r=>r.id===u.id?u:r))}/>}
        </div>}

        {/* ═══ DÉPÔTS ═══ */}
        {tab==='deposits'&&<div>
          <h2 style={{fontFamily:'Syne,sans-serif',fontSize:20,marginBottom:16}}>💰 Dépôts à valider ({deposits.length})</h2>
          {deposits.length?deposits.map(d=>(
            <div key={d.id} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:18,marginBottom:12,display:'flex',alignItems:'center',gap:16}}>
              <div style={{width:48,height:48,borderRadius:10,background:'rgba(44,198,83,.12)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24}}>💰</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:14}}>{d.amount?.toLocaleString()} {d.currency||'KMF'}</div>
                <div style={{fontSize:12,color:'var(--text2)'}}>Par : {d.profiles?.display_name||'Utilisateur'} · Méthode : {d.method||'cash'}</div>
                <div style={{fontSize:11,color:'var(--text3)'}}>Réf : {d.reference||'—'} · {fmtDate(d.created_at)}</div>
              </div>
              <div style={{display:'flex',gap:8}}>
                <button className="btn btn-primary btn-sm" onClick={()=>depositAction(d.id,'approve')}>✅ Valider</button>
                <button className="btn btn-outline btn-sm" style={{color:'var(--red)',borderColor:'var(--red)'}} onClick={()=>depositAction(d.id,'reject')}>❌ Rejeter</button>
              </div>
            </div>
          )):<div style={{textAlign:'center',padding:40,color:'var(--text3)'}}><div style={{fontSize:48,marginBottom:12}}>✅</div>Aucun dépôt en attente</div>}
        </div>}

        {/* ═══ RETRAITS ═══ */}
        {tab==='withdrawals'&&<div>
          <h2 style={{fontFamily:'Syne,sans-serif',fontSize:20,marginBottom:16}}>🏧 Retraits en attente ({withdrawals.length})</h2>
          {withdrawals.length?withdrawals.map(w=>(
            <div key={w.id} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:18,marginBottom:12,display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}}>
              <div style={{width:48,height:48,borderRadius:10,background:'rgba(231,76,60,.12)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24}}>🏧</div>
              <div style={{flex:1,minWidth:200}}>
                <div style={{fontWeight:700,fontSize:14}}>{w.amount?.toLocaleString()} {w.currency||'KMF'}</div>
                <div style={{fontSize:12,color:'var(--text2)'}}>@{w.profiles?.username||'—'} · {w.method||'mvola'} → {w.destination||'—'}</div>
                <div style={{fontSize:11,color:'var(--text3)'}}>{fmtDate(w.created_at)}{w.notes?' · '+w.notes:''}</div>
              </div>
              <div style={{display:'flex',gap:8}}>
                <button className="btn btn-primary btn-sm" onClick={async()=>{
                  try{await adminApi.patch('/api/admin/withdrawals/'+w.id,{action:'approve'});setWithdrawals(ws=>ws.filter(x=>x.id!==w.id));showToast('✅ Retrait approuvé, wallet débité')}
                  catch(e){showToast('❌ '+(e.message||'Erreur'))}
                }}>✅ Approuver</button>
                <button className="btn btn-outline btn-sm" style={{color:'var(--red)',borderColor:'var(--red)'}} onClick={async()=>{
                  try{await adminApi.patch('/api/admin/withdrawals/'+w.id,{action:'reject'});setWithdrawals(ws=>ws.filter(x=>x.id!==w.id));showToast('Retrait refusé')}
                  catch(e){showToast('❌ '+(e.message||'Erreur'))}
                }}>❌ Refuser</button>
              </div>
            </div>
          )):<div style={{textAlign:'center',padding:40,color:'var(--text3)'}}><div style={{fontSize:48,marginBottom:12}}>✅</div>Aucun retrait en attente</div>}
        </div>}
        {/* ═══ DEMANDES PROFIL ═══ */}
        {tab==='profile_requests'&&<div>
          <h2 style={{fontFamily:'Syne,sans-serif',fontSize:20,marginBottom:16}}>🔄 Demandes de profil ({profileReqs.length})</h2>
          {profileReqs.length?profileReqs.map(r=>(
            <div key={r.id} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:18,marginBottom:12,display:'flex',alignItems:'center',gap:16}}>
              <div style={{width:48,height:48,borderRadius:'50%',background:'linear-gradient(135deg,var(--gold),#e63946)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:18}}>{(r.display_name||'?')[0]}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:14}}>{r.display_name} <span style={{fontSize:11,color:'var(--text3)'}}>@{r.username}</span></div>
                <div style={{fontSize:12,color:'var(--text2)'}}>Actuel : <strong>{r.profile_type}</strong> → Demandé : <strong style={{color:'var(--gold)'}}>{r.requested_profile_type}</strong></div>
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
          <div style={{fontSize:12,color:'var(--text3)',marginBottom:16}}>Activez les modes de paiement et configurez les informations API.</div>
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
                    <div style={{flex:1}}><div style={{fontWeight:700,fontSize:13}}>{m.name}</div><div style={{fontSize:11,color:'var(--text3)'}}>{m.desc}</div></div>
                    <span style={{padding:'3px 10px',borderRadius:20,fontSize:10,fontWeight:700,fontFamily:'Space Mono,monospace',background:enabled?'rgba(44,198,83,.15)':'rgba(230,57,70,.1)',color:enabled?'var(--green)':'var(--red)'}}>{enabled?'ACTIF':'INACTIF'}</span>
                    <button onClick={()=>setPayConfig(c=>({...c,[m.id]:{...c[m.id],enabled:!enabled}}))} style={{width:44,height:24,borderRadius:12,border:'none',cursor:'pointer',position:'relative',transition:'background .2s',background:enabled?'var(--green)':'var(--border)'}}>
                      <div style={{width:20,height:20,borderRadius:'50%',background:'#fff',position:'absolute',top:2,left:enabled?22:2,transition:'left .2s',boxShadow:'0 1px 3px rgba(0,0,0,.3)'}}/>
                    </button>
                  </div>
                  {m.fields.length>0&&<div style={{padding:'0 18px 14px',display:'flex',flexWrap:'wrap',gap:8}}>
                    {m.fields.map(field=>(
                      <div key={field} style={{flex:field==='iban'?'1 1 100%':'1 1 45%',minWidth:140}}>
                        <label style={{display:'block',fontSize:10,fontWeight:700,letterSpacing:1,color:'var(--text3)',marginBottom:4,textTransform:'uppercase'}}>{field.replace(/_/g,' ')}</label>
                        <input type={field.includes('secret')?'password':'text'} value={cfg[field]||''} onChange={e=>setPayConfig(c=>({...c,[m.id]:{...c[m.id],[field]:e.target.value}}))} placeholder={field==='phone'?'ex: 3234567':field==='iban'?'KM46 ...':field==='swift'?'BDCMKMKC':'...'} style={{width:'100%',padding:'8px 12px',borderRadius:6,border:'1px solid var(--border)',background:'var(--bg2)',color:'var(--text)',fontSize:12,boxSizing:'border-box',fontFamily:'Space Mono,monospace'}}/>
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
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:10}}>
            <h2 style={{fontFamily:'Syne,sans-serif',fontSize:20,margin:0}}>📊 Finances</h2>
            <div style={{display:'flex',gap:6}}>
              {[{id:'7d',label:'7j'},{id:'30d',label:'30j'},{id:'90d',label:'90j'},{id:'1y',label:'1an'}].map(p=>(
                <button key={p.id} onClick={()=>{setFinancePeriod(p.id);loadFinance(p.id)}}
                  style={{padding:'6px 14px',borderRadius:20,fontSize:12,fontWeight:600,cursor:'pointer',border:'1px solid '+(financePeriod===p.id?'var(--gold)':'var(--border)'),background:financePeriod===p.id?'rgba(245,166,35,.12)':'transparent',color:financePeriod===p.id?'var(--gold)':'var(--text3)'}}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* KPIs financiers */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:12,marginBottom:20}}>
            {[
              {icon:'💰',label:'Revenus totaux',  value:fmtAmt(financeData.stats.totalIn),    color:'var(--green)'},
              {icon:'💸',label:'Dépenses totales', value:fmtAmt(financeData.stats.totalOut),   color:'var(--red)'},
              {icon:'🎵',label:'Ventes tracks',    value:fmtAmt(financeData.stats.sales),      color:'var(--gold)'},
              {icon:'🎟️',label:'Billets events',  value:fmtAmt(financeData.stats.tickets),    color:'var(--purple)'},
              {icon:'🏦',label:'Retraits',         value:fmtAmt(financeData.stats.withdrawals),color:'var(--red)'},
              {icon:'📈',label:'Commission est.',  value:fmtAmt(financeData.stats.commission), color:'var(--gold)'},
            ].map(k=>(
              <div key={k.label} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'14px 16px',borderLeft:'3px solid '+k.color}}>
                <div style={{fontSize:11,color:'var(--text3)',marginBottom:4}}>{k.icon} {k.label}</div>
                <div style={{fontSize:16,fontWeight:800,color:k.color,fontFamily:'Space Mono,monospace'}}>{k.value}</div>
              </div>
            ))}
          </div>

          {/* Graphique par type */}
          {financeData.stats.byType&&Object.keys(financeData.stats.byType).length>0&&(
            <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:16,marginBottom:20}}>
              <div style={{fontSize:12,fontWeight:700,marginBottom:14,color:'var(--text2)'}}>📂 Répartition par type</div>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {Object.entries(financeData.stats.byType).sort((a,b)=>b[1].total-a[1].total).map(([type,data])=>{
                  const meta=TX_META[type]||{label:type,icon:'📌',dir:null}
                  const maxTotal=Math.max(...Object.values(financeData.stats.byType).map(d=>d.total),1)
                  const pct=Math.round((data.total/maxTotal)*100)
                  return(
                    <div key={type} style={{display:'flex',alignItems:'center',gap:10}}>
                      <div style={{width:28,height:28,borderRadius:8,background:'var(--bg2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0}}>{meta.icon}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                          <span style={{fontSize:12,fontWeight:600}}>{meta.label}</span>
                          <span style={{fontSize:12,fontFamily:'Space Mono,monospace',color:'var(--gold)'}}>{fmtAmt(data.total)} <span style={{color:'var(--text3)',fontWeight:400}}>({data.count} op.)</span></span>
                        </div>
                        <div style={{height:4,background:'var(--bg2)',borderRadius:2}}>
                          <div style={{height:'100%',width:pct+'%',background:meta.dir==='in'?'var(--green)':meta.dir==='out'?'var(--red)':'var(--gold)',borderRadius:2,transition:'width .4s'}}/>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Transactions récentes */}
          <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:16}}>
            <div style={{fontSize:12,fontWeight:700,marginBottom:12,color:'var(--text2)'}}>📋 Transactions récentes ({financeData.stats.count||0})</div>
            {financeData.transactions.length===0
              ?<div style={{textAlign:'center',padding:30,color:'var(--text3)'}}>Aucune transaction sur cette période</div>
              :<div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                  <thead><tr>{['Date','Type','Description','Montant','Statut'].map(h=><th key={h} style={{textAlign:'left',padding:'8px 10px',borderBottom:'2px solid var(--border)',fontSize:10,color:'var(--text3)',fontFamily:'Space Mono,monospace'}}>{h}</th>)}</tr></thead>
                  <tbody>
                    {financeData.transactions.map((tx,i)=>{
                      const meta=TX_META[tx.type]||{label:tx.type,icon:'📌',dir:null}
                      const isIn=meta.dir==='in'
                      return(
                        <tr key={tx.id||i} style={{borderBottom:'1px solid var(--border)'}}>
                          <td style={{padding:'8px 10px',color:'var(--text3)',fontFamily:'Space Mono,monospace',whiteSpace:'nowrap'}}>{fmtDate(tx.created_at)}</td>
                          <td style={{padding:'8px 10px'}}><span style={{padding:'2px 8px',borderRadius:10,fontSize:9,background:'var(--bg2)',fontFamily:'Space Mono,monospace'}}>{meta.icon} {meta.label}</span></td>
                          <td style={{padding:'8px 10px',color:'var(--text2)',maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{tx.description||'—'}</td>
                          <td style={{padding:'8px 10px',fontFamily:'Space Mono,monospace',fontWeight:700,color:isIn?'var(--green)':'var(--red)',whiteSpace:'nowrap'}}>{isIn?'+':'-'}{fmtAmt(tx.amount)}</td>
                          <td style={{padding:'8px 10px'}}><span style={{padding:'2px 8px',borderRadius:10,fontSize:9,fontWeight:700,background:tx.status==='completed'?'rgba(44,198,83,.12)':tx.status==='pending'?'rgba(245,166,35,.12)':'rgba(230,57,70,.12)',color:tx.status==='completed'?'var(--green)':tx.status==='pending'?'var(--gold)':'var(--red)'}}>{tx.status||'—'}</span></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {financeData.stats.count>100&&<div style={{textAlign:'center',fontSize:11,color:'var(--text3)',padding:8}}>Affichage des 100 premières transactions sur {financeData.stats.count}</div>}
              </div>
            }
          </div>
        </div>}

        {/* ═══ PARAMÈTRES ═══ */}
        {tab==='settings'&&<div>
          <h2 style={{fontFamily:'Syne,sans-serif',fontSize:20,marginBottom:20}}>⚙️ Paramètres système</h2>
          <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:20,marginBottom:20}}>
            <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:15,marginBottom:4}}>🔑 Connexion sociale</div>
            <div style={{fontSize:12,color:'var(--text3)',marginBottom:16}}>Configurez les clés API et activez chaque fournisseur.</div>
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
          <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:20}}>
            <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:15,marginBottom:12}}>📋 Informations système</div>
            {[['Plateforme','Waiichia'],['Version','v7.2'],['Supabase','Connecté ✅'],['Profil par défaut','listener'],['Commission ventes','15%'],['Commission locations','20%'],['Commission retraits','2.5%'],['Commission transferts','1%']].map(([k,v])=>(
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
