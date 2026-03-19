import { useState } from "react"
import { useAuthStore, usePageStore } from "../stores/index.js"

const MENU=[
  {id:'profile',icon:'👤',label:'Profil'},
  {id:'security',icon:'🔒',label:'Sécurité'},
  {id:'notifications',icon:'🔔',label:'Notifications'},
  {id:'language',icon:'🌍',label:'Langue & Région'},
  {id:'billing',icon:'💳',label:'Facturation'},
  {id:'rights',icon:'⚖️',label:"Droits d'auteur"},
  {id:'privacy',icon:'🛡️',label:'Confidentialité'},
  {id:'logout',icon:'🚪',label:'Déconnexion',red:true},
]
const COUNTRIES=[['KM','🇰🇲 Comores'],['MG','🇲🇬 Madagascar'],['TZ','🇹🇿 Tanzanie'],['RW','🇷🇼 Rwanda'],['CI',"🇨🇮 Côte d'Ivoire"],['NG','🇳🇬 Nigeria'],['SN','🇸🇳 Sénégal']]
const PROFILE_TYPES=['Artiste','Media','Label','Influenceur','Entrepreneur','Pro','Consommateur']

export default function Settings(){
  const {user,logout}=useAuthStore()
  const {setPage}=usePageStore()
  const [section,setSection]=useState('profile')
  const [saved,setSaved]=useState(false)

  const save=()=>{setSaved(true);setTimeout(()=>setSaved(false),2000)}
  const handleLogout=()=>{logout();setPage('home')}

  if(!user)return(<div style={{textAlign:'center',padding:60}}><div style={{fontSize:48,marginBottom:16}}>⚙️</div><h2 style={{fontFamily:'Syne,sans-serif'}}>Connectez-vous</h2><button className="btn btn-primary" onClick={()=>setPage('login')} style={{marginTop:16}}>Se connecter</button></div>)

  return(
    <div style={{paddingBottom:60}}>
      <div className="page-title">⚙️ Paramètres & Compte</div>
      {saved&&<div style={{position:'fixed',top:20,right:20,background:'var(--green)',color:'#000',padding:'10px 20px',borderRadius:'var(--radius-sm)',fontWeight:700,fontSize:13,zIndex:999,animation:'slideIn .3s'}}>✅ Sauvegardé !</div>}

      <div style={{display:'grid',gridTemplateColumns:'200px 1fr',gap:22}}>
        {/* MENU GAUCHE */}
        <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:12,height:'fit-content',position:'sticky',top:80}}>
          <div style={{display:'flex',flexDirection:'column',gap:2}}>
            {MENU.map(m=>(
              <div key={m.id} onClick={()=>m.id==='logout'?handleLogout():setSection(m.id)}
                style={{padding:'10px 12px',borderRadius:'var(--radius-sm)',cursor:'pointer',fontSize:13,
                  background:section===m.id?'var(--bg2)':'transparent',
                  color:m.red?'var(--red)':section===m.id?'var(--text)':'var(--text2)',
                  fontWeight:section===m.id?600:400,transition:'all .15s'}}
                onMouseEnter={e=>{if(section!==m.id)e.currentTarget.style.background='var(--bg2)'}}
                onMouseLeave={e=>{if(section!==m.id)e.currentTarget.style.background='transparent'}}>
                {m.icon} {m.label}
              </div>
            ))}
          </div>
        </div>

        {/* CONTENU DROITE */}
        <div>
          {section==='profile'&&<div>
            <Card title="👤 Informations du profil">
              <div className="form-group"><label className="label">Nom complet</label><input className="input-field" defaultValue={user.display_name||'Kolo Officiel'}/></div>
              <div className="form-group"><label className="label">Nom d'utilisateur</label><input className="input-field" defaultValue={user.username?'@'+user.username:'@kolo_komori'}/></div>
              <div className="form-row">
                <div className="form-group"><label className="label">Email</label><input className="input-field" type="email" defaultValue={user.email||'kolo@waiichia.com'}/></div>
                <div className="form-group"><label className="label">Téléphone</label><input className="input-field" type="tel" defaultValue="+269 321 0000"/></div>
              </div>
              <div className="form-group"><label className="label">Bio</label><textarea className="textarea-field" defaultValue={user.bio||'Artiste comorien 🇰🇲 · Twarab & Afrobeats · Moroni'}/></div>
              <div className="form-row">
                <div className="form-group"><label className="label">Type de profil</label><select className="select-styled" style={{width:'100%'}} defaultValue={user.profile_type||'Artiste'}>{PROFILE_TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
                <div className="form-group"><label className="label">Pays principal</label><select className="select-styled" style={{width:'100%'}}>{COUNTRIES.map(([c,l])=><option key={c} value={c}>{l}</option>)}</select></div>
              </div>
              <button className="btn btn-primary" onClick={save}>💾 Sauvegarder</button>
            </Card>

            <Card title="🖼️ Photo de profil & Couverture">
              <div style={{display:'flex',gap:20,alignItems:'flex-start',flexWrap:'wrap'}}>
                <div style={{textAlign:'center'}}>
                  <div style={{width:90,height:90,borderRadius:'50%',background:'linear-gradient(135deg,var(--gold),var(--kente2))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:32,margin:'0 auto 8px',border:'3px solid var(--border)',cursor:'pointer'}}>{user.display_name?.[0]||'K'}</div>
                  <button className="btn btn-outline btn-sm">Changer avatar</button>
                </div>
                <div style={{textAlign:'center'}}>
                  <div style={{width:200,height:70,borderRadius:'var(--radius-sm)',background:'linear-gradient(135deg,#0a1e2e,#1060a0)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,color:'var(--text3)',margin:'0 auto 8px',border:'1px solid var(--border)'}}>Cover 1500×400</div>
                  <button className="btn btn-outline btn-sm">Changer couverture</button>
                </div>
              </div>
            </Card>
          </div>}

          {section==='security'&&<div>
            <Card title="🔒 Mot de passe">
              <div className="form-group"><label className="label">Mot de passe actuel</label><input className="input-field" type="password" placeholder="••••••••"/></div>
              <div className="form-row">
                <div className="form-group"><label className="label">Nouveau mot de passe</label><input className="input-field" type="password" placeholder="Min. 8 caractères"/></div>
                <div className="form-group"><label className="label">Confirmer</label><input className="input-field" type="password" placeholder="Répéter le mot de passe"/></div>
              </div>
              <button className="btn btn-primary" onClick={save}>🔒 Modifier le mot de passe</button>
            </Card>
            <Card title="🔐 Authentification à deux facteurs">
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div><div style={{fontWeight:600,fontSize:13}}>2FA par SMS</div><div style={{fontSize:12,color:'var(--text2)'}}>Recevez un code par SMS à chaque connexion</div></div>
                <div className="toggle-switch" onClick={e=>e.currentTarget.classList.toggle('off')}/>
              </div>
            </Card>
            <Card title="✅ Vérification du compte">
              <div style={{background:user.is_verified?'rgba(44,198,83,.08)':'rgba(245,166,35,.06)',border:`1px solid ${user.is_verified?'rgba(44,198,83,.2)':'rgba(245,166,35,.2)'}`,borderRadius:'var(--radius-sm)',padding:16,display:'flex',alignItems:'center',gap:12}}>
                <span style={{fontSize:28}}>{user.is_verified?'✅':'🔒'}</span>
                <div>
                  <div style={{fontWeight:700,fontSize:13,color:user.is_verified?'var(--green)':'var(--gold)'}}>{user.is_verified?'Compte vérifié':'Compte non vérifié'}</div>
                  <div style={{fontSize:12,color:'var(--text2)'}}>{user.is_verified?'Vous pouvez monétiser votre contenu':'Faites vérifier pour vendre, louer et recevoir des paiements'}</div>
                </div>
                {!user.is_verified&&<button className="btn btn-primary btn-sm" style={{marginLeft:'auto'}}>Demander la vérification</button>}
              </div>
            </Card>
          </div>}

          {section==='notifications'&&<Card title="🔔 Préférences de notifications">
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              {[['Nouveaux fans','Quand quelqu\'un vous suit',true],['Ventes & Revenus','Chaque vente ou location de contenu',true],['Messages privés','Nouveaux messages reçus',true],['Commentaires','Sur vos publications',false],['Événements','Rappels et mises à jour',true],['Marketing','Offres et nouveautés Waiichia',false]].map(([t,d,on])=>(
                <div key={t} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid var(--border)'}}>
                  <div><div style={{fontWeight:600,fontSize:13}}>{t}</div><div style={{fontSize:12,color:'var(--text2)'}}>  {d}</div></div>
                  <div className={`toggle-switch${on?'':' off'}`} onClick={e=>e.currentTarget.classList.toggle('off')}/>
                </div>
              ))}
            </div>
          </Card>}

          {section==='language'&&<Card title="🌍 Langue & Région">
            <div className="form-row">
              <div className="form-group"><label className="label">Langue de l'interface</label><select className="select-styled" style={{width:'100%'}}><option>Français</option><option>English</option><option>Shikomori</option><option>Swahili</option><option>Malagasy</option></select></div>
              <div className="form-group"><label className="label">Devise d'affichage</label><select className="select-styled" style={{width:'100%'}}><option>KMF - Franc Comorien</option><option>USD</option><option>EUR</option><option>MGA</option><option>XOF</option></select></div>
            </div>
            <button className="btn btn-primary" onClick={save}>💾 Sauvegarder</button>
          </Card>}

          {section==='billing'&&<Card title="💳 Facturation & Abonnement">
            <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',padding:16,marginBottom:16}}>
              <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,marginBottom:4}}>Plan actuel : Gratuit</div>
              <div style={{fontSize:12,color:'var(--text2)'}}>Vous utilisez le plan gratuit de Waiichia. Passez à Premium pour débloquer plus de fonctionnalités.</div>
            </div>
            <button className="btn btn-primary">⭐ Passer à Premium</button>
          </Card>}

          {section==='rights'&&<Card title="⚖️ Droits d'auteur">
            <div style={{fontSize:13,color:'var(--text2)',lineHeight:1.8}}>
              <p>Waiichia respecte les droits d'auteur et la propriété intellectuelle. Tout contenu publié sur la plateforme reste la propriété de son créateur.</p>
              <p style={{marginTop:12}}>Si vous êtes affilié à une société de droits (SACEM, OROLM, etc.), vous pouvez lier votre compte pour faciliter la gestion de vos revenus.</p>
            </div>
            <div className="form-group" style={{marginTop:16}}><label className="label">Société de droits</label><input className="input-field" placeholder="Ex: SACEM, OROLM..."/></div>
            <div className="form-group"><label className="label">Numéro d'affiliation</label><input className="input-field" placeholder="Votre numéro d'artiste"/></div>
            <button className="btn btn-primary" onClick={save}>💾 Enregistrer</button>
          </Card>}

          {section==='privacy'&&<Card title="🛡️ Confidentialité">
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              {[['Profil public','Votre profil est visible par tout le monde',true],['Historique d\'écoute','Afficher vos écoutes récentes sur votre profil',false],['Apparaître dans les suggestions','Être recommandé aux autres utilisateurs',true],['Partage de données anonymes','Aider Waiichia à améliorer la plateforme',true]].map(([t,d,on])=>(
                <div key={t} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid var(--border)'}}>
                  <div><div style={{fontWeight:600,fontSize:13}}>{t}</div><div style={{fontSize:12,color:'var(--text2)'}}>{d}</div></div>
                  <div className={`toggle-switch${on?'':' off'}`} onClick={e=>e.currentTarget.classList.toggle('off')}/>
                </div>
              ))}
            </div>
            <div style={{marginTop:20,padding:14,background:'rgba(230,57,70,.05)',border:'1px solid rgba(230,57,70,.2)',borderRadius:'var(--radius-sm)'}}>
              <div style={{fontWeight:700,fontSize:13,color:'var(--red)',marginBottom:6}}>⚠️ Zone dangereuse</div>
              <div style={{fontSize:12,color:'var(--text2)',marginBottom:12}}>Supprimer votre compte est irréversible. Toutes vos données seront perdues.</div>
              <button className="btn btn-sm" style={{background:'rgba(230,57,70,.1)',color:'var(--red)',border:'1px solid rgba(230,57,70,.3)',borderRadius:'var(--radius-sm)',padding:'8px 16px',cursor:'pointer',fontSize:12}}>Supprimer mon compte</button>
            </div>
          </Card>}
        </div>
      </div>
    </div>
  )
}

function Card({title,children}){
  return(<div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:24,marginBottom:16}}>
    <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:16,marginBottom:18}}>{title}</div>
    {children}
  </div>)
}
