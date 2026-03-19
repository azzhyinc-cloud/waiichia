#!/bin/bash
# ═══════════════════════════════════════════════════
# CORRECTIF — Upload (location) + Karaoké (complet)
# ═══════════════════════════════════════════════════

echo "🛑 Arrêt des serveurs..."
pkill -f "node.*index.js" 2>/dev/null
pkill -f "vite" 2>/dev/null
sleep 1

# ═══════════════════════════════════════
# 1. UPLOAD — Corriger la section Location
# ═══════════════════════════════════════
cd /workspaces/waiichia/apps/web/src/pages

python3 << 'PYFIX'
content = open('Upload.jsx').read()

# Remplacer la section rental avec jour/semaine/mois/an
old_rental = """          {form.access_type==='rental'&&(
            <div className="form-row">
              <div className="form-group"><label className="label">Prix / jour</label><input className="input-field" type="number" value={form.rent_price_day} onChange={e=>set('rent_price_day',e.target.value)} placeholder="200"/></div>
              <div className="form-group"><label className="label">Prix / semaine</label><input className="input-field" type="number" value={form.rent_price_week} onChange={e=>set('rent_price_week',e.target.value)} placeholder="800"/></div>
            </div>
          )}"""

new_rental = """          {form.access_type==='rental'&&(<>
            <div className="form-row">
              <div className="form-group"><label className="label">Prix / jour (KMF)</label><input className="input-field" type="number" value={form.rent_price_day} onChange={e=>set('rent_price_day',e.target.value)} placeholder="200"/></div>
              <div className="form-group"><label className="label">Prix / semaine (KMF)</label><input className="input-field" type="number" value={form.rent_price_week} onChange={e=>set('rent_price_week',e.target.value)} placeholder="800"/></div>
            </div>
            <div className="form-row" style={{marginTop:4}}>
              <div className="form-group"><label className="label">Prix / mois (KMF)</label><input className="input-field" type="number" value={form.rent_price_month} onChange={e=>set('rent_price_month',e.target.value)} placeholder="2 500"/></div>
              <div className="form-group"><label className="label">Prix / an (KMF)</label><input className="input-field" type="number" value={form.rent_price_year} onChange={e=>set('rent_price_year',e.target.value)} placeholder="15 000"/></div>
            </div>
          </>)}"""

content = content.replace(old_rental, new_rental)

# Ajouter rent_price_month et rent_price_year dans le state initial si manquant
if "rent_price_year" not in content.split("useState")[1] if "useState" in content else "":
    content = content.replace(
        "rent_price_week:'',",
        "rent_price_week:'', rent_price_month:'', rent_price_year:'',"
    )

open('Upload.jsx', 'w').write(content)
print("OK upload fixed")
PYFIX
echo "✅ Upload.jsx — Location jour/semaine/mois/an corrigée"

# ═══════════════════════════════════════
# 2. KARAOKÉ — Réécriture complète
# ═══════════════════════════════════════
cat > /workspaces/waiichia/apps/web/src/pages/Karaoke.jsx << 'KAREOF'
import { useState, useEffect, useRef } from "react"
import { useAuthStore } from "../stores/index.js"
import api from "../services/api.js"

