import { useState, useEffect } from 'react'
import { useAuthStore, usePageStore } from '../stores/index.js'
const API = import.meta.env.VITE_API_URL
const getAudioDuration=(file)=>new Promise((resolve)=>{try{const a=document.createElement('audio');a.preload='metadata';a.onloadedmetadata=()=>{const d=Math.round(a.duration);URL.revokeObjectURL(a.src);resolve(isFinite(d)&&d>0?d:0)};a.onerror=()=>{URL.revokeObjectURL(a.src);resolve(0)};a.src=URL.createObjectURL(file)}catch(e){resolve(0)}})
const GENRES_MUSIC = ['Twarab','Sebene / Soukous','Afrobeats','Amapiano','Afrotrap / Rap','Coupé Décalé','Slam','Gospel / Religion','Traditionnel','Mindset / Motivation','Toirab','Sambé','Qasida']
const PODCAST_CATS = ['💡 Mindset','💼 Business','📚 Éducation','🎵 Musique','🗣️ Société','🏥 Santé','🔬 Tech','🌍 Actualités','⚽ Sport','🕌 Spiritualité']
const EMISSION_CATS = ['🎭 Culture','🗣️ Société','⚽ Sport','🎵 Musique','💼 Économie','🕌 Religion','🌱 Jeunesse','🔬 Tech','🌍 Actualités']
const COUNTRIES = [['KM','🇰🇲 Comores'],['MG','🇲🇬 Madagascar'],['TZ','🇹🇿 Tanzanie'],['RW','🇷🇼 Rwanda'],['CI',"🇨🇮 Côte d'Ivoire"],['NG','🇳🇬 Nigeria'],['CD','🇨🇩 RD Congo'],['SN','🇸🇳 Sénégal'],['GH','🇬🇭 Ghana'],['CM','🇨🇲 Cameroun']]
const LANGS = [['fr','Français'],['km','Shikomori'],['sw','Swahili'],['en','Anglais'],['ar','Arabe'],['mg','Malagasy']]
const CUR = ['KMF','USD','EUR','XOF','NGN']

function MonetBlock({ok,mode,setMode,form,set,preview=true,pvSec=10,setPvSec=null,showBoth=true}){
  const PM=[['free','🎁','Gratuit'],['buy','🛒','Vente'],['rent','⏳','Location']];if(showBoth)PM.push(['both','🔀','Vente+Location'])
  if(!ok)return(<div className="upload-section-box" style={{borderColor:'rgba(245,166,35,.25)',background:'rgba(245,166,35,.04)'}}><div className="upload-section-title">💰 Monétisation</div><div style={{display:'flex',alignItems:'center',gap:12,padding:'14px 16px',background:'rgba(245,166,35,.06)',border:'1px solid rgba(245,166,35,.2)',borderRadius:'var(--radius-sm)'}}><span style={{fontSize:24}}>🔒</span><div><div style={{fontSize:13,fontWeight:700,color:'var(--gold)',marginBottom:3}}>Compte non vérifié</div><div style={{fontSize:12,color:'var(--text2)',lineHeight:1.6}}>Seuls les vérifiés peuvent monétiser. Publication en <strong>gratuit uniquement</strong>. Demandez la vérification dans Paramètres.</div></div></div></div>)
  return(<div className="upload-section-box"><div className="upload-section-title">💰 Monétisation & Accès</div>
    <div className="pricing-modes">{PM.map(([id,ic,lb])=>(<div key={id} className={`pricing-mode${mode===id?' sel':''}`} onClick={()=>setMode(id)}><div className="pricing-mode-icon">{ic}</div><div className="pricing-mode-label">{lb}</div></div>))}</div>
    {(mode==='buy'||mode==='both')&&<div style={{marginBottom:14}}><label className="label">Prix de vente</label><div style={{display:'flex',gap:8}}><input className="input-field" type="number" value={form.sp||''} onChange={e=>set('sp',e.target.value)} placeholder="Ex: 2500" style={{flex:1}}/><select className="select-styled" value={form.sc||'KMF'} onChange={e=>set('sc',e.target.value)}>{CUR.map(c=><option key={c}>{c}</option>)}</select></div></div>}
    {(mode==='rent'||mode==='both')&&<div><label className="label" style={{marginBottom:10}}>Tarifs de location</label><div className="rental-grid">{[['rd','📅 Journalier','150'],['rw','📅 Hebdomadaire','600'],['rm','📅 Mensuel','1800']].map(([k,lb,ph])=>(<div key={k} className="rental-period-input"><div className="rental-period-label">{lb}</div><div style={{display:'flex',gap:6}}><input className="input-field" type="number" value={form[k]||''} onChange={e=>set(k,e.target.value)} placeholder={ph} style={{flex:1,fontSize:13}}/><select className="select-styled" style={{fontSize:12}}><option>KMF</option><option>USD</option></select></div></div>))}</div></div>}
    {preview&&mode!=='free'&&setPvSec&&<div style={{marginTop:16,padding:14,background:'rgba(245,166,35,.04)',border:'1px solid rgba(245,166,35,.15)',borderRadius:'var(--radius-sm)'}}><div style={{fontSize:12,fontWeight:700,color:'var(--text2)',marginBottom:8}}>🎧 Extrait gratuit</div><div style={{display:'flex',alignItems:'center',gap:14,flexWrap:'wrap'}}><input type="range" min="5" max="30" value={pvSec} onChange={e=>setPvSec(+e.target.value)} style={{width:120,accentColor:'var(--gold)'}}/><span style={{fontFamily:'Space Mono,monospace',fontSize:14,fontWeight:700,color:'var(--gold)'}}>{pvSec}s</span></div></div>}
  </div>)
}

