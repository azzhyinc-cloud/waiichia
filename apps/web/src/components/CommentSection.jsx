import { useState, useEffect, useRef } from "react"
import { useAuthStore } from "../stores/index.js"
import api from "../services/api.js"

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg,#f5a623,#e63946)",
  "linear-gradient(135deg,#9b59f5,#6c3483)",
  "linear-gradient(135deg,#2dc653,#00bfa5)",
  "linear-gradient(135deg,#1e88e5,#6c3483)",
  "linear-gradient(135deg,#ff6b35,#f5a623)",
  "linear-gradient(135deg,#00bfa5,#1e88e5)",
  "linear-gradient(135deg,#e63946,#9b59f5)",
  "linear-gradient(135deg,#f5a623,#2dc653)",
]
function gradientFor(seed) {
  if (!seed) return AVATAR_GRADIENTS[0]
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length]
}
function timeAgo(ts) {
  const s = Math.floor((Date.now() - new Date(ts)) / 1000)
  if (s < 60) return "à l'instant"
  if (s < 3600) return Math.floor(s/60) + 'min'
  if (s < 86400) return Math.floor(s/3600) + 'h'
  if (s < 604800) return Math.floor(s/86400) + 'j'
  return Math.floor(s/604800) + 'sem'
}

function Avatar({ profile, size = 32 }) {
  if (profile?.avatar_url) return (
    <img src={profile.avatar_url} alt="" style={{width:size,height:size,borderRadius:'50%',objectFit:'cover',flexShrink:0}} />
  )
  const initials = (profile?.display_name || profile?.username || '?')[0].toUpperCase()
  return (
    <div style={{width:size,height:size,borderRadius:'50%',background:gradientFor(profile?.id||profile?.username),display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*0.4,fontWeight:700,color:'#fff',flexShrink:0}}>
      {initials}
    </div>
  )
}

function CommentInput({ onSubmit, placeholder = "Votre commentaire…", autoFocus = false, compact = false }) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const ref = useRef()

  useEffect(() => { if (autoFocus && ref.current) ref.current.focus() }, [autoFocus])

  const submit = async () => {
    if (!text.trim() || loading) return
    setLoading(true)
    try { await onSubmit(text.trim()); setText('') }
    catch(e) {}
    finally { setLoading(false) }
  }

  return (
    <div style={{display:'flex',gap:8,alignItems:'flex-end'}}>
      <textarea
        ref={ref}
        value={text}
        onChange={e=>setText(e.target.value)}
        onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();submit()} }}
        placeholder={placeholder}
        rows={compact?1:2}
        style={{flex:1,resize:'none',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',padding:'8px 12px',fontSize:13,color:'var(--text)',fontFamily:'inherit',outline:'none',lineHeight:1.5}}
      />
      <button
        onClick={submit}
        disabled={!text.trim()||loading}
        style={{padding:'8px 14px',background:text.trim()?'var(--gold)':'var(--bg2)',color:text.trim()?'#000':'var(--text3)',border:'none',borderRadius:'var(--radius-sm)',fontSize:13,fontWeight:700,cursor:text.trim()?'pointer':'default',transition:'all .2s',flexShrink:0}}
      >
        {loading ? '…' : '↑'}
      </button>
    </div>
  )
}