const TABS=["🎵 Tous","🌊 Twarab","🥁 Afrobeats","🎶 Amapiano","🎤 Duets récents","🏆 Challenges"]
const MOCK_TRACKS=[
  {id:"k1",title:"Mwana wa Afrika",artist:"Karimou Style",genre:"Twarab",bpm:92,diff:"Facile",emoji:"🌊",bg:"linear-gradient(135deg,#0d2a3a,#1a5060)",duets:24,plays:4200},
  {id:"k2",title:"Moroni Nights",artist:"DJ Comoros",genre:"Afrobeats",bpm:118,diff:"Moyen",emoji:"🌃",bg:"linear-gradient(135deg,#1a0a2e,#3a1a6a)",duets:67,plays:8100},
  {id:"k3",title:"Amani Islands",artist:"Waiichia Beats",genre:"Amapiano",bpm:112,diff:"Facile",emoji:"🏝️",bg:"linear-gradient(135deg,#002a10,#007040)",duets:18,plays:3600},
  {id:"k4",title:"Pumzika Beat",artist:"Studio KM",genre:"Twarab",bpm:86,diff:"Difficile",emoji:"🥁",bg:"linear-gradient(135deg,#2e1a00,#7a4000)",duets:31,plays:2900},
  {id:"k5",title:"Vibrate Africa",artist:"Nadjib Pro",genre:"Afrobeats",bpm:124,diff:"Moyen",emoji:"🔥",bg:"linear-gradient(135deg,#1a0020,#5a0060)",duets:89,plays:11200},
  {id:"k6",title:"Zanzibar Flow",artist:"East Mix",genre:"Amapiano",bpm:108,diff:"Facile",emoji:"🌙",bg:"linear-gradient(135deg,#001a2e,#005080)",duets:42,plays:5400},
]
const MOCK_DUETS=[
  {id:"d1",track:"Mwana wa Afrika",users:["KS","FA"],bg:["linear-gradient(135deg,#f5a623,#e63946)","linear-gradient(135deg,#9b59f5,#4d9fff)"],time:"Il y a 2h",likes:342,plays:"1.2K"},
  {id:"d2",track:"Vibrate Africa",users:["NP","WA"],bg:["linear-gradient(135deg,#2dc653,#007040)","linear-gradient(135deg,#ff6b35,#e63946)"],time:"Il y a 5h",likes:891,plays:"3.2K"},
  {id:"d3",track:"Moroni Nights",users:["DC","MF"],bg:["linear-gradient(135deg,#4d9fff,#1a6fcc)","linear-gradient(135deg,#f5a623,#cc7700)"],time:"Hier",likes:214,plays:"890"},
  {id:"d4",track:"Amani Islands",users:["WB","IS"],bg:["linear-gradient(135deg,#9b59f5,#6d3db5)","linear-gradient(135deg,#2dc653,#00bfa5)"],time:"Il y a 3j",likes:567,plays:"2.1K"},
]
const fmtK=n=>n>=1000?(n/1000).toFixed(1)+"K":String(n||0)