function MonetFlux({ok,mode,setMode,form,set,pvSec,setPvSec}){
  if(!ok)return(<div className="upload-section-box" style={{borderColor:'rgba(245,166,35,.25)',background:'rgba(245,166,35,.04)'}}><div className="upload-section-title">💰 Accès au flux</div><div style={{display:'flex',alignItems:'center',gap:12,padding:14,background:'rgba(245,166,35,.06)',border:'1px solid rgba(245,166,35,.2)',borderRadius:'var(--radius-sm)'}}><span style={{fontSize:24}}>🔒</span><div><div style={{fontSize:13,fontWeight:700,color:'var(--gold)'}}>Non vérifié — gratuit uniquement</div></div></div></div>)
  const M=[['free','🎁','Gratuit','Accès libre'],['sub','💎','Abonnés','Réservé abonnés'],['paid','💳','Payant','Jour/semaine/mois/an']]
  return(<div className="upload-section-box"><div className="upload-section-title">💰 Accès au flux</div>
    <div className="pricing-modes">{M.map(([id,ic,lb,ds])=>(<div key={id} className={`pricing-mode${mode===id?' sel':''}`} onClick={()=>setMode(id)}><div className="pricing-mode-icon">{ic}</div><div className="pricing-mode-label">{lb}</div><div style={{fontSize:9,color:'var(--text3)',marginTop:2}}>{ds}</div></div>))}</div>
    {mode==='paid'&&<div style={{marginTop:14}}><label className="label" style={{marginBottom:10}}>Tarifs</label><div className="rental-grid" style={{gridTemplateColumns:'1fr 1fr'}}>{[['fd','📅 Jour','100'],['fw','📅 Semaine','500'],['fm','📅 Mois','1500'],['fy','📅 An','12000']].map(([k,lb,ph])=>(<div key={k} className="rental-period-input"><div className="rental-period-label">{lb}</div><div style={{display:'flex',gap:6}}><input className="input-field" type="number" value={form[k]||''} onChange={e=>set(k,e.target.value)} placeholder={ph} style={{flex:1,fontSize:13}}/><select className="select-styled" style={{fontSize:12}}><option>KMF</option><option>USD</option></select></div></div>))}</div></div>}
    {mode!=='free'&&<div style={{marginTop:16,padding:14,background:'rgba(245,166,35,.04)',border:'1px solid rgba(245,166,35,.15)',borderRadius:'var(--radius-sm)'}}><div style={{fontSize:12,fontWeight:700,color:'var(--text2)',marginBottom:8}}>🎧 Extrait gratuit</div><div style={{display:'flex',alignItems:'center',gap:14}}><input type="range" min="10" max="120" value={pvSec} onChange={e=>setPvSec(+e.target.value)} style={{width:140,accentColor:'var(--gold)'}}/><span style={{fontFamily:'Space Mono,monospace',fontSize:14,fontWeight:700,color:'var(--gold)'}}>{pvSec>=60?Math.floor(pvSec/60)+'min'+(pvSec%60>0?pvSec%60+'s':''):pvSec+'s'}</span></div></div>}
  </div>)
}

export default function Upload(){
  const{user}=useAuthStore();const{setPage}=usePageStore()
  const[tab,setTab]=useState('son'),[loading,setLoading]=useState(false),[progress,setProgress]=useState(0),[msg,setMsg]=useState(''),[error,setError]=useState(''),[success,setSuccess]=useState(false)
  const token=localStorage.getItem('waiichia_token'),ok=!!user?.is_verified
  useEffect(()=>{try{const f=sessionStorage.getItem('upload_tab');if(f&&['son','album','podcast','emission','media'].includes(f)){setTab(f);sessionStorage.removeItem('upload_tab')}}catch(e){}},[])
  const uf=async(file,ep)=>new Promise((res,rej)=>{const fd=new FormData();fd.append('file',file);const x=new XMLHttpRequest();x.upload.onprogress=e=>{if(e.lengthComputable)setProgress(Math.round(e.loaded/e.total*100))};x.onload=()=>{const d=JSON.parse(x.responseText);x.status>=400?rej(new Error(d.error)):res(d.url)};x.onerror=()=>rej(new Error('Erreur réseau'));x.open('POST',API+ep);x.setRequestHeader('Authorization','Bearer '+token);x.send(fd)})
  if(!user)return(<div style={{textAlign:'center',padding:60}}><div style={{fontSize:48,marginBottom:16}}>🔒</div><h2 style={{fontFamily:'Syne,sans-serif'}}>Connectez-vous pour publier</h2><button className="btn btn-primary" onClick={()=>setPage('login')} style={{marginTop:16}}>Se connecter</button></div>)
  if(success)return(<div style={{textAlign:'center',padding:80}}><div style={{fontSize:64,marginBottom:16}}>✅</div><div style={{fontFamily:'Syne,sans-serif',fontSize:24,fontWeight:800}}>Contenu publié !</div><button className="btn btn-primary" style={{marginTop:24}} onClick={()=>{setSuccess(false);setTab('son')}}>Publier autre chose</button></div>)
  const T=[{id:'son',ic:'🎵',lb:'Son'},{id:'album',ic:'💿',lb:'Album'},{id:'podcast',ic:'🎙️',lb:'Podcast'},{id:'emission',ic:'📺',lb:'Émission'},{id:'media',ic:'📻',lb:'Flux Média'}]
  return(<div style={{maxWidth:720,paddingBottom:80}}><div className="page-title">📤 Publier du Contenu</div>
    <div className="tabs-bar" style={{marginBottom:24}}>{T.map(t=><button key={t.id} className={`tab-btn${tab===t.id?' active':''}`} onClick={()=>{setTab(t.id);setError('')}}>{t.ic} {t.lb}</button>)}</div>
    {error&&<div style={{background:'rgba(230,57,70,.1)',border:'1px solid rgba(230,57,70,.3)',borderRadius:'var(--radius-sm)',padding:'12px 16px',marginBottom:16,fontSize:13,color:'var(--red)'}}>⚠️ {error}</div>}
    {loading&&progress>0&&<div style={{marginBottom:16}}><div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'var(--text2)',marginBottom:6}}><span>{msg}</span><span style={{fontWeight:700,color:'var(--gold)'}}>{progress}%</span></div><div style={{background:'var(--border)',borderRadius:99,height:6,overflow:'hidden'}}><div style={{height:'100%',background:'linear-gradient(90deg,var(--gold),#e8920a)',width:progress+'%',transition:'width .3s'}}/></div></div>}
    {tab==='son'&&<FSon ok={ok} uf={uf} sL={setLoading} sE={setError} sM={setMsg} sP={setProgress} sS={setSuccess} sPage={setPage} tk={token}/>}
    {tab==='album'&&<FAlbum ok={ok} uf={uf} sL={setLoading} sE={setError} sM={setMsg} sP={setProgress} sS={setSuccess} tk={token}/>}
    {tab==='podcast'&&<FPodcast ok={ok} uf={uf} sL={setLoading} sE={setError} sM={setMsg} sP={setProgress} sS={setSuccess} tk={token}/>}
    {tab==='emission'&&<FEmission ok={ok} uf={uf} sL={setLoading} sE={setError} sM={setMsg} sP={setProgress} sS={setSuccess} tk={token}/>}
    {tab==='media'&&<FMedia ok={ok}/>}
  </div>)
}

