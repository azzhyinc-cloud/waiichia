import { usePageStore } from '../stores/index.js'

const TAGS = ['#twarab','#komori','#afrobeats','#amapiano','#slam','#sebene','#podcast','#mindset','#lagos','#moroni']

export default function RightPanel() {
  const { setPage } = usePageStore()
  return (
    <aside className="right-panel">
      {/* AD */}
      <div className="ad-card">
        <div className="ad-label">Publicité</div>
        <div className="ad-body" style={{background:'linear-gradient(135deg,#0a1a0e,#1a3a20)'}}>
          <div style={{fontSize:28}}>🌍</div>
          <div style={{fontSize:12,fontWeight:700}}>Boostez vos sons</div>
          <button className="btn btn-primary btn-xs" style={{marginTop:4}}>En savoir +</button>
        </div>
      </div>

      {/* MON COMPTE */}
      <div className="account-card">
        <div className="rp-section-title">👤 Mon Compte</div>
        <div style={{display:'flex',flexDirection:'column',gap:6}}>
          {[
            {icon:'⬆️',label:'Publier un son',page:'upload'},
            {icon:'💰',label:'Mon portefeuille',page:'wallet'},
            {icon:'📚',label:'Mon contenu',page:'profile'},
            {icon:'📊',label:'Statistiques',page:'profile'},
          ].map(({icon,label,page}) => (
            <button key={label} onClick={() => setPage(page)}
              style={{display:'flex',alignItems:'center',gap:10,padding:'9px 12px',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:10,cursor:'pointer',color:'var(--text2)',fontSize:12.5,fontWeight:500,textAlign:'left',width:'100%',transition:'all .18s'}}
              onMouseEnter={e=>{e.target.style.borderColor='var(--gold)';e.target.style.color='var(--gold)'}}
              onMouseLeave={e=>{e.target.style.borderColor='var(--border)';e.target.style.color='var(--text2)'}}>
              <span>{icon}</span>{label}
            </button>
          ))}
        </div>
      </div>

      {/* TRENDING TAGS */}
      <div>
        <div className="rp-section-title">🔥 Tendances Tags</div>
        <div className="trend-tags">
          {TAGS.map(tag => (
            <span key={tag} className="trend-tag">{tag}</span>
          ))}
        </div>
      </div>
    </aside>
  )
}