export default function Karaoke(){
  const [tab,setTab]=useState("🎵 Tous")
  const [tracks,setTracks]=useState([])
  const [duets,setDuets]=useState([])
  const [loading,setLoading]=useState(true)
  const [studio,setStudio]=useState(null)

  useEffect(()=>{
    Promise.all([
      api.karaoke.tracks().catch(()=>({tracks:[]})),
      api.karaoke.duets().catch(()=>({duets:[]})),
    ]).then(([t,d])=>{
      setTracks(t.tracks?.length?t.tracks:MOCK_TRACKS)
      setDuets(d.duets?.length?d.duets:MOCK_DUETS)
    }).finally(()=>setLoading(false))
  },[])

  const filtered=tab==="🎵 Tous"?tracks
    :tab.includes("Duets")?tracks
    :tab.includes("Challenges")?tracks
    :tracks.filter(t=>t.genre?.toLowerCase().includes(tab.replace(/[^a-z]/gi,"").toLowerCase().slice(0,5)))

  return(
    <div style={{paddingBottom:40}}>
      {/* HERO */}
      <div className="karaoke-hero">
        <div className="karaoke-badge">🎤 NOUVEAU · Fonctionnalité exclusive Waiichia</div>
        <div className="karaoke-title">Chante. Duplique.<br/><span>Deviens Viral.</span></div>
        <div style={{color:"var(--text2)",fontSize:14,lineHeight:1.7,maxWidth:500,marginBottom:20,position:"relative",zIndex:1}}>
          Enregistre ta voix sur les meilleurs instrumentaux africains. Crée des duos avec tes artistes favoris et partage ta version.
        </div>
        <div style={{display:"flex",gap:10,position:"relative",zIndex:1,flexWrap:"wrap"}}>
          <button className="btn btn-primary" style={{background:"linear-gradient(135deg,#9b59f5,#7d3cb5)",boxShadow:"0 3px 12px rgba(155,89,245,.4)"}}
            onClick={()=>filtered[0]&&setStudio(filtered[0])}>🎤 Commencer à chanter</button>
          <button className="btn btn-secondary" style={{borderColor:"rgba(155,89,245,.4)"}}>🎵 Parcourir les duets</button>
        </div>
      </div>

      {/* STATS */}
      <div className="stats-row" style={{marginBottom:22}}>
        <div className="stat-card sc-purple"><div className="stat-icon">🎤</div><div className="stat-num">12K</div><div className="stat-label">Karaoké créés</div></div>
        <div className="stat-card sc-gold"><div className="stat-icon">🎵</div><div className="stat-num">340</div><div className="stat-label">Instrumentaux</div></div>
        <div className="stat-card sc-red"><div className="stat-icon">🔥</div><div className="stat-num">4.2K</div><div className="stat-label">Duets actifs</div></div>
        <div className="stat-card sc-green"><div className="stat-icon">🏆</div><div className="stat-num">89</div><div className="stat-label">Challenges en cours</div></div>
      </div>

      {/* FILTER TABS */}
      <div className="filter-bar" style={{marginBottom:20}}>
        {TABS.map(t=>(
          <div key={t} className={`pill-tab${tab===t?" active":""}`}
            style={tab===t?{background:"#9b59f5",borderColor:"#9b59f5"}:{}}
            onClick={()=>setTab(t)}>{t}</div>
        ))}
      </div>

      {/* INSTRUMENTAUX GRID */}
      <div className="section-hdr"><div className="section-title">🎵 Instrumentaux populaires</div></div>
      {loading?<Skeleton/>:(
        <div className="karaoke-grid">
          {filtered.map(t=>(
            <div key={t.id} className="karaoke-card" onClick={()=>setStudio(t)}>
              <div className="karaoke-cover" style={{background:t.bg}}>
                {t.emoji||"🎵"}
                <div className="karaoke-cover-badge">🎵 {t.diff||"Moyen"}</div>
              </div>
              <div className="karaoke-info">
                <div className="karaoke-name">{t.title}</div>
                <div className="karaoke-meta">
                  <span>🎤 {t.artist}</span>
                  <span>🔥 {t.genre}</span>
                  <span>⚡ {t.bpm} BPM</span>
                </div>
                <div className="karaoke-actions">
                  <button className="karaoke-duet-btn" onClick={e=>{e.stopPropagation();setStudio(t)}}>🎤 Chanter</button>
                  <button className="karaoke-duet-btn" onClick={e=>e.stopPropagation()}>👥 {t.duets||0} Duets</button>
                </div>
              </div>
            </div>
          ))}
          {!filtered.length&&<div style={{color:"var(--text3)",fontSize:13,padding:"40px 0",gridColumn:"1/-1",textAlign:"center"}}>Aucun instrumental dans ce genre</div>}
        </div>
      )}

      {/* TOP DUETS */}
      <div className="section-hdr" style={{marginTop:8}}>
        <div className="section-title">🔥 Top Duets cette semaine</div>
        <span className="see-all">Voir tout →</span>
      </div>
      <div className="duet-list">
        {duets.map((d,i)=>(
          <div key={d.id} className="duet-item">
            <div className="duet-ava-stack">
              {d.users.map((u,j)=>(
                <div key={j} className="duet-ava" style={{background:d.bg[j]}}>{u}</div>
              ))}
            </div>
            <div className="duet-info">
              <div className="duet-title">🎤 Duet sur "{d.track}"</div>
              <div className="duet-meta"><span>👤 {d.users.join(" × ")}</span><span>{d.time}</span></div>
            </div>
            <div className="duet-plays">❤️ {d.likes} · 🎧 {d.plays}</div>
            <button className="btn btn-xs btn-primary">▶</button>
          </div>
        ))}
      </div>

      {/* STUDIO MODAL */}
      {studio&&<StudioModal track={studio} onClose={()=>setStudio(null)}/>}
    </div>
  )
}