function FSon({ok,uf,sL,sE,sM,sP,sS,sPage,tk}){
  const[af,setAf]=useState(null),[cf,setCf]=useState(null),[cp,setCp]=useState(''),[pm,setPm]=useState('free'),[lic,setLic]=useState('all'),[pvS,setPvS]=useState(10),[tags,setTags]=useState(['#twarab','#komori']),[ti,setTi]=useState('')
  const[f,sF]=useState({title:'',genre:'Twarab',country:'KM',language:'fr',bpm:'',key:'',mood:'',desc:'',feat:'',sp:'',sc:'KMF',rd:'',rw:'',rm:''})
  const s=(k,v)=>sF(p=>({...p,[k]:v}))
  const addTag=e=>{if(e.key==='Enter'||e.key===','){e.preventDefault();const t=ti.trim().replace(',','');if(t&&!tags.includes(t))setTags(p=>[...p,t.startsWith('#')?t:'#'+t]);setTi('')}}
  const submit=async()=>{if(!f.title)return sE('Titre requis');if(!af)return sE('Fichier audio requis');sL(true);sE('');sM('Upload audio...');sP(0);try{let au=await uf(af,'/api/upload/audio'),cu='';if(cf){sM('Upload pochette...');cu=await uf(cf,'/api/upload/cover')}sM('Publication...');const durS=await getAudioDuration(af);const r=await fetch(API+'/api/tracks/',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+tk},body:JSON.stringify({title:f.title,description:f.desc,type:'music',genre:f.genre,country:f.country,language:f.language,access_type:pm==='free'?'free':'paid',sale_price:['buy','both'].includes(pm)?parseInt(f.sp)||0:0,rent_price_day:['rent','both'].includes(pm)?parseInt(f.rd)||0:0,preview_end_sec:pvS,duration_sec:durS,audio_url_128:au,cover_url:cu||null,is_published:true,tags})});const d=await r.json();if(!r.ok)throw new Error(d.error);sS(true)}catch(e){sE(e.message)}sL(false)}
  const R=[['all','© Tous droits réservés','Utilisation interdite sans autorisation'],['cc','CC BY — Creative Commons','Libre avec attribution'],['nc','CC BY-NC','Pas d\'usage commercial']]
  return(<div className="upload-form-panel">
    <div className="upload-form-header"><div style={{fontSize:32}}>🎵</div><div><div style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:18}}>Publier un Son</div><div style={{fontSize:12,color:'var(--text2)'}}>Single, instrumental ou remix</div></div></div>
    <div className="upload-drop-zone" onClick={()=>document.getElementById('iS').click()}><input type="file" id="iS" accept=".mp3,.wav,.flac,.ogg,.aac" style={{display:'none'}} onChange={e=>{const x=e.target.files[0];if(x)setAf(x)}}/>{af?<div><div style={{fontSize:36,marginBottom:8}}>✅</div><div className="upload-drop-title">{af.name}</div><div className="upload-drop-sub">({(af.size/1048576).toFixed(1)} MB)</div></div>:<div><div className="upload-drop-icon">🎵</div><div className="upload-drop-title">Glissez votre fichier audio ici</div><div className="upload-drop-sub">MP3 · WAV · FLAC — Max 200 MB</div><button className="btn btn-primary btn-sm" style={{marginTop:14}}>Parcourir</button></div>}</div>
    <div className="form-group"><label className="label">🖼️ Pochette *</label><div className="cover-upload-row"><div className="cover-preview" onClick={()=>document.getElementById('cS').click()}><input type="file" id="cS" accept="image/*" style={{display:'none'}} onChange={e=>{const x=e.target.files[0];if(x){setCf(x);setCp(URL.createObjectURL(x))}}}/>{cp?<img src={cp} alt=""/>:<><span>+</span><div style={{fontSize:10,marginTop:4}}>Ajouter</div></>}</div><div style={{fontSize:12,color:'var(--text2)',lineHeight:1.7}}>Carré · 800×800px min · JPG/PNG</div></div></div>
    <div className="form-group"><label className="label">Titre *</label><input className="input-field" value={f.title} onChange={e=>s('title',e.target.value)} placeholder="Titre du son..."/></div>
    <div className="form-row"><div className="form-group"><label className="label">Genre</label><select className="select-styled" style={{width:'100%'}} value={f.genre} onChange={e=>s('genre',e.target.value)}>{GENRES_MUSIC.map(g=><option key={g}>{g}</option>)}</select></div><div className="form-group"><label className="label">Pays</label><select className="select-styled" style={{width:'100%'}} value={f.country} onChange={e=>s('country',e.target.value)}>{COUNTRIES.map(([c,l])=><option key={c} value={c}>{l}</option>)}</select></div></div>
    <div className="form-row" style={{gridTemplateColumns:'1fr 1fr 1fr'}}><div className="form-group"><label className="label">BPM</label><input className="input-field" type="number" value={f.bpm} onChange={e=>s('bpm',e.target.value)} placeholder="120"/></div><div className="form-group"><label className="label">Tonalité</label><select className="select-styled" style={{width:'100%'}} value={f.key} onChange={e=>s('key',e.target.value)}><option value="">--</option><option>Do (C)</option><option>Ré (D)</option><option>Mi (E)</option><option>Fa (F)</option><option>Sol (G)</option><option>La (A)</option><option>Si (B)</option></select></div><div className="form-group"><label className="label">Humeur</label><select className="select-styled" style={{width:'100%'}} value={f.mood} onChange={e=>s('mood',e.target.value)}><option value="">--</option><option>Joyeux</option><option>Mélancolique</option><option>Énergique</option><option>Spirituel</option><option>Romantique</option></select></div></div>
    <div className="form-group"><label className="label">Tags</label><div className="tag-input-wrap">{tags.map(t=><div key={t} className="tag-pill">{t} <span className="remove" onClick={()=>setTags(p=>p.filter(x=>x!==t))}>✕</span></div>)}<input className="tag-input" value={ti} onChange={e=>setTi(e.target.value)} onKeyDown={addTag} placeholder="Ajouter un tag..."/></div></div>
    <div className="form-group"><label className="label">🎤 Featuring</label><input className="input-field" value={f.feat} onChange={e=>s('feat',e.target.value)} placeholder="Rechercher un artiste..."/></div>
    <div className="form-group"><label className="label">Description / Paroles</label><textarea className="textarea-field" value={f.desc} onChange={e=>s('desc',e.target.value)} placeholder="Décrivez votre son..."/></div>
    <div className="upload-section-box" style={{borderColor:'rgba(245,166,35,.25)',background:'rgba(245,166,35,.04)'}}><div className="upload-section-title">🎧 Extrait gratuit</div><div style={{display:'flex',alignItems:'center',gap:14,flexWrap:'wrap'}}><span className="label" style={{margin:0}}>Durée</span><input type="range" min="5" max="20" value={pvS} onChange={e=>setPvS(+e.target.value)} style={{width:120,accentColor:'var(--gold)'}}/><span style={{fontFamily:'Space Mono,monospace',fontSize:14,fontWeight:700,color:'var(--gold)'}}>{pvS}s</span><span style={{fontSize:11,color:'var(--text3)'}}>Min 5s · Max 20s</span></div></div>
    <MonetBlock ok={ok} mode={pm} setMode={setPm} form={f} set={s} preview={false}/>
    <div className="upload-section-box"><div className="upload-section-title">⚖️ Droits & Licence</div><div style={{display:'flex',flexDirection:'column',gap:10}}>{R.map(([id,t,d])=><label key={id} style={{display:'flex',alignItems:'flex-start',gap:10,cursor:'pointer'}}><input type="radio" name="lic" checked={lic===id} onChange={()=>setLic(id)} style={{accentColor:'var(--gold)',marginTop:3}}/><div><div style={{fontSize:13,fontWeight:600}}>{t}</div><div style={{fontSize:11,color:'var(--text2)'}}>{d}</div></div></label>)}</div></div>
    <div className="upload-form-actions"><button className="btn btn-secondary" style={{padding:'13px 20px'}}>💾 Brouillon</button><button className="btn btn-primary" style={{flex:1,padding:13,fontSize:15}} onClick={submit}>🚀 Publier</button></div>
  </div>)
}

