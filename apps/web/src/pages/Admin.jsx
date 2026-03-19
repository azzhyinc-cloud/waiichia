import { useState, useEffect } from "react"
import { useAuthStore, usePageStore } from "../stores/index.js"
import api from "../services/api.js"

const NAV=[
  {g:'PRINCIPAL',items:[{id:'dashboard',icon:'📊',label:'Dashboard'}]},
  {g:'GESTION',items:[{id:'users',icon:'👥',label:'Utilisateurs',badge:'~'},{id:'content',icon:'🎵',label:'Contenu'},{id:'moderation',icon:'🚩',label:'Modération',badge:'89',red:true},{id:'media',icon:'📻',label:'Flux Média',badge:'5',gold:true}]},
  {g:'REVENUS',items:[{id:'finance',icon:'💰',label:'Finances'},{id:'ads',icon:'📢',label:'Publicité'}]},
  {g:'SYSTÈME',items:[{id:'settings',icon:'⚙️',label:'Paramètres'},{id:'logs',icon:'📋',label:'Journaux'}]},
]
const MOCK_USERS=[
  {id:'u1',name:'Kolo Officiel',email:'kolo@waiichia.com',role:'Artiste',country:'🇰🇲',joined:'12 Mar 2026',plays:'24.8K',status:'verified',ava:'KO'},
  {id:'u2',name:'DJ Chami',email:'chami@gmail.com',role:'Artiste',country:'🇰🇲',joined:'8 Jan 2026',plays:'18.2K',status:'active',ava:'DC'},
  {id:'u3',name:'Radio Komori FM',email:'radio@komori.km',role:'Radio/Média',country:'🇰🇲',joined:'22 Nov 2025',plays:'5.2M',status:'verified',ava:'RK'},
  {id:'u4',name:'Coach Amina',email:'amina@mindset.sn',role:'Créateur',country:'🇸🇳',joined:'4 Fév 2026',plays:'15K',status:'pending',ava:'CA'},
  {id:'u5',name:'Wally Afro',email:'wally@afro.ci',role:'Artiste',country:'🇨🇮',joined:'18 Déc 2025',plays:'28.5K',status:'active',ava:'WA'},
]
const MOCK_CONTENT=[
  {id:'t1',title:'Twarab ya Komori',artist:'Kolo Officiel',genre:'Twarab',country:'🇰🇲',plays:'24.8K',rev:'12.4K KMF',status:'published'},
  {id:'t2',title:'Moroni by Night',artist:'DJ Chami',genre:'Afrobeats',country:'🇰🇲',plays:'18.2K',rev:'8.1K KMF',status:'published'},
  {id:'t3',title:'Afrika Rising',artist:'Wally Afro',genre:'Amapiano',country:'🇨🇮',plays:'12.1K',rev:'0 KMF',status:'published'},
  {id:'t4',title:'Contenu signalé #482',artist:'Unknown',genre:'Rap',country:'🇳🇬',plays:'420',rev:'0 KMF',status:'flagged'},
]
const MOCK_REPORTS=[
  {id:'R-001',type:'Son',target:'Beat Trap #42',by:'@fatima_k',reason:"Droits d'auteur",date:'15 Mar',priority:'🔴 Haute'},
  {id:'R-002',type:'Profil',target:'@spam_account',by:'@djchami',reason:'Spam / Faux compte',date:'15 Mar',priority:'🟡 Moyenne'},
  {id:'R-003',type:'Commentaire',target:'Sur "Twarab ya..."',by:'@nassimb',reason:'Contenu inapproprié',date:'14 Mar',priority:'🟢 Basse'},
]
const MOCK_TX=[
  {id:'tx1',type:'Vente son',user:'@wallyafro',amount:'+2 500 KMF',date:'14:32'},
  {id:'tx2',type:'Location',user:'@fatima_k',amount:'+800 KMF',date:'11:20'},
  {id:'tx3',type:'Retrait',user:'@kolo_komori',amount:'-15 000 KMF',date:'Hier'},
  {id:'tx4',type:'Ticket événement',user:'@nassimb',amount:'+5 000 KMF',date:'Hier'},
]
const ALERTS=[
  {icon:'🟢',text:'API opérationnelle — latence 42ms',time:'En cours'},
  {icon:'🟡',text:'Charge CPU élevée (78%) — serveur audio',time:'Il y a 15min'},
  {icon:'🔴',text:'5 demandes de vérification en attente > 48h',time:'Action requise'},
  {icon:'🟢',text:'Backup quotidien terminé avec succès',time:'03:00'},
]
const COL={green:'rgba(44,198,83,.15)',gold:'rgba(245,166,35,.15)',blue:'rgba(77,159,255,.15)',purple:'rgba(155,89,245,.15)',red:'rgba(230,57,70,.15)',teal:'rgba(0,191,165,.15)'}
const STATUS={verified:{bg:'rgba(44,198,83,.15)',c:'var(--green)',l:'✅ Vérifié'},active:{bg:'rgba(77,159,255,.15)',c:'var(--blue)',l:'🟢 Actif'},pending:{bg:'rgba(245,166,35,.15)',c:'var(--gold)',l:'⏳ En attente'},suspended:{bg:'rgba(230,57,70,.15)',c:'var(--red)',l:'🔒 Suspendu'},published:{bg:'rgba(44,198,83,.15)',c:'var(--green)',l:'Publié'},flagged:{bg:'rgba(230,57,70,.15)',c:'var(--red)',l:'🚩 Signalé'}}
const FORMATS=[{id:'audio',icon:'🎵',name:'Audio Ad'},{id:'banner',icon:'🖼️',name:'Banner'},{id:'sponsored',icon:'🎙️',name:'Son Sponsorisé'}]
const fmtS=n=>{if(!n||n===0)return'0';if(n>=1000000)return(n/1000000).toFixed(1)+'M';if(n>=1000)return(n/1000).toFixed(1)+'K';return String(n)}