/* ══ STUDIO MODAL ══ */
function StudioModal({track,onClose}){
  const [recording,setRecording]=useState(false)
  const [time,setTime]=useState(0)
  const [hasRecording,setHasRecording]=useState(false)
  const [effect,setEffect]=useState("none")
  const [playing,setPlaying]=useState(false)
  const timerRef=useRef(null)
  const EFFECTS=["Normal","🎚️ Reverb","🔄 Écho","🎵 Pitch +","🎵 Pitch -","✨ Auto-Tune"]

  const toggleRec=()=>{
    if(recording){
      clearInterval(timerRef.current)
      setRecording(false)
      setHasRecording(true)
    } else {
      setTime(0)
      setRecording(true)
      timerRef.current=setInterval(()=>setTime(t=>t+1),1000)
    }
  }

  const reset=()=>{
    clearInterval(timerRef.current)
    setRecording(false)
    setHasRecording(false)
    setTime(0)
  }

  const fmtTime=s=>`${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`

  return(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal studio-modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title">🎤 Studio Karaoké</div>
          <button className="modal-close" onClick={()=>{reset();onClose()}}>✕</button>
        </div>

        {/* Track info */}
        <div style={{display:"flex",alignItems:"center",gap:12,background:"var(--card)",borderRadius:"var(--radius-sm)",padding:12,marginBottom:16}}>
          <div style={{width:52,height:52,borderRadius:10,background:track.bg||"linear-gradient(135deg,var(--purple),var(--blue))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{track.emoji||"🎵"}</div>
          <div style={{flex:1}}>
            <div style={{fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:15,marginBottom:2}}>{track.title}</div>
            <div style={{fontSize:12,color:"var(--text2)"}}>{track.artist} · Instrumental</div>
          </div>
          <div style={{fontFamily:"Space Mono,monospace",fontSize:12,color:"var(--text2)"}}>🎵 Prêt</div>
        </div>

        {/* Lyrics */}
        <div className="studio-lyrics-display">
          {recording?"🎵 Enregistrement en cours... Chantez !":hasRecording?"✅ Enregistrement terminé !":"🎵 Prêt à enregistrer — appuyez sur ● REC pour commencer"}
        </div>

        {/* Waveform */}
        <div className="studio-waveform">
          {Array.from({length:40},(_,i)=>(
            <div key={i} className={`studio-bar${hasRecording?" recorded":""}`}
              style={{height:(15+Math.random()*70)+"%",opacity:recording?1:0.4,
                animation:recording?`waveBar ${0.4+Math.random()*0.4}s ease-in-out infinite ${i*0.05}s`:"none"}}/>
          ))}
        </div>

        {/* Timer */}
        <div className={`studio-timer${recording?" recording":""}`}>{fmtTime(time)}</div>

        {/* Controls */}
        <div className="studio-controls">
          <button className="studio-btn studio-btn-play" onClick={()=>setPlaying(!playing)} title="Écouter l'instru">{playing?"⏸":"▶"}</button>
          <button className={`studio-btn studio-btn-rec${recording?" recording":""}`} onClick={toggleRec} title={recording?"Arrêter":"Enregistrer"}>●</button>
          <button className="studio-btn studio-btn-play" onClick={reset} title="Recommencer">↺</button>
        </div>

        {/* Mix */}
        <div className="studio-tracks-mix">
          <div className="mix-track">
            <div className="mix-track-icon">🎵</div>
            <div className="mix-track-info">
              <div className="mix-track-name">Instrumental</div>
              <input type="range" className="mix-vol" min="0" max="100" defaultValue="80"/>
            </div>
          </div>
          <div className="mix-track">
            <div className="mix-track-icon">🎤</div>
            <div className="mix-track-info">
              <div className="mix-track-name">Ma voix</div>
              <input type="range" className="mix-vol" min="0" max="100" defaultValue="100"/>
            </div>
          </div>
        </div>

        {/* Effects */}
        <div style={{marginBottom:16}}>
          <div style={{fontSize:11,color:"var(--text2)",fontFamily:"Space Mono,monospace",textTransform:"uppercase",letterSpacing:".8px",marginBottom:8}}>Effets voix</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {EFFECTS.map(e=>(
              <div key={e} className={`genre-chip${effect===e?" active":""}`}
                style={effect===e?{background:"#9b59f5",borderColor:"#9b59f5",color:"#fff"}:{}}
                onClick={()=>setEffect(e)}>{e}</div>
            ))}
          </div>
        </div>

        {/* Publish (after recording) */}
        {hasRecording&&(
          <div style={{borderTop:"1px solid var(--border)",paddingTop:14}}>
            <div style={{fontSize:13,fontWeight:600,marginBottom:10}}>🎬 Ton enregistrement</div>
            <div style={{display:"flex",gap:8,marginBottom:12}}>
              <button className="btn btn-secondary" style={{flex:1}}>▶ Écouter</button>
              <button className="btn btn-secondary" style={{flex:1}}>⬇️ Télécharger</button>
            </div>
            <div style={{fontSize:13,fontWeight:600,marginBottom:10}}>🚀 Publier votre version</div>
            <input className="input-field" placeholder="Titre de votre karaoké..." style={{marginBottom:8}}/>
            <div style={{display:"flex",gap:8}}>
              <button className="btn btn-primary" style={{flex:1,background:"linear-gradient(135deg,#9b59f5,#7d3cb5)"}}>🚀 Publier</button>
              <button className="btn btn-secondary">🎤 Proposer en Duet</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Skeleton(){return(<div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:14}}>{[...Array(6)].map((_,i)=><div key={i} style={{height:200,background:"var(--card)",borderRadius:"var(--radius)",border:"1px solid var(--border)",animation:"shimmer 1.5s infinite"}}/>)}</div>)}
KAREOF
echo "✅ Karaoke.jsx réécrit (cards avec badge/meta/actions, duets avec avatars, studio complet)"

# ═══════════════════════════════════════
# 3. CSS KARAOKÉ — Remplacer complètement
# ═══════════════════════════════════════
python3 << 'PYCSS'
css = open('/workspaces/waiichia/apps/web/src/prototype-v7.css').read()

# Supprimer l'ancien bloc karaoke s'il existe pour éviter les doublons
import re
css = re.sub(r'/\* ═══ KARAOKÉ STYLES ═══ \*/.*?(?=/\*|$)', '', css, flags=re.DOTALL)

# Ajouter le CSS complet du prototype
new_css = """
/* ═══ KARAOKÉ v7.2 — STYLES COMPLETS ═══ */
.karaoke-hero {
  background:linear-gradient(135deg,#0d0020 0%,#1a0040 40%,#0a1a00 100%);
  border:1px solid rgba(155,89,245,.25);border-radius:22px;
  padding:36px;margin-bottom:28px;position:relative;overflow:hidden;
}
.karaoke-hero::before {
  content:'';position:absolute;inset:0;
  background:radial-gradient(ellipse at 80% 50%,rgba(155,89,245,.18) 0%,transparent 55%),
    radial-gradient(ellipse at 20% 80%,rgba(245,166,35,.10) 0%,transparent 45%);
  pointer-events:none;
}
.karaoke-badge {
  display:inline-flex;align-items:center;gap:7px;
  background:rgba(155,89,245,.12);border:1px solid rgba(155,89,245,.35);
  border-radius:50px;padding:6px 14px;font-size:10px;
  font-family:'Space Mono',monospace;color:var(--purple);
  letter-spacing:1.5px;margin-bottom:16px;position:relative;z-index:1;
}
.karaoke-title {
  font-family:'Syne',sans-serif;font-size:38px;font-weight:800;
  line-height:1.1;margin-bottom:12px;position:relative;z-index:1;
}
.karaoke-title span {
  background:linear-gradient(135deg,var(--purple),var(--blue),var(--gold));
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
}
.karaoke-grid { display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin-bottom:28px; }
.karaoke-card {
  background:var(--card);border:1px solid var(--border);border-radius:var(--radius);
  overflow:hidden;cursor:pointer;transition:all 0.25s;
}
.karaoke-card:hover { transform:translateY(-4px);border-color:rgba(155,89,245,.4);box-shadow:0 12px 32px rgba(155,89,245,.15); }
.karaoke-cover {
  width:100%;aspect-ratio:16/7;display:flex;align-items:center;justify-content:center;
  font-size:40px;position:relative;overflow:hidden;
}
.karaoke-cover-badge {
  position:absolute;top:8px;right:8px;background:rgba(155,89,245,.9);color:#fff;
  font-size:9px;font-family:'Space Mono',monospace;font-weight:700;
  padding:3px 9px;border-radius:20px;letter-spacing:1px;
}
.karaoke-info { padding:12px 14px; }
.karaoke-name { font-family:'Syne',sans-serif;font-weight:700;font-size:14px;margin-bottom:3px; }
.karaoke-meta { font-size:11px;color:var(--text2);display:flex;gap:10px;margin-bottom:10px; }
.karaoke-actions { display:flex;gap:8px; }
.karaoke-duet-btn {
  flex:1;padding:8px;border-radius:50px;border:1px solid rgba(155,89,245,.4);
  background:rgba(155,89,245,.08);color:var(--purple);font-size:12px;font-weight:600;
  cursor:pointer;transition:all 0.2s;font-family:'Plus Jakarta Sans',sans-serif;
}
.karaoke-duet-btn:hover { background:var(--purple);color:#fff; }
.studio-modal { max-width:640px; }
.studio-waveform {
  height:80px;background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius-sm);
  display:flex;align-items:center;padding:0 12px;gap:1.5px;overflow:hidden;margin-bottom:16px;
}
.studio-bar {
  flex:1;min-width:3px;max-width:5px;background:var(--purple);border-radius:2px;
  transition:height 0.08s ease;
}
.studio-bar.recorded { background:var(--gold); }
.studio-controls { display:flex;align-items:center;justify-content:center;gap:16px;margin-bottom:20px; }
.studio-btn {
  width:52px;height:52px;border-radius:50%;border:none;cursor:pointer;
  display:flex;align-items:center;justify-content:center;font-size:20px;transition:all 0.2s;
}
.studio-btn-rec { background:var(--red);color:#fff;box-shadow:0 4px 16px rgba(230,57,70,.4); }
.studio-btn-rec:hover { transform:scale(1.08); }
.studio-btn-rec.recording { animation:pulse-glow 1.2s infinite; }
.studio-btn-play { background:var(--card2);border:1px solid var(--border);color:var(--text); }
.studio-btn-play:hover { border-color:var(--gold);color:var(--gold); }
.studio-timer {
  font-family:'Space Mono',monospace;font-size:28px;font-weight:700;text-align:center;
  color:var(--text);margin-bottom:16px;letter-spacing:3px;
}
.studio-timer.recording { color:var(--red); }
.studio-lyrics-display {
  background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius-sm);
  padding:14px;margin-bottom:16px;min-height:70px;font-size:15px;
  color:var(--text2);text-align:center;line-height:1.8;font-style:italic;
}
.studio-tracks-mix { display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px; }
.mix-track {
  background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius-sm);
  padding:10px;display:flex;align-items:center;gap:8px;
}
.mix-track-icon { font-size:20px;flex-shrink:0; }
.mix-track-info { flex:1; }
.mix-track-name { font-size:12px;font-weight:600;margin-bottom:4px; }
.mix-vol { width:100%;height:4px;background:var(--border);border-radius:4px;cursor:pointer;-webkit-appearance:none;appearance:none; }
.mix-vol::-webkit-slider-thumb { -webkit-appearance:none;width:12px;height:12px;border-radius:50%;background:var(--gold);cursor:pointer; }
.duet-list { display:flex;flex-direction:column;gap:10px; }
.duet-item {
  background:var(--card);border:1px solid var(--border);border-radius:var(--radius-sm);
  padding:12px 14px;display:flex;align-items:center;gap:12px;cursor:pointer;transition:all 0.2s;
}
.duet-item:hover { border-color:rgba(155,89,245,.35);background:var(--card2); }
.duet-ava-stack { display:flex;margin-right:4px; }
.duet-ava {
  width:36px;height:36px;border-radius:50%;border:2px solid var(--bg);
  display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#000;
  margin-left:-8px;flex-shrink:0;
}
.duet-ava:first-child { margin-left:0; }
.duet-info { flex:1; }
.duet-title { font-weight:600;font-size:13px;margin-bottom:2px; }
.duet-meta { font-size:11px;color:var(--text2);display:flex;gap:8px; }
.duet-plays { font-family:'Space Mono',monospace;font-size:11px;color:var(--text3);flex-shrink:0; }
.sc-purple::before { background:var(--purple); }

@media(max-width:600px) {
  .karaoke-hero { padding:18px;border-radius:var(--radius); }
  .karaoke-title { font-size:22px; }
  .karaoke-grid { grid-template-columns:1fr;gap:10px; }
  .studio-modal { max-width:100%;padding:16px; }
  .studio-tracks-mix { grid-template-columns:1fr; }
}
@media(max-width:420px) {
  .karaoke-title { font-size:19px; }
  .karaoke-cover { font-size:28px; }
  .studio-timer { font-size:22px; }
  .studio-btn { width:44px;height:44px;font-size:17px; }
}
"""

css += new_css
open('/workspaces/waiichia/apps/web/src/prototype-v7.css', 'w').write(css)
print("OK css fixed")
PYCSS
echo "✅ CSS Karaoké complet (cards, studio, duets, responsive)"

# ═══════════════════════════════════════
# 4. RELANCER
# ═══════════════════════════════════════
echo ""
echo "🚀 Relancement..."
cd /workspaces/waiichia
pnpm --filter api run dev &
sleep 3
pnpm --filter web run dev

echo ""
echo "═══════════════════════════════════════"
echo "  CORRECTIFS APPLIQUÉS !"
echo "  ✅ Upload — Location : jour / semaine / mois / an"
echo "  ✅ Karaoké — Cards avec badge difficulté + meta BPM + boutons Chanter/Duets"
echo "  ✅ Karaoké — Duets avec double avatar empilé + likes + plays"
echo "  ✅ Karaoké — Studio complet : paroles, waveform, timer, contrôles, mix, effets, publication"
echo "═══════════════════════════════════════"