function FAlbum({ok,uf,sL,sE,sM,sP,sS,tk}){
  const[cp,setCp]=useState(''),[cf,setCf]=useState(null)
  const[pm,setPm]=useState('free'),[pvS,setPvS]=useState(15)
  const[f,sF]=useState({title:'',type:'album',genre:'Twarab',country:'KM',year:'2026',desc:'',sp:'',sc:'KMF',rd:'',rw:'',rm:''})
  const[tks,setTks]=useState([{title:'',file:null},{title:'',file:null}])
  const s=(k,v)=>sF(p=>({...p,[k]:v}))
  const submit=async()=>{
    if(!f.title)return sE('Titre requis')
    sL(true);sE('');sM("Upload pochette...");sP(0)
    try{
      let cu=''
      if(cf){cu=await uf(cf,'/api/upload/cover')}
      sM("Création de l'album...")
      const r=await fetch(API+'/api/albums',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+tk},body:JSON.stringify({title:f.title,description:f.desc,genre:f.genre,country:f.country,release_year:parseInt(f.year)||2026,album_type:f.type,cover_url:cu||null,is_published:true,tags:[]})})
      const d=await r.json()
      if(!r.ok)throw new Error(d.error||'Erreur création album')
      const albumId=d.album?.id||d.id
      const tracksWithFile=tks.filter(t=>t.title&&t.file)
      for(let i=0;i<tracksWithFile.length;i++){
        const t=tracksWithFile[i];sM(`Upload piste ${i+1}/${tracksWithFile.length}: ${t.title}`)
        const durA=await getAudioDuration(t.file);const au=await uf(t.file,'/api/upload/audio')
        const tr=await fetch(API+'/api/tracks/',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+tk},body:JSON.stringify({title:t.title,type:'music',genre:f.genre,country:f.country,duration_sec:durA,audio_url_128:au,cover_url:cu||null,is_published:true,access_type:'free',tags:[]})})
        const td=await tr.json()
        if(tr.ok&&td.track?.id){await fetch(API+'/api/albums/'+albumId+'/tracks',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+tk},body:JSON.stringify({track_id:td.track.id,position:i+1})}).catch(()=>{})}
      }
      sS(true)
    }catch(e){sE(e.message)}
    sL(false)
  }
  return(<div className="upload-form-panel">
    <div className="upload-form-header"><div style={{fontSize:32}}>💿</div><div><div style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:18}}>Créer un Album</div><div style={{fontSize:12,color:'var(--text2)'}}>Album, EP, mixtape ou compilation</div></div></div>
    <div className="form-group"><label className="label">🖼️ Pochette *</label><div className="cover-upload-row"><div className="cover-preview" onClick={()=>document.getElementById('cA').click()}><input type="file" id="cA" accept="image/*" style={{display:'none'}} onChange={e=>{const x=e.target.files[0];if(x){setCf(x);setCp(URL.createObjectURL(x))}}}/>{cp?<img src={cp} alt=""/>:<><span>+</span><div style={{fontSize:10,marginTop:4}}>Ajouter</div></>}</div><div style={{fontSize:12,color:'var(--text2)'}}>Carré · 1000×1000px min</div></div></div>
    <div className="form-row"><div className="form-group" style={{flex:2}}><label className="label">Titre *</label><input className="input-field" value={f.title} onChange={e=>s('title',e.target.value)} placeholder="Titre de l'album..."/></div><div className="form-group"><label className="label">Type</label><select className="select-styled" style={{width:'100%'}} value={f.type} onChange={e=>s('type',e.target.value)}><option value="album">Album</option><option value="ep">EP</option><option value="single">Single</option><option value="mixtape">Mixtape</option></select></div></div>
    <div className="form-row" style={{gridTemplateColumns:'1fr 1fr 1fr'}}><div className="form-group"><label className="label">Genre</label><select className="select-styled" style={{width:'100%'}} value={f.genre} onChange={e=>s('genre',e.target.value)}>{GENRES_MUSIC.map(g=><option key={g}>{g}</option>)}</select></div><div className="form-group"><label className="label">Pays</label><select className="select-styled" style={{width:'100%'}} value={f.country} onChange={e=>s('country',e.target.value)}>{COUNTRIES.map(([c,l])=><option key={c} value={c}>{l}</option>)}</select></div><div className="form-group"><label className="label">Année</label><input className="input-field" type="number" value={f.year} onChange={e=>s('year',e.target.value)}/></div></div>
    <div className="form-group"><label className="label">Description</label><textarea className="textarea-field" value={f.desc} onChange={e=>s('desc',e.target.value)} placeholder="Parlez de cet album..."/></div>
    <div className="upload-section-box"><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}><div className="upload-section-title" style={{marginBottom:0}}>🎵 Pistes</div><button className="btn btn-outline btn-sm" onClick={()=>setTks(p=>[...p,{title:'',file:null}])}>+ Ajouter</button></div>
      {tks.map((_,i)=>(<div key={i} className="album-track-row"><div className="track-row-num">{i+1}</div><div className="track-row-body"><input className="input-field" placeholder="Titre piste *" style={{marginBottom:8}} value={tks[i].title} onChange={e=>setTks(p=>p.map((t,j)=>j===i?{...t,title:e.target.value}:t))}/><div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}><label className="upload-mini-btn" style={{cursor:'pointer'}}>🎵 {tks[i].file?tks[i].file.name.slice(0,20)+'…':'Audio'}<input type="file" accept="audio/*" style={{display:'none'}} onChange={e=>{const x=e.target.files[0];if(x)setTks(p=>p.map((t,j)=>j===i?{...t,file:x}:t))}}/></label></div></div>{tks.length>1&&<button className="track-row-remove" onClick={()=>setTks(p=>p.filter((_,j)=>j!==i))}>✕</button>}</div>))}
      <div style={{marginTop:10,fontSize:11,color:'var(--text3)'}}>💡 Vous pouvez publier sans pistes et les ajouter plus tard.</div>
    </div>
    <MonetBlock ok={ok} mode={pm} setMode={setPm} form={f} set={s} showBoth={true} preview={true} pvSec={pvS} setPvSec={setPvS}/>
    <div className="upload-section-box"><div className="upload-section-title">⚖️ Droits</div><div style={{display:'flex',flexDirection:'column',gap:10}}>{[['© Tous droits réservés','Interdite sans autorisation'],['CC BY — Creative Commons','Libre avec attribution']].map(([t,d],i)=><label key={i} style={{display:'flex',alignItems:'flex-start',gap:10,cursor:'pointer'}}><input type="radio" name="ra" defaultChecked={i===0} style={{accentColor:'var(--gold)',marginTop:3}}/><div><div style={{fontSize:13,fontWeight:600}}>{t}</div><div style={{fontSize:11,color:'var(--text2)'}}>{d}</div></div></label>)}</div></div>
    <div className="upload-form-actions"><button className="btn btn-secondary" style={{padding:'13px 20px'}}>💾 Brouillon</button><button className="btn btn-primary" style={{flex:1,padding:13,fontSize:15}} onClick={submit}>🚀 Publier l'album</button></div>
  </div>)
}