export default function Admin(){
  const {user}=useAuthStore()
  const {setPage}=usePageStore()
  const [tab,setTab]=useState('dashboard')
  const [stats,setStats]=useState({tracks_count:0,creators_count:0,total_plays:0,countries_count:0})

  useEffect(()=>{
    api.profiles.stats().then(s=>setStats(s)).catch(()=>{})
  },[])

  if(!user)return(<div style={{textAlign:'center',padding:60}}><div style={{fontSize:48,marginBottom:16}}>🛡️</div><h2 style={{fontFamily:'Syne,sans-serif'}}>Accès administrateur requis</h2><button className="btn btn-primary" onClick={()=>setPage('login')} style={{marginTop:16}}>Se connecter</button></div>)

  const KPIs=[
    {icon:'👥',num:fmtS(stats.creators_count),label:'Utilisateurs',delta:'▲ Données réelles',up:true,color:'green'},
    {icon:'🎵',num:fmtS(stats.tracks_count),label:'Contenus publiés',delta:'▲ Données réelles',up:true,color:'gold'},
    {icon:'▶',num:fmtS(stats.total_plays),label:'Écoutes totales',delta:'▲ Données réelles',up:true,color:'blue'},
    {icon:'💰',num:'—',label:'Revenus ce mois',delta:'Bientôt disponible',up:true,color:'purple'},
    {icon:'🚩',num:'—',label:'Signalements',delta:'Bientôt disponible',up:false,color:'red'},
    {icon:'📻',num:String(stats.countries_count||0),label:'Pays actifs',delta:'▲ Données réelles',up:true,color:'teal'},
  ]

  return(
    <div style={{display:'grid',gridTemplateColumns:'220px 1fr',minHeight:'calc(100vh - 80px)',margin:'-20px -20px 0',gap:0}}>
      {/* SIDEBAR ADMIN */}
      <aside style={{background:'var(--card)',borderRight:'1px solid var(--border)',padding:0,display:'flex',flexDirection:'column'}}>
        <div style={{padding:'20px 18px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:12}}>
          <div style={{width:36,height:36,borderRadius:10,background:'linear-gradient(135deg,var(--gold),#e63946)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>🛡️</div>
          <div><div style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:14}}>Waiichia Admin</div><div style={{fontSize:10,color:'var(--text3)'}}>Panneau de contrôle</div></div>
        </div>
        <nav style={{flex:1,padding:'10px 0',overflowY:'auto'}}>
          {NAV.map(g=><div key={g.g}>
            <div style={{padding:'12px 18px 4px',fontSize:9,letterSpacing:2,textTransform:'uppercase',color:'var(--text3)',fontFamily:'Space Mono,monospace'}}>{g.g}</div>
            {g.items.map(it=>(
              <div key={it.id} onClick={()=>setTab(it.id)} style={{padding:'9px 18px',display:'flex',alignItems:'center',gap:10,cursor:'pointer',fontSize:13,color:tab===it.id?'var(--text)':'var(--text2)',background:tab===it.id?'var(--bg2)':'transparent',fontWeight:tab===it.id?600:400,borderLeft:tab===it.id?'2px solid var(--gold)':'2px solid transparent',transition:'all .15s'}}>
                <span>{it.icon}</span>{it.label}
                {it.badge&&<span style={{marginLeft:'auto',fontSize:9,padding:'2px 7px',borderRadius:20,background:it.red?'rgba(230,57,70,.15)':it.gold?'rgba(245,166,35,.15)':'var(--bg2)',color:it.red?'var(--red)':it.gold?'var(--gold)':'var(--text3)',fontFamily:'Space Mono,monospace',fontWeight:700}}>{it.badge}</span>}
              </div>
            ))}
          </div>)}
        </nav>
        <div style={{padding:'12px 18px',borderTop:'1px solid var(--border)',display:'flex',alignItems:'center',gap:8,fontSize:11,color:'var(--green)'}}>
          <div style={{width:6,height:6,borderRadius:'50%',background:'var(--green)'}}/>Système opérationnel
        </div>
      </aside>

      {/* CONTENU */}
      <div style={{padding:24,overflowY:'auto'}}>

        {tab==='dashboard'&&<div>
          <TopBar title="📊 Dashboard" sub="Vue d'ensemble en temps réel"/>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:12,marginBottom:20}}>
            {KPIs.map(k=>(
              <div key={k.label} style={{background:COL[k.color],border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'16px 18px'}}>
                <div style={{fontSize:22,marginBottom:6}}>{k.icon}</div>
                <div style={{fontFamily:'Syne,sans-serif',fontSize:18,fontWeight:800}}>{k.num}</div>
                <div style={{fontSize:11,color:'var(--text2)',marginBottom:3}}>{k.label}</div>
                <div style={{fontSize:10,fontFamily:'Space Mono,monospace',color:k.up?'var(--green)':'var(--red)'}}>{k.delta}</div>
              </div>
            ))}
          </div>
          <div style={{display:'flex',gap:16,marginBottom:16}}>
            <div style={{flex:2,background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:20}}>
              <div style={{fontWeight:700,fontSize:14,marginBottom:16}}>📈 Écoutes — 30 jours</div>
              <div style={{display:'flex',alignItems:'flex-end',gap:2,height:120}}>{Array.from({length:30},(_,i)=><div key={i} style={{flex:1,background:'var(--gold)',borderRadius:'2px 2px 0 0',height:(20+Math.random()*80)+'%',opacity:.5+Math.random()*.5}}/>)}</div>
            </div>
            <div style={{flex:1,background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:20}}>
              <div style={{fontWeight:700,fontSize:14,marginBottom:16}}>🌍 Top Pays</div>
              {[{c:'🇰🇲 Comores',pct:42},{c:'🇲🇬 Madagascar',pct:18},{c:'🇫🇷 France',pct:14},{c:'🇳🇬 Nigeria',pct:10},{c:'🇸🇳 Sénégal',pct:8}].map(g=>(
                <div key={g.c} style={{display:'flex',alignItems:'center',gap:8,marginBottom:8,fontSize:12}}>
                  <span style={{width:80,flexShrink:0,color:'var(--text2)'}}>{g.c}</span>
                  <div style={{flex:1,height:5,background:'var(--border2)',borderRadius:4,overflow:'hidden'}}><div style={{height:'100%',width:g.pct+'%',background:'var(--gold)',borderRadius:4}}/></div>
                  <span style={{fontFamily:'Space Mono,monospace',fontSize:10}}>{g.pct}%</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16}}>
            <MiniCard title="🆕 Inscriptions récentes">{MOCK_USERS.slice(0,3).map(u=><MiniRow key={u.id} ava={u.ava} bg="linear-gradient(135deg,var(--gold),#e63946)" name={u.name} sub={u.joined}/>)}</MiniCard>
            <MiniCard title="🔔 Alertes système">{ALERTS.map((a,i)=><div key={i} style={{display:'flex',gap:8,padding:'8px 0',borderBottom:'1px solid var(--border)',fontSize:12}}><span>{a.icon}</span><div style={{flex:1,color:'var(--text2)'}}>{a.text}</div><span style={{fontSize:10,color:'var(--text3)',whiteSpace:'nowrap'}}>{a.time}</span></div>)}</MiniCard>
            <MiniCard title="💳 Transactions récentes">{MOCK_TX.map(tx=><div key={tx.id} style={{display:'flex',gap:8,padding:'8px 0',borderBottom:'1px solid var(--border)',fontSize:12}}><span style={{flex:1,color:'var(--text2)'}}>{tx.type} · {tx.user}</span><span style={{fontFamily:'Space Mono,monospace',fontWeight:700,color:tx.amount.startsWith('+')?'var(--green)':'var(--red)'}}>{tx.amount}</span></div>)}</MiniCard>
          </div>
        </div>}

        {tab==='users'&&<div>
          <TopBar title="👥 Gestion des Utilisateurs" sub={fmtS(stats.creators_count)+' comptes enregistrés'} actions={<button className="btn btn-primary btn-sm">+ Créer compte</button>}/>
          <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
            <input className="input-field" placeholder="🔍 Rechercher par nom, email..." style={{flex:1,minWidth:200}}/>
            <select className="select-styled"><option>Tous les rôles</option><option>Artiste</option><option>Auditeur</option><option>Créateur</option><option>Radio/Média</option><option>Admin</option></select>
            <select className="select-styled"><option>Tous statuts</option><option>Actif</option><option>Vérifié</option><option>Suspendu</option><option>En attente</option></select>
          </div>
          <Table headers={['Utilisateur','Rôle','Pays','Inscription','Écoutes','Statut','Actions']}
            rows={MOCK_USERS.map(u=>[
              <div style={{display:'flex',alignItems:'center',gap:8}}><div style={{width:28,height:28,borderRadius:'50%',background:'linear-gradient(135deg,var(--gold),#e63946)',fontSize:10,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center'}}>{u.ava}</div><div><div style={{fontWeight:600,fontSize:12}}>{u.name}</div><div style={{fontSize:10,color:'var(--text3)'}}>{u.email}</div></div></div>,
              u.role,u.country,u.joined,u.plays,
              <StatusBadge status={u.status}/>,
              <div style={{display:'flex',gap:4}}><Btn s>👁</Btn><Btn s>✏️</Btn><Btn s red>🔒</Btn></div>
            ])}/>
        </div>}

        {tab==='content'&&<div>
          <TopBar title="🎵 Gestion du Contenu" sub={fmtS(stats.tracks_count)+' éléments publiés'}/>
          <div className="tabs-bar" style={{marginBottom:16}}>
            {['🎵 Sons','💿 Albums','🎙️ Podcasts','📺 Émissions','⏳ En attente'].map((t,i)=><button key={t} className={`tab-btn${i===0?' active':''}`}>{t}</button>)}
          </div>
          <Table headers={['Titre','Artiste','Genre','Pays','Écoutes','Revenus','Statut','Actions']}
            rows={MOCK_CONTENT.map(c=>[c.title,c.artist,c.genre,c.country,c.plays,c.rev,<StatusBadge status={c.status}/>,<div style={{display:'flex',gap:4}}><Btn s>👁</Btn><Btn s>✏️</Btn><Btn s red>🗑</Btn></div>])}/>
        </div>}

        {tab==='moderation'&&<div>
          <TopBar title="🚩 Modération" sub="Signalements ouverts · Vérifications en attente"/>
          <div className="tabs-bar" style={{marginBottom:16}}>
            {['🚩 Signalements','✅ Vérifications','©️ Droits','🔒 Bannis','🤖 Spam'].map((t,i)=><button key={t} className={`tab-btn${i===0?' active':''}`}>{t}</button>)}
          </div>
          <Table headers={['ID','Type','Objet signalé','Signalé par','Raison','Date','Priorité','Actions']}
            rows={MOCK_REPORTS.map(r=>[r.id,r.type,r.target,r.by,r.reason,r.date,r.priority,<div style={{display:'flex',gap:4}}><Btn s>✅</Btn><Btn s>👁</Btn><Btn s red>🗑</Btn></div>])}/>
        </div>}

        {tab==='media'&&<div>
          <TopBar title="📻 Gestion des Flux Média" sub="Flux actifs et en attente de validation"/>
          <Table headers={['Station','Type','Pays','Statut','Auditeurs','Actions']}
            rows={[['Radio Komori FM','Radio FM','🇰🇲','🟢 Actif','1.2K'],['ORTC Radio','Radio FM','🇰🇲','🟢 Actif','890'],['Moroni FM','Web Radio','🇰🇲','🟡 En attente','0'],['Pulse Abidjan','Web Radio','🇨🇮','🟢 Actif','3.4K']].map(r=>[...r,<div style={{display:'flex',gap:4}}><Btn s>✅</Btn><Btn s>👁</Btn><Btn s red>🔒</Btn></div>])}/>
        </div>}

        {tab==='finance'&&<div>
          <TopBar title="💰 Finances" sub="Vue globale des revenus et mouvements"/>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
            {[{n:'—',l:'Revenus ce mois',c:'green'},{n:'—',l:'Commission',c:'gold'},{n:'—',l:'Retraits',c:'red'},{n:'—',l:'En attente',c:'blue'}].map(k=>(
              <div key={k.l} style={{background:COL[k.c],border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:18}}>
                <div style={{fontFamily:'Syne,sans-serif',fontSize:20,fontWeight:800}}>{k.n}</div>
                <div style={{fontSize:11,color:'var(--text2)'}}>{k.l}</div>
              </div>
            ))}
          </div>
          <Table headers={['Date','Type','Utilisateur','Montant','Méthode','Statut']}
            rows={MOCK_TX.map(tx=>['16 Mar 2026',tx.type,tx.user,tx.amount,'Wallet',tx.amount.startsWith('+')?'✅ Complété':'⏳ Traitement'])}/>
        </div>}

        {tab==='ads'&&<div>
          <TopBar title="📢 Publicité" sub="Gestion des campagnes publicitaires"/>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:20}}>
            {[{n:'—',l:'Impressions'},{n:'—',l:'Clics'},{n:'—',l:'Revenus pub'}].map(k=><div key={k.l} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:18,textAlign:'center'}}><div style={{fontFamily:'Syne,sans-serif',fontSize:22,fontWeight:800}}>{k.n}</div><div style={{fontSize:11,color:'var(--text2)'}}>{k.l}</div></div>)}
          </div>
        </div>}

        {tab==='settings'&&<div>
          <TopBar title="⚙️ Paramètres système" sub="Configuration générale de la plateforme"/>
          <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:20}}>
            {[['Nom de la plateforme','Waiichia'],['Version','v7.2'],['API URL','/api/v1'],['Supabase','Connecté ✅'],['Stockage','S3 Compatible'],['Commission par défaut','15%']].map(([k,v])=>(
              <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'12px 0',borderBottom:'1px solid var(--border)',fontSize:13}}>
                <span style={{color:'var(--text2)'}}>{k}</span><span style={{fontFamily:'Space Mono,monospace'}}>{v}</span>
              </div>
            ))}
          </div>
        </div>}

        {tab==='logs'&&<div>
          <TopBar title="📋 Journaux système" sub="Activité et événements"/>
          <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:16,fontFamily:'Space Mono,monospace',fontSize:11,lineHeight:2,color:'var(--text2)',maxHeight:500,overflowY:'auto'}}>
            {['[16/03 14:32:08] INFO — Vente son #4821 par @wallyafro — +2500 KMF','[16/03 14:28:12] INFO — Upload audio par @kolo_komori — 4.2 MB','[16/03 14:15:44] WARN — Tentative connexion échouée @unknown_ip','[16/03 13:58:30] INFO — Inscription @new_user_km — Comores','[16/03 13:42:18] INFO — Retrait #892 traité — -15000 KMF','[16/03 12:10:05] INFO — Backup quotidien — OK','[16/03 11:45:22] WARN — Flux radio #12 hors ligne','[16/03 10:30:00] INFO — Mise à jour cache CDN — 48 fichiers'].map((l,i)=><div key={i} style={{color:l.includes('WARN')?'var(--gold)':'var(--text2)'}}>{l}</div>)}
          </div>
        </div>}
      </div>
    </div>
  )
}