function CommentItem({ comment, targetType, targetId, user, onDelete }) {
  const [showReplies, setShowReplies] = useState(false)
  const [replies, setReplies] = useState([])
  const [loadingReplies, setLoadingReplies] = useState(false)
  const [replying, setReplying] = useState(false)
  const isOwn = user?.id === comment.profiles?.id

  const loadReplies = async () => {
    if (showReplies) { setShowReplies(false); return }
    setLoadingReplies(true)
    try {
      const d = await api.get('/api/social/comments/' + comment.id + '/replies')
      setReplies(d.replies || [])
      setShowReplies(true)
    } catch(e) {}
    finally { setLoadingReplies(false) }
  }

  const submitReply = async (text) => {
    const d = await api.social.comment({ target_type: targetType, target_id: targetId, content: text, parent_id: comment.id })
    setReplies(r => [d.comment, ...r])
    setShowReplies(true)
    setReplying(false)
  }

  const handleDelete = async () => {
    try { await api.delete('/api/social/comment/' + comment.id); onDelete(comment.id) }
    catch(e) {}
  }

  return (
    <div style={{display:'flex',gap:10,marginBottom:16}}>
      <Avatar profile={comment.profiles} size={34} />
      <div style={{flex:1,minWidth:0}}>
        <div style={{background:'var(--bg2)',borderRadius:'var(--radius-sm)',padding:'10px 12px',marginBottom:4}}>
          <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
            <span style={{fontWeight:700,fontSize:13,color:'var(--text)'}}>{comment.profiles?.display_name||comment.profiles?.username||'Utilisateur'}</span>
            {comment.profiles?.is_verified && <span style={{fontSize:11,color:'var(--gold)'}}>✓</span>}
            <span style={{fontSize:11,color:'var(--text3)',marginLeft:'auto'}}>{timeAgo(comment.created_at)}</span>
            {isOwn && <button onClick={handleDelete} style={{background:'none',border:'none',color:'var(--text3)',fontSize:12,cursor:'pointer',padding:'0 2px'}} title="Supprimer">🗑</button>}
          </div>
          <div style={{fontSize:13,color:'var(--text)',lineHeight:1.5,wordBreak:'break-word'}}>{comment.content}</div>
        </div>
        <div style={{display:'flex',gap:12,paddingLeft:4}}>
          {user && <button onClick={()=>setReplying(r=>!r)} style={{background:'none',border:'none',fontSize:12,color:'var(--text3)',cursor:'pointer',padding:0}}>↩ Répondre</button>}
          <button onClick={loadReplies} style={{background:'none',border:'none',fontSize:12,color:'var(--text3)',cursor:'pointer',padding:0}}>
            {loadingReplies ? '…' : showReplies ? '▲ Masquer' : '▼ Réponses'}
          </button>
        </div>
        {replying && user && (
          <div style={{marginTop:8}}>
            <CommentInput onSubmit={submitReply} placeholder={'Répondre à ' + (comment.profiles?.username||'…')} autoFocus compact />
          </div>
        )}
        {showReplies && replies.length > 0 && (
          <div style={{marginTop:8,paddingLeft:8,borderLeft:'2px solid var(--border)'}}>
            {replies.map(r => (
              <div key={r.id} style={{display:'flex',gap:8,marginBottom:10}}>
                <Avatar profile={r.profiles} size={26} />
                <div style={{flex:1,background:'var(--bg2)',borderRadius:'var(--radius-sm)',padding:'8px 10px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:2}}>
                    <span style={{fontWeight:700,fontSize:12}}>{r.profiles?.display_name||r.profiles?.username||'Utilisateur'}</span>
                    <span style={{fontSize:11,color:'var(--text3)',marginLeft:'auto'}}>{timeAgo(r.created_at)}</span>
                    {user?.id===r.profiles?.id && <button onClick={async()=>{try{await api.delete('/api/social/comment/'+r.id);setReplies(rs=>rs.filter(x=>x.id!==r.id))}catch(e){}}} style={{background:'none',border:'none',color:'var(--text3)',fontSize:11,cursor:'pointer',padding:0}}>🗑</button>}
                  </div>
                  <div style={{fontSize:12,color:'var(--text)',lineHeight:1.5}}>{r.content}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function CommentSection({ targetType, targetId }) {
  const { user } = useAuthStore()
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const load = async (p = 1) => {
    setLoading(true)
    try {
      const d = await api.social.comments(targetType, targetId + '?page=' + p + '&limit=10')
      const list = d.comments || []
      setComments(prev => p === 1 ? list : [...prev, ...list])
      setHasMore(list.length === 10)
      setPage(p)
    } catch(e) {}
    finally { setLoading(false) }
  }

  useEffect(() => { if (open && comments.length === 0) load(1) }, [open, targetId])

  const submitComment = async (text) => {
    if (!user) return
    const d = await api.social.comment({ target_type: targetType, target_id: targetId, content: text })
    setComments(c => [d.comment, ...c])
  }

  const handleDelete = (id) => setComments(c => c.filter(x => x.id !== id))

  return (
    <div style={{borderTop:'1px solid var(--border)',marginTop:12}}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{width:'100%',background:'none',border:'none',padding:'10px 0',display:'flex',alignItems:'center',gap:8,cursor:'pointer',color:'var(--text2)',fontSize:13}}
      >
        <span>💬</span>
        <span>{open ? 'Masquer les commentaires' : 'Commentaires'}</span>
        {comments.length > 0 && <span style={{fontSize:11,color:'var(--text3)'}}>({comments.length})</span>}
        <span style={{marginLeft:'auto',fontSize:11}}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{paddingBottom:12}}>
          {user ? (
            <div style={{display:'flex',gap:10,marginBottom:16}}>
              <Avatar profile={user} size={34} />
              <div style={{flex:1}}>
                <CommentInput onSubmit={submitComment} placeholder="Votre commentaire…" />
              </div>
            </div>
          ) : (
            <div style={{fontSize:13,color:'var(--text3)',padding:'8px 0 16px',textAlign:'center'}}>Connectez-vous pour commenter</div>
          )}

          {loading && comments.length === 0
            ? <div style={{textAlign:'center',padding:20,color:'var(--text3)',fontSize:13}}>Chargement…</div>
            : comments.length === 0
              ? <div style={{textAlign:'center',padding:20,color:'var(--text3)',fontSize:13}}>Aucun commentaire — soyez le premier ! 🎵</div>
              : comments.map(c => <CommentItem key={c.id} comment={c} targetType={targetType} targetId={targetId} user={user} onDelete={handleDelete} />)
          }

          {hasMore && comments.length > 0 && (
            <button onClick={()=>load(page+1)} disabled={loading} style={{width:'100%',padding:'8px',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',fontSize:12,color:'var(--text2)',cursor:'pointer'}}>
              {loading ? 'Chargement…' : 'Voir plus'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