function FPodcast({ok,uf,sL,sE,sM,sP,sS,tk}){
  const[step,setStep]=useState(1),[cp,setCp]=useState(''),[cf,setCf]=useState(null)
  const[name,setName]=useState(''),[desc,setDesc]=useState(''),[cat,setCat]=useState(PODCAST_CATS[0]),[lang,setLang]=useState('fr'),[country,setCountry]=useState('KM'),[freq,setFreq]=useState('Hebdomadaire')
  const[eps,setEps]=useState([{title:'',file:null,number:1,season:1}])
  const[pm,setPm]=useState('free'),[pvS,setPvS]=useState(15),[f,sF]=useState({sp:'',sc:'KMF',rd:'',rw:'',rm:''})
  const s=(k,v)=>sF(p=>({...p,[k]:v}))
  const Steps=()=><div className="upload-steps-bar">{[{n:1,l:'Série'},{n:2,l:'Épisodes'},{n:3,l:'Diffusion'}].map((x,i)=><div key={x.n} style={{display:'contents'}}>{i>0&&<div className="upload-step-sep"/>}<div className={`upload-step${step===x.n?' active':''}${step>x.n?' done':''}`} onClick={()=>setStep(x.n)}><span className="step-num">{step>x.n?'✓':x.n}</span><span>{x.l}</span></div></div>)}</div>
  const submit=async()=>{
    if(!name.trim())return sE('Nom du podcast requis')
    sL(true);sE('');sM('Upload visuel...');sP(0)
    try{
      let cu=''
      if(cf){cu=await uf(cf,'/api/upload/cover')}
      sM('Création du podcast...')
      const r=await fetch(API+'/api/emissions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+tk},body:JSON.stringify({title:name,description:desc,category:cat,language:lang,country,format:'podcast',cover_url:cu||null,duration_avg:freq})})
      const d=await r.json()
      if(!r.ok)throw new Error(d.error||'Erreur création podcast')
      const emId=d.emission?.id||d.id
      const epsWithFile=eps.filter(e=>e.title&&e.file)
      for(let i=0;i<epsWithFile.length;i++){
        const ep=epsWithFile[i];sM(`Upload épisode ${i+1}/${epsWithFile.length}: ${ep.title}`)
        const dur=await getAudioDuration(ep.file);const au=await uf(ep.file,'/api/upload/audio')
        await fetch(API+'/api/emissions/'+emId+'/episodes',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+tk},body:JSON.stringify({title:ep.title,number:ep.number||i+1,season:ep.season||1,audio_url:au,duration_sec:dur,access_type:'free'})}).catch(()=>{})
      }
      sS(true)
    }catch(e){sE(e.message)}
    sL(false)
  }
  return(<div className="upload-form-panel">
    <div className="upload-form-header"><div style={{fontSize:32}}>🎙️</div><div><div style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:18}}>Créer un Podcast</div><div style={{fontSize:12,color:'var(--text2)'}}>Série avec épisodes</div></div></div>
    <Steps/>
    {step===1&&<div>
      <div className="form-group"><label className="label">🖼️ Visuel *</label><div className="cover-upload-row"><div className="cover-preview" onClick={()=>document.getElementById('cP').click()}><input type="file" id="cP" accept="image/*" style={{display:'none'}} onChange={e=>{const x=e.target.files[0];if(x){setCf(x);setCp(URL.createObjectURL(x))}}}/>{cp?<img src={cp} alt=""/>:<><span>+</span><div style={{fontSize:10,marginTop:4}}>Ajouter</div></>}</div><div style={{fontSize:12,color:'var(--text2)'}}>Carré · 1400×1400px</div></div></div>
      <div className="form-group"><label className="label">Nom *</label><input className="input-field" value={name} onChange={e=>setName(e.target.value)} placeholder="Ex: Business Afrika..."/></div>
      <div className="form-row"><div className="form-group"><label className="label">Catégorie</label><select className="select-styled" style={{width:'100%'}} value={cat} onChange={e=>setCat(e.target.value)}>{PODCAST_CATS.map(c=><option key={c}>{c}</option>)}</select></div><div className="form-group"><label className="label">Langue</label><select className="select-styled" style={{width:'100%'}} value={lang} onChange={e=>setLang(e.target.value)}>{LANGS.map(([c,l])=><option key={c} value={c}>{l}</option>)}</select></div></div>
      <div className="form-row" style={{gridTemplateColumns:'1fr 1fr'}}><div className="form-group"><label className="label">Pays</label><select className="select-styled" style={{width:'100%'}} value={country} onChange={e=>setCountry(e.target.value)}>{COUNTRIES.slice(0,6).map(([c,l])=><option key={c} value={c}>{l}</option>)}</select></div><div className="form-group"><label className="label">Fréquence</label><select className="select-styled" style={{width:'100%'}} value={freq} onChange={e=>setFreq(e.target.value)}><option>Hebdomadaire</option><option>Bi-hebdo</option><option>Mensuel</option><option>Irrégulier</option></select></div></div>
      <div className="form-group"><label className="label">Description *</label><textarea className="textarea-field" rows="4" value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Décrivez votre podcast..."/></div>
      <div style={{display:'flex',justifyContent:'flex-end',marginTop:18}}><button className="btn btn-primary" onClick={()=>setStep(2)}>Suivant →</button></div>
    </div>}
    {step===2&&<div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}><div style={{fontWeight:700,fontSize:15}}>Épisodes</div><button className="btn btn-outline btn-sm" onClick={()=>setEps(p=>[...p,{title:'',file:null,number:p.length+1,season:1}])}>+ Épisode</button></div>
      {eps.map((ep,i)=><div key={i} className="episode-block"><div className="episode-block-header"><div className="episode-num-badge">Ép. {i+1}</div><input className="input-field" value={ep.title} onChange={e=>setEps(p=>p.map((x,j)=>j===i?{...x,title:e.target.value}:x))} placeholder="Titre *" style={{flex:1}}/>{eps.length>1&&<button className="episode-remove-btn" onClick={()=>setEps(p=>p.filter((_,j)=>j!==i))}>✕</button>}</div><div className="episode-block-body"><label className="upload-mini-btn" style={{cursor:'pointer',display:'flex',alignItems:'center',gap:8,marginBottom:12}}>🎙️ {ep.file?ep.file.name.slice(0,25)+'…':'Fichier audio'}<input type="file" accept="audio/*" style={{display:'none'}} onChange={e=>{const x=e.target.files[0];if(x)setEps(p=>p.map((t,j)=>j===i?{...t,file:x}:t))}}/></label><div className="form-row" style={{gridTemplateColumns:'1fr 1fr'}}><div className="form-group"><label className="label" style={{fontSize:11}}>N°</label><input className="input-field" type="number" value={ep.number} onChange={e=>setEps(p=>p.map((x,j)=>j===i?{...x,number:+e.target.value}:x))}/></div><div className="form-group"><label className="label" style={{fontSize:11}}>Saison</label><input className="input-field" type="number" value={ep.season} onChange={e=>setEps(p=>p.map((x,j)=>j===i?{...x,season:+e.target.value}:x))}/></div></div></div></div>)}
      <div style={{background:'rgba(77,159,255,.06)',border:'1px solid rgba(77,159,255,.2)',borderRadius:'var(--radius-sm)',padding:14,marginTop:12,fontSize:12,color:'var(--text2)',display:'flex',gap:10}}><span style={{fontSize:18}}>💡</span><div>Publiez avec 0 épisode et ajoutez plus tard.</div></div>
      <div style={{display:'flex',justifyContent:'space-between',marginTop:18}}><button className="btn btn-outline" onClick={()=>setStep(1)}>← Retour</button><button className="btn btn-primary" onClick={()=>setStep(3)}>Suivant →</button></div>
    </div>}
    {step===3&&<div>
      <div className="upload-section-box"><div className="upload-section-title">📡 Diffusion</div><div style={{display:'flex',flexDirection:'column',gap:10}}>{[['Waiichia Podcast','Sur la plateforme',true],['Flux RSS','Spotify, Apple...',false]].map(([t,d,c])=><label key={t} style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer',padding:10,background:'var(--bg2)',borderRadius:'var(--radius-sm)'}}><input type="checkbox" defaultChecked={c} style={{accentColor:'var(--gold)'}}/><div><div style={{fontSize:13,fontWeight:600}}>{t}</div><div style={{fontSize:11,color:'var(--text2)'}}>{d}</div></div></label>)}</div></div>
      <MonetBlock ok={ok} mode={pm} setMode={setPm} form={f} set={s} showBoth={true} preview={true} pvSec={pvS} setPvSec={setPvS}/>
      <div className="upload-section-box"><div className="upload-section-title">📡 Revenus complémentaires</div><div style={{display:'flex',flexDirection:'column',gap:8}}>{['💰 Pub (auto)','🎁 Tips'].map((t,i)=><label key={t} style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer'}}><input type="checkbox" defaultChecked={i===0} style={{accentColor:'var(--gold)'}}/><div style={{fontSize:13}}>{t}</div></label>)}</div></div>
      <div style={{display:'flex',justifyContent:'space-between',gap:10,marginTop:8}}><button className="btn btn-outline" onClick={()=>setStep(2)}>← Retour</button><button className="btn btn-secondary">💾 Brouillon</button><button className="btn btn-primary" style={{flex:1,padding:13,fontSize:15}} onClick={submit}>🚀 Publier</button></div>
    </div>}
  </div>)
}

function FEmission({ok,uf,sL,sE,sM,sP,sS,tk}){
  const[step,setStep]=useState(1),[cp,setCp]=useState(''),[cf,setCf]=useState(null)
  const[name,setName]=useState(''),[desc,setDesc]=useState(''),[channel,setChannel]=useState(''),[host,setHost]=useState('')
  const[cat,setCat]=useState(EMISSION_CATS[0]),[fmt,setFmt]=useState('audio'),[lang,setLang]=useState('fr'),[country,setCountry]=useState('KM'),[durAvg,setDurAvg]=useState('~30 min'),[freq,setFreq]=useState('Hebdomadaire')
  const[eps,setEps]=useState([{title:'',file:null,number:1,season:1,guest:'',air_date:''}])
  const[pm,setPm]=useState('free'),[pvS,setPvS]=useState(20),[f,sF]=useState({sp:'',sc:'KMF',rd:'',rw:'',rm:''})
  const s=(k,v)=>sF(p=>({...p,[k]:v}))
  const Steps=()=><div className="upload-steps-bar">{[{n:1,l:'Émission'},{n:2,l:'Épisodes'},{n:3,l:'Diffusion'}].map((x,i)=><div key={x.n} style={{display:'contents'}}>{i>0&&<div className="upload-step-sep"/>}<div className={`upload-step${step===x.n?' active':''}${step>x.n?' done':''}`} onClick={()=>setStep(x.n)}><span className="step-num">{step>x.n?'✓':x.n}</span><span>{x.l}</span></div></div>)}</div>
  const submit=async()=>{
    if(!name.trim())return sE("Nom de l'émission requis")
    sL(true);sE('');sM('Upload visuel...');sP(0)
    try{
      let cu=''
      if(cf){cu=await uf(cf,'/api/upload/cover')}
      sM("Création de l'émission...")
      const r=await fetch(API+'/api/emissions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+tk},body:JSON.stringify({title:name,description:desc,channel,host,category:cat,format:fmt,language:lang,country,cover_url:cu||null,duration_avg:durAvg})})
      const d=await r.json()
      if(!r.ok)throw new Error(d.error||"Erreur création émission")
      const emId=d.emission?.id||d.id
      const epsWithFile=eps.filter(e=>e.title&&e.file)
      for(let i=0;i<epsWithFile.length;i++){
        const ep=epsWithFile[i];sM(`Upload épisode ${i+1}/${epsWithFile.length}: ${ep.title}`)
        const dur=await getAudioDuration(ep.file);const au=await uf(ep.file,'/api/upload/audio')
        await fetch(API+'/api/emissions/'+emId+'/episodes',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+tk},body:JSON.stringify({title:ep.title,number:ep.number||i+1,season:ep.season||1,audio_url:au,duration_sec:dur,guest:ep.guest||null,air_date:ep.air_date||null,access_type:'free'})}).catch(()=>{})
      }
      sS(true)
    }catch(e){sE(e.message)}
    sL(false)
  }
  return(<div className="upload-form-panel">
    <div className="upload-form-header"><div style={{fontSize:32}}>📺</div><div><div style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:18}}>Créer une Émission</div><div style={{fontSize:12,color:'var(--text2)'}}>Émission régulière ou série thématique</div></div></div>
    <Steps/>
    {step===1&&<div>
      <div className="form-group"><label className="label">🖼️ Visuel *</label><div className="cover-upload-row"><div className="cover-preview" onClick={()=>document.getElementById('cE').click()}><input type="file" id="cE" accept="image/*" style={{display:'none'}} onChange={e=>{const x=e.target.files[0];if(x){setCf(x);setCp(URL.createObjectURL(x))}}}/>{cp?<img src={cp} alt=""/>:<><span>+</span><div style={{fontSize:10,marginTop:4}}>Ajouter</div></>}</div><div style={{fontSize:12,color:'var(--text2)'}}>1400×1400px</div></div></div>
      <div className="form-group"><label className="label">Nom *</label><input className="input-field" value={name} onChange={e=>setName(e.target.value)} placeholder="Ex: Le Talk Africain..."/></div>
      <div className="form-row"><div className="form-group"><label className="label">Chaîne</label><input className="input-field" value={channel} onChange={e=>setChannel(e.target.value)} placeholder="Radio Komori FM"/></div><div className="form-group"><label className="label">Présentateur</label><input className="input-field" value={host} onChange={e=>setHost(e.target.value)} placeholder="Nom"/></div></div>
      <div className="form-row" style={{gridTemplateColumns:'1fr 1fr 1fr'}}><div className="form-group"><label className="label">Catégorie</label><select className="select-styled" style={{width:'100%'}} value={cat} onChange={e=>setCat(e.target.value)}>{EMISSION_CATS.map(c=><option key={c}>{c}</option>)}</select></div><div className="form-group"><label className="label">Format</label><select className="select-styled" style={{width:'100%'}} value={fmt} onChange={e=>setFmt(e.target.value)}><option value="audio">🎙️ Audio</option><option value="live">🔴 Live</option><option value="rss">📻 RSS</option></select></div><div className="form-group"><label className="label">Langue</label><select className="select-styled" style={{width:'100%'}} value={lang} onChange={e=>setLang(e.target.value)}>{LANGS.map(([c,l])=><option key={c} value={c}>{l}</option>)}</select></div></div>
      <div className="form-row" style={{gridTemplateColumns:'1fr 1fr 1fr'}}><div className="form-group"><label className="label">Pays</label><select className="select-styled" style={{width:'100%'}} value={country} onChange={e=>setCountry(e.target.value)}>{COUNTRIES.slice(0,6).map(([c,l])=><option key={c} value={c}>{l}</option>)}</select></div><div className="form-group"><label className="label">Durée</label><select className="select-styled" style={{width:'100%'}} value={durAvg} onChange={e=>setDurAvg(e.target.value)}><option>~30 min</option><option>~45 min</option><option>~60 min</option><option>Variable</option></select></div><div className="form-group"><label className="label">Fréquence</label><select className="select-styled" style={{width:'100%'}} value={freq} onChange={e=>setFreq(e.target.value)}><option>Hebdomadaire</option><option>Mensuel</option><option>Quotidien</option></select></div></div>
      <div className="form-group"><label className="label">Description *</label><textarea className="textarea-field" rows="4" value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Présentez votre émission..."/></div>
      <div style={{display:'flex',justifyContent:'flex-end',marginTop:18}}><button className="btn btn-primary" onClick={()=>setStep(2)}>Suivant →</button></div>
    </div>}
    {step===2&&<div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}><div style={{fontWeight:700,fontSize:15}}>Épisodes</div><button className="btn btn-outline btn-sm" onClick={()=>setEps(p=>[...p,{title:'',file:null,number:p.length+1,season:1,guest:'',air_date:''}])}>+ Épisode</button></div>
      {eps.map((ep,i)=><div key={i} className="episode-block"><div className="episode-block-header"><div className="episode-num-badge" style={{background:'rgba(230,57,70,.15)',color:'var(--red)'}}>Ép. {i+1}</div><input className="input-field" value={ep.title} onChange={e=>setEps(p=>p.map((x,j)=>j===i?{...x,title:e.target.value}:x))} placeholder="Titre *" style={{flex:1}}/>{eps.length>1&&<button className="episode-remove-btn" onClick={()=>setEps(p=>p.filter((_,j)=>j!==i))}>✕</button>}</div><div className="episode-block-body"><label className="upload-mini-btn" style={{cursor:'pointer',display:'flex',alignItems:'center',gap:8,marginBottom:12}}>🎙️ {ep.file?ep.file.name.slice(0,25)+'…':'Fichier audio'}<input type="file" accept="audio/*" style={{display:'none'}} onChange={e=>{const x=e.target.files[0];if(x)setEps(p=>p.map((t,j)=>j===i?{...t,file:x}:t))}}/></label><div className="form-row" style={{gridTemplateColumns:'1fr 1fr 1fr 1fr'}}><div className="form-group"><label className="label" style={{fontSize:11}}>Saison</label><input className="input-field" type="number" value={ep.season} onChange={e=>setEps(p=>p.map((x,j)=>j===i?{...x,season:+e.target.value}:x))}/></div><div className="form-group"><label className="label" style={{fontSize:11}}>N°</label><input className="input-field" type="number" value={ep.number} onChange={e=>setEps(p=>p.map((x,j)=>j===i?{...x,number:+e.target.value}:x))}/></div><div className="form-group"><label className="label" style={{fontSize:11}}>Date</label><input className="input-field" type="date" value={ep.air_date} onChange={e=>setEps(p=>p.map((x,j)=>j===i?{...x,air_date:e.target.value}:x))}/></div><div className="form-group"><label className="label" style={{fontSize:11}}>Invités</label><input className="input-field" value={ep.guest} onChange={e=>setEps(p=>p.map((x,j)=>j===i?{...x,guest:e.target.value}:x))} placeholder="Noms..."/></div></div></div></div>)}
      <div style={{display:'flex',justifyContent:'space-between',marginTop:18}}><button className="btn btn-outline" onClick={()=>setStep(1)}>← Retour</button><button className="btn btn-primary" onClick={()=>setStep(3)}>Suivant →</button></div>
    </div>}
    {step===3&&<div>
      <div className="upload-section-box"><div className="upload-section-title">📡 Diffusion</div><div style={{display:'flex',flexDirection:'column',gap:10}}>{[['📺 Waiichia Émissions','Section Émissions',true],['🔴 Radio Live','Station partenaire',false],['📻 RSS','Externe',false]].map(([t,d,c])=><label key={t} style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer',padding:10,background:'var(--bg2)',borderRadius:'var(--radius-sm)'}}><input type="checkbox" defaultChecked={c} style={{accentColor:'var(--gold)'}}/><div><div style={{fontSize:13,fontWeight:600}}>{t}</div><div style={{fontSize:11,color:'var(--text2)'}}>{d}</div></div></label>)}</div></div>
      <MonetBlock ok={ok} mode={pm} setMode={setPm} form={f} set={s} showBoth={true} preview={true} pvSec={pvS} setPvSec={setPvS}/>
      <div style={{display:'flex',justifyContent:'space-between',gap:10,marginTop:8}}><button className="btn btn-outline" onClick={()=>setStep(2)}>← Retour</button><button className="btn btn-secondary">💾 Brouillon</button><button className="btn btn-primary" style={{flex:1,padding:13,fontSize:15}} onClick={submit}>🚀 Publier</button></div>
    </div>}
  </div>)
}

