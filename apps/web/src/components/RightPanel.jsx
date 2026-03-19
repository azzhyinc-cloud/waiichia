import { usePageStore, useAuthStore } from '../stores/index.js'

const TAGS = ['#twarab','#komori','#waiichia','#amapiano','#afrobeats','#moroni','#sebene']

export default function RightPanel() {
  const { setPage } = usePageStore()
  const { user } = useAuthStore()
  return (
    <aside className="right-panel">
      {/* PUB 1 */}
      <div className="ad-card">
        <div className="ad-label">Sponsorisé · 🇰🇲 Comores</div>
        <div className="ad-body" style={{background:'linear-gradient(135deg,#0a1800,#1a3a00)',height:110}}>
          <span style={{fontSize:28}}>🏦</span>
          <div style={{fontWeight:700,fontSize:13}}>Huri Money</div>
          <div style={{fontSize:11,color:'var(--text2)'}}>Paiements simples aux Comores</div>
          <button className="ad-cta" style={{background:'var(--gold)',color:'#000'}}>#126#</button>
        </div>
      </div>

      {/* MON COMPTE */}
      <div className="account-card">
        <div className="rp-section-title">Mon Compte</div>
        <div style={{display:'flex',flexDirection:'column',gap:7,fontSize:12}}>
          <div style={{display:'flex',justifyContent:'space-between'}}>
            <span style={{color:'var(--text2)'}}>Écoutes ce mois</span>
            <span style={{color:'var(--green)',fontFamily:'Space Mono,monospace'}}>+8.4K</span>
          </div>
          <div style={{display:'flex',justifyContent:'space-between'}}>
            <span style={{color:'var(--text2)'}}>Revenus</span>
            <span style={{color:'var(--gold)',fontFamily:'Space Mono,monospace'}}>74 850 KMF</span>
          </div>
          <div style={{display:'flex',justifyContent:'space-between'}}>
            <span style={{color:'var(--text2)'}}>Nouveaux fans</span>
            <span style={{color:'var(--blue)',fontFamily:'Space Mono,monospace'}}>+124</span>
          </div>
        </div>
        <button className="btn btn-secondary btn-sm" style={{width:'100%',marginTop:10}} onClick={()=>setPage('dashboard')}>Dashboard →</button>
      </div>

      {/* PUB 2 */}
      <div className="ad-card">
        <div className="ad-label">Promotion · Artiste</div>
        <div className="ad-body" style={{background:'linear-gradient(135deg,#1a0a00,#3d2000)',height:110}}>
          <span style={{fontSize:28}}>🎙️</span>
          <div style={{fontWeight:700,fontSize:13}}>Studio Waiichia</div>
          <div style={{fontSize:11,color:'var(--text2)'}}>Enregistrez à Moroni</div>
          <button className="ad-cta" style={{background:'var(--red)',color:'#fff'}}>Réserver</button>
        </div>
      </div>

      {/* TAGS TENDANCES */}
      <div>
        <div className="rp-section-title">Tendances Tags</div>
        <div className="tags-wrap">
          {TAGS.map(tag => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>
      </div>
    </aside>
  )
}
