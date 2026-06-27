import { useState, useEffect } from 'react'
import api from '../services/api.js'
import { usePrice } from '../hooks/usePrice.js'
import { useAuthStore } from '../stores/index.js'

export default function MerchBanner({ contentId, contentType = 'track' }) {
  const { user } = useAuthStore()
  const { format } = usePrice()
  const [product, setProduct] = useState(null)
  const [buying, setBuying] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState('')
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (!contentId) return
    api.products.list('?content_id=' + contentId + '&limit=1')
      .then(d => {
        const p = (d.products || d || [])[0]
        if (p) setProduct(p)
      })
      .catch(() => {})
  }, [contentId])

  if (!product || !visible) return null

  const buy = async () => {
    if (!user) return setErr('Connectez-vous pour acheter')
    setBuying(true); setErr('')
    try {
      await api.products.buy(product.id)
      setDone(true)
      setTimeout(() => setVisible(false), 3000)
    } catch (e) {
      setErr(e.message || 'Erreur achat')
    }
    setBuying(false)
  }

  if (done) return (
    <div style={{margin:'6px 10px 8px',padding:'8px 12px',background:'rgba(44,198,83,.1)',border:'1px solid rgba(44,198,83,.25)',borderRadius:'var(--radius-sm)',display:'flex',alignItems:'center',gap:8,fontSize:12}}>
      <span>✅</span><span style={{color:'var(--text2)'}}>Acheté ! Merci de soutenir l'artiste.</span>
    </div>
  )

  return (
    <div style={{margin:'6px 10px 8px',padding:'10px 12px',background:'linear-gradient(135deg,rgba(245,166,35,.06),rgba(245,166,35,.02))',border:'1px solid rgba(245,166,35,.2)',borderRadius:'var(--radius-sm)',position:'relative'}}>
      <button onClick={() => setVisible(false)} style={{position:'absolute',top:6,right:8,background:'none',border:'none',color:'var(--text3)',fontSize:14,cursor:'pointer',lineHeight:1}}>✕</button>
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        {product.cover_url
          ? <img src={product.cover_url} alt="" style={{width:40,height:40,borderRadius:6,objectFit:'cover',flexShrink:0}}/>
          : <div style={{width:40,height:40,borderRadius:6,background:'rgba(245,166,35,.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>{product.emoji||'🛍️'}</div>
        }
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:10,color:'var(--gold)',fontWeight:700,textTransform:'uppercase',letterSpacing:.5,marginBottom:2}}>
            {contentType==='track'?'🎵 Soutenez l\'artiste':contentType==='album'?'💿 Merch album':contentType==='podcast'?'🎙️ Soutenez le podcast':'📺 Soutenez l\'émission'}
          </div>
          <div style={{fontSize:13,fontWeight:700,color:'var(--text)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{product.emoji} {product.name}</div>
          {product.description && <div style={{fontSize:11,color:'var(--text2)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{product.description}</div>}
        </div>
        <button
          onClick={buy}
          disabled={buying}
          style={{flexShrink:0,background:'var(--gold)',border:'none',color:'#000',borderRadius:8,padding:'6px 12px',fontSize:12,fontWeight:800,cursor:buying?'not-allowed':'pointer',opacity:buying?.7:1,whiteSpace:'nowrap'}}
        >
          {buying ? '⏳' : `🛒 ${format(product.price)}`}
        </button>
      </div>
      {err && <div style={{fontSize:11,color:'var(--red)',marginTop:6}}>{err}</div>}
    </div>
  )
}
