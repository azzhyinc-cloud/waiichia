import { useState } from 'react'
import { useAuthStore, usePageStore, useDeviseStore, useThemeStore } from '../stores/index.js'
import api from '../services/api.js'

const LANGS = ['Français','English','Shikomori','Swahili','Malagasy']
const PAYS = [['KM','🇰🇲 Comores'],['FR','🇫🇷 France'],['NG','🇳🇬 Nigeria'],['SN','🇸🇳 Sénégal'],['MG','🇲🇬 Madagascar'],['CI','🇨🇮 Cote d Ivoire'],['TZ','🇹🇿 Tanzanie']]
const TYPES = ['Artiste','Media','Label','Influenceur','Entrepreneur','Pro','Consommateur']
const DEVISES = ['KMF - Franc Comorien','USD - Dollar','EUR - Euro','MGA - Ariary','XOF - Franc CFA']

export default function Settings() {
  const { user, logout } = useAuthStore()
  const { devise, setDevise } = useDeviseStore()
  const { theme, toggle: toggleTheme } = useThemeStore()
  const dc = devise?.code || 'KMF'
  const { setPage } = usePageStore()
  const [tab, setTab] = useState('profil')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    display_name: user?.display_name || '',
    username: user?.username || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    profile_type: user?.profile_type || 'Artiste',
    country: user?.country || 'KM',
    langue: 'Français',
    devise: 'KMF - Franc Comorien',
    notif_follow: true,
    notif_comment: true,
    notif_reaction: true,
    notif_purchase: true,
    notif_email: false,
    notif_sms: false,
    old_password: '',
    new_password: '',
    confirm_password: '',
  })
  const set = (k,v) => setForm(f=>({...f,[k]:v}))
  const inp = {background:'var(--card)',border:'1px solid var(--border)',borderRadius:8,padding:'10px 14px',color:'var(--text)',width:'100%',fontSize:14,boxSizing:'border-box'}
  const lbl = {display:'block',fontSize:11,fontWeight:700,letterSpacing:1,color:'var(--text3)',marginBottom:6}

  const TABS = [
    ['profil','👤 Profil'],
    ['securite','🔒 Sécurité'],
    ['notifications','🔔 Notifications'],
    ['langue','🌍 Langue & Région'],
    ['facturation','💳 Facturation'],
    ['notifs','🔔 Notifications'],
    ['droits','⚖️ Droits d'auteur'],
    ['confidentialite','🛡️ Confidentialité'],
  ]

  const [error, setError] = useState('')

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const res = await api.profiles.update({
        display_name: form.display_name,
        bio: form.bio,
        phone: form.phone,
        country: form.country,
        profile_type: form.profile_type.toLowerCase(),
      })
      if (res.profile) {
        setSaved(true)
        setTimeout(()=>setSaved(false), 3000)
      }
    } catch(e) {
      setError(e.message || 'Erreur lors de la sauvegarde')
    }
    setSaving(false)
  }

  const handleLogout = () => {
    logout()
    setPage('home')
  }

  if(!user) return (
    <div style={{textAlign:'center',padding:80}}>
      <button onClick={()=>setPage('login')} style={{background:'var(--primary)',border:'none',color:'#fff',padding:'10px 24px',borderRadius:8,cursor:'pointer'}}>Se connecter</button>
    </div>
  )

  return (
    <div style={{padding:'24px 20px 100px',maxWidth:900,margin:'0 auto'}}>
      <h1 style={{fontSize:24,fontWeight:900,margin:'0 0 24px'}}>⚙️ Paramètres & Compte</h1>

      <div style={{display:'grid',gridTemplateColumns:'200px 1fr',gap:20,alignItems:'start'}}>
        {/* MENU LATERAL */}
        <div style={{background:'var(--card)',borderRadius:12,padding:8,border:'1px solid var(--border)',position:'sticky',top:20}}>
          {TABS.map(([v,l]) => (
            <button key={v} onClick={()=>setTab(v)}
              style={{display:'block',width:'100%',textAlign:'left',padding:'10px 12px',borderRadius:8,border:'none',cursor:'pointer',fontSize:13,fontWeight:600,marginBottom:2,
                background:tab===v?'var(--primary)':'transparent',color:tab===v?'#fff':'var(--text2)'}}>
              {l}
            </button>
          ))}
          <div style={{borderTop:'1px solid var(--border)',marginTop:8,paddingTop:8}}>
            <button onClick={handleLogout}
              style={{display:'block',width:'100%',textAlign:'left',padding:'10px 12px',borderRadius:8,border:'none',cursor:'pointer',fontSize:13,fontWeight:600,
                background:'transparent',color:'#e74c3c'}}>
              🚪 Déconnexion
            </button>
          </div>
        </div>

        {/* CONTENU */}
        <div>
          {error && (
            <div style={{background:'rgba(230,57,70,0.1)',border:'1px solid #e74c3c',borderRadius:10,padding:'10px 16px',marginBottom:16,color:'#e74c3c',fontWeight:600,fontSize:14}}>
              ❌ {error}
            </div>
          )}
          {saved && (
            <div style={{background:'rgba(44,198,83,0.1)',border:'1px solid #2cc653',borderRadius:10,padding:'10px 16px',marginBottom:16,color:'#2cc653',fontWeight:600,fontSize:14}}>
              ✅ Modifications sauvegardées !
            </div>
          )}

          {/* PROFIL */}
          {tab === 'profil' && (
            <div style={{background:'var(--card)',borderRadius:12,padding:24,border:'1px solid var(--border)'}}>
              <h3 style={{margin:'0 0 20px',fontSize:16,fontWeight:800}}>👤 Informations du profil</h3>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
                <div>
                  <label style={lbl}>NOM COMPLET</label>
                  <input style={inp} value={form.display_name} onChange={e=>set('display_name',e.target.value)} placeholder="Votre nom"/>
                </div>
                <div>
                  <label style={lbl}>NOM D'UTILISATEUR</label>
                  <input style={{...inp,color:'var(--text3)'}} value={'@'+form.username} disabled/>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
                <div>
                  <label style={lbl}>EMAIL</label>
                  <input style={{...inp,color:'var(--text3)'}} value={form.email} disabled/>
                </div>
                <div>
                  <label style={lbl}>TÉLÉPHONE</label>
                  <input style={inp} value={form.phone} onChange={e=>set('phone',e.target.value)} placeholder="+269 ..."/>
                </div>
              </div>
              <div style={{marginBottom:14}}>
                <label style={lbl}>BIO</label>
                <textarea style={{...inp,height:80,resize:'vertical'}} value={form.bio} onChange={e=>set('bio',e.target.value)} placeholder="Décrivez-vous..."/>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:20}}>
                <div>
                  <label style={lbl}>TYPE DE PROFIL</label>
                  <select style={inp} value={form.profile_type} onChange={e=>set('profile_type',e.target.value)}>
                    {TYPES.map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>PAYS PRINCIPAL</label>
                  <select style={inp} value={form.country} onChange={e=>set('country',e.target.value)}>
                    {PAYS.map(([v,l])=><option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={handleSave} disabled={saving}
                style={{background:saving?'var(--border)':'var(--primary)',border:'none',color:'#fff',borderRadius:8,padding:'10px 24px',cursor:saving?'not-allowed':'pointer',fontWeight:700,fontSize:14}}>
                {saving?'Sauvegarde...':'💾 Sauvegarder'}
              </button>
            </div>
          )}

          {/* SECURITE */}
          {tab === 'securite' && (
            <div style={{background:'var(--card)',borderRadius:12,padding:24,border:'1px solid var(--border)'}}>
              <h3 style={{margin:'0 0 20px',fontSize:16,fontWeight:800}}>🔒 Sécurité du compte</h3>
              <div style={{marginBottom:14}}>
                <label style={lbl}>MOT DE PASSE ACTUEL</label>
                <input style={inp} type="password" value={form.old_password} onChange={e=>set('old_password',e.target.value)} placeholder="••••••••"/>
              </div>
              <div style={{marginBottom:14}}>
                <label style={lbl}>NOUVEAU MOT DE PASSE</label>
                <input style={inp} type="password" value={form.new_password} onChange={e=>set('new_password',e.target.value)} placeholder="••••••••"/>
              </div>
              <div style={{marginBottom:20}}>
                <label style={lbl}>CONFIRMER LE MOT DE PASSE</label>
                <input style={inp} type="password" value={form.confirm_password} onChange={e=>set('confirm_password',e.target.value)} placeholder="••••••••"/>
              </div>
              <button style={{background:'var(--primary)',border:'none',color:'#fff',borderRadius:8,padding:'10px 24px',cursor:'pointer',fontWeight:700,fontSize:14}}>
                🔒 Changer le mot de passe
              </button>
              <div style={{marginTop:24,padding:16,background:'rgba(230,57,70,0.08)',border:'1px solid rgba(230,57,70,0.2)',borderRadius:10}}>
                <div style={{fontWeight:700,fontSize:14,color:'#e74c3c',marginBottom:8}}>⚠️ Zone dangereuse</div>
                <p style={{fontSize:13,color:'var(--text2)',margin:'0 0 12px'}}>La suppression de votre compte est irréversible.</p>
                <button style={{background:'rgba(230,57,70,0.15)',border:'1px solid rgba(230,57,70,0.4)',color:'#e74c3c',borderRadius:8,padding:'8px 16px',cursor:'pointer',fontWeight:600,fontSize:13}}>
                  Supprimer mon compte
                </button>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS */}
          {tab === 'notifications' && (
            <div style={{background:'var(--card)',borderRadius:12,padding:24,border:'1px solid var(--border)'}}>
              <h3 style={{margin:'0 0 20px',fontSize:16,fontWeight:800}}>🔔 Préférences de notifications</h3>
              {[
                ['notif_follow','👥 Nouveaux abonnés','Quand quelquun vous suit'],
                ['notif_comment','💬 Commentaires','Sur vos sons et événements'],
                ['notif_reaction','❤️ Réactions','Sur votre contenu'],
                ['notif_purchase','💰 Achats & Paiements','Transactions sur votre compte'],
                ['notif_email','📧 Notifications par email','Résumé hebdomadaire'],
              ].map(([key,label,desc]) => (
                <div key={key} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 0',borderBottom:'1px solid var(--border)'}}>
                  <div>
                    <div style={{fontWeight:600,fontSize:14}}>{label}</div>
                    <div style={{fontSize:12,color:'var(--text2)'}}>{desc}</div>
                  </div>
                  <div onClick={()=>set(key,!form[key])}
                    style={{width:44,height:24,borderRadius:12,cursor:'pointer',position:'relative',transition:'background 0.2s',
                      background:form[key]?'var(--primary)':'var(--border)'}}>
                    <div style={{position:'absolute',top:3,left:form[key]?22:3,width:18,height:18,borderRadius:'50%',background:'#fff',transition:'left 0.2s'}}/>
                  </div>
                </div>
              ))}
              <button onClick={handleSave} style={{marginTop:20,background:'var(--primary)',border:'none',color:'#fff',borderRadius:8,padding:'10px 24px',cursor:'pointer',fontWeight:700,fontSize:14}}>
                💾 Sauvegarder
              </button>
            </div>
          )}

          {/* LANGUE */}
          {tab === 'langue' && (
            <div style={{background:'var(--card)',borderRadius:12,padding:24,border:'1px solid var(--border)'}}>
              <h3 style={{margin:'0 0 20px',fontSize:16,fontWeight:800}}>🌍 Langue & Région</h3>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:20}}>
                <div>
                  <label style={lbl}>LANGUE DE L'INTERFACE</label>
                  <select style={inp} value={form.langue} onChange={e=>set('langue',e.target.value)}>
                    {LANGS.map(l=><option key={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>DEVISE D'AFFICHAGE</label>
                  <select style={inp} value={form.devise} onChange={e=>set('devise',e.target.value)}>
                    {DEVISES.map(d=><option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={handleSave} style={{background:'var(--primary)',border:'none',color:'#fff',borderRadius:8,padding:'10px 24px',cursor:'pointer',fontWeight:700,fontSize:14}}>
                💾 Sauvegarder
              </button>
            </div>
          )}

          {/* FACTURATION */}
          {tab === 'facturation' && (
            <div style={{background:'var(--card)',borderRadius:12,padding:24,border:'1px solid var(--border)'}}>
              <h3 style={{margin:'0 0 20px',fontSize:16,fontWeight:800}}>💳 Facturation</h3>
              <div style={{display:'flex',gap:12,marginBottom:20}}>
                <button onClick={()=>setPage('wallet')}
                  style={{flex:1,background:'linear-gradient(135deg,var(--primary),#2563eb)',border:'none',color:'#fff',borderRadius:10,padding:14,cursor:'pointer',fontWeight:700,fontSize:14}}>
                  💰 Mon Portefeuille
                </button>
                <button onClick={()=>setPage('wallet')}
                  style={{flex:1,background:'var(--card2)',border:'1px solid var(--border)',color:'var(--text)',borderRadius:10,padding:14,cursor:'pointer',fontWeight:600,fontSize:14}}>
                  📋 Historique
                </button>
              </div>
              <div style={{background:'var(--card2)',borderRadius:10,padding:16,border:'1px solid var(--border)'}}>
                <div style={{fontSize:12,color:'var(--text3)',fontWeight:700,marginBottom:8}}>MOYENS DE PAIEMENT ACCEPTÉS</div>
                {[
                  { icon:'📱', name:'Huri Money', code:'#126#' },
                  { icon:'📲', name:'Telecom Comores', code:'M-Pesa' },
                  { icon:'🟠', name:'Orange Money', code:'#144#' },
                ].map((g,i) => (
                  <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 0',borderBottom:i<2?'1px solid var(--border)':'none'}}>
                    <span style={{fontSize:20}}>{g.icon}</span>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:600,fontSize:13}}>{g.name}</div>
                      <div style={{fontSize:11,color:'var(--text3)'}}>{g.code}</div>
                    </div>
                    <span style={{fontSize:11,color:'#2cc653',fontWeight:700,background:'rgba(44,198,83,0.1)',padding:'2px 8px',borderRadius:6}}>ACTIF</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CONFIDENTIALITE */}
          
          {tab === 'notifs' && (
            <div>
              <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--radius)",padding:24,marginBottom:16}}>
                <div style={{fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:16,marginBottom:18}}>🔔 Préférences de notifications</div>
                {[
                  {label:"Ventes & revenus",sub:"Quand un titre est acheté ou loué",key:"notif_purchase"},
                  {label:"Nouveaux fans",sub:"Quand quelqu'un vous suit",key:"notif_follow"},
                  {label:"Commentaires",sub:"Réactions sur vos publications",key:"notif_comment"},
                  {label:"Événements Live",sub:"Émissions et concerts en direct",key:"notif_reaction"},
                ].map(n=>(
                  <div key={n.key} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 0",borderBottom:"1px solid var(--border)"}}>
                    <div>
                      <div style={{fontWeight:600,fontSize:13}}>{n.label}</div>
                      <div style={{fontSize:11,color:"var(--text3)",marginTop:2}}>{n.sub}</div>
                    </div>
                    <button onClick={()=>setForm(f=>({...f,[n.key]:!f[n.key]}))}
                      style={{width:48,height:26,borderRadius:13,border:"none",cursor:"pointer",position:"relative",background:form[n.key]?"var(--gold)":"var(--card2)",transition:"background .3s",flexShrink:0}}>
                      <div style={{position:"absolute",top:3,width:20,height:20,borderRadius:"50%",background:"#fff",transition:"left .3s",left:form[n.key]?24:3,boxShadow:"0 1px 4px rgba(0,0,0,.3)"}}/>
                    </button>
                  </div>
                ))}
              </div>
              <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--radius)",padding:24}}>
                <div style={{fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:16,marginBottom:18}}>📬 Canaux</div>
                {[{label:"Email",key:"notif_email"},{label:"SMS",key:"notif_sms"}].map(n=>(
                  <div key={n.key} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 0",borderBottom:"1px solid var(--border)"}}>
                    <div style={{fontWeight:600,fontSize:13}}>{n.label}</div>
                    <button onClick={()=>setForm(f=>({...f,[n.key]:!f[n.key]}))}
                      style={{width:48,height:26,borderRadius:13,border:"none",cursor:"pointer",position:"relative",background:form[n.key]?"var(--gold)":"var(--card2)",transition:"background .3s",flexShrink:0}}>
                      <div style={{position:"absolute",top:3,width:20,height:20,borderRadius:"50%",background:"#fff",transition:"left .3s",left:form[n.key]?24:3,boxShadow:"0 1px 4px rgba(0,0,0,.3)"}}/>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'droits' && (
            <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--radius)",padding:24}}>
              <div style={{fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:16,marginBottom:18}}>⚖️ Droits d'auteur & Licences</div>
              <div style={{fontSize:13,color:"var(--text2)",lineHeight:1.8,marginBottom:16}}>
                Choisissez comment vos œuvres peuvent être utilisées par d'autres utilisateurs.
              </div>
              {[
                {label:"Partage commercial autorisé",sub:"Votre contenu peut être utilisé dans des projets commerciaux",val:false},
                {label:"Remix & dérivés autorisés",sub:"Les autres peuvent créer des versions dérivées",val:false},
                {label:"Attribution obligatoire",sub:"Votre nom doit apparaître sur toute réutilisation",val:true},
              ].map((d,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 0",borderBottom:"1px solid var(--border)"}}>
                  <div>
                    <div style={{fontWeight:600,fontSize:13}}>{d.label}</div>
                    <div style={{fontSize:11,color:"var(--text3)",marginTop:2}}>{d.sub}</div>
                  </div>
                  <button style={{width:48,height:26,borderRadius:13,border:"none",cursor:"pointer",position:"relative",background:d.val?"var(--gold)":"var(--card2)",transition:"background .3s",flexShrink:0}}>
                    <div style={{position:"absolute",top:3,width:20,height:20,borderRadius:"50%",background:"#fff",left:d.val?24:3,boxShadow:"0 1px 4px rgba(0,0,0,.3)"}}/>
                  </button>
                </div>
              ))}
              <div style={{marginTop:20}}>
                <button style={{padding:"9px 22px",borderRadius:50,border:"none",background:"linear-gradient(135deg,var(--gold),#e8920a)",color:"#000",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"Plus Jakarta Sans,sans-serif"}}>
                  💾 Sauvegarder
                </button>
              </div>
            </div>
          )}

          {tab === 'confidentialite' && (
            <div style={{background:'var(--card)',borderRadius:12,padding:24,border:'1px solid var(--border)'}}>
              <h3 style={{margin:'0 0 20px',fontSize:16,fontWeight:800}}>🛡️ Confidentialité</h3>
              {[
                ['Profil public','Visible par tous les utilisateurs'],
                ['Afficher mes écoutes','Montrer mon historique d ecoute'],
                ['Afficher mes abonnements','Visible sur mon profil'],
                ['Indexation moteurs de recherche','Apparaître dans les résultats Google'],
              ].map(([ label, desc ],i) => (
                <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 0',borderBottom:'1px solid var(--border)'}}>
                  <div>
                    <div style={{fontWeight:600,fontSize:14}}>{label}</div>
                    <div style={{fontSize:12,color:'var(--text2)'}}>{desc}</div>
                  </div>
                  <div style={{width:44,height:24,borderRadius:12,cursor:'pointer',background:'var(--primary)',position:'relative'}}>
                    <div style={{position:'absolute',top:3,right:3,width:18,height:18,borderRadius:'50%',background:'#fff'}}/>
                  </div>
                </div>
              ))}
              <button onClick={handleSave} style={{marginTop:20,background:'var(--primary)',border:'none',color:'#fff',borderRadius:8,padding:'10px 24px',cursor:'pointer',fontWeight:700,fontSize:14}}>
                💾 Sauvegarder
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