function TopBar({title,sub,actions}){
  return(<div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:10}}>
    <div><div style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:20}}>{title}</div><div style={{fontSize:12,color:'var(--text2)'}}>{sub}</div></div>
    <div style={{display:'flex',gap:8}}>{actions}<button className="btn btn-secondary btn-sm">↻ Actualiser</button><button className="btn btn-outline btn-sm">⬇ Exporter</button></div>
  </div>)
}
function Table({headers,rows}){
  return(<div style={{overflowX:'auto',background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)'}}>
    <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
      <thead><tr>{headers.map((h,i)=><th key={i} style={{textAlign:'left',padding:'10px 12px',borderBottom:'2px solid var(--border)',fontSize:11,color:'var(--text3)',fontFamily:'Space Mono,monospace',textTransform:'uppercase',letterSpacing:'.5px'}}>{h}</th>)}</tr></thead>
      <tbody>{rows.map((r,i)=><tr key={i} style={{borderBottom:'1px solid var(--border)'}} onMouseEnter={e=>e.currentTarget.style.background='var(--bg2)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>{r.map((c,j)=><td key={j} style={{padding:'10px 12px',color:'var(--text2)'}}>{c}</td>)}</tr>)}</tbody>
    </table>
  </div>)
}
function StatusBadge({status}){
  const s=STATUS[status]||{bg:'var(--bg2)',c:'var(--text3)',l:status}
  return <span style={{padding:'3px 8px',borderRadius:20,fontSize:10,fontWeight:700,background:s.bg,color:s.c,fontFamily:'Space Mono,monospace'}}>{s.l}</span>
}
function MiniCard({title,children}){
  return(<div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:16}}>
    <div style={{fontWeight:700,fontSize:13,marginBottom:12}}>{title}</div>{children}
  </div>)
}
function MiniRow({ava,bg,name,sub}){
  return(<div style={{display:'flex',alignItems:'center',gap:10,padding:'7px 0',borderBottom:'1px solid var(--border)'}}>
    <div style={{width:28,height:28,borderRadius:'50%',background:bg,fontSize:10,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center'}}>{ava}</div>
    <div style={{flex:1}}><div style={{fontSize:12,fontWeight:600}}>{name}</div><div style={{fontSize:10,color:'var(--text3)'}}>{sub}</div></div>
  </div>)
}
function Btn({children,s,red}){
  return <button style={{padding:s?'4px 8px':'8px 14px',borderRadius:'var(--radius-sm)',border:'1px solid var(--border)',background:red?'rgba(230,57,70,.1)':'var(--card2)',cursor:'pointer',fontSize:11,color:red?'var(--red)':'var(--text2)',transition:'all .15s'}}>{children}</button>
}
