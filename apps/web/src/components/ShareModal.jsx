// src/components/ShareModal.jsx
// Modal de partage social réutilisable
// Usage : <ShareModal isOpen={open} onClose={() => setOpen(false)} item={track|event|album} type="track|event|album|playlist" />
import { useState } from 'react'

const BASE_URL = 'https://waiichia.com'

// Génère l'URL de partage selon le type
function getShareUrl(item, type) {
  if (!item) return BASE_URL
  switch(type) {
    case 'track':    return `${BASE_URL}/?play=${item.id}`
    case 'album':    return `${BASE_URL}/?album=${item.id}`
    case 'event':    return `${BASE_URL}/?event=${item.id}`
    case 'playlist': return `${BASE_URL}/?playlist=${item.id}`
    case 'profile':  return `${BASE_URL}/?u=${item.username}`
    default:         return BASE_URL
  }
}

function getShareText(item, type) {
  if (!item) return 'Découvrez Waiichia — La plateforme audio africaine'
  switch(type) {
    case 'track':
      return `🎵 Écoute "${item.title}" par ${item.profiles?.display_name || 'un artiste'} sur Waiichia !`
    case 'album':
      return `💿 Découvre l'album "${item.title}" sur Waiichia !`
    case 'event':
      return `🎪 Événement : "${item.title}" — ${item.location || 'Comores'} sur Waiichia !`
    case 'playlist':
      return `🎵 Écoute ma playlist "${item.title}" sur Waiichia !`
    case 'profile':
      return `👤 Découvre ${item.display_name} sur Waiichia — La plateforme audio africaine !`
    default:
      return 'Découvrez Waiichia — La plateforme audio africaine 🎵'
  }
}

export default function ShareModal({ isOpen, onClose, item, type = 'track' }) {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const url  = getShareUrl(item, type)
  const text = getShareText(item, type)
  const encodedUrl  = encodeURIComponent(url)
  const encodedText = encodeURIComponent(text)

  const NETWORKS = [
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      color: '#25D366',
      icon: '💬',
      href: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
    },
    {
      id: 'facebook',
      label: 'Facebook',
      color: '#1877F2',
      icon: '📘',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
    },
    {
      id: 'twitter',
      label: 'X / Twitter',
      color: '#000',
      icon: '🐦',
      href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}&hashtags=Waiichia,MusiqueAfricaine`,
    },
    {
      id: 'telegram',
      label: 'Telegram',
      color: '#0088CC',
      icon: '✈️',
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
    },
    {
      id: 'linkedin',
      label: 'LinkedIn',
      color: '#0A66C2',
      icon: '💼',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
    {
      id: 'email',
      label: 'Email',
      color: '#EA4335',
      icon: '📧',
      href: `mailto:?subject=${encodeURIComponent('Découverte sur Waiichia')}&body=${encodedText}%0A%0A${encodedUrl}`,
    },
  ]

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Fallback pour navigateurs sans clipboard API
      const el = document.createElement('input')
      el.value = url
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  async function nativeShare() {
    if (!navigator.share) return
    try {
      await navigator.share({ title: item?.title || 'Waiichia', text, url })
    } catch {} // L'utilisateur a annulé
  }

  return (
    <div onClick={onClose}
      style={{position:'fixed',inset:0,background:'rgba(0,0,0,.65)',zIndex:500,
        display:'flex',alignItems:'center',justifyContent:'center',
        padding:16,backdropFilter:'blur(4px)'}}>
      <div onClick={e=>e.stopPropagation()}
        style={{background:'var(--bg2)',border:'1px solid var(--border)',
          borderRadius:'var(--radius)',width:'100%',maxWidth:420,
          boxShadow:'0 24px 64px rgba(0,0,0,.5)',overflow:'hidden'}}>

        {/* Header */}
        <div style={{padding:'18px 20px',borderBottom:'1px solid var(--border)',
          display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{fontFamily:'Syne,sans-serif',fontSize:17,fontWeight:800}}>
            🔗 Partager
          </div>
          <div onClick={onClose}
            style={{width:28,height:28,borderRadius:'50%',background:'var(--card)',
              border:'1px solid var(--border)',display:'flex',alignItems:'center',
              justifyContent:'center',cursor:'pointer',fontSize:13}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--red)'}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)'}}>
            ✕
          </div>
        </div>

        <div style={{padding:'16px 20px'}}>
          {/* Aperçu de ce qu'on partage */}
          {item && (
            <div style={{display:'flex',alignItems:'center',gap:12,padding:12,
              background:'var(--card)',borderRadius:'var(--radius-sm)',
              border:'1px solid var(--border)',marginBottom:16}}>
              {item.cover_url
                ? <img src={item.cover_url} alt="" style={{width:44,height:44,borderRadius:8,objectFit:'cover',flexShrink:0}}/>
                : <div style={{width:44,height:44,borderRadius:8,background:'linear-gradient(135deg,var(--gold),#e8920a)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>
                    {type==='track'?'🎵':type==='album'?'💿':type==='event'?'🎪':'🎵'}
                  </div>}
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.title||item.display_name||'—'}</div>
                <div style={{fontSize:11,color:'var(--text3)',marginTop:2}}>
                  {type==='track'?item.profiles?.display_name:type==='event'?item.location:type==='album'?`${item.tracks_count||0} titres`:''}
                </div>
              </div>
            </div>
          )}

          {/* Bouton partage natif (mobile) */}
          {typeof navigator !== 'undefined' && navigator.share && (
            <button onClick={nativeShare}
              style={{width:'100%',padding:'10px',borderRadius:50,border:'none',marginBottom:14,
                background:'linear-gradient(135deg,var(--gold),#e8920a)',color:'#000',
                fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'Plus Jakarta Sans,sans-serif'}}>
              📤 Partager via…
            </button>
          )}

          {/* Réseaux sociaux */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:14}}>
            {NETWORKS.map(n => (
              <a key={n.id} href={n.href} target="_blank" rel="noopener noreferrer"
                style={{display:'flex',flexDirection:'column',alignItems:'center',gap:5,
                  padding:'10px 6px',borderRadius:'var(--radius-sm)',
                  background:'var(--card)',border:'1px solid var(--border)',
                  cursor:'pointer',textDecoration:'none',transition:'all .15s'}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=n.color;e.currentTarget.style.background=n.color+'15'}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.background='var(--card)'}}>
                <span style={{fontSize:22}}>{n.icon}</span>
                <span style={{fontSize:10,color:'var(--text2)',fontWeight:600,textAlign:'center'}}>{n.label}</span>
              </a>
            ))}
          </div>

          {/* Copier le lien */}
          <div style={{display:'flex',gap:8,alignItems:'center',
            background:'var(--card)',border:'1px solid var(--border)',
            borderRadius:50,padding:'4px 4px 4px 14px'}}>
            <span style={{flex:1,fontSize:11,color:'var(--text3)',fontFamily:'Space Mono,monospace',
              overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
              {url}
            </span>
            <button onClick={copyLink}
              style={{padding:'7px 16px',borderRadius:50,border:'none',flexShrink:0,
                background:copied?'var(--green)':'linear-gradient(135deg,var(--gold),#e8920a)',
                color:copied?'#fff':'#000',fontSize:12,fontWeight:700,cursor:'pointer',
                transition:'all .2s',fontFamily:'Plus Jakarta Sans,sans-serif'}}>
              {copied ? '✓ Copié !' : '📋 Copier'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