function FMedia({ok}){
  const{setPage}=usePageStore()
  const[cp,setCp]=useState(''),[logoFile,setLogoFile]=useState(null),[am,setAm]=useState('free'),[pvS,setPvS]=useState(30),[f,sF]=useState({fd:'',fw:'',fm:'',fy:''})
  const[name,setName]=useState(''),[desc,setDesc]=useState(''),[streamUrl,setStreamUrl]=useState('')
  const[genre,setGenre]=useState('Varié'),[country,setCountry]=useState('KM')
  const[busy,setBusy]=useState(false),[err,setErr]=useState(''),[done,setDone]=useState(false)
  const s=(k,v)=>sF(p=>({...p,[k]:v}))
  const submitMedia=async()=>{
    setErr('')
    if(!name.trim())return setErr('Nom de la station requis')
    if(!streamUrl.trim())return setErr('URL du flux requise')
    if(!logoFile)return setErr('Logo requis')
    setBusy(true)
    try{
      const fd=new FormData();fd.append('file',logoFile)
      const token=localStorage.getItem('waiichia_token')
      const ur=await fetch(API+'/api/upload/cover',{method:'POST',headers:{'Authorization':'Bearer '+token},body:fd})
      const up=await ur.json()
      if(!up||!up.url)throw new Error((up&&up.error)||'Upload logo echoue')
      const rr=await fetch(API+'/api/radio',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({name,description:desc,stream_url:streamUrl,logo_url:up.url,country,genre,category:'radio'})})
      const rd=await rr.json()
      if(!rr.ok)throw new Error(rd.error||'Soumission echouee')
      setDone(true)
    }catch(e){setErr(e.message)}
    setBusy(false)
  }
  if(done)return(<div className="upload-form-panel" style={{textAlign:'center',padding:60}}><div style={{fontSize:64,marginBottom:16}}>✅</div><div style={{fontFamily:'Syne,sans-serif',fontSize:22,fontWeight:800}}>Station soumise !</div><div style={{fontSize:14,color:'var(--text2)',marginTop:10,maxWidth:380,marginLeft:'auto',marginRight:'auto',lineHeight:1.6}}>Votre flux média a bien été envoyé. Il est <strong>en attente de validation</strong> par l'équipe Waiichia avant diffusion.</div><button className="btn btn-primary" style={{marginTop:24}} onClick={()=>setPage('home')}>Retour à l'accueil</button></div>)
  return(<div className="upload-form-panel">
    <div className="upload-form-header"><div style={{fontSize:32}}>📻</div><div><div style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:18}}>Soumettre un Flux Média</div><div style={{fontSize:12,color:'var(--text2)'}}>Radio FM, Web Radio, TV audio</div></div></div>
    <div style={{background:'rgba(245,166,35,.06)',border:'1px solid rgba(245,166,35,.25)',borderRadius:'var(--radius-sm)',padding:14,marginBottom:18,fontSize:12,color:'var(--text2)',display:'flex',gap:10}}><span style={{fontSize:18}}>🛡️</span><div>Flux média <strong>soumis à validation</strong> par Waiichia.</div></div>
    <div className="form-group"><label className="label">🖼️ Logo *</label><div className="cover-upload-row"><div className="cover-preview" onClick={()=>document.getElementById('cM').click()}><input type="file" id="cM" accept="image/*" style={{display:'none'}} onChange={e=>{const x=e.target.files[0];if(x){setLogoFile(x);setCp(URL.createObjectURL(x))}}}/>{cp?<img src={cp} alt=""/>:<><span>+</span><div style={{fontSize:10,marginTop:4}}>Logo</div></>}</div><div style={{fontSize:12,color:'var(--text2)'}}>Carré · 800×800 min</div></div></div>
    <div className="form-group"><label className="label">Nom station *</label><input className="input-field" value={name} onChange={e=>setName(e.target.value)} placeholder="Radio Komori FM..."/></div>
    <div className="form-row" style={{gridTemplateColumns:'1fr 1fr 1fr'}}><div className="form-group"><label className="label">Type</label><select className="select-styled" style={{width:'100%'}}><option>📻 Radio FM</option><option>🌐 Web Radio</option><option>📺 TV Audio</option></select></div><div className="form-group"><label className="label">Genre</label><select className="select-styled" style={{width:'100%'}}><option>Varié</option><option>Twarab</option><option>Afrobeats</option><option>Info</option><option>Religieux</option></select></div><div className="form-group"><label className="label">Pays</label><select className="select-styled" style={{width:'100%'}}>{COUNTRIES.slice(0,8).map(([c,l])=><option key={c}>{l}</option>)}</select></div></div>
    <div className="form-group"><label className="label">Description</label><textarea className="textarea-field" rows="3" value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Présentez votre station..."/></div>
    <div className="upload-section-box"><div className="upload-section-title">📡 Flux audio</div>
      <div className="form-group"><label className="label">URL stream *</label><input className="input-field" value={streamUrl} onChange={e=>setStreamUrl(e.target.value)} placeholder="https://stream.radio.com/live"/><div style={{fontSize:12,color:'var(--text2)',marginTop:4}}>💡 Préférez une URL en https:// quand c'est possible.</div></div>
      <div className="form-row" style={{gridTemplateColumns:'1fr 1fr 1fr'}}><div className="form-group"><label className="label">Bitrate</label><select className="select-styled" style={{width:'100%'}}><option>128 kbps</option><option>192 kbps</option><option>256 kbps</option></select></div><div className="form-group"><label className="label">Codec</label><select className="select-styled" style={{width:'100%'}}><option>MP3</option><option>AAC</option><option>Opus</option></select></div><div className="form-group"><label className="label">Diffusion</label><select className="select-styled" style={{width:'100%'}}><option>🔴 24h/24</option><option>📅 Horaires</option></select></div></div>
    </div>
    <MonetFlux ok={ok} mode={am} setMode={setAm} form={f} set={s} pvSec={pvS} setPvSec={setPvS}/>
    <div className="upload-section-box" style={{borderColor:'rgba(230,57,70,.2)',background:'rgba(230,57,70,.03)'}}><div className="upload-section-title" style={{color:'var(--red)'}}>📋 Documents requis</div><div style={{display:'flex',flexDirection:'column',gap:12}}>{[['📄','Autorisation émission *'],['🏢','Registre commerce *'],['🪪','Pièce identité *'],['📑','Droits musicaux']].map(([ic,t])=><div key={t} className="doc-upload-row"><div className="doc-upload-label"><span style={{fontSize:16}}>{ic}</span><div style={{fontWeight:600,fontSize:13}}>{t}</div></div><label className="upload-mini-btn" style={{cursor:'pointer'}}>📎 PDF<input type="file" accept=".pdf,.jpg,.png" style={{display:'none'}}/></label></div>)}</div></div>
    <div className="upload-section-box"><div className="upload-section-title">✅ Conditions</div><div style={{display:'flex',flexDirection:'column',gap:10}}>{['Je certifie que les informations sont exactes.','Je respecte les CGU de Waiichia.',"J'accepte la modération."].map(t=><label key={t} style={{display:'flex',alignItems:'flex-start',gap:10,cursor:'pointer'}}><input type="checkbox" style={{accentColor:'var(--gold)',marginTop:3}}/><div style={{fontSize:12,color:'var(--text2)',lineHeight:1.6}}>{t}</div></label>)}</div></div>
    {err&&<div style={{background:'rgba(230,57,70,.1)',border:'1px solid rgba(230,57,70,.3)',color:'var(--red)',borderRadius:'var(--radius-sm)',padding:12,marginBottom:12,fontSize:13}}>⚠️ {err}</div>}
    <div className="upload-form-actions"><button className="btn btn-secondary" disabled={busy}>💾 Brouillon</button><button className="btn btn-primary" style={{flex:1,padding:13,fontSize:15}} disabled={busy} onClick={submitMedia}>{busy?'⏳ Envoi…':'📤 Soumettre'}</button></div>
  </div>)
}
